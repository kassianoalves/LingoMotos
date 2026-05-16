import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import type { FinanceFilters, FinancePeriod } from '../types/finance.types';

type FinancePeriodFilterProps = {
  filters: FinanceFilters;
  onPeriodChange: (period: FinancePeriod) => void;
  onCustomPeriodChange: (startDate: string, endDate: string) => void;
};

const periods: Array<{ label: string; value: FinancePeriod }> = [
  { label: 'Diario', value: 'today' },
  { label: 'Semanal', value: 'week' },
  { label: 'Mensal', value: 'month' },
];

export function FinancePeriodFilter({ filters, onPeriodChange, onCustomPeriodChange }: FinancePeriodFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {periods.map((period) => (
        <Button
          key={period.value}
          variant={filters.period === period.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => onPeriodChange(period.value)}
        >
          {period.label}
        </Button>
      ))}
      <div className="flex items-center gap-2 rounded-md bg-muted/40 p-1">
        <Input
          type="date"
          className="h-8 w-36 border-0 bg-transparent"
          value={filters.startDate}
          onChange={(event) => onCustomPeriodChange(event.target.value, filters.endDate)}
        />
        <span className="text-xs text-muted-foreground">ate</span>
        <Input
          type="date"
          className="h-8 w-36 border-0 bg-transparent"
          value={filters.endDate}
          onChange={(event) => onCustomPeriodChange(filters.startDate, event.target.value)}
        />
      </div>
    </div>
  );
}
