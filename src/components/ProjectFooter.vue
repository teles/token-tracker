<template>
  <footer class="border-t border-slate-800/80 bg-slate-950/90">
    <div
      v-if="showSeoCopy"
      class="mx-auto w-full max-w-7xl space-y-2 border-b border-slate-800/80 px-4 py-6 sm:px-6 lg:px-10"
    >
      <h2 class="text-base font-semibold text-slate-100 sm:text-lg">{{ t('footer.seo.title') }}</h2>
      <p class="text-sm leading-relaxed text-slate-300">{{ t('footer.seo.bodyPrimary') }}</p>
      <p class="text-sm leading-relaxed text-slate-400">{{ t('footer.seo.bodySecondary') }}</p>
    </div>

    <div class="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-6 sm:px-6 lg:px-10 sm:flex-row sm:items-center sm:justify-between">
      <div class="space-y-1.5">
        <p class="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-400">{{ t('footer.openSource') }}</p>
        <p class="text-sm text-slate-300">{{ t('footer.description') }}</p>
      </div>

      <a
        href="https://github.com/teles/token-tracker"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center justify-center rounded-lg border border-slate-600/70 bg-slate-900/85 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-cyan-300/60 hover:text-cyan-100"
      >
        {{ t('footer.viewRepository') }}
      </a>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { useI18n } from '@/composables/useI18n';

withDefaults(
  defineProps<{
    showSeoCopy?: boolean;
  }>(),
  {
    showSeoCopy: false
  }
);

const { t } = useI18n();
</script>
