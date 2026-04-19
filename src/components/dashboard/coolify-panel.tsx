import { ExternalLink, ServerCog } from 'lucide-react';

import { PanelMessage } from '@/components/dashboard/panel-message';
import { StatusPill } from '@/components/dashboard/status-pill';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { CoolifyApp, CoolifySection } from '@/types/dashboard';

type CoolifyPanelProps = {
  coolify: CoolifySection | null;
};

const statusVariant = (status: string): 'ok' | 'warn' | 'destructive' | 'outline' => {
  const lower = status.toLowerCase();
  if (lower.includes('running') || lower.includes('healthy')) {
    return 'ok';
  }
  if (lower.includes('exited') || lower.includes('failed') || lower.includes('error')) {
    return 'destructive';
  }
  if (lower.includes('starting') || lower.includes('deploy')) {
    return 'warn';
  }
  return 'outline';
};

const AppRow = ({ app }: { app: CoolifyApp }): React.JSX.Element => {
  const content = (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-background">
        {app.faviconUrl ? <img className="h-5 w-5" src={app.faviconUrl} alt="" loading="lazy" /> : <ServerCog className="h-4 w-4" />}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold">{app.name}</p>
        <p className="truncate text-xs text-muted-foreground">{app.branch ?? app.project ?? app.url ?? 'No public URL'}</p>
      </div>
    </div>
  );

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border bg-background p-3">
      {app.url ? (
        <a href={app.url} className="min-w-0 flex-1 hover:underline" target="_blank" rel="noreferrer">
          {content}
        </a>
      ) : (
        <div className="min-w-0 flex-1">{content}</div>
      )}
      <div className="flex shrink-0 items-center gap-2">
        <Badge variant={statusVariant(app.status)}>{app.status}</Badge>
        {app.url ? <ExternalLink className="h-4 w-4 text-muted-foreground" aria-hidden="true" /> : null}
      </div>
    </div>
  );
};

export const CoolifyPanel = ({ coolify }: CoolifyPanelProps): React.JSX.Element => (
  <Card className="lg:col-span-2">
    <CardHeader>
      <div className="flex items-start justify-between gap-4">
        <div>
          <CardTitle>Coolify</CardTitle>
          <CardDescription>Applications and deployment state</CardDescription>
        </div>
        {coolify ? <StatusPill status={coolify.status} /> : null}
      </div>
    </CardHeader>
    <CardContent className="space-y-3">
      {coolify?.apps.length ? coolify.apps.map((app) => <AppRow key={app.id} app={app} />) : null}
      {!coolify?.apps.length ? <PanelMessage message={coolify?.message ?? 'No Coolify applications returned yet.'} /> : null}
    </CardContent>
  </Card>
);
