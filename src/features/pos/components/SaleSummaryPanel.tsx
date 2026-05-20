import { CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import type { CartTotals, PaymentLine, PosCheckoutResult, PosPaymentMethod, SaleDiscountInput } from '../types/pos.types';
import { formatCurrency, paymentMethodLabels } from '../utils/pos-calculations';
import { parseBRLInputToCents } from '@/utils/numberFormat';

type SaleSummaryPanelProps = {
  totals: CartTotals;
  lastError: string;
  checkoutResult: PosCheckoutResult | null;
  onCheckout: () => void;
  onClear: () => void;
  onGeneratePix: () => void;
  pending: boolean;
  pixConfigured: boolean;
  payments: PaymentLine[];
  paymentMethod: PosPaymentMethod;
  creditInstallments: number;
  paymentAmount?: string;
  saleDiscount?: SaleDiscountInput;
};

export function SaleSummaryPanel({
  totals,
  lastError,
  checkoutResult,
  onCheckout,
  onClear,
  onGeneratePix,
  pending,
  pixConfigured,
  payments = [],
  paymentMethod,
  creditInstallments,
  paymentAmount = '',
  saleDiscount,
}: SaleSummaryPanelProps) {
  const hasProducts = totals.subtotalCents > 0;
  const paymentCents = parseBRLInputToCents(paymentAmount);
  const lastPayment = [...payments].reverse()[0];
  const paymentBaseCents = lastPayment?.baseAmountCents ?? paymentCents;
  
  // Usa o pagamento adicionado se existir, senão usa o input atual
  const baseSubtotalCents = paymentBaseCents > 0 ? paymentBaseCents : totals.subtotalCents;
  
  // Se não há produtos mas há valor (recebido ou adicionado como pagamento) e desconto, calcular baseado nele
  const displaySubtotalCents = !hasProducts && baseSubtotalCents > 0 ? baseSubtotalCents : totals.subtotalCents;
  const displayDiscountCents = !hasProducts && baseSubtotalCents > 0 && saleDiscount?.type === 'percentage'
    ? Math.round((baseSubtotalCents * (saleDiscount.percentage || 0)) / 100)
    : totals.saleDiscountCents;
  const displayTotalCents = Math.max(displaySubtotalCents - displayDiscountCents, 0);

  const paymentTypes = [...new Set(payments.map((payment) => {
    const label = paymentMethodLabels[payment.method];

    if (payment.method === 'credit_card' && payment.installments && payment.installments > 1) {
      return `${label} ${payment.installments}x`;
    }

    return label;
  }))];
  const paymentTypeLabel = paymentTypes.length > 0 ? paymentTypes.join(' + ') : 'Não informado';
  const activeCreditPayment = [...payments].reverse().find((payment) => payment.method === 'credit_card');
  const activeInstallments = activeCreditPayment?.installments ?? (paymentMethod === 'credit_card' ? creditInstallments : 1);
  const activeInstallmentAmountCents = Math.round(displayTotalCents / Math.max(activeInstallments, 1));
  const installmentsLabel = activeInstallments > 1
    ? `${activeInstallments}x de ${formatCurrency(activeInstallmentAmountCents)}`
    : '1x';
  
  // Calcular pago e troco baseado no total com desconto
  const paidCents = hasProducts ? totals.paidCents : (displayTotalCents > 0 ? displayTotalCents : 0);
  const changeCents = Math.max(paidCents - displayTotalCents, 0);

  return (
    <Card className="flex min-h-0 flex-1 flex-col">
      <CardHeader className="space-y-0 p-3 pb-2 compact:p-2">
        <CardTitle className="text-sm">Resumo da venda</CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden p-3 pt-0 compact:p-2">
        <div className="min-h-0 flex-1 space-y-2 overflow-auto pr-1">
          <div className="rounded-md border border-border bg-muted/20 p-3 compact:p-2">
            <div className="space-y-2 text-sm">
              <SummaryRow label="Subtotal" value={formatCurrency(displaySubtotalCents)} />
              <SummaryRow label="Desconto" value={formatCurrency(displayDiscountCents)} />
              <SummaryRow label="Tipo de pagamento" value={paymentTypeLabel} />
              <SummaryRow label="Parcelas" value={activeInstallments > 1 || paymentMethod === 'credit_card' ? installmentsLabel : '1x'} />

              <div className="my-2 border-t border-border/60" />

              <SummaryRow label="Total" value={formatCurrency(displayTotalCents)} strong />

              <div className="my-2 border-t border-border/60" />

              <SummaryRow label="Pago" value={formatCurrency(paidCents)} />
              <SummaryRow label="Troco" value={formatCurrency(changeCents)} />
            </div>
          </div>

          {lastError && (
            <div className="flex gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <XCircle className="h-4 w-4" />
              <span>{lastError}</span>
            </div>
          )}

          {checkoutResult && (
            <div className="space-y-3 rounded-md border border-success/30 bg-success/10 p-3 text-sm text-success">
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="h-4 w-4" />
                Venda {checkoutResult.saleNumber} finalizada
              </div>
              <p className="mt-1">
                {formatCurrency(checkoutResult.totalCents)} - margem {checkoutResult.marginPercent.toFixed(1)}%
              </p>
              {pixConfigured ? (
                <Button type="button" size="sm" onClick={onGeneratePix}>Gerar QR PIX</Button>
              ) : (
                <p className="text-xs">Configure a chave PIX nas Configuracoes da loja.</p>
              )}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 mt-2 grid grid-cols-2 gap-2 border-t border-border/60 bg-card pt-2">
          <Button className="h-9 min-w-0 px-2" variant="outline" onClick={onClear}>Cancelar</Button>
          <Button className="h-9 min-w-0 px-2" onClick={onCheckout} disabled={pending}>Finalizar venda</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={strong ? 'font-semibold text-foreground' : 'text-muted-foreground'}>{label}</span>
      <span className={strong ? 'text-base font-bold text-foreground' : 'font-semibold text-foreground'}>{value}</span>
    </div>
  );
}
