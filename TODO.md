# TODO - Correção erro de tipo de coluna (min_stock_quantity)

- [ ] Atualizar o mapeamento/DTO do backend para compatibilidade com o tipo real da coluna no SQLite (min_stock_quantity).
- [ ] Preferir conversão segura no `map_product`: ler como `f64`/`Option<f64>` e converter para `i64`.
- [ ] Opcional (se necessário): ajustar `list_products` para CAST/ROUND/INTEGER no SQL para garantir tipo inteiro.
- [ ] Rebuild do backend (tauri) e testar carregamento do menu Estoque.

