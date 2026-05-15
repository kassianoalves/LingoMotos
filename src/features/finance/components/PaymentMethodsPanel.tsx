import { Badge } from '@shared/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import type { PaymentMethodSummary } from '../types/finance.types';
import { formatCurrency } from '../utils/finance-calculations';

type PaymentMethodsPanelProps = {
  payments: PaymentMethodSummary[];
};

export function PaymentMethodsPanel({ payments }: PaymentMethodsPanelProps) {
  const total = payments.reduce((sum, item) => sum + item.amountCents, 0) || 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Formas de pagamento</CardTitle>
        <p className="text-sm text-muted-foreground">Quanto entrou por cada forma e o valor liquido.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {payments.map((payment) => (
          <div key={payment.type} className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{payment.label}</p>
                <p className="text-xs text-muted-foreground">{payment.count} vendas · taxas {formatCurrency(payment.feeCents)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{formatCurrency(payment.amountCents)}</p>
                <Badge variant="secondary">Liquido {formatCurrency(payment.netCents)}</Badge>
              </div>
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div className="h-2 rounded-full bg-primary" style={{ width: `${(payment.amountCents / total) * 100}%` }} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

