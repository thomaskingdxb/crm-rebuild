'use server';

import { supabase } from '@/lib/supabase/client';
import { generateNextTaskId } from '@/lib/tasks';
import { revalidatePath } from 'next/cache';

function num(v: FormDataEntryValue | null): number | null {
  if (!v) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

async function syncTaskTypes(taskId: string, typeIds: number[]) {
  const { error: delErr } = await supabase.from('task_task_types').delete().eq('task_id', taskId);
  if (delErr) throw delErr;
  if (typeIds.length > 0) {
    const { error } = await supabase.from('task_task_types').insert(typeIds.map((task_type_id) => ({ task_id: taskId, task_type_id })));
    if (error) throw error;
  }
}

function readTaskForm(formData: FormData) {
  return {
    client_id: (formData.get('client_id') as string) || null,
    task_info: (formData.get('task_info') as string) || null,
    entry_date: (formData.get('entry_date') as string) || null,
    deadline_date: (formData.get('deadline_date') as string) || null,
    impact: num(formData.get('impact')),
    effort: num(formData.get('effort')),
    priority_score: num(formData.get('priority_score')),
  };
}

export async function createTaskModalAction(formData: FormData) {
  const id = await generateNextTaskId();
  const fields = readTaskForm(formData);
  const typeIds = formData.getAll('task_type_ids').map(Number);

  if (!fields.client_id) throw new Error('Client is required');

  const { error } = await supabase.from('tasks').insert({ id, ...fields });
  if (error) throw error;

  await syncTaskTypes(id, typeIds);

  revalidatePath('/tasks');
  revalidatePath(`/clients/${fields.client_id}`);
}

export async function updateTaskModalAction(id: string, formData: FormData) {
  const fields = readTaskForm(formData);
  const typeIds = formData.getAll('task_type_ids').map(Number);

  if (!fields.client_id) throw new Error('Client is required');

  const { error } = await supabase.from('tasks').update(fields).eq('id', id);
  if (error) throw error;

  await syncTaskTypes(id, typeIds);

  revalidatePath('/tasks');
  revalidatePath(`/clients/${fields.client_id}`);
}

export async function deleteTaskModalAction(id: string, clientId: string | null) {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw error;

  revalidatePath('/tasks');
  if (clientId) revalidatePath(`/clients/${clientId}`);
}
