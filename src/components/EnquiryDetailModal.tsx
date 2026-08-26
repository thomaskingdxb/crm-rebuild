'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { ActivityWithRelations, EnquiryListItem, Lookup, TaskWithRelations } from '@/types/database';
import { getClientActivities } from '@/lib/clients';
import { getClientTasks } from '@/lib/tasks';
import Modal from '@/components/Modal';
import SearchableSelect from '@/components/SearchableSelect';
import SearchableMultiSelect from '@/components/SearchableMultiSelect';
import TaskCard from '@/components/TaskCard';
import AddTaskButton from '@/components/AddTaskButton';
import LogActivityButton from '@/components/LogActivityButton';
import ActivityListItem from '@/components/ActivityListItem';
import ConfirmButton from '@/components/ConfirmButton';
import { updateEnquiryModalAction, deleteEnquiryModalAction } from '@/app/enquiries/actions';

const inputClass =
  'w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';
const labelClass = 'block text-xs font-medium text-zinc-400 mb-1';
const sectionClass = 'rounded-xl bg-white/[0.03] p-4 ring-1 ring-white/5';

interface EnquiryLookups {
  enquiryTypes: Lookup[];
  propertyTypes: Lookup[];
  areas: Lookup[];
  bedroomCounts: Lookup[];
  bathroomCounts: Lookup[];
  leadStages: Lookup[];
  viewTypes: Lookup[];
  developers: Lookup[];
  propertyStatuses: Lookup[];
}

