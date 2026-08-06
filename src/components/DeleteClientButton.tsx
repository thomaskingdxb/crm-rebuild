'use client';

import { useTransition } from 'react';
import ConfirmButton from '@/components/ConfirmButton';

export default function DeleteClientButton({ name, action }: { name: string; action: () => Promise<void> }) {
  const [pending, startTransition] = useTransition();

  return (
    <ConfirmButton
      label="Delete Client"
      message={`Delete ${name}? This cannot be undone.`}
      confirmLabel="Delete"
      disabled={pending}
      onConfirm={() => startTransition(() => action())}
      className="rounded-lg bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-400 ring-1 ring-inset ring-rose-500/20 transition hover:bg-rose-500/20"
    />
  );
}
