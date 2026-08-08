import Link from 'next/link';
import { getClients, getClientLookups, getActivityTypes } from '@/lib/clients';
import { createClient } from '@/lib/supabase/server';
import ClientsList from '@/components/ClientsList';

export default async function ClientsPage() {
  const supabase = await createClient();
  const [clients, lookups, activityTypes] = await Promise.all([getClients(supabase), getClientLookups(supabase), getActivityTypes(supabase)]);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-100">Clients</h1>
            <p className="text-sm text-zinc-500">{clients.length} total</p>
          </div>
          <Link
            href="/clients/new"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
          >
            + Add Client
          </Link>
        </div>

        <ClientsList clients={clients} clientTypes={lookups.clientTypes} clientStatuses={lookups.clientStatuses} activityTypes={activityTypes} />
      </div>
    </div>
  );
}
