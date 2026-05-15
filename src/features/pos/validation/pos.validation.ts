import type { CartItem, CartTotals, PaymentLine, PosValidationResult } from '../types/pos.types';

export function validateCheckout(items: CartItem[], payments: PaymentLine[], totals: CartTotals): PosValidationResult {
  const errors: string[] = [];

  if (items.length === 0) {
    errors.push('Adicione pelo menos um produto.');
  }

  for (const item of items) {
    if (item.quantity <= 0) {
      errors.push(`${item.name}: quantidade invalida.`);
    }

    if (item.quantity > item.stockAvailable) {
      errors.push(`${item.name}: estoque insuficiente.`);
    }

    if (item.unitPriceCents <= 0) {
      errors.push(`${item.name}: produto sem preco de venda.`);
    }
  }

  if (payments.length === 0) {
    errors.push('Informe uma forma de pagamento.');
  }

  if (totals.paidCents < totals.totalCents) {
    errors.push('Pagamento menor que o total da venda.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

