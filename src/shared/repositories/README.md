# Frontend Repositories

Evite repositories no frontend para dados persistidos em SQLite.

O repository real fica no backend Tauri em `src-tauri/src/repositories`, porque e essa camada que acessa o banco local. No frontend, prefira `services` que chamam commands Tauri por meio de `serviceClient`.

Use esta pasta somente se surgir um repositorio puramente de cliente, como armazenamento local de preferencias nao criticas.

