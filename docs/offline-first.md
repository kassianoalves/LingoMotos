# Arquitetura Offline-First

## Objetivo

O LingoMotos e um aplicativo desktop local. Depois de instalado pelo Tauri, o usuario abre pelo icone do sistema operacional, sem terminal, prompt ou servidor externo.

## Inicializacao

Fluxo de abertura:

```txt
Icone desktop
  -> executavel Tauri
  -> cria diretorios locais
  -> abre SQLite local
  -> ativa PRAGMA foreign_keys, WAL e busy_timeout
  -> aplica migrations
  -> carrega React embutido no bundle
```

O frontend nao precisa de internet para abrir. O Vite existe apenas em desenvolvimento.

## Diretórios Locais

No Windows, os dados ficam sob `AppData/Local/LingoMotos`.

Estrutura:

```txt
LingoMotos/
  data/
    lingomotos.sqlite3
    lingomotos.sqlite3-wal
    lingomotos.sqlite3-shm
  backups/
    lingomotos-backup-<timestamp>.sqlite3
```

O codigo instalado e separado dos dados do cliente. Atualizar o aplicativo nao apaga o banco local.

## SQLite

O SQLite e a fonte primaria de dados.

Configuracoes aplicadas na abertura:

- `PRAGMA journal_mode = WAL`
- `PRAGMA foreign_keys = ON`
- `PRAGMA busy_timeout = 5000`

Toda regra critica deve acontecer dentro de services Tauri e repositories SQLite. O React chama commands Tauri; nunca acessa o arquivo SQLite diretamente.

## Backups

Comandos Tauri:

- `offline_status`
- `create_backup`
- `list_backups`
- `restore_backup`

`create_backup` usa `VACUUM INTO`, gerando um arquivo SQLite consistente mesmo com WAL ativo.

`restore_backup` valida o arquivo, cria um backup de seguranca antes de restaurar e registra auditoria em `backup_history`.

## Restore

Fluxo recomendado:

```txt
Usuario seleciona backup
  -> sistema valida extensao e existencia
  -> cria backup de seguranca do estado atual
  -> executa checkpoint WAL
  -> copia backup para o caminho do banco local
  -> registra historico
  -> solicita reinicio do aplicativo
```

Na versao final, apos restore, a UI deve pedir para fechar e abrir novamente o app para recarregar todas as conexoes.

## Tratamento de Falhas

Falhas esperadas:

- banco indisponivel;
- arquivo de backup invalido;
- permissao negada no diretorio local;
- queda de energia durante escrita;
- migration incompleta;
- disco cheio.

Estrategias:

- WAL para reduzir risco de corrupcao;
- migrations versionadas;
- backup automatico antes de restore;
- erros Tauri serializados com `code` e `message`;
- operations criticas em transacao SQLite;
- historico em `backup_history`.

## Instalacao

O Tauri empacota o app em instaladores nativos.

Comandos:

```bash
npm run tauri:build
```

O usuario final instala o app e abre pelo icone. Nao ha necessidade de Node, terminal, prompt, Vite ou servidor.

## Atualizacao Futura

Estratégia recomendada:

- manter dados em `AppData/Local/LingoMotos`;
- distribuir nova versao do executavel;
- ao abrir, aplicar migrations pendentes;
- criar backup automatico antes de migrations destrutivas;
- nunca alterar schema sem migration versionada.

O projeto ja possui `schema_migrations` para controlar versoes.

## Sincronizacao Online Opcional

O sistema continua offline como fonte primaria. APIs online devem ser opcionais.

Modelo futuro:

```txt
SQLite local
  -> sync_outbox
  -> worker de sincronizacao
  -> API online
  -> sync_state
```

Regras:

- toda alteracao local grava no SQLite primeiro;
- depois grava evento em `sync_outbox`;
- se houver internet, um worker envia eventos pendentes;
- conflitos entram como `conflict`;
- UI mostra pendencias sem bloquear vendas;
- PDV, estoque e caixa nunca dependem da API para funcionar.

Tabelas preparadas:

- `sync_outbox`
- `sync_state`

