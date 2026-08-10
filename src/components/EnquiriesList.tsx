'use client';

import { useMemo, useState } from 'react';
import type { EnquiryListItem, Lookup } from '@/types/database';
import EnquiryDetailModal from '@/components/EnquiryDetailModal';
import FilterMultiSelect from '@/components/FilterMultiSelect';
import { usePersistentState } from '@/lib/usePersistentState';
import { formatDate, daysSince } from '@/lib/date';

const pillClass = 'inline-flex cursor-pointer items-center rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition';
const pillInactive = 'text-zinc-400 ring-white/10 hover:ring-white/20';
const pillActive = 'bg-blue-500/20 text-blue-300 ring-blue-500/40';

const STAGE_STYLES: Record<string, string> = {
  'Closed - Won': 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
  'Closed - Lost': 'bg-white/5 text-zinc-400 ring-white/10',
  'Deal agreed': 'bg-blue-500/10 text-blue-400 ring-blue-500/20',
  Negotiating: 'bg-amber-500/10 text-amber-400 ring-amber-500/20',
  Unresponsive: 'bg-rose-500/10 text-rose-400 ring-rose-500/20',
};

const TYPE_STYLES: Record<string, string> = {
  Sale: 'bg-purple-500/10 text-purple-400 ring-purple-500/20',
  Rental: 'bg-cyan-500/10 text-cyan-400 ring-cyan-500/20',
};

interface EnquiryLookups {
  enquiryTypes: Lookup[];
  propertyTypes: Lookup[];
  areas: Lookup[];
  bedroomCounts: Lookup[];
  bathroomCounts: Lookup[];
  leadStages: Lookup[];
  viewTypes: Lookup[];
  developers: Lookup[];
  propertyStatuses: Lookup[];
}

type FilterKey = 'enquiryType' | 'propertyType' | 'area' | 'bedroom' | 'bathroom' | 'leadStage' | 'view' | 'developer' | 'propertyStatus';
type SortKey = 'client' | 'type' | 'stage' | 'budget' | 'area' | 'followUp' | 'activity' | 'date';

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

