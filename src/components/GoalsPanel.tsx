'use client';

import { useMemo, useState, useTransition } from 'react';
import type { Goal } from '@/types/database';
import { upsertGoalAction, deleteGoalAction, upsertRecurringGoalAction, deleteGoalGroupAction } from '@/app/kpis/actions';
import { monthsBetween } from '@/lib/kpis';
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

function tabClass(active: boolean) {
  return `rounded-lg px-3 py-1.5 text-xs font-medium transition ${
    active ? 'bg-blue-500/20 text-blue-300' : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300'
  }`;
}

function monthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'short', year: 'numeric' });
}

interface GoalGroup {
  groupId: string;
  metric: Goal['metric'];
  startMonth: string;
  endMonth: string;
  amountPerMonth: number;
  total: number;
  goals: Goal[];
}

function groupGoals(goals: Goal[]): { groups: GoalGroup[]; singles: Goal[] } {
  const groupMap = new Map<string, Goal[]>();
  const singles: Goal[] = [];

  for (const g of goals) {
    if (g.group_id) {
      const arr = groupMap.get(g.group_id) ?? [];
      arr.push(g);
      groupMap.set(g.group_id, arr);
    } else {
      singles.push(g);
    }
  }

  const groups: GoalGroup[] = Array.from(groupMap.entries()).map(([groupId, members]) => {
    const sorted = [...members].sort((a, b) => a.period_start.localeCompare(b.period_start));
    return {
      groupId,
      metric: sorted[0].metric,
      startMonth: sorted[0].period_start.slice(0, 7),
      endMonth: sorted[sorted.length - 1].period_start.slice(0, 7),
      amountPerMonth: sorted[0].target_value,
      total: sorted.reduce((sum, g) => sum + g.target_value, 0),
      goals: sorted,
    };
  });
  groups.sort((a, b) => b.startMonth.localeCompare(a.startMonth));

  return { groups, singles };
}

export default function GoalsPanel({ goals, defaultPeriodStart }: { goals: Goal[]; defaultPeriodStart: Record<Goal['period_type'], string> }) {
  const [pending, startTransition] = useTransition();
  const [periodType, setPeriodType] = useState<Goal['period_type']>('monthly');
  const [mode, setMode] = useState<'recurring' | 'one_off'>('recurring');

  const thisMonth = new Date().toISOString().slice(0, 7);
  const nextYear = `${new Date().getFullYear()}-12`;
  const [startMonth, setStartMonth] = useState(thisMonth);
  const [endMonth, setEndMonth] = useState(nextYear);
  const [amountPerMonth, setAmountPerMonth] = useState<string>('');

  const monthCount = useMemo(() => {
    if (!startMonth || !endMonth || startMonth > endMonth) return 0;
    return monthsBetween(startMonth, endMonth).length;
  }, [startMonth, endMonth]);
  const total = monthCount * (Number(amountPerMonth) || 0);

  const { groups, singles } = useMemo(() => groupGoals(goals), [goals]);

  return (
    <div className="surface-card p-4">
      <p className="mb-3 text-xs font-medium text-zinc-500">Targets</p>

      <div className="mb-4 flex items-center gap-1 rounded-lg bg-white/5 p-1">
        <button type="button" className={tabClass(mode === 'recurring')} onClick={() => setMode('recurring')}>
          Recurring Monthly
        </button>
        <button type="button" className={tabClass(mode === 'one_off')} onClick={() => setMode('one_off')}>
          One-off
        </button>
      </div>

      {mode === 'recurring' ? (
        <form
          action={(formData) => startTransition(() => upsertRecurringGoalAction(formData))}
          className="mb-4 space-y-3 border-b border-white/5 pb-4"
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className={labelClass}>From</label>
              <input
                name="start_month"
                type="month"
                value={startMonth}
                onChange={(e) => setStartMonth(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>To</label>
              <input
                name="end_month"
                type="month"
                value={endMonth}
                onChange={(e) => setEndMonth(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Metric</label>
              <select name="metric" className={inputClass} defaultValue="revenue">
                <option value="deals_agreed">Deals Agreed</option>
                <option value="deals_completed">Deals Completed</option>
                <option value="revenue">Revenue</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Amount / month</label>
              <input
                name="amount_per_month"
                type="number"
                step="any"
                required
                value={amountPerMonth}
                onChange={(e) => setAmountPerMonth(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          {monthCount > 0 && (
            <p className="text-xs text-zinc-500">
              Applies to <span className="text-zinc-300">{monthCount}</span> month{monthCount === 1 ? '' : 's'} ({monthLabel(startMonth)} –{' '}
              {monthLabel(endMonth)}) · Total <span className="text-zinc-300">{total.toLocaleString()}</span>
            </p>
          )}
          <button
            type="submit"
            disabled={pending || monthCount === 0}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
          >
            Save Recurring Target
          </button>
        </form>
      ) : (
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
      )}

      <div className="space-y-2">
        {groups.length === 0 && singles.length === 0 && <p className="text-xs text-zinc-600">No targets set yet.</p>}

        {groups.map((g) => (
          <div key={g.groupId} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm">
            <div>
              <span className="font-medium text-zinc-100">{g.amountPerMonth.toLocaleString()}</span>{' '}
              <span className="text-zinc-500">
                {METRIC_LABELS[g.metric]}/mo · {monthLabel(g.startMonth)} – {monthLabel(g.endMonth)} · Total{' '}
                {g.total.toLocaleString()}
              </span>
            </div>
            <ConfirmButton
              label="Delete"
              message={`Delete all ${g.goals.length} months of this recurring target?`}
              confirmLabel="Delete"
              disabled={pending}
              onConfirm={() => startTransition(() => deleteGoalGroupAction(g.groupId))}
              className="rounded-lg bg-rose-500/10 px-2 py-1 text-[10px] font-medium text-rose-400 ring-1 ring-inset ring-rose-500/20 transition hover:bg-rose-500/20"
            />
          </div>
        ))}

        {singles.map((g) => (
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
