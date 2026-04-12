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
        <svg viewBox="0 0 24 24" class="mr-2 h-4 w-4" fill="currentColor" aria-hidden="true">
          <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.9.58.1.79-.25.79-.56 0-.28-.01-1.19-.01-2.16-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.97.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.18 1.18a11.06 11.06 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.24 2.75.12 3.04.74.8 1.18 1.82 1.18 3.08 0 4.43-2.69 5.4-5.25 5.69.41.35.78 1.04.78 2.09 0 1.51-.01 2.73-.01 3.1 0 .31.21.67.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
        </svg>
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
