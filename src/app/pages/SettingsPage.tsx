import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Input } from '@shared/components/ui/input';
import { useStoreSettingsStore } from '@shared/stores/store-settings.store';
import { convertFileSrc } from '@tauri-apps/api/core';
import { invokeCommand } from '@shared/lib/tauri/invoke-command';
import {
  useAutoBackupInterval,
  useAutoBackupSummary,
  useOfflineStatus,
  useRestoreBackup,
  useSaveAutoBackupInterval,
} from '@shared/query/offline.queries';
import { offlineService } from '@shared/services/offline.service';
import { MasterPasswordVerifyModal } from '@shared/components/security/MasterPasswordModal';
import { securityService } from '@shared/services/security.service';
import { QrCodeModal } from '@shared/components/QrCodeModal';
import { buildWhatsappUrl } from '@/utils/whatsapp';
import { AlertTriangle, FolderOpen } from 'lucide-react';
import { DialogBody, DialogShell, PageContainer, ScrollArea, StickyDialogFooter } from '@shared/components/layout';
import { open } from '@tauri-apps/plugin-dialog';
import { relaunch } from '@tauri-apps/plugin-process';

type ToastTone = 'saved' | 'error' | 'backup-config' | 'reset' | 'folder';
type CriticalAction = { type: 'reset' } | null;
type RestoreFlow =
  | { status: 'confirm'; backupPath: string; fileName: string }
  | { status: 'password'; backupPath: string; fileName: string }
  | { status: 'loading'; fileName: string }
  | { status: 'success'; fileName: string }
  | { status: 'error'; fileName: string; message: string }
  | null;

const DEVELOPER_INSTAGRAM_URL = 'https://www.instagram.com/kassianoalvx';
const DEVELOPER_SUPPORT_URL = 'https://wa.me/5521967022950?text=Ol%C3%A1%2C%20preciso%20de%20suporte%20no%20LingoMotos.';

