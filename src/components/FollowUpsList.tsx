'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ClientListItem, Lookup } from '@/types/database';
import { daysSince, formatDate } from '@/lib/date';
import { telHref, whatsappHref } from '@/lib/phone';
import LogActivityButton from '@/components/LogActivityButton';
import { usePersistentState } from '@/lib/usePersistentState';

const pillClass = 'inline-flex cursor-pointer items-center rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition';
const pillInactive = 'text-zinc-400 ring-white/10 hover:ring-white/20';
const pillActive = 'bg-blue-500/20 text-blue-300 ring-blue-500/40';

const STATUS_STYLES: Record<string, string> = {
  Ongoing: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
  Closed: 'bg-white/5 text-zinc-400 ring-white/10',
  Unresponsive: 'bg-rose-500/10 text-rose-400 ring-rose-500/20',
};

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function activityChipClass(days: number | null): string {
  if (days === null) return 'bg-white/5 text-zinc-500 ring-white/10';
  if (days <= 7) return 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20';
  if (days <= 30) return 'bg-amber-500/10 text-amber-400 ring-amber-500/20';
  return 'bg-rose-500/10 text-rose-400 ring-rose-500/20';
}

function followUpClass(followUp: string | null): string {
  if (!followUp) return 'text-zinc-500';
  const days = daysSince(followUp);
  if (days === null) return 'text-zinc-500';
  if (days > 0) return 'text-rose-400';
  if (days === 0) return 'text-amber-400';
  return 'text-zinc-400';
}

