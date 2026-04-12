import { nextTick } from 'vue';
import { useTokenTrackerState } from '@/composables/useTokenTrackerState';
import { DATA_TRANSFER_SCHEMA_VERSION } from '@/services/data-transfer';
import { TOKEN_TRACKER_STORAGE_KEY } from '@/services/persistence';
import {
  addDays,
  diffDays,
  eachDayInclusive,
  isBefore,
  isWeekend,
  startOfMonth,
  todayIsoDate
} from '@/utils/date';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

class MemoryStorage implements Storage {
  private map = new Map<string, string>();

  get length(): number {
    return this.map.size;
  }

  clear(): void {
    this.map.clear();
  }

  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.map.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.map.delete(key);
  }

  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
}

describe('useTokenTrackerState', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(Date.UTC(2026, 3, 9, 12, 0, 0)));

    Object.defineProperty(globalThis, 'localStorage', {
      value: new MemoryStorage(),
      configurable: true,
      writable: true
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses expected average consumed value until the current day on first load', () => {
    const state = useTokenTrackerState();
    const referenceDay = state.snapshot.measurementDate;
    const cycleDays = eachDayInclusive(state.cycle.cycleStart, state.cycle.resetDate);
    const expectedUsageDays = cycleDays.filter((date) => !isWeekend(date));
    const elapsedUsageDays = expectedUsageDays.filter((date) => !isBefore(referenceDay, date));

    const expectedPercent =
      expectedUsageDays.length === 0
        ? 0
        : Math.round((elapsedUsageDays.length / expectedUsageDays.length) * state.cycle.quotaPercent * 10) / 10;

    expect(state.snapshot.consumedPercent).toBe(expectedPercent);
  });

  it('validates invalid input without mutating snapshot', () => {
    const state = useTokenTrackerState();
    const previousDate = state.snapshot.measurementDate;
    const previousPercent = state.snapshot.consumedPercent;

    state.updateMeasurementDateInput('2099-01-01');
    state.updateConsumedPercentInput('140');

    expect(state.validationErrors.measurementDate.length).toBeGreaterThan(0);
    expect(state.validationErrors.consumedPercent).toContain('between 0 and');
    expect(state.snapshot.measurementDate).toBe(previousDate);
    expect(state.snapshot.consumedPercent).toBe(previousPercent);
  });

  it('keeps previously entered values when switching dates', () => {
    const state = useTokenTrackerState();
    const dayStart = state.cycle.cycleStart;
    const dayEnd = state.snapshot.measurementDate;
    const span = diffDays(dayStart, dayEnd);

    state.updateMeasurementDateInput(dayStart);
    state.updateConsumedPercentInput('20');

    state.updateMeasurementDateInput(dayEnd);
    state.updateConsumedPercentInput('40');

    state.updateMeasurementDateInput(dayStart);
    expect(state.snapshot.consumedPercent).toBe(span > 0 ? 20 : 40);
  });

  it('toggles a future day on and off', () => {
    const state = useTokenTrackerState();
    const actualToday = todayIsoDate();
    const actualFutureDate = addDays(actualToday, 1);

    state.updateMeasurementDateInput(state.cycle.cycleStart);

    const historicalDay = addDays(state.cycle.cycleStart, 1);

    state.toggleFutureDay(historicalDay);
    expect(state.planning[historicalDay]).toBeUndefined();

    const initialFutureState = state.planning[actualFutureDate] ?? 'off';

    state.toggleFutureDay(actualFutureDate);
    const afterFirstToggle = state.planning[actualFutureDate] ?? 'off';
    expect(afterFirstToggle).not.toBe(initialFutureState);

    state.toggleFutureDay(actualFutureDate);
    const afterSecondToggle = state.planning[actualFutureDate] ?? 'off';
    expect(afterSecondToggle).toBe(initialFutureState);
  });

  it('keeps selected weekends when applying workdays shortcut', () => {
    const state = useTokenTrackerState();
    const actualToday = todayIsoDate();

    state.applyShortcut('clear');

    let weekendDate = addDays(actualToday, 1);
    while (!isWeekend(weekendDate)) {
      weekendDate = addDays(weekendDate, 1);
    }

    let weekdayDate = addDays(actualToday, 1);
    while (isWeekend(weekdayDate)) {
      weekdayDate = addDays(weekdayDate, 1);
    }

    state.toggleFutureDay(weekendDate);
    expect(state.planning[weekendDate]).toBe('on');

    state.applyShortcut('workdays');

    expect(state.planning[weekdayDate]).toBe('on');
    expect(state.planning[weekendDate]).toBe('on');
  });

  it('persists active date, usage history and planning to localStorage', async () => {
    const state = useTokenTrackerState();

    state.updateMeasurementDateInput(state.cycle.cycleStart);
    state.updateConsumedPercentInput('22.5');

    await nextTick();

    const raw = globalThis.localStorage.getItem(TOKEN_TRACKER_STORAGE_KEY);
    expect(raw).not.toBeNull();

    const parsed = JSON.parse(raw ?? '{}');
    expect(parsed.activeMeasurementDate).toBe(state.cycle.cycleStart);
    expect(parsed.usageHistory[state.cycle.cycleStart]).toBe(22.5);
  });

  it('stores and persists day notes for the selected date', async () => {
    const state = useTokenTrackerState();

    state.updateMeasurementDateInput(state.cycle.cycleStart);
    state.updateDayNoteInput('Deploy com teste de carga');

    expect(state.dayNotes[state.cycle.cycleStart]).toBe('Deploy com teste de carga');

    await nextTick();

    const raw = globalThis.localStorage.getItem(TOKEN_TRACKER_STORAGE_KEY);
    const parsed = JSON.parse(raw ?? '{}');
    expect(parsed.dayNotes[state.cycle.cycleStart]).toBe('Deploy com teste de carga');

    state.updateDayNoteInput('   ');
    expect(state.dayNotes[state.cycle.cycleStart]).toBeUndefined();
  });

  it('restores persisted state on composable creation', () => {
    const today = todayIsoDate();
    const cycleStart = startOfMonth(today);

    globalThis.localStorage.setItem(
      TOKEN_TRACKER_STORAGE_KEY,
      JSON.stringify({
        activeMeasurementDate: cycleStart,
        usageHistory: {
          [cycleStart]: 19
        },
        planning: {
          [addDays(cycleStart, 3)]: 'on'
        },
        dayNotes: {
          [cycleStart]: 'Primeiro dia do ciclo'
        }
      })
    );

    const state = useTokenTrackerState();

    expect(state.snapshot.measurementDate).toBe(cycleStart);
    expect(state.snapshot.consumedPercent).toBe(19);
    expect(state.formState.dayNote).toBe('Primeiro dia do ciclo');
  });

  it('imports serialized backup data and applies state', () => {
    const state = useTokenTrackerState();
    const importedDate = state.cycle.cycleStart;
    const importedPlanningDate = addDays(todayIsoDate(), 1);
    const importedPayload = JSON.stringify({
      schemaVersion: DATA_TRANSFER_SCHEMA_VERSION,
      exportedAt: '2026-04-09T12:00:00.000Z',
      cycle: state.cycle,
      state: {
        activeMeasurementDate: importedDate,
        usageHistory: {
          [importedDate]: 17.5
        },
        planning: {
          [importedPlanningDate]: 'on'
        },
        dayNotes: {
          [importedDate]: 'Importado'
        }
      },
      uiSettings: {
        language: 'pt-BR'
      }
    });

    const importResult = state.importFromSerializedData(importedPayload);

    expect(importResult.ok).toBe(true);

    if (!importResult.ok) {
      return;
    }

    expect(state.snapshot.measurementDate).toBe(importedDate);
    expect(state.snapshot.consumedPercent).toBe(17.5);
    expect(state.formState.dayNote).toBe('Importado');
    expect(state.planning[importedPlanningDate]).toBe('on');
    expect(importResult.importedLanguage).toBe('pt-BR');
  });

  it('resets cycle data to defaults', () => {
    const state = useTokenTrackerState();
    const cycleStart = state.cycle.cycleStart;
    const today = todayIsoDate();

    state.updateMeasurementDateInput(cycleStart);
    state.updateConsumedPercentInput('42');
    state.updateDayNoteInput('Nota temporária');
    state.applyShortcut('clear');
    state.toggleFutureDay(addDays(today, 1));

    state.resetCycleData();

    expect(state.snapshot.measurementDate).toBe(today);
    expect(state.formState.dayNote).toBe('');
    expect(state.dayNotes[cycleStart]).toBeUndefined();
    expect(state.usageHistory[today]).toBe(state.snapshot.consumedPercent);
  });

  it('creates and switches between accounts', () => {
    const state = useTokenTrackerState();
    const defaultAccountId = state.activeAccount.id;

    expect(defaultAccountId).toMatch(UUID_PATTERN);

    state.createAndSwitchAccount({
      name: 'Codex Weekly',
      provider: 'codex',
      cadence: 'weekly'
    });

    expect(state.activeAccount.id).toMatch(UUID_PATTERN);
    expect(state.activeAccount.name).toBe('Codex Weekly');
    expect(state.activeAccount.cadence).toBe('weekly');
    expect(state.cycle.cycleStart).toBe('2026-04-06');
    expect(state.cycle.resetDate).toBe('2026-04-12');
    expect(state.accountSummaries.length).toBeGreaterThanOrEqual(2);

    const switched = state.switchActiveAccount(defaultAccountId);

    expect(switched).toBe(true);
    expect(state.activeAccount.id).toBe(defaultAccountId);
    expect(state.cycle.cycleStart).toBe('2026-04-01');
    expect(state.cycle.resetDate).toBe('2026-04-30');
  });

  it('renames, archives, restores and deletes archived accounts', () => {
    const state = useTokenTrackerState();
    const defaultAccountId = state.activeAccount.id;

    state.createAndSwitchAccount({
      name: 'Archive Candidate',
      provider: 'custom',
      cadence: 'monthly'
    });

    const archivedAccountId = state.activeAccount.id;
    const renameDefault = state.renameAccount(defaultAccountId, 'Renamed Default');

    expect(renameDefault).toBe(true);
    expect(state.accountSummaries.some((summary) => summary.name === 'Renamed Default')).toBe(true);

    const archived = state.archiveAccount(archivedAccountId);

    expect(archived).toBe(true);
    expect(state.activeAccount.id).toBe(defaultAccountId);
    expect(state.accountSummaries.some((summary) => summary.id === archivedAccountId)).toBe(false);
    expect(state.archivedAccountSummaries.some((summary) => summary.id === archivedAccountId)).toBe(true);

    const restored = state.unarchiveAccount(archivedAccountId);

    expect(restored).toBe(true);
    expect(state.accountSummaries.some((summary) => summary.id === archivedAccountId)).toBe(true);

    state.archiveAccount(archivedAccountId);
    const deleted = state.deleteArchivedAccount(archivedAccountId);

    expect(deleted).toBe(true);
    expect(state.accountSummaries.some((summary) => summary.id === archivedAccountId)).toBe(false);
    expect(state.archivedAccountSummaries.some((summary) => summary.id === archivedAccountId)).toBe(false);
  });
});
