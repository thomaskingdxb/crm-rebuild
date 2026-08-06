'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { TaskWithRelations, Lookup } from '@/types/database';
import { formatDate, daysSince } from '@/lib/date';
import Modal from '@/components/Modal';
import SearchableSelect from '@/components/SearchableSelect';
import { updateTaskModalAction, deleteTaskModalAction } from '@/app/tasks/actions';

const inputClass =
  'w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';
const labelClass = 'block text-xs font-medium text-zinc-400 mb-1';

function deadlineClass(deadline: string | null): string {
  if (!deadline) return 'text-zinc-500';
  const days = daysSince(deadline);
  if (days === null) return 'text-zinc-500';
  if (days > 0) return 'text-rose-400';
  if (days === 0) return 'text-amber-400';
  return 'text-zinc-400';
}

export default function TaskCard({
  task,
  clients,
  taskTypes,
}: {
  task: TaskWithRelations;
  clients: { id: string; name: string }[];
  taskTypes: Lookup[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const types = task.task_task_types.map((t) => t.task_types.name);
  const selectedTypeIds = new Set(task.task_task_types.map((t) => t.task_types.id));

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await updateTaskModalAction(task.id, formData);
      setOpen(false);
      router.refresh();
    });
  }

  function handleDelete() {
    if (!confirm('Delete this task? This cannot be undone.')) return;
    startTransition(async () => {
      await deleteTaskModalAction(task.id, task.client_id);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex flex-col gap-3 rounded-2xl bg-gradient-to-br from-[#1c2438] via-[#15161e] to-[#101014] p-5 text-left shadow-xl shadow-black/40 ring-1 ring-white/5 transition hover:ring-white/10 hover:from-[#212c47] sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-zinc-100">{task.task_info ?? 'Untitled task'}</p>
          <p className="mt-1 text-xs text-zinc-500">{task.clients ? task.clients.name : 'No client'}</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {types.map((t) => (
              <span key={t} className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-400 ring-1 ring-inset ring-blue-500/20">
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className="shrink-0 text-right text-sm">
          <p className={`font-medium ${deadlineClass(task.deadline_date)}`}>
            {task.deadline_date ? `Due ${formatDate(task.deadline_date)}` : 'No deadline'}
          </p>
          {task.priority_score !== null && <p className="text-xs text-zinc-500">Priority {task.priority_score}</p>}
        </div>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Edit Task">
        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Client *</label>
            <SearchableSelect
              name="client_id"
              options={clients.map((c) => ({ id: c.id, label: `${c.name} (${c.id})` }))}
              defaultValue={task.client_id}
              placeholder="Search clients..."
            />
          </div>

          <div>
            <label className={labelClass}>Task info</label>
            <textarea name="task_info" defaultValue={task.task_info ?? ''} rows={3} className={inputClass} />
          </div>

          <div>
            <span className={labelClass}>Type</span>
            <div className="flex flex-wrap gap-2">
              {taskTypes.map((t) => (
                <label key={t.id} className="cursor-pointer">
                  <input type="checkbox" name="task_type_ids" value={t.id} defaultChecked={selectedTypeIds.has(t.id)} className="peer sr-only" />
                  <span className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium text-zinc-400 ring-1 ring-inset ring-white/10 transition hover:ring-white/20 peer-checked:bg-blue-500/20 peer-checked:text-blue-300 peer-checked:ring-blue-500/40">
                    {t.name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Entry date</label>
              <input name="entry_date" type="date" defaultValue={task.entry_date ?? ''} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Deadline date</label>
              <input name="deadline_date" type="date" defaultValue={task.deadline_date ?? ''} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Impact</label>
              <input name="impact" type="number" step="any" defaultValue={task.impact ?? ''} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Effort (mins)</label>
              <input name="effort" type="number" step="any" defaultValue={task.effort ?? ''} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Priority score</label>
              <input name="priority_score" type="number" step="any" defaultValue={task.priority_score ?? ''} className={inputClass} />
            </div>
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
              Delete Task
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
