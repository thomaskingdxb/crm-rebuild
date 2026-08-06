'use client';

import { useMemo, useState } from 'react';
import type { DealWithRelations, Lookup } from '@/types/database';
import DealCard from '@/components/DealCard';

const pillClass = 'inline-flex cursor-pointer items-center rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition';
const pillInactive = 'text-zinc-400 ring-white/10 hover:ring-white/20';
const pillActive = 'bg-blue-500/20 text-blue-300 ring-blue-500/40';

interface DealLookups {
  dealTypes: Lookup[];
  leadStages: Lookup[];
}

type FilterKey = 'dealType' | 'leadStage';

function FilterGroup({ title, options, selected, onToggle }: { title: string; options: Lookup[]; selected: Set<number>; onToggle: (id: number) => void }) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-zinc-400">{title}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button key={o.id} type="button" onClick={() => onToggle(o.id)} className={`${pillClass} ${selected.has(o.id) ? pillActive : pillInactive}`}>
            {o.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function DealsList({ deals, lookups }: { deals: DealWithRelations[]; lookups: DealLookups }) {
  const [query, setQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selected, setSelected] = useState<Record<FilterKey, Set<number>>>({
    dealType: new Set(),
    leadStage: new Set(),
  });

  function toggle(key: FilterKey, id: number) {
    setSelected((prev) => {
      const next = new Set(prev[key]);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...prev, [key]: next };
    });
  }

  function clearAll() {
    setSelected({ dealType: new Set(), leadStage: new Set() });
  }

  const activeFilterCount = Object.values(selected).reduce((sum, s) => sum + s.size, 0);

  const filtered = useMemo(() => {
    return deals.filter((d) => {
      const q = query.trim().toLowerCase();
      if (q) {
        const haystack = [
          d.id,
          d.owner?.name,
          d.buyer?.name,
          d.properties?.building,
          d.properties?.unit_number,
          d.notes,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      if (selected.dealType.size > 0 && !(d.deal_types && selected.dealType.has(d.deal_types.id))) return false;

      if (selected.leadStage.size > 0) {
        const ids = d.deal_lead_stages.map((s) => s.lead_stages.id);
        if (!ids.some((id) => selected.leadStage.has(id))) return false;
      }

      return true;
    });
  }, [deals, query, selected]);

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
            filtersOpen || activeFilterCount > 0
              ? 'bg-blue-500/20 text-blue-300 ring-1 ring-inset ring-blue-500/40'
              : 'bg-white/5 text-zinc-300 ring-1 ring-inset ring-white/10 hover:ring-white/20'
          }`}
        >
          Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
        </button>
      </div>

      {filtersOpen && (
        <div className="mb-4 rounded-2xl bg-[#14141c] p-5 shadow-xl shadow-black/40 ring-1 ring-white/5 space-y-4">
          <FilterGroup title="Deal Type" options={lookups.dealTypes} selected={selected.dealType} onToggle={(id) => toggle('dealType', id)} />
          <FilterGroup title="Lead Stage" options={lookups.leadStages} selected={selected.leadStage} onToggle={(id) => toggle('leadStage', id)} />

          {activeFilterCount > 0 && (
            <button type="button" onClick={clearAll} className="text-xs text-zinc-500 hover:text-zinc-300">
              Clear filters
            </button>
          )}
        </div>
      )}

      <p className="mb-4 text-xs text-zinc-500">
        {filtered.length} of {deals.length} deals
      </p>

      {filtered.length === 0 ? (
        <p className="text-zinc-500">No deals match your search.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((d) => (
            <DealCard key={d.id} deal={d} />
          ))}
        </div>
      )}
    </div>
  );
}
