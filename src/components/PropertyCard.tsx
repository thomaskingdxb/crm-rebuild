import Link from 'next/link';
import type { PropertyWithRelations } from '@/types/database';

const STATUS_STYLES: Record<string, string> = {
  Rented: 'bg-blue-500/10 text-blue-400 ring-blue-500/20',
  Sold: 'bg-white/5 text-zinc-400 ring-white/10',
  'For rent': 'bg-orange-500/10 text-orange-400 ring-orange-500/20',
  'For sale': 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
  Vacant: 'bg-orange-500/10 text-orange-400 ring-orange-500/20',
  'Off plan': 'bg-white/5 text-zinc-400 ring-white/10',
  Ready: 'bg-white/5 text-zinc-400 ring-white/10',
};

const LISTING_STATUS_STYLES: Record<string, string> = {
  'Property Listed': 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
  Exclusive: 'bg-purple-500/10 text-purple-400 ring-purple-500/20',
  'Pocket Listing': 'bg-amber-500/10 text-amber-400 ring-amber-500/20',
  'Not Listed': 'bg-white/5 text-zinc-400 ring-white/10',
  Withdrawn: 'bg-rose-500/10 text-rose-400 ring-rose-500/20',
  'Listing Expired': 'bg-rose-500/10 text-rose-400 ring-rose-500/20',
};

export default function PropertyCard({ property }: { property: PropertyWithRelations }) {
  const statuses = property.property_property_statuses.map((s) => s.property_statuses.name);
  const beds = property.property_bedroom_counts.map((b) => b.bedroom_counts.name);

  return (
    <Link
      href={`/properties/${property.id}`}
      className="flex flex-col gap-3 rounded-2xl bg-gradient-to-br from-[#1c2438] via-[#15161e] to-[#101014] p-5 shadow-xl shadow-black/40 ring-1 ring-white/5 transition hover:ring-white/10 hover:from-[#212c47] sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold text-zinc-100">
          {property.unit_number ?? '—'}
          {beds.length > 0 ? ` · ${beds.join(', ')} bed` : ''}
          {property.building ? ` · ${property.building}` : ''}
        </p>
        <p className="mt-1 text-xs text-zinc-500">{property.clients ? property.clients.name : 'No owner'}</p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5 text-right">
        <div className="flex flex-wrap justify-end gap-1.5">
          {statuses.map((s) => (
            <span key={s} className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[s] ?? 'bg-white/5 text-zinc-400 ring-white/10'}`}>
              {s}
            </span>
          ))}
          {property.listing_statuses && (
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${LISTING_STATUS_STYLES[property.listing_statuses.name] ?? 'bg-white/5 text-zinc-400 ring-white/10'}`}>
              {property.listing_statuses.name}
            </span>
          )}
        </div>
        {property.asking_price && <p className="font-bold text-white">AED {property.asking_price.toLocaleString()}</p>}
        {property.rental_income && <p className="font-bold text-white">AED {property.rental_income.toLocaleString()}/yr</p>}
      </div>
    </Link>
  );
}
