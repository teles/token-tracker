<template>
  <div class="panel-surface p-3">
    <div class="mb-2 flex items-center justify-between gap-2">
      <p class="panel-title">{{ t('planningShortcuts.title') }}</p>
      <p class="text-xs text-violet-200">{{ planningStatusLabel }}</p>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-lg border border-slate-600/60 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-cyan-300/50 hover:text-cyan-100"
        @click="$emit('apply', 'workdays')"
      >
        <svg viewBox="0 0 20 20" class="h-3.5 w-3.5 text-violet-200" fill="none" aria-hidden="true">
          <rect x="2.5" y="4.5" width="2.2" height="11" rx="0.9" fill="currentColor" />
          <rect x="6.8" y="4.5" width="2.2" height="11" rx="0.9" fill="currentColor" />
          <rect x="11.1" y="4.5" width="2.2" height="11" rx="0.9" fill="currentColor" />
          <rect x="15.4" y="4.5" width="2.2" height="11" rx="0.9" fill="currentColor" />
        </svg>
        {{ t('planningShortcuts.workdaysOn') }}
      </button>
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-lg border border-slate-600/60 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-cyan-300/50 hover:text-cyan-100"
        @click="$emit('apply', 'weekendOff')"
      >
        <svg viewBox="0 0 20 20" class="h-3.5 w-3.5 text-rose-300" fill="none" aria-hidden="true">
          <rect x="3" y="4" width="14" height="13" rx="2" stroke="currentColor" stroke-width="1.6" />
          <path d="M6 2.8v2.6M14 2.8v2.6M6.8 9.2l6.4 6.4M13.2 9.2l-6.4 6.4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
        </svg>
        {{ t('planningShortcuts.weekendsOff') }}
      </button>
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-lg border border-slate-600/60 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-cyan-300/50 hover:text-cyan-100"
        @click="$emit('apply', 'clear')"
      >
        <svg viewBox="0 0 20 20" class="h-3.5 w-3.5 text-slate-300" fill="none" aria-hidden="true">
          <circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.6" />
          <path d="M6.5 10h7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
        </svg>
        {{ t('planningShortcuts.turnAllOff') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from '@/composables/useI18n';
import type { PlanningShortcut } from '@/types/token-tracker';

defineProps<{
  planningStatusLabel: string;
}>();

defineEmits<{
  (event: 'apply', value: PlanningShortcut): void;
}>();
const { t } = useI18n();
</script>
