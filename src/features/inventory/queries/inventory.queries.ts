import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from '../services/inventory.service';
import type {
  CategoryFormValues,
  InventoryFilters,
  ProductFormValues,
  ProductImportRequest,
  StockMovementFormValues,
  SupplierFormValues,
} from '../types/inventory.types';

export const inventoryQueryKeys = {
  all: ['inventory'] as const,
  list: (filters: InventoryFilters) => [...inventoryQueryKeys.all, 'list', filters] as const,
  movements: ['inventory', 'movements'] as const,
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

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: CategoryFormValues) => inventoryService.createCategory(values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.all });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: CategoryFormValues }) => inventoryService.updateCategory(id, values),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.all }),
  });
}

export function useDeactivateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inventoryService.deactivateCategory(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.all }),
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: SupplierFormValues) => inventoryService.createSupplier(values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.all });
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: SupplierFormValues }) => inventoryService.updateSupplier(id, values),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.all }),
  });
}

export function useDeactivateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inventoryService.deactivateSupplier(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.all }),
  });
}

export function useStockMovements() {
  return useQuery({
    queryKey: inventoryQueryKeys.movements,
    queryFn: () => inventoryService.listStockMovements(),
  });
}

export function useRemoveProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) => inventoryService.removeProduct(productId),
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
