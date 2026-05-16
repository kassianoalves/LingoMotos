import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Input } from '@shared/components/ui/input';
import { useStoreSettingsStore } from '@shared/stores/store-settings.store';
import { convertFileSrc } from '@tauri-apps/api/core';
import { invokeCommand } from '@shared/lib/tauri/invoke-command';
import { useBackups, useCreateBackup, useDeleteBackup, useRestoreBackup } from '@shared/query/offline.queries';
import { MasterPasswordVerifyModal } from '@shared/components/security/MasterPasswordModal';
import { securityService } from '@shared/services/security.service';
import { QrCodeModal } from '@shared/components/QrCodeModal';
import { buildWhatsappUrl } from '@/utils/whatsapp';
import { AlertTriangle } from 'lucide-react';

type ToastTone = 'saved' | 'error' | 'backup' | 'deleted' | 'restored' | 'reset';
type CriticalAction = { type: 'backup' | 'restore' | 'delete' | 'reset'; backupPath?: string } | null;

export function SettingsPage() {
  const savedInfo = useStoreSettingsStore((state) => state.settings);
  const saveSettings = useStoreSettingsStore((state) => state.saveSettings);
  const loadSettings = useStoreSettingsStore((state) => state.loadSettings);
  const [draft, setDraft] = useState(savedInfo);
  const [toast, setToast] = useState<ToastTone | null>(null);
  const [criticalAction, setCriticalAction] = useState<CriticalAction>(null);
  const [storeWhatsappQr, setStoreWhatsappQr] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backups = useBackups();
  const createBackup = useCreateBackup();
  const restoreBackup = useRestoreBackup();
  const deleteBackup = useDeleteBackup();
  const previewUrl = useMemo(() => (draft.logo ? convertFileSrc(draft.logo) : ''), [draft.logo]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    setDraft(savedInfo);
  }, [savedInfo]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), toast === 'error' ? 4500 : 3000);
    return () => window.clearTimeout(id);
  }, [toast]);

  return (
    <div className="space-y-6 px-6 pb-6 pt-4">

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
            <div className="space-y-3">
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
        <CardHeader><CardTitle>Backup</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <Button onClick={() => setCriticalAction({ type: 'backup' })}>Criar backup agora</Button>
            <div className="flex flex-col items-start gap-1 sm:items-end">
              <Button
                variant="destructive"
                className="gap-2 opacity-80 transition-opacity hover:opacity-100"
                onClick={() => setCriticalAction({ type: 'reset' })}
              >
                <AlertTriangle className="h-4 w-4" />
                Resetar sistema de fábrica
              </Button>
              <p className="text-xs text-destructive/80">Apaga todos os dados locais e backups.</p>
            </div>
          </div>
          <div className="space-y-2">
            {(backups.data ?? []).map((backup) => (
              <div key={backup.path} className="flex items-center justify-between gap-3 rounded-md border border-border p-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{backup.file_name}</p>
                  <p className="text-xs text-muted-foreground">{backup.created_at}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setCriticalAction({ type: 'restore', backupPath: backup.path })}>Restaurar</Button>
                  <Button size="sm" variant="destructive" onClick={() => setCriticalAction({ type: 'delete', backupPath: backup.path })}>Excluir</Button>
                </div>
              </div>
            ))}
            {(backups.data ?? []).length === 0 && <p className="text-sm text-muted-foreground">Nenhum backup criado.</p>}
          </div>
        </CardContent>
      </Card>

      <footer className="border-t border-border pt-4 text-sm text-muted-foreground">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <span>Desenvolvido por empresa responsável pelo sistema.</span>
          <span>Informações institucionais serão adicionadas posteriormente.</span>
        </div>
      </footer>

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
          title={criticalAction.type === 'backup' ? 'Criar backup' : criticalAction.type === 'restore' ? 'Restaurar backup' : criticalAction.type === 'delete' ? 'Excluir backup' : 'Resetar sistema de fabrica'}
          onCancel={() => setCriticalAction(null)}
          onVerified={async (password) => {
            if (criticalAction.type === 'backup') {
              await createBackup.mutateAsync(password);
              setToast('backup');
              setCriticalAction(null);
              return;
            }
            if (criticalAction.type === 'restore' && criticalAction.backupPath) {
              if (!window.confirm('Restaurar este backup?')) return;
              await restoreBackup.mutateAsync({ backupPath: criticalAction.backupPath, password });
              setToast('restored');
              setCriticalAction(null);
              return;
            }
            if (criticalAction.type === 'delete' && criticalAction.backupPath) {
              await deleteBackup.mutateAsync({ backupPath: criticalAction.backupPath, password });
              setToast('deleted');
              setCriticalAction(null);
              return;
            }
            if (!window.confirm('Essa acao apagara clientes, produtos, vendas, estoque, financeiro, configuracoes operacionais e tambem todos os backups salvos. Deseja continuar?')) return;
            if (window.prompt('Digite RESETAR para confirmar') !== 'RESETAR') return;
            await securityService.factoryReset(password);
            setToast('reset');
            setCriticalAction(null);
            await backups.refetch();
          }}
        />
      )}
    </div>
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

function Toast({ tone }: { tone: ToastTone }) {
  const message =
    tone === 'saved'
      ? 'Alteracoes salvas.'
      : tone === 'backup'
        ? 'Backup criado com sucesso.'
        : tone === 'deleted'
          ? 'Backup excluído com sucesso.'
        : tone === 'restored'
          ? 'Backup restaurado. Reinicie o sistema para aplicar completamente.'
          : tone === 'reset'
            ? 'Reset de fábrica concluído.'
            : 'Nao foi possivel salvar.';
  return (
    <div className={`fixed bottom-5 right-5 z-50 rounded-md px-4 py-3 text-sm shadow-lg ${tone === 'error' ? 'bg-destructive text-destructive-foreground' : 'bg-success text-success-foreground'}`}>
      {message}
    </div>
  );
}
