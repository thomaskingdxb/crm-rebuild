import Link from 'next/link';
import {
  getOpenNeedsResponseFlags,
  getSuggestedResolvedFlags,
  getOpenTaskFlags,
  getUnmatchedContacts,
  getContentIdeas,
  getLastCoachingPassAt,
} from '@/lib/coaching';
import { createClient } from '@/lib/supabase/server';
import { resolveFlagAction, dismissContentIdeaAction } from '@/app/coaching/actions';
import type { CoachingFlagWithContext } from '@/types/database';

const sectionClass = 'surface-card p-6';

function timeAgo(iso: string | null) {
  if (!iso) return 'never';
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / 3_600_000);
  if (hours < 1) return 'less than an hour ago';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function FlagCard({ flag, showConfirm = false }: { flag: CoachingFlagWithContext; showConfirm?: boolean }) {
  const msg = flag.whatsapp_messages;
  const contact = msg.whatsapp_conversations.whatsapp_contacts;

  return (
    <div className="rounded-lg bg-white/5 p-4 ring-1 ring-inset ring-white/10">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-zinc-100">{contact.display_name}</p>
          <p className="text-xs text-zinc-500">{new Date(msg.sent_at).toLocaleString()}</p>
        </div>
        <form action={resolveFlagAction.bind(null, flag.id)}>
          <button
            type="submit"
            className="shrink-0 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20 hover:bg-emerald-500/20"
          >
            {showConfirm ? 'Confirm resolved' : 'Mark resolved'}
          </button>
        </form>
      </div>

      <p className="mb-2 rounded-md bg-black/20 p-2 text-sm text-zinc-300">&ldquo;{msg.body}&rdquo;</p>

      {flag.note && <p className="mb-2 text-xs text-zinc-500">{flag.note}</p>}

      {flag.draft && (
        <div className="mt-2 rounded-md bg-blue-500/10 p-2 ring-1 ring-inset ring-blue-500/20">
          <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-blue-400">Draft reply</p>
          <p className="text-sm text-zinc-200">{flag.draft.draft_text}</p>
        </div>
      )}

      {flag.task && (
        <p className="mt-2 text-xs text-zinc-500">
          Linked task: <Link href="/tasks" className="text-blue-400 hover:underline">{flag.task.id}</Link>
        </p>
      )}

      {contact.client_id && (
        <p className="mt-2 text-xs">
          <Link href={`/clients/${contact.client_id}`} className="text-blue-400 hover:underline">
            View client →
          </Link>
        </p>
      )}
    </div>
  );
}

export default async function CoachingPage() {
  const supabase = await createClient();
  const [needsResponse, suggestedResolved, openTasks, unmatched, contentIdeas, lastPass] = await Promise.all([
    getOpenNeedsResponseFlags(supabase),
    getSuggestedResolvedFlags(supabase),
    getOpenTaskFlags(supabase),
    getUnmatchedContacts(supabase),
    getContentIdeas(supabase),
    getLastCoachingPassAt(supabase),
  ]);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-zinc-100">Coaching</h1>
          <p className="text-sm text-zinc-500">
            WhatsApp triage · last coaching pass {timeAgo(lastPass)}
          </p>
        </div>

        <div className="space-y-6">
          <div className={sectionClass}>
            <h2 className="mb-4 text-sm font-semibold text-zinc-100">Needs Response ({needsResponse.length})</h2>
            {needsResponse.length === 0 ? (
              <p className="text-sm text-zinc-500">Nothing waiting on you right now.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {needsResponse.map((f) => (
                  <FlagCard key={f.id} flag={f} />
                ))}
              </div>
            )}
          </div>

          {suggestedResolved.length > 0 && (
            <div className={sectionClass}>
              <h2 className="mb-4 text-sm font-semibold text-zinc-100">
                Looks handled — confirm? ({suggestedResolved.length})
              </h2>
              <p className="mb-4 text-xs text-zinc-500">
                You&apos;ve already replied in these threads since the flag was raised — confirm to close them out.
              </p>
              <div className="flex flex-col gap-4">
                {suggestedResolved.map((f) => (
                  <FlagCard key={f.id} flag={f} showConfirm />
                ))}
              </div>
            </div>
          )}

          <div className={sectionClass}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-100">Open Tasks & Missed Leads ({openTasks.length})</h2>
              <Link href="/tasks" className="text-xs font-medium text-blue-400 hover:underline">
                View all tasks →
              </Link>
            </div>
            {openTasks.length === 0 ? (
              <p className="text-sm text-zinc-500">Nothing outstanding.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {openTasks.map((f) => (
                  <FlagCard key={f.id} flag={f} />
                ))}
              </div>
            )}
          </div>

          <div className={sectionClass}>
            <h2 className="mb-4 text-sm font-semibold text-zinc-100">New Leads ({unmatched.length})</h2>
            {unmatched.length === 0 ? (
              <p className="text-sm text-zinc-500">No unmatched WhatsApp contacts.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {unmatched.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-3 ring-1 ring-inset ring-white/10">
                    <span className="text-sm text-zinc-200">{c.display_name}</span>
                    <Link
                      href={`/clients/new?name=${encodeURIComponent(c.display_name)}`}
                      className="rounded-lg bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-400 ring-1 ring-inset ring-blue-500/20 hover:bg-blue-500/20"
                    >
                      + Add as client
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={sectionClass}>
            <h2 className="mb-4 text-sm font-semibold text-zinc-100">Content Ideas ({contentIdeas.length})</h2>
            {contentIdeas.length === 0 ? (
              <p className="text-sm text-zinc-500">No content ideas yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {contentIdeas.map((idea) => (
                  <div key={idea.id} className="flex items-start justify-between gap-3 rounded-lg bg-white/5 p-4 ring-1 ring-inset ring-white/10">
                    <p className="text-sm text-zinc-300">{idea.idea}</p>
                    <form action={dismissContentIdeaAction.bind(null, idea.id)}>
                      <button type="submit" className="shrink-0 text-xs text-zinc-500 hover:text-rose-400">
                        Dismiss
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
