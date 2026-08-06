import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDeal, getDealLookups } from '@/lib/deals';
import { getClientsBasic } from '@/lib/clients';
import { getPropertiesBasic } from '@/lib/properties';
import { updateDealAction, deleteDealAction } from '@/app/deals/actions';
import SearchableSelect from '@/components/SearchableSelect';
import DeleteButton from '@/components/DeleteButton';

const inputClass =
  'w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';
const labelClass = 'block text-xs font-medium text-zinc-400 mb-1';
const pillSpanClass =
  'inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium text-zinc-400 ring-1 ring-inset ring-white/10 transition hover:ring-white/20 peer-checked:bg-blue-500/20 peer-checked:text-blue-300 peer-checked:ring-blue-500/40';

function PillGroup({ name, options, selectedIds }: { name: string; options: { id: number; name: string }[]; selectedIds: Set<number> }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <label key={o.id} className="cursor-pointer">
          <input type="checkbox" name={name} value={o.id} defaultChecked={selectedIds.has(o.id)} className="peer sr-only" />
          <span className={pillSpanClass}>{o.name}</span>
        </label>
      ))}
    </div>
  );
}

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [deal, lookups, clients, properties] = await Promise.all([
    getDeal(id),
    getDealLookups(),
    getClientsBasic(),
    getPropertiesBasic(),
  ]);

  if (!deal) notFound();

  const updateWithId = updateDealAction.bind(null, id);
  const deleteWithId = deleteDealAction.bind(null, id);
  const selectedStageIds = new Set(deal.deal_lead_stages.map((s) => s.lead_stages.id));

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="px-6 py-8">
        <Link href="/deals" className="text-sm text-zinc-500 hover:text-zinc-300">
          ← Back to Deals
        </Link>

        <div className="mt-3 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-100">
              {deal.properties ? (
                <Link href={`/properties/${deal.properties.id}`} className="hover:text-blue-300">
                  {deal.properties.building ?? 'Unnamed'} {deal.properties.unit_number ? `· ${deal.properties.unit_number}` : ''}
                </Link>
              ) : (
                'No property'
              )}
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
          </div>
          <DeleteButton label="Delete Deal" confirmText="Delete this deal? This cannot be undone." action={deleteWithId} />
        </div>

        <form action={updateWithId} className="mt-6 max-w-xl space-y-4 rounded-2xl bg-[#14141c] p-6 shadow-xl shadow-black/40 ring-1 ring-white/5">
          <div>
            <label className={labelClass}>Property</label>
            <SearchableSelect
              name="property_id"
              options={properties.map((p) => ({ id: p.id, label: `${p.building ?? 'Unnamed'} ${p.unit_number ? `· ${p.unit_number}` : ''} (${p.id})` }))}
              defaultValue={deal.property_id}
              placeholder="Search properties..."
            />
          </div>

          <div>
            <label className={labelClass}>Owner</label>
            <SearchableSelect
              name="owner_id"
              options={clients.map((c) => ({ id: c.id, label: `${c.name} (${c.id})` }))}
              defaultValue={deal.owner_id}
              placeholder="Search clients..."
            />
          </div>

          <div>
            <label className={labelClass}>Buyer / Tenant</label>
            <SearchableSelect
              name="buyer_id"
              options={clients.map((c) => ({ id: c.id, label: `${c.name} (${c.id})` }))}
              defaultValue={deal.buyer_id}
              placeholder="Search clients..."
            />
          </div>

          <div>
            <label className={labelClass}>Deal type</label>
            <select name="deal_type_id" defaultValue={deal.deal_type_id ?? ''} className={inputClass}>
              <option value="">—</option>
              {lookups.dealTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div>
            <span className={labelClass}>Lead stage</span>
            <PillGroup name="lead_stage_ids" options={lookups.leadStages} selectedIds={selectedStageIds} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Value</label>
              <input name="value" type="number" step="any" defaultValue={deal.value ?? ''} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Commission %</label>
              <input name="commission_percent" type="number" step="any" defaultValue={deal.commission_percent ?? ''} className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Commission amount</label>
            <input name="commission_amount" type="number" step="any" defaultValue={deal.commission_amount ?? ''} className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Date agreed</label>
              <input name="date_agreed" type="date" defaultValue={deal.date_agreed ?? ''} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Date completed</label>
              <input name="date_completed" type="date" defaultValue={deal.date_completed ?? ''} className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Notes</label>
            <textarea name="notes" defaultValue={deal.notes ?? ''} rows={4} className={inputClass} />
          </div>

          <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500">
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}
