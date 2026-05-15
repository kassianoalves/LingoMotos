import { useRef, useState } from 'react';
import { clsx } from 'clsx';
import {
  BarChart3,
  Boxes,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Gauge,
  MessageCircle,
  Moon,
  Plus,
  Search,
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
import { WhatsappPage } from '@features/whatsapp';
import { WorkshopPage } from '@features/workshop';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Badge } from '@shared/components/ui/badge';
import { useAppShellStore } from '@shared/stores/app-shell.store';
import { useCashSessionStore } from '@shared/stores/cash-session.store';
import { useThemeStore } from '@shared/stores/theme.store';
import { HomePage } from '@app/pages/HomePage';
import { ReportsPage } from '@app/pages/ReportsPage';
import { SettingsPage } from '@app/pages/SettingsPage';
import { useGlobalShortcuts } from '@app/shortcuts/useGlobalShortcuts';

type AppRoute = {
  path: string;
  label: string;
  subtitle: string;
  icon: typeof Gauge;
  group: 'Operação' | 'Gestão';
};

const routes: AppRoute[] = [
  { path: '/inicio', label: 'Início', subtitle: 'Resumo operacional da loja', icon: Gauge, group: 'Operação' },
  { path: '/vendas', label: 'Vendas', subtitle: 'PDV rápido para venda de balcão', icon: ShoppingCart, group: 'Operação' },
  { path: '/clientes', label: 'Clientes', subtitle: 'Cadastro e relacionamento com clientes', icon: Users, group: 'Operação' },
  { path: '/oficina', label: 'Oficina', subtitle: 'Módulo bloqueado em preparação', icon: Wrench, group: 'Operação' },
  { path: '/whatsapp', label: 'WhatsApp', subtitle: 'Integração oficial em preparação', icon: MessageCircle, group: 'Operação' },
  { path: '/estoque', label: 'Estoque', subtitle: 'Produtos, categorias, fornecedores e movimentações', icon: Boxes, group: 'Gestão' },
  { path: '/financeiro', label: 'Financeiro', subtitle: 'Receitas, despesas, caixa e relatórios', icon: CircleDollarSign, group: 'Gestão' },
  { path: '/relatorios', label: 'Relatórios', subtitle: 'Consultas consolidadas do sistema', icon: BarChart3, group: 'Gestão' },
  { path: '/configuracoes', label: 'Configurações', subtitle: 'Preferências, atalhos e estrutura local', icon: Settings, group: 'Gestão' },
];

export function AppShell() {
  const sidebarCollapsed = useAppShellStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useAppShellStore((state) => state.toggleSidebar);
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const isCashOpen = useCashSessionStore((state) => state.isOpen);
  const openCash = useCashSessionStore((state) => state.openCash);
  const closeCash = useCashSessionStore((state) => state.closeCash);
  const [activePath, setActivePath] = useState('/inicio');
  const globalSearchRef = useRef<HTMLInputElement>(null);
  const activeRoute = routes.find((route) => route.path === activePath) ?? routes[0];

  useGlobalShortcuts({
    navigate: setActivePath,
    toggleTheme,
    showCash: () => setActivePath('/financeiro'),
    focusSearch: () => globalSearchRef.current?.focus(),
  });

  function renderPage() {
    if (activePath === '/inicio') return <HomePage navigate={setActivePath} />;
    if (activePath === '/estoque') return <InventoryPage cashOpen={isCashOpen} />;
    if (activePath === '/vendas') return <PosPage cashOpen={isCashOpen} />;
    if (activePath === '/financeiro') return <FinancePage cashOpen={isCashOpen} />;
    if (activePath === '/clientes') return <CustomersPage />;
    if (activePath === '/relatorios') return <ReportsPage />;
    if (activePath === '/configuracoes') return <SettingsPage />;
    if (activePath === '/oficina') return <WorkshopPage />;
    if (activePath === '/whatsapp') return <WhatsappPage />;
    return <HomePage navigate={setActivePath} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-20 flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-200',
          sidebarCollapsed ? 'w-20' : 'w-72',
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-primary">LingoMotos</p>
            {!sidebarCollapsed && <p className="text-xs text-muted-foreground">Peças e oficina</p>}
          </div>
          <Button variant="ghost" size="icon" onClick={toggleSidebar} aria-label="Alternar menu lateral">
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
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
                        <Icon className="h-4 w-4 shrink-0" />
                        {!sidebarCollapsed && <span className="ml-3 truncate">{route.label}</span>}
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <button
            type="button"
            onClick={() => (isCashOpen ? closeCash() : openCash(0))}
            className="w-full rounded-md border border-border bg-background p-3 text-left"
          >
            <div className={clsx('flex items-center gap-2', sidebarCollapsed && 'justify-center')}>
              <span className={clsx('h-2 w-2 rounded-full', isCashOpen ? 'bg-success' : 'bg-destructive')} />
              {!sidebarCollapsed && (
                <span className="text-xs font-medium">{isCashOpen ? 'Fechar caixa' : 'Abrir caixa'}</span>
              )}
            </div>
            {!sidebarCollapsed && <p className="mt-2 text-xs text-muted-foreground">Operador: Admin · v0.1.0</p>}
          </button>
        </div>
      </aside>

      <main className={clsx('min-h-screen transition-[padding] duration-200', sidebarCollapsed ? 'pl-20' : 'pl-72')}>
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border bg-card/95 px-6 backdrop-blur">
          <div className="min-w-0">
            <h1 className="text-base font-semibold">{activeRoute.label}</h1>
            <p className="text-xs text-muted-foreground">{activeRoute.subtitle}</p>
          </div>
          <div className="relative ml-4 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input ref={globalSearchRef} className="h-10 pl-9" placeholder="Busca global" />
          </div>
          <Button size="sm" onClick={() => setActivePath('/vendas')}>
            <Plus className="h-4 w-4" />
            Nova venda
          </Button>
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
    </div>
  );
}

