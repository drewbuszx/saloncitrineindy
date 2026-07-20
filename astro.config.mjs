// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
// Static SEO files live in public/ and are copied to the deploy root:
// - public/sitemap.xml → /sitemap.xml
// - public/robots.txt → /robots.txt
export default defineConfig({
  site: 'https://saloncitrineindy.com',
  trailingSlash: 'always',
});
