import type {
  ImportColumnKey,
  ImportColumnMapping,
  ImportColumnType,
  ImportSourceData,
  ProductCustomFieldType,
} from '../types/inventory.types';
import { normalizeCode, normalizeSearchValue, normalizeText } from './import-products.normalizers';

const columnAliases: Record<Exclude<ImportColumnKey, 'ignore' | 'unit'>, string[]> = {
  name: ['nome', 'produto', 'descricao', 'descrição', 'item', 'peça', 'peca', 'mercadoria', 'descrição do produto'],
  sku: ['sku', 'codigo', 'código', 'cod', 'referência', 'referencia', 'ref', 'codigo interno', 'código interno'],
  barcode: ['codigo de barras', 'código de barras', 'ean', 'gtin', 'barcode'],
  category: ['categoria', 'grupo', 'departamento', 'tipo', 'familia', 'família', 'linha'],
  supplier: ['fornecedor', 'distribuidor', 'fabricante'],
  brand: ['marca', 'brand'],
  motorcycleApplication: ['aplicacao', 'aplicação', 'moto', 'modelo', 'compatibilidade', 'veiculo', 'veículo'],
  costPrice: ['custo', 'preco custo', 'preço custo', 'compra', 'valor compra', 'preco compra'],
  salePrice: ['preco', 'preço', 'venda', 'preco venda', 'preço venda', 'valor', 'valor venda'],
  currentStock: ['estoque', 'quantidade', 'qtd', 'saldo', 'disponível', 'disponivel'],
  minStock: ['estoque minimo', 'estoque mínimo', 'minimo', 'mínimo'],
  location: ['localizacao', 'localização', 'prateleira', 'corredor', 'gaveta'],
  notes: ['observacao', 'observação', 'obs', 'notas'],
};

export async function parseImportFile(file: File): Promise<ImportSourceData> {
  const extension = file.name.split('.').pop()?.toLocaleLowerCase('pt-BR');

  if (extension === 'csv') {
    const text = await file.text();
    return parseCsv(text, file.name, 'csv');
  }

  if (extension === 'xlsx' || extension === 'xls') {
    const buffer = await file.arrayBuffer();
    return parseWorkbook(buffer, file.name, extension);
  }

  throw new Error('Formato não suportado. Use CSV, XLS ou XLSX.');
}

export function autoMapColumns(sourceOrHeaders: ImportSourceData | string[]): ImportColumnMapping {
  const source = Array.isArray(sourceOrHeaders) ? null : sourceOrHeaders;
  const headers = Array.isArray(sourceOrHeaders) ? sourceOrHeaders : sourceOrHeaders.headers;

  return headers.reduce<ImportColumnMapping>((mapping, header) => {
    const column = source?.columns.find((item) => item.header === header);
    const suggestedField = column
      ? suggestProductField(column.header, column.sampleValues).field
      : suggestProductField(header, []).field;

    mapping[header] = {
      kind: 'known',
      field: suggestedField,
    };
    return mapping;
  }, {});
}

export function suggestProductField(columnName: string, sampleValues: string[]): {
  field: ImportColumnKey;
  confidence: 'high' | 'medium' | 'low';
} {
  const normalizedHeader = normalizeHeader(columnName);
  const type = detectColumnType(sampleValues);

  const exact = Object.entries(columnAliases).find(([, aliases]) =>
    aliases.some((alias) => normalizedHeader === normalizeHeader(alias)),
  );
  if (exact) {
    return { field: exact[0] as ImportColumnKey, confidence: 'high' as const };
  }

  const partial = Object.entries(columnAliases).find(([, aliases]) =>
    aliases.some((alias) => normalizedHeader.includes(normalizeHeader(alias)) || normalizeHeader(alias).includes(normalizedHeader)),
  );
  if (partial) {
    return { field: partial[0] as ImportColumnKey, confidence: 'medium' as const };
  }

  if (type === 'currency') {
    return { field: normalizedHeader.includes('custo') || normalizedHeader.includes('compra') ? 'costPrice' : 'salePrice', confidence: 'low' };
  }
  if (type === 'integer') {
    return { field: normalizedHeader.includes('min') ? 'minStock' : 'currentStock', confidence: 'low' };
  }
  if (type === 'code') {
    return { field: looksLikeBarcode(sampleValues) ? 'barcode' : 'sku', confidence: 'low' };
  }
  if (type === 'phone_document') {
    return { field: 'ignore' as ImportColumnKey, confidence: 'low' as const };
  }

  return { field: 'ignore' as ImportColumnKey, confidence: 'low' as const };
}

export function detectColumnType(sampleValues: string[]): ImportColumnType {
  const values = sampleValues.map(normalizeText).filter(Boolean).slice(0, 20);
  if (values.length === 0) return 'text';

  const score = {
    currency: values.filter(isCurrencyLike).length,
    integer: values.filter(isIntegerLike).length,
    code: values.filter(isCodeLike).length,
    date: values.filter(isDateLike).length,
    boolean: values.filter(isBooleanLike).length,
    phoneDocument: values.filter(isPhoneOrDocumentLike).length,
  };
  const majority = Math.max(1, Math.ceil(values.length * 0.6));

  if (score.currency >= majority) return 'currency';
  if (score.boolean >= majority) return 'boolean';
  if (score.date >= majority) return 'date';
  if (score.code >= majority) return 'code';
  if (score.integer >= majority) return 'integer';
  if (score.phoneDocument >= majority) return 'phone_document';
  return 'text';
}

