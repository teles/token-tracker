<template>
  <main class="min-h-screen">
    <div class="px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
      <div class="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <PageHeader
          :language-label="languageLabel"
          current-page="history"
          workspace-key="history.workspace"
          title-key="history.title"
          subtitle-key="history.subtitle"
          @open-settings="isSettingsOpen = true"
          @navigate="emit('navigate', $event)"
        />

        <section class="panel-surface p-5 sm:p-6">
          <div class="grid gap-3 sm:grid-cols-3">
            <article class="rounded-xl border border-slate-700/60 bg-slate-900/50 p-4">
              <p class="panel-title">{{ t('history.summary.latestMeasurement') }}</p>
              <p v-if="latestMeasurement" class="mt-2 text-2xl font-semibold text-cyan-100">
                {{ formatPercent(latestMeasurement.consumedPercent) }}%
              </p>
              <p v-else class="mt-2 text-lg font-semibold text-slate-300">{{ t('history.summary.noData') }}</p>
              <p class="mt-1 text-xs text-slate-400">
                {{ latestMeasurement ? toShortDateLabel(latestMeasurement.date) : t('history.emptyHistorical') }}
              </p>
              <p class="mt-2 text-xs text-slate-500">
                {{ t('history.summary.measurementsHint', { count: manualMeasurementRecords.length }) }}
              </p>
            </article>

            <article class="rounded-xl border border-slate-700/60 bg-slate-900/50 p-4">
              <p class="panel-title">{{ t('history.summary.latestNote') }}</p>
              <p v-if="latestNote" class="mt-2 text-lg font-semibold text-amber-100">
                {{ toShortDateLabel(latestNote.date) }}
              </p>
              <p v-else class="mt-2 text-lg font-semibold text-slate-300">{{ t('history.summary.noData') }}</p>
              <p class="mt-1 text-sm text-slate-300">
                {{ latestNote ? toNotePreview(latestNote.note) : t('history.summary.noteEmpty') }}
              </p>
              <p class="mt-2 text-xs text-slate-500">
                {{ t('history.summary.notesHint', { count: noteRecords.length }) }}
              </p>
            </article>

            <article class="rounded-xl border border-slate-700/60 bg-slate-900/50 p-4">
              <p class="panel-title">{{ t('history.summary.nextOnDay') }}</p>
              <p v-if="nextFutureOn" class="mt-2 text-2xl font-semibold text-violet-100">
                {{ toShortDateLabel(nextFutureOn.date) }}
              </p>
              <p v-else class="mt-2 text-lg font-semibold text-slate-300">{{ t('history.summary.noData') }}</p>
              <p class="mt-1 text-xs text-slate-400">
                {{ nextFutureOn ? nextFutureOn.date : t('history.summary.nextOnEmpty') }}
              </p>
              <p class="mt-2 text-xs text-slate-500">
                {{ t('history.summary.futureOnHint', { count: futureOnRecords.length }) }}
              </p>
            </article>
          </div>
        </section>

        <section class="panel-surface p-5 sm:p-6">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <p class="panel-title">{{ t('usageInput.dayNote') }}</p>
            <span class="rounded-md border border-slate-700/70 bg-slate-950/70 px-2 py-1 font-mono text-[10px] text-slate-400">
              {{ formState.measurementDate }}
            </span>
          </div>

          <div class="mt-3 grid gap-3 sm:grid-cols-[180px_1fr]">
            <label class="space-y-1">
              <span class="text-xs text-slate-400">{{ t('usageInput.measurementDate') }}</span>
              <input
                type="date"
                :value="formState.measurementDate"
                :min="cycle.cycleStart"
                :max="referenceDate"
                class="w-full rounded-xl border border-slate-700/70 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-300/60"
                :class="validationErrors.measurementDate ? 'border-rose-300/60 focus:border-rose-300/70' : ''"
                @input="updateMeasurementDateInput(($event.target as HTMLInputElement).value)"
              />
            </label>

            <label class="space-y-1">
              <div class="flex items-center justify-between gap-2">
                <span class="text-xs text-slate-400">{{ t('usageInput.dayNote') }}</span>
                <span class="text-xs text-slate-500">{{ formState.dayNote.length }}/{{ dayNoteMaxLength }}</span>
              </div>
              <textarea
                :value="formState.dayNote"
                rows="2"
                :maxlength="dayNoteMaxLength"
                :placeholder="t('usageInput.dayNoteHint')"
                class="w-full resize-none rounded-xl border border-slate-700/70 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-300/60"
                :class="validationErrors.dayNote ? 'border-rose-300/60 focus:border-rose-300/70' : ''"
                @input="updateDayNoteInput(($event.target as HTMLTextAreaElement).value)"
              />
            </label>
          </div>

          <p v-if="validationErrors.measurementDate || validationErrors.dayNote" class="mt-2 text-xs text-rose-200">
            {{ validationErrors.measurementDate || validationErrors.dayNote }}
          </p>
          <p v-else class="mt-2 text-xs text-slate-500">{{ t('usageInput.dayNoteSaved') }}</p>
        </section>

        <section class="panel-surface p-5 sm:p-6">
          <div class="flex flex-wrap items-end justify-between gap-3">
            <p class="panel-title">{{ t('history.timeline') }}</p>
            <div class="space-y-1">
              <p class="text-[11px] uppercase tracking-[0.16em] text-slate-500">{{ t('history.filters.title') }}</p>
              <div class="flex flex-wrap items-center justify-end gap-2">
                <button
                  v-for="filter in filterOptions"
                  :key="filter.id"
                  type="button"
                  class="inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition"
                  :class="filter.id === activeFilter
                    ? 'border-cyan-200/80 bg-cyan-400/25 text-cyan-50 shadow-[0_0_0_1px_rgba(165,243,252,0.35)]'
                    : 'border-slate-600/70 bg-slate-900/70 text-slate-300 hover:border-slate-500/80'"
                  @click="activeFilter = filter.id"
                >
                  <span>{{ filter.label }}</span>
                  <span class="rounded border border-slate-600/60 bg-slate-950/70 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
                    {{ filter.count }}
                  </span>
                </button>

                <button
                  type="button"
                  class="inline-flex items-center rounded-lg border px-2.5 py-1.5 text-xs transition"
                  :class="showEstimatedMeasurements
                    ? 'border-slate-300/70 bg-slate-500/20 text-slate-100'
                    : 'border-slate-600/70 bg-slate-900/70 text-slate-300 hover:border-slate-500/80'"
                  @click="showEstimatedMeasurements = !showEstimatedMeasurements"
                >
                  {{ showEstimatedMeasurements ? t('history.filters.hideEstimated') : t('history.filters.showEstimated') }}
                </button>
              </div>
            </div>
          </div>

          <div class="mt-4 grid gap-4 xl:grid-cols-2">
            <article class="rounded-xl border border-slate-700/60 bg-slate-900/35 p-4">
              <div class="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p class="panel-title">{{ t('history.section.historical') }}</p>
                  <p class="mt-1 text-xs text-slate-500">{{ t('history.section.historicalHint') }}</p>
                </div>
                <span class="rounded-md border border-slate-700/70 bg-slate-950/70 px-2 py-1 font-mono text-[10px] text-slate-400">
                  {{ historicalVisibleEntries.length }}
                </span>
              </div>

              <div
                v-if="historicalVisibleEntries.length === 0"
                class="rounded-xl border border-slate-700/60 bg-slate-900/35 px-4 py-5 text-sm text-slate-400"
              >
                {{ historicalEmptyLabel }}
              </div>

              <ul v-else class="space-y-3">
                <li
                  v-for="entry in historicalVisibleEntries"
                  :key="`${entry.kind}-${entry.date}`"
                  class="rounded-xl border p-4"
                  :class="[
                    entryContainerClassByKind[entry.kind],
                    entry.kind === 'measurement' && entry.isEstimated ? 'history-estimated-entry history-estimated-muted' : ''
                  ]"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0 space-y-2">
                      <div class="flex flex-wrap items-center gap-2">
                        <span
                          class="rounded-md border px-2 py-1 text-[10px] font-medium uppercase tracking-[0.12em]"
                          :class="entryBadgeClassByKind[entry.kind]"
                        >
                          {{ entry.label }}
                        </span>
                        <span class="text-sm font-semibold text-slate-100">{{ toShortDateLabel(entry.date) }}</span>
                        <span
                          v-if="entry.kind === 'measurement' && entry.isEstimated"
                          class="history-estimated-badge rounded-md border px-2 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-slate-100"
                        >
                          {{ t('history.entry.estimated') }}
                        </span>
                      </div>
                      <p class="text-sm text-slate-200">{{ entry.detail }}</p>

                      <div
                        v-if="entry.kind === 'measurement'"
                        class="space-y-1"
                      >
                        <div class="flex flex-wrap items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            :aria-label="t('usageInput.consumedQuota')"
                            class="w-28 rounded-lg border border-slate-600/70 bg-slate-950/70 px-2.5 py-1.5 text-xs text-slate-100 outline-none transition focus:border-cyan-300/60"
                            :value="getMeasurementDraft(entry.date, entry.consumedPercent ?? 0)"
                            @input="onMeasurementDraftInput(entry.date, $event)"
                            @blur="onMeasurementDraftBlur(entry.date, entry.consumedPercent ?? 0)"
                            @keydown.enter.prevent="onMeasurementDraftEnter(entry.date, entry.consumedPercent ?? 0)"
                          />
                          <button
                            v-if="isMeasurementDraftDirty(entry.date, entry.consumedPercent ?? 0)"
                            type="button"
                            class="rounded-lg border border-cyan-300/60 bg-cyan-500/15 px-2.5 py-1.5 text-xs font-medium text-cyan-100 transition hover:border-cyan-200/70"
                            @click="saveMeasurementEdit(entry.date, entry.consumedPercent ?? 0)"
                          >
                            {{ t('history.measurementEdit.save') }}
                          </button>
                          <span
                            v-else
                            class="rounded-lg border border-slate-700/70 bg-slate-950/60 px-2.5 py-1.5 text-[11px] text-slate-400"
                          >
                            {{ t('history.measurementEdit.saved') }}
                          </span>
                        </div>
                        <p
                          v-if="measurementEditErrors[entry.date]"
                          class="text-xs text-rose-200"
                        >
                          {{ measurementEditErrors[entry.date] }}
                        </p>
                      </div>
                    </div>
                    <span class="rounded-md border border-slate-700/70 bg-slate-950/75 px-2 py-1 font-mono text-[10px] text-slate-400">
                      {{ entry.date }}
                    </span>
                  </div>
                </li>
              </ul>
            </article>

            <article class="rounded-xl border border-violet-500/30 bg-violet-900/10 p-4">
              <div class="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p class="panel-title">{{ t('history.section.futurePlanning') }}</p>
                  <p class="mt-1 text-xs text-violet-200/70">{{ t('history.section.futureHint') }}</p>
                </div>
                <span class="rounded-md border border-violet-400/40 bg-slate-950/70 px-2 py-1 font-mono text-[10px] text-violet-100">
                  {{ futureVisiblePlanningDays.length }}
                </span>
              </div>

              <div
                v-if="futureVisiblePlanningDays.length === 0"
                class="rounded-xl border border-violet-500/30 bg-slate-900/35 px-4 py-5 text-sm text-slate-300"
              >
                {{ futureEmptyLabel }}
              </div>

              <ul v-else class="space-y-3">
                <li
                  v-for="day in futureVisiblePlanningDays"
                  :key="day.date"
                  class="rounded-xl border p-4"
                  :class="planningCardClassByState[day.state]"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0 space-y-2">
                      <div class="flex flex-wrap items-center gap-2">
                        <span class="text-sm font-semibold text-slate-100">{{ toShortDateLabel(day.date) }}</span>
                        <span
                          class="rounded-md border px-2 py-1 text-[10px] font-medium uppercase tracking-[0.12em]"
                          :class="planningStateBadgeClassByState[day.state]"
                        >
                          {{ day.state === 'on' ? t('history.planning.state.on') : t('history.planning.state.off') }}
                        </span>
                      </div>
                      <p class="text-xs text-slate-400">{{ day.date }}</p>
                    </div>

                    <button
                      type="button"
                      class="rounded-lg border px-2.5 py-1.5 text-xs font-medium transition"
                      :class="day.state === 'on'
                        ? 'border-rose-300/60 bg-rose-500/15 text-rose-100 hover:border-rose-200/70'
                        : 'border-cyan-300/60 bg-cyan-500/15 text-cyan-100 hover:border-cyan-200/70'"
                      @click="toggleFutureDay(day.date)"
                    >
                      {{ day.state === 'on' ? t('history.planning.action.turnOff') : t('history.planning.action.turnOn') }}
                    </button>
                  </div>
                </li>
              </ul>
            </article>
          </div>
        </section>
      </div>
    </div>

    <ProjectFooter />
    <SettingsModal
      :open="isSettingsOpen"
      :language="language"
      @close="isSettingsOpen = false"
      @update:language="setLanguage($event)"
    />
  </main>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import PageHeader from '@/components/PageHeader.vue';
