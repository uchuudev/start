import type { CurrencySection } from '../../src/types/dashboard';

import { cached, ensureOk, errorMeta, readyMeta, withTimeout } from './shared';

type FrankfurterResponse = {
  base: string;
  date: string;
  rates: Record<string, number>;
};

const symbols = ['USD', 'JPY', 'EUR'] as const;
const symbolMap = {
  USD: '$',
  JPY: '¥',
  EUR: '€'
} satisfies Record<(typeof symbols)[number], string>;

const formatAmount = (currency: string, amount: number): string =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'JPY' ? 0 : 2
  }).format(amount);

const loadCurrency = async (): Promise<CurrencySection> => {
  const url = `https://api.frankfurter.app/latest?base=GBP&symbols=${symbols.join(',')}`;

  const response = await withTimeout((signal) => fetch(url, { signal }));
  await ensureOk(response, 'Currency request');

  const data = (await response.json()) as FrankfurterResponse;

  return {
    ...readyMeta(),
    base: {
      currency: 'GBP',
      symbol: '£',
      amount: '£1.00'
    },
    rates: symbols.map((currency) => {
      const rate = data.rates[currency] ?? 0;

      return {
        currency,
        symbol: symbolMap[currency],
        amount: formatAmount(currency, rate),
        rate
      };
    }),
    message: `Rates for ${data.date}`
  };
};

export const getCurrency = async (): Promise<CurrencySection> => {
  try {
    return await cached('currency', 60 * 60 * 1000, loadCurrency);
  } catch (error) {
    return {
      ...errorMeta(error, 'Currency rates are unavailable.'),
      base: {
        currency: 'GBP',
        symbol: '£',
        amount: '£1.00'
      },
      rates: []
    };
  }
};
