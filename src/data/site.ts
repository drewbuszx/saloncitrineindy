export const BOOKING_URL = "https://saloncitrineindy.glossgenius.com/booking-flow";
export const FULL_MENU_PATH = "/menu/";
export const PRIVACY_PATH = "/privacy/";
/** Shopify store — not linked from nav until launch. */
// export const SHOP_URL = "https://saloncitrineindy.myshopify.com/";
export const SHOP_COMING_SOON = true;
export const GIFT_CARDS_URL =
  "https://saloncitrineindy.glossgenius.com/shop/gift-cards";
export const GLOSSGENIUS_SERVICES_URL =
  "https://saloncitrineindy.glossgenius.com/services";

export function memberBookingUrl(teamMemberToken: string): string {
  return `${GLOSSGENIUS_SERVICES_URL}?team_member_token=${teamMemberToken}`;
}

export function teamMemberSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function teamMemberPath(name: string): string {
  return `/team/${teamMemberSlug(name)}/`;
}

export function formatCancellationPolicyText(text: string): string {
  return `**CANCELLATION POLICY: ${text}**`;
}

/** Split formatted policy text into heading + body for readable modal layout. */
export function parseCancellationPolicyParts(text: string): {
  heading: string;
  body: string;
} {
  const formatted = formatCancellationPolicyText(text);
  const match = formatted.match(/^\*\*(.+?):\s*(.+)\*\*$/);

  if (match) {
    return { heading: `${match[1]}:`, body: match[2] };
  }

  return { heading: "CANCELLATION POLICY:", body: text };
}

/** Display handle from a social URL or handle (strips leading @). */
export function socialDisplayHandle(urlOrHandle: string): string {
  const trimmed = urlOrHandle.trim();
  if (trimmed.startsWith("http")) {
    const segment =
      new URL(trimmed).pathname.split("/").filter(Boolean).pop() ?? trimmed;
    return segment.replace(/^@/, "");
  }
  return trimmed.replace(/^@/, "");
}

export const site = {
  name: "Salon Citrine",
  shortName: "Salon Citrine",
  tagline:
    "Hairdressing rooted in inclusion, creativity, and simple beauty for everyone. ♡",
  domain: "saloncitrineindy.com",
  phone: "(317) 476-5375",
  phoneHref: "tel:+13174765375",
  email: "sayhello@saloncitrineindy.com",
  instagram: "https://www.instagram.com/Saloncitrineindy",
  address: {
    street: "203 S. Audubon Rd",
    city: "Indianapolis",
    state: "IN",
    zip: "46219",
    lat: 39.7677018,
    lng: -86.070018,
    mapsUrl:
      "https://maps.google.com/?q=203+S+Audubon+Rd,+Indianapolis,+IN+46219",
  },
  hours: [
    { day: "Monday", time: "Closed" },
    { day: "Tuesday", time: "10:00 AM – 8:00 PM" },
    { day: "Wednesday", time: "10:00 AM – 8:00 PM" },
    { day: "Thursday", time: "10:00 AM – 8:00 PM" },
    { day: "Friday", time: "10:00 AM – 5:00 PM" },
    { day: "Saturday", time: "10:00 AM – 5:00 PM" },
    { day: "Sunday", time: "Closed" },
  ],
  about: [
    "Salon Citrine is a women-owned hair salon in magical historic Irvington. We believe beauty is in everyone, and that great hair should feel welcoming, affirming, and a little bit weird in the best way.",
    "From vivid transformations and edgy cuts to low-maintenance color and classic shapes, our team brings craftsmanship, consultation, and care to every appointment. Whether you're new to the salon or a longtime regular, you'll find a space that celebrates individuality.",
    "Our studio on Audubon Road is a gender-affirming, LGBTQ+ welcoming salon where all are encouraged to show up exactly as they are.",
  ],
  values: [
    "Women-Owned",
    "Gender-Affirming",
    "Welcomes All",
    "weird and proud",
  ],
  valuesSeparatorImages: {
    rose: "/images/values/rose.png",
    gay: "/images/values/gay.png",
    trans: "/images/values/trans.png",
    hat: "/images/values/hat.png",
    wierd: "/images/values/wierd.png",
    mushroom: "/images/values/mushroom.png",
  },
  // Desktop: sep · tag · sep · tag · sep · tag · sep · tag · sep
  valuesSeparatorsDesktop: [
    "hat",
    "rose",
    "trans",
    "gay",
    "wierd",
  ] as const,
  // Mobile: two rows of sep · tag · sep · tag · sep (2 tags, 3 images each)
  valuesMobileRows: [
    {
      separators: ["hat", "rose", "trans"] as const,
      valueIndices: [0, 1],
    },
    {
      separators: ["gay", "wierd", "mushroom"] as const,
      valueIndices: [2, 3],
    },
  ] as const,
};

