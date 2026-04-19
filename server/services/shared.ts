import type { SectionMeta } from '../../src/types/dashboard';

export const missingConfig = (message: string): SectionMeta => ({
  status: 'missing-config',
  message
});

export const errorMeta = (error: unknown, fallback: string): SectionMeta => ({
  status: 'error',
  message: process.env.DASHBOARD_DEBUG_ERRORS === 'true' && error instanceof Error && error.message ? error.message : fallback,
  updatedAt: new Date().toISOString()
});

export const readyMeta = (): SectionMeta => ({
  status: 'ready',
  updatedAt: new Date().toISOString()
});

export const getEnv = (name: string): string | undefined => {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
};

export const getEnvNumber = (name: string, fallback: number): number => {
  const value = getEnv(name);
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const withTimeout = async <T>(
  run: (signal: AbortSignal) => Promise<T>,
  timeoutMs = 8_000
): Promise<T> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await run(controller.signal);
  } finally {
    clearTimeout(timeout);
  }
};

type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const cache = new Map<string, CacheEntry<unknown>>();

export const cached = async <T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> => {
  const cachedValue = cache.get(key);
  if (cachedValue && cachedValue.expiresAt > Date.now()) {
    return cachedValue.value as T;
  }

  const value = await load();
  cache.set(key, {
    expiresAt: Date.now() + ttlMs,
    value
  });
  return value;
};

export const ensureOk = async (response: Response, label: string): Promise<void> => {
  if (response.ok) {
    return;
  }

  const detail = await response.text().catch(() => '');
  throw new Error(`${label} failed with ${response.status}${detail ? `: ${detail.slice(0, 160)}` : ''}`);
};
