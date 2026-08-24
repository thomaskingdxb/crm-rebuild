import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase as defaultClient } from '@/lib/supabase/client';
import type { TaskWithRelations, Lookup } from '@/types/database';

const TASK_SELECT = `*,
  task_task_types ( task_types ( id, name, display_order ) ),
  clients ( id, name )`;

// Task types with dedicated completion actions on /tasks (see markListingUpdateSentAction
// and markChequeDepositedAction) instead of the generic delete button.
export const MARKET_UPDATE_TYPE_NAME = 'Market Update';
export const CHEQUE_DEPOSIT_TYPE_NAME = 'Cheque Deposit';

async function attachLinkedRecords(db: SupabaseClient, tasks: TaskWithRelations[]): Promise<TaskWithRelations[]> {
  if (tasks.length === 0) return tasks;
  const taskIds = tasks.map((t) => t.id);

  const [{ data: properties, error: propErr }, { data: cheques, error: chequeErr }] = await Promise.all([
    db.from('properties').select('id, owner_id, listing_update_task_id').in('listing_update_task_id', taskIds),
    db.from('rental_cheques').select('id, deal_id, task_id').in('task_id', taskIds),
  ]);
  if (propErr) throw propErr;
  if (chequeErr) throw chequeErr;

  const propByTaskId = new Map((properties ?? []).map((p) => [p.listing_update_task_id as string, p]));
  const chequeByTaskId = new Map((cheques ?? []).map((c) => [c.task_id as string, c]));

  for (const task of tasks) {
    const prop = propByTaskId.get(task.id);
    if (prop) {
      task.linked_property_id = prop.id;
      task.linked_property_owner_id = prop.owner_id;
    }
    const cheque = chequeByTaskId.get(task.id);
    if (cheque) {
      task.linked_cheque_id = cheque.id;
      task.linked_cheque_deal_id = cheque.deal_id;
    }
  }

  return tasks;
}

export async function getTasks(db: SupabaseClient = defaultClient): Promise<TaskWithRelations[]> {
  const { data, error } = await db.from('tasks').select(TASK_SELECT).order('deadline_date', { ascending: true });
  if (error) throw error;
  return attachLinkedRecords(db, data as unknown as TaskWithRelations[]);
}

export async function getTask(id: string, db: SupabaseClient = defaultClient): Promise<TaskWithRelations | null> {
  const { data, error } = await db.from('tasks').select(TASK_SELECT).eq('id', id).single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as unknown as TaskWithRelations;
}

export async function getClientTasks(clientId: string, db: SupabaseClient = defaultClient): Promise<TaskWithRelations[]> {
  const { data, error } = await db
    .from('tasks')
    .select(TASK_SELECT)
    .eq('client_id', clientId)
    .order('deadline_date', { ascending: true });

  if (error) throw error;
  return data as unknown as TaskWithRelations[];
}

export async function getTaskTypes(db: SupabaseClient = defaultClient): Promise<Lookup[]> {
  const { data, error } = await db.from('task_types').select('*').order('display_order');
  if (error) throw error;
  return data as Lookup[];
}

export async function generateNextTaskId(db: SupabaseClient = defaultClient): Promise<string> {
  const { data, error } = await db.from('tasks').select('id');
  if (error) throw error;

  let max = 0;
  for (const row of data ?? []) {
    const n = parseInt((row.id as string).replace('T', ''), 10);
    if (!isNaN(n) && n > max) max = n;
  }
  return `T${String(max + 1).padStart(3, '0')}`;
}
