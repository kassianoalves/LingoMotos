import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { save } from '@tauri-apps/plugin-dialog';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { useFinanceStore } from '@features/finance/stores/finance.store';
import { FinancePeriodFilter } from '@features/finance/components/FinancePeriodFilter';
import { useInventory } from '@features/inventory/queries/inventory.queries';
import { useCustomersStore } from '@features/customers/stores/customers.store';
import { formatCurrency } from '@/utils/formatters';
import { loadReports, toCsv } from '../services/reports.service';
import { serviceClient } from '@shared/api/service-client';
import { PageContainer, ScrollArea } from '@shared/components/layout';

export function ReportsPage() {
  const filters = useFinanceStore((state) => state.filters);
  const setPeriod = useFinanceStore((state) => state.setPeriod);
  const setCustomPeriod = useFinanceStore((state) => state.setCustomPeriod);
  const inventory = useInventory({ search: '', categoryId: '', supplierId: '', stockStatus: 'all', sortBy: 'name' }).data;
  const customers = useCustomersStore((state) => state.customers);
  const loadCustomers = useCustomersStore((state) => state.loadCustomers);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [toast, setToast] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const reportFilters = useMemo(() => ({ ...filters, paymentMethod, categoryId, supplierId, customerId }), [filters, paymentMethod, categoryId, supplierId, customerId]);
  const reportsQuery = useQuery({
    queryKey: ['reports', reportFilters],
    queryFn: () => loadReports(reportFilters),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const reports = reportsQuery.data as any;

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), toast.tone === 'error' ? 4500 : 3000);
    return () => window.clearTimeout(id);
  }, [toast]);

  const salesRows = reports?.sales?.sales ?? [];
  const lowStockRows = reports?.stock?.lowStock ?? [];
  const outOfStockRows = reports?.stock?.outOfStock ?? [];
  const cashRows = reports?.cash?.movements ?? [];
  const customerRows = reports?.customers?.customers ?? [];
  const valuation = reports?.valuation;
  const profit = reports?.profit?.summary;

  const exportColumnsByKind: Record<string, Array<{ key: string; label: string }>> = {
    vendas: [
      { key: 'saleNumber', label: 'Número da venda' },
      { key: 'soldAt', label: 'Data da venda' },
      { key: 'customerName', label: 'Cliente' },
      { key: 'itemsCount', label: 'Itens' },
      { key: 'paymentMethod', label: 'Forma de pagamento' },
      { key: 'totalCents', label: 'Total' },
      { key: 'costCents', label: 'Custo' },
      { key: 'discountCents', label: 'Desconto' },
      { key: 'status', label: 'Status' },
    ],
    'mais-vendidos': [
      { key: 'productName', label: 'Produto' },
      { key: 'quantity', label: 'Quantidade' },
      { key: 'totalCents', label: 'Total' },
    ],
    'estoque-baixo': [
      { key: 'sku', label: 'SKU / Código interno' },
      { key: 'name', label: 'Produto' },
      { key: 'currentStockQuantity', label: 'Estoque atual' },
      { key: 'minStockQuantity', label: 'Estoque mínimo' },
    ],
    'sem-estoque': [
      { key: 'sku', label: 'SKU / Código interno' },
      { key: 'name', label: 'Produto' },
      { key: 'currentStockQuantity', label: 'Estoque atual' },
      { key: 'minStockQuantity', label: 'Estoque mínimo' },
    ],
    lucro: [
      { key: 'grossProfitCents', label: 'Lucro bruto' },
      { key: 'revenueTotalCents', label: 'Receita total' },
      { key: 'expensesTotalCents', label: 'Despesas totais' },
      { key: 'estimatedNetProfitCents', label: 'Lucro líquido estimado' },
    ],
    caixa: [
      { key: 'occurredAt', label: 'Data' },
      { key: 'description', label: 'Descrição' },
      { key: 'movementType', label: 'Tipo' },
      { key: 'source', label: 'Origem' },
      { key: 'direction', label: 'Direção' },
      { key: 'amountCents', label: 'Valor' },
      { key: 'paymentMethod', label: 'Forma de pagamento' },
      { key: 'status', label: 'Status' },
    ],
    despesas: [{ key: 'expensesTotalCents', label: 'Despesas totais' }],
    clientes: [
      { key: 'name', label: 'Cliente' },
      { key: 'purchaseCount', label: 'Quantidade de compras' },
      { key: 'totalCents', label: 'Total comprado' },
    ],
    'estoque-valorizado': [
      { key: 'sku', label: 'SKU / Código interno' },
      { key: 'name', label: 'Produto' },
      { key: 'currentStockQuantity', label: 'Estoque atual' },
      { key: 'costPriceCents', label: 'Preço de custo' },
      { key: 'salePriceCents', label: 'Preço de venda' },
    ],
    'produtos-inativos': [
      { key: 'sku', label: 'SKU / Código interno' },
      { key: 'name', label: 'Produto' },
      { key: 'status', label: 'Status' },
    ],
  };

  async function exportRows(kind: string, rows: Array<Record<string, unknown>>, format: 'csv' | 'json') {
    const date = new Date().toISOString().slice(0, 10);
    const fileName = `relatorio-${kind}-${date}.${format}`;
    try {
      const filePath = await save({
        defaultPath: fileName,
        filters: format === 'csv'
          ? [{ name: 'CSV', extensions: ['csv'] }]
          : [{ name: 'JSON', extensions: ['json'] }],
      });

      if (!filePath) {
        return;
      }

      const columns = exportColumnsByKind[kind] ?? [{ key: 'registro', label: 'Registro' }];
      const exportRows = rows.map((row) =>
        Object.fromEntries(columns.map((column) => [column.label, row[column.key] ?? ''])),
      );
      const content = format === 'csv'
        ? toCsv(exportRows, columns.map((column) => column.label))
        : JSON.stringify(rows, null, 2);
      const command = format === 'csv' ? 'export_report_csv' : 'export_report_json';
      await serviceClient.execute(command, { filePath, content });
      setToast({ tone: 'success', message: 'Relatorio exportado com sucesso.' });
    } catch {
      setToast({ tone: 'error', message: 'Nao foi possivel salvar o relatorio no local escolhido.' });
    }
  }

  return (
    <PageContainer className="gap-4">
      <div className="flex-none space-y-2">
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex-shrink-0">
            <FinancePeriodFilter filters={filters} onPeriodChange={setPeriod} onCustomPeriodChange={setCustomPeriod} />
          </div>
          <select className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
            <option value="">Todas formas</option>
            <option value="cash">Dinheiro</option>
            <option value="pix">PIX</option>
            <option value="debit_card">Debito</option>
            <option value="credit_card">Credito</option>
            <option value="bank_transfer">Transferencia</option>
          </select>
          <select className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
            <option value="">Todas categorias</option>
            {inventory?.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
          <select className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={supplierId} onChange={(event) => setSupplierId(event.target.value)}>
            <option value="">Todos fornecedores</option>
            {inventory?.suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
          </select>
          <select className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
            <option value="">Todos clientes</option>
            {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
          </select>
        </div>
      </div>
      <ScrollArea className="grid gap-4 xl:grid-cols-3">
        <ReportCard title="Vendas por periodo" value={`${salesRows.length} vendas`} rows={salesRows} onExport={exportRows} kind="vendas" />
        <ReportCard title="Produtos mais vendidos" value={`${reports?.sales?.topProducts?.length ?? 0} produtos`} rows={reports?.sales?.topProducts ?? []} onExport={exportRows} kind="mais-vendidos" />
        <ReportCard title="Produtos com estoque baixo" value={`${lowStockRows.length} itens`} rows={lowStockRows} onExport={exportRows} kind="estoque-baixo" />
        <ReportCard title="Produtos sem estoque" value={`${outOfStockRows.length} itens`} rows={outOfStockRows} onExport={exportRows} kind="sem-estoque" />
        <ReportCard title="Lucro por periodo" value={formatCurrency(profit?.grossProfitCents ?? 0)} rows={profit ? [profit] : []} onExport={exportRows} kind="lucro" />
        <ReportCard title="Movimentacoes de caixa" value={`${cashRows.length} movimentos`} rows={cashRows} onExport={exportRows} kind="caixa" />
        <ReportCard title="Despesas por periodo" value={formatCurrency(profit?.expensesTotalCents ?? 0)} rows={profit ? [profit] : []} onExport={exportRows} kind="despesas" />
        <ReportCard title="Clientes com compras" value={`${customerRows.length} clientes`} rows={customerRows} onExport={exportRows} kind="clientes" />
        <ReportCard title="Estoque valorizado" value={formatCurrency(valuation?.costTotalCents ?? 0)} rows={valuation?.products ?? []} onExport={exportRows} kind="estoque-valorizado" />
        <ReportCard title="Produtos inativos/removidos" value={`${reports?.stock?.inactiveProducts?.length ?? 0} itens`} rows={reports?.stock?.inactiveProducts ?? []} onExport={exportRows} kind="produtos-inativos" />
      </ScrollArea>
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 rounded-md px-4 py-3 text-sm shadow-lg ${
          toast.tone === 'success' ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'
        }`}>
          {toast.message}
        </div>
      )}
    </PageContainer>
  );
}

function ReportCard({ title, value, rows, onExport, kind }: {
  title: string;
  value: string;
  rows: Array<Record<string, unknown>>;
  kind: string;
  onExport: (kind: string, rows: Array<Record<string, unknown>>, format: 'csv' | 'json') => Promise<void>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xl font-semibold">{value}</p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => void onExport(kind, rows, 'csv')}>
            <Download className="h-4 w-4" />
            CSV
          </Button>
          <Button size="sm" variant="outline" onClick={() => void onExport(kind, rows, 'json')}>
            <Download className="h-4 w-4" />
            JSON
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
