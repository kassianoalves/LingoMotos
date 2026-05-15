import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import type { Category, Product, ProductFormValues, Supplier } from '../types/inventory.types';
import { useSaveProduct } from '../queries/inventory.queries';

type ProductFormModalProps = {
  product: Product | null;
  categories: Category[];
  suppliers: Supplier[];
  onClose: () => void;
};

export function ProductFormModal({ product, categories, suppliers, onClose }: ProductFormModalProps) {
  const saveProduct = useSaveProduct();
  const initialValues = useMemo<ProductFormValues>(
    () => ({
      sku: product?.sku ?? '',
      barcode: product?.barcode ?? '',
      name: product?.name ?? '',
      categoryId: product?.categoryId ?? categories[0]?.id ?? '',
      supplierId: product?.supplierId ?? '',
      location: product?.location ?? '',
      unit: product?.unit ?? 'un',
      costPriceCents: product?.costPriceCents ?? 0,
      salePriceCents: product?.salePriceCents ?? 0,
      minStockQuantity: product?.minStockQuantity ?? 0,
      currentStockQuantity: product?.currentStockQuantity ?? 0,
    }),
    [categories, product],
  );
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = await saveProduct.mutateAsync({ values, productId: product?.id });

    if (!result.ok) {
      setErrors(result.errors);
      return;
    }

    onClose();
  }

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-background/80 backdrop-blur-sm">
      <form className="w-[760px] rounded-lg border border-border bg-card p-5 shadow-lg" onSubmit={handleSubmit}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold">{product ? 'Editar produto' : 'Novo produto'}</h2>
            <p className="text-sm text-muted-foreground">Cadastro rapido para operacao de balcao.</p>
          </div>
          <Button type="button" variant="ghost" onClick={onClose}>Fechar</Button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="SKU" error={errors.sku}>
            <Input value={values.sku} onChange={(event) => setValues({ ...values, sku: event.target.value })} />
          </Field>
          <Field label="Codigo de barras">
            <Input value={values.barcode} onChange={(event) => setValues({ ...values, barcode: event.target.value })} />
          </Field>
          <Field label="Nome" error={errors.name}>
            <Input value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} />
          </Field>
          <Field label="Localizacao">
            <Input value={values.location} onChange={(event) => setValues({ ...values, location: event.target.value })} />
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
              <Button type="button" variant="outline">Nova categoria</Button>
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
              <Button type="button" variant="outline">Novo fornecedor</Button>
            </div>
          </Field>
          <MoneyField
            label="Custo"
            value={values.costPriceCents}
            onChange={(value) => setValues({ ...values, costPriceCents: value })}
            error={errors.costPriceCents}
          />
          <MoneyField
            label="Venda"
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
            label="Estoque minimo"
            value={values.minStockQuantity}
            onChange={(value) => setValues({ ...values, minStockQuantity: value })}
            error={errors.minStockQuantity}
          />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={saveProduct.isPending}>
            Salvar produto
          </Button>
        </div>
      </form>
    </div>
  );
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
  return (
    <Field label={label} error={error}>
      <Input
        inputMode="decimal"
        value={(value / 100).toFixed(2).replace('.', ',')}
        onChange={(event) => onChange(Math.round(Number(event.target.value.replace(',', '.')) * 100) || 0)}
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
  return (
    <Field label={label} error={error}>
      <Input
        type="number"
        min={0}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </Field>
  );
}
