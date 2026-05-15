import { Download, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent } from '@shared/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@shared/components/ui/table';
import { FinancePeriodFilter } from '../components/FinancePeriodFilter';
import { FinancePerformanceChart } from '../components/FinancePerformanceChart';
import { FinanceReportsPanel } from '../components/FinanceReportsPanel';
import { FinanceSummaryCards } from '../components/FinanceSummaryCards';
import { FinanceTables } from '../components/FinanceTables';
import { PaymentMethodsPanel } from '../components/PaymentMethodsPanel';
import { useFinanceDashboard } from '../queries/finance.queries';
import { useFinanceStore } from '../stores/finance.store';

const financeTabs = ['Visão geral', 'Receitas', 'Despesas', 'Categorias', 'Caixa', 'Relatórios'] as const;

const incomeRows = [
  ['Venda de produtos', 'R$ 3.842,90', 'Recebido', 'Pix/Dinheiro'],
  ['Serviço manual', 'R$ 240,00', 'Recebido', 'Dinheiro'],
  ['Reembolso', 'R$ 80,00', 'Pendente', 'Pix'],
];

const expenseRows = [
  ['Aluguel', 'R$ 1.800,00', 'Pago', 'Transferência'],
  ['Luz', 'R$ 286,40', 'Pendente', 'Pix'],
  ['Fornecedor', 'R$ 864,00', 'Atrasado', 'Boleto'],
  ['Internet', 'R$ 119,90', 'Pago', 'Cartão'],
];

const categoryRows = [
  ['Receita', 'Venda de produtos', 'Sistema'],
  ['Receita', 'Serviço manual', 'Ativa'],
  ['Despesa', 'Água', 'Ativa'],
  ['Despesa', 'Luz', 'Ativa'],
  ['Despesa', 'Aluguel', 'Ativa'],
  ['Despesa', 'Funcionário', 'Ativa'],
  ['Despesa', 'Fornecedor', 'Ativa'],
  ['Despesa', 'Impostos', 'Ativa'],
];

export function FinancePage({ cashOpen = true }: { cashOpen?: boolean }) {
  const [activeTab, setActiveTab] = useState<(typeof financeTabs)[number]>('Visão geral');
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
        <Button variant="outline">
          <Download className="h-4 w-4" />
          Exportar relatorio
        </Button>
      </div>

      <FinancePeriodFilter
        filters={filters}
        onPeriodChange={setPeriod}
        onCustomPeriodChange={setCustomPeriod}
      />

      <div className="flex flex-wrap gap-2">
        {financeTabs.map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </Button>
        ))}
        {!cashOpen && <Badge variant="warning">Lançamentos bloqueados: caixa fechado</Badge>}
      </div>

      {activeTab === 'Visão geral' && (
        <>
          <FinanceSummaryCards summary={dashboard.summary} />

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.8fr)]">
            <FinancePerformanceChart points={dashboard.performance} />
            <PaymentMethodsPanel payments={dashboard.payments} />
          </div>
        </>
      )}

      {activeTab === 'Relatórios' && <FinanceReportsPanel reports={dashboard.reports} />}

      {activeTab === 'Receitas' && (
        <FinanceSimpleTable
          title="Receitas avulsas"
          description="Entradas além de vendas de produtos: serviços manuais, reembolsos e outros."
          headers={['Descrição', 'Valor', 'Status', 'Forma']}
          rows={incomeRows}
          blocked={!cashOpen}
        />
      )}

      {activeTab === 'Despesas' && (
        <FinanceSimpleTable
          title="Despesas avulsas"
          description="Água, luz, aluguel, funcionário, internet, fornecedor, manutenção, impostos e outros."
          headers={['Descrição', 'Valor', 'Status', 'Forma']}
          rows={expenseRows}
          blocked={!cashOpen}
        />
      )}

      {activeTab === 'Categorias' && (
        <FinanceSimpleTable
          title="Categorias financeiras"
          description="Categorias de receita e despesa usadas nos relatórios."
          headers={['Tipo', 'Categoria', 'Status']}
          rows={categoryRows}
        />
      )}

      {activeTab === 'Caixa' && (
        <Card>
          <CardContent className="grid gap-4 p-5 md:grid-cols-4">
            <Metric title="Status" value={cashOpen ? 'Aberto' : 'Fechado'} />
            <Metric title="Valor inicial" value="R$ 0,00" />
            <Metric title="Saldo esperado" value="R$ 4.218,10" />
            <Metric title="Diferença" value="R$ 0,00" />
          </CardContent>
        </Card>
      )}

      <FinanceTables sales={dashboard.sales} cashFlow={dashboard.cashFlow} payables={dashboard.payables} receivables={dashboard.receivables} />
    </div>
  );
}

function FinanceSimpleTable({
  title,
  description,
  headers,
  rows,
  blocked,
}: {
  title: string;
  description: string;
  headers: string[];
  rows: string[][];
  blocked?: boolean;
}) {
  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          {blocked ? <Badge variant="warning">Bloqueado: caixa fechado</Badge> : <Button size="sm">Novo lançamento</Button>}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((header) => <TableHead key={header}>{header}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.join('-')}>
                {row.map((cell) => <TableCell key={cell}>{cell}</TableCell>)}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-md border border-border p-4">
      <p className="text-xs text-muted-foreground">{title}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}
