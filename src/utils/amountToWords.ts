import n2words from 'n2words';
import { Language } from '@/i18n/translations';

// Currency unit names for zloty and grosz in each language
const currencyNames: Record<Language, { zloty: [string, string, string]; grosz: [string, string, string] }> = {
  pl: {
    zloty: ['złoty', 'złote', 'złotych'],
    grosz: ['grosz', 'grosze', 'groszy'],
  },
  en: {
    zloty: ['zloty', 'zloty', 'zloty'],
    grosz: ['grosz', 'grosz', 'grosz'],
  },
  ru: {
    zloty: ['злотый', 'злотых', 'злотых'],
    grosz: ['грош', 'гроша', 'грошей'],
  },
  uk: {
    zloty: ['злотий', 'злотих', 'злотих'],
    grosz: ['грош', 'гроші', 'грошів'],
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
 * with zloty and grosz, using the specified language.
 */
export function amountToWords(value: string, lang: Language): string {
  // Normalize: replace comma with dot, trim whitespace
  const normalized = value.replace(',', '.').trim();

  // Parse the numeric value
  const parsed = parseFloat(normalized);
  if (isNaN(parsed) || parsed < 0) {
    return '';
  }

  // Split into integer (zloty) and fractional (grosz) parts
  const zloty = Math.floor(parsed);
  const grosz = Math.round((parsed - zloty) * 100);

  const currency = currencyNames[lang];

  // Build the words string
  const parts: string[] = [];

  if (zloty > 0 || (zloty === 0 && grosz === 0)) {
    const zlotyWords = n2words(zloty, { lang });
    const zlotyUnit = getPluralForm(zloty, currency.zloty);
    parts.push(`${zlotyWords} ${zlotyUnit}`);
  }

  if (grosz > 0) {
    const groszWords = n2words(grosz, { lang });
    const groszUnit = getPluralForm(grosz, currency.grosz);
    parts.push(`${groszWords} ${groszUnit}`);
  }

  return parts.join(' ');
}
