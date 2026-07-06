# Salon Citrine Employee Mobile App — Agent Instructions

**Purpose:** Hand this document to a **new Cursor agent** working in a **separate repo** (e.g. `salon-citrine-employee`) to build an **Expo / React Native** employee app that achieves **full feature parity** with the platform team web app (`/team`), curated for mobile UX.

**North star:** Everything the team web site can do — same Supabase project, same `/team/api` routes, same auth — with **no duplicate backend** and **no service role key in the app**.

---

## 1. Mission & constraints

### Mission

Build a **complementary native mobile app** for Salon Citrine staff (stylists, estheticians, front desk, owners). It is **not** a rebuild of `salon-citrine-platform`. The platform remains the **single source of truth** for schema, migrations, business rules, and server-side APIs.

### Hard constraints

| Rule | Detail |
|------|--------|
| **Separate repo** | App lives in its own repo (e.g. `salon-citrine-employee`). Do not add migrations or server logic here. |
| **Same Supabase project** | Use the platform's Supabase URL and **anon key only**. Never embed `SUPABASE_SERVICE_ROLE_KEY`. |
| **Schema in platform only** | All tables, columns, RLS policies, and triggers → `salon-citrine-platform/packages/db/migrations/`. |
| **Reuse platform APIs** | Overlap prevention, inventory stock math, task claim logic, document signed URLs — call `/team/api/*` or RLS-backed Supabase; do not reimplement. |
| **Same auth accounts** | Email/password via Supabase Auth; staff row linked via `staff.supabase_user_id = auth.uid()`. |
| **RLS everywhere** | All reads/writes use anon key + user JWT. Respect role scoping (`owner`, `front_desk`, `stylist`, `esthetician`). |
| **Timezone** | Store/read UTC (`timestamptz`); display in `America/Indiana/Indianapolis` (see `@saloncitrine/shared` `TIMEZONE`). |

### What this app is NOT

- Client booking flow (`/book`) — out of scope
- Marketing site (`saloncitrineindy`) — brand reference only
- POS / Stripe checkout — future (v4), when platform supports it

---

## 2. Repos & URLs

| Project | GitHub | Local path | Role |
|---------|--------|------------|------|
| **Platform** (source of truth) | `https://github.com/drewbuszx/salon-citrine-platform` | `C:\Users\Drew\Projects\salon-citrine-platform` | Schema, migrations, `/team` + `/book` apps, all `/team/api/*` |
| **Marketing site** (brand) | `https://github.com/drewbuszx/saloncitrineindy` | `C:\Users\Drew\Projects\saloncitrineindy` | Public site, brand assets, brief docs |
| **Employee app** (you build this) | New repo, e.g. `salon-citrine-employee` | — | Native UI only |

### Production URLs

| Surface | URL |
|---------|-----|
| Team web | `https://team.saloncitrineindy.com/team/` |
| Book web | `https://book.saloncitrineindy.com/book/` |
| Marketing | `https://saloncitrineindy.com/` |
| Team API base | `https://team.saloncitrineindy.com/team/api` |
| Supabase | `https://kkhdkmplbxzsckjhpsgf.supabase.co` |

### Local dev

| Surface | URL |
|---------|-----|
| Team web | `http://localhost:4322/team/` (`npm run dev:team` in platform repo) |
| Team API base | `http://localhost:4322/team/api` |
| Book web | `http://localhost:4321/book/` |

**Note:** Port 4322 must run the **platform** team app, not the marketing site preview.

---

## 3. Tech stack for the app

### Recommended

| Layer | Choice |
|-------|--------|
| Framework | **Expo** (SDK 52+) + **TypeScript** |
| Navigation | **Expo Router** (file-based, mirrors web IA) |
| Auth & data | `@supabase/supabase-js` (same project as web) |
| HTTP to platform APIs | `fetch` with `Authorization: Bearer <access_token>` |
| Barcode / QR | `expo-camera` + barcode scanning (native; replace web `@zxing/browser`) |
| Fonts | Load Serling Galleria + Basic Title from bundled assets; Cormorant Garamond + Oswald via `expo-font` / Google Fonts |
| Theming | Port CSS variables from `@saloncitrine/theme` to React Native theme object |
| Date/time | `date-fns-tz` or `luxon` with `America/Indiana/Indianapolis` |

### Push notifications (phase later — v3)

Architecture note for future work:

- Register Expo push tokens per staff device (new table or `staff_push_tokens` migration in **platform** repo)
- Platform cron or Supabase Edge Function sends notifications on: new booking assigned, task assigned, appointment reminder
- Do not build a separate notification backend in the app repo

### Optional shared package

Both repos may eventually import `@saloncitrine/shared` (Zod schemas, constants) as an npm workspace dependency. For v0, copy types as needed or add the package via git submodule / npm git URL.

---

## 4. Auth & security

### Login flow

1. `supabase.auth.signInWithPassword({ email, password })`
2. Load staff profile: `staff` table where `supabase_user_id = session.user.id`
3. If no staff row → show "account not linked" (same as web `/team/login?error=unlinked`)
4. If `user.user_metadata.must_change_password === true` → force change-password screen before main app (web: `/team/change-password`)

**Reference:** `apps/team/src/middleware.ts`, `apps/team/src/lib/auth.ts`

### Staff profile shape

```typescript
type StaffRole = "owner" | "stylist" | "esthetician" | "front_desk";

type StaffProfile = {
  id: string;
  slug: string;
  name: string;
  role: StaffRole;
  bio?: string | null;
  phone?: string | null;
  photo_url?: string | null;
  photo_crop?: { x: number; y: number; scale: number } | null;
};
```

**Reference:** `apps/team/src/env.d.ts`

### Role helpers

| Helper | Logic | Reference |
|--------|-------|-----------|
| `isSalonManager(staff)` | `role === "owner" \|\| role === "front_desk"` | `apps/team/src/lib/auth.ts` |
| `canManageStaffColumn(actor, targetStaffId)` | Manager OR own `staff_id` | `apps/team/src/lib/api-calendar.ts` |

