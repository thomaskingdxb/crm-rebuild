'use client';

import { useTransition } from 'react';
import type { Achievement } from '@/types/database';
import { addAchievementAction, deleteAchievementAction } from '@/app/kpis/actions';
import ConfirmButton from '@/components/ConfirmButton';

const inputClass =
  'w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';
const labelClass = 'block text-xs font-medium text-zinc-400 mb-1';

export default function AchievementsPanel({ achievements }: { achievements: Achievement[] }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="surface-card p-4">
      <p className="mb-3 text-xs font-medium text-zinc-500">Achievements</p>

      <form
        action={(formData) => startTransition(() => addAchievementAction(formData))}
        className="mb-4 space-y-3 border-b border-white/5 pb-4"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className={labelClass}>Title</label>
            <input name="title" type="text" required placeholder="e.g. Closed first Emaar off-plan deal" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Date</label>
            <input name="achieved_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className={inputClass} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Notes</label>
          <textarea name="description" rows={2} className={inputClass} />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
        >
          Log Achievement
        </button>
      </form>

      <div className="space-y-2">
        {achievements.length === 0 && <p className="text-xs text-zinc-600">No achievements logged yet.</p>}
        {achievements.map((a) => (
          <div key={a.id} className="flex items-start justify-between gap-3 rounded-lg bg-white/5 px-3 py-2 text-sm">
            <div>
              <p className="font-medium text-zinc-100">{a.title}</p>
              {a.description && <p className="text-xs text-zinc-500">{a.description}</p>}
              <p className="mt-1 text-[10px] text-zinc-600">{a.achieved_date}</p>
            </div>
            <ConfirmButton
              label="Delete"
              message="Delete this achievement?"
              confirmLabel="Delete"
              disabled={pending}
              onConfirm={() => startTransition(() => deleteAchievementAction(a.id))}
              className="shrink-0 rounded-lg bg-rose-500/10 px-2 py-1 text-[10px] font-medium text-rose-400 ring-1 ring-inset ring-rose-500/20 transition hover:bg-rose-500/20"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
