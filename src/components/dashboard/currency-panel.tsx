import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CurrencySection } from '@/types/dashboard';

type CurrencyPanelProps = {
  currency: CurrencySection | null;
};

const preferredRateOrder = ['JPY', 'USD', 'EUR'];

const getRateDate = (message: string | undefined): string | null => {
  if (!message?.startsWith('Rates for ')) {
    return null;
  }

  return message.replace('Rates for ', '');
};

const orderedRates = (currency: CurrencySection | null): CurrencySection['rates'] =>
  [...(currency?.rates ?? [])].sort((left, right) => {
    const leftIndex = preferredRateOrder.indexOf(left.currency);
    const rightIndex = preferredRateOrder.indexOf(right.currency);

    return (leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex) - (rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex);
  });

export const CurrencyPanel = ({ currency }: CurrencyPanelProps): React.JSX.Element => {
  const rates = orderedRates(currency);

  return (
    <Card className="dashboard-tile">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <CardTitle>Currency</CardTitle>
            {getRateDate(currency?.message) ? (
              <span className="font-mono text-xs font-semibold text-muted-foreground">{getRateDate(currency?.message)}</span>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border bg-background p-4">
          <p className="font-mono text-xs font-semibold uppercase text-muted-foreground">Base</p>
          <p className="mt-1 text-3xl font-extrabold">{currency?.base.amount ?? '£1.00'}</p>
        </div>

        <div className="grid gap-2">
          {rates.map((rate) => (
            <div key={rate.currency} className="flex items-center justify-between rounded-md border bg-muted/35 px-3 py-2">
              <span className="font-mono text-sm font-semibold">{rate.currency}</span>
              <span className="text-lg font-bold">{rate.amount}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
