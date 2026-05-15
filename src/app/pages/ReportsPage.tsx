import { BarChart3 } from 'lucide-react';
import { Badge } from '@shared/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';

export function ReportsPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-xl font-semibold">Relatórios</h2>
        <p className="text-sm text-muted-foreground">Página própria para consultas e relatórios consolidados.</p>
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        {['Vendas por período', 'Margem e lucro', 'Estoque e giro', 'Caixa', 'Receitas e despesas', 'Clientes'].map((item) => (
          <Card key={item}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <BarChart3 className="h-4 w-4 text-primary" />
                {item}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary">Consulta</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

