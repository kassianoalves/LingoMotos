# Politica de armazenamento de dados

## Local correto dos dados

O LingoMotos armazena dados operacionais fora da pasta instalada do programa.

- Banco SQLite: `AppData/Roaming/LingoMotos/lingomotos.sqlite3`
- Backups: `AppData/Roaming/LingoMotos/backups`

Esses caminhos ficam no perfil do usuario do Windows, nao em `Program Files`, `src`, `src-tauri` ou na pasta do instalador.

## Desinstalacao e reinstalacao

Desinstalar o aplicativo remove os arquivos instalados do programa, mas nao deve apagar o banco SQLite nem os backups locais.

Ao reinstalar o LingoMotos no mesmo Windows e no mesmo usuario, o aplicativo reutiliza o banco existente em `AppData/Roaming/LingoMotos/lingomotos.sqlite3`.

## Backups

Backups manuais e automaticos ficam em `AppData/Roaming/LingoMotos/backups`.

Backups automaticos usam o intervalo configurado pelo usuario em Configuracoes > Backup e usam o padrao:

`auto_nome-da-loja_YYYY-MM-DD_HH-mm_backup.db`

Backups antes de atualizacao usam o padrao:

`pre-update_nome-da-loja_YYYY-MM-DD_HH-mm_backup.db`

## Cuidados

Nao mover o banco para dentro da pasta instalada do programa.

Nao alterar a pasta AppData depois que o cliente ja estiver usando o sistema, porque isso pode fazer o app abrir sem encontrar o banco antigo.