import ProjectFooter from '@/components/ProjectFooter.vue';
import SettingsModal from '@/components/SettingsModal.vue';
import { useI18n } from '@/composables/useI18n';
import { useTokenTrackerState } from '@/composables/useTokenTrackerState';
import { estimateConsumedPercentForDate, findNeighborMeasurements } from '@/domain/usage-history';
import { useUiLanguage } from '@/composables/useUiLanguage';
import { appLanguageDescriptorByValue } from '@/types/app-settings';
import type { ISODateString } from '@/types/token-tracker';
import { addDays, eachDayInclusive, isBefore, isBetweenInclusive, todayIsoDate, toShortDateLabel } from '@/utils/date';
import { formatPercent } from '@/utils/format';

type HistoryEntryKind = 'measurement' | 'note';
type HistoryFilter = 'all' | HistoryEntryKind | 'planning';
type PlanningState = 'on' | 'off';

interface HistoryEntry {
  date: ISODateString;
  kind: HistoryEntryKind;
  label: string;
  detail: string;
  consumedPercent?: number;
  isEstimated?: boolean;
}

interface MeasurementRecord {
  date: ISODateString;
  consumedPercent: number;
  isEstimated: boolean;
}

interface NoteRecord {
  date: ISODateString;
  note: string;
}

