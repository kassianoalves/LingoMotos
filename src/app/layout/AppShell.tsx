import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { clsx } from 'clsx';
import {
  BarChart3,
  Boxes,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Gauge,
  Moon,
  Power,
  RefreshCw,
  Settings,
  ShoppingCart,
  Sun,
  Users,
  Wrench,
} from 'lucide-react';
import { FinancePage } from '@features/finance';
import { CustomersPage } from '@features/customers';
import { InventoryPage } from '@features/inventory';
import { PosPage } from '@features/pos';
import { WorkshopPage } from '@features/workshop';
import { Button } from '@shared/components/ui/button';
import { Badge } from '@shared/components/ui/badge';
import { Input } from '@shared/components/ui/input';
import { useAppShellStore } from '@shared/stores/app-shell.store';
import { useCashSessionStore } from '@shared/stores/cash-session.store';
import { useThemeStore } from '@shared/stores/theme.store';
import { useStoreSettingsStore } from '@shared/stores/store-settings.store';
import { serviceClient } from '@shared/api/service-client';
import { offlineService } from '@shared/services/offline.service';
import { updaterService, type PendingUpdate } from '@shared/services/updater.service';
import { relaunch } from '@tauri-apps/plugin-process';
import { HomePage } from '@app/pages/HomePage';
import { ReportsPage } from '@app/pages/ReportsPage';
import { SettingsPage } from '@app/pages/SettingsPage';
import { convertFileSrc } from '@tauri-apps/api/core';
import { MasterPasswordVerifyModal } from '@shared/components/security/MasterPasswordModal';
import { UpdateAvailableModal } from '@shared/components/updater/UpdateAvailableModal';
import { DialogBody, DialogShell, StickyDialogFooter } from '@shared/components/layout';

type AppRoute = {
  path: string;
  label: string;
  subtitle: string;
  icon: typeof Gauge;
  group: 'Operação' | 'Gestão';
  badge?: string;
};

type UpdateUxState = 'idle' | 'checking' | 'available' | 'downloading' | 'installing' | 'updated' | 'error';

const routes: AppRoute[] = [
  { path: '/inicio', label: 'Início', subtitle: 'Resumo operacional da loja', icon: Gauge, group: 'Operação' },
  { path: '/vendas', label: 'Vendas', subtitle: 'PDV rápido para venda de balcão', icon: ShoppingCart, group: 'Operação' },
  { path: '/clientes', label: 'Clientes', subtitle: 'Cadastro e relacionamento com clientes', icon: Users, group: 'Operação' },
  { path: '/oficina', label: 'Oficina', subtitle: 'Módulo bloqueado em preparação', icon: Wrench, group: 'Operação', badge: 'Em breve' },
  { path: '/estoque', label: 'Estoque', subtitle: 'Produtos, categorias, fornecedores e movimentações', icon: Boxes, group: 'Gestão' },
  { path: '/financeiro', label: 'Financeiro', subtitle: 'Receitas, despesas, caixa e relatórios', icon: CircleDollarSign, group: 'Gestão' },
  { path: '/relatorios', label: 'Relatórios', subtitle: 'Consultas consolidadas do sistema', icon: BarChart3, group: 'Gestão' },
  { path: '/configuracoes', label: 'Configurações', subtitle: 'Preferências e estrutura local', icon: Settings, group: 'Gestão' },
];

