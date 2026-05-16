import { useState } from 'react';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@shared/components/ui/table';
import type { CashFlowRecord, PayableRecord, ReceivableRecord, SaleRecord } from '../types/finance.types';
import { calculateGrossProfit, formatCurrency, paymentLabels } from '../utils/finance-calculations';

type FinanceTablesProps = {
  sales: SaleRecord[];
  cashFlow: CashFlowRecord[];
  payables: PayableRecord[];
  receivables: ReceivableRecord[];
  onCreatePayable: () => void;
  onCreateReceivable: () => void;
  onEditPayable: (item: PayableRecord) => void;
  onEditReceivable: (item: ReceivableRecord) => void;
  onDeletePayable: (item: PayableRecord) => void;
  onDeleteReceivable: (item: ReceivableRecord) => void;
  onMarkPayablePaid: (item: PayableRecord) => void;
  onMarkReceivableReceived: (item: ReceivableRecord) => void;
};

export function FinanceTables({
  sales,
  cashFlow,
  payables,
  receivables,
  onCreatePayable,
  onCreateReceivable,
  onEditPayable,
  onEditReceivable,
  onDeletePayable,
  onDeleteReceivable,
  onMarkPayablePaid,
  onMarkReceivableReceived,
}: FinanceTablesProps) {
  const [expanded, setExpanded] = useState<'sales' | 'cash' | 'payables' | 'receivables' | null>(null);

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <CompactSales sales={sales} expanded={expanded === 'sales'} onToggle={() => setExpanded(expanded === 'sales' ? null : 'sales')} />
      <CompactCashFlow cashFlow={cashFlow} expanded={expanded === 'cash'} onToggle={() => setExpanded(expanded === 'cash' ? null : 'cash')} />
      <CompactPayables
        payables={payables}
        expanded={expanded === 'payables'}
        onToggle={() => setExpanded(expanded === 'payables' ? null : 'payables')}
        onCreate={onCreatePayable}
        onEdit={onEditPayable}
        onDelete={onDeletePayable}
        onMarkPaid={onMarkPayablePaid}
      />
      <CompactReceivables
        receivables={receivables}
        expanded={expanded === 'receivables'}
        onToggle={() => setExpanded(expanded === 'receivables' ? null : 'receivables')}
        onCreate={onCreateReceivable}
        onEdit={onEditReceivable}
        onDelete={onDeleteReceivable}
        onMarkReceived={onMarkReceivableReceived}
      />
    </div>
  );
}

function CompactSales({ sales, expanded, onToggle }: { sales: SaleRecord[]; expanded: boolean; onToggle: () => void }) {
  return (
    <CompactCard title="Vendas do periodo" actionLabel={expanded ? 'Recolher' : 'Ver tudo'} onToggle={onToggle}>
      <div className="space-y-2">
        {(expanded ? sales : sales.slice(0, 3)).map((sale) => (
          <div key={sale.id} className="flex items-center justify-between gap-3 text-sm">
            <span className="truncate text-muted-foreground">{sale.saleNumber} - {sale.customerName}</span>
            <span className="font-medium">{formatCurrency(sale.totalCents)}</span>
          </div>
        ))}
        {sales.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma venda no periodo.</p>}
      </div>
    </CompactCard>
  );
}

function CompactCashFlow({ cashFlow, expanded, onToggle }: { cashFlow: CashFlowRecord[]; expanded: boolean; onToggle: () => void }) {
  return (
    <CompactCard title="Fluxo de caixa" actionLabel={expanded ? 'Recolher' : 'Ver tudo'} onToggle={onToggle}>
      <div className="space-y-2">
        {(expanded ? cashFlow : cashFlow.slice(0, 3)).map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
            <span className="truncate text-muted-foreground">{item.description}</span>
            <span className={item.direction === 'in' ? 'font-medium text-success' : 'font-medium text-warning'}>
              {item.direction === 'in' ? '+' : '-'} {formatCurrency(item.amountCents)}
            </span>
          </div>
        ))}
        {cashFlow.length === 0 && <p className="text-sm text-muted-foreground">Nenhum movimento no periodo.</p>}
      </div>
    </CompactCard>
  );
}

