'use client';

import { useState } from 'react';
import type { DealStage, Lookup } from '@/types/database';

const inputClass =
  'w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';
const labelClass = 'block text-xs font-medium text-zinc-400 mb-1';
const pillSpanClass =
  'inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium text-zinc-400 ring-1 ring-inset ring-white/10 transition hover:ring-white/20 peer-checked:bg-blue-500/20 peer-checked:text-blue-300 peer-checked:ring-blue-500/40';

// deal_type_id 1 = Rental; anything else set = a Sale variant.
function categoryFor(dealTypeId: number | null): 'sale' | 'rental' | null {
  if (dealTypeId == null) return null;
  return dealTypeId === 1 ? 'rental' : 'sale';
}

export default function DealTypeStageFields({
  dealTypes,
  saleStages,
  rentalStages,
  defaultDealTypeId,
  defaultDealStageId,
}: {
  dealTypes: Lookup[];
  saleStages: DealStage[];
  rentalStages: DealStage[];
  defaultDealTypeId: number | null;
  defaultDealStageId: number | null;
}) {
  const [dealTypeId, setDealTypeId] = useState<number | null>(defaultDealTypeId);
  const [stageId, setStageId] = useState<number | null>(defaultDealStageId);

  const category = categoryFor(dealTypeId);
  const stages = category === 'rental' ? rentalStages : category === 'sale' ? saleStages : [];

  function handleTypeChange(newDealTypeId: number | null) {
    setDealTypeId(newDealTypeId);
    const newCategory = categoryFor(newDealTypeId);
    const newStages = newCategory === 'rental' ? rentalStages : newCategory === 'sale' ? saleStages : [];
    // Default new/changed deals to "Unstaged" so they always show up in the Kanban board.
    setStageId(newStages[0]?.id ?? null);
  }

  return (
    <>
      <div>
        <label className={labelClass}>Deal type</label>
        <select
          name="deal_type_id"
          value={dealTypeId ?? ''}
          onChange={(e) => handleTypeChange(e.target.value ? Number(e.target.value) : null)}
          className={inputClass}
        >
          <option value="">—</option>
          {dealTypes.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      <div>
        <span className={labelClass}>Deal stage</span>
        {stages.length === 0 ? (
          <p className="text-xs text-zinc-500">Select a deal type to see its stages.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {stages.map((s) => (
              <label key={s.id} className="cursor-pointer">
                <input
                  type="radio"
                  name="deal_stage_id"
                  value={s.id}
                  checked={stageId === s.id}
                  onChange={() => setStageId(s.id)}
                  className="peer sr-only"
                />
                <span className={pillSpanClass}>{s.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