export function SettingsPage({ updateAvailable = false }: { updateAvailable?: boolean }) {
  const savedInfo = useStoreSettingsStore((state) => state.settings);
  const saveSettings = useStoreSettingsStore((state) => state.saveSettings);
  const loadSettings = useStoreSettingsStore((state) => state.loadSettings);
  const [draft, setDraft] = useState(savedInfo);
  const [toast, setToast] = useState<ToastTone | null>(null);
  const [criticalAction, setCriticalAction] = useState<CriticalAction>(null);
  const [restoreFlow, setRestoreFlow] = useState<RestoreFlow>(null);
  const [storeWhatsappQr, setStoreWhatsappQr] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const offlineStatus = useOfflineStatus();
  const autoBackupSummary = useAutoBackupSummary();
  const autoBackupInterval = useAutoBackupInterval();
  const saveAutoBackupInterval = useSaveAutoBackupInterval();
  const restoreBackup = useRestoreBackup();
  const [backupIntervalDraft, setBackupIntervalDraft] = useState(6);
  const previewUrl = useMemo(() => (draft.logo ? convertFileSrc(draft.logo) : ''), [draft.logo]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    setDraft(savedInfo);
  }, [savedInfo]);

  useEffect(() => {
    if (autoBackupInterval.data) {
      setBackupIntervalDraft(autoBackupInterval.data);
    }
  }, [autoBackupInterval.data]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), toast === 'error' ? 4500 : 3000);
    return () => window.clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    const refreshBackups = () => {
      void autoBackupSummary.refetch();
      void offlineStatus.refetch();
    };

    window.addEventListener('lingomotos:backup-created', refreshBackups);
    return () => window.removeEventListener('lingomotos:backup-created', refreshBackups);
  }, [autoBackupSummary, offlineStatus]);

  async function selectBackupForRestore() {
    try {
      const selected = await open({
        multiple: false,
        directory: false,
        defaultPath: offlineStatus.data?.backup_dir,
        filters: [{ name: 'Backup SQLite', extensions: ['db', 'sqlite', 'sqlite3'] }],
      });

      if (!selected || Array.isArray(selected)) return;

      setRestoreFlow({
        status: 'confirm',
        backupPath: selected,
        fileName: fileNameFromPath(selected),
      });
    } catch {
      setToast('error');
    }
  }

  return (
    <PageContainer>
      <ScrollArea className="space-y-5 pr-1">

      <Card>
        <CardHeader>
          <CardTitle>Informacoes da loja</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nome da loja"><Input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></Field>
            <Field label="CNPJ"><Input value={draft.documentNumber} onChange={(event) => setDraft({ ...draft, documentNumber: event.target.value })} /></Field>
            <Field label="Telefone"><Input value={draft.phone} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} /></Field>
            <Field label="WhatsApp"><Input value={draft.whatsapp} onChange={(event) => setDraft({ ...draft, whatsapp: event.target.value })} /></Field>
            <Field label="E-mail"><Input value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} /></Field>
            <Field label="Endereco"><Input value={draft.address} onChange={(event) => setDraft({ ...draft, address: event.target.value })} /></Field>
          </div>

          <div className="grid gap-4 md:grid-cols-[160px_minmax(0,1fr)]">
            <div className="grid h-32 place-items-center overflow-hidden rounded-md border border-border bg-muted">
              {previewUrl ? <img src={previewUrl} alt="Logo da loja" className="h-full w-full object-contain" /> : <span className="text-sm font-semibold text-muted-foreground">LM</span>}
            </div>
            <div className="min-w-0 space-y-4">
              <div>
                <p className="text-sm font-medium">Logo da loja</p>
                <p className="text-sm text-muted-foreground">PNG, JPG, JPEG ou WEBP.</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.webp"
                className="hidden"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  try {
                    const bytes = Array.from(new Uint8Array(await file.arrayBuffer()));
                    const saved = await invokeCommand<{ path: string }, { payload: { fileName: string; bytes: number[] } }>('save_store_logo', {
                      payload: { fileName: file.name, bytes },
                    });
                    setDraft({ ...draft, logo: saved.path });
                  } catch {
                    setToast('error');
                  }
                }}
              />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>Selecionar logo</Button>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                const url = buildWhatsappUrl(draft.whatsapp, 'Olá, vim pelo atendimento da loja.');
                if (!url) {
                  setToast('error');
                  return;
                }
                setStoreWhatsappQr(url);
              }}
            >
              QR WhatsApp da loja
            </Button>
            <Button onClick={async () => {
              try {
                await saveSettings(draft);
                setToast('saved');
              } catch {
                setToast('error');
              }
            }}>Salvar alteracoes</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 compact:p-3">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold">Backup automático</h3>
                <p className="mt-1 text-xs text-muted-foreground">Cópias automáticas dos dados locais.</p>
              </div>
              <AutoBackupSummaryCard
                lastBackupAt={autoBackupSummary.data?.last_backup_at ?? null}
                nextBackupAt={autoBackupSummary.data?.next_backup_at ?? null}
                intervalHours={autoBackupSummary.data?.interval_hours ?? backupIntervalDraft}
                status={autoBackupSummary.data?.status ?? 'pending'}
                errorMessage={autoBackupSummary.data?.error_message ?? null}
              />
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span>Intervalo</span>
                <Input
                  type="number"
                  min={1}
                  max={24}
                  value={backupIntervalDraft}
                  onChange={(event) => setBackupIntervalDraft(clampBackupInterval(Number(event.target.value)))}
                  className="h-8 w-16"
                />
                <span>horas</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      const saved = await saveAutoBackupInterval.mutateAsync(backupIntervalDraft);
                      setBackupIntervalDraft(saved);
                      setToast('backup-config');
                      window.dispatchEvent(new CustomEvent('lingomotos:auto-backup-interval-changed'));
                    } catch {
                      setToast('error');
                    }
                  }}
                >
                  Salvar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      await offlineService.openBackupFolder();
                      setToast('folder');
                    } catch {
                      setToast('error');
                    }
                  }}
                >
                  <FolderOpen className="h-4 w-4" />
                  Abrir backup
                </Button>
              </div>
            </div>
            <div className="flex flex-col items-start justify-start gap-1.5 lg:items-end">
              <Button
                variant="destructive"
                size="sm"
                className="gap-2 opacity-90 transition-opacity hover:opacity-100"
                onClick={() => setCriticalAction({ type: 'reset' })}
              >
                <AlertTriangle className="h-4 w-4" />
                Resetar
              </Button>
              <p className="text-xs text-muted-foreground">Apaga dados locais e backups.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <SettingsFooter
        updateAvailable={updateAvailable}
        backupFailed={autoBackupSummary.data?.status === 'failed'}
        onOpenInstagram={() => void openDeveloperLink(DEVELOPER_INSTAGRAM_URL, () => setToast('error'))}
        onOpenSupport={() => void openDeveloperLink(DEVELOPER_SUPPORT_URL, () => setToast('error'))}
      />
      <footer className="hidden">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <span>Desenvolvido por empresa responsável pelo sistema.</span>
          <span>Informações institucionais serão adicionadas posteriormente.</span>
        </div>
      </footer>

      </ScrollArea>

      {toast && <Toast tone={toast} />}
      {storeWhatsappQr && (
        <QrCodeModal
          title="QR WhatsApp da loja"
          description="Escaneie para iniciar atendimento pelo WhatsApp."
          value={storeWhatsappQr}
          fileName="whatsapp-loja.svg"
          onClose={() => setStoreWhatsappQr(null)}
        />
      )}
      {criticalAction && (
        <MasterPasswordVerifyModal
          title="Resetar sistema de fabrica"
          onCancel={() => setCriticalAction(null)}
          onVerified={async (password) => {
            if (!window.confirm('Essa acao apagara clientes, produtos, vendas, estoque, financeiro, configuracoes operacionais e tambem todos os backups salvos. Deseja continuar?')) return;
            if (window.prompt('Digite RESETAR para confirmar') !== 'RESETAR') return;
            await securityService.factoryReset(password);
            setToast('reset');
            setCriticalAction(null);
            await autoBackupSummary.refetch();
          }}
        />
      )}
      <RestoreBackupFlowModal
        flow={restoreFlow}
        onCancel={() => setRestoreFlow(null)}
        onConfirm={(flow) => setRestoreFlow({ status: 'password', backupPath: flow.backupPath, fileName: flow.fileName })}
        onPassword={async (password, flow) => {
          setRestoreFlow({ status: 'loading', fileName: flow.fileName });
          try {
            await restoreBackup.mutateAsync({ backupPath: flow.backupPath, password });
            await autoBackupSummary.refetch();
            setRestoreFlow({ status: 'success', fileName: flow.fileName });
          } catch (error) {
            setRestoreFlow({
              status: 'error',
              fileName: flow.fileName,
              message: friendlyRestoreError(error),
            });
          }
        }}
      />
    </PageContainer>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}

