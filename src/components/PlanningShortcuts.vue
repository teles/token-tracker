<template>
  <div class="panel-surface p-3">
    <div class="mb-2 flex items-center justify-between gap-2">
      <p class="panel-title">{{ t('planningShortcuts.title') }}</p>
      <p class="text-xs text-violet-200">{{ planningStatusLabel }}</p>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <button
        type="button"
        class="rounded-lg border border-slate-600/60 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-cyan-300/50 hover:text-cyan-100"
        @click="$emit('apply', 'workdays')"
      >
        {{ t('planningShortcuts.workdaysOn') }}
      </button>
      <button
        type="button"
        class="rounded-lg border border-slate-600/60 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-cyan-300/50 hover:text-cyan-100"
        @click="$emit('apply', 'weekendOff')"
      >
        {{ t('planningShortcuts.weekendsOff') }}
      </button>
      <button
        type="button"
        class="rounded-lg border border-slate-600/60 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-cyan-300/50 hover:text-cyan-100"
        @click="$emit('apply', 'clear')"
      >
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
