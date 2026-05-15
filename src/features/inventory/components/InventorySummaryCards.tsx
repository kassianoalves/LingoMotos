import { AlertTriangle, Boxes, CircleDollarSign, PackageX, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import type { InventorySummary } from '../types/inventory.types';
import { formatCurrency } from '../utils/inventory-calculations';

type InventorySummaryCardsProps = {
  summary: InventorySummary;
};

const cards = [
  { key: 'totalProducts', label: 'Produtos ativos', icon: Boxes },
  { key: 'lowStockCount', label: 'Baixo estoque', icon: AlertTriangle },
  { key: 'outOfStockCount', label: 'Sem estoque', icon: PackageX },
  { key: 'potentialProfitCents', label: 'Lucro potencial', icon: TrendingUp },
] as const;

export function InventorySummaryCards({ summary }: InventorySummaryCardsProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const value =
          card.key === 'potentialProfitCents'
            ? formatCurrency(summary.potentialProfitCents)
            : summary[card.key].toLocaleString('pt-BR');

        return (
          <Card key={card.key}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-muted-foreground">{card.label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold">{value}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {card.key === 'potentialProfitCents'
                  ? `Margem media ${summary.averageMarginPercent.toFixed(1)}%`
                  : `Valor em estoque ${formatCurrency(summary.inventoryCostCents)}`}
              </p>
            </CardContent>
          </Card>
        );
      })}
      <Card className="xl:col-span-4">
        <CardContent className="grid gap-4 p-4 md:grid-cols-3">
          <div className="flex items-center gap-3">
            <CircleDollarSign className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Potencial de venda</p>
              <p className="font-semibold">{formatCurrency(summary.inventorySalePotentialCents)}</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Sem preço</p>
            <p className="font-semibold">{summary.unpricedCount} produtos</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Sem custo</p>
            <p className="font-semibold">{summary.uncostedCount} produtos</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
