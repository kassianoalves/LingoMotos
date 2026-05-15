export type ProductStatus = 'active' | 'inactive';

export type StockStatus = 'available' | 'low_stock' | 'out_of_stock' | 'unpriced' | 'uncosted';

export type StockMovementType =
  | 'purchase'
  | 'sale'
  | 'return'
  | 'adjustment_in'
  | 'adjustment_out'
  | 'loss'
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
  location?: string;
  unit: string;
  costPriceCents: number;
  salePriceCents: number;
  minStockQuantity: number;
  currentStockQuantity: number;
  soldLast30Days: number;
  lastMovementAt?: string;
  status: ProductStatus;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type Category = {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  isActive: boolean;
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
};

export type StockMovement = {
  id: string;
  productId: string;
  movementType: StockMovementType;
  direction: StockMovementDirection;
  quantity: number;
  unitCostCents: number;
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
  location: string;
  unit: string;
  costPriceCents: number;
  salePriceCents: number;
  minStockQuantity: number;
  currentStockQuantity: number;
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
  unitCostCents: number;
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
  | 'costPrice'
  | 'salePrice'
  | 'currentStock'
  | 'minStock'
  | 'location'
  | 'unit';

export type ImportColumnMapping = Record<string, ImportColumnKey>;

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
  values: ProductFormValues;
  action: 'create' | 'update' | 'skip' | 'error';
  duplicateProductId?: string;
  errors: string[];
  warnings: string[];
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
  rolledBack: boolean;
  errors: Array<{ rowNumber: number; message: string }>;
};
