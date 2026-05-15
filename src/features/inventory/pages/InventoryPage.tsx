import { PackagePlus, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent } from '@shared/components/ui/card';
import { Input } from '@shared/components/ui/input';
import { ImportProductsModal } from '../components/ImportProductsModal';
import { InventoryAlerts } from '../components/InventoryAlerts';
import { InventoryInsights } from '../components/InventoryInsights';
import { InventorySummaryCards } from '../components/InventorySummaryCards';
import { InventoryToolbar } from '../components/InventoryToolbar';
import { ProductDrawer } from '../components/ProductDrawer';
import { ProductFormModal } from '../components/ProductFormModal';
import { ProductVirtualTable } from '../components/ProductVirtualTable';
import { StockMovementModal } from '../components/StockMovementModal';
import { useCreateCategory, useCreateSupplier, useInventory, useRemoveProduct } from '../queries/inventory.queries';
import { useInventoryStore } from '../stores/inventory.store';
import type { CategoryFormValues, SupplierFormValues } from '../types/inventory.types';
import { formatBrazilianPhone, sanitizePhone } from '@features/customers/utils/customer-phone';
import { formatCpfCnpj, onlyDigits } from '@/utils/formatters';

type AuxiliaryModal = 'category' | 'supplier' | null;

export function InventoryPage({ cashOpen = true }: { cashOpen?: boolean }) {
  const [activeTab, setActiveTab] = useState('Produtos');
  const [auxiliaryModal, setAuxiliaryModal] = useState<AuxiliaryModal>(null);
  const filters = useInventoryStore((state) => state.filters);
  const selectedProduct = useInventoryStore((state) => state.selectedProduct);
  const activeModal = useInventoryStore((state) => state.activeModal);
  const setSearch = useInventoryStore((state) => state.setSearch);
  const setFilter = useInventoryStore((state) => state.setFilter);
  const selectProduct = useInventoryStore((state) => state.selectProduct);
  const openModal = useInventoryStore((state) => state.openModal);
  const closeModal = useInventoryStore((state) => state.closeModal);
  const inventoryQuery = useInventory(filters);
  const removeProduct = useRemoveProduct();
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
            Cadastro, busca, importação e movimentação rápida para substituir planilhas.
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
          <ProductVirtualTable products={inventory.products} selectedProductId={selectedProduct?.id} onSelectProduct={selectProduct} />
          <InventoryInsights products={inventory.products} />
        </>
      )}

      {activeTab === 'Categorias' && (
        <SimpleAdminList
          title="Categorias de produtos"
          rows={inventory.categories.map((category) => [category.name, category.description ?? 'Sem descrição', category.isActive ? 'Ativa' : 'Inativa'])}
          actionLabel="Nova categoria"
          onCreate={() => setAuxiliaryModal('category')}
        />
      )}

      {activeTab === 'Fornecedores' && (
        <SimpleAdminList
          title="Fornecedores"
          rows={inventory.suppliers.map((supplier) => [supplier.name, supplier.phone ?? 'Sem telefone', supplier.documentNumber ?? 'Sem CNPJ'])}
          actionLabel="Novo fornecedor"
          onCreate={() => setAuxiliaryModal('supplier')}
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
        onRemove={(product) => {
          if (!window.confirm(`Remover ${product.name}? O histórico será preservado.`)) return;
          void removeProduct.mutateAsync(product.id).then(() => selectProduct(null));
        }}
      />

      {activeModal === 'product' && (
        <ProductFormModal
          product={selectedProduct}
          categories={inventory.categories}
          suppliers={inventory.suppliers}
          onClose={closeModal}
          onNewCategory={() => setAuxiliaryModal('category')}
          onNewSupplier={() => setAuxiliaryModal('supplier')}
        />
      )}

      {activeModal === 'movement' && (
        <StockMovementModal products={inventory.products} selectedProduct={selectedProduct} onClose={closeModal} />
      )}

      {activeModal === 'import' && <ImportProductsModal onClose={closeModal} />}
      {auxiliaryModal === 'category' && <CategoryModal onClose={() => setAuxiliaryModal(null)} />}
      {auxiliaryModal === 'supplier' && <SupplierModal onClose={() => setAuxiliaryModal(null)} />}
    </div>
  );
}

