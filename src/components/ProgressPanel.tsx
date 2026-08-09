'use client';

import { useMemo, useState } from 'react';
import { computeYearProgress, type KpiMetric, type MonthlyPoint } from '@/lib/kpis';
import type { Goal } from '@/types/database';

function money(n: number): string {
  return `AED ${Math.round(n).toLocaleString()}`;
}

function fmt(n: number, metric: KpiMetric): string {
  return metric === 'revenue' ? money(n) : n.toLocaleString();
}

function selectClass(active: boolean) {
  return `rounded-lg px-2.5 py-1 text-xs font-medium transition ${
    active ? 'bg-blue-500/20 text-blue-300' : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300'
  }`;
}

function VarianceBadge({ variance, metric }: { variance: number; metric: KpiMetric }) {
  const isSurplus = variance >= 0;
  return (
    <span className={`text-xs font-medium ${isSurplus ? 'text-emerald-400' : 'text-rose-400'}`}>
      {isSurplus ? '+' : ''}
      {fmt(variance, metric)} {isSurplus ? 'ahead' : 'behind'}
    </span>
  );
}

export default function ProgressPanel({ series, goals }: { series: MonthlyPoint[]; goals: Goal[] }) {
  const [metric, setMetric] = useState<KpiMetric>('revenue');
  const year = new Date().getFullYear();

  const progress = useMemo(() => computeYearProgress(series, goals, metric, year), [series, goals, metric, year]);

  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const thisMonth = progress.months.find((m) => m.monthKey === currentMonthKey);

  const monthPct = thisMonth?.target ? Math.min(100, Math.max(0, Math.round((thisMonth.actual / thisMonth.target) * 100))) : null;
  const yearPct = progress.cumulativeTargetToDate
    ? Math.min(100, Math.max(0, Math.round((progress.cumulativeActualToDate / progress.cumulativeTargetToDate) * 100)))
    : null;
  const yearTotalPct = progress.yearlyTargetTotal
    ? Math.min(100, Math.max(0, Math.round((progress.cumulativeActualToDate / progress.yearlyTargetTotal) * 100)))
    : null;

  if (progress.yearlyTargetTotal === 0) {
    return (
      <div className="surface-card p-4">
        <div className="mb-1 flex items-center justify-between">
          <p className="text-xs font-medium text-zinc-500">Monthly vs Yearly Progress</p>
          <div className="flex items-center gap-1 rounded-lg bg-white/5 p-1">
            <button type="button" className={selectClass(metric === 'deals')} onClick={() => setMetric('deals')}>
              Deals
            </button>
            <button type="button" className={selectClass(metric === 'revenue')} onClick={() => setMetric('revenue')}>
              Revenue
            </button>
          </div>
        </div>
        <p className="mt-3 text-xs text-zinc-600">
          No {metric === 'revenue' ? 'revenue' : 'deals'} targets set for {year} yet — add a recurring monthly target below.
        </p>
      </div>
    );
  }

  return (
    <div className="surface-card p-4">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs font-medium text-zinc-500">Monthly vs Yearly Progress ({year})</p>
        <div className="flex items-center gap-1 rounded-lg bg-white/5 p-1">
          <button type="button" className={selectClass(metric === 'deals')} onClick={() => setMetric('deals')}>
            Deals
          </button>
          <button type="button" className={selectClass(metric === 'revenue')} onClick={() => setMetric('revenue')}>
            Revenue
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="text-[10px] font-medium text-zinc-500">This Month</p>
          <p className="mt-1 text-xl font-semibold text-zinc-100">
            {thisMonth ? fmt(thisMonth.actual, metric) : fmt(0, metric)}
            {thisMonth?.target != null && <span className="text-sm font-normal text-zinc-500"> / {fmt(thisMonth.target, metric)}</span>}
          </p>
          {thisMonth?.target != null && (
            <>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                <div className="h-full rounded-full bg-blue-400/80" style={{ width: `${monthPct ?? 0}%` }} />
              </div>
              <div className="mt-1">
                <VarianceBadge variance={thisMonth.variance ?? 0} metric={metric} />
              </div>
            </>
          )}
        </div>

        <div>
          <p className="text-[10px] font-medium text-zinc-500">Year to Date (vs. target-to-date)</p>
          <p className="mt-1 text-xl font-semibold text-zinc-100">
            {fmt(progress.cumulativeActualToDate, metric)}
            <span className="text-sm font-normal text-zinc-500"> / {fmt(progress.cumulativeTargetToDate, metric)}</span>
          </p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
            <div className="h-full rounded-full bg-amber-400/80" style={{ width: `${yearPct ?? 0}%` }} />
          </div>
          <div className="mt-1">
            <VarianceBadge variance={progress.cumulativeVariance} metric={metric} />
          </div>
        </div>
      </div>

      <div className="mt-4 border-t border-white/5 pt-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-500">Full year target</span>
          <span className="text-zinc-300">
            {fmt(progress.cumulativeActualToDate, metric)} of {fmt(progress.yearlyTargetTotal, metric)}
            {yearTotalPct != null && <span className="text-zinc-500"> ({yearTotalPct}%)</span>}
          </span>
        </div>
      </div>
    </div>
  );
}
