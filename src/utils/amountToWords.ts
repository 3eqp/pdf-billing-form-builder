import n2words from 'n2words';
import { Language } from '@/i18n/translations';
import { Currency } from '@/types/currency';

// Currency unit names for each currency and language
// Format: [singular, few (2-4), many (5+, 0)]
type CurrencyForms = { main: [string, string, string]; sub: [string, string, string] };

const currencyNames: Record<Currency, Record<Language, CurrencyForms>> = {
  PLN: {
    pl: {
      main: ['złoty', 'złote', 'złotych'],
      sub: ['grosz', 'grosze', 'groszy'],
    },
    en: {
      main: ['zloty', 'zloty', 'zloty'],
      sub: ['grosz', 'grosz', 'grosz'],
    },
    ru: {
      main: ['злотый', 'злотых', 'злотых'],
      sub: ['грош', 'гроша', 'грошей'],
    },
    uk: {
      main: ['злотий', 'злотих', 'злотих'],
      sub: ['грош', 'гроші', 'грошів'],
    },
  },
  USD: {
    pl: {
      main: ['dolar', 'dolary', 'dolarów'],
      sub: ['cent', 'centy', 'centów'],
    },
    en: {
      main: ['dollar', 'dollars', 'dollars'],
      sub: ['cent', 'cents', 'cents'],
    },
    ru: {
      main: ['доллар', 'доллара', 'долларов'],
      sub: ['цент', 'цента', 'центов'],
    },
    uk: {
      main: ['долар', 'долари', 'доларів'],
      sub: ['цент', 'центи', 'центів'],
    },
  },
  EUR: {
    pl: {
      main: ['euro', 'euro', 'euro'],
      sub: ['cent', 'centy', 'centów'],
    },
    en: {
      main: ['euro', 'euros', 'euros'],
      sub: ['cent', 'cents', 'cents'],
    },
    ru: {
      main: ['евро', 'евро', 'евро'],
      sub: ['цент', 'цента', 'центов'],
    },
    uk: {
      main: ['євро', 'євро', 'євро'],
      sub: ['цент', 'центи', 'центів'],
    },
  },
  UAH: {
    pl: {
      main: ['hrywna', 'hrywny', 'hrywien'],
      sub: ['kopiejka', 'kopiejki', 'kopiejek'],
    },
    en: {
      main: ['hryvnia', 'hryvnias', 'hryvnias'],
      sub: ['kopiyka', 'kopiykas', 'kopiykas'],
    },
    ru: {
      main: ['гривна', 'гривны', 'гривен'],
      sub: ['копейка', 'копейки', 'копеек'],
    },
    uk: {
      main: ['гривня', 'гривні', 'гривень'],
      sub: ['копійка', 'копійки', 'копійок'],
    },
  },
};

/**
 * Returns the correct plural form for Slavic languages (and English).
 * Index 0: singular (1), Index 1: few (2-4), Index 2: many (5+, 0)
 */
function getPluralForm(n: number, forms: [string, string, string]): string {
  const absN = Math.abs(n);
  const lastTwo = absN % 100;
  const lastOne = absN % 10;

  if (lastTwo >= 11 && lastTwo <= 19) {
    return forms[2];
  }
  if (lastOne === 1) {
    return forms[0];
  }
  if (lastOne >= 2 && lastOne <= 4) {
    return forms[1];
  }
  return forms[2];
}

/**
 * Converts a numeric amount (e.g., "123.45" or "123,45") to words
 * with currency units, using the specified language and currency.
 */
export function amountToWords(value: string, lang: Language, currency: Currency = 'PLN'): string {
  // Normalize: replace comma with dot, trim whitespace
  const normalized = value.replace(',', '.').trim();

  // Parse the numeric value
  const parsed = parseFloat(normalized);
  if (isNaN(parsed) || parsed < 0) {
    return '';
  }

  // Split into integer (main currency) and fractional (sub currency) parts
  const mainUnit = Math.floor(parsed);
  const subUnit = Math.round((parsed - mainUnit) * 100);

  const currencyForms = currencyNames[currency][lang];

  // Build the words string
  const parts: string[] = [];

  if (mainUnit > 0 || (mainUnit === 0 && subUnit === 0)) {
    const mainWords = n2words(mainUnit, { lang });
    const mainUnitName = getPluralForm(mainUnit, currencyForms.main);
    parts.push(`${mainWords} ${mainUnitName}`);
  }

  if (subUnit > 0) {
    const subWords = n2words(subUnit, { lang });
    const subUnitName = getPluralForm(subUnit, currencyForms.sub);
    parts.push(`${subWords} ${subUnitName}`);
  }

  return parts.join(' ');
}
