import { serviceClient } from '@shared/api/service-client';
import { getDateRangeInclusive, getTodayRange } from '@/utils/dateRange';
import type { Product } from '@features/inventory/types/inventory.types';
import type { SaleRecord } from '@features/finance/types/finance.types';

export type HomeDashboard = {
  cashOpen: boolean;
  salesToday: number;
  revenueTodayCents: number;
  estimatedProfitCents: number;
  lowStockCount: number;
  outOfStockCount: number;
  lastSoldItem: string;
  lastSaleLabel: string;
  lastSaleTotalCents: number;
};

export async function loadHomeDashboard(): Promise<HomeDashboard> {
  const range = getTodayRange();
  const inclusiveRange = getDateRangeInclusive(range.startDate, range.endDate);
  const [cashSession, summary, lowStock, outOfStock, sales] = await Promise.all([
    serviceClient.execute<unknown | null>('get_current_cash_session'),
    serviceClient.execute<{
      revenueTodayCents: number;
      estimatedNetProfitCents: number;
      salesCount: number;
    }, { startDate: string; endDate: string }>('get_financial_summary', inclusiveRange),
    serviceClient.execute<Product[]>('get_low_stock_products'),
    serviceClient.execute<Product[]>('get_out_of_stock_products'),
    serviceClient.execute<SaleRecord[], { startDate: string; endDate: string }>('list_sales', inclusiveRange),
  ]);
  const lastSale = sales[0];
  return {
    cashOpen: Boolean(cashSession),
    salesToday: summary.salesCount,
    revenueTodayCents: summary.revenueTodayCents,
    estimatedProfitCents: summary.estimatedNetProfitCents,
    lowStockCount: lowStock.length,
    outOfStockCount: outOfStock.length,
    lastSoldItem: lastSale ? `Venda ${lastSale.saleNumber}` : 'Sem vendas',
    lastSaleLabel: lastSale ? `Venda ${lastSale.saleNumber}` : 'Sem vendas',
    lastSaleTotalCents: lastSale?.totalCents ?? 0,
  };
}
