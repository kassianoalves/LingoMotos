export type GenerateSkuInput = {
  category?: string;
  brand?: string;
  productName: string;
  motorcycleApplication?: string;
  sequence?: number;
};

export function buildSkuBase({ category, brand, productName, motorcycleApplication }: GenerateSkuInput) {
  const blocks = [
    block(category, 3, 'GER'),
    block(brand, 3, 'GEN'),
    block(productName, 4, 'PROD'),
    motorcycleApplication ? block(motorcycleApplication, 4, '') : '',
  ].filter(Boolean);

  return blocks.join('-');
}

export function formatSku(base: string, sequence: number) {
  return `${base}-${String(sequence).padStart(4, '0')}`;
}

function block(value: string | undefined, size: number, fallback: string) {
  const normalized = normalize(value ?? '');
  if (!normalized) return fallback;

  const words = normalized.split('-').filter(Boolean);
  const compact = words.length > 1
    ? words.map((word) => word[0]).join('') + words.join('')
    : words.join('');

  return compact.replace(/-/g, '').slice(0, size);
}

function normalize(value: string) {
  return value
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
