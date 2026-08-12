import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase as defaultClient } from '@/lib/supabase/client';
import type { CoachingFlagWithContext, WhatsappContact, ContentIdea, CoachingMemory } from '@/types/database';

const FLAG_SELECT = `*,
  whatsapp_messages (
    id, sender_name, sent_at, body, conversation_id,
    whatsapp_conversations ( id, contact_id, whatsapp_contacts ( * ) )
  )`;

export async function getOpenNeedsResponseFlags(db: SupabaseClient = defaultClient): Promise<CoachingFlagWithContext[]> {
  const { data, error } = await db
    .from('coaching_flags')
    .select(FLAG_SELECT)
    .eq('flag_type', 'needs_response')
    .eq('resolved', false)
    .eq('suggested_resolved', false)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return attachDraftsAndTasks(data as unknown as CoachingFlagWithContext[], db);
}

export async function getSuggestedResolvedFlags(db: SupabaseClient = defaultClient): Promise<CoachingFlagWithContext[]> {
  const { data, error } = await db
    .from('coaching_flags')
    .select(FLAG_SELECT)
    .eq('resolved', false)
    .eq('suggested_resolved', true)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return attachDraftsAndTasks(data as unknown as CoachingFlagWithContext[], db);
}

export async function getOpenTaskFlags(db: SupabaseClient = defaultClient): Promise<CoachingFlagWithContext[]> {
  const { data, error } = await db
    .from('coaching_flags')
    .select(FLAG_SELECT)
    .in('flag_type', ['task', 'missed'])
    .eq('resolved', false)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return attachDraftsAndTasks(data as unknown as CoachingFlagWithContext[], db);
}

async function attachDraftsAndTasks(flags: CoachingFlagWithContext[], db: SupabaseClient): Promise<CoachingFlagWithContext[]> {
  if (flags.length === 0) return flags;

  const conversationIds = [...new Set(flags.map((f) => f.whatsapp_messages.conversation_id))];
  const flagIds = flags.map((f) => f.id);

  const [{ data: drafts }, { data: tasks }] = await Promise.all([
    db.from('draft_responses').select('id, conversation_id, draft_text, status').in('conversation_id', conversationIds),
    db.from('tasks').select('id, task_info, coaching_flag_id').in('coaching_flag_id', flagIds),
  ]);

  const draftByConversation = new Map((drafts ?? []).map((d) => [d.conversation_id, d]));
  const taskByFlag = new Map((tasks ?? []).map((t) => [t.coaching_flag_id, t]));

  return flags.map((f) => ({
    ...f,
    draft: draftByConversation.get(f.whatsapp_messages.conversation_id) ?? null,
    task: taskByFlag.get(f.id) ?? null,
  }));
}

export async function getUnmatchedContacts(db: SupabaseClient = defaultClient): Promise<WhatsappContact[]> {
  const { data, error } = await db
    .from('whatsapp_contacts')
    .select('*')
    .eq('match_status', 'unmatched')
    .order('display_name');
  if (error) throw error;
  return data as WhatsappContact[];
}

export async function getContentIdeasByStatus(status: ContentIdea['status'], db: SupabaseClient = defaultClient): Promise<ContentIdea[]> {
  const { data, error } = await db
    .from('content_ideas')
    .select('*')
    .eq('status', status)
    .order(status === 'new' ? 'created_at' : 'posted_at', { ascending: status !== 'new' ? false : true });
  if (error) throw error;
  return data as ContentIdea[];
}

export async function getContactMemory(contactId: string, db: SupabaseClient = defaultClient): Promise<CoachingMemory | null> {
  const { data, error } = await db.from('coaching_memory').select('*').eq('contact_id', contactId).maybeSingle();
  if (error) throw error;
  return data as CoachingMemory | null;
}

export async function getClientMemoryByClientId(clientId: string, db: SupabaseClient = defaultClient): Promise<CoachingMemory | null> {
  const { data: contact, error: contactErr } = await db
    .from('whatsapp_contacts')
    .select('id')
    .eq('client_id', clientId)
    .maybeSingle();
  if (contactErr) throw contactErr;
  if (!contact) return null;
  return getContactMemory(contact.id, db);
}

export interface CoachingCounts {
  needsResponse: number;
  openTasks: number;
  unmatchedLeads: number;
  newIdeas: number;
}

// Lightweight head-counts for the home dashboard summary - avoids pulling
// full joined rows just to show a number.
export async function getCoachingCounts(db: SupabaseClient = defaultClient): Promise<CoachingCounts> {
  const [needsResponse, openTasks, unmatchedLeads, newIdeas] = await Promise.all([
    db.from('coaching_flags').select('id', { count: 'exact', head: true }).eq('flag_type', 'needs_response').eq('resolved', false).eq('suggested_resolved', false),
    db.from('coaching_flags').select('id', { count: 'exact', head: true }).in('flag_type', ['task', 'missed']).eq('resolved', false),
    db.from('whatsapp_contacts').select('id', { count: 'exact', head: true }).eq('match_status', 'unmatched'),
    db.from('content_ideas').select('id', { count: 'exact', head: true }).eq('status', 'new'),
  ]);

  return {
    needsResponse: needsResponse.count ?? 0,
    openTasks: openTasks.count ?? 0,
    unmatchedLeads: unmatchedLeads.count ?? 0,
    newIdeas: newIdeas.count ?? 0,
  };
}

export async function getLastCoachingPassAt(db: SupabaseClient = defaultClient): Promise<string | null> {
  const { data, error } = await db
    .from('whatsapp_conversations')
    .select('imported_at')
    .order('imported_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.imported_at ?? null;
}
