import { computed, reactive, watch } from 'vue';
import { getNextPlanningState } from '@/domain/planning';
import {
  estimateConsumedPercentForDate,
  findNeighborMeasurements
} from '@/domain/usage-history';
import { buildWhatIfScenarios } from '@/domain/what-if';
import { useI18n } from '@/composables/useI18n';
import { buildDefaultCycleState } from '@/mocks/initial-data';
import { buildDataExportPayload, parseDataImportPayload } from '@/services/data-transfer';
import {
  activateTrackerAccount,
  createTrackerAccount,
  listAccountCycles,
  listTrackerAccounts,
  loadActiveTrackerSlice,
  persistActiveTrackerState
} from '@/services/tracker-workspace';
import type { ParseDataImportResult, TokenTrackerExportPayload } from '@/services/data-transfer';
import type { PersistedStateV2 } from '@/services/persistence';
import type {
  CreateTrackerAccountInput,
  TrackerAccountSummary
} from '@/services/tracker-workspace';
import type { AppLanguage } from '@/types/app-settings';
import { DAY_NOTE_MAX_LENGTH } from '@/types/token-tracker';
import type {
  CycleInfo,
  DayNotesMap,
  ISODateString,
  InputValidationErrors,
  PlanningMap,
  PlanningShortcut,
  TrackerAccount,
  TrackerCycleRecord,
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

function resolveReferenceDate(cycle: CycleInfo): ISODateString {
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

function isFutureDateInCycle(date: ISODateString, anchorDate: ISODateString, cycle: CycleInfo): boolean {
  return (
    isBetweenInclusive(date, cycle.cycleStart, cycle.resetDate) &&
    isBetweenInclusive(date, addDays(anchorDate, 1), cycle.resetDate)
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

function normalizePlanningEntries(anchorDate: ISODateString, planning: PlanningMap, cycle: CycleInfo): void {
  const futureWindowStart = addDays(anchorDate, 1);

  for (const date of Object.keys(planning) as ISODateString[]) {
    if (!isBetweenInclusive(date, futureWindowStart, cycle.resetDate)) {
      delete planning[date];
    }
  }
}

function replaceMapEntries<TValue>(
  target: Partial<Record<ISODateString, TValue>>,
  next: Partial<Record<ISODateString, TValue>>
) {
  for (const date of Object.keys(target) as ISODateString[]) {
    delete target[date];
  }

  for (const [date, value] of Object.entries(next) as Array<[ISODateString, TValue]>) {
    target[date] = value;
  }
}

export function useTokenTrackerState() {
  const { language, t } = useI18n();
  const activeSlice = loadActiveTrackerSlice();
  const cycle = reactive<CycleInfo>({
    cycleStart: activeSlice.cycle.cycleStart,
    resetDate: activeSlice.cycle.resetDate,
    quotaPercent: activeSlice.cycle.quotaPercent
  });
  const activeAccount = reactive<TrackerAccount>({
    ...activeSlice.activeAccount,
    cycleIds: [...activeSlice.activeAccount.cycleIds]
  });
  let activeCycleId = activeSlice.activeCycle.id;
  const referenceDate = computed(() => resolveReferenceDate(cycle));
  const restored = activeSlice.state;
  const defaultCycleState = buildDefaultCycleState(cycle, referenceDate.value);

  const usageHistory = reactive<UsageHistoryMap>(
    restored?.usageHistory ? { ...restored.usageHistory } : { ...defaultCycleState.usageHistory }
  );
  const planning = reactive<PlanningMap>(
    restored?.planning ? { ...restored.planning } : { ...defaultCycleState.planning }
  );
  const dayNotes = reactive<DayNotesMap>(restored?.dayNotes ? { ...restored.dayNotes } : {});

  const initialMeasurementDate =
    restored?.activeMeasurementDate ??
    defaultCycleState.snapshot.measurementDate;

  const snapshot = reactive<UsageSnapshot>({
    measurementDate: initialMeasurementDate,
    consumedPercent: estimateConsumedPercentForDate(initialMeasurementDate, usageHistory, cycle)
  });

  normalizePlanningEntries(referenceDate.value, planning, cycle);

  const accountSummaries = reactive<TrackerAccountSummary[]>(
    listTrackerAccounts(todayIsoDate())
  );
  const accountCycles = reactive<TrackerCycleRecord[]>(
    listAccountCycles(activeAccount.id)
  );

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
    measurementDate: referenceDate.value,
    consumedPercent: estimateConsumedPercentForDate(referenceDate.value, usageHistory, cycle)
  }));

  const monthLabel = computed(() => toMonthLabel(referenceDate.value));

  const diagnostics = computed(() =>
    buildDiagnosticSummary({
      snapshot: analysisSnapshot.value,
      cycle,
      planning,
      language: language.value
    })
  );

  const calendarDays = computed(() =>
    buildCalendarModel({
      snapshot: analysisSnapshot.value,
      measurementDate: snapshot.measurementDate,
      cycle,
      planning,
      usageHistory,
      dayNotes,
      today: referenceDate.value
    })
  );

  const usageChartModel = computed<UsageChartModel>(() =>
    buildUsageChartModel({
      cycle,
      referenceDate: referenceDate.value,
      measurementDate: snapshot.measurementDate,
      usageHistory,
      planning
    })
  );

  const closedCycles = computed(() =>
    accountCycles.filter((cycleRecord) => cycleRecord.status === 'closed')
  );

  const whatIfScenarios = computed(() =>
    buildWhatIfScenarios({
      remainingPercent: diagnostics.value.remainingPercent,
      plannedUsageDays: diagnostics.value.plannedUsageDays,
      totalFutureDays: diagnostics.value.planningSummary.totalFutureDays
    })
  );

  const planningStatusLabel = computed(
    () => t('planningShortcuts.statusLabel', {
      onDays: diagnostics.value.planningSummary.plannedUsageDays,
      offDays: diagnostics.value.planningSummary.plannedOffDays
    })
  );

  const isFormValid = computed(
    () => !validationErrors.measurementDate && !validationErrors.consumedPercent && !validationErrors.dayNote
  );

  function applyState(nextState: PersistedStateV2) {
    replaceMapEntries(usageHistory, nextState.usageHistory ?? {});
    replaceMapEntries(planning, nextState.planning ?? {});
    replaceMapEntries(dayNotes, nextState.dayNotes ?? {});

    normalizePlanningEntries(referenceDate.value, planning, cycle);

    snapshot.measurementDate = nextState.activeMeasurementDate;
    snapshot.consumedPercent = estimateConsumedPercentForDate(
      nextState.activeMeasurementDate,
      usageHistory,
      cycle
    );

    formState.measurementDate = snapshot.measurementDate;
    formState.consumedPercent = toDisplayPercent(snapshot.consumedPercent);
    formState.dayNote = dayNotes[snapshot.measurementDate] ?? '';

    validationErrors.measurementDate = '';
    validationErrors.consumedPercent = '';
    validationErrors.dayNote = '';
  }

  function applyActiveSlice(nextSlice: ReturnType<typeof loadActiveTrackerSlice>) {
    cycle.cycleStart = nextSlice.cycle.cycleStart;
    cycle.resetDate = nextSlice.cycle.resetDate;
    cycle.quotaPercent = nextSlice.cycle.quotaPercent;

    activeAccount.id = nextSlice.activeAccount.id;
    activeAccount.name = nextSlice.activeAccount.name;
    activeAccount.provider = nextSlice.activeAccount.provider;
    activeAccount.cadence = nextSlice.activeAccount.cadence;
    activeAccount.quotaPercent = nextSlice.activeAccount.quotaPercent;
    activeAccount.activeCycleId = nextSlice.activeAccount.activeCycleId;
    activeAccount.cycleIds = [...nextSlice.activeAccount.cycleIds];
    activeAccount.createdAt = nextSlice.activeAccount.createdAt;
    activeAccount.updatedAt = nextSlice.activeAccount.updatedAt;

    activeCycleId = nextSlice.activeCycle.id;
    applyState(nextSlice.state);
    refreshWorkspaceCollections();
  }

  function refreshWorkspaceCollections() {
    const nextSummaries = listTrackerAccounts(todayIsoDate());
    const nextCycles = listAccountCycles(activeAccount.id);

    accountSummaries.splice(0, accountSummaries.length, ...nextSummaries);
    accountCycles.splice(0, accountCycles.length, ...nextCycles);
  }

  function validateMeasurementDateInput(value: string): ISODateString | null {
    if (!value) {
      validationErrors.measurementDate = t('validation.measurementDate.required');
      return null;
    }

    const parsed = parseMeasurementDateInput(value);

    if (!parsed) {
      validationErrors.measurementDate = t('validation.measurementDate.invalidFormat');
      return null;
    }

    if (!isBetweenInclusive(parsed, cycle.cycleStart, cycle.resetDate)) {
      validationErrors.measurementDate = t('validation.measurementDate.outOfCycle');
      return null;
    }

    if (isBefore(todayIsoDate(), parsed)) {
      validationErrors.measurementDate = t('validation.measurementDate.future');
      return null;
    }

    validationErrors.measurementDate = '';
    return parsed;
  }

  function validateConsumedPercentInput(value: string): number | null {
    if (!value) {
      validationErrors.consumedPercent = t('validation.consumed.required');
      return null;
    }

    const parsed = parseConsumedPercentInput(value);

    if (parsed === null) {
      validationErrors.consumedPercent = t('validation.consumed.invalid');
      return null;
    }

    if (parsed < 0 || parsed > cycle.quotaPercent) {
      validationErrors.consumedPercent = t('validation.consumed.outOfRange', {
        max: cycle.quotaPercent
      });
      return null;
    }

    const neighbors = findNeighborMeasurements(snapshot.measurementDate, usageHistory, cycle);

    if (neighbors.previous && parsed < neighbors.previous.consumedPercent) {
      validationErrors.consumedPercent =
        t('validation.consumed.lowerThanPrevious', {
          value: toDisplayPercent(neighbors.previous.consumedPercent),
          date: neighbors.previous.date
        });
      return null;
    }

    if (neighbors.next && parsed > neighbors.next.consumedPercent) {
      validationErrors.consumedPercent =
        t('validation.consumed.higherThanNext', {
          value: toDisplayPercent(neighbors.next.consumedPercent),
          date: neighbors.next.date
        });
      return null;
    }

    validationErrors.consumedPercent = '';
    return parsed;
  }

  function validateDayNoteInput(value: string): boolean {
    if (value.length > DAY_NOTE_MAX_LENGTH) {
      validationErrors.dayNote = t('validation.dayNote.maxLength', {
        max: DAY_NOTE_MAX_LENGTH
      });
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
    snapshot.consumedPercent = estimateConsumedPercentForDate(parsed, usageHistory, cycle);
    formState.consumedPercent = toDisplayPercent(snapshot.consumedPercent);
    formState.dayNote = dayNotes[parsed] ?? '';
    validationErrors.consumedPercent = '';
    validationErrors.dayNote = '';
    normalizePlanningEntries(referenceDate.value, planning, cycle);
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
    if (!isFutureDateInCycle(date, referenceDate.value, cycle)) {
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
    const futureDates = eachDayInclusive(addDays(referenceDate.value, 1), cycle.resetDate);

    if (shortcut === 'clear') {
      for (const date of futureDates) {
        delete planning[date];
      }

      return;
    }

    if (shortcut === 'workdays') {
      for (const date of futureDates) {
        if (isWeekend(date)) {
          continue;
        }

        planning[date] = 'on';
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
      persistActiveTrackerState(
        activeCycleId,
        {
          activeMeasurementDate: snapshot.measurementDate,
          usageHistory: { ...usageHistory },
          planning: { ...planning },
          dayNotes: { ...dayNotes }
        },
        referenceDate.value
      );
    },
    { deep: true }
  );

  function getExportPayload(language: AppLanguage): TokenTrackerExportPayload {
    return buildDataExportPayload({
      cycle,
      state: {
        activeMeasurementDate: snapshot.measurementDate,
        usageHistory: { ...usageHistory },
        planning: { ...planning },
        dayNotes: { ...dayNotes }
      },
      language
    });
  }

  function importFromSerializedData(raw: string): ParseDataImportResult {
    const importResult = parseDataImportPayload(raw, cycle);

    if (!importResult.ok) {
      return importResult;
    }

    applyState(importResult.state);

    return importResult;
  }

  function resetCycleData() {
    const defaults = buildDefaultCycleState(cycle, referenceDate.value);

    applyState({
      activeMeasurementDate: defaults.snapshot.measurementDate,
      usageHistory: { ...defaults.usageHistory },
      planning: { ...defaults.planning },
      dayNotes: {}
    });
  }

  function switchActiveAccount(accountId: string): boolean {
    const nextSlice = activateTrackerAccount(accountId, todayIsoDate());

    if (!nextSlice) {
      return false;
    }

    applyActiveSlice(nextSlice);
    return true;
  }

  function createAndSwitchAccount(input: CreateTrackerAccountInput) {
    const nextSlice = createTrackerAccount(input, todayIsoDate());
    applyActiveSlice(nextSlice);
  }

  return {
    cycle,
    activeAccount: activeAccount as TrackerAccount,
    accountSummaries,
    accountCycles,
    closedCycles,
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
    applyShortcut,
    switchActiveAccount,
    createAndSwitchAccount,
    getExportPayload,
    importFromSerializedData,
    resetCycleData
  };
}
