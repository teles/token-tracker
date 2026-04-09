<template>
  <section class="panel-surface p-4">
    <div v-if="mode === 'heatmap'" class="grid gap-4 md:grid-cols-2">
      <div class="space-y-3">
        <div class="space-y-2">
          <p class="panel-title">Past Usage Intensity</p>
          <div class="flex items-center gap-2">
            <span class="text-xs text-slate-400">Low</span>
            <div
              v-for="(tone, index) in intensityTones"
              :key="index"
              class="h-4 w-6 rounded-md border"
              :class="tone"
            />
            <span class="text-xs text-slate-400">High</span>
          </div>
        </div>

        <div class="space-y-2">
          <p class="panel-title">Past Derived Values</p>
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
          <p class="panel-title">Future Planning States</p>
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
          <p class="panel-title">Day Markers</p>
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
        <p class="panel-title">Usage Curves</p>
        <div class="flex flex-wrap items-center gap-3 text-xs text-slate-300">
          <span class="inline-flex items-center gap-2">
            <span class="h-2 w-5 rounded-full bg-cyan-300/90"></span>
            Historical cumulative
          </span>
          <span class="inline-flex items-center gap-2">
            <span class="h-2 w-5 rounded-full border border-violet-300/70 bg-violet-300/35"></span>
            Projected at current pace
          </span>
        </div>
      </div>

      <div class="space-y-2">
        <p class="panel-title">Point Meaning</p>
        <div class="flex flex-wrap gap-2 text-xs">
          <span class="rounded-lg border border-cyan-200/70 bg-cyan-300/15 px-2 py-1 text-cyan-100">
            Manual Measurement
          </span>
          <span class="rounded-lg border border-violet-300/70 bg-violet-700/35 px-2 py-1 text-violet-100">
            Future ON Day
          </span>
          <span class="rounded-lg border border-slate-600/70 bg-slate-800/70 px-2 py-1 text-slate-300">
            Future OFF Day
          </span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { TemporalViewMode } from '@/types/token-tracker';

interface Props {
  mode: TemporalViewMode;
}

defineProps<Props>();

const intensityTones = [
  'bg-slate-900/70 border-slate-800/70',
  'bg-emerald-950/50 border-emerald-900/60',
  'bg-emerald-900/55 border-emerald-700/70',
  'bg-cyan-800/60 border-cyan-500/60',
  'bg-cyan-500/50 border-cyan-300/70'
];

const futurePlanningLegend = [
  {
    label: 'Usage On',
    className: 'border-violet-300/80 bg-violet-700/45 text-violet-100'
  },
  {
    label: 'Usage Off',
    className: 'border-slate-600/70 bg-slate-800/70 text-slate-400'
  }
];

const dayMarkersLegend = [
  {
    label: 'Has Note',
    className: 'border-amber-300/60 bg-amber-500/15 text-amber-100'
  }
];

const pastDerivedLegend = [
  {
    label: 'Estimated Usage',
    className: 'estimated-legend-chip border-slate-400/50 bg-slate-700/30 text-slate-200'
  }
];
</script>
