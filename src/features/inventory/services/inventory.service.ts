import { inventoryRepository } from '../repositories/inventory.repository';
import type {
  CategoryFormValues,
  ImportColumnMapping,
  ImportSourceData,
  InventoryAlert,
  InventoryFilters,
  Product,
  ProductFormValues,
  ProductImportDraft,
  ProductImportOptions,
  ProductImportRequest,
  StockMovementFormValues,
  SupplierFormValues,
} from '../types/inventory.types';
import { buildInventorySummary } from '../utils/inventory-calculations';
import {
  normalizeCode,
  normalizeInteger,
  normalizeMoney,
  normalizeMoneyToCents,
  normalizeSearchValue,
  normalizeText,
} from '../utils/import-products.normalizers';
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
    const existingByNameBrand = new Map(products.map((product) => [joinKey(product.name, product.brand), product]));
    const existingByNameApplication = new Map(products.map((product) => [joinKey(product.name, product.motorcycleApplication), product]));
    const seenInFile = new Set<string>();
    const reservedSkus = new Set(products.map((product) => normalize(product.sku)));
    const drafts: ProductImportDraft[] = [];

    for (const [index, row] of source.rows.entries()) {
      const mapped = mapRowToProduct(row, mapping, categories, suppliers);
      let mappedValues = mapped.values;
      let skuGeneratedAutomatically = false;

      if (!mappedValues.sku && mappedValues.name) {
        mappedValues = {
          ...mappedValues,
          sku: await generateReservedSku(mappedValues, reservedSkus),
        };
        skuGeneratedAutomatically = true;
      }

      const errors: string[] = [...mapped.errors];
      const warnings: string[] = [...mapped.warnings];
      const rowNumber = index + 2;
      const fileKey = normalize(mappedValues.sku || mappedValues.barcode);
      const duplicateMatch = findDuplicate(mappedValues, {
        byBarcode: existingByBarcode,
        bySku: existingBySku,
        byNameBrand: existingByNameBrand,
        byNameApplication: existingByNameApplication,
      });
      const duplicateProduct = duplicateMatch?.product;
      const values = duplicateProduct && options.duplicateStrategy === 'update_existing'
        ? mergeExistingProduct(duplicateProduct, mappedValues)
        : mappedValues;

      if (!values.name) {
        errors.push('Nome do produto é obrigatório.');
      }
      if (!values.categoryId) {
        warnings.push('Sem categoria.');
      }
      if (!values.supplierId && !values.supplierName) {
        warnings.push('Sem fornecedor.');
      }
      if (values.salePriceCents <= 0) {
        warnings.push('Sem preço de venda.');
      }
      if (values.costPriceCents <= 0) {
        warnings.push('Sem custo.');
      }
      if (values.salePriceCents > 0 && values.costPriceCents > values.salePriceCents) {
        warnings.push('Margem negativa.');
      }
      if (values.currentStockQuantity === 0) {
        warnings.push('Estoque zero.');
      }
      if (fileKey && seenInFile.has(fileKey)) {
        errors.push('Duplicado dentro do arquivo.');
      }
      if (
        duplicateMatch
        && options.duplicateStrategy === 'create_new'
        && (duplicateMatch.reason === 'Código de barras' || duplicateMatch.reason === 'SKU / Código interno')
      ) {
        errors.push(`${duplicateMatch.reason} duplicado. Escolha atualizar ou ignorar o duplicado.`);
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

      const action: ProductImportDraft['action'] = errors.length > 0
        ? 'error'
        : duplicateProduct && options.duplicateStrategy === 'skip'
          ? 'skip'
          : duplicateProduct && options.duplicateStrategy === 'update_existing'
            ? 'update'
            : 'create';
      const status: ProductImportDraft['status'] = action === 'error'
        ? 'error'
        : action === 'skip'
          ? 'ignored'
          : warnings.length > 0 || Boolean(duplicateProduct)
            ? 'warning'
            : 'ok';

      drafts.push({
        rowNumber,
        raw: row,
        values,
        status,
        action,
        duplicateProductId: action === 'update' || action === 'skip' ? duplicateProduct?.id : undefined,
        duplicateReason: duplicateMatch?.reason,
        errors,
        warnings: duplicateProduct ? [`Possível duplicado por ${duplicateMatch.reason}.`, ...warnings] : warnings,
        skuGeneratedAutomatically,
      });
    }

    return {
      fileName: source.fileName,
      totalRows: drafts.length,
      validRows: drafts.filter((draft) => draft.errors.length === 0 && draft.action !== 'skip').length,
      createCount: drafts.filter((draft) => draft.action === 'create').length,
      updateCount: drafts.filter((draft) => draft.action === 'update').length,
      skipCount: drafts.filter((draft) => draft.action === 'skip').length,
      errorCount: drafts.filter((draft) => draft.action === 'error').length,
      drafts,
    };
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
): { values: ProductImportDraft['values']; errors: string[]; warnings: string[] } {
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
      fieldValue: target.kind === 'custom' ? normalizeCustomFieldValue(row[header], target.fieldType) : normalizeText(row[header]),
    }))
    .filter((field) => field.fieldKey && field.fieldLabel);

  const errors: string[] = [];
  const warnings: string[] = [];
  const costPrice = normalizeMoneyToCents(mapped.costPrice);
  const salePrice = normalizeMoneyToCents(mapped.salePrice);
  const currentStock = normalizeInteger(mapped.currentStock);
  const minStock = normalizeInteger(mapped.minStock);

  if (!costPrice.ok) errors.push(`Preço de custo inválido. ${costPrice.message}`);
  if (!salePrice.ok) errors.push(`Preço de venda inválido. ${salePrice.message}`);
  if (!currentStock.ok) errors.push(`Estoque atual inválido. ${currentStock.message}`);
  if (!minStock.ok) errors.push(`Estoque mínimo inválido. ${minStock.message}`);

  const categoryName = normalizeText(mapped.category);
  const supplierName = normalizeText(mapped.supplier);
  const category = categories.find((item) => normalize(item.id) === normalize(categoryName) || normalize(item.name) === normalize(categoryName));
  const supplier = suppliers.find((item) => normalize(item.id) === normalize(supplierName) || normalize(item.name) === normalize(supplierName));

  return {
    values: {
      sku: normalizeCode(mapped.sku),
      barcode: normalizeCode(mapped.barcode),
      name: normalizeText(mapped.name),
      categoryId: category?.id ?? '',
      categoryName,
      supplierId: supplier?.id ?? '',
      supplierName,
      brand: normalizeText(mapped.brand),
      motorcycleApplication: normalizeText(mapped.motorcycleApplication),
      location: normalizeText(mapped.location),
      notes: normalizeText(mapped.notes),
      unit: normalizeText(mapped.unit) || 'un',
      costPriceCents: costPrice.value,
      salePriceCents: salePrice.value,
      currentStockQuantity: currentStock.value,
      minStockQuantity: minStock.value,
      customFields,
    },
    errors,
    warnings,
  };
}

