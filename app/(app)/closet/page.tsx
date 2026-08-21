"use client";

import {
  AlertCircle,
  ArrowDownAZ,
  ChevronDown,
  Grid2X2,
  List,
  Plus,
  Search,
  Shirt,
  SlidersHorizontal,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ItemCard } from "@/components/closet/item-card";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { useWardrobe } from "@/components/wardrobe-provider";
import { CATEGORIES } from "@/lib/constants";
import type { Category, OwnershipStatus } from "@/lib/types";

type StatusFilter = "all" | OwnershipStatus;
type Sort = "newest" | "name" | "rating";

export default function ClosetPage() {
  const { items } = useWardrobe();
  const [status, setStatus] = useState<StatusFilter>("all");
  const [category, setCategory] = useState<Category | "all">("all");
  const [query, setQuery] = useState("");
  const [attentionOnly, setAttentionOnly] = useState(false);
  const [ratingOnly, setRatingOnly] = useState(false);
  const [sort, setSort] = useState<Sort>("newest");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedStatus = params.get("status");
    if (requestedStatus === "own" || requestedStatus === "want") setStatus(requestedStatus);
    setAttentionOnly(params.get("attention") === "true");
    setRatingOnly(params.get("rating") === "5");
  }, []);

  const filtered = useMemo(() => {
    const result = items.filter((item) => {
      if (status !== "all" && item.ownershipStatus !== status) return false;
      if (category !== "all" && item.category !== category) return false;
      if (attentionOnly && !item.needsAttention) return false;
      if (ratingOnly && item.satisfactionRating !== 5) return false;
      if (query && !`${item.name} ${item.type} ${item.primaryColor} ${item.material}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
    return result.sort((a, b) => {
      if (sort === "name") return (a.name || a.type).localeCompare(b.name || b.type);
      if (sort === "rating") return b.satisfactionRating - a.satisfactionRating;
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [attentionOnly, category, items, query, ratingOnly, sort, status]);

  const filterCount = Number(category !== "all") + Number(attentionOnly) + Number(ratingOnly);
  const clearFilters = () => {
    setStatus("all"); setCategory("all"); setAttentionOnly(false); setRatingOnly(false); setQuery("");
  };

  return (
    <div className="page-stack closet-page">
      <PageHeader
        eyebrow="Your wardrobe"
        title="My closet"
        description={`${items.filter((item) => item.ownershipStatus === "own").length} pieces you own · ${items.filter((item) => item.ownershipStatus === "want").length} saved for later`}
        action={<Link className="button button-primary button-md" href="/closet/new"><Plus size={17} /> Add an item</Link>}
      />

      <div className="closet-tabs" role="tablist">
        {([
          ["all", "Everything", items.length],
          ["own", "I own", items.filter((item) => item.ownershipStatus === "own").length],
          ["want", "Wishlist", items.filter((item) => item.ownershipStatus === "want").length],
        ] as const).map(([value, label, count]) => (
          <button key={value} className={status === value ? "active" : ""} onClick={() => setStatus(value)}>{label}<span>{count}</span></button>
        ))}
      </div>

      <section className="closet-toolbar">
        <label className="closet-search">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search pieces…" />
          {query ? <button onClick={() => setQuery("")} aria-label="Clear search"><X size={15} /></button> : null}
        </label>

        <div className="filter-row">
          <div className="category-filters">
            <button className={category === "all" ? "active" : ""} onClick={() => setCategory("all")}>All types</button>
            {CATEGORIES.map((entry) => <button key={entry.value} className={category === entry.value ? "active" : ""} onClick={() => setCategory(entry.value)}>{entry.label}</button>)}
          </div>
          <button className={`filter-button${filterCount ? " active" : ""}`} onClick={() => setFiltersOpen((value) => !value)}>
            <SlidersHorizontal size={16} /> Filters {filterCount ? <span>{filterCount}</span> : null}
          </button>
        </div>

        {filtersOpen ? (
          <div className="filter-popover">
            <div><strong>More filters</strong><button onClick={() => setFiltersOpen(false)}><X size={16} /></button></div>
            <label><input type="checkbox" checked={attentionOnly} onChange={(event) => setAttentionOnly(event.target.checked)} /><span>Needs attention</span><small>Repairs, cleaning, or tailoring</small></label>
            <label><input type="checkbox" checked={ratingOnly} onChange={(event) => setRatingOnly(event.target.checked)} /><span>Favorites only</span><small>Rated five stars</small></label>
          </div>
        ) : null}
      </section>

      <div className="collection-meta">
        <p><strong>{filtered.length}</strong> {filtered.length === 1 ? "piece" : "pieces"}</p>
        <div>
          <label className="sort-control"><ArrowDownAZ size={16} /><select value={sort} onChange={(event) => setSort(event.target.value as Sort)}><option value="newest">Newest first</option><option value="name">Name A–Z</option><option value="rating">Highest rated</option></select><ChevronDown size={14} /></label>
          <span className="view-toggle"><button className={view === "grid" ? "active" : ""} onClick={() => setView("grid")} aria-label="Grid view"><Grid2X2 size={16} /></button><button className={view === "list" ? "active" : ""} onClick={() => setView("list")} aria-label="List view"><List size={17} /></button></span>
        </div>
      </div>

      {filtered.length ? (
        <div className={`item-grid ${view === "list" ? "item-list-view" : ""}`}>
          {filtered.map((item) => <ItemCard item={item} key={item.id} />)}
        </div>
      ) : (
        <EmptyState
          icon={items.length ? Search : Shirt}
          title={items.length ? "No pieces match those filters" : "Your closet is ready for its first piece"}
          copy={items.length ? "Try widening your search or clearing the active filters." : "Add what you reach for most. You can fill in the rest over time."}
          action={items.length ? <button className="button button-secondary button-md" onClick={clearFilters}>Clear filters</button> : <Link className="button button-primary button-md" href="/closet/new"><Plus size={16} /> Add your first item</Link>}
        />
      )}

      {items.some((item) => item.needsAttention) && !attentionOnly ? (
        <Link href="/closet?attention=true" onClick={() => setAttentionOnly(true)} className="closet-care-strip">
          <span><AlertCircle size={18} /></span>
          <div><strong>Care keeps favorites in rotation</strong><p>{items.filter((item) => item.needsAttention).length} pieces are waiting for a little attention.</p></div>
          <span>Review them →</span>
        </Link>
      ) : null}
    </div>
  );
}
