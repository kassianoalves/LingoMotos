import { RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@shared/components/ui/card';
import { Input } from '@shared/components/ui/input';
import { FinancePeriodFilter } from '../components/FinancePeriodFilter';
import { TopSellingCategoriesPanel } from '../components/TopSellingCategoriesPanel';
import { FinanceSummaryCards } from '../components/FinanceSummaryCards';
import { FinanceTables } from '../components/FinanceTables';
import { PaymentMethodsPanel } from '../components/PaymentMethodsPanel';
import { useFinanceDashboard } from '../queries/finance.queries';
import { useFinanceStore } from '../stores/finance.store';
import { useFinancialGoalsStore } from '../stores/financial-goals.store';
import { formatBRLInput, parseBRLInputToCents } from '@/utils/numberFormat';
import { financeRepository } from '../repositories/finance.repository';
import type { PayableRecord, ReceivableRecord } from '../types/finance.types';

export function FinancePage({ cashOpen = true }: { cashOpen?: boolean }) {
  const [goalOpen, setGoalOpen] = useState(false);
  const [payableModal, setPayableModal] = useState<PayableRecord | 'new' | null>(null);
  const [receivableModal, setReceivableModal] = useState<ReceivableRecord | 'new' | null>(null);
  const [toast, setToast] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const filters = useFinanceStore((state) => state.filters);
  const setPeriod = useFinanceStore((state) => state.setPeriod);
  const setCustomPeriod = useFinanceStore((state) => state.setCustomPeriod);
  const financeQuery = useFinanceDashboard(filters);
  const dashboard = financeQuery.data;
  const saveGoal = useFinancialGoalsStore((state) => state.saveGoal);
  const loadGoals = useFinancialGoalsStore((state) => state.loadGoals);
  const queryClient = useQueryClient();

  useEffect(() => {
    void loadGoals();
  }, [loadGoals]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), toast.tone === 'error' ? 4500 : 3000);
    return () => window.clearTimeout(id);
  }, [toast]);

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
    <div className="space-y-4 px-5 pb-5 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex items-center gap-2">
          <FinancePeriodFilter filters={filters} onPeriodChange={setPeriod} onCustomPeriodChange={setCustomPeriod} />
        </div>
        <Button variant="outline" onClick={() => setGoalOpen(true)}>Criar meta</Button>
      </div>

      {!cashOpen && <Badge variant="warning">Lancamentos bloqueados: caixa fechado</Badge>}

      <FinanceSummaryCards summary={dashboard.summary} />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(360px,1fr)]">
        <TopSellingCategoriesPanel categories={dashboard.topSellingCategories} />
        <div className="min-w-0 space-y-4">
          <PaymentMethodsPanel payments={dashboard.payments} />
          <RevenueOverview summary={dashboard.summary} />
        </div>
      </div>

      <FinanceTables
        sales={dashboard.sales}
        cashFlow={dashboard.cashFlow}
        payables={dashboard.payables}
        receivables={dashboard.receivables}
        onCreatePayable={() => setPayableModal('new')}
        onCreateReceivable={() => setReceivableModal('new')}
        onEditPayable={(item) => setPayableModal(item)}
        onEditReceivable={(item) => setReceivableModal(item)}
        onDeletePayable={async (item) => {
          if (!window.confirm(`Excluir conta a pagar "${item.description}"?`)) return;
          try {
            await financeRepository.deletePayable(item.id);
            void queryClient.invalidateQueries({ queryKey: ['finance'] });
            setToast({ tone: 'success', message: 'Conta a pagar excluida com sucesso.' });
          } catch {
            setToast({ tone: 'error', message: 'Erro ao excluir conta a pagar.' });
          }
        }}
        onDeleteReceivable={async (item) => {
          if (!window.confirm(`Excluir conta a receber "${item.description}"?`)) return;
          try {
            await financeRepository.deleteReceivable(item.id);
            void queryClient.invalidateQueries({ queryKey: ['finance'] });
            setToast({ tone: 'success', message: 'Conta a receber excluida com sucesso.' });
          } catch {
            setToast({ tone: 'error', message: 'Erro ao excluir conta a receber.' });
          }
        }}
        onMarkPayablePaid={async (item) => {
          if (item.status === 'paid') return;
          try {
            await financeRepository.markPayableAsPaid(item.id);
            void queryClient.invalidateQueries({ queryKey: ['finance'] });
            void queryClient.invalidateQueries({ queryKey: ['reports'] });
            setToast({ tone: 'success', message: 'Conta marcada como paga.' });
          } catch {
            setToast({ tone: 'error', message: 'Erro ao marcar conta como paga.' });
          }
        }}
        onMarkReceivableReceived={async (item) => {
          if (item.status === 'received') return;
          try {
            await financeRepository.markReceivableAsReceived(item.id);
            void queryClient.invalidateQueries({ queryKey: ['finance'] });
            void queryClient.invalidateQueries({ queryKey: ['reports'] });
            setToast({ tone: 'success', message: 'Conta marcada como recebida.' });
          } catch {
            setToast({ tone: 'error', message: 'Erro ao marcar conta como recebida.' });
          }
        }}
      />

      {payableModal && (
        <PayableModal
          initial={payableModal === 'new' ? null : payableModal}
          onClose={() => setPayableModal(null)}
          onSaved={async () => {
            void queryClient.invalidateQueries({ queryKey: ['finance'] });
            void queryClient.invalidateQueries({ queryKey: ['reports'] });
            setToast({ tone: 'success', message: 'Conta a pagar salva com sucesso.' });
            setPayableModal(null);
          }}
          onError={() => setToast({ tone: 'error', message: 'Erro ao salvar conta a pagar.' })}
        />
      )}

      {receivableModal && (
        <ReceivableModal
          initial={receivableModal === 'new' ? null : receivableModal}
          onClose={() => setReceivableModal(null)}
          onSaved={async () => {
            void queryClient.invalidateQueries({ queryKey: ['finance'] });
            void queryClient.invalidateQueries({ queryKey: ['reports'] });
            setToast({ tone: 'success', message: 'Conta a receber salva com sucesso.' });
            setReceivableModal(null);
          }}
          onError={() => setToast({ tone: 'error', message: 'Erro ao salvar conta a receber.' })}
        />
      )}

      {goalOpen && <GoalModal onClose={() => setGoalOpen(false)} onSave={saveGoal} onToast={setToast} />}
      {toast && <Toast toast={toast} />}
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

