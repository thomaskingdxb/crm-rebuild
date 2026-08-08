import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getClient, getClientLookups, getClientActivities, getActivityTypes, getClientsBasic } from '@/lib/clients';
import { getClientTasks, getTaskTypes } from '@/lib/tasks';
import { getClientEnquiries, getEnquiryLookups } from '@/lib/enquiries';
import { getClientProperties, getPropertiesBasic } from '@/lib/properties';
import { getClientDeals, getDealLookups } from '@/lib/deals';
import { updateClientAction, deleteClientAction } from '@/app/clients/actions';
import { createClient } from '@/lib/supabase/server';
import { daysSince } from '@/lib/date';
import { telHref, whatsappHref } from '@/lib/phone';
import DeleteClientButton from '@/components/DeleteClientButton';
import BackLink from '@/components/BackLink';
import PropertyCard from '@/components/PropertyCard';
import TaskCard from '@/components/TaskCard';
import AddTaskButton from '@/components/AddTaskButton';
import EnquiryCard from '@/components/EnquiryCard';
import DealCard from '@/components/DealCard';
import LogActivityButton from '@/components/LogActivityButton';
import ActivityListItem from '@/components/ActivityListItem';
import SearchableMultiSelect from '@/components/SearchableMultiSelect';

const inputClass =
  'w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';
const labelClass = 'block text-xs font-medium text-zinc-400 mb-1';
const sectionClass = 'surface-card p-6';

