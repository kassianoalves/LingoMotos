# Correcoes finais antes do build - 2026-05-15

## O que foi corrigido

1. Implementada importacao real de produtos em SQLite pelo command `import_products`.
2. O lote agora:
   - recebe dados ja parseados do frontend;
   - valida nome e SKU;
   - procura duplicados por SKU, codigo de barras ou nome;
   - cria categorias e fornecedores ausentes quando necessario;
   - cria ou atualiza produtos em transacao unica;
   - registra lote e linhas em `product_import_batches` e `product_import_rows`;
   - devolve relatorio com criados, atualizados, ignorados, falhas e erros por linha;
   - aplica rollback quando configurado e houver erro critico.
3. O frontend de importacao passou a usar o backend real e manteve:
   - selecao de CSV/XLS/XLSX;
   - preview;
   - mapeamento de colunas;
   - relatorio final;
   - atualizacao da lista apos importar.
4. O mapeamento de importacao passou a aceitar tambem marca, aplicacao e observacoes.
5. Versoes alinhadas para `0.1.5`.
6. `.gitignore` atualizado para ignorar `src-tauri/target-check*`, `src-tauri/target/` e `src-tauri/target`.

## Arquivos alterados

- `src-tauri/src/repositories/commerce_repository.rs`
- `src-tauri/src/commands/commerce.rs`
- `src-tauri/src/lib.rs`
- `src/features/inventory/types/inventory.types.ts`
- `src/features/inventory/utils/import-products.parser.ts`
- `src/features/inventory/services/inventory.service.ts`
- `src/features/inventory/repositories/inventory.repository.ts`
- `src/features/inventory/components/ImportProductsModal.tsx`
- `src/features/inventory/components/InventoryToolbar.tsx`
- `src/features/inventory/pages/InventoryPage.tsx`
- `src-tauri/Cargo.toml`
- `.gitignore`

## Status da importacao

**Implementada em codigo e pronta para validacao manual final.**

- O botao de importacao esta visivel porque o fluxo agora esta funcional.
- O frontend envia o lote para `import_products`.
- O backend usa SQLite real, sem mocks e sem seeds.

## Status da exportacao

**Mantida corrigida em codigo.**

- CSV e JSON usam dialog de salvamento.
- Cancelamento nao gera erro.
- CSV vazio exporta com cabecalho.
- Toast de sucesso some em 3 segundos.
- Commands continuam registrados e a capability `dialog:allow-save` permanece configurada.

## Status das versoes

- `package.json`: `0.1.5`
- `src-tauri/Cargo.toml`: `0.1.5`
- `src-tauri/tauri.conf.json`: `0.1.5`

## Status do .gitignore

- `src-tauri/target-check*`: ignorado
- `src-tauri/target/`: ignorado
- `src-tauri/target`: ignorado

## Pronto para validacao manual final?

**Sim, apos passar nas validacoes tecnicas desta rodada.**

Checklist manual restante:
1. importar produtos;
2. conferir produtos no estoque;
3. exportar CSV;
4. exportar JSON;
5. conferir versao exibida no sistema;
6. confirmar ausencia de `target-check*` pendente no `git status`.
