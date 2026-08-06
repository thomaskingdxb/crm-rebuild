import { supabase } from '@/lib/supabase/client';
import type { TaskWithRelations, Lookup } from '@/types/database';

const TASK_SELECT = `*,
  task_task_types ( task_types ( id, name, display_order ) ),
  clients ( id, name )`;

export async function getTasks(): Promise<TaskWithRelations[]> {
  const { data, error } = await supabase.from('tasks').select(TASK_SELECT).order('deadline_date', { ascending: true });
  if (error) throw error;
  return data as unknown as TaskWithRelations[];
}

export async function getTask(id: string): Promise<TaskWithRelations | null> {
  const { data, error } = await supabase.from('tasks').select(TASK_SELECT).eq('id', id).single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as unknown as TaskWithRelations;
}

export async function getClientTasks(clientId: string): Promise<TaskWithRelations[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select(TASK_SELECT)
    .eq('client_id', clientId)
    .order('deadline_date', { ascending: true });

  if (error) throw error;
  return data as unknown as TaskWithRelations[];
}

export async function getTaskTypes(): Promise<Lookup[]> {
  const { data, error } = await supabase.from('task_types').select('*').order('display_order');
  if (error) throw error;
  return data as Lookup[];
}

export async function generateNextTaskId(): Promise<string> {
  const { data, error } = await supabase.from('tasks').select('id');
  if (error) throw error;

  let max = 0;
  for (const row of data ?? []) {
    const n = parseInt((row.id as string).replace('T', ''), 10);
    if (!isNaN(n) && n > max) max = n;
  }
  return `T${String(max + 1).padStart(3, '0')}`;
}