function CompactPayables({
  payables,
  expanded,
  onToggle,
  onCreate,
  onEdit,
  onDelete,
  onMarkPaid,
}: {
  payables: PayableRecord[];
  expanded: boolean;
  onToggle: () => void;
  onCreate: () => void;
  onEdit: (item: PayableRecord) => void;
  onDelete: (item: PayableRecord) => void;
  onMarkPaid: (item: PayableRecord) => void;
}) {
  return (
    <CompactCard title="Contas a pagar" actionLabel={expanded ? 'Recolher' : 'Ver tudo'} onToggle={onToggle} extra={<Button size="sm" variant="outline" onClick={onCreate}>Adicionar</Button>}>
      {expanded ? (
        <AccountsTable kind="payable" items={payables} onEdit={onEdit} onDelete={onDelete} onStatus={onMarkPaid} />
      ) : (
        <AccountPreview items={payables.slice(0, 3)} empty="Nenhuma conta a pagar aberta." />
      )}
    </CompactCard>
  );
}

function CompactReceivables({
  receivables,
  expanded,
  onToggle,
  onCreate,
  onEdit,
  onDelete,
  onMarkReceived,
}: {
  receivables: ReceivableRecord[];
  expanded: boolean;
  onToggle: () => void;
  onCreate: () => void;
  onEdit: (item: ReceivableRecord) => void;
  onDelete: (item: ReceivableRecord) => void;
  onMarkReceived: (item: ReceivableRecord) => void;
}) {
  return (
    <CompactCard title="Contas a receber" actionLabel={expanded ? 'Recolher' : 'Ver tudo'} onToggle={onToggle} extra={<Button size="sm" variant="outline" onClick={onCreate}>Adicionar</Button>}>
      {expanded ? (
        <AccountsTable kind="receivable" items={receivables} onEdit={onEdit} onDelete={onDelete} onStatus={onMarkReceived} />
      ) : (
        <AccountPreview items={receivables.slice(0, 3)} empty="Nenhuma conta a receber aberta." />
      )}
    </CompactCard>
  );
}

function CompactCard({
  title,
  actionLabel,
  onToggle,
  extra,
  children,
}: {
  title: string;
  actionLabel: string;
  onToggle: () => void;
  extra?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle>{title}</CardTitle>
          <div className="flex items-center gap-2">
            {extra}
            <Button size="sm" variant="ghost" onClick={onToggle}>{actionLabel}</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function AccountPreview({ items, empty }: { items: Array<PayableRecord | ReceivableRecord>; empty: string }) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
          <span className="truncate text-muted-foreground">
            {'companyOrSupplier' in item ? item.companyOrSupplier || item.description : item.customer || item.description}
          </span>
          <span className="font-medium">{formatCurrency(item.amountCents)}</span>
        </div>
      ))}
      {items.length === 0 && <p className="text-sm text-muted-foreground">{empty}</p>}
    </div>
  );
}

function AccountsTable({
  kind,
  items,
  onEdit,
  onDelete,
  onStatus,
}: {
  kind: 'payable' | 'receivable';
  items: Array<PayableRecord | ReceivableRecord>;
  onEdit: (item: never) => void;
  onDelete: (item: never) => void;
  onStatus: (item: never) => void;
}) {
  return (
    <div className="max-h-72 overflow-auto rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{kind === 'payable' ? 'Fornecedor' : 'Cliente'}</TableHead>
            <TableHead>Vencimento</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Acoes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">
                {'companyOrSupplier' in item ? item.companyOrSupplier || 'Nao informado' : item.customer || 'Nao informado'}
              </TableCell>
              <TableCell>{formatDate(item.dueDate)}</TableCell>
              <TableCell>{formatCurrency(item.amountCents)}</TableCell>
              <TableCell>
                <button type="button" onClick={() => onStatus(item as never)}>
                  <StatusBadge status={item.status} />
                </button>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => onEdit(item as never)}>Editar</Button>
                  <Button size="sm" variant="destructive" onClick={() => onDelete(item as never)}>Excluir</Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'paid') return <Badge variant="success">Paga</Badge>;
  if (status === 'received') return <Badge variant="success">Recebida</Badge>;
  if (status === 'overdue') return <Badge variant="destructive">Vencida</Badge>;
  return <Badge variant="warning">Aberto</Badge>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(`${value}T00:00:00`));
}
