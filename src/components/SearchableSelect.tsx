'use client';

import { useMemo, useRef, useState } from 'react';

interface Option {
  id: string;
  label: string;
}

export default function SearchableSelect({
  name,
  options,
  defaultValue,
  placeholder,
}: {
  name: string;
  options: Option[];
  defaultValue?: string | null;
  placeholder?: string;
}) {
  const defaultOption = options.find((o) => o.id === defaultValue) ?? null;
  const [selected, setSelected] = useState<Option | null>(defaultOption);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options.slice(0, 50);
    return options.filter((o) => o.label.toLowerCase().includes(q)).slice(0, 50);
  }, [options, query]);

  return (
    <div className="relative" ref={containerRef}>
      <input type="hidden" name={name} value={selected?.id ?? ''} />
      <input
        type="text"
        value={open ? query : (selected?.label ?? '')}
        placeholder={placeholder ?? 'Search...'}
        onFocus={() => {
          setOpen(true);
          setQuery('');
        }}
        onChange={(e) => setQuery(e.target.value)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      {open && (
        <div className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-lg bg-[#1a1a22] shadow-xl shadow-black/60 ring-1 ring-white/10">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              setSelected(null);
              setOpen(false);
            }}
            className="block w-full px-3 py-2 text-left text-sm text-zinc-500 hover:bg-white/5"
          >
            —
          </button>
          {filtered.map((o) => (
            <button
              key={o.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setSelected(o);
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
