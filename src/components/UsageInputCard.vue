<template>
  <section ref="sectionRef" class="panel-surface p-5 sm:p-6">
    <div class="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <p class="panel-title">Current Snapshot</p>
        <h2 class="mt-2 text-lg font-semibold text-slate-100">Manual Usage Input</h2>
      </div>
      <div class="rounded-xl border border-cyan-400/25 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200">
        Cycle {{ cycleStartLabel }} - {{ cycleResetLabel }}
      </div>
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <label class="space-y-2">
        <span class="text-sm font-medium text-slate-200">Measurement Date</span>
        <input
          ref="measurementDateInputRef"
          required
          type="date"
          :value="measurementDateInput"
          :min="cycle.cycleStart"
          :max="cycle.resetDate"
          class="w-full rounded-xl border border-slate-700/70 bg-slate-900/80 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-300/60"
          :class="errors.measurementDate ? 'border-rose-300/60 focus:border-rose-300/70' : ''"
          @input="onMeasurementDateInput"
        />
        <p v-if="errors.measurementDate" class="text-xs text-rose-200">{{ errors.measurementDate }}</p>
      </label>

      <label class="space-y-2">
        <span class="text-sm font-medium text-slate-200">Consumed Quota (%)</span>
        <input
          ref="consumedPercentInputRef"
          required
          type="number"
          min="0"
          max="100"
          step="0.1"
          :value="consumedPercentInput"
          class="w-full rounded-xl border border-slate-700/70 bg-slate-900/80 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-300/60"
          :class="errors.consumedPercent ? 'border-rose-300/60 focus:border-rose-300/70' : ''"
          @input="onConsumedPercentInput"
        />
        <p v-if="errors.consumedPercent" class="text-xs text-rose-200">{{ errors.consumedPercent }}</p>
      </label>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { CycleInfo, InputValidationErrors } from '@/types/token-tracker';
import { toShortDateLabel } from '@/utils/date';

interface Props {
  cycle: CycleInfo;
  measurementDateInput: string;
  consumedPercentInput: string;
  errors: InputValidationErrors;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (event: 'update:measurementDate', value: string): void;
  (event: 'update:consumedPercent', value: string): void;
}>();

const cycleStartLabel = toShortDateLabel(props.cycle.cycleStart);
const cycleResetLabel = toShortDateLabel(props.cycle.resetDate);

const sectionRef = ref<HTMLElement | null>(null);
const measurementDateInputRef = ref<HTMLInputElement | null>(null);
const consumedPercentInputRef = ref<HTMLInputElement | null>(null);

function onMeasurementDateInput(event: Event) {
  const target = event.target as HTMLInputElement;
  emit('update:measurementDate', target.value);
}

function onConsumedPercentInput(event: Event) {
  const target = event.target as HTMLInputElement;
  emit('update:consumedPercent', target.value);
}

function focusMeasurementDateInput() {
  sectionRef.value?.scrollIntoView({
    behavior: 'smooth',
    block: 'center'
  });

  requestAnimationFrame(() => {
    measurementDateInputRef.value?.focus();
  });
}

function focusConsumedPercentInput() {
  sectionRef.value?.scrollIntoView({
    behavior: 'smooth',
    block: 'center'
  });

  requestAnimationFrame(() => {
    consumedPercentInputRef.value?.focus();
  });
}

defineExpose({
  focusMeasurementDateInput,
  focusConsumedPercentInput
});
</script>
