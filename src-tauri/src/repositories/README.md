# Repositories

Repositories sao a unica camada que escreve SQL de negocio.

Responsabilidades:

- encapsular consultas SQLite;
- mapear linhas para structs;
- manter SQL perto do agregado ao qual pertence.

Nao exponha `rusqlite::Row` ou detalhes de SQL para services.

