import type { ImportColumnKey, ImportColumnMapping, ImportSourceData } from '../types/inventory.types';

const columnAliases: Record<Exclude<ImportColumnKey, 'ignore'>, string[]> = {
  sku: ['sku', 'codigo', 'cod', 'referencia', 'ref'],
  barcode: ['barcode', 'codigo de barras', 'ean', 'gtin', 'cod barras'],
  name: ['nome', 'produto', 'descricao', 'descrição', 'item'],
  category: ['categoria', 'grupo', 'departamento', 'linha'],
  supplier: ['fornecedor', 'marca', 'fabricante'],
  costPrice: ['custo', 'preco custo', 'preço custo', 'valor custo', 'compra'],
  salePrice: ['venda', 'preco venda', 'preço venda', 'valor venda', 'preco', 'preço'],
  currentStock: ['estoque', 'saldo', 'qtd', 'quantidade', 'quant'],
  minStock: ['minimo', 'mínimo', 'estoque minimo', 'estoque mínimo'],
  location: ['local', 'localizacao', 'localização', 'prateleira', 'endereco', 'endereçamento'],
  unit: ['unidade', 'un', 'medida'],
};

export async function parseImportFile(file: File): Promise<ImportSourceData> {
  const extension = file.name.split('.').pop()?.toLocaleLowerCase('pt-BR');

  if (extension === 'csv') {
    const text = await file.text();
    return parseCsv(text, file.name);
  }

  if (extension === 'xlsx' || extension === 'xls') {
    const buffer = await file.arrayBuffer();
    return parseWorkbook(buffer, file.name);
  }

  throw new Error('Formato nao suportado. Use CSV, XLS ou XLSX.');
}

export function autoMapColumns(headers: string[]): ImportColumnMapping {
  return headers.reduce<ImportColumnMapping>((mapping, header) => {
    const normalizedHeader = normalizeHeader(header);
    const match = Object.entries(columnAliases).find(([, aliases]) =>
      aliases.some((alias) => normalizedHeader.includes(normalizeHeader(alias))),
    );

    mapping[header] = (match?.[0] as ImportColumnKey | undefined) ?? 'ignore';
    return mapping;
  }, {});
}

async function parseWorkbook(buffer: ArrayBuffer, fileName: string): Promise<ImportSourceData> {
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false, dense: false });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<Array<string | number | null>>(sheet, {
    header: 1,
    raw: false,
    defval: '',
  });

  return matrixToSource(matrix, fileName, sheetName);
}

function parseCsv(text: string, fileName: string): ImportSourceData {
  const rows = parseCsvRows(text);
  return matrixToSource(rows, fileName);
}

function matrixToSource(matrix: Array<Array<string | number | null>>, fileName: string, sheetName?: string): ImportSourceData {
  const nonEmptyRows = matrix.filter((row) => row.some((cell) => String(cell ?? '').trim()));
  const headers = (nonEmptyRows[0] ?? []).map((header, index) => String(header || `Coluna ${index + 1}`).trim());
  const rows = nonEmptyRows.slice(1).map((row) =>
    headers.reduce<Record<string, string>>((record, header, index) => {
      record[header] = String(row[index] ?? '').trim();
      return record;
    }, {}),
  );

  return {
    fileName,
    sheetName,
    headers,
    rows,
  };
}

function parseCsvRows(text: string) {
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

    if (char === ',' && !quoted) {
      row.push(current);
      current = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') {
        index += 1;
      }
      row.push(current);
      rows.push(row);
      current = '';
      row = [];
      continue;
    }

    current += char;
  }

  row.push(current);
  rows.push(row);
  return rows;
}

function normalizeHeader(value: string) {
  return value
    .trim()
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_-]/g, ' ');
}
