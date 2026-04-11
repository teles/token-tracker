<template>
  <main class="min-h-screen">
    <div class="px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
      <div class="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <PageHeader
          :language-label="languageLabel"
          current-page="accounts"
          title-key="accounts.title"
          @open-settings="openSettings"
          @navigate="emit('navigate', $event)"
        />

        <section class="panel-surface p-5 sm:p-6">
          <p class="panel-title">{{ t('accounts.active.title') }}</p>
          <div class="mt-3 rounded-xl border border-cyan-300/45 bg-cyan-500/10 p-4">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p class="text-lg font-semibold text-cyan-100">{{ activeAccount.name }}</p>
                <p class="mt-1 text-sm text-slate-300">
                  {{ toProviderLabel(activeAccount.provider) }} · {{ toCadenceLabel(activeAccount.cadence) }}
                </p>
                <p class="mt-1 text-xs text-slate-400">
                  {{ t('accounts.active.cycle', { start: cycle.cycleStart, end: cycle.resetDate }) }}
                </p>
              </div>
              <span class="rounded-md border border-cyan-300/60 bg-cyan-500/20 px-2 py-1 text-xs text-cyan-50">
                {{ t('accounts.active.badge') }}
              </span>
            </div>
          </div>
        </section>

        <section class="panel-surface p-5 sm:p-6">
          <div class="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <article class="space-y-3">
              <p class="panel-title">{{ t('accounts.switch.title') }}</p>
              <button
                v-for="account in accountSummaries"
                :key="account.id"
                type="button"
                class="w-full rounded-xl border px-3 py-3 text-left transition"
                :class="account.id === activeAccount.id
                  ? 'border-cyan-200/70 bg-cyan-500/15'
                  : 'border-slate-700/80 bg-slate-950/55 hover:border-slate-500/80'"
                @click="handleSwitchAccount(account.id)"
              >
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <p class="text-sm font-medium text-slate-100">{{ account.name }}</p>
                    <p class="mt-1 text-[11px] text-slate-400">
                      {{ toProviderLabel(account.provider) }} · {{ toCadenceLabel(account.cadence) }}
                    </p>
                    <p class="mt-1 text-[11px] text-slate-500">
                      {{ account.activeCycleStart }} -> {{ account.activeCycleEnd }} ·
                      {{ t('accounts.switch.closedCycles', { count: account.closedCyclesCount }) }}
                    </p>
                  </div>
                  <span
                    v-if="account.id === activeAccount.id"
                    class="rounded-md border border-cyan-300/60 bg-cyan-500/20 px-2 py-0.5 text-[10px] text-cyan-100"
                  >
                    {{ t('accounts.active.badge') }}
                  </span>
                </div>
              </button>
            </article>

            <article class="rounded-xl border border-slate-700/70 bg-slate-950/45 p-4">
              <p class="panel-title">{{ t('accounts.create.title') }}</p>

              <div class="mt-3 space-y-2">
                <input
                  v-model="newAccountName"
                  type="text"
                  maxlength="60"
                  class="w-full rounded-lg border border-slate-700/70 bg-slate-900/80 px-2.5 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-300/60"
                  :placeholder="t('accounts.create.namePlaceholder')"
                />

                <div class="grid grid-cols-2 gap-2">
                  <select
                    v-model="newAccountProvider"
                    class="rounded-lg border border-slate-700/70 bg-slate-900/80 px-2.5 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-300/60"
                  >
                    <option v-for="option in providerOptions" :key="option.value" :value="option.value">
                      {{ option.label }}
                    </option>
                  </select>

                  <select
                    v-model="newAccountCadence"
                    class="rounded-lg border border-slate-700/70 bg-slate-900/80 px-2.5 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-300/60"
                  >
                    <option v-for="option in cadenceOptions" :key="option.value" :value="option.value">
                      {{ option.label }}
                    </option>
                  </select>
                </div>

                <button
                  type="button"
                  class="w-full rounded-lg border border-cyan-300/60 bg-cyan-500/15 px-3 py-2 text-sm font-medium text-cyan-100 transition hover:border-cyan-200/70"
                  @click="handleCreateAccount"
                >
                  {{ t('accounts.create.action') }}
                </button>
              </div>
            </article>
          </div>

          <p
            v-if="accountFeedback?.message"
            class="mt-3 text-xs"
            :class="accountFeedback.tone === 'success' ? 'text-emerald-200' : 'text-rose-200'"
          >
            {{ accountFeedback.message }}
          </p>
        </section>

        <section class="panel-surface p-5 sm:p-6">
          <div class="mb-3 flex items-start justify-between gap-2">
            <p class="panel-title">{{ t('accounts.cycles.title') }}</p>
            <span class="rounded-md border border-slate-700/70 bg-slate-950/70 px-2 py-1 font-mono text-[10px] text-slate-400">
              {{ accountCycles.length }}
            </span>
          </div>

          <div
            v-if="accountCycles.length === 0"
            class="rounded-xl border border-slate-700/60 bg-slate-900/35 px-4 py-5 text-sm text-slate-400"
          >
            {{ t('accounts.cycles.empty') }}
          </div>

          <ul v-else class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <li
              v-for="cycleRecord in accountCycles"
              :key="cycleRecord.id"
              class="rounded-xl border p-4"
              :class="cycleRecord.status === 'active'
                ? 'border-cyan-300/45 bg-cyan-500/10'
                : 'border-slate-700/60 bg-slate-900/45'"
            >
              <div class="flex items-start justify-between gap-2">
                <p class="text-sm font-semibold text-slate-100">{{ cycleRecord.cycleStart }} -> {{ cycleRecord.resetDate }}</p>
                <span
                  class="rounded-md border px-2 py-0.5 text-[10px]"
                  :class="cycleRecord.status === 'active'
                    ? 'border-cyan-300/60 bg-cyan-500/20 text-cyan-100'
                    : 'border-slate-500/70 bg-slate-700/50 text-slate-200'"
                >
                  {{ cycleRecord.status === 'active' ? t('accounts.cycles.status.active') : t('accounts.cycles.status.closed') }}
                </span>
              </div>

              <p class="mt-2 text-xs text-slate-400">
                {{ toCadenceLabel(cycleRecord.cadence) }}
              </p>
              <p class="mt-2 text-xs text-slate-500">
                {{ t('accounts.cycles.lastMeasurement') }}: {{ toLastMeasurementLabel(cycleRecord) }}
              </p>
              <p class="mt-1 text-xs text-slate-500">
                {{ t('accounts.cycles.notes', { count: Object.keys(cycleRecord.state.dayNotes ?? {}).length }) }} ·
                {{ t('accounts.cycles.plannedOn', { count: Object.keys(cycleRecord.state.planning ?? {}).length }) }}
              </p>
            </li>
          </ul>
        </section>
      </div>
    </div>

    <ProjectFooter />
    <SettingsModal
      :open="isSettingsOpen"
      :language="language"
      :accounts="settingsAccounts"
      :active-account-id="activeAccount.id"
      :account-feedback="null"
      :data-feedback="settingsDataFeedback"
      @close="isSettingsOpen = false"
      @update:language="setLanguage($event)"
      @switch-account="handleSwitchAccount"
      @export-data="handleExportData"
      @import-data="handleImportData"
      @reset-cycle="handleResetCycle"
    />
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import PageHeader from '@/components/PageHeader.vue';
import ProjectFooter from '@/components/ProjectFooter.vue';
import SettingsModal from '@/components/SettingsModal.vue';
import { useI18n } from '@/composables/useI18n';
import { useTokenTrackerState } from '@/composables/useTokenTrackerState';
import {
  buildDataExportFileName,
  serializeDataExportPayload
} from '@/services/data-transfer';
import type { ImportDataErrorCode } from '@/services/data-transfer';
import type { CreateTrackerAccountInput } from '@/services/tracker-workspace';
import { useUiLanguage } from '@/composables/useUiLanguage';
import { appLanguageDescriptorByValue } from '@/types/app-settings';
import type {
  TrackerAccountProvider,
  TrackerCycleCadence,
  TrackerCycleRecord
} from '@/types/token-tracker';
import { formatPercent } from '@/utils/format';