function GoalModal({
  onClose,
  onSave,
  onToast,
}: {
  onClose: () => void;
  onSave: (goal: {
    id: string;
    name: string;
    type: 'weekly' | 'monthly';
    targetAmountCents: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
  }) => Promise<void>;
  onToast: (toast: { tone: 'success' | 'error'; message: string }) => void;
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'weekly' | 'monthly'>('monthly');
  const [target, setTarget] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-background/80 backdrop-blur-sm">
      <form className="w-[540px] rounded-lg border border-border bg-card p-6 shadow-lg">
        <h3 className="text-base font-semibold">Criar meta</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Nome da meta">
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field label="Tipo">
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={type} onChange={(event) => setType(event.target.value as 'weekly' | 'monthly')}>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensal</option>
            </select>
          </Field>
          <Field label="Valor alvo">
            <Input value={target} onChange={(event) => setTarget(formatBRLInput(event.target.value))} inputMode="decimal" />
          </Field>
          <label className="flex items-center gap-2 pt-7 text-sm">
            <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
            Ativa
          </label>
          <Field label="Data inicial">
            <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          </Field>
          <Field label="Data final">
            <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
          </Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            type="button"
            disabled={!name.trim() || parseBRLInputToCents(target) <= 0 || !startDate || !endDate}
            onClick={async () => {
              try {
                await onSave({
                  id: crypto.randomUUID(),
                  name,
                  type,
                  targetAmountCents: parseBRLInputToCents(target),
                  startDate,
                  endDate,
                  isActive,
                });
                onToast({ tone: 'success', message: 'Meta salva com sucesso.' });
                onClose();
              } catch (error) {
                console.error(error);
                onToast({ tone: 'error', message: 'Erro ao salvar.' });
              }
            }}
          >
            Salvar meta
          </Button>
        </div>
      </form>
    </div>
  );
}

function Toast({ toast }: { toast: { tone: 'success' | 'error'; message: string } }) {
  return (
    <div className={`fixed bottom-5 right-5 z-50 rounded-md px-4 py-3 text-sm shadow-lg ${
      toast.tone === 'success' ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'
    }`}>
      {toast.message}
    </div>
  );
}

