import { useUiLanguage } from '@/composables/useUiLanguage';
import { translate } from '@/i18n/translate';

type TranslationParams = Record<string, string | number>;

export function useI18n() {
  const { language } = useUiLanguage();

  function t(key: string, params?: TranslationParams): string {
    return translate(language.value, key, params);
  }

  return {
    t,
    language
  };
}
