export type Currency = 'USD' | 'PLN' | 'UAH' | 'EUR';

export interface CurrencyInfo {
  code: Currency;
  symbol: string;
  name: string;
}

export const currencies: Record<Currency, CurrencyInfo> = {
  USD: { code: 'USD', symbol: '$', name: 'USD' },
  PLN: { code: 'PLN', symbol: 'zł', name: 'PLN' },
  UAH: { code: 'UAH', symbol: '₴', name: 'UAH' },
  EUR: { code: 'EUR', symbol: '€', name: 'EUR' },
};
