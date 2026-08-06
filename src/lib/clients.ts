import { supabase } from '@/lib/supabase/client';
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

export async function getClientsBasic(): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabase.from('clients').select('id, name').order('name');
  if (error) throw error;
  return data;
}

export async function getClients(): Promise<ClientListItem[]> {
  const [clientsRes, activitiesRes] = await Promise.all([
    supabase.from('clients').select(CLIENT_SELECT).order('name'),
    supabase.from('activities').select('client_id, activity_date'),
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

export async function getClient(id: string): Promise<ClientListItem | null> {
  const [clientRes, activitiesRes] = await Promise.all([
    supabase.from('clients').select(CLIENT_SELECT).eq('id', id).single(),
    supabase.from('activities').select('client_id, activity_date').eq('client_id', id),
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

export async function getClientActivities(clientId: string): Promise<ActivityWithRelations[]> {
  const { data, error } = await supabase
    .from('activities')
    .select('*, activity_activity_types ( activity_types ( id, name, display_order ) )')
    .eq('client_id', clientId)
    .order('activity_date', { ascending: false });

  if (error) throw error;
  return data as unknown as ActivityWithRelations[];
}

export async function getClientLookups() {
  const [types, statuses, sources] = await Promise.all([
    supabase.from('client_types').select('*').order('display_order'),
    supabase.from('client_statuses').select('*').order('display_order'),
    supabase.from('lead_sources').select('*').order('display_order'),
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

async function generateNextId(table: string, prefix: string): Promise<string> {
  const { data, error } = await supabase.from(table).select('id');
  if (error) throw error;

  let max = 0;
  for (const row of data ?? []) {
    const n = parseInt((row.id as string).replace(prefix, ''), 10);
    if (!isNaN(n) && n > max) max = n;
  }
  return `${prefix}${String(max + 1).padStart(3, '0')}`;
}

export async function generateNextClientId(): Promise<string> {
  return generateNextId('clients', 'C');
}

export async function generateNextActivityId(): Promise<string> {
  return generateNextId('activities', 'AL');
}

export async function getActivityTypes(): Promise<Lookup[]> {
  const { data, error } = await supabase.from('activity_types').select('*').order('display_order');
  if (error) throw error;
  return data as Lookup[];
}