/** Schema.org OpeningHoursSpecification for JSON-LD. */
export function schemaOpeningHours(): {
  "@type": "OpeningHoursSpecification";
  dayOfWeek: string[];
  opens: string;
  closes: string;
}[] {
  const openDays = site.hours.filter((entry) => entry.time !== "Closed");
  const groups: {
    days: string[];
    opens: string;
    closes: string;
  }[] = [];

  for (const entry of openDays) {
    const [opens, closes] = entry.time.split(" – ").map((part) => {
      const match = part.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
      if (!match) return part.trim();
      let hours = Number.parseInt(match[1], 10);
      const minutes = match[2];
      const meridiem = match[3].toUpperCase();
      if (meridiem === "PM" && hours !== 12) hours += 12;
      if (meridiem === "AM" && hours === 12) hours = 0;
      return `${String(hours).padStart(2, "0")}:${minutes}`;
    });

    const last = groups[groups.length - 1];
    if (last && last.opens === opens && last.closes === closes) {
      last.days.push(entry.day);
    } else {
      groups.push({ days: [entry.day], opens, closes });
    }
  }

  return groups.map((group) => ({
    "@type": "OpeningHoursSpecification" as const,
    dayOfWeek: group.days,
    opens: group.opens,
    closes: group.closes,
  }));
}

export function localBusinessJsonLd() {
  const siteOrigin = `https://${site.domain}`;
  const siteUrl = `${siteOrigin}/`;
  return {
    "@context": "https://schema.org",
    "@type": "HairSalon",
    "@id": `${siteUrl}#business`,
    name: site.name,
    description: site.tagline,
    url: siteUrl,
    telephone: site.phone,
    email: site.email,
    image: `${siteOrigin}/images/salon-citrine-logo.png`,
    priceRange: "$$",
    hasMap: site.address.mapsUrl,
    areaServed: {
      "@type": "City",
      name: site.address.city,
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.street,
      addressLocality: site.address.city,
      addressRegion: site.address.state,
      postalCode: site.address.zip,
      addressCountry: "US",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: site.address.lat,
      longitude: site.address.lng,
    },
    openingHoursSpecification: schemaOpeningHours(),
    sameAs: [site.instagram],
  };
}

export type ServiceItem = {
  name: string;
  price: string;
};

export type ServiceColumn = {
  header: string;
  items?: ServiceItem[];
  text?: string;
};

export type ServiceGroup = {
  id: string;
  title: string;
  /** Short homepage orientation line; full details live on /menu/. */
  summary: string;
  columns: ServiceColumn[];
};

