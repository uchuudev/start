import { useCallback, useEffect, useRef, useState } from 'react';

import type {
  CoolifySection,
  CurrencySection,
  DashboardPayload,
  FastmailSection,
  SystemSection,
  WanikaniSection
} from '@/types/dashboard';

type DashboardData = Partial<Omit<DashboardPayload, 'generatedAt'>> & {
  generatedAt: string | null;
};

type SectionKey = 'currency' | 'system' | 'coolify' | 'fastmail' | 'wanikani';

type SectionPayloads = {
  currency: CurrencySection;
  system: SystemSection;
  coolify: CoolifySection;
  fastmail: FastmailSection;
  wanikani: WanikaniSection;
};

type DashboardState = {
  data: DashboardData;
  error: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const sections = ['currency', 'system', 'coolify', 'fastmail', 'wanikani'] as const satisfies readonly SectionKey[];

const userTimeZone = (): string | undefined => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
};

const fetchSection = async <T extends SectionKey>(section: T): Promise<SectionPayloads[T]> => {
  const timeZone = userTimeZone();
  const response = await fetch(`/api/dashboard/${section}`, {
    headers: {
      Accept: 'application/json',
      ...(timeZone ? { 'X-Time-Zone': timeZone } : {})
    }
  });

  if (!response.ok) {
    throw new Error(`${section} request failed with ${response.status}`);
  }

  return (await response.json()) as SectionPayloads[T];
};

export const useDashboard = (): DashboardState => {
  const [data, setData] = useState<DashboardData>({ generatedAt: null });
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(0);
  const refreshId = useRef(0);

  const refresh = useCallback(async (): Promise<void> => {
    const currentRefresh = refreshId.current + 1;
    refreshId.current = currentRefresh;
    setPending(sections.length);
    setError(null);

    await Promise.all(
      sections.map(async (section) => {
        try {
          const payload = await fetchSection(section);
          if (refreshId.current !== currentRefresh) {
            return;
          }

          setData((current) => ({
            ...current,
            generatedAt: new Date().toISOString(),
            [section]: payload
          }));
        } catch (nextError) {
          if (refreshId.current !== currentRefresh) {
            return;
          }

          setError((current) => {
            const message = nextError instanceof Error ? nextError.message : `${section} request failed`;
            return current ? `${current}; ${message}` : message;
          });
        } finally {
          if (refreshId.current === currentRefresh) {
            setPending((current) => Math.max(0, current - 1));
          }
        }
      })
    );
  }, []);

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => {
      void refresh();
    }, 60_000);

    return () => window.clearInterval(interval);
  }, [refresh]);

  return {
    data,
    error,
    loading: pending > 0,
    refresh
  };
};
