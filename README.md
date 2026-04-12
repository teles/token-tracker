<p align="center">
  <img src="public/favicon.svg" alt="Token Tracker logo" width="96" />
</p>

# Token Tracker

Token Tracker is a Vue 3 + TypeScript single-page app to monitor token quota consumption across cycles, plan future usage, and forecast whether quota will last until reset.

## Highlights

- Multi-account workspace with monthly or weekly cycle cadence
- Account lifecycle actions:
  - Rename account
  - Archive account (hidden from active selectors)
  - Unarchive account
  - Delete archived account
- Daily cumulative usage tracking with historical measurements
- Future ON/OFF planning by day
- Calendar modes: `Heatmap` and `Usage Chart`
- Diagnostics and projection summary (risk, pace, safe budget, estimated exhaustion)
- What-if scenarios for planning impact
- Day notes per measurement date
- Data import/export for local backup
- Internationalization (`en-US`, `pt-BR`)
- Clean routes (`/`, `/history`, `/accounts`) with account query param (`?account=<uuid>`)
- PWA support:
  - Web App Manifest + icons
  - Service Worker offline app shell
  - In-app update prompt when a new version is available
  - App shortcuts in manifest

## Tech Stack

- Vue 3 (Composition API)
- TypeScript
- Tailwind CSS
- Vite
- Vitest

## Project Structure

- `src/components`: visual components (presentation)
- `src/composables`: app/page state orchestration
- `src/domain`: pure business rules and calculations
- `src/use-cases`: higher-level composition of domain outputs
- `src/services`: persistence, workspace/account operations, data transfer, PWA registration
- `src/types`: shared domain and app types
- `src/utils`: date/format helpers
- `src/mocks`: cycle defaults and seed data
- `public`: static assets (`manifest.webmanifest`, icons, `sw.js`)
- `tests`: unit tests for domain, services, and composables

## Scripts

```bash
pnpm dev      # start local dev server
pnpm build    # type-check + production build
pnpm preview  # preview production build
pnpm test     # run unit tests
```

## Local Run

```bash
pnpm install
pnpm dev
```
