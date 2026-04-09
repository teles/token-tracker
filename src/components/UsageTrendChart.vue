<template>
  <section class="rounded-xl border border-slate-700/60 bg-slate-950/35 p-4">
    <div class="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p class="panel-title">Cumulative Usage Curve</p>
        <p class="mt-2 text-sm text-slate-300">
          Historical usage plus a pace-based projection until reset.
        </p>
      </div>
      <p class="text-xs text-slate-400">
        Click past points to edit measurements. Use Heatmap mode to toggle future ON/OFF days.
      </p>
    </div>

    <div class="h-72 w-full">
      <svg
        class="h-full w-full"
        :viewBox="`0 0 ${chart.width} ${chart.height}`"
        role="img"
        aria-label="Usage trend chart"
      >
        <g v-for="tick in yTicks" :key="tick.value">
          <line
            :x1="chart.paddingLeft"
            :y1="tick.y"
            :x2="chart.width - chart.paddingRight"
            :y2="tick.y"
            stroke="rgba(71, 85, 105, 0.45)"
            stroke-width="0.6"
          />
          <text
            :x="1"
            :y="tick.y + 1.2"
            fill="rgba(148, 163, 184, 0.7)"
            font-size="3"
            font-family="JetBrains Mono, monospace"
          >
            {{ tick.value }}%
          </text>
        </g>

        <line
          :x1="chart.paddingLeft"
          :y1="chart.paddingTop"
          :x2="chart.paddingLeft"
          :y2="chart.height - chart.paddingBottom"
          stroke="rgba(71, 85, 105, 0.65)"
          stroke-width="0.8"
        />

        <line
          :x1="chart.paddingLeft"
          :y1="chart.height - chart.paddingBottom"
          :x2="chart.width - chart.paddingRight"
          :y2="chart.height - chart.paddingBottom"
          stroke="rgba(71, 85, 105, 0.65)"
          stroke-width="0.8"
        />

        <line
          v-if="todayPoint"
          :x1="todayPoint.x"
          :y1="chart.paddingTop"
          :x2="todayPoint.x"
          :y2="chart.height - chart.paddingBottom"
          stroke="rgba(56, 189, 248, 0.45)"
          stroke-width="0.8"
          stroke-dasharray="1.2 1.2"
        />

        <polyline
          v-if="historicalPolyline"
          :points="historicalPolyline"
          fill="none"
          stroke="rgba(34, 211, 238, 0.95)"
          stroke-width="1.25"
          stroke-linecap="round"
          stroke-linejoin="round"
        />

        <polyline
          v-if="projectedPolyline"
          :points="projectedPolyline"
          fill="none"
          stroke="rgba(167, 139, 250, 0.95)"
          stroke-width="1.15"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-dasharray="1.6 1.6"
        />

        <g v-for="point in chartPoints" :key="point.date">
          <circle
            :cx="point.x"
            :cy="point.y"
            :r="getPointRadius(point)"
            :fill="getPointFill(point)"
            :stroke="getPointStroke(point)"
            :stroke-width="point.isMeasurementDay ? 0.45 : 0.25"
            :opacity="point.phase === 'projected' ? 0.9 : 1"
          />

          <circle
            v-if="point.phase === 'historical'"
            :cx="point.x"
            :cy="point.y"
            :r="2.6"
            fill="transparent"
            class="cursor-pointer"
            tabindex="0"
            :aria-label="getPointAriaLabel(point)"
            @click="emit('select-day', point.date)"
            @keydown="onPointKeydown($event, point.date)"
          />
        </g>
      </svg>
    </div>

    <div class="mt-3 flex items-center justify-between text-[11px] text-slate-400">
      <span>{{ axisStartLabel }}</span>
      <span>{{ axisTodayLabel }}</span>
      <span>{{ axisEndLabel }}</span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ISODateString, UsageChartModel, UsageChartPointModel } from '@/types/token-tracker';
