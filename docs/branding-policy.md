# Politica de branding

## A) Branding visual dentro do app

O usuario pode alterar em Configuracoes:

- nome da loja
- logo da loja
- tema
- telefone
- WhatsApp

Esses dados sao gravados no banco local e afetam a experiencia visual e operacional dentro do sistema.

## B) Branding do instalador e do app

Deve ser definido antes da build:

- `productName`
- icone do executavel
- nome do instalador
- publisher
- `identifier`

Esses campos fazem parte do pacote instalado e do comportamento do Windows.

## Regras

Nao alterar `identifier` sem planejamento. O Windows pode entender como outro aplicativo, afetando atualizacao, atalhos e instalacao.

Nao alterar a pasta AppData depois que cliente ja usa o sistema. Isso pode fazer uma reinstalacao parecer vazia porque o app passaria a procurar dados em outro local.

Trocar `productName` e icone antes da build e seguro quando a entrega exige identidade visual diferente.

Trocar `identifier` exige plano de migracao e validacao de atualizacao/desinstalacao.

## Configuracao atual verificada

- `productName`: `LingoMotos`
- `version`: `0.1.5`
- `identifier`: `com.lingomotos.desktop`
- icones: `src-tauri/icons`
