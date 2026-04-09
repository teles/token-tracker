import { sanitizeUsageHistory } from '@/domain/usage-history';
import type {
  CycleInfo,
  ISODateString,
  PlanningMap,
  UsageHistoryMap,
  UsageSnapshot
} from '@/types/token-tracker';
import { isBetweenInclusive, isBefore, todayIsoDate } from '@/utils/date';

const STORAGE_KEY = 'token-tracker:state:v2';

type PersistedStateV2 = {
  activeMeasurementDate: ISODateString;
  usageHistory: UsageHistoryMap;
  planning: PlanningMap;
};

type PersistedStateV1 = {
  snapshot: UsageSnapshot;
  planning: PlanningMap;
};

function getStorage(): Storage | null {
  if (typeof globalThis === 'undefined' || !('localStorage' in globalThis)) {
    return null;
  }

  return globalThis.localStorage;
}

function isValidPlanningState(value: unknown): value is 'on' | 'off' {
  return value === 'on' || value === 'off';
}

function isValidIsoDate(value: unknown): value is ISODateString {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function sanitizePlanning(planning: PlanningMap, cycle: CycleInfo): PlanningMap {
  const sanitized: PlanningMap = {};

  for (const [date, state] of Object.entries(planning)) {
    if (!isValidIsoDate(date) || !isValidPlanningState(state)) {
      continue;
    }

    if (!isBetweenInclusive(date, cycle.cycleStart, cycle.resetDate)) {
      continue;
    }

    if (state === 'on') {
      sanitized[date] = state;
    }
  }

  return sanitized;
}

function sanitizeActiveMeasurementDate(date: ISODateString, cycle: CycleInfo): ISODateString | null {
  if (!isBetweenInclusive(date, cycle.cycleStart, cycle.resetDate)) {
    return null;
  }

  if (isBefore(todayIsoDate(), date)) {
    return null;
  }

  return date;
}

function migrateV1State(raw: unknown): PersistedStateV2 | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const candidate = raw as PersistedStateV1;

  if (!candidate.snapshot || !isValidIsoDate(candidate.snapshot.measurementDate)) {
    return null;
  }

  return {
    activeMeasurementDate: candidate.snapshot.measurementDate,
    usageHistory: {
      [candidate.snapshot.measurementDate]: candidate.snapshot.consumedPercent
    },
    planning: candidate.planning ?? {}
  };
}

export function loadPersistedState(cycle: CycleInfo): PersistedStateV2 | null {
  const storage = getStorage();

  if (!storage) {
    return null;
  }

  const rawV2 = storage.getItem(STORAGE_KEY);
  const rawV1 = storage.getItem('token-tracker:state:v1');
  const raw = rawV2 ?? rawV1;

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as PersistedStateV2 | PersistedStateV1;

    const normalized: PersistedStateV2 | null =
      'activeMeasurementDate' in (parsed as PersistedStateV2)
        ? (parsed as PersistedStateV2)
        : migrateV1State(parsed);

    if (!normalized) {
      return null;
    }

    if (!isValidIsoDate(normalized.activeMeasurementDate)) {
      return null;
    }

    const activeMeasurementDate = sanitizeActiveMeasurementDate(
      normalized.activeMeasurementDate,
      cycle
    );

    if (!activeMeasurementDate) {
      return null;
    }

    return {
      activeMeasurementDate,
      usageHistory: sanitizeUsageHistory(normalized.usageHistory ?? {}, cycle),
      planning: sanitizePlanning(normalized.planning ?? {}, cycle)
    };
  } catch {
    return null;
  }
}

export function persistState(
  activeMeasurementDate: ISODateString,
  usageHistory: UsageHistoryMap,
  planning: PlanningMap
): void {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  const payload: PersistedStateV2 = {
    activeMeasurementDate,
    usageHistory,
    planning
  };

  storage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function clearPersistedState(): void {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.removeItem(STORAGE_KEY);
  storage.removeItem('token-tracker:state:v1');
}

export const TOKEN_TRACKER_STORAGE_KEY = STORAGE_KEY;
