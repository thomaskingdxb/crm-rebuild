import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDeal } from '@/lib/deals';
import { getDealFlags, daysOverdue } from '@/lib/coaching';
import { grossCommission, netCommission } from '@/lib/deals';
import { getChequesForDeal } from '@/lib/rentalCheques';
import { addChequeAction, markChequeDepositedAction, deleteChequeAction } from '@/app/deals/actions';
import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/date';
import BackLink from '@/components/BackLink';
import SubmitButton from '@/components/SubmitButton';

const sectionClass = 'surface-card p-6';
const inputClass = 'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-blue-500/50 focus:outline-none';

function formatAed(n: number | null): string {
  return n != null ? `AED ${n.toLocaleString()}` : '—';
}

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [deal, flags] = await Promise.all([getDeal(id, supabase), getDealFlags(id, supabase)]);

  if (!deal) notFound();

  const isRental = deal.deal_type_id === 1;
  const cheques = isRental ? await getChequesForDeal(id, supabase) : [];

  const gross = grossCommission(deal);
  const net = netCommission(deal);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="px-6 py-8">
        <BackLink href="/deals" label="← Back to Deals" />

        <div className="mt-3">
          <h1 className="text-2xl font-semibold text-zinc-100">
            {deal.properties ? `${deal.properties.building ?? 'Unnamed'} ${deal.properties.unit_number ? `· ${deal.properties.unit_number}` : ''}` : 'No property'}
          </h1>
          <p className="text-sm text-zinc-500">
            {deal.id}
            {deal.owner && (
              <>
                {' · Owner: '}
                <Link href={`/clients/${deal.owner.id}`} className="text-blue-400 hover:text-blue-300">
                  {deal.owner.name}
                </Link>
              </>
            )}
            {deal.buyer && (
              <>
                {' · Buyer/Tenant: '}
                <Link href={`/clients/${deal.buyer.id}`} className="text-blue-400 hover:text-blue-300">
                  {deal.buyer.name}
                </Link>
              </>
            )}
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            Editing happens from the <Link href="/deals" className="text-blue-400 hover:underline">Deals board</Link>.
          </p>
        </div>

        <div className="mt-6 space-y-6">
          <div className={sectionClass}>
            <h2 className="mb-4 text-sm font-semibold text-zinc-100">Summary</h2>
            <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <div>
                <p className="text-xs text-zinc-500">Type</p>
                <p className="text-zinc-200">{deal.deal_types?.name ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Stage</p>
                <p className="text-zinc-200">{deal.deal_stages?.name ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Value</p>
                <p className="text-zinc-200">{deal.value != null ? deal.value.toLocaleString() : '—'}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Gross commission</p>
                <p className="text-zinc-200">{gross != null ? gross.toLocaleString() : '—'}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Net commission</p>
                <p className="text-zinc-200">{net != null ? net.toLocaleString() : '—'}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Date agreed</p>
                <p className="text-zinc-200">{deal.date_agreed ? formatDate(deal.date_agreed) : '—'}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Date completed</p>
                <p className="text-zinc-200">{deal.date_completed ? formatDate(deal.date_completed) : '—'}</p>
              </div>
            </div>
            {deal.notes && <p className="mt-4 whitespace-pre-wrap text-sm text-zinc-400">{deal.notes}</p>}
          </div>

          <div className={sectionClass}>
            <h2 className="mb-4 text-sm font-semibold text-zinc-100">Coaching flags ({flags.length})</h2>
            {flags.length === 0 ? (
              <p className="text-sm text-zinc-500">No coaching flags linked to this deal.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {flags.map((f) => {
                  const overdue = f.flag_type === 'commitment' && f.due_date ? daysOverdue(f.due_date) : null;
                  return (
                    <div
                      key={f.id}
                      className={`rounded-lg p-4 ring-1 ring-inset ${overdue !== null && overdue > 0 ? 'bg-rose-500/5 ring-rose-500/20' : 'bg-white/5 ring-white/10'}`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">{f.flag_type.replace('_', ' ')}</span>
                        <div className="flex items-center gap-2">
                          {overdue !== null && overdue > 0 && (
                            <span className="rounded-full bg-rose-500/15 px-2 py-1 text-[10px] font-semibold text-rose-400">
                              {overdue}d overdue
                            </span>
                          )}
                          <span
                            className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                              f.resolved ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
                            }`}
                          >
                            {f.resolved ? 'Resolved' : 'Open'}
                          </span>
                        </div>
                      </div>
                      <p className="rounded-md bg-black/20 p-2 text-sm text-zinc-300">&ldquo;{f.whatsapp_messages.body}&rdquo;</p>
                      {f.note && <p className="mt-2 text-xs text-zinc-500">{f.note}</p>}
                      {f.due_date && <p className="mt-2 text-xs text-zinc-500">Due {formatDate(f.due_date)}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {isRental && (
            <div className={sectionClass}>
              <h2 className="mb-4 text-sm font-semibold text-zinc-100">Rental cheques ({cheques.length})</h2>

              {cheques.length === 0 ? (
                <p className="mb-4 text-sm text-zinc-500">No cheques recorded for this deal yet.</p>
              ) : (
                <div className="mb-4 flex flex-col gap-3">
                  {cheques.map((c) => (
                    <div key={c.id} className="flex items-center justify-between gap-3 rounded-lg bg-white/5 p-4 ring-1 ring-inset ring-white/10">
                      <div>
                        <p className="text-sm font-medium text-zinc-100">
                          Cheque #{c.cheque_number} — {formatAed(c.amount)}
                        </p>
                        <p className="text-xs text-zinc-500">
                          Due {formatDate(c.due_date)}
                          {c.deposited && c.deposited_date && ` · Deposited ${formatDate(c.deposited_date)}`}
                        </p>
                        {c.notes && <p className="mt-1 text-xs text-zinc-500">{c.notes}</p>}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                            c.deposited ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
                          }`}
                        >
                          {c.deposited ? 'Deposited' : 'Pending'}
                        </span>
                        {!c.deposited && (
                          <form action={markChequeDepositedAction.bind(null, c.id, id)}>
                            <SubmitButton
                              pendingText="Marking..."
                              className="rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20 hover:bg-emerald-500/20"
                            >
                              Mark deposited
                            </SubmitButton>
                          </form>
                        )}
                        <form action={deleteChequeAction.bind(null, c.id, id)}>
                          <SubmitButton
                            pendingText="Removing..."
                            className="rounded-lg bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-400 ring-1 ring-inset ring-rose-500/20 hover:bg-rose-500/20"
                          >
                            Remove
                          </SubmitButton>
                        </form>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <form action={addChequeAction.bind(null, id)} className="grid grid-cols-2 gap-3 rounded-lg bg-white/5 p-4 ring-1 ring-inset ring-white/10 sm:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs text-zinc-500">Cheque #</label>
                  <input name="cheque_number" type="number" min="1" required className={inputClass} />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-zinc-500">Amount (AED)</label>
                  <input name="amount" type="number" step="0.01" min="0" required className={inputClass} />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-zinc-500">Due date</label>
                  <input name="due_date" type="date" required className={inputClass} />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-zinc-500">Notes (optional)</label>
                  <input name="notes" type="text" className={inputClass} />
                </div>
                <div className="col-span-2 sm:col-span-4">
                  <SubmitButton
                    pendingText="Adding..."
                    className="rounded-lg bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-400 ring-1 ring-inset ring-blue-500/20 hover:bg-blue-500/20"
                  >
                    + Add cheque
                  </SubmitButton>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
