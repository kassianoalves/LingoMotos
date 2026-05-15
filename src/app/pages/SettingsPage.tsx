import { useState } from 'react';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Input } from '@shared/components/ui/input';

type EditableItem = {
  id: string;
  name: string;
};

const auxiliarySeed = {
  productCategories: [{ id: 'cat-1', name: 'Óleos e lubrificantes' }],
  suppliers: [{ id: 'sup-1', name: 'MotoParts Distribuidora' }],
  financeCategories: [{ id: 'fin-1', name: 'Despesas operacionais' }],
  paymentMethods: [{ id: 'pay-1', name: 'Pix' }],
};

export function SettingsPage() {
  const [storeInfo, setStoreInfo] = useState({
    name: 'LingoMotos',
    documentNumber: '',
    phone: '',
    whatsapp: '',
    email: '',
    address: '',
    logo: '',
  });
  const [preferences, setPreferences] = useState({
    currency: 'BRL',
    minimumStock: '5',
    defaultMargin: '30',
  });
  const [auxiliary, setAuxiliary] = useState(auxiliarySeed);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-xl font-semibold">Configurações</h2>
        <p className="text-sm text-muted-foreground">Dados da loja, cadastros auxiliares, preferências e manutenção.</p>
      </div>

      <section className="grid gap-6 xl:grid-cols-2">
        <SettingsCard title="Informações da loja">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nome da loja">
              <Input value={storeInfo.name} onChange={(event) => setStoreInfo({ ...storeInfo, name: event.target.value })} />
            </Field>
            <Field label="CNPJ">
              <Input value={storeInfo.documentNumber} onChange={(event) => setStoreInfo({ ...storeInfo, documentNumber: event.target.value })} />
            </Field>
            <Field label="Telefone">
              <Input value={storeInfo.phone} onChange={(event) => setStoreInfo({ ...storeInfo, phone: event.target.value })} />
            </Field>
            <Field label="WhatsApp">
              <Input value={storeInfo.whatsapp} onChange={(event) => setStoreInfo({ ...storeInfo, whatsapp: event.target.value })} />
            </Field>
            <Field label="E-mail">
              <Input value={storeInfo.email} onChange={(event) => setStoreInfo({ ...storeInfo, email: event.target.value })} />
            </Field>
            <Field label="Logo">
              <Input value={storeInfo.logo} onChange={(event) => setStoreInfo({ ...storeInfo, logo: event.target.value })} />
            </Field>
            <Field label="Endereço" className="md:col-span-2">
              <Input value={storeInfo.address} onChange={(event) => setStoreInfo({ ...storeInfo, address: event.target.value })} />
            </Field>
          </div>
        </SettingsCard>

        <SettingsCard title="Preferências do sistema">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Tema">
              <Input value="Claro/Escuro pelo botão superior" disabled />
            </Field>
            <Field label="Moeda">
              <Input value={preferences.currency} onChange={(event) => setPreferences({ ...preferences, currency: event.target.value })} />
            </Field>
            <Field label="Estoque mínimo padrão">
              <Input inputMode="numeric" value={preferences.minimumStock} onChange={(event) => setPreferences({ ...preferences, minimumStock: event.target.value.replace(/\D/g, '') })} />
            </Field>
            <Field label="Margem padrão (%)">
              <Input inputMode="decimal" value={preferences.defaultMargin} onChange={(event) => setPreferences({ ...preferences, defaultMargin: event.target.value })} />
            </Field>
          </div>
        </SettingsCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <SettingsCard title="Cadastros auxiliares">
          <div className="grid gap-4 md:grid-cols-2">
            <EditableList
              title="Categorias de produtos"
              items={auxiliary.productCategories}
              onChange={(items) => setAuxiliary({ ...auxiliary, productCategories: items })}
            />
            <EditableList
              title="Fornecedores"
              items={auxiliary.suppliers}
              onChange={(items) => setAuxiliary({ ...auxiliary, suppliers: items })}
            />
            <EditableList
              title="Categorias financeiras"
              items={auxiliary.financeCategories}
              onChange={(items) => setAuxiliary({ ...auxiliary, financeCategories: items })}
            />
            <EditableList
              title="Formas de pagamento"
              items={auxiliary.paymentMethods}
              onChange={(items) => setAuxiliary({ ...auxiliary, paymentMethods: items })}
            />
          </div>
        </SettingsCard>

        <SettingsCard title="Backup">
          <div className="grid gap-3 md:grid-cols-2">
            {['Backup de clientes', 'Backup de estoque', 'Backup financeiro', 'Backup completo', 'Restaurar backup'].map((label) => (
              <Button key={label} variant="outline">{label}</Button>
            ))}
          </div>
        </SettingsCard>
      </section>

      <SettingsCard title="Dados e manutenção">
        <div className="flex flex-wrap gap-3">
          <Button variant="outline">Exportar dados</Button>
          <Button variant="outline">Importar dados</Button>
          <Button variant="outline" disabled>Limpeza segura futura</Button>
        </div>
      </SettingsCard>
    </div>
  );
}

function SettingsCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
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

function EditableList({
  title,
  items,
  onChange,
}: {
  title: string;
  items: EditableItem[];
  onChange: (items: EditableItem[]) => void;
}) {
  const [draft, setDraft] = useState('');

  return (
    <div className="rounded-md border border-border p-3">
      <p className="text-sm font-medium">{title}</p>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-2">
            <Input
              value={item.name}
              onChange={(event) =>
                onChange(items.map((current) => (current.id === item.id ? { ...current, name: event.target.value } : current)))
              }
            />
            <Button variant="outline" size="sm" onClick={() => onChange(items.filter((current) => current.id !== item.id))}>
              Excluir
            </Button>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <Input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Novo registro" />
        <Button
          size="sm"
          onClick={() => {
            if (!draft.trim()) return;
            onChange([...items, { id: crypto.randomUUID(), name: draft.trim() }]);
            setDraft('');
          }}
        >
          Adicionar
        </Button>
      </div>
    </div>
  );
}
