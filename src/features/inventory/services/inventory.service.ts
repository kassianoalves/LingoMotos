import { inventoryRepository } from '../repositories/inventory.repository';
import type {
  InventoryAlert,
  ImportColumnMapping,
  ImportSourceData,
  InventoryFilters,
  Product,
  ProductFormValues,
  ProductImportDraft,
  ProductImportOptions,
  ProductImportPreview,
  ProductImportRequest,
  StockMovementFormValues,
} from '../types/inventory.types';
import { buildInventorySummary } from '../utils/inventory-calculations';
import { validateProduct, validateStockMovement } from '../validation/product.validation';

export const inventoryService = {
  async loadInventory(filters: InventoryFilters) {
    const [products, categories, suppliers] = await Promise.all([
      inventoryRepository.listProducts(filters),
      inventoryRepository.listCategories(),
      inventoryRepository.listSuppliers(),
    ]);

    const summary = buildInventorySummary(products);

    return {
      products,
      categories,
      suppliers,
      summary,
      alerts: buildAlerts(summary),
    };
  },

  async saveProduct(values: ProductFormValues, productId?: string) {
    const validation = validateProduct(values);

    if (!validation.valid) {
      return { ok: false as const, errors: validation.errors };
    }

    const product = productId
      ? await inventoryRepository.updateProduct(productId, values)
      : await inventoryRepository.createProduct(values);

    return { ok: true as const, product };
  },

  async registerStockMovement(values: StockMovementFormValues) {
    const validation = validateStockMovement(values);

    if (!validation.valid) {
      return { ok: false as const, errors: validation.errors };
    }

    const product = await inventoryRepository.registerStockMovement(values);
    return { ok: true as const, product };
  },

  async buildImportPreview(source: ImportSourceData, mapping: ImportColumnMapping, options: ProductImportOptions) {
    const [products, categories, suppliers] = await Promise.all([
      inventoryRepository.listProducts({
        search: '',
        categoryId: '',
        supplierId: '',
        stockStatus: 'all',
        sortBy: 'name',
      }),
      inventoryRepository.listCategories(),
      inventoryRepository.listSuppliers(),
    ]);

    const existingBySku = new Map(products.map((product) => [normalize(product.sku), product]));
    const existingByBarcode = new Map(
      products.filter((product) => product.barcode).map((product) => [normalize(product.barcode ?? ''), product]),
    );
    const seenInFile = new Set<string>();

    const drafts = source.rows.map((row, index) => {
      const mappedValues = mapRowToProduct(row, mapping, categories, suppliers);
      const errors: string[] = [];
      const warnings: string[] = [];
      const rowNumber = index + 2;
      const fileKey = normalize(mappedValues.sku || mappedValues.barcode);
      const duplicateProduct = existingBySku.get(normalize(mappedValues.sku)) || existingByBarcode.get(normalize(mappedValues.barcode));
      const values =
        duplicateProduct && options.duplicateStrategy === 'update_prices'
          ? mergePriceUpdate(duplicateProduct, mappedValues)
          : mappedValues;

      if (!values.sku) {
        errors.push('SKU obrigatorio.');
      }

      if (!values.name) {
        errors.push('Nome obrigatorio.');
      }

      if (!values.categoryId) {
        warnings.push('Categoria nao encontrada, sera usada categoria padrao se existir.');
      }

      if (values.salePriceCents <= 0) {
        warnings.push('Produto sem preco de venda.');
      }

      if (values.costPriceCents <= 0) {
        warnings.push('Produto sem custo.');
      }

      if (fileKey && seenInFile.has(fileKey)) {
        errors.push('Duplicado dentro do arquivo.');
      }

      if (fileKey) {
        seenInFile.add(fileKey);
      }

      const action: ProductImportDraft['action'] =
        errors.length > 0
          ? 'error'
          : duplicateProduct && options.duplicateStrategy === 'skip'
            ? 'skip'
            : duplicateProduct
              ? 'update'
              : 'create';

      return {
        rowNumber,
        raw: row,
        values,
        action,
        duplicateProductId: duplicateProduct?.id,
        errors,
        warnings: duplicateProduct ? ['Produto ja existe no cadastro.', ...warnings] : warnings,
      };
    });

    return {
      fileName: source.fileName,
      totalRows: drafts.length,
      validRows: drafts.filter((draft) => draft.errors.length === 0).length,
      createCount: drafts.filter((draft) => draft.action === 'create').length,
      updateCount: drafts.filter((draft) => draft.action === 'update').length,
      skipCount: drafts.filter((draft) => draft.action === 'skip').length,
      errorCount: drafts.filter((draft) => draft.action === 'error').length,
      drafts,
    } satisfies ProductImportPreview;
  },

  importProducts(request: ProductImportRequest) {
    return inventoryRepository.importProducts(request);
  },
};

