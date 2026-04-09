<template>
  <section class="panel-surface p-5 sm:p-6">
    <div class="mb-4">
      <p class="panel-title">What-If Scenarios</p>
      <h2 class="mt-2 text-lg font-semibold text-slate-100">Planning Impact</h2>
    </div>

    <div class="grid gap-3">
      <article
        v-for="scenario in scenarios"
        :key="scenario.id"
        class="rounded-xl border border-slate-700/50 bg-slate-900/50 p-4"
      >
        <div class="flex items-start justify-between gap-2">
          <h3 class="text-sm font-semibold text-slate-100">{{ scenario.title }}</h3>
          <span class="rounded-lg border px-2 py-0.5 text-[11px]" :class="getDeltaTone(scenario.deltaFromCurrentBudget)">
            {{ formatDelta(scenario.deltaFromCurrentBudget) }}
          </span>
        </div>
        <p class="mt-3 text-lg font-semibold text-slate-100">
          {{ scenario.budgetPerPlannedDay > 0 ? `${formatPercent(scenario.budgetPerPlannedDay)} / ON day` : 'N/A' }}
        </p>
        <p class="mt-1 text-xs text-slate-400">
          {{ scenario.plannedUsageDays }} ON days. {{ scenario.description }}
        </p>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { WhatIfScenario } from '@/types/token-tracker';
import { formatPercent } from '@/utils/format';

defineProps<{
  scenarios: WhatIfScenario[];
}>();

function formatDelta(delta: number): string {
  if (!Number.isFinite(delta) || delta === 0) {
    return '0.0%';
  }

  const signal = delta > 0 ? '+' : '';
  return `${signal}${delta.toFixed(1)}%`;
}

function getDeltaTone(delta: number): string {
  if (delta > 0) {
    return 'border-emerald-400/50 bg-emerald-900/30 text-emerald-100';
  }

  if (delta < 0) {
    return 'border-amber-300/50 bg-amber-900/30 text-amber-100';
  }

  return 'border-slate-600/60 bg-slate-800/60 text-slate-200';
}
</script>
