# Bloqueios corrigidos antes do build - LingoMotos

Data: 2026-05-15

## Bloqueios encontrados

1. Havia risco recorrente de conflito na porta `1420` durante novas sessoes de `tauri dev`.
2. Existiam diretorios locais `src-tauri/target-check*` no workspace.
3. A auditoria antiga de persistencia contradizia o codigo atual.
4. Faltavam roteiros operacionais objetivos para validacao offline e pre-build.
5. O reset de fabrica removia somente backups `.db`, embora a listagem aceitasse tambem `.sqlite3`.
6. O reset nao limpava algumas tabelas operacionais recentes quando executado com `foreign_keys` desligado.

## Bloqueios corrigidos

- A porta `1420` foi auditada antes da sessao limpa.
- Foi documentado o comando Windows para identificar e encerrar o processo que ocupe a porta:

```powershell
netstat -ano | findstr :1420
taskkill /PID <PID> /F
```

- Os artefatos locais `src-tauri/target-check*` foram removidos do workspace.
- O `.gitignore` foi confirmado e ampliado para cobrir:
  - `src-tauri/target/`
  - `src-tauri/target-check*`
  - `node_modules/`
  - `dist/`
  - `*.db`
  - `*.sqlite`
  - `*.sqlite3`
  - `.env`
  - `.env.local`
  - `private.key`
- A auditoria antiga recebeu aviso explicito de obsolescencia.
- Foram criados:
  - `docs/current-architecture-2026-05-15.md`
  - `docs/manual-offline-validation.md`
  - `docs/manual-pre-build-checklist.md`
- O reset de fabrica passou a remover backups `.db` e `.sqlite3`.
- O reset passou a limpar tambem campos personalizados, lotes de importacao e contas a pagar/receber.

## Comandos executados

- `netstat -ano | findstr :1420`
- `npm.cmd run typecheck`
- `cargo check`
- `npm.cmd run tauri -- dev`

## Status por area

### Porta 1420

- Status: auditada.
- Resultado desta rodada: sem processo escutando antes da validacao final.
- `npm.cmd run tauri -- dev` iniciou o Vite em `http://localhost:1420/` sem conflito de porta e chegou a executar `target/debug/lingomotos.exe`.

### Artefatos `target-check*`

- Status: removidos do workspace e cobertos pelo `.gitignore`.

### Documentacao

- Status: atualizada.
- Documento historico preservado com aviso de obsolescencia.
- Nova arquitetura atual e roteiros manuais criados.

### Offline-first

- Status: documentado e pronto para validacao manual objetiva.
- O codigo atual usa SQLite local e commands Tauri para os modulos principais.
- A comprovacao operacional offline completa continua reservada ao roteiro manual, porque exige desligar a rede e executar o fluxo real na janela do app.

### Exportacao

- Status: revalidada por codigo.
- CSV usa `;`, BOM UTF-8, cabecalho mesmo vazio, datas em formato brasileiro e dialog de salvamento.
- JSON usa dialog de salvamento.
- Cancelamento do dialog retorna sem toast de erro.
- Sucesso exibe toast temporario.

### Backup e reset

- Status: revalidado por codigo.
- Senha master e validada no backend.
- Exclusao de backup restringe caminho a arquivos dentro da pasta de backup.
- Reset remove dados, campos personalizados, importacoes, contas financeiras e backups `.db`/`.sqlite3`.

### Build readiness

- `package.json`: `0.1.5`
- `src-tauri/Cargo.toml`: `0.1.5`
- `src-tauri/tauri.conf.json`: `0.1.5`
- `productName`: `LingoMotos`
- `identifier`: `com.lingomotos.desktop`
- Icones: presentes em `src-tauri/icons`
- Capability `dialog:allow-save`: presente
- Banco e backups: fora da pasta instalada, em `%APPDATA%/LingoMotos`
- Dependencias de runtime para o cliente final: o app final nao exige Node, Rust, npm, Git ou instalacao separada de SQLite.

## Status final desta rodada

**Pronto para validacao manual final.**

Ainda nao foi gerado build. A proxima etapa correta e executar integralmente `docs/manual-pre-build-checklist.md` e `docs/manual-offline-validation.md` em uma sessao limpa do aplicativo antes de autorizar o build final.
