<template>
  <section class="panel-surface p-4">
    <div class="grid gap-4 md:grid-cols-2">
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
        <p class="panel-title">Future Planning States</p>
        <div class="flex flex-wrap gap-2 text-xs">
          <span
            v-for="item in planningLegend"
            :key="item.label"
            class="rounded-lg border px-2 py-1"
            :class="item.className"
          >
            {{ item.label }}
          </span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const intensityTones = [
  'bg-slate-900/70 border-slate-800/70',
  'bg-emerald-950/50 border-emerald-900/60',
  'bg-emerald-900/55 border-emerald-700/70',
  'bg-cyan-800/60 border-cyan-500/60',
  'bg-cyan-500/50 border-cyan-300/70'
];

const planningLegend = [
  {
    label: 'Usage On',
    className: 'border-violet-300/80 bg-violet-700/45 text-violet-100'
  },
  {
    label: 'Usage Off',
    className: 'border-slate-600/70 bg-slate-800/70 text-slate-400'
  }
];
</script>
