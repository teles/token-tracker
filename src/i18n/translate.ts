import { i18nMessages } from '@/i18n/messages';
import type { AppLanguage } from '@/types/app-settings';

const FALLBACK_LANGUAGE: AppLanguage = 'en-US';

type TranslationParams = Record<string, string | number>;

function interpolate(template: string, params?: TranslationParams): string {
  if (!params) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = params[key];
    return value === undefined ? `{${key}}` : String(value);
  });
}

export function translate(
  language: AppLanguage,
  key: string,
  params?: TranslationParams
): string {
  const template =
    i18nMessages[language][key] ??
    i18nMessages[FALLBACK_LANGUAGE][key] ??
    key;

  return interpolate(template, params);
}