### RLS-only reads

Use Supabase client with the user's session for:

- Own/manager-scoped appointments, blocked times, clients
- Staff schedules, staff profile
- Products, inventory stock (read)
- Team events, documents (read)

Insert/update where RLS allows (e.g. providers insert own appointments per `0007_team_stylist_calendar_writes.sql`).

### Calling `/team/api` from mobile

Web team APIs authenticate via **Supabase SSR session cookies** (`createSupabaseServerClient` in `apps/team/src/lib/supabase-server.ts`).

**Mobile must send:**

```http
Authorization: Bearer <supabase_access_token>
Content-Type: application/json
```

Get token: `(await supabase.auth.getSession()).data.session?.access_token`

#### ⚠️ Platform prerequisite: Bearer token support

As of exploration, `requireApiAuth` / `requireTeamStaff` in `apps/team/src/lib/api-calendar.ts` only reads **cookies**, not `Authorization: Bearer`. Middleware sets `locals.staff` from cookies on page routes but API routes fall back to cookie-based `getUser()`.

**Before heavy mobile API integration, add Bearer support in `salon-citrine-platform`:**

1. In `requireTeamStaff` (or middleware for `/api/*`), if `Authorization: Bearer <jwt>` header present, create Supabase client with that JWT (e.g. `createClient(url, anonKey, { global: { headers: { Authorization: 'Bearer ...' } } })`) and validate user + load staff profile.
2. Test with `curl -H "Authorization: Bearer $TOKEN" https://team.saloncitrineindy.com/team/api/tasks?view=my`

**Until Bearer is shipped:** mobile can use **Supabase direct** for all RLS-allowed operations; use APIs only where server-side logic is required (overlap validation, inventory transactions trigger, task claim orchestration, document signed URLs).

### Routes that are cookie/form-only today

These web routes use form POST + redirect, not JSON API. Mobile should use **Supabase client** equivalents:

| Web route | Mobile approach |
|-----------|-----------------|
| `POST /api/auth/login` | `supabase.auth.signInWithPassword` |
| `POST /api/auth/logout` | `supabase.auth.signOut` |
| `POST /api/auth/change-password` | `supabase.auth.updateUser({ password, data: { must_change_password: false } })` |
| `POST /api/account` | `supabase.from('staff').update({ name, bio, phone })` + `supabase.auth.updateUser({ email })` |
| `POST /api/account/photo` | Supabase Storage upload to `staff-photos` bucket + `staff.photo_url` / `photo_crop` update |
| `POST /api/block-time` | Prefer `POST /api/blocked-times` (JSON) instead |
| `POST /api/services/[id]` | Direct `supabase.from('services').update({ duration_minutes })` (managers, RLS) |
| `POST /api/staff-services` | Direct `supabase.from('staff_services').update(...)` or `PATCH /api/my-book/services` |

### Never in the app bundle

- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`, `TWILIO_AUTH_TOKEN`, `RESEND_API_KEY`, `CRON_SECRET`

---

## 5. Brand & design system

### Source files

| Asset / token | Path |
|---------------|------|
| CSS variables (light + dark) | `salon-citrine-platform/packages/theme/tokens.css` |
| Font declarations | `salon-citrine-platform/packages/theme/fonts.css` |
| Team app styles (cards, header, forms) | `salon-citrine-platform/apps/team/src/styles/global.css` |
| Business constants | `salon-citrine-platform/packages/shared/src/constants.ts` |
| Marketing brand data | `saloncitrineindy/src/data/site.ts` |

### Color palette (light mode)

| Token | Hex / value | Usage |
|-------|-------------|-------|
| `--color-black` | `#0a0a0a` | Primary text, book bar hover |
| `--color-white` | `#ffffff` | Cards, surfaces |
| `--color-citrine` | `#e7ac46` | Accent, CTAs, staff column colors |
| `--color-citrine-dark` | `#d3a946` | Citrine hover variant |
| `--color-dusty-rose` | `#ae948f` | **Primary brand accent**, active nav tabs |
| `--color-sage` | `#8d9e88` | Secondary accent |
| `--color-charcoal` | `#3c3d3c` | Dark sections |
| `--color-gray` | `#666666` | Muted text |
| `--color-light` | `#f5f5f5` | Subtle backgrounds |
| `--color-bg` | `#ffffff` | Page background (light) |
| `--color-text` | `#0a0a0a` | Body text |
| `--color-border` | `rgba(0,0,0,0.08)` | Card borders |
| `--color-cream` | `#f7f2ea` | Team app page background |
| `--color-cream-deep` | `#efe6d8` | Gradient depth |
| `--color-booking-card-bg` | `rgba(255,255,255,0.88)` | Card fill |
| `--color-card-shadow` | `rgba(60,61,60,0.06)` | Elevation |

Dark mode overrides: see `[data-theme="dark"]` block in `tokens.css` (bg `#181818`, text `#ececec`, etc.).

### Typography

| Role | Font | Fallback |
|------|------|----------|
| Body / headings | Cormorant Garamond | serif |
| Labels / UI sans | Oswald | sans-serif |
| Nav tabs | **Serling Galleria** | serif |
| CTAs / buttons | **Basic Title** | sans-serif |

**Font files (licensed, not in git):** Copy from marketing site `public/fonts/` into the app assets:

- `SerlingGalleria-Medium.otf`
- `BasicTitle.ttf`

Web serves them at `/fonts/...` per `packages/theme/fonts.css`. Platform team app imports via `apps/team/src/styles/fonts.css`.

Google Fonts (body): Cormorant Garamond + Oswald — loaded in `packages/theme/fonts.css`.

### UI patterns from team web

