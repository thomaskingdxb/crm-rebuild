'use server';

import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { generateNextPropertyId } from '@/lib/properties';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

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
    rented_until: (formData.get('rented_until') as string) || null,
    completion_date: (formData.get('completion_date') as string) || null,
    rental_income: num(formData.get('rental_income')),
    asking_price: num(formData.get('asking_price')),
    op: num(formData.get('op')),
    notes: (formData.get('notes') as string) || null,
  };
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

  revalidatePath('/properties');
  redirect(`/properties/${id}`);
}

export async function updatePropertyAction(id: string, formData: FormData) {
  const supabase = await createClient();
  const fields = readPropertyForm(formData);
  const sel = readMultiSelectIds(formData);

  const { error } = await supabase.from('properties').update(fields).eq('id', id);
  if (error) throw error;

  await syncMultiSelect(supabase, 'property_property_types', 'property_id', 'property_type_id', id, sel.typeIds);
  await syncMultiSelect(supabase, 'property_property_statuses', 'property_id', 'property_status_id', id, sel.statusIds);
  await syncMultiSelect(supabase, 'property_areas', 'property_id', 'area_id', id, sel.areaIds);
  await syncMultiSelect(supabase, 'property_bedroom_counts', 'property_id', 'bedroom_count_id', id, sel.bedroomIds);
  await syncMultiSelect(supabase, 'property_bathroom_counts', 'property_id', 'bathroom_count_id', id, sel.bathroomIds);
  await syncMultiSelect(supabase, 'property_developers', 'property_id', 'developer_id', id, sel.developerIds);
  await syncMultiSelect(supabase, 'property_view_types', 'property_id', 'view_type_id', id, sel.viewIds);

  revalidatePath(`/properties/${id}`);
  revalidatePath('/properties');
  redirect(`/properties/${id}`);
}

export async function deletePropertyAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('properties').delete().eq('id', id);
  if (error) throw error;

  revalidatePath('/properties');
  redirect('/properties');
}
