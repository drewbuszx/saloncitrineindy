/** Visitor-facing menu categories — single source of truth for IA and nav. */

export type MenuCategoryId =
  | "haircuts"
  | "dimensional-color"
  | "blonding"
  | "vivid-color"
  | "styling-treatments"
  | "consultations"
  | "facials-skincare"
  | "advanced-treatments"
  | "waxing-brows"
  | "makeup";

export type ServiceLabel =
  | "Best for New Clients"
  | "Consultation Required"
  | "Maintenance Service"
  | "Major Transformation"
  | "Existing Clients"
  | "Price Varies"
  | "Advanced Treatment";

export interface MenuCategoryDefinition {
  id: MenuCategoryId;
  name: string;
  description: string;
  showConsultationPanel?: boolean;
}

export const MENU_CATEGORIES: MenuCategoryDefinition[] = [
  {
    id: "haircuts",
    name: "Haircuts",
    description:
      "From first visits and kids' cuts to transformative shapes, clipper work, and curly or textured hair maintenance.",
  },
  {
    id: "dimensional-color",
    name: "Natural and Dimensional Color",
    description:
      "Highlights, lowlights, balayage, all-over color, root touch-ups, and gloss services for natural dimension or grey blending.",
    showConsultationPanel: true,
  },
  {
    id: "blonding",
    name: "Blonding and Bleach",
    description:
      "All-over bleach and tone, root lightening, and blonding services for clients ready to go lighter.",
    showConsultationPanel: true,
  },
  {
    id: "vivid-color",
    name: "Vivid and Creative Color",
    description:
      "Fashion colors and vivid transformations for clients who want bold, creative color results.",
    showConsultationPanel: true,
  },
  {
    id: "styling-treatments",
    name: "Styling and Treatments",
    description:
      "Blowouts, silk press, keratin, deep conditioning, scalp treatments, and add-on services paired with appointments.",
  },
  {
    id: "consultations",
    name: "Consultations",
    description:
      "Complimentary or low-cost consultations for color, extensions, keratin, skincare, and makeup — a smart first step when you are unsure what to book.",
  },
  {
    id: "facials-skincare",
    name: "Facials and Skincare",
    description:
      "Bespoke Korean facials, acne care, and express treatments tailored to your skin goals.",
  },
  {
    id: "advanced-treatments",
    name: "Peels and Advanced Treatments",
    description:
      "Chemical peels, microneedling, and advanced resurfacing for texture, hyperpigmentation, and collagen support.",
  },
  {
    id: "waxing-brows",
    name: "Waxing and Brows",
    description:
      "Body waxing, brow shaping and tinting, and facial wax services.",
  },
  {
    id: "makeup",
    name: "Makeup",
    description:
      "Beauty makeup, lessons, FX and body painting, and personal shopping support.",
  },
];

/** GlossGenius source category names from menu-services.json. */
export const SOURCE_CATEGORY_NAMES = {
  haircuts: "Haircuts",
  dimensional: "Color- Dimensional Color",
  blonding: "Color- Bleach & Tone",
  singleColor: "Color- Single Color & Root Touch Ups",
  vivid: "Color- Vivids / Fashion Colors",
  treatments: "Hair Treatments",
  hairConsultations: "Hair Consultations",
  waxing: "Waxing Services",
  skincare: "Skincare Services",
  makeup: "Makeup Services",
} as const;

const CONSULTATION_SERVICE_NAMES = new Set([
  "COLOR CONSULTATION",
  "SKINCARE CONSULTATION",
  "MAKEUP CONSULTATION",
  "CONSULTATION FOR KERATIN COMPLEX",
  "EXTENSIONS CONSULTATION",
]);

