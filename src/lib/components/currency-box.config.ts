export const currencyBoxConfig = {
  base: {
    currency: 'GBP',
    symbol: '£',
    amount: '1.00'
  },
  conversions: [
    { currency: 'USD', symbol: '$' },
    { currency: 'JPY', symbol: '¥' }
  ]
} as const;

export type CurrencyConversion = (typeof currencyBoxConfig.conversions)[number];

export type CurrencyBoxRates = {
  base: typeof currencyBoxConfig.base;
  conversions: Array<CurrencyConversion & {
    amount: string;
    label: string;
  }>;
  updatedAt: string;
};
