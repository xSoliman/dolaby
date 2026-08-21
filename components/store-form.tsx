"use client";

import { Camera, ChevronDown, ImagePlus, X } from "lucide-react";
import { FormEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useWardrobe } from "@/components/wardrobe-provider";
import { prepareImage } from "@/lib/images";
import type { Store, StoreDraft, StoreType } from "@/lib/types";

const blank: StoreDraft = { name: "", type: "both", url: "", location: "", photo: "", note: "" };

export function StoreForm({ store, onDone, onCancel }: {
  store?: Store;
  onDone: (store: Store) => void;
  onCancel: () => void;
}) {
  const { addStore, updateStore } = useWardrobe();
  const { notify } = useToast();
  const [draft, setDraft] = useState<StoreDraft>(store ? {
    name: store.name, type: store.type, url: store.url, location: store.location, photo: store.photo, note: store.note,
  } : blank);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const saved = store ? await updateStore(store.id, draft) : await addStore(draft);
      notify(store ? "Store updated." : "Store added.");
      onDone(saved);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not save this store.", "error");
    } finally {
      setSaving(false);
    }
  };

  const choosePhoto = async (file?: File) => {
    if (!file) return;
    try {
      setDraft((current) => ({ ...current, photo: "" }));
      const photo = await prepareImage(file, 1200);
      setDraft((current) => ({ ...current, photo }));
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not read that image.", "error");
    }
  };

  return (
    <form className="store-form" onSubmit={submit}>
      <div className="store-photo-field">
        {draft.photo ? (
          <div className="store-photo-preview"><img src={draft.photo} alt="Store preview" /><button type="button" onClick={() => setDraft((current) => ({ ...current, photo: "" }))}><X size={15} /></button><span>Store image</span></div>
        ) : (
          <button type="button" onClick={() => fileRef.current?.click()}><span><Camera size={22} /></span><strong>Add a photo or logo</strong><small>Optional · square works best</small><i><ImagePlus size={14} /> Choose image</i></button>
        )}
        <input ref={fileRef} hidden type="file" accept="image/*" onChange={(event) => void choosePhoto(event.target.files?.[0])} />
      </div>

      <div className="field-grid">
        <label className="field field-wide"><span>Store or brand name</span><input required autoFocus value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder="e.g. COS" /></label>
        <label className="field"><span>Type</span><span className="select-wrap"><select value={draft.type} onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value as StoreType }))}><option value="online">Online</option><option value="physical">Physical</option><option value="both">Online & physical</option></select><ChevronDown size={16} /></span></label>
        <label className="field"><span>Website <small>optional</small></span><input type="url" value={draft.url} onChange={(event) => setDraft((current) => ({ ...current, url: event.target.value }))} placeholder="https://…" /></label>
        <label className="field field-wide"><span>Location <small>optional</small></span><input value={draft.location} onChange={(event) => setDraft((current) => ({ ...current, location: event.target.value }))} placeholder="City, mall, or address" /></label>
        <label className="field field-wide"><span>Notes <small>optional</small></span><textarea rows={3} value={draft.note} onChange={(event) => setDraft((current) => ({ ...current, note: event.target.value }))} placeholder="What is this place good for? Anything to remember about sizing or sales?" /></label>
      </div>
      <div className="modal-form-actions"><Button variant="secondary" onClick={onCancel}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? "Saving…" : store ? "Save changes" : "Add store"}</Button></div>
    </form>
  );
}