| Pattern | Reference | Mobile guidance |
|---------|-----------|-----------------|
| Header tabs (dusty rose active state) | `apps/team/src/components/TeamSiteHeader.astro` | Bottom tab bar; dusty rose indicator on active tab |
| Logo center, tabs split left/right (desktop) | TeamSiteHeader | Compact top bar with logo or screen title |
| Mobile hamburger + full-screen nav | TeamSiteHeader `data-mobile-nav` | Bottom nav replaces hamburger for primary IA |
| Profile dropdown (avatar, Account, Sign out) | TeamSiteHeader | Account tab or header avatar menu |
| White cards on cream gradient | `global.css` `.card-row`, `.card-grid` | `borderRadius: 12`, white surface, subtle shadow |
| Form stacks | `.form-stack`, `.form-label`, `.form-input` | Large touch targets, 16px+ body |
| Notices | `.notice--success`, `.notice--error` | Toast or inline banner |
| Dark mode | `TeamLayout.astro` inline script | Follow system `prefers-color-scheme`; optional manual toggle |

### Staff calendar accents

Per-staff column colors from `STAFF_ACCENT_COLORS` in `apps/team/src/lib/calendar.ts`: citrine, sage, `#d4a5a5`, `#9cb4d4`, `#c4b0d8`, `#e8b8a8`, `#8fbfb0`.

### Logos

Team header uses:

- Light: `apps/team/public/images/salon-citrine-logo.png` (via `withBase`)
- Dark: `apps/team/public/images/salon-citrine-banner-dark.png`

Copy from platform team public assets or marketing site equivalents.

---

## 6. Complete feature parity map

Legend:

- **Manager** = `owner` or `front_desk`
- **Provider** = `stylist` or `esthetician`
- **API** = HTTP to `/team/api/...`
- **Supabase** = direct client query/write (RLS)

---

### 6.1 Book / Calendar

| Aspect | Web behavior | Platform files | Mobile behavior | Data access | Roles |
|--------|--------------|----------------|-----------------|-------------|-------|
| Day calendar (all staff) | Multi-column grid, 9 AM–8 PM, 15-min slots | `pages/index.astro`, `components/DayCalendar.astro`, `lib/calendar.ts` | **Managers:** horizontal scroll or staff picker + day agenda; **Providers:** single-column "my day" list | Supabase: `loadCalendarData()` pattern — `appointments`, `blocked_times`, `staff`, joins to `clients`, `appointment_services`, `services` | Manager: all staff; Provider: own column only |
| Day navigation | Prev / next / Today links with `?day=YYYY-MM-DD` | `DayCalendar.astro` toolbar | Date picker or swipe between days | — | All |
| Current time line | Red line on today's grid | `DayCalendar.astro`, `currentTimeLineTopRem()` | Show "now" indicator on today view | — | All |
| Off-hours grey-out | Slots outside `staff_schedules` styled inactive | `isSlotWithinStaffSchedule()` in `calendar.ts` | Hide or dim times outside bookable hours | Supabase: `staff_schedules` | All |
| Appointment blocks | Colored blocks with client + service label | `DayCalendar.astro`, `eventBlockStyle()` | Tappable cards in agenda | Supabase read | All (scoped) |
| Blocked time blocks | Grey blocks with reason | Same | Show as "Blocked" entries | Supabase read | All (scoped) |
| Appointment detail modal | View/edit time, status, notes, cancel | `DayCalendar.astro` client script | Bottom sheet or screen | **PATCH** `/api/appointments/[id]`, **DELETE** (cancel) same route | Manager: any staff; Provider: own |
| Manual booking | Create appointment: staff, client (search or new), services, start time | `DayCalendar.astro` → **POST** `/api/appointments` | Simplified booking wizard | **POST** `/api/appointments` (overlap + off-hours validation server-side) | Manager: any staff; Provider: own `staff_id` only |
| Client search in booking | Autocomplete | **GET** `/api/clients/search?q=` | Search field with debounce | API | All linked staff |
| Block time (single) | From slot tap or `/block-time` form | `pages/block-time.astro`, **POST** `/api/block-time` (form) or **POST** `/api/blocked-times` (JSON) | Quick block from slot or form | **POST** `/api/blocked-times` | Manager: any; Provider: own |
| Block time (bulk drag) | Drag-select slots → block range | `DayCalendar.astro` `data-action="block-bulk"`, drag handlers | **Optional v2+:** long-press multi-select; or skip on mobile | **POST** `/api/blocked-times` (one or multiple) | Same as block |
| Edit/delete blocked time | Modal actions | **PATCH/DELETE** `/api/blocked-times/[id]` | Edit sheet | API | Scoped by `canManageStaffColumn` |
| My Book link | Toolbar → `/my-book` | `DayCalendar.astro` | Settings / Schedule section | — | All |
| Staff avatars in header row | Photo or slug fallback | `staffPhotoUrl()`, `public/images/{slug}.jpg` | Show in multi-staff view | Supabase `staff.photo_url` | Manager view |

**Calendar constants:** `CALENDAR_START_HOUR=9`, `CALENDAR_END_HOUR=20`, `CALENDAR_SLOT_MINUTES=15` — `lib/calendar.ts`

**No GET `/api/appointments`:** Web loads via SSR (`loadCalendarData`). Mobile should query Supabase directly with same filters or add a platform GET endpoint if needed.

---

### 6.2 My Book

| Aspect | Web behavior | Platform files | Mobile behavior | Data access | Roles |
|--------|--------------|----------------|-----------------|-------------|-------|
| Weekly bookable hours | Toggle days, set start/end, save | `pages/my-book.astro` | Weekly schedule editor | **GET/PATCH/DELETE** `/api/my-book/schedules` | Own staff; Manager can pass `?staff_id=` |
| Client booking blocks per service | Dropdown: none / soft / hard | `my-book.astro`, **PATCH** `/api/my-book/services` | Picker per service row | API | Own (+ manager `staff_id`) |
| Accepting new clients toggle | Inverts to "Not accepting new clients" | **PATCH** `/api/my-book/profile` | Switch | API or Supabase `staff.accepting_new_clients` | Own (+ manager) |
| Returning clients only badge | Read-only indicator on service | `staff_services.returning_clients_only` | Show badge | Supabase read | All |
| Back to calendar | Link with `?day=` preserved | `my-book.astro` | Back navigation | — | All |

