export function telHref(phone: string | null): string | null {
  if (!phone) return null;
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

export function whatsappHref(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^\d]/g, '');
  if (!digits) return null;
  return `https://wa.me/${digits}`;
}
