import { RefreshCw } from 'lucide-react';

import { CoolifyPanel } from '@/components/dashboard/coolify-panel';
import { CurrencyPanel } from '@/components/dashboard/currency-panel';
import { DateTimePanel } from '@/components/dashboard/date-time-panel';
import { SystemPanel } from '@/components/dashboard/system-panel';
import { WanikaniPanel } from '@/components/dashboard/wanikani-panel';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboard } from '@/hooks/use-dashboard';
import { formatDateTime } from '@/lib/format';

const LoadingGrid = (): React.JSX.Element => (
  <div className="grid gap-4 lg:grid-cols-4">
    {Array.from({ length: 5 }).map((_, index) => (
      <Skeleton key={index} className="h-64 rounded-lg" />
    ))}
  </div>
);

export default function App(): React.JSX.Element {
  const { data, error, loading, refresh } = useDashboard();

  return (
    <main className="dashboard-grid min-h-screen">
      <div className="fixed right-4 top-4 z-20 flex flex-wrap items-center justify-end gap-2 sm:right-6">
        <div className="rounded-md border bg-card/95 px-3 py-2 font-mono text-xs text-muted-foreground panel-shadow">
          {data ? `Updated ${formatDateTime(data.generatedAt)}` : 'Waiting for data'}
        </div>
        <Button type="button" variant="outline" onClick={() => void refresh()} className="bg-card/95 panel-shadow">
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Refresh
        </Button>
      </div>

      <div className="flex w-full flex-col gap-5 px-4 py-5 pt-20 sm:px-6 lg:px-8">
        {error ? (
          <header>
            <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm">{error}</p>
          </header>
        ) : null}

        {loading && !data ? (
          <LoadingGrid />
        ) : (
          <div className="grid gap-4 lg:grid-cols-4">
            <DateTimePanel fastmail={data?.fastmail ?? null} />
            <CurrencyPanel currency={data?.currency ?? null} />
            <WanikaniPanel wanikani={data?.wanikani ?? null} />
            <SystemPanel system={data?.system ?? null} />
            <CoolifyPanel coolify={data?.coolify ?? null} />
          </div>
        )}
      </div>
    </main>
  );
}
