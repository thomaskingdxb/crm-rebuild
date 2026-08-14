import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase as defaultClient } from '@/lib/supabase/client';
import type { NewsletterEdition, NewsletterEditionWithContent } from '@/types/database';

const EDITION_SELECT = `*,
  newsletter_articles ( * ),
  newsletter_transaction_stats ( * )`;

export async function getNewsletterEditions(db: SupabaseClient = defaultClient): Promise<NewsletterEdition[]> {
  const { data, error } = await db.from('newsletter_editions').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data as NewsletterEdition[];
}

export async function getNewsletterEdition(id: string, db: SupabaseClient = defaultClient): Promise<NewsletterEditionWithContent | null> {
  const { data, error } = await db.from('newsletter_editions').select(EDITION_SELECT).eq('id', id).single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  const edition = data as unknown as NewsletterEditionWithContent;
  edition.newsletter_articles.sort((a, b) => a.display_order - b.display_order);
  return edition;
}

// The edition immediately before this one (by creation order) - used to show
// real month-over-month change on the Luxury Market section instead of
// guessing at a % figure.
export async function getPriorEdition(currentEditionId: string, db: SupabaseClient = defaultClient): Promise<NewsletterEdition | null> {
  const { data: current, error: curErr } = await db
    .from('newsletter_editions')
    .select('created_at')
    .eq('id', currentEditionId)
    .single();
  if (curErr) throw curErr;

  const { data, error } = await db
    .from('newsletter_editions')
    .select('*')
    .lt('created_at', current.created_at)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as NewsletterEdition | null;
}
