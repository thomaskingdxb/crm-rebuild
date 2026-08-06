'use client';

import { useState } from 'react';
import type { DealStage, DealWithRelations, Lookup } from '@/types/database';
import { formatDate } from '@/lib/date';
import { grossCommission, netCommission } from '@/lib/deals';
import DealDetailModal from '@/components/DealDetailModal';

export default function DealCard({
  deal,
  role,
  dealTypes,
  saleStages,
  rentalStages,
  clients,
  properties,
}: {
  deal: DealWithRelations;
  role?: string;
  dealTypes: Lookup[];
  saleStages: DealStage[];
  rentalStages: DealStage[];
  clients: { id: string; name: string }[];
  properties: { id: string; building: string | null; unit_number: string | null }[];
}) {
  const [open, setOpen] = useState(false);
  const gross = grossCommission(deal);
  const net = netCommission(deal);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex flex-col gap-3 rounded-2xl bg-gradient-to-br from-[#1c2438] via-[#15161e] to-[#101014] p-5 text-left shadow-xl shadow-black/40 ring-1 ring-white/5 transition hover:ring-white/10 hover:from-[#212c47] sm:flex-row sm:items-center sm:justify-between"
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
            {deal.deal_stages && (
              <span className="inline-flex items-center rounded-full bg-white/5 px-2 py-0.5 text-xs font-medium text-zinc-400 ring-1 ring-inset ring-white/10">
                {deal.deal_stages.name}
              </span>
            )}
          </div>
        </div>

        <div className="shrink-0 text-right text-sm">
          {deal.value && <p className="font-bold text-white">AED {deal.value.toLocaleString()}</p>}
          {gross !== null && <p className="text-xs text-zinc-500">Gross AED {gross.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>}
          {net !== null && <p className="text-xs text-zinc-600">Net AED {net.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>}
          {deal.date_agreed && <p className="text-xs text-zinc-500">Agreed {formatDate(deal.date_agreed)}</p>}
        </div>
      </button>

      <DealDetailModal
        deal={deal}
        dealTypes={dealTypes}
        saleStages={saleStages}
        rentalStages={rentalStages}
        clients={clients}
        properties={properties}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
