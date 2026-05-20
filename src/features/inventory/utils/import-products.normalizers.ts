export type NormalizedNumber =
  | { ok: true; value: number }
  | { ok: false; value: 0; message: string };

export function normalizeText(value: unknown) {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

export function normalizeCode(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Number.isInteger(value) ? String(value) : String(value).replace(/\.0+$/, '');
  }
  return String(value ?? '').trim().replace(/\s+/g, '');
}

export function normalizeMoney(value: unknown): NormalizedNumber {
  const raw = normalizeText(value);
  if (!raw) {
    return { ok: true, value: 0 };
  }

  const cleaned = raw.replace(/[^\d,.-]/g, '');
  if (!cleaned || cleaned === '-' || cleaned === ',' || cleaned === '.') {
    return { ok: false, value: 0, message: `Valor monetario invalido: "${raw}".` };
  }
  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');
  const decimalSeparator = lastComma > lastDot ? ',' : lastDot > -1 ? '.' : '';
  const normalized = decimalSeparator
    ? `${cleaned.slice(0, Math.max(lastComma, lastDot)).replace(/[,.]/g, '')}.${cleaned.slice(Math.max(lastComma, lastDot) + 1).replace(/[,.]/g, '')}`
    : cleaned.replace(/[,.]/g, '');
  const parsed = Number(normalized);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return { ok: false, value: 0, message: `Valor monetario invalido: "${raw}".` };
  }

  return { ok: true, value: parsed };
}

export function normalizeMoneyToCents(value: unknown): NormalizedNumber {
  const money = normalizeMoney(value);
  if (!money.ok) {
    return money;
  }
  return { ok: true, value: Math.round(money.value * 100) };
}

export function normalizeInteger(value: unknown): NormalizedNumber {
  const raw = normalizeText(value);
  if (!raw) {
    return { ok: true, value: 0 };
  }

  const normalized = raw.replace(/[^\d,.-]/g, '');
  const hasComma = normalized.includes(',');
  const hasDot = normalized.includes('.');
  const decimalSeparator = hasComma && hasDot
    ? normalized.lastIndexOf(',') > normalized.lastIndexOf('.') ? ',' : '.'
    : hasComma ? ',' : hasDot ? '.' : '';
  const numeric = decimalSeparator
    ? `${normalized.slice(0, normalized.lastIndexOf(decimalSeparator)).replace(/[,.]/g, '')}.${normalized.slice(normalized.lastIndexOf(decimalSeparator) + 1).replace(/[,.]/g, '')}`
    : normalized.replace(/[,.]/g, '');
  const parsed = Number(numeric);

  if (!Number.isFinite(parsed)) {
    return { ok: false, value: 0, message: `Quantidade invalida: "${raw}".` };
  }

  if (!Number.isInteger(parsed)) {
    return { ok: false, value: 0, message: `Estoque nao pode ser fracionado: "${raw}".` };
  }

  return { ok: true, value: parsed };
}

export function normalizeSearchValue(value: unknown) {
  return normalizeText(value)
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}
