export function parseBRLInputToNumber(value: string): number {
  const normalized = value.replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '');
  return Number(normalized || 0);
}

export function parseBRLInputToCents(value: string): number {
  return Math.round(parseBRLInputToNumber(value) * 100);
}

export function formatNumberToBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatBRLInput(value: string): string {
  const sanitized = value.replace(/[^\d,]/g, '');
  if (!sanitized) return '';
  const [integerPart = '', decimalPart = ''] = sanitized.split(',');
  const integerDigits = integerPart.replace(/^0+(?=\d)/, '') || '0';
  const grouped = Number(integerDigits).toLocaleString('pt-BR');
  return decimalPart.length > 0 ? `${grouped},${decimalPart.slice(0, 2)}` : grouped;
}

export function sanitizeIntegerInput(value: string): string {
  return value.replace(/\D/g, '');
}

export function formatPercentBR(value: number): string {
  return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(value)}%`;
}
