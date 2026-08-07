'use client';

import { useMemo, useRef, useState } from 'react';

export interface PropertyOption {
  id: string;
  label: string;
}

const inputClass =
  'w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

export default function PropertySearchSelect({
  options,
  value,
  onChange,
}: {
  options: PropertyOption[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.id === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options.slice(0, 50);
    return options.filter((o) => o.label.toLowerCase().includes(q)).slice(0, 50);
  }, [options, query]);

  return (
    <div className="relative" ref={containerRef}>
      <input
        type="text"
        value={open ? query : (selected?.label ?? '')}
        placeholder="Search properties..."
        onFocus={() => {
          setOpen(true);
          setQuery('');
        }}
        onChange={(e) => setQuery(e.target.value)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className={inputClass}
      />
      {open && (
        <div className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-lg bg-[#1a1a22] shadow-xl shadow-black/60 ring-1 ring-white/10">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              onChange('');
              setOpen(false);
            }}
            className="block w-full px-3 py-2 text-left text-sm text-zinc-500 hover:bg-white/5"
          >
            — None, enter manually —
          </button>
          {filtered.map((o) => (
            <button
              key={o.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(o.id);
                setOpen(false);
              }}
              className="block w-full px-3 py-2 text-left text-sm text-zinc-200 hover:bg-blue-500/10 hover:text-blue-300"
            >
              {o.label}
            </button>
          ))}
          {filtered.length === 0 && <p className="px-3 py-2 text-sm text-zinc-500">No matches</p>}
        </div>
      )}
    </div>
  );
}

export function sortPropertyOptions(properties: { id: string; building: string | null; unit_number: string | null }[]): PropertyOption[] {
  return [...properties]
    .sort((a, b) => (a.building ?? a.id).localeCompare(b.building ?? b.id, undefined, { sensitivity: 'base' }))
    .map((p) => ({ id: p.id, label: `${p.building ?? p.id}${p.unit_number ? ` - ${p.unit_number}` : ''}` }));
}