**Service block enum:** `none` | `soft` | `hard` — `client_booking_block` on `staff_services` (`0010_staff_services_client_booking_block.sql`). Team manual booking ignores these; online `/book` respects them.

---

### 6.3 Clients

| Aspect | Web behavior | Platform files | Mobile behavior | Data access | Roles |
|--------|--------------|----------------|-----------------|-------------|-------|
| Search autocomplete | Min 2 chars, top 10 | **GET** `/api/clients/search?q=` | Debounced search | API | All linked staff (RLS: managers all; providers had broader read per `0007`) |
| Client profile | Name, phone, email, past services, referrals | **GET** `/api/clients/[id]` | Client detail screen | API | Read scoped by RLS |
| Client patch | — | **Gap:** no PATCH on `/api/clients/[id]` | Updates via Supabase direct if needed | Supabase (managers) or future API | Manager write |
| Create client (manual book) | Inline in booking flow | **POST** `/api/appointments` creates client if needed | Same via appointment API | API | All linked staff |

**Referrals:** `referrals` table — shown on client GET (`0009_client_referrals.sql`).

---

### 6.4 Tasks

| Aspect | Web behavior | Platform files | Mobile behavior | Data access | Roles |
|--------|--------------|----------------|-----------------|-------------|-------|
| Tabs: My / Available / Completed / All | Filtered lists | `pages/tasks.astro`, `scripts/tasks.ts` | Segmented control or top tabs | **GET** `/api/tasks?view=my\|available\|completed\|all` | All: my, available, completed; **All tab: managers only** |
| Create task | Modal form | **POST** `/api/tasks` | Create screen/sheet | API | **Managers only** |
| Edit / cancel / delete task | Modal | **PATCH/DELETE** `/api/tasks/[id]` (`?cancel=1` soft cancel) | Edit sheet | API | **Managers only** |
| Claim open task | Button on available tasks | **POST** `/api/tasks/[id]/claim` | Swipe or button | API | All staff |
| Complete task | Modal + optional notes | **POST** `/api/tasks/[id]/complete` | Complete with notes | API | Assignees only |
| Priority badges | low / normal / high | `scripts/tasks.ts` | Same visual language | — | All |
| Due date display | Formatted local | `scripts/tasks.ts` `formatDueDate` | Same | — | All |

**Task statuses:** `open`, `claimed`, `done`, `cancelled`  
**Assignment types:** `assigned` (manager picks staff), `open` (claim pool)

**Reference types:** `scripts/tasks.ts` lines 1–22 for `Task` shape returned by API.

---

### 6.5 Inventory

| Aspect | Web behavior | Platform files | Mobile behavior | Data access | Roles |
|--------|--------------|----------------|-----------------|-------------|-------|
| Product list + search | Debounced search, low stock banner | `pages/inventory.astro`, `scripts/inventory.ts` | List + search | **GET** `/api/inventory/products?q=` | All read |
| Low stock count | Banner when any `quantity <= reorder_threshold` | API returns `lowStockCount` | Badge on tab / banner | API | All |
| Scan to check in | Camera + manual entry → receive flow | `scripts/barcode-scanner.ts`, `scripts/inventory.ts` | **Native** `expo-camera` scanner | **GET** `/api/inventory/products/by-barcode?code=` then **POST** `/api/inventory/transactions` `{ type: "receive" }` | All |
| Product detail | Qty, meta, transaction history | Detail modal in `inventory.ts` | Detail screen | **GET** transactions `?productId=&limit=` | All |
| Use / receive / adjust / count | Transaction modals | **POST** `/api/inventory/transactions` | Action sheet per type | API | All insert (RLS: `staff_id = current_staff_id()`) |
| Add product | Manager form | **POST** `/api/inventory/products` | Add product screen | API | **Managers only** |
| Edit product | Manager | **PATCH** `/api/inventory/products/[id]` | Edit screen | API | **Managers only** |
| Include inactive products | `?includeInactive=1` | GET products | Toggle in manager view | API | Managers |

**Transaction types:** `receive`, `use`, `adjust`, `count` — stock updated by DB trigger `apply_inventory_transaction()` (`0012_inventory.sql`).

**Sample barcodes (seed):**

| Product | Barcode |
|---------|---------|
| Wella Color Touch 7/1 | `8500001234561` |
| QR test product | `QR-TEST-8500001234561` |
| (see migration) | `8500001234638`, `8500001234701`, … |

Full list: `packages/db/migrations/0012_inventory.sql`, `0016_inventory_qr_seed.sql`.

**Barcode formats (web scanner):** QR, UPC-A/E, EAN-13/8, Code 128/39 — `barcode-scanner.ts`. Match on mobile.

---

### 6.6 Docs

| Aspect | Web behavior | Platform files | Mobile behavior | Data access | Roles |
|--------|--------------|----------------|-----------------|-------------|-------|
| List documents | Filter by category | `pages/docs.astro`, `scripts/docs.ts` | List + category filter | **GET** `/api/documents?category=` | All read active |
| Download | Opens signed URL | **GET** `/api/documents/[id]/download` | Open in browser / share sheet (`url`, 120s expiry) | API | All |
| Upload | Manager form multipart | **POST** `/api/documents` (formData) | Document picker + upload | API | **Managers only** |
| Edit metadata | — | **PATCH** `/api/documents/[id]` | Edit form | API | Managers |
| Delete / deactivate | Soft: `?soft=1` | **DELETE** `/api/documents/[id]` | Swipe delete | API | Managers |

