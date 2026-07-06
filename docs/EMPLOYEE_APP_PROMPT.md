# Salon Citrine Employee App — Project Prompt

**One-line summary:** Build an Expo employee app that mirrors mobile web `/team` for stylists — my schedule, tasks, inventory scan — using the same Supabase project and `/team/api` routes as `salon-citrine-platform`; no duplicated schema or business logic.

---

## Overview

Build a **complementary mobile employee app** for Salon Citrine. This is **not** a rebuild of the platform. It mirrors the **mobile web `/team` experience** for stylists and estheticians and connects to the **same backend** as the booking platform.

---

## Repos and URLs

| Project | Repo | Role |
|---------|------|------|
| **Platform** (source of truth) | `https://github.com/drewbuszx/salon-citrine-platform` | Schema, migrations, business logic, `/team/api/*` |
| **Employee app** (this project) | New repo, e.g. `salon-citrine-employee` | Native/mobile UI only |

**Production (when live):**

- Web team: `https://team.saloncitrineindy.com/team/`
- Web book: `https://book.saloncitrineindy.com/book/`
- App: Expo/React Native (iOS + Android) — no separate backend

**Do not:**

- Create a new Supabase project
- Duplicate migrations in the app repo

---

## Backend — connect here

**Supabase** (same as platform):

```env
SUPABASE_URL=https://kkhdkmplbxzsckjhpsgf.supabase.co
SUPABASE_ANON_KEY=<from platform .env>
```

**Team API base** (for routes that already exist on web team):

```env
# Production
TEAM_API_BASE=https://team.saloncitrineindy.com/team/api

# Local dev (platform running npm run dev:team)
TEAM_API_BASE=http://localhost:4322/team/api
```

**Never** embed `SUPABASE_SERVICE_ROLE_KEY` in the app.

---

## Auth

- Supabase Auth (email/password) — **same accounts as web `/team` login**
- Staff row linked via `staff.supabase_user_id = auth.uid()`
- All data access must respect **RLS** (anon key + user JWT only)
- After login, load current staff profile from `staff` table

Reference platform: `apps/team` middleware and `Astro.locals.staff` pattern.

---

## Audience

**Stylists and estheticians** on their phone — not full front-desk/owner admin.

Mirror **mobile web `/team`** (hamburger nav, thumb-friendly). **Not** the full desktop calendar for all seven providers.

---

## MVP v0 screens

Mirror mobile web `/team` for these flows:

### 1. Login

Supabase sign in with same credentials as web team app.

### 2. My schedule

Today + upcoming appointments for logged-in `staff_id`.

- Read from `appointments`, `appointment_services`, `clients`, `services` via Supabase + RLS
- Simplified view — not the full multi-staff day grid

### 3. Tasks

Same tabs as web: **My Tasks | Available | Claim | Complete**

Use platform APIs:

```
GET  /team/api/tasks?view=my|available|completed
POST /team/api/tasks/[id]/claim
POST /team/api/tasks/[id]/complete
```

Managers creating tasks for others: web only for v0 (optional later for `owner` / `front_desk` roles).

### 4. Inventory scan — check in

**Scan to check in** with barcode + QR (native camera).

```
GET  /team/api/inventory/products/by-barcode?code=
POST /team/api/inventory/transactions   (type: receive)
```

Use Expo camera / barcode scanner (not browser `@zxing/browser`).

### 5. Account / Sign out

Profile name, photo if available, sign out.

---

## Later (not v0)

- Push notifications (new booking, task assigned)
- Block time / edit availability (`my-book` APIs)
- Post time-off to team events
- POS / Stripe checkout
- Document upload / browse
- Full manager admin flows

---

## UI / UX direction

- Match Salon Citrine branding: dusty rose accents, white cards, clean typography
- Port colors/spacing from `@saloncitrine/theme` — do not require Astro in the app
- **Mirror mobile web `/team` flows** — do not invent new information architecture
- Large touch targets, list-first layouts
- Dark mode: follow system (`prefers-color-scheme`) like web

**Reference platform files:**

| Area | Path |
|------|------|
| Nav structure | `apps/team/src/components/TeamSiteHeader.astro` |
| Calendar (simplify for app) | `apps/team/src/pages/index.astro` |
| Tasks UI + client logic | `apps/team/src/pages/tasks.astro`, `apps/team/src/scripts/tasks.ts` |
| Inventory + scan | `apps/team/src/pages/inventory.astro`, `apps/team/src/scripts/inventory.ts`, `barcode-scanner.ts` |

---

## Data access pattern

**Hybrid (recommended):**

| Action | Method |
|--------|--------|
| Read my appointments | Supabase client + RLS |
| Read staff profile | Supabase client |
| Tasks claim / complete / create | `TEAM_API_BASE` HTTP |
| Inventory scan / check-in | `TEAM_API_BASE` HTTP |

