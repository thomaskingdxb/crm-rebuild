'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/Modal';
import { updateActivityModalAction, deleteActivityModalAction } from '@/app/clients/actions';
import { formatDate } from '@/lib/date';
import type { ActivityWithRelations, Lookup } from '@/types/database';

const inputClass =
  'w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';
const labelClass = 'block text-xs font-medium text-zinc-400 mb-1';
const itemClass = 'border-l-2 border-white/10 pl-3';

export default function ActivityListItem({
  clientId,
  activity,
  activityTypes,
}: {
  clientId: string;
  activity: ActivityWithRelations;
  activityTypes: Lookup[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const selectedTypeIds = new Set(activity.activity_activity_types.map((t) => t.activity_types.id));

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await updateActivityModalAction(clientId, activity.id, formData);
      setOpen(false);
      router.refresh();
    });
  }

  function handleDelete() {
    if (!confirm('Delete this activity? This cannot be undone.')) return;
    startTransition(async () => {
      await deleteActivityModalAction(clientId, activity.id);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`block w-full text-left ${itemClass} hover:border-blue-500/40`}>
        <p className="text-xs text-zinc-500">{formatDate(activity.activity_date)}</p>
        <p className="text-xs font-medium text-blue-400">
          {activity.activity_activity_types.map((t) => t.activity_types.name).join(', ') || 'Activity'}
        </p>
        {activity.notes && <p className="text-sm text-zinc-300 mt-0.5">{activity.notes}</p>}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Edit Activity">
        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Date</label>
            <input name="activity_date" type="date" defaultValue={activity.activity_date ?? ''} className={inputClass} />
          </div>

          <div>
            <span className={labelClass}>Type</span>
            <div className="flex flex-wrap gap-2">
              {activityTypes.map((t) => (
                <label key={t.id} className="cursor-pointer">
                  <input type="checkbox" name="type_ids" value={t.id} defaultChecked={selectedTypeIds.has(t.id)} className="peer sr-only" />
                  <span className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium text-zinc-400 ring-1 ring-inset ring-white/10 transition hover:ring-white/20 peer-checked:bg-blue-500/20 peer-checked:text-blue-300 peer-checked:ring-blue-500/40">
                    {t.name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>Notes</label>
            <textarea name="notes" defaultValue={activity.notes ?? ''} rows={4} className={inputClass} />
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
              Delete Activity
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