async function generateReservedSku(values: ProductImportDraft['values'], reservedSkus: Set<string>) {
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

function mergeExistingProduct(product: Product, imported: ProductImportDraft['values']): ProductImportDraft['values'] {
  return {
    sku: product.sku,
    barcode: imported.barcode || product.barcode || '',
    name: imported.name || product.name,
    categoryId: imported.categoryId || product.categoryId,
    categoryName: imported.categoryName,
    supplierId: imported.supplierId || product.supplierId || '',
    supplierName: imported.supplierName,
    brand: imported.brand || product.brand || '',
    motorcycleApplication: imported.motorcycleApplication || product.motorcycleApplication || '',
    location: imported.location || product.location || '',
    notes: imported.notes || product.notes || '',
    unit: imported.unit || product.unit,
    costPriceCents: imported.costPriceCents || product.costPriceCents,
    salePriceCents: imported.salePriceCents || product.salePriceCents,
    minStockQuantity: imported.minStockQuantity || product.minStockQuantity,
    currentStockQuantity: imported.currentStockQuantity || product.currentStockQuantity,
    customFields: imported.customFields,
  };
}

function buildAlerts(summary: ReturnType<typeof buildInventorySummary>): InventoryAlert[] {
  const alerts: InventoryAlert[] = [
    {
      id: 'low-stock',
      severity: 'warning',
      title: `${summary.lowStockCount} produtos abaixo do mínimo`,
      detail: 'Priorize reposição dos itens com maior giro nos últimos 30 dias.',
      actionLabel: 'Ver baixo estoque',
      filter: 'low_stock',
    },
    {
      id: 'out-of-stock',
      severity: 'destructive',
      title: `${summary.outOfStockCount} produtos zerados`,
      detail: 'Itens zerados travam venda no balcão e devem ser repostos ou inativados.',
      actionLabel: 'Ver zerados',
      filter: 'out_of_stock',
    },
    {
      id: 'pricing',
      severity: 'info',
      title: `${summary.unpricedCount + summary.uncostedCount} produtos sem preço ou custo`,
      detail: 'Cadastre custo e venda para relatórios de margem confiáveis.',
      actionLabel: 'Corrigir cadastro',
      filter: summary.unpricedCount > 0 ? 'unpriced' : 'uncosted',
    },
  ];

  return alerts.filter((alert) => !alert.title.startsWith('0 '));
}

function normalize(value: string | undefined) {
  return normalizeSearchValue(value);
}

function normalizeCustomFieldValue(value: string, type: ProductImportDraft['values']['customFields'][number]['fieldType']) {
  if (type === 'currency') {
    const parsed = normalizeMoney(value);
    return parsed.ok ? String(parsed.value) : normalizeText(value);
  }
  if (type === 'number') {
    const parsed = normalizeInteger(value);
    return parsed.ok ? String(parsed.value) : normalizeText(value);
  }
  if (type === 'boolean') {
    const normalized = normalizeSearchValue(value);
    if (['sim', 'true', 'ativo', 'yes', '1'].includes(normalized)) return 'true';
    if (['nao', 'false', 'inativo', 'no', '0'].includes(normalized)) return 'false';
  }
  return normalizeText(value);
}

function joinKey(first: string | undefined, second: string | undefined) {
  const left = normalize(first);
  const right = normalize(second);
  return left && right ? `${left}||${right}` : '';
}

function findDuplicate(
  values: ProductImportDraft['values'],
  indexes: {
    byBarcode: Map<string, Product>;
    bySku: Map<string, Product>;
    byNameBrand: Map<string, Product>;
    byNameApplication: Map<string, Product>;
  },
) {
  const barcode = normalize(values.barcode);
  if (barcode && indexes.byBarcode.has(barcode)) {
    return { product: indexes.byBarcode.get(barcode)!, reason: 'Código de barras' };
  }
  const sku = normalize(values.sku);
  if (sku && indexes.bySku.has(sku)) {
    return { product: indexes.bySku.get(sku)!, reason: 'SKU / Código interno' };
  }
  const nameBrand = joinKey(values.name, values.brand);
  if (nameBrand && indexes.byNameBrand.has(nameBrand)) {
    return { product: indexes.byNameBrand.get(nameBrand)!, reason: 'nome + marca' };
  }
  const nameApplication = joinKey(values.name, values.motorcycleApplication);
  if (nameApplication && indexes.byNameApplication.has(nameApplication)) {
    return { product: indexes.byNameApplication.get(nameApplication)!, reason: 'nome + aplicação' };
  }
  return null;
}
