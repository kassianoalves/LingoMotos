import { useEffect, useMemo, useState } from 'react';
import { Edit, History, MoreVertical, Search, ShoppingCart, Trash2 } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Input } from '@shared/components/ui/input';
import { CustomerWhatsappButton } from '../components/CustomerWhatsappButton';
import { useCustomersStore } from '../stores/customers.store';
import type { Customer } from '../types/customer.types';
import { formatBrazilianPhone, sanitizePhone } from '../utils/customer-phone';
import { formatCpfCnpj, onlyDigits } from '@/utils/formatters';
import { usePosCustomerStore } from '@features/pos/stores/pos-customer.store';
import { financeRepository } from '@features/finance/repositories/finance.repository';
import { formatCurrency } from '@/utils/formatters';
import { DialogBody, DialogShell, PageContainer, ScrollArea, StickyDialogFooter } from '@shared/components/layout';

type ToastState = {
  message: string;
  tone: 'success' | 'error';
};

export function CustomersPage({ navigate, cashOpen }: { navigate: (route: string) => void; cashOpen: boolean }) {
  const customers = useCustomersStore((state) => state.customers);
  const selectedCustomer = useCustomersStore((state) => state.selectedCustomer);
  const search = useCustomersStore((state) => state.search);
  const setSearch = useCustomersStore((state) => state.setSearch);
  const selectCustomer = useCustomersStore((state) => state.selectCustomer);
  const saveCustomer = useCustomersStore((state) => state.saveCustomer);
  const deleteCustomer = useCustomersStore((state) => state.deleteCustomer);
  const loadCustomers = useCustomersStore((state) => state.loadCustomers);
  const selectPosCustomer = usePosCustomerStore((state) => state.selectCustomer);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [customerSales, setCustomerSales] = useState<Array<{ id: string; saleNumber: string; totalCents: number }>>([]);
  const [actionsMenuCustomerId, setActionsMenuCustomerId] = useState<string | null>(null);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  useEffect(() => {
    if (!selectedCustomer) {
      setCustomerSales([]);
      return;
    }
    void financeRepository.listCustomerSales(selectedCustomer.name).then(setCustomerSales);
  }, [selectedCustomer]);

  useEffect(() => {
    function handleCreateCustomer() {
      if (!cashOpen) {
        showToast({ tone: 'error', message: 'Abra o caixa para cadastrar clientes.' });
        return;
      }
      setEditing(emptyCustomer());
    }

    window.addEventListener('customers:create', handleCreateCustomer);
    return () => window.removeEventListener('customers:create', handleCreateCustomer);
  }, [cashOpen]);

  function showToast(nextToast: ToastState) {
    setToast(nextToast);
    window.setTimeout(() => setToast(null), nextToast.tone === 'error' ? 4500 : 3000);
  }

  const whatsappActions = {
    onInvalidPhone: () => showToast({ tone: 'error', message: 'Telefone inválido.' }),
    onOpening: () => showToast({ tone: 'success', message: 'Abrindo WhatsApp...' }),
  };

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('pt-BR');
    return customers.filter((customer) =>
      [customer.name, customer.phone, customer.whatsapp, customer.documentNumber]
        .join(' ')
        .toLocaleLowerCase('pt-BR')
        .includes(query),
    );
  }, [customers, search]);

  return (
    <PageContainer className="gap-3">
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(280px,0.9fr)_minmax(0,1.1fr)] gap-3">
        <div className="flex min-h-0 flex-col gap-3">
          <div className="flex flex-none items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-9 pl-9 compact:h-8"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar nome, telefone, WhatsApp ou CPF/CNPJ"
              />
            </div>
            <Button
              type="button"
              size="sm"
              className="h-9 flex-none compact:h-8"
              disabled={!cashOpen}
              onClick={() => setEditing(emptyCustomer())}
            >
              Novo
            </Button>
          </div>

          <Card className="min-h-0 flex-1 overflow-hidden">
            <CardContent className="h-full min-h-0 overflow-y-auto p-0">
              {filteredCustomers.map((customer) => (
                <div key={customer.id} className="relative border-b border-border p-3 hover:bg-muted/50 compact:p-2">
                  <button type="button" className="min-w-0 pr-9 text-left" onClick={() => selectCustomer(customer)}>
                    <p className="truncate font-medium">{customer.name}</p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">Moto: {customer.motorcycleModel || 'Moto não informada'}</p>
                  </button>

                  <div className="absolute right-2 top-2">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      aria-label="Abrir ações do cliente"
                      onClick={(event) => {
                        event.stopPropagation();
                        setActionsMenuCustomerId((current) => (current === customer.id ? null : customer.id));
                      }}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                    {actionsMenuCustomerId === customer.id && (
                      <CustomerActionsMenu
                        customer={customer}
                        cashOpen={cashOpen}
                        onClose={() => setActionsMenuCustomerId(null)}
                        onEdit={() => setEditing(customer)}
                        onSelect={() => selectCustomer(customer)}
                        onNewSale={() => {
                          selectCustomer(customer);
                          selectPosCustomer(customer);
                          navigate('/vendas');
                        }}
                        onDelete={async () => {
                          if (!cashOpen) {
                            showToast({ tone: 'error', message: 'Abra o caixa para cadastrar clientes.' });
                            return;
                          }
                          if (!window.confirm(`Excluir cliente ${customer.name}? O histórico de vendas será preservado.`)) return;
                          try {
                            await deleteCustomer(customer.id);
                            showToast({ tone: 'success', message: 'Cliente excluído com sucesso.' });
                          } catch {
                            showToast({ tone: 'error', message: 'Erro ao excluir cliente.' });
                          }
                        }}
                        whatsappActions={whatsappActions}
                      />
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="flex min-h-0 flex-col overflow-hidden">
          <CardHeader className="flex-none p-3 pb-2 compact:p-2">
            <CardTitle className="text-sm">Detalhes do cliente</CardTitle>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden p-3 pt-0 compact:p-2">
            {selectedCustomer ? (
              <>
                <div className="flex-none">
                  <p className="truncate text-base font-semibold">{selectedCustomer.name}</p>
                </div>
                <div className="mt-3 grid flex-none gap-2 md:grid-cols-2 compact:mt-2">
                  <Info label="CPF/CNPJ" value={formatCpfCnpj(selectedCustomer.documentNumber) || 'Não informado'} />
                  <Info label="Telefone" value={formatBrazilianPhone(selectedCustomer.phone) || 'Não informado'} />
                  <Info label="WhatsApp" value={formatBrazilianPhone(selectedCustomer.whatsapp) || 'Não informado'} />
                  <Info label="Modelo da moto" value={selectedCustomer.motorcycleModel || 'Moto não informada'} />
                  <Info label="E-mail" value={selectedCustomer.email || 'Não informado'} />
                  <Info label="Endereço" value={selectedCustomer.address || 'Não informado'} />
                  <Info label="Observações" value={selectedCustomer.notes || 'Sem observações'} />
                </div>
                <ScrollArea className="mt-3 min-h-0 flex-1 rounded-md border border-border p-3 text-sm text-muted-foreground compact:mt-2 compact:p-2">
                  <p className="font-medium text-foreground">Histórico</p>
                  <div className="mt-2 space-y-2">
                    {customerSales.map((sale) => (
                      <div key={sale.id} className="flex items-center justify-between gap-3">
                        <span>Venda {sale.saleNumber}</span>
                        <span>{formatCurrency(sale.totalCents)}</span>
                      </div>
                    ))}
                    {customerSales.length === 0 && <p>Sem compras registradas.</p>}
                  </div>
                </ScrollArea>
                <div className="mt-3 flex flex-none flex-wrap items-center justify-between gap-2 border-t border-border pt-3 compact:mt-2 compact:pt-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button className="h-9 min-w-fit px-3" onClick={() => setEditing(selectedCustomer)}>Editar</Button>
                    <CustomerWhatsappButton customer={selectedCustomer} label="Abrir WhatsApp" size="default" className="h-9 min-w-fit px-3" {...whatsappActions} />
                  </div>
                  <Button
                    variant="destructive"
                    className="h-9 min-w-fit px-3"
                    disabled={!cashOpen}
                    onClick={async () => {
                      if (!cashOpen) {
                        showToast({ tone: 'error', message: 'Abra o caixa para cadastrar clientes.' });
                        return;
                      }
                      if (!window.confirm(`Excluir cliente ${selectedCustomer.name}? O histórico de vendas será preservado.`)) return;
                      try {
                        await deleteCustomer(selectedCustomer.id);
                        showToast({ tone: 'success', message: 'Cliente excluído com sucesso.' });
                      } catch {
                        showToast({ tone: 'error', message: 'Erro ao excluir cliente.' });
                      }
                    }}
                  >
                    Excluir
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Selecione um cliente.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {editing && (
        <CustomerModal
          customer={editing}
          onClose={() => setEditing(null)}
          onSave={async (customer) => {
            if (!customer.id && !cashOpen) {
              showToast({ tone: 'error', message: 'Abra o caixa para cadastrar clientes.' });
              return;
            }
            await saveCustomer(sanitizeCustomer(customer));
            setEditing(null);
          }}
        />
      )}

      {toast && <Toast message={toast.message} tone={toast.tone} />}
    </PageContainer>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md border border-border/60 p-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="truncate text-sm font-medium" title={value}>{value}</p>
    </div>
  );
}

function CustomerActionsMenu({
  customer,
  cashOpen,
  whatsappActions,
  onClose,
  onEdit,
  onSelect,
  onNewSale,
  onDelete,
}: {
  customer: Customer;
  cashOpen: boolean;
  whatsappActions: { onInvalidPhone: () => void; onOpening: () => void };
  onClose: () => void;
  onEdit: () => void;
  onSelect: () => void;
  onNewSale: () => void;
  onDelete: () => Promise<void>;
}) {
  const itemClass = 'flex h-8 w-full items-center gap-2 rounded-sm px-2 text-left text-sm hover:bg-muted';

  return (
    <div className="absolute right-0 top-8 z-20 w-44 rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-lg">
      <button type="button" className={itemClass} onClick={() => { onEdit(); onClose(); }}>
        <Edit className="h-4 w-4" />
        Editar
      </button>
      <CustomerWhatsappButton
        customer={customer}
        variant="ghost"
        size="sm"
        className="h-8 w-full justify-start px-2"
        {...whatsappActions}
      />
      <button type="button" className={itemClass} onClick={() => { onNewSale(); onClose(); }}>
        <ShoppingCart className="h-4 w-4" />
        Nova venda
      </button>
      <button type="button" className={itemClass} onClick={() => { onSelect(); onClose(); }}>
        <History className="h-4 w-4" />
        Histórico
      </button>
      <button
        type="button"
        className={`${itemClass} text-destructive disabled:cursor-not-allowed disabled:opacity-50`}
        disabled={!cashOpen}
        onClick={() => void onDelete().finally(onClose)}
      >
        <Trash2 className="h-4 w-4" />
        Excluir
      </button>
    </div>
  );
}

function emptyCustomer(): Customer {
  return { id: '', name: '', phone: '', whatsapp: '', motorcycleModel: '', documentNumber: '', email: '', address: '', notes: '', updatedAt: '' };
}

function CustomerModal({
  customer,
  onClose,
  onSave,
}: {
  customer: Customer;
  onClose: () => void;
  onSave: (customer: Omit<Customer, 'updatedAt'>) => void;
}) {
  const [values, setValues] = useState(customer);

  return (
    <DialogShell
      title={customer.id ? 'Editar cliente' : 'Novo cliente'}
      description="Dados de contato e cadastro do cliente."
      onClose={onClose}
      className="max-w-[720px]"
    >
      <form
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
        onSubmit={(event) => {
          event.preventDefault();
          onSave(values);
        }}
      >
        <DialogBody>
          <div className="grid gap-4 md:grid-cols-2 compact:gap-3">
            <Field label="Nome completo" className="md:col-span-2">
              <Input value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} required />
            </Field>
            <Field label="Telefone">
              <Input
                value={formatBrazilianPhone(values.phone)}
                onChange={(event) => setValues({ ...values, phone: event.target.value })}
                inputMode="tel"
              />
            </Field>
            <Field label="WhatsApp">
              <Input
                value={formatBrazilianPhone(values.whatsapp)}
                onChange={(event) => setValues({ ...values, whatsapp: event.target.value })}
                inputMode="tel"
              />
            </Field>
            <Field label="Modelo da moto">
              <Input value={values.motorcycleModel} onChange={(event) => setValues({ ...values, motorcycleModel: event.target.value })} />
            </Field>
            <Field label="CPF/CNPJ">
              <Input
                value={formatCpfCnpj(values.documentNumber)}
                onChange={(event) => setValues({ ...values, documentNumber: event.target.value })}
                inputMode="numeric"
              />
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
        </DialogBody>
        <StickyDialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit">Salvar alterações</Button>
        </StickyDialogFooter>
      </form>
    </DialogShell>
  );
}

function sanitizeCustomer(customer: Omit<Customer, 'updatedAt'>): Omit<Customer, 'updatedAt'> {
  return {
    ...customer,
    phone: sanitizePhone(customer.phone),
    whatsapp: sanitizePhone(customer.whatsapp || customer.phone),
    motorcycleModel: customer.motorcycleModel.trim(),
    documentNumber: onlyDigits(customer.documentNumber),
  };
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

function Toast({ message, tone }: ToastState) {
  return (
    <div
      className={`fixed bottom-5 right-5 z-50 rounded-md border px-4 py-3 text-sm shadow-lg ${
        tone === 'success'
          ? 'border-success/30 bg-success text-success-foreground'
          : 'border-destructive/30 bg-destructive text-destructive-foreground'
      }`}
      role="status"
    >
      {message}
    </div>
  );
}
