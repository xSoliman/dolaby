import type { Category, Feeling, Occasion } from "@/lib/types";

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: "top", label: "Tops" },
  { value: "bottom", label: "Bottoms" },
  { value: "outerwear", label: "Outerwear" },
  { value: "shoes", label: "Shoes" },
  { value: "accessory", label: "Accessories" },
];

export const ITEM_TYPES: Record<Category, string[]> = {
  top: ["T-shirt", "Shirt", "Polo", "Sweater", "Hoodie", "Tank top"],
  bottom: ["Jeans", "Trousers", "Chinos", "Shorts", "Skirt"],
  outerwear: ["Blazer", "Jacket", "Coat", "Overshirt", "Cardigan"],
  shoes: ["Sneakers", "Loafers", "Boots", "Derby shoes", "Sandals"],
  accessory: ["Watch", "Belt", "Bag", "Scarf", "Hat", "Jewelry"],
};

export const COLORS = [
  "Black",
  "White",
  "Cream",
  "Grey",
  "Navy",
  "Blue",
  "Brown",
  "Beige",
  "Green",
  "Olive",
  "Red",
  "Burgundy",
];

export const COLOR_HEX: Record<string, string> = {
  Black: "#252522",
  White: "#f8f8f4",
  Cream: "#eee7d4",
  Grey: "#9a9b96",
  Navy: "#27344b",
  Blue: "#6c8ca8",
  Brown: "#795d47",
  Beige: "#cbbd9e",
  Green: "#46664f",
  Olive: "#737253",
  Red: "#a84d45",
  Burgundy: "#6f3442",
};

export const OCCASIONS: { value: Occasion; label: string }[] = [
  { value: "work", label: "Work" },
  { value: "casual", label: "Casual" },
  { value: "date_night", label: "Date night" },
  { value: "event", label: "Event" },
  { value: "gym", label: "Gym" },
];

export const FEELINGS: { value: Feeling; label: string; emoji: string }[] = [
  { value: "confident", label: "Confident", emoji: "✦" },
  { value: "good", label: "Good", emoji: "☺" },
  { value: "neutral", label: "Neutral", emoji: "—" },
  { value: "self_conscious", label: "Not myself", emoji: "◌" },
];

export const formatOccasion = (value: Occasion) =>
  OCCASIONS.find((occasion) => occasion.value === value)?.label ?? value;

export const formatCategory = (value: Category) =>
  CATEGORIES.find((category) => category.value === value)?.label ?? value;
