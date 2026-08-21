"use client";

import {
  CheckCircle2,
  ChevronDown,
  Copy,
  MoreHorizontal,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { OutfitPreview } from "@/components/outfits/outfit-preview";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useWardrobe } from "@/components/wardrobe-provider";
import { formatOccasion, OCCASIONS } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { Occasion, Outfit } from "@/lib/types";

export default function OutfitsPage() {
  const { outfits, items, addOutfit, deleteOutfit, updateOutfit } = useWardrobe();
  const { notify } = useToast();
  const [occasion, setOccasion] = useState<Occasion | "all">("all");
  const [status, setStatus] = useState<"all" | "ready" | "draft">("all");
  const [menu, setMenu] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Outfit | undefined>();

  const filtered = useMemo(() => outfits.filter((outfit) => {
    if (occasion !== "all" && outfit.occasion !== occasion) return false;
    if (status === "draft" && !outfit.isDraft) return false;
    if (status === "ready" && outfit.isDraft) return false;
    return true;
  }), [occasion, outfits, status]);

  const outfitItems = (outfit: Outfit) => outfit.itemIds.map((id) => items.find((item) => item.id === id)).filter((item) => item !== undefined);

  const duplicate = async (outfit: Outfit) => {
    await addOutfit({ name: `${outfit.name || "Untitled outfit"} copy`, occasion: outfit.occasion, isDraft: true, itemIds: outfit.itemIds });
    setMenu(null); notify("Outfit copied as a draft.");
  };

  const publish = async (outfit: Outfit) => {
    await updateOutfit(outfit.id, { name: outfit.name, occasion: outfit.occasion, itemIds: outfit.itemIds, isDraft: false });
    setMenu(null); notify("Outfit is ready to wear.");
  };

  const remove = async () => {
    if (!deleteTarget) return;
    await deleteOutfit(deleteTarget.id); setDeleteTarget(undefined); notify("Outfit removed.");
  };

  return (
    <div className="page-stack outfits-page">
      <PageHeader eyebrow="Looks that work" title="My outfits" description="Save combinations once, then let future you get dressed faster." action={<Link href="/outfits/new" className="button button-primary button-md"><Plus size={17} /> Build an outfit</Link>} />

      <section className="outfit-intro-banner">
        <span className="intro-spark"><Sparkles size={22} /></span>
        <div><strong>Build once. Decide less.</strong><p>Your finalized outfits are the quickest path through a busy morning.</p></div>
        <Link href="/outfits/new">Create a combination →</Link>
      </section>

      <div className="outfit-filters">
        <div className="closet-tabs compact-tabs">
          <button className={status === "all" ? "active" : ""} onClick={() => setStatus("all")}>All <span>{outfits.length}</span></button>
          <button className={status === "ready" ? "active" : ""} onClick={() => setStatus("ready")}>Ready <span>{outfits.filter((outfit) => !outfit.isDraft).length}</span></button>
          <button className={status === "draft" ? "active" : ""} onClick={() => setStatus("draft")}>Drafts <span>{outfits.filter((outfit) => outfit.isDraft).length}</span></button>
        </div>
        <label className="sort-control"><select value={occasion} onChange={(event) => setOccasion(event.target.value as Occasion | "all")}><option value="all">Every occasion</option>{OCCASIONS.map((entry) => <option value={entry.value} key={entry.value}>{entry.label}</option>)}</select><ChevronDown size={14} /></label>
      </div>

      {filtered.length ? (
        <div className="outfits-grid">
          {filtered.map((outfit) => {
            const pieces = outfitItems(outfit);
            return (
              <article className="outfit-card" key={outfit.id}>
                <Link href={`/outfits/new?edit=${outfit.id}`} className="outfit-card-preview"><OutfitPreview items={pieces} /><span className={`outfit-state ${outfit.isDraft ? "draft" : "ready"}`}>{outfit.isDraft ? "Draft" : <><CheckCircle2 size={12} /> Ready</>}</span></Link>
                <div className="outfit-card-copy">
                  <div><span className="occasion-label">{formatOccasion(outfit.occasion)}</span><h2>{outfit.name || "Untitled outfit"}</h2><p>{pieces.length} {pieces.length === 1 ? "piece" : "pieces"} · Saved {formatDate(outfit.createdAt.slice(0, 10), { month: "short", day: "numeric" })}</p></div>
                  <div className="context-menu-wrap"><button onClick={() => setMenu(menu === outfit.id ? null : outfit.id)} aria-label="Outfit options"><MoreHorizontal size={19} /></button>{menu === outfit.id ? <div className="context-menu"><Link href={`/outfits/new?edit=${outfit.id}`}><Pencil size={14} /> Edit</Link>{outfit.isDraft ? <button onClick={() => void publish(outfit)}><CheckCircle2 size={14} /> Mark ready</button> : null}<button onClick={() => void duplicate(outfit)}><Copy size={14} /> Duplicate</button><button className="danger" onClick={() => { setDeleteTarget(outfit); setMenu(null); }}><Trash2 size={14} /> Remove</button></div> : null}</div>
                </div>
                <div className="outfit-piece-row">{pieces.slice(0, 4).map((piece) => <span key={piece.id}>{piece.photos[0] ? <img src={piece.photos[0]} alt="" /> : null}<small>{piece.type}</small></span>)}</div>
              </article>
            );
          })}
          <Link href="/outfits/new" className="add-outfit-card"><span><Plus size={24} /></span><strong>Build a new outfit</strong><small>Choose a few pieces that work together</small></Link>
        </div>
      ) : (
        <EmptyState icon={Sparkles} title={outfits.length ? "No outfits match these filters" : "Your first easy morning starts here"} copy={outfits.length ? "Try another occasion or include both ready looks and drafts." : "Combine pieces you already enjoy wearing. Name it now or keep it as a draft."} action={!outfits.length ? <Link href="/outfits/new" className="button button-primary button-md"><Plus size={16} /> Build an outfit</Link> : <Button variant="secondary" onClick={() => { setStatus("all"); setOccasion("all"); }}>Clear filters</Button>} />
      )}

      <Modal open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(undefined)} title="Remove this outfit?" eyebrow="Just checking" size="sm">
        <div className="confirm-dialog"><span className="confirm-icon"><Trash2 size={21} /></span><p><strong>{deleteTarget?.name || "This outfit"}</strong> will leave your saved combinations. Your individual clothing items stay untouched.</p><div><Button variant="secondary" onClick={() => setDeleteTarget(undefined)}>Keep outfit</Button><Button variant="danger" onClick={() => void remove()}>Remove outfit</Button></div></div>
      </Modal>
    </div>
  );
}
