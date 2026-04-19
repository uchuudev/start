import { CalendarDays, Clock3 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { PanelMessage } from '@/components/dashboard/panel-message';
import { StatusPill } from '@/components/dashboard/status-pill';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateTime, formatRelative } from '@/lib/format';
import type { CalendarEvent, FastmailSection } from '@/types/dashboard';

type DateTimePanelProps = {
  fastmail: FastmailSection | null;
};

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

const EventRow = ({ event }: { event: CalendarEvent }): React.JSX.Element => (
  <div className="rounded-md border bg-background p-3">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-bold">{event.title}</p>
        <p className="truncate text-xs text-muted-foreground">{event.location ?? 'No location'}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <Badge variant="ok">{formatRelative(event.startsAt)}</Badge>
        {event.allDay ? <Badge variant="secondary">all day</Badge> : null}
      </div>
    </div>
    <p className="mt-2 font-mono text-xs font-semibold text-primary">{formatDateTime(event.startsAt)}</p>
  </div>
);

export const DateTimePanel = ({ fastmail }: DateTimePanelProps): React.JSX.Element => {
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
    <Card className="border-foreground/15 bg-card/95 lg:col-span-3">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle>Time</CardTitle>
            <CardDescription>UK, Japan, and the next calendar events</CardDescription>
          </div>
          <Clock3 className="h-5 w-5 text-primary" aria-hidden="true" />
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="grid gap-3 sm:grid-cols-2">
          {formatters.map((zone) => (
            <div key={zone.label} className="rounded-md border bg-background p-4">
              <p className="font-mono text-xs font-semibold uppercase text-muted-foreground">{zone.label}</p>
              <p className="mt-2 font-mono text-3xl font-bold tabular-nums">{zone.time.format(now)}</p>
              <p className="mt-1 text-sm text-muted-foreground">{zone.date.format(now)}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-extrabold uppercase">
              <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
              Next Events
            </div>
            {fastmail ? <StatusPill status={fastmail.calendar.status} /> : null}
          </div>
          {fastmail?.calendar.events.length ? (
            fastmail.calendar.events.map((event) => <EventRow key={event.id} event={event} />)
          ) : (
            <PanelMessage message={fastmail?.calendar.message ?? 'No upcoming events returned.'} />
          )}
        </div>
      </CardContent>
    </Card>
  );
};
