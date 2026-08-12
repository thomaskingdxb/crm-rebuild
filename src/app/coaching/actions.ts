'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

const COMPLETED_TASK_TYPE_ID = 8; // 'Completed' in task_types - matches existing convention (id fixed, seeded)

export async function resolveFlagAction(flagId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('coaching_flags')
    .update({ resolved: true, suggested_resolved: false })
    .eq('id', flagId);
  if (error) throw error;

  const { data: task } = await supabase.from('tasks').select('id').eq('coaching_flag_id', flagId).maybeSingle();
  if (task) {
    const { data: existing } = await supabase
      .from('task_task_types')
      .select('task_id')
      .eq('task_id', task.id)
      .eq('task_type_id', COMPLETED_TASK_TYPE_ID)
      .maybeSingle();
    if (!existing) {
      await supabase.from('task_task_types').insert({ task_id: task.id, task_type_id: COMPLETED_TASK_TYPE_ID });
    }
  }

  revalidatePath('/coaching');
  revalidatePath('/tasks');
}

export async function dismissContentIdeaAction(ideaId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('content_ideas').delete().eq('id', ideaId);
  if (error) throw error;
  revalidatePath('/coaching');
}
