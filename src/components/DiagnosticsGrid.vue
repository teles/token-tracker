<template>
  <section class="panel-surface p-5 sm:p-6">
    <div class="mb-4">
      <p class="panel-title">Diagnosis & Projection</p>
      <h2 class="mt-2 text-lg font-semibold text-slate-100">Quota Health</h2>
    </div>

    <div class="grid gap-3 sm:grid-cols-2">
      <StatCard
        title="Overall Status"
        :value="statusLabel"
        :hint="statusHint"
        :tone="summary.safetyStatus"
      />
      <StatCard title="Estimated Exhaustion" :value="exhaustionValue" :hint="projectionHint" :tone="projectionTone" />
    </div>

    <div class="mt-5 grid gap-4 sm:grid-cols-2">
      <article class="rounded-xl border border-slate-700/60 bg-slate-900/50 p-4">
        <p class="panel-title">Usage Balance</p>

        <div class="mt-3 space-y-3">
          <div class="rounded-lg border border-slate-700/60 bg-slate-950/35 p-3.5">
            <p class="text-[11px] uppercase tracking-[0.14em] text-slate-400">Consumed</p>
            <p class="mt-1 text-xl font-semibold text-slate-100">{{ formatPercent(summary.consumedPercent) }}</p>
          </div>

          <div class="rounded-lg border border-slate-700/60 bg-slate-950/35 p-3.5">
            <p class="text-[11px] uppercase tracking-[0.14em] text-slate-400">Remaining</p>
            <p class="mt-1 text-xl font-semibold text-slate-100">{{ formatPercent(summary.remainingPercent) }}</p>
          </div>
        </div>

        <p class="mt-4 text-xs text-slate-400">Measured on {{ toShortDateLabel(summary.measurementDate) }}.</p>
      </article>

      <article class="rounded-xl border border-slate-700/60 bg-slate-900/50 p-4">
        <p class="panel-title">Pace & Budget</p>

        <div class="mt-3 space-y-3">
          <div class="rounded-lg border border-slate-700/60 bg-slate-950/35 p-3.5">
            <p class="text-[11px] uppercase tracking-[0.14em] text-slate-400">Current pace</p>
            <p class="mt-1 text-xl font-semibold text-slate-100">{{ formatPercent(summary.currentPacePerDay) }} / day</p>
          </div>

          <div class="rounded-lg border border-slate-700/60 bg-slate-950/35 p-3.5">
            <p class="text-[11px] uppercase tracking-[0.14em] text-slate-400">Safe budget</p>
            <p class="mt-1 text-xl font-semibold text-slate-100">{{ formatPercent(summary.safeDailyBudgetAllDays) }} / day</p>
          </div>

          <div class="rounded-lg border border-slate-700/60 bg-slate-950/35 p-3.5">
            <p class="text-[11px] uppercase tracking-[0.14em] text-slate-400">Planned-day budget</p>
            <p class="mt-1 text-xl font-semibold text-slate-100">{{ plannedDayBudgetValue }}</p>
          </div>
        </div>

        <p class="mt-4 text-xs text-slate-400">
          {{ summary.daysRemaining }} days left · {{ summary.plannedUsageDays }} planned usage days · {{ summary.rhythmLabel }} rhythm.
        </p>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import StatCard from '@/components/StatCard.vue';
import type { DiagnosticSummary, SafetyStatus } from '@/types/token-tracker';
import { toShortDateLabel } from '@/utils/date';
import { formatPercent } from '@/utils/format';

interface Props {
  summary: DiagnosticSummary;
}

const props = defineProps<Props>();

const statusLabelByValue = {
  safe: 'Safe',
  attention: 'Attention',
  risk: 'Risk'
};

const statusHintByValue = {
  safe: 'Current trend is within a safe envelope.',
  attention: 'Monitor pace and planning to avoid drift.',
  risk: 'Current trend may exhaust quota before reset.'
};

const statusLabel = computed(() => statusLabelByValue[props.summary.safetyStatus]);
const statusHint = computed(() => statusHintByValue[props.summary.safetyStatus]);

const projectionStrategyLabel = computed(() =>
  props.summary.projectionStrategyId === 'seasonal-week-pattern'
    ? 'Seasonal projection'
    : 'Linear projection'
);

const exhaustionValue = computed(() =>
  props.summary.estimatedExhaustionDate
    ? toShortDateLabel(props.summary.estimatedExhaustionDate)
    : 'Not projected'
);

const projectionHint = computed(
  () => `Reset on ${toShortDateLabel(props.summary.resetDate)} · ${projectionStrategyLabel.value}`
);

const plannedDayBudgetValue = computed(() =>
  props.summary.safeDailyBudgetPlannedDays > 0
    ? `${formatPercent(props.summary.safeDailyBudgetPlannedDays)} / planned day`
    : 'N/A'
);

const projectionToneByStatus: Record<SafetyStatus, 'neutral' | 'risk'> = {
  safe: 'neutral',
  attention: 'neutral',
  risk: 'risk'
};

const projectionTone = computed(() => projectionToneByStatus[props.summary.safetyStatus]);
</script>
