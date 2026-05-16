import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import type { PaymentMethodSummary } from '../types/finance.types';
import { formatCurrency } from '../utils/finance-calculations';

type PaymentMethodsPanelProps = {
  payments: PaymentMethodSummary[];
};

const preferredOrder = ['pix', 'cash', 'debit_card', 'credit_card'];

export function PaymentMethodsPanel({ payments }: PaymentMethodsPanelProps) {
  const total = payments.reduce((sum, item) => sum + item.amountCents, 0) || 1;
  const ordered = [...payments].sort((a, b) => preferredOrder.indexOf(a.type) - preferredOrder.indexOf(b.type));

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle>Formas de pagamento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {ordered.map((payment) => {
          const percent = Math.round((payment.amountCents / total) * 100);
          return (
            <div key={payment.type} className="space-y-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium">{payment.label}</span>
                <span>{formatCurrency(payment.amountCents)}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 flex-1 rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${percent}%` }} />
                </div>
                <span className="w-10 text-right text-xs text-muted-foreground">{percent}%</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
