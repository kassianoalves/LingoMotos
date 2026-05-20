import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import type { Category, Product, ProductCustomFieldInput, ProductFormValues, Supplier } from '../types/inventory.types';
import { useSaveProduct } from '../queries/inventory.queries';
import { inventoryService } from '../services/inventory.service';
import { formatBRLInput, parseBRLInputToCents, sanitizeIntegerInput } from '@/utils/numberFormat';
import { DialogBody, DialogShell, StickyDialogFooter } from '@shared/components/layout';

type ProductFormModalProps = {
  product: Product | null;
  categories: Category[];
  suppliers: Supplier[];
  onClose: () => void;
  onNewCategory: () => void;
  onNewSupplier: () => void;
};

export function ProductFormModal({ product, categories, suppliers, onClose, onNewCategory, onNewSupplier }: ProductFormModalProps) {
  const saveProduct = useSaveProduct();
  const initialValues = useMemo<ProductFormValues>(
    () => ({
      sku: product?.sku ?? '',
      barcode: product?.barcode ?? '',
      name: product?.name ?? '',
      categoryId: product?.categoryId ?? categories[0]?.id ?? '',
      supplierId: product?.supplierId ?? '',
      brand: product?.brand ?? '',
      motorcycleApplication: product?.motorcycleApplication ?? '',
      location: product?.location ?? '',
      notes: product?.notes ?? '',
      unit: product?.unit ?? 'un',
      costPriceCents: product?.costPriceCents ?? 0,
      salePriceCents: product?.salePriceCents ?? 0,
      minStockQuantity: product?.minStockQuantity ?? 0,
      currentStockQuantity: product?.currentStockQuantity ?? 0,
      customFields: product?.customFields.map(({ fieldKey, fieldLabel, fieldType, fieldValue }) => ({
        fieldKey,
        fieldLabel,
        fieldType,
        fieldValue,
      })) ?? [],
    }),
    [categories, product],
  );
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState('');
  const [manualSku, setManualSku] = useState(Boolean(product?.sku));
  const [generatingSku, setGeneratingSku] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const result = await saveProduct.mutateAsync({ values, productId: product?.id });

      if (!result.ok) {
        setErrors(result.errors);
        return;
      }

      setToast(product ? 'Produto atualizado com sucesso.' : 'Produto salvo com sucesso.');
      window.setTimeout(onClose, 600);
    } catch (error) {
      console.error(error);
      setToast(error instanceof Error && error.message.includes('codigo interno') ? 'Este código interno já está em uso.' : 'Erro ao salvar produto.');
    }
  }

  useEffect(() => {
    if (!values.categoryId && categories[0]?.id) {
      setValues((current) => ({ ...current, categoryId: categories[0].id }));
    }
  }, [categories, values.categoryId]);

  useEffect(() => {
    if (product || manualSku || !values.name.trim()) return;
    const timeoutId = window.setTimeout(() => {
      void generateSku();
    }, 350);
    return () => window.clearTimeout(timeoutId);
  }, [manualSku, product, values.categoryId, values.brand, values.motorcycleApplication, values.name]);

  return (
    <DialogShell
      title={product ? 'Editar produto' : 'Novo produto'}
      description="Cadastro rapido para operacao de balcao."
      onClose={onClose}
      className="max-w-[760px]"
    >
      <form className="flex min-h-0 flex-1 flex-col overflow-hidden" onSubmit={handleSubmit}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold">{product ? 'Editar produto' : 'Novo produto'}</h2>
            <p className="text-sm text-muted-foreground">Cadastro rápido para operação de balcão.</p>
          </div>
          <Button type="button" variant="ghost" onClick={onClose}>Fechar</Button>
        </div>

        <DialogBody>
        <div className="grid gap-4 md:grid-cols-2 compact:gap-3">
          <Field label="SKU / Código interno" error={errors.sku}>
            <div className="space-y-2">
              <Input
                value={values.sku}
                onChange={(event) => {
                  setManualSku(true);
                  setValues({ ...values, sku: event.target.value });
                }}
              />
              <p className="text-xs text-muted-foreground">
                Código interno usado para identificar o produto no estoque. Pode ser gerado automaticamente ou editado manualmente.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" disabled={generatingSku || !values.name.trim()} onClick={() => void generateSku()}>
                  {product ? 'Gerar novo código' : 'Gerar código'}
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setManualSku(true)}>
                  Editar manualmente
                </Button>
              </div>
            </div>
          </Field>
          <Field label="Código de barras">
            <Input value={values.barcode} onChange={(event) => setValues({ ...values, barcode: event.target.value })} />
          </Field>
          <Field label="Nome" error={errors.name}>
            <Input value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} />
          </Field>
          <Field label="Localização">
            <Input value={values.location} onChange={(event) => setValues({ ...values, location: event.target.value })} />
          </Field>
          <Field label="Marca">
            <Input value={values.brand} onChange={(event) => setValues({ ...values, brand: event.target.value })} />
          </Field>
          <Field label="Aplicacao">
            <Input value={values.motorcycleApplication} onChange={(event) => setValues({ ...values, motorcycleApplication: event.target.value })} />
          </Field>
          <Field label="Categoria" error={errors.categoryId}>
            <div className="flex gap-2">
              <select
                className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm"
                value={values.categoryId}
                onChange={(event) => setValues({ ...values, categoryId: event.target.value })}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <Button type="button" variant="outline" onClick={onNewCategory}>Nova categoria</Button>
            </div>
          </Field>
          <Field label="Fornecedor">
            <div className="flex gap-2">
              <select
                className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm"
                value={values.supplierId}
                onChange={(event) => setValues({ ...values, supplierId: event.target.value })}
              >
                <option value="">Sem fornecedor</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
              <Button type="button" variant="outline" onClick={onNewSupplier}>Novo fornecedor</Button>
            </div>
          </Field>
          <MoneyField
            label="Preço de custo"
            value={values.costPriceCents}
            onChange={(value) => setValues({ ...values, costPriceCents: value })}
            error={errors.costPriceCents}
          />
          <MoneyField
            label="Preço de venda"
            value={values.salePriceCents}
            onChange={(value) => setValues({ ...values, salePriceCents: value })}
            error={errors.salePriceCents}
          />
          <NumberField
            label="Estoque atual"
            value={values.currentStockQuantity}
            onChange={(value) => setValues({ ...values, currentStockQuantity: value })}
            error={errors.currentStockQuantity}
          />
          <NumberField
            label="Estoque mínimo"
            value={values.minStockQuantity}
            onChange={(value) => setValues({ ...values, minStockQuantity: value })}
            error={errors.minStockQuantity}
          />
          <Field label="Observacoes">
            <Input value={values.notes} onChange={(event) => setValues({ ...values, notes: event.target.value })} />
          </Field>
        </div>

        <div className="mt-5 space-y-3 rounded-md border border-border p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Campos personalizados</h3>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setValues({ ...values, customFields: [...values.customFields, emptyCustomField()] })}
            >
              Adicionar campo
            </Button>
          </div>
          {values.customFields.length === 0 && <p className="text-sm text-muted-foreground">Nenhum campo personalizado.</p>}
          {values.customFields.map((field, index) => (
            <div key={`${field.fieldKey}-${index}`} className="grid gap-2 md:grid-cols-[1fr_150px_1fr_auto]">
              <Input
                value={field.fieldLabel}
                onChange={(event) => updateCustomField(index, { fieldLabel: event.target.value, fieldKey: sanitizeFieldKey(event.target.value) })}
                placeholder="Nome do campo"
              />
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={field.fieldType}
                onChange={(event) => updateCustomField(index, { fieldType: event.target.value as ProductCustomFieldInput['fieldType'] })}
              >
                <option value="text">Texto</option>
                <option value="number">Número</option>
                <option value="currency">Moeda</option>
                <option value="date">Data</option>
                <option value="boolean">Booleano</option>
              </select>
              <Input
                value={field.fieldValue}
                onChange={(event) => updateCustomField(index, { fieldValue: event.target.value })}
                placeholder="Valor"
              />
              <Button
                type="button"
                variant="ghost"
                onClick={() => setValues({ ...values, customFields: values.customFields.filter((_, itemIndex) => itemIndex !== index) })}
              >
                Remover
              </Button>
            </div>
          ))}
        </div>

        </DialogBody>
        <StickyDialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={saveProduct.isPending}>
            Salvar produto
          </Button>
        </StickyDialogFooter>
        {toast && <p className="mt-3 text-sm text-primary">{toast}</p>}
      </form>
    </DialogShell>
  );

  function updateCustomField(index: number, patch: Partial<ProductCustomFieldInput>) {
    setValues({
      ...values,
      customFields: values.customFields.map((field, itemIndex) => itemIndex === index ? { ...field, ...patch } : field),
    });
  }

  async function generateSku() {
    if (!values.name.trim()) return;
    setGeneratingSku(true);
    try {
      const sku = await inventoryService.generateProductSku({
        categoryId: values.categoryId || undefined,
        brand: values.brand || undefined,
        productName: values.name,
        motorcycleApplication: values.motorcycleApplication || undefined,
      });
      setValues((current) => ({ ...current, sku }));
      setManualSku(false);
    } finally {
      setGeneratingSku(false);
    }
  }
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium">{label}</span>
      {children}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </label>
  );
}

