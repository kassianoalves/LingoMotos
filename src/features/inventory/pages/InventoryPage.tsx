import { Pencil, RefreshCw, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent } from '@shared/components/ui/card';
import { Input } from '@shared/components/ui/input';
import { InventoryAlerts } from '../components/InventoryAlerts';
import { InventoryInsights } from '../components/InventoryInsights';
import { InventorySummaryCards } from '../components/InventorySummaryCards';
import { InventoryToolbar } from '../components/InventoryToolbar';
import { ImportProductsModal } from '../components/ImportProductsModal';
import { ProductDrawer } from '../components/ProductDrawer';
import { ProductFormModal } from '../components/ProductFormModal';
import { ProductVirtualTable } from '../components/ProductVirtualTable';
import { StockMovementModal } from '../components/StockMovementModal';
import {
  useCreateCategory,
  useCreateSupplier,
  useDeactivateCategory,
  useDeactivateSupplier,
  useInventory,
  useRemoveProduct,
  useStockMovements,
  useUpdateCategory,
  useUpdateSupplier,
} from '../queries/inventory.queries';
import { useInventoryStore } from '../stores/inventory.store';
import type { Category, CategoryFormValues, Supplier, SupplierFormValues } from '../types/inventory.types';
import { formatBrazilianPhone, sanitizePhone } from '@features/customers/utils/customer-phone';
import { formatCpfCnpj, onlyDigits } from '@/utils/formatters';
import { DialogBody, DialogShell, PageContainer, StickyDialogFooter } from '@shared/components/layout';

type AuxiliaryModal =
  | { type: 'category'; item?: Category }
  | { type: 'supplier'; item?: Supplier }
  | null;

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
  const movementsQuery = useStockMovements();
  const removeProduct = useRemoveProduct();
  const deactivateCategory = useDeactivateCategory();
  const deactivateSupplier = useDeactivateSupplier();
  const inventory = inventoryQuery.data;
  const isMovementsTab = activeTab.includes('Movimenta');

  if (inventoryQuery.isError) {
    console.error(inventoryQuery.error);
    return (
      <PageContainer>
        <Card>
          <CardContent className="space-y-4 p-6">
            <div>
              <h2 className="text-xl font-semibold">Erro ao carregar estoque</h2>
              <p className="mt-2 text-sm text-muted-foreground">Nao foi possivel carregar os produtos.</p>
            </div>
            <Button onClick={() => void inventoryQuery.refetch()}>Tentar novamente</Button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  if (!inventory) {
    return (
      <PageContainer>
        <Card>
          <CardContent className="flex h-52 items-center justify-center gap-3 p-6 text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Carregando estoque local
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="gap-3">
      <div className="flex flex-none flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {['Produtos', 'Categorias', 'Fornecedores', 'Movimentações'].map((tab) => (
            <Button key={tab} className="h-8 px-3" variant={activeTab === tab ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab(tab)}>
              {tab}
            </Button>
          ))}
        </div>
        {!cashOpen && <Badge variant="warning">Movimentações bloqueadas: caixa fechado</Badge>}
      </div>

      {activeTab === 'Produtos' && (
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
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
          <div className="hidden xl:block">
            <InventoryAlerts alerts={inventory.alerts} onApplyFilter={(filter) => setFilter('stockStatus', filter)} />
          </div>
          <ProductVirtualTable products={inventory.products} selectedProductId={selectedProduct?.id} onSelectProduct={selectProduct} />
          {inventory.products.length === 0 && (
            <Card>
              <CardContent className="flex items-center justify-center gap-4 p-5">
                <p className="text-sm text-muted-foreground">Nenhum produto cadastrado ainda.</p>
              </CardContent>
            </Card>
          )}
          <div className="hidden 2xl:block">
            <InventoryInsights products={inventory.products} />
          </div>
        </div>
      )}

      {activeTab === 'Categorias' && (
        <EntityAdminList
          title="Categorias de produtos"
          actionLabel="Nova categoria"
          rows={inventory.categories.map((category) => ({
            id: category.id,
            cells: [category.name, category.description ?? 'Sem descricao', category.isActive ? 'Ativa' : 'Inativa'],
            onEdit: () => setAuxiliaryModal({ type: 'category', item: category }),
            onDeactivate: () => {
              if (window.confirm(`Desativar ${category.name}?`)) void deactivateCategory.mutateAsync(category.id);
            },
          }))}
          onCreate={() => setAuxiliaryModal({ type: 'category' })}
        />
      )}

      {activeTab === 'Fornecedores' && (
        <EntityAdminList
          title="Fornecedores"
          actionLabel="Novo fornecedor"
          rows={inventory.suppliers.map((supplier) => ({
            id: supplier.id,
            cells: [supplier.name, supplier.phone ?? 'Sem telefone', supplier.documentNumber ?? 'Sem CNPJ'],
            onEdit: () => setAuxiliaryModal({ type: 'supplier', item: supplier }),
            onDeactivate: () => {
              if (window.confirm(`Desativar ${supplier.name}?`)) void deactivateSupplier.mutateAsync(supplier.id);
            },
          }))}
          onCreate={() => setAuxiliaryModal({ type: 'supplier' })}
        />
      )}

      {isMovementsTab && (
        <Card className="min-h-0 flex-1 overflow-hidden">
          <CardContent className="flex h-full min-h-0 flex-col space-y-3 p-5 compact:p-3">
            <h3 className="font-semibold">Movimentacoes</h3>
            <div className="min-h-0 flex-1 overflow-auto rounded-md border border-border">
              {(movementsQuery.data ?? []).map((movement) => (
                <div key={movement.id} className="grid grid-cols-5 gap-3 border-b border-border p-3 text-sm">
                  <span>{movement.movementType}</span>
                  <span>{movement.direction}</span>
                  <span>{movement.quantity}</span>
                  <span>{movement.reason || '-'}</span>
                  <span>{movement.occurredAt}</span>
                </div>
              ))}
              {(movementsQuery.data?.length ?? 0) === 0 && <p className="p-3 text-sm text-muted-foreground">Sem movimentacoes.</p>}
            </div>
          </CardContent>
        </Card>
      )}

      <ProductDrawer
        product={selectedProduct}
        onClose={() => selectProduct(null)}
        onEdit={(product) => openModal('product', product)}
        onMovement={(product) => openModal('movement', product)}
        onRemove={(product) => {
          if (!window.confirm(`Remover ${product.name}? O historico sera preservado.`)) return;
          void removeProduct.mutateAsync(product.id).then(() => selectProduct(null));
        }}
      />

      {activeModal === 'product' && (
        <ProductFormModal
          product={selectedProduct}
          categories={inventory.categories}
          suppliers={inventory.suppliers}
          onClose={closeModal}
          onNewCategory={() => setAuxiliaryModal({ type: 'category' })}
          onNewSupplier={() => setAuxiliaryModal({ type: 'supplier' })}
        />
      )}
      {activeModal === 'movement' && <StockMovementModal products={inventory.products} selectedProduct={selectedProduct} onClose={closeModal} />}
      {activeModal === 'import' && <ImportProductsModal onClose={closeModal} />}
      {auxiliaryModal?.type === 'category' && <CategoryModal category={auxiliaryModal.item} onClose={() => setAuxiliaryModal(null)} />}
      {auxiliaryModal?.type === 'supplier' && <SupplierModal supplier={auxiliaryModal.item} onClose={() => setAuxiliaryModal(null)} />}
    </PageContainer>
  );
}

