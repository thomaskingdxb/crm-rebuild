'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/Modal';
import SearchableSelect from '@/components/SearchableSelect';
import SearchableMultiSelect from '@/components/SearchableMultiSelect';
import { createTaskModalAction } from '@/app/tasks/actions';
import type { Lookup } from '@/types/database';

const inputClass =
  'w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';
const labelClass = 'block text-xs font-medium text-zinc-400 mb-1';

export default function AddTaskButton({
  clientId,
  clients,
  taskTypes,
  label,
  className,
}: {
  clientId?: string;
  clients: { id: string; name: string }[];
  taskTypes: Lookup[];
  label: string;
  className: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await createTaskModalAction(formData);
      formRef.current?.reset();
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {label}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Add Task">
        <form ref={formRef} action={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Client *</label>
            <SearchableSelect
              name="client_id"
              options={clients.map((c) => ({ id: c.id, label: `${c.name} (${c.id})` }))}
              defaultValue={clientId ?? null}
              placeholder="Search clients..."
            />
          </div>

          <div>
            <label className={labelClass}>Task info</label>
            <textarea name="task_info" rows={3} className={inputClass} />
          </div>

          <div>
            <span className={labelClass}>Type</span>
            <SearchableMultiSelect name="task_type_ids" options={taskTypes} defaultSelectedIds={new Set()} placeholder="Search types..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Entry date</label>
              <input name="entry_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Deadline date</label>
              <input name="deadline_date" type="date" className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Impact</label>
              <input name="impact" type="number" step="any" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Effort (mins)</label>
              <input name="effort" type="number" step="any" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Priority score</label>
              <input name="priority_score" type="number" step="any" className={inputClass} />
            </div>
          </div>

          <button type="submit" disabled={pending} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50">
            {pending ? 'Saving...' : 'Save Task'}
          </button>
        </form>
      </Modal>
    </>
  );
}
