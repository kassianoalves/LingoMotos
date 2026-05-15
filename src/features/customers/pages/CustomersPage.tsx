import { useMemo, useState } from 'react';
import { MessageCircle, Plus, Search } from 'lucide-react';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Input } from '@shared/components/ui/input';
import { useCustomersStore } from '../stores/customers.store';
import type { Customer } from '../types/customer.types';

export function CustomersPage() {
  const customers = useCustomersStore((state) => state.customers);
  const selectedCustomer = useCustomersStore((state) => state.selectedCustomer);
  const search = useCustomersStore((state) => state.search);
  const setSearch = useCustomersStore((state) => state.setSearch);
  const selectCustomer = useCustomersStore((state) => state.selectCustomer);
  const saveCustomer = useCustomersStore((state) => state.saveCustomer);
  const [editing, setEditing] = useState<Customer | null>(null);
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
    <div className="grid gap-6 p-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Clientes</h2>
            <p className="text-sm text-muted-foreground">Cadastro separado do inicio, pronto para historico de compras.</p>
          </div>
          <Button onClick={() => setEditing(emptyCustomer())}>
            <Plus className="h-4 w-4" />
            Novo cliente
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar nome, telefone, WhatsApp ou CPF/CNPJ" />
        </div>
        <Card>
          <CardContent className="p-0">
            {filteredCustomers.map((customer) => (
              <button
                key={customer.id}
                type="button"
                className="flex w-full items-center justify-between border-b border-border p-4 text-left hover:bg-muted/50"
                onClick={() => selectCustomer(customer)}
              >
                <div>
                  <p className="font-medium">{customer.name}</p>
                  <p className="text-sm text-muted-foreground">{customer.phone || 'Sem telefone'} · {customer.documentNumber || 'CPF/CNPJ opcional'}</p>
                </div>
                <Badge variant="secondary">{customer.updatedAt}</Badge>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalhes do cliente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedCustomer ? (
            <>
              <div>
                <p className="text-lg font-semibold">{selectedCustomer.name}</p>
                <p className="text-sm text-muted-foreground">{selectedCustomer.documentNumber || 'Sem CPF/CNPJ'}</p>
              </div>
              <Info label="Telefone" value={selectedCustomer.phone || 'Nao informado'} />
              <Info label="WhatsApp" value={selectedCustomer.whatsapp || 'Nao informado'} />
              <Info label="Observacoes" value={selectedCustomer.notes || 'Sem observacoes'} />
              <div className="rounded-md border border-border p-3 text-sm text-muted-foreground">
                Historico de compras sera exibido aqui quando o modulo de vendas persistir no SQLite.
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setEditing(selectedCustomer)}>Editar</Button>
                <Button variant="outline">
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
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
          onSave={(customer) => {
            saveCustomer(customer);
            setEditing(null);
          }}
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
  return { id: '', name: '', phone: '', whatsapp: '', documentNumber: '', notes: '', updatedAt: '' };
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
        className="w-[620px] rounded-lg border border-border bg-card p-5 shadow-lg"
        onSubmit={(event) => {
          event.preventDefault();
          onSave(values);
        }}
      >
        <h3 className="text-base font-semibold">{customer.id ? 'Editar cliente' : 'Novo cliente'}</h3>
        <div className="mt-4 grid gap-3">
          <Input value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} placeholder="Nome" required />
          <Input value={values.phone} onChange={(event) => setValues({ ...values, phone: event.target.value })} placeholder="Telefone" />
          <Input value={values.whatsapp} onChange={(event) => setValues({ ...values, whatsapp: event.target.value })} placeholder="WhatsApp" />
          <Input value={values.documentNumber} onChange={(event) => setValues({ ...values, documentNumber: event.target.value })} placeholder="CPF/CNPJ opcional" />
          <Input value={values.notes} onChange={(event) => setValues({ ...values, notes: event.target.value })} placeholder="Observacoes" />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit">Salvar</Button>
        </div>
      </form>
    </div>
  );
}

