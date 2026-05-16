import { serviceClient } from '@shared/api/service-client';
import type { CashFlowRecord, FinanceFilters, PayableRecord, ReceivableRecord, SaleRecord, TopSellingCategory } from '../types/finance.types';
import { getDateRangeInclusive } from '@/utils/dateRange';

export type FinanceRepository = {
  listSales(filters: FinanceFilters): Promise<SaleRecord[]>;
  listMonthSales(filters: FinanceFilters): Promise<SaleRecord[]>;
  listCashFlow(filters: FinanceFilters): Promise<CashFlowRecord[]>;
  listPayables(): Promise<PayableRecord[]>;
  listReceivables(): Promise<ReceivableRecord[]>;
  savePayable(payload: {
    id?: string;
    description: string;
    categoryType: string;
    amountCents: number;
    dueDate: string;
    companyOrSupplier: string;
    recurrenceType: 'unique' | 'monthly';
  }): Promise<PayableRecord>;
  deletePayable(id: string): Promise<void>;
  markPayableAsPaid(id: string): Promise<void>;
  saveReceivable(payload: {
    id?: string;
    description: string;
    customer: string;
    amountCents: number;
    dueDate: string;
    recurrenceType: 'unique' | 'monthly';
  }): Promise<ReceivableRecord>;
  deleteReceivable(id: string): Promise<void>;
  markReceivableAsReceived(id: string): Promise<void>;
  listCustomerSales(customerName: string): Promise<SaleRecord[]>;
  getTopSellingCategories(filters: FinanceFilters): Promise<TopSellingCategory[]>;
  getSummary(filters: FinanceFilters): Promise<{
    revenueTotalCents: number;
    revenueTodayCents: number;
    revenueMonthCents: number;
    expensesTotalCents: number;
    grossProfitCents: number;
    estimatedNetProfitCents: number;
    averageMarginPercent: number;
    averageTicketCents: number;
    salesCount: number;
    costOfGoodsSoldCents: number;
    cashTotalCents: number;
  }>;
};

export const financeRepository: FinanceRepository = {
  listSales: ({ startDate, endDate }) => serviceClient.execute<SaleRecord[], { startDate: string; endDate: string }>('list_sales', getDateRangeInclusive(startDate, endDate)),
  listMonthSales: ({ startDate, endDate }) => serviceClient.execute<SaleRecord[], { startDate: string; endDate: string }>('list_sales', getDateRangeInclusive(startDate, endDate)),
  async listCashFlow({ startDate, endDate }) {
    const rows = await serviceClient.execute<Array<Omit<CashFlowRecord, 'type'> & { movementType: CashFlowRecord['type'] }>, { startDate: string; endDate: string }>('list_cash_movements', getDateRangeInclusive(startDate, endDate));
    return rows.map(({ movementType, ...row }) => ({ ...row, type: movementType }));
  },
  listPayables: () => serviceClient.execute<PayableRecord[]>('list_payables'),
  listReceivables: () => serviceClient.execute<ReceivableRecord[]>('list_receivables'),
  savePayable: (payable) => serviceClient.execute<PayableRecord, { payable: {
    id?: string;
    description: string;
    categoryType: string;
    amountCents: number;
    dueDate: string;
    companyOrSupplier: string;
    recurrenceType: 'unique' | 'monthly';
  } }>('save_payable', { payable }),
  deletePayable: (id) => serviceClient.execute<void, { id: string }>('delete_payable', { id }),
  markPayableAsPaid: (id) => serviceClient.execute<void, { id: string }>('mark_payable_as_paid', { id }),
  saveReceivable: (receivable) => serviceClient.execute<ReceivableRecord, { receivable: {
    id?: string;
    description: string;
    customer: string;
    amountCents: number;
    dueDate: string;
    recurrenceType: 'unique' | 'monthly';
  } }>('save_receivable', { receivable }),
  deleteReceivable: (id) => serviceClient.execute<void, { id: string }>('delete_receivable', { id }),
  markReceivableAsReceived: (id) => serviceClient.execute<void, { id: string }>('mark_receivable_as_received', { id }),
  async listCustomerSales(customerName) {
    const sales = await serviceClient.execute<SaleRecord[], { startDate: string; endDate: string }>('list_sales', getDateRangeInclusive('2000-01-01', new Date().toISOString().slice(0, 10)));
    return sales.filter((sale) => sale.customerName === customerName);
  },
  getTopSellingCategories: ({ startDate, endDate }) =>
    serviceClient.execute<TopSellingCategory[], { startDate: string; endDate: string }>(
      'get_top_selling_categories',
      getDateRangeInclusive(startDate, endDate),
    ),
  getSummary: ({ startDate, endDate }) =>
    serviceClient.execute('get_financial_summary', getDateRangeInclusive(startDate, endDate)),
};
