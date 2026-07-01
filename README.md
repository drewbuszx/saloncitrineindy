# Salon Citrine Website

Marketing site for [Salon Citrine](https://saloncitrineindy.com) in Irvington, Indianapolis. Styled after the Benjamin Salon West Hollywood layout, with Salon Citrine branding, content, and photos. Online booking stays on GlossGenius.

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

## Deploy to saloncitrineindy.com

This site is a static Astro build. Any static host works. Common options:

### Cloudflare Pages (recommended if your domain is on Cloudflare)

1. Push this repo to GitHub.
2. In Cloudflare Pages, create a project from the repo.
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add your custom domain `saloncitrineindy.com`.
6. Point your domain DNS to Cloudflare if it is not already.

### Netlify

1. Import the repo in Netlify.
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Add custom domain `saloncitrineindy.com`.

### Point booking from your domain

Keep GlossGenius for scheduling. All **Book Now** buttons link to:

`https://saloncitrineindy.glossgenius.com/`

Optional: add a redirect so `saloncitrineindy.com/book` goes to GlossGenius.

## Updating content

Edit `src/data/site.ts` for:

- Contact info and hours
- About copy
- Service menu highlights
- Team members
- Policies

Replace images in `public/images/`.

## Project structure

- `src/pages/index.astro` — single-page layout
- `src/data/site.ts` — salon content
- `src/styles/global.css` — Benjamin-inspired styling
- `public/images/` — hero and team photos
