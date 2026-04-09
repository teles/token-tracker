<template>
  <section class="panel-surface p-5 sm:p-6">
    <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="panel-title">{{ temporalUsageLabel }}</p>
        <h2 class="mt-2 text-lg font-semibold text-slate-100">{{ monthLabel }}</h2>
      </div>

      <div class="space-y-2 sm:text-right">
        <div class="inline-flex rounded-xl border border-slate-700/80 bg-slate-900/80 p-1">
          <button
            v-for="mode in viewModes"
            :key="mode.value"
            type="button"
            class="rounded-lg px-3 py-1.5 text-xs font-medium transition"
            :class="mode.value === viewMode
              ? 'bg-cyan-500/20 text-cyan-100 shadow-[0_0_0_1px_rgba(103,232,249,0.25)]'
              : 'text-slate-400 hover:text-slate-200'"
            :aria-pressed="mode.value === viewMode"
            @click="emit('change-view', mode.value)"
          >
            {{ mode.label }}
          </button>
        </div>

        <p class="text-xs text-slate-400">
          {{ interactionHint }}
        </p>
      </div>
    </div>

    <template v-if="viewMode === 'heatmap'">
      <div class="grid grid-cols-7 gap-2 text-[11px] uppercase tracking-[0.16em] text-slate-500">
        <span v-for="weekday in weekdays" :key="weekday" class="px-1 py-1 text-center">
          {{ weekday }}
        </span>
      </div>

      <div class="mt-2 grid grid-cols-7 gap-2">
        <button
          v-for="day in days"
          :key="day.date"
          type="button"
          class="grid-cell"
          :class="getCellClasses(day)"
          :disabled="!day.isCurrentMonth || !day.isInCycle"
          :aria-label="getAriaLabel(day)"
          :title="getAriaLabel(day)"
          :aria-pressed="day.isFuture ? day.planningState === 'on' : undefined"
          @click="handlePrimaryAction(day)"
          @keydown="onCellKeydown($event, day)"
          :ref="(el) => setCellRef(day.date, el)"
        >
          <span
            v-if="day.hasNote && day.isCurrentMonth && day.isInCycle"
            class="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-amber-200/90 ring-1 ring-amber-300/50"
            aria-hidden="true"
          />
          <span class="font-mono text-xs" :class="day.isCurrentMonth ? 'text-slate-100' : 'text-slate-600'">
            {{ day.dayNumber }}
          </span>
          <span v-if="day.isMeasurementDay" class="absolute bottom-1 left-2 text-[10px] text-cyan-200">{{ measuredLabel }}</span>
        </button>
      </div>
    </template>

    <UsageTrendChart
      v-else
      :model="chartModel"
      @select-day="emit('select-day', $event)"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, ref, type ComponentPublicInstance } from 'vue';
import { useI18n } from '@/composables/useI18n';
import UsageTrendChart from '@/components/UsageTrendChart.vue';
import type {
  CalendarDayModel,
  ISODateString,
  TemporalViewMode,
  UsageChartModel
} from '@/types/token-tracker';
import { toShortDateLabel } from '@/utils/date';

interface Props {
  days: CalendarDayModel[];
  viewMode: TemporalViewMode;
  chartModel: UsageChartModel;
  monthLabel: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (event: 'toggle-day', value: ISODateString): void;
  (event: 'select-day', value: ISODateString): void;
  (event: 'change-view', value: TemporalViewMode): void;
}>();

const { t } = useI18n();

const weekdays = computed(() =>
  [
    t('calendarHeatmap.weekday.mon'),
    t('calendarHeatmap.weekday.tue'),
    t('calendarHeatmap.weekday.wed'),
    t('calendarHeatmap.weekday.thu'),
    t('calendarHeatmap.weekday.fri'),
    t('calendarHeatmap.weekday.sat'),
    t('calendarHeatmap.weekday.sun')
  ]
);

const viewModes = computed<Array<{ value: TemporalViewMode; label: string }>>(() => [
  { value: 'heatmap', label: t('calendarHeatmap.view.heatmap') },
  { value: 'chart', label: t('calendarHeatmap.view.chart') }
]);

const temporalUsageLabel = computed(() => t('calendarHeatmap.temporalUsage'));
const measuredLabel = computed(() => t('calendarHeatmap.measured'));

const interactionHint = computed(() =>
  props.viewMode === 'heatmap'
    ? t('calendarHeatmap.interaction.heatmap')
    : t('calendarHeatmap.interaction.chart')
);

const pastIntensityClassMap = {
  0: 'bg-slate-900/70 border-slate-800/60',
  1: 'bg-emerald-950/50 border-emerald-900/60',
  2: 'bg-emerald-900/55 border-emerald-700/70',
  3: 'bg-cyan-800/60 border-cyan-500/60',
  4: 'bg-cyan-500/50 border-cyan-300/70'
} as const;

