# LingoMotos

Arquitetura inicial para um sistema desktop offline-first de loja/oficina de motos.

Stack base:

- Tauri
- React
- TypeScript
- Vite
- TailwindCSS
- SQLite local
- Zustand
- TanStack Query

Comandos principais:

```bash
npm install
npm run tauri:dev
npm run tauri:build
```

O build Tauri gera o instalador desktop. Depois de instalado, o sistema abre pelo icone do aplicativo, sem terminal.

Leia [docs/architecture.md](docs/architecture.md), [docs/offline-first.md](docs/offline-first.md), [docs/database-schema.md](docs/database-schema.md), [docs/design-system.md](docs/design-system.md) e [docs/product-import.md](docs/product-import.md) antes de adicionar funcionalidades.
