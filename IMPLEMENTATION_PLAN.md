# Local Accomplishment Report Builder — Implementation Plan

## Folder structure

```text
app/
  (builder)/
    layout.tsx                    Minimal Reports / Current Cutoff / Profile / Settings shell
    reports/page.tsx              Cutoff history and primary open-current action
    reports/current/route.ts      Ensures and opens the current cutoff
    reports/[id]/page.tsx         Dates, Entries, and Preview tabs
    profile/page.tsx              Single local employee profile
    saved-targets/page.tsx        Small reusable target library
    settings/page.tsx             Local storage details and backup
  actions/
    reports.ts                    Auto-save, bulk editing, lifecycle, target helpers
    settings.ts                   Profile and saved-target mutations
  api/
    reports/[id]/pdf/route.ts     Generate, store, and download official Annex C
    backup/route.ts               Export SQLite DB and generated PDFs as ZIP
components/
  report-builder/
    date-setup.tsx                Individual and bulk day-status controls
    entries-editor.tsx            Continuous debounced editor
    annex-preview.tsx             Official form-style browser preview
    report-readiness.tsx          Missing-output/target checks
  layout/builder-nav.tsx          Minimal responsive navigation
  ui/                             Reusable controls
lib/
  dates.ts                        Date-only and cutoff utilities
  reports.ts                      Ensure cutoff/days and derive lifecycle/readiness
  report-format.ts                Output-heading past tense formatting
  annex-c-pdf.ts                  Exact printable PDF renderer
  prisma.ts                       Local SQLite Prisma client
prisma/
  schema.prisma                   SQLite models
  seed.ts                         Local profile and saved-target seed
generated-reports/                Locally generated PDFs (gitignored)
```

## Prisma SQLite schema

- `EmployeeProfile`: singleton local employee and approving-officer details.
- `Report`: unique `periodStart + periodEnd`, lifecycle (`NOT_STARTED`, `DRAFT`, `READY`, `FINAL` as a validated string), generated PDF path/time.
- `ReportDay`: one date per report with day status, target, multiline output, task status, percentage, and sort order.
- `SavedTarget`: reusable local target name/text.
- Dates are normalized to UTC midnight `DateTime` values because Prisma SQLite has no native date-only column.

## Routes

| Route | Purpose |
| --- | --- |
| `/reports` | Home and cutoff history |
| `/reports/current` | Create/open current cutoff |
| `/reports/[id]?tab=dates` | Configure work dates and bulk overrides |
| `/reports/[id]?tab=entries` | Continuous cutoff editor |
| `/reports/[id]?tab=preview` | Exact Annex C preview and readiness |
| `/profile` | Local employee profile |
| `/saved-targets` | Saved target templates |
| `/settings` | Storage location and backup export |

## Core components

`BuilderNav`, `ReportingPeriodHeader`, `DateSetup`, `EntriesEditor`,
`EntryDayCard`, `AutoSaveIndicator`, `BulkTargetPanel`, `MissingOutputsAlert`,
`ReportReadiness`, `AnnexPreview`, and saved-target/profile forms.

## Exact PDF-generation approach

- Continue using the verified PDFKit renderer and keep the supplied `AR-PHIC.pdf` dimensions: A4 landscape, Georgia when available, official four-column proportions, black rules, and compact typography.
- First page contains Annex C title, report title/period, and employee rows. Continuation pages repeat the official column header for print clarity.
- Rows are measured before drawing and never overlap or split unexpectedly. Multiline pasted output is preserved; status is appended automatically; overtime stays blank.
- The last page contains the original two certification statements and employee/approving-officer signature areas.
- Generation writes a readable `AR_YYYY-MM-DD_to_YYYY-MM-DD.pdf` file under `generated-reports/`, records its path/time, marks the report `FINAL`, and returns the same bytes for download.

## Implementation order

1. Replace the database/auth foundation with SQLite and the four local models.
2. Ensure cutoff reports and all dates automatically, then build report history/navigation.
3. Implement Dates tab, WFH, manual overrides, and bulk date status.
4. Implement continuous Entries tab, debounced auto-save, previous/bulk/saved targets, bulk completion, and readiness.
5. Implement official preview, preserved Annex C PDF, local file history, and ZIP backup.
6. Generate/migrate/seed SQLite and verify date logic, auto-save actions, PDF runtime, lint, types, and production build.
