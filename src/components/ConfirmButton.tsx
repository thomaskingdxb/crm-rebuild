'use client';

import { useState } from 'react';

// Some embedded/preview browser contexts block window.confirm() outright, which made
// every delete button silently do nothing. This renders an inline Confirm/Cancel step
// instead, so deletion never depends on a native dialog actually being allowed to show.
export default function ConfirmButton({
  label,
  message,
  confirmLabel = 'Confirm',
  onConfirm,
  disabled,
  className,
}: {
  label: string;
  message?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  disabled?: boolean;
  className: string;
}) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {message && <span className="text-xs text-zinc-400">{message}</span>}
        <button
          type="button"
          onClick={() => {
            setConfirming(false);
            onConfirm();
          }}
          disabled={disabled}
          className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-rose-500 disabled:opacity-50"
        >
          {confirmLabel}
        </button>
        <button type="button" onClick={() => setConfirming(false)} className="text-xs text-zinc-500 hover:text-zinc-300">
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button type="button" onClick={() => setConfirming(true)} disabled={disabled} className={className}>
      {label}
    </button>
  );
}
