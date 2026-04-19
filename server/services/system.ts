import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import os from 'node:os';
import { promisify } from 'node:util';

import type { SystemSection } from '../../src/types/dashboard';

import { readyMeta } from './shared';

const execFileAsync = promisify(execFile);

const getTemperature = async (): Promise<number | undefined> => {
  try {
    const raw = await readFile('/sys/class/thermal/thermal_zone0/temp', 'utf8');
    const millidegrees = Number.parseInt(raw.trim(), 10);
    return Number.isFinite(millidegrees) ? Math.round(millidegrees / 100) / 10 : undefined;
  } catch {
    return undefined;
  }
};

const getDisk = async (): Promise<SystemSection['disk']> => {
  try {
    const { stdout } = await execFileAsync('df', ['-kP', '/']);
    const [, row] = stdout.trim().split('\n');
    const parts = row?.replace(/\s+/g, ' ').split(' ');

    if (!parts || parts.length < 6) {
      return undefined;
    }

    const total = Number.parseInt(parts[1], 10) * 1024;
    const used = Number.parseInt(parts[2], 10) * 1024;
    const available = Number.parseInt(parts[3], 10) * 1024;

    return {
      mount: parts[5],
      total,
      used,
      available,
      usedPercent: total > 0 ? Math.round((used / total) * 100) : 0
    };
  } catch {
    return undefined;
  }
};

export const getSystem = async (): Promise<SystemSection> => {
  const cpus = os.cpus();
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const [temperatureCelsius, disk] = await Promise.all([getTemperature(), getDisk()]);

  return {
    ...readyMeta(),
    hostname: os.hostname(),
    platform: os.platform(),
    arch: os.arch(),
    uptimeSeconds: os.uptime(),
    loadAverage: os.loadavg(),
    cpuCount: cpus.length,
    cpuModel: cpus[0]?.model ?? 'Unknown CPU',
    memory: {
      total: totalMemory,
      free: freeMemory,
      used: usedMemory,
      usedPercent: totalMemory > 0 ? Math.round((usedMemory / totalMemory) * 100) : 0
    },
    disk,
    temperatureCelsius,
    nodeVersion: process.version
  };
};
