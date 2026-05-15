import { CreditCard, PackagePlus, Search, ShoppingCart } from 'lucide-react';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';

const quickActions = [
  { label: 'Nova venda', shortcut: 'F9', icon: ShoppingCart },
  { label: 'Buscar produto', shortcut: 'F10', icon: Search },
  { label: 'Estoque', shortcut: 'F2', icon: PackagePlus },
  { label: 'Ver caixa', shortcut: 'F8', icon: CreditCard },
];

export function HomePage({ navigate }: { navigate: (route: string) => void }) {
  return (
    <section className="space-y-6 p-6">
      <div>
        <h2 className="text-xl font-semibold">Início</h2>
        <p className="text-sm text-muted-foreground">Resumo operacional da loja.</p>
      </div>
      <div className="grid gap-3 xl:grid-cols-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.label}
              variant="outline"
              className="h-12 justify-between bg-card"
              onClick={() => navigate(action.label === 'Nova venda' ? '/vendas' : action.label === 'Estoque' ? '/estoque' : '/inicio')}
            >
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-primary" />
                {action.label}
              </span>
              <Badge variant="secondary">{action.shortcut}</Badge>
            </Button>
          );
        })}
      </div>
      <div className="grid gap-4 xl:grid-cols-4">
        {[
          ['Vendas hoje', 'R$ 3.842,90', '28 vendas'],
          ['Lucro bruto', 'R$ 1.126,40', 'Margem 29,3%'],
          ['Caixa', 'Consulte F8', 'Sessão controlada'],
          ['Estoque crítico', '17 itens', '5 zerados'],
        ].map(([title, value, meta]) => (
          <Card key={title}>
            <CardHeader>
              <CardTitle className="text-muted-foreground">{title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold">{value}</p>
              <p className="mt-2 text-xs text-muted-foreground">{meta}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

