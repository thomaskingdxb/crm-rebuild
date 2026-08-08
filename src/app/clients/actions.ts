'use server';

import { createClient } from '@/lib/supabase/server';
import { generateNextClientId, generateNextActivityId } from '@/lib/clients';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createClientAction(formData: FormData) {
  const supabase = await createClient();
  const name = formData.get('name') as string;
  const phone = (formData.get('phone') as string) || null;
  const email = (formData.get('email') as string) || null;
  const sourceId = formData.get('source_id') ? Number(formData.get('source_id')) : null;
  const notes = (formData.get('notes') as string) || null;
  const dateAdded = (formData.get('date_added') as string) || null;
  const dateOfBirth = (formData.get('date_of_birth') as string) || null;
  const personalInfo = (formData.get('personal_info') as string) || null;
  const typeIds = formData.getAll('type_ids').map(Number);
  const statusIds = formData.getAll('status_ids').map(Number);

  if (!name) throw new Error('Name is required');

  const id = await generateNextClientId(supabase);

  const { error: clientError } = await supabase.from('clients').insert({
    id,
    name,
    phone,
    email,
    source_id: sourceId,
    notes,
    date_added: dateAdded,
    date_of_birth: dateOfBirth,
    personal_info: personalInfo,
  });

  if (clientError) throw clientError;

  if (typeIds.length > 0) {
    const { error } = await supabase
      .from('client_client_types')
      .insert(typeIds.map((client_type_id) => ({ client_id: id, client_type_id })));
    if (error) throw error;
  }

  if (statusIds.length > 0) {
    const { error } = await supabase
      .from('client_client_statuses')
      .insert(statusIds.map((client_status_id) => ({ client_id: id, client_status_id })));
    if (error) throw error;
  }

  revalidatePath('/clients');
  redirect('/clients');
}

export async function updateClientAction(id: string, formData: FormData) {
  const supabase = await createClient();
  const name = formData.get('name') as string;
  const phone = (formData.get('phone') as string) || null;
  const email = (formData.get('email') as string) || null;
  const sourceId = formData.get('source_id') ? Number(formData.get('source_id')) : null;
  const notes = (formData.get('notes') as string) || null;
  const lastContactDate = (formData.get('last_contact_date') as string) || null;
  const followUpDate = (formData.get('follow_up_date') as string) || null;
  const dateOfBirth = (formData.get('date_of_birth') as string) || null;
  const personalInfo = (formData.get('personal_info') as string) || null;
  const typeIds = formData.getAll('type_ids').map(Number);
  const statusIds = formData.getAll('status_ids').map(Number);

  if (!name) throw new Error('Name is required');

  const { error: clientError } = await supabase
    .from('clients')
    .update({
      name,
      phone,
      email,
      source_id: sourceId,
      notes,
      last_contact_date: lastContactDate,
      follow_up_date: followUpDate,
      date_of_birth: dateOfBirth,
      personal_info: personalInfo,
    })
    .eq('id', id);

  if (clientError) throw clientError;

  const { error: delTypesErr } = await supabase.from('client_client_types').delete().eq('client_id', id);
  if (delTypesErr) throw delTypesErr;
  if (typeIds.length > 0) {
    const { error } = await supabase
      .from('client_client_types')
      .insert(typeIds.map((client_type_id) => ({ client_id: id, client_type_id })));
    if (error) throw error;
  }

  const { error: delStatusesErr } = await supabase.from('client_client_statuses').delete().eq('client_id', id);
  if (delStatusesErr) throw delStatusesErr;
  if (statusIds.length > 0) {
    const { error } = await supabase
      .from('client_client_statuses')
      .insert(statusIds.map((client_status_id) => ({ client_id: id, client_status_id })));
    if (error) throw error;
  }

  revalidatePath(`/clients/${id}`);
  revalidatePath('/clients');
  redirect(`/clients/${id}`);
}

// Modal variants — same DB work as the page-based actions above, but no redirect,
// so the calling client component can close the modal and refresh in place.

export async function logActivityModalAction(clientId: string, formData: FormData) {
  const supabase = await createClient();
  const activityDate = (formData.get('activity_date') as string) || new Date().toISOString().slice(0, 10);
  const notes = (formData.get('notes') as string) || null;
  const typeIds = formData.getAll('type_ids').map(Number);

  const id = await generateNextActivityId(supabase);

  const { error } = await supabase.from('activities').insert({
    id,
    client_id: clientId,
    activity_date: activityDate,
    notes,
  });
  if (error) throw error;

  if (typeIds.length > 0) {
    const { error: linkError } = await supabase
      .from('activity_activity_types')
      .insert(typeIds.map((activity_type_id) => ({ activity_id: id, activity_type_id })));
    if (linkError) throw linkError;
  }

  revalidatePath(`/clients/${clientId}`);
  revalidatePath('/clients');
}

export async function updateActivityModalAction(clientId: string, activityId: string, formData: FormData) {
  const supabase = await createClient();
  const activityDate = (formData.get('activity_date') as string) || null;
  const notes = (formData.get('notes') as string) || null;
  const typeIds = formData.getAll('type_ids').map(Number);

  const { error } = await supabase
    .from('activities')
    .update({ activity_date: activityDate, notes })
    .eq('id', activityId);
  if (error) throw error;

  const { error: delErr } = await supabase.from('activity_activity_types').delete().eq('activity_id', activityId);
  if (delErr) throw delErr;
  if (typeIds.length > 0) {
    const { error: linkError } = await supabase
      .from('activity_activity_types')
      .insert(typeIds.map((activity_type_id) => ({ activity_id: activityId, activity_type_id })));
    if (linkError) throw linkError;
  }

  revalidatePath(`/clients/${clientId}`);
}

export async function deleteActivityModalAction(clientId: string, activityId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('activities').delete().eq('id', activityId);
  if (error) throw error;

  revalidatePath(`/clients/${clientId}`);
}

export async function deleteClientAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('clients').delete().eq('id', id);
  if (error) throw error;

  revalidatePath('/clients');
  redirect('/clients');
}
