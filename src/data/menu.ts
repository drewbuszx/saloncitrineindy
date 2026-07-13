import menuCategories from "./menu-services.json";
import {
  COMPACT_SERVICE_NAMES,
  MENU_CATEGORIES,
  MENU_SUBGROUPS,
  type MenuCategoryId,
  type MenuSubgroupDefinition,
  type ServiceLabel,
  type ServicePresentation,
  resolveMenuCategoryId,
} from "./menu-config";
import { BOOKING_URL } from "./site";

export interface RawMenuService {
  name: string;
  price: string;
  description: string | null;
  duration?: number | null;
  bookingUrl?: string;
}

export type ConsultationKind = "color" | "makeup" | "general" | null;

export interface MenuService extends RawMenuService {
  /** Original GlossGenius service name (uppercase source). */
  sourceName: string;
  sourceCategory: string;
  labels: ServiceLabel[];
  descriptionBody: string | null;
  qualifier: string | null;
  priceDisplay: string;
  durationDisplay: string | null;
  bookingUrl: string;
  isAddon: boolean;
  isConsultation: boolean;
  requiresConsultation: boolean;
  consultationKind: ConsultationKind;
  presentation: ServicePresentation;
  anchorId: string;
}

export interface VisitorMenuSubgroup {
  id: string;
  name: string;
  presentation: ServicePresentation;
  services: MenuService[];
}

export interface VisitorMenuCategory {
  id: MenuCategoryId;
  name: string;
  description: string;
  showConsultationPanel?: boolean;
  defaultPresentation: ServicePresentation;
  services: MenuService[];
  subgroups: VisitorMenuSubgroup[] | null;
}

interface DisplayOverride {
  name?: string;
  body?: string | null;
  qualifier?: string | null;
  labels?: ServiceLabel[];
}

