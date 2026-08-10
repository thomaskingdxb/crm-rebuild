'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PropertyWithRelations, Lookup } from '@/types/database';
import { usePersistentState } from '@/lib/usePersistentState';

const pillClass = 'inline-flex cursor-pointer items-center rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition';
const pillInactive = 'text-zinc-400 ring-white/10 hover:ring-white/20';
const pillActive = 'bg-blue-500/20 text-blue-300 ring-blue-500/40';

const STATUS_STYLES: Record<string, string> = {
  Rented: 'bg-blue-500/10 text-blue-400 ring-blue-500/20',
  Sold: 'bg-white/5 text-zinc-400 ring-white/10',
  'For rent': 'bg-orange-500/10 text-orange-400 ring-orange-500/20',
  'For sale': 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
  Vacant: 'bg-orange-500/10 text-orange-400 ring-orange-500/20',
  'Property listed': 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
  'Off plan': 'bg-white/5 text-zinc-400 ring-white/10',
  Ready: 'bg-white/5 text-zinc-400 ring-white/10',
};

interface PropertyLookups {
  propertyTypes: Lookup[];
  propertyStatuses: Lookup[];
  areas: Lookup[];
  bedroomCounts: Lookup[];
  bathroomCounts: Lookup[];
  developers: Lookup[];
  viewTypes: Lookup[];
}

type FilterKey = 'status' | 'type' | 'area' | 'developer' | 'bedroom' | 'bathroom' | 'view';
type SortKey = 'unit' | 'status' | 'type' | 'area' | 'beds' | 'sqft' | 'price' | 'rent';