**Categories:** `policies`, `training`, `forms`, `other`  
**Storage bucket:** `team-documents` (private) — `0014_team_documents.sql`

---

### 6.7 Events (Calendar tab)

| Aspect | Web behavior | Platform files | Mobile behavior | Data access | Roles |
|--------|--------------|----------------|-----------------|-------------|-------|
| Month calendar + upcoming list | Toggle views | `pages/events.astro`, `scripts/events.ts` | Month grid + list | **GET** `/api/events?from=&to=` | All read |
| Event types | event, time_off, closure, announcement | `lib/api-events.ts` `EVENT_TYPES` | Icons/colors per type | — | All |
| Create time off | Staff form | **POST** `/api/events` `{ event_type: "time_off" }` | Request time off flow | API | All staff (own `staff_id`); managers can set other staff |
| Create full events | Manager form | **POST** `/api/events` | Create event | API | **Managers** for non-`time_off` types |
| Edit / delete | Owner or manager rules | **PATCH/DELETE** `/api/events/[id]` | Edit sheet | API | Manager or own `time_off` creator |
| All-day events | `all_day: true` | API | Date-only UI | API | Per rules above |

**Default range:** `defaultEventRange()` in `api-events.ts` (~month window).

---

### 6.8 Account

| Aspect | Web behavior | Platform files | Mobile behavior | Data access | Roles |
|--------|--------------|----------------|-----------------|-------------|-------|
| Profile (name, bio, phone, email) | Form POST | `pages/account.astro`, **POST** `/api/account` | Settings form | Supabase `staff` update + `auth.updateUser` for email | Own |
| Profile photo + crop | Upload, drag crop | `account.astro`, `scripts/account-photo-editor.ts`, **POST** `/api/account/photo` | Image picker + crop UI | Supabase Storage `staff-photos` bucket | Own |
| Change password | Required on first login | `pages/change-password.astro`, **POST** `/api/auth/change-password` | Change password screen | `supabase.auth.updateUser` | Own |
| Sign out | Profile menu | **POST** `/api/auth/logout` | Sign out button | `supabase.auth.signOut` | All |

---

### 6.9 Services (manager / provider — not in main nav)

| Aspect | Web behavior | Platform files | Mobile behavior | Data access | Roles |
|--------|--------------|----------------|-----------------|-------------|-------|
| Service durations (all services) | Manager grid | `pages/services.astro`, **POST** `/api/services/[id]` | Manager settings | Supabase or form API | **Managers only** |
| Returning clients only matrix | Per staff × service | `services.astro`, **POST** `/api/staff-services` | Matrix or per-staff | Supabase / API | Managers |
| My services (own returning-only) | Provider list | `pages/my-services.astro` | Provider settings | **POST** `/api/staff-services` | Providers (managers redirected to `/services`) |

---

### 6.10 Navigation

| Web (TeamSiteHeader) | Route | Mobile recommendation |
|----------------------|-------|------------------------|
| Book | `/team/` | Tab: **Book** (calendar / my schedule) |
| Inventory | `/team/inventory` | Tab: **Inventory** |
| Tasks | `/team/tasks` | Tab: **Tasks** |
| Docs | `/team/docs` | Tab: **More** or **Docs** |
| Calendar (events) | `/team/events` | Tab: **Events** or under More |
| Account | Profile dropdown → `/team/account` | Tab: **Account** or avatar menu |
| My Book | Calendar toolbar → `/team/my-book` | Link from Book tab or Account |
| Block time | `/team/block-time` | Action from Book tab |
| Services / My services | `/team/services`, `/team/my-services` | Manager / provider settings |

**Web mobile nav:** Hamburger reveals all tabs + theme toggle (`TeamSiteHeader.astro`). App should prefer **bottom tab bar** (5 tabs max): Book, Tasks, Inventory, Events, Account — with Docs accessible from Account/More.

---

## 7. API catalog

Base path: `/team/api` (prepend production or local origin).

