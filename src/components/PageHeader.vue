<template>
  <header class="space-y-3">
    <div class="flex items-start justify-between gap-4">
      <div>
        <p class="panel-title">{{ t(workspaceKey) }}</p>
        <h1 class="mt-2 text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">{{ t(titleKey) }}</h1>
      </div>

      <div class="flex flex-col items-end gap-2">
        <nav class="inline-flex rounded-xl border border-slate-700/70 bg-slate-900/80 p-1">
          <button
            v-for="item in menuItems"
            :key="item.page"
            type="button"
            class="rounded-lg px-3 py-1.5 text-xs font-medium transition"
            :class="item.page === currentPage
              ? 'bg-cyan-500/20 text-cyan-100 shadow-[0_0_0_1px_rgba(103,232,249,0.25)]'
              : 'text-slate-300 hover:text-slate-100'"
            :aria-current="item.page === currentPage ? 'page' : undefined"
            @click="$emit('navigate', item.page)"
          >
            {{ item.label }}
          </button>
        </nav>

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
    </div>

    <p class="max-w-3xl text-sm text-slate-300 sm:text-base">
      {{ t(subtitleKey) }}
    </p>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from '@/composables/useI18n';

type AppPage = 'tracker' | 'history';

defineProps<{
  languageLabel: string;
  currentPage: AppPage;
  workspaceKey: string;
  titleKey: string;
  subtitleKey: string;
}>();

defineEmits<{
  (event: 'open-settings'): void;
  (event: 'navigate', page: AppPage): void;
}>();

const { t } = useI18n();

const menuItems = computed<Array<{ page: AppPage; label: string }>>(() => [
  { page: 'tracker', label: t('navigation.tracker') },
  { page: 'history', label: t('navigation.history') }
]);
</script>
