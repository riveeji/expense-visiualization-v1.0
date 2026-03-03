# Expense Visualizer

A small personal finance web app for tracking expenses and visualizing spending trends.

## Features

- Add and delete expense records
- Filter by month, category, and keyword
- Pie chart for category breakdown
- Bar chart for monthly total trend (last 6 months)
- Export filtered data to CSV
- Persist data in browser `localStorage`

## Tech Stack

- React + TypeScript + Vite
- Chart.js + react-chartjs-2
- date-fns
- Vitest

## Quick Start

```bash
npm install
npm run dev
```

Open the app at the URL shown in terminal.

## Scripts

- `npm run dev` - Start local development server
- `npm run build` - Type check and build production bundle
- `npm run preview` - Preview production build
- `npm run test` - Run unit tests

## Project Structure

```text
src/
  App.tsx
  main.tsx
  style.css
  lib/
    expenses.ts
    expenses.test.ts
```

## Notes

- All records are stored locally in your browser.
- CSV export uses current filter results.