function EntityAdminList({
  title,
  rows,
  actionLabel,
  onCreate,
}: {
  title: string;
  rows: Array<{ id: string; cells: string[]; onEdit: () => void; onDeactivate: () => void }>;
  actionLabel: string;
  onCreate: () => void;
}) {
  return (
    <Card className="flex min-h-0 flex-col">
      <CardContent className="flex min-h-0 flex-1 flex-col space-y-3 p-5">
        <div className="flex items-center justify-between flex-none">
          <h3 className="font-semibold">{title}</h3>
          <Button size="sm" onClick={onCreate}>{actionLabel}</Button>
        </div>
        <div className="min-h-0 flex-1 rounded-md border border-border overflow-auto">
          {rows.map((row) => (
            <div key={row.id} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 border-b border-border p-3 text-sm">
              {row.cells.map((cell) => <span key={cell}>{cell}</span>)}
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={row.onEdit} aria-label="Editar">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={row.onDeactivate} aria-label="Desativar">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function CategoryModal({ category, onClose }: { category?: Category; onClose: () => void }) {
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const [values, setValues] = useState<CategoryFormValues>({
    name: category?.name ?? '',
    description: category?.description ?? '',
    isActive: category?.isActive ?? true,
  });

  return (
    <ModalFrame title={category ? 'Editar categoria' : 'Nova categoria'} onClose={onClose}>
      <Field label="Nome da categoria">
        <Input value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} />
      </Field>
      <Field label="Descricao opcional">
        <Input value={values.description} onChange={(event) => setValues({ ...values, description: event.target.value })} />
      </Field>
      <ModalActions
        onClose={onClose}
        onSave={() => void (category ? updateCategory.mutateAsync({ id: category.id, values }) : createCategory.mutateAsync(values)).then(onClose)}
      />
    </ModalFrame>
  );
}

function SupplierModal({ supplier, onClose }: { supplier?: Supplier; onClose: () => void }) {
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const [values, setValues] = useState<SupplierFormValues>({
    name: supplier?.name ?? '',
    phone: supplier?.phone ?? '',
    whatsapp: supplier?.whatsapp ?? '',
    documentNumber: supplier?.documentNumber ?? '',
    email: supplier?.email ?? '',
    address: supplier?.address ?? '',
    notes: supplier?.notes ?? '',
    isActive: supplier?.isActive ?? true,
  });

  const normalized = {
    ...values,
    phone: sanitizePhone(values.phone),
    whatsapp: sanitizePhone(values.whatsapp),
    documentNumber: onlyDigits(values.documentNumber),
  };

  return (
    <ModalFrame title={supplier ? 'Editar fornecedor' : 'Novo fornecedor'} onClose={onClose}>
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
        <Field label="Endereco" className="md:col-span-2">
          <Input value={values.address} onChange={(event) => setValues({ ...values, address: event.target.value })} />
        </Field>
        <Field label="Observacoes" className="md:col-span-2">
          <Input value={values.notes} onChange={(event) => setValues({ ...values, notes: event.target.value })} />
        </Field>
      </div>
      <ModalActions
        onClose={onClose}
        onSave={() => void (supplier ? updateSupplier.mutateAsync({ id: supplier.id, values: normalized }) : createSupplier.mutateAsync(normalized)).then(onClose)}
      />
    </ModalFrame>
  );
}

function ModalFrame({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <DialogShell title={title} onClose={onClose} className="max-w-[620px]" zIndexClassName="z-50">
      <DialogBody className="space-y-4">
        {children}
      </DialogBody>
    </DialogShell>
  );
}

function ModalActions({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  return (
    <StickyDialogFooter className="-mx-5 -mb-4 mt-4">
      <Button variant="outline" onClick={onClose}>Cancelar</Button>
      <Button onClick={onSave}>Salvar</Button>
    </StickyDialogFooter>
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
