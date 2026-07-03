# Salon Citrine Booking Platform — Project Starter Prompt

Use this document as the **first message** in a new Cursor project to scaffold the custom booking and operations platform for Salon Citrine. Copy everything below the horizontal rule into a new chat, or reference this file from the new repo.

**Related repo:** Marketing site lives at `saloncitrineindy` (Astro 7, Cloudflare Pages). This booking platform is a **separate project/repo**.

---

## Prompt (copy from here)

You are building a custom salon booking and operations platform for **Salon Citrine**, a women-owned, gender-affirming, LGBTQ+ welcoming hair salon and esthetics studio in historic Irvington, Indianapolis. This is a **separate project/repo** from the existing marketing site. Your goal is to **replace GlossGenius** with a first-party system that eventually reaches **Vagaro/GlossGenius feature parity** for booking, SMS, staff calendar, client CRM, service checkout, and back-bar inventory.

### Confirmed stack — use these, do not substitute

| Service | Tool | Purpose |
|---------|------|---------|
| Database + staff auth | **Supabase** (Postgres + Auth + Edge Functions) | Appointments, clients, schedules, staff login |
| Service payments | **Stripe** | Card-on-file, deposits, checkout, no-show/cancellation fees |
| Client SMS | **Twilio** | Confirmations, reminders, opt-in marketing |
| Transactional email | **Resend** | Booking confirmations, reminders, receipts (`bookings@saloncitrineindy.com`) |
| Employee email | **Zoho Mail** | Human staff inboxes (`sayhello@`, etc.) — NOT for automated booking emails |
| Retail + gift cards | **Shopify** | Products, retail checkout, gift card purchase |
| Hosting | **Cloudflare Pages/Workers** | Same domain as marketing site |

Visual continuity with the marketing site via shared **`@saloncitrine/theme`** brand package.

---

## Context: What Exists Today

### Marketing site (do not break)

Live **static Astro 7** site (Node ≥22.12.0) on **Cloudflare Pages**. URL: `https://saloncitrineindy.com`. Single-page marketing + `/menu`. All booking is external today.

- Build command: `npm run build`
- Output directory: `dist`
- Site config: `site: 'https://saloncitrineindy.com'` in `astro.config.mjs`

### Current booking flow (GlossGenius — to be replaced)

Every "Book Now" link:

1. Opens cancellation policy modal (48-hour policy, no-show fees, card-on-file)
2. Redirects to GlossGenius on confirm

**Production URLs:**

| Purpose | URL |
|---------|-----|
| Main booking flow | `https://saloncitrineindy.glossgenius.com/booking-flow` |
| Services / stylist booking | `https://saloncitrineindy.glossgenius.com/services` |
| Per-stylist deep links | `{SERVICES_URL}?team_member_token={token}` |
| Gift cards (GlossGenius today) | `https://saloncitrineindy.glossgenius.com/shop/gift-cards` |
| Shopify retail | `https://saloncitrineindy.myshopify.com/` |

Marketing site scrapes GlossGenius for menu/reviews (`scripts/build-menu-data.mjs`, `scripts/build-reviews-data.mjs`). Your system becomes the **source of truth** so those scripts call your API instead.

### Integration boundaries

| System | Owns |
|--------|------|
| **This platform** | Appointments, availability, service menu, staff schedules, client CRM, service checkout, tips, fees, back-bar inventory, SMS (Twilio), transactional email (Resend) |
| **Shopify** | Retail products, cart, shipping, gift card purchase; balance lookup/redemption at service checkout in Phase 2 |
| **Stripe** | All service payments; never store raw card numbers |
| **Zoho Mail** | Staff human email only |
| **Resend** | All automated client email |
| **Marketing site** | Brand content; links to `/book`; consumes your public API for menu/reviews |

---

## Salon Reference Data (seed Supabase with this)

### Business info

| Field | Value |
|-------|-------|
| Name | Salon Citrine |
| Tagline | Hairdressing rooted in inclusion, creativity, and simple beauty for everyone. ♡ |
| Domain | saloncitrineindy.com |
| Phone | (317) 476-5375 |
| Email | sayhello@saloncitrineindy.com |
| Instagram | https://www.instagram.com/Saloncitrineindy |
| Address | 203 S. Audubon Rd, Indianapolis, IN 46219 |
| Coordinates | 39.7677018, -86.070018 |
| Timezone | America/Indiana/Indianapolis |

### Hours

| Day | Hours |
|-----|-------|
| Mon | Closed |
| Tue–Thu | 10:00 AM – 8:00 PM |
| Fri–Sat | 10:00 AM – 5:00 PM |
| Sun | Closed |

### Team (7 providers)

**OWNERS**

