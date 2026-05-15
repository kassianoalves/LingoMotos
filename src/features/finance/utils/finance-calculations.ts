import type {
  CashFlowRecord,
  DailyPerformancePoint,
  FinanceReport,
  FinanceSummary,
  PayableRecord,
  PaymentMethodSummary,
  ReceivableRecord,
  SaleRecord,
} from '../types/finance.types';

export const paymentLabels = {
  cash: 'Dinheiro',
  pix: 'Pix',
  debit_card: 'Debito',
  credit_card: 'Credito',
  bank_transfer: 'Transferencia',
  other: 'Outro',
};

export function formatCurrency(cents: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
}

export function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

export function calculateGrossProfit(sale: SaleRecord) {
  return sale.totalCents - sale.costCents - sale.feeCents;
}

export function calculateMarginPercent(revenueCents: number, profitCents: number) {
  if (revenueCents <= 0) {
    return 0;
  }

  return (profitCents / revenueCents) * 100;
}

export function buildFinanceSummary(
  filteredSales: SaleRecord[],
  monthSales: SaleRecord[],
  cashFlow: CashFlowRecord[],
  payables: PayableRecord[],
  receivables: ReceivableRecord[],
): FinanceSummary {
  const completedSales = filteredSales.filter((sale) => sale.status === 'completed');
  const revenue = completedSales.reduce((total, sale) => total + sale.totalCents, 0);
  const profit = completedSales.reduce((total, sale) => total + calculateGrossProfit(sale), 0);
  const cashIn = cashFlow
    .filter((item) => item.status === 'confirmed' && item.direction === 'in')
    .reduce((total, item) => total + item.amountCents, 0);
  const cashOut = cashFlow
    .filter((item) => item.status === 'confirmed' && item.direction === 'out')
    .reduce((total, item) => total + item.amountCents, 0);
  const revenueMonthCents = monthSales
    .filter((sale) => sale.status === 'completed')
    .reduce((total, sale) => total + sale.totalCents, 0);

  return {
    revenueTodayCents: revenue,
    revenueMonthCents,
    grossProfitCents: profit,
    averageMarginPercent: calculateMarginPercent(revenue, profit),
    averageTicketCents: completedSales.length > 0 ? Math.round(revenue / completedSales.length) : 0,
    salesCount: completedSales.length,
    cashBalanceCents: cashIn - cashOut,
    cashInCents: cashIn,
    cashOutCents: cashOut,
    payableOpenCents: payables
      .filter((item) => item.status !== 'paid')
      .reduce((total, item) => total + item.amountCents, 0),
    receivableOpenCents: receivables
      .filter((item) => item.status !== 'received')
      .reduce((total, item) => total + item.amountCents, 0),
    storePerformancePercent: revenueMonthCents > 0 ? Math.min((revenue / (revenueMonthCents / 26)) * 100, 999) : 0,
  };
}

export function buildPaymentSummaries(sales: SaleRecord[]): PaymentMethodSummary[] {
  const summaries = new Map<string, PaymentMethodSummary>();

  for (const sale of sales.filter((item) => item.status === 'completed')) {
    const current = summaries.get(sale.paymentMethod) ?? {
      type: sale.paymentMethod,
      label: paymentLabels[sale.paymentMethod],
      amountCents: 0,
      feeCents: 0,
      netCents: 0,
      count: 0,
    };

    current.amountCents += sale.totalCents;
    current.feeCents += sale.feeCents;
    current.netCents += sale.totalCents - sale.feeCents;
    current.count += 1;
    summaries.set(sale.paymentMethod, current);
  }

  return [...summaries.values()].sort((a, b) => b.amountCents - a.amountCents);
}

export function buildDailyPerformance(sales: SaleRecord[], cashFlow: CashFlowRecord[]): DailyPerformancePoint[] {
  const points = new Map<string, DailyPerformancePoint>();

  for (const sale of sales.filter((item) => item.status === 'completed')) {
    const date = sale.soldAt.slice(0, 10);
    const current = points.get(date) ?? { date, revenueCents: 0, profitCents: 0, cashNetCents: 0 };
    current.revenueCents += sale.totalCents;
    current.profitCents += calculateGrossProfit(sale);
    points.set(date, current);
  }

  for (const item of cashFlow.filter((entry) => entry.status === 'confirmed')) {
    const date = item.occurredAt.slice(0, 10);
    const current = points.get(date) ?? { date, revenueCents: 0, profitCents: 0, cashNetCents: 0 };
    current.cashNetCents += item.direction === 'in' ? item.amountCents : -item.amountCents;
    points.set(date, current);
  }

  return [...points.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function buildFinanceReports(summary: FinanceSummary): FinanceReport[] {
  return [
    {
      title: 'Margem media',
      description: 'Mostra quanto sobra da venda depois do custo e taxas.',
      value: formatPercent(summary.averageMarginPercent),
      status: summary.averageMarginPercent >= 25 ? 'good' : summary.averageMarginPercent >= 15 ? 'attention' : 'critical',
    },
    {
      title: 'Caixa disponivel',
      description: 'Entradas confirmadas menos saídas confirmadas no período.',
      value: formatCurrency(summary.cashBalanceCents),
      status: summary.cashBalanceCents >= 0 ? 'good' : 'critical',
    },
    {
      title: 'Contas em aberto',
      description: 'Contas a pagar comparadas com valores a receber.',
      value: `${formatCurrency(summary.payableOpenCents)} a pagar`,
      status: summary.receivableOpenCents >= summary.payableOpenCents ? 'good' : 'attention',
    },
  ];
}
