# Integrated Maintenance, KPI, HSE, QC & Equipment History Management System

A database-driven web application that replaces the Excel-based maintenance
reporting workflow (`Ap Progress 31-Aug-26.xlsx`) with one connected
database, interactive dashboards and drill-down reporting.

**The core rule the whole system is built around:** enter a maintenance
activity against an equipment tag today, and you can still retrieve that
activity — its finding, photographs, action and closure — years later by
searching that tag. Every KPI on the dashboard is computed live from
transactional records; nothing is hand-typed.

## Tech stack

| Layer          | Choice                                                           |
| -------------- | ----------------------------------------------------------------- |
| Framework      | Next.js 16 (App Router, TypeScript, Turbopack)                    |
| UI              | Tailwind CSS v4, Recharts for charts                               |
| Database        | PostgreSQL via Prisma ORM 6                                        |
| Auth            | Auth.js (NextAuth v5) credentials provider, JWT sessions, bcrypt   |
| File storage    | Local disk under `public/uploads` (swappable — see below)          |
| Excel           | `exceljs` for both export and import                               |

Mutations are implemented as **Next.js Server Actions** invoked from plain
`<form action={...}>` elements wherever possible, so most of the app works
without client-side JavaScript (progressive enhancement) and there's very
little bespoke client state to maintain.

## Easiest way to run this on your own computer (no technical background needed)

This skips installing PostgreSQL yourself by using a free hosted database
instead — you just copy one link into a file.

1. **Install Node.js.** Go to <https://nodejs.org>, download the "LTS"
   version for your operating system, and run the installer (click Next /
   Continue through the defaults).

2. **Get a free database connection string.** Go to <https://neon.tech>,
   sign up for a free account, and create a new project. On the project
   dashboard, find the box labeled "Connection string" and copy it (it
   starts with `postgresql://`).

3. **Open a terminal in this project folder.**
   - Windows: open the folder, then right-click inside it and choose
     "Open in Terminal" (or open Command Prompt and `cd` into the folder).
   - Mac: open the folder in Finder, right-click, "New Terminal at Folder".

4. **Create your `.env` file.** Copy `.env.example` to a new file named
   `.env` in the same folder, then open `.env` in any text editor and:
   - Replace the `DATABASE_URL` line with the connection string you copied
     from Neon.
   - Replace `AUTH_SECRET` with any random sentence of your own (e.g.
     `this-is-my-secret-passphrase-12345`) — it just needs to be unique to you.

5. **Run one command:**

   ```bash
   npm install && npm run quickstart
   ```

   This installs everything, sets up the database tables, loads demo
   data, and starts the app — in that order.

6. **Open your browser** to <http://localhost:3000> and sign in with one
   of the demo accounts below. To stop the app later, go back to the
   terminal window and press `Ctrl+C`; to start it again next time, open
   a terminal in this folder and run `npm run dev`.

## Getting started (local development, manual database setup)

```bash
# 1. Start PostgreSQL and create a database (adjust to your setup)
createuser mms --pwprompt        # or use an existing role
createdb mms_dev -O mms

# 2. Configure environment
cp .env.example .env             # if not already present, then edit
# DATABASE_URL="postgresql://mms:<password>@localhost:5432/mms_dev?schema=public"
# AUTH_SECRET="<random string>"

# 3. Install dependencies, apply the schema, seed demo data
npm install
npx prisma migrate dev
npm run db:seed

# 4. Run the app
npm run dev
```

Open <http://localhost:3000> and sign in with one of the demo accounts
below (all clearly marked `[DEMO]` in the seeded project/contractor names
per spec section 80 — this is sample data, not real project performance).

### Demo accounts (password: `password123`)

| Email                  | Role                   |
| ----------------------- | ---------------------- |
| admin@demo.local        | Administrator          |
| manager@demo.local      | Maintenance Manager    |
| engineer@demo.local     | Maintenance Engineer   |
| supervisor@demo.local   | Supervisor             |
| tech@demo.local         | Technician              |
| hse@demo.local          | HSE User                |
| qc@demo.local           | QC/QA User              |
| mgmt@demo.local         | Management (read-only)  |
| viewer@demo.local       | External / View Only    |

Other useful scripts: `npm run db:studio` (Prisma Studio, browse the
database), `npm run db:migrate` (create a new migration after editing
`prisma/schema.prisma`).

## Architecture

### Equipment as the relational spine

