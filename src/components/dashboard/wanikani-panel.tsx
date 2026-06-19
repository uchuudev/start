import { PanelMessage } from '@/components/dashboard/panel-message';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatRelative } from '@/lib/format';
import type { WanikaniSection } from '@/types/dashboard';

type WanikaniPanelProps = {
  wanikani: WanikaniSection | null;
};

export const WanikaniPanel = ({ wanikani }: WanikaniPanelProps): React.JSX.Element => {
  const maxUpcoming = Math.max(...(wanikani?.upcomingReviews.map((item) => item.count) ?? [0]), 1);

  return (
    <Card className="dashboard-tile">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>WaniKani</CardTitle>
            <CardDescription>Reviews due now and next waves</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border bg-background p-4">
          <p className="font-mono text-xs font-semibold uppercase text-muted-foreground">Reviews</p>
          <p className="mt-2 text-5xl font-extrabold">{wanikani?.reviewsAvailable ?? 0}</p>
        </div>

        {wanikani?.upcomingReviews.length ? (
          <div className="space-y-3">
            {wanikani.upcomingReviews.map((bucket) => (
              <div key={bucket.availableAt}>
                <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                  <span className="font-mono text-muted-foreground">{formatRelative(bucket.availableAt)}</span>
                  <span className="font-mono font-semibold">{bucket.count}</span>
                </div>
                <Progress value={(bucket.count / maxUpcoming) * 100} />
              </div>
            ))}
          </div>
        ) : (
          <PanelMessage message={wanikani?.message} />
        )}
      </CardContent>
    </Card>
  );
};
