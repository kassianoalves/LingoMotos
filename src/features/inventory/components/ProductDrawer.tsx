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
import { DrawerShell } from '@shared/components/layout';

type ProductDrawerProps = {
  product: Product | null;
  onClose: () => void;
  onEdit: (product: Product) => void;
  onMovement: (product: Product) => void;
  onRemove: (product: Product) => void;
};

const statusLabel = {
  available: 'Disponível',
  low_stock: 'Baixo estoque',
  out_of_stock: 'Sem estoque',
  unpriced: 'Sem preço',
  uncosted: 'Sem custo',
};

export function ProductDrawer({ product, onClose, onEdit, onMovement, onRemove }: ProductDrawerProps) {
  if (!product) {
    return null;
  }

  const margin = calculateMarginPercent(product);
  const status = getStockStatus(product);

  return (
    <DrawerShell>
      <div className="flex h-16 flex-none items-center justify-between border-b border-border px-5 compact:h-14 compact:px-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{product.name}</p>
          <p className="text-xs text-muted-foreground">SKU / Código interno: {product.sku}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fechar detalhe">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-auto p-5 compact:space-y-3 compact:p-3">
        <div className="flex gap-2">
          <Button size="sm" onClick={() => onMovement(product)}>Movimentar</Button>
          <Button variant="outline" size="sm" onClick={() => onEdit(product)}>Editar</Button>
          <Button variant="destructive" size="sm" onClick={() => onRemove(product)}>Remover produto</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Resumo</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <Metric label="Status" value={<Badge variant={status === 'available' ? 'success' : 'warning'}>{statusLabel[status]}</Badge>} />
            <Metric label="Estoque atual" value={`${product.currentStockQuantity} ${product.unit}`} />
            <Metric label="Estoque mínimo" value={`${product.minStockQuantity} ${product.unit}`} />
            <Metric label="Custo" value={formatCurrency(product.costPriceCents)} />
            <Metric label="Venda" value={formatCurrency(product.salePriceCents)} />
            <Metric label="Margem" value={`${margin.toFixed(1)}%`} />
            <Metric label="Lucro potencial" value={formatCurrency(calculatePotentialProfitCents(product))} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Campos personalizados</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            {product.customFields.length === 0 && <p className="text-sm text-muted-foreground">Nenhum campo personalizado.</p>}
            {product.customFields.map((field) => (
              <Metric key={field.fieldKey} label={field.fieldLabel} value={formatCustomFieldValue(field.fieldType, field.fieldValue)} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
          <CardTitle>Operação</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <Metric label="Categoria" value={product.categoryName} />
            <Metric label="Fornecedor" value={product.supplierName ?? 'Sem fornecedor'} />
            <Metric label="Código de barras" value={product.barcode ?? 'Não informado'} />
            <Metric label="Marca" value={product.brand ?? 'Não informada'} />
            <Metric label="Aplicação / Moto compatível" value={product.motorcycleApplication ?? 'Não informada'} />
            <Metric label="Localização" value={product.location ?? 'Sem local'} />
            <Metric label="Vendidos em 30 dias" value={`${product.soldLast30Days} itens`} />
            <Metric label="Última movimentação" value={formatDate(product.lastMovementAt)} />
          </CardContent>
        </Card>
      </div>
    </DrawerShell>
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

function formatCustomFieldValue(type: Product['customFields'][number]['fieldType'], value: string) {
  if (!value) return '-';
  if (type === 'currency') {
    const cents = Math.round(Number(value.replace(/\./g, '').replace(',', '.')) * 100);
    return Number.isFinite(cents) ? formatCurrency(cents) : value;
  }
  if (type === 'date') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('pt-BR').format(date);
  }
  if (type === 'boolean') {
    return ['true', '1', 'sim', 's'].includes(value.toLocaleLowerCase('pt-BR')) ? 'Sim' : 'Não';
  }
  return value;
}
