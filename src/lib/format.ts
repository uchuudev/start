export const formatNumber = (value: number, maximumFractionDigits = 0): string =>
  new Intl.NumberFormat('en-GB', {
    maximumFractionDigits
  }).format(value);

export const formatBytes = (value: number): string => {
  if (!Number.isFinite(value) || value < 0) {
    return 'n/a';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let amount = value;
  let unitIndex = 0;

  while (amount >= 1024 && unitIndex < units.length - 1) {
    amount /= 1024;
    unitIndex += 1;
  }

  return `${amount.toFixed(amount >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

export const formatDuration = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return 'n/a';
  }

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
};

export const formatDateTime = (iso: string, timeZone = 'Europe/London'): string =>
  new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone
  }).format(new Date(iso));

export const formatRelative = (iso: string): string => {
  const date = new Date(iso);
  const deltaMs = date.getTime() - Date.now();
  const absMs = Math.abs(deltaMs);
  const rtf = new Intl.RelativeTimeFormat('en-GB', { numeric: 'auto' });

  if (absMs < 60_000) {
    return rtf.format(Math.round(deltaMs / 1000), 'second');
  }

  if (absMs < 3_600_000) {
    return rtf.format(Math.round(deltaMs / 60_000), 'minute');
  }

  if (absMs < 86_400_000) {
    return rtf.format(Math.round(deltaMs / 3_600_000), 'hour');
  }

  return rtf.format(Math.round(deltaMs / 86_400_000), 'day');
};