| Name | Role | GlossGenius `team_member_token` |
|------|------|----------------------------------|
| Lily Gleitsman | Owner/Stylist | `10001-f5bd9a7b-3e2f-4255-951d-ca4881f88678` |
| Miriam Zhukov | Owner/Stylist | `10001-690e87a4-3d1b-44db-a449-08c9d40b5dff` |
| Andra Kramer | Owner/Stylist | `10001-7e4b7dd5-f741-4f6f-b71d-ed5cc3b638ec` |

**STYLISTS**

| Name | Role | Notes | GlossGenius token |
|------|------|-------|-------------------|
| Shelby Craft | Stylist | Specializes in alternative, vivid, edgy styles and low-maintenance natural looks | `10001-6a29adda-3651-43d9-8899-3ace37524a1e` |
| Jules Hoffman | Emerging Stylist | Helping you feel like the star you are, one appointment at a time. | `10001-40fac3c0-b13b-47c2-86da-6e1c3452329f` |
| Brie Crowe | Stylist | — | `10001-32abe5c0-3025-48ed-8516-850b1fc5783f` |

**SKIN & BEAUTY**

| Name | Role | Notes | GlossGenius token |
|------|------|-------|-------------------|
| Julie Powers | Esthetician | Korean-inspired facials, peels, waxing, and makeup artistry | `10001-d788dd27-3f49-452f-af8e-c87bb31e94c3` |

Suggested URL slugs for per-stylist deep links: `lily-gleitsman`, `miriam-zhukov`, `andra-kramer`, `shelby-craft`, `jules-hoffman`, `brie-crowe`, `julie-powers`.

Team photos on marketing site: `/images/{slug}.jpg` (e.g. `/images/lily-gleitsman.jpg`).

### Service menu

80+ services across: Haircuts, Color (Dimensional, Bleach & Tone, Single Color, Vivids), Treatments & Styling, Consultations, Waxing, Skincare, Makeup. Prices often show as starting rates (`$55+`). Some services are add-on only. Consultations required before vivids, extensions, certain peels, makeup application.

**Representative categories and services:**

| Category | Examples | Starting prices |
|----------|----------|-----------------|
| Haircuts | NEW CLIENT HAIRCUT, HAIRCUT, TRANSFORMATIVE HAIRCUT, CLIPPER CUT, DRY CUT, FRINGE/UNDERCUT MAINTENANCE, kid's cuts, DETANGLE | $20+–$65+ |
| Color — Dimensional | FULL/PARTIAL DIMENSIONAL COLOR & BLOWOUT/CUT, MINI LIGHTS | $80+–$200+ |
| Color — Bleach & Tone | ALL OVER BLEACH AND TONE, BLEACH ROOT TOUCH UP | $150+–$375+ |
| Color — Single Color | ALL OVER COLOR, ROOT TOUCH UP, GLOSS | $80+–$150+ |
| Color — Vivids | COLOR CONSULTATION ($20), VIVID TRANSFORMATION | $20–$250+ |
| Treatments & Styling | KERATIN COMPLEX, add-ons (DEEP CONDITION, K-18, MALIBU, etc.), BLOWOUT, SILK PRESS, HAIR TINSEL | $5+–$300+ |
| Consultations | KERATIN CONSULTATION, EXTENSIONS CONSULTATION, SKINCARE CONSULTATION, MAKEUP CONSULTATION | Complimentary |
| Waxing | BRAZILIAN, BROW SHAPING, FULL LEG, BIKINI, and 15+ additional services | $20–$95 |
| Skincare | BESPOKE KOREAN FACIAL (60/90 min), ACNE FACIAL, GLOW PEEL, GREEN SEA SPICULE PEEL, and 10+ treatments | $125–$300 |
| Makeup | MAKEUP APPLICATION, FX/BODY PAINTING, MAKEUP LESSON | $125+–$250+ |

**Pricing rules to encode:**

- Prices with `+` are starting rates; final price varies by hair length, density, and stylist level
- Some services are add-on only (NOT STANDALONE)
- Consultations may be required before booking (color transformations, vivids, makeup, extensions, certain peels)
- Consultation fees apply toward first full service when booked

**Seed data source:** Existing marketing repo file `src/data/menu-services.json` (80+ services with descriptions). Use GlossGenius export or this JSON for initial Supabase seed.

### Policies (enforce in booking flow)

**Cancellation policy:**

- Reschedule **48+ hours** before to avoid fee
- Cancel within 48h: **50%** charge
- No-show: **100%** charge
- **15+ min late** without contact = no-show
- Fees waived if rescheduled same week
- Card on file required to secure booking

**Consultation policy:**

- All full service appointments include a consultation
- Color consultations required before big transformations
- Consultation fees apply toward first full service when booked

**Pricing policy:**

