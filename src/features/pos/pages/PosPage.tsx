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
import type { PosCheckoutResult, PosPaymentMethod } from '../types/pos.types';
import { calculateCartTotals } from '../utils/pos-calculations';
import { useCustomersStore } from '@features/customers/stores/customers.store';
import { usePosCustomerStore } from '../stores/pos-customer.store';
import { useEffect } from 'react';
import { CustomerFormModal, emptyCustomer } from '@features/customers/components/CustomerFormModal';
import type { SaleDiscountInput } from '../types/pos.types';
import { useStoreSettingsStore } from '@shared/stores/store-settings.store';
import { QrCodeModal } from '@shared/components/QrCodeModal';
import { buildPixPayload } from '@/utils/pix';

export function PosPage({ cashOpen }: { cashOpen: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PosPaymentMethod>('cash');
  const [creditInstallments, setCreditInstallments] = useState(1);
  const [creditInterestRate, setCreditInterestRate] = useState('');
  const [checkoutResult, setCheckoutResult] = useState<PosCheckoutResult | null>(null);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [discountInput, setDiscountInput] = useState('');
  const [saleDiscount, setSaleDiscount] = useState<SaleDiscountInput | undefined>(undefined);
  const [pixQr, setPixQr] = useState<string | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const customers = useCustomersStore((state) => state.customers);
  const saveCustomer = useCustomersStore((state) => state.saveCustomer);
  const loadCustomers = useCustomersStore((state) => state.loadCustomers);
  const selectedCustomer = usePosCustomerStore((state) => state.selectedCustomer);
  const selectCustomer = usePosCustomerStore((state) => state.selectCustomer);
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
  const addPayment = usePosStore((state) => state.addPayment);
  const removePayment = usePosStore((state) => state.removePayment);
  const clearSale = usePosStore((state) => state.clearSale);
  const setLastError = usePosStore((state) => state.setLastError);
  const productsQuery = usePosProducts(debouncedSearch);
  const checkoutSale = useCheckoutSale();
  const products = productsQuery.data ?? [];
  const storeSettings = useStoreSettingsStore((state) => state.settings);
  const pixConfigured = Boolean(storeSettings.pixKey.trim() && storeSettings.pixReceiverName.trim() && storeSettings.pixReceiverCity.trim());
  const totals = useMemo(() => calculateCartTotals(items, payments, saleDiscount), [items, payments, saleDiscount]);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(search), 120);
    return () => window.clearTimeout(id);
  }, [search]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(''), 3000);
    return () => window.clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    const parsed = Number(discountInput.replace(',', '.'));

    if (discountInput.trim() === '') {
      setSaleDiscount(undefined);
      return;
    }

    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
      return;
    }

    setSaleDiscount(parsed === 0 ? undefined : { type: 'percentage', percentage: parsed });
  }, [discountInput]);

  const focusSearch = useCallback(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleClearSale = useCallback(() => {
    clearSale();
    setCheckoutResult(null);
    setPaymentAmount('');
    setDiscountInput('');
    setSaleDiscount(undefined);
    focusSearch();
  }, [clearSale, focusSearch]);

  const handleApplySaleDiscount = useCallback(() => {
    const parsed = Number(discountInput.replace(',', '.'));

    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
      setToast('Informe um desconto valido entre 0 e 100.');
      return;
    }

    setToast(parsed === 0 ? 'Desconto removido da venda.' : `Desconto de ${parsed}% aplicado.`);
  }, [discountInput]);

  const handleCheckout = useCallback(async () => {
    setCheckoutResult(null);
    setLastError('');

    const response = await checkoutSale.mutateAsync({ items, payments, customerId: selectedCustomer?.id, saleDiscount });

    if (!response.ok) {
      setLastError(response.errors[0] ?? 'Venda invalida.');
      return;
    }

    setCheckoutResult(response.result);
    setToast('Venda finalizada com sucesso.');
    clearSale();
    setPaymentAmount('');
    setDiscountInput('');
    setSaleDiscount(undefined);
    focusSearch();
  }, [checkoutSale, clearSale, focusSearch, items, payments, selectedCustomer?.id, setLastError, saleDiscount]);

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
      <div className="px-6 pb-6 pt-4">
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
    <div className="flex h-[calc(100vh-4rem)] min-h-0 flex-col overflow-hidden px-6 pb-6 pt-3">

      <div className="flex items-center gap-2 -mx-6 -mt-3 px-6 pt-3 pb-4 border-b border-border bg-card">
        <label className="flex items-center gap-2 text-sm min-w-fit">
          <span className="text-xs font-medium whitespace-nowrap">Cliente</span>
          <select
            className="h-8 rounded-md border border-input bg-background px-2 text-sm"
            value={selectedCustomer?.id ?? ''}
            onChange={(event) => selectCustomer(customers.find((customer) => customer.id === event.target.value) ?? null)}
          >
            <option value="">Selecionar</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>{customer.name}</option>
            ))}
          </select>
        </label>
        <Button variant="outline" size="sm" onClick={() => setCustomerModalOpen(true)} className="h-8">
          Criar cliente
        </Button>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 mt-4 xl:grid-cols-[minmax(300px,0.8fr)_minmax(420px,1fr)_minmax(300px,0.7fr)]">
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
          onRemove={removeItem}
        />

        <div className="flex min-h-0 flex-col gap-4">
          <PaymentPanel
            payments={payments}
            paymentAmount={paymentAmount}
            onPaymentAmountChange={setPaymentAmount}
            method={paymentMethod}
            onMethodChange={setPaymentMethod}
            installments={creditInstallments}
            onInstallmentsChange={setCreditInstallments}
            interestRate={creditInterestRate}
            onInterestRateChange={setCreditInterestRate}
            discountInput={discountInput}
            onDiscountInputChange={(value) => setDiscountInput(value.replace(/[^\d,.]/g, ''))}
            onAddPayment={(method, amountCents, options) => {
              addPayment(method, amountCents, options);
            }}
            onRemovePayment={removePayment}
          />
          <SaleSummaryPanel
            totals={totals}
            lastError={lastError}
            checkoutResult={checkoutResult}
            onCheckout={handleCheckout}
            onClear={handleClearSale}
            pending={checkoutSale.isPending}
            pixConfigured={pixConfigured}
            payments={payments}
            paymentMethod={paymentMethod}
            creditInstallments={creditInstallments}
            creditInterestRate={creditInterestRate}
            paymentAmount={paymentAmount}
            saleDiscount={saleDiscount}
            onGeneratePix={() => {
              if (!checkoutResult || !pixConfigured) return;
              try {
                setPixQr(buildPixPayload({
                  key: storeSettings.pixKey,
                  receiverName: storeSettings.pixReceiverName,
                  receiverCity: storeSettings.pixReceiverCity,
                  amount: checkoutResult.totalCents / 100,
                  description: 'Venda LingoMotos',
                }));
              } catch {
                setToast('Nao foi possivel gerar o QR PIX.');
              }
            }}
          />
        </div>
      </div>
      {customerModalOpen && (
        <CustomerFormModal
          customer={emptyCustomer()}
          onClose={() => setCustomerModalOpen(false)}
          onSave={async (customer) => {
            const saved = await saveCustomer(customer);
            selectCustomer(saved);
            setCustomerModalOpen(false);
            setToast('Cliente salvo com sucesso.');
          }}
        />
      )}
      {toast && <div className="fixed bottom-5 right-5 z-50 rounded-md bg-success px-4 py-3 text-sm text-success-foreground shadow-lg">{toast}</div>}
      {pixQr && (
        <QrCodeModal
          title="QR PIX"
          description="Escaneie ou copie o codigo PIX para receber esta venda."
          value={pixQr}
          fileName="pix-venda.svg"
          onClose={() => setPixQr(null)}
        />
      )}
    </div>
  );
}
