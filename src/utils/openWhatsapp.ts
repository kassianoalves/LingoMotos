export type OpenWhatsappResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export function normalizeBrazilianWhatsappNumber(phone: string): string | null {
  const digits = onlyDigits(phone);
  const nationalNumber = digits.startsWith('55') && digits.length > 11 ? digits.slice(2) : digits;

  if (!/^\d{10,11}$/.test(nationalNumber)) {
    return null;
  }

  return `55${nationalNumber}`;
}

export function isValidWhatsappPhone(phone: string): boolean {
  return normalizeBrazilianWhatsappNumber(phone) !== null;
}

export function buildWhatsappUrl(phone: string, message?: string): OpenWhatsappResult {
  const normalizedPhone = normalizeBrazilianWhatsappNumber(phone);

  if (!normalizedPhone) {
    return { ok: false, error: 'Telefone invalido para WhatsApp.' };
  }

  const baseUrl = `https://wa.me/${normalizedPhone}`;
  const url = message ? `${baseUrl}?text=${encodeURIComponent(message)}` : baseUrl;

  return { ok: true, url };
}

export function openWhatsapp(phone: string, message?: string): OpenWhatsappResult {
  const result = buildWhatsappUrl(phone, message);

  if (!result.ok) {
    return result;
  }

  window.open(result.url, '_blank', 'noopener,noreferrer');
  return result;
}
