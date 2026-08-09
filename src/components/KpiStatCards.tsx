import type { Goal } from '@/types/database';
import type { MonthlyPoint } from '@/lib/kpis';

function progressPct(actual: number, target: number | null): number | null {
  if (target == null || target <= 0) return null;
  return Math.min(100, Math.round((actual / target) * 100));
}

function StatCard({ title, value, sub, target }: { title: string; value: string; sub: string; target?: { pct: number | null; label: string } }) {
  return (
    <div className="surface-card p-4">
      <p className="mb-2 text-xs font-medium text-zinc-500">{title}</p>
      <p className="text-2xl font-semibold text-zinc-100">{value}</p>
      <p className="mt-1 text-[10px] text-zinc-500">{sub}</p>
      {target && (
        <div className="mt-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-amber-400/80"
              style={{ width: `${target.pct ?? 0}%` }}
            />
          </div>
          <p className="mt-1 text-[10px] text-zinc-500">{target.label}</p>
        </div>
      )}
    </div>
  );
}

export default function KpiStatCards({ series, goals }: { series: MonthlyPoint[]; goals: Goal[] }) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthKey = `${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthLabel = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const monthPoint = series.find((m) => m.monthKey === currentMonthKey);
  const ytdPoints = series.filter((m) => m.year === currentYear && m.monthKey <= currentMonthKey);

  const ytdAgreed = ytdPoints.reduce((sum, m) => sum + m.dealsAgreed, 0);
  const ytdCompleted = ytdPoints.reduce((sum, m) => sum + m.dealsCompleted, 0);

  const monthlyTarget = goals.find(
    (g) => g.period_type === 'monthly' && g.metric === 'deals_completed' && g.period_start.slice(0, 7) === currentMonthKey
  );
  const annualTarget = goals.find((g) => g.period_type === 'annual' && g.metric === 'deals_completed');

  const monthPct = progressPct(monthPoint?.dealsCompleted ?? 0, monthlyTarget?.target_value ?? null);
  const yearPct = progressPct(ytdCompleted, annualTarget?.target_value ?? null);

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard title="Deals Agreed (Month)" value={`${monthPoint?.dealsAgreed ?? 0}`} sub={monthLabel} />
      <StatCard
        title="Deals Completed (Month)"
        value={`${monthPoint?.dealsCompleted ?? 0}`}
        sub={monthLabel}
        target={
          monthlyTarget
            ? { pct: monthPct, label: `${monthPoint?.dealsCompleted ?? 0} of ${monthlyTarget.target_value} target` }
            : undefined
        }
      />
      <StatCard title="Deals Agreed (YTD)" value={`${ytdAgreed}`} sub="Year to date" />
      <StatCard
        title="Deals Completed (YTD)"
        value={`${ytdCompleted}`}
        sub="Year to date"
        target={
          annualTarget ? { pct: yearPct, label: `${ytdCompleted} of ${annualTarget.target_value} target` } : undefined
        }
      />
    </div>
  );
}
