'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { DealStage, DealWithRelations, Lookup } from '@/types/database';
import Modal from '@/components/Modal';
import SearchableSelect from '@/components/SearchableSelect';
import DealTypeStageFields from '@/components/DealTypeStageFields';
import CommissionSplitInput from '@/components/CommissionSplitInput';
import { updateDealModalAction, deleteDealModalAction } from '@/app/deals/actions';

const inputClass =
  'w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';
const labelClass = 'block text-xs font-medium text-zinc-400 mb-1';

export default function DealDetailModal({
  deal,
  dealTypes,
  saleStages,
  rentalStages,
  clients,
  properties,
  open,
  onClose,
}: {
  deal: DealWithRelations;
  dealTypes: Lookup[];
  saleStages: DealStage[];
  rentalStages: DealStage[];
  clients: { id: string; name: string }[];
  properties: { id: string; building: string | null; unit_number: string | null }[];
  open: boolean;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await updateDealModalAction(deal.id, formData);
      onClose();
      router.refresh();
    });
  }

  function handleDelete() {
    if (!confirm('Delete this deal? This cannot be undone.')) return;
    startTransition(async () => {
      await deleteDealModalAction(deal.id);
      onClose();
      router.refresh();
    });
  }

  const title = deal.properties
    ? `${deal.properties.building ?? 'Unnamed'} ${deal.properties.unit_number ? `· ${deal.properties.unit_number}` : ''}`
    : 'No property';

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="mb-4 -mt-2 text-xs text-zinc-500">
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

      <form action={handleSubmit} className="space-y-4">
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
          dealTypes={dealTypes}
          saleStages={saleStages}
          rentalStages={rentalStages}
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

        <div className="flex items-center justify-between">
          <button type="submit" disabled={pending} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50">
            {pending ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            className="rounded-lg bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-400 ring-1 ring-inset ring-rose-500/20 hover:bg-rose-500/20 disabled:opacity-50"
          >
            Delete Deal
          </button>
        </div>
      </form>
    </Modal>
  );
}
