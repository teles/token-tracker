import { nextTick } from 'vue';
import { useTokenTrackerState } from '@/composables/useTokenTrackerState';
import { TOKEN_TRACKER_STORAGE_KEY } from '@/services/persistence';
import { addDays, diffDays, startOfMonth, todayIsoDate } from '@/utils/date';

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
    Object.defineProperty(globalThis, 'localStorage', {
      value: new MemoryStorage(),
      configurable: true,
      writable: true
    });
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
    state.updateMeasurementDateInput(state.cycle.cycleStart);

    const futureDate = addDays(state.snapshot.measurementDate, 1);

    state.toggleFutureDay(futureDate);
    expect(state.planning[futureDate]).toBe('on');

    state.toggleFutureDay(futureDate);
    expect(state.planning[futureDate]).toBeUndefined();
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
        }
      })
    );

    const state = useTokenTrackerState();

    expect(state.snapshot.measurementDate).toBe(cycleStart);
    expect(state.snapshot.consumedPercent).toBe(19);
  });
});
