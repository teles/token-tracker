<template>
  <TokenTrackerPage
    v-if="currentPage === 'tracker'"
    @navigate="navigate($event)"
  />
  <HistoryPage
    v-else
    @navigate="navigate($event)"
  />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import HistoryPage from '@/pages/HistoryPage.vue';
import TokenTrackerPage from '@/pages/TokenTrackerPage.vue';

type AppPage = 'tracker' | 'history';

function getPageFromHash(hash: string): AppPage {
  return hash === '#/history' ? 'history' : 'tracker';
}

const currentPage = ref<AppPage>(
  typeof window === 'undefined' ? 'tracker' : getPageFromHash(window.location.hash)
);

function navigate(page: AppPage) {
  currentPage.value = page;

  if (typeof window === 'undefined') {
    return;
  }

  const nextHash = page === 'history' ? '#/history' : '#/';

  if (window.location.hash !== nextHash) {
    window.location.hash = nextHash;
  }
}

function onHashChange() {
  currentPage.value = getPageFromHash(window.location.hash);
}

onMounted(() => {
  if (typeof window === 'undefined') {
    return;
  }

  window.addEventListener('hashchange', onHashChange);
  currentPage.value = getPageFromHash(window.location.hash);
});

onBeforeUnmount(() => {
  if (typeof window === 'undefined') {
    return;
  }

  window.removeEventListener('hashchange', onHashChange);
});
</script>
