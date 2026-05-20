import { useMemo, useState, useTransition } from 'react';
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, RotateCcw } from 'lucide-react';
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
import { DialogBody, DialogShell, StickyDialogFooter } from '@shared/components/layout';
import { inventoryService } from '../services/inventory.service';
import { useImportProducts } from '../queries/inventory.queries';
import { formatCurrency } from '../utils/inventory-calculations';
import { autoMapColumns, customFieldTypeFromColumnType, parseImportFile } from '../utils/import-products.parser';
import type {
  ImportColumnKey,
  ImportColumnMapping,
  ImportColumnTarget,
  ImportColumnType,
  ImportSourceData,
  ProductCustomFieldType,
  ProductImportOptions,
  ProductImportPreview,
  ProductImportReport,
} from '../types/inventory.types';

type ImportProductsModalProps = {
  onClose: () => void;
};

type Step = 'file' | 'mapping' | 'validation' | 'review' | 'import';

const steps: Array<{ key: Step; label: string }> = [
  { key: 'file', label: 'Arquivo' },
  { key: 'mapping', label: 'Mapeamento' },
  { key: 'validation', label: 'Validação' },
  { key: 'review', label: 'Revisão' },
  { key: 'import', label: 'Importar' },
];

const targetColumns: Array<{ value: ImportColumnKey; label: string }> = [
  { value: 'name', label: 'Nome do produto' },
  { value: 'sku', label: 'SKU / Código interno' },
  { value: 'barcode', label: 'Código de barras' },
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
  { value: 'ignore', label: 'Ignorar coluna' },
];

const defaultOptions: ProductImportOptions = {
  duplicateStrategy: 'update_existing',
  allowPartialImport: true,
  rollbackOnError: false,
};

const customFieldTypes: Array<{ value: ProductCustomFieldType; label: string }> = [
  { value: 'text', label: 'Texto' },
  { value: 'number', label: 'Número' },
  { value: 'currency', label: 'Moeda' },
  { value: 'date', label: 'Data' },
  { value: 'boolean', label: 'Booleano' },
];

const typeLabels: Record<ImportColumnType, string> = {
  text: 'Texto',
  integer: 'Número inteiro',
  currency: 'Moeda',
  date: 'Data',
  boolean: 'Booleano',
  code: 'Código',
  phone_document: 'Telefone/documento',
};

