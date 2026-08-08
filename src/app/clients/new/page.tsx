import Link from 'next/link';
import { getClientLookups } from '@/lib/clients';
import { createClientAction } from '@/app/clients/actions';
import { createClient } from '@/lib/supabase/server';
import SearchableMultiSelect from '@/components/SearchableMultiSelect';

const inputClass =
  'w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';
const labelClass = 'block text-xs font-medium text-zinc-400 mb-1';

export default async function NewClientPage() {
  const supabase = await createClient();
  const { clientTypes, clientStatuses, leadSources } = await getClientLookups(supabase);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="mx-auto max-w-xl px-6 py-8">
        <Link href="/clients" className="text-sm text-zinc-500 hover:text-zinc-300">
          ← Back to Clients
        </Link>

        <h1 className="mt-3 text-2xl font-semibold text-zinc-100 mb-6">Add Client</h1>

        <form action={createClientAction} className="space-y-4 surface-card p-6">
          <div>
            <label className={labelClass}>Name *</label>
            <input name="name" required className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Phone</label>
            <input name="phone" className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Email</label>
            <input name="email" type="email" className={inputClass} />
          </div>

          <div>
            <span className={labelClass}>Type (select all that apply)</span>
            <SearchableMultiSelect name="type_ids" options={clientTypes} defaultSelectedIds={new Set()} placeholder="Search types..." />
          </div>

          <div>
            <span className={labelClass}>Status (select all that apply)</span>
            <SearchableMultiSelect name="status_ids" options={clientStatuses} defaultSelectedIds={new Set()} placeholder="Search statuses..." />
          </div>

          <div>
            <label className={labelClass}>Source</label>
            <select name="source_id" className={inputClass}>
              <option value="">—</option>
              {leadSources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Date added</label>
            <input name="date_added" type="date" className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Date of birth</label>
            <input name="date_of_birth" type="date" className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Personal info</label>
            <textarea name="personal_info" rows={2} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Notes</label>
            <textarea name="notes" rows={3} className={inputClass} />
          </div>

          <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500">
            Save Client
          </button>
        </form>
      </div>
    </div>
  );
}