import { toShortDateLabel } from '@/utils/date';

interface Props {
  model: UsageChartModel;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (event: 'select-day', value: ISODateString): void;
}>();

const chart = {
  width: 100,
  height: 64,
  paddingLeft: 6,
  paddingRight: 2,
  paddingTop: 3,
  paddingBottom: 6
};

const yTicks = computed(() => {
  const values = [0, 25, 50, 75, 100];
  const drawableHeight = chart.height - chart.paddingTop - chart.paddingBottom;

  return values.map((value) => ({
    value,
    y: chart.paddingTop + (1 - value / 100) * drawableHeight
  }));
});

const chartPoints = computed(() => {
  const points = props.model.points;
  const drawableWidth = chart.width - chart.paddingLeft - chart.paddingRight;
  const drawableHeight = chart.height - chart.paddingTop - chart.paddingBottom;
  const denominator = Math.max(1, points.length - 1);

  return points.map((point, index) => ({
    ...point,
    x: chart.paddingLeft + (index / denominator) * drawableWidth,
    y: chart.paddingTop + (1 - Math.min(100, Math.max(0, point.cumulativePercent)) / 100) * drawableHeight
  }));
});

const historicalPoints = computed(() => chartPoints.value.filter((point) => point.phase === 'historical'));

const projectedPoints = computed(() => {
  const futurePoints = chartPoints.value.filter((point) => point.phase === 'projected');
  const lastHistorical = historicalPoints.value[historicalPoints.value.length - 1];

  if (!lastHistorical || futurePoints.length === 0) {
    return [];
  }

  return [lastHistorical, ...futurePoints];
});

const todayPoint = computed(() => chartPoints.value.find((point) => point.isToday) ?? null);

const historicalPolyline = computed(() => toPolyline(historicalPoints.value));
const projectedPolyline = computed(() => toPolyline(projectedPoints.value));

const axisStartLabel = computed(() => {
  const start = props.model.points[0];
  return start ? toShortDateLabel(start.date) : '';
});

const axisTodayLabel = computed(() => {
  const today = props.model.points.find((point) => point.isToday);
  return today ? `Today · ${toShortDateLabel(today.date)}` : '';
});

const axisEndLabel = computed(() => {
  const end = props.model.points[props.model.points.length - 1];
  return end ? toShortDateLabel(end.date) : '';
});

function toPolyline(
  points: Array<{ x: number; y: number }>
): string | null {
  if (points.length < 2) {
    return null;
  }

  return points.map((point) => `${point.x},${point.y}`).join(' ');
}

function getPointRadius(point: UsageChartPointModel): number {
  if (point.isMeasurementDay) {
    return 1.5;
  }

  if (point.hasManualMeasurement) {
    return 1.35;
  }

  return point.phase === 'projected' ? 0.95 : 1.05;
}

function getPointFill(point: UsageChartPointModel): string {
  if (point.phase === 'historical') {
    return point.hasManualMeasurement ? 'rgba(103, 232, 249, 1)' : 'rgba(34, 211, 238, 0.75)';
  }

  return point.planningState === 'on'
    ? 'rgba(196, 181, 253, 0.95)'
    : 'rgba(148, 163, 184, 0.65)';
}

function getPointStroke(point: UsageChartPointModel): string {
  if (point.isMeasurementDay) {
    return 'rgba(186, 230, 253, 1)';
  }

  return point.phase === 'projected'
    ? 'rgba(196, 181, 253, 0.6)'
    : 'rgba(103, 232, 249, 0.65)';
}

function getPointAriaLabel(point: UsageChartPointModel): string {
  return `${toShortDateLabel(point.date)}, ${point.cumulativePercent.toFixed(1)} percent cumulative, click to edit`;
}

function onPointKeydown(event: KeyboardEvent, date: ISODateString) {
  if (event.key !== 'Enter' && event.key !== ' ') {
    return;
  }

  event.preventDefault();
  emit('select-day', date);
}
</script>
