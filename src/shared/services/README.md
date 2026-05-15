# Shared Services

Use esta pasta apenas para services transversais.

Services de features devem ficar dentro da propria feature:

```txt
features/clientes/services/clientes.service.ts
features/ordens-de-servico/services/ordens-de-servico.service.ts
```

Padrao:

```ts
import { serviceClient } from '@shared/api/service-client';

export const exemploService = {
  listar() {
    return serviceClient.execute('comando_tauri');
  },
};
```

