import { Cpu, HardDrive, MemoryStick, Thermometer } from 'lucide-react';

import { StatusPill } from '@/components/dashboard/status-pill';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatBytes, formatDuration, formatNumber } from '@/lib/format';
import type { SystemSection } from '@/types/dashboard';

type SystemPanelProps = {
  system: SystemSection | null;
};

export const SystemPanel = ({ system }: SystemPanelProps): React.JSX.Element => (
  <Card>
    <CardHeader>
      <div className="flex items-start justify-between gap-4">
        <div>
          <CardTitle>Server</CardTitle>
          <CardDescription>{system ? `${system.hostname} · ${system.platform}/${system.arch}` : 'Local host'}</CardDescription>
        </div>
        {system ? <StatusPill status={system.status} /> : null}
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-md border bg-background p-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Cpu className="h-4 w-4" aria-hidden="true" />
            CPU
          </div>
          <p className="mt-2 text-xl font-bold">{system?.cpuCount ?? 0} cores</p>
          <p className="truncate text-xs text-muted-foreground">{system?.cpuModel ?? 'Waiting for host'}</p>
        </div>
        <div className="rounded-md border bg-background p-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Thermometer className="h-4 w-4" aria-hidden="true" />
            Thermal
          </div>
          <p className="mt-2 text-xl font-bold">
            {system?.temperatureCelsius == null ? 'n/a' : `${system.temperatureCelsius.toFixed(1)}°C`}
          </p>
          <p className="text-xs text-muted-foreground">Uptime {formatDuration(system?.uptimeSeconds ?? 0)}</p>
        </div>
      </div>

      <div className="rounded-md border bg-background p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <MemoryStick className="h-4 w-4" aria-hidden="true" />
            Memory
          </div>
          <span className="font-mono text-sm font-semibold">{system?.memory.usedPercent ?? 0}%</span>
        </div>
        <Progress className="mt-3" value={system?.memory.usedPercent ?? 0} />
        <p className="mt-2 text-xs text-muted-foreground">
          {formatBytes(system?.memory.used ?? 0)} / {formatBytes(system?.memory.total ?? 0)}
        </p>
      </div>

      <div className="rounded-md border bg-background p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <HardDrive className="h-4 w-4" aria-hidden="true" />
            Disk
          </div>
          <span className="font-mono text-sm font-semibold">{system?.disk?.usedPercent ?? 0}%</span>
        </div>
        <Progress className="mt-3" value={system?.disk?.usedPercent ?? 0} />
        <p className="mt-2 text-xs text-muted-foreground">
          {system?.disk
            ? `${formatBytes(system.disk.used)} / ${formatBytes(system.disk.total)} on ${system.disk.mount}`
            : 'Disk metrics unavailable'}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        {(system?.loadAverage ?? [0, 0, 0]).map((load, index) => (
          <div key={index} className="rounded-md border bg-muted/35 p-2">
            <p className="font-mono text-lg font-bold">{formatNumber(load, 2)}</p>
            <p className="font-mono text-[11px] uppercase text-muted-foreground">{[1, 5, 15][index]} min</p>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);
