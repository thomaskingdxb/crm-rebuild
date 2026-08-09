import { createClient } from '@/lib/supabase/server';
import { getGoals, getAchievements, getYtdMonthlyDealCounts, buildKpiChartData, periodStartFor } from '@/lib/kpis';
import KpiChart from '@/components/KpiChart';
import KpiStatCards from '@/components/KpiStatCards';
import GoalsPanel from '@/components/GoalsPanel';
import AchievementsPanel from '@/components/AchievementsPanel';

export default async function KpisPage() {
  const supabase = await createClient();
  const year = new Date().getFullYear();

  const [goals, achievements, monthCounts] = await Promise.all([
    getGoals(supabase),
    getAchievements(supabase),
    getYtdMonthlyDealCounts(year, supabase),
  ]);

  const chartData = buildKpiChartData(monthCounts, goals);
  const currentMonthCounts = monthCounts[monthCounts.length - 1];
  const monthLabel = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const defaultPeriodStart = {
    monthly: periodStartFor('monthly'),
    quarterly: periodStartFor('quarterly'),
    annual: periodStartFor('annual'),
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-zinc-100">KPIs</h1>
          <p className="text-sm text-zinc-500">Targets, progress, and wins</p>
        </div>

        <KpiStatCards monthCounts={currentMonthCounts} yearCounts={monthCounts} goals={goals} monthLabel={monthLabel} />

        <div className="mb-6">
          <KpiChart data={chartData} year={year} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <GoalsPanel goals={goals} defaultPeriodStart={defaultPeriodStart} />
          <AchievementsPanel achievements={achievements} />
        </div>
      </div>
    </div>
  );
}
