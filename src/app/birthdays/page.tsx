import Link from 'next/link';
import { getUpcomingBirthdays } from '@/lib/clients';
import { createClient } from '@/lib/supabase/server';

function formatDob(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
}

export default async function BirthdaysPage() {
  const supabase = await createClient();
  // 365 covers a full year, so this shows every client with a date_of_birth
  // on file, sorted by how soon their next birthday falls.
  const birthdays = await getUpcomingBirthdays(supabase, 365);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-zinc-100">Birthdays</h1>
          <p className="text-sm text-zinc-500">
            {birthdays.length} client{birthdays.length === 1 ? '' : 's'} with a date of birth on file, soonest first.
          </p>
        </div>

        {birthdays.length === 0 ? (
          <div className="surface-card p-6">
            <p className="text-sm text-zinc-500">No clients have a date of birth on file yet.</p>
          </div>
        ) : (
          <div className="surface-card divide-y divide-white/5">
            {birthdays.map((b) => (
              <Link
                key={b.id}
                href={`/clients/${b.id}`}
                className="flex items-center justify-between px-5 py-4 transition hover:bg-white/5"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-100">{b.name}</p>
                  <p className="text-xs text-zinc-500">{formatDob(b.date_of_birth)}</p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm font-medium ${
                      b.days_until <= 3 ? 'text-amber-400' : 'text-zinc-300'
                    }`}
                  >
                    {b.days_until === 0 ? 'Today' : b.days_until === 1 ? 'Tomorrow' : `In ${b.days_until} days`}
                  </p>
                  {b.turning_age != null && <p className="text-xs text-zinc-500">Turning {b.turning_age}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
