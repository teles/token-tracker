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
                {{ t('history.summary.measurementsHint', { count: measurementRecords.length }) }}
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
                    ? 'border-cyan-300/60 bg-cyan-500/15 text-cyan-100'
                    : 'border-slate-600/70 bg-slate-900/70 text-slate-300 hover:border-slate-500/80'"
                  @click="activeFilter = filter.id"
                >
                  <span>{{ filter.label }}</span>
                  <span class="rounded border border-slate-600/60 bg-slate-950/70 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
                    {{ filter.count }}
                  </span>
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
                  :class="entryContainerClassByKind[entry.kind]"
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
                      </div>
                      <p class="text-sm text-slate-200">{{ entry.detail }}</p>
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
                  {{ futureVisibleEntries.length }}
                </span>
              </div>

              <div
                v-if="futureVisibleEntries.length === 0"
                class="rounded-xl border border-violet-500/30 bg-slate-900/35 px-4 py-5 text-sm text-slate-300"
              >
                {{ futureEmptyLabel }}
              </div>

              <ul v-else class="space-y-3">
                <li
                  v-for="entry in futureVisibleEntries"
                  :key="`${entry.kind}-${entry.date}`"
                  class="rounded-xl border p-4"
                  :class="entryContainerClassByKind[entry.kind]"
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
                      </div>
                      <p class="text-sm text-slate-200">{{ entry.detail }}</p>
                    </div>
                    <span class="rounded-md border border-violet-400/40 bg-slate-950/75 px-2 py-1 font-mono text-[10px] text-violet-100">
                      {{ entry.date }}
                    </span>
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
import { computed, ref } from 'vue';
import PageHeader from '@/components/PageHeader.vue';
import ProjectFooter from '@/components/ProjectFooter.vue';
import SettingsModal from '@/components/SettingsModal.vue';
import { useI18n } from '@/composables/useI18n';
import { useUiLanguage } from '@/composables/useUiLanguage';
import { initialCycle, initialPlanning, initialUsageHistory } from '@/mocks/initial-data';
import { loadPersistedState } from '@/services/persistence';
import { appLanguageDescriptorByValue } from '@/types/app-settings';
import type { DayNotesMap, ISODateString, PlanningMap, UsageHistoryMap } from '@/types/token-tracker';
import { addDays, eachDayInclusive, isBefore, isBetweenInclusive, todayIsoDate, toShortDateLabel } from '@/utils/date';
import { formatPercent } from '@/utils/format';

type HistoryEntryKind = 'measurement' | 'note' | 'future-on';
type HistoryFilter = 'all' | HistoryEntryKind;

interface HistoryEntry {
  date: ISODateString;
  kind: HistoryEntryKind;
  label: string;
  detail: string;
}

interface MeasurementRecord {
  date: ISODateString;
  consumedPercent: number;
}

interface NoteRecord {
  date: ISODateString;
  note: string;
}

interface FutureOnRecord {
  date: ISODateString;
}

const emit = defineEmits<{
  (event: 'navigate', page: 'tracker' | 'history'): void;
}>();

const { t } = useI18n();
const { language, setLanguage } = useUiLanguage();
const languageLabel = computed(() => t(appLanguageDescriptorByValue[language.value].badgeLabelKey));
const isSettingsOpen = ref(false);
const activeFilter = ref<HistoryFilter>('all');

function resolveReferenceDate(): ISODateString {
  const today = todayIsoDate();

  if (isBefore(today, initialCycle.cycleStart)) {
    return initialCycle.cycleStart;
  }

  if (isBefore(initialCycle.resetDate, today)) {
    return initialCycle.resetDate;
  }

  return today;
}

const referenceDate = resolveReferenceDate();
const restored = loadPersistedState(initialCycle);

const usageHistory: UsageHistoryMap = restored?.usageHistory
  ? { ...restored.usageHistory }
  : { ...initialUsageHistory };
const planning: PlanningMap = restored?.planning ? { ...restored.planning } : { ...initialPlanning };
const dayNotes: DayNotesMap = restored?.dayNotes ? { ...restored.dayNotes } : {};

function sortByDateAsc<T extends { date: ISODateString }>(entries: T[]): T[] {
  return [...entries].sort((a, b) => a.date.localeCompare(b.date));
}

