import { create } from 'zustand';
import type { InventoryFilters, Product } from '../types/inventory.types';

type InventoryModal = 'product' | 'movement' | 'import' | null;

type InventoryState = {
  filters: InventoryFilters;
  selectedProduct: Product | null;
  activeModal: InventoryModal;
  setSearch: (search: string) => void;
  setFilter: <TKey extends keyof InventoryFilters>(key: TKey, value: InventoryFilters[TKey]) => void;
  selectProduct: (product: Product | null) => void;
  openModal: (modal: InventoryModal, product?: Product | null) => void;
  closeModal: () => void;
};

export const defaultInventoryFilters: InventoryFilters = {
  search: '',
  categoryId: '',
  supplierId: '',
  stockStatus: 'all',
  sortBy: 'name',
};

export const useInventoryStore = create<InventoryState>((set) => ({
  filters: defaultInventoryFilters,
  selectedProduct: null,
  activeModal: null,
  setSearch: (search) =>
    set((state) => ({
      filters: { ...state.filters, search },
    })),
  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),
  selectProduct: (product) => set({ selectedProduct: product }),
  openModal: (modal, product = undefined) =>
    set((state) => ({
      activeModal: modal,
      selectedProduct: product === undefined ? state.selectedProduct : product,
    })),
  closeModal: () => set({ activeModal: null }),
}));

