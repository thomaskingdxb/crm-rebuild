import type React from 'react';
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

const iconProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const ICONS: Record<string, React.ReactNode> = {
  clients: (
    <svg {...iconProps}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="10" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  properties: (
    <svg {...iconProps}>
      <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z" />
    </svg>
  ),
  enquiries: (
    <svg {...iconProps}>
      <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />
    </svg>
  ),
  followUps: (
    <svg {...iconProps}>
      <path d="M12 8v4l3 2" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  ),
  tasks: (
    <svg {...iconProps}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="m8 12 3 3 5-6" />
    </svg>
  ),
  value: (
    <svg {...iconProps}>
      <path d="M2 8h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2Z" />
      <path d="M2 8V6a2 2 0 0 1 2-2h12" />
      <circle cx="15" cy="14" r="1.5" />
    </svg>
  ),
  commission: (
    <svg {...iconProps}>
      <path d="M19 5 5 19" />
      <circle cx="6.5" cy="6.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
    </svg>
  ),
};

function IconBadge({ icon }: { icon: keyof typeof ICONS }) {
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 ring-1 ring-inset ring-blue-500/20 [&_svg]:h-4 [&_svg]:w-4">
      {ICONS[icon]}
    </div>
  );
}

function CardHeader({ icon, title }: { icon: keyof typeof ICONS; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <IconBadge icon={icon} />
      <p className="text-xs font-medium text-zinc-400">{title}</p>
    </div>
  );
}

function StatCard({
  href,
  icon,
  title,
  value,
  valueClassName,
  sub,
  breakdown,
}: {
  href: string;
  icon: keyof typeof ICONS;
  title: string;
  value: string;
  valueClassName?: string;
  sub?: string;
  breakdown?: { name: string; count: number }[];
}) {
  return (
    <Link href={href} className="surface-card-accent p-5 transition hover:ring-1 hover:ring-blue-500/30">
      <CardHeader icon={icon} title={title} />
      <p className={`text-3xl font-semibold ${valueClassName ?? 'text-zinc-100'}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-zinc-500">{sub}</p>}
      {breakdown && (
        <div className="mt-3 space-y-1 border-t border-white/5 pt-3">
          {breakdown.map((s) => (
            <div key={s.name} className="flex items-center justify-between text-xs">
              <span className={STATUS_COLORS[s.name] ?? 'text-zinc-400'}>{s.name}</span>
              <span className="font-medium text-zinc-300">{s.count}</span>
            </div>
          ))}
        </div>
      )}
    </Link>
  );
}

function SplitStatCard({
  href,
  icon,
  title,
  left,
  leftLabel,
  right,
  rightLabel,
}: {
  href: string;
  icon: keyof typeof ICONS;
  title: string;
  left: string;
  leftLabel: string;
  right: string;
  rightLabel: string;
}) {
  return (
    <Link href={href} className="surface-card-accent p-5 transition hover:ring-1 hover:ring-blue-500/30">
      <CardHeader icon={icon} title={title} />
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

function ValueStatCard({
  href,
  title,
  leftLabel,
  leftCompleted,
  leftPending,
  rightLabel,
  rightCompleted,
  rightPending,
}: {
  href: string;
  title: string;
  leftLabel: string;
  leftCompleted: number;
  leftPending: number;
  rightLabel: string;
  rightCompleted: number;
  rightPending: number;
}) {
  return (
    <Link href={href} className="surface-card-accent p-5 transition hover:ring-1 hover:ring-blue-500/30">
      <CardHeader icon="value" title={title} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xl font-semibold text-zinc-100">{money(leftCompleted)}</p>
          <p className="text-[10px] text-zinc-500">{leftLabel} completed</p>
          <p className="mt-1 text-xs text-zinc-500">{money(leftPending)} pending</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-semibold text-zinc-100">{money(rightCompleted)}</p>
          <p className="text-[10px] text-zinc-500">{rightLabel} completed</p>
          <p className="mt-1 text-xs text-zinc-500">{money(rightPending)} pending</p>
        </div>
      </div>
    </Link>
  );
}

function CommissionStatCard({
  href,
  grossCompleted,
  netCompleted,
  grossPending,
  netPending,
}: {
  href: string;
  grossCompleted: number;
  netCompleted: number;
  grossPending: number;
  netPending: number;
}) {
  return (
    <Link href={href} className="surface-card-accent p-5 transition hover:ring-1 hover:ring-blue-500/30">
      <CardHeader icon="commission" title="Total Commission" />
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <div>
          <p className="text-xl font-semibold text-zinc-100">{money(grossCompleted)}</p>
          <p className="text-[10px] text-zinc-500">Gross completed</p>
        </div>
        <div>
          <p className="text-xl font-semibold text-zinc-100">{money(netCompleted)}</p>
          <p className="text-[10px] text-zinc-500">Net completed</p>
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-400">{money(grossPending)}</p>
          <p className="text-[10px] text-zinc-500">Gross pending</p>
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-400">{money(netPending)}</p>
          <p className="text-[10px] text-zinc-500">Net pending</p>
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
          <StatCard href="/clients" icon="clients" title="Total Clients" value={`${stats.totalClients}`} valueClassName="text-blue-300" breakdown={stats.statusCounts} />
          <StatCard href="/properties" icon="properties" title="Total Properties" value={`${stats.totalProperties}`} valueClassName="text-blue-300" />
          <StatCard href="/pipeline" icon="enquiries" title="Active Enquiries" value={`${stats.activeEnquiries}`} valueClassName="text-blue-400" />
          <SplitStatCard
            href="/follow-ups"
            icon="followUps"
            title="Follow Ups"
            left={`${stats.followUpsOverdue}`}
            leftLabel="Overdue"
            right={`${stats.followUpsDueToday}`}
            rightLabel="Due Today"
          />
          <SplitStatCard
            href="/tasks"
            icon="tasks"
            title="Tasks"
            left={`${stats.tasksOverdue}`}
            leftLabel="Overdue"
            right={`${stats.tasksDueToday}`}
            rightLabel="Due Today"
          />
          <ValueStatCard
            href="/deals"
            title="Sales & Rental Value"
            leftLabel="Sales"
            leftCompleted={stats.dealStats.salesValueCompleted}
            leftPending={stats.dealStats.salesValuePending}
            rightLabel="Rentals"
            rightCompleted={stats.dealStats.rentalsValueCompleted}
            rightPending={stats.dealStats.rentalsValuePending}
          />
          <CommissionStatCard
            href="/deals"
            grossCompleted={stats.dealStats.commissionGross}
            netCompleted={stats.dealStats.commissionNet}
            grossPending={stats.dealStats.commissionGrossPending}
            netPending={stats.dealStats.commissionNetPending}
          />
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
