import { CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import type { CartTotals, PosCheckoutResult } from '../types/pos.types';
import { formatCurrency } from '../utils/pos-calculations';

type SaleSummaryPanelProps = {
  totals: CartTotals;
  lastError: string;
  checkoutResult: PosCheckoutResult | null;
  onCheckout: () => void;
  onClear: () => void;
  pending: boolean;
};

export function SaleSummaryPanel({
  totals,
  lastError,
  checkoutResult,
  onCheckout,
  onClear,
  pending,
}: SaleSummaryPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumo da venda</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Metric label="Subtotal" value={formatCurrency(totals.subtotalCents)} />
        <Metric label="Descontos" value={formatCurrency(totals.discountCents)} />
        <Metric label="Total" value={formatCurrency(totals.totalCents)} strong />
        <Metric label="Lucro bruto" value={formatCurrency(totals.grossProfitCents)} />
        <Metric label="Margem" value={`${totals.marginPercent.toFixed(1)}%`} />
        <Metric label="Pago" value={formatCurrency(totals.paidCents)} />
        <Metric label="Falta" value={formatCurrency(totals.remainingCents)} strong={totals.remainingCents > 0} />
        <Metric label="Troco" value={formatCurrency(totals.changeCents)} />

        {lastError && (
          <div className="flex gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <XCircle className="h-4 w-4" />
            <span>{lastError}</span>
          </div>
        )}

        {checkoutResult && (
          <div className="rounded-md border border-success/30 bg-success/10 p-3 text-sm text-success">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="h-4 w-4" />
              Venda {checkoutResult.saleNumber} finalizada
            </div>
            <p className="mt-1">
              {formatCurrency(checkoutResult.totalCents)} · margem {checkoutResult.marginPercent.toFixed(1)}%
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 pt-2">
          <Button variant="outline" onClick={onClear}>Cancelar Esc</Button>
          <Button onClick={onCheckout} disabled={pending}>Finalizar venda</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={strong ? 'text-lg font-semibold' : 'font-medium'}>{value}</span>
    </div>
  );
}