export const serviceGroups: ServiceGroup[] = [
  {
    id: "haircuts",
    title: "haircuts",
    summary:
      "Classic and transformative cuts, clipper work, fringe maintenance, blowouts, and silk presses.",
    columns: [
      {
        header: "CUTS",
        items: [
          { name: "NEW CLIENT HAIRCUT", price: "$55+" },
          { name: "HAIRCUT", price: "$55+" },
        ],
      },
      {
        header: "CUTS",
        items: [
          { name: "TRANSFORMATIVE HAIRCUT", price: "$65+" },
          { name: "CLIPPER CUT", price: "$45+" },
        ],
      },
      {
        header: "STYLING",
        items: [
          { name: "DRY CUT", price: "$60+" },
          { name: "FRINGE / UNDERCUT MAINTENANCE", price: "$30+" },
        ],
      },
      {
        header: "BLOWOUTS",
        items: [
          { name: "BLOWOUT", price: "$50+" },
          { name: "SILK PRESS", price: "$100+" },
        ],
      },
    ],
  },
  {
    id: "color",
    title: "color",
    summary:
      "All-over and dimensional color, bleach and tone, glosses, vivid transforms, and color consults.",
    columns: [
      {
        header: "ALL OVER COLOR",
        items: [
          { name: "ALL OVER COLOR WITH BLOWOUT", price: "$100+" },
          { name: "ALL OVER COLOR WITH HAIRCUT", price: "$150+" },
        ],
      },
      {
        header: "DIMENSIONAL COLOR",
        items: [
          { name: "FULL DIMENSIONAL COLOR & BLOWOUT", price: "$150+" },
          { name: "FULL DIMENSIONAL COLOR & CUT", price: "$200+" },
          { name: "PARTIAL DIMENSIONAL COLOR & BLOWOUT", price: "$90+" },
          { name: "MINI LIGHTS & BLOWOUT", price: "$80+" },
        ],
      },
      {
        header: "LIGHTENING & TONING",
        items: [
          { name: "ALL OVER BLEACH AND TONE & BLOWOUT", price: "$300+" },
          { name: "BLEACH ROOT TOUCH UP & BLOWOUT", price: "$150+" },
          { name: "ROOT TOUCH UP WITH A BLOWOUT", price: "$80+" },
          { name: "GLOSS WITH A BLOWOUT", price: "$80+" },
        ],
      },
      {
        header: "SPECIALTY",
        items: [
          { name: "VIVID TRANSFORMATION", price: "$250+" },
          { name: "COLOR CONSULTATION", price: "$20" },
        ],
      },
    ],
  },
  {
    id: "treatments",
    title: "treatments & styling",
    summary:
      "Keratin, K-18 and Malibu treatments, deep conditioning, scalp care, tinsel, and extension consults.",
    columns: [
      {
        header: "TREATMENTS",
        items: [{ name: "KERATIN COMPLEX TREATMENT", price: "$300+" }],
      },
      {
        header: "ADD-ONS",
        items: [
          { name: "DEEP CONDITION", price: "$20+" },
          { name: "SCALP REVITALIZING TREATMENT", price: "$40+" },
          { name: "K-18 TREATMENT", price: "$40+" },
          { name: "MALIBU TREATMENT", price: "$30+" },
          { name: "HOT TOWEL TREATMENT", price: "$5" },
        ],
      },
      {
        header: "STYLING",
        items: [{ name: "HAIR TINSEL", price: "$10+" }],
      },
      {
        header: "EXTENSIONS",
        items: [{ name: "EXTENSIONS CONSULTATION", price: "Complimentary" }],
        text: "Extension services are priced through consultation only.",
      },
    ],
  },
  {
    id: "skin",
    title: "skin & wax",
    summary:
      "Bespoke Korean and acne facials, glow peels, body and brow waxing, and complimentary skincare consults.",
    columns: [
      {
        header: "FACIALS",
        items: [
          { name: "BESPOKE KOREAN FACIAL — 60 MIN", price: "$125" },
          { name: "BESPOKE KOREAN FACIAL — 90 MIN", price: "$175" },
        ],
      },
      {
        header: "FACIALS",
        items: [
          { name: "ACNE FACIAL — INITIAL VISIT", price: "$300" },
          { name: "GLOW PEEL", price: "$125" },
        ],
      },
      {
        header: "WAXING",
        items: [
          { name: "BRAZILIAN WAX", price: "$80" },
          { name: "BROW SHAPING", price: "$20" },
          { name: "FULL LEG WAX", price: "$95" },
        ],
      },
      {
        header: "CONSULTATION",
        items: [{ name: "SKINCARE CONSULTATION", price: "Complimentary" }],
        text: "Schedule a complimentary skincare consultation to discuss your skin goals and treatment plan.",
      },
    ],
  },
];

export type FeaturedService = {
  name: string;
  price: string;
};

export type TeamMember = {
  name: string;
  firstName: string;
  role: string;
  image: string;
  /** Cropped desktop portrait for the fixed right column on profile pages. */
  profileImage?: string;
  bio?: string;
  /**
   * Longer "about me" text for the member's profile page.
   * Paste paragraphs here separated by blank lines.
   */
  about?: string;
  /** Instagram handle without @ (e.g. "Saloncitrineindy"). */
  instagram?: string;
  /** Full Threads profile URL. */
  threads?: string;
  featuredServices?: FeaturedService[];
  bookingUrl: string;
  /** When false, profile shows a notice beside the book CTA. Defaults to true. */
  acceptingNewClients?: boolean;
};


