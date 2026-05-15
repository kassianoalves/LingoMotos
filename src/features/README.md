# Features

Cada modulo de negocio deve ficar em sua propria pasta.

Modelo recomendado:

```txt
features/work-orders/
  components/
  pages/
  queries/
  services/
  stores/
  types/
  index.ts
```

Regras:

- Componentes chamam hooks/queries, nunca comandos Tauri diretamente.
- Services frontend dependem de `serviceClient`.
- Stores Zustand guardam apenas estado de interface ou fluxo local.
- Tipos publicos da feature saem por `index.ts`.

