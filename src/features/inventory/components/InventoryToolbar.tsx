import { PackagePlus, Plus, Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import type { Category, InventoryFilters, Supplier } from '../types/inventory.types';

type InventoryToolbarProps = {
  filters: InventoryFilters;
  categories: Category[];
  suppliers: Supplier[];
  onSearchChange: (value: string) => void;
  onFilterChange: <TKey extends keyof InventoryFilters>(key: TKey, value: InventoryFilters[TKey]) => void;
  onNewProduct: () => void;
  onMovement: () => void;
  onImport: () => void;
};

export function InventoryToolbar({
  filters,
  categories,
  suppliers,
  onSearchChange,
  onFilterChange,
  onNewProduct,
  onMovement,
  onImport,
}: InventoryToolbarProps) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1 max-[1100px]:max-w-[300px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-8 border-border pl-9 focus-visible:ring-2 focus-visible:ring-primary/40"
            value={filters.search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar produto, SKU, código ou marca"
          />
        </div>
        <Button className="h-8 px-3" onClick={onNewProduct}>
          <Plus className="h-4 w-4" />
          Produto
        </Button>
        <Button className="h-8 px-3" variant="outline" onClick={onMovement}>
          <PackagePlus className="h-4 w-4" />
          Movimentar
        </Button>
        <Button className="h-8 px-3" variant="outline" onClick={onImport}>
          Importar
        </Button>
      </div>

      <div className="grid grid-cols-[auto_repeat(4,minmax(112px,1fr))] items-center gap-2 max-[1100px]:grid-cols-[auto_repeat(4,minmax(0,1fr))]">
        <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
        <select
          className="h-8 rounded-md border border-border bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          value={filters.stockStatus}
          onChange={(event) => onFilterChange('stockStatus', event.target.value as InventoryFilters['stockStatus'])}
        >
          <option value="all">Todos</option>
          <option value="low_stock">Baixo estoque</option>
          <option value="out_of_stock">Sem estoque</option>
          <option value="unpriced">Sem preço</option>
          <option value="uncosted">Sem custo</option>
        </select>

        <select
          className="h-8 rounded-md border border-border bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          value={filters.categoryId}
          onChange={(event) => onFilterChange('categoryId', event.target.value)}
        >
          <option value="">Todas categorias</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        <select
          className="h-8 rounded-md border border-border bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          value={filters.supplierId}
          onChange={(event) => onFilterChange('supplierId', event.target.value)}
        >
          <option value="">Todos fornecedores</option>
          {suppliers.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.name}
            </option>
          ))}
        </select>

        <select
          className="h-8 rounded-md border border-border bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          value={filters.sortBy}
          onChange={(event) => onFilterChange('sortBy', event.target.value as InventoryFilters['sortBy'])}
        >
          <option value="name">Nome</option>
          <option value="sku">SKU / Código interno</option>
          <option value="stock">Menor estoque</option>
          <option value="margin">Maior margem</option>
          <option value="sold">Mais vendidos</option>
          <option value="lastMovement">Última movimentação</option>
        </select>
      </div>
    </div>
  );
}
