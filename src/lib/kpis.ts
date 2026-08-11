import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase as defaultClient } from '@/lib/supabase/client';
import { grossCommission } from '@/lib/deals';
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
    .select('date_agreed, date_completed, commission_amount, commission_percent, value')
    .or(`and(date_agreed.gte.${rangeStart},date_agreed.lte.${rangeEnd}),and(date_completed.gte.${rangeStart},date_completed.lte.${rangeEnd})`);
  if (error) throw error;

  const rows = data as {
    date_agreed: string | null;
    date_completed: string | null;
    commission_amount: number | null;
    commission_percent: number | null;
    value: number | null;
  }[];

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
    const commission = grossCommission(row) ?? 0;
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

// Inclusive list of 'YYYY-MM' keys between two 'YYYY-MM' (or 'YYYY-MM-DD') strings.
export function monthsBetween(start: string, end: string): string[] {
  const [startYear, startMonth] = start.slice(0, 7).split('-').map(Number);
  const [endYear, endMonth] = end.slice(0, 7).split('-').map(Number);

  const keys: string[] = [];
  let year = startYear;
  let month = startMonth;
  while (year < endYear || (year === endYear && month <= endMonth)) {
    keys.push(`${year}-${String(month).padStart(2, '0')}`);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return keys;
}

export interface MonthProgress {
  monthKey: string;
  label: string;
  target: number | null;
  actual: number;
  variance: number | null; // actual - target, null when no target set
}

export interface YearProgress {
  months: MonthProgress[]; // Jan..Dec of `year`
  yearlyTargetTotal: number; // sum of every month's target in `year` (0 if none set)
  cumulativeTargetToDate: number; // sum of targets for elapsed months (Jan..currentMonth, or full year if `year` is in the past)
  cumulativeActualToDate: number; // sum of actuals over the same elapsed months
  cumulativeVariance: number; // cumulativeActualToDate - cumulativeTargetToDate
}

// "Actual" is always the *completed* figure (deals closed / commission earned) — the metric
// that answers "what's actually been made", as opposed to deals merely agreed.
export function computeYearProgress(series: MonthlyPoint[], goals: Goal[], metric: KpiMetric, year: number): YearProgress {
  const goalMetric = metric === 'deals' ? 'deals_completed' : 'revenue';
  const targets = new Map<string, number>();
  for (const g of goals) {
    if (g.period_type === 'monthly' && g.metric === goalMetric && g.period_start.slice(0, 4) === String(year)) {
      targets.set(g.period_start.slice(0, 7), g.target_value);
    }
  }

  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const yearIsPast = year < now.getFullYear();

  const months: MonthProgress[] = [];
  let cumulativeTargetToDate = 0;
  let cumulativeActualToDate = 0;
  let yearlyTargetTotal = 0;

  for (let m = 0; m < 12; m++) {
    const monthKey = `${year}-${String(m + 1).padStart(2, '0')}`;
    const point = series.find((p) => p.monthKey === monthKey);
    const actual = point ? (metric === 'deals' ? point.dealsCompleted : point.revenueCompleted) : 0;
    const target = targets.get(monthKey) ?? null;

    if (target != null) yearlyTargetTotal += target;

    const elapsed = yearIsPast || monthKey <= currentMonthKey;
    if (elapsed) {
      cumulativeActualToDate += actual;
      if (target != null) cumulativeTargetToDate += target;
    }

    months.push({
      monthKey,
      label: MONTH_LABELS[m],
      target,
      actual,
      variance: target != null ? actual - target : null,
    });
  }

  return {
    months,
    yearlyTargetTotal,
    cumulativeTargetToDate,
    cumulativeActualToDate,
    cumulativeVariance: cumulativeActualToDate - cumulativeTargetToDate,
  };
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
