import Link from 'next/link';
import type { ClientListItem, Lookup } from '@/types/database';
import { daysSince, formatDate } from '@/lib/date';
import { telHref, whatsappHref } from '@/lib/phone';
import LogActivityButton from '@/components/LogActivityButton';

const STATUS_STYLES: Record<string, string> = {
  Ongoing: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
  Closed: 'bg-white/5 text-zinc-400 ring-white/10',
  Unresponsive: 'bg-rose-500/10 text-rose-400 ring-rose-500/20',
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

export default function ClientCard({ client, activityTypes }: { client: ClientListItem; activityTypes: Lookup[] }) {
  const days = daysSince(client.lastActivityDate);
  const activity = activityChip(days);
  const tel = telHref(client.phone);
  const wa = whatsappHref(client.phone);

  const types = client.client_client_types.map((t) => t.client_types.name);
  const statuses = client.client_client_statuses.map((s) => s.client_statuses.name);

  return (
    <div className="group relative flex flex-col gap-3 rounded-2xl bg-gradient-to-br from-[#1c2438] via-[#15161e] to-[#101014] p-5 shadow-xl shadow-black/40 ring-1 ring-white/5 transition hover:ring-white/10 hover:from-[#212c47]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href={`/clients/${client.id}`} className="flex min-w-0 flex-1 items-center gap-4">
          <div className="min-w-0 shrink-0 sm:w-48">
            <p className="truncate text-base font-semibold text-zinc-100">{client.name}</p>
            <p className="text-xs text-zinc-500">{client.id}</p>
          </div>

          <div className="flex flex-1 flex-wrap items-center gap-1.5">
            {types.map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-400 ring-1 ring-inset ring-blue-500/20"
              >
                {t}
              </span>
            ))}
            {statuses.map((s) => (
              <span
                key={s}
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[s] ?? 'bg-white/5 text-zinc-400 ring-white/10'}`}
              >
                {s}
              </span>
            ))}
          </div>

          <span
            title="Days since last activity"
            className={`inline-flex shrink-0 items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${activity.className}`}
          >
            {activity.text}
          </span>
        </Link>

        <div className="flex shrink-0 gap-2 border-t border-white/5 pt-3 sm:border-t-0 sm:pt-0">
          <LogActivityButton
            clientId={client.id}
            activityTypes={activityTypes}
            label="Log Activity"
            className="rounded-lg bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-400 ring-1 ring-inset ring-blue-500/20 transition hover:bg-blue-500/20"
          />
          {wa && (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20 transition hover:bg-emerald-500/20"
            >
              WhatsApp
            </a>
          )}
          {tel && (
            <a
              href={tel}
              className="rounded-lg bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-400 ring-1 ring-inset ring-blue-500/20 transition hover:bg-blue-500/20"
            >
              Call
            </a>
          )}
        </div>
      </div>

      {(client.follow_up_date || client.notes) && (
        <div className="flex flex-wrap items-center gap-3 border-t border-white/5 pt-3">
          {client.follow_up_date && (
            <span className={`shrink-0 text-xs font-medium ${followUpClass(client.follow_up_date)}`}>
              Follow up: {formatDate(client.follow_up_date)}
            </span>
          )}
          {client.notes && <p className="truncate text-xs text-zinc-500">{client.notes}</p>}
        </div>
      )}
    </div>
  );
}
