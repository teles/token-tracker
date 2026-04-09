<template>
  <main class="min-h-screen">
    <div class="px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
      <div class="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <PageHeader />

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
  </main>
</template>

<script setup lang="ts">
import { nextTick, ref } from 'vue';
import CalendarHeatmap from '@/components/CalendarHeatmap.vue';
import CalendarLegend from '@/components/CalendarLegend.vue';
import DiagnosticsGrid from '@/components/DiagnosticsGrid.vue';
import InsightCard from '@/components/InsightCard.vue';
import PageHeader from '@/components/PageHeader.vue';
import PlanningShortcuts from '@/components/PlanningShortcuts.vue';
import ProjectFooter from '@/components/ProjectFooter.vue';
import UsageInputCard from '@/components/UsageInputCard.vue';
import { useTokenTrackerState } from '@/composables/useTokenTrackerState';
import type { ISODateString, TemporalViewMode } from '@/types/token-tracker';

const {
  cycle,
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
  applyShortcut
} = useTokenTrackerState();

type UsageInputCardExposed = {
  focusConsumedPercentInput: () => void;
};

const usageInputCardRef = ref<UsageInputCardExposed | null>(null);
const temporalViewMode = ref<TemporalViewMode>('heatmap');

async function handleSelectDay(date: ISODateString) {
  updateMeasurementDateInput(date);
  await nextTick();
  usageInputCardRef.value?.focusConsumedPercentInput();
}
</script>
