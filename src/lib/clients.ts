import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase as defaultClient } from '@/lib/supabase/client';
import type { ClientWithRelations, ClientListItem, Lookup, ActivityWithRelations } from '@/types/database';

const CLIENT_SELECT = `*,
      lead_sources ( id, name, display_order ),
      client_client_types ( client_types ( id, name, display_order ) ),
      client_client_statuses ( client_statuses ( id, name, display_order ) )`;

function mostRecentDate(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return a > b ? a : b;
}

export async function getClientsBasic(db: SupabaseClient = defaultClient): Promise<{ id: string; name: string }[]> {
  const { data, error } = await db.from('clients').select('id, name').order('name');
  if (error) throw error;
  return data;
}

export async function getClients(db: SupabaseClient = defaultClient): Promise<ClientListItem[]> {
  const [clientsRes, activitiesRes] = await Promise.all([
    db.from('clients').select(CLIENT_SELECT).order('name'),
    db.from('activities').select('client_id, activity_date'),
  ]);

  if (clientsRes.error) throw clientsRes.error;
  if (activitiesRes.error) throw activitiesRes.error;

  const lastActivityByClient = new Map<string, string>();
  for (const a of activitiesRes.data ?? []) {
    if (!a.activity_date) continue;
    const current = lastActivityByClient.get(a.client_id);
    if (!current || a.activity_date > current) {
      lastActivityByClient.set(a.client_id, a.activity_date);
    }
  }

  const clients = clientsRes.data as unknown as ClientWithRelations[];
  return clients.map((c) => ({
    ...c,
    lastActivityDate: mostRecentDate(c.last_contact_date, lastActivityByClient.get(c.id) ?? null),
  }));
}

export async function getFollowUpClients(db: SupabaseClient = defaultClient): Promise<ClientListItem[]> {
  const clients = await getClients(db);
  return clients
    .filter((c) => c.follow_up_date)
    .sort((a, b) => (a.follow_up_date! < b.follow_up_date! ? -1 : a.follow_up_date! > b.follow_up_date! ? 1 : 0));
}

export interface UpcomingBirthday {
  id: string;
  name: string;
  date_of_birth: string;
  days_until: number; // 0 = today
  turning_age: number | null;
}

// Lightweight, display-only - not a task, doesn't affect /tasks or urgency
// sorting. Only ~9 of 400 clients currently have a date_of_birth on file
// (2026-08-26), so this will surface more over time as it's filled in via
// calls/etc, not a comprehensive list today.
export async function getUpcomingBirthdays(db: SupabaseClient = defaultClient, daysAhead = 3): Promise<UpcomingBirthday[]> {
  const { data, error } = await db.from('clients').select('id, name, date_of_birth').not('date_of_birth', 'is', null);
  if (error) throw error;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const results: UpcomingBirthday[] = [];
  for (const c of data ?? []) {
    const dob = new Date(c.date_of_birth as string);
    let nextBirthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
    if (nextBirthday < today) {
      nextBirthday = new Date(today.getFullYear() + 1, dob.getMonth(), dob.getDate());
    }
    const daysUntil = Math.round((nextBirthday.getTime() - today.getTime()) / 86_400_000);
    if (daysUntil <= daysAhead) {
      results.push({
        id: c.id,
        name: c.name,
        date_of_birth: c.date_of_birth as string,
        days_until: daysUntil,
        turning_age: nextBirthday.getFullYear() - dob.getFullYear(),
      });
    }
  }

  return results.sort((a, b) => a.days_until - b.days_until);
}

export async function getClient(id: string, db: SupabaseClient = defaultClient): Promise<ClientListItem | null> {
  const [clientRes, activitiesRes] = await Promise.all([
    db.from('clients').select(CLIENT_SELECT).eq('id', id).single(),
    db.from('activities').select('client_id, activity_date').eq('client_id', id),
  ]);

  if (clientRes.error) {
    if (clientRes.error.code === 'PGRST116') return null;
    throw clientRes.error;
  }

  let lastActivity: string | null = null;
  for (const a of activitiesRes.data ?? []) {
    lastActivity = mostRecentDate(lastActivity, a.activity_date);
  }

  const client = clientRes.data as unknown as ClientWithRelations;
  return {
    ...client,
    lastActivityDate: mostRecentDate(client.last_contact_date, lastActivity),
  };
}

export async function getClientActivities(clientId: string, db: SupabaseClient = defaultClient): Promise<ActivityWithRelations[]> {
  const { data, error } = await db
    .from('activities')
    .select('*, activity_activity_types ( activity_types ( id, name, display_order ) )')
    .eq('client_id', clientId)
    .order('activity_date', { ascending: false });

  if (error) throw error;
  return data as unknown as ActivityWithRelations[];
}

export async function getClientLookups(db: SupabaseClient = defaultClient) {
  const [types, statuses, sources] = await Promise.all([
    db.from('client_types').select('*').order('display_order'),
    db.from('client_statuses').select('*').order('display_order'),
    db.from('lead_sources').select('*').order('display_order'),
  ]);

  if (types.error) throw types.error;
  if (statuses.error) throw statuses.error;
  if (sources.error) throw sources.error;

  return {
    clientTypes: types.data as Lookup[],
    clientStatuses: statuses.data as Lookup[],
    leadSources: sources.data as Lookup[],
  };
}

async function generateNextId(table: string, prefix: string, db: SupabaseClient = defaultClient): Promise<string> {
  const { data, error } = await db.from(table).select('id');
  if (error) throw error;

  let max = 0;
  for (const row of data ?? []) {
    const n = parseInt((row.id as string).replace(prefix, ''), 10);
    if (!isNaN(n) && n > max) max = n;
  }
  return `${prefix}${String(max + 1).padStart(3, '0')}`;
}

export async function generateNextClientId(db: SupabaseClient = defaultClient): Promise<string> {
  return generateNextId('clients', 'C', db);
}

export async function generateNextActivityId(db: SupabaseClient = defaultClient): Promise<string> {
  return generateNextId('activities', 'AL', db);
}

export async function getActivityTypes(db: SupabaseClient = defaultClient): Promise<Lookup[]> {
  const { data, error } = await db.from('activity_types').select('*').order('display_order');
  if (error) throw error;
  return data as Lookup[];
}
