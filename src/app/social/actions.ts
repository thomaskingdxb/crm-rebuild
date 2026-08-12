'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function markPostedAction(ideaId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('content_ideas')
    .update({ status: 'posted', posted_at: new Date().toISOString() })
    .eq('id', ideaId);
  if (error) throw error;
  revalidatePath('/social');
  revalidatePath('/coaching');
}

export async function dismissIdeaAction(ideaId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('content_ideas').update({ status: 'dismissed' }).eq('id', ideaId);
  if (error) throw error;
  revalidatePath('/social');
  revalidatePath('/coaching');
}

export async function updateDraftCopyAction(ideaId: string, formData: FormData) {
  const supabase = await createClient();
  const draft_copy = (formData.get('draft_copy') as string) || null;
  const { error } = await supabase.from('content_ideas').update({ draft_copy }).eq('id', ideaId);
  if (error) throw error;
  revalidatePath('/social');
}
