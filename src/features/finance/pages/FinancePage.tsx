import { Download, Plus, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent } from '@shared/components/ui/card';
import { Input } from '@shared/components/ui/input';
import { FinancePeriodFilter } from '../components/FinancePeriodFilter';
import { FinancePerformanceChart } from '../components/FinancePerformanceChart';
import { FinanceReportsPanel } from '../components/FinanceReportsPanel';
import { FinanceSummaryCards } from '../components/FinanceSummaryCards';
import { FinanceTables } from '../components/FinanceTables';
import { PaymentMethodsPanel } from '../components/PaymentMethodsPanel';
import { useFinanceDashboard } from '../queries/finance.queries';
import { useFinanceStore } from '../stores/finance.store';
import { formatBrlInput } from '@/utils/formatters';

type EntryType = 'income' | 'expense';

export function FinancePage({ cashOpen = true }: { cashOpen?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [entryType, setEntryType] = useState<EntryType | null>(null);
  const filters = useFinanceStore((state) => state.filters);
  const setPeriod = useFinanceStore((state) => state.setPeriod);
  const setCustomPeriod = useFinanceStore((state) => state.setCustomPeriod);
  const financeQuery = useFinanceDashboard(filters);
  const dashboard = financeQuery.data;

  if (!dashboard) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex h-52 items-center justify-center gap-3 p-6 text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Carregando financeiro local
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Financeiro</h2>
          <p className="text-sm text-muted-foreground">
            Receita, lucro, margem, caixa e compromissos em uma tela simples.
          </p>
        </div>
        <div className="relative flex gap-2">
          <Button onClick={() => setMenuOpen((current) => !current)}>
            <Plus className="h-4 w-4" />
            Adicionar
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4" />
            Exportar relatório
          </Button>
          {menuOpen && (
            <div className="absolute right-24 top-11 z-20 w-40 rounded-md border border-border bg-card p-1 shadow-lg">
              <button className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-muted" onClick={() => openEntry('income')}>
                Receita
              </button>
              <button className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-muted" onClick={() => openEntry('expense')}>
                Despesa
              </button>
            </div>
          )}
        </div>
      </div>

      <FinancePeriodFilter filters={filters} onPeriodChange={setPeriod} onCustomPeriodChange={setCustomPeriod} />
      {!cashOpen && <Badge variant="warning">Lançamentos bloqueados: caixa fechado</Badge>}

      <FinanceSummaryCards summary={dashboard.summary} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.8fr)]">
        <FinancePerformanceChart points={dashboard.performance} />
        <PaymentMethodsPanel payments={dashboard.payments} />
      </div>

      <FinanceReportsPanel reports={dashboard.reports} />
      <FinanceTables sales={dashboard.sales} cashFlow={dashboard.cashFlow} payables={dashboard.payables} receivables={dashboard.receivables} />

      {entryType && <FinanceEntryModal type={entryType} onClose={() => setEntryType(null)} />}
    </div>
  );

  function openEntry(type: EntryType) {
    setMenuOpen(false);
    setEntryType(type);
  }
}

function FinanceEntryModal({ type, onClose }: { type: EntryType; onClose: () => void }) {
  const [amount, setAmount] = useState('');

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-background/80 backdrop-blur-sm">
      <form className="w-[520px] rounded-lg border border-border bg-card p-6 shadow-lg">
        <h3 className="text-base font-semibold">Nova {type === 'income' ? 'receita' : 'despesa'}</h3>
        <div className="mt-5 grid gap-4">
          <Field label="Descrição">
            <Input />
          </Field>
          <Field label="Valor">
            <Input value={amount} onChange={(event) => setAmount(formatBrlInput(event.target.value))} inputMode="decimal" placeholder="0,00" />
          </Field>
          <Field label="Categoria">
            <Input />
          </Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="button" onClick={onClose}>Salvar</Button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}
