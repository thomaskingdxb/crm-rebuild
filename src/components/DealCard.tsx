import Link from 'next/link';
import type { DealWithRelations } from '@/types/database';
import { formatDate } from '@/lib/date';

const STAGE_STYLES: Record<string, string> = {
  'Closed - Won': 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
  'Closed - Lost': 'bg-white/5 text-zinc-400 ring-white/10',
  'Deal agreed': 'bg-blue-500/10 text-blue-400 ring-blue-500/20',
  Negotiating: 'bg-amber-500/10 text-amber-400 ring-amber-500/20',
  Unresponsive: 'bg-rose-500/10 text-rose-400 ring-rose-500/20',
};

export default function DealCard({ deal, role }: { deal: DealWithRelations; role?: string }) {
  const stages = deal.deal_lead_stages.map((s) => s.lead_stages.name);

  return (
    <Link
      href={`/deals/${deal.id}`}
      className="flex flex-col gap-3 rounded-2xl bg-gradient-to-br from-[#1c2438] via-[#15161e] to-[#101014] p-5 shadow-xl shadow-black/40 ring-1 ring-white/5 transition hover:ring-white/10 hover:from-[#212c47] sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold text-zinc-100">
          {deal.properties ? `${deal.properties.building ?? 'Unnamed'} ${deal.properties.unit_number ? `· ${deal.properties.unit_number}` : ''}` : 'No property'}
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          {deal.owner ? deal.owner.name : 'No owner'} → {deal.buyer ? deal.buyer.name : 'No buyer/tenant'}
        </p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {role && (
            <span className="inline-flex items-center rounded-full bg-purple-500/10 px-2 py-0.5 text-xs font-medium text-purple-400 ring-1 ring-inset ring-purple-500/20">
              {role}
            </span>
          )}
          {deal.deal_types && (
            <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-400 ring-1 ring-inset ring-blue-500/20">
              {deal.deal_types.name}
            </span>
          )}
          {stages.map((s) => (
            <span key={s} className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STAGE_STYLES[s] ?? 'bg-white/5 text-zinc-400 ring-white/10'}`}>
              {s}
            </span>
          ))}
        </div>
      </div>

      <div className="shrink-0 text-right text-sm">
        {deal.value && <p className="font-bold text-white">AED {deal.value.toLocaleString()}</p>}
        {deal.date_agreed && <p className="text-xs text-zinc-500">Agreed {formatDate(deal.date_agreed)}</p>}
      </div>
    </Link>
  );
}
