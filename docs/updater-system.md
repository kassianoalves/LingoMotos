# Sistema de atualizacao

## Visao geral

O LingoMotos continua offline-first. Internet e usada somente para verificar, baixar e instalar atualizacoes assinadas.

O banco permanece fora da instalacao, em:

`AppData/Roaming/LingoMotos/data/lingomotos.sqlite3`

Os backups permanecem em:

`AppData/Roaming/LingoMotos/backups`

Antes de instalar qualquer atualizacao, o app cria:

`auto-update-backup_DATA.db`

Se esse backup falhar, a atualizacao e cancelada.

## Como publicar uma nova versao

1. Atualize a versao em:
   - `package.json`
   - `src-tauri/Cargo.toml`
   - `src-tauri/tauri.conf.json`
2. Exporte as variaveis no PowerShell:

```powershell
$env:TAURI_SIGNING_PRIVATE_KEY_PATH="P:\caminho\seguro\private.key"
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD=""
```

3. Gere o build somente quando a release for realmente ser publicada:

```powershell
npm run tauri build
```

4. Publique no GitHub Release:
   - instalador Windows `.msi`
   - `latest.json`
   - assinatura `.sig`
5. O endpoint configurado no app le:

`https://github.com/YOUR_GITHUB_USERNAME/lingomotos/releases/latest/download/latest.json`

Substitua `YOUR_GITHUB_USERNAME` antes da primeira release real.

## Arquivos esperados na release

Para o updater estatico em GitHub Releases, o `latest.json` precisa conter a versao, notas, data de publicacao, URL do instalador e assinatura do artefato. A assinatura deve ser o conteudo do arquivo `.sig`, nao um caminho.

## Como o cliente recebe a atualizacao

1. O usuario clica no icone de atualizar na sidebar.
2. O app verifica o `latest.json`.
3. Se nao houver internet, mostra `Sistema funcionando offline.` e segue operando normalmente.
4. Se houver nova versao, mostra o modal com versao atual, nova versao e notas da release.
5. Ao confirmar:
   - cria `auto-update-backup_DATA.db`
   - baixa o pacote
   - valida a assinatura com a chave publica configurada
   - instala o update
6. Ao final, o app informa `Reinicie o sistema.`

## Assinatura

- `private.key` assina os artefatos e nunca deve ser enviado ao GitHub.
- `public.key` fica no projeto e seu conteudo e copiado para `tauri.conf.json`.
- O updater Tauri exige assinatura valida para instalar; essa verificacao nao pode ser desativada.

## Recuperacao se algo falhar

1. Abra `Configuracoes`.
2. Localize o backup automatico em `AppData/Roaming/LingoMotos/backups`.
3. Use o fluxo de restauracao de backup ja existente no sistema.
4. Se a instalacao falhar antes de concluir, o banco ativo nao e removido e o app segue usando a persistencia local existente.

## Checklist operacional antes da primeira release

1. Trocar `YOUR_GITHUB_USERNAME` pelo repositorio real.
2. Guardar `private.key` fora do repositorio e em local seguro.
3. Confirmar que `public.key` corresponde ao `private.key` usado na assinatura.
4. Confirmar que `latest.json` aponta para os artefatos corretos da release.
5. Validar:
   - verificacao sem internet
   - verificacao com internet
   - modal com notas
   - criacao do backup automatico
   - instalacao assinada
