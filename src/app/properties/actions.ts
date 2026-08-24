'use server';

import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { generateNextPropertyId } from '@/lib/properties';
import { generateNextTaskId } from '@/lib/tasks';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const MARKET_UPDATE_TASK_TYPE_ID = 11;

function num(v: FormDataEntryValue | null): number | null {
  if (!v) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

async function syncMultiSelect(supabase: SupabaseClient, table: string, idColumn: string, lookupColumn: string, entityId: string, ids: number[]) {
  const { error: delErr } = await supabase.from(table).delete().eq(idColumn, entityId);
  if (delErr) throw delErr;
  if (ids.length > 0) {
    const { error } = await supabase.from(table).insert(ids.map((id) => ({ [idColumn]: entityId, [lookupColumn]: id })));
    if (error) throw error;
  }
}

function readPropertyForm(formData: FormData) {
  return {
    owner_id: (formData.get('owner_id') as string) || null,
    building: (formData.get('building') as string) || null,
    unit_number: (formData.get('unit_number') as string) || null,
    sqft: num(formData.get('sqft')),
    service_charge: num(formData.get('service_charge')),
    floor: (formData.get('floor') as string) || null,
    layout: (formData.get('layout') as string) || null,
    rented_until: (formData.get('rented_until') as string) || null,
    completion_date: (formData.get('completion_date') as string) || null,
    rental_income: num(formData.get('rental_income')),
    asking_price: num(formData.get('asking_price')),
    op: num(formData.get('op')),
    notes: (formData.get('notes') as string) || null,
    listing_status_id: num(formData.get('listing_status_id')),
  };
}

async function getActiveListingStatusIds(supabase: SupabaseClient): Promise<number[]> {
  const { data, error } = await supabase
    .from('listing_statuses')
    .select('id')
    .in('name', ['Property Listed', 'Exclusive']);
  if (error) throw error;
  return (data ?? []).map((s) => s.id as number);
}

async function createListingUpdateTask(
  supabase: SupabaseClient,
  propertyId: string,
  ownerId: string | null,
  building: string | null,
  unitNumber: string | null
): Promise<string> {
  const today = new Date().toISOString().slice(0, 10);
  const taskId = await generateNextTaskId(supabase);
  const { error: taskError } = await supabase.from('tasks').insert({
    id: taskId,
    client_id: ownerId,
    task_info: `Send weekly listing update - ${building ?? ''} ${unitNumber ?? ''}`.trim(),
    deadline_date: today,
  });
  if (taskError) throw taskError;

  const { error: typeError } = await supabase
    .from('task_task_types')
    .insert({ task_id: taskId, task_type_id: MARKET_UPDATE_TASK_TYPE_ID });
  if (typeError) throw typeError;

  const { error: updateError } = await supabase
    .from('properties')
    .update({ listing_update_task_id: taskId })
    .eq('id', propertyId);
  if (updateError) throw updateError;

  return taskId;
}

function readMultiSelectIds(formData: FormData) {
  return {
    typeIds: formData.getAll('property_type_ids').map(Number),
    statusIds: formData.getAll('property_status_ids').map(Number),
    areaIds: formData.getAll('area_ids').map(Number),
    bedroomIds: formData.getAll('bedroom_ids').map(Number),
    bathroomIds: formData.getAll('bathroom_ids').map(Number),
    developerIds: formData.getAll('developer_ids').map(Number),
    viewIds: formData.getAll('view_ids').map(Number),
  };
}

export async function createPropertyAction(formData: FormData) {
  const supabase = await createClient();
  const id = await generateNextPropertyId(supabase);
  const fields = readPropertyForm(formData);
  const sel = readMultiSelectIds(formData);

  const { error } = await supabase.from('properties').insert({ id, ...fields });
  if (error) throw error;

  await syncMultiSelect(supabase, 'property_property_types', 'property_id', 'property_type_id', id, sel.typeIds);
  await syncMultiSelect(supabase, 'property_property_statuses', 'property_id', 'property_status_id', id, sel.statusIds);
  await syncMultiSelect(supabase, 'property_areas', 'property_id', 'area_id', id, sel.areaIds);
  await syncMultiSelect(supabase, 'property_bedroom_counts', 'property_id', 'bedroom_count_id', id, sel.bedroomIds);
  await syncMultiSelect(supabase, 'property_bathroom_counts', 'property_id', 'bathroom_count_id', id, sel.bathroomIds);
  await syncMultiSelect(supabase, 'property_developers', 'property_id', 'developer_id', id, sel.developerIds);
  await syncMultiSelect(supabase, 'property_view_types', 'property_id', 'view_type_id', id, sel.viewIds);

  if (fields.listing_status_id != null) {
    const activeIds = await getActiveListingStatusIds(supabase);
    if (activeIds.includes(fields.listing_status_id)) {
      await createListingUpdateTask(supabase, id, fields.owner_id, fields.building, fields.unit_number);
    }
  }

  revalidatePath('/properties');
  redirect(`/properties/${id}`);
}

export async function updatePropertyAction(id: string, formData: FormData) {
  const supabase = await createClient();
  const fields = readPropertyForm(formData);
  const sel = readMultiSelectIds(formData);

  const { data: existing, error: existingError } = await supabase
    .from('properties')
    .select('listing_status_id, listing_update_task_id')
    .eq('id', id)
    .single();
  if (existingError) throw existingError;

  const { error } = await supabase.from('properties').update(fields).eq('id', id);
  if (error) throw error;

  await syncMultiSelect(supabase, 'property_property_types', 'property_id', 'property_type_id', id, sel.typeIds);
  await syncMultiSelect(supabase, 'property_property_statuses', 'property_id', 'property_status_id', id, sel.statusIds);
  await syncMultiSelect(supabase, 'property_areas', 'property_id', 'area_id', id, sel.areaIds);
  await syncMultiSelect(supabase, 'property_bedroom_counts', 'property_id', 'bedroom_count_id', id, sel.bedroomIds);
  await syncMultiSelect(supabase, 'property_bathroom_counts', 'property_id', 'bathroom_count_id', id, sel.bathroomIds);
  await syncMultiSelect(supabase, 'property_developers', 'property_id', 'developer_id', id, sel.developerIds);
  await syncMultiSelect(supabase, 'property_view_types', 'property_id', 'view_type_id', id, sel.viewIds);

  const activeIds = await getActiveListingStatusIds(supabase);
  const wasActive = existing?.listing_status_id != null && activeIds.includes(existing.listing_status_id);
  const isActive = fields.listing_status_id != null && activeIds.includes(fields.listing_status_id);

  if (isActive && !existing?.listing_update_task_id) {
    // Became active (or was active but somehow lost its task pointer) - start the cycle.
    await createListingUpdateTask(supabase, id, fields.owner_id, fields.building, fields.unit_number);
  } else if (!isActive && wasActive && existing?.listing_update_task_id) {
    // No longer actively listed - stop the recurrence.
    const { error: delTaskError } = await supabase.from('tasks').delete().eq('id', existing.listing_update_task_id);
    if (delTaskError) throw delTaskError;
    const { error: clearError } = await supabase
      .from('properties')
      .update({ listing_update_task_id: null })
      .eq('id', id);
    if (clearError) throw clearError;
  }

  revalidatePath(`/properties/${id}`);
  revalidatePath('/properties');
  redirect(`/properties/${id}`);
}

// Marking an update sent immediately creates the NEXT cycle's task (deadline
// = today + 7 days) rather than clearing the pointer and waiting for
// getListingUpdatesDue() to notice 7+ days later - that old flow meant the
// next task was born already overdue with zero advance warning. This keeps
// properties.listing_update_task_id always pointing at a live, future task.
export async function markListingUpdateSentAction(propertyId: string, ownerId: string | null) {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: property, error: fetchError } = await supabase
    .from('properties')
    .select('listing_update_task_id, building, unit_number, listing_status_id')
    .eq('id', propertyId)
    .single();
  if (fetchError) throw fetchError;

  if (property?.listing_update_task_id) {
    const { error: taskError } = await supabase.from('tasks').delete().eq('id', property.listing_update_task_id);
    if (taskError) throw taskError;
  }

  const activeIds = await getActiveListingStatusIds(supabase);
  const isActive = property?.listing_status_id != null && activeIds.includes(property.listing_status_id);

  let nextTaskId: string | null = null;
  if (isActive) {
    const nextDeadline = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);
    nextTaskId = await generateNextTaskId(supabase);
    const { error: nextTaskError } = await supabase.from('tasks').insert({
      id: nextTaskId,
      client_id: ownerId,
      task_info: `Send weekly listing update - ${property?.building ?? ''} ${property?.unit_number ?? ''}`.trim(),
      deadline_date: nextDeadline,
    });
    if (nextTaskError) throw nextTaskError;

    const { error: typeError } = await supabase
      .from('task_task_types')
      .insert({ task_id: nextTaskId, task_type_id: MARKET_UPDATE_TASK_TYPE_ID });
    if (typeError) throw typeError;
  }

  const { error } = await supabase
    .from('properties')
    .update({ last_update_sent_date: today, listing_update_task_id: nextTaskId })
    .eq('id', propertyId);
  if (error) throw error;

  if (ownerId) {
    const { error: clientErr } = await supabase.from('clients').update({ last_contact_date: today }).eq('id', ownerId);
    if (clientErr) throw clientErr;
  }

  revalidatePath('/coaching');
  revalidatePath('/tasks');
  revalidatePath('/properties');
  revalidatePath(`/properties/${propertyId}`);
}

export async function deletePropertyAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('properties').delete().eq('id', id);
  if (error) throw error;

  revalidatePath('/properties');
  redirect('/properties');
}
