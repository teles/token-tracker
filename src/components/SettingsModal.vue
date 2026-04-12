<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center sm:p-6">
      <button
        type="button"
        class="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        :aria-label="t('settings.closeAria')"
        @click="emit('close')"
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        class="relative flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-900/95 shadow-panel sm:max-h-[calc(100dvh-3rem)]"
      >
        <header class="flex items-center justify-between border-b border-slate-700/70 px-5 py-4">
          <div>
            <p class="panel-title">{{ t('settings.preferences') }}</p>
            <h2 id="settings-title" class="mt-2 text-lg font-semibold text-slate-100">{{ t('settings.title') }}</h2>
          </div>
          <button
            type="button"
            class="rounded-lg border border-slate-600/70 px-2 py-1 text-xs text-slate-300 transition hover:border-cyan-300/60 hover:text-cyan-100"
            @click="emit('close')"
          >
            {{ t('settings.close') }}
          </button>
        </header>

        <div class="min-h-0 space-y-4 overflow-y-auto px-5 py-4">
          <fieldset class="space-y-2">
            <legend class="text-sm font-medium text-slate-100">{{ t('settings.language') }}</legend>

            <label
              v-for="option in languageOptions"
              :key="option.value"
              class="flex cursor-pointer items-center justify-between rounded-xl border border-slate-700/70 bg-slate-950/55 px-3 py-2.5 text-sm"
            >
              <span class="text-slate-100">{{ option.label }}</span>
              <input
                type="radio"
                name="app-language"
                class="h-4 w-4 accent-cyan-300"
                :value="option.value"
                :checked="option.value === language"
                @change="emit('update:language', option.value)"
              />
            </label>
          </fieldset>

          <section class="space-y-2 border-t border-slate-700/70 pt-4">
            <p class="text-sm font-medium text-slate-100">{{ t('settings.accounts.title') }}</p>

            <div class="space-y-2">
              <button
                v-for="account in accounts"
                :key="account.id"
                type="button"
                class="w-full rounded-xl border px-3 py-2 text-left transition"
                :class="account.id === activeAccountId
                  ? 'border-cyan-200/70 bg-cyan-500/15'
                  : 'border-slate-700/80 bg-slate-950/55 hover:border-slate-500/80'"
                @click="emit('switch-account', account.id)"
              >
                <div class="flex items-start justify-between gap-2">
                  <div class="space-y-1">
                    <p class="text-sm font-medium text-slate-100">{{ account.name }}</p>
                    <p class="text-[11px] text-slate-400">{{ account.providerLabel }} · {{ account.cadenceLabel }}</p>
                    <p class="text-[11px] text-slate-500">{{ account.activeCycleLabel }}</p>
                  </div>
                  <span
                    v-if="account.id === activeAccountId"
                    class="rounded-md border border-cyan-300/60 bg-cyan-500/20 px-2 py-0.5 text-[10px] text-cyan-100"
                  >
                    {{ t('settings.accounts.active') }}
                  </span>
                </div>
              </button>
            </div>

            <p
              v-if="accountFeedback?.message"
              class="text-xs"
              :class="accountFeedback.tone === 'success' ? 'text-emerald-200' : 'text-rose-200'"
            >
              {{ accountFeedback.message }}
            </p>
          </section>

          <section class="space-y-2 border-t border-slate-700/70 pt-4">
            <p class="text-sm font-medium text-slate-100">{{ t('settings.data.title') }}</p>
            <div class="grid gap-2 sm:grid-cols-3">
              <button
                type="button"
                class="rounded-xl border border-slate-700/80 bg-slate-950/55 px-3 py-2 text-sm text-slate-100 transition hover:border-cyan-300/60 hover:text-cyan-100"
                @click="emit('export-data')"
              >
                {{ t('settings.data.export') }}
              </button>
              <button
                type="button"
                class="rounded-xl border border-slate-700/80 bg-slate-950/55 px-3 py-2 text-sm text-slate-100 transition hover:border-cyan-300/60 hover:text-cyan-100"
                @click="triggerImportSelection"
              >
                {{ t('settings.data.import') }}
              </button>
              <button
                type="button"
                class="rounded-xl border border-rose-400/50 bg-rose-500/10 px-3 py-2 text-sm text-rose-100 transition hover:border-rose-300/70 hover:bg-rose-500/15"
                @click="emit('reset-cycle')"
              >
                {{ t('settings.data.reset') }}
              </button>
            </div>

            <input
              ref="importFileInputRef"
              type="file"
              accept="application/json,.json"
              class="sr-only"
              @change="onImportFileChange"
            />

            <p class="text-xs text-slate-500">
              {{ t('settings.data.hint') }}
            </p>

            <p
              v-if="dataFeedback?.message"
              class="text-xs"
              :class="dataFeedback.tone === 'success' ? 'text-emerald-200' : 'text-rose-200'"
            >
              {{ dataFeedback.message }}
            </p>
          </section>

          <p class="text-xs text-slate-500">
            {{ t('settings.languageHint') }}
          </p>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from '@/composables/useI18n';
import { appLanguageDescriptors } from '@/types/app-settings';
import type { AppLanguage } from '@/types/app-settings';

type SettingsFeedbackTone = 'success' | 'error';

interface SettingsDataFeedback {
  tone: SettingsFeedbackTone;
  message: string;
}

interface SettingsAccountOption {
  id: string;
  name: string;
  providerLabel: string;
  cadenceLabel: string;
  activeCycleLabel: string;
}

interface Props {
  open: boolean;
  language: AppLanguage;
  accounts: SettingsAccountOption[];
  activeAccountId: string;
  accountFeedback?: SettingsDataFeedback | null;
  dataFeedback?: SettingsDataFeedback | null;
}

defineProps<Props>();

const emit = defineEmits<{
  (event: 'close'): void;
  (event: 'update:language', value: AppLanguage): void;
  (event: 'export-data'): void;
  (event: 'import-data', file: File): void;
  (event: 'reset-cycle'): void;
  (event: 'switch-account', accountId: string): void;
}>();

const { t } = useI18n();
const importFileInputRef = ref<HTMLInputElement | null>(null);

const languageOptions = computed<Array<{ value: AppLanguage; label: string }>>(() => [
  ...appLanguageDescriptors.map((descriptor) => ({
    value: descriptor.value,
    label: t(descriptor.optionLabelKey)
  }))
]);

function triggerImportSelection() {
  importFileInputRef.value?.click();
}

function onImportFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const selectedFile = target.files?.[0];

  target.value = '';

  if (!selectedFile) {
    return;
  }

  emit('import-data', selectedFile);
}

function handleWindowKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    emit('close');
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleWindowKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleWindowKeydown);
});
</script>
