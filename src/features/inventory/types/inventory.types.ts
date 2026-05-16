export type ProductStatus = 'active' | 'inactive';

export type StockStatus = 'available' | 'low_stock' | 'out_of_stock' | 'unpriced' | 'uncosted';

export type StockMovementType =
  | 'purchase'
  | 'sale'
  | 'return'
  | 'adjustment'
  | 'loss'
  | 'internal_use'
  | 'initial_balance';

export type StockMovementDirection = 'in' | 'out';

export type Product = {
  id: string;
  sku: string;
  barcode?: string;
  name: string;
  categoryId: string;
  categoryName: string;
  supplierId?: string;
  supplierName?: string;
  brand?: string;
  motorcycleApplication?: string;
  location?: string;
  notes?: string;
  unit: string;
  costPriceCents: number;
  salePriceCents: number;
  marginPercent?: number;
  minStockQuantity: number;
  currentStockQuantity: number;
  soldLast30Days: number;
  lastMovementAt?: string;
  status: ProductStatus;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  customFields: ProductCustomField[];
};

export type ProductCustomFieldType = 'text' | 'number' | 'currency' | 'date' | 'boolean';

export type ProductCustomField = {
  id: string;
  productId: string;
  fieldKey: string;
  fieldLabel: string;
  fieldType: ProductCustomFieldType;
  fieldValue: string;
  createdAt: string;
  updatedAt: string;
};

export type ProductCustomFieldInput = Pick<ProductCustomField, 'fieldKey' | 'fieldLabel' | 'fieldType' | 'fieldValue'>;

export type Category = {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type Supplier = {
  id: string;
  name: string;
  documentNumber?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  notes?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type StockMovement = {
  id: string;
  productId: string;
  movementType: StockMovementType;
  direction: StockMovementDirection;
  quantity: number;
  reason?: string;
  referenceId?: string;
  unitCostCents: number;
  unitPriceCents: number;
  notes?: string;
  occurredAt: string;
};

export type InventoryFilters = {
  search: string;
  categoryId: string;
  supplierId: string;
  stockStatus: 'all' | StockStatus;
  sortBy: 'name' | 'sku' | 'stock' | 'margin' | 'sold' | 'lastMovement';
};

export type ProductFormValues = {
  sku: string;
  barcode: string;
  name: string;
  categoryId: string;
  supplierId: string;
  brand: string;
  motorcycleApplication: string;
  location: string;
  notes: string;
  unit: string;
  costPriceCents: number;
  salePriceCents: number;
  minStockQuantity: number;
  currentStockQuantity: number;
  customFields: ProductCustomFieldInput[];
};

export type CategoryFormValues = {
  name: string;
  description: string;
  isActive: boolean;
};

export type SupplierFormValues = {
  name: string;
  phone: string;
  whatsapp: string;
  documentNumber: string;
  email: string;
  address: string;
  notes: string;
  isActive: boolean;
};

export type StockMovementFormValues = {
  productId: string;
  movementType: StockMovementType;
  direction: StockMovementDirection;
  quantity: number;
  reason: string;
  referenceId: string;
  unitCostCents: number;
  unitPriceCents: number;
  notes: string;
};

export type InventorySummary = {
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  unpricedCount: number;
  uncostedCount: number;
  inventoryCostCents: number;
  inventorySalePotentialCents: number;
  potentialProfitCents: number;
  averageMarginPercent: number;
};

export type InventoryAlert = {
  id: string;
  severity: 'info' | 'warning' | 'destructive';
  title: string;
  detail: string;
  actionLabel: string;
  filter: InventoryFilters['stockStatus'];
};

export type ImportColumnKey =
  | 'ignore'
  | 'sku'
  | 'barcode'
  | 'name'
  | 'category'
  | 'supplier'
  | 'brand'
  | 'motorcycleApplication'
  | 'costPrice'
  | 'salePrice'
  | 'currentStock'
  | 'minStock'
  | 'location'
  | 'notes'
  | 'unit';

export type ImportColumnTarget =
  | { kind: 'known'; field: ImportColumnKey }
  | { kind: 'custom'; fieldKey: string; fieldLabel: string; fieldType: ProductCustomFieldType };

export type ImportColumnMapping = Record<string, ImportColumnTarget>;

export type ImportSourceData = {
  fileName: string;
  sheetName?: string;
  headers: string[];
  rows: Array<Record<string, string>>;
};

export type ImportDuplicateStrategy = 'skip' | 'update_prices' | 'update_all';

export type ProductImportOptions = {
  duplicateStrategy: ImportDuplicateStrategy;
  allowPartialImport: boolean;
  rollbackOnError: boolean;
};

export type ProductImportDraft = {
  rowNumber: number;
  raw: Record<string, string>;
  values: ProductFormValues & {
    categoryName: string;
    supplierName: string;
  };
  action: 'create' | 'update' | 'skip' | 'error';
  duplicateProductId?: string;
  errors: string[];
  warnings: string[];
  skuGeneratedAutomatically: boolean;
};

export type ProductImportPreview = {
  fileName: string;
  totalRows: number;
  validRows: number;
  createCount: number;
  updateCount: number;
  skipCount: number;
  errorCount: number;
  drafts: ProductImportDraft[];
};

export type ProductImportRequest = {
  batchName: string;
  source: ProductImportPreview;
  options: ProductImportOptions;
};

export type ProductImportReport = {
  batchId: string;
  imported: number;
  updated: number;
  skipped: number;
  failed: number;
  customFieldsSaved: number;
  rolledBack: boolean;
  errors: Array<{ rowNumber: number; message: string }>;
};
