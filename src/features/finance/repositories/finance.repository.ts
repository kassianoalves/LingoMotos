import { financeCashFlow, financePayables, financeReceivables, financeSales } from '../data/finance.seed';
import type { CashFlowRecord, FinanceFilters, PayableRecord, ReceivableRecord, SaleRecord } from '../types/finance.types';

export type FinanceRepository = {
  listSales(filters: FinanceFilters): Promise<SaleRecord[]>;
  listMonthSales(filters: FinanceFilters): Promise<SaleRecord[]>;
  listCashFlow(filters: FinanceFilters): Promise<CashFlowRecord[]>;
  listPayables(): Promise<PayableRecord[]>;
  listReceivables(): Promise<ReceivableRecord[]>;
};

export const financeRepository: FinanceRepository = {
  async listSales(filters) {
    return financeSales.filter((sale) => isWithinPeriod(sale.soldAt, filters));
  },

  async listMonthSales(filters) {
    const month = filters.endDate.slice(0, 7);
    return financeSales.filter((sale) => sale.soldAt.startsWith(month));
  },

  async listCashFlow(filters) {
    return financeCashFlow.filter((item) => isWithinPeriod(item.occurredAt, filters));
  },

  async listPayables() {
    return financePayables;
  },

  async listReceivables() {
    return financeReceivables;
  },
};

function isWithinPeriod(value: string, filters: FinanceFilters) {
  const date = value.slice(0, 10);
  return date >= filters.startDate && date <= filters.endDate;
}