const ADVANCED_SKINCARE_NAMES = new Set([
  "MICRONEEDLING",
  "GLOW PEEL",
  "GREEN SEA SPICULE PEEL-1ST PEEL",
  "GREEN SEA PEEL-RETURNING CLIENT",
  "ILLUMIN BIPHASIC CHEMICAL PEEL",
  "KOREAN NEEDLE-FREE FILLER FACIAL",
  "LAZER PEEL",
  "CLEAR PEEL",
]);

const MAKEUP_EXCLUDED_FROM_MAKEUP = new Set(["MAKEUP CONSULTATION"]);

export function resolveMenuCategoryId(
  sourceCategory: string,
  serviceName: string,
): MenuCategoryId {
  const upper = serviceName.toUpperCase();

  if (CONSULTATION_SERVICE_NAMES.has(upper)) {
    return "consultations";
  }

  if (sourceCategory === SOURCE_CATEGORY_NAMES.hairConsultations) {
    return "consultations";
  }

  if (sourceCategory === SOURCE_CATEGORY_NAMES.skincare) {
    if (ADVANCED_SKINCARE_NAMES.has(upper)) {
      return "advanced-treatments";
    }
    return "facials-skincare";
  }

  if (sourceCategory === SOURCE_CATEGORY_NAMES.makeup) {
    if (MAKEUP_EXCLUDED_FROM_MAKEUP.has(upper)) {
      return "consultations";
    }
    return "makeup";
  }

  switch (sourceCategory) {
    case SOURCE_CATEGORY_NAMES.haircuts:
      return "haircuts";
    case SOURCE_CATEGORY_NAMES.dimensional:
    case SOURCE_CATEGORY_NAMES.singleColor:
      return "dimensional-color";
    case SOURCE_CATEGORY_NAMES.blonding:
      return "blonding";
    case SOURCE_CATEGORY_NAMES.vivid:
      return "vivid-color";
    case SOURCE_CATEGORY_NAMES.treatments:
      return "styling-treatments";
    case SOURCE_CATEGORY_NAMES.waxing:
      return "waxing-brows";
    default:
      return "consultations";
  }
}

export const MENU_INTENT_CARDS = [
  {
    id: "haircuts",
    title: "I need a haircut",
    description:
      "New client cuts, maintenance cuts, clipper cuts, transformative styles, and curly or textured hair services.",
    cta: "Explore Haircuts",
    targetId: "haircuts" as MenuCategoryId,
    analyticsAction: "intent-haircuts",
  },
  {
    id: "color",
    title: "I want to change my color",
    description:
      "Dimensional color, blonding, grey blending, all-over color, root services, bleach and tone, and vivid transformations.",
    cta: "Explore Color Services",
    targetId: "dimensional-color" as MenuCategoryId,
    analyticsAction: "intent-color",
  },
  {
    id: "skincare",
    title: "I am looking for skincare or beauty services",
    description:
      "Facials, acne care, peels, microneedling, waxing, brows, and creative makeup.",
    cta: "Explore Skin and Beauty",
    targetId: "facials-skincare" as MenuCategoryId,
    analyticsAction: "intent-skincare",
  },
  {
    id: "consultation",
    title: "I am not sure what to book",
    description:
      "Start with a consultation to discuss your goals, hair history, and the right service for you.",
    cta: "Book a Consultation",
    targetId: "consultations" as MenuCategoryId,
    analyticsAction: "intent-consultation",
    compact: true,
  },
] as const;

export const MENU_PRICING_NOTE =
  "Prices vary by provider, service time, hair needs, and product required. Starting prices are shown here. Your selected provider's current pricing will be shown during online booking.";

export const MENU_INTRO_COPY =
  "Explore hair, skincare, waxing, and makeup services offered at Salon Citrine. Prices vary by provider, service time, hair needs, and product required. The full price for your selected provider will be shown during booking, and major transformations may require a consultation.";

export const MENU_CONSULTATION_PANEL_COPY =
  "Not sure which color service fits your goals? Major transformations, vivid color, corrective work, and significant blonding changes may require a consultation before booking.";
