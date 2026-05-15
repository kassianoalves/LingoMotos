import { useMemo } from 'react';
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

const rowHeight = 56;
const viewportHeight = 480;

const statusLabels = {
  available: 'Disponivel',
  low_stock: 'Baixo',
  out_of_stock: 'Zerado',
  unpriced: 'Sem preco',
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
  const virtualRows = useVirtualRows({
    count: products.length,
    rowHeight,
    viewportHeight,
  });

  const visibleProducts = useMemo(
    () => products.slice(virtualRows.startIndex, virtualRows.endIndex),
    [products, virtualRows.endIndex, virtualRows.startIndex],
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Produtos</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {products.length.toLocaleString('pt-BR')} itens filtrados · tabela virtualizada
          </p>
        </div>
        <Badge variant="secondary">Busca instantanea</Badge>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-md border border-border">
          <div className="grid h-10 grid-cols-[128px_minmax(260px,1.4fr)_120px_96px_112px_112px_96px_120px] items-center border-b border-border bg-muted/50 px-3 text-xs font-medium text-muted-foreground">
            <div>SKU</div>
            <div>Produto</div>
            <div>Categoria</div>
            <div>Estoque</div>
            <div>Custo</div>
            <div>Venda</div>
            <div>Margem</div>
            <div>Status</div>
          </div>

          <div
            className="relative overflow-auto"
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
                        'grid w-full grid-cols-[128px_minmax(260px,1.4fr)_120px_96px_112px_112px_96px_120px] items-center border-b border-border px-3 text-left text-sm transition-colors hover:bg-muted/50',
                        selected ? 'bg-accent text-accent-foreground' : 'bg-card',
                      ].join(' ')}
                      style={{ height: rowHeight }}
                      onClick={() => onSelectProduct(product)}
                    >
                      <div className="font-medium">{product.sku}</div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{product.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {product.barcode ?? 'Sem codigo'} · {product.location ?? 'Sem local'}
                        </p>
                      </div>
                      <div className="truncate text-muted-foreground">{product.categoryName}</div>
                      <div className="font-semibold">
                        {product.currentStockQuantity}
                        <span className="ml-1 text-xs font-normal text-muted-foreground">{product.unit}</span>
                      </div>
                      <div>{formatCurrency(product.costPriceCents)}</div>
                      <div>{formatCurrency(product.salePriceCents)}</div>
                      <div>
                        <p className="font-medium">{margin.toFixed(1)}%</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(calculatePotentialProfitCents(product))}
                        </p>
                      </div>
                      <div>
                        <Badge variant={statusVariants[status]}>{statusLabels[status]}</Badge>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