function MoneyField({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  error?: string;
}) {
  const [text, setText] = useState(value > 0 ? String(value / 100).replace('.', ',') : '');

  useEffect(() => {
    setText(value > 0 ? String(value / 100).replace('.', ',') : '');
  }, [value]);

  return (
    <Field label={label} error={error}>
      <Input
        inputMode="decimal"
        value={text}
        onChange={(event) => {
          const nextText = formatBRLInput(event.target.value);
          setText(nextText);
          onChange(parseBRLInputToCents(nextText));
        }}
      />
    </Field>
  );
}

function NumberField({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  error?: string;
}) {
  const [text, setText] = useState(value > 0 ? String(value) : '');
  useEffect(() => setText(value > 0 ? String(value) : ''), [value]);
  return (
    <Field label={label} error={error}>
      <Input
        inputMode="numeric"
        value={text}
        onChange={(event) => {
          const next = sanitizeIntegerInput(event.target.value);
          setText(next);
          onChange(next ? Number(next) : 0);
        }}
      />
    </Field>
  );
}

function emptyCustomField(): ProductCustomFieldInput {
  return { fieldKey: '', fieldLabel: '', fieldType: 'text', fieldValue: '' };
}

function sanitizeFieldKey(value: string) {
  return value
    .trim()
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}
