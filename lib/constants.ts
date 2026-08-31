export type Theme = {
  maroon: string;
  maroonDeep: string;
  navy: string;
  navyLight: string;
  ivory: string;
  parchment: string;
  gold: string;
  ink: string;
  slate: string;
  line: string;
};

// Links out to the school's own site. Every field is optional — a school that
// doesn't publish one simply omits it and the UI hides that affordance.
export type SchoolLinks = {
  resourceGuide?: string;
  // The official calendar the school publishes. `calendarLabel` names what it
  // actually is, since schools publish these under different names.
  calendar?: string;
  calendarLabel?: string;
  // Login for the school's live events calendar, when it sits behind a portal.
  portal?: string;
};

export type School = {
  id: string;
  name: string;
  theme: Theme;
  links: SchoolLinks;
};

// Colors and links belong to the school, not the app. A new school is a new
// entry here — same token names, different values — and the whole UI re-skins.
export const SCHOOLS: School[] = [
  {
    id: "dexter-southfield",
    name: "Dexter Southfield",
    links: {
      resourceGuide: "https://www.dextersouthfield.org/resource-guide26/ms",
      // Pulled from the Middle School resource guide. This is the stable
      // resource-manager URL, not the CDN file it redirects to, so it keeps
      // working when the school swaps in an updated PDF.
      calendar:
        "https://www.dextersouthfield.org/fs/resource-manager/view/5339c38d-07a1-49f9-a03b-6ff3b7b245f9",
      calendarLabel: "2026–27 major dates",
      portal: "https://www.dextersouthfield.org/login",
    },
    theme: {
      maroon: "#7A1B2E",
      maroonDeep: "#591420",
      navy: "#16213E",
      navyLight: "#29365C",
      ivory: "#F7F2E7",
      parchment: "#EFE6D3",
      gold: "#B08D3E",
      ink: "#231F1B",
      slate: "#6B6357",
      line: "#DDD1B4",
    },
  },
];

export const DEFAULT_SCHOOL_ID = SCHOOLS[0].id;

export const KIDS = [
  { id: "nyra", name: "Nyra Shah", initials: "NS" },
  { id: "eve", name: "Eve Edwards", initials: "EE" },
  { id: "jack", name: "Jack Baker", initials: "JB" },
];

// Each kid maps to one couple, so this doubles as the couple accent: both of
// Jack's parents show navy, both of Eve's gold, both of Nyra's maroon. Theme
// tokens rather than literals, so it re-skins with the school.
const KID_ACCENT_TOKEN: Record<string, keyof Theme> = {
  jack: "navy",
  eve: "gold",
  nyra: "maroon",
};

export function kidAccent(theme: Theme, kidId: string): string {
  return theme[KID_ACCENT_TOKEN[kidId] ?? "slate"];
}

// A parent's color is their couple's color, taken from the kid they share.
export function coupleAccent(theme: Theme, parent: { kid: { slug: string } } | null): string {
  return parent ? kidAccent(theme, parent.kid.slug) : theme.slate;
}

export const SLOT_TYPES = [
  { id: "dropoff", label: "Drop-off" },
  { id: "pickup", label: "Pick-up" },
] as const;

export type SlotType = (typeof SLOT_TYPES)[number]["id"];
