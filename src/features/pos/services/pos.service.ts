import { inventoryRepository } from '@features/inventory/repositories/inventory.repository';
import type { Product } from '@features/inventory/types/inventory.types';
import { serviceClient } from '@shared/api/service-client';
import type { CartItem, PaymentLine, PosCheckoutResult, PosProduct, SaleDiscountInput } from '../types/pos.types';
import { calculateCartTotals } from '../utils/pos-calculations';
import { validateCheckout } from '../validation/pos.validation';

export const posService = {
  async searchProducts(query: string): Promise<PosProduct[]> {
    const products = await inventoryRepository.listProducts({
      search: query,
      categoryId: '',
      supplierId: '',
      stockStatus: 'all',
      sortBy: 'name',
    });
    return products.filter((product) => product.status === 'active').slice(0, 24).map(toPosProduct);
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
    const product = products.find((item) => normalize(item.barcode) === normalizedCode || normalize(item.sku) === normalizedCode);
    return product ? toPosProduct(product) : null;
  },

  async checkout(
    items: CartItem[],
    payments: PaymentLine[],
    customerId?: string,
    saleDiscount?: SaleDiscountInput,
  ): Promise<{ ok: true; result: PosCheckoutResult } | { ok: false; errors: string[] }> {
    const totals = calculateCartTotals(items, payments, saleDiscount);
    const validation = validateCheckout(items, payments, totals);
    if (!validation.valid) return { ok: false, errors: validation.errors };
    try {
      const result = await serviceClient.execute<PosCheckoutResult, {
        sale: {
          customerId?: string;
          discountType?: 'value' | 'percentage';
          discountAmount?: number;
          items: Array<{ productId: string; quantity: number; unitCostCents: number; unitPriceCents: number; discountCents: number }>;
          payments: Array<{ method: string; amountCents: number }>;
        };
      }>('create_sale', {
        sale: {
          customerId,
          discountType: saleDiscount?.type,
          discountAmount: saleDiscount
            ? saleDiscount.type === 'value'
              ? saleDiscount.amountCents / 100
              : saleDiscount.percentage
            : undefined,
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitCostCents: item.unitCostCents,
            unitPriceCents: item.unitPriceCents,
            discountCents: item.discountCents,
          })),
          payments: payments.map((payment) => ({ method: payment.method, amountCents: payment.amountCents })),
        },
      });
      return { ok: true, result };
    } catch (error) {
      return { ok: false, errors: [error instanceof Error ? error.message : 'Falha ao finalizar venda.'] };
    }
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
    supplierName: product.supplierName,
    motorcycleApplication: product.motorcycleApplication,
  };
}

function normalize(value: string | undefined) {
  return (value ?? '').trim().toLocaleLowerCase('pt-BR');
}
