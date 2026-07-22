# Habit Tracker

A mobile-first habit and wellness tracker built with Next.js, TypeScript, and Tailwind CSS. Fully static and deployable to GitHub Pages.

## Features

- **Today** — daily habits, water progress, and active sit/stand timer
- **Habits** — create, schedule, reorder, archive, and review streaks
- **Timer** — sit/stand/break cycles with notifications, sound, and vibration
- **Water** — daily goals, unit conversion, reminders (when the browser tab is available)
- **Insights** — streaks, history, weekly trends, and completion analytics
- **Settings** (profile menu) — theme, reminders, import/export/reset

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Local development server |
| `npm run build` | Static export to `out/` |
| `npm test` | Run Vitest suite |
| `npm start` | Serve the `out/` directory (optional; not required for GitHub Pages) |

## GitHub Pages

Push to `main` to trigger `.github/workflows/deploy-pages.yml`. The workflow builds with `output: "export"` and deploys the `out` directory. Project pages are served under `/REPOSITORY_NAME/`.

Local development always runs at the site root (`/`) because `GITHUB_ACTIONS` is unset.

## Data

All data is stored in the browser via LocalStorage. Use Settings to export, import, or reset. Reminder notifications only work while the browser (and ideally the tab) is available — they are not guaranteed when the browser is fully closed.
