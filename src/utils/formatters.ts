export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export function formatCpfCnpj(value: string): string {
  const digits = onlyDigits(value).slice(0, 14);

  if (digits.length <= 11) {
    return digits
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2');
  }

  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

export function formatBrlInput(value: string): string {
  const normalized = value.replace(/[^\d,]/g, '');
  const [integerPart = '', decimalPart = ''] = normalized.split(',');
  const integerDigits = integerPart.replace(/^0+(?=\d)/, '') || '0';
  const grouped = Number(integerDigits || 0).toLocaleString('pt-BR');
  return decimalPart ? `${grouped},${decimalPart.slice(0, 2)}` : grouped;
}

export function parseBrlToCents(value: string): number {
  const normalized = value.replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '');
  return Math.round(Number(normalized || 0) * 100);
}

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
}
