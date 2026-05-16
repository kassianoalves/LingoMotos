# Checklist de validacao pre-build 02 - LingoMotos

Data: 2026-05-15

## Veredito

**STATUS: nao pronto para build final ainda.**

O codigo passou nas validacoes automatizadas desta rodada e a arquitetura atual ja esta amplamente conectada ao SQLite local. Porem, a segunda checklist completa solicitada nao pode ser considerada concluida porque varios itens exigem validacao manual real dentro da janela Tauri, com internet desligada, fechamento/reabertura do app e uso de arquivos exportados. Nesta rodada, `npm.cmd run tauri -- dev` nao abriu uma nova sessao limpa porque a porta `1420` ja estava ocupada por outra instancia do servidor dev.

## Evidencias executadas nesta rodada

| Area | Resultado | Evidencia |
| --- | --- | --- |
| TypeScript | OK | `npm.cmd run typecheck` passou |
| Rust | OK | `cargo check` passou |
| Tauri dev | Parcial | `npm.cmd run tauri -- dev` iniciou o binario Rust, mas falhou ao iniciar novo Vite por `Port 1420 is already in use` |
| SQLite | OK estrutural | banco encontrado em `%APPDATA%\\LingoMotos\\lingomotos.sqlite3` |
| Integridade SQLite | OK | `PRAGMA integrity_check = ok` |
| Backups | Parcial | pasta `%APPDATA%\\LingoMotos\\backups` existe; nao havia arquivos no momento da verificacao |
| Persistencia de dominio | OK estrutural | commands Rust registrados para clientes, produtos, estoque, caixa, vendas, financeiro, relatorios e backup |
| Dependencia online obrigatoria | Nenhuma encontrada nos modulos principais | busca em `src/` encontrou apenas URL externa de WhatsApp (`wa.me`) |

## 1. Compilacao

### Validado

- `npm.cmd run typecheck`: passou.
- `cargo check`: passou.
- imports quebrados e componentes `undefined`: nenhum erro detectado pelos compiladores.

### Nao validado integralmente

- Console runtime sem erro vermelho: nao confirmado nesta rodada.
- `npm run tauri dev` em sessao limpa: nao confirmado por conflito da porta `1420`.

### Observacao

- `package.json`, `Cargo.toml` e `tauri.conf.json` estao alinhados em `0.1.5`.

## 2. Offline-first

### Evidencia favoravel

- Modulos principais chamam `serviceClient.execute(...)` para commands locais.
- Nao foram encontrados `fetch`, `axios` ou URLs externas obrigatorias no codigo dos modulos principais.
- A unica URL externa encontrada foi `https://wa.me/...`, usada somente no atalho de WhatsApp.

### Nao validado manualmente nesta rodada

- desligar internet e operar cliente, fornecedor, categoria, produto, caixa, venda, estoque, financeiro, relatorio, backup e restore;
- ausencia de assets quebrados offline;
- uso completo do app sem rede.

### Status

**Parcialmente evidenciado por codigo, ainda nao comprovado por teste operacional offline.**

## 3. SQLite e persistencia

### Validado

- Banco atual em `%APPDATA%\\LingoMotos\\lingomotos.sqlite3`.
- Backups configurados em `%APPDATA%\\LingoMotos\\backups`.
- Banco com `journal_mode = WAL`, `foreign_keys = ON` e migrations ativas.
- `PRAGMA integrity_check` retornou `ok`.
- Contagens atuais observadas no banco:
  - `customers = 0`
  - `products = 1`
  - `sales = 0`
  - `cash_sessions = 1`
  - `financial_transactions = 0`
  - `backup_history = 0`
  - `product_custom_fields = 0`

### Evidencia de persistencia real por codigo

- `customers.service.ts`, `finance.repository.ts`, `cash-session.store.ts` e `store-settings.store.ts` usam commands Tauri locais.
- O fluxo atual ja nao corresponde ao documento antigo `docs/persistence-audit-2026-05-15.md`, que ficou desatualizado.

### Nao validado manualmente nesta rodada

- fechar/reabrir o app e confirmar clientes, vendas, caixa, financeiro e estoque preservados.

## 4. Vendas

### Evidencia favoravel por codigo

- venda exige caixa aberto;
- checkout cria venda, baixa estoque, gera movimentos de caixa e lancamentos financeiros dentro do backend Rust;
- o fluxo possui validacoes contra estoque insuficiente e duplicidade estrutural;
- o resumo da venda foi corrigido para layout vertical.

### Nao validado manualmente nesta rodada

- fluxo completo com desconto percentual, pagamento, troco, cancelamento, foco retornando para busca, reducao de estoque e reflexo em financeiro/relatorios;
- ausencia de `FOREIGN KEY constraint failed`;
- ausencia de venda fantasma.

## 5. Clientes

### Evidencia favoravel por codigo

- clientes usam commands Rust reais;
- criacao e exclusao sao bloqueadas com caixa fechado;
- consulta/listagem permanecem disponiveis com caixa fechado;
- venda pode carregar cliente selecionado;
- acao WhatsApp usa opener externo Tauri.

### Nao validado manualmente nesta rodada

- criar, editar, excluir, abrir WhatsApp, historico e venda vinculada ao cliente.

## 6. Estoque

### Evidencia favoravel por codigo

- CRUD, movimentacao, busca, baixo estoque e sem estoque usam repository/backend reais;
- busca considera nome, SKU/codigo interno, codigo de barras, marca e aplicacao;
- SKU automatico foi implementado com command local e validacao de unicidade;
- importacao suporta CSV/XLS/XLSX, mapeamento, ignorar colunas, campos personalizados e SKU automatico;
- tabela `product_custom_fields` existe.

### Nao validado manualmente nesta rodada

