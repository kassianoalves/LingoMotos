import { Lock, Wrench } from 'lucide-react';
import { Badge } from '@shared/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';

const lockedCards = ['Ordens de serviço', 'Veículos', 'Mecânicos', 'Serviços', 'Histórico de manutenção'];

export function WorkshopPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Módulo Oficina em breve</h2>
          <Badge variant="warning">Em breve</Badge>
        </div>
        <p className="text-sm text-muted-foreground">Este módulo está bloqueado e ainda não possui funcionalidades internas.</p>
      </div>
      <div className="grid gap-4 xl:grid-cols-5">
        {lockedCards.map((item) => (
          <Card key={item}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Wrench className="h-4 w-4 text-muted-foreground" />
                {item}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="h-4 w-4" />
              Bloqueado
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

