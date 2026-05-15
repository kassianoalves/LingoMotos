import type { InventorySummary, Product, StockStatus } from '../types/inventory.types';

export function formatCurrency(cents: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
}

export function calculateMarginPercent(product: Pick<Product, 'costPriceCents' | 'salePriceCents'>) {
  if (product.salePriceCents <= 0) {
    return 0;
  }

  return ((product.salePriceCents - product.costPriceCents) / product.salePriceCents) * 100;
}

export function calculatePotentialProfitCents(product: Product) {
  return Math.max(product.salePriceCents - product.costPriceCents, 0) * product.currentStockQuantity;
}

export function getStockStatus(product: Product): StockStatus {
  if (product.salePriceCents <= 0) {
    return 'unpriced';
  }

  if (product.costPriceCents <= 0) {
    return 'uncosted';
  }

  if (product.currentStockQuantity <= 0) {
    return 'out_of_stock';
  }

  if (product.currentStockQuantity <= product.minStockQuantity) {
    return 'low_stock';
  }

  return 'available';
}

export function buildInventorySummary(products: Product[]): InventorySummary {
  const activeProducts = products.filter((product) => product.status === 'active');
  const inventoryCostCents = activeProducts.reduce(
    (total, product) => total + product.costPriceCents * product.currentStockQuantity,
    0,
  );
  const inventorySalePotentialCents = activeProducts.reduce(
    (total, product) => total + product.salePriceCents * product.currentStockQuantity,
    0,
  );
  const potentialProfitCents = inventorySalePotentialCents - inventoryCostCents;

  return {
    totalProducts: activeProducts.length,
    lowStockCount: activeProducts.filter((product) => getStockStatus(product) === 'low_stock').length,
    outOfStockCount: activeProducts.filter((product) => getStockStatus(product) === 'out_of_stock').length,
    unpricedCount: activeProducts.filter((product) => getStockStatus(product) === 'unpriced').length,
    uncostedCount: activeProducts.filter((product) => getStockStatus(product) === 'uncosted').length,
    inventoryCostCents,
    inventorySalePotentialCents,
    potentialProfitCents,
    averageMarginPercent:
      inventorySalePotentialCents > 0 ? (potentialProfitCents / inventorySalePotentialCents) * 100 : 0,
  };
}

export function normalizeSearch(value: string) {
  return value
    .trim()
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

