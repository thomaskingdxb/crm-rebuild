'use client';

import { useMemo, useState } from 'react';
import type { ClientListItem, Lookup } from '@/types/database';
import ClientCard from '@/components/ClientCard';

const pillClass =
  'inline-flex cursor-pointer items-center rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition';
const pillInactive = 'text-zinc-400 ring-white/10 hover:ring-white/20';
const pillActive = 'bg-blue-500/20 text-blue-300 ring-blue-500/40';

export default function ClientsList({
  clients,
  clientTypes,
  clientStatuses,
  activityTypes,
}: {
  clients: ClientListItem[];
  clientTypes: Lookup[];
  clientStatuses: Lookup[];
  activityTypes: Lookup[];
}) {
  const [query, setQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<Set<number>>(new Set());
  const [selectedStatuses, setSelectedStatuses] = useState<Set<number>>(new Set());

  function toggle(set: Set<number>, id: number, setter: (s: Set<number>) => void) {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setter(next);
  }

  const activeFilterCount = selectedTypes.size + selectedStatuses.size;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clients.filter((c) => {
      if (q) {
        const types = c.client_client_types.map((t) => t.client_types.name).join(' ');
        const statuses = c.client_client_statuses.map((s) => s.client_statuses.name).join(' ');
        const matchesText =
          c.name.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q) ||
          (c.phone ?? '').toLowerCase().includes(q) ||
          (c.email ?? '').toLowerCase().includes(q) ||
          types.toLowerCase().includes(q) ||
          statuses.toLowerCase().includes(q);
        if (!matchesText) return false;
      }

      if (selectedTypes.size > 0) {
        const clientTypeIds = new Set(c.client_client_types.map((t) => t.client_types.id));
        const hasType = [...selectedTypes].some((id) => clientTypeIds.has(id));
        if (!hasType) return false;
      }

      if (selectedStatuses.size > 0) {
        const clientStatusIds = new Set(c.client_client_statuses.map((s) => s.client_statuses.id));
        const hasStatus = [...selectedStatuses].some((id) => clientStatusIds.has(id));
        if (!hasStatus) return false;
      }

      return true;
    });
  }, [clients, query, selectedTypes, selectedStatuses]);

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, phone, email, type, or status..."
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
          <div>
            <p className="mb-2 text-xs font-medium text-zinc-400">Type</p>
            <div className="flex flex-wrap gap-2">
              {clientTypes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggle(selectedTypes, t.id, setSelectedTypes)}
                  className={`${pillClass} ${selectedTypes.has(t.id) ? pillActive : pillInactive}`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-zinc-400">Status</p>
            <div className="flex flex-wrap gap-2">
              {clientStatuses.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggle(selectedStatuses, s.id, setSelectedStatuses)}
                  className={`${pillClass} ${selectedStatuses.has(s.id) ? pillActive : pillInactive}`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={() => {
                setSelectedTypes(new Set());
                setSelectedStatuses(new Set());
              }}
              className="text-xs text-zinc-500 hover:text-zinc-300"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      <p className="mb-4 text-xs text-zinc-500">
        {filtered.length} of {clients.length} clients
      </p>

      {filtered.length === 0 ? (
        <p className="text-zinc-500">No clients match your search.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((client) => (
            <ClientCard key={client.id} client={client} activityTypes={activityTypes} />
          ))}
        </div>
      )}
    </div>
  );
}
