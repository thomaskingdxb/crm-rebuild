'use client';

import { useState } from 'react';

const inputClass =
  'w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';
const labelClass = 'block text-xs font-medium text-zinc-400';

export default function CommissionSplitInput({
  label,
  percentName,
  amountName,
  defaultPercent,
  defaultAmount,
  percentPlaceholder,
}: {
  label: string;
  percentName: string;
  amountName: string;
  defaultPercent: number | null;
  defaultAmount: number | null;
  percentPlaceholder?: string;
}) {
  const [mode, setMode] = useState<'percent' | 'flat'>(defaultAmount != null && defaultPercent == null ? 'flat' : 'percent');

  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-1">
        <span className={labelClass}>{label}</span>
        <div className="flex gap-0.5 rounded-lg bg-white/5 p-0.5 ring-1 ring-inset ring-white/10">
          <button
            type="button"
            onClick={() => setMode('percent')}
            className={`rounded-md px-2 py-0.5 text-xs font-medium transition ${mode === 'percent' ? 'bg-blue-500/20 text-blue-300' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            %
          </button>
          <button
            type="button"
            onClick={() => setMode('flat')}
            className={`rounded-md px-2 py-0.5 text-xs font-medium transition ${mode === 'flat' ? 'bg-blue-500/20 text-blue-300' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            AED
          </button>
        </div>
      </div>
      {mode === 'percent' ? (
        <input
          name={percentName}
          type="number"
          step="any"
          defaultValue={defaultPercent ?? ''}
          placeholder={percentPlaceholder ?? 'e.g. 5 for 5%'}
          className={inputClass}
        />
      ) : (
        <input name={amountName} type="number" step="any" defaultValue={defaultAmount ?? ''} placeholder="Flat amount" className={inputClass} />
      )}
    </div>
  );
}
