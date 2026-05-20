import { useMemo, useState } from 'react';
import { Badge } from '@shared/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { useVirtualRows } from '../hooks/useVirtualRows';
import type { Product } from '../types/inventory.types';
import {
  calculateMarginPercent,
  calculatePotentialProfitCents,
  formatCurrency,
  getStockStatus,
} from '../utils/inventory-calculations';

type ProductVirtualTableProps = {
  products: Product[];
  selectedProductId?: string;
  onSelectProduct: (product: Product) => void;
};

const rowHeight = 48;
const viewportHeight = 320;
const columnStorageKey = 'lingomotos.inventory.productTable.columns.v1';

const tableColumns = [
  { key: 'sku', label: 'SKU', defaultWidth: 150, minWidth: 110 },
  { key: 'product', label: 'Produto', defaultWidth: 260, minWidth: 190 },
  { key: 'category', label: 'Categoria', defaultWidth: 130, minWidth: 100 },
  { key: 'stock', label: 'Estoque', defaultWidth: 86, minWidth: 72 },
  { key: 'cost', label: 'Custo', defaultWidth: 104, minWidth: 84 },
  { key: 'sale', label: 'Venda', defaultWidth: 104, minWidth: 84 },
  { key: 'margin', label: 'Margem', defaultWidth: 86, minWidth: 74 },
  { key: 'status', label: 'Status', defaultWidth: 104, minWidth: 88 },
] as const;

type ColumnKey = (typeof tableColumns)[number]['key'];
type ColumnWidths = Record<ColumnKey, number>;

const statusLabels = {
  available: 'Disponível',
  low_stock: 'Baixo',
  out_of_stock: 'Zerado',
  unpriced: 'Sem preço',
  uncosted: 'Sem custo',
};

const statusVariants = {
  available: 'success',
  low_stock: 'warning',
  out_of_stock: 'destructive',
  unpriced: 'info',
  uncosted: 'warning',
} as const;

export function ProductVirtualTable({ products, selectedProductId, onSelectProduct }: ProductVirtualTableProps) {
  const [columnWidths, setColumnWidths] = useState<ColumnWidths>(() => loadColumnWidths());
  const virtualRows = useVirtualRows({
    count: products.length,
    rowHeight,
    viewportHeight,
  });

  const visibleProducts = useMemo(
    () => products.slice(virtualRows.startIndex, virtualRows.endIndex),
    [products, virtualRows.endIndex, virtualRows.startIndex],
  );
  const gridTemplateColumns = tableColumns.map((column) => `${columnWidths[column.key]}px`).join(' ');
  const minTableWidth = Object.values(columnWidths).reduce((sum, width) => sum + width, 0);

  function resizeColumn(key: ColumnKey, startX: number) {
    const column = tableColumns.find((item) => item.key === key);
    if (!column) return;
    const startWidth = columnWidths[key];
    const minWidth = column.minWidth;

    function handlePointerMove(event: PointerEvent) {
      const nextWidth = Math.max(minWidth, startWidth + event.clientX - startX);
      setColumnWidths((current) => {
        const next = { ...current, [key]: nextWidth };
        window.localStorage.setItem(columnStorageKey, JSON.stringify(next));
        return next;
      });
    }

    function handlePointerUp() {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    }

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }

  return (
    <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <CardHeader className="flex flex-none flex-row items-center justify-between p-3 pb-2 compact:p-2">
        <div>
          <CardTitle className="text-sm">Produtos</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            {products.length.toLocaleString('pt-BR')} itens filtrados
          </p>
        </div>
        <Badge variant="secondary">Colunas ajustáveis</Badge>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col p-3 pt-0 compact:p-2">
        <div className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden rounded-md border border-border">
          <div style={{ minWidth: minTableWidth }}>
            <div
              className="grid h-8 items-center border-b border-border bg-muted/50 text-xs font-medium text-muted-foreground"
              style={{ gridTemplateColumns }}
            >
              {tableColumns.map((column) => (
                <div key={column.key} className="relative flex h-full items-center px-2">
                  <span className="truncate">{column.label}</span>
                  <button
                    type="button"
                    className="absolute right-0 top-0 h-full w-2 cursor-col-resize border-r border-border/70 hover:border-primary"
                    aria-label={`Ajustar coluna ${column.label}`}
                    onPointerDown={(event) => {
                      event.preventDefault();
                      resizeColumn(column.key, event.clientX);
                    }}
                  />
                </div>
              ))}
            </div>

            <div
              className="relative min-h-0 overflow-auto"
              style={{ height: viewportHeight }}
              onScroll={(event) => virtualRows.setScrollTop(event.currentTarget.scrollTop)}
            >
              <div style={{ height: virtualRows.totalHeight }}>
                <div style={{ transform: `translateY(${virtualRows.offsetTop}px)` }}>
                  {visibleProducts.map((product) => {
                    const status = getStockStatus(product);
                    const margin = calculateMarginPercent(product);
                    const selected = selectedProductId === product.id;

                    return (
                      <button
                        key={product.id}
                        type="button"
                        className={[
                          'grid w-full items-center border-b border-border text-left text-sm transition-colors hover:bg-muted/50',
                          selected ? 'bg-accent text-accent-foreground' : 'bg-card',
                        ].join(' ')}
                        style={{ height: rowHeight, gridTemplateColumns }}
                        onClick={() => onSelectProduct(product)}
                      >
                        <div className="truncate px-2 font-medium" title={product.sku}>{product.sku}</div>
                        <div className="min-w-0 px-2">
                          <p className="truncate font-medium" title={product.name}>{product.name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {product.barcode ?? 'Sem código'} · {product.location ?? 'Sem local'}
                          </p>
                        </div>
                        <div className="truncate px-2 text-muted-foreground">{product.categoryName}</div>
                        <div className="px-2 font-semibold">
                          {product.currentStockQuantity}
                          <span className="ml-1 text-xs font-normal text-muted-foreground">{product.unit}</span>
                        </div>
                        <div className="truncate px-2">{formatCurrency(product.costPriceCents)}</div>
                        <div className="truncate px-2">{formatCurrency(product.salePriceCents)}</div>
                        <div className="px-2">
                          <p className="font-medium">{margin.toFixed(1)}%</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {formatCurrency(calculatePotentialProfitCents(product))}
                          </p>
                        </div>
                        <div className="px-2">
                          <Badge variant={statusVariants[status]}>{statusLabels[status]}</Badge>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function loadColumnWidths(): ColumnWidths {
  const fallback = Object.fromEntries(tableColumns.map((column) => [column.key, column.defaultWidth])) as ColumnWidths;
  try {
    const saved = window.localStorage.getItem(columnStorageKey);
    if (!saved) return fallback;
    const parsed = JSON.parse(saved) as Partial<ColumnWidths>;
    return tableColumns.reduce<ColumnWidths>((widths, column) => {
      widths[column.key] = Math.max(column.minWidth, Number(parsed[column.key]) || column.defaultWidth);
      return widths;
    }, { ...fallback });
  } catch {
    return fallback;
  }
}
