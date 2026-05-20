import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ArrowRight, Boxes, PackagePlus, Plus, ShoppingCart, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Button } from '@shared/components/ui/button';
import { Badge } from '@shared/components/ui/badge';
import { useFinancialGoalsStore } from '@features/finance/stores/financial-goals.store';
import { useInventoryStore } from '@features/inventory/stores/inventory.store';
import { formatCurrency } from '@/utils/formatters';
import { loadHomeDashboard } from '../services/home.service';
import { PageContainer } from '@shared/components/layout';

type HomePageProps = {
  navigate?: (path: string) => void;
};

const paymentLabels: Record<string, string> = {
  cash: 'Dinheiro',
  pix: 'PIX',
  debit_card: 'Débito',
  credit_card: 'Crédito',
  bank_transfer: 'Transferência',
  other: 'Outro',
};

export function HomePage({ navigate }: HomePageProps) {
  const activeGoal = useFinancialGoalsStore((state) => state.goals.find((goal) => goal.isActive));
  const loadGoals = useFinancialGoalsStore((state) => state.loadGoals);
  const dashboardQuery = useQuery({ queryKey: ['home-dashboard'], queryFn: loadHomeDashboard });
  const dashboard = dashboardQuery.data;
  const openInventoryModal = useInventoryStore((state) => state.openModal);
  const billedCents = dashboard?.revenueTodayCents ?? 0;
  const goalPercent = activeGoal ? Math.min((billedCents / activeGoal.targetAmountCents) * 100, 100) : 0;
  const maxChartValue = Math.max(...(dashboard?.salesLast7Days.map((day) => day.revenueCents) ?? [0]), 1);
  const alerts = buildAlerts({
    lowStockCount: dashboard?.lowStockCount ?? 0,
    outOfStockCount: dashboard?.outOfStockCount ?? 0,
    dueTodayPayables: dashboard?.dueTodayPayables ?? 0,
    cashOpenedAt: dashboard?.cashOpenedAt ?? null,
  });

  useEffect(() => {
    void loadGoals();
  }, [loadGoals]);

  function go(path: string) {
    navigate?.(path);
  }

  function openCustomerCreate() {
    navigate?.('/clientes');
    window.setTimeout(() => window.dispatchEvent(new CustomEvent('customers:create')), 80);
  }

  function openProductCreate() {
    openInventoryModal('product', null);
    navigate?.('/estoque');
  }

  function openStockMovement() {
    openInventoryModal('movement');
    navigate?.('/estoque');
  }

  return (
    <PageContainer className="gap-3 overflow-hidden">
      <div className="grid flex-none gap-2 max-[1180px]:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Receita hoje" value={formatCurrency(dashboard?.revenueTodayCents ?? 0)} tone="success" meta="Entradas confirmadas" />
        <KpiCard title="Lucro estimado" value={formatCurrency(dashboard?.estimatedProfitCents ?? 0)} tone="success" meta={activeGoal ? `${goalPercent.toFixed(0)}% da meta` : 'Resultado estimado'} />
        <KpiCard title="Vendas hoje" value={`${dashboard?.salesToday ?? 0}`} tone="info" meta="Vendas concluídas" />
        <KpiCard title="Caixa" value={dashboard?.cashOpen ? 'Aberto' : 'Fechado'} tone={dashboard?.cashOpen ? 'success' : 'danger'} meta={dashboard?.cashOpenedAt ? `Desde ${formatTime(dashboard.cashOpenedAt)}` : 'Operação bloqueada'} />
      </div>

      <div className={activeGoal ? 'grid min-h-0 flex-1 gap-3 overflow-hidden xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]' : 'grid min-h-0 flex-1 gap-3 overflow-hidden'}>
        <div className="flex min-h-0 flex-col gap-3 overflow-hidden">
          <Card className="flex-none">
            <CardContent className="flex flex-wrap items-center gap-2 p-3">
              <QuickAction icon={ShoppingCart} label="Nova venda" onClick={() => go('/vendas')} />
              <QuickAction icon={UserPlus} label="Cliente" onClick={openCustomerCreate} />
              <QuickAction icon={Plus} label="Produto" onClick={openProductCreate} />
              <QuickAction icon={PackagePlus} label="Movimentar" onClick={openStockMovement} />
            </CardContent>
          </Card>

          <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <AttentionCard alerts={alerts} navigate={navigate} />
            <LastSaleCard
              label={dashboard?.lastSaleLabel ?? 'Sem vendas'}
              customer={dashboard?.lastSaleCustomerName ?? ''}
              totalCents={dashboard?.lastSaleTotalCents ?? 0}
              time={dashboard?.lastSaleTime ?? null}
              paymentMethod={dashboard?.lastSalePaymentMethod ?? ''}
            />
          </div>

          <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <LowStockCard products={dashboard?.lowStockProducts ?? []} />
            <SalesChart days={dashboard?.salesLast7Days ?? []} maxValue={maxChartValue} />
          </div>
        </div>

        {activeGoal && (
          <div className="flex min-h-0 flex-col gap-3 overflow-hidden">
            <Card className="flex-none">
              <CardHeader className="p-3 pb-2">
                <CardTitle className="text-sm">Meta ativa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 p-3 pt-0">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">Faturado</span>
                  <span className="font-semibold">{formatCurrency(billedCents)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${goalPercent}%` }} />
                </div>
                <p className="text-xs text-muted-foreground">{goalPercent.toFixed(0)}% de {formatCurrency(activeGoal.targetAmountCents)}</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </PageContainer>
  );
}

function KpiCard({ title, value, meta, tone }: { title: string; value: string; meta: string; tone: 'success' | 'info' | 'danger' }) {
  const toneClass = tone === 'success' ? 'text-success' : tone === 'info' ? 'text-primary' : 'text-destructive';
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-3">
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
        <p className={`mt-1 truncate text-2xl font-semibold ${toneClass}`}>{value}</p>
        <p className="mt-1 truncate text-xs text-muted-foreground">{meta}</p>
      </CardContent>
    </Card>
  );
}

function QuickAction({ icon: Icon, label, onClick }: { icon: typeof ShoppingCart; label: string; onClick: () => void }) {
  return (
    <Button type="button" size="sm" variant="outline" className="h-8 gap-2 px-3" onClick={onClick}>
      <Icon className="h-4 w-4" />
      {label}
    </Button>
  );
}

function AttentionCard({
  alerts,
  navigate,
}: {
  alerts: Array<{ label: string; meta: string; target?: string; tone: 'warning' | 'danger' | 'info' }>;
  navigate?: (path: string) => void;
}) {
  return (
    <Card className="flex min-h-0 flex-col overflow-hidden">
      <CardHeader className="p-3 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4 text-warning" />
          Atenção
        </CardTitle>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-auto p-3 pt-0">
        {alerts.length === 0 ? (
          <p className="rounded-md bg-muted/30 p-3 text-sm text-muted-foreground">Tudo certo por enquanto.</p>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert) => (
              <button
                key={alert.label}
                type="button"
                className="flex w-full items-center justify-between gap-3 rounded-md border border-border p-2 text-left text-sm hover:bg-muted/40"
                onClick={() => alert.target && navigate?.(alert.target)}
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{alert.label}</span>
                  <span className="block truncate text-xs text-muted-foreground">{alert.meta}</span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LastSaleCard({ label, customer, totalCents, time, paymentMethod }: { label: string; customer: string; totalCents: number; time: string | null; paymentMethod: string }) {
  const hasSale = totalCents > 0;
  return (
    <Card className="flex min-h-0 flex-col">
      <CardHeader className="p-3 pb-2">
        <CardTitle className="text-sm">Última venda</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 p-3 pt-0">
        {hasSale ? (
          <>
            <p className="truncate text-sm font-medium">{customer || label}</p>
            <p className="text-2xl font-semibold">{formatCurrency(totalCents)}</p>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary">{time ? formatTime(time) : '--:--'}</Badge>
              <Badge variant="outline">{paymentLabels[paymentMethod] ?? 'Pagamento'}</Badge>
            </div>
          </>
        ) : (
          <p className="rounded-md bg-muted/30 p-3 text-sm text-muted-foreground">Sem vendas ainda hoje.</p>
        )}
      </CardContent>
    </Card>
  );
}

function LowStockCard({ products }: { products: Array<{ id: string; name: string; currentStockQuantity: number; minStockQuantity: number; unit: string }> }) {
  return (
    <Card className="flex min-h-0 flex-col overflow-hidden">
      <CardHeader className="p-3 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Boxes className="h-4 w-4 text-warning" />
          Produtos acabando
        </CardTitle>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-auto p-3 pt-0">
        {products.length === 0 ? (
          <p className="rounded-md bg-muted/30 p-3 text-sm text-muted-foreground">Nenhum produto crítico.</p>
        ) : (
          <div className="space-y-2">
            {products.map((product) => (
              <div key={product.id} className="flex items-center justify-between gap-3 rounded-md border border-border p-2 text-sm">
                <span className="truncate font-medium">{product.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {product.currentStockQuantity} / mín. {product.minStockQuantity} {product.unit}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SalesChart({ days, maxValue }: { days: Array<{ date: string; revenueCents: number; salesCount: number }>; maxValue: number }) {
  return (
    <Card className="flex min-h-0 flex-col">
      <CardHeader className="p-3 pb-2">
        <CardTitle className="text-sm">Vendas dos últimos 7 dias</CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 items-end gap-2 p-3 pt-0">
        {days.map((day) => (
          <div key={day.date} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <div className="flex h-28 w-full items-end rounded-md bg-muted/35 px-1">
              <div
                className="w-full rounded-sm bg-primary/80"
                style={{ height: `${Math.max((day.revenueCents / maxValue) * 100, day.revenueCents > 0 ? 8 : 2)}%` }}
                title={formatCurrency(day.revenueCents)}
              />
            </div>
            <span className="text-[11px] text-muted-foreground">{formatDay(day.date)}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function buildAlerts(input: {
  lowStockCount: number;
  outOfStockCount: number;
  dueTodayPayables: number;
  cashOpenedAt: string | null;
}) {
  const alerts: Array<{ label: string; meta: string; target?: string; tone: 'warning' | 'danger' | 'info' }> = [];
  if (input.outOfStockCount > 0) alerts.push({ label: `${input.outOfStockCount} produtos sem estoque`, meta: 'Ver estoque', target: '/estoque', tone: 'danger' });
  if (input.lowStockCount > 0) alerts.push({ label: `${input.lowStockCount} produtos acabando`, meta: 'Reposição urgente', target: '/estoque', tone: 'warning' });
  if (input.dueTodayPayables > 0) alerts.push({ label: `${input.dueTodayPayables} contas vencem hoje`, meta: 'Ver financeiro', target: '/financeiro', tone: 'warning' });
  if (input.cashOpenedAt && openedForHours(input.cashOpenedAt) >= 8) alerts.push({ label: 'Caixa aberto há muito tempo', meta: 'Conferir fechamento', target: '/financeiro', tone: 'warning' });
  return alerts;
}

function openedForHours(value: string) {
  const date = new Date(value.includes('T') ? value : value.replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return 0;
  return (Date.now() - date.getTime()) / 3_600_000;
}

function formatTime(value: string) {
  const date = new Date(value.includes('T') ? value : value.replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return '--:--';
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(date);
}

function formatDay(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(date).replace('.', '');
}
