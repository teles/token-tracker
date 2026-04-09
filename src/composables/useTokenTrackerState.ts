import { computed, reactive, watch } from 'vue';
import { getNextPlanningState } from '@/domain/planning';
import {
  estimateConsumedPercentForDate,
  findNeighborMeasurements
} from '@/domain/usage-history';
import { buildWhatIfScenarios } from '@/domain/what-if';
import {
  initialCycle,
  initialPlanning,
  initialSnapshot,
  initialUsageHistory
} from '@/mocks/initial-data';
import { loadPersistedState, persistState } from '@/services/persistence';
import { DAY_NOTE_MAX_LENGTH } from '@/types/token-tracker';
import type {
  DayNotesMap,
  ISODateString,
  InputValidationErrors,
  PlanningMap,
  PlanningShortcut,
  UsageChartModel,
  UsageHistoryMap,
  UsageSnapshot
} from '@/types/token-tracker';
import { buildCalendarModel } from '@/use-cases/buildCalendarModel';
import { buildDiagnosticSummary } from '@/use-cases/buildDiagnosticSummary';
import { buildUsageChartModel } from '@/use-cases/buildUsageChartModel';
import {
  addDays,
  eachDayInclusive,
  isBefore,
  isBetweenInclusive,
  isWeekend,
  todayIsoDate,
  toMonthLabel
} from '@/utils/date';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function resolveReferenceDate(cycle: typeof initialCycle): ISODateString {
  const today = todayIsoDate();

  if (isBefore(today, cycle.cycleStart)) {
    return cycle.cycleStart;
  }

  if (isBefore(cycle.resetDate, today)) {
    return cycle.resetDate;
  }

  return today;
}

