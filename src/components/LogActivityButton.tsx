'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/Modal';
import { logActivityModalAction } from '@/app/clients/actions';
import type { Lookup } from '@/types/database';

const inputClass =
  'w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';
const labelClass = 'block text-xs font-medium text-zinc-400 mb-1';

export default function LogActivityButton({
  clientId,
  activityTypes,
  label,
  className,
}: {
  clientId: string;
  activityTypes: Lookup[];
  label: string;
  className: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await logActivityModalAction(clientId, formData);
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

      <Modal open={open} onClose={() => setOpen(false)} title="Log Activity">
        <form ref={formRef} action={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Date</label>
            <input name="activity_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className={inputClass} />
          </div>

          <div>
            <span className={labelClass}>Type</span>
            <div className="flex flex-wrap gap-2">
              {activityTypes.map((t) => (
                <label key={t.id} className="cursor-pointer">
                  <input type="checkbox" name="type_ids" value={t.id} className="peer sr-only" />
                  <span className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium text-zinc-400 ring-1 ring-inset ring-white/10 transition hover:ring-white/20 peer-checked:bg-blue-500/20 peer-checked:text-blue-300 peer-checked:ring-blue-500/40">
                    {t.name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>Notes</label>
            <textarea name="notes" rows={4} className={inputClass} />
          </div>

          <button type="submit" disabled={pending} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50">
            {pending ? 'Saving...' : 'Save Activity'}
          </button>
        </form>
      </Modal>
    </>
  );
}
