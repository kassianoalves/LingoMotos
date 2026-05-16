import { serviceClient } from '@shared/api/service-client';
import type {
  Category,
  CategoryFormValues,
  InventoryFilters,
  Product,
  ProductFormValues,
  ProductImportReport,
  ProductImportRequest,
  StockMovementFormValues,
  Supplier,
  SupplierFormValues,
} from '../types/inventory.types';
import { getStockStatus, normalizeSearch } from '../utils/inventory-calculations';

export type InventoryRepository = {
  listProducts(filters: InventoryFilters): Promise<Product[]>;
  listCategories(): Promise<Category[]>;
  listSuppliers(): Promise<Supplier[]>;
  createProduct(values: ProductFormValues): Promise<Product>;
  updateProduct(id: string, values: ProductFormValues): Promise<Product>;
  deactivateProduct(id: string): Promise<Product>;
  createCategory(values: CategoryFormValues): Promise<Category>;
  updateCategory(id: string, values: CategoryFormValues): Promise<Category>;
  deactivateCategory(id: string): Promise<void>;
  createSupplier(values: SupplierFormValues): Promise<Supplier>;
  updateSupplier(id: string, values: SupplierFormValues): Promise<Supplier>;
  deactivateSupplier(id: string): Promise<void>;
  registerStockMovement(values: StockMovementFormValues): Promise<Product>;
  listStockMovements(): Promise<import('../types/inventory.types').StockMovement[]>;
  importProducts(request: ProductImportRequest): Promise<ProductImportReport>;
  generateProductSku(input: { categoryId?: string; brand?: string; productName: string; motorcycleApplication?: string }): Promise<string>;
};

export const inventoryRepository: InventoryRepository = {
  async listProducts(filters) {
    const products = await serviceClient.execute<Product[]>('list_products');
    const search = normalizeSearch(filters.search);
    return products
      .filter((product) => product.status === 'active' && !product.deletedAt)
      .filter((product) => {
        if (filters.categoryId && product.categoryId !== filters.categoryId) return false;
        if (filters.supplierId && product.supplierId !== filters.supplierId) return false;
        if (filters.stockStatus !== 'all' && getStockStatus(product) !== filters.stockStatus) return false;
        if (!search) return true;
        return normalizeSearch([
          product.sku,
          product.barcode,
          product.name,
          product.categoryName,
          product.supplierName,
          product.motorcycleApplication,
          product.brand,
          product.location,
        ].filter(Boolean).join(' ')).includes(search);
      });
  },
  listCategories: () => serviceClient.execute<Category[]>('list_product_categories'),
  listSuppliers: () => serviceClient.execute<Supplier[]>('list_suppliers'),
  createProduct: (product) => serviceClient.execute<Product, { product: ProductFormValues }>('create_product', { product }),
  updateProduct: (id, product) => serviceClient.execute<Product, { id: string; product: ProductFormValues }>('update_product', { id, product }),
  async deactivateProduct(id) {
    await serviceClient.execute<void, { id: string }>('deactivate_product', { id });
    return { ...(await serviceClient.execute<Product[]>('list_products')).find((item) => item.id === id)! };
  },
  createCategory: ({ name, description }) => serviceClient.execute<Category, { name: string; description: string }>('create_product_category', { name, description }),
  updateCategory: (id, { name, description }) => serviceClient.execute<Category, { id: string; name: string; description: string }>('update_product_category', { id, name, description }),
  deactivateCategory: (id) => serviceClient.execute<void, { id: string }>('deactivate_product_category', { id }),
  createSupplier: (supplier) => serviceClient.execute<Supplier, { supplier: Supplier }>('create_supplier', {
    supplier: { id: '', ...supplier, createdAt: '', updatedAt: '' },
  }),
  updateSupplier: (id, supplier) => serviceClient.execute<Supplier, { supplier: Supplier }>('update_supplier', {
    supplier: { id, ...supplier, createdAt: '', updatedAt: '' },
  }),
  deactivateSupplier: (id) => serviceClient.execute<void, { id: string }>('deactivate_supplier', { id }),
  async registerStockMovement(values) {
    const command = values.movementType === 'purchase' || values.movementType === 'return' || values.movementType === 'initial_balance'
      ? 'create_stock_entry'
      : 'create_stock_adjustment';
    await serviceClient.execute<void, { movement: StockMovementFormValues }>(command, { movement: values });
    return (await serviceClient.execute<Product[]>('list_products')).find((item) => item.id === values.productId)!;
  },
  listStockMovements: () => serviceClient.execute('list_stock_movements', {}),
  importProducts: (request) => serviceClient.execute<ProductImportReport, { request: ProductImportRequest }>('import_products', { request }),
  generateProductSku: ({ categoryId, brand, productName, motorcycleApplication }) =>
    serviceClient.execute<string, {
      categoryId?: string;
      brand?: string;
      productName: string;
      motorcycleApplication?: string;
    }>('generate_product_sku', { categoryId, brand, productName, motorcycleApplication }),
};
