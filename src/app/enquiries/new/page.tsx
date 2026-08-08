import Link from 'next/link';
import { getEnquiryLookups } from '@/lib/enquiries';
import { getClientsBasic } from '@/lib/clients';
import { getPropertiesBasic } from '@/lib/properties';
import { createEnquiryAction } from '@/app/enquiries/actions';
import { createClient } from '@/lib/supabase/server';
import SearchableSelect from '@/components/SearchableSelect';
import SearchableMultiSelect from '@/components/SearchableMultiSelect';
import BackLink from '@/components/BackLink';

const inputClass =
  'w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';
const labelClass = 'block text-xs font-medium text-zinc-400 mb-1';

export default async function NewEnquiryPage({ searchParams }: { searchParams: Promise<{ client?: string; property?: string }> }) {
  const { client, property } = await searchParams;
  const supabase = await createClient();
  const [lookups, clients, properties] = await Promise.all([getEnquiryLookups(supabase), getClientsBasic(supabase), getPropertiesBasic(supabase)]);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="mx-auto max-w-xl px-6 py-8">
        <BackLink href="/enquiries" label="← Back to Enquiries" />

        <h1 className="mt-3 text-2xl font-semibold text-zinc-100 mb-6">Add Enquiry</h1>

        <form action={createEnquiryAction} className="space-y-4 surface-card p-6">
          <div>
            <label className={labelClass}>Client *</label>
            <SearchableSelect
              name="client_id"
              options={clients.map((c) => ({ id: c.id, label: `${c.name} (${c.id})` }))}
              defaultValue={client ?? null}
              placeholder="Search clients..."
            />
          </div>

          <div>
            <label className={labelClass}>Enquired on (linked property)</label>
            <SearchableSelect
              name="property_id"
              options={properties.map((p) => ({ id: p.id, label: `${p.building ?? 'Unnamed'} ${p.unit_number ? `· ${p.unit_number}` : ''} (${p.id})` }))}
              defaultValue={property ?? null}
              placeholder="Search properties..."
            />
          </div>

          <div>
            <span className={labelClass}>Enquiry type</span>
            <SearchableMultiSelect name="enquiry_type_ids" options={lookups.enquiryTypes} defaultSelectedIds={new Set()} placeholder="Search enquiry types..." />
          </div>

          <div>
            <span className={labelClass}>Lead stage</span>
            <SearchableMultiSelect name="lead_stage_ids" options={lookups.leadStages} defaultSelectedIds={new Set()} placeholder="Search lead stages..." />
          </div>

          <div>
            <label className={labelClass}>Building</label>
            <input name="building" className={inputClass} />
          </div>

          <div>
            <span className={labelClass}>Property type</span>
            <SearchableMultiSelect name="property_type_ids" options={lookups.propertyTypes} defaultSelectedIds={new Set()} placeholder="Search property types..." />
          </div>

          <div>
            <span className={labelClass}>Property status</span>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Sqft</label>
              <input name="sqft" type="number" step="any" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Floor</label>
              <input name="floor" className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Budget</label>
              <input name="budget" type="number" step="any" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Completion date</label>
              <input name="completion_date" type="date" className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Enquiry date</label>
            <input name="enquiry_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Notes</label>
            <textarea name="notes" rows={3} className={inputClass} />
          </div>

          <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500">
            Save Enquiry
          </button>
        </form>
      </div>
    </div>
  );
}
