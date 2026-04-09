<template>
  <section class="panel-surface p-4">
    <div v-if="mode === 'heatmap'" class="grid gap-4 md:grid-cols-2">
      <div class="space-y-3">
        <div class="space-y-2">
          <p class="panel-title">{{ pastUsageIntensityLabel }}</p>
          <div class="flex items-center gap-2">
            <span class="text-xs text-slate-400">{{ lowLabel }}</span>
            <div
              v-for="(tone, index) in intensityTones"
              :key="index"
              class="h-4 w-6 rounded-md border"
              :class="tone"
            />
            <span class="text-xs text-slate-400">{{ highLabel }}</span>
          </div>
        </div>

        <div class="space-y-2">
          <p class="panel-title">{{ pastDerivedValuesLabel }}</p>
          <div class="flex flex-wrap gap-2 text-xs">
            <span
              v-for="item in pastDerivedLegend"
              :key="item.label"
              class="rounded-lg border px-2 py-1"
              :class="item.className"
            >
              {{ item.label }}
            </span>
          </div>
        </div>
      </div>

      <div class="space-y-3">
        <div class="space-y-2">
          <p class="panel-title">{{ futurePlanningStatesLabel }}</p>
          <div class="flex flex-wrap gap-2 text-xs">
            <span
              v-for="item in futurePlanningLegend"
              :key="item.label"
              class="rounded-lg border px-2 py-1"
              :class="item.className"
            >
              {{ item.label }}
            </span>
          </div>
        </div>

        <div class="space-y-2">
          <p class="panel-title">{{ dayMarkersLabel }}</p>
          <div class="flex flex-wrap gap-2 text-xs">
            <span
              v-for="item in dayMarkersLegend"
              :key="item.label"
              class="rounded-lg border px-2 py-1"
              :class="item.className"
            >
              {{ item.label }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="grid gap-4 md:grid-cols-2">
      <div class="space-y-2">
        <p class="panel-title">{{ usageCurvesLabel }}</p>
        <div class="flex flex-wrap items-center gap-3 text-xs text-slate-300">
          <span class="inline-flex items-center gap-2">
            <span class="h-2 w-5 rounded-full bg-cyan-300/90"></span>
            {{ historicalCumulativeLabel }}
          </span>
          <span class="inline-flex items-center gap-2">
            <span class="h-2 w-5 rounded-full border border-violet-300/70 bg-violet-300/35"></span>
            {{ projectedAtCurrentPaceLabel }}
          </span>
        </div>
      </div>

      <div class="space-y-2">
        <p class="panel-title">{{ pointMeaningLabel }}</p>
        <div class="flex flex-wrap gap-2 text-xs">
          <span class="rounded-lg border border-cyan-200/70 bg-cyan-300/15 px-2 py-1 text-cyan-100">
            {{ manualMeasurementLabel }}
          </span>
          <span class="rounded-lg border border-violet-300/70 bg-violet-700/35 px-2 py-1 text-violet-100">
            {{ futureOnDayLabel }}
          </span>
          <span class="rounded-lg border border-slate-600/70 bg-slate-800/70 px-2 py-1 text-slate-300">
            {{ futureOffDayLabel }}
          </span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from '@/composables/useI18n';
import type { TemporalViewMode } from '@/types/token-tracker';

interface Props {
  mode: TemporalViewMode;
}

defineProps<Props>();

const { t } = useI18n();

const intensityTones = [
  'bg-slate-900/70 border-slate-800/70',
  'bg-emerald-950/50 border-emerald-900/60',
  'bg-emerald-900/55 border-emerald-700/70',
  'bg-cyan-800/60 border-cyan-500/60',
  'bg-cyan-500/50 border-cyan-300/70'
];

const futurePlanningLegend = computed(() => [
  {
    label: t('calendarLegend.usageOn'),
    className: 'border-violet-300/80 bg-violet-700/45 text-violet-100'
  },
  {
    label: t('calendarLegend.usageOff'),
    className: 'border-slate-600/70 bg-slate-800/70 text-slate-400'
  }
]);

const dayMarkersLegend = computed(() => [
  {
    label: t('calendarLegend.hasNote'),
    className: 'border-amber-300/60 bg-amber-500/15 text-amber-100'
  }
]);

const pastDerivedLegend = computed(() => [
  {
    label: t('calendarLegend.estimatedUsage'),
    className: 'estimated-legend-chip border-slate-400/50 bg-slate-700/30 text-slate-200'
  }
]);

const lowLabel = computed(() => t('calendarLegend.low'));
const highLabel = computed(() => t('calendarLegend.high'));
const pastUsageIntensityLabel = computed(() => t('calendarLegend.pastUsageIntensity'));
const pastDerivedValuesLabel = computed(() => t('calendarLegend.pastDerivedValues'));
const futurePlanningStatesLabel = computed(() => t('calendarLegend.futurePlanningStates'));
const dayMarkersLabel = computed(() => t('calendarLegend.dayMarkers'));
const usageCurvesLabel = computed(() => t('calendarLegend.usageCurves'));
const historicalCumulativeLabel = computed(() => t('calendarLegend.historicalCumulative'));
const projectedAtCurrentPaceLabel = computed(() => t('calendarLegend.projectedAtCurrentPace'));
const pointMeaningLabel = computed(() => t('calendarLegend.pointMeaning'));
const manualMeasurementLabel = computed(() => t('calendarLegend.manualMeasurement'));
const futureOnDayLabel = computed(() => t('calendarLegend.futureOnDay'));
const futureOffDayLabel = computed(() => t('calendarLegend.futureOffDay'));
</script>
