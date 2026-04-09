# Token Tracker

Frontend single-page app built with Vue 3 + TypeScript + Tailwind CSS.

## What is included

- One main screen focused on tracking a single quota/account
- Manual input for measurement date and consumed percentage
- Monthly calendar with past heatmap + future planning states
- Diagnostic and projection cards
- What-if scenario cards for quick planning impact
- Local persistence (snapshot + planning) via localStorage
- Main insight message generated from domain calculations
- Unit tests for business rules and pure functions (Vitest)

## Tech stack

- Vue 3 (Composition API)
- TypeScript
- Tailwind CSS
- Vitest

## Project structure

- `src/components`: visual components only
- `src/composables`: screen state and user interaction orchestration
- `src/domain`: pure business rules and calculations
- `src/use-cases`: application-level composition of domain logic
- `src/types`: explicit domain types
- `src/utils`: reusable helpers
- `src/mocks`: initial realistic data
- `tests`: unit tests for domain and use cases

## Run locally

```bash
npm install
npm run dev
```

## Run tests

```bash
npm run test
```
