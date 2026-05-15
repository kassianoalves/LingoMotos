import { FileSpreadsheet, PackagePlus, Plus, Search, SlidersHorizontal } from 'lucide-react';
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
    <div className="space-y-3">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            className="h-11 pl-9"
            value={filters.search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar por produto, SKU, codigo de barras, fornecedor ou localizacao"
          />
        </div>
        <Button onClick={onNewProduct}>
          <Plus className="h-4 w-4" />
          Produto
        </Button>
        <Button variant="outline" onClick={onMovement}>
          <PackagePlus className="h-4 w-4" />
          Movimentar
        </Button>
        <Button variant="outline" onClick={onImport}>
          <FileSpreadsheet className="h-4 w-4" />
          Importar
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
        <select
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={filters.stockStatus}
          onChange={(event) => onFilterChange('stockStatus', event.target.value as InventoryFilters['stockStatus'])}
        >
          <option value="all">Todos</option>
          <option value="low_stock">Baixo estoque</option>
          <option value="out_of_stock">Sem estoque</option>
          <option value="unpriced">Sem preco</option>
          <option value="uncosted">Sem custo</option>
        </select>

        <select
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
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
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
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
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={filters.sortBy}
          onChange={(event) => onFilterChange('sortBy', event.target.value as InventoryFilters['sortBy'])}
        >
          <option value="name">Nome</option>
          <option value="sku">SKU</option>
          <option value="stock">Menor estoque</option>
          <option value="margin">Maior margem</option>
          <option value="sold">Mais vendidos</option>
          <option value="lastMovement">Ultima movimentacao</option>
        </select>
      </div>
    </div>
  );
}

