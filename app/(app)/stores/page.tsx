"use client";

import {
  ExternalLink,
  Globe2,
  MapPin,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Shirt,
  Store as StoreIcon,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { StoreForm } from "@/components/store-form";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useWardrobe } from "@/components/wardrobe-provider";
import type { Store } from "@/lib/types";

export default function StoresPage() {
  const { stores, items, deleteStore } = useWardrobe();
  const { notify } = useToast();
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Store | undefined>();
  const [viewing, setViewing] = useState<Store | undefined>();
  const [menu, setMenu] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Store | undefined>();

  const filtered = useMemo(() => stores.filter((store) => `${store.name} ${store.location} ${store.note}`.toLowerCase().includes(query.toLowerCase())), [query, stores]);
  const itemCount = (store: Store) => items.filter((item) => item.sourceStoreId === store.id || item.candidateStoreIds.includes(store.id)).length;

  const closeForm = () => { setFormOpen(false); setEditing(undefined); };
  const remove = async () => {
    if (!deleteTarget) return;
    try {
      await deleteStore(deleteTarget.id);
      notify("Store removed.");
      setDeleteTarget(undefined);
      setViewing(undefined);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not remove the store.", "error");
    }
  };

  return (
    <div className="page-stack stores-page">
      <PageHeader eyebrow="Your sources" title="Stores & brands" description="Remember where the good finds come from — and where to look next." action={<Button onClick={() => setFormOpen(true)}><Plus size={17} /> Add a store</Button>} />

      <div className="stores-summary">
        <div><span className="stat-icon sage"><StoreIcon size={19} /></span><span><strong>{stores.length}</strong><small>Saved places</small></span></div>
        <div><span className="stat-icon lilac"><Globe2 size={19} /></span><span><strong>{stores.filter((store) => store.type !== "physical").length}</strong><small>Shop online</small></span></div>
        <div><span className="stat-icon peach"><MapPin size={19} /></span><span><strong>{stores.filter((store) => store.type !== "online").length}</strong><small>Visit in person</small></span></div>
      </div>

      <label className="stores-search"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search stores, locations, or notes…" /></label>

      {filtered.length ? (
        <div className="stores-grid">
          {filtered.map((store) => {
            const count = itemCount(store);
            return (
              <article className="store-card" key={store.id}>
                <button className="store-card-main" onClick={() => setViewing(store)}>
                  <span className="store-image">{store.photo ? <img src={store.photo} alt="" /> : <StoreIcon size={28} />}</span>
                  <span className="store-card-copy">
                    <span className="store-type">{store.type === "both" ? "Online & physical" : store.type}</span>
                    <strong>{store.name}</strong>
                    <small>{store.location || store.url.replace(/^https?:\/\//, "") || "No location added"}</small>
                  </span>
                </button>
                <div className="store-card-footer">
                  <span><Shirt size={14} /> {count} {count === 1 ? "connected piece" : "connected pieces"}</span>
                  <div className="context-menu-wrap">
                    <button onClick={() => setMenu(menu === store.id ? null : store.id)} aria-label="Store options"><MoreHorizontal size={18} /></button>
                    {menu === store.id ? <div className="context-menu"><button onClick={() => { setEditing(store); setFormOpen(true); setMenu(null); }}><Pencil size={14} /> Edit</button>{store.url ? <a href={store.url} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Visit website</a> : null}<button className="danger" onClick={() => { setDeleteTarget(store); setMenu(null); }}><Trash2 size={14} /> Remove</button></div> : null}
                  </div>
                </div>
              </article>
            );
          })}
          <button className="add-store-card" onClick={() => setFormOpen(true)}><span><Plus size={21} /></span><strong>Add another place</strong><small>Brand, boutique, or favorite shop</small></button>
        </div>
      ) : (
        <EmptyState icon={stores.length ? Search : StoreIcon} title={stores.length ? "No stores match that search" : "Save your first good source"} copy={stores.length ? "Try a name, location, or something from your notes." : "Keep useful stores, brands, sizing notes, and links in one place."} action={!stores.length ? <Button onClick={() => setFormOpen(true)}><Plus size={16} /> Add a store</Button> : undefined} />
      )}

      <Modal open={formOpen} onClose={closeForm} title={editing ? `Edit ${editing.name}` : "Add a store or brand"} eyebrow={editing ? "Store details" : "A useful source"}>
        <StoreForm store={editing} onCancel={closeForm} onDone={() => closeForm()} />
      </Modal>

      <Modal open={Boolean(viewing)} onClose={() => setViewing(undefined)} title={viewing?.name ?? "Store"} eyebrow={viewing?.type === "both" ? "Online & physical" : viewing?.type}>
        {viewing ? <div className="store-detail-modal">
          <div className="store-detail-photo">{viewing.photo ? <img src={viewing.photo} alt={viewing.name} /> : <StoreIcon size={32} />}</div>
          {viewing.note ? <p className="store-quote">“{viewing.note}”</p> : null}
          <dl><div><dt><MapPin size={15} /> Location</dt><dd>{viewing.location || "Not added"}</dd></div><div><dt><Globe2 size={15} /> Website</dt><dd>{viewing.url ? <a href={viewing.url} target="_blank" rel="noreferrer">Visit website <ExternalLink size={13} /></a> : "Not added"}</dd></div><div><dt><Shirt size={15} /> Wardrobe</dt><dd>{itemCount(viewing)} connected pieces</dd></div></dl>
          <div className="modal-form-actions"><Button variant="secondary" onClick={() => { setEditing(viewing); setFormOpen(true); setViewing(undefined); }}><Pencil size={15} /> Edit</Button>{viewing.url ? <a className="button button-primary button-md" href={viewing.url} target="_blank" rel="noreferrer">Open store <ExternalLink size={14} /></a> : null}</div>
        </div> : null}
      </Modal>

      <Modal open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(undefined)} title="Remove this store?" eyebrow="Just checking" size="sm">
        <div className="confirm-dialog"><span className="confirm-icon"><Trash2 size={21} /></span><p><strong>{deleteTarget?.name}</strong> will be removed from your saved stores. Connected clothing stays in your closet.</p><div><Button variant="secondary" onClick={() => setDeleteTarget(undefined)}>Keep store</Button><Button variant="danger" onClick={() => void remove()}>Remove store</Button></div></div>
      </Modal>
    </div>
  );
}
