import { inventoryCategories, inventoryProducts, inventorySuppliers } from '../data/inventory.seed';
import type {
  Category,
  InventoryFilters,
  Product,
  ProductFormValues,
  ProductImportReport,
  ProductImportRequest,
  StockMovementFormValues,
  Supplier,
} from '../types/inventory.types';
import { getStockStatus, normalizeSearch } from '../utils/inventory-calculations';

let products = [...inventoryProducts];

export type InventoryRepository = {
  listProducts(filters: InventoryFilters): Promise<Product[]>;
  listCategories(): Promise<Category[]>;
  listSuppliers(): Promise<Supplier[]>;
  createProduct(values: ProductFormValues): Promise<Product>;
  updateProduct(id: string, values: ProductFormValues): Promise<Product>;
  registerStockMovement(values: StockMovementFormValues): Promise<Product>;
  importProducts(request: ProductImportRequest): Promise<ProductImportReport>;
};

export const inventoryRepository: InventoryRepository = {
  async listProducts(filters) {
    const search = normalizeSearch(filters.search);

    return products
      .filter((product) => {
        if (filters.categoryId && product.categoryId !== filters.categoryId) {
          return false;
        }

        if (filters.supplierId && product.supplierId !== filters.supplierId) {
          return false;
        }

        if (filters.stockStatus !== 'all' && getStockStatus(product) !== filters.stockStatus) {
          return false;
        }

        if (!search) {
          return true;
        }

        const searchable = normalizeSearch(
          [product.sku, product.barcode, product.name, product.categoryName, product.supplierName, product.location]
            .filter(Boolean)
            .join(' '),
        );

        return searchable.includes(search);
      })
      .sort((a, b) => sortProducts(a, b, filters.sortBy));
  },

  async listCategories() {
    return inventoryCategories.filter((category) => category.isActive);
  },

  async listSuppliers() {
    return inventorySuppliers.filter((supplier) => supplier.isActive);
  },

  async createProduct(values) {
    const now = new Date().toISOString();
    const category = inventoryCategories.find((item) => item.id === values.categoryId);
    const supplier = inventorySuppliers.find((item) => item.id === values.supplierId);
    const product: Product = {
      id: crypto.randomUUID(),
      sku: values.sku,
      barcode: values.barcode || undefined,
      name: values.name,
      categoryId: values.categoryId,
      categoryName: category?.name ?? 'Sem categoria',
      supplierId: values.supplierId || undefined,
      supplierName: supplier?.name,
      location: values.location || undefined,
      unit: values.unit,
      costPriceCents: values.costPriceCents,
      salePriceCents: values.salePriceCents,
      minStockQuantity: values.minStockQuantity,
      currentStockQuantity: values.currentStockQuantity,
      soldLast30Days: 0,
      lastMovementAt: now,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    products = [product, ...products];
    return product;
  },

  async updateProduct(id, values) {
    const category = inventoryCategories.find((item) => item.id === values.categoryId);
    const supplier = inventorySuppliers.find((item) => item.id === values.supplierId);
    const now = new Date().toISOString();
    let updatedProduct: Product | undefined;

    products = products.map((product) => {
      if (product.id !== id) {
        return product;
      }

      updatedProduct = {
        ...product,
        sku: values.sku,
        barcode: values.barcode || undefined,
        name: values.name,
        categoryId: values.categoryId,
        categoryName: category?.name ?? product.categoryName,
        supplierId: values.supplierId || undefined,
        supplierName: supplier?.name,
        location: values.location || undefined,
        unit: values.unit,
        costPriceCents: values.costPriceCents,
        salePriceCents: values.salePriceCents,
        minStockQuantity: values.minStockQuantity,
        currentStockQuantity: values.currentStockQuantity,
        updatedAt: now,
      };

      return updatedProduct;
    });

    if (!updatedProduct) {
      throw new Error('Produto nao encontrado.');
    }

    return updatedProduct;
  },

  async registerStockMovement(values) {
    const now = new Date().toISOString();
    let updatedProduct: Product | undefined;

    products = products.map((product) => {
      if (product.id !== values.productId) {
        return product;
      }

      const signedQuantity = values.direction === 'in' ? values.quantity : -values.quantity;
      updatedProduct = {
        ...product,
        currentStockQuantity: Math.max(product.currentStockQuantity + signedQuantity, 0),
        costPriceCents: values.direction === 'in' && values.unitCostCents > 0 ? values.unitCostCents : product.costPriceCents,
        lastMovementAt: now,
        updatedAt: now,
      };

      return updatedProduct;
    });

    if (!updatedProduct) {
      throw new Error('Produto nao encontrado.');
    }

    return updatedProduct;
  },

  async importProducts(request) {
    const snapshot = [...products];
    const batchId = crypto.randomUUID();
    let imported = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;
    const errors: ProductImportReport['errors'] = [];

    try {
      for (const draft of request.source.drafts) {
        if (draft.action === 'skip') {
          skipped += 1;
          continue;
        }

        if (draft.errors.length > 0 || draft.action === 'error') {
          failed += 1;
          errors.push({ rowNumber: draft.rowNumber, message: draft.errors.join(' ') });

          if (!request.options.allowPartialImport) {
            throw new Error(`Linha ${draft.rowNumber}: ${draft.errors.join(' ')}`);
          }

          continue;
        }

        if (draft.action === 'update' && draft.duplicateProductId) {
          await this.updateProduct(draft.duplicateProductId, draft.values);
          updated += 1;
          continue;
        }

        if (draft.action === 'create') {
          await this.createProduct(draft.values);
          imported += 1;
          continue;
        }

        skipped += 1;
      }

      return {
        batchId,
        imported,
        updated,
        skipped,
        failed,
        rolledBack: false,
        errors,
      };
    } catch (error) {
      if (request.options.rollbackOnError) {
        products = snapshot;
      }

      return {
        batchId,
        imported: request.options.rollbackOnError ? 0 : imported,
        updated: request.options.rollbackOnError ? 0 : updated,
        skipped,
        failed: failed + 1,
        rolledBack: request.options.rollbackOnError,
        errors: [
          ...errors,
          {
            rowNumber: 0,
            message: error instanceof Error ? error.message : 'Erro inesperado na importacao.',
          },
        ],
      };
    }
  },
};

function sortProducts(a: Product, b: Product, sortBy: InventoryFilters['sortBy']) {
  if (sortBy === 'sku') {
    return a.sku.localeCompare(b.sku);
  }

  if (sortBy === 'stock') {
    return a.currentStockQuantity - b.currentStockQuantity;
  }

  if (sortBy === 'margin') {
    return b.salePriceCents - b.costPriceCents - (a.salePriceCents - a.costPriceCents);
  }

  if (sortBy === 'sold') {
    return b.soldLast30Days - a.soldLast30Days;
  }

  if (sortBy === 'lastMovement') {
    return new Date(b.lastMovementAt ?? 0).getTime() - new Date(a.lastMovementAt ?? 0).getTime();
  }

  return a.name.localeCompare(b.name);
}