/** Display-only copy overrides — never changes tokens, prices, durations, or IDs. */
const DISPLAY_OVERRIDES: Record<string, DisplayOverride> = {
  "NEW CLIENT HAIRCUT": {
    name: "New Client Haircut",
    body: "First time at Salon Citrine? Welcome! This gives your stylist more time to consult and get to know your hair. Shampoo and blowout included.",
    labels: ["New Clients"],
  },
  HAIRCUT: {
    name: "Haircut",
    body: "For returning clients — your classic haircut to maintain your current shape. Shampoo and blowout included.",
    qualifier: "Not for new shapes requiring more than 4+ inches off.",
    labels: ["Existing Clients"],
  },
  "TRANSFORMATIVE HAIRCUT": {
    name: "Transformative Haircut",
    body: "For big changes such as taking more than 3\" off and creating a new shape. Great for a new shag, mullet, bob, or pixie.",
  },
  "CLIPPER CUT": {
    name: "Clipper Cut",
    body: "Maintaining your personalized tapered look, typically with clippers. Shampoo and style included.",
  },
  "DRY CUT": {
    name: "Dry Cut",
    body: "Maintenance haircut with no shampoo, style, or product. Come in with clean, dry hair down.",
  },
  "FRINGE / UNDERCUT MAINTENANCE": {
    name: "Fringe / Undercut Maintenance",
    body: "A quick freshen-up between haircuts — good for bang trims, undercut trims, and neckline cleanups.",
  },
  "BABY'S FIRST HAIRCUT": {
    name: "Baby's First Haircut",
    body: "Ready to tidy a baby mullet or get hair out of their eyes? For ages 0–2.",
  },
  "LITTLE KID'S HAIRCUT": {
    name: "Little Kid's Haircut",
    body: "For ages 2–5.",
    qualifier: "No shampoo experience included.",
  },
  "BIG KID'S HAIRCUT": {
    name: "Big Kid's Haircut",
    body: "For ages 6–11. Shampoo included if they want it!",
  },
  DETANGLE: {
    name: "Detangle",
    body: "Need help with mats or stubborn tangles? We've got you.",
  },
  "FULL DIMENSIONAL COLOR & BLOWOUT": {
    name: "Full Dimensional Color & Blowout",
    body: "Full head of dimensional color, plus a blowout. Good for highlights, lowlights, or balayage.",
  },
  "FULL DIMENSIONAL COLOR & CUT": {
    name: "Full Dimensional Color & Cut",
    body: "Full head of dimensional color, plus a custom haircut. Good for highlights, lowlights, or balayage.",
  },
  "PARTIAL DIMENSIONAL COLOR & BLOWOUT": {
    name: "Partial Dimensional Color & Blowout",
    body: "Freshen up existing dimensional hair, plus a blowout. Good for highlights or balayage.",
  },
  "PARTIAL DIMENSIONAL COLOR & CUT": {
    name: "Partial Dimensional Color & Cut",
    body: "Freshen up existing dimensional hair, plus a custom haircut. Good for highlights or balayage.",
  },
  "MINI LIGHTS & BLOWOUT": {
    name: "Mini Lights & Blowout",
    body: "Brighten around the face or along the part, plus a blowout. Good for face-framing highlights, a money piece, or color blocking.",
  },
  "MINI LIGHTS & CUT": {
    name: "Mini Lights & Cut",
    body: "Brighten around the face or along the part, plus a custom haircut. Good for face-framing highlights or a money piece.",
  },
  "ALL OVER BLEACH AND TONE & BLOWOUT": {
    name: "All-Over Bleach and Tone & Blowout",
    body: "A solid blonde look by lightening from scalp to ends and toning to your desired tone, plus a blowout.",
  },
  "ALL OVER BLEACH AND TONE & HAIRCUT": {
    name: "All-Over Bleach and Tone & Haircut",
    body: "A solid blonde look by lightening from scalp to ends and toning to your desired tone, plus a custom haircut.",
  },
  "BLEACH ROOT TOUCH UP & BLOWOUT": {
    name: "Bleach Root Touch-Up & Blowout",
    body: "Touch up roots from previous bleach-and-tone hair, plus a blowout.",
    qualifier: "Only for roots 1\" or under. If longer, book an All-Over Bleach & Tone.",
  },
  "BLEACH ROOT TOUCH UP & HAIRCUT": {
    name: "Bleach Root Touch-Up & Haircut",
    body: "Touch up roots from previous bleach-and-tone hair, plus a custom haircut.",
    qualifier: "Only for roots 1\" or under. If longer, book an All-Over Bleach & Tone.",
  },
  "ALL OVER COLOR WITH BLOWOUT": {
    name: "All-Over Color with Blowout",
    body: "One solid color from scalp to ends, typically darker, plus a blowout.",
    qualifier: "Not for dimensional color or going lighter.",
  },
  "ALL OVER COLOR WITH HAIRCUT": {
    name: "All-Over Color with Haircut",
    body: "One solid color from scalp to ends, typically darker, plus a custom haircut.",
    qualifier: "Not for dimensional color or going lighter.",
  },
  "ROOT TOUCH UP WITH A BLOWOUT": {
    name: "Root Touch-Up with a Blowout",
    body: "One solid color to touch up all-over color, plus a blowout.",
    qualifier: "Not for highlights or dimensional lightening.",
  },
  "ROOT TOUCH UP WITH A HAIRCUT": {
    name: "Root Touch-Up with a Haircut",
    body: "One solid color to touch up all-over color, plus a haircut.",
    qualifier: "Not for highlights or dimensional lightening.",
  },
  "GLOSS WITH A BLOWOUT": {
    name: "Gloss with a Blowout",
    body: "Semi-permanent color to lightly tint natural hair or refresh previously lightened tone, plus a blowout.",
  },
  "GLOSS WITH A HAIRCUT": {
    name: "Gloss with a Haircut",
    body: "Semi-permanent color to lightly tint natural hair or refresh previously lightened tone, plus a custom haircut.",
  },
  "COLOR CONSULTATION": {
    name: "Color Consultation",
    body: "Not sure what to schedule, or curious whether your hair goals are achievable? This is for you.",
    qualifier:
      "Must be scheduled before big color transformations. The fee goes toward your final service if booked at the consultation.",
  },
  "VIVID TRANSFORM": {
    name: "Vivid Transform",
    body: "Full vivid transformation — a two-step process where hair is lifted, then vivid color is applied. Final price equals about $100/hour.",
    qualifier:
      "A color consultation is required before scheduling. Consults over text or in person are accepted.",
    labels: ["Consultation Required"],
  },
  "HOT TOWEL TREATMENT": {
    name: "Hot Towel Treatment",
    body: "Add a hot towel and aromatherapy to your shampoo experience.",
    qualifier: "Must be added to another eligible service.",
    labels: ["Add-On"],
  },
  "DEEP CONDITION": {
    name: "Deep Condition",
    body: "Extra moisture or strengthening — a custom deep condition and pampering moment.",
    qualifier: "Must be added to another eligible service.",
    labels: ["Add-On"],
  },
  "MALIBU TREATMENT": {
    name: "Malibu Treatment",
    body: "Great for pre-color, mineral and buildup removal, post-swim or vacation, and more.",
    qualifier: "Must be added to another eligible service.",
    labels: ["Add-On"],
  },
  "SCALP REVITALIZING TREATMENT": {
    name: "Scalp Revitalizing Treatment",
    body: "A rejuvenating scalp and hair treatment with dry brushing, double cleanse, scalp scrub, jade comb massage, and a hydrating deep condition with a hot towel. Includes a warm weighted eye mask and cozy aromas.",
    qualifier:
      "Must be added to another eligible service. Ear plugs available for ultimate relaxation.",
    labels: ["Add-On"],
  },
  "K-18 TREATMENT": {
    name: "K-18 Treatment",
    body: "Repair and protect — pair with a color service or book as a standalone treatment.",
    qualifier: "Must schedule a blowout if booking as a standalone treatment.",
  },
  "STYLING EDUCATION": {
    name: "Styling Education",
    body: "Extra one-on-one styling education for you.",
    qualifier: "Must be added to another eligible service.",
    labels: ["Add-On"],
  },
  "HAIR TINSEL": {
    name: "Hair Tinsel",
    body: "Make your hair sparkle! A variety of colors and application methods are available.",
    qualifier:
      "If you want a specific color or method, leave a note or contact us before your appointment. Price includes one application; additional applications are $5 each.",
  },
  BLOWOUT: {
    name: "Blowout",
    body: "Start with a relaxing shampoo and scalp massage and leave with a beautiful style.",
  },
  "SILK PRESS": {
    name: "Silk Press",
    body: "Scalp cleanse, deep condition, blow-dry, and flat iron.",
  },
  "KERATIN COMPLEX TREATMENT": {
    name: "Keratin Complex Treatment",
    body: "Nourish and smooth hair for a sleek, shiny, frizz-free finish that lasts for weeks. Not sure if this is right for you? Schedule a complimentary consultation.",
  },
  "CONSULTATION FOR KERATIN COMPLEX": {
    name: "Keratin Complex Consultation",
    body: "Curious about a keratin treatment? Learn more and see how we can help.",
  },
  "EXTENSIONS CONSULTATION": {
    name: "Extensions Consultation",
    body: "Curious if extensions are right for you? Book this to learn more.",
  },
  NOSTRIL: {
    name: "Nostril",
    body: "Get those pesky nose hairs taken care of.",
  },
  "BROW MAINTENANCE": {
    name: "Brow Maintenance",
    body: "Quick cleanup.",
  },
  "BROW SHAPING": {
    name: "Brow Shaping",
    body: "Extra TLC with tweezing and trimming to get brows into shape.",
  },
  "FULL FACE WAX": {
    name: "Full Face Wax",
    body: "Can include brow, lip, and chin, plus the sides of the face and under the jawline.",
  },
  "HAIR REDUCTION ENZYME ADD ON": {
    name: "Hair Reduction Enzyme Add-On",
    body: "A papain enzyme treatment that helps reduce unwanted hair growth on freshly waxed skin. We apply the first application in-salon; you take the rest home for the next 36 hours.",
    qualifier:
      "Can be added to any waxing service. Blocks 10 minutes on the schedule but does not add time to your service.",
    labels: ["Add-On"],
  },
  "BESPOKE KOREAN FACIAL- 60 MINUTES": {
    name: "Bespoke Korean Facial — 60 Minutes",
    body: "A personalized facial tailored to your skincare concerns and goals, with individualized protocols and targeted treatments.",
  },
  "BESPOKE KOREAN FACIAL- 30 MINUTES": {
    name: "Bespoke Korean Facial — 30 Minutes",
    body: "A shorter personalized facial tailored to your concerns and goals. Treatments vary depending on time.",
  },
  "BESPOKE KOREAN FACIAL- 75 MINUTES": {
    name: "Bespoke Korean Facial — 75 Minutes",
    body: "An extended personalized facial tailored to your skincare concerns and goals, with individualized protocols and targeted treatments.",
  },
  "ACNE FACIAL- INITIAL VISIT": {
    name: "Acne Facial — Initial Visit",
    body: "Advanced techniques and carefully chosen products to combat blemishes, breakouts, and congestion. Our Korean-inspired approach minimizes unnecessary stimulation while supporting clearer, healthier skin.",
    qualifier:
      "Proper homecare is required. The first treatment includes professional product for home use.",
    labels: ["New Clients"],
  },
  "ACNE FACIAL-RETURNING CLIENT": {
    name: "Acne Facial — Returning Client",
    body: "Ongoing acne care with advanced techniques and carefully chosen products for clearer, healthier skin.",
    labels: ["Existing Clients"],
  },
  MICRONEEDLING: {
    name: "Microneedling",
    body: "A collagen-stimulating treatment customized to your skin goals.",
    labels: ["Advanced Treatment"],
  },
  "GLOW PEEL": {
    name: "Glow Peel",
    body: "A gentle brightening peel with 40% glycolic acid that lightens hyperpigmentation and repairs free-radical damage — often called a lunchtime peel with no downtime.",
    labels: ["Advanced Treatment"],
  },
  "GREEN SEA SPICULE PEEL-1ST PEEL": {
    name: "Green Sea Spicule Peel — First Peel",
    body: "A natural resurfacing peel safe for all Fitzpatrick types and during pregnancy. Ideal for texture (including acne scarring) and hyperpigmentation. Spicules stimulate collagen, exfoliate, and pull pigment while delivering vitamins and nutrients.",
    qualifier:
      "Requires 2 weeks of at-home prep. Cost includes required pre- and post-peel homecare products.",
    labels: ["Advanced Treatment"],
  },
  "GREEN SEA PEEL-RETURNING CLIENT": {
    name: "Green Sea Peel — Returning Client",
    body: "For all additional Green Sea Peel treatments after your initial peel.",
    labels: ["Existing Clients", "Advanced Treatment"],
  },
  "ILLUMIN BIPHASIC CHEMICAL PEEL": {
    name: "Illumin Biphasic Chemical Peel",
    body: "Best for acne, scar reduction, hyperpigmentation, and balancing overactive sebum.",
    qualifier: "An advanced treatment — cannot be done on your first visit.",
    labels: ["Existing Clients", "Advanced Treatment"],
  },
  "KOREAN NEEDLE-FREE FILLER FACIAL": {
    name: "Korean Needle-Free Filler Facial",
    body: "A non-invasive anti-aging treatment that softens fine lines by plumping skin on the face and neck. Collagen stimulation continues for 3 weeks after one treatment, and up to 5 months after a series of 3–5 weekly treatments.",
    labels: ["Advanced Treatment"],
  },
  "LAZER PEEL": {
    name: "LaZer Peel",
    body: "A medium-depth peel (pH 1.7) for stubborn hyperpigmentation including melasma. Requires some downtime.",
    qualifier:
      "Only available to regular clients due to pre- and post-peel care requirements. Cannot be booked for your first visit.",
    labels: ["Existing Clients", "Advanced Treatment"],
  },
  "SUNBURN RX EXPRESS": {
    name: "Sunburn Rx Express",
    body: "A 30-minute Korean skincare treatment to soothe, hydrate, and help heal sunburned skin.",
  },
  "CLEAR PEEL": {
    name: "Clear Peel",
    body: "Helps treat acne and reduce inflammation — calms redness, soothes irritation, and combats oxidative stress that can contribute to acne and post-inflammatory hyperpigmentation.",
    labels: ["Advanced Treatment"],
  },
  "SKINCARE CONSULTATION": {
    name: "Skincare Consultation",
    body: "Not sure where to start? Book a complimentary 15-minute skincare consultation.",
  },
  "MAKEUP APPLICATION (BEAUTY MAKEUP)": {
    name: "Makeup Application (Beauty Makeup)",
    body: "Personalized looks that celebrate your individuality.",
    labels: ["Consultation Required"],
    qualifier: "A makeup consultation is required before booking.",
  },
  "FX/BODY PAINTING MAKEUP": {
    name: "FX / Body Painting Makeup",
    body: "SFX and body painting for stunning transformations — from fantastical creatures to realistic effects. Application can be on or off site depending on need.",
    qualifier:
      "Requires a free consultation, plus additional material cost depending on design.",
    labels: ["Consultation Required"],
  },
  "MAKEUP CONSULTATION": {
    name: "Makeup Consultation",
    body: "Sets the stage for a personalized experience and helps you feel confident in your service choice.",
    qualifier: "Required before booking any makeup application service.",
  },
  "MAKEUP LESSON": {
    name: "Makeup Lesson",
    body: "One-on-one help leveling up your makeup routine — review what you already do, products you use, and build a routine that works for you.",
  },
  "PERSONAL SHOPPING": {
    name: "Personal Shopping",
  },
};

