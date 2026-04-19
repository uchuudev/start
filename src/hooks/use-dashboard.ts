import { useCallback, useEffect, useState } from 'react';

import type { DashboardPayload } from '@/types/dashboard';

type DashboardState = {
  data: DashboardPayload | null;
  error: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

export const useDashboard = (): DashboardState => {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (): Promise<void> => {
    setLoading(true);

    try {
      const response = await fetch('/api/dashboard', {
        headers: {
          Accept: 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Dashboard request failed with ${response.status}`);
      }

      setData((await response.json()) as DashboardPayload);
      setError(null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Dashboard request failed');
    } finally {
      setLoading(false);
    }
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
    loading,
    refresh
  };
};
