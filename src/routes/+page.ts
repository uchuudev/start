import type { PageLoad } from './$types';
import { currencyBoxConfig, type CurrencyBoxRates } from '$lib/components/currency-box.config';

const ONE_HOUR_MS = 60 * 60 * 1000;

type RateResponse = {
  base: string;
  date: string;
  rates: Record<string, number>;
};

type CachedRates = {
  timestamp: number;
  data: CurrencyBoxRates;
};

const conversionSymbols = currencyBoxConfig.conversions.map((conversion) => conversion.currency).join(',');
const endpoint = `https://api.frankfurter.app/latest?base=${currencyBoxConfig.base.currency}&symbols=${conversionSymbols}`;

let cachedRates: CachedRates | null = null;

const isCacheValid = (entry: CachedRates | null): entry is CachedRates => {
  if (!entry) {
    return false;
  }

  return Date.now() - entry.timestamp < ONE_HOUR_MS;
};

const formatAmount = (value: number): string =>
  value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  });

const toCurrencyBoxRates = (data: RateResponse): CurrencyBoxRates => {
  const baseAmount = Number.parseFloat(currencyBoxConfig.base.amount);

  const conversions = currencyBoxConfig.conversions.map((conversion) => {
    const rate = data.rates[conversion.currency];
    if (rate == null || Number.isNaN(rate)) {
      return {
        ...conversion,
        amount: '--',
        label: `Rate unavailable for ${conversion.currency}`
      };
    }

    const converted = Number.isFinite(baseAmount) ? baseAmount * rate : rate;

    return {
      ...conversion,
      amount: formatAmount(converted),
      label: `1 ${data.base} = ${rate.toFixed(4)} ${conversion.currency}`
    };
  });

  const parsedDate = new Date(`${data.date}T00:00:00Z`);
  const updatedAt = Number.isNaN(parsedDate.getTime())
    ? 'Latest rates'
    : `Rates for ${new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(parsedDate)}`;

  return {
    base: currencyBoxConfig.base,
    conversions,
    updatedAt
  };
};

export const load = (async ({ fetch }) => {
  if (isCacheValid(cachedRates)) {
    return {
      rates: cachedRates.data
    };
  }

  try {
    const response = await fetch(endpoint);
    if (!response.ok) {
      return { rates: null };
    }

    const data = (await response.json()) as RateResponse;
    const computedRates = toCurrencyBoxRates(data);

    cachedRates = {
      timestamp: Date.now(),
      data: computedRates
    };

    return {
      rates: computedRates
    };
  } catch {
    return { rates: null };
  }
}) satisfies PageLoad;
