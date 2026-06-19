export type SectionStatus = 'ready' | 'missing-config' | 'error';

export type SectionMeta = {
  status: SectionStatus;
  message?: string;
  updatedAt?: string;
};

export type CurrencyRate = {
  currency: 'USD' | 'JPY' | 'EUR';
  symbol: string;
  amount: string;
  rate: number;
};

export type CurrencySection = SectionMeta & {
  base: {
    currency: 'GBP';
    symbol: string;
    amount: string;
  };
  rates: CurrencyRate[];
};

export type SystemSection = SectionMeta & {
  hostname: string;
  platform: string;
  arch: string;
  uptimeSeconds: number;
  loadAverage: number[];
  cpuCount: number;
  cpuModel: string;
  memory: {
    total: number;
    free: number;
    used: number;
    usedPercent: number;
  };
  disk?: {
    mount: string;
    total: number;
    used: number;
    available: number;
    usedPercent: number;
  };
  temperatureCelsius?: number;
  nodeVersion: string;
};

export type CoolifyApp = {
  id: string;
  name: string;
  status: string;
  url?: string;
  branch?: string;
  project?: string;
  updatedAt?: string;
  faviconUrl?: string;
};

export type CoolifySection = SectionMeta & {
  apps: CoolifyApp[];
  sourceUrl?: string;
};

export type CalendarEvent = {
  id: string;
  title: string;
  startsAt: string;
  endsAt?: string;
  location?: string;
  calendar?: string;
  allDay: boolean;
};

export type FastmailSection = {
  calendar: SectionMeta & {
    events: CalendarEvent[];
  };
};

export type WanikaniReviewBucket = {
  availableAt: string;
  count: number;
};

export type WanikaniSection = SectionMeta & {
  reviewsAvailable: number;
  lessonsAvailable: number;
  nextReviewsAt?: string;
  upcomingReviews: WanikaniReviewBucket[];
};

export type DashboardPayload = {
  generatedAt: string;
  currency: CurrencySection;
  system: SystemSection;
  coolify: CoolifySection;
  fastmail: FastmailSection;
  wanikani: WanikaniSection;
};
