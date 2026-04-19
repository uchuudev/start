import type { DashboardPayload } from '../src/types/dashboard';

import { getCoolify } from './services/coolify';
import { getCurrency } from './services/currency';
import { getFastmail } from './services/fastmail';
import { getSystem } from './services/system';
import { getWanikani } from './services/wanikani';

export const getDashboard = async (): Promise<DashboardPayload> => {
  const [currency, system, coolify, fastmail, wanikani] = await Promise.all([
    getCurrency(),
    getSystem(),
    getCoolify(),
    getFastmail(),
    getWanikani()
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
