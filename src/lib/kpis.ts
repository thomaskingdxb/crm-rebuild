import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase as defaultClient } from '@/lib/supabase/client';
import type { Goal, Achievement } from '@/types/database';

export async function getGoals(db: SupabaseClient = defaultClient): Promise<Goal[]> {
  const { data, error } = await db.from('goals').select('*').order('period_start', { ascending: false });
  if (error) throw error;
  return data as Goal[];
}

export async function getAchievements(db: SupabaseClient = defaultClient): Promise<Achievement[]> {
  const { data, error } = await db.from('achievements').select('*').order('achieved_date', { ascending: false });
  if (error) throw error;
  return data as Achievement[];
}

export interface MonthlyDealCounts {
  month: string; // 'YYYY-MM-01'
  agreed: number;
  completed: number;
}

export async function getYtdMonthlyDealCounts(
  year: number,
  db: SupabaseClient = defaultClient
): Promise<MonthlyDealCounts[]> {
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;

  const { data, error } = await db
    .from('deals')
    .select('date_agreed, date_completed')
    .or(
      `and(date_agreed.gte.${yearStart},date_agreed.lte.${yearEnd}),and(date_completed.gte.${yearStart},date_completed.lte.${yearEnd})`
    );
  if (error) throw error;

  const rows = data as { date_agreed: string | null; date_completed: string | null }[];
  const currentMonth = new Date().getFullYear() === year ? new Date().getMonth() : 11;
  const months: MonthlyDealCounts[] = Array.from({ length: currentMonth + 1 }, (_, i) => ({
    month: `${year}-${String(i + 1).padStart(2, '0')}-01`,
    agreed: 0,
    completed: 0,
  }));

  for (const row of rows) {
    if (row.date_agreed?.startsWith(`${year}-`)) {
      const idx = parseInt(row.date_agreed.slice(5, 7), 10) - 1;
      if (months[idx]) months[idx].agreed += 1;
    }
    if (row.date_completed?.startsWith(`${year}-`)) {
      const idx = parseInt(row.date_completed.slice(5, 7), 10) - 1;
      if (months[idx]) months[idx].completed += 1;
    }
  }

  return months;
}

export interface KpiChartPoint {
  month: string; // e.g. 'Jan'
  agreed: number;
  completed: number;
  target: number | null;
}

export function buildKpiChartData(counts: MonthlyDealCounts[], goals: Goal[]): KpiChartPoint[] {
  const monthlyTargets = new Map<string, number>();
  for (const g of goals) {
    if (g.period_type === 'monthly' && g.metric === 'deals_completed') {
      monthlyTargets.set(g.period_start.slice(0, 7), g.target_value);
    }
  }

  const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return counts.map((c) => {
    const monthKey = c.month.slice(0, 7);
    const monthIdx = parseInt(c.month.slice(5, 7), 10) - 1;
    return {
      month: labels[monthIdx],
      agreed: c.agreed,
      completed: c.completed,
      target: monthlyTargets.get(monthKey) ?? null,
    };
  });
}

export function periodStartFor(periodType: Goal['period_type'], date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = date.getMonth();
  if (periodType === 'monthly') {
    return `${year}-${String(month + 1).padStart(2, '0')}-01`;
  }
  if (periodType === 'quarterly') {
    const qStartMonth = Math.floor(month / 3) * 3;
    return `${year}-${String(qStartMonth + 1).padStart(2, '0')}-01`;
  }
  return `${year}-01-01`;
}
