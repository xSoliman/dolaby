"use client";

import {
  AlertCircle,
  Archive,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Heart,
  Pencil,
  ShoppingBag,
  Star,
  Store as StoreIcon,
  ThermometerSun,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ItemForm } from "@/components/closet/item-form";
import { ItemDetailSkeleton } from "@/components/closet/item-detail-skeleton";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useWardrobe } from "@/components/wardrobe-provider";
import { formatCategory } from "@/lib/constants";
import { errorMessage, formatDate, formatMoney } from "@/lib/format";

export default function ItemDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { items, stores, outfits, deleteItem, setItemArchived, loading } = useWardrobe();
  const { notify } = useToast();
  const item = items.find((entry) => entry.id === params.id);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);

  if (loading && !item) {
    return <ItemDetailSkeleton />;
  }

  if (!item) {
    return <div className="not-found-card"><h1>That piece isn&apos;t here.</h1><p>It may have been removed from your wardrobe.</p><Link className="button button-secondary button-md" href="/closet">Back to my closet</Link></div>;
  }

  if (editing) {
    return (
      <div className="editor-page embedded-editor">
        <header className="editor-header">
          <div><button className="back-link" onClick={() => setEditing(false)}><ArrowLeft size={16} /> Item details</button><p className="eyebrow">Make an adjustment</p><h1>Edit {item.name || item.type}</h1></div>
        </header>
        <ItemForm item={item} onCancel={() => setEditing(false)} onSaved={() => setEditing(false)} />
      </div>
    );
  }

  const source = stores.find((store) => store.id === item.sourceStoreId);
  const candidates = stores.filter((store) => item.candidateStoreIds.includes(store.id));
  const usedIn = outfits.filter((outfit) => outfit.itemIds.includes(item.id));

  const confirmDelete = async () => {
    try {
      await deleteItem(item.id);
      notify("Item removed from your wardrobe.");
      router.push("/closet");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not remove this item.", "error");
    }
  };

  const toggleArchive = async () => {
    try {
      await setItemArchived(item.id, !item.isArchived);
      notify(item.isArchived ? "Item restored to your closet." : "Item archived.");
    } catch (error) {
      notify(errorMessage(error, "Could not update this item."), "error");
    }
  };

  return (
    <div className="item-detail-page">
      <div className="detail-topline">
        <Link href="/closet" className="back-link"><ArrowLeft size={16} /> My closet</Link>
        <div><Button variant="secondary" onClick={() => setEditing(true)}><Pencil size={15} /> Edit item</Button><Button variant="secondary" onClick={() => void toggleArchive()}><Archive size={15} /> {item.isArchived ? "Unarchive" : "Archive"}</Button><button className="icon-button danger-icon" onClick={() => setDeleting(true)} aria-label="Delete item"><Trash2 size={17} /></button></div>
      </div>

      <div className="item-detail-grid">
        <section className="detail-gallery">
          <div className="detail-main-photo">
            {item.photos[activePhoto] ? <img src={item.photos[activePhoto]} alt={item.name || item.type} /> : <span>No photo yet</span>}
            {item.ownershipStatus === "want" ? <span className="detail-status wishlist"><Heart size={13} /> Wishlist</span> : null}
            {item.needsAttention ? <span className="detail-status attention"><AlertCircle size={13} /> Needs attention</span> : null}
            {item.photos.length > 1 ? <><button className="gallery-prev" onClick={() => setActivePhoto((value) => (value - 1 + item.photos.length) % item.photos.length)}><ChevronLeft size={19} /></button><button className="gallery-next" onClick={() => setActivePhoto((value) => (value + 1) % item.photos.length)}><ChevronRight size={19} /></button></> : null}
          </div>
          {item.photos.length > 1 ? <div className="gallery-thumbs">{item.photos.map((photo, index) => <button className={activePhoto === index ? "active" : ""} key={index} onClick={() => setActivePhoto(index)}><img src={photo} alt="" /></button>)}</div> : null}
        </section>

        <section className="detail-copy">
          <p className="eyebrow">{formatCategory(item.category)} · {item.type}</p>
          <h1>{item.name || item.type}</h1>
          <div className="detail-rating">
            {[1, 2, 3, 4, 5].map((value) => <Star size={16} key={value} fill={value <= item.satisfactionRating ? "currentColor" : "none"} />)}
            <span>{item.satisfactionRating ? `${item.satisfactionRating}/5 satisfaction` : "Not rated yet"}</span>
          </div>
          {item.note ? <p className="detail-note">“{item.note}”</p> : null}

          <dl className="detail-specs">
            <div><dt>Color</dt><dd><span className={`color-dot color-${item.primaryColor.toLowerCase()}`} />{item.primaryColor}</dd></div>
            <div><dt>Size</dt><dd>{item.size || "Not set"}</dd></div>
            <div><dt>Material</dt><dd>{item.material || "Not set"}</dd></div>
            <div><dt>Warmth</dt><dd><ThermometerSun size={15} /> {item.warmthLevel}</dd></div>
            <div><dt>Formality</dt><dd><span className="mini-score">{[1, 2, 3, 4, 5].map((score) => <i className={score <= item.formalityScore ? "filled" : ""} key={score} />)}</span>{item.formalityScore}/5</dd></div>
            <div><dt>Status</dt><dd>{item.ownershipStatus === "own" ? "In my closet" : "On my wishlist"}</dd></div>
          </dl>

          <div className="detail-shopping">
            <h2><ShoppingBag size={18} /> Shopping details</h2>
            <div><span>Price</span><strong>{formatMoney(item.price)}</strong></div>
            {item.ownershipStatus === "own" ? <div><span>Acquired</span><strong>{item.acquiredDate ? formatDate(item.acquiredDate) : "Not recorded"}</strong></div> : null}
            {source ? <Link href="/stores"><span>From</span><strong><StoreIcon size={14} /> {source.name}</strong></Link> : null}
            {candidates.length ? <div><span>Considering</span><strong>{candidates.map((store) => store.name).join(", ")}</strong></div> : null}
          </div>
        </section>
      </div>

      <section className="used-in-section">
        <div><p className="eyebrow">Outfit connections</p><h2>Used in {usedIn.length} {usedIn.length === 1 ? "outfit" : "outfits"}</h2></div>
        {usedIn.length ? <div className="used-in-list">{usedIn.map((outfit) => <Link href="/outfits" key={outfit.id}><span className="mini-outfit-images">{outfit.itemIds.slice(0, 3).map((id) => { const piece = items.find((entry) => entry.id === id); return piece?.photos[0] ? <img src={piece.photos[0]} alt="" key={id} /> : null; })}</span><span><strong>{outfit.name || "Untitled outfit"}</strong><small>{outfit.itemIds.length} pieces</small></span></Link>)}</div> : <p className="muted-copy">This piece hasn&apos;t been added to an outfit yet.</p>}
        <Link href={`/outfits/new?item=${item.id}`} className="text-link">Build an outfit with this piece →</Link>
      </section>

      <Modal open={deleting} onClose={() => setDeleting(false)} title="Remove this item?" eyebrow="Just checking" size="sm">
        <div className="confirm-dialog">
          <span className="confirm-icon"><Trash2 size={21} /></span>
          <p>This removes <strong>{item.name || item.type}</strong> from your closet and from any saved outfits. This can&apos;t be undone.</p>
          <div><Button variant="secondary" onClick={() => setDeleting(false)}>Keep item</Button><Button variant="danger" onClick={() => void confirmDelete()}>Remove item</Button></div>
        </div>
      </Modal>
    </div>
  );
}
