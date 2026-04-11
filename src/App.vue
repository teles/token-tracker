<template>
  <TokenTrackerPage
    v-if="currentPage === 'tracker'"
    @navigate="navigate($event)"
  />
  <HistoryPage
    v-else-if="currentPage === 'history'"
    @navigate="navigate($event)"
  />
  <AccountsPage
    v-else
    @navigate="navigate($event)"
  />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import AccountsPage from '@/pages/AccountsPage.vue';
import HistoryPage from '@/pages/HistoryPage.vue';
import TokenTrackerPage from '@/pages/TokenTrackerPage.vue';

type AppPage = 'tracker' | 'history' | 'accounts';

function getPageFromHash(hash: string): AppPage {
  if (hash === '#/history') {
    return 'history';
  }

  if (hash === '#/accounts') {
    return 'accounts';
  }

  return 'tracker';
}

const currentPage = ref<AppPage>(
  typeof window === 'undefined' ? 'tracker' : getPageFromHash(window.location.hash)
);

function navigate(page: AppPage) {
  currentPage.value = page;

  if (typeof window === 'undefined') {
    return;
  }

  const nextHash = page === 'history'
    ? '#/history'
    : page === 'accounts'
      ? '#/accounts'
      : '#/';

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