/** GlossGenius source names for consultation services used as booking deep-link targets. */
const CONSULTATION_SOURCE_BY_KIND: Record<
  Exclude<ConsultationKind, null | "general">,
  string
> = {
  color: "COLOR CONSULTATION",
  makeup: "MAKEUP CONSULTATION",
};

function bookingUrlHasServiceToken(url: string | undefined): boolean {
  return Boolean(url && /[?&]service_token=/.test(url));
}

function findRawServiceBookingUrl(sourceName: string): string | undefined {
  const upper = sourceName.toUpperCase();
  for (const category of menuCategories) {
    const match = category.services.find(
      (service) => service.name.toUpperCase() === upper,
    );
    if (match?.bookingUrl) return match.bookingUrl;
  }
  return undefined;
}

/** Resolve a consultation booking URL from menu-services.json (tokenized when available). */
function consultationBookingUrlFromSource(sourceName: string): string {
  const url = findRawServiceBookingUrl(sourceName);
  if (bookingUrlHasServiceToken(url)) return url!;
  return BOOKING_URL;
}

function slugifyServiceName(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const TITLE_CASE_SMALL = new Set([
  "a",
  "an",
  "and",
  "as",
  "at",
  "for",
  "from",
  "in",
  "of",
  "on",
  "or",
  "the",
  "to",
  "with",
]);

function titleCaseServiceName(name: string): string {
  const words = name.toLowerCase().split(/(\s+|\/|&)/);
  return words
    .map((word, index) => {
      if (/^\s+$/.test(word) || word === "/" || word === "&") return word;
      if (word === "fx") return "FX";
      if (word === "k-18") return "K-18";
      if (index > 0 && TITLE_CASE_SMALL.has(word)) return word;
      if (word.includes("'")) {
        return word.replace(/(^|')([a-z])/g, (_, prefix: string, char: string) =>
          prefix === "'" ? `'${char}` : char.toUpperCase(),
        );
      }
      return word.replace(/^[a-z]/, (char) => char.toUpperCase());
    })
    .join("");
}

function cleanStandaloneNote(text: string): string {
  return text
    .replace(/not a standalone service\.?/gi, "Must be added to another eligible service.")
    .replace(/\b1 on 1\b/gi, "one-on-one")
    .replace(/\bappt\b/gi, "appointment")
    .replace(/\s+/g, " ")
    .trim();
}

function splitDescription(description: string | null): {
  body: string | null;
  qualifier: string | null;
} {
  if (!description) {
    return { body: null, qualifier: null };
  }

  const lines = description.split("\n").map((line) => line.trim());
  const qualifierLines: string[] = [];
  const bodyLines: string[] = [];

  for (const line of lines) {
    if (!line) continue;
    const isQualifier =
      /^[*!]/.test(line) ||
      /requires a consultation|must be scheduled|not a standalone|only for|returning clients only|cannot be booked|not for new|must schedule blowout/i.test(
        line,
      );
    if (isQualifier) {
      qualifierLines.push(
        cleanStandaloneNote(line.replace(/^\*+\s*/, "").replace(/^!+\s*/, "")),
      );
    } else {
      bodyLines.push(cleanStandaloneNote(line.replace(/^»\s*/, "")));
    }
  }

  return {
    body: bodyLines.length ? bodyLines.join(" ") : null,
    qualifier: qualifierLines.length ? qualifierLines.join(" ") : null,
  };
}

function formatDuration(minutes: number | null | undefined): string | null {
  if (!minutes || minutes <= 0) return null;
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (remainder === 0) return `${hours} hr`;
  return `${hours} hr ${remainder} min`;
}

function formatPriceDisplay(price: string): string {
  if (price === "Complimentary" || price === "Contact for pricing") {
    return price;
  }
  if (price.endsWith("+")) {
    return `Starting at ${price.slice(0, -1)}`;
  }
  return price;
}

function isAddonService(name: string, description: string | null): boolean {
  const text = `${name} ${description ?? ""}`.toLowerCase();
  return (
    /\badd[-\s]?ons?\b/.test(text) ||
    /not a standalone/.test(text) ||
    /\baddon\b/.test(text)
  );
}

function isConsultationService(name: string, categoryId: MenuCategoryId): boolean {
  return categoryId === "consultations" || /\bconsultation\b/i.test(name);
}

function resolveConsultationKind(
  name: string,
  requiresConsultation: boolean,
  isConsultation: boolean,
): ConsultationKind {
  const upper = name.toUpperCase();
  if (isConsultation) {
    if (/makeup/i.test(upper)) return "makeup";
    if (/color/i.test(upper)) return "color";
    return "general";
  }
  if (!requiresConsultation) return null;
  if (/makeup|fx\/body|beauty makeup/i.test(upper)) return "makeup";
  if (/vivid|color|bleach|blond/i.test(upper)) return "color";
  return "general";
}

function prioritizeLabels(labels: ServiceLabel[]): ServiceLabel[] {
  const priority: ServiceLabel[] = [
    "Consultation Required",
    "New Clients",
    "Existing Clients",
    "Advanced Treatment",
    "Add-On",
  ];
  const unique = priority.filter((label) => labels.includes(label));
  if (unique.length <= 2) return unique;
  return unique.slice(0, 2);
}

function deriveLabels(
  name: string,
  description: string | null,
  categoryId: MenuCategoryId,
  isAddon: boolean,
  overrideLabels?: ServiceLabel[],
): ServiceLabel[] {
  if (overrideLabels) {
    return prioritizeLabels(overrideLabels);
  }

  const upper = name.toUpperCase();
  const text = `${name} ${description ?? ""}`.toLowerCase();
  const labels: ServiceLabel[] = [];

  if (isAddon) {
    labels.push("Add-On");
  }

  if (upper.includes("NEW CLIENT") || upper.includes("INITIAL VISIT") || upper.includes("1ST PEEL")) {
    labels.push("New Clients");
  }

  if (
    /consultation required|must be scheduled before|requires? a (?:\(?free\)? |color |makeup )?consultation|required before booking|will require a \(?free\)? ?consultation/i.test(
      text,
    )
  ) {
    labels.push("Consultation Required");
  }

  if (
    /returning clients only|existing clients|returning client|cannot be done on your first visit|cannot be booked for your first visit|only available to regular clients/i.test(
      text,
    ) ||
    upper.includes("RETURNING CLIENT")
  ) {
    labels.push("Existing Clients");
  }

  if (
    categoryId === "advanced-treatments" ||
    /peel|microneedling|advanced treatment/i.test(upper)
  ) {
    labels.push("Advanced Treatment");
  }

  return prioritizeLabels(labels);
}

function resolvePresentation(
  sourceName: string,
  categoryId: MenuCategoryId,
  defaultPresentation: ServicePresentation,
  isConsultation: boolean,
): ServicePresentation {
  if (isConsultation || categoryId === "consultations") return "compact";
  if (COMPACT_SERVICE_NAMES.has(sourceName)) return "compact";

  const subgroups = MENU_SUBGROUPS[categoryId];
  if (subgroups) {
    for (const subgroup of subgroups) {
      if (subgroup.serviceNames.includes(sourceName)) {
        return subgroup.presentation;
      }
    }
  }

  return defaultPresentation;
}

function enrichService(
  service: RawMenuService,
  sourceCategory: string,
  categoryId: MenuCategoryId,
  defaultPresentation: ServicePresentation,
): MenuService {
  const sourceName = service.name.toUpperCase();
  const override = DISPLAY_OVERRIDES[sourceName];
  const split = splitDescription(service.description);
  const isAddon = isAddonService(service.name, service.description);
  const isConsultation = isConsultationService(service.name, categoryId);
  const labels = deriveLabels(
    service.name,
    service.description,
    categoryId,
    isAddon,
    override?.labels,
  );
  const requiresConsultation = labels.includes("Consultation Required");
  const consultationKind = resolveConsultationKind(
    service.name,
    requiresConsultation,
    isConsultation,
  );
  const displayName = override?.name ?? titleCaseServiceName(service.name);
  const presentation = resolvePresentation(
    sourceName,
    categoryId,
    defaultPresentation,
    isConsultation,
  );

  return {
    ...service,
    sourceName,
    name: displayName,
    sourceCategory,
    labels,
    descriptionBody: override?.body !== undefined ? override.body : split.body,
    qualifier:
      override?.qualifier !== undefined ? override.qualifier : split.qualifier,
    priceDisplay: formatPriceDisplay(service.price),
    durationDisplay: formatDuration(service.duration),
    bookingUrl: bookingUrlHasServiceToken(service.bookingUrl)
      ? service.bookingUrl!
      : (findRawServiceBookingUrl(sourceName) ?? service.bookingUrl ?? BOOKING_URL),
    isAddon,
    isConsultation,
    requiresConsultation,
    consultationKind,
    presentation,
    anchorId: slugifyServiceName(displayName),
  };
}

function buildSubgroups(
  categoryId: MenuCategoryId,
  services: MenuService[],
): VisitorMenuSubgroup[] | null {
  const definitions = MENU_SUBGROUPS[categoryId];
  if (!definitions?.length) return null;

  const used = new Set<string>();
  const subgroups: VisitorMenuSubgroup[] = [];

  for (const definition of definitions) {
    const grouped = definition.serviceNames
      .map((name) => services.find((service) => service.sourceName === name))
      .filter((service): service is MenuService => Boolean(service));

    for (const service of grouped) {
      used.add(service.sourceName);
    }

    if (grouped.length) {
      subgroups.push({
        id: definition.id,
        name: definition.name,
        presentation: definition.presentation,
        services: grouped,
      });
    }
  }

  const leftovers = services.filter((service) => !used.has(service.sourceName));
  if (leftovers.length) {
    subgroups.push({
      id: `${categoryId}-more`,
      name: "More Services",
      presentation: leftovers[0]?.presentation ?? "compact",
      services: leftovers,
    });
  }

  return subgroups;
}

export function getConsultationBookingUrl(kind: ConsultationKind): string {
  if (kind === "color" || kind === "makeup") {
    return consultationBookingUrlFromSource(CONSULTATION_SOURCE_BY_KIND[kind]);
  }
  return BOOKING_URL;
}

/** Booking href for a menu consultation CTA — always prefers a tokenized GlossGenius URL. */
export function getConsultationCtaHref(
  service: Pick<
    MenuService,
    "isConsultation" | "consultationKind" | "bookingUrl" | "sourceName"
  >,
): string {
  if (service.isConsultation) {
    if (bookingUrlHasServiceToken(service.bookingUrl)) {
      return service.bookingUrl;
    }
    const fromSource = findRawServiceBookingUrl(service.sourceName);
    if (bookingUrlHasServiceToken(fromSource)) return fromSource!;
    return service.bookingUrl || BOOKING_URL;
  }

  return getConsultationBookingUrl(service.consultationKind);
}

export function getConsultationCtaLabel(
  service: Pick<MenuService, "isConsultation" | "consultationKind">,
): string {
  if (service.isConsultation) return "Book Consultation";
  if (service.consultationKind === "color") return "Book a Color Consultation";
  if (service.consultationKind === "makeup") return "Book a Makeup Consultation";
  return "Book a Consultation";
}

export function buildVisitorMenuCategories(): VisitorMenuCategory[] {
  const buckets = new Map<MenuCategoryId, MenuService[]>(
    MENU_CATEGORIES.map((category) => [category.id, []]),
  );

  for (const sourceCategory of menuCategories) {
    for (const service of sourceCategory.services) {
      const categoryId = resolveMenuCategoryId(sourceCategory.name, service.name);
      const definition = MENU_CATEGORIES.find((item) => item.id === categoryId);
      const enriched = enrichService(
        service,
        sourceCategory.name,
        categoryId,
        definition?.defaultPresentation ?? "full",
      );
      buckets.get(categoryId)?.push(enriched);
    }
  }

  return MENU_CATEGORIES.map((definition) => {
    const services = buckets.get(definition.id) ?? [];
    return {
      ...definition,
      services,
      subgroups: buildSubgroups(definition.id, services),
    };
  }).filter((category) => category.services.length > 0);
}

export type { MenuSubgroupDefinition };
