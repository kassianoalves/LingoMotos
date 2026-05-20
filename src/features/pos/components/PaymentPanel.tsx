import { X } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Input } from '@shared/components/ui/input';
import type { PaymentLine, PosPaymentMethod } from '../types/pos.types';
import { formatCurrency, paymentMethodLabels } from '../utils/pos-calculations';
import { formatBRLInput, parseBRLInputToCents } from '@/utils/numberFormat';

type PaymentPanelProps = {
  payments: PaymentLine[];
  paymentAmount: string;
  onPaymentAmountChange: (value: string) => void;
  method: PosPaymentMethod;
  onMethodChange: (value: PosPaymentMethod) => void;
  installments: number;
  onInstallmentsChange: (value: number) => void;
  discountInput: string;
  onDiscountInputChange: (value: string) => void;
  onAddPayment: (method: PosPaymentMethod, amountCents: number, options?: { installments?: number; interestRatePercent?: number; baseAmountCents?: number }) => void;
  onRemovePayment: (paymentId: string) => void;
};

const methods: PosPaymentMethod[] = ['cash', 'pix', 'debit_card', 'credit_card'];

const installmentOptions = Array.from({ length: 12 }, (_, index) => index + 1);

export function PaymentPanel({
  payments,
  paymentAmount,
  onPaymentAmountChange,
  method,
  onMethodChange,
  installments,
  onInstallmentsChange,
  discountInput,
  onDiscountInputChange,
  onAddPayment,
  onRemovePayment,
}: PaymentPanelProps) {
  const isCreditCard = method === 'credit_card';
  const discountPercent = parseDiscountPercent(discountInput);

  function addPayment() {
    const baseAmount = parseBRLInputToCents(paymentAmount);
    if (baseAmount <= 0) return;
    const finalAmount = Math.max(baseAmount - Math.round((baseAmount * discountPercent) / 100), 0);

    onAddPayment(method, finalAmount, isCreditCard ? { installments, interestRatePercent: 0, baseAmountCents: baseAmount } : { baseAmountCents: baseAmount });
    onPaymentAmountChange('');
  }

  const handleMethodChange = (value: PosPaymentMethod) => {
    onMethodChange(value);

    if (value !== 'credit_card') {
      onInstallmentsChange(1);
    }
  };

  return (
    <Card className="flex min-h-0 flex-none flex-col">
      <CardHeader className="space-y-0 p-3 pb-2 compact:p-2">
        <CardTitle className="text-sm">Pagamento</CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col space-y-1.5 p-2 pt-0">
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(118px,140px)] items-end gap-1.5">
          <Input
            value={paymentAmount}
            onChange={(event) => onPaymentAmountChange(formatBRLInput(event.target.value))}
            placeholder="R$ 0,00"
            inputMode="decimal"
            className="h-8"
          />
          <select
            className="h-8 rounded-md border border-input bg-background px-2 text-sm"
            value={method}
            onChange={(event) => handleMethodChange(event.target.value as PosPaymentMethod)}
          >
            {methods.map((item) => <option key={item} value={item}>{paymentMethodLabels[item]}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-[auto_58px_minmax(86px,1fr)_auto] items-center gap-1.5">
          <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">Desconto %</label>
            <Input
              type="number"
              min={0}
              max={100}
              step="0.01"
              value={discountInput}
              onChange={(event) => onDiscountInputChange(event.target.value)}
              placeholder="0"
              inputMode="decimal"
              className="h-8 px-2"
            />

          {isCreditCard ? (
            <div className="flex min-w-0 items-center justify-end gap-1.5">
              <div className="flex min-w-0 items-center gap-1.5">
                <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">Parcelas</label>
                <select
                  className="h-8 min-w-0 rounded-md border border-input bg-background px-2 text-sm"
                  value={installments}
                  onChange={(event) => onInstallmentsChange(Number(event.target.value))}
                >
                  {installmentOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}x
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div />
          )}
          <Button className="h-8 px-2 text-xs" size="sm" onClick={addPayment} disabled={parseBRLInputToCents(paymentAmount) <= 0}>Adicionar</Button>
        </div>

        <div className="min-h-0 max-h-20 space-y-1.5 overflow-auto pr-1 compact:max-h-20">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="flex w-full items-center justify-between gap-2 rounded-md border border-border p-2 text-sm hover:bg-muted/50"
            >
              <div className="min-w-0">
                <span className="block truncate">{payment.method === 'credit_card' && payment.installments ? `${paymentMethodLabels[payment.method]} ${payment.installments}x` : paymentMethodLabels[payment.method]}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{formatCurrency(payment.amountCents)}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => onRemovePayment(payment.id)}
                  aria-label={`Excluir valor de ${paymentMethodLabels[payment.method]}`}
                  title="Excluir valor"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function parseDiscountPercent(value: string) {
  const parsed = Number(value.replace(',', '.'));
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return Math.min(parsed, 100);
}
