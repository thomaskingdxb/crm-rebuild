'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { monthsBetween } from '@/lib/kpis';

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

export async function upsertRecurringGoalAction(formData: FormData) {
  const supabase = await createClient();
  const metric = formData.get('metric') as string;
  const startMonth = formData.get('start_month') as string; // 'YYYY-MM'
  const endMonth = formData.get('end_month') as string; // 'YYYY-MM'
  const amountPerMonth = Number(formData.get('amount_per_month'));

  if (!metric || !startMonth || !endMonth || isNaN(amountPerMonth)) {
    throw new Error('All recurring target fields are required');
  }
  if (startMonth > endMonth) {
    throw new Error('Start month must be before end month');
  }

  const groupId = crypto.randomUUID();
  const rows = monthsBetween(startMonth, endMonth).map((monthKey) => ({
    period_type: 'monthly' as const,
    period_start: `${monthKey}-01`,
    metric,
    target_value: amountPerMonth,
    group_id: groupId,
  }));

  const { error } = await supabase.from('goals').upsert(rows, { onConflict: 'period_type,period_start,metric' });
  if (error) throw error;

  revalidatePath('/kpis');
}

export async function deleteGoalGroupAction(groupId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('goals').delete().eq('group_id', groupId);
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
