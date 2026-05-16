import { financeRepository } from '../repositories/finance.repository';
import type { FinanceFilters } from '../types/finance.types';
import {
  buildFinanceReports,
  buildFinanceSummary,
  buildPaymentSummaries,
} from '../utils/finance-calculations';

export const financeService = {
  async loadDashboard(filters: FinanceFilters) {
    const monthFilters = {
      ...filters,
      startDate: `${filters.startDate.slice(0, 7)}-01`,
    };
    const [sales, monthSales, cashFlow, payables, receivables, persistedSummary, topSellingCategories] = await Promise.all([
      financeRepository.listSales(filters),
      financeRepository.listMonthSales(monthFilters),
      financeRepository.listCashFlow(filters),
      financeRepository.listPayables(),
      financeRepository.listReceivables(),
      financeRepository.getSummary(filters),
      financeRepository.getTopSellingCategories(filters),
    ]);

    const summary = {
      ...buildFinanceSummary(sales, monthSales, cashFlow, payables, receivables),
      revenueTodayCents: persistedSummary.revenueTodayCents,
      revenueMonthCents: persistedSummary.revenueMonthCents,
      grossProfitCents: persistedSummary.grossProfitCents,
      averageMarginPercent: persistedSummary.averageMarginPercent,
      averageTicketCents: persistedSummary.averageTicketCents,
      salesCount: persistedSummary.salesCount,
      cashBalanceCents: persistedSummary.cashTotalCents,
      expensesTotalCents: persistedSummary.expensesTotalCents,
      estimatedNetProfitCents: persistedSummary.estimatedNetProfitCents,
      costOfGoodsSoldCents: persistedSummary.costOfGoodsSoldCents,
    };

    return {
      sales,
      cashFlow,
      payables,
      receivables,
      summary,
      payments: buildPaymentSummaries(sales),
      topSellingCategories,
      reports: buildFinanceReports(summary),
    };
  },
};
