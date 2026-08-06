'use client';

import { useMemo, useState } from 'react';
import type { TaskWithRelations, Lookup } from '@/types/database';
import TaskCard from '@/components/TaskCard';

const pillClass = 'inline-flex cursor-pointer items-center rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition';
const pillInactive = 'text-zinc-400 ring-white/10 hover:ring-white/20';
const pillActive = 'bg-blue-500/20 text-blue-300 ring-blue-500/40';

export default function TasksList({
  tasks,
  taskTypes,
  clients,
}: {
  tasks: TaskWithRelations[];
  taskTypes: Lookup[];
  clients: { id: string; name: string }[];
}) {
  const [query, setQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<Set<number>>(new Set());

  function toggle(id: number) {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks.filter((t) => {
      if (q) {
        const haystack = [t.id, t.task_info, t.clients?.name, ...t.task_task_types.map((tt) => tt.task_types.name)]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (selectedTypes.size > 0) {
        const ids = new Set(t.task_task_types.map((tt) => tt.task_types.id));
        if (![...selectedTypes].some((id) => ids.has(id))) return false;
      }
      return true;
    });
  }, [tasks, query, selectedTypes]);

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by task, client, or type..."
          className="flex-1 rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={() => setFiltersOpen(!filtersOpen)}
          className={`shrink-0 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
            filtersOpen || selectedTypes.size > 0
              ? 'bg-blue-500/20 text-blue-300 ring-1 ring-inset ring-blue-500/40'
              : 'bg-white/5 text-zinc-300 ring-1 ring-inset ring-white/10 hover:ring-white/20'
          }`}
        >
          Filters{selectedTypes.size > 0 ? ` (${selectedTypes.size})` : ''}
        </button>
      </div>

      {filtersOpen && (
        <div className="mb-4 rounded-2xl bg-[#14141c] p-5 shadow-xl shadow-black/40 ring-1 ring-white/5 space-y-4">
          <div>
            <p className="mb-2 text-xs font-medium text-zinc-400">Type</p>
            <div className="flex flex-wrap gap-2">
              {taskTypes.map((t) => (
                <button key={t.id} type="button" onClick={() => toggle(t.id)} className={`${pillClass} ${selectedTypes.has(t.id) ? pillActive : pillInactive}`}>
                  {t.name}
                </button>
              ))}
            </div>
          </div>
          {selectedTypes.size > 0 && (
            <button type="button" onClick={() => setSelectedTypes(new Set())} className="text-xs text-zinc-500 hover:text-zinc-300">
              Clear filters
            </button>
          )}
        </div>
      )}

      <p className="mb-4 text-xs text-zinc-500">
        {filtered.length} of {tasks.length} tasks
      </p>

      {filtered.length === 0 ? (
        <p className="text-zinc-500">No tasks match your search.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((t) => (
            <TaskCard key={t.id} task={t} clients={clients} taskTypes={taskTypes} />
          ))}
        </div>
      )}
    </div>
  );
}
