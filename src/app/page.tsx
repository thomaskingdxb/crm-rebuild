import Link from 'next/link';
import { getDashboardStats } from '@/lib/dashboard';

const STATUS_COLORS: Record<string, string> = {
  Ongoing: 'text-emerald-400',
  Closed: 'text-zinc-400',
  Unresponsive: 'text-rose-400',
};

function money(n: number): string {
  return `AED ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function StatCard({
  href,
  title,
  value,
  valueClassName,
  sub,
}: {
  href: string;
  title: string;
  value: string;
  valueClassName?: string;
  sub?: string;
}) {
  return (
    <Link href={href} className="surface-card p-5 transition hover:ring-1 hover:ring-white/20">
      <p className="text-xs font-medium text-zinc-400">{title}</p>
      <p className={`mt-1 text-3xl font-semibold ${valueClassName ?? 'text-zinc-100'}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-zinc-500">{sub}</p>}
    </Link>
  );
}

function SplitStatCard({
  href,
  title,
  left,
  leftLabel,
  right,
  rightLabel,
}: {
  href: string;
  title: string;
  left: string;
  leftLabel: string;
  right: string;
  rightLabel: string;
}) {
  return (
    <Link href={href} className="surface-card p-5 transition hover:ring-1 hover:ring-white/20">
      <p className="mb-3 text-xs font-medium text-zinc-400">{title}</p>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xl font-semibold text-zinc-100">{left}</p>
          <p className="text-[10px] text-zinc-500">{leftLabel}</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-semibold text-zinc-100">{right}</p>
          <p className="text-[10px] text-zinc-500">{rightLabel}</p>
        </div>
      </div>
    </Link>
  );
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="px-6 py-8">
        <h1 className="text-2xl font-semibold text-zinc-100">Dashboard</h1>
        <p className="mb-6 text-sm text-zinc-500">Overview across clients, pipeline, deals, and tasks.</p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard href="/clients" title="Total Clients" value={`${stats.totalClients}`} />
          <StatCard href="/properties" title="Total Properties" value={`${stats.totalProperties}`} />
          <StatCard href="/pipeline" title="Active Enquiries" value={`${stats.activeEnquiries}`} valueClassName="text-blue-400" />
          <SplitStatCard
            href="/follow-ups"
            title="Follow Ups"
            left={`${stats.followUpsOverdue}`}
            leftLabel="Overdue"
            right={`${stats.followUpsDueToday}`}
            rightLabel="Due Today"
          />
          <SplitStatCard
            href="/tasks"
            title="Tasks"
            left={`${stats.tasksOverdue}`}
            leftLabel="Overdue"
            right={`${stats.tasksDueToday}`}
            rightLabel="Due Today"
          />
          <SplitStatCard
            href="/deals"
            title="Deals Completed"
            left={`${stats.dealStats.salesCompleted}`}
            leftLabel="Sales"
            right={`${stats.dealStats.rentalsCompleted}`}
            rightLabel="Rentals"
          />
          <SplitStatCard
            href="/deals"
            title="Total Commission (Completed)"
            left={money(stats.dealStats.commissionGross)}
            leftLabel="Gross"
            right={money(stats.dealStats.commissionNet)}
            rightLabel="Net"
          />
          <Link href="/deals" className="surface-card p-5 transition hover:ring-1 hover:ring-white/20">
            <p className="mb-2 text-xs font-medium text-zinc-400">By Status</p>
            <div className="space-y-1">
              {stats.statusCounts.map((s) => (
                <div key={s.name} className="flex items-center justify-between text-sm">
                  <span className={STATUS_COLORS[s.name] ?? 'text-zinc-300'}>{s.name}</span>
                  <span className="font-medium text-zinc-200">{s.count}</span>
                </div>
              ))}
            </div>
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/clients/new" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500">
            + Add Client
          </Link>
          <Link href="/properties/new" className="rounded-lg bg-white/5 px-4 py-2 text-sm font-medium text-zinc-300 ring-1 ring-inset ring-white/10 transition hover:ring-white/20">
            + Add Property
          </Link>
          <Link href="/enquiries/new" className="rounded-lg bg-white/5 px-4 py-2 text-sm font-medium text-zinc-300 ring-1 ring-inset ring-white/10 transition hover:ring-white/20">
            + Add Enquiry
          </Link>
          <Link href="/deals/new" className="rounded-lg bg-white/5 px-4 py-2 text-sm font-medium text-zinc-300 ring-1 ring-inset ring-white/10 transition hover:ring-white/20">
            + Add Deal
          </Link>
        </div>
      </div>
    </div>
  );
}