- Prices with a `+` are starting rates and may vary based on hair length, density, and stylist level
- See full service menu when booking online

**Booking policy:**

- Appointments are booked through the online scheduling system
- A card on file may be required to secure booking

Replicate marketing site cancellation modal before final confirmation. Modal must be keyboard-trappable; Escape closes (match existing `BookingModal.astro` behavior).

---

## Brand / Theme (`@saloncitrine/theme`)

Extract from marketing site into shared package:

**Colors:** citrine `#e7ac46`, sage `#8d9e88`, dusty rose `#ae948f`, charcoal `#3c3d3c`, white `#ffffff`

**Extended CSS tokens from marketing site:**

```css
--color-black: #0a0a0a;
--color-white: #ffffff;
--color-citrine: #e7ac46;
--color-citrine-dark: #d3a946;
--color-dusty-rose: #ae948f;
--color-sage: #8d9e88;
--color-charcoal: #3c3d3c;
--color-book-bar-bg: var(--color-citrine);
--color-book-bar-text: var(--color-black);
--color-book-bar-hover-bg: var(--color-black);
--color-book-bar-hover-text: var(--color-citrine);
--book-bar-height: 56px;
--max-width: 1200px;
--section-padding: clamp(2rem, 5.5vw, 4rem);
```

**Fonts:** Cormorant Garamond (body), Oswald (labels), Basic Title + Serling Galleria (nav/CTAs)

**Patterns:** citrine bottom book bar, editorial section titles, light/dark theme via `[data-theme]`

```
packages/theme/
  tokens.css
  fonts.css
  components/   # Button, Modal, BookBar
```

---

## Architecture

### Monorepo structure

```
salon-citrine-platform/
├── apps/
│   ├── web/          # Client booking UI at /book
│   ├── admin/        # Staff dashboard at /admin
│   └── api/          # Optional; or use Supabase Edge Functions
├── packages/
│   ├── theme/        # @saloncitrine/theme
│   ├── db/           # Supabase schema, migrations, seed
│   └── shared/       # Zod types, constants
```

### Supabase

- **Postgres** for all app data
- **Supabase Auth** for staff `/admin` login (roles: owner, stylist, esthetician, front desk)
- **Row Level Security** on all tables
- **Edge Functions** for: Stripe webhooks, Twilio webhooks, Resend sends, scheduled reminder jobs
- **pg_cron** or external scheduler (Inngest/Trigger.dev) for 48h/24h reminder sweeps

### Resend setup

- Verify domain `saloncitrineindy.com` in Resend (DNS records in Cloudflare)
- Send from: `bookings@saloncitrineindy.com` (confirmations, reminders, receipts)
- Optional: `noreply@saloncitrineindy.com`
- React Email or plain HTML templates matching `@saloncitrine/theme`
- Log every send in `email_logs` table (recipient, template, resend_id, status)

### Twilio setup

- 10DLC registration for US business SMS (start early — takes weeks)
- Use salon number `(317) 476-5375` or dedicated booking line
- Templates: confirmation, 48h reminder, 24h reminder, cancellation, marketing (opt-in only)
- Log all messages; honor STOP/opt-out (TCPA)

### Zoho Mail

- Staff inboxes only (`sayhello@`, per-stylist if desired)
- MX records in Cloudflare — separate from Resend sending domain
- Do NOT route automated booking emails through Zoho

### Stripe

- Customer + SetupIntent for card-on-file at booking
- PaymentIntent for deposits/full pay and checkout
- Off-session charges for cancellation/no-show fees
- Webhooks → Supabase Edge Function

### Same-domain routing (Cloudflare)

```
saloncitrineindy.com/*       → marketing Pages (existing)
saloncitrineindy.com/book/*  → booking app
saloncitrineindy.com/admin/* → admin app
saloncitrineindy.com/api/*   → Supabase Edge Functions or Worker proxy
```

During migration, temporarily redirect `/book` to GlossGenius; flip to new app when Phase 1 is tested.

---

## Feature Parity (phased)

### Phase 1 — MVP (replace GlossGenius booking)

**Client (`/book`):**

- [ ] Service → stylist → date/time → details → policy modal → Stripe card-on-file → confirm
- [ ] Per-stylist deep links (`/book?stylist=shelby-craft`)
- [ ] Resend confirmation email + Twilio confirmation SMS within 60s
- [ ] 48h and 24h reminders (Resend + Twilio)

**Admin (`/admin`):**

- [ ] Supabase Auth staff login
- [ ] Week calendar, all 7 providers
- [ ] View/create/edit/cancel appointments
- [ ] Blocked time / time off
- [ ] Basic client record

**Migration:**

