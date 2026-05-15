import { appShortcuts } from '@app/shortcuts/shortcuts';
import { Badge } from '@shared/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';

export function SettingsPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-xl font-semibold">Configurações</h2>
        <p className="text-sm text-muted-foreground">Preferências do sistema e mapa global de atalhos.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Atalhos</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {appShortcuts.map((shortcut) => (
            <div key={shortcut.key} className="flex items-center justify-between rounded-md border border-border p-3">
              <span className="text-sm">{shortcut.label}</span>
              <Badge variant={shortcut.dangerous ? 'warning' : 'secondary'}>{shortcut.key}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

