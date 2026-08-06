import Link from 'next/link';
import type { DealWithRelations } from '@/types/database';
import { grossCommission } from '@/lib/deals';

export default function DealKanbanCard({
  deal,
  onDragStart,
}: {
  deal: DealWithRelations;
  onDragStart: (e: React.DragEvent, dealId: string) => void;
}) {
  const gross = grossCommission(deal);

  return (
    <Link
      href={`/deals/${deal.id}`}
      draggable
      onDragStart={(e) => onDragStart(e, deal.id)}
      className="block cursor-grab rounded-xl bg-gradient-to-br from-[#1c2438] via-[#15161e] to-[#101014] p-3 shadow-lg shadow-black/40 ring-1 ring-white/5 transition hover:ring-white/10 hover:from-[#212c47] active:cursor-grabbing"
    >
      <p className="truncate text-sm font-semibold text-zinc-100">
        {deal.properties ? `${deal.properties.building ?? 'Unnamed'} ${deal.properties.unit_number ? `· ${deal.properties.unit_number}` : ''}` : 'No property'}
      </p>
      <p className="mt-0.5 truncate text-xs text-zinc-500">{deal.owner ? deal.owner.name : 'No owner'}</p>
      <div className="mt-2 flex items-center justify-between">
        {deal.value ? <p className="text-xs font-semibold text-white">AED {deal.value.toLocaleString()}</p> : <span />}
        {gross !== null && <p className="text-[10px] text-zinc-500">AED {gross.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>}
      </div>
    </Link>
  );
}
