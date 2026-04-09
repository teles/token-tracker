import { ref } from 'vue';
import { loadUiLanguage, persistUiLanguage } from '@/services/ui-settings';
import type { AppLanguage } from '@/types/app-settings';

const sharedLanguage = ref<AppLanguage>(loadUiLanguage());

if (typeof document !== 'undefined') {
  document.documentElement.lang = sharedLanguage.value;
}

export function useUiLanguage() {
  function setLanguage(value: AppLanguage) {
    if (sharedLanguage.value === value) {
      return;
    }

    sharedLanguage.value = value;
    persistUiLanguage(value);

    if (typeof document !== 'undefined') {
      document.documentElement.lang = value;
    }
  }

  return {
    language: sharedLanguage,
    setLanguage
  };
}
