import Link from 'next/link';
import type { EnquiryListItem } from '@/types/database';
import { formatDate, daysSince } from '@/lib/date';

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

export default function PipelineCard({ enquiry }: { enquiry: EnquiryListItem }) {
  const type = enquiry.enquiry_enquiry_types[0]?.enquiry_types.name ?? null;
  const days = daysSince(enquiry.clientLastActivityDate);
  const activity = activityChip(days);
  const followUp = enquiry.clients?.follow_up_date ?? null;

  return (
    <Link
      href={`/enquiries/${enquiry.id}`}
      className="block rounded-xl bg-gradient-to-br from-[#1c2438] via-[#15161e] to-[#101014] p-3 shadow-lg shadow-black/40 ring-1 ring-white/5 transition hover:ring-white/10 hover:from-[#212c47]"
    >
      <p className="truncate text-sm font-semibold text-zinc-100">{enquiry.clients ? enquiry.clients.name : 'No client'}</p>
      <div className="mt-1 flex flex-wrap items-center gap-1.5">
        {type && (
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${TYPE_STYLES[type] ?? 'bg-blue-500/10 text-blue-400 ring-blue-500/20'}`}>
            {type}
          </span>
        )}
        <span
          title="Days since last activity"
          className={`inline-flex shrink-0 items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${activity.className}`}
        >
          {activity.text}
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between">
        {enquiry.budget ? <p className="text-xs font-semibold text-white">AED {enquiry.budget.toLocaleString()}</p> : <span />}
        <p className={`text-[10px] ${followUpClass(followUp)}`}>{followUp ? formatDate(followUp) : ''}</p>
      </div>
    </Link>
  );
}
