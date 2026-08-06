import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProperty, getPropertyLookups } from '@/lib/properties';
import { getClientsBasic } from '@/lib/clients';
import { getPropertyEnquiries } from '@/lib/enquiries';
import { getPropertyDeals } from '@/lib/deals';
import { updatePropertyAction, deletePropertyAction } from '@/app/properties/actions';
import DeleteButton from '@/components/DeleteButton';
import SearchableSelect from '@/components/SearchableSelect';
import SearchableMultiSelect from '@/components/SearchableMultiSelect';
import EnquiryCard from '@/components/EnquiryCard';
import DealCard from '@/components/DealCard';
import BackLink from '@/components/BackLink';

const inputClass =
  'w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';
const labelClass = 'block text-xs font-medium text-zinc-400 mb-1';
const sectionClass = 'surface-card p-6';
const pillLabelClass = 'cursor-pointer';
const pillSpanClass =
  'inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium text-zinc-400 ring-1 ring-inset ring-white/10 transition hover:ring-white/20 peer-checked:bg-blue-500/20 peer-checked:text-blue-300 peer-checked:ring-blue-500/40';

function PillGroup({ name, options, selectedIds }: { name: string; options: { id: number; name: string }[]; selectedIds: Set<number> }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <label key={o.id} className={pillLabelClass}>
          <input type="checkbox" name={name} value={o.id} defaultChecked={selectedIds.has(o.id)} className="peer sr-only" />
          <span className={pillSpanClass}>{o.name}</span>
        </label>
      ))}
    </div>
  );
}

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [property, lookups, clients, enquiries, deals] = await Promise.all([
    getProperty(id),
    getPropertyLookups(),
    getClientsBasic(),
    getPropertyEnquiries(id),
    getPropertyDeals(id),
  ]);

  if (!property) notFound();

  const updateWithId = updatePropertyAction.bind(null, id);
  const deleteWithId = deletePropertyAction.bind(null, id);

  const selectedTypeIds = new Set(property.property_property_types.map((t) => t.property_types.id));
  const selectedStatusIds = new Set(property.property_property_statuses.map((s) => s.property_statuses.id));
  const selectedAreaIds = new Set(property.property_areas.map((a) => a.areas.id));
  const selectedBedroomIds = new Set(property.property_bedroom_counts.map((b) => b.bedroom_counts.id));
  const selectedBathroomIds = new Set(property.property_bathroom_counts.map((b) => b.bathroom_counts.id));
  const selectedDeveloperIds = new Set(property.property_developers.map((d) => d.developers.id));
  const selectedViewIds = new Set(property.property_view_types.map((v) => v.view_types.id));

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="px-6 py-8">
        <BackLink href="/properties" label="← Back to Properties" />

        <div className="mt-3 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-100">
              {property.building ?? 'Unnamed building'} {property.unit_number ? `· ${property.unit_number}` : ''}
            </h1>
            <p className="text-sm text-zinc-500">
              {property.id}
              {property.clients ? (
                <>
                  {' · Owner: '}
                  <Link href={`/clients/${property.clients.id}`} className="text-blue-400 hover:text-blue-300">
                    {property.clients.name}
                  </Link>
                </>
              ) : (
                ' · No owner'
              )}
            </p>
          </div>
          <DeleteButton
            label="Delete Property"
            confirmText={`Delete ${property.building ?? property.id}? This cannot be undone.`}
            action={deleteWithId}
          />
        </div>

        <form action={updateWithId} className={`mt-6 space-y-4 ${sectionClass}`}>
          <div>
            <label className={labelClass}>Owner</label>
            <SearchableSelect
              name="owner_id"
              options={clients.map((c) => ({ id: c.id, label: `${c.name} (${c.id})` }))}
              defaultValue={property.owner_id}
              placeholder="Search clients..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Building</label>
              <input name="building" defaultValue={property.building ?? ''} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Unit number</label>
              <input name="unit_number" defaultValue={property.unit_number ?? ''} className={inputClass} />
            </div>
          </div>

          <div>
            <span className={labelClass}>Property type</span>
            <PillGroup name="property_type_ids" options={lookups.propertyTypes} selectedIds={selectedTypeIds} />
          </div>

          <div>
            <span className={labelClass}>Status</span>
            <PillGroup name="property_status_ids" options={lookups.propertyStatuses} selectedIds={selectedStatusIds} />
          </div>

          <div>
            <span className={labelClass}>Area</span>
            <SearchableMultiSelect name="area_ids" options={lookups.areas} defaultSelectedIds={selectedAreaIds} placeholder="Search areas..." />
          </div>

          <div>
            <span className={labelClass}>Developer</span>
            <SearchableMultiSelect name="developer_ids" options={lookups.developers} defaultSelectedIds={selectedDeveloperIds} placeholder="Search developers..." />
          </div>

          <div>
            <span className={labelClass}>Bedrooms</span>
            <PillGroup name="bedroom_ids" options={lookups.bedroomCounts} selectedIds={selectedBedroomIds} />
          </div>

          <div>
            <span className={labelClass}>Bathrooms</span>
            <PillGroup name="bathroom_ids" options={lookups.bathroomCounts} selectedIds={selectedBathroomIds} />
          </div>

          <div>
            <span className={labelClass}>View</span>
            <PillGroup name="view_ids" options={lookups.viewTypes} selectedIds={selectedViewIds} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Sqft</label>
              <input name="sqft" type="number" step="any" defaultValue={property.sqft ?? ''} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Floor</label>
              <input name="floor" defaultValue={property.floor ?? ''} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Service charge (per sqft)</label>
              <input name="service_charge" type="number" step="any" defaultValue={property.service_charge ?? ''} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>OP</label>
              <input name="op" type="number" step="any" defaultValue={property.op ?? ''} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Asking price</label>
              <input name="asking_price" type="number" step="any" defaultValue={property.asking_price ?? ''} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Rental income</label>
              <input name="rental_income" type="number" step="any" defaultValue={property.rental_income ?? ''} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Rented until</label>
              <input name="rented_until" type="date" defaultValue={property.rented_until ?? ''} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Completion date</label>
              <input name="completion_date" type="date" defaultValue={property.completion_date ?? ''} className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Notes</label>
            <textarea name="notes" defaultValue={property.notes ?? ''} rows={4} className={inputClass} />
          </div>

          <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500">
            Save Changes
          </button>
        </form>

        <div className="mt-6 space-y-6">
          <div className={sectionClass}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-100">Enquiries ({enquiries.length})</h2>
              <Link href={`/enquiries/new?property=${property.id}`} className="rounded-lg bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-400 ring-1 ring-inset ring-blue-500/20 hover:bg-blue-500/20">
                + Add Enquiry
              </Link>
            </div>
            {enquiries.length === 0 ? (
              <p className="text-sm text-zinc-500">No enquiries reference this property.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {enquiries.map((e) => (
                  <EnquiryCard key={e.id} enquiry={e} />
                ))}
              </div>
            )}
          </div>

          <div className={sectionClass}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-100">Deals ({deals.length})</h2>
              <Link href={`/deals/new?property=${property.id}`} className="rounded-lg bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-400 ring-1 ring-inset ring-blue-500/20 hover:bg-blue-500/20">
                + Add Deal
              </Link>
            </div>
            {deals.length === 0 ? (
              <p className="text-sm text-zinc-500">No deals reference this property.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {deals.map((d) => (
                  <DealCard key={d.id} deal={d} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
