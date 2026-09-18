"use client";

import {
  ArrowLeft,
  Check,
  ChevronDown,
  Filter,
  Heart,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { OutfitPreview } from "@/components/outfits/outfit-preview";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useWardrobe } from "@/components/wardrobe-provider";
import { CATEGORIES, OCCASIONS } from "@/lib/constants";
import type { Category, Occasion, OwnershipStatus } from "@/lib/types";

type StatusFilter = "all" | OwnershipStatus;

export default function OutfitBuilderPage() {
  const router = useRouter();
  const { items, outfits, addOutfit, updateOutfit } = useWardrobe();
  const { notify } = useToast();
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [occasion, setOccasion] = useState<Occasion>("casual");
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedEdit = params.get("edit");
    const requestedItem = params.get("item");
    if (requestedEdit) {
      const outfit = outfits.find((entry) => entry.id === requestedEdit);
      if (outfit) { setEditId(outfit.id); setName(outfit.name); setOccasion(outfit.occasion); setSelected(outfit.itemIds); }
    } else if (requestedItem && items.some((item) => item.id === requestedItem && !item.isArchived)) {
      setSelected([requestedItem]);
    }
  }, [items, outfits]);

  const visible = useMemo(() => items.filter((item) => {
    if (item.isArchived) return false;
    if (status !== "all" && item.ownershipStatus !== status) return false;
    if (category !== "all" && item.category !== category) return false;
    return !query || `${item.name} ${item.type} ${item.primaryColor}`.toLowerCase().includes(query.toLowerCase());
  }), [category, items, query, status]);
  const selectedItems = selected.map((id) => items.find((item) => item.id === id)).filter((item) => item !== undefined);

  const toggle = (id: string) => setSelected((current) => current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]);

  const save = async (isDraft: boolean) => {
    if (selected.length < 2) { notify("Choose at least two pieces for this outfit.", "error"); return; }
    setSaving(true);
    try {
      const draft = { name, occasion, itemIds: selected, isDraft };
      if (editId) await updateOutfit(editId, draft); else await addOutfit(draft);
      notify(isDraft ? "Outfit saved as a draft." : "Outfit is ready to wear.");
      router.push("/outfits");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not save this outfit.", "error");
    } finally { setSaving(false); }
  };

  const submit = (event: FormEvent) => { event.preventDefault(); void save(false); };

  return (
    <form className="outfit-builder-page" onSubmit={submit}>
      <header className="builder-header">
        <div><Link href="/outfits" className="back-link"><ArrowLeft size={16} /> My outfits</Link><p className="eyebrow">Manual outfit builder</p><h1>{editId ? "Refine your outfit" : "Put a look together"}</h1><p>Choose pieces that work. No algorithms, just your eye.</p></div>
        <div><Button variant="secondary" disabled={saving} onClick={() => void save(true)}>Save as draft</Button><Button type="submit" disabled={saving}>{saving ? "Saving…" : "Mark as ready"}<Check size={16} /></Button></div>
      </header>

      <div className="builder-layout">
        <section className="builder-canvas">
          <div className="builder-section-title"><div><span className="form-step">01</span><span><strong>Your outfit</strong><small>{selected.length ? `${selected.length} pieces selected` : "Start by choosing a piece"}</small></span></div>{selected.length ? <button type="button" onClick={() => setSelected([])}>Clear all</button> : null}</div>
          <div className="builder-preview-wrap">
            <OutfitPreview items={selectedItems} size="large" emptySlots />
            {!selectedItems.length ? <div className="builder-empty-copy"><span><Sparkles size={22} /></span><h2>Your canvas is empty</h2><p>Pick a top, bottom, or whatever feels right.</p></div> : null}
          </div>
          {selectedItems.length ? <div className="selected-piece-list">{selectedItems.map((item, index) => <div key={item.id}><span>{index + 1}</span><span className="selected-thumb">{item.photos[0] ? <img src={item.photos[0]} alt="" /> : null}</span><span><strong>{item.name || item.type}</strong><small>{item.type} · {item.primaryColor}{item.ownershipStatus === "want" ? " · Wishlist" : ""}</small></span><button type="button" onClick={() => toggle(item.id)}>×</button></div>)}</div> : null}
        </section>

        <section className="builder-picker">
          <div className="builder-section-title"><div><span className="form-step">02</span><span><strong>Choose pieces</strong><small>{status === "want" ? "Only wishlist pieces appear here" : status === "own" ? "Only items you own appear here" : "Mix owned pieces with wishlist ones"}</small></span></div><Filter size={17} /></div>
          <label className="builder-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your closet…" /></label>
          <div className="builder-status"><div className="segmented-control" role="tablist" aria-label="Ownership filter">{([["all", "All pieces"], ["own", "Owned"], ["want", "Wishlist"]] as const).map(([value, label]) => <button type="button" key={value} className={status === value ? "active" : ""} onClick={() => setStatus(value)}>{label}</button>)}</div></div>
          <div className="builder-categories"><button type="button" className={category === "all" ? "active" : ""} onClick={() => setCategory("all")}>All</button>{CATEGORIES.map((entry) => <button type="button" className={category === entry.value ? "active" : ""} key={entry.value} onClick={() => setCategory(entry.value)}>{entry.label}</button>)}</div>
          <div className="builder-item-grid">
            {visible.map((item) => { const active = selected.includes(item.id); return <button type="button" className={active ? "selected" : ""} key={item.id} onClick={() => toggle(item.id)}><span className="builder-item-photo">{item.photos[0] ? <img src={item.photos[0]} alt="" /> : null}{item.ownershipStatus === "want" ? <span className="badge badge-want"><Heart size={12} /> Wishlist</span> : null}<i>{active ? <Check size={14} /> : <Plus size={14} />}</i></span><strong>{item.name || item.type}</strong><small>{item.type} · {item.primaryColor}</small></button>; })}
            {!visible.length ? <p className="builder-no-results">No pieces match this view.</p> : null}
          </div>
        </section>

        <aside className="builder-details">
          <div className="builder-section-title"><div><span className="form-step">03</span><span><strong>Finish the thought</strong><small>Name it or keep things simple</small></span></div></div>
          <label className="field"><span>Outfit name <small>optional</small></span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Easy Thursday" /></label>
          <label className="field"><span>Occasion</span><span className="select-wrap"><select value={occasion} onChange={(event) => setOccasion(event.target.value as Occasion)}>{OCCASIONS.map((entry) => <option key={entry.value} value={entry.value}>{entry.label}</option>)}</select><ChevronDown size={16} /></span></label>
          <div className="builder-tip"><Sparkles size={17} /><p><strong>A good outfit earns repeats.</strong> Log it after wearing to remember how it actually felt.</p></div>
          <div className="builder-summary"><span>Selected</span><strong>{selected.length} pieces</strong><span>Occasion</span><strong>{OCCASIONS.find((entry) => entry.value === occasion)?.label}</strong></div>
        </aside>
      </div>

      <div className="mobile-builder-bar"><button type="button" onClick={() => void save(true)}>Save draft</button><Button type="submit" disabled={saving}>{saving ? "Saving…" : `Ready · ${selected.length} pieces`}</Button></div>
    </form>
  );
}
