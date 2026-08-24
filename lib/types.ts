export type Category = "top" | "bottom" | "underwear" | "outerwear" | "shoes" | "accessory";
export type WarmthLevel = "light" | "medium" | "heavy";
export type OwnershipStatus = "own" | "want";
export type StoreType = "online" | "physical" | "both";
export type Occasion = "work" | "casual" | "date_night" | "event" | "gym";
export type Feeling = "confident" | "good" | "neutral" | "self_conscious";

export interface Item {
  id: string;
  name: string;
  category: Category;
  type: string;
  primaryColor: string;
  size: string;
  material: string;
  formalityScore: number;
  warmthLevel: WarmthLevel;
  ownershipStatus: OwnershipStatus;
  needsAttention: boolean;
  satisfactionRating: number;
  price: number | null;
  acquiredDate: string;
  sourceStoreId: string | null;
  candidateStoreIds: string[];
  note: string;
  photos: string[];
  photoPaths?: string[];
  createdAt: string;
}

export type ItemDraft = Omit<Item, "id" | "createdAt" | "photoPaths">;

export interface Store {
  id: string;
  name: string;
  type: StoreType;
  url: string;
  location: string;
  photo: string;
  photoPath?: string;
  note: string;
  createdAt: string;
}

export type StoreDraft = Omit<Store, "id" | "createdAt" | "photoPath">;

export interface Outfit {
  id: string;
  name: string;
  occasion: Occasion;
  isDraft: boolean;
  itemIds: string[];
  createdAt: string;
}

export type OutfitDraft = Omit<Outfit, "id" | "createdAt">;

export interface WearEntry {
  id: string;
  date: string;
  occasion: Occasion;
  outfitId: string | null;
  itemIds: string[];
  feeling: Feeling;
  note: string;
  createdAt: string;
}

export type WearEntryDraft = Omit<WearEntry, "id" | "createdAt">;

export interface WardrobeData {
  items: Item[];
  stores: Store[];
  outfits: Outfit[];
  wearEntries: WearEntry[];
}

export interface Profile {
  id: string;
  name: string;
  email: string;
}
