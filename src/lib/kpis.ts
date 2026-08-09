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

export interface MonthlyPoint {
  monthKey: string; // 'YYYY-MM'
  year: number;
  label: string; // e.g. 'Jan 2026'
  dealsAgreed: number;
  dealsCompleted: number;
  revenueAgreed: number;
  revenueCompleted: number;
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Builds a monthly series spanning Jan of last year through Dec of this year, so the
// chart can offer YTD / rolling-12-months / full-calendar-year views without refetching.
export async function getMonthlySeries(db: SupabaseClient = defaultClient): Promise<MonthlyPoint[]> {
  const now = new Date();
  const currentYear = now.getFullYear();
  const rangeStartYear = currentYear - 1;
  const rangeStart = `${rangeStartYear}-01-01`;
  const rangeEnd = `${currentYear}-12-31`;

  const { data, error } = await db
    .from('deals')
    .select('date_agreed, date_completed, commission_amount')
    .or(`and(date_agreed.gte.${rangeStart},date_agreed.lte.${rangeEnd}),and(date_completed.gte.${rangeStart},date_completed.lte.${rangeEnd})`);
  if (error) throw error;

  const rows = data as { date_agreed: string | null; date_completed: string | null; commission_amount: number | null }[];

  const months: MonthlyPoint[] = [];
  for (let year = rangeStartYear; year <= currentYear; year++) {
    for (let m = 0; m < 12; m++) {
      months.push({
        monthKey: `${year}-${String(m + 1).padStart(2, '0')}`,
        year,
        label: `${MONTH_LABELS[m]} ${year}`,
        dealsAgreed: 0,
        dealsCompleted: 0,
        revenueAgreed: 0,
        revenueCompleted: 0,
      });
    }
  }
  const byKey = new Map(months.map((m) => [m.monthKey, m]));

  for (const row of rows) {
    const commission = row.commission_amount ?? 0;
    if (row.date_agreed) {
      const point = byKey.get(row.date_agreed.slice(0, 7));
      if (point) {
        point.dealsAgreed += 1;
        point.revenueAgreed += commission;
      }
    }
    if (row.date_completed) {
      const point = byKey.get(row.date_completed.slice(0, 7));
      if (point) {
        point.dealsCompleted += 1;
        point.revenueCompleted += commission;
      }
    }
  }

  return months;
}

export type KpiMetric = 'deals' | 'revenue';
export type KpiDuration = 'ytd' | 'year' | 'last_12';

export interface KpiChartPoint {
  month: string; // e.g. 'Jan'
  agreed: number;
  completed: number;
  target: number | null;
}

export function selectSeriesForDuration(series: MonthlyPoint[], duration: KpiDuration): MonthlyPoint[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthKey = `${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const upToNow = series.filter((m) => m.monthKey <= currentMonthKey);

  if (duration === 'year') return series.filter((m) => m.year === currentYear);
  if (duration === 'last_12') return upToNow.slice(-12);
  return upToNow.filter((m) => m.year === currentYear); // ytd
}

export function buildKpiChartData(series: MonthlyPoint[], goals: Goal[], metric: KpiMetric): KpiChartPoint[] {
  const goalMetric = metric === 'deals' ? 'deals_completed' : 'revenue';
  const monthlyTargets = new Map<string, number>();
  for (const g of goals) {
    if (g.period_type === 'monthly' && g.metric === goalMetric) {
      monthlyTargets.set(g.period_start.slice(0, 7), g.target_value);
    }
  }

  return series.map((m) => ({
    month: m.label,
    agreed: metric === 'deals' ? m.dealsAgreed : m.revenueAgreed,
    completed: metric === 'deals' ? m.dealsCompleted : m.revenueCompleted,
    target: monthlyTargets.get(m.monthKey) ?? null,
  }));
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
