# Design System

## Objetivo

O design system global do LingoMotos usa CSS variables, TailwindCSS e shadcn/ui para manter modo claro, modo escuro e troca instantanea de tema sem cores hardcoded em componentes.

## Estrutura

```txt
src/styles/global.css              Tokens globais e temas light/dark
tailwind.config.ts                 Integracao Tailwind com CSS variables
src/app/theme/ThemeProvider.tsx    Aplica a classe light/dark no document
src/shared/stores/theme.store.ts   Estado Zustand persistido do tema
src/shared/components/ui/          Componentes shadcn/ui
src/shared/lib/utils.ts            Helper cn para classes shadcn
components.json                    Configuracao shadcn/ui
```

## Tokens globais

Tokens ficam em `src/styles/global.css`.

Categorias:

- cores semanticas: `background`, `foreground`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `success`, `warning`, `info`, `border`, `input`, `ring`;
- sidebar: `sidebar`, `sidebar-foreground`, `sidebar-border`, `sidebar-accent`, `sidebar-accent-foreground`;
- tipografia: `font-sans`, `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `leading-*`;
- spacing adicional: `space-18`, `space-22`, `space-26`;
- radius: `radius`;
- sombras: `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-soft`.

## Uso em componentes

Permitido:

```tsx
<div className="border border-border bg-card text-card-foreground shadow-soft" />
<button className="bg-primary text-primary-foreground hover:bg-accent" />
```

Evite:

```tsx
<div className="bg-white text-slate-900 border-slate-200" />
<button className="bg-blue-600 text-white" />
```

## Dark mode

A estrategia e por classe:

```txt
html.light
html.dark
```

`ThemeProvider` aplica a classe no `document.documentElement`. O estado fica em Zustand com persistencia em `localStorage` na chave `lingomotos-theme`.

## shadcn/ui

O projeto usa `components.json` com `cssVariables: true`. Componentes devem ser gerados em:

```txt
src/shared/components/ui
```

Todo componente shadcn deve continuar apontando para tokens semanticos. Variantes novas devem usar `class-variance-authority` e `cn`.

## Padrao visual global

- fundo geral: `bg-background`;
- superficies: `bg-card text-card-foreground`;
- navegacao lateral: `bg-sidebar text-sidebar-foreground`;
- bordas: `border-border`;
- textos secundarios: `text-muted-foreground`;
- acao primaria: `bg-primary text-primary-foreground`;
- estados positivos: `success`;
- alertas: `warning`;
- erros: `destructive`.

## Performance

A troca de tema altera somente CSS variables por classe no elemento raiz. Isso evita rerender pesado e mantem a interface rapida em ambiente desktop offline.

