"use client";

import {
  CheckCircle2,
  ExternalLink,
  Eye,
  Globe2,
  Link2,
  LockKeyhole,
  MapPin,
  Search,
  Shirt,
  Sparkles,
  Star,
  Store as StoreIcon,
  ThermometerSun,
  Wrench,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ItemCard } from "@/components/closet/item-card";
import { Logo } from "@/components/logo";
import { OutfitPreview } from "@/components/outfits/outfit-preview";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { CATEGORIES, formatCategory, formatOccasion } from "@/lib/constants";
import { demoShareFromStorage, toSharedPayload } from "@/lib/sharing";
import type { Category, Item, Outfit, OwnershipStatus, Store, WardrobeData } from "@/lib/types";
import type { SharedWardrobe } from "@/lib/sharing";

type StatusFilter = "all" | OwnershipStatus;
type Section = "items" | "outfits" | "stores";

export default function SharedWardrobePage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [status, setStatus] = useState<"loading" | "ready" | "inactive" | "unconfigured">(
    "loading",
  );
  const [ownerName, setOwnerName] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [section, setSection] = useState<Section>("items");
  const [tab, setTab] = useState<StatusFilter>("all");
  const [category, setCategory] = useState<Category | "all">("all");
  const [query, setQuery] = useState("");
  const [storeQuery, setStoreQuery] = useState("");
  const [selected, setSelected] = useState<Item | null>(null);
  const [viewingStore, setViewingStore] = useState<Store | null>(null);
  const [activePhoto, setActivePhoto] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      let serverUnconfigured = false;
      try {
        const response = await fetch(`/api/share/${token}`);
        if (response.ok) {
          const payload = (await response.json()) as SharedWardrobe;
          if (!cancelled) {
            setOwnerName(payload.ownerName);
            setItems(payload.items);
            setOutfits(payload.outfits);
            setStores(payload.stores);
            setStatus("ready");
          }
          return;
        }
        serverUnconfigured = response.status === 503;
      } catch {
        // Fall through to the same-device demo preview below.
      }
      if (!cancelled) {
        const demo = demoShareFromStorage();
        if (demo && demo.token === token && demo.isEnabled) {
          try {
            const saved = window.localStorage.getItem("dolaby.wardrobe.v1");
            if (saved) {
              const data = JSON.parse(saved) as WardrobeData;
              const payload = toSharedPayload(data.items, data.outfits, data.stores);
              // Mirrors the demo profile name in WardrobeProvider.
              setOwnerName("Nour Hassan");
              setItems(payload.items);
              setOutfits(payload.outfits);
              setStores(payload.stores);
              setStatus("ready");
              return;
            }
          } catch {
            // Fall through below.
          }
        }
        setStatus(serverUnconfigured ? "unconfigured" : "inactive");
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const filtered = useMemo(() => {
    const result = items.filter((item) => {
      if (tab !== "all" && item.ownershipStatus !== tab) return false;
      if (category !== "all" && item.category !== category) return false;
      if (
        query &&
        !`${item.name} ${item.type} ${item.primaryColor} ${item.material}`
          .toLowerCase()
          .includes(query.toLowerCase())
      )
        return false;
      return true;
    });
    return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [category, items, query, tab]);

  const visibleStores = useMemo(() => {
    const needle = storeQuery.trim().toLowerCase();
    if (!needle) return stores;
    return stores.filter((store) =>
      `${store.name} ${store.location} ${store.note}`.toLowerCase().includes(needle),
    );
  }, [storeQuery, stores]);

  if (status === "loading") {
    return (
      <div className="app-loading">
        <Logo />
        <span className="loading-dot" />
      </div>
    );
  }

  if (status === "unconfigured") {
    return (
      <div className="share-page">
        <div className="share-shell">
          <div className="share-topbar">
            <Logo href="/" />
          </div>
          <EmptyState
            icon={Wrench}
            title="Sharing isn't set up yet"
            copy="This wardrobe's server is missing its sharing configuration. If you're the owner, add SUPABASE_SERVICE_ROLE_KEY to the server environment and restart the app."
            action={
              <Link className="button button-secondary button-md" href="/">
                Back to Dolaby
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  if (status === "inactive") {
    return (
      <div className="share-page">
        <div className="share-shell">
          <div className="share-topbar">
            <Logo href="/" />
          </div>
          <EmptyState
            icon={Link2}
            title="This link isn't active"
            copy="The owner may have turned sharing off or created a new link. Ask them for a fresh one."
            action={
              <Link className="button button-secondary button-md" href="/">
                Back to Dolaby
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const owned = items.filter((item) => item.ownershipStatus === "own").length;
  const wanted = items.filter((item) => item.ownershipStatus === "want").length;
  const outfitItems = (outfit: Outfit) =>
    outfit.itemIds
      .map((id) => items.find((item) => item.id === id))
      .filter((item): item is Item => Boolean(item));

  const openItem = (item: Item) => {
    setSelected(item);
    setActivePhoto(0);
  };

  return (
    <div className="share-page">
      <div className="share-shell">
        <div className="share-topbar">
          <Logo href="/" />
          <span className="share-badge">
            <Eye size={14} /> Read-only shared wardrobe
          </span>
        </div>

        <div className="share-hero">
          <div>
            <p className="eyebrow">Shared wardrobe</p>
            <h1>{ownerName}&rsquo;s closet</h1>
            <p>
              {owned} {owned === 1 ? "piece" : "pieces"} owned · {wanted} on the wishlist ·{" "}
              {outfits.length} {outfits.length === 1 ? "ready outfit" : "ready outfits"} ·{" "}
              {stores.length} {stores.length === 1 ? "store" : "stores"}
            </p>
          </div>
          <div className="share-count">
            <div>
              <strong>{items.length}</strong>
              <small>pieces</small>
            </div>
            <div>
              <strong>{outfits.length}</strong>
              <small>outfits</small>
            </div>
            <div>
              <strong>{stores.length}</strong>
              <small>stores</small>
            </div>
          </div>
        </div>

        <p className="share-note">
          <LockKeyhole size={16} /> You&apos;re viewing a read-only copy — nothing you do here
          changes {ownerName}&rsquo;s wardrobe.
        </p>

        <div className="closet-tabs" role="tablist">
          {(
            [
              ["items", "Closet", items.length],
              ["outfits", "Outfits", outfits.length],
              ["stores", "Stores", stores.length],
            ] as const
          ).map(([value, label, count]) => (
            <button
              key={value}
              className={section === value ? "active" : ""}
              onClick={() => setSection(value)}
            >
              {label}
              <span>{count}</span>
            </button>
          ))}
        </div>

        {section === "items" ? (
          <>
            <section className="closet-toolbar share-items-toolbar">
              <label className="closet-search">
                <Search size={18} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search pieces…"
                />
                {query ? (
                  <button onClick={() => setQuery("")} aria-label="Clear search">
                    <X size={15} />
                  </button>
                ) : null}
              </label>
              <fieldset className="field share-ownership">
                <legend>Show</legend>
                <div className="segmented-control" role="tablist" aria-label="Ownership filter">
                  {(
                    [
                      ["all", "Everything", items.length],
                      ["own", "Owns", owned],
                      ["want", "Wishlist", wanted],
                    ] as const
                  ).map(([value, label, count]) => (
                    <button
                      key={value}
                      type="button"
                      role="tab"
                      aria-selected={tab === value}
                      className={tab === value ? "active" : ""}
                      onClick={() => setTab(value)}
                    >
                      {label} · {count}
                    </button>
                  ))}
                </div>
              </fieldset>
            </section>

            <div className="category-filters">
              <button className={category === "all" ? "active" : ""} onClick={() => setCategory("all")}>
                All types
              </button>
              {CATEGORIES.map((entry) => (
                <button
                  key={entry.value}
                  className={category === entry.value ? "active" : ""}
                  onClick={() => setCategory(entry.value)}
                >
                  {entry.label}
                </button>
              ))}
            </div>

        <div className="collection-meta">
          <p>
            <strong>{filtered.length}</strong> {filtered.length === 1 ? "piece" : "pieces"}
          </p>
        </div>

        {filtered.length ? (
          <div className="item-grid">
            {filtered.map((item) => (
              <ItemCard key={item.id} item={item} selectable onSelect={() => openItem(item)} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={items.length ? Search : Shirt}
            title={items.length ? "No pieces match those filters" : "Nothing shared yet"}
            copy={
              items.length
                ? "Try widening your search or clearing the active filters."
                : `${ownerName} hasn't added any pieces to this shared wardrobe yet.`
            }
            action={
              items.length ? (
                <button
                  className="button button-secondary button-md"
                  onClick={() => {
                    setTab("all");
                    setCategory("all");
                    setQuery("");
                  }}
                >
                  Clear filters
                </button>
              ) : undefined
            }
          />
        )}
          </>
        ) : null}

        {section === "outfits" ? (
          outfits.length ? (
          <section className="dashboard-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Looks that work</p>
                <h2>Ready outfits</h2>
              </div>
            </div>
            <div className="outfits-grid">
              {outfits.map((outfit) => {
                const pieces = outfitItems(outfit);
                return (
                  <article className="outfit-card" key={outfit.id}>
                    <div className="outfit-card-preview">
                      <OutfitPreview items={pieces} />
                      <span className="outfit-state ready">
                        <CheckCircle2 size={12} /> Ready
                      </span>
                    </div>
                    <div className="outfit-card-copy">
                      <div>
                        <span className="occasion-label">{formatOccasion(outfit.occasion)}</span>
                        <h2>{outfit.name || "Untitled outfit"}</h2>
                        <p>
                          {pieces.length} {pieces.length === 1 ? "piece" : "pieces"}
                        </p>
                      </div>
                    </div>
                    <div className="outfit-piece-row">
                      {pieces.slice(0, 4).map((piece) => (
                        <span key={piece.id}>
                          {piece.photos[0] ? <img src={piece.photos[0]} alt="" /> : null}
                          <small>{piece.type}</small>
                        </span>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
          ) : (
            <EmptyState
              icon={Sparkles}
              title="No shared outfits yet"
              copy={`${ownerName} hasn't marked any outfit as ready yet.`}
            />
          )
        ) : null}

        {section === "stores" ? (
          <>
            <label className="stores-search">
              <Search size={18} />
              <input
                value={storeQuery}
                onChange={(event) => setStoreQuery(event.target.value)}
                placeholder="Search stores, locations, or notes…"
              />
              {storeQuery ? (
                <button onClick={() => setStoreQuery("")} aria-label="Clear search">
                  <X size={15} />
                </button>
              ) : null}
            </label>

            {visibleStores.length ? (
              <div className="stores-grid">
                {visibleStores.map((store) => (
                  <article className="store-card" key={store.id}>
                    <button className="store-card-main" onClick={() => setViewingStore(store)}>
                      <span className="store-image">
                        {store.photo ? <img src={store.photo} alt="" /> : <StoreIcon size={28} />}
                      </span>
                      <span className="store-card-copy">
                        <span className="store-type">
                          {store.type === "both" ? "Online & physical" : store.type}
                        </span>
                        <strong>{store.name}</strong>
                        <small>
                          {store.location || store.url.replace(/^https?:\/\//, "") || "No location added"}
                        </small>
                      </span>
                    </button>
                    <div className="store-card-footer">
                      <span>
                        <MapPin size={14} /> {store.location || "Online only"}
                      </span>
                      {store.url ? (
                        <a href={store.url} target="_blank" rel="noreferrer">
                          <ExternalLink size={14} /> Website
                        </a>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={stores.length ? Search : StoreIcon}
                title={stores.length ? "No stores match that search" : "No shared stores yet"}
                copy={
                  stores.length
                    ? "Try a name, location, or something from the notes."
                    : `${ownerName} hasn't shared any stores or brands yet.`
                }
                action={
                  stores.length ? (
                    <button
                      className="button button-secondary button-md"
                      onClick={() => setStoreQuery("")}
                    >
                      Clear search
                    </button>
                  ) : undefined
                }
              />
            )}
          </>
        ) : null}

        <Modal
          open={Boolean(selected)}
          onClose={() => setSelected(null)}
          title={selected ? selected.name || selected.type : ""}
          eyebrow={selected ? `${formatCategory(selected.category)} · ${selected.type}` : ""}
        >
          {selected ? (
            <div className="share-detail-modal">
              <div className="share-detail-photo">
                {selected.photos[activePhoto] ? (
                  <img src={selected.photos[activePhoto]} alt={selected.name || selected.type} />
                ) : (
                  <Shirt size={28} strokeWidth={1.4} />
                )}
              </div>
              {selected.photos.length > 1 ? (
                <div className="gallery-thumbs">
                  {selected.photos.map((photo, index) => (
                    <button
                      className={activePhoto === index ? "active" : ""}
                      key={index}
                      onClick={() => setActivePhoto(index)}
                    >
                      <img src={photo} alt="" />
                    </button>
                  ))}
                </div>
              ) : null}
              <div>
                <div className="detail-rating">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <Star
                      size={16}
                      key={value}
                      fill={value <= selected.satisfactionRating ? "currentColor" : "none"}
                    />
                  ))}
                  <span>
                    {selected.satisfactionRating
                      ? `${selected.satisfactionRating}/5 satisfaction`
                      : "Not rated yet"}
                  </span>
                </div>
                {selected.note ? <p className="detail-note">&ldquo;{selected.note}&rdquo;</p> : null}
                <dl className="detail-specs">
                  <div>
                    <dt>Color</dt>
                    <dd>
                      <span className={`color-dot color-${selected.primaryColor.toLowerCase()}`} />
                      {selected.primaryColor}
                    </dd>
                  </div>
                  <div>
                    <dt>Size</dt>
                    <dd>{selected.size || "Not set"}</dd>
                  </div>
                  <div>
                    <dt>Material</dt>
                    <dd>{selected.material || "Not set"}</dd>
                  </div>
                  <div>
                    <dt>Warmth</dt>
                    <dd>
                      <ThermometerSun size={15} /> {selected.warmthLevel}
                    </dd>
                  </div>
                  <div>
                    <dt>Formality</dt>
                    <dd>
                      <span className="mini-score">
                        {[1, 2, 3, 4, 5].map((score) => (
                          <i className={score <= selected.formalityScore ? "filled" : ""} key={score} />
                        ))}
                      </span>
                      {selected.formalityScore}/5
                    </dd>
                  </div>
                  <div>
                    <dt>Status</dt>
                    <dd>{selected.ownershipStatus === "own" ? "In the closet" : "On the wishlist"}</dd>
                  </div>
                </dl>
              </div>
            </div>
          ) : null}
        </Modal>

        <Modal
          open={Boolean(viewingStore)}
          onClose={() => setViewingStore(null)}
          title={viewingStore?.name ?? "Store"}
          eyebrow={
            viewingStore ? (viewingStore.type === "both" ? "Online & physical" : viewingStore.type) : ""
          }
        >
          {viewingStore ? (
            <div className="store-detail-modal">
              <div className="store-detail-photo">
                {viewingStore.photo ? (
                  <img src={viewingStore.photo} alt={viewingStore.name} />
                ) : (
                  <StoreIcon size={32} />
                )}
              </div>
              {viewingStore.note ? <p className="store-quote">&ldquo;{viewingStore.note}&rdquo;</p> : null}
              <dl>
                <div>
                  <dt>
                    <MapPin size={15} /> Location
                  </dt>
                  <dd>{viewingStore.location || "Not added"}</dd>
                </div>
                <div>
                  <dt>
                    <Globe2 size={15} /> Website
                  </dt>
                  <dd>
                    {viewingStore.url ? (
                      <a href={viewingStore.url} target="_blank" rel="noreferrer">
                        Visit website <ExternalLink size={13} />
                      </a>
                    ) : (
                      "Not added"
                    )}
                  </dd>
                </div>
              </dl>
              {viewingStore.url ? (
                <div className="modal-form-actions">
                  <a
                    className="button button-primary button-md"
                    href={viewingStore.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open store <ExternalLink size={14} />
                  </a>
                </div>
              ) : null}
            </div>
          ) : null}
        </Modal>
      </div>
    </div>
  );
}
