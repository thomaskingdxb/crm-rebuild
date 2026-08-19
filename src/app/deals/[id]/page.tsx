import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDeal } from '@/lib/deals';
import { getDealFlags, daysOverdue } from '@/lib/coaching';
import { grossCommission, netCommission } from '@/lib/deals';
import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/date';
import BackLink from '@/components/BackLink';

const sectionClass = 'surface-card p-6';

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [deal, flags] = await Promise.all([getDeal(id, supabase), getDealFlags(id, supabase)]);

  if (!deal) notFound();

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
        </div>
      </div>
    </div>
  );
}
