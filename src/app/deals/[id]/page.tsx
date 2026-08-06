import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDeal, getDealLookups } from '@/lib/deals';
import { getClientsBasic } from '@/lib/clients';
import { getPropertiesBasic } from '@/lib/properties';
import { updateDealAction, deleteDealAction } from '@/app/deals/actions';
import SearchableSelect from '@/components/SearchableSelect';
import DeleteButton from '@/components/DeleteButton';
import DealTypeStageFields from '@/components/DealTypeStageFields';
import CommissionSplitInput from '@/components/CommissionSplitInput';
import BackLink from '@/components/BackLink';

const inputClass =
  'w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';
const labelClass = 'block text-xs font-medium text-zinc-400 mb-1';

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

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="px-6 py-8">
        <BackLink href="/deals" label="← Back to Deals" />

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

        <form action={updateWithId} className="mt-6 max-w-xl space-y-4 surface-card p-6">
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

          <DealTypeStageFields
            dealTypes={lookups.dealTypes}
            saleStages={lookups.saleStages}
            rentalStages={lookups.rentalStages}
            defaultDealTypeId={deal.deal_type_id}
            defaultDealStageId={deal.deal_stage_id}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Value</label>
              <input name="value" type="number" step="any" defaultValue={deal.value ?? ''} className={inputClass} />
            </div>
            <CommissionSplitInput
              label="Commission (gross)"
              percentName="commission_percent"
              amountName="commission_amount"
              defaultPercent={deal.commission_percent != null ? deal.commission_percent * 100 : null}
              defaultAmount={deal.commission_amount}
            />
          </div>

          <CommissionSplitInput
            label="Your split (net)"
            percentName="commission_split_percent"
            amountName="commission_split_amount"
            defaultPercent={deal.commission_split_percent != null ? deal.commission_split_percent * 100 : null}
            defaultAmount={deal.commission_split_amount}
            percentPlaceholder="e.g. 60 for 60% of gross"
          />

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
