import Link from 'next/link';
import { getProperties, getPropertyLookups } from '@/lib/properties';
import PropertiesList from '@/components/PropertiesList';

export default async function PropertiesPage() {
  const [properties, lookups] = await Promise.all([getProperties(), getPropertyLookups()]);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-100">Properties</h1>
            <p className="text-sm text-zinc-500">{properties.length} total</p>
          </div>
          <Link
            href="/properties/new"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
          >
            + Add Property
          </Link>
        </div>

        <PropertiesList properties={properties} lookups={lookups} />
      </div>
    </div>
  );
}
