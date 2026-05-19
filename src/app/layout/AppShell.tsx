import { useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';
import {
  BarChart3,
  Boxes,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Gauge,
  Moon,
  Plus,
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

type AppRoute = {
  path: string;
  label: string;
  subtitle: string;
  icon: typeof Gauge;
  group: 'Operação' | 'Gestão';
  badge?: string;
};

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
  const sidebarCollapsed = useAppShellStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useAppShellStore((state) => state.toggleSidebar);
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const isCashOpen = useCashSessionStore((state) => state.isOpen);
  const openCash = useCashSessionStore((state) => state.openCash);
  const closeCash = useCashSessionStore((state) => state.closeCash);
  const loadCashSession = useCashSessionStore((state) => state.loadCashSession);
  const storeSettings = useStoreSettingsStore((state) => state.settings);
  const loadSettings = useStoreSettingsStore((state) => state.loadSettings);
  const [activePath, setActivePath] = useState('/inicio');
  const [cashAction, setCashAction] = useState<'open' | 'close' | null>(null);
  const [toast, setToast] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [appVersion, setAppVersion] = useState('');
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [isInstallingUpdate, setIsInstallingUpdate] = useState(false);
  const [updateInstallStatus, setUpdateInstallStatus] = useState('');
  const [pendingUpdate, setPendingUpdate] = useState<PendingUpdate | null>(null);
  const activeRoute = routes.find((route) => route.path === activePath) ?? routes[0];

  useEffect(() => {
    void loadSettings();
    void loadCashSession();
  }, [loadCashSession, loadSettings]);

  useEffect(() => {
    void serviceClient.execute<string>('app_version').then(setAppVersion).catch(() => setAppVersion('0.1.5'));
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
    if (activePath === '/inicio') return <HomePage />;
    if (activePath === '/estoque') return <InventoryPage cashOpen={isCashOpen} />;
    if (activePath === '/vendas') return <PosPage cashOpen={isCashOpen} />;
    if (activePath === '/financeiro') return <FinancePage cashOpen={isCashOpen} />;
    if (activePath === '/clientes') return <CustomersPage navigate={setActivePath} cashOpen={isCashOpen} />;
    if (activePath === '/relatorios') return <ReportsPage />;
    if (activePath === '/configuracoes') return <SettingsPage />;
    if (activePath === '/oficina') return <WorkshopPage />;
    return <HomePage />;
  }

  async function toggleCashSession() {
    setCashAction(isCashOpen ? 'close' : 'open');
  }

  async function checkForUpdate() {
    setIsCheckingUpdate(true);
    setToast({ tone: 'success', message: 'Verificando atualização...' });

    try {
      const update = await updaterService.checkForUpdate();
      if (!update) {
        setToast({ tone: 'success', message: 'Sistema atualizado.' });
        return;
      }

      setPendingUpdate(update);
      setToast({ tone: 'success', message: `Nova versão disponível: v${update.version}` });
    } catch {
      setToast({ tone: 'success', message: 'Sem conexão. O sistema continua funcionando offline.' });
    } finally {
      setIsCheckingUpdate(false);
    }
  }

  async function installPendingUpdate() {
    if (!pendingUpdate) return;

    setIsInstallingUpdate(true);
    setUpdateInstallStatus('Criando backup automático...');
    try {
      await updaterService.createAutomaticBackup();
    } catch {
      setToast({ tone: 'error', message: 'Não foi possível criar o backup automático. Atualização cancelada.' });
      setIsInstallingUpdate(false);
      setUpdateInstallStatus('');
      return;
    }

    try {
      setUpdateInstallStatus('Baixando atualização...');
      setToast({ tone: 'success', message: 'Baixando atualização...' });
      await updaterService.downloadUpdate(pendingUpdate);
      setUpdateInstallStatus('Instalando atualização...');
      setToast({ tone: 'success', message: 'Instalando atualização...' });
      await pendingUpdate.install();
      setPendingUpdate(null);
      setToast({ tone: 'success', message: 'Reinicie o sistema.' });
      await relaunch();
    } catch {
      setToast({ tone: 'error', message: 'Não foi possível instalar a atualização.' });
    } finally {
      setIsInstallingUpdate(false);
      setUpdateInstallStatus('');
    }
  }

  function renderHeaderAction() {
    if (activePath === '/inicio' || activePath === '/vendas') {
      return (
        <Button size="sm" onClick={() => setActivePath('/vendas')}>
          <Plus className="h-4 w-4" />
          Nova venda
        </Button>
      );
    }

    if (activePath === '/clientes') {
      return (
        <Button
          size="sm"
          disabled={!isCashOpen}
          onClick={() => {
            if (!isCashOpen) {
              setToast({ tone: 'error', message: 'Abra o caixa para cadastrar clientes.' });
              return;
            }
            window.dispatchEvent(new CustomEvent('customers:create'));
          }}
        >
          <Plus className="h-4 w-4" />
          Novo cliente
        </Button>
      );
    }

    if (activePath === '/oficina') {
      return (
        <Button size="sm" variant="outline" onClick={() => setToast({ tone: 'success', message: 'Módulo em breve' })}>
          <Plus className="h-4 w-4" />
          Novo orçamento
        </Button>
      );
    }

    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-20 flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-200',
          sidebarCollapsed ? 'w-[72px]' : 'w-60',
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

        <nav className="flex-1 space-y-5 px-3 py-4">
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
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  aria-label="Verificar atualização"
                  disabled={isCheckingUpdate || isInstallingUpdate}
                  onClick={() => void checkForUpdate()}
                >
                  <RefreshCw className={clsx('h-3.5 w-3.5', isCheckingUpdate && 'animate-spin')} />
                </Button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className={clsx('min-h-screen transition-[padding] duration-200', sidebarCollapsed ? 'pl-[72px]' : 'pl-60')}>
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border bg-card/95 px-6 backdrop-blur">
          <div className="min-w-0">
            <h1 className="text-base font-semibold">{activeRoute.label}</h1>
            <p className="text-xs text-muted-foreground">{activeRoute.subtitle}</p>
          </div>
          <div className="ml-4 flex-1" />
          {renderHeaderAction()}
          <Button variant="outline" size="icon" onClick={toggleTheme} aria-label="Alternar tema">
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>
        </header>

        {!isCashOpen && (
          <div className="border-b border-warning/30 bg-warning/10 px-6 py-3 text-sm text-warning">
            Caixa fechado. Abra o caixa para operar o sistema.
            <Badge className="ml-3" variant="warning">Operações bloqueadas</Badge>
          </div>
        )}

        {renderPage()}
      </main>
      {cashAction && (
        <MasterPasswordVerifyModal
          title={cashAction === 'open' ? 'Abrir caixa' : 'Fechar caixa'}
          onCancel={() => setCashAction(null)}
          onVerified={async (password) => {
            try {
              if (cashAction === 'open') {
                await openCash(0, password);
                setToast({ tone: 'success', message: 'Caixa aberto com sucesso.' });
              } else {
                await closeCash(undefined, password);
                setToast({ tone: 'success', message: 'Caixa fechado com sucesso.' });
              }
            } catch {
              setToast({ tone: 'error', message: 'Nao foi possivel atualizar o caixa.' });
            }
            setCashAction(null);
          }}
        />
      )}
      {pendingUpdate && (
        <UpdateAvailableModal
          currentVersion={appVersion || '0.1.5'}
          update={pendingUpdate}
          busy={isInstallingUpdate}
          status={updateInstallStatus}
          onClose={() => setPendingUpdate(null)}
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


function initials(value: string) {
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'LM';
}
