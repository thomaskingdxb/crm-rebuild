import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase as defaultClient } from '@/lib/supabase/client';
import type { PropertyWithRelations, Lookup } from '@/types/database';

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