const emit = defineEmits<{
  (event: 'navigate', page: 'tracker' | 'history' | 'accounts'): void;
}>();

type SettingsFeedback = {
  tone: 'success' | 'error';
  message: string;
};

const {
  activeAccount,
  cycle,
  accountSummaries,
  accountCycles,
  switchActiveAccount,
  createAndSwitchAccount,
  getExportPayload,
  importFromSerializedData,
  resetCycleData
} = useTokenTrackerState();

const isSettingsOpen = ref(false);
const accountFeedback = ref<SettingsFeedback | null>(null);
const settingsDataFeedback = ref<SettingsFeedback | null>(null);
const newAccountName = ref('');
const newAccountProvider = ref<TrackerAccountProvider>('custom');
const newAccountCadence = ref<TrackerCycleCadence>('monthly');
const { language, setLanguage } = useUiLanguage();
const { t } = useI18n();

const languageLabel = computed(() => t(appLanguageDescriptorByValue[language.value].badgeLabelKey));
const settingsAccounts = computed(() =>
  accountSummaries.map((account) => ({
    id: account.id,
    name: account.name,
    providerLabel: toProviderLabel(account.provider),
    cadenceLabel: toCadenceLabel(account.cadence),
    activeCycleLabel: `${account.activeCycleStart} -> ${account.activeCycleEnd}`
  }))
);
const providerOptions = computed<Array<{ value: TrackerAccountProvider; label: string }>>(() => [
  { value: 'copilot', label: t('settings.accounts.provider.copilot') },
  { value: 'claude', label: t('settings.accounts.provider.claude') },
  { value: 'codex', label: t('settings.accounts.provider.codex') },
  { value: 'custom', label: t('settings.accounts.provider.custom') }
]);
const cadenceOptions = computed<Array<{ value: TrackerCycleCadence; label: string }>>(() => [
  { value: 'monthly', label: t('settings.accounts.cadence.monthly') },
  { value: 'weekly', label: t('settings.accounts.cadence.weekly') }
]);

