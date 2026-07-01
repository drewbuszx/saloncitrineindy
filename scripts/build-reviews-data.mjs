import { writeFileSync } from "node:fs";

const SLUG = "saloncitrineindy";
const API_URL = `https://api.glossgenius.com/v3/web/reviews?slug=${SLUG}&limit=800`;

/** Stylists no longer at the salon — reviews are excluded from the site. */
const EXCLUDED_STYLISTS = ["Haley Clayton", "Caitlin Bondi"];

/** @param {string | undefined} stylist */
function isExcludedStylist(stylist) {
  if (!stylist) return false;
  const normalized = stylist.toLowerCase().trim();
  return EXCLUDED_STYLISTS.some((name) => {
    const lower = name.toLowerCase();
    if (normalized.includes(lower)) return true;
    const [first, last] = lower.split(/\s+/);
    return Boolean(first && last && normalized.includes(first) && normalized.includes(last));
  });
}

/** @typedef {{ name: string; rating: number | null; text: string; stylist?: string }} Review */

/** @returns {Promise<Review[]>} */
async function fetchReviews() {
  const res = await fetch(API_URL, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Reviews API returned ${res.status}`);
  }

  const body = await res.json();
  const items = Array.isArray(body) ? body : (body.data ?? []);

  return items
    .filter((item) => !item.hidden)
    .map((item) => ({
      name: (item.reviewer_name ?? "").trim() || "Client",
      rating: typeof item.rating === "number" ? item.rating : null,
      text: (item.message ?? "").trim(),
      ...(item.user_name ? { stylist: item.user_name.trim() } : {}),
    }))
    .filter((review) => review.text)
    .filter((review) => !isExcludedStylist(review.stylist));
}

/** @type {Review[]} */
const PLACEHOLDER_REVIEWS = [
  {
    name: "Client Name",
    rating: 5,
    text: "Add review text here. Run `node scripts/build-reviews-data.mjs` to fetch from GlossGenius.",
    stylist: "Stylist Name",
  },
];

let reviews;
try {
  reviews = await fetchReviews();
  if (reviews.length === 0) {
    console.warn("No reviews returned from API; using placeholder structure.");
    reviews = PLACEHOLDER_REVIEWS;
  }
} catch (error) {
  console.warn(
    `Failed to fetch reviews from ${API_URL}: ${error.message}\nUsing placeholder structure.`
  );
  reviews = PLACEHOLDER_REVIEWS;
}

writeFileSync(
  "src/data/reviews.json",
  JSON.stringify(reviews, null, 2) + "\n",
  "utf8"
);

console.log(`Wrote ${reviews.length} reviews to src/data/reviews.json`);