export function customFieldTypeFromColumnType(type: ImportColumnType): ProductCustomFieldType {
  if (type === 'currency') return 'currency';
  if (type === 'integer') return 'number';
  if (type === 'date') return 'date';
  if (type === 'boolean') return 'boolean';
  return 'text';
}

async function parseWorkbook(
  buffer: ArrayBuffer,
  fileName: string,
  fileType: ImportSourceData['fileType'],
): Promise<ImportSourceData> {
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true, dense: false });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<Array<string | number | boolean | Date | null>>(sheet, {
    header: 1,
    raw: false,
    defval: '',
    blankrows: false,
  });

  return matrixToSource(matrix, fileName, fileType, sheetName);
}

function parseCsv(text: string, fileName: string, fileType: ImportSourceData['fileType']): ImportSourceData {
  const rows = parseCsvRows(stripBom(text), detectDelimiter(text));
  return matrixToSource(rows, fileName, fileType);
}

function matrixToSource(
  matrix: Array<Array<string | number | boolean | Date | null>>,
  fileName: string,
  fileType: ImportSourceData['fileType'],
  sheetName?: string,
): ImportSourceData {
  const nonEmptyRows = matrix.filter((row) => row.some((cell) => normalizeText(cell)));
  if (nonEmptyRows.length === 0) {
    throw new Error('Arquivo vazio. Confira a planilha e tente novamente.');
  }

  const headers = makeUniqueHeaders(nonEmptyRows[0] ?? []);
  const rows = nonEmptyRows.slice(1).map((row) =>
    headers.reduce<Record<string, string>>((record, header, index) => {
      record[header] = formatCellValue(row[index]);
      return record;
    }, {}),
  );
  const columns = headers.map((header, index) => {
    const sampleValues = rows.map((row) => row[header]).filter(Boolean).slice(0, 20);
    const detectedType = detectColumnType(sampleValues);
    const suggestion = suggestProductField(header, sampleValues);
    return {
      header,
      originalHeader: formatCellValue(nonEmptyRows[0]?.[index]) || `Coluna ${index + 1}`,
      sampleValues,
      detectedType,
      suggestedField: suggestion.field,
      confidence: suggestion.confidence,
    };
  });

  return {
    fileName,
    fileType,
    sheetName,
    headers,
    columns,
    rows,
  };
}

function makeUniqueHeaders(row: Array<string | number | boolean | Date | null>) {
  const used = new Map<string, number>();
  return row.map((cell, index) => {
    const base = normalizeText(formatCellValue(cell)) || `Coluna ${index + 1}`;
    const count = used.get(base) ?? 0;
    used.set(base, count + 1);
    return count === 0 ? base : `${base} ${count + 1}`;
  });
}

function formatCellValue(value: unknown) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? '' : value.toLocaleDateString('pt-BR');
  }
  return normalizeText(value);
}

function parseCsvRows(text: string, delimiter: ',' | ';') {
  const rows: string[][] = [];
  let current = '';
  let row: string[] = [];
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (char === delimiter && !quoted) {
      row.push(current);
      current = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(current);
      rows.push(row);
      current = '';
      row = [];
      continue;
    }

    current += char;
  }

  if (current || row.length > 0) {
    row.push(current);
    rows.push(row);
  }
  return rows;
}

function stripBom(text: string) {
  return text.replace(/^\uFEFF/, '');
}

function detectDelimiter(text: string): ',' | ';' {
  const lines = stripBom(text).split(/\r?\n/).filter((line) => line.trim()).slice(0, 5);
  const semicolons = lines.reduce((sum, line) => sum + countDelimiter(line, ';'), 0);
  const commas = lines.reduce((sum, line) => sum + countDelimiter(line, ','), 0);
  return semicolons > commas ? ';' : ',';
}

function countDelimiter(value: string, delimiter: ',' | ';') {
  let count = 0;
  let quoted = false;
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    const next = value[index + 1];
    if (char === '"' && quoted && next === '"') {
      index += 1;
      continue;
    }
    if (char === '"') quoted = !quoted;
    if (char === delimiter && !quoted) count += 1;
  }
  return count;
}

function normalizeHeader(value: string) {
  return normalizeSearchValue(value).replace(/[_-]/g, ' ');
}

function isCurrencyLike(value: string) {
  const normalized = normalizeCode(value);
  return /r\$/i.test(value) || /^\d{1,3}([.,]\d{3})*[,.]\d{2}$/.test(normalized) || /^\d+[,.]\d{2}$/.test(normalized);
}

function isIntegerLike(value: string) {
  return /^-?\d+([,.]0+)?$/.test(normalizeCode(value));
}

function isCodeLike(value: string) {
  const normalized = normalizeCode(value);
  return /^0\d{3,}$/.test(normalized) || /^\d{8,14}$/.test(normalized) || /^[a-z0-9-]{4,}$/i.test(normalized) && /\d/.test(normalized);
}

function looksLikeBarcode(values: string[]) {
  return values.filter((value) => /^\d{8,14}$/.test(normalizeCode(value))).length >= Math.max(1, Math.ceil(values.filter(Boolean).length * 0.5));
}

function isDateLike(value: string) {
  return /^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(value) || /^\d{4}-\d{2}-\d{2}/.test(value);
}

function isBooleanLike(value: string) {
  return ['sim', 'nao', 'não', 'true', 'false', 'ativo', 'inativo', 'yes', 'no'].includes(normalizeSearchValue(value));
}

function isPhoneOrDocumentLike(value: string) {
  const digits = normalizeCode(value).replace(/\D/g, '');
  return digits.length === 11 || digits.length === 14 || /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/.test(value);
}
