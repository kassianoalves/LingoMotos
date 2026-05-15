import { AlertTriangle } from 'lucide-react';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent } from '@shared/components/ui/card';
import type { InventoryAlert, InventoryFilters } from '../types/inventory.types';

type InventoryAlertsProps = {
  alerts: InventoryAlert[];
  onApplyFilter: (filter: InventoryFilters['stockStatus']) => void;
};

export function InventoryAlerts({ alerts, onApplyFilter }: InventoryAlertsProps) {
  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-3 xl:grid-cols-3">
      {alerts.map((alert) => (
        <Card key={alert.id} className="shadow-sm">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertTriangle className="mt-1 h-4 w-4 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <Badge variant={alert.severity}>{alert.title}</Badge>
              <p className="mt-2 text-sm text-muted-foreground">{alert.detail}</p>
              <Button variant="ghost" size="sm" className="mt-2 px-0" onClick={() => onApplyFilter(alert.filter)}>
                {alert.actionLabel}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

