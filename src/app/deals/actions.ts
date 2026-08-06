'use server';

import { supabase } from '@/lib/supabase/client';
import { generateNextDealId } from '@/lib/deals';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

function num(v: FormDataEntryValue | null): number | null {
  if (!v) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

function pct(v: FormDataEntryValue | null): number | null {
  const n = num(v);
  return n === null ? null : n / 100;
}

function readDealForm(formData: FormData) {
  return {
    property_id: (formData.get('property_id') as string) || null,
    owner_id: (formData.get('owner_id') as string) || null,
    buyer_id: (formData.get('buyer_id') as string) || null,
    deal_type_id: num(formData.get('deal_type_id')),
    deal_stage_id: num(formData.get('deal_stage_id')),
    value: num(formData.get('value')),
    commission_percent: pct(formData.get('commission_percent')),
    commission_amount: num(formData.get('commission_amount')),
    commission_split_percent: pct(formData.get('commission_split_percent')),
    commission_split_amount: num(formData.get('commission_split_amount')),
    notes: (formData.get('notes') as string) || null,
    date_agreed: (formData.get('date_agreed') as string) || null,
    date_completed: (formData.get('date_completed') as string) || null,
  };
}

export async function createDealAction(formData: FormData) {
  const id = await generateNextDealId();
  const fields = readDealForm(formData);

  const { error } = await supabase.from('deals').insert({ id, ...fields });
  if (error) throw error;

  revalidatePath('/deals');
  redirect(`/deals/${id}`);
}

export async function updateDealAction(id: string, formData: FormData) {
  const fields = readDealForm(formData);

  const { error } = await supabase.from('deals').update(fields).eq('id', id);
  if (error) throw error;

  revalidatePath(`/deals/${id}`);
  revalidatePath('/deals');
  redirect(`/deals/${id}`);
}

export async function deleteDealAction(id: string) {
  const { error } = await supabase.from('deals').delete().eq('id', id);
  if (error) throw error;

  revalidatePath('/deals');
  redirect('/deals');
}