All JSON API routes use `requireApiAuth` unless noted. Responses: `{ ok: true, ... }` or `{ ok: false, error: "..." }`.

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/auth/login` | Public (form) | Cookie session login — **use Supabase client on mobile** |
| POST | `/auth/logout` | Cookie | Sign out — **use Supabase client on mobile** |
| POST | `/auth/change-password` | Cookie + `must_change_password` | Form redirect — **use Supabase client on mobile** |
| GET | `/tasks?view=my\|available\|completed\|all` | Staff | List tasks by view |
| POST | `/tasks` | Manager | Create task |
| PATCH | `/tasks/[id]` | Manager | Update task |
| DELETE | `/tasks/[id]` | Manager | Delete task (`?cancel=1` to cancel) |
| POST | `/tasks/[id]/claim` | Staff | Claim open task |
| POST | `/tasks/[id]/complete` | Assignee | Complete with optional `{ completion_notes }` |
| GET | `/inventory/products?q=&includeInactive=1` | Staff | List/search products |
| POST | `/inventory/products` | Manager | Create product |
| PATCH | `/inventory/products/[id]` | Manager | Update product |
| GET | `/inventory/products/by-barcode?code=` | Staff | Lookup by barcode/QR |
| GET | `/inventory/transactions?productId=&limit=` | Staff | Transaction history |
| POST | `/inventory/transactions` | Staff | `{ product_id, type, quantity?, quantity_change?, count?, notes? }` |
| GET | `/my-book/schedules?staff_id=` | Staff | Weekly schedules |
| PATCH | `/my-book/schedules` | Staff | `{ staff_id?, schedules: [{ day_of_week, start_time, end_time }] }` |
| DELETE | `/my-book/schedules` | Staff | `{ staff_id?, day_of_week }` |
| GET | `/my-book/services?staff_id=` | Staff | Services + booking blocks |
| PATCH | `/my-book/services` | Staff | `{ staff_id?, service_id, client_booking_block }` |
| PATCH | `/my-book/profile` | Staff | `{ staff_id?, accepting_new_clients }` |
| POST | `/appointments` | Staff | Create appointment (overlap validated) |
| PATCH | `/appointments/[id]` | Staff | Update appointment |
| DELETE | `/appointments/[id]` | Staff | Cancel (status → cancelled) |
| GET | `/clients/search?q=` | Staff | Client autocomplete (min 2 chars) |
| GET | `/clients/[id]` | Staff | Client detail + history + referrals |
| POST | `/blocked-times` | Staff | Create blocked time (JSON) |
| PATCH | `/blocked-times/[id]` | Staff | Update blocked time |
| DELETE | `/blocked-times/[id]` | Staff | Delete blocked time |
| POST | `/block-time` | Cookie (form) | Legacy form block — prefer `/blocked-times` |
| GET | `/events?from=&to=` | Staff | List events in range |
| POST | `/events` | Staff | Create event / time off |
| PATCH | `/events/[id]` | Staff | Update event |
| DELETE | `/events/[id]` | Staff | Delete (`?soft=1` deactivate) |
| GET | `/documents?category=` | Staff | List documents |
| POST | `/documents` | Manager | Upload (multipart form) |
| PATCH | `/documents/[id]` | Manager | Update metadata |
| DELETE | `/documents/[id]` | Manager | Delete (`?soft=1`) |
| GET | `/documents/[id]/download?redirect=1` | Staff | Signed URL JSON or redirect |
| GET | `/staff-services?staff_id=` | Staff | Services for manual booking |
| POST | `/staff-services` | Cookie (form) | Update returning_clients_only |
| POST | `/services/[id]` | Manager (form) | Update duration_minutes |
| POST | `/account` | Cookie (form) | Update profile — **use Supabase on mobile** |
| POST | `/account/photo` | Cookie (form) | Upload photo — **use Storage on mobile** |

**Implementation directory:** `salon-citrine-platform/apps/team/src/pages/api/`

---

## 8. Database tables & RLS

Migrations: `salon-citrine-platform/packages/db/migrations/`

| Table | Purpose | RLS notes |
|-------|---------|-----------|
| `staff` | Team members, roles, photos, `supabase_user_id`, `accepting_new_clients` | Self-update own profile (`0006`); managers manage via policies in `0004` |
| `services` | Service catalog | Managers update durations (`0004`) |
| `staff_services` | Staff ↔ service matrix, `returning_clients_only`, `client_booking_block` | Public read for booking (`0002`); team reads via linked staff |
| `staff_schedules` | Weekly bookable hours | Public read for availability (`0001`); stylists manage own, managers all (`0010`) |
| `blocked_times` | Calendar blocks | Team read/write scoped: manager all, provider own (`0004`) |
| `clients` | Client CRM | Managers full; providers read all + insert (`0007`); search index (`0009`) |
| `appointments` | Bookings | Manager all; provider own read/write (`0004`, `0007`); overlap trigger (`0017`) |
| `appointment_services` | Multi-service lines | Follows appointment scope |
| `referrals` | Client referral tracking | Team read; managers write (`0009`) |
| `tasks` | Task list | Team read by assignment/open pool; managers CRUD; staff claim/complete (`0013`, `0019`) |
| `task_assignees` | Task assignments | Managers assign; staff claim insert |
| `products` | Inventory catalog | Team read; managers write (`0012`) |
| `inventory_stock` | Current quantities | Team read; updated by trigger |
| `inventory_transactions` | Audit log | Team read; staff insert own (`0012`) |
| `team_documents` | Document metadata | Team read active; managers CRUD (`0014`) |
| `team_events` | Shared calendar | Team read; create time off (staff) or events (managers) (`0015`) |
| `email_logs`, `sms_logs` | Comms audit | Not exposed in team app UI |
| `policies` | Cancellation policy text | Public read |

**RLS helpers** (`0004_team_rls.sql`): `current_staff_id()`, `current_staff_role()`, `is_salon_manager()`, `is_linked_staff()`.

**Storage buckets:**

| Bucket | Purpose |
|--------|---------|
| `staff-photos` | Profile avatars (`0008_staff_photo_storage.sql`) |
| `team-documents` | Private doc files (`0014`) |

---

## 9. Environment variables (app)

Use `EXPO_PUBLIC_*` prefix for client-side values:

```env
# Required
EXPO_PUBLIC_SUPABASE_URL=https://kkhdkmplbxzsckjhpsgf.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<from platform .env — never service role>
EXPO_PUBLIC_TEAM_API_BASE=https://team.saloncitrineindy.com/team/api

# Local dev (platform team on 4322)
# EXPO_PUBLIC_TEAM_API_BASE=http://localhost:4322/team/api

