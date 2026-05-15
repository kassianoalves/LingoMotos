import { financeRepository } from '../repositories/finance.repository';
import type { FinanceFilters } from '../types/finance.types';
import {
  buildDailyPerformance,
  buildFinanceReports,
  buildFinanceSummary,
  buildPaymentSummaries,
} from '../utils/finance-calculations';

export const financeService = {
  async loadDashboard(filters: FinanceFilters) {
    const [sales, monthSales, cashFlow, payables, receivables] = await Promise.all([
      financeRepository.listSales(filters),
      financeRepository.listMonthSales(filters),
      financeRepository.listCashFlow(filters),
      financeRepository.listPayables(),
      financeRepository.listReceivables(),
    ]);

    const summary = buildFinanceSummary(sales, monthSales, cashFlow, payables, receivables);

    return {
      sales,
      cashFlow,
      payables,
      receivables,
      summary,
      payments: buildPaymentSummaries(sales),
      performance: buildDailyPerformance(monthSales, cashFlow),
      reports: buildFinanceReports(summary),
    };
  },
};

