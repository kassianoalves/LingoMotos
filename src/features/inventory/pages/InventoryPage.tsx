import { PackagePlus, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent } from '@shared/components/ui/card';
import { ImportProductsModal } from '../components/ImportProductsModal';
import { InventoryAlerts } from '../components/InventoryAlerts';
import { InventoryInsights } from '../components/InventoryInsights';
import { InventorySummaryCards } from '../components/InventorySummaryCards';
import { InventoryToolbar } from '../components/InventoryToolbar';
import { ProductDrawer } from '../components/ProductDrawer';
import { ProductFormModal } from '../components/ProductFormModal';
import { ProductVirtualTable } from '../components/ProductVirtualTable';
import { StockMovementModal } from '../components/StockMovementModal';
import { useInventory } from '../queries/inventory.queries';
import { useInventoryStore } from '../stores/inventory.store';

export function InventoryPage({ cashOpen = true }: { cashOpen?: boolean }) {
  const [activeTab, setActiveTab] = useState('Produtos');
  const filters = useInventoryStore((state) => state.filters);
  const selectedProduct = useInventoryStore((state) => state.selectedProduct);
  const activeModal = useInventoryStore((state) => state.activeModal);
  const setSearch = useInventoryStore((state) => state.setSearch);
  const setFilter = useInventoryStore((state) => state.setFilter);
  const selectProduct = useInventoryStore((state) => state.selectProduct);
  const openModal = useInventoryStore((state) => state.openModal);
  const closeModal = useInventoryStore((state) => state.closeModal);
  const inventoryQuery = useInventory(filters);

  const inventory = inventoryQuery.data;

  if (!inventory) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex h-52 items-center justify-center gap-3 p-6 text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Carregando estoque local
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Estoque</h2>
          <p className="text-sm text-muted-foreground">
            Cadastro, busca, importacao e movimentacao rapida para substituir planilhas.
          </p>
        </div>
        <Button onClick={() => openModal('movement')} disabled={!cashOpen}>
          <PackagePlus className="h-4 w-4" />
          Movimentar estoque
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {['Produtos', 'Categorias', 'Fornecedores', 'Movimentações', 'Importação'].map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setActiveTab(tab);
              if (tab === 'Importação') openModal('import');
            }}
          >
            {tab}
          </Button>
        ))}
        {!cashOpen && <Badge variant="warning">Movimentações bloqueadas: caixa fechado</Badge>}
      </div>

      {activeTab === 'Produtos' && (
        <>
          <InventoryToolbar
            filters={filters}
            categories={inventory.categories}
            suppliers={inventory.suppliers}
            onSearchChange={setSearch}
            onFilterChange={setFilter}
            onNewProduct={() => openModal('product', null)}
            onMovement={() => cashOpen && openModal('movement')}
            onImport={() => openModal('import')}
          />

          <InventorySummaryCards summary={inventory.summary} />

          <InventoryAlerts alerts={inventory.alerts} onApplyFilter={(filter) => setFilter('stockStatus', filter)} />

          <ProductVirtualTable
            products={inventory.products}
            selectedProductId={selectedProduct?.id}
            onSelectProduct={selectProduct}
          />

          <InventoryInsights products={inventory.products} />
        </>
      )}

      {activeTab === 'Categorias' && (
        <SimpleAdminList
          title="Categorias de produtos"
          rows={inventory.categories.map((category) => [category.name, category.isActive ? 'Ativa' : 'Inativa'])}
        />
      )}

      {activeTab === 'Fornecedores' && (
        <SimpleAdminList
          title="Fornecedores"
          rows={inventory.suppliers.map((supplier) => [supplier.name, supplier.phone ?? 'Sem telefone', supplier.documentNumber ?? 'Sem CNPJ'])}
        />
      )}

      {activeTab === 'Movimentações' && (
        <Card>
          <CardContent className="p-5">
            <h3 className="font-semibold">Movimentações</h3>
            <p className="mt-2 text-sm text-muted-foreground">Histórico de entradas, saídas, ajustes e vendas será listado aqui.</p>
          </CardContent>
        </Card>
      )}

      <ProductDrawer
        product={selectedProduct}
        onClose={() => selectProduct(null)}
        onEdit={(product) => openModal('product', product)}
        onMovement={(product) => openModal('movement', product)}
      />

      {activeModal === 'product' && (
        <ProductFormModal
          product={selectedProduct}
          categories={inventory.categories}
          suppliers={inventory.suppliers}
          onClose={closeModal}
        />
      )}

      {activeModal === 'movement' && (
        <StockMovementModal products={inventory.products} selectedProduct={selectedProduct} onClose={closeModal} />
      )}

      {activeModal === 'import' && <ImportProductsModal onClose={closeModal} />}
    </div>
  );
}

function SimpleAdminList({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{title}</h3>
          <div className="flex gap-2">
            <Button size="sm">Novo</Button>
            <Button size="sm" variant="outline">Editar</Button>
            <Button size="sm" variant="outline">Desativar</Button>
          </div>
        </div>
        <div className="rounded-md border border-border">
          {rows.map((row) => (
            <div key={row.join('-')} className="grid grid-cols-3 gap-3 border-b border-border p-3 text-sm">
              {row.map((cell) => <span key={cell}>{cell}</span>)}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
