import { useEffect, useMemo, useState } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const zones = [
  { label: 'UK', timeZone: 'Europe/London' },
  { label: 'JST', timeZone: 'Asia/Tokyo' }
] as const;

const timeFormatter = (timeZone: string): Intl.DateTimeFormat =>
  new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone
  });

const dateFormatter = (timeZone: string): Intl.DateTimeFormat =>
  new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone
  });

export const DateTimePanel = (): React.JSX.Element => {
  const [now, setNow] = useState(() => new Date());
  const formatters = useMemo(
    () =>
      zones.map((zone) => ({
        ...zone,
        time: timeFormatter(zone.timeZone),
        date: dateFormatter(zone.timeZone)
      })),
    []
  );

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <Card className="dashboard-tile">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle>Time</CardTitle>
            <CardDescription>UK and Japan</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {formatters.map((zone) => (
          <div key={zone.label} className="rounded-md border bg-background p-4">
            <p className="font-mono text-xs font-semibold uppercase text-muted-foreground">{zone.label}</p>
            <p className="mt-2 font-mono text-3xl font-bold tabular-nums">{zone.time.format(now)}</p>
            <p className="mt-1 text-sm text-muted-foreground">{zone.date.format(now)}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
