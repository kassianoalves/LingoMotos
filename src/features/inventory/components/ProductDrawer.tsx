import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import type { Product } from '../types/inventory.types';
import {
  calculateMarginPercent,
  calculatePotentialProfitCents,
  formatCurrency,
  getStockStatus,
} from '../utils/inventory-calculations';

type ProductDrawerProps = {
  product: Product | null;
  onClose: () => void;
  onEdit: (product: Product) => void;
  onMovement: (product: Product) => void;
};

const statusLabel = {
  available: 'Disponivel',
  low_stock: 'Baixo estoque',
  out_of_stock: 'Sem estoque',
  unpriced: 'Sem preco',
  uncosted: 'Sem custo',
};

export function ProductDrawer({ product, onClose, onEdit, onMovement }: ProductDrawerProps) {
  if (!product) {
    return null;
  }

  const margin = calculateMarginPercent(product);
  const status = getStockStatus(product);

  return (
    <aside className="fixed inset-y-0 right-0 z-30 w-[420px] border-l border-border bg-card shadow-lg">
      <div className="flex h-16 items-center justify-between border-b border-border px-5">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{product.name}</p>
          <p className="text-xs text-muted-foreground">{product.sku}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fechar detalhe">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4 overflow-auto p-5">
        <div className="flex gap-2">
          <Button size="sm" onClick={() => onMovement(product)}>Movimentar</Button>
          <Button variant="outline" size="sm" onClick={() => onEdit(product)}>Editar</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Resumo</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <Metric label="Status" value={<Badge variant={status === 'available' ? 'success' : 'warning'}>{statusLabel[status]}</Badge>} />
            <Metric label="Estoque atual" value={`${product.currentStockQuantity} ${product.unit}`} />
            <Metric label="Estoque minimo" value={`${product.minStockQuantity} ${product.unit}`} />
            <Metric label="Custo" value={formatCurrency(product.costPriceCents)} />
            <Metric label="Venda" value={formatCurrency(product.salePriceCents)} />
            <Metric label="Margem" value={`${margin.toFixed(1)}%`} />
            <Metric label="Lucro potencial" value={formatCurrency(calculatePotentialProfitCents(product))} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Operacao</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <Metric label="Categoria" value={product.categoryName} />
            <Metric label="Fornecedor" value={product.supplierName ?? 'Sem fornecedor'} />
            <Metric label="Localizacao" value={product.location ?? 'Sem local'} />
            <Metric label="Vendidos em 30 dias" value={`${product.soldLast30Days} itens`} />
            <Metric label="Ultima movimentacao" value={formatDate(product.lastMovementAt)} />
          </CardContent>
        </Card>
      </div>
    </aside>
  );
}

function Metric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function formatDate(value?: string) {
  if (!value) {
    return 'Sem movimento';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}
