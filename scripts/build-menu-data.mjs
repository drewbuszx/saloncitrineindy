import { writeFileSync } from "node:fs";

const res = await fetch("https://saloncitrineindy.glossgenius.com/services");
const html = await res.text();
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
  "ADD-ON: HOT TOWEL TREATMENT",
  "HAIR REDUCTION ENZYME ADD ON",
]);

function usesStartingPrice(category, serviceName, priceVaries) {
  const upper = serviceName.toUpperCase();
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
      .map((s) => ({
        name: s.name.toUpperCase(),
        price: formatPrice(
          s.price,
          s.priceVaries,
          s.priceHidden,
          name,
          s.name
        ),
        description: s.description,
      })),
  }));

writeFileSync(
  "src/data/menu-services.json",
  JSON.stringify(menuCategories, null, 2) + "\n",
  "utf8"
);

console.log(`Wrote ${menuCategories.length} categories, ${byGuid.size} services`);
