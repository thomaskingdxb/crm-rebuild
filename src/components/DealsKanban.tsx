'use client';

import { useMemo, useState } from 'react';
import type { DealWithRelations, DealStage, Lookup } from '@/types/database';
import { dealCategory } from '@/lib/deals';
import DealKanbanCard from '@/components/DealKanbanCard';

const pillClass = 'inline-flex cursor-pointer items-center rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition';
const pillInactive = 'text-zinc-400 ring-white/10 hover:ring-white/20';
const pillActive = 'bg-blue-500/20 text-blue-300 ring-blue-500/40';

function Lane({ title, stages, deals }: { title: string; stages: DealStage[]; deals: DealWithRelations[] }) {
  return (
    <div className="rounded-2xl bg-[#14141c] p-5 shadow-xl shadow-black/40 ring-1 ring-white/5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-200">
        {title} <span className="text-zinc-500">({deals.length})</span>
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {stages.map((stage) => {
          const stageDeals = deals.filter((d) => d.deal_stage_id === stage.id);
          return (
            <div key={stage.id} className="flex w-64 shrink-0 flex-col gap-3 rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/5">
              <p className="flex items-center justify-between text-xs font-medium text-zinc-400">
                <span>{stage.name}</span>
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] ring-1 ring-inset ring-white/10">{stageDeals.length}</span>
              </p>
              <div className="flex flex-col gap-2">
                {stageDeals.map((d) => (
                  <DealKanbanCard key={d.id} deal={d} />
                ))}
                {stageDeals.length === 0 && <p className="py-2 text-center text-xs text-zinc-600">—</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DealsKanban({
  deals,
  dealTypes,
  saleStages,
  rentalStages,
}: {
  deals: DealWithRelations[];
  dealTypes: Lookup[];
  saleStages: DealStage[];
  rentalStages: DealStage[];
}) {
  const [query, setQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<Set<number>>(new Set());

  function toggleType(id: number) {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const filtered = useMemo(() => {
    return deals.filter((d) => {
      const q = query.trim().toLowerCase();
      if (q) {
        const haystack = [d.id, d.owner?.name, d.buyer?.name, d.properties?.building, d.properties?.unit_number, d.notes]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (selectedTypes.size > 0 && !(d.deal_type_id && selectedTypes.has(d.deal_type_id))) return false;
      return true;
    });
  }, [deals, query, selectedTypes]);

  const saleDeals = filtered.filter((d) => dealCategory(d) === 'sale');
  const rentalDeals = filtered.filter((d) => dealCategory(d) === 'rental');
  const unassignedDeals = filtered.filter((d) => dealCategory(d) === null);

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by owner, buyer, property..."
          className="flex-1 rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={() => setFiltersOpen(!filtersOpen)}
          className={`shrink-0 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
            filtersOpen || selectedTypes.size > 0
              ? 'bg-blue-500/20 text-blue-300 ring-1 ring-inset ring-blue-500/40'
              : 'bg-white/5 text-zinc-300 ring-1 ring-inset ring-white/10 hover:ring-white/20'
          }`}
        >
          Filters{selectedTypes.size > 0 ? ` (${selectedTypes.size})` : ''}
        </button>
      </div>

      {filtersOpen && (
        <div className="mb-4 rounded-2xl bg-[#14141c] p-5 shadow-xl shadow-black/40 ring-1 ring-white/5 space-y-4">
          <div>
            <p className="mb-2 text-xs font-medium text-zinc-400">Deal Type</p>
            <div className="flex flex-wrap gap-2">
              {dealTypes.map((t) => (
                <button key={t.id} type="button" onClick={() => toggleType(t.id)} className={`${pillClass} ${selectedTypes.has(t.id) ? pillActive : pillInactive}`}>
                  {t.name}
                </button>
              ))}
            </div>
          </div>
          {selectedTypes.size > 0 && (
            <button type="button" onClick={() => setSelectedTypes(new Set())} className="text-xs text-zinc-500 hover:text-zinc-300">
              Clear filters
            </button>
          )}
        </div>
      )}

      <div className="flex flex-col gap-6">
        <Lane title="Sale" stages={saleStages} deals={saleDeals} />
        <Lane title="Rental" stages={rentalStages} deals={rentalDeals} />

        {unassignedDeals.length > 0 && (
          <div className="rounded-2xl bg-[#14141c] p-5 shadow-xl shadow-black/40 ring-1 ring-white/5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-200">
              Unassigned <span className="text-zinc-500">({unassignedDeals.length})</span>
            </h2>
            <p className="mb-3 text-xs text-zinc-500">These deals have no deal type set, so they can&apos;t be placed in Sale or Rental yet. Open one and set its deal type.</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {unassignedDeals.map((d) => (
                <DealKanbanCard key={d.id} deal={d} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
