import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { useFinancialGoalsStore } from '@features/finance/stores/financial-goals.store';
import { formatCurrency } from '@/utils/formatters';
import { loadHomeDashboard } from '../services/home.service';

export function HomePage() {
  const activeGoal = useFinancialGoalsStore((state) => state.goals.find((goal) => goal.isActive));
  const loadGoals = useFinancialGoalsStore((state) => state.loadGoals);
  const dashboard = useQuery({ queryKey: ['home-dashboard'], queryFn: loadHomeDashboard }).data;
  const billedCents = dashboard?.revenueTodayCents ?? 0;
  const goalPercent = activeGoal ? Math.min((billedCents / activeGoal.targetAmountCents) * 100, 100) : 0;
  const remainingCents = activeGoal ? Math.max(activeGoal.targetAmountCents - billedCents, 0) : 0;
  const metrics = [
    ['Caixa aberto/fechado', dashboard?.cashOpen ? 'Aberto' : 'Fechado', dashboard?.cashOpen ? 'Operacao liberada' : 'Operacao bloqueada'],
    ['Vendas de hoje', `${dashboard?.salesToday ?? 0} vendas`, formatCurrency(dashboard?.revenueTodayCents ?? 0)],
    ['Receita de hoje', formatCurrency(dashboard?.revenueTodayCents ?? 0), 'Entradas confirmadas'],
    ['Lucro estimado', formatCurrency(dashboard?.estimatedProfitCents ?? 0), 'Resultado estimado'],
    ['Produtos acabando', `${dashboard?.lowStockCount ?? 0} itens`, 'Reposicao prioritaria'],
    ['Produtos sem estoque', `${dashboard?.outOfStockCount ?? 0} itens`, 'Sem disponibilidade'],
    ['Ultimo item vendido', dashboard?.lastSoldItem ?? 'Sem vendas', 'Venda mais recente'],
    ['Ultima venda', dashboard?.lastSaleLabel ?? 'Sem vendas', formatCurrency(dashboard?.lastSaleTotalCents ?? 0)],
  ];

  useEffect(() => {
    void loadGoals();
  }, [loadGoals]);

  return (
    <section className="space-y-4 px-6 pb-6 pt-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {metrics.map(([title, value, meta]) => (
          <Card key={title}>
            <CardHeader>
              <CardTitle className="text-muted-foreground">{title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold">{value}</p>
              <p className="mt-2 text-xs text-muted-foreground">{meta}</p>
            </CardContent>
          </Card>
        ))}
        {activeGoal && (
          <Card>
            <CardHeader>
              <CardTitle className="text-muted-foreground">Meta ativa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xl font-semibold">{formatCurrency(activeGoal.targetAmountCents)}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {formatCurrency(billedCents)} faturados - faltam {formatCurrency(remainingCents)}
                </p>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${goalPercent}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">{goalPercent.toFixed(0)}% atingido</p>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}
