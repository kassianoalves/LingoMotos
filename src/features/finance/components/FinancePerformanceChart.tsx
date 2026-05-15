import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import type { DailyPerformancePoint } from '../types/finance.types';
import { formatCurrency } from '../utils/finance-calculations';

type FinancePerformanceChartProps = {
  points: DailyPerformancePoint[];
};

export function FinancePerformanceChart({ points }: FinancePerformanceChartProps) {
  const maxValue = Math.max(...points.map((point) => Math.max(point.revenueCents, point.profitCents)), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Desempenho da loja</CardTitle>
        <p className="text-sm text-muted-foreground">Receita e lucro por dia, em uma leitura simples.</p>
      </CardHeader>
      <CardContent>
        <div className="flex h-72 items-end gap-3">
          {points.map((point) => {
            const revenueHeight = Math.max((point.revenueCents / maxValue) * 100, 4);
            const profitHeight = Math.max((point.profitCents / maxValue) * 100, 4);

            return (
              <div key={point.date} className="flex min-w-12 flex-1 flex-col items-center gap-2">
                <div className="flex h-56 w-full items-end justify-center gap-1 rounded-md border border-border bg-muted/30 p-2">
                  <div
                    className="w-4 rounded-sm bg-primary"
                    style={{ height: `${revenueHeight}%` }}
                    title={`Receita ${formatCurrency(point.revenueCents)}`}
                  />
                  <div
                    className="w-4 rounded-sm bg-success"
                    style={{ height: `${profitHeight}%` }}
                    title={`Lucro ${formatCurrency(point.profitCents)}`}
                  />
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium">{point.date.slice(8, 10)}</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(point.revenueCents)}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-primary" /> Receita</span>
          <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-success" /> Lucro</span>
        </div>
      </CardContent>
    </Card>
  );
}

