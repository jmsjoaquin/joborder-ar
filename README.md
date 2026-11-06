# Local Accomplishment Report Builder

A local-first, single-employee cutoff builder for preparing the official Annex C Individual Daily Accomplishment Report. The editor is optimized for pasting Codex-generated multiline output across a reporting cutoff; it is not a task-management or Kanban system.

## What it does

- Automatically creates 1–15 and 16–month-end cutoff reports
- Generates every calendar date and marks weekdays/weekends automatically
- Supports Working, WFH, Weekend, Holiday, Suspended, Leave, and Other day statuses
- Provides bulk date status, target assignment, previous-cutoff target copy, and Completed 100% actions
- Uses one large multiline output field per date and debounced auto-save
- Highlights missing required outputs and targets
- Shows an official-form browser preview
- Generates and stores the preserved A4 landscape Annex C PDF
- Keeps overtime output blank while retaining the official column
- Exports the SQLite database and generated PDFs as a local ZIP backup

The architecture and exact PDF strategy are documented in [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md).

## Local setup

Requirements: Node.js 20.9 or newer.

```bash
npm install
cp .env.example .env
npx prisma migrate dev
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). No login or external database is required.

For local production mode:

```bash
npm run build
npm start
```

## Local files

```text
prisma/dev.db          SQLite report database
generated-reports/     Generated Annex C PDF files
```

The Settings page provides **Export Backup**, which downloads both locations as a ZIP.

Generated filenames use this format:

```text
AR_2026-08-16_to_2026-08-31.pdf
```

## Main workflow

```text
Open Reports
→ Open Current Cutoff
→ Configure Dates
→ Paste outputs in Entries
→ Review missing items
→ Preview official Annex C
→ Generate PDF
```

PDF generation preserves the supplied official format: A4 landscape, employee header, four-column table, blank overtime column, certification statements, and signature areas.
