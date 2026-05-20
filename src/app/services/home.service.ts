import { serviceClient } from '@shared/api/service-client';
import { getDateRangeInclusive, getTodayRange } from '@/utils/dateRange';
import type { Product } from '@features/inventory/types/inventory.types';
import type { PayableRecord, SaleRecord } from '@features/finance/types/finance.types';

type CashSession = {
  id: string;
  openedAt: string;
  status: string;
};

export type HomeDashboard = {
  cashOpen: boolean;
  cashOpenedAt: string | null;
  salesToday: number;
  revenueTodayCents: number;
  estimatedProfitCents: number;
  lowStockCount: number;
  outOfStockCount: number;
  lowStockProducts: Product[];
  dueTodayPayables: number;
  lastSoldItem: string;
  lastSaleLabel: string;
  lastSaleTotalCents: number;
  lastSaleTime: string | null;
  lastSaleCustomerName: string;
  lastSalePaymentMethod: string;
  salesLast7Days: Array<{ date: string; revenueCents: number; salesCount: number }>;
};

export async function loadHomeDashboard(): Promise<HomeDashboard> {
  const range = getTodayRange();
  const inclusiveRange = getDateRangeInclusive(range.startDate, range.endDate);
  const last7DaysStart = new Date();
  last7DaysStart.setDate(last7DaysStart.getDate() - 6);
  const last7DaysRange = getDateRangeInclusive(toDateInput(last7DaysStart), range.endDate);
  const [cashSession, summary, lowStock, outOfStock, sales, last7DaysSales, payables] = await Promise.all([
    serviceClient.execute<CashSession | null>('get_current_cash_session'),
    serviceClient.execute<{
      revenueTodayCents: number;
      estimatedNetProfitCents: number;
      salesCount: number;
    }, { startDate: string; endDate: string }>('get_financial_summary', inclusiveRange),
    serviceClient.execute<Product[]>('get_low_stock_products'),
    serviceClient.execute<Product[]>('get_out_of_stock_products'),
    serviceClient.execute<SaleRecord[], { startDate: string; endDate: string }>('list_sales', inclusiveRange),
    serviceClient.execute<SaleRecord[], { startDate: string; endDate: string }>('list_sales', last7DaysRange),
    serviceClient.execute<PayableRecord[]>('list_payables'),
  ]);
  const lastSale = sales[0];
  const dueTodayPayables = payables.filter((payable) => payable.status !== 'paid' && payable.dueDate === range.startDate).length;
  return {
    cashOpen: Boolean(cashSession),
    cashOpenedAt: cashSession?.openedAt ?? null,
    salesToday: summary.salesCount,
    revenueTodayCents: summary.revenueTodayCents,
    estimatedProfitCents: summary.estimatedNetProfitCents,
    lowStockCount: lowStock.length,
    outOfStockCount: outOfStock.length,
    lowStockProducts: lowStock.slice(0, 8),
    dueTodayPayables,
    lastSoldItem: lastSale ? `Venda ${lastSale.saleNumber}` : 'Sem vendas',
    lastSaleLabel: lastSale ? `Venda ${lastSale.saleNumber}` : 'Sem vendas',
    lastSaleTotalCents: lastSale?.totalCents ?? 0,
    lastSaleTime: lastSale?.soldAt ?? null,
    lastSaleCustomerName: lastSale?.customerName ?? '',
    lastSalePaymentMethod: lastSale?.paymentMethod ?? '',
    salesLast7Days: buildLast7Days(last7DaysSales, last7DaysStart),
  };
}

function buildLast7Days(sales: SaleRecord[], startDate: Date) {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    return toDateInput(date);
  });

  return days.map((date) => {
    const daySales = sales.filter((sale) => sale.status === 'completed' && sale.soldAt.slice(0, 10) === date);
    return {
      date,
      revenueCents: daySales.reduce((total, sale) => total + sale.totalCents, 0),
      salesCount: daySales.length,
    };
  });
}

function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}
