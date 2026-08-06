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

async function defaultStageId(dealTypeId: number | null): Promise<number | null> {
  if (dealTypeId == null) return null;
  const category = dealTypeId === 1 ? 'rental' : 'sale';
  const { data, error } = await supabase.from('deal_stages').select('id').eq('category', category).eq('name', 'Unstaged').single();
  if (error) return null;
  return data.id;
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

  if (fields.deal_stage_id == null) {
    fields.deal_stage_id = await defaultStageId(fields.deal_type_id);
  }

  const { error } = await supabase.from('deals').insert({ id, ...fields });
  if (error) throw error;

  revalidatePath('/deals');
  redirect(`/deals/${id}`);
}

export async function updateDealAction(id: string, formData: FormData) {
  const fields = readDealForm(formData);

  if (fields.deal_stage_id == null) {
    fields.deal_stage_id = await defaultStageId(fields.deal_type_id);
  }

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

// Called from the Kanban board when a card is dragged into a new stage column.
// Moving into MOU signed / Contract signed stamps date_agreed; moving into
// Completed stamps date_completed — both set to today.
export async function moveDealStageAction(dealId: string, newStageId: number) {
  const { data: stage, error: stageError } = await supabase.from('deal_stages').select('name').eq('id', newStageId).single();
  if (stageError) throw stageError;

  const today = new Date().toISOString().slice(0, 10);
  const update: Record<string, unknown> = { deal_stage_id: newStageId };

  if (stage.name === 'MOU signed' || stage.name === 'Contract signed') {
    update.date_agreed = today;
  } else if (stage.name === 'Completed') {
    update.date_completed = today;
  }

  const { error } = await supabase.from('deals').update(update).eq('id', dealId);
  if (error) throw error;

  revalidatePath('/deals');
}
