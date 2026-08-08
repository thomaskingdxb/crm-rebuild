import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase as defaultClient } from '@/lib/supabase/client';
import { getEnquiries, CLOSED_LEAD_STAGE_NAMES } from '@/lib/enquiries';
import { getDeals, computeDealStats } from '@/lib/deals';
import { getTasks } from '@/lib/tasks';
import type { DealStats } from '@/lib/deals';

export interface DashboardStats {
  totalClients: number;
  statusCounts: { name: string; count: number }[];
  followUpsDueToday: number;
  followUpsOverdue: number;
  totalProperties: number;
  activeEnquiries: number;
  tasksDueToday: number;
  tasksOverdue: number;
  dealStats: DealStats;
}

export async function getDashboardStats(db: SupabaseClient = defaultClient): Promise<DashboardStats> {
  const today = new Date().toISOString().slice(0, 10);

  const [clientsRes, statusLinksRes, followUpsTodayRes, followUpsOverdueRes, propertiesRes, enquiries, deals, tasks] = await Promise.all([
    db.from('clients').select('id', { count: 'exact', head: true }),
    db.from('client_client_statuses').select('client_statuses ( name )'),
    db.from('clients').select('id', { count: 'exact', head: true }).eq('follow_up_date', today),
    db.from('clients').select('id', { count: 'exact', head: true }).lt('follow_up_date', today),
    db.from('properties').select('id', { count: 'exact', head: true }),
    getEnquiries(db),
    getDeals(db),
    getTasks(db),
  ]);

  if (clientsRes.error) throw clientsRes.error;
  if (statusLinksRes.error) throw statusLinksRes.error;
  if (followUpsTodayRes.error) throw followUpsTodayRes.error;
  if (followUpsOverdueRes.error) throw followUpsOverdueRes.error;
  if (propertiesRes.error) throw propertiesRes.error;

  const statusCountMap = new Map<string, number>();
  for (const row of (statusLinksRes.data ?? []) as unknown as { client_statuses: { name: string } | null }[]) {
    const name = row.client_statuses?.name;
    if (!name) continue;
    statusCountMap.set(name, (statusCountMap.get(name) ?? 0) + 1);
  }

  const inactiveLeadStageNames = [...CLOSED_LEAD_STAGE_NAMES, 'Future prospect'];
  const activeEnquiries = enquiries.filter((e) => {
    const stageName = e.enquiry_lead_stages[0]?.lead_stages.name;
    return !stageName || !inactiveLeadStageNames.includes(stageName);
  }).length;

  const tasksDueToday = tasks.filter((t) => t.deadline_date === today).length;
  const tasksOverdue = tasks.filter((t) => t.deadline_date != null && t.deadline_date < today).length;

  return {
    totalClients: clientsRes.count ?? 0,
    statusCounts: [...statusCountMap.entries()].map(([name, count]) => ({ name, count })),
    followUpsDueToday: followUpsTodayRes.count ?? 0,
    followUpsOverdue: followUpsOverdueRes.count ?? 0,
    totalProperties: propertiesRes.count ?? 0,
    activeEnquiries,
    tasksDueToday,
    tasksOverdue,
    dealStats: computeDealStats(deals),
  };
}
