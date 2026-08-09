'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function upsertGoalAction(formData: FormData) {
  const supabase = await createClient();
  const periodType = formData.get('period_type') as string;
  const periodStart = formData.get('period_start') as string;
  const metric = formData.get('metric') as string;
  const targetValue = Number(formData.get('target_value'));

  if (!periodType || !periodStart || !metric || isNaN(targetValue)) {
    throw new Error('All goal fields are required');
  }

  const { error } = await supabase
    .from('goals')
    .upsert(
      { period_type: periodType, period_start: periodStart, metric, target_value: targetValue },
      { onConflict: 'period_type,period_start,metric' }
    );
  if (error) throw error;

  revalidatePath('/kpis');
}

export async function deleteGoalAction(id: number) {
  const supabase = await createClient();
  const { error } = await supabase.from('goals').delete().eq('id', id);
  if (error) throw error;

  revalidatePath('/kpis');
}

export async function addAchievementAction(formData: FormData) {
  const supabase = await createClient();
  const title = formData.get('title') as string;
  const description = (formData.get('description') as string) || null;
  const achievedDate = (formData.get('achieved_date') as string) || new Date().toISOString().slice(0, 10);

  if (!title) throw new Error('Title is required');

  const { error } = await supabase.from('achievements').insert({ title, description, achieved_date: achievedDate });
  if (error) throw error;

  revalidatePath('/kpis');
}

export async function deleteAchievementAction(id: number) {
  const supabase = await createClient();
  const { error } = await supabase.from('achievements').delete().eq('id', id);
  if (error) throw error;

  revalidatePath('/kpis');
}
