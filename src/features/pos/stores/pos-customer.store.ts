import { create } from 'zustand';
import type { Customer } from '@features/customers/types/customer.types';

type PosCustomerState = {
  selectedCustomer: Customer | null;
  selectCustomer: (customer: Customer | null) => void;
};

export const usePosCustomerStore = create<PosCustomerState>((set) => ({
  selectedCustomer: null,
  selectCustomer: (selectedCustomer) => set({ selectedCustomer }),
}));
