# Expense Visualizer Pro

A polished personal expense tracker with budgeting, forecasting, CSV import/export, and interactive charts.

一个可视化个人记账工具，支持预算管理、月底预测、CSV 导入导出和多图表分析。

## Live Demo

- Demo: `TODO: add your deployed URL`

## Screenshots

- Dashboard: `TODO: add screenshot`
- Transactions: `TODO: add screenshot`
- Budgets: `TODO: add screenshot`
- Insights: `TODO: add screenshot`

## Why This Project

- Useful daily workflow: track, budget, review, improve.
- Modern UX: dashboard cards, progress states, mobile-friendly tabs.
- Strong local-first architecture with versioned storage migration.
- Easy to run and contribute.

## Features

- Multi-page UI: `Dashboard / Transactions / Budgets / Insights`
- Add, edit, delete, duplicate expense records
- Quick templates for recurring spending
- CSV export + CSV import
- Monthly budget + category budgets
- Budget mode (`conservative / balanced / flexible`)
- End-of-month spend forecast
- Necessary vs non-necessary spend ratio
- Local persistence with schema validation and migration
- PWA support (installable)
- Basic i18n support (zh/en)

## Tech Stack

- React + TypeScript + Vite
- Chart.js + react-chartjs-2
- date-fns
- zod
- i18next + react-i18next
- Vitest
- ESLint + Prettier + Husky + lint-staged

## Quick Start

```bash
npm install
npm run dev
```

## Production Preview

```bash
npm run build
npm run preview -- --host 127.0.0.1
```

## Scripts

- `npm run dev` start development server
- `npm run build` type-check and build
- `npm run preview` preview production build
- `npm run test` run tests
- `npm run lint` run lint checks
- `npm run format` format codebase

## Project Structure

```text
src/
  App.tsx
  main.tsx
  i18n.ts
  constants.ts
  types.ts
  components/
    CountUpNumber.tsx
    OnboardingEmpty.tsx
  lib/
    expenses.ts
    csv.ts
    budget.ts
    storage.ts
    *.test.ts
```

## Roadmap

- [ ] Full i18n coverage (all labels and messages)
- [ ] Cloud sync / account system
- [ ] Advanced filters (week / quarter / year)
- [ ] More insight widgets and anomaly alerts

## Contributing

Issues and PRs are welcome.

1. Fork the repo
2. Create a feature branch
3. Run `npm run lint && npm run test`
4. Open a PR

## GitHub Growth Checklist

- Add repository topics:
  - `expense-tracker`
  - `budgeting`
  - `react`
  - `typescript`
  - `pwa`
  - `data-visualization`
- Add screenshots and demo URL in this README
- Pin this repo on your GitHub profile
- Share the project on 2-3 communities with screenshots and demo link
