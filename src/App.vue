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
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import AccountsPage from '@/pages/AccountsPage.vue';
import HistoryPage from '@/pages/HistoryPage.vue';
import TokenTrackerPage from '@/pages/TokenTrackerPage.vue';

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
});

onBeforeUnmount(() => {
  if (typeof window === 'undefined') {
    return;
  }

  window.removeEventListener('popstate', onPopState);
});
</script>
