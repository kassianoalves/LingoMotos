import { create } from 'zustand';
import type { FinanceFilters, FinancePeriod } from '../types/finance.types';
import { getCurrentMonthRange, getCurrentWeekRange, getCustomRange, getTodayRange } from '@/utils/dateRange';

type FinanceState = {
  filters: FinanceFilters;
  setPeriod: (period: FinancePeriod) => void;
  setCustomPeriod: (startDate: string, endDate: string) => void;
};

export const defaultFinanceFilters: FinanceFilters = {
  period: 'today',
  ...getTodayRange(),
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
        ...clampCustomRange(startDate, endDate),
      },
    }),
}));

function buildPeriod(period: FinancePeriod): FinanceFilters {
  if (period === 'week') {
    return { period, ...getCurrentWeekRange() };
  }

  if (period === 'month') {
    return { period, ...getCurrentMonthRange() };
  }

  return defaultFinanceFilters;
}

function clampCustomRange(startDate: string, endDate: string) {
  const normalized = getCustomRange(startDate, endDate);
  const start = new Date(`${normalized.startDate}T00:00:00`);
  const end = new Date(`${normalized.endDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return normalized;
  }

  const maxEnd = new Date(start);
  maxEnd.setMonth(maxEnd.getMonth() + 2);
  return end > maxEnd
    ? { startDate: normalized.startDate, endDate: maxEnd.toISOString().slice(0, 10) }
    : normalized;
}