function toNotePreview(note: string): string {
  const normalized = note.trim();
  const maxLength = 58;

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 3)}...`;
}

const measurementRecords = computed<MeasurementRecord[]>(() => {
  return (Object.entries(usageHistory) as Array<[ISODateString, number]>)
    .filter(([date, consumedPercent]) => (
      typeof consumedPercent === 'number' &&
      isBetweenInclusive(date, initialCycle.cycleStart, referenceDate)
    ))
    .map(([date, consumedPercent]) => ({
      date,
      consumedPercent
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
});

const noteRecords = computed<NoteRecord[]>(() => {
  return (Object.entries(dayNotes) as Array<[ISODateString, string]>)
    .filter(([date, note]) => (
      typeof note === 'string' &&
      note.trim().length > 0 &&
      isBetweenInclusive(date, initialCycle.cycleStart, referenceDate)
    ))
    .map(([date, note]) => ({
      date,
      note: note.trim()
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
});

const futureOnRecords = computed<FutureOnRecord[]>(() => {
  const futureDates = eachDayInclusive(addDays(referenceDate, 1), initialCycle.resetDate);

  return futureDates
    .filter((date) => planning[date] === 'on')
    .map((date) => ({ date }))
    .sort((a, b) => a.date.localeCompare(b.date));
});

const latestMeasurement = computed(() => measurementRecords.value[0] ?? null);
const latestNote = computed(() => noteRecords.value[0] ?? null);
const nextFutureOn = computed(() => futureOnRecords.value[0] ?? null);

const measurementEntries = computed<HistoryEntry[]>(() => (
  measurementRecords.value.map((record) => ({
    date: record.date,
    kind: 'measurement',
    label: t('history.entry.measurement'),
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

const futureOnEntries = computed<HistoryEntry[]>(() => (
  futureOnRecords.value.map((record) => ({
    date: record.date,
    kind: 'future-on',
    label: t('history.entry.plannedOn'),
    detail: t('history.entry.plannedOnDetail')
  }))
));

const entryOrderByKind: Record<Exclude<HistoryFilter, 'all'>, number> = {
  measurement: 0,
  note: 1,
  'future-on': 2
};

const historicalEntries = computed(() =>
  [...measurementEntries.value, ...noteEntries.value]
    .sort((a, b) => {
      const byDate = b.date.localeCompare(a.date);
      return byDate !== 0 ? byDate : entryOrderByKind[a.kind] - entryOrderByKind[b.kind];
    })
);

const futureEntries = computed(() => sortByDateAsc(futureOnEntries.value));

const filterOptions = computed<Array<{ id: HistoryFilter; label: string; count: number }>>(() => [
  {
    id: 'all',
    label: t('history.filters.all'),
    count: historicalEntries.value.length + futureEntries.value.length
  },
  {
    id: 'measurement',
    label: t('history.filters.measurement'),
    count: measurementEntries.value.length
  },
  {
    id: 'note',
    label: t('history.filters.note'),
    count: noteEntries.value.length
  },
  {
    id: 'future-on',
    label: t('history.filters.futureOn'),
    count: futureEntries.value.length
  }
]);

const historicalVisibleEntries = computed(() => {
  if (activeFilter.value === 'future-on') {
    return [];
  }

  if (activeFilter.value === 'all') {
    return historicalEntries.value;
  }

  return historicalEntries.value.filter((entry) => entry.kind === activeFilter.value);
});

const futureVisibleEntries = computed(() => {
  if (activeFilter.value !== 'all' && activeFilter.value !== 'future-on') {
    return [];
  }

  return futureEntries.value;
});

const historicalEmptyLabel = computed(() =>
  activeFilter.value === 'future-on'
    ? t('history.emptyFiltered')
    : t('history.emptyHistorical')
);

const futureEmptyLabel = computed(() =>
  activeFilter.value !== 'all' && activeFilter.value !== 'future-on'
    ? t('history.emptyFiltered')
    : t('history.emptyFuture')
);

const entryContainerClassByKind: Record<HistoryEntryKind, string> = {
  measurement: 'border-cyan-300/50 bg-cyan-500/10',
  note: 'border-amber-300/50 bg-amber-500/10',
  'future-on': 'history-future-entry border-violet-300/50 bg-violet-600/15'
};

const entryBadgeClassByKind: Record<HistoryEntryKind, string> = {
  measurement: 'border-cyan-200/50 bg-cyan-500/20 text-cyan-100',
  note: 'border-amber-200/50 bg-amber-500/20 text-amber-100',
  'future-on': 'border-violet-200/50 bg-violet-500/25 text-violet-100'
};
</script>

<style scoped>
.history-future-entry {
  background-image: repeating-linear-gradient(
    -45deg,
    rgba(167, 139, 250, 0.2) 0 2px,
    transparent 2px 8px
  );
}
</style>
