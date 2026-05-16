import { useState } from 'react';
import { AlertTriangle, CheckCircle2, FileSpreadsheet, RotateCcw } from 'lucide-react';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent } from '@shared/components/ui/card';
import { Input } from '@shared/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@shared/components/ui/table';
import { inventoryService } from '../services/inventory.service';
import { useImportProducts } from '../queries/inventory.queries';
import type {
  ImportColumnKey,
  ImportColumnMapping,
  ImportColumnTarget,
  ImportSourceData,
  ProductImportOptions,
  ProductImportPreview,
  ProductImportReport,
} from '../types/inventory.types';
import { autoMapColumns, parseImportFile } from '../utils/import-products.parser';
import { formatCurrency } from '../utils/inventory-calculations';

type ImportProductsModalProps = {
  onClose: () => void;
};

const targetColumns: Array<{ value: ImportColumnKey; label: string }> = [
  { value: 'ignore', label: 'Ignorar coluna' },
  { value: 'sku', label: 'SKU / Código interno' },
  { value: 'barcode', label: 'Código de barras' },
  { value: 'name', label: 'Nome do produto' },
  { value: 'category', label: 'Categoria' },
  { value: 'supplier', label: 'Fornecedor' },
  { value: 'brand', label: 'Marca' },
  { value: 'motorcycleApplication', label: 'Aplicação / Moto compatível' },
  { value: 'costPrice', label: 'Preço de custo' },
  { value: 'salePrice', label: 'Preço de venda' },
  { value: 'currentStock', label: 'Estoque atual' },
  { value: 'minStock', label: 'Estoque mínimo' },
  { value: 'location', label: 'Localização' },
  { value: 'notes', label: 'Observações' },
  { value: 'unit', label: 'Unidade' },
];

const defaultOptions: ProductImportOptions = {
  duplicateStrategy: 'update_prices',
  allowPartialImport: true,
  rollbackOnError: true,
};

const customFieldTypes = [
  { value: 'text', label: 'Texto' },
  { value: 'number', label: 'Número' },
  { value: 'currency', label: 'Moeda' },
  { value: 'date', label: 'Data' },
  { value: 'boolean', label: 'Booleano' },
] as const;

