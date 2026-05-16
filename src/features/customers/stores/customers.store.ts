import { create } from 'zustand';
import { customersService } from '../services/customers.service';
import type { Customer, CustomerInput } from '../types/customer.types';

type CustomersState = {
  customers: Customer[];
  selectedCustomer: Customer | null;
  search: string;
  loaded: boolean;
  loadCustomers: () => Promise<void>;
  setSearch: (search: string) => void;
  selectCustomer: (customer: Customer | null) => void;
  saveCustomer: (customer: CustomerInput) => Promise<Customer>;
  deleteCustomer: (id: string) => Promise<void>;
};

export const useCustomersStore = create<CustomersState>((set) => ({
  customers: [],
  selectedCustomer: null,
  search: '',
  loaded: false,
  loadCustomers: async () => {
    const customers = await customersService.list();
    set({ customers, loaded: true });
  },
  setSearch: (search) => set({ search }),
  selectCustomer: (customer) => set({ selectedCustomer: customer }),
  saveCustomer: async (customer) => {
    const saved = await customersService.save(customer);
    set((state) => ({
      customers: [saved, ...state.customers.filter((item) => item.id !== saved.id)].sort((a, b) => a.name.localeCompare(b.name)),
      selectedCustomer: saved,
    }));
    return saved;
  },
  deleteCustomer: async (id) => {
    await customersService.remove(id);
    set((state) => ({
      customers: state.customers.filter((item) => item.id !== id),
      selectedCustomer: state.selectedCustomer?.id === id ? null : state.selectedCustomer,
    }));
  },
}));
