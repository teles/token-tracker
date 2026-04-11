<template>
  <article class="rounded-xl border bg-slate-900/50 p-4" :class="toneClasses[tone]">
    <p class="panel-title">{{ title }}</p>
    <div class="mt-3 flex items-center gap-3">
      <slot name="leading" />
      <p class="text-xl font-semibold text-slate-100">{{ value }}</p>
    </div>
    <p v-if="hint" class="mt-2 text-xs text-slate-400">{{ hint }}</p>
  </article>
</template>

<script setup lang="ts">
interface Props {
  title: string;
  value: string;
  hint?: string;
  tone?: 'neutral' | 'safe' | 'attention' | 'risk';
}

withDefaults(defineProps<Props>(), {
  hint: '',
  tone: 'neutral'
});

const toneClasses = {
  neutral: 'border-slate-700/60',
  safe: 'border-emerald-400/40 bg-emerald-900/20',
  attention: 'border-amber-300/40 bg-amber-900/20',
  risk: 'border-rose-300/40 bg-rose-900/20'
};
</script>
