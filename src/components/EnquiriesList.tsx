'use client';

import { useMemo, useState } from 'react';
import type { EnquiryListItem, Lookup } from '@/types/database';
import EnquiryCard from '@/components/EnquiryCard';
import FilterMultiSelect from '@/components/FilterMultiSelect';
import { usePersistentState } from '@/lib/usePersistentState';

const pillClass = 'inline-flex cursor-pointer items-center rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition';
const pillInactive = 'text-zinc-400 ring-white/10 hover:ring-white/20';
const pillActive = 'bg-blue-500/20 text-blue-300 ring-blue-500/40';

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

const TYPE_ORDER = ['Sale', 'Rental'];

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
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggleExpanded(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }
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

  const groups = useMemo(() => {
    const stageOrder = new Map(lookups.leadStages.map((s, i) => [s.name, s.display_order ?? i]));

    const byType = new Map<string, EnquiryListItem[]>();
    for (const e of filtered) {
      const typeName = e.enquiry_enquiry_types[0]?.enquiry_types.name ?? 'Unspecified';
      if (!byType.has(typeName)) byType.set(typeName, []);
      byType.get(typeName)!.push(e);
    }

    const typeNames = [...byType.keys()].sort((a, b) => {
      const ai = TYPE_ORDER.indexOf(a);
      const bi = TYPE_ORDER.indexOf(b);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      if (a === 'Unspecified') return 1;
      if (b === 'Unspecified') return -1;
      return a.localeCompare(b);
    });

    return typeNames.map((typeName) => {
      const typeEnquiries = byType.get(typeName)!;
      const byStage = new Map<string, EnquiryListItem[]>();
      for (const e of typeEnquiries) {
        const stageName = e.enquiry_lead_stages[0]?.lead_stages.name ?? 'No stage';
        if (!byStage.has(stageName)) byStage.set(stageName, []);
        byStage.get(stageName)!.push(e);
      }

      const stageNames = [...byStage.keys()].sort((a, b) => {
        if (a === 'No stage') return 1;
        if (b === 'No stage') return -1;
        return (stageOrder.get(a) ?? 999) - (stageOrder.get(b) ?? 999);
      });

      return {
        type: typeName,
        stages: stageNames.map((stageName) => ({
          stage: stageName,
          enquiries: [...byStage.get(stageName)!].sort((a, b) => {
            const fa = a.clients?.follow_up_date;
            const fb = b.clients?.follow_up_date;
            if (!fa && !fb) return 0;
            if (!fa) return 1;
            if (!fb) return -1;
            return fa < fb ? -1 : fa > fb ? 1 : 0;
          }),
        })),
      };
    });
  }, [filtered, lookups.leadStages]);

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

      {filtered.length === 0 ? (
        <p className="text-zinc-500">No enquiries match your search.</p>
      ) : (
        <div className="flex flex-col gap-8">
          {groups.map((g) => {
            const typeKey = `type:${g.type}`;
            const typeExpanded = expanded.has(typeKey);
            const typeCount = g.stages.reduce((sum, s) => sum + s.enquiries.length, 0);

            return (
              <div key={g.type} className="surface-card">
                <button
                  type="button"
                  onClick={() => toggleExpanded(typeKey)}
                  className="flex w-full items-center gap-2 rounded-2xl px-5 py-4 text-left transition hover:bg-white/[0.03]"
                >
                  <span className={`text-xs text-zinc-500 transition-transform ${typeExpanded ? 'rotate-90' : ''}`}>▸</span>
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-200">{g.type}</h2>
                  <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs font-medium text-zinc-500 ring-1 ring-inset ring-white/10">{typeCount}</span>
                </button>

                {typeExpanded && (
                  <div className="flex flex-col gap-4 px-5 pb-5">
                    {g.stages.map((s) => {
                      const stageKey = `stage:${g.type}::${s.stage}`;
                      const stageExpanded = expanded.has(stageKey);

                      return (
                        <div key={s.stage} className="rounded-xl bg-white/[0.03] ring-1 ring-white/5">
                          <button
                            type="button"
                            onClick={() => toggleExpanded(stageKey)}
                            className="flex w-full items-center gap-2 rounded-xl px-4 py-3 text-left transition hover:bg-white/[0.03]"
                          >
                            <span className={`text-[10px] text-zinc-500 transition-transform ${stageExpanded ? 'rotate-90' : ''}`}>▸</span>
                            <h3 className="text-xs font-medium text-zinc-300">{s.stage}</h3>
                            <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium text-zinc-500 ring-1 ring-inset ring-white/10">{s.enquiries.length}</span>
                          </button>
                          {stageExpanded && (
                            <div className="flex flex-col gap-4 px-4 pb-4">
                              {s.enquiries.map((e) => (
                                <EnquiryCard
                                  key={e.id}
                                  enquiry={e}
                                  lookups={lookups}
                                  clients={clients}
                                  properties={properties}
                                  taskTypes={taskTypes}
                                  activityTypes={activityTypes}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
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
