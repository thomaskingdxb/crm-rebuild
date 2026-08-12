import { getContentIdeasByStatus } from '@/lib/coaching';
import { createClient } from '@/lib/supabase/server';
import { markPostedAction, dismissIdeaAction, updateDraftCopyAction } from '@/app/social/actions';
import type { ContentIdea } from '@/types/database';

const sectionClass = 'surface-card p-6';
const textareaClass =
  'w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

function IdeaCard({ idea }: { idea: ContentIdea }) {
  return (
    <div className="rounded-lg bg-white/5 p-4 ring-1 ring-inset ring-white/10">
      <div className="mb-2 flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-zinc-100">{idea.idea}</p>
        <p className="shrink-0 text-xs text-zinc-500">{new Date(idea.created_at).toLocaleDateString()}</p>
      </div>

      <form action={updateDraftCopyAction.bind(null, idea.id)} className="mb-3">
        <textarea
          name="draft_copy"
          defaultValue={idea.draft_copy ?? ''}
          placeholder="No drafted copy yet — write or paste one here"
          rows={5}
          className={textareaClass}
        />
        <button type="submit" className="mt-2 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-300 ring-1 ring-inset ring-white/10 hover:bg-white/10">
          Save edits
        </button>
      </form>

      <div className="flex gap-2">
        <form action={markPostedAction.bind(null, idea.id)}>
          <button type="submit" className="rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20 hover:bg-emerald-500/20">
            Mark posted
          </button>
        </form>
        <form action={dismissIdeaAction.bind(null, idea.id)}>
          <button type="submit" className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-500 ring-1 ring-inset ring-white/10 hover:bg-rose-500/10 hover:text-rose-400">
            Dismiss
          </button>
        </form>
      </div>
    </div>
  );
}

export default async function SocialPage() {
  const supabase = await createClient();
  const [newIdeas, posted, dismissed] = await Promise.all([
    getContentIdeasByStatus('new', supabase),
    getContentIdeasByStatus('posted', supabase),
    getContentIdeasByStatus('dismissed', supabase),
  ]);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-zinc-100">Social</h1>
          <p className="text-sm text-zinc-500">Content ideas surfaced from coaching passes, with drafted copy — you post manually.</p>
        </div>

        <div className="space-y-6">
          <div className={sectionClass}>
            <h2 className="mb-4 text-sm font-semibold text-zinc-100">New Ideas ({newIdeas.length})</h2>
            {newIdeas.length === 0 ? (
              <p className="text-sm text-zinc-500">No new ideas yet — these come from coaching passes noticing something worth posting about.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {newIdeas.map((idea) => (
                  <IdeaCard key={idea.id} idea={idea} />
                ))}
              </div>
            )}
          </div>

          {posted.length > 0 && (
            <details className={sectionClass}>
              <summary className="cursor-pointer text-sm font-semibold text-zinc-100">Posted ({posted.length})</summary>
              <div className="mt-4 flex flex-col gap-2">
                {posted.map((idea) => (
                  <div key={idea.id} className="rounded-lg bg-white/5 px-4 py-3 ring-1 ring-inset ring-white/10">
                    <p className="text-sm text-zinc-300">{idea.idea}</p>
                    <p className="mt-1 text-xs text-zinc-500">Posted {idea.posted_at ? new Date(idea.posted_at).toLocaleDateString() : ''}</p>
                  </div>
                ))}
              </div>
            </details>
          )}

          {dismissed.length > 0 && (
            <details className={sectionClass}>
              <summary className="cursor-pointer text-sm font-semibold text-zinc-100">Dismissed ({dismissed.length})</summary>
              <div className="mt-4 flex flex-col gap-2">
                {dismissed.map((idea) => (
                  <div key={idea.id} className="rounded-lg bg-white/5 px-4 py-3 ring-1 ring-inset ring-white/10">
                    <p className="text-sm text-zinc-500">{idea.idea}</p>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
