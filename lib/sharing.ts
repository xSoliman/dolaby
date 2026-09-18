import type { Item, Outfit, Store, WardrobeShare } from "@/lib/types";

export const SHARE_TOKEN_PATTERN = /^[0-9a-f]{32}$/;

/** Unguessable, URL-safe token for a read-only wardrobe link. */
export function newShareToken() {
  return crypto.randomUUID().replaceAll("-", "");
}

export function isShareToken(value: string) {
  return SHARE_TOKEN_PATTERN.test(value);
}

export function sharePath(token: string) {
  return `/s/${token}`;
}

export function shareUrl(token: string) {
  return `${window.location.origin}${sharePath(token)}`;
}

export interface SharedWardrobe {
  ownerName: string;
  items: Item[];
  outfits: Outfit[];
  stores: Store[];
}

/**
 * The shape a shared wardrobe takes on the wire. Wear history and shopping
 * details stay private; viewers see pieces, ready outfits, and stores only.
 */
export function toSharedPayload(items: Item[], outfits: Outfit[], stores: Store[]): Omit<SharedWardrobe, "ownerName"> {
  return {
    items: items.filter((item) => !item.isArchived).map((item) => ({
      ...item,
      price: null,
      acquiredDate: "",
      sourceStoreId: null,
      candidateStoreIds: [],
    })),
    outfits: outfits.filter((outfit) => !outfit.isDraft && !outfit.isArchived),
    stores: stores.filter((store) => !store.isArchived),
  };
}

export function demoShareFromStorage(): WardrobeShare | null {
  try {
    const saved = window.localStorage.getItem("dolaby.share.v1");
    if (!saved) return null;
    const parsed = JSON.parse(saved) as WardrobeShare;
    if (!isShareToken(parsed.token)) return null;
    return parsed;
  } catch {
    return null;
  }
}
