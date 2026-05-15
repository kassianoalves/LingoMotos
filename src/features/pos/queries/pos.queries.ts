import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { inventoryQueryKeys } from '@features/inventory/queries/inventory.queries';
import { posService } from '../services/pos.service';
import type { CartItem, PaymentLine } from '../types/pos.types';

export const posQueryKeys = {
  all: ['pos'] as const,
  search: (query: string) => [...posQueryKeys.all, 'search', query] as const,
};

export function usePosProducts(query: string) {
  return useQuery({
    queryKey: posQueryKeys.search(query),
    queryFn: () => posService.searchProducts(query),
    staleTime: 5_000,
  });
}

export function useCheckoutSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ items, payments }: { items: CartItem[]; payments: PaymentLine[] }) =>
      posService.checkout(items, payments),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.all });
    },
  });
}

