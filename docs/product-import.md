# Importacao de Produtos

## Fluxo UX

1. Usuario seleciona um arquivo CSV, XLS ou XLSX.
2. Sistema le a primeira planilha ou CSV e detecta cabecalhos.
3. Mapeamento automatico sugere colunas como SKU, nome, custo, venda e estoque.
4. Usuario ajusta o mapeamento quando o fornecedor usa nomes diferentes.
5. Preview mostra criacoes, atualizacoes, ignorados, erros e avisos.
6. Usuario escolhe regra para duplicados:
   - ignorar duplicados;
   - atualizar apenas precos;
   - atualizar cadastro completo.
7. Importacao roda em lote com opcao de parcial ou rollback.
8. Relatorio final mostra criados, atualizados, ignorados, falhas e rollback.

## Arquitetura

```txt
ImportProductsModal
  -> parseImportFile
  -> autoMapColumns
  -> inventoryService.buildImportPreview
  -> inventoryRepository.importProducts
```

`parseImportFile` le CSV com parser proprio e Excel por `xlsx` com import dinamico. Assim a biblioteca de Excel nao pesa no carregamento normal do app.

`buildImportPreview` valida linhas, detecta duplicados no arquivo, detecta duplicados no cadastro e calcula a acao de cada linha.

`importProducts` aplica o lote em uma operacao transacional. Na camada mock atual, o rollback usa snapshot em memoria. No SQLite real, a mesma regra deve ser executada dentro de uma transacao.

## Validacoes

- SKU obrigatorio.
- Nome obrigatorio.
- Duplicado dentro do arquivo gera erro.
- Produto sem custo gera aviso.
- Produto sem preco gera aviso.
- Categoria ou fornecedor desconhecido gera aviso e usa fallback quando possivel.

## SQLite

A migration `0003_product_import_batches.sql` cria:

- `product_import_batches`: auditoria do lote.
- `product_import_rows`: auditoria por linha.

Essas tabelas guardam status, regra usada, totais, relatorio JSON, erros e avisos.

## Performance

- Preview renderiza somente as primeiras 100 linhas.
- O lote completo continua sendo processado.
- Leitura Excel e carregada sob demanda via dynamic import.
- Importacoes grandes devem ser gravadas em transacao SQLite.

