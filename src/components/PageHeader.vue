<template>
  <header>
    <div class="flex items-center justify-between gap-3">
      <h1 class="text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
        {{ t(titleKey) }}
      </h1>

      <button
        type="button"
        class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-600/70 bg-slate-900/80 text-slate-200 transition hover:border-cyan-300/60 hover:text-cyan-100"
        :aria-label="t('header.openMenu')"
        @click="isSidebarOpen = true"
      >
        <svg viewBox="0 0 20 20" class="h-5 w-5" fill="none" aria-hidden="true">
          <path d="M4 6h12M4 10h12M4 14h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
        </svg>
      </button>
    </div>
  </header>

  <Teleport to="body">
    <div v-if="isSidebarOpen" class="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        class="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        :aria-label="t('header.closeMenu')"
        @click="closeSidebar"
      />

      <aside
        class="relative h-full w-72 border-l border-slate-700/80 bg-slate-900/95 p-4 shadow-panel"
        role="dialog"
        aria-modal="true"
      >
        <div class="mb-4 flex items-center justify-between">
          <p class="panel-title">{{ t('header.navigation') }}</p>
          <button
            type="button"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-600/70 text-slate-300 transition hover:border-cyan-300/60 hover:text-cyan-100"
            :aria-label="t('header.closeMenu')"
            @click="closeSidebar"
          >
            <svg viewBox="0 0 20 20" class="h-4 w-4" fill="none" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
            </svg>
          </button>
        </div>

        <nav class="space-y-2">
          <button
            v-for="item in menuItems"
            :key="item.page"
            type="button"
            class="flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-sm font-medium transition"
            :class="item.page === currentPage
              ? 'border-cyan-200/70 bg-cyan-500/20 text-cyan-50'
              : 'border-slate-700/80 bg-slate-950/50 text-slate-200 hover:border-slate-500/80'"
            :aria-current="item.page === currentPage ? 'page' : undefined"
            @click="navigateFromSidebar(item.page)"
          >
            <span>{{ item.label }}</span>
          </button>
        </nav>

        <div class="mt-4 border-t border-slate-700/70 pt-4">
          <button
            type="button"
            class="flex w-full items-center justify-between rounded-xl border border-slate-700/80 bg-slate-950/50 px-3 py-2.5 text-sm font-medium text-slate-200 transition hover:border-cyan-300/60 hover:text-cyan-100"
            @click="openSettingsFromSidebar"
          >
            <span>{{ t('header.settings') }}</span>
            <span class="rounded-md border border-slate-600/70 bg-slate-900/70 px-1.5 py-0.5 text-[10px] text-slate-300">
              {{ languageLabel }}
            </span>
          </button>
        </div>
      </aside>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from '@/composables/useI18n';

type AppPage = 'tracker' | 'history';

const props = defineProps<{
  languageLabel: string;
  currentPage: AppPage;
  titleKey: string;
}>();

const emit = defineEmits<{
  (event: 'open-settings'): void;
  (event: 'navigate', page: AppPage): void;
}>();

const { t } = useI18n();
const isSidebarOpen = ref(false);

const menuItems = computed<Array<{ page: AppPage; label: string }>>(() => [
  { page: 'tracker', label: t('navigation.tracker') },
  { page: 'history', label: t('navigation.history') }
]);

function closeSidebar() {
  isSidebarOpen.value = false;
}

function navigateFromSidebar(page: AppPage) {
  emit('navigate', page);
  closeSidebar();
}

function openSettingsFromSidebar() {
  emit('open-settings');
  closeSidebar();
}

function onWindowKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeSidebar();
  }
}

onMounted(() => {
  window.addEventListener('keydown', onWindowKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onWindowKeydown);
});
</script>
