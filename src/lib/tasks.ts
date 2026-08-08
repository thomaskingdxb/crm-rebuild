import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase as defaultClient } from '@/lib/supabase/client';
import type { TaskWithRelations, Lookup } from '@/types/database';

const TASK_SELECT = `*,
  task_task_types ( task_types ( id, name, display_order ) ),
  clients ( id, name )`;

export async function getTasks(db: SupabaseClient = defaultClient): Promise<TaskWithRelations[]> {
  const { data, error } = await db.from('tasks').select(TASK_SELECT).order('deadline_date', { ascending: true });
  if (error) throw error;
  return data as unknown as TaskWithRelations[];
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