function SortHeader({
  label,
  sortKey,
  active,
  direction,
  onSort,
  className,
}: {
  label: string;
  sortKey: SortKey;
  active: boolean;
  direction: 'asc' | 'desc';
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  return (
    <th className={`whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-zinc-500 ${className ?? ''}`}>
      <button type="button" onClick={() => onSort(sortKey)} className={`inline-flex items-center gap-1 transition hover:text-zinc-300 ${active ? 'text-zinc-200' : ''}`}>
        {label}
        {active && <span className="text-[10px]">{direction === 'asc' ? '▲' : '▼'}</span>}
      </button>
    </th>
  );
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

export default function EnquiriesList({
  enquiries,
  lookups,
  clients,
  properties,
  taskTypes,
  activityTypes,
}: {
  enquiries: EnquiryListItem[];
  lookups: EnquiryLookups;
  clients: { id: string; name: string }[];
  properties: { id: string; building: string | null; unit_number: string | null }[];
  taskTypes: Lookup[];
  activityTypes: Lookup[];
}) {
  const [query, setQuery] = usePersistentState('enquiries:query', '');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [openEnquiryId, setOpenEnquiryId] = useState<string | null>(null);
  const [selected, setSelected] = usePersistentState<Record<FilterKey, Set<number>>>('enquiries:selected', {
    enquiryType: new Set(),
    propertyType: new Set(),
    area: new Set(),
    bedroom: new Set(),
    bathroom: new Set(),
    leadStage: new Set(),
    view: new Set(),
    developer: new Set(),
    propertyStatus: new Set(),
  });
  const [sort, setSort] = usePersistentState<{ key: SortKey; direction: 'asc' | 'desc' }>('enquiries:sort', {
    key: 'followUp',
    direction: 'asc',
  });

  function toggle(key: FilterKey, id: number) {
    setSelected((prev) => {
      const next = new Set(prev[key]);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...prev, [key]: next };
    });
  }

  function setKey(key: FilterKey, next: Set<number>) {
    setSelected((prev) => ({ ...prev, [key]: next }));
  }

  function clearAll() {
    setSelected({
      enquiryType: new Set(),
      propertyType: new Set(),
      area: new Set(),
      bedroom: new Set(),
      bathroom: new Set(),
      leadStage: new Set(),
      view: new Set(),
      developer: new Set(),
      propertyStatus: new Set(),
    });
  }

  function handleSort(key: SortKey) {
    setSort((prev) => (prev.key === key ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'asc' }));
  }

  const activeFilterCount = Object.values(selected).reduce((sum, s) => sum + s.size, 0);

  const filtered = useMemo(() => {
    return enquiries.filter((e) => {
      const q = query.trim().toLowerCase();
      if (q) {
        const haystack = [
          e.id,
          e.clients?.name,
          e.building,
          e.notes,
          ...e.enquiry_areas.map((a) => a.areas.name),
          ...e.enquiry_enquiry_types.map((t) => t.enquiry_types.name),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      const checks: [FilterKey, number[]][] = [
        ['enquiryType', e.enquiry_enquiry_types.map((t) => t.enquiry_types.id)],
        ['propertyType', e.enquiry_property_types.map((t) => t.property_types.id)],
        ['area', e.enquiry_areas.map((a) => a.areas.id)],
        ['bedroom', e.enquiry_bedroom_counts.map((b) => b.bedroom_counts.id)],
        ['bathroom', e.enquiry_bathroom_counts.map((b) => b.bathroom_counts.id)],
        ['leadStage', e.enquiry_lead_stages.map((s) => s.lead_stages.id)],
        ['view', e.enquiry_view_types.map((v) => v.view_types.id)],
        ['developer', e.enquiry_developers.map((d) => d.developers.id)],
        ['propertyStatus', e.enquiry_property_statuses.map((s) => s.property_statuses.id)],
      ];

      for (const [key, ids] of checks) {
        if (selected[key].size > 0 && !ids.some((id) => selected[key].has(id))) return false;
      }

      return true;
    });
  }, [enquiries, query, selected]);

  const sorted = useMemo(() => {
    const dir = sort.direction === 'asc' ? 1 : -1;
    const val = (e: EnquiryListItem): string | number => {
      switch (sort.key) {
        case 'client':
          return e.clients?.name.toLowerCase() ?? '';
        case 'type':
          return e.enquiry_enquiry_types[0]?.enquiry_types.name ?? '';
        case 'stage':
          return e.enquiry_lead_stages[0]?.lead_stages.name ?? '';
        case 'budget':
          return e.budget ?? 0;
        case 'area':
          return e.enquiry_areas[0]?.areas.name ?? '';
        case 'followUp':
          return e.clients?.follow_up_date ?? (dir === 1 ? '9999-99-99' : '');
        case 'activity':
          return daysSince(e.clientLastActivityDate) ?? (dir === 1 ? Infinity : -Infinity);
        case 'date':
          return e.enquiry_date ?? '';
      }
    };
    return [...filtered].sort((a, b) => {
      const av = val(a);
      const bv = val(b);
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [filtered, sort]);

  const openEnquiry = openEnquiryId ? enquiries.find((e) => e.id === openEnquiryId) ?? null : null;

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by client, building, area..."
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
          <FilterGroup title="Enquiry Type" options={lookups.enquiryTypes} selected={selected.enquiryType} onToggle={(id) => toggle('enquiryType', id)} />
          <FilterGroup title="Lead Stage" options={lookups.leadStages} selected={selected.leadStage} onToggle={(id) => toggle('leadStage', id)} />
          <FilterGroup title="Property Type" options={lookups.propertyTypes} selected={selected.propertyType} onToggle={(id) => toggle('propertyType', id)} />
          <FilterGroup title="Bedrooms" options={lookups.bedroomCounts} selected={selected.bedroom} onToggle={(id) => toggle('bedroom', id)} />
          <FilterGroup title="Bathrooms" options={lookups.bathroomCounts} selected={selected.bathroom} onToggle={(id) => toggle('bathroom', id)} />
          <div>
            <p className="mb-2 text-xs font-medium text-zinc-400">Area</p>
            <FilterMultiSelect options={lookups.areas} selected={selected.area} onChange={(next) => setKey('area', next)} placeholder="Search areas..." />
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-zinc-400">Developer</p>
            <FilterMultiSelect options={lookups.developers} selected={selected.developer} onChange={(next) => setKey('developer', next)} placeholder="Search developers..." />
          </div>
          <FilterGroup title="Property Status" options={lookups.propertyStatuses} selected={selected.propertyStatus} onToggle={(id) => toggle('propertyStatus', id)} />
          <FilterGroup title="View" options={lookups.viewTypes} selected={selected.view} onToggle={(id) => toggle('view', id)} />

          {activeFilterCount > 0 && (
            <button type="button" onClick={clearAll} className="text-xs text-zinc-500 hover:text-zinc-300">
              Clear filters
            </button>
          )}
        </div>
      )}

      <p className="mb-4 text-xs text-zinc-500">
        {filtered.length} of {enquiries.length} enquiries
      </p>

      {sorted.length === 0 ? (
        <p className="text-zinc-500">No enquiries match your search.</p>
      ) : (
        <div className="surface-card overflow-x-auto p-0">
          <table className="w-full min-w-[1000px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <SortHeader label="Client" sortKey="client" active={sort.key === 'client'} direction={sort.direction} onSort={handleSort} className="pl-5" />
                <SortHeader label="Type" sortKey="type" active={sort.key === 'type'} direction={sort.direction} onSort={handleSort} />
                <SortHeader label="Stage" sortKey="stage" active={sort.key === 'stage'} direction={sort.direction} onSort={handleSort} />
                <SortHeader label="Budget" sortKey="budget" active={sort.key === 'budget'} direction={sort.direction} onSort={handleSort} />
                <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-zinc-500">Property Type</th>
                <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-zinc-500">Beds</th>
                <SortHeader label="Area" sortKey="area" active={sort.key === 'area'} direction={sort.direction} onSort={handleSort} />
                <SortHeader label="Last Activity" sortKey="activity" active={sort.key === 'activity'} direction={sort.direction} onSort={handleSort} />
                <SortHeader label="Follow Up" sortKey="followUp" active={sort.key === 'followUp'} direction={sort.direction} onSort={handleSort} className="pr-5" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((e) => {
                const types = e.enquiry_enquiry_types.map((t) => t.enquiry_types.name);
                const stages = e.enquiry_lead_stages.map((s) => s.lead_stages.name);
                const propertyTypes = e.enquiry_property_types.map((t) => t.property_types.name);
                const beds = e.enquiry_bedroom_counts.map((b) => b.bedroom_counts.name);
                const areas = e.enquiry_areas.map((a) => a.areas.name);
                const days = daysSince(e.clientLastActivityDate);
                const followUp = e.clients?.follow_up_date ?? null;

                return (
                  <tr
                    key={e.id}
                    onClick={() => setOpenEnquiryId(e.id)}
                    className="cursor-pointer border-b border-white/5 transition last:border-0 hover:bg-white/5"
                  >
                    <td className="px-3 py-3 pl-5 font-medium text-zinc-100">{e.clients ? e.clients.name : 'No client'}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        {types.map((t) => (
                          <span key={t} className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${TYPE_STYLES[t] ?? 'bg-blue-500/10 text-blue-400 ring-blue-500/20'}`}>
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        {stages.length === 0 && <span className="text-xs text-zinc-600">—</span>}
                        {stages.map((s) => (
                          <span key={s} className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STAGE_STYLES[s] ?? 'bg-white/5 text-zinc-400 ring-white/10'}`}>
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-3 font-medium text-zinc-100">{e.budget ? `AED ${e.budget.toLocaleString()}` : '—'}</td>
                    <td className="px-3 py-3 text-zinc-300">{propertyTypes.join(', ') || '—'}</td>
                    <td className="px-3 py-3 text-zinc-300">{beds.join(', ') || '—'}</td>
                    <td className="px-3 py-3 text-zinc-300">{areas.join(', ') || '—'}</td>
                    <td className="px-3 py-3">
                      <span
                        title="Days since last activity"
                        className={`inline-flex shrink-0 items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${activityChipClass(days)}`}
                      >
                        {days ?? '—'}
                      </span>
                    </td>
                    <td className={`px-3 py-3 pr-5 ${followUpClass(followUp)}`}>{followUp ? formatDate(followUp) : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {openEnquiry && (
        <EnquiryDetailModal
          enquiry={openEnquiry}
          lookups={lookups}
          clients={clients}
          properties={properties}
          taskTypes={taskTypes}
          activityTypes={activityTypes}
          open={openEnquiry !== null}
          onClose={() => setOpenEnquiryId(null)}
        />
      )}
    </div>
  );
}
