export type OpenWhatsappResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

import { buildWhatsappUrl as buildQrWhatsappUrl, sanitizePhone } from './whatsapp';

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export function isValidWhatsappPhone(phone: string): boolean {
  return Boolean(sanitizePhone(phone));
}

export function buildWhatsappUrl(phone: string, message?: string): OpenWhatsappResult {
  const url = buildQrWhatsappUrl(phone, message);
  if (!url) {
    return { ok: false, error: 'Telefone invalido para WhatsApp.' };
  }
  return { ok: true, url };
}

import { invokeCommand } from '@shared/lib/tauri/invoke-command';

export async function openWhatsapp(phone: string, message?: string): Promise<OpenWhatsappResult> {
  const result = buildWhatsappUrl(phone, message);

  if (!result.ok) {
    return result;
  }

  try {
    await invokeCommand('open_external_url', { url: result.url });
  } catch {
    const popup = window.open(result.url, '_blank', 'noopener,noreferrer');
    if (!popup) {
      return { ok: false, error: 'Não foi possível abrir o WhatsApp.' };
    }
  }

  return result;
}
