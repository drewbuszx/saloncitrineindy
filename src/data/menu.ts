import menuCategories from "./menu-services.json";
import {
  MENU_CATEGORIES,
  type MenuCategoryId,
  type ServiceLabel,
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

export interface MenuService extends RawMenuService {
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
}

export interface VisitorMenuCategory {
  id: MenuCategoryId;
  name: string;
  description: string;
  showConsultationPanel?: boolean;
  services: MenuService[];
}

function titleCaseServiceName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .replace(/\bFx\b/g, "FX");
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
      /requires a consultation|must be scheduled|not a standalone|only for|returning clients only|cannot be booked|not for new/i.test(
        line,
      );
    if (isQualifier) {
      qualifierLines.push(line.replace(/^\*+\s*/, "").replace(/^!+\s*/, ""));
    } else {
      bodyLines.push(line);
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

function deriveLabels(
  name: string,
  price: string,
  description: string | null,
  categoryId: MenuCategoryId,
  isAddon: boolean,
): ServiceLabel[] {
  const upper = name.toUpperCase();
  const text = `${name} ${description ?? ""}`.toLowerCase();
  const labels: ServiceLabel[] = [];

  if (isAddon) {
    labels.push("Add-On Service");
  }

  if (upper.includes("NEW CLIENT")) {
    labels.push("Best for New Clients");
  }

  if (
    /consultation required|must be scheduled before|requires a color consultation|required before booking/i.test(
      text,
    )
  ) {
    labels.push("Consultation Required");
  }

  if (
    /maintenance|root touch|partial|freshen up|returning client/i.test(text) &&
    !upper.includes("NEW CLIENT")
  ) {
    labels.push("Maintenance Service");
  }

  if (
    /transformative|transformation|all over bleach|vivid transformation|more than 3/i.test(
      text,
    )
  ) {
    labels.push("Major Transformation");
  }

  if (/returning clients only|existing clients|returning client/i.test(text)) {
    labels.push("Existing Clients");
  }

  if (price.endsWith("+")) {
    labels.push("Price Varies");
  }

  if (
    categoryId === "advanced-treatments" ||
    /peel|microneedling|advanced treatment/i.test(upper)
  ) {
    labels.push("Advanced Treatment");
  }

  return [...new Set(labels)];
}

function enrichService(
  service: RawMenuService,
  sourceCategory: string,
  categoryId: MenuCategoryId,
): MenuService {
  const { body, qualifier } = splitDescription(service.description);
  const displayName = titleCaseServiceName(service.name);
  const isAddon = isAddonService(service.name, service.description);
  const isConsultation = isConsultationService(service.name, categoryId);
  const labels = deriveLabels(
    service.name,
    service.price,
    service.description,
    categoryId,
    isAddon,
  );
  const requiresConsultation = labels.includes("Consultation Required");

  return {
    ...service,
    name: displayName,
    sourceCategory,
    labels,
    descriptionBody: body,
    qualifier,
    priceDisplay: formatPriceDisplay(service.price),
    durationDisplay: formatDuration(service.duration),
    bookingUrl: service.bookingUrl ?? BOOKING_URL,
    isAddon,
    isConsultation,
    requiresConsultation,
  };
}

export function buildVisitorMenuCategories(): VisitorMenuCategory[] {
  const buckets = new Map<MenuCategoryId, MenuService[]>(
    MENU_CATEGORIES.map((category) => [category.id, []]),
  );

  for (const sourceCategory of menuCategories) {
    for (const service of sourceCategory.services) {
      const categoryId = resolveMenuCategoryId(sourceCategory.name, service.name);
      const enriched = enrichService(service, sourceCategory.name, categoryId);
      buckets.get(categoryId)?.push(enriched);
    }
  }

  return MENU_CATEGORIES.map((definition) => ({
    ...definition,
    services: buckets.get(definition.id) ?? [],
  })).filter((category) => category.services.length > 0);
}