const futurePlanningClassMap = {
  on: 'bg-violet-700/45 border-violet-300/80 text-violet-100 shadow-[0_0_0_1px_rgba(167,139,250,0.35)]',
  off: 'bg-slate-800/70 border-slate-600/70 text-slate-500'
} as const;

const cellRefs = ref<Record<string, HTMLButtonElement | null>>({});
const recentToggleDate = ref<ISODateString | null>(null);

function setCellRef(
  date: ISODateString,
  element: Element | ComponentPublicInstance | null
) {
  if (element instanceof HTMLButtonElement) {
    cellRefs.value[date] = element;
    return;
  }

  if (element && '$el' in element && element.$el instanceof HTMLButtonElement) {
    cellRefs.value[date] = element.$el;
    return;
  }

  cellRefs.value[date] = null;
}

function focusDate(date: ISODateString) {
  const cell = cellRefs.value[date];

  if (cell) {
    cell.focus();
  }
}

function handlePrimaryAction(day: CalendarDayModel) {
  if (day.isFuture) {
    emit('toggle-day', day.date);
    recentToggleDate.value = day.date;

    setTimeout(() => {
      if (recentToggleDate.value === day.date) {
        recentToggleDate.value = null;
      }
    }, 220);
    return;
  }

  if (day.isInCycle) {
    emit('select-day', day.date);
  }
}

function onCellKeydown(event: KeyboardEvent, day: CalendarDayModel) {
  if (!day.isCurrentMonth || !day.isInCycle) {
    return;
  }

  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    handlePrimaryAction(day);
    return;
  }

  const offsetByKey: Record<string, number> = {
    ArrowRight: 1,
    ArrowLeft: -1,
    ArrowDown: 7,
    ArrowUp: -7
  };

  const offset = offsetByKey[event.key];

  if (!offset) {
    return;
  }

  event.preventDefault();

  const currentIndex = props.days.findIndex((item) => item.date === day.date);
  const candidate = props.days[currentIndex + offset];

  if (candidate && candidate.isInCycle && candidate.isCurrentMonth) {
    focusDate(candidate.date);
  }
}

function getAriaLabel(day: CalendarDayModel): string {
  const dateLabel = toShortDateLabel(day.date);
  const noteLabel = day.hasNote
    ? t('calendarHeatmap.aria.noteSuffix')
    : '';
  const estimatedLabel = day.hasEstimatedUsage
    ? t('calendarHeatmap.aria.estimatedSuffix')
    : '';

  if (!day.isCurrentMonth) {
    return t('calendarHeatmap.aria.outsideMonth', {
      date: dateLabel,
      noteSuffix: noteLabel,
      estimatedSuffix: estimatedLabel
    });
  }

  if (day.isPast) {
    return t('calendarHeatmap.aria.past', {
      date: dateLabel,
      intensity: day.pastIntensity,
      noteSuffix: noteLabel,
      estimatedSuffix: estimatedLabel
    });
  }

  if (day.isFuture) {
    return t('calendarHeatmap.aria.future', {
      date: dateLabel,
      state: t(day.planningState === 'on' ? 'calendarHeatmap.state.on' : 'calendarHeatmap.state.off'),
      noteSuffix: noteLabel,
      estimatedSuffix: estimatedLabel
    });
  }

  if (day.isMeasurementDay) {
    return t('calendarHeatmap.aria.measurementDay', {
      date: dateLabel,
      noteSuffix: noteLabel,
      estimatedSuffix: estimatedLabel
    });
  }

  if (day.isToday) {
    return t('calendarHeatmap.aria.today', {
      date: dateLabel,
      noteSuffix: noteLabel,
      estimatedSuffix: estimatedLabel
    });
  }

  return t('calendarHeatmap.aria.default', {
    date: dateLabel,
    noteSuffix: noteLabel,
    estimatedSuffix: estimatedLabel
  });
}

function getCellClasses(day: CalendarDayModel): string[] {
  const classes = ['justify-between'];

  if (!day.isCurrentMonth || !day.isInCycle) {
    classes.push('cursor-default bg-slate-950/20 border-slate-900/40');
    return classes;
  }

  if (day.isPast) {
    classes.push(
      pastIntensityClassMap[day.pastIntensity],
      'cursor-pointer hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-950'
    );
  } else if (day.isFuture) {
    classes.push(
      'cursor-pointer active:scale-[0.97] hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/80 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-950',
      futurePlanningClassMap[day.planningState]
    );

    if (recentToggleDate.value === day.date) {
      classes.push('toggle-pop');
    }
  } else {
    classes.push(
      'bg-indigo-900/40 border-indigo-500/50 cursor-pointer hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-950'
    );
  }

  if (day.isToday) {
    classes.push('ring-1 ring-cyan-300/70 shadow-glow');
  }

  if (day.hasEstimatedUsage) {
    classes.push('estimated-usage-cell');
  }

  return classes;
}
</script>
