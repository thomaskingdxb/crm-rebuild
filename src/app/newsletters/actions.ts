'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createEditionAction(formData: FormData) {
  const supabase = await createClient();
  const period_label = formData.get('period_label') as string;

  const { data, error } = await supabase.from('newsletter_editions').insert({ period_label }).select('id').single();
  if (error) throw error;

  revalidatePath('/newsletters');
  redirect(`/newsletters/${data.id}`);
}

export async function updateEditionAction(editionId: string, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('newsletter_editions')
    .update({
      headline: (formData.get('headline') as string) || null,
      insights_text: (formData.get('insights_text') as string) || null,
    })
    .eq('id', editionId);
  if (error) throw error;
  revalidatePath(`/newsletters/${editionId}`);
}

export async function markSentAction(editionId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('newsletter_editions').update({ status: 'sent' }).eq('id', editionId);
  if (error) throw error;
  revalidatePath(`/newsletters/${editionId}`);
  revalidatePath('/newsletters');
}

export async function deleteEditionAction(editionId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('newsletter_editions').delete().eq('id', editionId);
  if (error) throw error;
  revalidatePath('/newsletters');
  redirect('/newsletters');
}

export async function addArticleAction(editionId: string, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from('newsletter_articles').insert({
    edition_id: editionId,
    headline: formData.get('headline') as string,
    summary: formData.get('summary') as string,
    source_name: formData.get('source_name') as string,
    source_url: (formData.get('source_url') as string) || null,
    display_order: Number(formData.get('display_order')) || 0,
  });
  if (error) throw error;
  revalidatePath(`/newsletters/${editionId}`);
}

export async function deleteArticleAction(editionId: string, articleId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('newsletter_articles').delete().eq('id', articleId);
  if (error) throw error;
  revalidatePath(`/newsletters/${editionId}`);
}

export async function addTransactionStatAction(editionId: string, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from('newsletter_transaction_stats').insert({
    edition_id: editionId,
    category: formData.get('category') as string,
    segment: formData.get('segment') as string,
    value_aed: Number(formData.get('value_aed')) || null,
    share_pct: Number(formData.get('share_pct')) || null,
  });
  if (error) throw error;
  revalidatePath(`/newsletters/${editionId}`);
}

export async function deleteTransactionStatAction(editionId: string, statId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('newsletter_transaction_stats').delete().eq('id', statId);
  if (error) throw error;
  revalidatePath(`/newsletters/${editionId}`);
}
