import { serviceClient } from '@shared/api/service-client';
import type { FinanceFilters } from '@features/finance/types/finance.types';
import { getDateRangeInclusive } from '@/utils/dateRange';

export type ReportsFilters = FinanceFilters & {
  paymentMethod: string;
  categoryId: string;
  supplierId: string;
  customerId: string;
};

export async function loadReports(filters: ReportsFilters) {
  const range = getDateRangeInclusive(filters.startDate, filters.endDate);
  const [sales, profit, stock, cash, customers, valuation] = await Promise.all([
    serviceClient.execute('get_sales_report', { ...range, paymentMethod: filters.paymentMethod || undefined, customerId: filters.customerId || undefined }),
    serviceClient.execute('get_profit_report', range),
    serviceClient.execute('get_stock_report', { categoryId: filters.categoryId || undefined, supplierId: filters.supplierId || undefined }),
    serviceClient.execute('get_cash_report', range),
    serviceClient.execute('get_customers_report', range),
    serviceClient.execute('get_inventory_valuation_report', { categoryId: filters.categoryId || undefined, supplierId: filters.supplierId || undefined }),
  ]);
  return { sales, profit, stock, cash, customers, valuation };
}

export function toCsv(rows: Array<Record<string, unknown>>, fallbackHeaders: string[] = []) {
  const headers = rows.length > 0 ? Object.keys(rows[0]) : fallbackHeaders;
  if (headers.length === 0) {
    return '\uFEFFregistro\r\n';
  }

  const body = rows.map((row) => headers.map((key) => escapeCsv(formatCsvValue(key, row[key]))).join(';'));
  return `\uFEFF${[headers.join(';'), ...body].join('\r\n')}`;
}

function escapeCsv(value: string) {
  if (/[;"\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatCsvValue(key: string, value: unknown) {
  if (value == null) return '';

  if (typeof value === 'number') {
    if (key.toLowerCase().endsWith('cents')) {
      return (value / 100).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    return value.toLocaleString('pt-BR');
  }

  if (typeof value === 'string' && /(?:At|Date)$/i.test(key)) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    }
  }

  return String(value);
}
