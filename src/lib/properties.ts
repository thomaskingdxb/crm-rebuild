import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase as defaultClient } from '@/lib/supabase/client';
import type { PropertyWithRelations, Lookup } from '@/types/database';
import { generateNextTaskId } from '@/lib/tasks';

const PROPERTY_SELECT = `*,
  property_property_types ( property_types ( id, name, display_order ) ),
  property_property_statuses ( property_statuses ( id, name, display_order ) ),
  property_areas ( areas ( id, name, display_order ) ),
  property_bedroom_counts ( bedroom_counts ( id, name, display_order ) ),
  property_bathroom_counts ( bathroom_counts ( id, name, display_order ) ),
  property_developers ( developers ( id, name, display_order ) ),
  property_view_types ( view_types ( id, name, display_order ) ),
  listing_statuses ( id, name, display_order ),
  clients ( id, name )`;

export async function getPropertiesBasic(
  db: SupabaseClient = defaultClient
): Promise<{ id: string; building: string | null; unit_number: string | null }[]> {
  const { data, error } = await db.from('properties').select('id, building, unit_number').order('id');
  if (error) throw error;
  return data;
}

function naturalCompare(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

function sortProperties(properties: PropertyWithRelations[]): PropertyWithRelations[] {
  return [...properties].sort((a, b) => {
    const buildingCompare = naturalCompare(a.building ?? '', b.building ?? '');
    if (buildingCompare !== 0) return buildingCompare;

    const bedOrderA = a.property_bedroom_counts[0]?.bedroom_counts.display_order ?? 999;
    const bedOrderB = b.property_bedroom_counts[0]?.bedroom_counts.display_order ?? 999;
    if (bedOrderA !== bedOrderB) return bedOrderA - bedOrderB;

    return naturalCompare(a.unit_number ?? '', b.unit_number ?? '');
  });
}

export async function getProperties(db: SupabaseClient = defaultClient): Promise<PropertyWithRelations[]> {
  const { data, error } = await db.from('properties').select(PROPERTY_SELECT);
  if (error) throw error;
  return sortProperties(data as unknown as PropertyWithRelations[]);
}

export async function getProperty(id: string, db: SupabaseClient = defaultClient): Promise<PropertyWithRelations | null> {
  const { data, error } = await db.from('properties').select(PROPERTY_SELECT).eq('id', id).single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as unknown as PropertyWithRelations;
}

export async function getClientProperties(clientId: string, db: SupabaseClient = defaultClient): Promise<PropertyWithRelations[]> {
  const { data, error } = await db
    .from('properties')
    .select(PROPERTY_SELECT)
    .eq('owner_id', clientId)
    .order('id');

  if (error) throw error;
  return data as unknown as PropertyWithRelations[];
}

export async function getPropertyLookups(db: SupabaseClient = defaultClient) {
  const [types, statuses, areas, bedrooms, bathrooms, developers, views, listingStatuses] = await Promise.all([
    db.from('property_types').select('*').order('display_order'),
    db.from('property_statuses').select('*').order('display_order'),
    db.from('areas').select('*').order('display_order'),
    db.from('bedroom_counts').select('*').order('display_order'),
    db.from('bathroom_counts').select('*').order('display_order'),
    db.from('developers').select('*').order('display_order'),
    db.from('view_types').select('*').order('display_order'),
    db.from('listing_statuses').select('*').order('display_order'),
  ]);

  for (const r of [types, statuses, areas, bedrooms, bathrooms, developers, views, listingStatuses]) {
    if (r.error) throw r.error;
  }

  return {
    propertyTypes: types.data as Lookup[],
    propertyStatuses: statuses.data as Lookup[],
    areas: areas.data as Lookup[],
    bedroomCounts: bedrooms.data as Lookup[],
    bathroomCounts: bathrooms.data as Lookup[],
    developers: developers.data as Lookup[],
    viewTypes: views.data as Lookup[],
    listingStatuses: listingStatuses.data as Lookup[],
  };
}

export interface ListingUpdateDue {
  property_id: string;
  building: string | null;
  unit_number: string | null;
  listing_status: string;
  owner_id: string | null;
  owner_name: string | null;
  last_update_sent_date: string | null;
  listing_update_task_id: string | null;
  days_since_update: number | null; // null = never sent
}

const MARKET_UPDATE_TASK_TYPE_ID = 11;

// Safety net: markListingUpdateSentAction() is now responsible for
// proactively creating the next cycle's task the moment an update is marked
// sent (deadline = today + 7 days), so a live task should normally already
// exist. This function's remaining job is to catch properties that have NO
// task yet - e.g. a property that just became actively marketed, or any edge
// case where the listing_update_task_id pointer broke - and give them one
// (deadline = today, since there's no last_update_sent_date to compute a
// future date from).
export async function getListingUpdatesDue(db: SupabaseClient = defaultClient): Promise<ListingUpdateDue[]> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10);

  // "Actively marketed" = owner is owed a recurring update. Resolved by name
  // rather than hardcoded IDs so re-seeding the lookup table can't silently
  // break this.
  const { data: activeStatuses, error: statusErr } = await db
    .from('listing_statuses')
    .select('id')
    .in('name', ['Property Listed', 'Exclusive']);
  if (statusErr) throw statusErr;
  const activeStatusIds = (activeStatuses ?? []).map((s) => s.id);
  if (activeStatusIds.length === 0) return [];

  const { data, error } = await db
    .from('properties')
    .select('id, building, unit_number, last_update_sent_date, owner_id, listing_update_task_id, listing_statuses ( name ), clients ( name )')
    .in('listing_status_id', activeStatusIds)
    .or(`last_update_sent_date.is.null,last_update_sent_date.lte.${sevenDaysAgo}`);
  if (error) throw error;

  const today = Date.now();
  const due = (data ?? []).map((p) => ({
    property_id: p.id,
    building: p.building,
    unit_number: p.unit_number,
    listing_status: (p.listing_statuses as unknown as { name: string }).name,
    owner_id: p.owner_id,
    owner_name: (p.clients as unknown as { name: string } | null)?.name ?? null,
    last_update_sent_date: p.last_update_sent_date,
    listing_update_task_id: p.listing_update_task_id as string | null,
    days_since_update: p.last_update_sent_date
      ? Math.floor((today - new Date(p.last_update_sent_date).getTime()) / 86_400_000)
      : null,
  }));

  for (const p of due) {
    if (p.listing_update_task_id) continue;

    const deadlineDate = p.last_update_sent_date
      ? new Date(new Date(p.last_update_sent_date).getTime() + 7 * 86_400_000).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);

    const taskId = await generateNextTaskId(db);
    const { error: taskError } = await db.from('tasks').insert({
      id: taskId,
      client_id: p.owner_id,
      task_info: `Send weekly listing update - ${p.building ?? ''} ${p.unit_number ?? ''}`.trim(),
      deadline_date: deadlineDate,
    });
    if (taskError) throw taskError;

    const { error: typeError } = await db
      .from('task_task_types')
      .insert({ task_id: taskId, task_type_id: MARKET_UPDATE_TASK_TYPE_ID });
    if (typeError) throw typeError;

    const { error: updateError } = await db
      .from('properties')
      .update({ listing_update_task_id: taskId })
      .eq('id', p.property_id);
    if (updateError) throw updateError;

    p.listing_update_task_id = taskId;
  }

  return due.sort((a, b) => (b.days_since_update ?? 999) - (a.days_since_update ?? 999));
}

export async function generateNextPropertyId(db: SupabaseClient = defaultClient): Promise<string> {
  const { data, error } = await db.from('properties').select('id');
  if (error) throw error;

  let max = 0;
  for (const row of data ?? []) {
    const n = parseInt((row.id as string).replace('P', ''), 10);
    if (!isNaN(n) && n > max) max = n;
  }
  return `P${String(max + 1).padStart(3, '0')}`;
}
