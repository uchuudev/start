import os from 'node:os';

import type {
  CoolifySection,
  CurrencySection,
  DashboardPayload,
  FastmailSection,
  SystemSection,
  WanikaniSection
} from '../src/types/dashboard';

import { getCoolify } from './services/coolify';
import { getCurrency } from './services/currency';
import { getFastmail } from './services/fastmail';
import { getSystem } from './services/system';
import { getWanikani } from './services/wanikani';

const sectionTimeout = async <T>(name: string, run: Promise<T>, fallback: T, timeoutMs = 8_000): Promise<T> => {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error(`${name} timed out after ${timeoutMs}ms`)), timeoutMs);
  });

  try {
    return await Promise.race([run, deadline]);
  } catch (error) {
    console.error(error);
    return fallback;
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
};

const unavailableCurrency = (): CurrencySection => ({
  status: 'error',
  message: 'Currency rates timed out.',
  updatedAt: new Date().toISOString(),
  base: {
    currency: 'GBP',
    symbol: '£',
    amount: '£1.00'
  },
  rates: []
});

const unavailableSystem = (): SystemSection => {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();

  return {
    status: 'error',
    message: 'System metrics timed out.',
    updatedAt: new Date().toISOString(),
    hostname: os.hostname(),
    platform: os.platform(),
    arch: os.arch(),
    uptimeSeconds: os.uptime(),
    loadAverage: os.loadavg(),
    cpuCount: os.cpus().length,
    cpuModel: os.cpus()[0]?.model ?? 'Unknown CPU',
    memory: {
      total: totalMemory,
      free: freeMemory,
      used: totalMemory - freeMemory,
      usedPercent: totalMemory > 0 ? Math.round(((totalMemory - freeMemory) / totalMemory) * 100) : 0
    },
    nodeVersion: process.version
  };
};

const unavailableCoolify = (): CoolifySection => ({
  status: 'error',
  message: 'Coolify applications timed out.',
  updatedAt: new Date().toISOString(),
  apps: []
});

const unavailableFastmail = (): FastmailSection => ({
  calendar: {
    status: 'error',
    message: 'Fastmail calendar timed out.',
    updatedAt: new Date().toISOString(),
    events: []
  }
});

const unavailableWanikani = (): WanikaniSection => ({
  status: 'error',
  message: 'WaniKani summary timed out.',
  updatedAt: new Date().toISOString(),
  reviewsAvailable: 0,
  lessonsAvailable: 0,
  upcomingReviews: []
});

export const getDashboard = async (): Promise<DashboardPayload> => {
  const [currency, system, coolify, fastmail, wanikani] = await Promise.all([
    sectionTimeout('Currency', getCurrency(), unavailableCurrency()),
    sectionTimeout('System', getSystem(), unavailableSystem()),
    sectionTimeout('Coolify', getCoolify(), unavailableCoolify()),
    sectionTimeout('Fastmail', getFastmail(), unavailableFastmail()),
    sectionTimeout('WaniKani', getWanikani(), unavailableWanikani())
  ]);

  return {
    generatedAt: new Date().toISOString(),
    currency,
    system,
    coolify,
    fastmail,
    wanikani
  };
};