function FilterGroup({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: Lookup[];
  selected: Set<number>;
  onToggle: (id: number) => void;
}) {
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

export default function PropertiesList({ properties, lookups }: { properties: PropertyWithRelations[]; lookups: PropertyLookups }) {
  const router = useRouter();
  const [query, setQuery] = usePersistentState('properties:query', '');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selected, setSelected] = usePersistentState<Record<FilterKey, Set<number>>>('properties:selected', {
    status: new Set(),
    type: new Set(),
    area: new Set(),
    developer: new Set(),
    bedroom: new Set(),
    bathroom: new Set(),
    view: new Set(),
  });
  const [sort, setSort] = usePersistentState<{ key: SortKey; direction: 'asc' | 'desc' }>('properties:sort', {
    key: 'unit',
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

  function clearAll() {
    setSelected({
      status: new Set(),
      type: new Set(),
      area: new Set(),
      developer: new Set(),
      bedroom: new Set(),
      bathroom: new Set(),
      view: new Set(),
    });
  }

  function handleSort(key: SortKey) {
    setSort((prev) => (prev.key === key ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'asc' }));
  }

  const activeFilterCount = Object.values(selected).reduce((sum, s) => sum + s.size, 0);

  const filtered = useMemo(() => {
    return properties.filter((p) => {
      const q = query.trim().toLowerCase();
      if (q) {
        const haystack = [
          p.id,
          p.building,
          p.unit_number,
          p.clients?.name,
          ...p.property_areas.map((a) => a.areas.name),
          ...p.property_property_statuses.map((s) => s.property_statuses.name),
          ...p.property_property_types.map((t) => t.property_types.name),
          ...p.property_developers.map((d) => d.developers.name),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      const checks: [FilterKey, number[]][] = [
        ['status', p.property_property_statuses.map((s) => s.property_statuses.id)],
        ['type', p.property_property_types.map((t) => t.property_types.id)],
        ['area', p.property_areas.map((a) => a.areas.id)],
        ['developer', p.property_developers.map((d) => d.developers.id)],
        ['bedroom', p.property_bedroom_counts.map((b) => b.bedroom_counts.id)],
        ['bathroom', p.property_bathroom_counts.map((b) => b.bathroom_counts.id)],
        ['view', p.property_view_types.map((v) => v.view_types.id)],
      ];

      for (const [key, ids] of checks) {
        if (selected[key].size > 0 && !ids.some((id) => selected[key].has(id))) return false;
      }

      return true;
    });
  }, [properties, query, selected]);

  const sorted = useMemo(() => {
    const dir = sort.direction === 'asc' ? 1 : -1;
    const val = (p: PropertyWithRelations): string | number => {
      switch (sort.key) {
        case 'unit':
          return `${p.building ?? ''} ${p.unit_number ?? ''}`.trim().toLowerCase();
        case 'status':
          return p.property_property_statuses[0]?.property_statuses.name ?? '';
        case 'type':
          return p.property_property_types[0]?.property_types.name ?? '';
        case 'area':
          return p.property_areas[0]?.areas.name ?? '';
        case 'beds':
          return Number(p.property_bedroom_counts[0]?.bedroom_counts.name) || 0;
        case 'sqft':
          return p.sqft ?? 0;
        case 'price':
          return p.asking_price ?? 0;
        case 'rent':
          return p.rental_income ?? 0;
      }
    };
    return [...filtered].sort((a, b) => {
      const av = val(a);
      const bv = val(b);
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [filtered, sort]);

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by building, unit, owner, area, status..."
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
          <FilterGroup title="Status" options={lookups.propertyStatuses} selected={selected.status} onToggle={(id) => toggle('status', id)} />
          <FilterGroup title="Type" options={lookups.propertyTypes} selected={selected.type} onToggle={(id) => toggle('type', id)} />
          <FilterGroup title="Bedrooms" options={lookups.bedroomCounts} selected={selected.bedroom} onToggle={(id) => toggle('bedroom', id)} />
          <FilterGroup title="Bathrooms" options={lookups.bathroomCounts} selected={selected.bathroom} onToggle={(id) => toggle('bathroom', id)} />
          <FilterGroup title="Area" options={lookups.areas} selected={selected.area} onToggle={(id) => toggle('area', id)} />
          <FilterGroup title="Developer" options={lookups.developers} selected={selected.developer} onToggle={(id) => toggle('developer', id)} />
          <FilterGroup title="View" options={lookups.viewTypes} selected={selected.view} onToggle={(id) => toggle('view', id)} />

          {activeFilterCount > 0 && (
            <button type="button" onClick={clearAll} className="text-xs text-zinc-500 hover:text-zinc-300">
              Clear filters
            </button>
          )}
        </div>
      )}

      <p className="mb-4 text-xs text-zinc-500">
        {filtered.length} of {properties.length} properties
      </p>

      {sorted.length === 0 ? (
        <p className="text-zinc-500">No properties match your search.</p>
      ) : (
        <div className="surface-card overflow-x-auto p-0">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <SortHeader label="Unit / Building" sortKey="unit" active={sort.key === 'unit'} direction={sort.direction} onSort={handleSort} className="pl-5" />
                <SortHeader label="Status" sortKey="status" active={sort.key === 'status'} direction={sort.direction} onSort={handleSort} />
                <SortHeader label="Type" sortKey="type" active={sort.key === 'type'} direction={sort.direction} onSort={handleSort} />
                <SortHeader label="Area" sortKey="area" active={sort.key === 'area'} direction={sort.direction} onSort={handleSort} />
                <SortHeader label="Beds / Baths" sortKey="beds" active={sort.key === 'beds'} direction={sort.direction} onSort={handleSort} />
                <SortHeader label="Sqft" sortKey="sqft" active={sort.key === 'sqft'} direction={sort.direction} onSort={handleSort} />
                <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-zinc-500">Owner</th>
                <SortHeader label="Price" sortKey="price" active={sort.key === 'price'} direction={sort.direction} onSort={handleSort} />
                <SortHeader label="Rent" sortKey="rent" active={sort.key === 'rent'} direction={sort.direction} onSort={handleSort} className="pr-5" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((p) => {
                const statuses = p.property_property_statuses.map((s) => s.property_statuses.name);
                const types = p.property_property_types.map((t) => t.property_types.name);
                const areas = p.property_areas.map((a) => a.areas.name);
                const beds = p.property_bedroom_counts.map((b) => b.bedroom_counts.name);
                const baths = p.property_bathroom_counts.map((b) => b.bathroom_counts.name);

                return (
                  <tr
                    key={p.id}
                    onClick={() => router.push(`/properties/${p.id}`)}
                    className="cursor-pointer border-b border-white/5 transition last:border-0 hover:bg-white/5"
                  >
                    <td className="px-3 py-3 pl-5">
                      <p className="font-medium text-zinc-100">{p.unit_number ?? '—'}</p>
                      <p className="text-xs text-zinc-500">{p.building ?? '—'}</p>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        {statuses.length === 0 && <span className="text-xs text-zinc-600">—</span>}
                        {statuses.map((s) => (
                          <span key={s} className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[s] ?? 'bg-white/5 text-zinc-400 ring-white/10'}`}>
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-zinc-300">{types.join(', ') || '—'}</td>
                    <td className="px-3 py-3 text-zinc-300">{areas.join(', ') || '—'}</td>
                    <td className="px-3 py-3 text-zinc-300">
                      {beds.join(', ') || '—'}
                      {baths.length > 0 ? ` / ${baths.join(', ')}` : ''}
                    </td>
                    <td className="px-3 py-3 text-zinc-300">{p.sqft ? p.sqft.toLocaleString() : '—'}</td>
                    <td className="px-3 py-3 text-zinc-300">{p.clients ? p.clients.name : '—'}</td>
                    <td className="px-3 py-3 font-medium text-zinc-100">{p.asking_price ? `AED ${p.asking_price.toLocaleString()}` : '—'}</td>
                    <td className="px-3 py-3 pr-5 font-medium text-zinc-100">{p.rental_income ? `AED ${p.rental_income.toLocaleString()}/yr` : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
