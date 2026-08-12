'use client';

import { Fragment, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PropertyWithRelations, Lookup } from '@/types/database';
import { usePersistentState } from '@/lib/usePersistentState';
import { exportAvailabilityPdf, AVAILABILITY_COLUMNS, type AvailabilityColumnKey } from '@/lib/exportAvailabilityPdf';
import Modal from '@/components/Modal';

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

// Natural sort for unit numbers like "108", "222A" — numeric prefix first, then remainder, blanks last.
function unitSortValue(unit: string | null): [number, string] {
  if (!unit) return [Infinity, ''];
  const match = unit.match(/^\d+/);
  return match ? [parseInt(match[0], 10), unit.slice(match[0].length)] : [Infinity, unit];
}

function bedroomSortValue(label: string): number {
  if (label.toLowerCase() === 'studio') return 0;
  const n = parseInt(label, 10);
  return Number.isNaN(n) ? 999 : n;
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
  const [selectedLayouts, setSelectedLayouts] = usePersistentState<Set<string>>('properties:layouts', new Set());

  const layoutOptions = useMemo(() => {
    const values = new Set<string>();
    for (const p of properties) if (p.layout) values.add(p.layout);
    return Array.from(values).sort();
  }, [properties]);

  function toggle(key: FilterKey, id: number) {
    setSelected((prev) => {
      const next = new Set(prev[key]);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...prev, [key]: next };
    });
  }

  function toggleLayout(layout: string) {
    setSelectedLayouts((prev) => {
      const next = new Set(prev);
      if (next.has(layout)) next.delete(layout);
      else next.add(layout);
      return next;
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
    setSelectedLayouts(new Set());
  }

  const activeFilterCount = Object.values(selected).reduce((sum, s) => sum + s.size, 0) + selectedLayouts.size;

  const filtered = useMemo(() => {
    return properties.filter((p) => {
      const q = query.trim().toLowerCase();
      if (q) {
        const haystack = [
          p.id,
          p.building,
          p.unit_number,
          p.clients?.name,
          p.layout,
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

      if (selectedLayouts.size > 0 && (!p.layout || !selectedLayouts.has(p.layout))) return false;

      return true;
    });
  }, [properties, query, selected, selectedLayouts]);

  // Grouped Building -> Bedrooms -> rows sorted by unit number, per the default view.
  const buildingGroups = useMemo(() => {
    type Row = PropertyWithRelations;
    const byBuilding = new Map<string, Row[]>();
    for (const p of filtered) {
      const key = p.building ?? 'No Building';
      const arr = byBuilding.get(key) ?? [];
      arr.push(p);
      byBuilding.set(key, arr);
    }

    const buildings = Array.from(byBuilding.entries()).sort(([a], [b]) => {
      if (a === 'No Building') return 1;
      if (b === 'No Building') return -1;
      return a.localeCompare(b);
    });

    return buildings.map(([building, rows]) => {
      const byBedroom = new Map<string, Row[]>();
      for (const p of rows) {
        const key = p.property_bedroom_counts[0]?.bedroom_counts.name ?? 'Unspecified';
        const arr = byBedroom.get(key) ?? [];
        arr.push(p);
        byBedroom.set(key, arr);
      }

      const bedroomGroups = Array.from(byBedroom.entries())
        .sort(([a], [b]) => {
          if (a === 'Unspecified') return 1;
          if (b === 'Unspecified') return -1;
          return bedroomSortValue(a) - bedroomSortValue(b);
        })
        .map(([bedroomLabel, bedroomRows]) => ({
          bedroomLabel,
          rows: [...bedroomRows].sort((a, b) => {
            const [an, as] = unitSortValue(a.unit_number);
            const [bn, bs] = unitSortValue(b.unit_number);
            return an - bn || as.localeCompare(bs);
          }),
        }));

      return { building, bedroomGroups };
    });
  }, [filtered]);

  const [exporting, setExporting] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportColumns, setExportColumns] = usePersistentState<AvailabilityColumnKey[]>(
    'properties:exportColumns',
    AVAILABILITY_COLUMNS.map((c) => c.key)
  );

  function toggleExportColumn(key: AvailabilityColumnKey) {
    setExportColumns((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

  async function handleExport() {
    setExporting(true);
    try {
      const buildingNames = buildingGroups.map((g) => g.building);
      const subtitle =
        buildingNames.length === 1
          ? `${buildingNames[0]} · ${filtered.length} ${filtered.length === 1 ? 'property' : 'properties'}`
          : `${buildingNames.length} Buildings · ${filtered.length} properties`;
      await exportAvailabilityPdf(buildingGroups, subtitle, exportColumns);
      setExportModalOpen(false);
    } finally {
      setExporting(false);
    }
  }

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
        <button
          type="button"
          onClick={() => setExportModalOpen(true)}
          disabled={filtered.length === 0}
          className="shrink-0 rounded-lg bg-white/5 px-4 py-2.5 text-sm font-medium text-zinc-300 ring-1 ring-inset ring-white/10 transition hover:ring-white/20 disabled:opacity-50"
        >
          Export PDF
        </button>
      </div>

      <Modal open={exportModalOpen} onClose={() => setExportModalOpen(false)} title="Export Availability PDF">
        <p className="mb-4 text-xs text-zinc-500">
          Choose which columns to include. Exports the {filtered.length} {filtered.length === 1 ? 'property' : 'properties'} currently matching your search/filters.
        </p>
        <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {AVAILABILITY_COLUMNS.map((c) => (
            <label key={c.key} className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={exportColumns.includes(c.key)}
                onChange={() => toggleExportColumn(c.key)}
                className="h-4 w-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500"
              />
              {c.label}
            </label>
          ))}
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting || exportColumns.length === 0}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-50"
        >
          {exporting ? 'Exporting...' : 'Export PDF'}
        </button>
      </Modal>

      {filtersOpen && (
        <div className="mb-4 surface-card p-5 space-y-4">
          <FilterGroup title="Status" options={lookups.propertyStatuses} selected={selected.status} onToggle={(id) => toggle('status', id)} />
          <FilterGroup title="Type" options={lookups.propertyTypes} selected={selected.type} onToggle={(id) => toggle('type', id)} />
          <FilterGroup title="Bedrooms" options={lookups.bedroomCounts} selected={selected.bedroom} onToggle={(id) => toggle('bedroom', id)} />
          <FilterGroup title="Bathrooms" options={lookups.bathroomCounts} selected={selected.bathroom} onToggle={(id) => toggle('bathroom', id)} />
          {layoutOptions.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-zinc-400">Layout</p>
              <div className="flex flex-wrap gap-2">
                {layoutOptions.map((l) => (
                  <button key={l} type="button" onClick={() => toggleLayout(l)} className={`${pillClass} ${selectedLayouts.has(l) ? pillActive : pillInactive}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          )}
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
        <div className="surface-card overflow-x-auto p-0">
          <table className="w-full min-w-[1100px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="whitespace-nowrap px-3 py-2 pl-5 text-left text-xs font-medium text-zinc-500">Unit / Building</th>
                <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-zinc-500">Notes</th>
                <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-zinc-500">Beds / Baths</th>
                <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-zinc-500">Layout</th>
                <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-zinc-500">Status</th>
                <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-zinc-500">Area</th>
                <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-zinc-500">Sqft</th>
                <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-zinc-500">Type</th>
                <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-zinc-500">Price</th>
                <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-zinc-500">Rent</th>
                <th className="whitespace-nowrap px-3 py-2 pr-5 text-left text-xs font-medium text-zinc-500">Owner</th>
              </tr>
            </thead>
            <tbody>
              {buildingGroups.map(({ building, bedroomGroups }) => (
                <Fragment key={`building:${building}`}>
                  <tr className="border-b border-white/10 bg-white/[0.03]">
                    <td colSpan={11} className="px-5 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                      {building}
                    </td>
                  </tr>
                  {bedroomGroups.map(({ bedroomLabel, rows }) => (
                    <Fragment key={`${building}:${bedroomLabel}`}>
                      <tr className="border-b border-white/5">
                        <td colSpan={11} className="px-5 py-1.5 text-[11px] font-medium text-zinc-500">
                          {bedroomLabel === 'Unspecified' ? 'Bedrooms unspecified' : `${bedroomLabel} bed`}
                        </td>
                      </tr>
                      {rows.map((p) => {
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
                            <td className="max-w-[220px] truncate px-3 py-3 text-xs text-zinc-500">{p.notes || '—'}</td>
                            <td className="px-3 py-3 text-zinc-300">
                              {beds.join(', ') || '—'}
                              {baths.length > 0 ? ` / ${baths.join(', ')}` : ''}
                            </td>
                            <td className="px-3 py-3 text-zinc-300">{p.layout || '—'}</td>
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
                            <td className="px-3 py-3 text-zinc-300">{areas.join(', ') || '—'}</td>
                            <td className="px-3 py-3 text-zinc-300">{p.sqft ? p.sqft.toLocaleString() : '—'}</td>
                            <td className="px-3 py-3 text-zinc-300">{types.join(', ') || '—'}</td>
                            <td className="px-3 py-3 font-medium text-zinc-100">{p.asking_price ? `AED ${p.asking_price.toLocaleString()}` : '—'}</td>
                            <td className="px-3 py-3 font-medium text-zinc-100">{p.rental_income ? `AED ${p.rental_income.toLocaleString()}/yr` : '—'}</td>
                            <td className="px-3 py-3 pr-5 text-zinc-300">{p.clients ? p.clients.name : '—'}</td>
                          </tr>
                        );
                      })}
                    </Fragment>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
