import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from '../services/inventory.service';
import type { InventoryFilters, ProductFormValues, ProductImportRequest, StockMovementFormValues } from '../types/inventory.types';

export const inventoryQueryKeys = {
  all: ['inventory'] as const,
  list: (filters: InventoryFilters) => [...inventoryQueryKeys.all, 'list', filters] as const,
};

export function useInventory(filters: InventoryFilters) {
  return useQuery({
    queryKey: inventoryQueryKeys.list(filters),
    queryFn: () => inventoryService.loadInventory(filters),
  });
}

export function useSaveProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ values, productId }: { values: ProductFormValues; productId?: string }) =>
      inventoryService.saveProduct(values, productId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.all });
    },
  });
}

export function useRegisterStockMovement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: StockMovementFormValues) => inventoryService.registerStockMovement(values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.all });
    },
  });
}

export function useImportProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: ProductImportRequest) => inventoryService.importProducts(request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.all });
    },
  });
}
