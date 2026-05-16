# Build final - 2026-05-15

## Versao

- Aplicacao: `LingoMotos`
- Versao: `0.1.5`
- `package.json`: `0.1.5`
- `src-tauri/Cargo.toml`: `0.1.5`
- `src-tauri/tauri.conf.json`: `0.1.5`
- `productName`: `LingoMotos`
- `identifier`: `com.lingomotos.desktop`

## Validacoes executadas antes da build

- `npm.cmd run typecheck` - aprovado
- `cargo check` - aprovado
- Icones confirmados em `src-tauri/icons`
- Banco local confirmado em `%APPDATA%/LingoMotos/lingomotos.sqlite3`
- Backups confirmados em `%APPDATA%/LingoMotos/backups`
- WebView2 configurado com `downloadBootstrapper`
- SQLite e embutido no executavel via `rusqlite` com feature `bundled`
- O cliente final nao precisa instalar Node, Rust, npm, Git ou SQLite

## Arquivos gerados

- `src-tauri/target/release/lingomotos.exe`
- `src-tauri/target/release/bundle/msi/LingoMotos_0.1.5_x64_en-US.msi`
- `src-tauri/target/release/bundle/nsis/LingoMotos_0.1.5_x64-setup.exe`

## Caminho do instalador

- MSI: `src-tauri/target/release/bundle/msi/LingoMotos_0.1.5_x64_en-US.msi`
- EXE instalador: `src-tauri/target/release/bundle/nsis/LingoMotos_0.1.5_x64-setup.exe`

## Checklist manual de instalacao

- [ ] Instalar no proprio PC
- [ ] Abrir pelo icone
- [ ] Confirmar que nao abre terminal junto
- [ ] Criar cliente
- [ ] Criar produto
- [ ] Abrir caixa
- [ ] Vender produto
- [ ] Gerar relatorio
- [ ] Criar backup
- [ ] Fechar e abrir novamente
- [ ] Confirmar persistencia dos dados

## Observacoes para instalar no PC do cliente

- Preferir o instalador `LingoMotos_0.1.5_x64-setup.exe` para instalacao comum em Windows.
- O runtime WebView2 sera tratado pelo instalador via bootstrapper configurado no bundle.
- Os dados da aplicacao ficam fora da pasta de instalacao, em `%APPDATA%/LingoMotos`.
- Os backups ficam em `%APPDATA%/LingoMotos/backups`.
- Nao copiar manualmente arquivos de banco para dentro da pasta do projeto ou da instalacao.
- Antes da entrega ao cliente, concluir o checklist manual acima no mesmo instalador que sera entregue.

## Observacoes tecnicas da build

- A build final foi executada com `npm.cmd run tauri -- build`.
- O empacotamento gerou MSI e NSIS com sucesso.
- O compilador Rust emitiu apenas avisos de variaveis nao utilizadas em funcoes de timing de debug; nao houve erro de compilacao nem bloqueio de bundle.