export const teamGroups: { title: string; members: TeamMember[] }[] = [
  {
    title: "OWNERS",
    members: [
      {
        name: "Lily Gleitsman",
        firstName: "Lily",
        role: "Owner/Stylist",
        image: "/images/lily-gleitsman.jpg",
        profileImage: "/images/lily-gleitsman2.jpg",
        bio: "Dimensional color, blowouts, and cuts built to fit your everyday.",
        about:
          "Over 15 years in the industry, Lily has developed a specialty in transformational cuts, clipper work, curls, and styles that are easy to live in. She began her career alongside Miriam and Andra, and she and Miriam have continued working together at every salon since. Her thoughtful approach creates hair that fits each client's routine, personality, and natural texture.",
        bookingUrl: memberBookingUrl(
          "10001-f5bd9a7b-3e2f-4255-951d-ca4881f88678"
        ),
        instagram: "lilylovve.hair",
        featuredServices: [
          { name: "HAIRCUT", price: "$55+" },
          { name: "BLOWOUT", price: "$50+" },
          { name: "FULL DIMENSIONAL COLOR & BLOWOUT", price: "$150+" },
          { name: "PARTIAL DIMENSIONAL COLOR & BLOWOUT", price: "$90+" },
        ],
      },
      {
        name: "Miriam Zhukov",
        firstName: "Miriam",
        role: "Owner/Stylist",
        image: "/images/miriam-zhukov.jpg",
        profileImage: "/images/miriam-zhukov2.jpg",
        bio: "All-over and dimensional color paired with precise, wearable cuts.",
        about:
          "With more than 15 years behind the chair, Miriam specializes in lived-in, natural-looking color, dimensional color, and precise, wearable cuts. She has worked alongside Lily at nearly every salon throughout her career, making them a true gruesome twosome. Miriam creates beautiful color that grows out gracefully and cuts that still feel intentional weeks later.",
        bookingUrl: memberBookingUrl(
          "10001-690e87a4-3d1b-44db-a449-08c9d40b5dff"
        ),
        instagram: "miriambusz_hair",
        featuredServices: [
          { name: "HAIRCUT", price: "$55+" },
          { name: "FULL DIMENSIONAL COLOR & BLOWOUT", price: "$150+" },
          { name: "ALL OVER COLOR WITH BLOWOUT", price: "$100+" },
          { name: "PARTIAL DIMENSIONAL COLOR & BLOWOUT", price: "$90+" },
        ],
      },
      {
        name: "Andra Kramer",
        firstName: "Andra",
        role: "Owner/Stylist",
        image: "/images/andra-kramer.jpg",
        profileImage: "/images/andra-kramer2.jpg",
        bio: "Dimensional and all-over color, cuts, and polished blowouts.",
        about:
          "With more than 15 years in the industry, Andra is known for beautiful color, precise cuts, and an efficient approach that never sacrifices the details. She is especially skilled in grey blending and creating polished, easy-to-maintain results. After reconnecting with Miriam and Lily, the three came together to create a welcoming salon space with a little bit of magic.",
        acceptingNewClients: false,
        bookingUrl: memberBookingUrl(
          "10001-7e4b7dd5-f741-4f6f-b71d-ed5cc3b638ec"
        ),
        instagram: "hair_by_andra",
        featuredServices: [
          { name: "HAIRCUT", price: "$55+" },
          { name: "BLOWOUT", price: "$50+" },
          { name: "FULL DIMENSIONAL COLOR & BLOWOUT", price: "$150+" },
          { name: "ALL OVER COLOR WITH BLOWOUT", price: "$100+" },
        ],
      },
    ],
  },
  {
    title: "STYLISTS",
    members: [
      {
        name: "Shelby Craft",
        firstName: "Shelby",
        role: "Stylist",
        image: "/images/shelby-craft.jpg",
        profileImage: "/images/shelby-craft2.jpg",
        bio: "Specializes in alternative, vivid, and edgy styles... and low-maintenance natural looks too!",
        // Sourced from GlossGenius team bio + featured services (vivid transform)
        about:
          "Shelby has been behind the chair for over a decade, specializing in alternative, vivid, and edgy styles, plus low-maintenance natural looks too. She treats hair as self-expression and loves custom cuts and color that help you look and feel exactly how you want.",
        bookingUrl: memberBookingUrl(
          "10001-6a29adda-3651-43d9-8899-3ace37524a1e"
        ),
        instagram: "hairxcraft",
        featuredServices: [
          { name: "HAIRCUT", price: "$55+" },
          { name: "VIVID TRANSFORMATION", price: "$250+" },
          { name: "BLOWOUT", price: "$50+" },
          { name: "FULL DIMENSIONAL COLOR & BLOWOUT", price: "$150+" },
        ],
      },
      {
        name: "Jules Hoffman",
        firstName: "Jules",
        role: "Emerging Stylist",
        image: "/images/jules-hoffman.jpg",
        profileImage: "/images/jules-hoffman2.jpg",
        bio: "Helping you feel like the star you are, one appointment at a time.",
        // Sourced from GlossGenius team bio (pronouns, emerging stylist note)
        about:
          "Jules / Julie (they/them/she) is an emerging stylist (some services may take a bit more time) whose priority is helping you feel like the star you are. Whether you're maintaining a look you love or fully switching the vibe, they're always down.",
        bookingUrl: memberBookingUrl(
          "10001-40fac3c0-b13b-47c2-86da-6e1c3452329f"
        ),
        instagram: "julie.tology",
        featuredServices: [
          { name: "HAIRCUT", price: "$55+" },
          { name: "BLOWOUT", price: "$50+" },
          { name: "FULL DIMENSIONAL COLOR & BLOWOUT", price: "$150+" },
          { name: "ALL OVER COLOR WITH BLOWOUT", price: "$100+" },
        ],
      },
      {
        name: "Brie Crowe",
        firstName: "Brie",
        role: "Stylist",
        image: "/images/brie-crowe.jpg",
        profileImage: "/images/brie-crowe2.jpg",
        bio: "Dimensional and all-over color, cuts, and smooth blowouts.",
        // DRAFT — review with stylist (IG title: Indianapolis Cosmetologist; services-based)
        about:
          "Brie is an Indianapolis cosmetologist offering dimensional and all-over color, cuts, and smooth blowouts. Expect a welcoming chair and finished looks that feel polished without being fussy.",
        bookingUrl: memberBookingUrl(
          "10001-32abe5c0-3025-48ed-8516-850b1fc5783f"
        ),
        instagram: "ez.breezy.mua",
        featuredServices: [
          { name: "HAIRCUT", price: "$55+" },
          { name: "BLOWOUT", price: "$50+" },
          { name: "FULL DIMENSIONAL COLOR & BLOWOUT", price: "$150+" },
          { name: "ALL OVER COLOR WITH BLOWOUT", price: "$100+" },
        ],
      },
    ],
  },
  {
    title: "SKIN & BEAUTY",
    members: [
      {
        name: "Julie Powers",
        firstName: "Julie",
        role: "Esthetician",
        image: "/images/julie-powers.jpg",
        profileImage: "/images/julie-powers2.jpg",
        bio: "Korean-inspired facials, peels, waxing, and makeup artistry.",
        // Sourced from IG display title + featured services / existing bio
        about:
          "Julie specializes in Korean-inspired skincare and creative makeup in Irvington: bespoke facials, peels, waxing, and brow shaping. Expect inclusive, affirming care and skin that feels as good as it looks.",
        bookingUrl: memberBookingUrl(
          "10001-d788dd27-3f49-452f-af8e-c87bb31e94c3"
        ),
        instagram: "julieapowers",
        threads:
          "https://www.threads.com/@julieapowers?xmt=AQG0jfH4ZkjxsZB5WMhnNcu9-Vqomm45LbhfkCcUZxWC0Hk",
        featuredServices: [
          { name: "BESPOKE KOREAN FACIAL — 60 MIN", price: "$125" },
          { name: "BRAZILIAN WAX", price: "$80" },
          { name: "BROW SHAPING", price: "$20" },
          { name: "GLOW PEEL", price: "$125" },
        ],
      },
    ],
  },
];

export const policies = [
  {
    title: "CANCELLATION POLICY",
    text: "Please reschedule at least 48 hours prior to your appointment to avoid a cancellation fee. Cancellations within 48 hours are charged 50% of the scheduled service. No-shows are charged 100%. If you are 15+ minutes late and we cannot reach you, you may be considered a no-show. Fees are waived if you reschedule within the same week.",
  },
  {
    title: "CONSULTATION",
    text: "All full service appointments include a consultation. Color consultations are required before big transformations. Consultation fees apply toward your first full service when booked.",
  },
  {
    title: "PRICING",
    text: "Prices with a + are starting rates and may vary based on hair length, density, and your stylist's level. See the full service menu when booking online.",
  },
  {
    title: "BOOKING",
    text: "Appointments are booked through our online scheduling system. A card on file may be required to secure your booking.",
  },
];
