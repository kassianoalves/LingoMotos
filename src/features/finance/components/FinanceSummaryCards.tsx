import { Banknote, CircleDollarSign, Gauge, Percent, Receipt, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import type { FinanceSummary } from '../types/finance.types';
import { formatCurrency, formatPercent } from '../utils/finance-calculations';

type FinanceSummaryCardsProps = {
  summary: FinanceSummary;
};

export function FinanceSummaryCards({ summary }: FinanceSummaryCardsProps) {
  const cards = [
    {
      label: 'Receita no periodo',
      value: formatCurrency(summary.revenueTodayCents),
      meta: `${summary.salesCount} vendas · ticket ${formatCurrency(summary.averageTicketCents)}`,
      icon: CircleDollarSign,
    },
    {
      label: 'Receita do mes',
      value: formatCurrency(summary.revenueMonthCents),
      meta: `Desempenho ${formatPercent(summary.storePerformancePercent)}`,
      icon: TrendingUp,
    },
    {
      label: 'Lucro bruto',
      value: formatCurrency(summary.grossProfitCents),
      meta: `Margem media ${formatPercent(summary.averageMarginPercent)}`,
      icon: Percent,
    },
    {
      label: 'Caixa',
      value: formatCurrency(summary.cashBalanceCents),
      meta: `Entradas ${formatCurrency(summary.cashInCents)} · saidas ${formatCurrency(summary.cashOutCents)}`,
      icon: Banknote,
    },
    {
      label: 'A receber',
      value: formatCurrency(summary.receivableOpenCents),
      meta: 'Valores em aberto de clientes',
      icon: Receipt,
    },
    {
      label: 'A pagar',
      value: formatCurrency(summary.payableOpenCents),
      meta: 'Compromissos com fornecedores',
      icon: Gauge,
    },
  ];

  return (
    <div className="grid gap-4 xl:grid-cols-3 2xl:grid-cols-6">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-muted-foreground">{card.label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold">{card.value}</p>
              <p className="mt-2 text-xs text-muted-foreground">{card.meta}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

