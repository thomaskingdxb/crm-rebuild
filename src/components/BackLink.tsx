'use client';

import { useRouter } from 'next/navigation';

export default function BackLink({ href, label }: { href: string; label: string }) {
  const router = useRouter();

  function handleClick() {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push(href);
    }
  }

  return (
    <button type="button" onClick={handleClick} className="text-sm text-zinc-500 hover:text-zinc-300">
      {label}
    </button>
  );
}
