import { supabase } from '@/lib/supabase/client';

export interface DashboardStats {
  totalClients: number;
  statusCounts: { name: string; count: number }[];
  followUpsDue: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const today = new Date().toISOString().slice(0, 10);

  const [clientsRes, statusLinksRes, followUpsRes] = await Promise.all([
    supabase.from('clients').select('id', { count: 'exact', head: true }),
    supabase.from('client_client_statuses').select('client_statuses ( name )'),
    supabase.from('clients').select('id', { count: 'exact', head: true }).lte('follow_up_date', today).not('follow_up_date', 'is', null),
  ]);

  if (clientsRes.error) throw clientsRes.error;
  if (statusLinksRes.error) throw statusLinksRes.error;
  if (followUpsRes.error) throw followUpsRes.error;

  const statusCountMap = new Map<string, number>();
  for (const row of (statusLinksRes.data ?? []) as unknown as { client_statuses: { name: string } | null }[]) {
    const name = row.client_statuses?.name;
    if (!name) continue;
    statusCountMap.set(name, (statusCountMap.get(name) ?? 0) + 1);
  }

  return {
    totalClients: clientsRes.count ?? 0,
    statusCounts: [...statusCountMap.entries()].map(([name, count]) => ({ name, count })),
    followUpsDue: followUpsRes.count ?? 0,
  };
}
