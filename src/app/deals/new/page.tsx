import { getDealLookups } from '@/lib/deals';
import { getClientsBasic } from '@/lib/clients';
import { getPropertiesBasic } from '@/lib/properties';
import { createDealAction } from '@/app/deals/actions';
import { createClient } from '@/lib/supabase/server';
import SearchableSelect from '@/components/SearchableSelect';
import DealTypeStageFields from '@/components/DealTypeStageFields';
import CommissionSplitInput from '@/components/CommissionSplitInput';
import BackLink from '@/components/BackLink';

const inputClass =
  'w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';
const labelClass = 'block text-xs font-medium text-zinc-400 mb-1';

export default async function NewDealPage({
  searchParams,
}: {
  searchParams: Promise<{ owner?: string; buyer?: string; property?: string }>;
}) {
  const { owner, buyer, property } = await searchParams;
  const supabase = await createClient();
  const [lookups, clients, properties] = await Promise.all([getDealLookups(supabase), getClientsBasic(supabase), getPropertiesBasic(supabase)]);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="mx-auto max-w-xl px-6 py-8">
        <BackLink href="/deals" label="← Back to Deals" />

        <h1 className="mt-3 text-2xl font-semibold text-zinc-100 mb-6">Add Deal</h1>

        <form action={createDealAction} className="space-y-4 surface-card p-6">
          <div>
            <label className={labelClass}>Property</label>
            <SearchableSelect
              name="property_id"
              options={properties.map((p) => ({ id: p.id, label: `${p.building ?? 'Unnamed'} ${p.unit_number ? `· ${p.unit_number}` : ''} (${p.id})` }))}
              defaultValue={property ?? null}
              placeholder="Search properties..."
            />
          </div>

          <div>
            <label className={labelClass}>Owner</label>
            <SearchableSelect
              name="owner_id"
              options={clients.map((c) => ({ id: c.id, label: `${c.name} (${c.id})` }))}
              defaultValue={owner ?? null}
              placeholder="Search clients..."
            />
          </div>

          <div>
            <label className={labelClass}>Buyer / Tenant</label>
            <SearchableSelect
              name="buyer_id"
              options={clients.map((c) => ({ id: c.id, label: `${c.name} (${c.id})` }))}
              defaultValue={buyer ?? null}
              placeholder="Search clients..."
            />
          </div>

          <DealTypeStageFields
            dealTypes={lookups.dealTypes}
            saleStages={lookups.saleStages}
            rentalStages={lookups.rentalStages}
            defaultDealTypeId={null}
            defaultDealStageId={null}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Value</label>
              <input name="value" type="number" step="any" className={inputClass} />
            </div>
            <CommissionSplitInput
              label="Commission (gross)"
              percentName="commission_percent"
              amountName="commission_amount"
              defaultPercent={null}
              defaultAmount={null}
            />
          </div>

          <CommissionSplitInput
            label="Your split (net)"
            percentName="commission_split_percent"
            amountName="commission_split_amount"
            defaultPercent={null}
            defaultAmount={null}
            percentPlaceholder="e.g. 60 for 60% of gross"
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Date agreed</label>
              <input name="date_agreed" type="date" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Date completed</label>
              <input name="date_completed" type="date" className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Notes</label>
            <textarea name="notes" rows={3} className={inputClass} />
          </div>

          <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500">
            Save Deal
          </button>
        </form>
      </div>
    </div>
  );
}
