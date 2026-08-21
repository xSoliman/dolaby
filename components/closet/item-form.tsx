"use client";

import {
  AlertCircle,
  ArrowLeft,
  Camera,
  Check,
  ChevronDown,
  ImagePlus,
  Plus,
  Star,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useWardrobe } from "@/components/wardrobe-provider";
import { CATEGORIES, COLORS, ITEM_TYPES } from "@/lib/constants";
import { prepareImage } from "@/lib/images";
import type { Category, Item, ItemDraft, OwnershipStatus, WarmthLevel } from "@/lib/types";

const blankDraft: ItemDraft = {
  name: "",
  category: "top",
  type: "T-shirt",
  primaryColor: "Black",
  size: "",
  material: "",
  formalityScore: 2,
  warmthLevel: "light",
  ownershipStatus: "own",
  needsAttention: false,
  satisfactionRating: 0,
  price: null,
  acquiredDate: "",
  sourceStoreId: null,
  candidateStoreIds: [],
  note: "",
  photos: [],
};

export function ItemForm({ item, onCancel, onSaved }: {
  item?: Item;
  onCancel?: () => void;
  onSaved?: (item: Item) => void;
}) {
  const router = useRouter();
  const { addItem, updateItem, stores, items } = useWardrobe();
  const { notify } = useToast();
  const [draft, setDraft] = useState<ItemDraft>(() => item ? {
    name: item.name,
    category: item.category,
    type: item.type,
    primaryColor: item.primaryColor,
    size: item.size,
    material: item.material,
    formalityScore: item.formalityScore,
    warmthLevel: item.warmthLevel,
    ownershipStatus: item.ownershipStatus,
    needsAttention: item.needsAttention,
    satisfactionRating: item.satisfactionRating,
    price: item.price,
    acquiredDate: item.acquiredDate,
    sourceStoreId: item.sourceStoreId,
    candidateStoreIds: item.candidateStoreIds,
    note: item.note,
    photos: item.photos,
  } : blankDraft);
  const [saving, setSaving] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(() => ({
    sizes: [...new Set(items.map((entry) => entry.size).filter(Boolean))].sort(),
    materials: [...new Set(items.map((entry) => entry.material).filter(Boolean))].sort(),
  }), [items]);

  const set = <K extends keyof ItemDraft>(key: K, value: ItemDraft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const setCategory = (category: Category) => {
    setDraft((current) => ({ ...current, category, type: ITEM_TYPES[category][0] }));
  };

  const addPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    setImageBusy(true);
    try {
      const room = Math.max(0, 5 - draft.photos.length);
      const prepared = await Promise.all([...files].slice(0, room).map((file) => prepareImage(file)));
      set("photos", [...draft.photos, ...prepared]);
      if (files.length > room) notify("You can add up to 5 photos per item.", "error");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not prepare that image.", "error");
    } finally {
      setImageBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft.type.trim()) {
      notify("Choose an item type before saving.", "error");
      return;
    }
    setSaving(true);
    try {
      const result = item ? await updateItem(item.id, draft) : await addItem(draft);
      notify(item ? "Item updated." : "Added to your wardrobe.");
      if (onSaved) onSaved(result);
      else router.push(`/closet/${result.id}`);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not save this item.", "error");
    } finally {
      setSaving(false);
    }
  };

  const sourceLabel = draft.ownershipStatus === "own" ? "Where did you get it?" : "Where could you get it?";

  return (
    <form className="item-form" onSubmit={submit}>
      <div className="form-main">
        <section className="form-section photo-section">
          <div className="form-section-heading">
            <span className="form-step">01</span>
            <div><h2>Add a good view</h2><p>Photos make your closet useful at a glance.</p></div>
          </div>
          <div className="photo-uploader">
            {draft.photos.length ? (
              <div className="photo-preview-grid">
                {draft.photos.map((photo, index) => (
                  <div className={`photo-preview${index === 0 ? " primary" : ""}`} key={`${photo.slice(0, 30)}-${index}`}>
                    <img src={photo} alt={`Item preview ${index + 1}`} />
                    {index === 0 ? <span>Cover</span> : null}
                    <button type="button" aria-label="Remove photo" onClick={() => set("photos", draft.photos.filter((_, photoIndex) => photoIndex !== index))}>
                      <X size={15} />
                    </button>
                  </div>
                ))}
                {draft.photos.length < 5 ? (
                  <button type="button" className="photo-add-tile" onClick={() => fileRef.current?.click()}>
                    <Plus size={22} /><span>Add photo</span>
                  </button>
                ) : null}
              </div>
            ) : (
              <button
                type="button"
                className="photo-dropzone"
                onClick={() => fileRef.current?.click()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => { event.preventDefault(); void addPhotos(event.dataTransfer.files); }}
              >
                <span className="camera-orbit"><Camera size={25} /></span>
                <strong>{imageBusy ? "Preparing your photo…" : "Drop photos here, or choose files"}</strong>
                <small>Up to 5 photos · JPG, PNG or WebP</small>
                <span className="button button-secondary button-sm"><ImagePlus size={15} /> Choose photos</span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(event) => void addPhotos(event.target.files)} />
          </div>
        </section>

        <section className="form-section">
          <div className="form-section-heading">
            <span className="form-step">02</span>
            <div><h2>What is it?</h2><p>A few details make it easy to find later.</p></div>
          </div>

          <div className="field-grid">
            <label className="field field-wide">
              <span>Name <small>optional</small></span>
              <input value={draft.name} onChange={(event) => set("name", event.target.value)} placeholder="e.g. The wedding blazer" />
            </label>

            <fieldset className="field field-wide category-field">
              <legend>Category</legend>
              <div className="category-picker">
                {CATEGORIES.map((category) => (
                  <button type="button" key={category.value} className={draft.category === category.value ? "active" : ""} onClick={() => setCategory(category.value)}>
                    <span className={`category-glyph glyph-${category.value}`} />
                    {category.label}
                    {draft.category === category.value ? <Check size={14} /> : null}
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="field">
              <span>Type</span>
              <span className="select-wrap">
                <select value={draft.type} onChange={(event) => set("type", event.target.value)} required>
                  {ITEM_TYPES[draft.category].map((type) => <option key={type}>{type}</option>)}
                  {!ITEM_TYPES[draft.category].includes(draft.type) ? <option>{draft.type}</option> : null}
                </select>
                <ChevronDown size={16} />
              </span>
            </label>

            <label className="field">
              <span>Primary color</span>
              <span className="select-wrap color-select-wrap">
                <i style={{ backgroundColor: COLORS.includes(draft.primaryColor) ? undefined : draft.primaryColor }} className={`color-dot color-${draft.primaryColor.toLowerCase()}`} />
                <select value={draft.primaryColor} onChange={(event) => set("primaryColor", event.target.value)}>
                  {COLORS.map((color) => <option key={color}>{color}</option>)}
                </select>
                <ChevronDown size={16} />
              </span>
            </label>

            <label className="field">
              <span>Size <small>optional</small></span>
              <input list="known-sizes" value={draft.size} onChange={(event) => set("size", event.target.value)} placeholder="e.g. M or 42 EU" />
              <datalist id="known-sizes">{suggestions.sizes.map((value) => <option key={value} value={value} />)}</datalist>
            </label>

            <label className="field">
              <span>Material <small>optional</small></span>
              <input list="known-materials" value={draft.material} onChange={(event) => set("material", event.target.value)} placeholder="e.g. Linen" />
              <datalist id="known-materials">{suggestions.materials.map((value) => <option key={value} value={value} />)}</datalist>
            </label>
          </div>
        </section>

        <section className="form-section">
          <div className="form-section-heading">
            <span className="form-step">03</span>
            <div><h2>How does it fit your life?</h2><p>Keep this quick — your first instinct is enough.</p></div>
          </div>

          <div className="field-grid">
            <fieldset className="field">
              <legend>Warmth</legend>
              <div className="segmented-control">
                {(["light", "medium", "heavy"] as WarmthLevel[]).map((value) => (
                  <button type="button" key={value} className={draft.warmthLevel === value ? "active" : ""} onClick={() => set("warmthLevel", value)}>{value}</button>
                ))}
              </div>
            </fieldset>

            <fieldset className="field">
              <legend>Formality</legend>
              <div className="score-picker">
                {[1, 2, 3, 4, 5].map((score) => (
                  <button type="button" key={score} className={draft.formalityScore === score ? "active" : ""} onClick={() => set("formalityScore", score)}>{score}</button>
                ))}
              </div>
              <div className="score-labels"><small>Relaxed</small><small>Formal</small></div>
            </fieldset>

            <fieldset className="field field-wide satisfaction-field">
              <legend>How do you feel wearing it? <small>optional</small></legend>
              <div className="rating-picker">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button type="button" key={rating} onClick={() => set("satisfactionRating", draft.satisfactionRating === rating ? 0 : rating)} aria-label={`${rating} stars`}>
                    <Star size={22} fill={rating <= draft.satisfactionRating ? "currentColor" : "none"} className={rating <= draft.satisfactionRating ? "filled" : ""} />
                  </button>
                ))}
                <span>{draft.satisfactionRating ? ["", "Not for me", "Mixed", "It's okay", "Really like it", "A favorite"][draft.satisfactionRating] : "Not rated yet"}</span>
              </div>
            </fieldset>

            <label className="attention-toggle field-wide">
              <input type="checkbox" checked={draft.needsAttention} onChange={(event) => set("needsAttention", event.target.checked)} />
              <span className="toggle"><i /></span>
              <span className="attention-toggle-icon"><AlertCircle size={18} /></span>
              <span><strong>This item needs attention</strong><small>Tailoring, repair, cleaning, or anything else to remember.</small></span>
            </label>
          </div>
        </section>

        <section className="form-section">
          <div className="form-section-heading">
            <span className="form-step">04</span>
            <div><h2>Shopping details</h2><p>Optional, but useful when you want context later.</p></div>
          </div>

          <div className="ownership-switch">
            {(["own", "want"] as OwnershipStatus[]).map((status) => (
              <button type="button" key={status} className={draft.ownershipStatus === status ? "active" : ""} onClick={() => setDraft((current) => ({ ...current, ownershipStatus: status, sourceStoreId: null, candidateStoreIds: [] }))}>
                <span>{status === "own" ? "I own this" : "I want this"}</span>
                <small>{status === "own" ? "Part of my closet now" : "Save it to my wishlist"}</small>
              </button>
            ))}
          </div>

          <div className="field-grid shopping-fields">
            <label className="field">
              <span>Price <small>optional</small></span>
              <span className="money-input"><i>EGP</i><input type="number" min="0" step="1" value={draft.price ?? ""} onChange={(event) => set("price", event.target.value ? Number(event.target.value) : null)} placeholder="0" /></span>
            </label>

            {draft.ownershipStatus === "own" ? (
              <label className="field">
                <span>Acquired date <small>optional</small></span>
                <input type="date" value={draft.acquiredDate} onChange={(event) => set("acquiredDate", event.target.value)} />
              </label>
            ) : null}

            <fieldset className={`field${draft.ownershipStatus === "want" ? " field-wide" : ""}`}>
              <legend>{sourceLabel} <small>optional</small></legend>
              {stores.length ? draft.ownershipStatus === "own" ? (
                <span className="select-wrap">
                  <select value={draft.sourceStoreId ?? ""} onChange={(event) => set("sourceStoreId", event.target.value || null)}>
                    <option value="">No store selected</option>
                    {stores.map((store) => <option value={store.id} key={store.id}>{store.name}</option>)}
                  </select><ChevronDown size={16} />
                </span>
              ) : (
                <div className="store-checks">
                  {stores.map((store) => {
                    const selected = draft.candidateStoreIds.includes(store.id);
                    return <button type="button" key={store.id} className={selected ? "active" : ""} onClick={() => set("candidateStoreIds", selected ? draft.candidateStoreIds.filter((id) => id !== store.id) : [...draft.candidateStoreIds, store.id])}>{selected ? <Check size={14} /> : <Plus size={14} />}{store.name}</button>;
                  })}
                </div>
              ) : <p className="field-help">Add a store first, then connect it here.</p>}
            </fieldset>
          </div>
        </section>

        <section className="form-section note-section">
          <div className="form-section-heading">
            <span className="form-step">05</span>
            <div><h2>Anything worth remembering?</h2><p>Fit notes, repairs, styling thoughts — anything goes.</p></div>
          </div>
          <label className="field">
            <textarea value={draft.note} onChange={(event) => set("note", event.target.value)} rows={4} placeholder="e.g. Looks best with a half tuck; sleeves need rolling once…" maxLength={600} />
            <small className="character-count">{draft.note.length}/600</small>
          </label>
        </section>
      </div>

      <aside className="form-sidebar">
        <div className="form-summary">
          <p className="eyebrow">Item summary</p>
          <div className="summary-image">
            {draft.photos[0] ? <img src={draft.photos[0]} alt="" /> : <Camera size={25} />}
          </div>
          <h3>{draft.name || `New ${draft.type.toLowerCase()}`}</h3>
          <p>{draft.primaryColor} · {draft.type}</p>
          <div className="summary-chips"><span>{draft.ownershipStatus === "own" ? "Owned" : "Wishlist"}</span><span>{draft.warmthLevel}</span><span>Formality {draft.formalityScore}/5</span></div>
          <div className="form-summary-actions">
            <Button type="submit" fullWidth disabled={saving || imageBusy}>{saving ? "Saving…" : item ? "Save changes" : "Add to wardrobe"}<Check size={16} /></Button>
            <button type="button" className="text-button" onClick={onCancel ?? (() => router.back())}><ArrowLeft size={15} /> Cancel</button>
          </div>
          <small className="autosave-note">Your changes are saved when you finish.</small>
        </div>
      </aside>

      <div className="mobile-form-bar">
        <button type="button" onClick={onCancel ?? (() => router.back())}>Cancel</button>
        <Button type="submit" disabled={saving || imageBusy}>{saving ? "Saving…" : item ? "Save changes" : "Add item"}</Button>
      </div>
    </form>
  );
}
