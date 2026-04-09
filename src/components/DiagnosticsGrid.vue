<template>
  <section class="panel-surface p-5 sm:p-6">
    <div class="mb-4">
      <p class="panel-title">Diagnosis & Projection</p>
      <h2 class="mt-2 text-lg font-semibold text-slate-100">Quota Health</h2>
    </div>

    <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
      <StatCard title="Current Usage" :value="formatPercent(summary.consumedPercent)" />
      <StatCard title="Remaining Quota" :value="formatPercent(summary.remainingPercent)" />
      <StatCard title="Current Pace" :value="`${formatPercent(summary.currentPacePerDay)} / day`" :hint="summary.rhythmLabel" />
      <StatCard title="Safe Budget (Daily)" :value="`${formatPercent(summary.safeDailyBudgetAllDays)} / day`" :hint="`${summary.daysRemaining} days left`" />
      <StatCard
        title="Budget per Planned Day"
        :value="summary.safeDailyBudgetPlannedDays > 0 ? `${formatPercent(summary.safeDailyBudgetPlannedDays)} / planned day` : 'N/A'"
        :hint="`${summary.plannedUsageDays} planned usage days`"
      />
      <StatCard
        title="Estimated Exhaustion"
        :value="summary.estimatedExhaustionDate ? toShortDateLabel(summary.estimatedExhaustionDate) : 'Not projected'"
        :hint="`Reset on ${toShortDateLabel(summary.resetDate)} · ${projectionStrategyLabel}`"
      />
      <StatCard
        title="Overall Status"
        :value="statusLabel"
        :hint="statusHint"
        :tone="summary.safetyStatus"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import StatCard from '@/components/StatCard.vue';
import type { DiagnosticSummary } from '@/types/token-tracker';
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
</script>
