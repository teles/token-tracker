import { sanitizePersistedState } from '@/services/persistence';
import type { PersistedStateV2 } from '@/services/persistence';
import { supportedAppLanguages } from '@/types/app-settings';
import type { AppLanguage } from '@/types/app-settings';
import type { CycleInfo } from '@/types/token-tracker';

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
export const DATA_TRANSFER_SCHEMA_VERSION = 1 as const;

export interface TokenTrackerExportPayload {
  schemaVersion: typeof DATA_TRANSFER_SCHEMA_VERSION;
  exportedAt: string;
  cycle: CycleInfo;
  state: PersistedStateV2;
  uiSettings: {
    language: AppLanguage;
  };
}

export type ImportDataErrorCode =
  | 'invalid-json'
  | 'unsupported-schema'
  | 'invalid-payload'
  | 'cycle-mismatch'
  | 'invalid-state';

export type ParseDataImportResult =
  | {
      ok: true;
      state: PersistedStateV2;
      importedLanguage: AppLanguage | null;
    }
  | {
      ok: false;
      errorCode: ImportDataErrorCode;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object';
}

function isIsoDateString(value: unknown): boolean {
  return typeof value === 'string' && ISO_DATE_PATTERN.test(value);
}

function isCycleInfoCandidate(value: unknown): value is CycleInfo {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isIsoDateString(value.cycleStart) &&
    isIsoDateString(value.resetDate) &&
    typeof value.quotaPercent === 'number' &&
    Number.isFinite(value.quotaPercent)
  );
}

function isSupportedLanguage(value: unknown): value is AppLanguage {
  return typeof value === 'string' && supportedAppLanguages.includes(value as AppLanguage);
}

function cloneState(state: PersistedStateV2): PersistedStateV2 {
  return {
    activeMeasurementDate: state.activeMeasurementDate,
    usageHistory: { ...state.usageHistory },
    estimatedHistory: { ...(state.estimatedHistory ?? {}) },
    planning: { ...state.planning },
    dayNotes: { ...(state.dayNotes ?? {}) }
  };
}

export function buildDataExportPayload(input: {
  cycle: CycleInfo;
  state: PersistedStateV2;
  language: AppLanguage;
}): TokenTrackerExportPayload {
  return {
    schemaVersion: DATA_TRANSFER_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    cycle: {
      cycleStart: input.cycle.cycleStart,
      resetDate: input.cycle.resetDate,
      quotaPercent: input.cycle.quotaPercent
    },
    state: cloneState(input.state),
    uiSettings: {
      language: input.language
    }
  };
}

export function serializeDataExportPayload(payload: TokenTrackerExportPayload): string {
  return JSON.stringify(payload, null, 2);
}

export function buildDataExportFileName(cycle: CycleInfo): string {
  return `token-tracker-${cycle.cycleStart}-${cycle.resetDate}.json`;
}

export function parseDataImportPayload(raw: string, cycle: CycleInfo): ParseDataImportResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      ok: false,
      errorCode: 'invalid-json'
    };
  }

  if (!isRecord(parsed)) {
    return {
      ok: false,
      errorCode: 'invalid-payload'
    };
  }

  if (parsed.schemaVersion !== DATA_TRANSFER_SCHEMA_VERSION) {
    return {
      ok: false,
      errorCode: 'unsupported-schema'
    };
  }

  if (!isCycleInfoCandidate(parsed.cycle)) {
    return {
      ok: false,
      errorCode: 'invalid-payload'
    };
  }

  const importedCycle = parsed.cycle;

  if (
    importedCycle.cycleStart !== cycle.cycleStart ||
    importedCycle.resetDate !== cycle.resetDate ||
    importedCycle.quotaPercent !== cycle.quotaPercent
  ) {
    return {
      ok: false,
      errorCode: 'cycle-mismatch'
    };
  }

  const sanitizedState = sanitizePersistedState(parsed.state, cycle);

  if (!sanitizedState) {
    return {
      ok: false,
      errorCode: 'invalid-state'
    };
  }

  const importedLanguage = isRecord(parsed.uiSettings) && isSupportedLanguage(parsed.uiSettings.language)
    ? parsed.uiSettings.language
    : null;

  return {
    ok: true,
    state: sanitizedState,
    importedLanguage
  };
}