interface FuturePlanningRecord {
  date: ISODateString;
  state: PlanningState;
}

const emit = defineEmits<{
  (event: 'navigate', page: 'tracker' | 'history'): void;
}>();

const { t } = useI18n();
const { language, setLanguage } = useUiLanguage();
const languageLabel = computed(() => t(appLanguageDescriptorByValue[language.value].badgeLabelKey));
const isSettingsOpen = ref(false);
const activeFilter = ref<HistoryFilter>('all');
const showEstimatedMeasurements = ref(false);
const measurementDrafts = reactive<Partial<Record<ISODateString, string>>>({});
const measurementEditErrors = reactive<Partial<Record<ISODateString, string>>>({});

const {
  cycle,
  formState,
  dayNoteMaxLength,
  validationErrors,
  usageHistory,
  dayNotes,
  planning,
  updateMeasurementDateInput,
  updateDayNoteInput,
  toggleFutureDay
} = useTokenTrackerState();

function resolveReferenceDate(): ISODateString {
  const today = todayIsoDate();

  if (isBefore(today, cycle.cycleStart)) {
    return cycle.cycleStart;
  }

  if (isBefore(cycle.resetDate, today)) {
    return cycle.resetDate;
  }

  return today;
}

const referenceDate = resolveReferenceDate();

