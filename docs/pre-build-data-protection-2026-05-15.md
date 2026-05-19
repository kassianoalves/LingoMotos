# Pre-build data protection - 2026-05-15

## Status

Implementado sem gerar build.

## Backup automatico configuravel

O app chama `ensure_auto_backup` ao iniciar e agenda a proxima verificacao de acordo com o intervalo salvo em `settings.auto_backup_interval_hours`.

Fluxo:

1. Abre o app.
2. Carrega o intervalo configurado, com padrao de 6 horas.
3. Verifica o ultimo backup automatico.
4. Se o intervalo venceu, cria backup em `AppData/Roaming/LingoMotos/backups`.
4. Se falhar, mostra aviso discreto e continua abrindo o sistema.

Padrao do arquivo:

`auto_nome-da-loja_YYYY-MM-DD_HH-mm_backup.db`

## Retencao

`cleanup_old_auto_backups` mantem os ultimos 30 backups automaticos.

A limpeza remove somente arquivos com padrao `auto_*_backup.db`.

Nao remove:

- backups manuais
- backups antes de atualizacao
- backups antes de restore

## Backup antes de atualizar

O fluxo do updater chama o backup antes de baixar e instalar a atualizacao.

Padrao do arquivo:

`pre-update_nome-da-loja_YYYY-MM-DD_HH-mm_backup.db`

## Protecao contra desinstalacao

O banco nao fica na pasta instalada do programa.

- Banco SQLite: `AppData/Roaming/LingoMotos/lingomotos.sqlite3`
- Backups: `AppData/Roaming/LingoMotos/backups`

Desinstalar o app nao deve remover esses arquivos. Reinstalar reutiliza o banco existente no mesmo usuario do Windows.

## Branding

Documentado em `docs/branding-policy.md`.

Configuracao atual:

- `productName`: `LingoMotos`
- `version`: `0.1.5`
- `identifier`: `com.lingomotos.desktop`
- icones existentes em `src-tauri/icons`

Nao alterar `identifier` sem plano de migracao.

## Tela Configuracoes

Adicionada secao `Dados locais` com:

- local do banco
- local dos backups
- botao `Abrir pasta de backups`
- aviso: `Desinstalar o sistema nao remove seus dados locais.`

## Testes

- `npm.cmd run typecheck`: passou.
- `cargo check`: passou.
- `npm run tauri dev`: executado. No sandbox, o binario chegou a iniciar e falhou no setup com `Acesso negado. (os error 5)`. Fora do sandbox, o app ficou ativo ate o timeout, sem erro retornado.
- Backup automatico do dia: confirmado em `C:\Users\kassi\AppData\Roaming\LingoMotos\backups\auto_lingo-motos_2026-05-18_backup.db`.
- Segunda abertura: nao criou duplicado; a pasta manteve um unico `auto_*_backup.db` do dia.
- Backup manual: confirmado separado como `lingo-motos_2026-05-18_22-28-35_backup.db`, nao afetado pela limpeza automatica.
- Local do banco: confirmado em `C:\Users\kassi\AppData\Roaming\LingoMotos\lingomotos.sqlite3`.
- Local dos backups: confirmado em `C:\Users\kassi\AppData\Roaming\LingoMotos\backups`.
- Validacao visual de Configuracoes: pendente de clique manual na janela.
- Botao `Abrir pasta de backups`: implementado; teste visual de clique pendente.

## Pendencias antes da build

1. Rodar validacoes permitidas.
2. Validar manualmente o fluxo no app em `tauri dev`.
3. Substituir endpoint placeholder do updater antes da build publica, se a entrega for usar atualizacao real.
4. Confirmar publisher/assinatura do instalador na etapa de build.
