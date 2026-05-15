import { Badge } from '@shared/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import type { FinanceReport } from '../types/finance.types';

type FinanceReportsPanelProps = {
  reports: FinanceReport[];
};

const reportVariant = {
  good: 'success',
  attention: 'warning',
  critical: 'destructive',
} as const;

const reportLabel = {
  good: 'Bom',
  attention: 'Atencao',
  critical: 'Critico',
};

export function FinanceReportsPanel({ reports }: FinanceReportsPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Relatorios simples</CardTitle>
        <p className="text-sm text-muted-foreground">
          Leituras prontas para usuarios leigos entenderem o desempenho da loja.
        </p>
      </CardHeader>
      <CardContent className="grid gap-3 xl:grid-cols-3">
        {reports.map((report) => (
          <div key={report.title} className="rounded-md border border-border p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">{report.title}</p>
              <Badge variant={reportVariant[report.status]}>{reportLabel[report.status]}</Badge>
            </div>
            <p className="mt-3 text-xl font-semibold">{report.value}</p>
            <p className="mt-2 text-sm text-muted-foreground">{report.description}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

