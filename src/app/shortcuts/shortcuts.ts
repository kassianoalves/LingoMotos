export const appShortcuts = [
  { key: 'F1', route: '/inicio', label: 'Inicio', dangerous: false },
  { key: 'F2', route: '/estoque', label: 'Estoque', dangerous: false },
  { key: 'F3', route: '/vendas', label: 'Vendas', dangerous: false },
  { key: 'F4', route: '/financeiro', label: 'Financeiro', dangerous: false },
  { key: 'F5', route: '/clientes', label: 'Clientes', dangerous: false },
  { key: 'F6', route: '/relatorios', label: 'Relatorios', dangerous: false },
  { key: 'F7', route: '/configuracoes', label: 'Configuracoes', dangerous: false },
  { key: 'F8', action: 'cash', label: 'Ver caixa', dangerous: true },
  { key: 'F9', route: '/vendas', label: 'Nova venda', dangerous: true },
  { key: 'F10', action: 'searchProduct', label: 'Buscar produto', dangerous: false },
  { key: 'F11', action: 'toggleTheme', label: 'Alternar tema', dangerous: false },
  { key: 'F12', route: '/configuracoes', label: 'Ajuda/atalhos', dangerous: false },
] as const;

export type AppShortcut = (typeof appShortcuts)[number];

