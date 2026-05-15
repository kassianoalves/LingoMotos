import { onlyDigits } from '@/utils/openWhatsapp';

export function sanitizePhone(value: string): string {
  const digits = onlyDigits(value);
  return digits.startsWith('55') && digits.length > 11 ? digits.slice(2) : digits;
}

export function formatBrazilianPhone(value: string): string {
  const digits = sanitizePhone(value).slice(0, 11);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