`Equipment.tagNumber` is unique per project and is the foreign key every
other operational table hangs off: `WorkOrder`, `PmRecord`, `CmRecord`,
`Inspection`, `Finding`, `Photo`, `Action`, `SceRecord`, `Document` all
carry `equipmentId`. The Equipment detail page (`/equipment/[id]`) is a
tabbed view (Overview, Timeline, PM, CM, Inspections, Findings, Photos,
Documents, SCE, Work Orders) that queries all of these by that one id —
see spec sections 17, 18, 60, 85.

A denormalized `EquipmentHistoryEvent` table is written alongside PM/CM/
Finding/Inspection/SCE mutations (`src/lib/equipment-history.ts`) purely
as a fast, pre-sorted feed for the Timeline tab, so it never has to fan
out across six tables on every page view.

### Centralized KPI engine

All KPI math lives in `src/lib/kpi/` (`engine.ts`, `period.ts`,
`trends.ts`, `weights.ts`) and is called from every dashboard/module page
— no screen computes its own percentages. Every ratio uses
`safePercent()` (`src/lib/format.ts`), which returns `null` on a zero
denominator so the UI renders **N/A** instead of a misleading 0% or a
`#DIV/0!`-style error (spec sections 56, 78, and the critical rule in
section 84: *"Never allow the dashboard to contain manually typed KPI
results when the underlying data exists in the system"*).

`KpiDefinition` + `KpiWeight` (Administration → KPI Management) hold the
*configuration* — target, weight, formula type, reporting frequency — for
admin-defined KPIs, validated so the HSE/QC/Planning/Maintenance weights
must total 100% (spec section 25). The **built-in** KPIs that power the
dashboard (PM compliance, CM completion, SCE compliance, HSE/QC counts,
man-hours, LTI-free counter) are computed by dedicated functions rather
than a generic formula interpreter — see "Scoping decisions" below.

### Configurable lookup lists

Spec section 54 asks for areas, units, disciplines, work centers, finding
categories, HSE/QC categories, PM frequencies, etc. to be admin-editable
without a schema change. These all live in one `ConfigOption` table keyed
by a `category` string (Administration → Configuration), rather than a
dozen near-identical lookup tables.

### Data model consolidation vs. the spec's table list

Spec section 69 lists `hse_kpis`, `qc_kpis`, `planning_kpis`,
`kpi_definitions`, `kpi_weights`, `kpi_results` as separate tables, and a
separate `man_hours` table. This implementation consolidates:

- `hse_kpis` / `qc_kpis` / `planning_kpis` → `KpiDefinition` rows tagged
  `module: HSE | QC | PLANNING`, feeding one `KpiResult` cache — this is
  what section 55's "centralized KPI engine, don't hard-code KPIs per
  screen" is actually asking for.
- `man_hours` → derived from `Timesheet` rows (`getManHourKpis` in the
  engine) rather than duplicated.

Every other table in section 69 exists as named in `prisma/schema.prisma`
(see the file's header comment for the full rationale).

### File storage

Photos and documents are written to `public/uploads/{photos,documents}`
at request time (`src/lib/file-storage.ts`) and served by Next.js as
static files — simplest possible setup for local development. To move to
S3-compatible object storage in production, replace the body of
`saveUploadedFile()` with an upload to your bucket and return its
public/CDN URL; nothing else in the codebase needs to change, since every
caller only depends on getting back a servable `filePath`.

## Roles & permissions

Role → module access is a static matrix in `src/lib/rbac.ts`
(`PERMISSION_MATRIX`), enforced by `requireModuleAccess()` on every page
and by `middleware`/`proxy.ts` for authentication. See spec section 5 for
the intended scope of each role; the implemented matrix:

| Role                  | Full access                                    | Read-only elsewhere |
| ---------------------- | ----------------------------------------------- | -------------------- |
| Administrator           | Everything                                       | —                     |
| Maintenance Manager     | Maintenance, Equipment, Findings, Actions, SCE   | HSE, QC, Timesheet    |
| Maintenance Engineer    | Maintenance, Equipment, Findings, Actions (write)| —                     |
| Supervisor              | Maintenance, Findings, Actions, Daily Planning   | —                     |
| Technician              | Own maintenance/findings/actions entry           | Dashboard, Equipment  |
| HSE User                | HSE                                               | Everything else       |
| QC/QA User              | QC                                                | Everything else       |
| Management               | —                                                 | Dashboard, KPIs, Reports |
| External / View Only     | —                                                 | Dashboard, Reports only |

This is a coarse role→module→access-level table, not a fully dynamic
permissions editor — see Roadmap.

## What's implemented vs. roadmap

Everything below is a real, working feature you can click through today
(seed data included). Where the spec asks for something significantly
larger than fits a single build pass, it's noted as a roadmap item with
the reasoning, not silently skipped.

### Implemented

- Auth + RBAC, multi-project switcher
- Equipment Master + tabbed Equipment History (spec sections 17, 18, 60)
- Global equipment search with partial tag matching (section 21)
- Work Orders, PM, CM, Daily Planning (today/tomorrow/overdue/week/custom)
- Findings with configurable categories, photo upload/gallery (mobile
  camera-friendly `<input type=file capture>`), Action Tracker
- SCE register (auto-created from Equipment's SCE flag) with inspection
  recording that rolls forward the next due date from test frequency
- HSE incidents/observations, QC inspections/NCRs
- Timesheet (daily attendance) and Man-Hours dashboard
- LTI-free man-hour counter, computed from Timesheet + HseIncident records
- Centralized KPI engine + live dashboard with daily/weekly/monthly/
  yearly/custom period filters, 6-month trend charts, and drill-down links
  from every KPI card into its underlying records
- KPI Management: KPI definitions + HSE/QC/Planning/Maintenance weight
  editor with the 100%-total validation
- Excel export (per-module or combined workbook, one clean worksheet per
  dataset, no merged cells)
- Excel import: a complete, working example for Work Orders using the
  spec's own reference column mapping (WO#, Scope, Sort Field → Equipment
  Tag, Plan/Actual dates, Plan/Actual Hrs), with per-row validation,
  duplicate skip/update handling, and an import error log
- Administration: Projects, Users (role assignment), Configuration
  (lookup lists), Contractors & Employees, Audit Trail
- Audit logging on every create/update/status-change/import/export
- Printable Monthly/Weekly management report (browser print → PDF)
- Live notifications: computed overdue PM/CM/action/SCE alerts

### Roadmap (explicitly out of scope for this pass, with why)

- **Fully dynamic, admin-editable permissions/roles.** Today roles are a
  fixed enum with a static access matrix in code. A true `roles` +
  `permissions` table with a UI editor is a materially larger project
  (needs a migration path for existing users, a permission-check cache
  layer, etc.) — tracked here rather than half-built.
- **Generalized Excel import wizard for every entity.** The Work Order
  importer is fully working end-to-end and demonstrates the pattern
  (`src/lib/excel-import.ts`, `src/app/(app)/excel/actions.ts`); extending
  the same column-mapping/validation/duplicate-strategy approach to
  Equipment, PM, CM, Findings, etc. is mechanical repetition of that
  pattern, not a new capability.
- **Dedicated PDF rendering.** Reports use the browser's native
  print-to-PDF instead of a server-side PDF library (Puppeteer/react-pdf),
  to avoid a heavy new dependency; the report page is print-styled
  (`@media print`, page-break-safe sections) so the output is clean.
- **Live view-only dashboard sharing with per-viewer widget visibility.**
  The `DashboardConfig`/`SharedDashboardAccess` tables exist in the
  schema and the Viewer role is already restricted to read-only
  Dashboard/Reports access; the admin UI to compose a named, shareable
  dashboard link with field-level redaction is not built.
- **Push/email notifications.** Notifications today are computed live
  on page load (overdue PM/CM/actions/SCE) rather than pushed; the
  `Notification` table and per-user list/mark-as-read exist, but nothing
  writes to it automatically yet (would need a scheduled job).
- **AI natural-language database assistant.** Not built. Every other
  feature above is a prerequisite for this to be trustworthy (it must
  only ever answer from real records — section 50 — which means it needs
  the full data model and query layer this pass establishes).
- **QR code equipment access / offline drafts.** Not built; the equipment
  tag search already works well enough on mobile that scanning is a
  convenience layer on top, not a blocker.
- **S3-style production file storage.** Local disk works for development;
  swapping in real object storage is a one-file change (see "File
  storage" above) deferred until a deployment target is chosen.

## Project structure

```
prisma/schema.prisma       Full data model (see header comment for design notes)
prisma/seed.ts             Demo data — users, project, equipment, WOs, PM/CM,
                            timesheets, HSE/QC records (all marked [DEMO])
src/auth.ts                Auth.js configuration
src/proxy.ts                Route protection (Next.js 16 renamed "middleware")
src/lib/rbac.ts             Role → module → access-level matrix
src/lib/kpi/                Centralized KPI calculation engine
src/lib/*.ts                Shared helpers (audit log, file storage, equipment
                            lookup/history, Excel import/export, formatting)
src/app/(app)/              Every module, one folder per nav item, each with
                            page.tsx (list/detail), actions.ts (server actions),
                            and a *-form.tsx where a create/edit form is shared
src/app/api/export/excel/   Excel download endpoint
```
