import { Badge } from '@shared/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import type { Product } from '../types/inventory.types';
import { formatCurrency } from '../utils/inventory-calculations';

type InventoryInsightsProps = {
  products: Product[];
};

export function InventoryInsights({ products }: InventoryInsightsProps) {
  const topSelling = [...products].sort((a, b) => b.soldLast30Days - a.soldLast30Days).slice(0, 5);
  const stopped = products
    .filter((product) => product.currentStockQuantity > 0)
    .sort((a, b) => a.soldLast30Days - b.soldLast30Days)
    .slice(0, 5);

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Mais vendidos</CardTitle>
          <p className="text-sm text-muted-foreground">Prioridade para reposicao e destaque no balcao.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {topSelling.map((product) => (
            <InsightRow
              key={product.id}
              product={product}
              metric={`${product.soldLast30Days} vendidos`}
              badge="Giro"
            />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Produtos parados</CardTitle>
          <p className="text-sm text-muted-foreground">Itens com estoque e baixo giro nos ultimos 30 dias.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {stopped.map((product) => (
            <InsightRow
              key={product.id}
              product={product}
              metric={`${product.soldLast30Days} vendidos`}
              badge="Parado"
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function InsightRow({ product, metric, badge }: { product: Product; metric: string; badge: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{product.name}</p>
        <p className="text-xs text-muted-foreground">
          {product.sku} · estoque {product.currentStockQuantity} · {formatCurrency(product.salePriceCents)}
        </p>
      </div>
      <div className="text-right">
        <Badge variant="secondary">{badge}</Badge>
        <p className="mt-1 text-xs text-muted-foreground">{metric}</p>
      </div>
    </div>
  );
}

