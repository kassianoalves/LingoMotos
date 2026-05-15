import { useCallback, useMemo, useRef, useState } from 'react';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent } from '@shared/components/ui/card';
import { CartPanel } from '../components/CartPanel';
import { PaymentPanel } from '../components/PaymentPanel';
import { ProductSearchPanel } from '../components/ProductSearchPanel';
import { SaleSummaryPanel } from '../components/SaleSummaryPanel';
import { usePosKeyboardShortcuts } from '../hooks/usePosKeyboardShortcuts';
import { useCheckoutSale, usePosProducts } from '../queries/pos.queries';
import { posService } from '../services/pos.service';
import { usePosStore } from '../stores/pos.store';
import type { PosCheckoutResult } from '../types/pos.types';
import { calculateCartTotals } from '../utils/pos-calculations';

export function PosPage({ cashOpen }: { cashOpen: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [checkoutResult, setCheckoutResult] = useState<PosCheckoutResult | null>(null);
  const search = usePosStore((state) => state.search);
  const items = usePosStore((state) => state.items);
  const payments = usePosStore((state) => state.payments);
  const selectedIndex = usePosStore((state) => state.selectedIndex);
  const lastError = usePosStore((state) => state.lastError);
  const setSearch = usePosStore((state) => state.setSearch);
  const setSelectedIndex = usePosStore((state) => state.setSelectedIndex);
  const addProduct = usePosStore((state) => state.addProduct);
  const removeItem = usePosStore((state) => state.removeItem);
  const updateQuantity = usePosStore((state) => state.updateQuantity);
  const updateDiscount = usePosStore((state) => state.updateDiscount);
  const addPayment = usePosStore((state) => state.addPayment);
  const removePayment = usePosStore((state) => state.removePayment);
  const fillRemainingPayment = usePosStore((state) => state.fillRemainingPayment);
  const clearSale = usePosStore((state) => state.clearSale);
  const setLastError = usePosStore((state) => state.setLastError);
  const productsQuery = usePosProducts(search);
  const checkoutSale = useCheckoutSale();
  const products = productsQuery.data ?? [];
  const totals = useMemo(() => calculateCartTotals(items, payments), [items, payments]);

  const focusSearch = useCallback(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleClearSale = useCallback(() => {
    clearSale();
    setCheckoutResult(null);
    setPaymentAmount('');
    focusSearch();
  }, [clearSale, focusSearch]);

  const handleCheckout = useCallback(async () => {
    setCheckoutResult(null);
    setLastError('');

    const response = await checkoutSale.mutateAsync({ items, payments });

    if (!response.ok) {
      setLastError(response.errors[0] ?? 'Venda invalida.');
      return;
    }

    setCheckoutResult(response.result);
    clearSale();
    setPaymentAmount('');
    focusSearch();
  }, [checkoutSale, clearSale, focusSearch, items, payments, setLastError]);

  usePosKeyboardShortcuts({
    onClearSale: handleClearSale,
    enabled: cashOpen,
  });

  async function handleSearchChange(value: string) {
    setSearch(value);

    const looksLikeBarcode = /^\d{8,14}$/.test(value.trim());

    if (looksLikeBarcode) {
      const product = await posService.findProductByBarcodeOrSku(value);

      if (product) {
        addProduct(product);
      }
    }
  }

  if (!cashOpen) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold">Venda bloqueada</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Caixa fechado. Abra o caixa para iniciar vendas, baixar estoque por venda ou receber pagamentos.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Venda balcão</h2>
          <p className="text-sm text-muted-foreground">
            Busca instantânea, leitor de código de barras, carrinho e pagamento em poucos passos.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="success">Caixa aberto</Badge>
          <Badge variant="secondary">Offline local</Badge>
          <Button variant="outline" size="sm" onClick={focusSearch}>Focar busca</Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(360px,0.9fr)_minmax(480px,1.1fr)_360px]">
        <ProductSearchPanel
          inputRef={inputRef}
          query={search}
          products={products}
          selectedIndex={selectedIndex}
          onQueryChange={(value) => void handleSearchChange(value)}
          onSelectedIndexChange={setSelectedIndex}
          onAddProduct={(product) => {
            addProduct(product);
            setCheckoutResult(null);
            focusSearch();
          }}
        />

        <CartPanel
          items={items}
          onQuantityChange={updateQuantity}
          onDiscountChange={updateDiscount}
          onRemove={removeItem}
        />

        <div className="space-y-4">
          <SaleSummaryPanel
            totals={totals}
            lastError={lastError}
            checkoutResult={checkoutResult}
            onCheckout={handleCheckout}
            onClear={handleClearSale}
            pending={checkoutSale.isPending}
          />
          <PaymentPanel
            payments={payments}
            totals={totals}
            paymentAmount={paymentAmount}
            onPaymentAmountChange={setPaymentAmount}
            onAddPayment={addPayment}
            onFillRemaining={fillRemainingPayment}
            onRemovePayment={removePayment}
          />
        </div>
      </div>
    </div>
  );
}