- criar/editar/excluir produto;
- SKU automatico/manual;
- movimentacao e alertas;
- importacao real de CSV/Excel com preview e campos personalizados.

## 7. Financeiro

### Evidencia favoravel por codigo

- receitas, despesas, contas a pagar, contas a receber, metas e filtros usam commands/repositories locais;
- fluxo de venda alimenta caixa e resumo financeiro.

### Nao validado manualmente nesta rodada

- cores de entradas/saidas;
- graficos e totais corretos;
- ausencia de poluicao visual e scroll geral desnecessario;
- fluidez real com dados.

## 8. Relatorios e exportacoes

### Validado por codigo

- CSV usa `;`, BOM UTF-8, escape correto e cabecalhos em portugues;
- CSV vazio recebe cabecalho;
- JSON exporta via dialog de salvamento;
- commands `export_report_csv` e `export_report_json` estao registrados;
- capability `dialog:allow-save` esta configurada.

### Nao validado manualmente nesta rodada

- escolher local para salvar;
- abrir CSV no Excel/LibreOffice;
- abrir JSON;
- confirmar visualmente acentuacao e datas nos arquivos exportados.

## 9. Backup

### Validado por codigo

- commands de criar, restaurar, excluir backup e reset de fabrica estao registrados;
- senha master e validada no backend;
- exclusao restringe caminho a `.db` dentro da pasta de backups;
- reset de fabrica remove backups junto com dados.

### Nao validado manualmente nesta rodada

- criar backup;
- restaurar backup;
- excluir backup;
- confirmar remocao fisica;
- confirmar atualizacao da lista;
- resetar e comprovar exclusao dos backups.

## 10. UI/UX

### Evidencia favoravel por codigo recente

- sidebar expandida/recolhida ajustada;
- header usa acoes por rota;
- rodape exclusivo de Configuracoes existe;
- painel `Resumo da venda` foi corrigido para coluna unica vertical;
- tema claro/escuro permanece suportado.

### Nao validado manualmente nesta rodada

- notebook, full HD e largura menor;
- overflow horizontal;
- scroll interno;
- ausencia de cabecalhos duplicados;
- comportamento visual completo em dark/light mode.

## 11. Performance

### Evidencia favoravel por codigo

- busca do PDV usa debounce;
- lista de produtos usa virtualizacao;
- React Query e invalidacoes locais evitam excesso obvio de refetch;
- operacoes criticas sao locais, sem rede.

### Nao validado manualmente nesta rodada

- velocidade real ao abrir/fechar caixa;
- digitar sem travas;
- ausencia de loading infinito;
- ausencia de freeze em vendas e financeiro.

## 12. Build readiness

### Confirmado

- `tauri.conf.json`, `Cargo.toml` e `package.json` estao alinhados em `0.1.5`;
- icones existem;
- capabilities minimas presentes;
- commands principais registrados no `invoke_handler`;
- `.gitignore` cobre `src-tauri/target/` e `src-tauri/target-check*`;
- nao foram encontrados mocks/seeds ativos em `src/`;
- nao foi encontrado `localStorage` critico de dominio; apenas tema visual usa persistencia local.

### Riscos encontrados

1. Existem diretorios fisicos `src-tauri/target-check*` no workspace, apesar de ignorados pelo Git.
2. A arvore esta muito suja, com grande volume de alteracoes nao consolidadas.
3. O documento `docs/persistence-audit-2026-05-15.md` esta obsoleto e contradiz o codigo atual.
4. `tauri dev` nao foi validado em sessao limpa nesta rodada por conflito na porta `1420`.
5. A checklist manual solicitada ainda nao foi executada de ponta a ponta.

## Bugs encontrados nesta rodada

1. `npm.cmd run tauri -- dev` falhou ao abrir nova sessao por `Port 1420 is already in use`.
2. O repositorio ainda contem artefatos locais `target-check*`.
3. Documentacao antiga de persistencia esta desatualizada em relacao ao codigo atual.

## Bugs corrigidos antes desta rodada e confirmados no codigo atual

- exportacao CSV/JSON;
- abertura externa do WhatsApp;
- bloqueio de criacao/exclusao de clientes com caixa fechado;
- delete de backup e reset de fabrica;
- importacao com mapeamento e campos personalizados;
- geracao automatica de SKU/codigo interno;
- resumo de venda em coluna unica.

## Pendencias antes de autorizar build final

1. Encerrar a instancia existente que ocupa a porta `1420` e rodar uma sessao limpa de `tauri dev`.
2. Executar manualmente toda a checklist funcional desta solicitacao, inclusive com internet desligada.
3. Fechar e reabrir o app apos criar dados para provar persistencia real.
4. Gerar e abrir CSV/JSON exportados em aplicativos externos.
5. Criar, restaurar, excluir backup e executar reset de fabrica com verificacao fisica dos arquivos.
6. Revisar ou atualizar documentos obsoletos antes de entrega.
7. Limpar artefatos locais `target-check*` antes de publicar o projeto.

## Melhorias futuras recomendadas

- criar roteiro automatizado de smoke tests operacionais para commands criticos;
- adicionar testes de integridade para importacao, backup/reset e venda atomica;
- revisar consultas de relatorios que ainda agregam parte dos dados em memoria;
- documentar processo oficial de release e validacao offline.

## Conclusao para entrega ao cliente

**Ainda nao e seguro entregar ao cliente como release final.**

O codigo esta mais maduro do que na primeira auditoria e os fundamentos locais estao bem melhores, mas o requisito desta rodada era confirmar prontidao real para build final. Sem a validacao manual completa, sem uma sessao limpa de `tauri dev` e com riscos operacionais ainda abertos, a conclusao tecnicamente correta e manter o projeto como **nao pronto para build** ate concluir os testes manuais listados acima.