export default function EnquiryDetailModal({
  enquiry,
  lookups,
  clients,
  properties,
  taskTypes,
  activityTypes,
  open,
  onClose,
}: {
  enquiry: EnquiryListItem;
  lookups: EnquiryLookups;
  clients: { id: string; name: string }[];
  properties: { id: string; building: string | null; unit_number: string | null }[];
  taskTypes: Lookup[];
  activityTypes: Lookup[];
  open: boolean;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const [tasks, setTasks] = useState<TaskWithRelations[] | null>(null);
  const [activities, setActivities] = useState<ActivityWithRelations[] | null>(null);

  useEffect(() => {
    if (!open) return;
    setTasks(null);
    setActivities(null);
    Promise.all([getClientTasks(enquiry.client_id), getClientActivities(enquiry.client_id)]).then(([t, a]) => {
      setTasks(t);
      setActivities(a);
    });
  }, [open, enquiry.client_id]);

  const linkedProperty = enquiry.property_id ? properties.find((p) => p.id === enquiry.property_id) ?? null : null;

  const selectedEnquiryTypeIds = new Set(enquiry.enquiry_enquiry_types.map((t) => t.enquiry_types.id));
  const selectedPropertyTypeIds = new Set(enquiry.enquiry_property_types.map((t) => t.property_types.id));
  const selectedBedroomIds = new Set(enquiry.enquiry_bedroom_counts.map((b) => b.bedroom_counts.id));
  const selectedBathroomIds = new Set(enquiry.enquiry_bathroom_counts.map((b) => b.bathroom_counts.id));
  const currentLeadStageId = enquiry.enquiry_lead_stages[0]?.lead_stages.id ?? null;
  const selectedViewIds = new Set(enquiry.enquiry_view_types.map((v) => v.view_types.id));
  const selectedPropertyStatusIds = new Set(enquiry.enquiry_property_statuses.map((s) => s.property_statuses.id));
  const selectedAreaIds = new Set(enquiry.enquiry_areas.map((a) => a.areas.id));
  const selectedDeveloperIds = new Set(enquiry.enquiry_developers.map((d) => d.developers.id));

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await updateEnquiryModalAction(enquiry.id, formData);
      onClose();
      router.refresh();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteEnquiryModalAction(enquiry.id);
      onClose();
      router.refresh();
    });
  }

  const title = enquiry.clients ? enquiry.clients.name : 'No client';

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="mb-4 -mt-2 text-xs text-zinc-500">
        {enquiry.id}
        {enquiry.clients && (
          <>
            {' · '}
            <Link href={`/clients/${enquiry.clients.id}`} className="text-blue-400 hover:text-blue-300">
              View client profile
            </Link>
          </>
        )}
        {linkedProperty && (
          <>
            {' · Enquired on: '}
            <Link href={`/properties/${linkedProperty.id}`} className="text-blue-400 hover:text-blue-300">
              {linkedProperty.building ?? 'Unnamed'} {linkedProperty.unit_number ? `· ${linkedProperty.unit_number}` : ''}
            </Link>
          </>
        )}
      </p>

      <form action={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Client *</label>
          <SearchableSelect
            name="client_id"
            options={clients.map((c) => ({ id: c.id, label: `${c.name} (${c.id})` }))}
            defaultValue={enquiry.client_id}
            placeholder="Search clients..."
          />
        </div>

        <div>
          <label className={labelClass}>Enquired on (linked property)</label>
          <SearchableSelect
            name="property_id"
            options={properties.map((p) => ({ id: p.id, label: `${p.building ?? 'Unnamed'} ${p.unit_number ? `· ${p.unit_number}` : ''} (${p.id})` }))}
            defaultValue={enquiry.property_id}
            placeholder="Search properties..."
          />
        </div>

        <div>
          <span className={labelClass}>Enquiry type</span>
          <SearchableMultiSelect name="enquiry_type_ids" options={lookups.enquiryTypes} defaultSelectedIds={selectedEnquiryTypeIds} placeholder="Search enquiry types..." />
        </div>

        <div>
          <label className={labelClass}>Lead stage</label>
          <SearchableSelect
            name="lead_stage_id"
            options={lookups.leadStages.map((s) => ({ id: String(s.id), label: s.name }))}
            defaultValue={currentLeadStageId != null ? String(currentLeadStageId) : null}
            placeholder="Search lead stages..."
          />
        </div>

        <div>
          <label className={labelClass}>Building</label>
          <input name="building" defaultValue={enquiry.building ?? ''} className={inputClass} />
        </div>

        <div>
          <span className={labelClass}>Property type</span>
          <SearchableMultiSelect name="property_type_ids" options={lookups.propertyTypes} defaultSelectedIds={selectedPropertyTypeIds} placeholder="Search property types..." />
        </div>

        <div>
          <span className={labelClass}>Property status</span>
          <SearchableMultiSelect name="property_status_ids" options={lookups.propertyStatuses} defaultSelectedIds={selectedPropertyStatusIds} placeholder="Search statuses..." />
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
          <SearchableMultiSelect name="bedroom_ids" options={lookups.bedroomCounts} defaultSelectedIds={selectedBedroomIds} placeholder="Search bedrooms..." />
        </div>

        <div>
          <span className={labelClass}>Bathrooms</span>
          <SearchableMultiSelect name="bathroom_ids" options={lookups.bathroomCounts} defaultSelectedIds={selectedBathroomIds} placeholder="Search bathrooms..." />
        </div>

        <div>
          <span className={labelClass}>View</span>
          <SearchableMultiSelect name="view_ids" options={lookups.viewTypes} defaultSelectedIds={selectedViewIds} placeholder="Search views..." />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Sqft</label>
            <input name="sqft" type="number" step="any" defaultValue={enquiry.sqft ?? ''} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Floor</label>
            <input name="floor" defaultValue={enquiry.floor ?? ''} className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Budget</label>
            <input name="budget" type="number" step="any" defaultValue={enquiry.budget ?? ''} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Completion date</label>
            <input name="completion_date" type="date" defaultValue={enquiry.completion_date ?? ''} className={inputClass} />
          </div>
        </div>

        <div>
          <label className={labelClass}>Enquiry date</label>
          <input name="enquiry_date" type="date" defaultValue={enquiry.enquiry_date ?? ''} className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Notes</label>
          <textarea name="notes" defaultValue={enquiry.notes ?? ''} rows={4} className={inputClass} />
        </div>

        <div className="flex items-center justify-between">
          <button type="submit" disabled={pending} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50">
            {pending ? 'Saving...' : 'Save Changes'}
          </button>
          <ConfirmButton
            label="Delete Enquiry"
            message="Delete this enquiry?"
            confirmLabel="Delete"
            disabled={pending}
            onConfirm={handleDelete}
            className="rounded-lg bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-400 ring-1 ring-inset ring-rose-500/20 hover:bg-rose-500/20 disabled:opacity-50"
          />
        </div>
      </form>

      <div className="mt-6 space-y-4">
        <div className={sectionClass}>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-zinc-200">Tasks {tasks ? `(${tasks.length})` : ''}</h3>
            <AddTaskButton
              clientId={enquiry.client_id}
              clients={clients}
              taskTypes={taskTypes}
              label="+ Add Task"
              className="rounded-lg bg-blue-500/10 px-2.5 py-1 text-[11px] font-medium text-blue-400 ring-1 ring-inset ring-blue-500/20 hover:bg-blue-500/20"
            />
          </div>
          {tasks === null ? (
            <p className="text-xs text-zinc-500">Loading...</p>
          ) : tasks.length === 0 ? (
            <p className="text-xs text-zinc-500">No tasks for this client.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {tasks.map((t) => (
                <TaskCard key={t.id} task={t} clients={clients} taskTypes={taskTypes} />
              ))}
            </div>
          )}
        </div>

        <div className={sectionClass}>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-zinc-200">Activity {activities ? `(${activities.length})` : ''}</h3>
            <LogActivityButton
              clientId={enquiry.client_id}
              activityTypes={activityTypes}
              label="+ Log Activity"
              className="rounded-lg bg-blue-500/10 px-2.5 py-1 text-[11px] font-medium text-blue-400 ring-1 ring-inset ring-blue-500/20 hover:bg-blue-500/20"
            />
          </div>
          {activities === null ? (
            <p className="text-xs text-zinc-500">Loading...</p>
          ) : activities.length === 0 ? (
            <p className="text-xs text-zinc-500">No activity logged yet.</p>
          ) : (
            <ul className="space-y-3">
              {activities.map((a) => (
                <li key={a.id}>
                  <ActivityListItem clientId={enquiry.client_id} activity={a} activityTypes={activityTypes} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}
