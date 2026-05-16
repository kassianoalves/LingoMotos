import type { ProductFormValues, StockMovementFormValues } from '../types/inventory.types';

export type ValidationResult = {
  valid: boolean;
  errors: Record<string, string>;
};

export function validateProduct(values: ProductFormValues): ValidationResult {
  const errors: Record<string, string> = {};

  if (!values.name.trim()) errors.name = 'Informe o nome do produto.';
  if (!values.sku.trim()) errors.sku = 'Informe o SKU / Código interno.';
  if (!values.categoryId) errors.categoryId = 'Selecione uma categoria.';
  if (values.costPriceCents < 0) errors.costPriceCents = 'Custo nao pode ser negativo.';
  if (values.salePriceCents < 0) errors.salePriceCents = 'Preco de venda nao pode ser negativo.';
  if (values.minStockQuantity < 0) errors.minStockQuantity = 'Estoque minimo nao pode ser negativo.';
  if (!Number.isInteger(values.minStockQuantity)) errors.minStockQuantity = 'Estoque minimo deve ser inteiro.';
  if (values.currentStockQuantity < 0) errors.currentStockQuantity = 'Estoque atual nao pode ser negativo.';
  if (!Number.isInteger(values.currentStockQuantity)) errors.currentStockQuantity = 'Estoque atual deve ser inteiro.';

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateStockMovement(values: StockMovementFormValues): ValidationResult {
  const errors: Record<string, string> = {};

  if (!values.productId) errors.productId = 'Selecione um produto.';
  if (values.quantity <= 0) errors.quantity = 'Quantidade precisa ser maior que zero.';
  if (!Number.isInteger(values.quantity)) errors.quantity = 'Quantidade deve ser inteira.';
  if (values.unitCostCents < 0) errors.unitCostCents = 'Custo unitario nao pode ser negativo.';
  if (values.unitPriceCents < 0) errors.unitPriceCents = 'Preco unitario nao pode ser negativo.';

  return { valid: Object.keys(errors).length === 0, errors };
}
