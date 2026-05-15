import { Badge } from '@shared/components/ui/badge';
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
};

export function FinanceTables({ sales, cashFlow, payables, receivables }: FinanceTablesProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <SalesTable sales={sales} />
      <CashFlowTable cashFlow={cashFlow} />
      <PayablesTable payables={payables} />
      <ReceivablesTable receivables={receivables} />
    </div>
  );
}

function SalesTable({ sales }: { sales: SaleRecord[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendas do periodo</CardTitle>
        <p className="text-sm text-muted-foreground">Receita, lucro e forma de pagamento em cada venda.</p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Venda</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Lucro</TableHead>
              <TableHead>Pagamento</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell className="font-medium">{sale.saleNumber}</TableCell>
                <TableCell>{sale.customerName}</TableCell>
                <TableCell>{formatCurrency(sale.totalCents)}</TableCell>
                <TableCell>{formatCurrency(calculateGrossProfit(sale))}</TableCell>
                <TableCell><Badge variant="secondary">{paymentLabels[sale.paymentMethod]}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function CashFlowTable({ cashFlow }: { cashFlow: CashFlowRecord[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fluxo de caixa</CardTitle>
        <p className="text-sm text-muted-foreground">Entradas e saídas confirmadas no caixa.</p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descricao</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Forma</TableHead>
              <TableHead>Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cashFlow.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.description}</TableCell>
                <TableCell>
                  <Badge variant={item.direction === 'in' ? 'success' : 'warning'}>
                    {item.direction === 'in' ? 'Entrada' : 'Saida'}
                  </Badge>
                </TableCell>
                <TableCell>{paymentLabels[item.paymentMethod]}</TableCell>
                <TableCell>{formatCurrency(item.amountCents)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function PayablesTable({ payables }: { payables: PayableRecord[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contas a pagar</CardTitle>
        <p className="text-sm text-muted-foreground">Compromissos simples por vencimento.</p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fornecedor</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payables.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.supplierName}</TableCell>
                <TableCell>{formatDate(item.dueDate)}</TableCell>
                <TableCell>{formatCurrency(item.amountCents)}</TableCell>
                <TableCell><StatusBadge status={item.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function ReceivablesTable({ receivables }: { receivables: ReceivableRecord[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contas a receber</CardTitle>
        <p className="text-sm text-muted-foreground">Valores esperados de clientes.</p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {receivables.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.customerName}</TableCell>
                <TableCell>{formatDate(item.dueDate)}</TableCell>
                <TableCell>{formatCurrency(item.amountCents)}</TableCell>
                <TableCell><StatusBadge status={item.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'paid' || status === 'received') {
    return <Badge variant="success">Pago</Badge>;
  }

  if (status === 'overdue') {
    return <Badge variant="destructive">Vencido</Badge>;
  }

  return <Badge variant="warning">Aberto</Badge>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(`${value}T00:00:00`));
}
