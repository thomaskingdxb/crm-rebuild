'use client';

import { useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { buildKpiChartData, selectSeriesForDuration, type KpiDuration, type KpiMetric, type MonthlyPoint } from '@/lib/kpis';
import type { Goal } from '@/types/database';

const DURATION_LABELS: Record<KpiDuration, string> = {
  ytd: 'Year to Date',
  year: 'Full Year',
  last_12: 'Last 12 Months',
};

function money(n: number): string {
  return `AED ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function selectClass(active: boolean) {
  return `rounded-lg px-2.5 py-1 text-xs font-medium transition ${
    active ? 'bg-blue-500/20 text-blue-300' : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300'
  }`;
}

export default function KpiChart({
  series,
  goals,
  defaultMetric = 'deals',
  defaultDuration = 'ytd',
}: {
  series: MonthlyPoint[];
  goals: Goal[];
  defaultMetric?: KpiMetric;
  defaultDuration?: KpiDuration;
}) {
  const [metric, setMetric] = useState<KpiMetric>(defaultMetric);
  const [duration, setDuration] = useState<KpiDuration>(defaultDuration);

  const data = useMemo(() => {
    const selected = selectSeriesForDuration(series, duration);
    return buildKpiChartData(selected, goals, metric);
  }, [series, goals, metric, duration]);

  const isRevenue = metric === 'revenue';
  const agreedLabel = isRevenue ? 'Revenue Agreed' : 'Deal Agreed';
  const completedLabel = isRevenue ? 'Revenue Completed' : 'Deal Completed';

  return (
    <div className="surface-card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-medium text-zinc-500">
          {isRevenue ? 'Revenue' : 'Deals'} — {DURATION_LABELS[duration]}
        </p>
        <div className="flex items-center gap-3 text-[10px] text-zinc-500">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-blue-400" /> {agreedLabel}
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400" /> {completedLabel}
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-400" /> Target
          </span>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1 rounded-lg bg-white/5 p-1">
          <button type="button" className={selectClass(metric === 'deals')} onClick={() => setMetric('deals')}>
            Deals
          </button>
          <button type="button" className={selectClass(metric === 'revenue')} onClick={() => setMetric('revenue')}>
            Revenue
          </button>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-white/5 p-1">
          <button type="button" className={selectClass(duration === 'ytd')} onClick={() => setDuration('ytd')}>
            YTD
          </button>
          <button type="button" className={selectClass(duration === 'last_12')} onClick={() => setDuration('last_12')}>
            Last 12 Months
          </button>
          <button type="button" className={selectClass(duration === 'year')} onClick={() => setDuration('year')}>
            Full Year
          </button>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
            <YAxis
              allowDecimals={false}
              stroke="rgba(255,255,255,0.3)"
              tick={{ fill: '#a1a1aa', fontSize: 11 }}
              tickFormatter={isRevenue ? (v: number) => v.toLocaleString() : undefined}
              width={isRevenue ? 56 : 28}
            />
            <Tooltip
              contentStyle={{
                background: '#101015',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: '#e4e4e7' }}
              formatter={(value) => (isRevenue ? money(Number(value)) : value)}
            />
            <Line type="linear" dataKey="agreed" name={agreedLabel} stroke="#60a5fa" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="linear" dataKey="completed" name={completedLabel} stroke="#34d399" strokeWidth={2} dot={{ r: 3 }} />
            <Line
              type="linear"
              dataKey="target"
              name="Monthly Target"
              stroke="#fbbf24"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={{ r: 3 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