function toDisplayPercent(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function toNotePreview(note: string): string {
  const normalized = note.trim();
  const maxLength = 58;

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 3)}...`;
}

function getMeasurementDraft(date: ISODateString, currentValue: number): string {
  return measurementDrafts[date] ?? toDisplayPercent(currentValue);
}

function isMeasurementDraftDirty(date: ISODateString, currentValue: number): boolean {
  const normalizedCurrent = toDisplayPercent(currentValue);
  const normalizedDraft = getMeasurementDraft(date, currentValue).trim().replace(',', '.');

  if (normalizedDraft.length === 0) {
    return true;
  }

  return normalizedDraft !== normalizedCurrent;
}

function onMeasurementDraftInput(date: ISODateString, event: Event) {
  const target = event.target as HTMLInputElement;
  measurementDrafts[date] = target.value;
  measurementEditErrors[date] = '';
}

function onMeasurementDraftBlur(date: ISODateString, currentValue: number) {
  if (!isMeasurementDraftDirty(date, currentValue)) {
    return;
  }

  saveMeasurementEdit(date, currentValue);
}

function onMeasurementDraftEnter(date: ISODateString, currentValue: number) {
  saveMeasurementEdit(date, currentValue);
}

function saveMeasurementEdit(date: ISODateString, currentValue: number) {
  if (!isMeasurementDraftDirty(date, currentValue)) {
    measurementEditErrors[date] = '';
    measurementDrafts[date] = toDisplayPercent(currentValue);
    return;
  }

  const rawValue = getMeasurementDraft(date, currentValue).trim().replace(',', '.');

  if (rawValue.length === 0) {
    measurementEditErrors[date] = t('validation.consumed.required');
    return;
  }

  const parsed = Number(rawValue);

  if (!Number.isFinite(parsed)) {
    measurementEditErrors[date] = t('validation.consumed.invalid');
    return;
  }

  if (parsed < 0 || parsed > cycle.quotaPercent) {
    measurementEditErrors[date] = t('validation.consumed.outOfRange', {
      max: cycle.quotaPercent
    });
    return;
  }

  const neighbors = findNeighborMeasurements(date, usageHistory, cycle);

  if (neighbors.previous && parsed < neighbors.previous.consumedPercent) {
    measurementEditErrors[date] = t('validation.consumed.lowerThanPrevious', {
      value: toDisplayPercent(neighbors.previous.consumedPercent),
      date: toShortDateLabel(neighbors.previous.date)
    });
    return;
  }

  if (neighbors.next && parsed > neighbors.next.consumedPercent) {
    measurementEditErrors[date] = t('validation.consumed.higherThanNext', {
      value: toDisplayPercent(neighbors.next.consumedPercent),
      date: toShortDateLabel(neighbors.next.date)
    });
    return;
  }

  usageHistory[date] = parsed;
  measurementDrafts[date] = toDisplayPercent(parsed);
  measurementEditErrors[date] = '';
}

const measurementRecords = computed<MeasurementRecord[]>(() => {
  return eachDayInclusive(cycle.cycleStart, referenceDate)
    .map((date) => ({
      date,
      consumedPercent: estimateConsumedPercentForDate(date, usageHistory, cycle),
      isEstimated: !Number.isFinite(usageHistory[date])
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
});

const manualMeasurementRecords = computed(() =>
  measurementRecords.value.filter((record) => !record.isEstimated)
);

const noteRecords = computed<NoteRecord[]>(() => {
  return (Object.entries(dayNotes) as Array<[ISODateString, string]>)
    .filter(([date, note]) => (
      typeof note === 'string' &&
      note.trim().length > 0 &&
      isBetweenInclusive(date, cycle.cycleStart, referenceDate)
    ))
    .map(([date, note]) => ({
      date,
      note: note.trim()
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
});

const futurePlanningRecords = computed<FuturePlanningRecord[]>(() => {
  const futureDates = eachDayInclusive(addDays(referenceDate, 1), cycle.resetDate);

  return futureDates.map((date) => ({
    date,
    state: planning[date] === 'on' ? 'on' : 'off'
  }));
});

const futureOnRecords = computed(() =>
  futurePlanningRecords.value.filter((record) => record.state === 'on')
);

const latestMeasurement = computed(() => manualMeasurementRecords.value[0] ?? null);
const latestNote = computed(() => noteRecords.value[0] ?? null);
const nextFutureOn = computed(() => futureOnRecords.value[0] ?? null);

const measurementEntries = computed<HistoryEntry[]>(() => (
  measurementRecords.value.map((record) => ({
    date: record.date,
    kind: 'measurement',
    label: t('history.entry.measurement'),
    consumedPercent: record.consumedPercent,
    isEstimated: record.isEstimated,
    detail: t('history.entry.measuredDetail', {
      value: `${formatPercent(record.consumedPercent)}%`
    })
  }))
));

const noteEntries = computed<HistoryEntry[]>(() => (
  noteRecords.value.map((record) => ({
    date: record.date,
    kind: 'note',
    label: t('history.entry.note'),
    detail: t('history.entry.noteDetail', {
      value: record.note
    })
  }))
));

const historicalEntries = computed(() =>
  [...measurementEntries.value, ...noteEntries.value]
    .sort((a, b) => b.date.localeCompare(a.date))
);

const filterOptions = computed<Array<{ id: HistoryFilter; label: string; count: number }>>(() => [
  {
    id: 'all',
    label: t('history.filters.all'),
    count: historicalVisibleEntries.value.length + futurePlanningRecords.value.length
  },
  {
    id: 'measurement',
    label: t('history.filters.measurement'),
    count: showEstimatedMeasurements.value
      ? measurementEntries.value.length
      : manualMeasurementRecords.value.length
  },
  {
    id: 'note',
    label: t('history.filters.note'),
    count: noteEntries.value.length
  },
  {
    id: 'planning',
    label: t('history.filters.planning'),
    count: futurePlanningRecords.value.length
  }
]);

const historicalVisibleEntries = computed(() => {
  const filteredByType =
    activeFilter.value === 'planning'
      ? []
      : activeFilter.value === 'all'
        ? historicalEntries.value
        : historicalEntries.value.filter((entry) => entry.kind === activeFilter.value);

  if (showEstimatedMeasurements.value) {
    return filteredByType;
  }

  return filteredByType.filter((entry) => !(entry.kind === 'measurement' && entry.isEstimated));
});

const futureVisiblePlanningDays = computed(() => {
  if (activeFilter.value !== 'all' && activeFilter.value !== 'planning') {
    return [];
  }

  return futurePlanningRecords.value;
});

const historicalEmptyLabel = computed(() =>
  activeFilter.value === 'planning'
    ? t('history.emptyFiltered')
    : t('history.emptyHistorical')
);

const futureEmptyLabel = computed(() =>
  activeFilter.value === 'all' || activeFilter.value === 'planning'
    ? t('history.emptyFuture')
    : t('history.emptyFiltered')
);

const entryContainerClassByKind: Record<HistoryEntryKind, string> = {
  measurement: 'border-cyan-300/50 bg-cyan-500/10',
  note: 'border-amber-300/50 bg-amber-500/10'
};

const entryBadgeClassByKind: Record<HistoryEntryKind, string> = {
  measurement: 'border-cyan-200/50 bg-cyan-500/20 text-cyan-100',
  note: 'border-amber-200/50 bg-amber-500/20 text-amber-100'
};

const planningCardClassByState: Record<PlanningState, string> = {
  on: 'history-future-on border-violet-300/50 bg-violet-600/15',
  off: 'border-slate-600/70 bg-slate-900/45'
};

const planningStateBadgeClassByState: Record<PlanningState, string> = {
  on: 'border-violet-200/50 bg-violet-500/25 text-violet-100',
  off: 'border-slate-500/70 bg-slate-700/60 text-slate-200'
};
</script>

<style scoped>
.history-future-on {
  background-image: repeating-linear-gradient(
    -45deg,
    rgba(167, 139, 250, 0.2) 0 2px,
    transparent 2px 8px
  );
}

.history-estimated-entry {
  background-image: repeating-linear-gradient(
    -45deg,
    rgba(148, 163, 184, 0.18) 0 2px,
    transparent 2px 8px
  );
}

.history-estimated-muted {
  opacity: 0.74;
}

.history-estimated-badge {
  border-color: rgba(148, 163, 184, 0.55);
  background-image: repeating-linear-gradient(
    -45deg,
    rgba(148, 163, 184, 0.26) 0 2px,
    transparent 2px 8px
  );
}
</style>
