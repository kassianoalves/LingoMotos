import { Banknote, CircleDollarSign, Goal, Percent, Receipt, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@shared/components/ui/card';
import type { FinanceSummary } from '../types/finance.types';
import { formatCurrency, formatPercent } from '../utils/finance-calculations';

type FinanceSummaryCardsProps = {
  summary: FinanceSummary;
};

export function FinanceSummaryCards({ summary }: FinanceSummaryCardsProps) {
  const primaryCards = [
    {
      label: 'Receita',
      value: formatCurrency(summary.revenueTodayCents),
      meta: `${summary.salesCount} vendas`,
      icon: CircleDollarSign,
    },
    {
      label: 'Lucro bruto',
      value: formatCurrency(summary.grossProfitCents),
      meta: `Margem ${formatPercent(summary.averageMarginPercent)}`,
      icon: TrendingUp,
    },
    {
      label: 'Caixa',
      value: formatCurrency(summary.cashBalanceCents),
      meta: `Entradas ${formatCurrency(summary.cashInCents)}`,
      icon: Banknote,
    },
    {
      label: 'Meta',
      value: formatPercent(summary.storePerformancePercent),
      meta: 'Desempenho da loja',
      icon: Goal,
    },
  ];

  const secondaryCards = [
    { label: 'A receber', value: formatCurrency(summary.receivableOpenCents), icon: Receipt },
    { label: 'A pagar', value: formatCurrency(summary.payableOpenCents), icon: Receipt },
    { label: 'Ticket medio', value: formatCurrency(summary.averageTicketCents), icon: CircleDollarSign },
    { label: 'Margem media', value: formatPercent(summary.averageMarginPercent), icon: Percent },
  ];

  return (
    <div className="space-y-3">
      <div className="grid gap-3 xl:grid-cols-4">
        {primaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="border-0 bg-card shadow-sm">
              <CardContent className="flex min-h-28 flex-col justify-between p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <span className="grid h-9 w-9 place-items-center rounded-md bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                <div>
                  <p className="text-2xl font-semibold tracking-normal">{card.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{card.meta}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {secondaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="border-0 bg-muted/30 shadow-none">
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                  <p className="mt-1 text-lg font-semibold">{card.value}</p>
                </div>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
