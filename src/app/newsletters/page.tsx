import Link from 'next/link';
import { getNewsletterEditions } from '@/lib/newsletters';
import { createClient } from '@/lib/supabase/server';
import { createEditionAction } from '@/app/newsletters/actions';
import SubmitButton from '@/components/SubmitButton';

export default async function NewslettersPage() {
  const supabase = await createClient();
  const editions = await getNewsletterEditions(supabase);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-100">Newsletters</h1>
            <p className="text-sm text-zinc-500">{editions.length} total</p>
          </div>
        </div>

        <form action={createEditionAction} className="surface-card mb-6 flex items-end gap-3 p-5">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-zinc-400">New edition period</label>
            <input
              name="period_label"
              required
              placeholder="e.g. September 2026"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <SubmitButton pendingText="Starting..." className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500">
            + Start Edition
          </SubmitButton>
        </form>

        {editions.length === 0 ? (
          <p className="text-sm text-zinc-500">No editions yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {editions.map((e) => (
              <Link
                key={e.id}
                href={`/newsletters/${e.id}`}
                className="surface-card-accent flex items-center justify-between p-5 transition hover:ring-1 hover:ring-blue-500/30"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-100">{e.period_label}</p>
                  {e.headline && <p className="mt-1 text-xs text-zinc-500">{e.headline}</p>}
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    e.status === 'sent' ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20' : 'bg-white/5 text-zinc-400 ring-1 ring-inset ring-white/10'
                  }`}
                >
                  {e.status === 'sent' ? 'Sent' : 'Draft'}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
