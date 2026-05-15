import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Input } from '@shared/components/ui/input';
import type { CartTotals, PaymentLine, PosPaymentMethod } from '../types/pos.types';
import { formatCurrency, parseMoneyToCents, paymentMethodLabels } from '../utils/pos-calculations';

type PaymentPanelProps = {
  payments: PaymentLine[];
  totals: CartTotals;
  paymentAmount: string;
  onPaymentAmountChange: (value: string) => void;
  onAddPayment: (method: PosPaymentMethod, amountCents: number) => void;
  onFillRemaining: (method: PosPaymentMethod) => void;
  onRemovePayment: (paymentId: string) => void;
};

const methods: PosPaymentMethod[] = ['cash', 'pix', 'debit_card', 'credit_card', 'store_credit'];

export function PaymentPanel({
  payments,
  totals,
  paymentAmount,
  onPaymentAmountChange,
  onAddPayment,
  onFillRemaining,
  onRemovePayment,
}: PaymentPanelProps) {
  function addPayment(method: PosPaymentMethod) {
    const amount = parseMoneyToCents(paymentAmount);
    onAddPayment(method, amount > 0 ? amount : totals.remainingCents);
    onPaymentAmountChange('');
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pagamento</CardTitle>
        <p className="text-sm text-muted-foreground">Use múltiplas formas se necessário.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          value={paymentAmount}
          onChange={(event) => onPaymentAmountChange(event.target.value)}
          placeholder="Valor recebido"
          inputMode="decimal"
        />

        <div className="grid grid-cols-2 gap-2">
          {methods.map((method) => (
            <Button key={method} variant="outline" className="justify-between" onClick={() => addPayment(method)}>
              {paymentMethodLabels[method]}
            </Button>
          ))}
        </div>

        <div className="space-y-2">
          {payments.map((payment) => (
            <button
              key={payment.id}
              type="button"
              className="flex w-full items-center justify-between rounded-md border border-border p-2 text-sm hover:bg-muted/50"
              onClick={() => onRemovePayment(payment.id)}
            >
              <span>{paymentMethodLabels[payment.method]}</span>
              <span className="font-semibold">{formatCurrency(payment.amountCents)}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="ghost" size="sm" onClick={() => onFillRemaining('cash')}>Completar dinheiro</Button>
          <Button variant="ghost" size="sm" onClick={() => onFillRemaining('pix')}>Completar Pix</Button>
        </div>
      </CardContent>
    </Card>
  );
}