function RevenueOverview({
  summary,
}: {
  summary: {
    revenueTodayCents: number;
    grossProfitCents: number;
    cashInCents: number;
    cashOutCents: number;
    costOfGoodsSoldCents?: number;
    estimatedNetProfitCents?: number;
  };
}) {
  const receitaLiquida = summary.revenueTodayCents;
  const custoProdutos = summary.costOfGoodsSoldCents ?? 0;
  const entradas = summary.cashInCents;
  const saidas = summary.cashOutCents;
  const capitalReinvestimento = custoProdutos;
  const lucroLiquidoEstimado =
    summary.estimatedNetProfitCents ?? (receitaLiquida + entradas - saidas - capitalReinvestimento);

  const rows = [
    ['Receita liquida', receitaLiquida],
    ['Custo dos produtos vendidos', custoProdutos],
    ['Entradas', entradas],
    ['Saidas', saidas],
    ['Capital para reinvestimento', capitalReinvestimento],
    ['Lucro liquido estimado', lucroLiquidoEstimado],
  ];

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle>Receita geral</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 sm:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label} className="rounded-md bg-muted/25 p-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-1 text-sm font-semibold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((value as number) / 100)}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function PayableModal({
  initial,
  onClose,
  onSaved,
  onError,
}: {
  initial: PayableRecord | null;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
  onError: () => void;
}) {
  const [description, setDescription] = useState(initial?.description ?? '');
  const [categoryType, setCategoryType] = useState(initial?.categoryType ?? 'geral');
  const [amount, setAmount] = useState(initial ? formatBRLInput(String(initial.amountCents / 100).replace('.', ',')) : '');
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? new Date().toISOString().slice(0, 10));
  const [companyOrSupplier, setCompanyOrSupplier] = useState(initial?.companyOrSupplier ?? '');
  const [recurrenceType, setRecurrenceType] = useState<'unique' | 'monthly'>(initial?.recurrenceType ?? 'unique');

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-background/80 backdrop-blur-sm">
      <form className="w-[640px] rounded-lg border border-border bg-card p-6 shadow-lg" onSubmit={async (event) => {
        event.preventDefault();
        try {
          await financeRepository.savePayable({
            id: initial?.id,
            description,
            categoryType,
            amountCents: parseBRLInputToCents(amount),
            dueDate,
            companyOrSupplier,
            recurrenceType,
          });
          await onSaved();
        } catch {
          onError();
        }
      }}>
        <h3 className="text-base font-semibold">{initial ? 'Editar conta a pagar' : 'Adicionar conta a pagar'}</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Descricao"><Input value={description} onChange={(event) => setDescription(event.target.value)} required /></Field>
          <Field label="Categoria/Tipo"><Input value={categoryType} onChange={(event) => setCategoryType(event.target.value)} required /></Field>
          <Field label="Valor"><Input value={amount} onChange={(event) => setAmount(formatBRLInput(event.target.value))} required /></Field>
          <Field label="Vencimento"><Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} required /></Field>
          <Field label="Empresa/Fornecedor"><Input value={companyOrSupplier} onChange={(event) => setCompanyOrSupplier(event.target.value)} /></Field>
          <Field label="Recorrencia">
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={recurrenceType} onChange={(event) => setRecurrenceType(event.target.value as 'unique' | 'monthly')}>
              <option value="unique">Unica</option>
              <option value="monthly">Mensal</option>
            </select>
          </Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={parseBRLInputToCents(amount) <= 0}>Salvar</Button>
        </div>
      </form>
    </div>
  );
}

function ReceivableModal({
  initial,
  onClose,
  onSaved,
  onError,
}: {
  initial: ReceivableRecord | null;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
  onError: () => void;
}) {
  const [description, setDescription] = useState(initial?.description ?? '');
  const [customer, setCustomer] = useState(initial?.customer ?? '');
  const [amount, setAmount] = useState(initial ? formatBRLInput(String(initial.amountCents / 100).replace('.', ',')) : '');
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? new Date().toISOString().slice(0, 10));
  const [recurrenceType, setRecurrenceType] = useState<'unique' | 'monthly'>(initial?.recurrenceType ?? 'unique');

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-background/80 backdrop-blur-sm">
      <form className="w-[640px] rounded-lg border border-border bg-card p-6 shadow-lg" onSubmit={async (event) => {
        event.preventDefault();
        try {
          await financeRepository.saveReceivable({
            id: initial?.id,
            description,
            customer,
            amountCents: parseBRLInputToCents(amount),
            dueDate,
            recurrenceType,
          });
          await onSaved();
        } catch {
          onError();
        }
      }}>
        <h3 className="text-base font-semibold">{initial ? 'Editar conta a receber' : 'Adicionar conta a receber'}</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Descricao"><Input value={description} onChange={(event) => setDescription(event.target.value)} required /></Field>
          <Field label="Cliente"><Input value={customer} onChange={(event) => setCustomer(event.target.value)} /></Field>
          <Field label="Valor"><Input value={amount} onChange={(event) => setAmount(formatBRLInput(event.target.value))} required /></Field>
          <Field label="Vencimento"><Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} required /></Field>
          <Field label="Recorrencia">
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={recurrenceType} onChange={(event) => setRecurrenceType(event.target.value as 'unique' | 'monthly')}>
              <option value="unique">Unica</option>
              <option value="monthly">Mensal</option>
            </select>
          </Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={parseBRLInputToCents(amount) <= 0}>Salvar</Button>
        </div>
      </form>
    </div>
  );
}
