import { create } from 'zustand';
import type { CartItem, PaymentLine, PosPaymentMethod, PosProduct } from '../types/pos.types';
import { calculateCartTotals } from '../utils/pos-calculations';

type PosState = {
  search: string;
  items: CartItem[];
  payments: PaymentLine[];
  selectedIndex: number;
  lastError: string;
  setSearch: (search: string) => void;
  setSelectedIndex: (index: number) => void;
  addProduct: (product: PosProduct) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateDiscount: (itemId: string, discountCents: number) => void;
  addPayment: (method: PosPaymentMethod, amountCents: number, options?: { installments?: number; interestRatePercent?: number; baseAmountCents?: number }) => void;
  removePayment: (paymentId: string) => void;
  fillRemainingPayment: (method: PosPaymentMethod) => void;
  clearSale: () => void;
  setLastError: (message: string) => void;
};

export const usePosStore = create<PosState>((set, get) => ({
  search: '',
  items: [],
  payments: [],
  selectedIndex: 0,
  lastError: '',
  setSearch: (search) => set({ search, selectedIndex: 0 }),
  setSelectedIndex: (index) => set({ selectedIndex: index }),
  addProduct: (product) =>
    set((state) => {
      const existing = state.items.find((item) => item.productId === product.id);

      if (existing) {
        return {
          search: '',
          items: state.items.map((item) =>
            item.id === existing.id
              ? { ...item, quantity: Math.min(item.quantity + 1, item.stockAvailable) }
              : item,
          ),
        };
      }

      const item: CartItem = {
        id: crypto.randomUUID(),
        productId: product.id,
        sku: product.sku,
        barcode: product.barcode,
        name: product.name,
        unit: product.unit,
        quantity: 1,
        unitCostCents: product.costPriceCents,
        unitPriceCents: product.salePriceCents,
        discountCents: 0,
        stockAvailable: product.currentStockQuantity,
      };

      return {
        search: '',
        items: [item, ...state.items],
      };
    }),
  removeItem: (itemId) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== itemId),
    })),
  updateQuantity: (itemId, quantity) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === itemId ? { ...item, quantity: Math.max(Math.min(quantity, item.stockAvailable), 0) } : item,
      ),
    })),
  updateDiscount: (itemId, discountCents) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === itemId ? { ...item, discountCents: Math.max(discountCents, 0) } : item,
      ),
    })),
  addPayment: (method, amountCents, options) =>
    set((state) => ({
      payments: [
        ...state.payments,
        {
          id: crypto.randomUUID(),
          method,
          amountCents,
          installments: options?.installments,
          interestRatePercent: options?.interestRatePercent,
          baseAmountCents: options?.baseAmountCents,
        },
      ],
    })),
  removePayment: (paymentId) =>
    set((state) => ({
      payments: state.payments.filter((payment) => payment.id !== paymentId),
    })),
  fillRemainingPayment: (method) => {
    const totals = calculateCartTotals(get().items, get().payments);

    if (totals.remainingCents <= 0) {
      return;
    }

    get().addPayment(method, totals.remainingCents);
  },
  clearSale: () => set({ search: '', items: [], payments: [], selectedIndex: 0, lastError: '' }),
  setLastError: (message) => set({ lastError: message }),
}));

