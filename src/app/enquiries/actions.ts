'use server';

import { supabase } from '@/lib/supabase/client';
import { generateNextEnquiryId } from '@/lib/enquiries';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

function num(v: FormDataEntryValue | null): number | null {
  if (!v) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

async function syncMultiSelect(table: string, idColumn: string, lookupColumn: string, entityId: string, ids: number[]) {
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
    leadStageIds: formData.getAll('lead_stage_ids').map(Number),
    viewIds: formData.getAll('view_ids').map(Number),
    developerIds: formData.getAll('developer_ids').map(Number),
    propertyStatusIds: formData.getAll('property_status_ids').map(Number),
  };
}

async function syncAllEnquiryLinks(id: string, sel: ReturnType<typeof readMultiSelectIds>) {
  await syncMultiSelect('enquiry_enquiry_types', 'enquiry_id', 'enquiry_type_id', id, sel.enquiryTypeIds);
  await syncMultiSelect('enquiry_property_types', 'enquiry_id', 'property_type_id', id, sel.propertyTypeIds);
  await syncMultiSelect('enquiry_areas', 'enquiry_id', 'area_id', id, sel.areaIds);
  await syncMultiSelect('enquiry_bedroom_counts', 'enquiry_id', 'bedroom_count_id', id, sel.bedroomIds);
  await syncMultiSelect('enquiry_bathroom_counts', 'enquiry_id', 'bathroom_count_id', id, sel.bathroomIds);
  await syncMultiSelect('enquiry_lead_stages', 'enquiry_id', 'lead_stage_id', id, sel.leadStageIds);
  await syncMultiSelect('enquiry_view_types', 'enquiry_id', 'view_type_id', id, sel.viewIds);
  await syncMultiSelect('enquiry_developers', 'enquiry_id', 'developer_id', id, sel.developerIds);
  await syncMultiSelect('enquiry_property_statuses', 'enquiry_id', 'property_status_id', id, sel.propertyStatusIds);
}

export async function createEnquiryAction(formData: FormData) {
  const id = await generateNextEnquiryId();
  const fields = readEnquiryForm(formData);
  const sel = readMultiSelectIds(formData);

  if (!fields.client_id) throw new Error('Client is required');

  const { error } = await supabase.from('enquiries').insert({ id, ...fields });
  if (error) throw error;

  await syncAllEnquiryLinks(id, sel);

  revalidatePath('/enquiries');
  redirect(`/enquiries/${id}`);
}

export async function updateEnquiryAction(id: string, formData: FormData) {
  const fields = readEnquiryForm(formData);
  const sel = readMultiSelectIds(formData);

  if (!fields.client_id) throw new Error('Client is required');

  const { error } = await supabase.from('enquiries').update(fields).eq('id', id);
  if (error) throw error;

  await syncAllEnquiryLinks(id, sel);

  revalidatePath(`/enquiries/${id}`);
  revalidatePath('/enquiries');
  redirect(`/enquiries/${id}`);
}

export async function deleteEnquiryAction(id: string) {
  const { error } = await supabase.from('enquiries').delete().eq('id', id);
  if (error) throw error;

  revalidatePath('/enquiries');
  redirect('/enquiries');
}
