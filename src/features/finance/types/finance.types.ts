export type FinancePeriod = 'today' | 'week' | 'month' | 'custom';

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
  source?: 'sale' | 'manual_revenue' | 'manual_expense' | 'adjustment';
};

export type PayableRecord = {
  id: string;
  description: string;
  categoryType: string;
  dueDate: string;
  amountCents: number;
  companyOrSupplier: string;
  recurrenceType: 'unique' | 'monthly';
  status: 'open' | 'paid' | 'overdue';
  paidAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ReceivableRecord = {
  id: string;
  description: string;
  customer: string;
  dueDate: string;
  amountCents: number;
  recurrenceType: 'unique' | 'monthly';
  status: 'open' | 'received' | 'overdue';
  receivedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
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

export type TopSellingCategory = {
  categoryId: string | null;
  categoryName: string;
  quantitySold: number;
  revenueTotalCents: number;
  grossProfitCents: number;
  percentage: number;
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
  expensesTotalCents?: number;
  estimatedNetProfitCents?: number;
  costOfGoodsSoldCents?: number;
};

export type FinanceReport = {
  title: string;
  description: string;
  value: string;
  status: 'good' | 'attention' | 'critical';
};

export type FinancialGoal = {
  id: string;
  name: string;
  type: 'weekly' | 'monthly';
  targetAmountCents: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};
