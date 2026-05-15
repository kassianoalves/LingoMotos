import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { useRegisterStockMovement } from '../queries/inventory.queries';
import type { Product, StockMovementFormValues } from '../types/inventory.types';

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
    unitCostCents: selectedProduct?.costPriceCents ?? 0,
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
    <div className="fixed inset-0 z-40 grid place-items-center bg-background/80 backdrop-blur-sm">
      <form className="w-[620px] rounded-lg border border-border bg-card p-5 shadow-lg" onSubmit={handleSubmit}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold">Movimentar estoque</h2>
            <p className="text-sm text-muted-foreground">Entrada, saida, ajuste, perda ou saldo inicial.</p>
          </div>
          <Button type="button" variant="ghost" onClick={onClose}>Fechar</Button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
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
              <option value="adjustment_in">Ajuste entrada</option>
              <option value="adjustment_out">Ajuste saida</option>
              <option value="loss">Perda</option>
              <option value="return">Retorno</option>
              <option value="initial_balance">Saldo inicial</option>
            </select>
          </label>

          <label className="grid gap-2 text-sm">
            <span className="font-medium">Direcao</span>
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={values.direction}
              onChange={(event) =>
                setValues({ ...values, direction: event.target.value as StockMovementFormValues['direction'] })
              }
            >
              <option value="in">Entrada</option>
              <option value="out">Saida</option>
            </select>
          </label>

          <label className="grid gap-2 text-sm">
            <span className="font-medium">Quantidade</span>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={values.quantity}
              onChange={(event) => setValues({ ...values, quantity: Number(event.target.value) })}
            />
            {errors.quantity && <span className="text-xs text-destructive">{errors.quantity}</span>}
          </label>

          <label className="grid gap-2 text-sm">
            <span className="font-medium">Custo unitario</span>
            <Input
              inputMode="decimal"
              value={(values.unitCostCents / 100).toFixed(2).replace('.', ',')}
              onChange={(event) =>
                setValues({
                  ...values,
                  unitCostCents: Math.round(Number(event.target.value.replace(',', '.')) * 100) || 0,
                })
              }
            />
          </label>

          <label className="grid gap-2 text-sm md:col-span-2">
            <span className="font-medium">Observacao</span>
            <Input value={values.notes} onChange={(event) => setValues({ ...values, notes: event.target.value })} />
          </label>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={registerMovement.isPending}>Registrar movimento</Button>
        </div>
      </form>
    </div>
  );
}
