import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { useRegisterStockMovement } from '../queries/inventory.queries';
import type { Product, StockMovementFormValues } from '../types/inventory.types';
import { formatBRLInput, parseBRLInputToCents, sanitizeIntegerInput } from '@/utils/numberFormat';
import { DialogBody, DialogShell, StickyDialogFooter } from '@shared/components/layout';

type StockMovementModalProps = {
  products: Product[];
  selectedProduct: Product | null;
  onClose: () => void;
};

export function StockMovementModal({ products, selectedProduct, onClose }: StockMovementModalProps) {
  const registerMovement = useRegisterStockMovement();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [values, setValues] = useState<StockMovementFormValues>({
    productId: selectedProduct?.id ?? products[0]?.id ?? '',
    movementType: 'purchase',
    direction: 'in',
    quantity: 1,
    reason: '',
    referenceId: '',
    unitCostCents: selectedProduct?.costPriceCents ?? 0,
    unitPriceCents: selectedProduct?.salePriceCents ?? 0,
    notes: '',
  });

  useEffect(() => {
    if (selectedProduct) {
      setValues((current) => ({
        ...current,
        productId: selectedProduct.id,
        unitCostCents: selectedProduct.costPriceCents,
      }));
    }
  }, [selectedProduct]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = await registerMovement.mutateAsync(values);

    if (!result.ok) {
      setErrors(result.errors);
      return;
    }

    onClose();
  }

  return (
    <DialogShell title="Movimentar estoque" description="Entrada, saida, ajuste, perda ou saldo inicial." onClose={onClose} className="max-w-[620px]">
      <form className="flex min-h-0 flex-1 flex-col overflow-hidden" onSubmit={handleSubmit}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold">Movimentar estoque</h2>
            <p className="text-sm text-muted-foreground">Entrada, saída, ajuste, perda ou saldo inicial.</p>
          </div>
          <Button type="button" variant="ghost" onClick={onClose}>Fechar</Button>
        </div>

        <DialogBody>
        <div className="mt-5 grid gap-4 md:grid-cols-2 compact:gap-3">
          <label className="grid gap-2 text-sm md:col-span-2">
            <span className="font-medium">Produto</span>
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={values.productId}
              onChange={(event) => setValues({ ...values, productId: event.target.value })}
            >
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.sku} - {product.name}
                </option>
              ))}
            </select>
            {errors.productId && <span className="text-xs text-destructive">{errors.productId}</span>}
          </label>

          <label className="grid gap-2 text-sm">
            <span className="font-medium">Tipo</span>
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={values.movementType}
              onChange={(event) =>
                setValues({ ...values, movementType: event.target.value as StockMovementFormValues['movementType'] })
              }
            >
              <option value="purchase">Compra</option>
              <option value="adjustment">Ajuste</option>
              <option value="loss">Perda</option>
              <option value="return">Retorno</option>
              <option value="internal_use">Uso interno</option>
              <option value="initial_balance">Saldo inicial</option>
            </select>
          </label>

          <label className="grid gap-2 text-sm">
            <span className="font-medium">Direção</span>
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={values.direction}
              onChange={(event) =>
                setValues({ ...values, direction: event.target.value as StockMovementFormValues['direction'] })
              }
            >
              <option value="in">Entrada</option>
              <option value="out">Saída</option>
            </select>
          </label>

          <label className="grid gap-2 text-sm">
            <span className="font-medium">Quantidade</span>
            <Input
              inputMode="numeric"
              value={values.quantity ? String(values.quantity) : ''}
              onChange={(event) => {
                const next = sanitizeIntegerInput(event.target.value);
                setValues({ ...values, quantity: next ? Number(next) : 0 });
              }}
            />
            {errors.quantity && <span className="text-xs text-destructive">{errors.quantity}</span>}
          </label>

          <label className="grid gap-2 text-sm">
            <span className="font-medium">Custo unitário</span>
            <Input
              inputMode="decimal"
              value={values.unitCostCents ? String(values.unitCostCents / 100).replace('.', ',') : ''}
              onChange={(event) => setValues({ ...values, unitCostCents: parseBRLInputToCents(formatBRLInput(event.target.value)) })}
            />
          </label>

          <label className="grid gap-2 text-sm">
            <span className="font-medium">Preco unitario</span>
            <Input
              inputMode="decimal"
              value={values.unitPriceCents ? String(values.unitPriceCents / 100).replace('.', ',') : ''}
              onChange={(event) => setValues({ ...values, unitPriceCents: parseBRLInputToCents(formatBRLInput(event.target.value)) })}
            />
          </label>

          <label className="grid gap-2 text-sm">
            <span className="font-medium">Motivo</span>
            <Input value={values.reason} onChange={(event) => setValues({ ...values, reason: event.target.value })} />
          </label>

          <label className="grid gap-2 text-sm">
            <span className="font-medium">Referencia</span>
            <Input value={values.referenceId} onChange={(event) => setValues({ ...values, referenceId: event.target.value })} />
          </label>

          <label className="grid gap-2 text-sm md:col-span-2">
            <span className="font-medium">Observação</span>
            <Input value={values.notes} onChange={(event) => setValues({ ...values, notes: event.target.value })} />
          </label>
        </div>

        </DialogBody>
        <StickyDialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={registerMovement.isPending}>Registrar movimento</Button>
        </StickyDialogFooter>
      </form>
    </DialogShell>
  );
}
