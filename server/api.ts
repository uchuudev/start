import type { DashboardPayload } from '../src/types/dashboard';

import { getCoolify } from './services/coolify';
import { getCurrency } from './services/currency';
import { getFastmail } from './services/fastmail';
import { getSystem } from './services/system';
import { getWanikani } from './services/wanikani';

const withDashboardDeadline = async <T>(run: Promise<T>, timeoutMs = 15_000): Promise<T> => {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error(`Dashboard request timed out after ${timeoutMs}ms`)), timeoutMs);
  });

  try {
    return await Promise.race([run, deadline]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
};

export const getDashboard = async (): Promise<DashboardPayload> => {
  const [currency, system, coolify, fastmail, wanikani] = await withDashboardDeadline(
    Promise.all([getCurrency(), getSystem(), getCoolify(), getFastmail(), getWanikani()])
  );

  return {
    generatedAt: new Date().toISOString(),
    currency,
    system,
    coolify,
    fastmail,
    wanikani
  };
};
