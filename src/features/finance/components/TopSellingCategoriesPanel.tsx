import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import type { TopSellingCategory } from '../types/finance.types';
import { formatCurrency } from '../utils/finance-calculations';

type TopSellingCategoriesPanelProps = {
  categories: TopSellingCategory[];
};

export function TopSellingCategoriesPanel({ categories }: TopSellingCategoriesPanelProps) {
  const maxQuantity = Math.max(...categories.map((category) => category.quantitySold), 1);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle>Categorias mais vendidas</CardTitle>
        <p className="text-sm text-muted-foreground">Produtos vendidos por categoria no período selecionado.</p>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <div className="grid h-64 place-items-center rounded-md bg-muted/30 text-sm text-muted-foreground">
            Nenhuma categoria vendida neste período.
          </div>
        ) : (
          <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
            {categories.map((category) => (
              <div key={category.categoryId ?? category.categoryName} className="rounded-md bg-muted/25 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{category.categoryName}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatQuantity(category.quantitySold)} unidades · {formatCurrency(category.revenueTotalCents)} · Lucro {formatCurrency(category.grossProfitCents)} · {category.percentage.toFixed(1)}%
                    </p>
                  </div>
                  <span className="text-sm font-semibold">{formatQuantity(category.quantitySold)}</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.max((category.quantitySold / maxQuantity) * 100, 4)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatQuantity(value: number) {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
    maximumFractionDigits: 2,
  });
}
