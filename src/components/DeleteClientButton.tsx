'use client';

export default function DeleteClientButton({ name, action }: { name: string; action: () => Promise<void> }) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(`Delete ${name}? This cannot be undone.`)) e.preventDefault();
      }}
    >
      <button
        type="submit"
        className="rounded-lg bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-400 ring-1 ring-inset ring-rose-500/20 transition hover:bg-rose-500/20"
      >
        Delete Client
      </button>
    </form>
  );
}
