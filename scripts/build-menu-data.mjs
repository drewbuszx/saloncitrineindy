import { existsSync, writeFileSync } from "node:fs";

const OUTPUT = "src/data/menu-services.json";
const SERVICES_URL = "https://saloncitrineindy.glossgenius.com/services";
const BOOKING_BASE = "https://saloncitrineindy.glossgenius.com/booking-flow";

let html;
try {
  const res = await fetch(SERVICES_URL);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} from ${SERVICES_URL}`);
  }
  html = await res.text();
} catch (err) {
  if (existsSync(OUTPUT)) {
    console.warn(
      `Menu sync failed (${err.message}); keeping existing ${OUTPUT}`
    );
    process.exit(0);
  }
  throw new Error(
    `Menu sync failed (${err.message}) and no cached ${OUTPUT} exists`
  );
}
const marker = '<script id="__NEXT_DATA__" type="application/json">';
const start = html.indexOf(marker);
if (start === -1) throw new Error("No __NEXT_DATA__ found");
const jsonStart = start + marker.length;
const jsonEnd = html.indexOf("</script>", jsonStart);
const data = JSON.parse(html.slice(jsonStart, jsonEnd));
const users = data.props.serverContext.publicUser.users;

const byGuid = new Map();

for (const user of users) {
  for (const service of user.services ?? []) {
    if (!byGuid.has(service.guid)) {
      byGuid.set(service.guid, {
        name: service.name,
        description: service.description?.trim() || null,
        category: normalizeCategory(service.category_name, service.name),
        price: service.price,
        priceVaries: service.price_varies,
        priceHidden: service.price_hidden,
        ordering: service.ordering ?? 999,
        duration: service.total_duration ?? null,
        token: service.token ?? null,
      });
    }
  }
}

const categories = new Map();
for (const service of byGuid.values()) {
  const cat = service.category || "Other";
  if (!categories.has(cat)) categories.set(cat, []);
  categories.get(cat).push(service);
}

const FIXED_PRICE_SERVICES = new Set([
  "COLOR CONSULTATION",
  "HOT TOWEL TREATMENT",
  "HAIR REDUCTION ENZYME ADD ON",
]);

/** Strip redundant "ADD-ON:" / "ADD-ONS:" prefix; category headers already say ADD-ONS. */
function cleanServiceName(name) {
  return name.replace(/^ADD-ONS?:\s*/i, "").trim();
}

function usesStartingPrice(category, serviceName, priceVaries) {
  const upper = cleanServiceName(serviceName).toUpperCase();
  if (FIXED_PRICE_SERVICES.has(upper)) return false;
  if (upper.includes("CONSULTATION")) return false;

  if (category === "Waxing Services") return upper === "NOSTRIL";
  if (category === "Skincare Services") return false;

  if (priceVaries) return true;

  const startingCategories = [
    "Haircuts",
    "Color-",
    "Hair Treatments",
    "Makeup Services",
  ];
  return startingCategories.some(
    (prefix) => category === prefix || category.startsWith(prefix)
  );
}

function formatPrice(price, priceVaries, priceHidden, category, serviceName) {
  if (priceHidden) return "Contact for pricing";
  const num = Number.parseFloat(price);
  if (Number.isNaN(num)) return price;
  if (num === 0) return "Complimentary";
  const formatted =
    num % 1 === 0 ? `$${num.toFixed(0)}` : `$${num.toFixed(2)}`;
  return usesStartingPrice(category, serviceName, priceVaries)
    ? `${formatted}+`
    : formatted;
}

function normalizeCategory(name, serviceName) {
  if (!name || name === "None") {
    const upper = serviceName.toUpperCase();
    if (upper.includes("BLEACH") || upper.includes("GLOSS")) {
      return "Color- Bleach & Tone";
    }
    if (upper.includes("WAX") || upper.includes("BROW")) {
      return "Waxing";
    }
    return "Other";
  }
  return name;
}

const categoryOrder = [
  "Haircuts",
  "Color",
  "Treatments",
  "Styling",
  "Extensions",
  "Skin",
  "Waxing",
  "Other",
];

const menuCategories = [...categories.entries()]
  .sort(([a], [b]) => {
    const ai = categoryOrder.indexOf(a);
    const bi = categoryOrder.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  })
  .map(([name, services]) => ({
    name,
    services: services
      .sort((a, b) => a.ordering - b.ordering || a.name.localeCompare(b.name))
      .map((s) => {
        const displayName = cleanServiceName(s.name).toUpperCase();
        return {
          name: displayName,
          price: formatPrice(
            s.price,
            s.priceVaries,
            s.priceHidden,
            name,
            displayName
          ),
          description: s.description,
          duration: s.duration,
          bookingUrl: s.token
            ? `${BOOKING_BASE}?service_token=${s.token}`
            : BOOKING_BASE,
        };
      }),
  }));

/** Site content overrides (Julie Powers skin services) — applied after GlossGenius sync. */
const FACIAL_75 = "BESPOKE KOREAN FACIAL- 75 MINUTES";
const FACIAL_90 = "BESPOKE KOREAN FACIAL- 90 MINUTES";
const MICRONEEDLING = "MICRONEEDLING";
const BROW_WAX_TINT = "BROW WAX & TINT";
const FACIAL_DESCRIPTION =
  "Enjoy a personalized facial experience where every step is tailored to your unique skincare concerns and goals, ensuring that you get the most out of your visit with individualized protocols and targeted treatments.";
const MICRONEEDLING_DESCRIPTION =
  "A collagen-stimulating treatment customized to your skin goals.";

for (const category of menuCategories) {
  category.services = category.services.filter((s) => s.name !== FACIAL_90);
  for (const service of category.services) {
    if (service.name === BROW_WAX_TINT) {
      service.price = "$45";
    }
  }
}

const skincare = menuCategories.find((c) => c.name === "Skincare Services");
if (skincare) {
  const facial75 = skincare.services.find((s) => s.name === FACIAL_75);
  if (facial75) {
    facial75.price = "$175";
  } else {
    const after30 = skincare.services.findIndex((s) =>
      s.name.includes("30 MINUTES")
    );
    const entry = {
      name: FACIAL_75,
      price: "$175",
      description: FACIAL_DESCRIPTION,
      duration: 75,
      bookingUrl: BOOKING_BASE,
    };
    if (after30 >= 0) skincare.services.splice(after30 + 1, 0, entry);
    else skincare.services.push(entry);
  }

  const micro = skincare.services.find((s) => s.name === MICRONEEDLING);
  if (micro) {
    micro.price = "$175+";
  } else {
    const after75 = skincare.services.findIndex((s) => s.name === FACIAL_75);
    const entry = {
      name: MICRONEEDLING,
      price: "$175+",
      description: MICRONEEDLING_DESCRIPTION,
      duration: null,
      bookingUrl: BOOKING_BASE,
    };
    if (after75 >= 0) skincare.services.splice(after75 + 1, 0, entry);
    else skincare.services.push(entry);
  }
}

writeFileSync(OUTPUT, JSON.stringify(menuCategories, null, 2) + "\n", "utf8");

const serviceCount = menuCategories.reduce(
  (sum, c) => sum + c.services.length,
  0
);
console.log(`Wrote ${menuCategories.length} categories, ${serviceCount} services`);
