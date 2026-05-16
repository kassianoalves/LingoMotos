# Arquitetura atual - LingoMotos

Data: 2026-05-15

## Visao geral

O LingoMotos e um aplicativo desktop Tauri com frontend React + TypeScript e persistencia local em SQLite. O fluxo principal e offline-first: operacoes de clientes, estoque, vendas, financeiro, relatorios, configuracoes e backup usam commands Tauri locais, sem dependencia obrigatoria de API externa.

## Persistencia local

- Banco principal: `%APPDATA%/LingoMotos/lingomotos.sqlite3`
- Backups: `%APPDATA%/LingoMotos/backups`
- Inicializacao: `src-tauri/src/database/connection.rs`
- SQLite configurado com `WAL`, `foreign_keys = ON` e migrations executadas na abertura.

## Modulos persistidos

- configuracoes da loja;
- clientes;
- categorias de produto;
- fornecedores;
- produtos;
- campos personalizados de produto;
- movimentacoes de estoque;
- sessoes de caixa;
- vendas e itens de venda;
- movimentos de caixa;
- transacoes financeiras;
- contas a pagar e a receber;
- metas financeiras;
- relatorios derivados dos dados locais;
- historico de backup.

## Fluxo offline-first

1. O frontend chama services locais.
2. Os services usam `serviceClient.execute(...)`.
3. Os commands Tauri acessam repositories Rust.
4. Os repositories gravam e consultam o SQLite local.
5. Exportacoes, backup, restore e reset operam em arquivos locais do computador.

A unica integracao externa identificada no fluxo de negocio atual e a abertura opcional de URL do WhatsApp.

## Backup e reset

- Criacao, listagem, restore e exclusao de backup sao protegidos por senha master no backend.
- Exclusao aceita somente arquivos dentro da pasta de backup.
- Reset de fabrica apaga dados locais e backups antes de recriar uma base limpa no uso seguinte.

## Pendencias conhecidas

- A validacao operacional offline completa ainda depende de roteiro manual executado de ponta a ponta.
- A validacao final deve confirmar persistencia apos fechar e reabrir o app.
- A janela Tauri deve ser iniciada em sessao limpa antes da liberacao final.
- A abertura opcional do WhatsApp depende de recurso externo, mas nao bloqueia o uso offline do sistema.
