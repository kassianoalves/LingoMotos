import { useQuery } from '@tanstack/react-query';
import { financeService } from '../services/finance.service';
import type { FinanceFilters } from '../types/finance.types';

export const financeQueryKeys = {
  all: ['finance'] as const,
  dashboard: (filters: FinanceFilters) => [...financeQueryKeys.all, 'dashboard', filters] as const,
};

export function useFinanceDashboard(filters: FinanceFilters) {
  return useQuery({
    queryKey: financeQueryKeys.dashboard(filters),
    queryFn: () => financeService.loadDashboard(filters),
  });
}