function toDisplayPercent(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function isFutureDateInCycle(date: ISODateString, anchorDate: ISODateString): boolean {
  return (
    isBetweenInclusive(date, initialCycle.cycleStart, initialCycle.resetDate) &&
    isBetweenInclusive(date, addDays(anchorDate, 1), initialCycle.resetDate)
  );
}

function parseMeasurementDateInput(value: string): ISODateString | null {
  if (!DATE_PATTERN.test(value)) {
    return null;
  }

  return value as ISODateString;
}

function parseConsumedPercentInput(value: string): number | null {
  if (value.trim().length === 0) {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
}

function normalizePlanningEntries(anchorDate: ISODateString, planning: PlanningMap): void {
  const futureWindowStart = addDays(anchorDate, 1);

  for (const date of Object.keys(planning) as ISODateString[]) {
    if (!isBetweenInclusive(date, futureWindowStart, initialCycle.resetDate)) {
      delete planning[date];
    }
  }
}

export function useTokenTrackerState() {
  const referenceDate = resolveReferenceDate(initialCycle);
  const restored = loadPersistedState(initialCycle);

  const usageHistory = reactive<UsageHistoryMap>(
    restored?.usageHistory ? { ...restored.usageHistory } : { ...initialUsageHistory }
  );
  const planning = reactive<PlanningMap>(restored?.planning ? { ...restored.planning } : { ...initialPlanning });
  const dayNotes = reactive<DayNotesMap>(restored?.dayNotes ? { ...restored.dayNotes } : {});

  const initialMeasurementDate =
    restored?.activeMeasurementDate ??
    initialSnapshot.measurementDate;

  const snapshot = reactive<UsageSnapshot>({
    measurementDate: initialMeasurementDate,
    consumedPercent: estimateConsumedPercentForDate(initialMeasurementDate, usageHistory, initialCycle)
  });

  normalizePlanningEntries(referenceDate, planning);

  const formState = reactive<{ measurementDate: string; consumedPercent: string; dayNote: string }>({
    measurementDate: snapshot.measurementDate,
    consumedPercent: toDisplayPercent(snapshot.consumedPercent),
    dayNote: dayNotes[snapshot.measurementDate] ?? ''
  });

  const validationErrors = reactive<InputValidationErrors>({
    measurementDate: '',
    consumedPercent: '',
    dayNote: ''
  });

  const analysisSnapshot = computed<UsageSnapshot>(() => ({
    measurementDate: referenceDate,
    consumedPercent: estimateConsumedPercentForDate(referenceDate, usageHistory, initialCycle)
  }));

  const monthLabel = computed(() => toMonthLabel(referenceDate));

  const diagnostics = computed(() =>
    buildDiagnosticSummary({
      snapshot: analysisSnapshot.value,
      cycle: initialCycle,
      planning
    })
  );

  const calendarDays = computed(() =>
    buildCalendarModel({
      snapshot: analysisSnapshot.value,
      measurementDate: snapshot.measurementDate,
      cycle: initialCycle,
      planning,
      usageHistory,
      dayNotes,
      today: referenceDate
    })
  );

  const usageChartModel = computed<UsageChartModel>(() =>
    buildUsageChartModel({
      cycle: initialCycle,
      referenceDate,
      measurementDate: snapshot.measurementDate,
      usageHistory,
      planning
    })
  );

  const whatIfScenarios = computed(() =>
    buildWhatIfScenarios({
      remainingPercent: diagnostics.value.remainingPercent,
      plannedUsageDays: diagnostics.value.plannedUsageDays,
      totalFutureDays: diagnostics.value.planningSummary.totalFutureDays
    })
  );

  const planningStatusLabel = computed(
    () =>
      `${diagnostics.value.planningSummary.plannedUsageDays} ON / ${diagnostics.value.planningSummary.plannedOffDays} OFF`
  );

  const isFormValid = computed(
    () => !validationErrors.measurementDate && !validationErrors.consumedPercent && !validationErrors.dayNote
  );

  function validateMeasurementDateInput(value: string): ISODateString | null {
    if (!value) {
      validationErrors.measurementDate = 'Measurement date is required.';
      return null;
    }

    const parsed = parseMeasurementDateInput(value);

    if (!parsed) {
      validationErrors.measurementDate = 'Use a valid date format.';
      return null;
    }

    if (!isBetweenInclusive(parsed, initialCycle.cycleStart, initialCycle.resetDate)) {
      validationErrors.measurementDate = 'Date must stay inside the current cycle.';
      return null;
    }

    if (isBefore(todayIsoDate(), parsed)) {
      validationErrors.measurementDate = 'Measurement date cannot be in the future.';
      return null;
    }

    validationErrors.measurementDate = '';
    return parsed;
  }

  function validateConsumedPercentInput(value: string): number | null {
    if (!value) {
      validationErrors.consumedPercent = 'Consumed quota is required.';
      return null;
    }

    const parsed = parseConsumedPercentInput(value);

    if (parsed === null) {
      validationErrors.consumedPercent = 'Enter a valid numeric percentage.';
      return null;
    }

    if (parsed < 0 || parsed > initialCycle.quotaPercent) {
      validationErrors.consumedPercent = `Value must be between 0 and ${initialCycle.quotaPercent}.`;
      return null;
    }

    const neighbors = findNeighborMeasurements(snapshot.measurementDate, usageHistory, initialCycle);

    if (neighbors.previous && parsed < neighbors.previous.consumedPercent) {
      validationErrors.consumedPercent =
        `Value cannot be lower than ${toDisplayPercent(neighbors.previous.consumedPercent)}% from ${neighbors.previous.date}.`;
      return null;
    }

    if (neighbors.next && parsed > neighbors.next.consumedPercent) {
      validationErrors.consumedPercent =
        `Value cannot be higher than ${toDisplayPercent(neighbors.next.consumedPercent)}% from ${neighbors.next.date}.`;
      return null;
    }

    validationErrors.consumedPercent = '';
    return parsed;
  }

  function validateDayNoteInput(value: string): boolean {
    if (value.length > DAY_NOTE_MAX_LENGTH) {
      validationErrors.dayNote = `Keep note up to ${DAY_NOTE_MAX_LENGTH} characters.`;
      return false;
    }

    validationErrors.dayNote = '';
    return true;
  }

  function updateMeasurementDateInput(value: string) {
    formState.measurementDate = value;

    const parsed = validateMeasurementDateInput(value);

    if (!parsed) {
      return;
    }

    snapshot.measurementDate = parsed;
    snapshot.consumedPercent = estimateConsumedPercentForDate(parsed, usageHistory, initialCycle);
    formState.consumedPercent = toDisplayPercent(snapshot.consumedPercent);
    formState.dayNote = dayNotes[parsed] ?? '';
    validationErrors.consumedPercent = '';
    validationErrors.dayNote = '';
    normalizePlanningEntries(referenceDate, planning);
  }

  function updateConsumedPercentInput(value: string) {
    formState.consumedPercent = value;

    const parsed = validateConsumedPercentInput(value);

    if (parsed === null) {
      return;
    }

    snapshot.consumedPercent = parsed;
    usageHistory[snapshot.measurementDate] = parsed;
    formState.consumedPercent = toDisplayPercent(parsed);
  }

  function updateDayNoteInput(value: string) {
    formState.dayNote = value;

    if (!validateDayNoteInput(value)) {
      return;
    }

    const normalized = value.trim();

    if (normalized.length === 0) {
      delete dayNotes[snapshot.measurementDate];
      return;
    }

    dayNotes[snapshot.measurementDate] = normalized;
  }

  function toggleFutureDay(date: ISODateString) {
    if (!isFutureDateInCycle(date, referenceDate)) {
      return;
    }

    const nextState = getNextPlanningState(planning[date] ?? 'off');

    if (nextState === 'off') {
      delete planning[date];
      return;
    }

    planning[date] = nextState;
  }

  function applyShortcut(shortcut: PlanningShortcut) {
    const futureDates = eachDayInclusive(addDays(referenceDate, 1), initialCycle.resetDate);

    if (shortcut === 'clear') {
      for (const date of futureDates) {
        delete planning[date];
      }

      return;
    }

    if (shortcut === 'workdays') {
      for (const date of futureDates) {
        if (isWeekend(date)) {
          delete planning[date];
        } else {
          planning[date] = 'on';
        }
      }

      return;
    }

    for (const date of futureDates) {
      if (isWeekend(date)) {
        delete planning[date];
      }
    }
  }

  watch(
    () => ({
      measurementDate: snapshot.measurementDate,
      usageHistory: { ...usageHistory },
      planning: { ...planning },
      dayNotes: { ...dayNotes }
    }),
    () => {
      persistState(snapshot.measurementDate, { ...usageHistory }, { ...planning }, { ...dayNotes });
    },
    { deep: true }
  );

  return {
    cycle: initialCycle,
    snapshot,
    usageHistory,
    planning,
    dayNotes,
    formState,
    dayNoteMaxLength: DAY_NOTE_MAX_LENGTH,
    validationErrors,
    isFormValid,
    monthLabel,
    diagnostics,
    calendarDays,
    usageChartModel,
    whatIfScenarios,
    planningStatusLabel,
    updateMeasurementDateInput,
    updateConsumedPercentInput,
    updateDayNoteInput,
    toggleFutureDay,
    applyShortcut
  };
}
