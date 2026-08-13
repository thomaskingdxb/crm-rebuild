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