export function ImportProductsModal({ onClose }: ImportProductsModalProps) {
  const importProducts = useImportProducts();
  const [isPendingPreview, startPreviewTransition] = useTransition();
  const [step, setStep] = useState<Step>('file');
  const [source, setSource] = useState<ImportSourceData | null>(null);
  const [mapping, setMapping] = useState<ImportColumnMapping>({});
  const [options, setOptions] = useState(defaultOptions);
  const [preview, setPreview] = useState<ProductImportPreview | null>(null);
  const [report, setReport] = useState<ProductImportReport | null>(null);
  const [error, setError] = useState('');

  const counts = useMemo(() => summarizePreview(preview), [preview]);
  const footerAction = getFooterAction(step, source, preview, importProducts.isPending, isPendingPreview);

  function updateMapping(header: string, target: ImportColumnTarget) {
    setMapping((current) => ({ ...current, [header]: target }));
    setPreview(null);
    setReport(null);
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;

    try {
      setError('');
      setReport(null);
      setPreview(null);
      const parsed = await parseImportFile(file);
      setSource(parsed);
      setMapping(autoMapColumns(parsed));
      setStep('file');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Erro ao ler arquivo.');
    }
  }

  function handleValidate() {
    if (!source) {
      setError('Selecione um arquivo primeiro.');
      return;
    }

    setError('');
    startPreviewTransition(() => {
      void inventoryService.buildImportPreview(source, mapping, options)
        .then((nextPreview) => {
          setPreview(nextPreview);
          setReport(null);
          setStep('validation');
        })
        .catch((caught: unknown) => setError(caught instanceof Error ? caught.message : 'Erro ao validar arquivo.'));
    });
  }

  async function handleImport() {
    try {
      const currentPreview = preview ?? (source ? await inventoryService.buildImportPreview(source, mapping, options) : null);
      if (!currentPreview) {
        setError('Valide o arquivo antes de importar.');
        return;
      }

      setError('');
      setStep('import');
      const nextReport = await importProducts.mutateAsync({
        batchName: `Importação ${new Date().toISOString()}`,
        source: currentPreview,
        options,
      });
      setReport(nextReport);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível importar. Confira os dados e tente novamente.');
    }
  }

  function handleNext() {
    if (step === 'file') setStep('mapping');
    if (step === 'mapping') handleValidate();
    if (step === 'validation') setStep('review');
    if (step === 'review') void handleImport();
  }

  return (
    <DialogShell
      title="Importar produtos"
      description="Importação guiada para planilhas CSV, XLS e XLSX."
      onClose={onClose}
      className="h-[90vh] max-w-[min(1180px,96vw)]"
    >
      <div className="flex flex-none border-b border-border bg-card px-4 py-3">
        <StepBar current={step} />
      </div>

      <DialogBody className="px-4 py-3">
        <div className="space-y-3 pb-1">
          {error && (
            <Card>
              <CardContent className="flex gap-2 p-3 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {error}
              </CardContent>
            </Card>
          )}

          {step === 'file' && <FileStep source={source} options={options} setOptions={setOptions} onFile={handleFile} />}
          {source && step === 'mapping' && (
            <div className="grid min-h-0 gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
              <MappingPanel source={source} mapping={mapping} onChange={updateMapping} />
              <RawPreview source={source} />
            </div>
          )}
          {preview && step === 'validation' && <ImportPreview preview={preview} />}
          {preview && step === 'review' && <ReviewPanel preview={preview} counts={counts} />}
          {step === 'import' && (
            <ImportReport
              report={report}
              isPending={importProducts.isPending}
              error={error}
            />
          )}
        </div>
      </DialogBody>

      <StickyDialogFooter className="justify-between">
        <Button variant="outline" onClick={step === 'file' ? onClose : () => setStep(previousStep(step))}>
          Voltar
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            {report ? 'Fechar' : 'Cancelar'}
          </Button>
          {step !== 'import' && (
            <Button onClick={handleNext} disabled={footerAction.disabled}>
              {footerAction.label}
            </Button>
          )}
        </div>
      </StickyDialogFooter>
    </DialogShell>
  );
}