**Do not reimplement** in the app:

- Appointment overlap / double-booking rules
- Inventory stock math
- Task claim logic

Call platform APIs or use RLS-backed Supabase writes only.

### Mobile auth for API routes

Investigate how web team API routes authenticate (session cookie vs Bearer token). Mobile likely needs **Supabase session access token** in:

```
Authorization: Bearer <jwt>
```

If platform routes do not accept Bearer tokens yet, add support in **`salon-citrine-platform`** — not duplicated in the app.

---

## Platform API routes

```
GET  /team/api/tasks?view=my|available|completed|all
POST /team/api/tasks
POST /team/api/tasks/[id]/claim
POST /team/api/tasks/[id]/complete
PATCH /team/api/tasks/[id]
DELETE /team/api/tasks/[id]

GET  /team/api/inventory/products?q=
GET  /team/api/inventory/products/by-barcode?code=
POST /team/api/inventory/products          (managers)
PATCH /team/api/inventory/products/[id]    (managers)
POST /team/api/inventory/transactions
GET  /team/api/inventory/transactions?productId=&limit=

GET  /team/api/my-book/schedules           (later)
GET  /team/api/my-book/services            (later)
GET  /team/api/appointments                (or Supabase direct)
```

Implementations live in `salon-citrine-platform/apps/team/src/pages/api/`.

---

## Schema reference

Core tables (all in platform Supabase project):

| Table | Purpose |
|-------|---------|
| `staff` | Roles, photos, `supabase_user_id` link |
| `appointments` | Bookings |
| `appointment_services` | Multi-service lines |
| `clients` | Client records |
| `services` | Service catalog |
| `tasks` | Task list |
| `task_assignees` | Assignment / claim |
| `products` | Inventory catalog |
| `inventory_stock` | Current quantities |
| `inventory_transactions` | Receive / use / adjust audit |
| `team_events` | Shared events calendar |
| `team_documents` | Doc metadata |

RLS helpers: `packages/db/migrations/0004_team_rls.sql` (`is_linked_staff()`, `is_salon_manager()`, `current_staff_id()`).

**All new tables, columns, and RLS → migrations in platform repo only.**

---

## Tech stack (suggested)

- **Expo** (React Native) + TypeScript
- `@supabase/supabase-js`
- Native barcode: `expo-camera` / barcode scanning module
- Navigation: **Expo Router**

---

## Environment variables (app repo)

```env
EXPO_PUBLIC_SUPABASE_URL=https://kkhdkmplbxzsckjhpsgf.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_TEAM_API_BASE=https://team.saloncitrineindy.com/team/api
```

**Local dev on physical device** (replace with your machine LAN IP):

```env
EXPO_PUBLIC_TEAM_API_BASE=http://192.168.x.x:4322/team/api
```

---

## Out of scope for v0

- Client booking flow (`/book`)
- Full multi-staff day calendar
- POS / Stripe checkout
- Document upload / management
- Manager-only features (unless user role is `owner` or `front_desk`)
- New Supabase project or schema owned by app repo
- Shopify / retail POS

---

## Success criteria

- [ ] Stylist logs in with **same credentials** as web `/team`
- [ ] Today's appointments match what web would show for that staff member
- [ ] Claim and complete tasks — same data as web tasks page
- [ ] Scan barcode/QR → check-in inventory — same as web inventory flow
- [ ] No `SUPABASE_SERVICE_ROLE_KEY` in app bundle
- [ ] RLS enforced on all Supabase reads/writes

---

## When the platform changes

1. Schema changes → apply migrations in `salon-citrine-platform` first
2. API shape changes → update app API client
3. Optional future: shared npm package `@saloncitrine/shared` for TypeScript types and constants (both repos import same version)

---

## Prerequisites before heavy app work

Platform should be stable first:

- [ ] `book.*` and `team.*` deployed on Cloudflare with HTTPS
- [ ] Test booking completes on production
- [ ] Team login and calendar work on live URLs
- [ ] Tasks page loads (not "failed to load tasks")
- [ ] Inventory scan/check-in works on mobile web
- [ ] Staff have used web `/team` briefly so APIs are trustworthy

**Timing:** Start app v0 after Phase 1 web go-live (Phase 1.5), not before.

---

## Related docs

- **Full agent handoff:** [`docs/EMPLOYEE_APP_AGENT_INSTRUCTIONS.md`](./EMPLOYEE_APP_AGENT_INSTRUCTIONS.md) — exhaustive feature parity, API catalog, RLS, and phased delivery for building the Expo app
- Platform brief: `docs/BOOKING_PROJECT_PROMPT.md` (in marketing repo)
- Platform repo: `https://github.com/drewbuszx/salon-citrine-platform`
- Production comms / cron: `salon-citrine-platform/docs/PRODUCTION_COMMS.md`
