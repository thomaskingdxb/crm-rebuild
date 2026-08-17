'use client';

import { useFormStatus } from 'react-dom';

// Disables itself while the form's server action is in flight, so a slow
// save can't be mistaken for "nothing happened" and clicked repeatedly -
// that's what caused duplicate enquiries (and could hit any other form).
export default function SubmitButton({
  children,
  pendingText = 'Saving...',
  className,
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={`${className} disabled:cursor-not-allowed disabled:opacity-60`}>
      {pending ? pendingText : children}
    </button>
  );
}
