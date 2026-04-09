<template>
  <section class="panel-surface p-5 sm:p-6" :class="toneClass">
    <p class="panel-title">Primary Insight</p>
    <p class="mt-3 max-w-3xl text-base text-slate-100 sm:text-lg">{{ message }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { SafetyStatus } from '@/types/token-tracker';

interface Props {
  message: string;
  status: SafetyStatus;
}

const props = defineProps<Props>();

const toneClassByStatus: Record<SafetyStatus, string> = {
  safe: 'border-emerald-400/40 bg-emerald-900/15',
  attention: 'border-amber-300/40 bg-amber-900/15',
  risk: 'border-rose-300/40 bg-rose-900/15'
};

const toneClass = computed(() => toneClassByStatus[props.status]);
</script>