- [ ] Seed services from GlossGenius export / existing `menu-services.json`
- [ ] Map staff tokens to Supabase IDs
- [ ] Marketing site flips `BOOKING_URL` to `/book` when ready

### Phase 2 — Operations

- [ ] Client portal (view/reschedule/cancel)
- [ ] Rebooking, deposits, intake forms, waitlist
- [ ] Drag-drop calendar, client CRM notes, walk-ins
- [ ] Service checkout/POS, tips, Stripe saved-card charge
- [ ] Auto cancellation/no-show fees
- [ ] Two-way SMS, marketing SMS (opt-in)
- [ ] Shopify gift card redemption at checkout

### Phase 3 — Inventory & reporting

- [ ] Back-bar product tracking (not Shopify retail)
- [ ] Revenue, bookings, stylist performance reports
- [ ] Public API for marketing site menu/reviews

---

## Database schema (Supabase — core tables)

| Table | Key fields / purpose |
|-------|---------------------|
| `staff` | role, bio, photo_url, glossgenius_token, is_bookable, supabase_user_id |
| `services` | category, description, base_price_cents, duration_minutes, is_addon, requires_consultation, price_varies |
| `staff_services` | many-to-many, optional price override |
| `staff_schedules` | day_of_week, start/end, effective date range |
| `blocked_times` | staff_id, start, end, reason |
| `clients` | name, email, phone, stripe_customer_id, sms_opt_in, email_opt_in |
| `appointments` | client, staff, start, end, status, notes, stripe_payment_intent_id |
| `appointment_services` | multi-service bookings |
| `email_logs` | resend_id, template, recipient, status |
| `sms_logs` | twilio_sid, recipient, body, status |
| `policies` | cancellation rules (seed from policy text above) |

---

## API / Edge Functions (Phase 1 minimum)

```
GET  /api/services
GET  /api/staff
GET  /api/staff/:slug/availability?date=&serviceId=
POST /api/appointments
POST /api/stripe/setup-intent
POST /api/webhooks/stripe
POST /api/webhooks/twilio
GET  /api/admin/appointments
POST /api/admin/appointments
PATCH /api/admin/appointments/:id
```

**Internal triggers (cron/Inngest):**

- `send-appointment-confirmation` → Resend + Twilio
- `send-reminders` → 48h and 24h before, Resend + Twilio

---

## Environment variables (document in `.env.example`)

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

RESEND_API_KEY=
RESEND_FROM_EMAIL=bookings@saloncitrineindy.com

SHOPIFY_STORE_URL=
SHOPIFY_ACCESS_TOKEN=

APP_URL=https://saloncitrineindy.com
TZ=America/Indiana/Indianapolis
```

Zoho Mail has no app env vars — it's DNS/MX only for staff inboxes.

---

## Concrete first steps

1. **Scaffold monorepo** with apps/web, apps/admin, packages/theme, packages/db
2. **Create Supabase project** — schema, RLS, seed staff + services + hours + policies
3. **Set up Resend** — verify domain, build confirmation + reminder email templates
4. **Set up Twilio** — start 10DLC registration immediately
5. **Set up Stripe** — test mode, SetupIntent + webhook handler
6. **Build `/book` multi-step flow** with `@saloncitrine/theme`, policy modal, Stripe Elements
7. **Build `/admin` week calendar** with Supabase Auth
8. **Wire confirmations** — on booking create: Resend email + Twilio SMS in parallel
9. **Wire reminders** — cron job at 48h and 24h before appointment
10. **Document Cloudflare routing** for same-domain deploy (don't cut over until Phase 1 is tested)

---

## Constraints

1. Do not break the marketing site
2. Run parallel with GlossGenius 2–4 weeks before cutover
3. PCI via Stripe only — no raw card storage
4. Resend for all automated email; Zoho Mail for staff inboxes only
5. Twilio for all client SMS; register 10DLC early
6. Supabase for all app data and staff auth
7. Shopify for retail only — clear boundary with service checkout
8. Store datetimes in UTC; display in America/Indiana/Indianapolis
9. Mobile-first booking UI; match Salon Citrine visual identity
10. Enforce add-on-only services, consultation prerequisites, `$55+` variable pricing display

---

## Phase 1 success criteria

- Client books at `saloncitrineindy.com/book` without GlossGenius
- Staff sees appointments in `/admin`
- Resend confirmation email + Twilio SMS within 60 seconds of booking
- 48h and 24h reminders fire automatically
- Card saved via Stripe SetupIntent
- Cancellation policy acknowledged before booking completes
- Design is immediately recognizable as Salon Citrine

**Start now:** scaffold monorepo → Supabase schema + seed → Resend domain verification + confirmation template → `/book` flow with Stripe card-on-file → Twilio + Resend on booking create → `/admin` calendar.

---

## End of prompt
