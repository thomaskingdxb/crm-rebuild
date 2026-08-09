'use client';

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { KpiChartPoint } from '@/lib/kpis';

export default function KpiChart({ data, year }: { data: KpiChartPoint[]; year: number }) {
  return (
    <div className="surface-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-medium text-zinc-500">Deals YTD ({year})</p>
        <div className="flex items-center gap-3 text-[10px] text-zinc-500">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-blue-400" /> Agreed
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400" /> Completed
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-400" /> Target
          </span>
        </div>
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
            <YAxis allowDecimals={false} stroke="rgba(255,255,255,0.3)" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                background: '#101015',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: '#e4e4e7' }}
            />
            <Line type="linear" dataKey="agreed" name="Deal Agreed" stroke="#60a5fa" strokeWidth={2} dot={{ r: 3 }} />
            <Line
              type="linear"
              dataKey="completed"
              name="Deal Completed"
              stroke="#34d399"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
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
