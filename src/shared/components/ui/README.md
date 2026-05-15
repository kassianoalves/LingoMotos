# shadcn/ui

Componentes shadcn/ui devem ser gerados nesta pasta.

Regras visuais:

- use apenas tokens semanticos (`background`, `foreground`, `card`, `primary`, `muted`, `success`, `warning`, `destructive`, `border`, `ring`);
- nao use cores Tailwind literais como `slate`, `blue`, `emerald`, `white` ou valores hex em componentes;
- variantes devem ser criadas com `class-variance-authority`;
- combine classes com `cn` de `@shared/lib/utils`.

