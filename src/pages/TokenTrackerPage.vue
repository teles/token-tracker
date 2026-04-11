<template>
  <main class="min-h-screen">
    <div class="px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
      <div class="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <PageHeader
          :language-label="languageLabel"
          current-page="tracker"
          title-key="header.title"
          @open-settings="openSettings"
          @navigate="emit('navigate', $event)"
        />

        <section class="panel-surface p-4 sm:p-5">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div class="space-y-1">
              <p class="panel-title">{{ t('tracker.account.activeTitle') }}</p>
              <p class="text-lg font-semibold text-cyan-100">{{ activeAccount.name }}</p>
              <p class="text-xs text-slate-400">
                {{ toProviderLabel(activeAccount.provider) }} · {{ toCadenceLabel(activeAccount.cadence) }} ·
                {{ cycle.cycleStart }} -> {{ cycle.resetDate }}
              </p>
            </div>

            <label class="flex w-full flex-col gap-1 sm:w-64">
              <span class="text-xs uppercase tracking-[0.16em] text-slate-500">{{ t('tracker.account.switch') }}</span>
              <select
                :value="activeAccount.id"
                class="w-full rounded-xl border border-slate-700/70 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-300/60"
                @change="handleQuickAccountSwitch(($event.target as HTMLSelectElement).value)"
              >
                <option
                  v-for="account in accountSummaries"
                  :key="account.id"
                  :value="account.id"
                >
                  {{ account.name }}
                </option>
              </select>
            </label>
          </div>
        </section>

        <UsageInputCard
          ref="usageInputCardRef"
          :cycle="cycle"
          :measurement-date-input="formState.measurementDate"
          :consumed-percent-input="formState.consumedPercent"
          :day-note-input="formState.dayNote"
          :day-note-max-length="dayNoteMaxLength"
          :errors="validationErrors"
          @update:measurement-date="updateMeasurementDateInput"
          @update:consumed-percent="updateConsumedPercentInput"
          @update:day-note="updateDayNoteInput"
        />

        <section class="grid items-start gap-6 xl:grid-cols-[1.6fr_1fr]">
          <div class="space-y-4">
            <PlanningShortcuts :planning-status-label="planningStatusLabel" @apply="applyShortcut" />
            <CalendarHeatmap
              :days="calendarDays"
              :view-mode="temporalViewMode"
              :chart-model="usageChartModel"
              :month-label="monthLabel"
              @toggle-day="toggleFutureDay"
              @select-day="handleSelectDay"
              @change-view="temporalViewMode = $event"
            />
            <CalendarLegend :mode="temporalViewMode" />
          </div>

          <div class="space-y-4">
            <InsightCard :message="diagnostics.insightMessage" :status="diagnostics.safetyStatus" />
            <DiagnosticsGrid :summary="diagnostics" />
          </div>
        </section>
      </div>
    </div>

    <ProjectFooter />
    <SettingsModal
      :open="isSettingsOpen"
      :language="language"
      :accounts="settingsAccounts"
      :active-account-id="activeAccount.id"
      :account-feedback="settingsAccountFeedback"
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
import { computed, nextTick, ref } from 'vue';
import CalendarHeatmap from '@/components/CalendarHeatmap.vue';
import CalendarLegend from '@/components/CalendarLegend.vue';
import DiagnosticsGrid from '@/components/DiagnosticsGrid.vue';
import InsightCard from '@/components/InsightCard.vue';
import PageHeader from '@/components/PageHeader.vue';
import PlanningShortcuts from '@/components/PlanningShortcuts.vue';
import ProjectFooter from '@/components/ProjectFooter.vue';
import SettingsModal from '@/components/SettingsModal.vue';
import UsageInputCard from '@/components/UsageInputCard.vue';
import { useI18n } from '@/composables/useI18n';
import { useTokenTrackerState } from '@/composables/useTokenTrackerState';
import {
  buildDataExportFileName,
  serializeDataExportPayload
} from '@/services/data-transfer';
import { useUiLanguage } from '@/composables/useUiLanguage';
import { appLanguageDescriptorByValue } from '@/types/app-settings';
import type {
  ISODateString,
  TemporalViewMode,
  TrackerAccountProvider,
  TrackerCycleCadence
} from '@/types/token-tracker';
import type { ImportDataErrorCode } from '@/services/data-transfer';

const emit = defineEmits<{
  (event: 'navigate', page: 'tracker' | 'history' | 'accounts'): void;
}>();

const {
  cycle,
  activeAccount,
  accountSummaries,
  formState,
  dayNoteMaxLength,
  validationErrors,
  monthLabel,
  diagnostics,
  calendarDays,
  usageChartModel,
  planningStatusLabel,
  updateMeasurementDateInput,
  updateConsumedPercentInput,
  updateDayNoteInput,
  toggleFutureDay,
  applyShortcut,
  switchActiveAccount,
  getExportPayload,
  importFromSerializedData,
  resetCycleData
} = useTokenTrackerState();

type UsageInputCardExposed = {
  focusConsumedPercentInput: () => void;
};

type SettingsFeedback = {
  tone: 'success' | 'error';
  message: string;
};

const usageInputCardRef = ref<UsageInputCardExposed | null>(null);
const temporalViewMode = ref<TemporalViewMode>('heatmap');
const isSettingsOpen = ref(false);
const settingsAccountFeedback = ref<SettingsFeedback | null>(null);
const settingsDataFeedback = ref<SettingsFeedback | null>(null);
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

async function handleSelectDay(date: ISODateString) {
  updateMeasurementDateInput(date);
  await nextTick();
  usageInputCardRef.value?.focusConsumedPercentInput();
}

function openSettings() {
  settingsAccountFeedback.value = null;
  settingsDataFeedback.value = null;
  isSettingsOpen.value = true;
}

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

function handleQuickAccountSwitch(accountId: string) {
  const switched = switchActiveAccount(accountId);

  settingsAccountFeedback.value = {
    tone: switched ? 'success' : 'error',
    message: switched
      ? t('settings.accounts.switchSuccess')
      : t('settings.accounts.switchError')
  };
}

function handleSwitchAccount(accountId: string) {
  const switched = switchActiveAccount(accountId);

  settingsAccountFeedback.value = {
    tone: switched ? 'success' : 'error',
    message: switched
      ? t('settings.accounts.switchSuccess')
      : t('settings.accounts.switchError')
  };
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
