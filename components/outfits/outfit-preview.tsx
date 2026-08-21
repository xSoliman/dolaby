import { Plus, Shirt } from "lucide-react";
import type { Item } from "@/lib/types";

export function OutfitPreview({ items, size = "card", emptySlots = false }: {
  items: Item[];
  size?: "card" | "large";
  emptySlots?: boolean;
}) {
  const visible = items.slice(0, 4);
  const slots = emptySlots ? Math.max(0, 3 - visible.length) : 0;
  return (
    <div className={`outfit-preview outfit-preview-${size} count-${Math.min(visible.length, 4)}`}>
      {visible.map((item, index) => (
        <div className={`outfit-preview-item preview-item-${index + 1}`} key={item.id}>
          {item.photos[0] ? <img src={item.photos[0]} alt={item.name || item.type} /> : <Shirt size={22} />}
          {size === "large" ? <span>{item.name || item.type}</span> : null}
        </div>
      ))}
      {Array.from({ length: slots }).map((_, index) => <div className="outfit-empty-slot" key={`empty-${index}`}><Plus size={20} /><span>Add a piece</span></div>)}
      {items.length > 4 ? <span className="outfit-extra">+{items.length - 4}</span> : null}
    </div>
  );
}
