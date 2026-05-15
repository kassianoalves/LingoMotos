import { create } from 'zustand';
import type { Customer } from '../types/customer.types';

const initialCustomers: Customer[] = [
  {
    id: 'cus-001',
    name: 'Marcos Lima',
    phone: '11999991000',
    whatsapp: '11999991000',
    documentNumber: '123.456.789-00',
    email: 'marcos@exemplo.com',
    address: 'Rua das Oficinas, 120',
    notes: 'Cliente compra óleo e filtros com frequência.',
    updatedAt: '2026-05-14',
  },
  {
    id: 'cus-002',
    name: 'Ana Souza',
    phone: '11988882000',
    whatsapp: '11988882000',
    documentNumber: '',
    email: 'ana@exemplo.com',
    address: 'Avenida Central, 45',
    notes: 'Histórico de compras será vinculado futuramente.',
    updatedAt: '2026-05-12',
  },
];

type CustomersState = {
  customers: Customer[];
  selectedCustomer: Customer | null;
  search: string;
  setSearch: (search: string) => void;
  selectCustomer: (customer: Customer | null) => void;
  saveCustomer: (customer: Omit<Customer, 'id' | 'updatedAt'> & { id?: string }) => void;
};

export const useCustomersStore = create<CustomersState>((set) => ({
  customers: initialCustomers,
  selectedCustomer: null,
  search: '',
  setSearch: (search) => set({ search }),
  selectCustomer: (customer) => set({ selectedCustomer: customer }),
  saveCustomer: (customer) =>
    set((state) => {
      const updatedAt = new Date().toISOString().slice(0, 10);

      if (customer.id) {
        const updated = { ...customer, id: customer.id, updatedAt };
        return {
          customers: state.customers.map((item) => (item.id === customer.id ? updated : item)),
          selectedCustomer: updated,
        };
      }

      const created = { ...customer, id: crypto.randomUUID(), updatedAt };
      return {
        customers: [created, ...state.customers],
        selectedCustomer: created,
      };
    }),
}));
