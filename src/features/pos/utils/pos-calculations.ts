import type { CartItem, CartTotals, PaymentLine } from '../types/pos.types';

export const paymentMethodLabels = {
  cash: 'Dinheiro',
  pix: 'Pix',
  debit_card: 'Débito',
  credit_card: 'Crédito',
  store_credit: 'Crediário',
};

export function formatCurrency(cents: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
}

export function calculateCartTotals(items: CartItem[], payments: PaymentLine[]): CartTotals {
  const subtotalCents = items.reduce((total, item) => total + Math.round(item.quantity * item.unitPriceCents), 0);
  const discountCents = items.reduce((total, item) => total + item.discountCents, 0);
  const totalCostCents = items.reduce((total, item) => total + Math.round(item.quantity * item.unitCostCents), 0);
  const totalCents = Math.max(subtotalCents - discountCents, 0);
  const grossProfitCents = totalCents - totalCostCents;
  const paidCents = payments.reduce((total, payment) => total + payment.amountCents, 0);
  const remainingCents = Math.max(totalCents - paidCents, 0);
  const changeCents = Math.max(paidCents - totalCents, 0);

  return {
    subtotalCents,
    discountCents,
    totalCents,
    totalCostCents,
    grossProfitCents,
    marginPercent: totalCents > 0 ? (grossProfitCents / totalCents) * 100 : 0,
    paidCents,
    remainingCents,
    changeCents,
  };
}

export function parseMoneyToCents(value: string) {
  const normalized = value.replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '');
  return Math.round(Number(normalized || 0) * 100);
}
