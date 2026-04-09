<template>
  <div class="panel-surface p-3">
    <div class="mb-2 flex items-center justify-between gap-2">
      <p class="panel-title">Planning Shortcuts</p>
      <p class="text-xs text-violet-200">{{ planningStatusLabel }}</p>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <button
        type="button"
        class="rounded-lg border border-slate-600/60 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-cyan-300/50 hover:text-cyan-100"
        @click="$emit('apply', 'workdays')"
      >
        Workdays On
      </button>
      <button
        type="button"
        class="rounded-lg border border-slate-600/60 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-cyan-300/50 hover:text-cyan-100"
        @click="$emit('apply', 'weekendOff')"
      >
        Weekends Off
      </button>
      <button
        type="button"
        class="rounded-lg border border-slate-600/60 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-cyan-300/50 hover:text-cyan-100"
        @click="$emit('apply', 'clear')"
      >
        Turn All Off
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PlanningShortcut } from '@/types/token-tracker';

defineProps<{
  planningStatusLabel: string;
}>();

defineEmits<{
  (event: 'apply', value: PlanningShortcut): void;
}>();
</script>
