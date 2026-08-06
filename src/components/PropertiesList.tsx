'use client';

import { useMemo, useState } from 'react';
import type { PropertyWithRelations, Lookup } from '@/types/database';
import PropertyCard from '@/components/PropertyCard';

const pillClass = 'inline-flex cursor-pointer items-center rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition';
const pillInactive = 'text-zinc-400 ring-white/10 hover:ring-white/20';
const pillActive = 'bg-blue-500/20 text-blue-300 ring-blue-500/40';

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

export default function PropertiesList({ properties, lookups }: { properties: PropertyWithRelations[]; lookups: PropertyLookups }) {
  const [query, setQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selected, setSelected] = useState<Record<FilterKey, Set<number>>>({
    status: new Set(),
    type: new Set(),
    area: new Set(),
    developer: new Set(),
    bedroom: new Set(),
    bathroom: new Set(),
    view: new Set(),
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

      {filtered.length === 0 ? (
        <p className="text-zinc-500">No properties match your search.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      )}
    </div>
  );
}