function SettingsFooter({
  updateAvailable,
  backupFailed,
  onOpenInstagram,
  onOpenSupport,
}: {
  updateAvailable: boolean;
  backupFailed: boolean;
  onOpenInstagram: () => void;
  onOpenSupport: () => void;
}) {
  return (
    <footer className="border-t border-border/60 py-1 text-center text-[10px] leading-tight text-muted-foreground">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-0.5 px-2">
        <p className="text-[11px] font-semibold tracking-wide text-foreground">Desenvolvido por Kassiano Alves</p>
        <p>maio/2026</p>
        <div className="mt-0.5 flex items-center justify-center gap-2">
          <button type="button" className="transition-colors hover:text-foreground" onClick={onOpenInstagram}>
            Instagram
          </button>
          <span className="text-border">•</span>
          <button type="button" className="transition-colors hover:text-foreground" onClick={onOpenSupport}>
            Suporte
          </button>
        </div>
      </div>
    </footer>
  );
}

async function openDeveloperLink(url: string, onError: () => void) {
  try {
    await invokeCommand('open_external_url', { url });
  } catch {
    onError();
  }
}


function AutoBackupSummaryCard({
  lastBackupAt,
  nextBackupAt,
  intervalHours,
  status,
  errorMessage,
}: {
  lastBackupAt: string | null;
  nextBackupAt: string | null;
  intervalHours: number;
  status: 'created' | 'restored' | 'failed' | 'pending';
  errorMessage: string | null;
}) {
  const failed = status === 'failed';

  return (
    <div className="grid max-w-xl gap-1 rounded-md border border-border bg-muted/20 p-3 text-xs text-muted-foreground">
      <SummaryLine label="Ultimo backup" value={lastBackupAt ? formatDateTime(lastBackupAt) : 'Ainda nao criado'} />
      <div className="flex flex-wrap items-center gap-2">
        <span>Status:</span>
        <span className={failed ? 'font-medium text-destructive' : 'font-medium text-success'}>
          {failed ? 'Falhou' : status === 'pending' ? 'Pendente' : 'OK'}
        </span>
      </div>
      <SummaryLine label="Proximo backup" value={nextBackupAt ? formatDateTime(nextBackupAt) : 'Aguardando primeiro backup'} />
      <SummaryLine label="Intervalo" value={`A cada ${intervalHours} horas`} />
      {failed && errorMessage && <p className="text-destructive/80">{errorMessage}</p>}
    </div>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span>{label}: </span>
      <span>{value}</span>
    </p>
  );
}

