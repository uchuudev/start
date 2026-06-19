import type { CoolifyApp, CoolifySection } from '../../src/types/dashboard';

import { cached, ensureOk, errorMeta, getEnv, getEnvNumber, missingConfig, readyMeta, withTimeout } from './shared';

const normalizeBaseUrl = (raw: string): string => {
  const trimmed = raw.replace(/\/+$/, '');
  return trimmed.endsWith('/api/v1') ? trimmed : `${trimmed}/api/v1`;
};

const firstUrl = (value: unknown): string | undefined => {
  if (typeof value !== 'string' || !value.trim()) {
    return undefined;
  }

  return value
    .split(/[\s,]+/)
    .map((item) => item.trim())
    .find(Boolean);
};

const faviconFor = (url: string | undefined): string | undefined => {
  if (!url) {
    return undefined;
  }

  try {
    const origin = new URL(url).origin;
    return `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(origin)}`;
  } catch {
    return undefined;
  }
};

const mapApp = (value: Record<string, unknown>): CoolifyApp => {
  const url = firstUrl(value.fqdn) ?? firstUrl(value.domains);
  const id = String(value.uuid ?? value.id ?? value.name ?? crypto.randomUUID());
  const name = String(value.name ?? value.description ?? value.uuid ?? 'Unnamed app');

  return {
    id,
    name,
    status: String(value.status ?? 'unknown'),
    url,
    branch: typeof value.git_branch === 'string' ? value.git_branch : undefined,
    project: typeof value.project_name === 'string' ? value.project_name : undefined,
    updatedAt: typeof value.updated_at === 'string' ? value.updated_at : undefined,
    faviconUrl: faviconFor(url)
  };
};

const loadCoolify = async (): Promise<CoolifySection> => {
  const rawUrl = getEnv('COOLIFY_API_URL') ?? getEnv('COOLIFY_URL');
  const token = getEnv('COOLIFY_API_TOKEN');

  if (!rawUrl || !token) {
    return {
      ...missingConfig('Set COOLIFY_API_URL and COOLIFY_API_TOKEN to list deployed applications.'),
      apps: []
    };
  }

  const baseUrl = normalizeBaseUrl(rawUrl);
  const tag = getEnv('COOLIFY_TAG');
  const url = new URL(`${baseUrl}/applications`);
  if (tag) {
    url.searchParams.set('tag', tag);
  }

  const timeoutMs = getEnvNumber('COOLIFY_TIMEOUT_MS', 5_000);
  const payload = await withTimeout(async (signal) => {
    const response = await fetch(url, {
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    });
    await ensureOk(response, 'Coolify applications request');

    return (await response.json()) as unknown;
  }, timeoutMs);
  const collection = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { data?: unknown }).data)
      ? ((payload as { data: unknown[] }).data)
      : [];

  return {
    ...readyMeta(),
    apps: collection.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null).map(mapApp),
    sourceUrl: rawUrl
  };
};

export const getCoolify = async (): Promise<CoolifySection> => {
  try {
    return await cached('coolify', 60_000, loadCoolify);
  } catch (error) {
    return {
      ...errorMeta(error, 'Coolify applications are unavailable.'),
      apps: []
    };
  }
};
