import { cn } from '@/lib/utils';
import { TimePeriod } from '@/types';

interface TimePeriodSelectorProps {
  selectedPeriod: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
}

const timePeriods: { value: TimePeriod; label: string }[] = [
  { value: '1h', label: '1H' },
  { value: '24h', label: '24H' },
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
];

export function TimePeriodSelector({
  selectedPeriod,
  onPeriodChange,
}: TimePeriodSelectorProps) {
  return (
    <div className="flex space-x-2">
      {timePeriods.map((period) => (
        <div
          key={period.value}
          onClick={() => onPeriodChange(period.value)}
          className={cn(
            'flex-1 cursor-pointer text-xs transition-all duration-300',
            selectedPeriod === period.value
              ? 'text-primary'
              : 'text-muted-foreground/70'
          )}
        >
          {period.label}
        </div>
      ))}
    </div>
  );
}
