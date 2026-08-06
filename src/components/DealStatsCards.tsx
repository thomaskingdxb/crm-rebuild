import type { DealStats } from '@/lib/deals';

function money(n: number): string {
  return `AED ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function StatCard({
  title,
  left,
  right,
  leftLabel,
  rightLabel,
  pendingLeft,
  pendingRight,
}: {
  title: string;
  left: string;
  right: string;
  leftLabel: string;
  rightLabel: string;
  pendingLeft: string;
  pendingRight: string;
}) {
  return (
    <div className="rounded-2xl bg-[#14141c] p-4 shadow-xl shadow-black/40 ring-1 ring-white/5">
      <p className="mb-3 text-xs font-medium text-zinc-500">{title}</p>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-lg font-semibold text-zinc-100">{left}</p>
          <p className="text-[10px] text-zinc-500">{leftLabel}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-zinc-100">{right}</p>
          <p className="text-[10px] text-zinc-500">{rightLabel}</p>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between gap-4 border-t border-white/5 pt-2">
        <p className="text-[10px] text-amber-400/80">{pendingLeft} <span className="text-zinc-600">pending</span></p>
        <p className="text-[10px] text-amber-400/80">{pendingRight} <span className="text-zinc-600">pending</span></p>
      </div>
    </div>
  );
}

export default function DealStatsCards({ stats }: { stats: DealStats }) {
  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Deals Completed"
        left={`${stats.salesCompleted}`}
        leftLabel="Sales"
        right={`${stats.rentalsCompleted}`}
        rightLabel="Rentals"
        pendingLeft={`${stats.salesPending}`}
        pendingRight={`${stats.rentalsPending}`}
      />
      <StatCard
        title="Completed Gross Comms"
        left={money(stats.salesGrossComms)}
        leftLabel="Sales"
        right={money(stats.rentalsGrossComms)}
        rightLabel="Rentals"
        pendingLeft={money(stats.salesGrossPending)}
        pendingRight={money(stats.rentalsGrossPending)}
      />
      <StatCard
        title="Completed Net Comms"
        left={money(stats.salesNetComms)}
        leftLabel="Sales"
        right={money(stats.rentalsNetComms)}
        rightLabel="Rentals"
        pendingLeft={money(stats.salesNetPending)}
        pendingRight={money(stats.rentalsNetPending)}
      />
      <StatCard
        title="Total Commission (Completed)"
        left={money(stats.commissionGross)}
        leftLabel="Gross"
        right={money(stats.commissionNet)}
        rightLabel="Net"
        pendingLeft={money(stats.commissionGrossPending)}
        pendingRight={money(stats.commissionNetPending)}
      />
    </div>
  );
}
