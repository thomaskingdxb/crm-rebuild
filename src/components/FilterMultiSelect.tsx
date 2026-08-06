'use client';

import { useMemo, useState } from 'react';

interface Option {
  id: number;
  name: string;
}

export default function FilterMultiSelect({
  options,
  selected,
  onChange,
  placeholder,
}: {
  options: Option[];
  selected: Set<number>;
  onChange: (next: Set<number>) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const selectedOptions = useMemo(
    () => options.filter((o) => selected.has(o.id)),
    [options, selected]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const remaining = options.filter((o) => !selected.has(o.id));
    if (!q) return remaining.slice(0, 50);
    return remaining.filter((o) => o.name.toLowerCase().includes(q)).slice(0, 50);
  }, [options, query, selected]);

  function add(id: number) {
    const next = new Set(selected);
    next.add(id);
    onChange(next);
    setQuery('');
  }

  function remove(id: number) {
    const next = new Set(selected);
    next.delete(id);
    onChange(next);
  }

  return (
    <div className="relative">
      {selectedOptions.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {selectedOptions.map((o) => (
            <span key={o.id} className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-medium text-blue-300 ring-1 ring-inset ring-blue-500/40">
              {o.name}
              <button type="button" onClick={() => remove(o.id)} className="text-blue-300 hover:text-white">
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <input
        type="text"
        value={query}
        placeholder={placeholder ?? 'Search...'}
        onFocus={() => setOpen(true)}
        onChange={(e) => setQuery(e.target.value)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      {open && (
        <div className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-lg bg-[#1a1a22] shadow-xl shadow-black/60 ring-1 ring-white/10">
          {filtered.map((o) => (
            <button
              key={o.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                add(o.id);
              }}
              className="block w-full px-3 py-2 text-left text-sm text-zinc-200 hover:bg-blue-500/10 hover:text-blue-300"
            >
              {o.name}
            </button>
          ))}
          {filtered.length === 0 && <p className="px-3 py-2 text-sm text-zinc-500">No matches</p>}
        </div>
      )}
    </div>
  );
}
