<template>
  <TokenTrackerPage
    v-if="currentPage === 'tracker'"
    :route-account-id="routeAccountId"
    @navigate="navigate($event)"
  />
  <HistoryPage
    v-else-if="currentPage === 'history'"
    :route-account-id="routeAccountId"
    @navigate="navigate($event)"
  />
  <AccountsPage
    v-else
    @navigate="navigate($event)"
  />

  <div
    v-if="isUpdateBannerVisible"
    class="fixed bottom-4 left-1/2 z-[70] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl border border-cyan-200/60 bg-slate-900/95 p-3 shadow-panel backdrop-blur"
  >
    <p class="text-sm text-slate-100">
      {{ t('pwa.updateAvailable') }}
    </p>
    <div class="mt-2 flex items-center justify-end gap-2">
      <button
        type="button"
        class="rounded-lg border border-slate-600/70 px-3 py-1.5 text-xs text-slate-200 transition hover:border-slate-400/70 hover:text-slate-100"
        @click="dismissUpdateBanner"
      >
        {{ t('pwa.dismissAction') }}
      </button>
      <button
        type="button"
        class="rounded-lg border border-cyan-300/70 bg-cyan-500/20 px-3 py-1.5 text-xs text-cyan-50 transition hover:border-cyan-200 hover:bg-cyan-500/30 disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="isApplyingUpdate"
        @click="applyPendingUpdate"
      >
        {{ isApplyingUpdate ? t('pwa.updating') : t('pwa.updateAction') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from '@/composables/useI18n';
import AccountsPage from '@/pages/AccountsPage.vue';
import HistoryPage from '@/pages/HistoryPage.vue';
import TokenTrackerPage from '@/pages/TokenTrackerPage.vue';
import { registerAppServiceWorker } from '@/services/pwa-registration';
import type { AppServiceWorkerController } from '@/services/pwa-registration';

type AppPage = 'tracker' | 'history' | 'accounts';

interface RouteState {
  page: AppPage;
  accountId: string | null;
}

function parseRoute(pathname: string, search: string): RouteState {
  const normalizedPath = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname || '/';
  const resolvedPath = normalizedPath.length > 0 ? normalizedPath : '/';
  const query = search.startsWith('?') ? search.slice(1) : search;
  const params = new URLSearchParams(query);
  const accountId = params.get('account')?.trim() ?? '';

  if (resolvedPath === '/history') {
    return {
      page: 'history',
      accountId: accountId.length > 0 ? accountId : null
    };
  }

  if (resolvedPath === '/accounts') {
    return {
      page: 'accounts',
      accountId: null
    };
  }

  return {
    page: 'tracker',
    accountId: accountId.length > 0 ? accountId : null
  };
}

function parseLegacyHashRoute(hash: string): RouteState | null {
  if (!hash.startsWith('#/')) {
    return null;
  }

  const [path, query = ''] = hash.slice(1).split('?');
  return parseRoute(path, query.length > 0 ? `?${query}` : '');
}

function buildUrl(page: AppPage, accountId: string | null): string {
  const params = new URLSearchParams();

  if (accountId && page !== 'accounts') {
    params.set('account', accountId);
  }

  const query = params.toString();

  if (page === 'accounts') {
    return '/accounts';
  }

  if (page === 'history') {
    return query.length > 0
      ? `/history?${query}`
      : '/history';
  }

  return query.length > 0
    ? `/?${query}`
    : '/';
}

function readRouteFromWindow(): RouteState {
  if (typeof window === 'undefined') {
    return { page: 'tracker', accountId: null };
  }

  const legacyHashRoute = parseLegacyHashRoute(window.location.hash);

  if (legacyHashRoute) {
    return legacyHashRoute;
  }

  return parseRoute(window.location.pathname, window.location.search);
}

const initialRoute: RouteState = typeof window === 'undefined'
  ? { page: 'tracker', accountId: null }
  : readRouteFromWindow();
const currentPage = ref<AppPage>(initialRoute.page);
const routeAccountId = ref<string | null>(initialRoute.accountId);
const isUpdateBannerVisible = ref(false);
const isApplyingUpdate = ref(false);
const { t } = useI18n();
let appServiceWorkerController: AppServiceWorkerController | null = null;

function syncRouteFromWindow() {
  const route = readRouteFromWindow();
  currentPage.value = route.page;
  routeAccountId.value = route.accountId;
}

function navigate(page: AppPage) {
  currentPage.value = page;

  if (typeof window === 'undefined') {
    return;
  }

  const liveRoute = readRouteFromWindow();
  routeAccountId.value = liveRoute.accountId;
  const nextUrl = buildUrl(page, routeAccountId.value);
  const currentUrl = `${window.location.pathname}${window.location.search}`;

  if (currentUrl !== nextUrl) {
    window.history.pushState(window.history.state, '', nextUrl);
    syncRouteFromWindow();
  }
}

function onPopState() {
  syncRouteFromWindow();
}

function dismissUpdateBanner() {
  isUpdateBannerVisible.value = false;
}

async function applyPendingUpdate() {
  if (!appServiceWorkerController || isApplyingUpdate.value) {
    return;
  }

  isApplyingUpdate.value = true;

  try {
    await appServiceWorkerController.applyUpdate();
  } finally {
    isApplyingUpdate.value = false;
  }
}

async function initializePwaRegistration() {
  if (typeof window === 'undefined') {
    return;
  }

  appServiceWorkerController = await registerAppServiceWorker({
    onUpdateAvailable: () => {
      isUpdateBannerVisible.value = true;
    }
  });
}

onMounted(() => {
  if (typeof window === 'undefined') {
    return;
  }

  const legacyHashRoute = parseLegacyHashRoute(window.location.hash);

  if (legacyHashRoute) {
    window.history.replaceState(window.history.state, '', buildUrl(legacyHashRoute.page, legacyHashRoute.accountId));
  }

  window.addEventListener('popstate', onPopState);
  syncRouteFromWindow();
  void initializePwaRegistration();
});

onBeforeUnmount(() => {
  if (typeof window === 'undefined') {
    return;
  }

  window.removeEventListener('popstate', onPopState);
});
</script>