function FileStep({
  source,
  options,
  setOptions,
  onFile,
}: {
  source: ImportSourceData | null;
  options: ProductImportOptions;
  setOptions: (options: ProductImportOptions) => void;
  onFile: (file: File | undefined) => void;
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium">Selecionar arquivo</p>
          </div>
          <input
            type="file"
            accept=".csv,.xls,.xlsx"
            className="w-full rounded-md border border-input bg-background p-2 text-sm"
            onChange={(event) => void onFile(event.target.files?.[0])}
          />
          {source && (
            <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <Metric label="Arquivo" value={source.fileName} />
              <Metric label="Tipo" value={source.fileType.toUpperCase()} />
              <Metric label="Linhas" value={source.rows.length} />
              <Metric label="Colunas" value={source.headers.length} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-4">
          <p className="text-sm font-medium">Duplicados</p>
          <select
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={options.duplicateStrategy}
            onChange={(event) =>
              setOptions({
                ...options,
                duplicateStrategy: event.target.value as ProductImportOptions['duplicateStrategy'],
              })
            }
          >
            <option value="update_existing">Atualizar produto existente</option>
            <option value="create_new">Criar novo produto</option>
            <option value="skip">Ignorar duplicado</option>
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={options.allowPartialImport}
              onChange={(event) => setOptions({ ...options, allowPartialImport: event.target.checked })}
            />
            Importar parcialmente linhas válidas
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={options.rollbackOnError}
              onChange={(event) => setOptions({ ...options, rollbackOnError: event.target.checked })}
            />
            Desfazer tudo se houver erro crítico
          </label>
        </CardContent>
      </Card>

      {source && (
        <div className="lg:col-span-2">
          <RawPreview source={source} />
        </div>
      )}
    </div>
  );
}

function StepBar({ current }: { current: Step }) {
  const currentIndex = steps.findIndex((item) => item.key === current);
  return (
    <div className="grid w-full grid-cols-5 gap-2">
      {steps.map((item, index) => (
        <div
          key={item.key}
          className={[
            'rounded-md border px-2 py-1.5 text-center text-xs font-medium',
            index <= currentIndex ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground',
          ].join(' ')}
        >
          {item.label}
        </div>
      ))}
    </div>
  );
}

function MappingPanel({
  source,
  mapping,
  onChange,
}: {
  source: ImportSourceData;
  mapping: ImportColumnMapping;
  onChange: (header: string, target: ImportColumnTarget) => void;
}) {
  return (
    <Card className="min-h-0">
      <CardContent className="space-y-3 p-4">
        <div>
          <p className="text-sm font-medium">Mapeamento inteligente</p>
          <p className="text-xs text-muted-foreground">Revise cada coluna antes de validar.</p>
        </div>
        <div className="grid gap-2">
          {source.columns.map((column) => {
            const selected = mapping[column.header];
            const recognized = selected?.kind === 'known' && selected.field !== 'ignore';
            return (
              <div key={column.header} className="grid gap-2 rounded-md border border-border p-3 text-sm xl:grid-cols-[minmax(160px,0.8fr)_minmax(140px,0.6fr)_minmax(220px,1fr)]">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{column.originalHeader}</p>
                    {!recognized && <Badge variant="warning">Campo não reconhecido</Badge>}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">Exemplo: {column.sampleValues[0] || 'vazio'}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{typeLabels[column.detectedType]}</Badge>
                  {recognized && <Badge variant="outline">Sugestão: {labelForField(selected.field)}</Badge>}
                </div>
                <div className="grid gap-2">
                  <select
                    className="h-9 rounded-md border border-input bg-background px-3"
                    value={selected?.kind === 'custom' ? '__custom__' : selected?.field ?? 'ignore'}
                    onChange={(event) =>
                      event.target.value === '__custom__'
                        ? onChange(column.header, {
                            kind: 'custom',
                            fieldKey: sanitizeFieldKey(column.originalHeader),
                            fieldLabel: column.originalHeader,
                            fieldType: customFieldTypeFromColumnType(column.detectedType),
                          })
                        : onChange(column.header, {
                            kind: 'known',
                            field: event.target.value as ImportColumnKey,
                          })
                    }
                  >
                    <option value="ignore">Ignorar coluna</option>
                    <option value="__custom__">Criar campo personalizado</option>
                    {targetColumns.filter((columnOption) => columnOption.value !== 'ignore').map((columnOption) => (
                      <option key={columnOption.value} value={columnOption.value}>
                        {columnOption.label}
                      </option>
                    ))}
                  </select>
                  {selected?.kind === 'custom' && (
                    <div className="grid gap-2 rounded-md border border-border bg-muted/20 p-2 sm:grid-cols-[minmax(0,1fr)_130px]">
                      <Input
                        value={selected.fieldLabel}
                        onChange={(event) =>
                          onChange(column.header, {
                            kind: 'custom',
                            fieldLabel: event.target.value,
                            fieldKey: sanitizeFieldKey(event.target.value || column.originalHeader),
                            fieldType: selected.fieldType,
                          })
                        }
                        placeholder="Nome amigável"
                      />
                      <select
                        className="h-9 rounded-md border border-input bg-background px-3"
                        value={selected.fieldType}
                        onChange={(event) =>
                          onChange(column.header, {
                            kind: 'custom',
                            fieldKey: selected.fieldKey,
                            fieldLabel: selected.fieldLabel,
                            fieldType: event.target.value as ProductCustomFieldType,
                          })
                        }
                      >
                        {customFieldTypes.map((item) => (
                          <option key={item.value} value={item.value}>{item.label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function RawPreview({ source }: { source: ImportSourceData }) {
  return (
    <Card className="min-h-0">
      <CardContent className="space-y-3 p-4">
        <p className="text-sm font-medium">Primeiras 20 linhas</p>
        <div className="max-h-[300px] overflow-auto rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Linha</TableHead>
                {source.headers.map((header) => <TableHead key={header}>{header}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {source.rows.slice(0, 20).map((row, index) => (
                <TableRow key={index}>
                  <TableCell>{index + 2}</TableCell>
                  {source.headers.map((header) => <TableCell key={header}>{row[header]}</TableCell>)}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function ImportPreview({ preview }: { preview: ProductImportPreview }) {
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{preview.totalRows} linhas</Badge>
          <Badge variant="success">{preview.validRows} OK</Badge>
          <Badge variant="warning">{preview.drafts.filter((draft) => draft.status === 'warning').length} com alerta</Badge>
          <Badge variant={preview.errorCount > 0 ? 'destructive' : 'success'}>{preview.errorCount} erros</Badge>
          <Button variant="outline" size="sm" onClick={() => exportErrors(preview)} disabled={preview.errorCount === 0}>
            <Download className="mr-2 h-4 w-4" />
            Exportar erros CSV
          </Button>
        </div>

        <div className="max-h-[58vh] overflow-auto rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Linha original</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>SKU / Código interno</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Custo</TableHead>
                <TableHead>Venda</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead>Mensagens</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {preview.drafts.slice(0, 300).map((draft) => (
                <TableRow key={draft.rowNumber} className={statusClassName(draft.status)}>
                  <TableCell>{draft.rowNumber}</TableCell>
                  <TableCell><StatusBadge status={draft.status} /></TableCell>
                  <TableCell><ActionBadge action={draft.action} /></TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-2">
                      <span>{draft.values.sku}</span>
                      {draft.skuGeneratedAutomatically && <Badge variant="secondary">Gerado</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{draft.values.name}</TableCell>
                  <TableCell>{formatCurrency(draft.values.costPriceCents)}</TableCell>
                  <TableCell>{formatCurrency(draft.values.salePriceCents)}</TableCell>
                  <TableCell>{draft.values.currentStockQuantity}</TableCell>
                  <TableCell className="min-w-72">
                    {draft.errors.map((message) => <p key={message} className="text-xs text-destructive">{message}</p>)}
                    {draft.warnings.map((message) => <p key={message} className="text-xs text-muted-foreground">{message}</p>)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function ReviewPanel({ preview, counts }: { preview: ProductImportPreview; counts: ReturnType<typeof summarizePreview> }) {
  const customFields = preview.drafts.reduce((total, draft) => total + draft.values.customFields.length, 0);
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <p className="text-sm font-medium">Revisão antes de importar</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
          <SummaryTile label="Produtos novos" value={preview.createCount} />
          <SummaryTile label="Atualizados" value={preview.updateCount} />
          <SummaryTile label="Duplicados" value={preview.skipCount} />
          <SummaryTile label="Campos personalizados" value={customFields} />
          <SummaryTile label="Linhas ignoradas" value={preview.skipCount + preview.errorCount} />
          <SummaryTile label="Erros" value={preview.errorCount} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="success">{counts.ok} OK</Badge>
          <Badge variant="warning">{counts.warning} Atenção</Badge>
          <Badge variant="destructive">{counts.error} Erro</Badge>
          <Badge variant="secondary">{counts.ignored} Ignorado</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function ImportReport({ report, isPending, error }: { report: ProductImportReport | null; isPending: boolean; error: string }) {
  if (isPending && !report) {
    return (
      <Card>
        <CardContent className="space-y-3 p-4">
          <p className="text-sm font-semibold">Importando produtos...</p>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!report) {
    return (
      <Card>
        <CardContent className="flex gap-2 p-4 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error || 'A importação não foi concluída.'}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          {report.rolledBack ? <RotateCcw className="h-4 w-4 text-warning" /> : <CheckCircle2 className="h-4 w-4 text-success" />}
          <p className="text-sm font-semibold">Relatório final</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="success">{report.imported} produtos criados</Badge>
          <Badge variant="info">{report.updated} produtos atualizados</Badge>
          <Badge variant="warning">{report.skipped} duplicados ignorados</Badge>
          <Badge variant="secondary">{report.customFieldsSaved} campos personalizados criados</Badge>
          <Badge variant={report.failed > 0 ? 'destructive' : 'success'}>{report.failed} erros</Badge>
          {report.rolledBack && <Badge variant="warning">Operação desfeita</Badge>}
        </div>
        {report.errors.length > 0 && (
          <div className="max-h-56 overflow-auto rounded-md border border-border p-3">
            {report.errors.slice(0, 30).map((item) => (
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

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md bg-muted/40 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="truncate text-sm font-medium">{value}</p>
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: ProductImportPreview['drafts'][number]['status'] }) {
  if (status === 'ok') return <Badge variant="success">OK</Badge>;
  if (status === 'warning') return <Badge variant="warning">Atenção</Badge>;
  if (status === 'ignored') return <Badge variant="secondary">Ignorado</Badge>;
  return <Badge variant="destructive">Erro</Badge>;
}

function ActionBadge({ action }: { action: ProductImportPreview['drafts'][number]['action'] }) {
  if (action === 'create') return <Badge variant="success">Criar</Badge>;
  if (action === 'update') return <Badge variant="info">Atualizar</Badge>;
  if (action === 'skip') return <Badge variant="secondary">Ignorar</Badge>;
  return <Badge variant="destructive">Corrigir</Badge>;
}

function statusClassName(status: ProductImportPreview['drafts'][number]['status']) {
  if (status === 'ok') return 'bg-success/5';
  if (status === 'warning') return 'bg-warning/10';
  if (status === 'error') return 'bg-destructive/10';
  return 'bg-muted/40';
}

function summarizePreview(preview: ProductImportPreview | null) {
  if (!preview) return { ok: 0, warning: 0, error: 0, ignored: 0 };
  return {
    ok: preview.drafts.filter((draft) => draft.status === 'ok').length,
    warning: preview.drafts.filter((draft) => draft.status === 'warning').length,
    error: preview.drafts.filter((draft) => draft.status === 'error').length,
    ignored: preview.drafts.filter((draft) => draft.status === 'ignored').length,
  };
}

function previousStep(step: Step): Step {
  const index = steps.findIndex((item) => item.key === step);
  return steps[Math.max(index - 1, 0)].key;
}

function getFooterAction(
  step: Step,
  source: ImportSourceData | null,
  preview: ProductImportPreview | null,
  importing: boolean,
  validating: boolean,
) {
  if (step === 'file') return { label: 'Próximo', disabled: !source };
  if (step === 'mapping') return { label: validating ? 'Validando...' : 'Validar', disabled: validating || !source };
  if (step === 'validation') return { label: 'Próximo', disabled: !preview };
  return { label: importing ? 'Importando...' : 'Importar', disabled: importing || !preview };
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

function labelForField(field: ImportColumnKey) {
  return targetColumns.find((column) => column.value === field)?.label ?? 'Ignorar coluna';
}

function exportErrors(preview: ProductImportPreview) {
  const rows = preview.drafts
    .filter((draft) => draft.errors.length > 0)
    .map((draft) => [draft.rowNumber, draft.values.name, draft.errors.join(' | ')]);
  const csv = [['Linha', 'Produto', 'Erro'], ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'erros-importacao-produtos.csv';
  link.click();
  URL.revokeObjectURL(url);
}
