# Auditoria de Projeto e Build Readiness - 2026-05-15

## Status geral

**Nao pronto para build final ainda.**

O projeto passa em `npm.cmd run typecheck` e `cargo check`, e o `tauri dev` inicia o Vite e o fluxo Rust sem erro de compilacao. Ainda faltam fechar alguns pontos funcionais e concluir a validacao manual completa antes de considerar o pacote pronto para build final.

## Bugs criticos encontrados

1. A exportacao de relatorios usava `@tauri-apps/plugin-dialog`, mas a capability principal so tinha `core:default`; isso podia impedir o `save()` em runtime mesmo com o plugin instalado.
2. A exportacao nao tratava erro real de escrita em disco; qualquer falha de permissao ou caminho invalido subiria sem feedback amigavel.
3. O banco estava sendo criado em `AppData/Roaming/LingoMotos/data`, divergindo do requisito atual de ficar em `AppData/Roaming/LingoMotos`.
4. A importacao de produtos ainda esta propositalmente nao migrada para SQLite e falha com erro em runtime.

## Bugs corrigidos

1. Liberada a permissao `dialog:allow-save` em `src-tauri/capabilities/default.json`.
2. A tela de relatorios agora:
   - abre o dialog de salvamento para CSV e JSON;
   - nao mostra erro quando o usuario cancela;
   - exporta CSV vazio com cabecalho;
   - mostra toast de sucesso por 3 segundos;
   - mostra toast de erro amigavel se a gravacao falhar.
3. O banco agora e aberto diretamente em `AppData/Roaming/LingoMotos/lingomotos.sqlite3`.
4. Foi adicionado fallback de migracao do banco legado em `AppData/Roaming/LingoMotos/data/lingomotos.sqlite3` para nao perder instalacoes ja existentes.
5. Removidos log excessivo de criacao de venda e codigo morto simples no backend.

## Pendencias

1. `importProducts()` ainda retorna `Importacao ainda nao migrada para SQLite.` e precisa de command/repository Rust real.
2. O botao de atualizacao na sidebar ainda e placeholder e apenas mostra toast.
3. A validacao manual final pedida ainda precisa ser executada de ponta a ponta no app real:
   - criar cliente;
   - criar produto;
   - abrir caixa;
   - vender;
   - conferir financeiro;
   - conferir relatorios;
   - exportar CSV/JSON;
   - criar backup;
   - reiniciar e confirmar persistencia.
4. A sessao atual nao conseguiu inspecionar o app pelo navegador embutido por bloqueio de acesso a `localhost`, entao nao ha prova visual final nesta auditoria.

## Riscos de build

1. Ainda nao foi gerado build final por restricao explicita.
2. O `tauri dev` iniciou, mas a validacao visual completa nao foi concluida nesta sessao.
3. O projeto contem varios artefatos locais `src-tauri/target-check*` no working tree; eles nao entram no `.gitignore` atual e devem ser ignorados ou removidos antes de publicar.
4. `Cargo.toml` esta em `0.1.0`, enquanto `package.json` e `tauri.conf.json` estao em `0.1.5`; isso nao bloqueia o dev agora, mas deve ser alinhado antes do release.
5. O WebView2/bootstrapper nao foi comprovado nesta auditoria sem rodar build/bundle final.

## Dependencias e permissoes

### Confirmado

- Frontend possui `@tauri-apps/plugin-dialog`.
- Rust possui `tauri-plugin-dialog`.
- `lib.rs` registra `tauri_plugin_dialog::init()`.
- Commands `export_report_csv` e `export_report_json` existem e estao registrados no `invoke_handler`.
- Exportacao grava arquivo real no caminho escolhido via Rust.

### Corrigido

- Adicionada permissao `dialog:allow-save`.

### Nao necessario no estado atual

- `tauri-plugin-fs` nao e necessario para exportacao porque a escrita e feita por command Rust.
- `tauri-plugin-opener` nao e obrigatorio hoje porque o fluxo de WhatsApp usa command Rust proprio `open_external_url`.

