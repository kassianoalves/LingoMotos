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
  interestRate: string;
  onInterestRateChange: (value: string) => void;
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
  interestRate,
  onInterestRateChange,
  discountInput,
  onDiscountInputChange,
  onAddPayment,
  onRemovePayment,
}: PaymentPanelProps) {
  const isCreditCard = method === 'credit_card';

  const finalInterestRate = Number(interestRate.replace(',', '.'));

  function addPayment() {
    const baseAmount = parseBRLInputToCents(paymentAmount);
    if (baseAmount <= 0) return;

    const interestPercent = isCreditCard && Number.isFinite(finalInterestRate) && finalInterestRate > 0 ? finalInterestRate : 0;
    const finalAmount = isCreditCard && interestPercent > 0 ? Math.round(baseAmount + (baseAmount * interestPercent) / 100) : baseAmount;

    onAddPayment(method, finalAmount, isCreditCard ? { installments, interestRatePercent: interestPercent, baseAmountCents: baseAmount } : { baseAmountCents: baseAmount });
    onPaymentAmountChange('');
  }

  const handleMethodChange = (value: PosPaymentMethod) => {
    onMethodChange(value);

    if (value !== 'credit_card') {
      onInstallmentsChange(1);
      onInterestRateChange('');
    }
  };

  return (
    <Card className="flex min-h-0 flex-none flex-col">
      <CardHeader className="space-y-1 p-3 pb-2">
        <CardTitle>Pagamento</CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col space-y-2.5 p-3 pt-0">
        <div className="grid gap-2 grid-cols-[1fr_minmax(0,150px)_auto] items-end">
          <Input
            value={paymentAmount}
            onChange={(event) => onPaymentAmountChange(formatBRLInput(event.target.value))}
            placeholder="R$ 0,00"
            inputMode="decimal"
            className="h-9"
          />
          <select
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            value={method}
            onChange={(event) => handleMethodChange(event.target.value as PosPaymentMethod)}
          >
            {methods.map((item) => <option key={item} value={item}>{paymentMethodLabels[item]}</option>)}
          </select>
          <Button className="h-9 px-3" onClick={addPayment} disabled={parseBRLInputToCents(paymentAmount) <= 0}>Adicionar</Button>
        </div>

        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div className="flex items-center gap-2 justify-end">
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
              className="h-9 w-20"
            />
          </div>

          {isCreditCard ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">Parcelas</label>
                <select
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm"
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
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">Juros %</label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={interestRate}
                  onChange={(event) => onInterestRateChange(event.target.value)}
                  placeholder="0"
                  inputMode="decimal"
                  className="h-9 w-20"
                />
              </div>
            </div>
          ) : (
            <div />
          )}
        </div>

        <div className="min-h-0 max-h-28 space-y-2 overflow-auto pr-1">
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
