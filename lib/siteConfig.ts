export type CmsLink = {
  label: string;
  href: string;
};

export type CmsContact = {
  label: string;
  name: string;
  phone: string;
};

export type CmsTestimonial = {
  name: string;
  body: string;
};

const DEFAULT_MGOCSM_LOGO_URL = "/branding/mgocsm-logo.png";
const DEFAULT_IGNITE_LOGO_URL = "/branding/ignite-logo.svg";

const defaultNavLinks: CmsLink[] = [
  { label: "Home", href: "#home" },
  { label: "Live", href: "#fixtures" },
  { label: "Leaderboard", href: "#leaderboard" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

const defaultHeroButtons: CmsLink[] = [
  { label: "View Fixtures", href: "#fixtures" },
  { label: "Live Score", href: "#fixtures" },
];

const defaultSponsors = [
  "Red Bull",
  "Monster Energy",
  "Decathlon",
  "Nike",
  "Adidas",
  "Puma",
  "Gatorade",
  "Under Armour",
  "Cosco",
  "Nivia",
  "Yonex",
  "Powerade",
  "Oakley",
  "Castrol",
];

const defaultFooterContacts: CmsContact[] = [
  { label: "Operations", name: "Aaron", phone: "+91 80100 65098" },
  { label: "App & Score", name: "Anisha", phone: "+91 75073 99206" },
  { label: "Disputes", name: "Nikhil", phone: "+91 75076 81331" },
  { label: "Food", name: "Greg", phone: "+91 70580 35413" },
  { label: "First Aid", name: "Rini", phone: "+91 77570 40841" },
  { label: "Equipment", name: "Ryan", phone: "+91 87999 39805" },
  { label: "Review, Feedback & Others", name: "Bryan", phone: "+91 74208 51640" },
];

const defaultSocialLinks: CmsLink[] = [
  { label: "Instagram", href: "https://www.instagram.com/mgocsm_dehuroad/" },
];

const defaultAboutImages = Array.from({ length: 11 }, (_, index) => `/events/${index + 1}.jpeg`);

const defaultTestimonials: CmsTestimonial[] = [
  {
    name: "Jeril Jose from Chinchwad Parish",
    body: "Heartfelt congratulations to MGOCSM Dehuroad for organizing such a well-executed and memorable tournament. Your efforts, planning, and commitment truly shone through every aspect of the event.",
  },
  {
    name: "Siju from Khadki Parish",
    body: "We really appreciate the effort MGOCSM Dehuroad put into organizing this tournament. From time management to website updates, everything was seamless and top notch.",
  },
];

export const siteConfigDefaults = {
  site_locked: "true",
  unlock_date: "2026-05-15T18:00:00+05:30",
  site_title: "IGNITE 2.0",
  site_description: "A mobile-first football tournament experience for IGNITE 2.0.",
  organizer_name: "MGOCSM Dehuroad",
  mgocsm_logo_url: DEFAULT_MGOCSM_LOGO_URL,
  ignite_logo_url: DEFAULT_IGNITE_LOGO_URL,
  nav_links: JSON.stringify(defaultNavLinks, null, 2),
  announcement_banner: "",
  fillout_link: "",
  register_button_label: "Register Now",
  hero_tagline: "PLAY. COMPETE.",
  hero_tagline_accent: "WIN!!!",
  hero_subtitle: "The most awaited football event is back!",
  hero_buttons: JSON.stringify(defaultHeroButtons, null, 2),
  event_date_label: "Date",
  event_date_display: "26th July",
  location_label: "Location",
  location_display: "Nawu Sports Club, Mamurdi",
  location_link: "https://maps.app.goo.gl/rpeErqpzykEgey5c8",
  prize_pool_label: "Prize Pool",
  prize_pool: "Rs 4500",
  sponsors: JSON.stringify(defaultSponsors, null, 2),
  fixtures_visible: "true",
  leaderboard_visible: "false",
  about_visible: "true",
  sponsors_visible: "true",
  countdown_date_label: "26TH JULY",
  countdown_kicker: "Something big is coming!!!",
  countdown_title: "IGNITE 2.0",
  countdown_label: "Unlocks In",
  countdown_manual_unlock_visible: "true",
  countdown_manual_unlock_label: "Unlock Site Now",
  countdown_admin_label: "Admin Dashboard",
  about_heading: "About Ignite 2.0",
  about_text:
    "MGOCSM Dehuroad has always believed in the power of faith, fellowship, and sportsmanship to bring youth together. IGNITE is not just a football tournament but a celebration of unity, passion, and the vibrant spirit of our MGOCSM youth.\n\nAs seen in the image from our previous sports meet, MGOCSM Dehuroad has a rich tradition of organizing dynamic events that promote healthy competition, team bonding, and Christian fellowship. This legacy continues with IGNITE 2.0 2026, where parishes across the region come together to showcase their talent and love for the game.\n\nWith each kick, cheer, and goal, IGNITE aims to light the fire of friendship, faith, and fair play in every participant. Our mission is simple: to foster youth engagement through sports while building lasting connections that go beyond the field.\n\nJoin us as we carry forward the energy, enthusiasm, and excellence of past events into a bigger, brighter future.",
  about_images: JSON.stringify(defaultAboutImages, null, 2),
  about_testimonials: JSON.stringify(defaultTestimonials, null, 2),
  footer_tagline: "Join our community",
  footer_contacts: JSON.stringify(defaultFooterContacts, null, 2),
  footer_social_links: JSON.stringify(defaultSocialLinks, null, 2),
  footer_copyright: "IGNITE 2.0 MGOCSM. All rights reserved.",
  footer_credit_label: "Made by Hitesh",
  footer_credit_url: "https://github.com/TheGoodDevil00",
};

export type SiteConfig = typeof siteConfigDefaults & Record<string, string>;

export function mergeSiteConfig(values: Record<string, string> = {}): SiteConfig {
  const merged = {
    ...siteConfigDefaults,
    ...values,
  };

  return {
    ...merged,
    mgocsm_logo_url: normalizeLogoUrl(
      merged.mgocsm_logo_url,
      DEFAULT_MGOCSM_LOGO_URL
    ),
    ignite_logo_url: normalizeLogoUrl(
      merged.ignite_logo_url,
      DEFAULT_IGNITE_LOGO_URL
    ),
  };
}

function normalizeLogoUrl(value: string | undefined, fallback: string) {
  const trimmed = value?.trim();

  if (!trimmed) return fallback;

  const normalized = trimmed.toLowerCase();

  if (
    normalized === "/mgocsm logo.png" ||
    normalized === "/mgocsmlogo.png" ||
    normalized === "mgocsm logo.png" ||
    normalized === "mgocsmlogo.png"
  ) {
    return DEFAULT_MGOCSM_LOGO_URL;
  }

  if (
    normalized === "/ignite2.0 logo.svg" ||
    normalized === "/ignite2.0logo.svg" ||
    normalized === "ignite2.0 logo.svg" ||
    normalized === "ignite2.0logo.svg"
  ) {
    return DEFAULT_IGNITE_LOGO_URL;
  }

  return trimmed;
}

export function parseCmsJson<T>(value: string | undefined, fallback: T): T {
  if (!value) return fallback;

  try {
    const parsed = JSON.parse(value);
    return parsed as T;
  } catch {
    return fallback;
  }
}

export function parseCmsCsv(value: string | undefined, fallback: string[]) {
  if (!value) return fallback;

  const items = value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

  return items.length > 0 ? items : fallback;
}

export function getCmsLinks(value: string | undefined, fallback: CmsLink[]) {
  const parsed = parseCmsJson<unknown>(value, fallback);

  if (!Array.isArray(parsed)) return fallback;

  const links = parsed
    .map((item) => {
      if (typeof item !== "object" || item === null) return null;
      const record = item as Record<string, unknown>;
      const label = typeof record.label === "string" ? record.label.trim() : "";
      const href = typeof record.href === "string" ? record.href.trim() : "";
      return label && href ? { label, href } : null;
    })
    .filter((item): item is CmsLink => Boolean(item));

  return links.length > 0 ? links : fallback;
}

export function getCmsStringArray(value: string | undefined, fallback: string[]) {
  const parsed = parseCmsJson<unknown>(value, fallback);

  if (Array.isArray(parsed)) {
    const items = parsed
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);

    if (items.length > 0) return items;
  }

  return parseCmsCsv(value, fallback);
}

export function isEnabled(value: string | undefined, fallback = false) {
  if (value === undefined || value === "") return fallback;
  return value === "true";
}

export const cmsDefaults = {
  navLinks: defaultNavLinks,
  heroButtons: defaultHeroButtons,
  sponsors: defaultSponsors,
  footerContacts: defaultFooterContacts,
  socialLinks: defaultSocialLinks,
  aboutImages: defaultAboutImages,
  testimonials: defaultTestimonials,
};
