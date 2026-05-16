import { useEffect, useMemo, useState } from 'react';
import { Edit, History, Search, ShoppingCart, Trash2 } from 'lucide-react';
import { Badge } from '@shared/components/ui/badge';
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
import { QrCodeModal } from '@shared/components/QrCodeModal';
import { buildWhatsappUrl } from '@/utils/whatsapp';

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
  const [whatsappQr, setWhatsappQr] = useState<{ title: string; value: string } | null>(null);

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
    <div className="grid gap-6 px-6 pb-6 pt-4 xl:grid-cols-[minmax(0,1fr)_minmax(380px,420px)]">
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar nome, telefone, WhatsApp ou CPF/CNPJ"
          />
        </div>

        <Card>
          <CardContent className="p-0">
            {filteredCustomers.map((customer) => (
              <div key={customer.id} className="grid gap-3 border-b border-border p-4 hover:bg-muted/50">
                <button type="button" className="min-w-0 text-left" onClick={() => selectCustomer(customer)}>
                  <p className="truncate font-medium">{customer.name}</p>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {formatBrazilianPhone(customer.phone) || 'Sem telefone'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Última atualização: {customer.updatedAt}</p>
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    title="Editar cliente"
                    onClick={() => setEditing(customer)}
                  >
                    <Edit className="h-4 w-4" />
                    Editar
                  </Button>
                  <CustomerWhatsappButton customer={customer} {...whatsappActions} />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    title="QR WhatsApp"
                    onClick={() => {
                      const url = buildWhatsappUrl(customer.whatsapp || customer.phone, `Olá, ${customer.name}. Aqui é da LingoMotos.`);
                      if (!url) {
                        showToast({ tone: 'error', message: 'Telefone invalido.' });
                        return;
                      }
                      setWhatsappQr({ title: `QR WhatsApp - ${customer.name}`, value: url });
                    }}
                  >
                    QR WhatsApp
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    title="Nova venda"
                    onClick={() => {
                      selectCustomer(customer);
                      selectPosCustomer(customer);
                      navigate('/vendas');
                    }}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Nova venda
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    title="Histórico"
                    onClick={() => selectCustomer(customer)}
                  >
                    <History className="h-4 w-4" />
                    Histórico
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    title="Excluir cliente"
                    disabled={!cashOpen}
                    onClick={async () => {
                      if (!cashOpen) {
                        showToast({ tone: 'error', message: 'Abra o caixa para cadastrar clientes.' });
                        return;
                      }
                      if (!window.confirm(`Excluir cliente ${customer.name}? O historico de vendas sera preservado.`)) return;
                      try {
                        await deleteCustomer(customer.id);
                        showToast({ tone: 'success', message: 'Cliente excluido com sucesso.' });
                      } catch {
                        showToast({ tone: 'error', message: 'Erro ao excluir cliente.' });
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="h-fit overflow-hidden">
        <CardHeader>
          <CardTitle>Detalhes do cliente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedCustomer ? (
            <>
              <div>
                <p className="text-lg font-semibold">{selectedCustomer.name}</p>
              </div>
              <Info label="CPF/CNPJ" value={formatCpfCnpj(selectedCustomer.documentNumber) || 'Não informado'} />
              <Info label="Telefone" value={formatBrazilianPhone(selectedCustomer.phone) || 'Não informado'} />
              <Info label="WhatsApp" value={formatBrazilianPhone(selectedCustomer.whatsapp) || 'Não informado'} />
              <Info label="E-mail" value={selectedCustomer.email || 'Não informado'} />
              <Info label="Endereço" value={selectedCustomer.address || 'Não informado'} />
              <Info label="Observações" value={selectedCustomer.notes || 'Sem observações'} />
              <div className="rounded-md border border-border p-3 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Histórico</p>
                <div className="mt-2 space-y-2">
                  {customerSales.map((sale) => (
                    <div key={sale.id} className="flex items-center justify-between gap-3">
                      <span>Venda {sale.saleNumber}</span>
                      <span>{formatCurrency(sale.totalCents)}</span>
                    </div>
                  ))}
                  {customerSales.length === 0 && (
                    <p>Sem compras registradas.</p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Button className="min-w-fit" onClick={() => setEditing(selectedCustomer)}>Editar</Button>
                  <CustomerWhatsappButton customer={selectedCustomer} label="Abrir WhatsApp" size="default" className="min-w-fit" {...whatsappActions} />
                </div>
                <Button
                  variant="destructive"
                  className="min-w-fit"
                  disabled={!cashOpen}
                  onClick={async () => {
                    if (!cashOpen) {
                      showToast({ tone: 'error', message: 'Abra o caixa para cadastrar clientes.' });
                      return;
                    }
                    if (!window.confirm(`Excluir cliente ${selectedCustomer.name}? O historico de vendas sera preservado.`)) return;
                    try {
                      await deleteCustomer(selectedCustomer.id);
                      showToast({ tone: 'success', message: 'Cliente excluido com sucesso.' });
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
      {whatsappQr && (
        <QrCodeModal
          title={whatsappQr.title}
          description="Escaneie para abrir a conversa no WhatsApp."
          value={whatsappQr.value}
          fileName="whatsapp-cliente.svg"
          onClose={() => setWhatsappQr(null)}
        />
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

function emptyCustomer(): Customer {
  return { id: '', name: '', phone: '', whatsapp: '', documentNumber: '', email: '', address: '', notes: '', updatedAt: '' };
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
    <div className="fixed inset-0 z-40 grid place-items-center bg-background/80 backdrop-blur-sm">
      <form
        className="w-[720px] rounded-lg border border-border bg-card p-6 shadow-lg"
        onSubmit={(event) => {
          event.preventDefault();
          onSave(values);
        }}
      >
        <div>
          <h3 className="text-base font-semibold">{customer.id ? 'Editar cliente' : 'Novo cliente'}</h3>
          <p className="mt-1 text-sm text-muted-foreground">Dados de contato e cadastro do cliente.</p>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
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
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit">Salvar alterações</Button>
        </div>
      </form>
    </div>
  );
}

function sanitizeCustomer(customer: Omit<Customer, 'updatedAt'>): Omit<Customer, 'updatedAt'> {
  return {
    ...customer,
    phone: sanitizePhone(customer.phone),
    whatsapp: sanitizePhone(customer.whatsapp || customer.phone),
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
