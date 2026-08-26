'use server';

import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { generateNextEnquiryId } from '@/lib/enquiries';
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

function readEnquiryForm(formData: FormData) {
  return {
    client_id: (formData.get('client_id') as string) || null,
    property_id: (formData.get('property_id') as string) || null,
    building: (formData.get('building') as string) || null,
    sqft: num(formData.get('sqft')),
    floor: (formData.get('floor') as string) || null,
    completion_date: (formData.get('completion_date') as string) || null,
    budget: num(formData.get('budget')),
    enquiry_date: (formData.get('enquiry_date') as string) || null,
    notes: (formData.get('notes') as string) || null,
  };
}

function readMultiSelectIds(formData: FormData) {
  return {
    enquiryTypeIds: formData.getAll('enquiry_type_ids').map(Number),
    propertyTypeIds: formData.getAll('property_type_ids').map(Number),
    areaIds: formData.getAll('area_ids').map(Number),
    bedroomIds: formData.getAll('bedroom_ids').map(Number),
    bathroomIds: formData.getAll('bathroom_ids').map(Number),
    // Lead stage is a single current stage, not a true multi-select (a lead
    // progresses through the pipeline, it doesn't hold several stages at
    // once) - wrap the single selected id into a 0-or-1-element array so it
    // can still go through the same delete-then-insert sync as everything
    // else below, without a special-cased sync path.
    leadStageIds: (() => {
      const v = num(formData.get('lead_stage_id'));
      return v != null ? [v] : [];
    })(),
    viewIds: formData.getAll('view_ids').map(Number),
    developerIds: formData.getAll('developer_ids').map(Number),
    propertyStatusIds: formData.getAll('property_status_ids').map(Number),
  };
}

async function syncAllEnquiryLinks(supabase: SupabaseClient, id: string, sel: ReturnType<typeof readMultiSelectIds>) {
  await syncMultiSelect(supabase, 'enquiry_enquiry_types', 'enquiry_id', 'enquiry_type_id', id, sel.enquiryTypeIds);
  await syncMultiSelect(supabase, 'enquiry_property_types', 'enquiry_id', 'property_type_id', id, sel.propertyTypeIds);
  await syncMultiSelect(supabase, 'enquiry_areas', 'enquiry_id', 'area_id', id, sel.areaIds);
  await syncMultiSelect(supabase, 'enquiry_bedroom_counts', 'enquiry_id', 'bedroom_count_id', id, sel.bedroomIds);
  await syncMultiSelect(supabase, 'enquiry_bathroom_counts', 'enquiry_id', 'bathroom_count_id', id, sel.bathroomIds);
  await syncMultiSelect(supabase, 'enquiry_lead_stages', 'enquiry_id', 'lead_stage_id', id, sel.leadStageIds);
  await syncMultiSelect(supabase, 'enquiry_view_types', 'enquiry_id', 'view_type_id', id, sel.viewIds);
  await syncMultiSelect(supabase, 'enquiry_developers', 'enquiry_id', 'developer_id', id, sel.developerIds);
  await syncMultiSelect(supabase, 'enquiry_property_statuses', 'enquiry_id', 'property_status_id', id, sel.propertyStatusIds);
}

export async function createEnquiryAction(formData: FormData) {
  const supabase = await createClient();
  const id = await generateNextEnquiryId(supabase);
  const fields = readEnquiryForm(formData);
  const sel = readMultiSelectIds(formData);

  if (!fields.client_id) throw new Error('Client is required');

  const { error } = await supabase.from('enquiries').insert({ id, ...fields });
  if (error) throw error;

  await syncAllEnquiryLinks(supabase, id, sel);

  revalidatePath('/enquiries');
  revalidatePath('/pipeline');
  redirect('/enquiries');
}

// Modal variants — same DB work as createEnquiryAction, but no redirect, so
// the calling client component can close the modal and refresh in place.
export async function updateEnquiryModalAction(id: string, formData: FormData) {
  const supabase = await createClient();
  const fields = readEnquiryForm(formData);
  const sel = readMultiSelectIds(formData);

  if (!fields.client_id) throw new Error('Client is required');

  const { error } = await supabase.from('enquiries').update(fields).eq('id', id);
  if (error) throw error;

  await syncAllEnquiryLinks(supabase, id, sel);

  revalidatePath('/enquiries');
  revalidatePath('/pipeline');
  if (fields.client_id) revalidatePath(`/clients/${fields.client_id}`);
  if (fields.property_id) revalidatePath(`/properties/${fields.property_id}`);
}

export async function deleteEnquiryModalAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('enquiries').delete().eq('id', id);
  if (error) throw error;

  revalidatePath('/enquiries');
  revalidatePath('/pipeline');
}
