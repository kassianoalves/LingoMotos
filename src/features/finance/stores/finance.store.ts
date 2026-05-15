import { create } from 'zustand';
import type { FinanceFilters, FinancePeriod } from '../types/finance.types';

type FinanceState = {
  filters: FinanceFilters;
  setPeriod: (period: FinancePeriod) => void;
  setCustomPeriod: (startDate: string, endDate: string) => void;
};

const today = '2026-05-14';

export const defaultFinanceFilters: FinanceFilters = {
  period: 'today',
  startDate: today,
  endDate: today,
};

export const useFinanceStore = create<FinanceState>((set) => ({
  filters: defaultFinanceFilters,
  setPeriod: (period) =>
    set(() => ({
      filters: buildPeriod(period),
    })),
  setCustomPeriod: (startDate, endDate) =>
    set({
      filters: {
        period: 'custom',
        startDate,
        endDate,
      },
    }),
}));

function buildPeriod(period: FinancePeriod): FinanceFilters {
  if (period === 'month') {
    return { period, startDate: '2026-05-01', endDate: today };
  }

  if (period === 'quarter') {
    return { period, startDate: '2026-04-01', endDate: today };
  }

  return defaultFinanceFilters;
}

