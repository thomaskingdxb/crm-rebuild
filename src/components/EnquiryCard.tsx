'use client';

import { useState } from 'react';
import type { EnquiryListItem, Lookup } from '@/types/database';
import { formatDate, daysSince } from '@/lib/date';
import EnquiryDetailModal from '@/components/EnquiryDetailModal';

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

function activityChip(days: number | null): { text: string; className: string } {
  if (days === null) return { text: '—', className: 'bg-white/5 text-zinc-500 ring-white/10' };
  if (days <= 7) return { text: `${days}`, className: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20' };
  if (days <= 30) return { text: `${days}`, className: 'bg-amber-500/10 text-amber-400 ring-amber-500/20' };
  return { text: `${days}`, className: 'bg-rose-500/10 text-rose-400 ring-rose-500/20' };
}

function followUpClass(followUp: string | null): string {
  if (!followUp) return 'text-zinc-500';
  const days = daysSince(followUp);
  if (days === null) return 'text-zinc-500';
  if (days > 0) return 'text-rose-400';
  if (days === 0) return 'text-amber-400';
  return 'text-zinc-400';
}

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

export default function EnquiryCard({
  enquiry,
  lookups,
  clients,
  properties,
  taskTypes,
  activityTypes,
}: {
  enquiry: EnquiryListItem;
  lookups: EnquiryLookups;
  clients: { id: string; name: string }[];
  properties: { id: string; building: string | null; unit_number: string | null }[];
  taskTypes: Lookup[];
  activityTypes: Lookup[];
}) {
  const [open, setOpen] = useState(false);
  const types = enquiry.enquiry_enquiry_types.map((t) => t.enquiry_types.name);
  const stages = enquiry.enquiry_lead_stages.map((s) => s.lead_stages.name);
  const days = daysSince(enquiry.clientLastActivityDate);
  const activity = activityChip(days);
  const followUp = enquiry.clients?.follow_up_date ?? null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex flex-col gap-3 rounded-2xl bg-gradient-to-br from-[#1c2438] via-[#15161e] to-[#101014] p-5 text-left shadow-xl shadow-black/40 ring-1 ring-white/5 transition hover:ring-white/10 hover:from-[#212c47] sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-zinc-100">{enquiry.clients ? enquiry.clients.name : 'No client'}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {types.map((t) => (
              <span key={t} className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${TYPE_STYLES[t] ?? 'bg-blue-500/10 text-blue-400 ring-blue-500/20'}`}>
                {t}
              </span>
            ))}
            {stages.map((s) => (
              <span key={s} className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STAGE_STYLES[s] ?? 'bg-white/5 text-zinc-400 ring-white/10'}`}>
                {s}
              </span>
            ))}
            <span
              title="Days since last activity"
              className={`inline-flex shrink-0 items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${activity.className}`}
            >
              {activity.text}
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            <span className={followUpClass(followUp)}>Follow up: {followUp ? formatDate(followUp) : '—'}</span>
          </p>
        </div>

        <div className="shrink-0 text-right text-sm">
          {enquiry.budget && <p className="font-bold text-white">AED {enquiry.budget.toLocaleString()}</p>}
          {enquiry.enquiry_date && <p className="text-xs text-zinc-500">{formatDate(enquiry.enquiry_date)}</p>}
        </div>
      </button>

      <EnquiryDetailModal
        enquiry={enquiry}
        lookups={lookups}
        clients={clients}
        properties={properties}
        taskTypes={taskTypes}
        activityTypes={activityTypes}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
