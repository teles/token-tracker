<template>
  <header class="space-y-3">
    <div class="flex items-start justify-between gap-4">
      <div>
        <p class="panel-title">{{ t('header.workspace') }}</p>
        <h1 class="mt-2 text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">{{ t('header.title') }}</h1>
      </div>

      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-xl border border-slate-600/70 bg-slate-900/80 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-cyan-300/60 hover:text-cyan-100"
        @click="$emit('open-settings')"
      >
        {{ t('header.settings') }}
        <span class="rounded-md border border-slate-600/70 bg-slate-950/70 px-1.5 py-0.5 text-[10px] text-slate-300">
          {{ languageLabel }}
        </span>
      </button>
    </div>

    <p class="max-w-3xl text-sm text-slate-300 sm:text-base">
      {{ t('header.subtitle') }}
    </p>
  </header>
</template>

<script setup lang="ts">
import { useI18n } from '@/composables/useI18n';

defineProps<{
  languageLabel: string;
}>();

defineEmits<{
  (event: 'open-settings'): void;
}>();

const { t } = useI18n();
</script>
