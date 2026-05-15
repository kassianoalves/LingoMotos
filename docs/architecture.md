# Arquitetura LingoMotos

## Objetivo

O LingoMotos e um aplicativo desktop local, offline-first, instalado no computador do cliente. O React entrega a interface; o Tauri entrega a camada nativa, acesso ao SQLite, empacotamento e comunicacao segura entre UI e sistema operacional.

## Principios

- Offline primeiro: o SQLite local e a fonte primaria de dados.
- UI rapida: estado remoto via TanStack Query, estado de tela via Zustand.
- Fronteira clara: React nunca acessa SQLite diretamente; chama comandos Tauri.
- Modulos por feature: cada modulo agrupa pages, components, queries, services, stores e tipos.
- Pronto para online: services usam interfaces que podem trocar Tauri local por HTTP futuramente.
- Baixo acoplamento: repositories ficam no backend Tauri; frontend conhece apenas contratos.

## Estrutura

```txt
src/
  app/                 Bootstrap React, providers, layout e shell global
  features/            Modulos de negocio futuros
  shared/              Infra frontend reutilizavel
src-tauri/
  src/
    commands/          API exposta para React via invoke
    database/          Conexao SQLite e migrations
    repositories/      Acesso direto a dados locais
    services/          Regras de aplicacao no backend local
    app_state.rs       Estado compartilhado pelo Tauri
    error.rs           Erros serializaveis para o frontend
  migrations/          Scripts SQL versionados
docs/                  Decisoes e padroes de arquitetura
```

## Camadas frontend

`src/app` inicializa providers e shell visual. Esta camada nao deve conter regra de negocio.

`src/shared/api` centraliza clientes de comunicacao. Hoje chama Tauri; no futuro pode selecionar Tauri ou HTTP sem mudar componentes.

`src/shared/lib/tauri` contem o wrapper tipado sobre `invoke`. Componentes e hooks nao devem chamar `@tauri-apps/api` diretamente.

`src/shared/query` configura TanStack Query para cache em memoria, invalidacao e estados offline.

`src/shared/stores` contem Zustand para estado puramente local de interface, como tema, sidebar e preferencias de tela.

`src/features` recebera modulos como clientes, motos, ordens de servico, estoque, financeiro e agenda. Cada feature deve seguir:

```txt
features/nome-da-feature/
  components/
  pages/
  queries/
  services/
  stores/
  types/
  index.ts
```

## Camadas Tauri/backend local

`commands` e a borda publica do backend local. Cada comando valida entrada, chama um service e retorna DTOs serializaveis.

`services` contem casos de uso locais. E onde entram transacoes, regras de consistencia e orquestracao entre repositories.

`repositories` executam SQL e conhecem tabelas. Nao devem expor detalhes de `rusqlite` para services.

`database` abre o SQLite no diretorio local de dados do aplicativo e aplica migrations versionadas.

## SQLite

O banco local fica no diretorio de dados do sistema operacional, separado do codigo do aplicativo. O schema inicial cria somente tabelas tecnicas:

- `schema_migrations`: controle de migrations aplicadas.
- `app_metadata`: metadados locais do aplicativo.

Tabelas de negocio devem ser criadas somente quando os modulos forem implementados.

## Comunicacao React para Tauri

Fluxo padrao:

```txt
Component -> Query/Store -> Frontend Service -> Command Client -> Tauri invoke -> Command -> Service -> Repository -> SQLite
```

Regras:

- Componentes nao chamam `invoke` diretamente.
- Commands Tauri retornam DTOs simples.
- Erros Tauri sao normalizados em `AppError`.
- Queries leem dados; mutations alteram dados e invalidam queries.

## Preparacao para APIs online

As interfaces de services no frontend devem depender de contratos, nao de transporte. Quando houver API online, o projeto pode adicionar um `http-client` e alternar por configuracao:

```txt
LocalCommandClient -> Tauri/SQLite
RemoteHttpClient   -> API online
```

Sincronizacao futura deve ser um modulo proprio, com fila local, controle de conflitos e auditoria.

