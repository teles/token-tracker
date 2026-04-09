import { supportedAppLanguages } from '@/types/app-settings';
import type { AppLanguage } from '@/types/app-settings';

const UI_SETTINGS_STORAGE_KEY = 'token-tracker:ui-settings:v1';
const DEFAULT_APP_LANGUAGE: AppLanguage = 'en-US';

interface PersistedUiSettings {
  language: AppLanguage;
}

function getStorage(): Storage | null {
  if (typeof globalThis === 'undefined' || !('localStorage' in globalThis)) {
    return null;
  }

  return globalThis.localStorage;
}

function isValidAppLanguage(value: unknown): value is AppLanguage {
  return typeof value === 'string' && supportedAppLanguages.includes(value as AppLanguage);
}

export function loadUiLanguage(): AppLanguage {
  const storage = getStorage();

  if (!storage) {
    return DEFAULT_APP_LANGUAGE;
  }

  const raw = storage.getItem(UI_SETTINGS_STORAGE_KEY);

  if (!raw) {
    return DEFAULT_APP_LANGUAGE;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<PersistedUiSettings>;
    return isValidAppLanguage(parsed.language) ? parsed.language : DEFAULT_APP_LANGUAGE;
  } catch {
    return DEFAULT_APP_LANGUAGE;
  }
}

export function persistUiLanguage(language: AppLanguage): void {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  const payload: PersistedUiSettings = { language };
  storage.setItem(UI_SETTINGS_STORAGE_KEY, JSON.stringify(payload));
}
