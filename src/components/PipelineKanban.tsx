'use client';

import { useMemo } from 'react';
import type { EnquiryListItem, Lookup } from '@/types/database';
import PipelineCard from '@/components/PipelineCard';
import { usePersistentState } from '@/lib/usePersistentState';

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

function enquiryCategory(e: EnquiryListItem): 'sale' | 'rental' | null {
  const name = e.enquiry_enquiry_types[0]?.enquiry_types.name;
  if (name === 'Rental') return 'rental';
  if (name === 'Sale') return 'sale';
  return null;
}

// Longest-neglected clients (oldest last-activity date, or none at all) sort first,
// so each column surfaces who needs a follow-up most.
function sortByStaleness(list: EnquiryListItem[]): EnquiryListItem[] {
  return [...list].sort((a, b) => {
    const da = a.clientLastActivityDate;
    const db = b.clientLastActivityDate;
    if (!da && !db) return 0;
    if (!da) return -1;
    if (!db) return 1;
    return da < db ? -1 : da > db ? 1 : 0;
  });
}

function Lane({
  title,
  stages,
  enquiries,
  lookups,
  clients,
  properties,
  taskTypes,
  activityTypes,
}: {
  title: string;
  stages: Lookup[];
  enquiries: EnquiryListItem[];
  lookups: EnquiryLookups;
  clients: { id: string; name: string }[];
  properties: { id: string; building: string | null; unit_number: string | null }[];
  taskTypes: Lookup[];
  activityTypes: Lookup[];
}) {
  const byStage = useMemo(() => {
    const map = new Map<number | 'unassigned', EnquiryListItem[]>();
    for (const e of enquiries) {
      const stageId = e.enquiry_lead_stages[0]?.lead_stages.id ?? 'unassigned';
      if (!map.has(stageId)) map.set(stageId, []);
      map.get(stageId)!.push(e);
    }
    return map;
  }, [enquiries]);

  const columns = useMemo(() => {
    const cols = stages.map((s) => ({ id: s.id as number | 'unassigned', name: s.name, enquiries: sortByStaleness(byStage.get(s.id) ?? []) }));
    const unassigned = byStage.get('unassigned') ?? [];
    if (unassigned.length > 0) cols.push({ id: 'unassigned', name: 'Unassigned', enquiries: sortByStaleness(unassigned) });
    return cols;
  }, [stages, byStage]);

  return (
    <div className="surface-card p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-200">
        {title} <span className="text-zinc-500">({enquiries.length})</span>
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {columns.map((col) => (
          <div key={col.id} className="flex w-72 shrink-0 flex-col gap-3 rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/5">
            <p className="flex items-center justify-between px-1 text-xs font-medium text-zinc-400">
              <span>{col.name}</span>
              <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] ring-1 ring-inset ring-white/10">{col.enquiries.length}</span>
            </p>
            <div className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto">
              {col.enquiries.map((e) => (
                <PipelineCard
                  key={e.id}
                  enquiry={e}
                  lookups={lookups}
                  clients={clients}
                  properties={properties}
                  taskTypes={taskTypes}
                  activityTypes={activityTypes}
                />
              ))}
              {col.enquiries.length === 0 && <p className="py-2 text-center text-xs text-zinc-600">—</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PipelineKanban({
  enquiries,
  stages,
  lookups,
  clients,
  properties,
  taskTypes,
  activityTypes,
}: {
  enquiries: EnquiryListItem[];
  stages: Lookup[];
  lookups: EnquiryLookups;
  clients: { id: string; name: string }[];
  properties: { id: string; building: string | null; unit_number: string | null }[];
  taskTypes: Lookup[];
  activityTypes: Lookup[];
}) {
  const [query, setQuery] = usePersistentState('pipeline:query', '');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return enquiries;
    return enquiries.filter((e) => {
      const haystack = [e.id, e.clients?.name, e.building, e.notes, ...e.enquiry_areas.map((a) => a.areas.name)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [enquiries, query]);

  const saleEnquiries = filtered.filter((e) => enquiryCategory(e) === 'sale');
  const rentalEnquiries = filtered.filter((e) => enquiryCategory(e) === 'rental');
  const unassignedTypeEnquiries = sortByStaleness(filtered.filter((e) => enquiryCategory(e) === null));

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by client, building, area..."
        className="mb-4 w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:max-w-sm"
      />

      <p className="mb-4 text-xs text-zinc-500">
        {filtered.length} of {enquiries.length} active enquiries
      </p>

      <div className="flex flex-col gap-6">
        <Lane
          title="Sale"
          stages={stages}
          enquiries={saleEnquiries}
          lookups={lookups}
          clients={clients}
          properties={properties}
          taskTypes={taskTypes}
          activityTypes={activityTypes}
        />
        <Lane
          title="Rental"
          stages={stages}
          enquiries={rentalEnquiries}
          lookups={lookups}
          clients={clients}
          properties={properties}
          taskTypes={taskTypes}
          activityTypes={activityTypes}
        />

        {unassignedTypeEnquiries.length > 0 && (
          <div className="surface-card p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-200">
              Unassigned <span className="text-zinc-500">({unassignedTypeEnquiries.length})</span>
            </h2>
            <p className="mb-3 text-xs text-zinc-500">These enquiries have no Sale/Rental type set. Open one and set its enquiry type.</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {unassignedTypeEnquiries.map((e) => (
                <PipelineCard
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
          </div>
        )}
      </div>
    </div>
  );
}
