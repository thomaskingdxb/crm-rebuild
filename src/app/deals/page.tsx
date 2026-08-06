import Link from 'next/link';
import { getDeals, getDealLookups, computeDealStats } from '@/lib/deals';
import DealsKanban from '@/components/DealsKanban';
import DealStatsCards from '@/components/DealStatsCards';

export default async function DealsPage() {
  const [deals, lookups] = await Promise.all([getDeals(), getDealLookups()]);
  const stats = computeDealStats(deals);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-100">Deals</h1>
            <p className="text-sm text-zinc-500">{deals.length} total</p>
          </div>
          <Link
            href="/deals/new"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
          >
            + Add Deal
          </Link>
        </div>

        <DealStatsCards stats={stats} />

        <DealsKanban deals={deals} dealTypes={lookups.dealTypes} saleStages={lookups.saleStages} rentalStages={lookups.rentalStages} />
      </div>
    </div>
  );
}
