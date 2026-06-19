import { PanelMessage } from '@/components/dashboard/panel-message';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateTime, formatRelative } from '@/lib/format';
import type { CalendarEvent, FastmailSection } from '@/types/dashboard';

type NextEventsPanelProps = {
  fastmail: FastmailSection | null;
};

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

export const NextEventsPanel = ({ fastmail }: NextEventsPanelProps): React.JSX.Element => (
  <Card className="dashboard-tile">
    <CardHeader>
      <div className="flex items-start justify-between gap-4">
        <div>
          <CardTitle>Next Events</CardTitle>
          <CardDescription>Upcoming calendar events</CardDescription>
        </div>
      </div>
    </CardHeader>
    <CardContent className="space-y-3">
      {fastmail?.calendar.events.length ? (
        fastmail.calendar.events.map((event) => <EventRow key={event.id} event={event} />)
      ) : (
        <PanelMessage message={fastmail?.calendar.message ?? 'No upcoming events returned.'} />
      )}
    </CardContent>
  </Card>
);
