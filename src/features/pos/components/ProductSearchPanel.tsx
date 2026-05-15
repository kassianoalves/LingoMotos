import { Barcode, Search } from 'lucide-react';
import { Badge } from '@shared/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Input } from '@shared/components/ui/input';
import type { PosProduct } from '../types/pos.types';
import { formatCurrency } from '../utils/pos-calculations';

type ProductSearchPanelProps = {
  inputRef: React.RefObject<HTMLInputElement>;
  query: string;
  products: PosProduct[];
  selectedIndex: number;
  onQueryChange: (query: string) => void;
  onSelectedIndexChange: (index: number) => void;
  onAddProduct: (product: PosProduct) => void;
};

export function ProductSearchPanel({
  inputRef,
  query,
  products,
  selectedIndex,
  onQueryChange,
  onSelectedIndexChange,
  onAddProduct,
}: ProductSearchPanelProps) {
  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      onSelectedIndexChange(Math.min(selectedIndex + 1, products.length - 1));
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      onSelectedIndexChange(Math.max(selectedIndex - 1, 0));
    }

    if (event.key === 'Enter' && products[selectedIndex]) {
      event.preventDefault();
      onAddProduct(products[selectedIndex]);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Buscar produto</CardTitle>
          <p className="text-sm text-muted-foreground">Digite, leia o codigo de barras ou use F3.</p>
        </div>
        <Badge variant="secondary">Leitor pronto</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            onKeyDown={handleKeyDown}
            className="h-14 pl-10 text-base"
            placeholder="Produto, SKU ou codigo de barras"
          />
          <Barcode className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        </div>

        <div className="h-[520px] overflow-auto rounded-md border border-border">
          {products.map((product, index) => (
            <button
              key={product.id}
              type="button"
              className={[
                'grid w-full grid-cols-[minmax(0,1fr)_120px_92px] items-center gap-3 border-b border-border p-3 text-left transition-colors hover:bg-muted/50',
                selectedIndex === index ? 'bg-accent text-accent-foreground' : '',
              ].join(' ')}
              onMouseEnter={() => onSelectedIndexChange(index)}
              onClick={() => onAddProduct(product)}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{product.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {product.sku} · {product.barcode ?? 'sem codigo'} · {product.location ?? 'sem local'}
                </p>
              </div>
              <div className="text-right text-sm font-semibold">{formatCurrency(product.salePriceCents)}</div>
              <div className="text-right">
                <Badge variant={product.currentStockQuantity > 0 ? 'success' : 'destructive'}>
                  {product.currentStockQuantity} {product.unit}
                </Badge>
              </div>
            </button>
          ))}

          {products.length === 0 && (
            <div className="grid h-full place-items-center p-6 text-center text-sm text-muted-foreground">
              Nenhum produto encontrado.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

