<template>
  <section class="panel-surface p-5 sm:p-6">
    <div class="mb-4">
      <p class="panel-title">{{ diagnosisAndProjectionLabel }}</p>
      <h2 class="mt-2 text-lg font-semibold text-slate-100">{{ quotaHealthLabel }}</h2>
    </div>

    <div class="grid gap-3 sm:grid-cols-2">
      <StatCard
        :title="overallStatusLabel"
        :value="statusLabel"
        :hint="statusHint"
        :tone="summary.safetyStatus"
      />
      <StatCard :title="estimatedExhaustionLabel" :value="exhaustionValue" :hint="projectionHint" :tone="projectionTone" />
    </div>

    <div class="mt-5 grid gap-4 sm:grid-cols-2">
      <article class="rounded-xl border border-slate-700/60 bg-slate-900/50 p-4">
        <p class="panel-title">{{ usageBalanceLabel }}</p>

        <div class="mt-3 space-y-3">
          <div class="rounded-lg border border-slate-700/60 bg-slate-950/35 p-3.5">
            <p class="text-[11px] uppercase tracking-[0.14em] text-slate-400">{{ consumedLabel }}</p>
            <p class="mt-1 text-xl font-semibold text-slate-100">{{ formatPercent(summary.consumedPercent) }}</p>
          </div>

          <div class="rounded-lg border border-slate-700/60 bg-slate-950/35 p-3.5">
            <p class="text-[11px] uppercase tracking-[0.14em] text-slate-400">{{ remainingLabel }}</p>
            <p class="mt-1 text-xl font-semibold text-slate-100">{{ formatPercent(summary.remainingPercent) }}</p>
          </div>
        </div>

        <p class="mt-4 text-xs text-slate-400">{{ measuredOnLabel }}</p>
      </article>

      <article class="rounded-xl border border-slate-700/60 bg-slate-900/50 p-4">
        <p class="panel-title">{{ paceAndBudgetLabel }}</p>

        <div class="mt-3 space-y-3">
          <div class="rounded-lg border border-slate-700/60 bg-slate-950/35 p-3.5">
            <p class="text-[11px] uppercase tracking-[0.14em] text-slate-400">{{ currentPaceLabel }}</p>
            <p class="mt-1 text-xl font-semibold text-slate-100">{{ formatPercent(summary.currentPacePerDay) }} / {{ perDayLabel }}</p>
          </div>

          <div class="rounded-lg border border-slate-700/60 bg-slate-950/35 p-3.5">
            <p class="text-[11px] uppercase tracking-[0.14em] text-slate-400">{{ safeBudgetLabel }}</p>
            <p class="mt-1 text-xl font-semibold text-slate-100">{{ formatPercent(summary.safeDailyBudgetAllDays) }} / {{ perDayLabel }}</p>
          </div>

          <div class="rounded-lg border border-slate-700/60 bg-slate-950/35 p-3.5">
            <p class="text-[11px] uppercase tracking-[0.14em] text-slate-400">{{ budgetOnOnDaysLabel }}</p>
            <p class="mt-1 text-xl font-semibold text-slate-100">{{ plannedDayBudgetValue }}</p>
            <p class="mt-1 text-xs text-slate-500">{{ plannedDayBudgetHint }}</p>
          </div>
        </div>

        <p class="mt-4 text-xs text-slate-400">
          {{ pacingSummaryLabel }}
        </p>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from '@/composables/useI18n';
import StatCard from '@/components/StatCard.vue';
import type { DiagnosticSummary, SafetyStatus } from '@/types/token-tracker';
import { toShortDateLabel } from '@/utils/date';
import { formatPercent } from '@/utils/format';

interface Props {
  summary: DiagnosticSummary;
}

const props = defineProps<Props>();
const { t } = useI18n();

const statusLabel = computed(() => t(`diagnostics.status.${props.summary.safetyStatus}`));
const statusHint = computed(() => t(`diagnostics.statusHint.${props.summary.safetyStatus}`));

const projectionStrategyLabel = computed(() =>
  props.summary.projectionStrategyId === 'seasonal-week-pattern'
    ? t('diagnostics.projection.seasonal')
    : t('diagnostics.projection.linear')
);

const exhaustionValue = computed(() =>
  props.summary.estimatedExhaustionDate
    ? toShortDateLabel(props.summary.estimatedExhaustionDate)
    : t('diagnostics.notProjected')
);

const projectionHint = computed(
  () => t('diagnostics.projectionHint', {
    date: toShortDateLabel(props.summary.resetDate),
    strategy: projectionStrategyLabel.value
  })
);

const plannedDayBudgetValue = computed(() =>
  props.summary.safeDailyBudgetPlannedDays > 0
    ? `${formatPercent(props.summary.safeDailyBudgetPlannedDays)} / ${t('diagnostics.perOnDay')}`
    : t('diagnostics.notAvailable')
);

const plannedDayBudgetHint = computed(() => {
  if (props.summary.plannedUsageDays <= 0) {
    return t('diagnostics.noOnDaysPlanned');
  }

  return t('diagnostics.plannedDayBudgetHint', {
    remaining: formatPercent(props.summary.remainingPercent),
    onDays: props.summary.plannedUsageDays
  });
});

const projectionToneByStatus: Record<SafetyStatus, 'neutral' | 'risk'> = {
  safe: 'neutral',
  attention: 'neutral',
  risk: 'risk'
};

const projectionTone = computed(() => projectionToneByStatus[props.summary.safetyStatus]);

const diagnosisAndProjectionLabel = computed(() => t('diagnostics.titleTop'));
const quotaHealthLabel = computed(() => t('diagnostics.title'));
const estimatedExhaustionLabel = computed(() => t('diagnostics.estimatedExhaustion'));
const overallStatusLabel = computed(() => t('diagnostics.overallStatus'));
const usageBalanceLabel = computed(() => t('diagnostics.usageBalance'));
const consumedLabel = computed(() => t('diagnostics.consumed'));
const remainingLabel = computed(() => t('diagnostics.remaining'));
const measuredOnLabel = computed(() =>
  t('diagnostics.measuredOn', { date: toShortDateLabel(props.summary.measurementDate) })
);
const paceAndBudgetLabel = computed(() => t('diagnostics.paceBudget'));
const currentPaceLabel = computed(() => t('diagnostics.currentPace'));
const safeBudgetLabel = computed(() => t('diagnostics.safeBudget'));
const budgetOnOnDaysLabel = computed(() => t('diagnostics.budgetOnOnDays'));
const perDayLabel = computed(() => t('diagnostics.perDay'));
const pacingSummaryLabel = computed(() =>
  t('diagnostics.pacingSummary', {
    daysLeft: props.summary.daysRemaining,
    plannedDays: props.summary.plannedUsageDays,
    rhythm: props.summary.rhythmLabel
  })
);
</script>
