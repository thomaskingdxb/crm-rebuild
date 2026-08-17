import { notFound } from 'next/navigation';
import { getNewsletterEdition, getPriorEdition } from '@/lib/newsletters';
import { createClient } from '@/lib/supabase/server';
import {
  updateEditionAction,
  markSentAction,
  deleteEditionAction,
  addArticleAction,
  deleteArticleAction,
  addTransactionStatAction,
  deleteTransactionStatAction,
} from '@/app/newsletters/actions';
import BackLink from '@/components/BackLink';
import SubmitButton from '@/components/SubmitButton';

const inputClass =
  'w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';
const labelClass = 'block text-xs font-medium text-zinc-400 mb-1';
const sectionClass = 'surface-card p-6';

function money(n: number | null): string {
  if (n === null) return '—';
  return `AED ${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}m`;
}

export default async function NewsletterEditionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const edition = await getNewsletterEdition(id, supabase);
  if (!edition) notFound();
  const priorEdition = await getPriorEdition(id, supabase);

  const luxuryChangePct =
    edition.luxury_sales_value_aed && priorEdition?.luxury_sales_value_aed
      ? ((edition.luxury_sales_value_aed - priorEdition.luxury_sales_value_aed) / priorEdition.luxury_sales_value_aed) * 100
      : null;

  const updateWithId = updateEditionAction.bind(null, id);
  const addArticleWithId = addArticleAction.bind(null, id);
  const addStatWithId = addTransactionStatAction.bind(null, id);
  const markSentWithId = markSentAction.bind(null, id);
  const deleteWithId = deleteEditionAction.bind(null, id);

  const offPlan = edition.newsletter_transaction_stats.filter((s) => s.segment === 'off_plan');
  const ready = edition.newsletter_transaction_stats.filter((s) => s.segment === 'ready');

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="px-6 py-8">
        <BackLink href="/newsletters" label="← Back to Newsletters" />

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-100">{edition.period_label}</h1>
            <p className="text-sm text-zinc-500">{edition.status === 'sent' ? 'Sent' : 'Draft'}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {edition.status !== 'sent' && (
              <form action={markSentWithId}>
                <SubmitButton pendingText="Marking..." className="rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20 hover:bg-emerald-500/20">
                  Mark as Sent
                </SubmitButton>
              </form>
            )}
            <form action={deleteWithId}>
              <SubmitButton pendingText="Deleting..." className="rounded-lg bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-400 ring-1 ring-inset ring-rose-500/20 hover:bg-rose-500/20">
                Delete
              </SubmitButton>
            </form>
          </div>
        </div>

        <form action={updateWithId} className={`mt-6 space-y-4 ${sectionClass}`}>
          <div>
            <label className={labelClass}>Headline</label>
            <input name="headline" defaultValue={edition.headline ?? ''} placeholder="e.g. Dubai ultra-prime home sales hit $6 billion" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Market Insights &amp; Outlook</label>
            <textarea name="insights_text" defaultValue={edition.insights_text ?? ''} rows={6} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Luxury market (AED 36.7M+) — total sales value</label>
              <input name="luxury_sales_value_aed" type="number" step="0.01" defaultValue={edition.luxury_sales_value_aed ?? ''} placeholder="AED millions" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Luxury market — deal count</label>
              <input name="luxury_deal_count" type="number" defaultValue={edition.luxury_deal_count ?? ''} placeholder="Number of deals" className={inputClass} />
            </div>
          </div>
          {luxuryChangePct !== null && priorEdition && (
            <p className="text-xs text-zinc-500">
              {luxuryChangePct >= 0 ? '↑' : '↓'} {Math.abs(luxuryChangePct).toFixed(1)}% vs {priorEdition.period_label}
            </p>
          )}

          <SubmitButton pendingText="Saving..." className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500">
            Save
          </SubmitButton>
        </form>

        <div className="mt-6 space-y-6">
          <div className={sectionClass}>
            <h2 className="mb-4 text-sm font-semibold text-zinc-100">Curated News ({edition.newsletter_articles.length})</h2>
            <div className="mb-4 flex flex-col gap-3">
              {edition.newsletter_articles.map((a) => (
                <div key={a.id} className="rounded-lg bg-white/5 p-4 ring-1 ring-inset ring-white/10">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-zinc-100">{a.headline}</p>
                      <p className="mt-1 text-sm text-zinc-400">{a.summary}</p>
                      {a.source_url ? (
                        <a href={a.source_url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs text-blue-400 hover:underline">
                          Read on {a.source_name} →
                        </a>
                      ) : (
                        <p className="mt-1 text-xs text-zinc-500">Source: {a.source_name}</p>
                      )}
                    </div>
                    <form action={deleteArticleAction.bind(null, id, a.id)}>
                      <SubmitButton pendingText="Removing..." className="shrink-0 text-xs text-zinc-500 hover:text-rose-400">
                        Remove
                      </SubmitButton>
                    </form>
                  </div>
                </div>
              ))}
            </div>
            <details>
              <summary className="cursor-pointer text-xs font-medium text-blue-400">+ Add article</summary>
              <form action={addArticleWithId} className="mt-3 grid grid-cols-2 gap-3">
                <input name="headline" required placeholder="Headline" className={`col-span-2 ${inputClass}`} />
                <textarea name="summary" required placeholder="2-3 sentence summary" rows={2} className={`col-span-2 ${inputClass}`} />
                <input name="source_name" required placeholder="Source name (e.g. Gulf Business)" className={inputClass} />
                <input name="source_url" placeholder="Source URL" className={inputClass} />
                <input name="display_order" type="number" defaultValue={edition.newsletter_articles.length} placeholder="Order" className={inputClass} />
                <SubmitButton pendingText="Adding..." className="col-span-2 rounded-lg bg-white/5 px-3 py-2 text-xs font-medium text-zinc-300 ring-1 ring-inset ring-white/10 hover:bg-white/10">
                  Add
                </SubmitButton>
              </form>
            </details>
          </div>

          <div className={sectionClass}>
            <h2 className="mb-4 text-sm font-semibold text-zinc-100">Transaction Stats</h2>

            {(['off_plan', 'ready'] as const).map((segment) => {
              const rows = segment === 'off_plan' ? offPlan : ready;
              return (
                <div key={segment} className="mb-4">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">{segment === 'off_plan' ? 'Off-Plan' : 'Ready'}</p>
                  {rows.length === 0 ? (
                    <p className="text-sm text-zinc-500">No stats yet.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-zinc-500">
                          <th className="pb-2 font-medium">Category</th>
                          <th className="pb-2 font-medium">Value</th>
                          <th className="pb-2 font-medium">Share</th>
                          <th className="pb-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((s) => (
                          <tr key={s.id} className="border-t border-white/5">
                            <td className="py-2 text-zinc-200">{s.category}</td>
                            <td className="py-2 text-zinc-300">{money(s.value_aed)}</td>
                            <td className="py-2 text-zinc-300">{s.share_pct !== null ? `${s.share_pct}%` : '—'}</td>
                            <td className="py-2 text-right">
                              <form action={deleteTransactionStatAction.bind(null, id, s.id)}>
                                <SubmitButton pendingText="Removing..." className="text-xs text-zinc-500 hover:text-rose-400">
                                  Remove
                                </SubmitButton>
                              </form>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              );
            })}

            <details>
              <summary className="cursor-pointer text-xs font-medium text-blue-400">+ Add stat row</summary>
              <form action={addStatWithId} className="mt-3 grid grid-cols-2 gap-3">
                <input name="category" required placeholder="Category (e.g. Flats)" className={inputClass} />
                <select name="segment" required className={inputClass} defaultValue="off_plan">
                  <option value="off_plan">Off-Plan</option>
                  <option value="ready">Ready</option>
                </select>
                <input name="value_aed" type="number" step="0.01" placeholder="Value (AED millions)" className={inputClass} />
                <input name="share_pct" type="number" step="0.1" placeholder="Share %" className={inputClass} />
                <SubmitButton pendingText="Adding..." className="col-span-2 rounded-lg bg-white/5 px-3 py-2 text-xs font-medium text-zinc-300 ring-1 ring-inset ring-white/10 hover:bg-white/10">
                  Add
                </SubmitButton>
              </form>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
