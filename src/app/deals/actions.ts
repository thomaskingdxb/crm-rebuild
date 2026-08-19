'use server';

import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { generateNextDealId, getDeal } from '@/lib/deals';
import { generateNextTaskId } from '@/lib/tasks';
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

async function defaultStageId(supabase: SupabaseClient, dealTypeId: number | null): Promise<number | null> {
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
  const supabase = await createClient();
  const id = await generateNextDealId(supabase);
  const fields = readDealForm(formData);

  if (fields.deal_stage_id == null) {
    fields.deal_stage_id = await defaultStageId(supabase, fields.deal_type_id);
  }

  const { error } = await supabase.from('deals').insert({ id, ...fields });
  if (error) throw error;

  revalidatePath('/deals');
  redirect('/deals');
}

// Modal variant — same DB work as createDealAction, but no redirect, so the
// calling client component can close the modal and refresh in place.
export async function updateDealModalAction(id: string, formData: FormData) {
  const supabase = await createClient();
  const fields = readDealForm(formData);

  if (fields.deal_stage_id == null) {
    fields.deal_stage_id = await defaultStageId(supabase, fields.deal_type_id);
  }

  const { error } = await supabase.from('deals').update(fields).eq('id', id);
  if (error) throw error;

  revalidatePath('/deals');
  if (fields.owner_id) revalidatePath(`/clients/${fields.owner_id}`);
  if (fields.buyer_id) revalidatePath(`/clients/${fields.buyer_id}`);
  if (fields.property_id) revalidatePath(`/properties/${fields.property_id}`);
}

export async function deleteDealModalAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('deals').delete().eq('id', id);
  if (error) throw error;

  revalidatePath('/deals');
}

// Cheques get a linked task so the deposit deadline surfaces on /tasks
// automatically (TaskCard already colors overdue/due-today deadlines red/amber -
// no separate reminder mechanism needed). Depositing or deleting a cheque
// deletes its task, matching this app's existing delete-to-complete convention
// for tasks (see deleteTaskModalAction in src/app/tasks/actions.ts).
export async function addChequeAction(dealId: string, formData: FormData) {
  const supabase = await createClient();

  const chequeNumber = num(formData.get('cheque_number'));
  const amount = num(formData.get('amount'));
  const dueDate = (formData.get('due_date') as string) || null;
  const notes = (formData.get('notes') as string) || null;

  if (chequeNumber == null || amount == null || !dueDate) {
    throw new Error('Cheque number, amount, and due date are required.');
  }

  const deal = await getDeal(dealId, supabase);

  const taskId = await generateNextTaskId(supabase);
  const { error: taskError } = await supabase.from('tasks').insert({
    id: taskId,
    client_id: deal?.buyer_id ?? null,
    deal_id: dealId,
    task_info: `Deposit rental cheque #${chequeNumber} (AED ${amount.toLocaleString()})`,
    deadline_date: dueDate,
  });
  if (taskError) throw taskError;

  const { error } = await supabase.from('rental_cheques').insert({
    deal_id: dealId,
    cheque_number: chequeNumber,
    amount,
    due_date: dueDate,
    notes,
    task_id: taskId,
  });
  if (error) throw error;

  revalidatePath(`/deals/${dealId}`);
  revalidatePath('/tasks');
  revalidatePath('/coaching');
}

export async function markChequeDepositedAction(chequeId: string, dealId?: string) {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: cheque, error: fetchError } = await supabase
    .from('rental_cheques')
    .select('task_id')
    .eq('id', chequeId)
    .single();
  if (fetchError) throw fetchError;

  const { error } = await supabase
    .from('rental_cheques')
    .update({ deposited: true, deposited_date: today })
    .eq('id', chequeId);
  if (error) throw error;

  if (cheque?.task_id) {
    const { error: taskError } = await supabase.from('tasks').delete().eq('id', cheque.task_id);
    if (taskError) throw taskError;
  }

  if (dealId) revalidatePath(`/deals/${dealId}`);
  revalidatePath('/tasks');
  revalidatePath('/coaching');
}

export async function deleteChequeAction(chequeId: string, dealId: string) {
  const supabase = await createClient();

  const { data: cheque, error: fetchError } = await supabase
    .from('rental_cheques')
    .select('task_id')
    .eq('id', chequeId)
    .single();
  if (fetchError) throw fetchError;

  const { error } = await supabase.from('rental_cheques').delete().eq('id', chequeId);
  if (error) throw error;

  if (cheque?.task_id) {
    const { error: taskError } = await supabase.from('tasks').delete().eq('id', cheque.task_id);
    if (taskError) throw taskError;
  }

  revalidatePath(`/deals/${dealId}`);
  revalidatePath('/tasks');
  revalidatePath('/coaching');
}

// Called from the Kanban board when a card is dragged into a new stage column.
// Moving into MOU signed / Contract signed stamps date_agreed; moving into
// Completed stamps date_completed — both set to today.
export async function moveDealStageAction(dealId: string, newStageId: number) {
  const supabase = await createClient();
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
