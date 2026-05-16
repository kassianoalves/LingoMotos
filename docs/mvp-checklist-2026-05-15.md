# Checklist MVP - 2026-05-15

## Resultado geral

- Status: **nao recomendado gerar build ainda**
- Motivo principal: o fluxo principal esta muito mais consistente e os comandos SQLite reais existem, mas a validacao manual completa dentro do webview Tauri ainda precisa ser executada ponta a ponta antes do build final.

## Passou

- `npm run tauri dev` inicia o app sem gerar build.
- `npm.cmd run typecheck` passou.
- `cargo check` passou.
- SQLite real existe em `AppData/Roaming/LingoMotos/data/lingomotos.sqlite3`.
- Backups reais foram criados em `AppData/Roaming/LingoMotos/backups`.
- Configuracoes usam SQLite real.
- Clientes usam SQLite real.
- Categorias e fornecedores usam SQLite real.
- Produtos e estoque usam SQLite real.
- Caixa, vendas, financeiro, relatorios, exportacao e backup usam commands Tauri reais.
- Venda finalizada usa transacao SQLite e grava venda, itens, baixa de estoque, caixa e financeiro.
- Venda com caixa fechado e venda sem estoque sao bloqueadas no backend.
- Relatorios consultam dados reais e exportam CSV/JSON.
- Datas usam range local e formatacao PT-BR.
- Logo da loja e dados da loja persistem por SQLite.
- Metas financeiras agora usam a tabela `financial_goals`.
- Movimentacoes de estoque agora tem listagem real na tela.
- Categorias e fornecedores agora podem ser criados, editados e desativados pela interface.
- Abertura e fechamento de caixa agora exigem valor informado.

## Falhou ou precisou correcao nesta auditoria

- Financeiro tinha lancamentos manuais que apenas fechavam modal sem persistir.
- Metas financeiras ainda viviam somente em memoria.
- Relatorios exibiam texto dizendo que filtros existiam, mas a interface ainda nao os oferecia.
- Categorias e fornecedores tinham backend real, mas a interface so permitia criar.
- A aba de movimentacoes mostrava texto placeholder em vez de dados reais.
- Abertura/fechamento de caixa ignorava os valores informados pelo operador.
- Havia controle de importacao visivel sem backend SQLite concluido.
- O card de receita do dia usava o total do filtro em vez da receita real do dia.
- Quantidade de itens em venda ainda aceitava valor fracionado no backend.

## Arquivos corrigidos nesta rodada

- `src-tauri/src/repositories/commerce_repository.rs`
- `src-tauri/src/commands/commerce.rs`
- `src-tauri/src/lib.rs`
- `src/app/layout/AppShell.tsx`
- `src/app/pages/HomePage.tsx`
- `src/app/pages/ReportsPage.tsx`
- `src/features/finance/pages/FinancePage.tsx`
- `src/features/finance/services/finance.service.ts`
- `src/features/finance/stores/financial-goals.store.ts`
- `src/features/finance/types/finance.types.ts`
- `src/features/inventory/components/InventoryToolbar.tsx`
- `src/features/inventory/pages/InventoryPage.tsx`
- `src/features/inventory/queries/inventory.queries.ts`
- `src/features/inventory/repositories/inventory.repository.ts`
- `src/features/inventory/services/inventory.service.ts`

## Pendencias

- Executar a validacao manual completa dentro do webview Tauri:
  - editar configuracoes e reabrir app;
  - criar/editar cliente e iniciar venda vinculada;
  - criar categoria, fornecedor, produto e movimentacoes;
  - abrir caixa, vender, fechar e reabrir app;
  - validar relatorios, exportacoes e restauracao de backup.
- Confirmar visualmente que nao ha erros vermelhos no console do webview Tauri.
- Confirmar no uso real que o historico de cliente reflete as vendas criadas.
- A importacao em lote permanece fora do MVP validado; o controle visivel foi removido ate existir backend real.

## Bugs criticos restantes

- **Nenhum bug critico confirmado no codigo apos as correcoes desta rodada.**
- Risco residual: a validacao visual/manual completa do webview ainda nao foi concluida nesta sessao, portanto o estado final do MVP ainda nao deve ser tratado como liberado para build.

## Recomendacao

- **Ainda nao gerar build.**
- Antes do build, executar exatamente este roteiro em `npm run tauri dev`:
  1. Abrir o app e confirmar navegacao/sidebar/tema.
  2. Salvar configuracoes, cancelar edicao e reabrir o app.
  3. Criar cliente, abrir WhatsApp, iniciar venda pelo cliente e validar historico.
  4. Criar/editar/desativar categoria e fornecedor.
  5. Criar produto, registrar entrada e ajuste, remover com soft delete e validar alertas.
  6. Abrir caixa com valor inicial, reabrir app e confirmar caixa aberto.
  7. Vender com e sem cliente, validar estoque, caixa, financeiro e relatorios.
  8. Tentar vender sem estoque e com caixa fechado.
  9. Criar receita/despesa manual e meta financeira.
  10. Exportar CSV/JSON, criar backup, restaurar com confirmacao e reabrir app.