export default async function ClientProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [client, lookups, activities, activityTypes, tasks, taskTypes, allClients, enquiries, properties, deals, dealLookups, allProperties, enquiryLookups] = await Promise.all([
    getClient(id, supabase),
    getClientLookups(supabase),
    getClientActivities(id, supabase),
    getActivityTypes(supabase),
    getClientTasks(id, supabase),
    getTaskTypes(supabase),
    getClientsBasic(supabase),
    getClientEnquiries(id, supabase),
    getClientProperties(id, supabase),
    getClientDeals(id, supabase),
    getDealLookups(supabase),
    getPropertiesBasic(supabase),
    getEnquiryLookups(supabase),
  ]);

  if (!client) notFound();

  const updateWithId = updateClientAction.bind(null, id);
  const deleteWithId = deleteClientAction.bind(null, id);
  const selectedTypeIds = new Set(client.client_client_types.map((t) => t.client_types.id));
  const selectedStatusIds = new Set(client.client_client_statuses.map((s) => s.client_statuses.id));
  const days = daysSince(client.lastActivityDate);
  const tel = telHref(client.phone);
  const wa = whatsappHref(client.phone);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="px-6 py-8">
        <BackLink href="/clients" label="← Back to Clients" />

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-100">{client.name}</h1>
            <p className="text-sm text-zinc-500">
              {client.id} · {days === null ? 'No activity logged' : `${days} day${days === 1 ? '' : 's'} since last activity`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <LogActivityButton
              clientId={client.id}
              activityTypes={activityTypes}
              label="Log Activity"
              className="rounded-lg bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-400 ring-1 ring-inset ring-blue-500/20 hover:bg-blue-500/20"
            />
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20 hover:bg-emerald-500/20">
                WhatsApp
              </a>
            )}
            {tel && (
              <a href={tel} className="rounded-lg bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-400 ring-1 ring-inset ring-blue-500/20 hover:bg-blue-500/20">
                Call
              </a>
            )}
            <DeleteClientButton name={client.name} action={deleteWithId} />
          </div>
        </div>

        <form action={updateWithId} className={`mt-6 space-y-4 ${sectionClass}`}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Name *</label>
              <input name="name" defaultValue={client.name} required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input name="phone" defaultValue={client.phone ?? ''} className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Email</label>
            <input name="email" type="email" defaultValue={client.email ?? ''} className={inputClass} />
          </div>

          <div>
            <span className={labelClass}>Type</span>
            <SearchableMultiSelect name="type_ids" options={lookups.clientTypes} defaultSelectedIds={selectedTypeIds} placeholder="Search types..." />
          </div>

          <div>
            <span className={labelClass}>Status</span>
            <SearchableMultiSelect name="status_ids" options={lookups.clientStatuses} defaultSelectedIds={selectedStatusIds} placeholder="Search statuses..." />
          </div>

          <div>
            <label className={labelClass}>Source</label>
            <select name="source_id" defaultValue={client.source_id ?? ''} className={inputClass}>
              <option value="">—</option>
              {lookups.leadSources.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Last contact</label>
              <input name="last_contact_date" type="date" defaultValue={client.last_contact_date ?? ''} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Follow up</label>
              <input name="follow_up_date" type="date" defaultValue={client.follow_up_date ?? ''} className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Date of birth</label>
            <input name="date_of_birth" type="date" defaultValue={client.date_of_birth ?? ''} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Personal info</label>
            <textarea name="personal_info" defaultValue={client.personal_info ?? ''} rows={2} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Notes</label>
            <textarea name="notes" defaultValue={client.notes ?? ''} rows={4} className={inputClass} />
          </div>

          <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500">
            Save Changes
          </button>
        </form>

        <div className="mt-6 space-y-6">
          <div className={sectionClass}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-100">Tasks ({tasks.length})</h2>
              <AddTaskButton
                clientId={client.id}
                clients={allClients}
                taskTypes={taskTypes}
                label="+ Add Task"
                className="rounded-lg bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-400 ring-1 ring-inset ring-blue-500/20 hover:bg-blue-500/20"
              />
            </div>
            {tasks.length === 0 ? (
              <p className="text-sm text-zinc-500">No tasks for this client.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {tasks.map((t) => (
                  <TaskCard key={t.id} task={t} clients={allClients} taskTypes={taskTypes} />
                ))}
              </div>
            )}
          </div>

          <div className={sectionClass}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-100">Activity ({activities.length})</h2>
              <LogActivityButton
                clientId={client.id}
                activityTypes={activityTypes}
                label="+ Log Activity"
                className="rounded-lg bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-400 ring-1 ring-inset ring-blue-500/20 hover:bg-blue-500/20"
              />
            </div>
            {activities.length === 0 ? (
              <p className="text-sm text-zinc-500">No activity logged yet.</p>
            ) : (
              <ul className="space-y-4">
                {activities.map((a) => (
                  <li key={a.id}>
                    <ActivityListItem clientId={client.id} activity={a} activityTypes={activityTypes} />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={sectionClass}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-100">Enquiries ({enquiries.length})</h2>
              <Link href={`/enquiries/new?client=${client.id}`} className="rounded-lg bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-400 ring-1 ring-inset ring-blue-500/20 hover:bg-blue-500/20">
                + Add Enquiry
              </Link>
            </div>
            {enquiries.length === 0 ? (
              <p className="text-sm text-zinc-500">No enquiries for this client.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {enquiries.map((e) => (
                  <EnquiryCard
                    key={e.id}
                    enquiry={e}
                    lookups={enquiryLookups}
                    clients={allClients}
                    properties={allProperties}
                    taskTypes={taskTypes}
                    activityTypes={activityTypes}
                  />
                ))}
              </div>
            )}
          </div>

          <div className={sectionClass}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-100">Properties ({properties.length})</h2>
              <Link href={`/properties/new?owner=${client.id}`} className="rounded-lg bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-400 ring-1 ring-inset ring-blue-500/20 hover:bg-blue-500/20">
                + Add Property
              </Link>
            </div>
            {properties.length === 0 ? (
              <p className="text-sm text-zinc-500">No properties owned by this client.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {properties.map((p) => (
                  <PropertyCard key={p.id} property={p} />
                ))}
              </div>
            )}
          </div>

          <div className={sectionClass}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-100">Deals ({deals.length})</h2>
              <Link href={`/deals/new?owner=${client.id}`} className="rounded-lg bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-400 ring-1 ring-inset ring-blue-500/20 hover:bg-blue-500/20">
                + Add Deal
              </Link>
            </div>
            {deals.length === 0 ? (
              <p className="text-sm text-zinc-500">No deals for this client.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {deals.map((d) => (
                  <DealCard
                    key={d.id}
                    deal={d}
                    role={d.role}
                    dealTypes={dealLookups.dealTypes}
                    saleStages={dealLookups.saleStages}
                    rentalStages={dealLookups.rentalStages}
                    clients={allClients}
                    properties={allProperties}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
