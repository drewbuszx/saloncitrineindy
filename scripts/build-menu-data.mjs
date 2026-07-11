import { existsSync, writeFileSync } from "node:fs";

const OUTPUT = "src/data/menu-services.json";
const SERVICES_URL = "https://saloncitrineindy.glossgenius.com/services";

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
        };
      }),
  }));

writeFileSync(OUTPUT, JSON.stringify(menuCategories, null, 2) + "\n", "utf8");

console.log(`Wrote ${menuCategories.length} categories, ${byGuid.size} services`);
