'use client';

import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';

function serialize(value: unknown): string {
  return JSON.stringify(value, (_key, v) => (v instanceof Set ? { __set: true, values: Array.from(v) } : v));
}

function deserialize<T>(text: string): T {
  return JSON.parse(text, (_key, v) => (v && typeof v === 'object' && v.__set ? new Set(v.values) : v));
}

// Like useState, but mirrors the value to sessionStorage so filters (search text, selected
// pills, etc.) survive navigating away to a detail page and back — sessionStorage rather than
// the URL so the change stays confined to each list component, and clears itself per tab.
export function usePersistentState<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const stored = sessionStorage.getItem(key);
      return stored ? deserialize<T>(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(key, serialize(state));
    } catch {
      // sessionStorage unavailable (private mode, quota, etc.) — fall back to in-memory only
    }
  }, [key, state]);

  return [state, setState];
}
