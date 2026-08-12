'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/', available: true },
  { label: 'Clients', href: '/clients', available: true },
  { label: 'Properties', href: '/properties', available: true },
  { label: 'Enquiries', href: '/enquiries', available: true },
  { label: 'Pipeline', href: '/pipeline', available: true },
  { label: 'Follow Ups', href: '/follow-ups', available: true },
  { label: 'Deals', href: '/deals', available: true },
  { label: 'Tasks', href: '/tasks', available: true },
  { label: 'Coaching', href: '/coaching', available: true },
  { label: 'Social', href: '/social', available: true },
  { label: 'KPIs', href: '/kpis', available: true },
  { label: 'Calculators', href: '/calculators', available: true },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await supabase.auth.signOut();
    setOpen(false);
    router.push('/login');
    router.refresh();
  }

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-white/5 bg-[#0a0a0f]/85 px-6 py-4 shadow-lg shadow-black/40 backdrop-blur-md">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-300 ring-1 ring-inset ring-white/10 transition hover:bg-white/5 hover:text-white"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2 4.5h14M2 9h14M2 13.5h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-zinc-100">CRM</span>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <nav className="relative flex h-full w-64 flex-col gap-1 bg-[#101015] p-4 shadow-2xl shadow-black/60 ring-1 ring-white/5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-zinc-100">Menu</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-white/5 hover:text-white"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              if (!item.available) {
                return (
                  <span
                    key={item.label}
                    className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-zinc-600"
                  >
                    {item.label}
                    <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-zinc-500">Soon</span>
                  </span>
                );
              }
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active ? 'bg-blue-500/20 text-blue-300' : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            <button
              type="button"
              onClick={handleSignOut}
              className="mt-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-zinc-500 transition hover:bg-white/5 hover:text-rose-400"
            >
              Sign out
            </button>
          </nav>
        </div>
      )}
    </>
  );
}
