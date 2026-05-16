export function sanitizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const nationalNumber = digits.startsWith('55') ? digits.slice(2) : digits;
  if (!/^\d{10,11}$/.test(nationalNumber)) return '';
  return `55${nationalNumber}`;
}

export function buildWhatsappUrl(phone: string, message?: string): string | null {
  const sanitized = sanitizePhone(phone);
  if (!sanitized) return null;
  const baseUrl = `https://wa.me/${sanitized}`;
  return message ? `${baseUrl}?text=${encodeURIComponent(message)}` : baseUrl;
}