function mapRowToProduct(
  row: Record<string, string>,
  mapping: ImportColumnMapping,
  categories: Awaited<ReturnType<typeof inventoryRepository.listCategories>>,
  suppliers: Awaited<ReturnType<typeof inventoryRepository.listSuppliers>>,
): ProductFormValues {
  const mapped = Object.entries(mapping).reduce<Record<string, string>>((result, [header, target]) => {
    if (target !== 'ignore') {
      result[target] = row[header] ?? '';
    }
    return result;
  }, {});

  const category = categories.find((item) => normalize(item.id) === normalize(mapped.category) || normalize(item.name) === normalize(mapped.category));
  const supplier = suppliers.find((item) => normalize(item.id) === normalize(mapped.supplier) || normalize(item.name) === normalize(mapped.supplier));

  return {
    sku: mapped.sku?.trim() ?? '',
    barcode: mapped.barcode?.trim() ?? '',
    name: mapped.name?.trim() ?? '',
    categoryId: category?.id ?? categories[0]?.id ?? '',
    supplierId: supplier?.id ?? '',
    location: mapped.location?.trim() ?? '',
    unit: mapped.unit?.trim() || 'un',
    costPriceCents: parseMoneyToCents(mapped.costPrice),
    salePriceCents: parseMoneyToCents(mapped.salePrice),
    currentStockQuantity: parseNumber(mapped.currentStock),
    minStockQuantity: parseNumber(mapped.minStock),
  };
}

function mergePriceUpdate(product: Product, imported: ProductFormValues): ProductFormValues {
  return {
    sku: product.sku,
    barcode: product.barcode ?? imported.barcode,
    name: product.name,
    categoryId: product.categoryId,
    supplierId: product.supplierId ?? imported.supplierId,
    location: product.location ?? imported.location,
    unit: product.unit,
    costPriceCents: imported.costPriceCents || product.costPriceCents,
    salePriceCents: imported.salePriceCents || product.salePriceCents,
    minStockQuantity: product.minStockQuantity,
    currentStockQuantity: product.currentStockQuantity,
  };
}

function buildAlerts(summary: ReturnType<typeof buildInventorySummary>): InventoryAlert[] {
  const alerts: InventoryAlert[] = [
    {
      id: 'low-stock',
      severity: 'warning',
      title: `${summary.lowStockCount} produtos abaixo do minimo`,
      detail: 'Priorize reposicao dos itens com maior giro nos ultimos 30 dias.',
      actionLabel: 'Ver baixo estoque',
      filter: 'low_stock',
    },
    {
      id: 'out-of-stock',
      severity: 'destructive',
      title: `${summary.outOfStockCount} produtos zerados`,
      detail: 'Itens zerados travam venda no balcao e devem ser repostos ou inativados.',
      actionLabel: 'Ver zerados',
      filter: 'out_of_stock',
    },
    {
      id: 'pricing',
      severity: 'info',
      title: `${summary.unpricedCount + summary.uncostedCount} produtos sem preco ou custo`,
      detail: 'Cadastre custo e venda para relatorios de margem confiaveis.',
      actionLabel: 'Corrigir cadastro',
      filter: summary.unpricedCount > 0 ? 'unpriced' : 'uncosted',
    },
  ];

  return alerts.filter((alert) => !alert.title.startsWith('0 '));
}

function parseMoneyToCents(value: string | undefined) {
  if (!value) {
    return 0;
  }

  const normalized = value.replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '');
  return Math.round(Number(normalized || 0) * 100);
}

function parseNumber(value: string | undefined) {
  if (!value) {
    return 0;
  }

  return Number(value.replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '')) || 0;
}

function normalize(value: string | undefined) {
  return (value ?? '')
    .trim()
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}