function SimpleAdminList({
  title,
  rows,
  actionLabel,
  onCreate,
}: {
  title: string;
  rows: string[][];
  actionLabel: string;
  onCreate: () => void;
}) {
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{title}</h3>
          <Button size="sm" onClick={onCreate}>{actionLabel}</Button>
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

function CategoryModal({ onClose }: { onClose: () => void }) {
  const createCategory = useCreateCategory();
  const [values, setValues] = useState<CategoryFormValues>({ name: '', description: '', isActive: true });

  return (
    <ModalFrame title="Nova categoria" onClose={onClose}>
      <Field label="Nome da categoria">
        <Input value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} />
      </Field>
      <Field label="Descrição opcional">
        <Input value={values.description} onChange={(event) => setValues({ ...values, description: event.target.value })} />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={values.isActive} onChange={(event) => setValues({ ...values, isActive: event.target.checked })} />
        Ativa
      </label>
      <ModalActions
        onClose={onClose}
        onSave={() => void createCategory.mutateAsync(values).then(onClose)}
      />
    </ModalFrame>
  );
}

function SupplierModal({ onClose }: { onClose: () => void }) {
  const createSupplier = useCreateSupplier();
  const [values, setValues] = useState<SupplierFormValues>({
    name: '',
    phone: '',
    whatsapp: '',
    documentNumber: '',
    email: '',
    address: '',
    notes: '',
    isActive: true,
  });

  return (
    <ModalFrame title="Novo fornecedor" onClose={onClose}>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nome do fornecedor" className="md:col-span-2">
          <Input value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} />
        </Field>
        <Field label="Telefone">
          <Input value={formatBrazilianPhone(values.phone)} onChange={(event) => setValues({ ...values, phone: event.target.value })} />
        </Field>
        <Field label="WhatsApp">
          <Input value={formatBrazilianPhone(values.whatsapp)} onChange={(event) => setValues({ ...values, whatsapp: event.target.value })} />
        </Field>
        <Field label="CNPJ">
          <Input value={formatCpfCnpj(values.documentNumber)} onChange={(event) => setValues({ ...values, documentNumber: event.target.value })} />
        </Field>
        <Field label="E-mail">
          <Input value={values.email} onChange={(event) => setValues({ ...values, email: event.target.value })} />
        </Field>
        <Field label="Endereço" className="md:col-span-2">
          <Input value={values.address} onChange={(event) => setValues({ ...values, address: event.target.value })} />
        </Field>
        <Field label="Observações" className="md:col-span-2">
          <Input value={values.notes} onChange={(event) => setValues({ ...values, notes: event.target.value })} />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={values.isActive} onChange={(event) => setValues({ ...values, isActive: event.target.checked })} />
        Ativo
      </label>
      <ModalActions
        onClose={onClose}
        onSave={() =>
          void createSupplier
            .mutateAsync({
              ...values,
              phone: sanitizePhone(values.phone),
              whatsapp: sanitizePhone(values.whatsapp),
              documentNumber: onlyDigits(values.documentNumber),
            })
            .then(onClose)
        }
      />
    </ModalFrame>
  );
}

function ModalFrame({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 backdrop-blur-sm">
      <div className="w-[620px] space-y-4 rounded-lg border border-border bg-card p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">{title}</h3>
          <Button variant="ghost" onClick={onClose}>Fechar</Button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalActions({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  return (
    <div className="flex justify-end gap-2">
      <Button variant="outline" onClick={onClose}>Cancelar</Button>
      <Button onClick={onSave}>Salvar</Button>
    </div>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`grid gap-2 text-sm ${className ?? ''}`}>
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}
