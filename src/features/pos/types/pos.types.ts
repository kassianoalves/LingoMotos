import type { Product } from '@features/inventory/types/inventory.types';

export type PosPaymentMethod = 'cash' | 'pix' | 'debit_card' | 'credit_card' | 'store_credit';

export type PosProduct = Pick<
  Product,
  | 'id'
  | 'sku'
  | 'barcode'
  | 'name'
  | 'categoryName'
  | 'unit'
  | 'costPriceCents'
  | 'salePriceCents'
  | 'currentStockQuantity'
  | 'location'
>;

export type CartItem = {
  id: string;
  productId: string;
  sku: string;
  barcode?: string;
  name: string;
  unit: string;
  quantity: number;
  unitCostCents: number;
  unitPriceCents: number;
  discountCents: number;
  stockAvailable: number;
};

export type PaymentLine = {
  id: string;
  method: PosPaymentMethod;
  amountCents: number;
};

export type CartTotals = {
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  totalCostCents: number;
  grossProfitCents: number;
  marginPercent: number;
  paidCents: number;
  remainingCents: number;
  changeCents: number;
};

export type PosCheckoutResult = {
  saleNumber: string;
  totalCents: number;
  grossProfitCents: number;
  marginPercent: number;
  stockMovements: number;
};

export type PosValidationResult = {
  valid: boolean;
  errors: string[];
};

