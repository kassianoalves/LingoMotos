import { inventoryRepository } from '@features/inventory/repositories/inventory.repository';
import type { Product } from '@features/inventory/types/inventory.types';
import type { CartItem, PaymentLine, PosCheckoutResult, PosProduct } from '../types/pos.types';
import { calculateCartTotals } from '../utils/pos-calculations';
import { validateCheckout } from '../validation/pos.validation';

let saleSequence = 129;

export const posService = {
  async searchProducts(query: string): Promise<PosProduct[]> {
    const products = await inventoryRepository.listProducts({
      search: query,
      categoryId: '',
      supplierId: '',
      stockStatus: 'all',
      sortBy: 'name',
    });

    return products
      .filter((product) => product.status === 'active')
      .slice(0, 24)
      .map(toPosProduct);
  },

  async findProductByBarcodeOrSku(code: string): Promise<PosProduct | null> {
    const normalizedCode = normalize(code);
    const products = await inventoryRepository.listProducts({
      search: code,
      categoryId: '',
      supplierId: '',
      stockStatus: 'all',
      sortBy: 'name',
    });

    const product = products.find(
      (item) => normalize(item.barcode) === normalizedCode || normalize(item.sku) === normalizedCode,
    );

    return product ? toPosProduct(product) : null;
  },

  async checkout(items: CartItem[], payments: PaymentLine[]): Promise<{ ok: true; result: PosCheckoutResult } | { ok: false; errors: string[] }> {
    const totals = calculateCartTotals(items, payments);
    const validation = validateCheckout(items, payments, totals);

    if (!validation.valid) {
      return { ok: false, errors: validation.errors };
    }

    for (const item of items) {
      await inventoryRepository.registerStockMovement({
        productId: item.productId,
        movementType: 'sale',
        direction: 'out',
        quantity: item.quantity,
        unitCostCents: item.unitCostCents,
        notes: `Baixa automatica PDV ${saleSequence}`,
      });
    }

    const result: PosCheckoutResult = {
      saleNumber: String(saleSequence).padStart(6, '0'),
      totalCents: totals.totalCents,
      grossProfitCents: totals.grossProfitCents,
      marginPercent: totals.marginPercent,
      stockMovements: items.length,
    };

    saleSequence += 1;
    return { ok: true, result };
  },
};

function toPosProduct(product: Product): PosProduct {
  return {
    id: product.id,
    sku: product.sku,
    barcode: product.barcode,
    name: product.name,
    categoryName: product.categoryName,
    unit: product.unit,
    costPriceCents: product.costPriceCents,
    salePriceCents: product.salePriceCents,
    currentStockQuantity: product.currentStockQuantity,
    location: product.location,
  };
}

function normalize(value: string | undefined) {
  return (value ?? '').trim().toLocaleLowerCase('pt-BR');
}

