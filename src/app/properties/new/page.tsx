import Link from 'next/link';
import { getPropertyLookups } from '@/lib/properties';
import { getClientsBasic } from '@/lib/clients';
import { createPropertyAction } from '@/app/properties/actions';
import { createClient } from '@/lib/supabase/server';
import SearchableSelect from '@/components/SearchableSelect';
import SearchableMultiSelect from '@/components/SearchableMultiSelect';
import BackLink from '@/components/BackLink';

const inputClass =
  'w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';
const labelClass = 'block text-xs font-medium text-zinc-400 mb-1';

export default async function NewPropertyPage({ searchParams }: { searchParams: Promise<{ owner?: string }> }) {
  const { owner } = await searchParams;
  const supabase = await createClient();
  const [lookups, clients] = await Promise.all([getPropertyLookups(supabase), getClientsBasic(supabase)]);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="mx-auto max-w-xl px-6 py-8">
        <BackLink href="/properties" label="← Back to Properties" />

        <h1 className="mt-3 text-2xl font-semibold text-zinc-100 mb-6">Add Property</h1>

        <form action={createPropertyAction} className="space-y-4 surface-card p-6">
          <div>
            <label className={labelClass}>Owner</label>
            <SearchableSelect
              name="owner_id"
              options={clients.map((c) => ({ id: c.id, label: `${c.name} (${c.id})` }))}
              defaultValue={owner ?? null}
              placeholder="Search clients..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Building</label>
              <input name="building" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Unit number</label>
              <input name="unit_number" className={inputClass} />
            </div>
          </div>

          <div>
            <span className={labelClass}>Property type</span>
            <SearchableMultiSelect name="property_type_ids" options={lookups.propertyTypes} defaultSelectedIds={new Set()} placeholder="Search property types..." />
          </div>

          <div>
            <span className={labelClass}>Status</span>
            <SearchableMultiSelect name="property_status_ids" options={lookups.propertyStatuses} defaultSelectedIds={new Set()} placeholder="Search statuses..." />
          </div>

          <div>
            <span className={labelClass}>Area</span>
            <SearchableMultiSelect name="area_ids" options={lookups.areas} defaultSelectedIds={new Set()} placeholder="Search areas..." />
          </div>

          <div>
            <span className={labelClass}>Developer</span>
            <SearchableMultiSelect name="developer_ids" options={lookups.developers} defaultSelectedIds={new Set()} placeholder="Search developers..." />
          </div>

          <div>
            <span className={labelClass}>Bedrooms</span>
            <SearchableMultiSelect name="bedroom_ids" options={lookups.bedroomCounts} defaultSelectedIds={new Set()} placeholder="Search bedrooms..." />
          </div>

          <div>
            <span className={labelClass}>Bathrooms</span>
            <SearchableMultiSelect name="bathroom_ids" options={lookups.bathroomCounts} defaultSelectedIds={new Set()} placeholder="Search bathrooms..." />
          </div>

          <div>
            <span className={labelClass}>View</span>
            <SearchableMultiSelect name="view_ids" options={lookups.viewTypes} defaultSelectedIds={new Set()} placeholder="Search views..." />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Sqft</label>
              <input name="sqft" type="number" step="any" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Floor</label>
              <input name="floor" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Layout</label>
              <input name="layout" placeholder="e.g. A, B, C" className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Service charge (per sqft)</label>
              <input name="service_charge" type="number" step="any" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>OP</label>
              <input name="op" type="number" step="any" className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Asking price</label>
              <input name="asking_price" type="number" step="any" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Rental income</label>
              <input name="rental_income" type="number" step="any" className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Rented until</label>
              <input name="rented_until" type="date" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Completion date</label>
              <input name="completion_date" type="date" className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Notes</label>
            <textarea name="notes" rows={3} className={inputClass} />
          </div>

          <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500">
            Save Property
          </button>
        </form>
      </div>
    </div>
  );
}
