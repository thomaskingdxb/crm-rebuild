import Link from 'next/link';
import { getDashboardStats } from '@/lib/dashboard';

const STATUS_COLORS: Record<string, string> = {
  Ongoing: 'text-emerald-400',
  Closed: 'text-zinc-400',
  Unresponsive: 'text-rose-400',
};

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="text-2xl font-semibold text-zinc-100">Dashboard</h1>
        <p className="mb-6 text-sm text-zinc-500">Overview of your client base.</p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-gradient-to-br from-[#1c2438] via-[#15161e] to-[#101014] p-5 shadow-xl shadow-black/40 ring-1 ring-white/5">
            <p className="text-xs font-medium text-zinc-400">Total clients</p>
            <p className="mt-1 text-3xl font-semibold text-zinc-100">{stats.totalClients}</p>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-[#1c2438] via-[#15161e] to-[#101014] p-5 shadow-xl shadow-black/40 ring-1 ring-white/5">
            <p className="text-xs font-medium text-zinc-400">Follow-ups due</p>
            <p className="mt-1 text-3xl font-semibold text-amber-400">{stats.followUpsDue}</p>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-[#1c2438] via-[#15161e] to-[#101014] p-5 shadow-xl shadow-black/40 ring-1 ring-white/5">
            <p className="mb-2 text-xs font-medium text-zinc-400">By status</p>
            <div className="space-y-1">
              {stats.statusCounts.map((s) => (
                <div key={s.name} className="flex items-center justify-between text-sm">
                  <span className={STATUS_COLORS[s.name] ?? 'text-zinc-300'}>{s.name}</span>
                  <span className="font-medium text-zinc-200">{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <Link
            href="/clients"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
          >
            View Clients
          </Link>
          <Link
            href="/clients/new"
            className="rounded-lg bg-white/5 px-4 py-2 text-sm font-medium text-zinc-300 ring-1 ring-inset ring-white/10 transition hover:ring-white/20"
          >
            + Add Client
          </Link>
        </div>
      </div>
    </div>
  );
}
