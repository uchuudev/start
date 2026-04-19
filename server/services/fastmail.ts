import ICAL from 'ical.js';
import { XMLParser } from 'fast-xml-parser';

import type { CalendarEvent, FastmailSection } from '../../src/types/dashboard';

import { cached, ensureOk, errorMeta, getEnv, getEnvNumber, missingConfig, readyMeta, withTimeout } from './shared';

const getCalendarUrls = (): string[] => {
  const urls = getEnv('FASTMAIL_CALDAV_URLS') ?? getEnv('FASTMAIL_CALDAV_URL');
  if (!urls) {
    return [];
  }

  return urls
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean);
};

const calendarReportBody = (start: Date, end: Date): string => {
  const format = (date: Date): string => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');

  return `<?xml version="1.0" encoding="utf-8" ?>
<c:calendar-query xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:prop>
    <d:getetag />
    <c:calendar-data />
  </d:prop>
  <c:filter>
    <c:comp-filter name="VCALENDAR">
      <c:comp-filter name="VEVENT">
        <c:time-range start="${format(start)}" end="${format(end)}" />
      </c:comp-filter>
    </c:comp-filter>
  </c:filter>
</c:calendar-query>`;
};

const findValuesByLocalName = (value: unknown, localName: string, results: string[] = []): string[] => {
  if (typeof value !== 'object' || value === null) {
    return results;
  }

  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (key.split(':').pop() === localName && typeof child === 'string') {
      results.push(child);
      continue;
    }

    if (Array.isArray(child)) {
      child.forEach((item) => findValuesByLocalName(item, localName, results));
    } else {
      findValuesByLocalName(child, localName, results);
    }
  }

  return results;
};

const getEventEnd = (event: ICAL.Event, start: Date): string | undefined => {
  const duration = event.duration?.toSeconds() ?? 0;
  if (duration > 0) {
    return new Date(start.getTime() + duration * 1000).toISOString();
  }

  const end = event.endDate?.toJSDate();
  return end ? end.toISOString() : undefined;
};

const eventsFromIcs = (ics: string, rangeStart: Date, rangeEnd: Date): CalendarEvent[] => {
  const component = new ICAL.Component(ICAL.parse(ics));
  const events = component.getAllSubcomponents('vevent');
  const output: CalendarEvent[] = [];

  for (const vevent of events) {
    const event = new ICAL.Event(vevent);
    const title = event.summary?.trim() || '(untitled)';
    const location = event.location?.trim() || undefined;
    const isAllDay = event.startDate?.isDate === true;

    if (event.isRecurring()) {
      const iterator = event.iterator();
      let next = iterator.next();
      let count = 0;

      while (next && count < 200) {
        const startsAt = next.toJSDate();
        if (startsAt > rangeEnd) {
          break;
        }

        if (startsAt >= rangeStart) {
          output.push({
            id: `${event.uid}-${startsAt.toISOString()}`,
            title,
            startsAt: startsAt.toISOString(),
            endsAt: getEventEnd(event, startsAt),
            location,
            allDay: isAllDay
          });
        }

        next = iterator.next();
        count += 1;
      }

      continue;
    }

    const startsAt = event.startDate?.toJSDate();
    const endsAt = event.endDate?.toJSDate();
    if (!startsAt || startsAt > rangeEnd || (endsAt && endsAt < rangeStart)) {
      continue;
    }

    output.push({
      id: event.uid || `${title}-${startsAt.toISOString()}`,
      title,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt?.toISOString(),
      location,
      allDay: isAllDay
    });
  }

  return output;
};

const fetchCalendarUrl = async (
  url: string,
  username: string,
  password: string,
  start: Date,
  end: Date
): Promise<CalendarEvent[]> => {
  const response = await withTimeout((signal) =>
    fetch(url, {
      method: 'REPORT',
      signal,
      headers: {
        Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
        Depth: '1',
        'Content-Type': 'application/xml; charset=utf-8',
        Accept: 'application/xml,text/xml'
      },
      body: calendarReportBody(start, end)
    }),
    12_000
  );
  await ensureOk(response, 'Fastmail CalDAV request');

  const xml = await response.text();
  const parser = new XMLParser({
    ignoreAttributes: false,
    textNodeName: '#text'
  });
  const parsed = parser.parse(xml) as unknown;

  return findValuesByLocalName(parsed, 'calendar-data').flatMap((ics) => {
    try {
      return eventsFromIcs(ics, start, end);
    } catch {
      return [];
    }
  });
};

const loadCalendar = async (): Promise<FastmailSection['calendar']> => {
  const username = getEnv('FASTMAIL_CALDAV_USERNAME') ?? getEnv('FASTMAIL_EMAIL');
  const password = getEnv('FASTMAIL_CALDAV_PASSWORD');
  const urls = getCalendarUrls();

  if (!username || !password || urls.length === 0) {
    return {
      ...missingConfig('Set FASTMAIL_CALDAV_USERNAME, FASTMAIL_CALDAV_PASSWORD, and FASTMAIL_CALDAV_URL.'),
      events: []
    };
  }

  const now = new Date();
  const days = getEnvNumber('FASTMAIL_CALENDAR_LOOKAHEAD_DAYS', 31);
  const limit = getEnvNumber('FASTMAIL_CALENDAR_LIMIT', 6);
  const end = new Date(now.getTime() + days * 86_400_000);

  const events = (
    await Promise.all(urls.map((url) => fetchCalendarUrl(url, username, password, now, end)))
  )
    .flat()
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
    .slice(0, limit);

  return {
    ...readyMeta(),
    events
  };
};

export const getFastmail = async (): Promise<FastmailSection> => {
  const calendar = await cached('fastmail-calendar', 90_000, loadCalendar).catch((error) => ({
      ...errorMeta(error, 'Fastmail calendar is unavailable.'),
      events: []
    }));

  return {
    calendar
  };
};
