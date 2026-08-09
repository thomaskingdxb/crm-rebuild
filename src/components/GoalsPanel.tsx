'use client';

import { useState, useTransition } from 'react';
import type { Goal } from '@/types/database';
import { upsertGoalAction, deleteGoalAction } from '@/app/kpis/actions';
import ConfirmButton from '@/components/ConfirmButton';

const inputClass =
  'w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';
const labelClass = 'block text-xs font-medium text-zinc-400 mb-1';

const METRIC_LABELS: Record<Goal['metric'], string> = {
  deals_agreed: 'Deals Agreed',
  deals_completed: 'Deals Completed',
  revenue: 'Revenue',
};

const PERIOD_LABELS: Record<Goal['period_type'], string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  annual: 'Annual',
};

export default function GoalsPanel({ goals, defaultPeriodStart }: { goals: Goal[]; defaultPeriodStart: Record<Goal['period_type'], string> }) {
  const [pending, startTransition] = useTransition();
  const [periodType, setPeriodType] = useState<Goal['period_type']>('monthly');

  return (
    <div className="surface-card p-4">
      <p className="mb-3 text-xs font-medium text-zinc-500">Targets</p>

      <form
        action={(formData) => startTransition(() => upsertGoalAction(formData))}
        className="mb-4 grid grid-cols-2 gap-3 border-b border-white/5 pb-4 sm:grid-cols-4"
      >
        <div>
          <label className={labelClass}>Period</label>
          <select
            name="period_type"
            className={inputClass}
            value={periodType}
            onChange={(e) => setPeriodType(e.target.value as Goal['period_type'])}
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="annual">Annual</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Starting</label>
          <input
            name="period_start"
            type="date"
            defaultValue={defaultPeriodStart[periodType]}
            key={periodType}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Metric</label>
          <select name="metric" className={inputClass} defaultValue="deals_completed">
            <option value="deals_agreed">Deals Agreed</option>
            <option value="deals_completed">Deals Completed</option>
            <option value="revenue">Revenue</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Target</label>
          <input name="target_value" type="number" step="any" required className={inputClass} />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="col-span-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 sm:col-span-4"
        >
          Save Target
        </button>
      </form>

      <div className="space-y-2">
        {goals.length === 0 && <p className="text-xs text-zinc-600">No targets set yet.</p>}
        {goals.map((g) => (
          <div key={g.id} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm">
            <div>
              <span className="font-medium text-zinc-100">{g.target_value.toLocaleString()}</span>{' '}
              <span className="text-zinc-500">
                {METRIC_LABELS[g.metric]} · {PERIOD_LABELS[g.period_type]} · {g.period_start}
              </span>
            </div>
            <ConfirmButton
              label="Delete"
              message={`Delete this ${PERIOD_LABELS[g.period_type].toLowerCase()} target?`}
              confirmLabel="Delete"
              disabled={pending}
              onConfirm={() => startTransition(() => deleteGoalAction(g.id))}
              className="rounded-lg bg-rose-500/10 px-2 py-1 text-[10px] font-medium text-rose-400 ring-1 ring-inset ring-rose-500/20 transition hover:bg-rose-500/20"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
