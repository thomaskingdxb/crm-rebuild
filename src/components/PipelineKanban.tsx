'use client';

import { useMemo, useState } from 'react';
import type { EnquiryListItem, Lookup } from '@/types/database';
import PipelineCard from '@/components/PipelineCard';

export default function PipelineKanban({ enquiries, stages }: { enquiries: EnquiryListItem[]; stages: Lookup[] }) {
  const [query, setQuery] = useState('');

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

  const columns = useMemo(() => {
    const byStage = new Map<number | 'unassigned', EnquiryListItem[]>();
    for (const e of filtered) {
      const stageId = e.enquiry_lead_stages[0]?.lead_stages.id ?? 'unassigned';
      if (!byStage.has(stageId)) byStage.set(stageId, []);
      byStage.get(stageId)!.push(e);
    }

    const cols = stages.map((s) => ({ id: s.id, name: s.name, enquiries: byStage.get(s.id) ?? [] }));
    const unassigned = byStage.get('unassigned') ?? [];
    if (unassigned.length > 0) cols.push({ id: -1, name: 'Unassigned', enquiries: unassigned });
    return cols;
  }, [filtered, stages]);

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

      <div className="flex gap-4 overflow-x-auto pb-2">
        {columns.map((col) => (
          <div key={col.id} className="flex w-72 shrink-0 flex-col gap-3 surface-card p-3">
            <p className="flex items-center justify-between px-1 text-xs font-medium text-zinc-400">
              <span>{col.name}</span>
              <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] ring-1 ring-inset ring-white/10">{col.enquiries.length}</span>
            </p>
            <div className="flex max-h-[70vh] flex-col gap-2 overflow-y-auto">
              {col.enquiries.map((e) => (
                <PipelineCard key={e.id} enquiry={e} />
              ))}
              {col.enquiries.length === 0 && <p className="py-2 text-center text-xs text-zinc-600">—</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
