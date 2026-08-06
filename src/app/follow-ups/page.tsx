import { getFollowUpClients, getActivityTypes, getClientLookups } from '@/lib/clients';
import FollowUpsList from '@/components/FollowUpsList';

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function FollowUpsPage() {
  const [allFollowUps, activityTypes, clientLookups] = await Promise.all([getFollowUpClients(), getActivityTypes(), getClientLookups()]);

  const today = todayStr();
  const clients = allFollowUps.filter((c) => c.follow_up_date! <= today);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-zinc-100">Follow Ups</h1>
          <p className="text-sm text-zinc-500">{clients.length} due today or overdue</p>
        </div>

        <FollowUpsList
          clients={clients}
          clientTypes={clientLookups.clientTypes}
          clientStatuses={clientLookups.clientStatuses}
          activityTypes={activityTypes}
        />
      </div>
    </div>
  );
}