export function AppShell() {
  const autoBackupTimerRef = useRef<number | null>(null);
  const isDev = Boolean((import.meta as { env?: { DEV?: boolean } }).env?.DEV);
  const sidebarCollapsed = useAppShellStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useAppShellStore((state) => state.toggleSidebar);
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const queryClient = useQueryClient();
  const isCashOpen = useCashSessionStore((state) => state.isOpen);
  const openCash = useCashSessionStore((state) => state.openCash);
  const closeCash = useCashSessionStore((state) => state.closeCash);
  const loadCashSession = useCashSessionStore((state) => state.loadCashSession);
  const expectedAmountCents = useCashSessionStore((state) => state.expectedAmountCents);
  const storeSettings = useStoreSettingsStore((state) => state.settings);
  const loadSettings = useStoreSettingsStore((state) => state.loadSettings);
  const [activePath, setActivePath] = useState('/inicio');
  const [cashAction, setCashAction] = useState<'open' | 'close' | null>(null);
  const [toast, setToast] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [appVersion, setAppVersion] = useState('');
  const [updateState, setUpdateState] = useState<UpdateUxState>('idle');
  const [updateInstallStatus, setUpdateInstallStatus] = useState('');
  const [pendingUpdate, setPendingUpdate] = useState<PendingUpdate | null>(null);
  const [availableUpdate, setAvailableUpdate] = useState<PendingUpdate | null>(null);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const activeRoute = routes.find((route) => route.path === activePath) ?? routes[0];
  const updateBusy = updateState === 'checking' || updateState === 'downloading' || updateState === 'installing';
  const updateTooltip = getUpdateTooltip(updateState, Boolean(availableUpdate));

  useEffect(() => {
    void loadSettings();
    void loadCashSession();
  }, [loadCashSession, loadSettings]);

  useEffect(() => {
    void serviceClient.execute<string>('app_version').then(setAppVersion).catch(() => setAppVersion('0.1.5'));
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function checkUpdateInBackground() {
      try {
        const update = await updaterService.checkForUpdate();
        if (cancelled) return;
        setAvailableUpdate(update ?? null);
        setUpdateState(update ? 'available' : 'idle');
      } catch {
        if (!cancelled) setUpdateState('error');
      }
    }

    void checkUpdateInBackground();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function runAutoBackupCheck() {
      try {
        const result = await offlineService.ensureAutoBackup();
        if (cancelled) return;
        if (result.backup_created) {
          setToast({ tone: 'success', message: 'Backup automático criado.' });
          window.dispatchEvent(new CustomEvent('lingomotos:backup-created'));
        }
        scheduleNextAutoBackupCheck(result.next_check_after_ms);
      } catch {
        if (cancelled) return;
        setToast({ tone: 'error', message: 'Falha ao criar backup automático.' });
        scheduleNextAutoBackupCheck(60 * 60 * 1_000);
      }
    }

    function scheduleNextAutoBackupCheck(delayMs: number) {
      if (autoBackupTimerRef.current) {
        window.clearTimeout(autoBackupTimerRef.current);
      }
      autoBackupTimerRef.current = window.setTimeout(() => void runAutoBackupCheck(), Math.max(delayMs, 60_000));
    }

    const handleIntervalChanged = () => void runAutoBackupCheck();

    void runAutoBackupCheck();
    window.addEventListener('lingomotos:auto-backup-interval-changed', handleIntervalChanged);

    return () => {
      cancelled = true;
      window.removeEventListener('lingomotos:auto-backup-interval-changed', handleIntervalChanged);
      if (autoBackupTimerRef.current) {
        window.clearTimeout(autoBackupTimerRef.current);
        autoBackupTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), toast.tone === 'error' ? 4500 : 3000);
    return () => window.clearTimeout(id);
  }, [toast]);

  function renderPage() {
    if (activePath === '/inicio') {
      return (
        <HomePage
          navigate={setActivePath}
        />
      );
    }
    if (activePath === '/estoque') return <InventoryPage cashOpen={isCashOpen} />;
    if (activePath === '/vendas') return <PosPage cashOpen={isCashOpen} />;
    if (activePath === '/financeiro') return <FinancePage cashOpen={isCashOpen} />;
    if (activePath === '/clientes') return <CustomersPage navigate={setActivePath} cashOpen={isCashOpen} />;
    if (activePath === '/relatorios') return <ReportsPage />;
    if (activePath === '/configuracoes') return <SettingsPage updateAvailable={Boolean(availableUpdate)} />;
    if (activePath === '/oficina') return <WorkshopPage />;
    return <HomePage />;
  }

  async function toggleCashSession() {
    setCashAction(isCashOpen ? 'close' : 'open');
  }

  async function checkForUpdate() {
    if (availableUpdate) {
      setPendingUpdate(availableUpdate);
      setUpdateModalOpen(true);
      return;
    }

    setUpdateState('checking');

    try {
      const update = await updaterService.checkForUpdate();
      if (!update) {
        setAvailableUpdate(null);
        setUpdateState('updated');
        setToast({ tone: 'success', message: 'Sistema atualizado.' });
        return;
      }

      setAvailableUpdate(update);
      setPendingUpdate(update);
      setUpdateModalOpen(true);
      setUpdateState('available');
      setToast({ tone: 'success', message: `Nova versão disponível: v${update.version}` });
    } catch {
      setUpdateState('error');
      setToast({ tone: 'success', message: 'Sistema offline. Continuando normalmente.' });
    }
  }

  async function installPendingUpdate() {
    if (!pendingUpdate) return;

    setUpdateState('installing');
    setUpdateInstallStatus('Criando backup automático...');
    try {
      await updaterService.createAutomaticBackup();
    } catch {
      setToast({ tone: 'error', message: 'Não foi possível criar o backup automático. Atualização cancelada.' });
      setUpdateState('available');
      setUpdateInstallStatus('');
      return;
    }

    try {
      setUpdateState('downloading');
      setUpdateInstallStatus('Baixando atualização...');
      setToast({ tone: 'success', message: 'Baixando atualização...' });
      await updaterService.downloadUpdate(pendingUpdate);
      setUpdateState('installing');
      setUpdateInstallStatus('Instalando atualização...');
      setToast({ tone: 'success', message: 'Instalando atualização...' });
      await pendingUpdate.install();
      setPendingUpdate(null);
      setAvailableUpdate(null);
      setUpdateModalOpen(false);
      setUpdateState('updated');
      setToast({ tone: 'success', message: 'Reinicie o sistema.' });
      await relaunch();
    } catch {
      setUpdateState('error');
      setToast({ tone: 'error', message: 'Não foi possível instalar a atualização.' });
    } finally {
      setUpdateInstallStatus('');
    }
  }

  return (
    <div className="h-screen overflow-hidden bg-background text-foreground">
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-20 flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-200',
          sidebarCollapsed ? 'w-[72px]' : 'w-60 max-[1024px]:w-[210px]',
        )}
      >
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="Alternar menu lateral"
          className="absolute -right-4 top-1/2 z-30 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md border border-border bg-card shadow-md transition-colors hover:bg-muted"
        >
          {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
        <div className="flex h-16 items-center border-b border-sidebar-border px-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-md bg-primary/10 text-sm font-semibold text-primary">
              {storeSettings.logo ? (
                <img src={convertFileSrc(storeSettings.logo)} alt="" className="h-full w-full object-contain" />
              ) : (
                initials(storeSettings.name)
              )}
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-primary">{storeSettings.name}</p>
                <p className="text-xs text-muted-foreground">Peças e oficina</p>
              </div>
            )}
          </div>
        </div>

        <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto px-3 py-4 compact:space-y-3 compact:py-3">
          {(['Operação', 'Gestão'] as const).map((group) => (
            <div key={group}>
              {!sidebarCollapsed && (
                <p className="px-3 pb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{group}</p>
              )}
              <div className="space-y-1">
                {routes
                  .filter((route) => route.group === group)
                  .map((route) => {
                    const Icon = route.icon;
                    const active = route.path === activePath;
                    return (
                      <button
                        key={route.path}
                        type="button"
                        onClick={() => setActivePath(route.path)}
                        className={clsx(
                          'flex h-10 w-full items-center rounded-md px-3 text-sm font-medium transition-colors',
                          active
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                            : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                          sidebarCollapsed && 'justify-center',
                        )}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        {!sidebarCollapsed && (
                          <span className="ml-3 flex min-w-0 flex-1 items-center justify-between gap-2">
                            <span className="truncate">{route.label}</span>
                            {route.badge && <Badge variant="warning">{route.badge}</Badge>}
                          </span>
                        )}
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <div className="w-full rounded-md border border-border bg-background p-3 text-left">
            <div className={clsx('flex items-center gap-2', sidebarCollapsed && 'justify-center')}>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className={clsx('h-8 w-8', isCashOpen ? 'text-success hover:text-success' : 'text-destructive hover:text-destructive')}
                aria-label={isCashOpen ? 'Fechar caixa' : 'Abrir caixa'}
                onClick={(event) => {
                  event.stopPropagation();
                  void toggleCashSession();
                }}
              >
                <Power className="h-4 w-4" />
              </Button>
              {!sidebarCollapsed && <span className="text-xs font-medium">{isCashOpen ? 'Caixa aberto' : 'Caixa fechado'}</span>}
            </div>
            {!sidebarCollapsed && (
              <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>Operador: Admin · v{appVersion || '...'}</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className={clsx('flex h-screen min-h-0 flex-col overflow-hidden transition-[padding] duration-200', sidebarCollapsed ? 'pl-[72px]' : 'pl-60 max-[1024px]:pl-[210px]')}>
        <header className="z-10 flex h-16 flex-none items-center gap-4 border-b border-border bg-card/95 px-6 backdrop-blur compact:h-14 compact:px-4">
          <div className="min-w-0">
            <h1 className="text-base font-semibold">{activeRoute.label}</h1>
            <p className="text-xs text-muted-foreground">{activeRoute.subtitle}</p>
          </div>
          <div className="ml-4 flex-1" />
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="relative"
            aria-label="Verificar atualização"
            title={updateTooltip}
            disabled={updateState === 'downloading' || updateState === 'installing'}
            onClick={() => void checkForUpdate()}
          >
            <RefreshCw className={clsx('h-4 w-4', updateBusy && 'animate-spin')} />
            {availableUpdate && (
              <span className="absolute right-1 top-1 h-2 w-2 animate-pulse rounded-full bg-blue-500 ring-2 ring-background" />
            )}
          </Button>
          <Button variant="outline" size="icon" onClick={toggleTheme} aria-label="Alternar tema">
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>
        </header>

        {!isCashOpen && (
          <div className="flex-none border-b border-warning/30 bg-warning/10 px-6 py-3 text-sm text-warning compact:px-4 compact:py-2">
            Caixa fechado. Abra o caixa para operar o sistema.
            <Badge className="ml-3" variant="warning">Operações bloqueadas</Badge>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-hidden">
          {renderPage()}
        </div>
      </main>
      {cashAction && (
        cashAction === 'open' ? (
          <MasterPasswordVerifyModal
            title="Abrir caixa"
            onCancel={() => setCashAction(null)}
            onVerified={async (password) => {
              try {
                await openCash(0, password);
                await queryClient.invalidateQueries({ queryKey: ['home-dashboard'] });
                setToast({ tone: 'success', message: 'Caixa aberto com sucesso.' });
              } catch (caught) {
                const message = getErrorMessage(caught);
                setToast({ tone: 'error', message });
                throw caught;
              } finally {
                setCashAction(null);
              }
            }}
          />
        ) : (
          <CloseCashModal
            expectedAmountCents={expectedAmountCents}
            onCancel={() => setCashAction(null)}
            onConfirm={async (reportedAmountCents, password) => {
              if (isDev) {
                console.debug('close_cash_session payload', {
                  reportedAmountCents,
                  expectedAmountCents,
                });
              }
              try {
                await closeCash(reportedAmountCents, password);
                await queryClient.invalidateQueries({ queryKey: ['home-dashboard'] });
                setToast({ tone: 'success', message: 'Caixa fechado com sucesso.' });
              } catch (caught) {
                const message = getErrorMessage(caught);
                setToast({ tone: 'error', message });
                throw caught;
              } finally {
                setCashAction(null);
              }
            }}
          />
        )
      )}
      {pendingUpdate && updateModalOpen && (
        <UpdateAvailableModal
          currentVersion={appVersion || '0.1.5'}
          update={pendingUpdate}
          busy={updateState === 'downloading' || updateState === 'installing'}
          status={updateInstallStatus}
          onClose={() => setUpdateModalOpen(false)}
          onConfirm={() => void installPendingUpdate()}
        />
      )}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 rounded-md px-4 py-3 text-sm shadow-lg ${
          toast.tone === 'success' ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

function CloseCashModal({
  expectedAmountCents,
  onCancel,
  onConfirm,
}: {
  expectedAmountCents: number;
  onCancel: () => void;
  onConfirm: (reportedAmountCents: number, password: string) => Promise<void> | void;
}) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  return (
    <DialogShell title="Fechar caixa" onClose={onCancel} className="max-w-[420px]" zIndexClassName="z-[60]">
      <form
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!password) {
            setError('Informe a senha master.');
            return;
          }
          setBusy(true);
          setError('');
          try {
            await onConfirm(expectedAmountCents, password);
          } catch (caught) {
            setError(getErrorMessage(caught));
          } finally {
            setBusy(false);
          }
        }}
      >
        <DialogBody className="grid gap-3">
          <div className="grid gap-1">
            <label className="text-xs font-medium text-muted-foreground">Senha master</label>
            <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Senha master" />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </DialogBody>
        <StickyDialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>Cancelar</Button>
          <Button type="submit" disabled={busy}>{busy ? 'Processando...' : 'Confirmar'}</Button>
        </StickyDialogFooter>
      </form>
    </DialogShell>
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Erro ao concluir operacao.';
}


function initials(value: string) {
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'LM';
}

function getUpdateTooltip(state: UpdateUxState, hasUpdate: boolean) {
  if (state === 'checking') return 'Verificando atualização...';
  if (state === 'downloading') return 'Baixando atualização...';
  if (state === 'installing') return 'Instalando atualização...';
  if (state === 'error') return 'Não foi possível verificar atualização';
  if (hasUpdate || state === 'available') return 'Nova atualização disponível';
  return 'Verificar atualização';
}
