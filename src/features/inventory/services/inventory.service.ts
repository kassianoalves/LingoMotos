import { inventoryRepository } from '../repositories/inventory.repository';
import type {
  InventoryAlert,
  ImportColumnMapping,
  ImportSourceData,
  InventoryFilters,
  Product,
  CategoryFormValues,
  ProductFormValues,
  ProductImportDraft,
  ProductImportOptions,
  ProductImportPreview,
  ProductImportRequest,
  StockMovementFormValues,
  SupplierFormValues,
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

  createCategory(values: CategoryFormValues) {
    return inventoryRepository.createCategory(values);
  },
  updateCategory(id: string, values: CategoryFormValues) {
    return inventoryRepository.updateCategory(id, values);
  },
  deactivateCategory(id: string) {
    return inventoryRepository.deactivateCategory(id);
  },

  createSupplier(values: SupplierFormValues) {
    return inventoryRepository.createSupplier(values);
  },
  updateSupplier(id: string, values: SupplierFormValues) {
    return inventoryRepository.updateSupplier(id, values);
  },
  deactivateSupplier(id: string) {
    return inventoryRepository.deactivateSupplier(id);
  },
  listStockMovements() {
    return inventoryRepository.listStockMovements();
  },

  removeProduct(productId: string) {
    return inventoryRepository.deactivateProduct(productId);
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
    const existingByName = new Map(products.map((product) => [normalize(product.name), product]));
    const seenInFile = new Set<string>();

    const reservedSkus = new Set(products.map((product) => normalize(product.sku)));
    const drafts = [];

    for (const [index, row] of source.rows.entries()) {
      let mappedValues = mapRowToProduct(row, mapping, categories, suppliers);
      let skuGeneratedAutomatically = false;
      if (!mappedValues.sku && mappedValues.name) {
        mappedValues = {
          ...mappedValues,
          sku: await generateReservedSku(mappedValues, reservedSkus),
        };
        skuGeneratedAutomatically = true;
      }
      const errors: string[] = [];
      const warnings: string[] = [];
      const rowNumber = index + 2;
      const fileKey = normalize(mappedValues.sku || mappedValues.barcode);
      const duplicateProduct = existingBySku.get(normalize(mappedValues.sku))
        || existingByBarcode.get(normalize(mappedValues.barcode))
        || existingByName.get(normalize(mappedValues.name));
      const values =
        duplicateProduct && options.duplicateStrategy === 'update_prices'
          ? mergePriceUpdate(duplicateProduct, mappedValues)
          : mappedValues;

      if (!values.sku) {
        errors.push('SKU / Código interno obrigatório.');
      }

      if (!values.name) {
        errors.push('Nome obrigatorio.');
      }

      if (!values.categoryId) {
        warnings.push('Categoria nao encontrada, sera usada categoria padrao se existir.');
      }

      if (values.salePriceCents <= 0) {
        warnings.push('Produto sem preço de venda.');
      }

      if (values.costPriceCents <= 0) {
        warnings.push('Produto sem custo.');
      }

      if (fileKey && seenInFile.has(fileKey)) {
        errors.push('Duplicado dentro do arquivo.');
      }

      const customKeys = mappedValues.customFields.map((field) => normalize(field.fieldKey)).filter(Boolean);
      if (new Set(customKeys).size !== customKeys.length) {
        errors.push('Campos personalizados duplicados na mesma linha.');
      }

      if (fileKey) {
        seenInFile.add(fileKey);
      }
      if (mappedValues.sku) {
        reservedSkus.add(normalize(mappedValues.sku));
      }

      const action: ProductImportDraft['action'] =
        errors.length > 0
          ? 'error'
          : duplicateProduct && options.duplicateStrategy === 'skip'
            ? 'skip'
            : duplicateProduct
              ? 'update'
              : 'create';

      drafts.push({
        rowNumber,
        raw: row,
        values,
        action,
        duplicateProductId: duplicateProduct?.id,
        errors,
        warnings: duplicateProduct ? ['Produto ja existe no cadastro.', ...warnings] : warnings,
        skuGeneratedAutomatically,
      });
    }

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

  generateProductSku(input: { categoryId?: string; brand?: string; productName: string; motorcycleApplication?: string }) {
    return inventoryRepository.generateProductSku(input);
  },
};

function mapRowToProduct(
  row: Record<string, string>,
  mapping: ImportColumnMapping,
  categories: Awaited<ReturnType<typeof inventoryRepository.listCategories>>,
  suppliers: Awaited<ReturnType<typeof inventoryRepository.listSuppliers>>,
): ProductImportDraft['values'] {
  const mapped = Object.entries(mapping).reduce<Record<string, string>>((result, [header, target]) => {
    if (target.kind === 'known' && target.field !== 'ignore') {
      result[target.field] = row[header] ?? '';
    }
    return result;
  }, {});
  const customFields = Object.entries(mapping)
    .filter(([, target]) => target.kind === 'custom')
    .map(([header, target]) => ({
      fieldKey: target.kind === 'custom' ? target.fieldKey : '',
      fieldLabel: target.kind === 'custom' ? target.fieldLabel : '',
      fieldType: target.kind === 'custom' ? target.fieldType : 'text',
      fieldValue: row[header] ?? '',
    }))
    .filter((field) => field.fieldKey && field.fieldLabel);

  const category = categories.find((item) => normalize(item.id) === normalize(mapped.category) || normalize(item.name) === normalize(mapped.category));
  const supplier = suppliers.find((item) => normalize(item.id) === normalize(mapped.supplier) || normalize(item.name) === normalize(mapped.supplier));

  return {
    sku: mapped.sku?.trim() ?? '',
    barcode: mapped.barcode?.trim() ?? '',
    name: mapped.name?.trim() ?? '',
    categoryId: category?.id ?? categories[0]?.id ?? '',
    categoryName: mapped.category?.trim() ?? '',
    supplierId: supplier?.id ?? '',
    supplierName: mapped.supplier?.trim() ?? '',
    brand: mapped.brand?.trim() ?? '',
    motorcycleApplication: mapped.motorcycleApplication?.trim() ?? '',
    location: mapped.location?.trim() ?? '',
    notes: mapped.notes?.trim() ?? '',
    unit: mapped.unit?.trim() || 'un',
    costPriceCents: parseMoneyToCents(mapped.costPrice),
    salePriceCents: parseMoneyToCents(mapped.salePrice),
    currentStockQuantity: parseNumber(mapped.currentStock),
    minStockQuantity: parseNumber(mapped.minStock),
    customFields,
  };
}

async function generateReservedSku(
  values: ProductImportDraft['values'],
  reservedSkus: Set<string>,
) {
  const firstCandidate = await inventoryRepository.generateProductSku({
    categoryId: values.categoryId || undefined,
    brand: values.brand || undefined,
    productName: values.name,
    motorcycleApplication: values.motorcycleApplication || undefined,
  });
  let candidate = firstCandidate;
  let sequence = Number(firstCandidate.match(/-(\d{4})$/)?.[1] ?? 1);
  const base = firstCandidate.replace(/-\d{4}$/, '');
  while (reservedSkus.has(normalize(candidate))) {
    sequence += 1;
    candidate = `${base}-${String(sequence).padStart(4, '0')}`;
  }
  return candidate;
}

function mergePriceUpdate(product: Product, imported: ProductImportDraft['values']): ProductImportDraft['values'] {
  return {
    sku: product.sku,
    barcode: product.barcode ?? imported.barcode,
    name: product.name,
    categoryId: product.categoryId,
    categoryName: imported.categoryName,
    supplierId: product.supplierId ?? imported.supplierId,
    supplierName: imported.supplierName,
    brand: product.brand ?? imported.brand,
    motorcycleApplication: product.motorcycleApplication ?? imported.motorcycleApplication,
    location: product.location ?? imported.location,
    notes: product.notes ?? imported.notes,
    unit: product.unit,
    costPriceCents: imported.costPriceCents || product.costPriceCents,
    salePriceCents: imported.salePriceCents || product.salePriceCents,
    minStockQuantity: product.minStockQuantity,
    currentStockQuantity: product.currentStockQuantity,
    customFields: imported.customFields,
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
      title: `${summary.unpricedCount + summary.uncostedCount} produtos sem preço ou custo`,
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
