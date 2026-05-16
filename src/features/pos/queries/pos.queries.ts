import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { inventoryQueryKeys } from '@features/inventory/queries/inventory.queries';
import { financeQueryKeys } from '@features/finance/queries/finance.queries';
import { posService } from '../services/pos.service';
import type { CartItem, PaymentLine, SaleDiscountInput } from '../types/pos.types';

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
    mutationFn: ({ items, payments, customerId, saleDiscount }: { items: CartItem[]; payments: PaymentLine[]; customerId?: string; saleDiscount?: SaleDiscountInput }) =>
      posService.checkout(items, payments, customerId, saleDiscount),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.all });
      void queryClient.invalidateQueries({ queryKey: financeQueryKeys.all });
    },
  });
}
