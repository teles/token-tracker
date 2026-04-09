<template>
  <footer class="panel-surface relative overflow-hidden border-slate-700/70 p-4 sm:p-5">
    <div
      class="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-r from-cyan-400/10 via-violet-400/10 to-emerald-400/10 blur-xl"
      aria-hidden="true"
    />

    <div class="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="space-y-1">
        <p class="panel-title">Open Source</p>
        <p class="text-sm text-slate-200">Token Tracker is built in public and available on GitHub.</p>
      </div>

      <a
        href="https://github.com/teles/token-tracker"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center justify-center rounded-xl border border-cyan-300/40 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:border-cyan-200/70 hover:bg-cyan-400/15 hover:text-cyan-50"
      >
        View Repository
      </a>
    </div>
  </footer>
</template>
