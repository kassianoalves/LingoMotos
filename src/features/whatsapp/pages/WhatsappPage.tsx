import { useEffect, useState } from 'react';
import { MessageCircle, ShieldAlert } from 'lucide-react';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Input } from '@shared/components/ui/input';
import { whatsappService } from '../services/whatsapp.service';
import type { WhatsappSettings } from '../repositories/whatsapp.repository';

export function WhatsappPage() {
  const [settings, setSettings] = useState<WhatsappSettings | null>(null);

  useEffect(() => {
    void whatsappService.getSettings().then(setSettings);
  }, []);

  if (!settings) {
    return null;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-semibold">WhatsApp</h2>
        <Badge variant="warning">Beta bloqueado</Badge>
      </div>
      <Card>
        <CardContent className="space-y-3 p-5">
          <div className="flex gap-3">
            <ShieldAlert className="h-5 w-5 text-warning" />
            <div>
              <p className="font-medium">Integração WhatsApp em preparação</p>
              <p className="text-sm text-muted-foreground">
                Recomendado: WhatsApp Business Platform / Cloud API oficial. Nenhum envio real será feito sem configuração oficial.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Configurar integração
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <Input value={settings.apiToken} onChange={(event) => setSettings({ ...settings, apiToken: event.target.value })} placeholder="token da API" />
          <Input value={settings.phoneNumberId} onChange={(event) => setSettings({ ...settings, phoneNumberId: event.target.value })} placeholder="phone_number_id" />
          <Input value={settings.businessAccountId} onChange={(event) => setSettings({ ...settings, businessAccountId: event.target.value })} placeholder="business_account_id" />
          <Input value={settings.webhookUrl} onChange={(event) => setSettings({ ...settings, webhookUrl: event.target.value })} placeholder="webhook_url" />
          <div className="flex items-center justify-between">
            <Badge variant="secondary">Status: {settings.connectionStatus}</Badge>
            <Button onClick={() => void whatsappService.saveSettings(settings).then(setSettings)}>Salvar preparação</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