# Physical device on LAN (replace with your machine IP)
# EXPO_PUBLIC_TEAM_API_BASE=http://192.168.x.x:4322/team/api
```

Copy anon key from platform `.env.example` / team Cloudflare env — **never commit real keys to public repos**.

Optional:

```env
EXPO_PUBLIC_TIMEZONE=America/Indiana/Indianapolis
```

---

## 10. Phased delivery (recommended)

Document **full parity** as the north star. Ship incrementally:

### v0 — Stylist daily essentials

- [ ] Login + must-change-password gate
- [ ] Load staff profile + role
- [ ] **My schedule** (today + upcoming list for logged-in `staff_id`)
- [ ] **Tasks:** My / Available / Completed — claim + complete
- [ ] **Inventory:** list, search, **scan to check in** (receive)
- [ ] Account: name display, sign out

### v1 — Availability & time off

- [ ] **My Book:** weekly hours CRUD, accepting new clients toggle
- [ ] Service booking blocks (none/soft/hard)
- [ ] **Events:** read calendar; post **time off**
- [ ] Block time (single range) on own calendar

### v2 — Booking & clients

- [ ] Full **day calendar read** (manager: all staff; provider: self)
- [ ] Appointment detail view
- [ ] **Manual booking** (POST `/api/appointments`)
- [ ] Client search + basic client record
- [ ] **Docs:** list, filter, download

### v3 — Manager features & notifications

- [ ] Tasks: create, edit, cancel, All tab
- [ ] Inventory: add/edit product, all transaction types
- [ ] Events: closures, announcements, edit any
- [ ] Docs: upload (managers)
- [ ] Services / durations / returning-client matrix
- [ ] Push notifications architecture

### v4 — POS & advanced

- [ ] POS / Stripe checkout when platform exposes it
- [ ] Bulk block time (drag equivalent)
- [ ] Offline queue for inventory transactions (optional)

---

## 11. Mobile UX curation guidelines

### Do not pixel-copy the desktop calendar

The web day grid (`DayCalendar.astro`, 2500+ lines) is optimized for wide screens and mouse drag-selection. On mobile:

- **Providers:** Default to **agenda list** (today's appointments + blocks chronologically)
- **Managers:** Day view with **staff filter** or compact per-staff sections — avoid 7-column grid on phone
- Keep 15-minute slot logic for booking validation but show human-readable times

### Navigation

- **Bottom tab bar** for primary destinations (thumb reach)
- Secondary actions (My Book, Block time, Docs) in Book stack or Account
- Mirror web tab **order and labels** where possible: Book, Inventory, Tasks, Docs, Calendar

### Native scanner

Replace `@zxing/browser` (`barcode-scanner.ts`) with Expo camera barcode module. Support same formats. Keep **manual barcode entry** fallback.

### Pull to refresh

Use on: schedule, tasks, inventory list, events, docs.

### Offline messaging

When network fails, show clear message: "Can't reach Salon Citrine servers." Do not silently fail. Queue writes only if explicitly implemented (v4 optional).

### Role-based UI

| Feature | Provider UI | Manager UI |
|---------|-------------|------------|
| Calendar | Own column / agenda | Staff picker + all columns |
| Block time | Own staff only | Any staff |
| Tasks create | Hidden | Visible |
| Tasks "All" tab | Hidden | Visible |
| Inventory add product | Hidden | Visible |
| Docs upload | Hidden | Visible |
| Events create | Time off only | All event types |
| Services admin | My services only | Full services page |

### Dark mode

Follow system preference (`prefers-color-scheme`) like `TeamLayout.astro`. Map `tokens.css` dark variables to RN theme.

### Typography on mobile

Serling Galleria for tab labels; Basic Title for primary buttons; Cormorant for headings; Oswald for labels — match web hierarchy at mobile sizes.

---

## 12. Reference file index

Alphabetical within groups. All paths relative to `salon-citrine-platform/` unless noted.

### Apps / team — pages

- `apps/team/src/pages/index.astro` — Book / day calendar
- `apps/team/src/pages/my-book.astro` — My Book schedules & blocks
- `apps/team/src/pages/tasks.astro` — Tasks UI
- `apps/team/src/pages/inventory.astro` — Inventory UI
- `apps/team/src/pages/docs.astro` — Documents UI
- `apps/team/src/pages/events.astro` — Team events calendar
- `apps/team/src/pages/account.astro` — Account settings
- `apps/team/src/pages/login.astro` — Login
- `apps/team/src/pages/change-password.astro` — Forced password change
- `apps/team/src/pages/block-time.astro` — Block time form
- `apps/team/src/pages/services.astro` — Manager services admin
- `apps/team/src/pages/my-services.astro` — Provider returning-clients settings

### Apps / team — components & layouts

- `apps/team/src/components/DayCalendar.astro` — Calendar grid, modals, drag block
- `apps/team/src/components/TeamSiteHeader.astro` — Nav tabs, profile menu
- `apps/team/src/components/StaffAvatar.astro` — Cropped avatar display
- `apps/team/src/layouts/TeamLayout.astro` — Shell, theme script

### Apps / team — client scripts

- `apps/team/src/scripts/tasks.ts` — Tasks client logic
- `apps/team/src/scripts/inventory.ts` — Inventory + scan check-in
- `apps/team/src/scripts/barcode-scanner.ts` — Web camera scanner
- `apps/team/src/scripts/events.ts` — Events calendar client
- `apps/team/src/scripts/docs.ts` — Documents client
- `apps/team/src/scripts/account-photo-editor.ts` — Photo crop UI

### Apps / team — lib

- `apps/team/src/lib/auth.ts` — Staff profile, role helpers
- `apps/team/src/lib/supabase-server.ts` — SSR Supabase client
- `apps/team/src/lib/api-calendar.ts` — API auth, JSON helpers, client name parse
- `apps/team/src/lib/calendar.ts` — Calendar data loading, slot math, staff colors
- `apps/team/src/lib/calendar-overlap.ts` — Appointment overlap validation
- `apps/team/src/lib/datetime.ts` — Local ↔ UTC parsing (`America/Indiana/Indianapolis`)
- `apps/team/src/lib/api-tasks.ts` — Task mapping, validation
- `apps/team/src/lib/api-inventory.ts` — Product mapping, quantity math
- `apps/team/src/lib/api-events.ts` — Event types, mapping
- `apps/team/src/lib/api-documents.ts` — Document categories, storage paths
- `apps/team/src/lib/staff-display.ts` — Photo URLs, initials
- `apps/team/src/lib/staff-photo.ts` — Crop parsing
- `apps/team/src/lib/paths.ts` — Base URL helpers
- `apps/team/src/middleware.ts` — Auth gates, role redirects
- `apps/team/src/env.d.ts` — StaffProfile types
- `apps/team/src/styles/global.css` — Team app styles
- `apps/team/src/styles/fonts.css` — Font imports

### Apps / team — API routes

- `apps/team/src/pages/api/appointments/index.ts`
- `apps/team/src/pages/api/appointments/[id].ts`
- `apps/team/src/pages/api/blocked-times/index.ts`
- `apps/team/src/pages/api/blocked-times/[id].ts`
- `apps/team/src/pages/api/block-time.ts`
- `apps/team/src/pages/api/clients/search.ts`
- `apps/team/src/pages/api/clients/[id].ts`
- `apps/team/src/pages/api/tasks/index.ts`
- `apps/team/src/pages/api/tasks/[id].ts`
- `apps/team/src/pages/api/tasks/[id]/claim.ts`
- `apps/team/src/pages/api/tasks/[id]/complete.ts`
- `apps/team/src/pages/api/inventory/products/index.ts`
- `apps/team/src/pages/api/inventory/products/[id].ts`
- `apps/team/src/pages/api/inventory/products/by-barcode.ts`
- `apps/team/src/pages/api/inventory/transactions/index.ts`
- `apps/team/src/pages/api/my-book/schedules.ts`
- `apps/team/src/pages/api/my-book/services.ts`
- `apps/team/src/pages/api/my-book/profile.ts`
- `apps/team/src/pages/api/events/index.ts`
- `apps/team/src/pages/api/events/[id].ts`
- `apps/team/src/pages/api/documents/index.ts`
- `apps/team/src/pages/api/documents/[id].ts`
- `apps/team/src/pages/api/documents/[id]/download.ts`
- `apps/team/src/pages/api/account.ts`
- `apps/team/src/pages/api/account/photo.ts`
- `apps/team/src/pages/api/auth/login.ts`
- `apps/team/src/pages/api/auth/logout.ts`
- `apps/team/src/pages/api/auth/change-password.ts`
- `apps/team/src/pages/api/staff-services.ts`
- `apps/team/src/pages/api/services/[id].ts`

### Packages

- `packages/theme/tokens.css` — Brand colors
- `packages/theme/fonts.css` — Font faces
- `packages/shared/src/constants.ts` — Business info, hours, staff slugs
- `packages/shared/src/schemas.ts` — Zod types
- `packages/shared/src/calendar-overlap.ts` — Shared overlap logic
- `packages/db/migrations/0001_init.sql` — Core schema
- `packages/db/migrations/0004_team_rls.sql` — Team RLS helpers
- `packages/db/migrations/0007_team_stylist_calendar_writes.sql`
- `packages/db/migrations/0012_inventory.sql`
- `packages/db/migrations/0013_tasks.sql`
- `packages/db/migrations/0014_team_documents.sql`
- `packages/db/migrations/0015_team_events.sql`
- `packages/db/migrations/0016_inventory_qr_seed.sql`

### Docs (platform)

- `README.md` — Monorepo overview, roles, dev setup
- `docs/CLOUDFLARE_DEPLOY.md` — Production deploy
- `docs/PRODUCTION_COMMS.md` — Email/SMS/cron
- `.env.example` — Env var reference

### Marketing repo (`saloncitrineindy`)

- `docs/EMPLOYEE_APP_PROMPT.md` — Short project prompt
- `docs/BOOKING_PROJECT_PROMPT.md` — Platform brief
- `src/data/site.ts` — Brand constants

---

## 13. Prerequisites

Before heavy mobile development:

- [ ] Platform deployed: `team.saloncitrineindy.com`, `book.saloncitrineindy.com` on Cloudflare ([CLOUDFLARE_DEPLOY.md](https://github.com/drewbuszx/salon-citrine-platform/blob/main/docs/CLOUDFLARE_DEPLOY.md))
- [ ] Supabase migrations applied through latest (`0019_tasks_rls_fix.sql`)
- [ ] Staff test accounts linked (`packages/db/scripts/create-dev-admin.mjs`)
- [ ] Team web smoke-tested: login, calendar, tasks, inventory scan
- [ ] **Bearer JWT auth on `/team/api/*`** implemented in platform (see §4)
- [ ] Font files obtained for Serling Galleria + Basic Title (from marketing `public/fonts/`)
- [ ] CORS: Cloudflare team worker must accept mobile app origins if needed (or use Bearer without cookies — no CORS issue for native)

---

## 14. Success criteria checklist

### v0 launch

- [ ] Stylist logs in with **same credentials** as web `/team`
- [ ] Must-change-password flow works on first login
- [ ] Today's appointments match web for that staff member
- [ ] Tasks: claim and complete update same rows as web
- [ ] Inventory scan → check-in matches web receive flow
- [ ] No `SUPABASE_SERVICE_ROLE_KEY` in app bundle or env committed to git
- [ ] RLS enforced on all Supabase reads/writes

### Full parity (north star)

- [ ] Every row in §6 feature map implemented or explicitly deferred with platform dependency
- [ ] Manager vs provider UI matches role matrix in §11
- [ ] Brand matches dusty rose / cream / card patterns from `@saloncitrine/theme`
- [ ] All `/team/api` JSON routes used where server logic required
- [ ] Datetimes display correctly in Indianapolis timezone
- [ ] App survives token refresh (`supabase.auth.onAuthStateChange`)

---

## 15. Out of scope

- Client-facing booking flow (`apps/web`, `/book/*`)
- New Supabase project or app-owned schema/migrations
- Shopify retail / gift cards
- GlossGenius integration
- Marketing site changes (except optional doc links)
- Duplicating overlap prevention, inventory triggers, or task claim logic client-side
- Service role key or server-side secrets in the mobile app
- POS / Stripe until platform Phase 2+ exposes staff POS APIs

---

## Appendix: When the platform changes

1. Schema → apply migration in `salon-citrine-platform` first
2. API shape change → update mobile API client types
3. New team feature on web → add row to §6 and implement in app
4. Consider publishing `@saloncitrine/shared` for shared TypeScript types

---

*Generated for Salon Citrine employee app handoff. Platform repo: `salon-citrine-platform`. Marketing repo: `saloncitrineindy`.*