function ClientRow({ client, activityTypes }: { client: ClientListItem; activityTypes: Lookup[] }) {
  const router = useRouter();
  const days = daysSince(client.lastActivityDate);
  const tel = telHref(client.phone);
  const wa = whatsappHref(client.phone);
  const types = client.client_client_types.map((t) => t.client_types.name);
  const statuses = client.client_client_statuses.map((s) => s.client_statuses.name);

  return (
    <tr onClick={() => router.push(`/clients/${client.id}`)} className="cursor-pointer border-b border-white/5 transition last:border-0 hover:bg-white/5">
      <td className="px-3 py-3 pl-5">
        <p className="font-medium text-zinc-100">{client.name}</p>
        <p className="text-xs text-zinc-500">{client.id}</p>
      </td>
      <td className="px-3 py-3">
        <div className="flex flex-wrap gap-1">
          {types.map((t) => (
            <span key={t} className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-400 ring-1 ring-inset ring-blue-500/20">
              {t}
            </span>
          ))}
        </div>
      </td>
      <td className="px-3 py-3">
        <div className="flex flex-wrap gap-1">
          {statuses.map((s) => (
            <span key={s} className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[s] ?? 'bg-white/5 text-zinc-400 ring-white/10'}`}>
              {s}
            </span>
          ))}
        </div>
      </td>
      <td className="px-3 py-3">
        <span
          title="Days since last activity"
          className={`inline-flex shrink-0 items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${activityChipClass(days)}`}
        >
          {days ?? '—'}
        </span>
      </td>
      <td className={`px-3 py-3 font-medium ${followUpClass(client.follow_up_date)}`}>{client.follow_up_date ? formatDate(client.follow_up_date) : '—'}</td>
      <td className="max-w-[220px] truncate px-3 py-3 text-xs text-zinc-500">{client.notes || '—'}</td>
      <td className="px-3 py-3 pr-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-wrap justify-end gap-2">
          <LogActivityButton
            clientId={client.id}
            activityTypes={activityTypes}
            label="Log Activity"
            className="rounded-lg bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-400 ring-1 ring-inset ring-blue-500/20 transition hover:bg-blue-500/20"
          />
          {wa && (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20 transition hover:bg-emerald-500/20"
            >
              WhatsApp
            </a>
          )}
          {tel && (
            <a href={tel} className="rounded-lg bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-400 ring-1 ring-inset ring-blue-500/20 transition hover:bg-blue-500/20">
              Call
            </a>
          )}
        </div>
      </td>
    </tr>
  );
}

function FollowUpsTable({ rows, activityTypes }: { rows: ClientListItem[]; activityTypes: Lookup[] }) {
  return (
    <div className="overflow-x-auto rounded-xl bg-white/[0.02] ring-1 ring-white/5">
      <table className="w-full min-w-[900px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-white/10">
            <th className="whitespace-nowrap px-3 py-2 pl-5 text-left text-xs font-medium text-zinc-500">Name</th>
            <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-zinc-500">Type</th>
            <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-zinc-500">Status</th>
            <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-zinc-500">Last Activity</th>
            <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-zinc-500">Follow Up</th>
            <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-zinc-500">Notes</th>
            <th className="whitespace-nowrap px-3 py-2 pr-5 text-right text-xs font-medium text-zinc-500">Quick Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <ClientRow key={c.id} client={c} activityTypes={activityTypes} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function FollowUpsList({
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
  const [query, setQuery] = usePersistentState('followUps:query', '');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedTypes, setSelectedTypes] = usePersistentState<Set<number>>('followUps:types', new Set());
  const [selectedStatuses, setSelectedStatuses] = usePersistentState<Set<number>>('followUps:statuses', new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(set: Set<number>, id: number, setter: (s: Set<number>) => void) {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setter(next);
  }

  function toggleExpanded(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
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
        if (![...selectedTypes].some((id) => clientTypeIds.has(id))) return false;
      }

      if (selectedStatuses.size > 0) {
        const clientStatusIds = new Set(c.client_client_statuses.map((s) => s.client_statuses.id));
        if (![...selectedStatuses].some((id) => clientStatusIds.has(id))) return false;
      }

      return true;
    });
  }, [clients, query, selectedTypes, selectedStatuses]);

  const groups = useMemo(() => {
    const today = todayStr();
    const byType = new Map<string, ClientListItem[]>();
    for (const c of filtered) {
      const typeName = c.client_client_types[0]?.client_types.name ?? 'Unspecified';
      if (!byType.has(typeName)) byType.set(typeName, []);
      byType.get(typeName)!.push(c);
    }

    const built = [...byType.entries()].map(([typeName, typeClients]) => {
      const dueToday = typeClients.filter((c) => c.follow_up_date === today);
      const overdue = typeClients
        .filter((c) => c.follow_up_date! < today)
        .sort((a, b) => (a.follow_up_date! < b.follow_up_date! ? -1 : a.follow_up_date! > b.follow_up_date! ? 1 : 0));
      const earliest = [...dueToday, ...overdue][0]?.follow_up_date ?? today;
      return { type: typeName, dueToday, overdue, total: typeClients.length, earliest };
    });

    built.sort((a, b) => {
      if (a.type === 'Unspecified') return 1;
      if (b.type === 'Unspecified') return -1;
      return a.earliest < b.earliest ? -1 : a.earliest > b.earliest ? 1 : 0;
    });

    return built;
  }, [filtered]);

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
        <div className="mb-4 surface-card p-5 space-y-4">
          <div>
            <p className="mb-2 text-xs font-medium text-zinc-400">Type</p>
            <div className="flex flex-wrap gap-2">
              {clientTypes.map((t) => (
                <button key={t.id} type="button" onClick={() => toggle(selectedTypes, t.id, setSelectedTypes)} className={`${pillClass} ${selectedTypes.has(t.id) ? pillActive : pillInactive}`}>
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-zinc-400">Status</p>
            <div className="flex flex-wrap gap-2">
              {clientStatuses.map((s) => (
                <button key={s.id} type="button" onClick={() => toggle(selectedStatuses, s.id, setSelectedStatuses)} className={`${pillClass} ${selectedStatuses.has(s.id) ? pillActive : pillInactive}`}>
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
        {filtered.length} of {clients.length} follow-ups
      </p>

      {filtered.length === 0 ? (
        <p className="text-zinc-500">No follow-ups match your search.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map((g) => {
            const key = `type:${g.type}`;
            const isExpanded = expanded.has(key);
            return (
              <div key={g.type} className="surface-card">
                <button
                  type="button"
                  onClick={() => toggleExpanded(key)}
                  className="flex w-full items-center gap-2 rounded-2xl px-5 py-4 text-left transition hover:bg-white/[0.03]"
                >
                  <span className={`text-xs text-zinc-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}>▸</span>
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-200">{g.type}</h2>
                  <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs font-medium text-zinc-500 ring-1 ring-inset ring-white/10">{g.total}</span>
                </button>

                {isExpanded && (
                  <div className="flex flex-col gap-4 px-5 pb-5">
                    {g.dueToday.length > 0 && (
                      <div>
                        <p className="mb-2 flex items-center gap-2 text-xs font-medium text-amber-400">
                          Due Today
                          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] ring-1 ring-inset ring-amber-500/20">{g.dueToday.length}</span>
                        </p>
                        <FollowUpsTable rows={g.dueToday} activityTypes={activityTypes} />
                      </div>
                    )}

                    {g.overdue.length > 0 && (
                      <div>
                        <p className="mb-2 flex items-center gap-2 text-xs font-medium text-rose-400">
                          Overdue
                          <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] ring-1 ring-inset ring-rose-500/20">{g.overdue.length}</span>
                        </p>
                        <FollowUpsTable rows={g.overdue} activityTypes={activityTypes} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
