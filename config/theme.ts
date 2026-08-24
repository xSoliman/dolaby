export const THEME_NAMES = ["boutique", "green-lime"] as const;

export type ThemeName = (typeof THEME_NAMES)[number];

/** Change this one value to apply a different Dolaby theme everywhere. */
export const ACTIVE_THEME: ThemeName = "boutique";

export const THEME_METADATA: Record<
  ThemeName,
  { label: string; description: string; browserColor: string; icon: string }
> = {
  boutique: {
    label: "Walnut Boutique",
    description: "Espresso, walnut, oat, muted brass, and olive with clear editorial slab type.",
    browserColor: "#ece2d4",
    icon: "/theme-boutique-icon.svg",
  },
  "green-lime": {
    label: "Green Lime Archive",
    description: "Dolaby's original forest green, soft sage, and lime palette.",
    browserColor: "#f4f3ee",
    icon: "/theme-green-lime-icon.svg",
  },
};
