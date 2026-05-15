# SQLite Schema

## Decisoes principais

- Valores financeiros usam inteiros em centavos (`*_cents`) para evitar erro de arredondamento.
- Quantidades usam `REAL`, permitindo pecas fracionadas quando necessario.
- Vendas armazenam custo e preco historicos em `sale_items`, porque o cadastro do produto pode mudar depois.
- Exclusao logica usa `deleted_at`; indices unicos ativos ignoram registros apagados.
- Importacao Excel e suportada por `import_batch_id`, `import_source` e `import_row_number`.
- O estoque atual fica em `products.current_stock_quantity` e e atualizado por triggers a partir de `stock_movements`.

## Tabelas

`users`: usuarios locais que operam vendas, caixa, estoque e administracao. Relaciona vendas, movimentacoes de estoque e caixa.

`settings`: configuracoes chave-valor do sistema, agrupadas por `group_name`.

`categories`: categorias hierarquicas de produtos, com `parent_id` opcional.

`suppliers`: fornecedores de pecas, acessorios e produtos.

`customers`: clientes da loja/oficina, com documento, contato e limite de credito.

`payment_methods`: meios de pagamento, taxas, prazo de liquidacao e regra de lancamento no caixa.

`products`: cadastro de produtos, pecas, acessorios e servicos, com custo, preco de venda, estoque minimo e estoque atual.

`sales`: cabecalho da venda, totais financeiros, custo total, lucro bruto e margem.

`sale_items`: itens da venda. Mantem snapshot de SKU, nome, custo e preco no momento da venda.

`stock_movements`: livro de estoque. Toda entrada, saida, ajuste, perda e venda deve gerar uma linha.

`cash_movements`: livro de caixa. Pagamentos, devolucoes, despesas, entradas e retiradas devem gerar uma linha.

## Relacionamentos

- `categories.parent_id -> categories.id`
- `products.category_id -> categories.id`
- `products.preferred_supplier_id -> suppliers.id`
- `sales.customer_id -> customers.id`
- `sales.user_id -> users.id`
- `sale_items.sale_id -> sales.id`
- `sale_items.product_id -> products.id`
- `stock_movements.product_id -> products.id`
- `stock_movements.sale_id -> sales.id`
- `stock_movements.sale_item_id -> sale_items.id`
- `stock_movements.user_id -> users.id`
- `cash_movements.sale_id -> sales.id`
- `cash_movements.payment_method_id -> payment_methods.id`
- `cash_movements.user_id -> users.id`

## Indices recomendados

Os indices criados cobrem:

- buscas por SKU, codigo de barras, nome, documento e numero de venda;
- relatorios por data em vendas, caixa e estoque;
- joins por chaves estrangeiras;
- alertas de estoque minimo;
- consultas financeiras por periodo, status, totais, custo e lucro;
- reconciliacao de importacoes por lote e linha de origem.

## Lucro e margem

Em `sale_items`, `gross_profit_cents` e calculado como:

```txt
line_total_cents - line_cost_cents
```

Em `sales`, os campos `total_cost_cents`, `gross_profit_cents` e `margin_percent` devem ser consolidados pela camada de service ao finalizar ou recalcular uma venda.

Margem recomendada:

```txt
margin_percent = gross_profit_cents / total_cents * 100
```

## Estoque

`stock_movements` e a fonte auditavel. `products.current_stock_quantity` e um saldo materializado para telas rapidas.

Entradas usam `direction = 'in'`; saidas usam `direction = 'out'`. As triggers atualizam o saldo automaticamente em insert, update e delete.

## Caixa

`cash_movements` registra entradas e saidas financeiras. O campo `net_amount_cents` e gerado:

- entrada: `amount_cents - fee_cents`
- saida: `-amount_cents - fee_cents`

Isso facilita relatorios de saldo por periodo e por meio de pagamento.

## Performance

- Use filtros por periodo em relatorios financeiros e de estoque.
- Evite recalcular estoque por soma de movimentos em telas comuns; use o saldo materializado.
- Para auditoria, some `stock_movements` por produto e compare com `products.current_stock_quantity`.
- Para importacoes grandes, use transacoes e insira em lotes.
- Rode `ANALYZE` depois de cargas grandes de Excel.
- Mantenha `PRAGMA journal_mode = WAL` e `PRAGMA foreign_keys = ON`, ja configurados na abertura do banco.

