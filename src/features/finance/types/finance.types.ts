export type FinancePeriod = 'today' | 'month' | 'quarter' | 'custom';

export type PaymentMethodType = 'cash' | 'pix' | 'debit_card' | 'credit_card' | 'bank_transfer' | 'other';

export type FinanceFilters = {
  period: FinancePeriod;
  startDate: string;
  endDate: string;
};

export type SaleRecord = {
  id: string;
  saleNumber: string;
  soldAt: string;
  customerName: string;
  itemsCount: number;
  paymentMethod: PaymentMethodType;
  totalCents: number;
  costCents: number;
  discountCents: number;
  feeCents: number;
  status: 'completed' | 'cancelled' | 'refunded';
};

export type CashFlowRecord = {
  id: string;
  occurredAt: string;
  description: string;
  type: 'sale_payment' | 'expense' | 'cash_in' | 'cash_out' | 'supplier_payment' | 'receivable_payment';
  direction: 'in' | 'out';
  amountCents: number;
  paymentMethod: PaymentMethodType;
  status: 'pending' | 'confirmed' | 'cancelled';
};

export type PayableRecord = {
  id: string;
  supplierName: string;
  description: string;
  dueDate: string;
  amountCents: number;
  status: 'open' | 'paid' | 'overdue';
};

export type ReceivableRecord = {
  id: string;
  customerName: string;
  description: string;
  dueDate: string;
  amountCents: number;
  status: 'open' | 'received' | 'overdue';
};

export type PaymentMethodSummary = {
  type: PaymentMethodType;
  label: string;
  amountCents: number;
  feeCents: number;
  netCents: number;
  count: number;
};

export type DailyPerformancePoint = {
  date: string;
  revenueCents: number;
  profitCents: number;
  cashNetCents: number;
};

export type FinanceSummary = {
  revenueTodayCents: number;
  revenueMonthCents: number;
  grossProfitCents: number;
  averageMarginPercent: number;
  averageTicketCents: number;
  salesCount: number;
  cashBalanceCents: number;
  cashInCents: number;
  cashOutCents: number;
  payableOpenCents: number;
  receivableOpenCents: number;
  storePerformancePercent: number;
};

export type FinanceReport = {
  title: string;
  description: string;
  value: string;
  status: 'good' | 'attention' | 'critical';
};

