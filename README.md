# vincent.landeau.github.io
Site Portfolio Personnel

## Content (SQLite CRM)

Portfolio copy, works, and clients are stored in [`public/portfolio.sqlite`](public/portfolio.sqlite). The static site reads that file in the browser via [`sql.js-httpvfs`](https://github.com/phiresky/sql.js-httpvfs).

- `npm run db:seed` — rebuild the database from the legacy TS files in `src/assets/` (first-time migration).
- `npm run crm` — local admin at http://127.0.0.1:4174 (works, clients, site copy, languages).

After editing in the CRM, refresh the Vite dev site to pick up changes. Commit `public/portfolio.sqlite` (and any uploaded media) when you publish.
