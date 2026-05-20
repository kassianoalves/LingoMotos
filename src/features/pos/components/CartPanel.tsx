import { Minus, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import type { CartItem } from '../types/pos.types';
import { formatCurrency } from '../utils/pos-calculations';

type CartPanelProps = {
  items: CartItem[];
  onQuantityChange: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
};

export function CartPanel({ items, onQuantityChange, onRemove }: CartPanelProps) {
  return (
    <Card className="flex h-full min-h-0 flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2 pb-1.5">
        <div>
          <CardTitle className="text-sm">Carrinho</CardTitle>
          <p className="text-xs text-muted-foreground">{items.length} itens na venda atual.</p>
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col p-2 pt-0">
        <div className="min-h-0 flex-1 overflow-auto rounded-md border border-border">
          {items.map((item) => {
            const lineTotal = Math.max(Math.round(item.quantity * item.unitPriceCents) - item.discountCents, 0);

            return (
              <div key={item.id} className="grid grid-cols-[minmax(0,1fr)_104px] gap-2 border-b border-border px-2 py-1.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold">{item.name}</p>
                    {item.quantity >= item.stockAvailable && <Badge variant="warning">limite</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {item.sku} · {formatCurrency(item.unitPriceCents)} · estoque {item.stockAvailable}
                  </p>

                  <div className="mt-1.5 flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onQuantityChange(item.id, item.quantity - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="min-w-10 text-center text-sm font-semibold">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onQuantityChange(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col items-end justify-between">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onRemove(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(lineTotal)}</p>
                    <p className="text-xs text-muted-foreground">
                      lucro {formatCurrency(lineTotal - Math.round(item.quantity * item.unitCostCents))}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          {items.length === 0 && (
            <div className="grid h-full place-items-center p-6 text-center text-sm text-muted-foreground">
              Busque um produto ou leia o codigo de barras para iniciar a venda.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