function toProviderLabel(provider: TrackerAccountProvider): string {
  switch (provider) {
    case 'copilot':
      return t('settings.accounts.provider.copilot');
    case 'claude':
      return t('settings.accounts.provider.claude');
    case 'codex':
      return t('settings.accounts.provider.codex');
    case 'custom':
      return t('settings.accounts.provider.custom');
  }
}

function toCadenceLabel(cadence: TrackerCycleCadence): string {
  return cadence === 'weekly'
    ? t('settings.accounts.cadence.weekly')
    : t('settings.accounts.cadence.monthly');
}

function toLastMeasurementLabel(cycleRecord: TrackerCycleRecord): string {
  const latest = Object.entries(cycleRecord.state.usageHistory)
    .filter(([, value]) => Number.isFinite(value))
    .sort(([a], [b]) => b.localeCompare(a))[0];

  if (!latest) {
    return t('accounts.cycles.none');
  }

  return `${latest[0]} · ${formatPercent(Number(latest[1]))}`;
}

function openSettings() {
  settingsDataFeedback.value = null;
  isSettingsOpen.value = true;
}

function handleSwitchAccount(accountId: string) {
  const switched = switchActiveAccount(accountId);

  accountFeedback.value = {
    tone: switched ? 'success' : 'error',
    message: switched
      ? t('settings.accounts.switchSuccess')
      : t('settings.accounts.switchError')
  };
}

function handleCreateAccountFromPayload(payload: CreateTrackerAccountInput) {
  try {
    createAndSwitchAccount(payload);
    accountFeedback.value = {
      tone: 'success',
      message: t('settings.accounts.createSuccess')
    };
  } catch {
    accountFeedback.value = {
      tone: 'error',
      message: t('settings.accounts.createError')
    };
  }
}

function handleCreateAccount() {
  handleCreateAccountFromPayload({
    name: newAccountName.value,
    provider: newAccountProvider.value,
    cadence: newAccountCadence.value
  });

  newAccountName.value = '';
}

function toImportErrorMessage(errorCode: ImportDataErrorCode): string {
  switch (errorCode) {
    case 'invalid-json':
      return t('settings.data.importError.invalidJson');
    case 'unsupported-schema':
      return t('settings.data.importError.unsupportedSchema');
    case 'invalid-payload':
      return t('settings.data.importError.invalidPayload');
    case 'cycle-mismatch':
      return t('settings.data.importError.cycleMismatch');
    case 'invalid-state':
      return t('settings.data.importError.invalidState');
    default:
      return t('settings.data.importError.invalidPayload');
  }
}

function handleExportData() {
  if (typeof document === 'undefined' || typeof URL === 'undefined' || typeof Blob === 'undefined') {
    settingsDataFeedback.value = {
      tone: 'error',
      message: t('settings.data.exportUnavailable')
    };
    return;
  }

  const payload = getExportPayload(language.value);
  const serializedPayload = serializeDataExportPayload(payload);
  const fileName = buildDataExportFileName(payload.cycle);
  const blob = new Blob([serializedPayload], { type: 'application/json;charset=utf-8' });
  const exportUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = exportUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(exportUrl);

  settingsDataFeedback.value = {
    tone: 'success',
    message: t('settings.data.exportSuccess')
  };
}

async function handleImportData(file: File) {
  try {
    const raw = await file.text();
    const importResult = importFromSerializedData(raw);

    if (!importResult.ok) {
      settingsDataFeedback.value = {
        tone: 'error',
        message: toImportErrorMessage(importResult.errorCode)
      };
      return;
    }

    if (importResult.importedLanguage) {
      setLanguage(importResult.importedLanguage);
    }

    settingsDataFeedback.value = {
      tone: 'success',
      message: t('settings.data.importSuccess')
    };
  } catch {
    settingsDataFeedback.value = {
      tone: 'error',
      message: t('settings.data.importError.read')
    };
  }
}

function handleResetCycle() {
  if (typeof window !== 'undefined' && !window.confirm(t('settings.data.resetConfirm'))) {
    return;
  }

  resetCycleData();

  settingsDataFeedback.value = {
    tone: 'success',
    message: t('settings.data.resetSuccess')
  };
}
</script>
