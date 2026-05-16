import { useState } from 'react';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import type { Customer, CustomerInput } from '../types/customer.types';
import { formatBrazilianPhone, sanitizePhone } from '../utils/customer-phone';
import { formatCpfCnpj, onlyDigits } from '@/utils/formatters';

export function emptyCustomer(): Customer {
  return { id: '', name: '', phone: '', whatsapp: '', documentNumber: '', email: '', address: '', notes: '', updatedAt: '' };
}

export function CustomerFormModal({
  customer,
  onClose,
  onSave,
}: {
  customer: Customer;
  onClose: () => void;
  onSave: (customer: CustomerInput) => Promise<void>;
}) {
  const [values, setValues] = useState(customer);
  const [saving, setSaving] = useState(false);

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-background/80 backdrop-blur-sm">
      <form
        className="w-[720px] rounded-lg border border-border bg-card p-6 shadow-lg"
        onSubmit={async (event) => {
          event.preventDefault();
          setSaving(true);
          try {
            await onSave({
              ...values,
              phone: sanitizePhone(values.phone),
              whatsapp: sanitizePhone(values.whatsapp || values.phone),
              documentNumber: onlyDigits(values.documentNumber),
            });
          } finally {
            setSaving(false);
          }
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
            <Input value={formatBrazilianPhone(values.phone)} onChange={(event) => setValues({ ...values, phone: event.target.value })} inputMode="tel" />
          </Field>
          <Field label="WhatsApp">
            <Input value={formatBrazilianPhone(values.whatsapp)} onChange={(event) => setValues({ ...values, whatsapp: event.target.value })} inputMode="tel" />
          </Field>
          <Field label="CPF/CNPJ">
            <Input value={formatCpfCnpj(values.documentNumber)} onChange={(event) => setValues({ ...values, documentNumber: event.target.value })} inputMode="numeric" />
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
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={saving}>Salvar alteracoes</Button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`grid gap-2 text-sm ${className ?? ''}`}>
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}
