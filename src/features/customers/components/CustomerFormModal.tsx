import { useState } from 'react';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { DialogBody, DialogShell, StickyDialogFooter } from '@shared/components/layout';
import type { Customer, CustomerInput } from '../types/customer.types';
import { formatBrazilianPhone, sanitizePhone } from '../utils/customer-phone';
import { formatCpfCnpj, onlyDigits } from '@/utils/formatters';

export function emptyCustomer(): Customer {
  return { id: '', name: '', phone: '', whatsapp: '', motorcycleModel: '', documentNumber: '', email: '', address: '', notes: '', updatedAt: '' };
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
    <DialogShell
      title={customer.id ? 'Editar cliente' : 'Novo cliente'}
      description="Dados de contato e cadastro do cliente."
      onClose={onClose}
      className="max-w-[720px]"
    >
      <form
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
        onSubmit={async (event) => {
          event.preventDefault();
          setSaving(true);
          try {
            await onSave({
              ...values,
              phone: sanitizePhone(values.phone),
              whatsapp: sanitizePhone(values.whatsapp || values.phone),
              motorcycleModel: values.motorcycleModel.trim(),
              documentNumber: onlyDigits(values.documentNumber),
            });
          } finally {
            setSaving(false);
          }
        }}
      >
        <DialogBody>
        <div className="grid gap-4 md:grid-cols-2 compact:gap-3">
          <Field label="Nome completo" className="md:col-span-2">
            <Input value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} required />
          </Field>
          <Field label="Telefone">
            <Input value={formatBrazilianPhone(values.phone)} onChange={(event) => setValues({ ...values, phone: event.target.value })} inputMode="tel" />
          </Field>
          <Field label="WhatsApp">
            <Input value={formatBrazilianPhone(values.whatsapp)} onChange={(event) => setValues({ ...values, whatsapp: event.target.value })} inputMode="tel" />
          </Field>
          <Field label="Modelo da moto">
            <Input value={values.motorcycleModel} onChange={(event) => setValues({ ...values, motorcycleModel: event.target.value })} />
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
        </DialogBody>
        <StickyDialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={saving}>Salvar alteracoes</Button>
        </StickyDialogFooter>
      </form>
    </DialogShell>
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
