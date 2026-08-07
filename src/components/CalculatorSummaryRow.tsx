'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ConfirmButton from '@/components/ConfirmButton';
import { deleteROICalculation, deleteOffPlanCalculation, deleteUAEPropertyCalculation } from '@/lib/calculatorPersistence';

const DELETE_FN = {
  roi: deleteROICalculation,
  offplan: deleteOffPlanCalculation,
  uae: deleteUAEPropertyCalculation,
} as const;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function CalculatorSummaryRow({
  propertyId,
  type,
  title,
  href,
  updatedAt,
}: {
  propertyId: string;
  type: 'roi' | 'offplan' | 'uae';
  title: string;
  href: string;
  updatedAt: string | null;
}) {
  const [deleted, setDeleted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (deleted) return null;

  return (
    <div className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-3 ring-1 ring-inset ring-white/10">
      <div>
        <p className="text-sm font-medium text-zinc-200">{title}</p>
        <p className="text-xs text-zinc-500">{updatedAt ? `Saved plan · updated ${formatDate(updatedAt)}` : 'No saved plan'}</p>
      </div>
      <div className="flex items-center gap-2">
        <Link href={href} className="rounded-lg bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-400 ring-1 ring-inset ring-blue-500/20 hover:bg-blue-500/20">
          Open
        </Link>
        {updatedAt && (
          <ConfirmButton
            label="Delete"
            message="Delete this saved plan?"
            confirmLabel="Delete"
            disabled={isPending}
            onConfirm={() =>
              startTransition(async () => {
                await DELETE_FN[type](propertyId);
                setDeleted(true);
                router.refresh();
              })
            }
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-rose-400 ring-1 ring-inset ring-rose-500/20 hover:bg-rose-500/10"
          />
        )}
      </div>
    </div>
  );
}
