"use client";

import { AlertCircle, Archive, Heart, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { COLOR_HEX } from "@/lib/constants";
import type { Item } from "@/lib/types";
import { ItemImage } from "@/components/item-image";

export function ItemCard({ item, selectable, selected, onSelect }: {
  item: Item;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const body = (
    <>
      <div className="item-card-photo">
        <ItemImage src={item.photos[0]} alt={item.name || item.type} count={item.photos.length} />
        <div className="item-card-badges">
          {item.ownershipStatus === "want" ? <span className="badge badge-want"><Heart size={12} /> Wishlist</span> : null}
          {item.needsAttention ? <span className="badge badge-attention"><AlertCircle size={12} /> Attention</span> : null}
          {item.isArchived ? <span className="badge badge-archived"><Archive size={12} /> Archived</span> : null}
        </div>
        {selectable ? (
          <span className={`selection-check${selected ? " selected" : ""}`}>{selected ? "✓" : ""}</span>
        ) : (
          <button className="card-more" aria-label="Item options" onClick={(event) => event.preventDefault()}>
            <MoreHorizontal size={18} />
          </button>
        )}
      </div>
      <div className="item-card-info">
        <div>
          <h3>{item.name || item.type}</h3>
          <p>{item.type} · {item.material || "Material not set"}</p>
        </div>
        <span className="color-swatch" style={{ backgroundColor: COLOR_HEX[item.primaryColor] ?? item.primaryColor }} title={item.primaryColor} />
      </div>
    </>
  );

  if (selectable) {
    return <button type="button" className={`item-card selectable${selected ? " selected" : ""}`} onClick={onSelect}>{body}</button>;
  }

  return <Link href={`/closet/${item.id}`} className="item-card">{body}</Link>;
}
