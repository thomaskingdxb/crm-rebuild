import { getFollowUpClients, getActivityTypes } from '@/lib/clients';
import ClientCard from '@/components/ClientCard';

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function FollowUpsPage() {
  const [clients, activityTypes] = await Promise.all([getFollowUpClients(), getActivityTypes()]);

  const today = todayStr();
  const overdue = clients.filter((c) => c.follow_up_date! < today);
  const dueToday = clients.filter((c) => c.follow_up_date === today);
  const upcoming = clients.filter((c) => c.follow_up_date! > today);

  const groups = [
    { title: 'Overdue', clients: overdue, badgeClass: 'bg-rose-500/10 text-rose-400 ring-rose-500/20' },
    { title: 'Due Today', clients: dueToday, badgeClass: 'bg-amber-500/10 text-amber-400 ring-amber-500/20' },
    { title: 'Upcoming', clients: upcoming, badgeClass: 'bg-white/5 text-zinc-400 ring-white/10' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-zinc-100">Follow Ups</h1>
          <p className="text-sm text-zinc-500">{clients.length} clients with a follow-up date set</p>
        </div>

        <div className="flex flex-col gap-6">
          {groups.map((g) => (
            <div key={g.title} className="surface-card p-5">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-200">
                {g.title}
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${g.badgeClass}`}>{g.clients.length}</span>
              </h2>
              {g.clients.length === 0 ? (
                <p className="text-sm text-zinc-500">Nothing here.</p>
              ) : (
                <div className="flex flex-col gap-4">
                  {g.clients.map((c) => (
                    <ClientCard key={c.id} client={c} activityTypes={activityTypes} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
