<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
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
        class="relative w-full max-w-md rounded-2xl border border-slate-700/70 bg-slate-900/95 shadow-panel"
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

        <div class="space-y-4 px-5 py-4">
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

          <p class="text-xs text-slate-500">
            {{ t('settings.languageHint') }}
          </p>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue';
import { useI18n } from '@/composables/useI18n';
import { appLanguageDescriptors } from '@/types/app-settings';
import type { AppLanguage } from '@/types/app-settings';

interface Props {
  open: boolean;
  language: AppLanguage;
}

defineProps<Props>();

const emit = defineEmits<{
  (event: 'close'): void;
  (event: 'update:language', value: AppLanguage): void;
}>();

const { t } = useI18n();

const languageOptions = computed<Array<{ value: AppLanguage; label: string }>>(() => [
  ...appLanguageDescriptors.map((descriptor) => ({
    value: descriptor.value,
    label: t(descriptor.optionLabelKey)
  }))
]);

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
