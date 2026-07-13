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
  | "New Clients"
  | "Existing Clients"
  | "Consultation Required"
  | "Add-On"
  | "Advanced Treatment";

export type ServicePresentation = "full" | "compact";

/** Primary CTA for the single bottom booking action on the menu page. */
export const MENU_BOOKING_CTA = "Book Online";

export const MENU_FOOTER_BOOKING_COPY =
  "Choose your provider, pick a service, and find a time that works.";

export const MENU_CONSULTATION_HELP_LEAD = "Not sure what to book?";

export const MENU_CONSULTATION_HELP_COPY =
  "Start with a consultation and we will help you choose the right service.";

export const MENU_CONSULTATION_HELP_CTA = "Explore Consultations";

export const MENU_COLOR_CONSULTATION_PANEL_COPY =
  "Planning a major color change? Vivid color, corrective work, all-over bleach, and significant blonding transformations may require a consultation before booking.";

export const MENU_COLOR_CONSULTATION_PANEL_CTA = "View Color Consultations";

export const MENU_COLOR_CONSULTATION_ANCHOR = "color-consultation";

export interface MenuCategoryDefinition {
  id: MenuCategoryId;
  name: string;
  description: string;
  /** Show the shared color-consultation panel immediately before this category. */
  showConsultationPanel?: boolean;
  defaultPresentation: ServicePresentation;
}

export interface MenuSubgroupDefinition {
  id: string;
  name: string;
  presentation: ServicePresentation;
  /** Match against uppercase raw service names. */
  serviceNames: string[];
}

export const MENU_CATEGORIES: MenuCategoryDefinition[] = [
  {
    id: "haircuts",
    name: "Haircuts",
    description:
      "From first visits and kids' cuts to transformative shapes, clipper work, and curly or textured hair maintenance.",
    defaultPresentation: "full",
  },
  {
    id: "dimensional-color",
    name: "Natural and Dimensional Color",
    description:
      "Highlights, lowlights, balayage, all-over color, root touch-ups, and gloss services for natural dimension or grey blending.",
    showConsultationPanel: true,
    defaultPresentation: "full",
  },
  {
    id: "blonding",
    name: "Blonding and Bleach",
    description:
      "All-over bleach and tone, root lightening, and blonding services for clients ready to go lighter.",
    defaultPresentation: "full",
  },
  {
    id: "vivid-color",
    name: "Vivid and Creative Color",
    description:
      "Fashion colors and vivid transformations for clients who want bold, creative color results.",
    defaultPresentation: "full",
  },
  {
    id: "styling-treatments",
    name: "Styling and Treatments",
    description:
      "Blowouts, silk press, keratin, deep conditioning, scalp treatments, and add-on services paired with appointments.",
    defaultPresentation: "compact",
  },
  {
    id: "consultations",
    name: "Consultations",
    description:
      "Complimentary or low-cost consultations for color, extensions, keratin, skincare, and makeup — a smart first step when you are unsure what to book.",
    defaultPresentation: "compact",
  },
  {
    id: "facials-skincare",
    name: "Facials and Skincare",
    description:
      "Bespoke Korean facials, acne care, and express treatments tailored to your skin goals.",
    defaultPresentation: "full",
  },
  {
    id: "advanced-treatments",
    name: "Peels and Advanced Treatments",
    description:
      "Chemical peels, microneedling, and advanced resurfacing for texture, hyperpigmentation, and collagen support.",
    defaultPresentation: "full",
  },
  {
    id: "waxing-brows",
    name: "Waxing and Brows",
    description:
      "Body waxing, brow shaping and tinting, and facial wax services.",
    defaultPresentation: "compact",
  },
  {
    id: "makeup",
    name: "Makeup",
    description:
      "Beauty makeup, lessons, FX and body painting, and personal shopping support.",
    defaultPresentation: "full",
  },
];

export const MENU_SUBGROUPS: Partial<
  Record<MenuCategoryId, MenuSubgroupDefinition[]>
> = {
  "styling-treatments": [
    {
      id: "styling-services",
      name: "Styling Services",
      presentation: "full",
      serviceNames: ["BLOWOUT", "SILK PRESS", "KERATIN COMPLEX TREATMENT"],
    },
    {
      id: "treatments-addons",
      name: "Treatments and Add-Ons",
      presentation: "compact",
      serviceNames: [
        "HOT TOWEL TREATMENT",
        "DEEP CONDITION",
        "MALIBU TREATMENT",
        "SCALP REVITALIZING TREATMENT",
        "K-18 TREATMENT",
        "STYLING EDUCATION",
        "HAIR TINSEL",
      ],
    },
  ],
  "waxing-brows": [
    {
      id: "face-brows",
      name: "Face and Brows",
      presentation: "compact",
      serviceNames: [
        "NOSTRIL",
        "BROW MAINTENANCE",
        "BROW SHAPING",
        "CHIN",
        "EAR",
        "LIP",
        "LIP AND CHIN",
        "FULL FACE WAX",
      ],
    },
    {
      id: "body-waxing",
      name: "Body Waxing",
      presentation: "compact",
      serviceNames: [
        "BACK WAX",
        "BIKINI WAX",
        "BRAZILIAN WAX",
        "BUTTOCKS",
        "CHEST WAX",
        "FULL ARM WAX",
        "FULL LEG WAX",
        "HALF ARM WAX",
        "HALF LEG",
        "UNDERARM WAX",
      ],
    },
    {
      id: "lashes-tinting",
      name: "Lashes and Tinting",
      presentation: "compact",
      serviceNames: ["BROW TINT", "LASH TINT", "BROW WAX & TINT"],
    },
    {
      id: "waxing-addons",
      name: "Add-Ons",
      presentation: "compact",
      serviceNames: ["HAIR REDUCTION ENZYME ADD ON"],
    },
  ],
};

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

/** Compact presentation even when the parent category defaults to full cards. */
export const COMPACT_SERVICE_NAMES = new Set([
  "PERSONAL SHOPPING",
  "SUNBURN RX EXPRESS",
]);

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
] as const;

export const MENU_PRICING_NOTE =
  "Prices vary by provider, service time, hair needs, and product required. Starting prices are shown here, and your selected provider’s current pricing will be shown during booking.";

export const MENU_INTRO_COPY =
  "Explore hair, skincare, waxing, and makeup services at Salon Citrine.";