## Status da exportacao de relatorios

**Corrigida em codigo, aguardando validacao manual final no app real.**

- CSV e JSON usam janela de salvamento.
- O nome sugerido de vendas segue `relatorio-vendas-YYYY-MM-DD.csv/json`.
- CSV vazio recebe cabecalho.
- Cancelamento nao gera erro.
- Erro de escrita retorna feedback amigavel.

## Status offline-first

**A arquitetura principal esta offline-first.**

- Clientes, estoque, categorias, fornecedores, caixa, vendas, financeiro, relatorios, backup local e configuracoes usam comandos locais e SQLite.
- Nao foram encontrados assets externos obrigatorios nem dependencias de CDN.
- Uso de `localStorage` encontrado apenas para tema visual.
- Banco local: `AppData/Roaming/LingoMotos/lingomotos.sqlite3`.
- Backups: `AppData/Roaming/LingoMotos/backups`.

## Banco / SQLite

### Confirmado

- `customer_id` e normalizado para `NULL` quando vazio.
- Venda exige sessao de caixa aberta.
- Produto vendido precisa existir e ter estoque suficiente.
- `sale_items` usam o `sale_id` real da venda criada.
- `cash_movements` usam `cash_session_id` real.
- Lancamentos financeiros usam referencias internas validas.
- A venda, baixa de estoque, movimentos de caixa e financeiro ocorrem dentro de transacao.

### Riscos restantes

- Importacao de produtos ainda nao usa SQLite real.
- `payment_methods` existe no schema, mas o fluxo atual grava `payment_method` textual em movimentos/financeiro; isso hoje nao quebra FK, mas mantem dois modelos convivendo.

## Performance

### Confirmado

- Busca do PDV usa debounce antes de consultar produtos.
- React Query evita refetch em foco e usa `staleTime`.
- Listagens de estoque ja possuem virtualizacao dedicada.
- A senha master e validada somente no submit do modal.

### Melhorias aplicadas

- Removido log de venda no caminho critico.

### Riscos restantes

- Relatorios ainda montam alguns agregados com filtragem em memoria apos carregar dados do banco; isso pode crescer mal em bases grandes.
- `get_stock_report` e `get_inventory_valuation_report` chamam `list_products()` e filtram em memoria.

## Arquivos alterados nesta auditoria

- `src-tauri/capabilities/default.json`
- `src/app/pages/ReportsPage.tsx`
- `src-tauri/src/database/connection.rs`
- `src-tauri/src/services/offline_service.rs`
- `src-tauri/src/services/export_service.rs`
- `src-tauri/src/commands/commerce.rs`
- `src-tauri/src/repositories/commerce_repository.rs`
- `docs/project-audit-build-readiness-2026-05-15.md`

## Validacoes executadas

1. `npm.cmd run typecheck` - passou.
2. `cargo check` - passou.
3. `npm.cmd run tauri -- dev` - iniciou Vite e compilacao Rust; execucao foi interrompida apenas pelo timeout da auditoria, nao por erro de codigo.

Observacao: `npm run typecheck` sem `npm.cmd` falhou neste Windows por politica de execucao do PowerShell para `npm.ps1`, nao por erro do projeto.

## Proximos passos recomendados

1. Implementar a importacao de produtos em SQLite e remover o fallback de erro atual.
2. Executar a validacao manual final completa no app aberto por `tauri dev`.
3. Confirmar manualmente os arquivos CSV e JSON em uma pasta escolhida pelo usuario.
4. Alinhar versoes entre `Cargo.toml`, `package.json` e `tauri.conf.json`.
5. Ignorar/remover `src-tauri/target-check*` antes de publicar alteracoes.
6. Depois da validacao manual, rodar uma revisao final de release sem ainda gerar instalador, focada em versionamento, icones, bundle config e artefatos do repositorio.
