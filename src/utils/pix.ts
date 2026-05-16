export type PixPayloadInput = {
  key: string;
  receiverName: string;
  receiverCity: string;
  amount?: number;
  description?: string;
};

export function buildPixPayload(input: PixPayloadInput): string {
  const key = input.key.trim();
  const receiverName = sanitizePixText(input.receiverName);
  const receiverCity = sanitizePixText(input.receiverCity);

  if (!key) throw new Error('Chave PIX obrigatoria.');
  if (!receiverName) throw new Error('Nome do recebedor PIX obrigatorio.');
  if (!receiverCity) throw new Error('Cidade do recebedor PIX obrigatoria.');
  if (input.amount !== undefined && (!Number.isFinite(input.amount) || input.amount <= 0)) {
    throw new Error('Valor PIX invalido.');
  }

  const merchantAccountInfo = [
    field('00', 'br.gov.bcb.pix'),
    field('01', key),
    input.description ? field('02', sanitizePixText(input.description)) : '',
  ].join('');
  const body = [
    field('00', '01'),
    field('26', merchantAccountInfo),
    field('52', '0000'),
    field('53', '986'),
    input.amount !== undefined ? field('54', input.amount.toFixed(2)) : '',
    field('58', 'BR'),
    field('59', receiverName.slice(0, 25)),
    field('60', receiverCity.slice(0, 15)),
    field('62', field('05', '***')),
  ].join('');
  const payloadWithoutCrc = `${body}6304`;
  return `${payloadWithoutCrc}${crc16(payloadWithoutCrc)}`;
}

function field(id: string, value: string): string {
  return `${id}${String(value.length).padStart(2, '0')}${value}`;
}

function sanitizePixText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s.-]/g, '')
    .trim()
    .toUpperCase();
}

function crc16(value: string): string {
  let crc = 0xffff;
  for (let index = 0; index < value.length; index += 1) {
    crc ^= value.charCodeAt(index) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc & 0x8000) !== 0 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}
