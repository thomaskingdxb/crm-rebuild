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

async function syncLeadStages(dealId: string, stageIds: number[]) {
  const { error: delErr } = await supabase.from('deal_lead_stages').delete().eq('deal_id', dealId);
  if (delErr) throw delErr;
  if (stageIds.length > 0) {
    const { error } = await supabase.from('deal_lead_stages').insert(stageIds.map((lead_stage_id) => ({ deal_id: dealId, lead_stage_id })));
    if (error) throw error;
  }
}

function readDealForm(formData: FormData) {
  return {
    property_id: (formData.get('property_id') as string) || null,
    owner_id: (formData.get('owner_id') as string) || null,
    buyer_id: (formData.get('buyer_id') as string) || null,
    deal_type_id: num(formData.get('deal_type_id')),
    value: num(formData.get('value')),
    commission_percent: num(formData.get('commission_percent')),
    commission_amount: num(formData.get('commission_amount')),
    notes: (formData.get('notes') as string) || null,
    date_agreed: (formData.get('date_agreed') as string) || null,
    date_completed: (formData.get('date_completed') as string) || null,
  };
}

export async function createDealAction(formData: FormData) {
  const id = await generateNextDealId();
  const fields = readDealForm(formData);
  const stageIds = formData.getAll('lead_stage_ids').map(Number);

  const { error } = await supabase.from('deals').insert({ id, ...fields });
  if (error) throw error;

  await syncLeadStages(id, stageIds);

  revalidatePath('/deals');
  redirect(`/deals/${id}`);
}

export async function updateDealAction(id: string, formData: FormData) {
  const fields = readDealForm(formData);
  const stageIds = formData.getAll('lead_stage_ids').map(Number);

  const { error } = await supabase.from('deals').update(fields).eq('id', id);
  if (error) throw error;

  await syncLeadStages(id, stageIds);

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