function RestoreBackupFlowModal({
  flow,
  onCancel,
  onConfirm,
  onPassword,
}: {
  flow: RestoreFlow;
  onCancel: () => void;
  onConfirm: (flow: Extract<RestoreFlow, { status: 'confirm' }>) => void;
  onPassword: (password: string, flow: Extract<RestoreFlow, { status: 'password' }>) => Promise<void>;
}) {
  if (!flow) return null;

  if (flow.status === 'password') {
    return (
      <MasterPasswordVerifyModal
        title="Restaurar backup"
        onCancel={onCancel}
        onVerified={(password) => onPassword(password, flow)}
      />
    );
  }

  if (flow.status === 'confirm') {
    return (
      <DialogShell title="Restaurar backup" onClose={onCancel} className="max-w-md" zIndexClassName="z-[55]">
        <DialogBody className="space-y-3">
          <p className="text-sm font-medium">Deseja restaurar este backup?</p>
          <p className="break-all rounded-md border border-border bg-muted/30 p-3 text-sm text-muted-foreground">{flow.fileName}</p>
        </DialogBody>
        <StickyDialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button type="button" onClick={() => onConfirm(flow)}>Restaurar</Button>
        </StickyDialogFooter>
      </DialogShell>
    );
  }

  if (flow.status === 'loading') {
    return (
      <DialogShell title="Restaurando backup..." onClose={() => undefined} className="max-w-md" zIndexClassName="z-[55]">
        <DialogBody className="space-y-2">
          <p className="text-sm font-medium">Restaurando backup...</p>
          <p className="text-sm text-muted-foreground">Nao feche o sistema.</p>
        </DialogBody>
      </DialogShell>
    );
  }

  if (flow.status === 'success') {
    return (
      <DialogShell title="Backup restaurado com sucesso." onClose={onCancel} className="max-w-md" zIndexClassName="z-[55]">
        <DialogBody>
          <p className="text-sm text-muted-foreground">Reinicie o sistema para aplicar os dados restaurados.</p>
        </DialogBody>
        <StickyDialogFooter>
          <Button type="button" onClick={() => void relaunch()}>Reiniciar sistema</Button>
        </StickyDialogFooter>
      </DialogShell>
    );
  }

  return (
    <DialogShell title="Falha ao restaurar backup." onClose={onCancel} className="max-w-md" zIndexClassName="z-[55]">
      <DialogBody className="space-y-3">
        <p className="text-sm text-muted-foreground">O banco atual foi preservado.</p>
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{flow.message}</p>
      </DialogBody>
      <StickyDialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
      </StickyDialogFooter>
    </DialogShell>
  );
}

function fileNameFromPath(path: string) {
  return path.split(/[\\/]/).filter(Boolean).pop() ?? path;
}

function clampBackupInterval(value: number) {
  if (!Number.isFinite(value)) return 1;
  return Math.min(Math.max(Math.trunc(value), 1), 24);
}

function formatDateTime(value: string) {
  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function friendlyRestoreError(error: unknown) {
  if (error instanceof Error && error.message) {
    if (error.message.includes('Senha invalida')) return 'Senha invalida.';
    if (error.message.includes('Backup invalido')) return 'Arquivo de backup invalido ou nao encontrado.';
    return error.message;
  }

  return 'Nao foi possivel restaurar o arquivo selecionado.';
}

function Toast({ tone }: { tone: ToastTone }) {
  const message =
    tone === 'saved'
      ? 'Alteracoes salvas.'
      : tone === 'backup-config'
        ? 'Intervalo de backup salvo.'
        : tone === 'reset'
          ? 'Reset de fabrica concluido.'
          : tone === 'folder'
            ? 'Pasta de backups aberta.'
            : 'Nao foi possivel salvar.';
  return (
    <div className={`fixed bottom-5 right-5 z-50 rounded-md px-4 py-3 text-sm shadow-lg ${tone === 'error' ? 'bg-destructive text-destructive-foreground' : 'bg-success text-success-foreground'}`}>
      {message}
    </div>
  );
}
