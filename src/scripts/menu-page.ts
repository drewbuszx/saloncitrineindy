const siteHeader = document.querySelector<HTMLElement>(".site-header");
const categoryNav = document.querySelector<HTMLElement>("[data-menu-category-nav]");
const navLinks = Array.from(
  document.querySelectorAll<HTMLAnchorElement>("[data-menu-nav-link]"),
);
const intentLinks = Array.from(
  document.querySelectorAll<HTMLAnchorElement>("[data-menu-intent-link]"),
);
const anchorLinks = Array.from(
  document.querySelectorAll<HTMLAnchorElement>("[data-menu-anchor-link]"),
);
const sections = Array.from(
  document.querySelectorAll<HTMLElement>("[data-menu-category]"),
);

const MOBILE_MQ = window.matchMedia("(max-width: 767px)");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function scrollBehavior(): ScrollBehavior {
  return prefersReducedMotion.matches ? "auto" : "smooth";
}

function syncNavHeight() {
  if (!categoryNav) return;
  document.documentElement.style.setProperty(
    "--menu-nav-height",
    `${categoryNav.offsetHeight}px`,
  );
}

function getStickyOffset() {
  const headerHeight = siteHeader?.offsetHeight ?? 0;
  const navHeight = categoryNav?.offsetHeight ?? 0;
  return headerHeight + navHeight + 8;
}

function setActiveCategory(id: string) {
  navLinks.forEach((link) => {
    const isActive = link.dataset.menuNavLink === id;
    link.classList.toggle("is-active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "location");
      if (MOBILE_MQ.matches) {
        link.scrollIntoView({ block: "nearest", inline: "center" });
      }
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function findCategoryForAnchor(id: string): string | null {
  const category = document.querySelector<HTMLElement>(
    `[data-menu-category="${id}"]`,
  );
  if (category) return id;

  const target = document.getElementById(id);
  const parentCategory = target?.closest<HTMLElement>("[data-menu-category]");
  return parentCategory?.dataset.menuCategory ?? null;
}

function scrollToTarget(id: string, behavior?: ScrollBehavior) {
  syncNavHeight();

  const categoryId = findCategoryForAnchor(id);
  if (categoryId) {
    setActiveCategory(categoryId);
  }

  const section = document.querySelector<HTMLElement>(
    `[data-menu-category="${id}"]`,
  );
  const target = section ?? document.getElementById(id);
  if (!target) return;

  const top =
    target.getBoundingClientRect().top + window.scrollY - getStickyOffset();
  window.scrollTo({
    top: Math.max(0, top),
    behavior: behavior ?? scrollBehavior(),
  });

  if (target instanceof HTMLElement) {
    if (!target.hasAttribute("tabindex")) {
      target.setAttribute("tabindex", "-1");
    }
    target.focus({ preventScroll: true });
  }
}

function bindAnchorNavigation(
  links: HTMLAnchorElement[],
  onNavigate: (id: string) => void,
) {
  links.forEach((link) => {
    link.addEventListener("click", (event) => {
      const id = link.getAttribute("href")?.replace(/^#/, "");
      if (!id) return;
      event.preventDefault();
      onNavigate(id);
      history.pushState(null, "", `#${id}`);
    });
  });
}

bindAnchorNavigation(navLinks, (id) => scrollToTarget(id));
bindAnchorNavigation(intentLinks, (id) => scrollToTarget(id));
bindAnchorNavigation(anchorLinks, (id) => scrollToTarget(id));

syncNavHeight();

let scrollSpy: IntersectionObserver | null = null;

function bindScrollSpy() {
  scrollSpy?.disconnect();
  if (!navLinks.length || !sections.length) return;

  scrollSpy = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      const categoryId = (visible[0]?.target as HTMLElement | undefined)
        ?.dataset.menuCategory;
      if (categoryId) {
        setActiveCategory(categoryId);
      }
    },
    {
      rootMargin: `-${getStickyOffset()}px 0px -55% 0px`,
      threshold: [0, 0.25, 0.5, 0.75, 1],
    },
  );

  sections.forEach((section) => scrollSpy!.observe(section));
}

bindScrollSpy();

window.addEventListener(
  "resize",
  () => {
    syncNavHeight();
    bindScrollSpy();
  },
  { passive: true },
);

if (location.hash) {
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }

  const id = location.hash.slice(1);
  const { pathname, search } = location;
  history.replaceState(null, "", `${pathname}${search}`);

  const alignHash = () => {
    window.scrollTo(0, 0);
    scrollToTarget(id, "auto");
    history.replaceState(null, "", `#${id}`);
    requestAnimationFrame(() => scrollToTarget(id, "auto"));
  };

  const scheduleHashAlign = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(alignHash);
    });
  };

  if (document.fonts?.ready) {
    document.fonts.ready.then(scheduleHashAlign);
  } else {
    scheduleHashAlign();
  }
}
