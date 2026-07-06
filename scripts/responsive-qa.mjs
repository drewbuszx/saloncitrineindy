import { chromium } from "playwright";

const BASE = "http://localhost:4321";
const WIDTHS = [320, 390, 768, 1100, 1280];
const PAGES = [
  { path: "/", name: "homepage" },
  { path: "/menu/", name: "menu" },
  { path: "/team/julie-powers/", name: "profile-julie" },
  { path: "/team/miriam-zhukov/", name: "profile-miriam" },
  { path: "/privacy/", name: "privacy" },
  { path: "/404.html", name: "404" },
];

const CHECKS = String.raw`
(() => {
  const issues = [];
  const vw = document.documentElement.clientWidth;
  const scrollW = document.documentElement.scrollWidth;
  if (scrollW > vw + 1) {
    issues.push({ type: "overflow-x", detail: "scrollWidth " + scrollW + " > clientWidth " + vw });
  }

  const bookBar = document.querySelector(".book-bar");
  const bookRect = bookBar?.getBoundingClientRect();
  if (bookRect && (bookRect.bottom > window.innerHeight + 1 || bookRect.left < -1 || bookRect.right > vw + 1)) {
    issues.push({ type: "book-bar", detail: JSON.stringify({ top: bookRect.top, bottom: bookRect.bottom, left: bookRect.left, right: bookRect.right, innerH: window.innerHeight }) });
  }

  const header = document.querySelector(".site-header");
  const headerRect = header?.getBoundingClientRect();
  if (headerRect && headerRect.right > vw + 1) {
    issues.push({ type: "header-overflow", detail: "header right " + headerRect.right + " > " + vw });
  }

  const profileName = document.querySelector(".profile__name");
  if (profileName) {
    const nameRect = profileName.getBoundingClientRect();
    const media = document.querySelector(".profile__media");
    const mediaRect = media?.getBoundingClientRect();
    if (nameRect.right > vw + 2 || nameRect.left < -2) {
      issues.push({ type: "profile-name-overflow", detail: "name left=" + nameRect.left + " right=" + nameRect.right + " vw=" + vw });
    }
    if (mediaRect && nameRect.bottom > mediaRect.bottom + 4) {
      issues.push({ type: "profile-name-clip", detail: "name bottom " + nameRect.bottom + " > media " + mediaRect.bottom });
    }
  }

  const carousel = document.querySelector("[data-reviews-carousel]");
  if (carousel) {
    const cRect = carousel.getBoundingClientRect();
    if (cRect.right > vw + 2 || cRect.left < -2) {
      issues.push({ type: "reviews-overflow", detail: "carousel left=" + cRect.left + " right=" + cRect.right });
    }
    const cards = [...document.querySelectorAll(".review-card")].slice(0, 3);
    for (const card of cards) {
      const r = card.getBoundingClientRect();
      if (r.right > vw + 4 || r.left < -4) {
        issues.push({ type: "review-card-overflow", detail: "card left=" + r.left + " right=" + r.right });
        break;
      }
    }
  }

  const connect = document.querySelector(".connect-split");
  if (connect) {
    const children = [...connect.children];
    for (const child of children) {
      const r = child.getBoundingClientRect();
      if (r.right > vw + 2) {
        issues.push({ type: "connect-overflow", detail: child.className + " right=" + r.right });
      }
    }
  }

  const footer = document.querySelector(".site-footer");
  if (footer) {
    const links = footer.querySelector(".site-footer__links");
    if (links) {
      const r = links.getBoundingClientRect();
      if (r.right > vw + 2) {
        issues.push({ type: "footer-overflow", detail: "links right=" + r.right });
      }
    }
    const legal = footer.querySelector(".site-footer__legal");
    if (legal) {
      const r = legal.getBoundingClientRect();
      if (r.width > vw - 20) {
        const style = getComputedStyle(legal);
        if (style.whiteSpace === "nowrap") {
          issues.push({ type: "footer-legal-nowrap", detail: "legal width " + r.width });
        }
      }
    }
  }

  const menuNav = document.querySelector(".menu-nav");
  if (menuNav) {
    const r = menuNav.getBoundingClientRect();
    if (r.right > vw + 2 || r.left < -2) {
      issues.push({ type: "menu-nav-overflow", detail: "nav left=" + r.left + " right=" + r.right });
    }
  }

  // Find widest overflowing element
  const offenders = [];
  for (const el of document.querySelectorAll("body *")) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    if (r.right > vw + 1) {
      offenders.push({ tag: el.tagName, cls: el.className?.toString?.().slice(0, 80), right: Math.round(r.right) });
    }
  }
  offenders.sort((a, b) => b.right - a.right);
  return { issues, topOffenders: offenders.slice(0, 5) };
})()
`;

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ deviceScaleFactor: 1 });
const page = await context.newPage();

const allIssues = [];

for (const pg of PAGES) {
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(`${BASE}${pg.path}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    if (pg.path.includes("/team/")) {
      await page.waitForFunction(
        () => {
          const name = document.querySelector(".profile__name");
          return name && (name.style.fontSize || name.textContent);
        },
        { timeout: 5000 }
      ).catch(() => {});
    }
    const result = await page.evaluate(CHECKS);
    if (result.issues.length) {
      allIssues.push({ page: pg.name, width, ...result });
    }
  }
}

await browser.close();
console.log(JSON.stringify(allIssues, null, 2));
console.error(`Found ${allIssues.length} viewport/page combos with issues`);