export function ImportProductsModal({ onClose }: ImportProductsModalProps) {
  const importProducts = useImportProducts();
  const [source, setSource] = useState<ImportSourceData | null>(null);
  const [mapping, setMapping] = useState<ImportColumnMapping>({});
  const [options, setOptions] = useState(defaultOptions);
  const [preview, setPreview] = useState<ProductImportPreview | null>(null);
  const [report, setReport] = useState<ProductImportReport | null>(null);
  const [error, setError] = useState('');

  function updateMapping(header: string, target: ImportColumnTarget) {
    setMapping((current) => ({ ...current, [header]: target }));
  }

  async function handleFile(file: File | undefined) {
    if (!file) {
      return;
    }

    try {
      setError('');
      setReport(null);
      const parsed = await parseImportFile(file);
      setSource(parsed);
      setMapping(autoMapColumns(parsed.headers));
      setPreview(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Erro ao ler arquivo.');
    }
  }

  async function handlePreview() {
    if (!source) {
      setError('Selecione um arquivo primeiro.');
      return;
    }

    const nextPreview = await inventoryService.buildImportPreview(source, mapping, options);
    setPreview(nextPreview);
    setReport(null);
  }

  async function handleImport() {
    const currentPreview = preview ?? (source ? await inventoryService.buildImportPreview(source, mapping, options) : null);

    if (!currentPreview) {
      setError('Gere a previsualizacao antes de importar.');
      return;
    }

    const nextReport = await importProducts.mutateAsync({
      batchName: `Importacao ${new Date().toISOString()}`,
      source: currentPreview,
      options,
    });
    setReport(nextReport);
  }

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-background/80 p-6 backdrop-blur-sm">
      <div className="max-h-[92vh] w-[1120px] overflow-auto rounded-lg border border-border bg-card p-5 shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold">Importar produtos Excel/CSV</h2>
            <p className="text-sm text-muted-foreground">
              Fluxo em lote para tabelas de fornecedores com preview, duplicados e rollback.
            </p>
          </div>
          <Button type="button" variant="ghost" onClick={onClose}>Fechar</Button>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
          <div className="space-y-4">
            <Card>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-primary" />
                  <p className="text-sm font-medium">1. Arquivo</p>
                </div>
                <input
                  type="file"
                  accept=".csv,.xls,.xlsx"
                  className="w-full rounded-md border border-input bg-background p-2 text-sm"
                  onChange={(event) => void handleFile(event.target.files?.[0])}
                />
                <p className="text-xs text-muted-foreground">
                  Suporta CSV, XLS e XLSX. Para mais de 200 produtos, valide o preview antes de importar.
                </p>
                {source && (
                  <Badge variant="secondary">
                    {source.fileName} · {source.rows.length} linhas
                  </Badge>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-3 p-4">
                <p className="text-sm font-medium">2. Regras</p>
                <label className="grid gap-2 text-sm">
                  <span>Duplicados</span>
                  <select
                    className="h-9 rounded-md border border-input bg-background px-3"
                    value={options.duplicateStrategy}
                    onChange={(event) =>
                      setOptions({
                        ...options,
                        duplicateStrategy: event.target.value as ProductImportOptions['duplicateStrategy'],
                      })
                    }
                  >
                    <option value="skip">Ignorar duplicados</option>
                    <option value="update_prices">Atualizar preços</option>
                    <option value="update_all">Atualizar cadastro completo</option>
                  </select>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={options.allowPartialImport}
                    onChange={(event) => setOptions({ ...options, allowPartialImport: event.target.checked })}
                  />
                  Permitir importação parcial
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={options.rollbackOnError}
                    onChange={(event) => setOptions({ ...options, rollbackOnError: event.target.checked })}
                  />
                  Rollback em erro critico
                </label>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handlePreview}>Gerar preview</Button>
                  <Button onClick={handleImport} disabled={importProducts.isPending || !preview}>Importar lote</Button>
                </div>
              </CardContent>
            </Card>

            {error && (
              <Card>
                <CardContent className="flex gap-2 p-4 text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  {error}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            {source && (
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm font-medium">3. Mapeamento de colunas</p>
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    {source.headers.map((header) => (
                      <label key={header} className="grid gap-1 text-sm">
                        <span className="truncate text-muted-foreground">{header}</span>
                        <select
                          className="h-9 rounded-md border border-input bg-background px-3"
                          value={mapping[header]?.kind === 'custom' ? '__custom__' : mapping[header]?.field ?? 'ignore'}
                          onChange={(event) =>
                            event.target.value === '__custom__'
                              ? updateMapping(header, {
                                  kind: 'custom',
                                  fieldKey: sanitizeFieldKey(header),
                                  fieldLabel: header,
                                  fieldType: 'text',
                                })
                              : updateMapping(header, {
                                  kind: 'known',
                                  field: event.target.value as ImportColumnKey,
                                })
                          }
                        >
                          {targetColumns.map((column) => (
                            <option key={column.value} value={column.value}>
                              {column.label}
                            </option>
                          ))}
                          <option value="__custom__">Criar campo personalizado</option>
                        </select>
                        {mapping[header]?.kind === 'custom' && (
                          <div className="grid gap-2 rounded-md border border-border bg-muted/20 p-3">
                            {(() => {
                              const customTarget = mapping[header];
                              if (customTarget.kind !== 'custom') return null;
                              return (
                                <>
                            <Input
                              value={customTarget.fieldLabel}
                              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                                updateMapping(header, {
                                  kind: 'custom',
                                  fieldLabel: event.target.value,
                                  fieldKey: sanitizeFieldKey(event.target.value || header),
                                  fieldType: customTarget.fieldType,
                                })
                              }
                              placeholder="Nome amigável"
                            />
                            <select
                              className="h-9 rounded-md border border-input bg-background px-3"
                              value={customTarget.fieldType}
                              onChange={(event) =>
                                updateMapping(header, {
                                  kind: 'custom',
                                  fieldKey: customTarget.fieldKey,
                                  fieldLabel: customTarget.fieldLabel,
                                  fieldType: event.target.value as (typeof customFieldTypes)[number]['value'],
                                })
                              }
                            >
                              {customFieldTypes.map((item) => (
                                <option key={item.value} value={item.value}>{item.label}</option>
                              ))}
                            </select>
                                </>
                              );
                            })()}
                          </div>
                        )}
                      </label>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {preview && <ImportPreview preview={preview} />}

            {report && <ImportReport report={report} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function ImportPreview({ preview }: { preview: ProductImportPreview }) {
  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{preview.totalRows} linhas</Badge>
          <Badge variant="success">{preview.createCount} novos</Badge>
          <Badge variant="info">{preview.updateCount} atualizacoes</Badge>
          <Badge variant="warning">{preview.skipCount} ignorados</Badge>
          <Badge variant={preview.errorCount > 0 ? 'destructive' : 'success'}>{preview.errorCount} erros</Badge>
        </div>

        <div className="max-h-72 overflow-auto rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Linha</TableHead>
                <TableHead>Acao</TableHead>
                <TableHead>SKU / Código interno</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Custo</TableHead>
                <TableHead>Venda</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead>Mensagens</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {preview.drafts.slice(0, 100).map((draft) => (
                <TableRow key={draft.rowNumber}>
                  <TableCell>{draft.rowNumber}</TableCell>
                  <TableCell><ActionBadge action={draft.action} /></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{draft.values.sku}</span>
                      {draft.skuGeneratedAutomatically && <Badge variant="secondary">Gerado automaticamente</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{draft.values.name}</TableCell>
                  <TableCell>{formatCurrency(draft.values.costPriceCents)}</TableCell>
                  <TableCell>{formatCurrency(draft.values.salePriceCents)}</TableCell>
                  <TableCell>{draft.values.currentStockQuantity}</TableCell>
                  <TableCell className="max-w-72">
                    <p className="truncate text-xs text-destructive">{draft.errors.join(' ')}</p>
                    <p className="truncate text-xs text-muted-foreground">{draft.warnings.join(' ')}</p>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {preview.drafts.length > 100 && (
          <p className="text-xs text-muted-foreground">
            Mostrando as primeiras 100 linhas para manter a tela rapida. O lote completo sera processado.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function ImportReport({ report }: { report: ProductImportReport }) {
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          {report.rolledBack ? <RotateCcw className="h-4 w-4 text-warning" /> : <CheckCircle2 className="h-4 w-4 text-success" />}
          <p className="text-sm font-semibold">Relatorio final</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="success">{report.imported} criados</Badge>
          <Badge variant="info">{report.updated} atualizados</Badge>
          <Badge variant="warning">{report.skipped} ignorados</Badge>
          <Badge variant="secondary">{report.customFieldsSaved} campos personalizados</Badge>
          <Badge variant={report.failed > 0 ? 'destructive' : 'success'}>{report.failed} falhas</Badge>
          {report.rolledBack && <Badge variant="warning">rollback aplicado</Badge>}
        </div>
        {report.errors.length > 0 && (
          <div className="rounded-md border border-border p-3">
            {report.errors.slice(0, 5).map((item) => (
              <p key={`${item.rowNumber}-${item.message}`} className="text-xs text-destructive">
                Linha {item.rowNumber || '-'}: {item.message}
              </p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
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

function ActionBadge({ action }: { action: ProductImportPreview['drafts'][number]['action'] }) {
  if (action === 'create') {
    return <Badge variant="success">Criar</Badge>;
  }

  if (action === 'update') {
    return <Badge variant="info">Atualizar</Badge>;
  }

  if (action === 'skip') {
    return <Badge variant="warning">Ignorar</Badge>;
  }

  return <Badge variant="destructive">Erro</Badge>;
}
