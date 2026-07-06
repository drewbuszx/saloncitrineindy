# Salon Citrine Website

Marketing site for [Salon Citrine](https://saloncitrineindy.com) in Irvington, Indianapolis. Online booking stays on GlossGenius.

## Requirements

- Node.js **22.12.0+** (see `package.json` engines)

## Development

```bash
npm install
npm run dev
```

Open `http://localhost:4321`.

## Build

```bash
npm run build
npm run preview
```

Static files are output to `dist/`.

### Prebuild menu sync

`npm run build` runs `prebuild` first, which fetches live service data from GlossGenius and writes `src/data/menu-services.json`. If the fetch fails (network outage, GlossGenius downtime), the build continues using the last cached menu file when one exists.

## Deploy to saloncitrineindy.com

This site is a static Astro build (`trailingSlash: always`). Any static host works.

### Cloudflare Pages (recommended if your domain is on Cloudflare)

1. Push this repo to GitHub.
2. In Cloudflare Pages, create a project from the repo.
3. Build command: `npm run build`
4. Output directory: `dist`
5. Node version: **22** (or match `engines` in `package.json`)
6. Add your custom domain `saloncitrineindy.com`.
7. Point your domain DNS to Cloudflare if it is not already.

The build ships:

- `robots.txt` and `sitemap-index.xml` (via `@astrojs/sitemap`)
- `404.html` (branded Astro 404 page)
- `public/_redirects` for trailing-slash and `/book` shortcuts

Optional analytics env vars in the Pages project:

- `PUBLIC_GA_ID` — Google Analytics measurement ID
- `PUBLIC_PLAUSIBLE_DOMAIN` — Plausible domain (used when GA is not set)

### Netlify

1. Import the repo in Netlify.
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Add custom domain `saloncitrineindy.com`.

Netlify also reads `public/_redirects` from the build output.

### Booking links

All **Book Now** buttons link to:

`https://saloncitrineindy.glossgenius.com/booking-flow`

A `/book` shortcut on the deployed site redirects there (see `public/_redirects`).

## Updating content

Edit `src/data/site.ts` for:

- Contact info and hours
- About copy
- Service menu highlights (homepage)
- Team members and profile pages
- Policies

Replace images in `public/images/`.

The full service menu at `/menu/` is synced from GlossGenius at build time (`scripts/build-menu-data.mjs`).

## Project structure

- `src/pages/index.astro` — homepage (single-page sections)
- `src/pages/menu.astro` — full service menu
- `src/pages/privacy.astro` — privacy policy
- `src/pages/team/[slug].astro` — stylist profile pages
- `src/pages/404.astro` — branded 404
- `src/data/site.ts` — salon content and JSON-LD
- `src/data/menu-services.json` — generated menu (prebuild)
- `src/styles/global.css` — site styling
- `public/robots.txt` — crawl rules + sitemap reference
- `public/_redirects` — Cloudflare/Netlify redirects
