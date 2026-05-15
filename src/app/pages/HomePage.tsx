import { CircleDollarSign, PackagePlus, ShoppingCart, UserRoundPlus, WalletCards, Warehouse } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';

const quickActions = [
  { label: 'Nova venda', route: '/vendas', icon: ShoppingCart },
  { label: 'Cadastrar cliente', route: '/clientes', icon: UserRoundPlus },
  { label: 'Consultar estoque', route: '/estoque', icon: Warehouse },
  { label: 'Adicionar produto', route: '/estoque', icon: PackagePlus },
  { label: 'Lançar despesa', route: '/financeiro', icon: CircleDollarSign },
  { label: 'Abrir/fechar caixa', route: '/financeiro', icon: WalletCards },
];

const metrics = [
  ['Caixa aberto/fechado', 'Aberto', 'Operação liberada'],
  ['Vendas de hoje', '28 vendas', 'R$ 3.842,90'],
  ['Receita de hoje', 'R$ 3.842,90', 'Entradas confirmadas'],
  ['Lucro estimado', 'R$ 1.126,40', 'Margem 29,3%'],
  ['Produtos acabando', '17 itens', 'Reposição prioritária'],
  ['Produtos sem estoque', '5 itens', 'Sem disponibilidade'],
  ['Último item vendido', 'Óleo motor 10W30', '09:20'],
  ['Última venda', 'Venda 000128', 'R$ 184,90'],
  ['Contas/despesas pendentes', '3 lançamentos', 'R$ 1.270,40'],
];

export function HomePage({ navigate }: { navigate: (route: string) => void }) {
  return (
    <section className="space-y-6 p-6">
      <div>
        <h2 className="text-xl font-semibold">Início</h2>
        <p className="text-sm text-muted-foreground">Resumo operacional da loja.</p>
      </div>

      <section className="space-y-3">
        <h3 className="text-base font-semibold">Ações rápidas</h3>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button key={action.label} variant="outline" className="h-12 justify-start bg-card" onClick={() => navigate(action.route)}>
                <Icon className="h-4 w-4 text-primary" />
                {action.label}
              </Button>
            );
          })}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {metrics.map(([title, value, meta]) => (
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
