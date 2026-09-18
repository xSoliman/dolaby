"use client";

import {
  AlertTriangle,
  ArrowRight,
  BookHeart,
  CalendarDays,
  Heart,
  Plus,
  Shirt,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useWardrobe } from "@/components/wardrobe-provider";
import { ItemImage } from "@/components/item-image";
import { formatOccasion } from "@/lib/constants";
import { formatDate } from "@/lib/format";

export default function HomePage() {
  const { profile, items, outfits, wearEntries } = useWardrobe();
  const firstName = profile?.name.split(" ")[0] ?? "there";
  const owned = items.filter((item) => item.ownershipStatus === "own" && !item.isArchived);
  const wishlist = items.filter((item) => item.ownershipStatus === "want" && !item.isArchived);
  const attention = owned.filter((item) => item.needsAttention);
  const activeOutfits = outfits.filter((outfit) => !outfit.isArchived);
  const featured = activeOutfits.find((outfit) => !outfit.isDraft) ?? activeOutfits[0];
  const featuredItems = featured
    ? featured.itemIds.map((id) => items.find((item) => item.id === id)).filter(Boolean)
    : [];
  const recent = [...items].filter((item) => !item.isArchived).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4);
  const lastWear = wearEntries[0];
  const lastOutfit = outfits.find((outfit) => outfit.id === lastWear?.outfitId);

  return (
    <div className="page-stack dashboard-page">
      <header className="dashboard-greeting">
        <div>
          <p className="eyebrow">Friday, 21 August</p>
          <h1>Good morning, {firstName}.</h1>
          <p>Your wardrobe is ready when you are.</p>
        </div>
        <Link href="/closet/new" className="button button-primary button-md">
          <Plus size={17} /> Add item
        </Link>
      </header>

      <section className="dashboard-grid">
        <article className="today-card">
          <div className="today-card-copy">
            <span className="section-kicker"><Sparkles size={14} /> A saved look for today</span>
            {featured ? (
              <>
                <h2>{featured.name || "Untitled outfit"}</h2>
                <p>{formatOccasion(featured.occasion)} · {featured.itemIds.length} pieces</p>
                <div className="today-actions">
                  <Link className="button button-primary button-md" href="/diary?log=true">
                    Wear this today <ArrowRight size={16} />
                  </Link>
                  <Link href="/outfits" className="text-link">See all outfits</Link>
                </div>
              </>
            ) : (
              <>
                <h2>Build your first outfit</h2>
                <p>Bring a few favorite pieces together for an easier morning.</p>
                <Link className="button button-primary button-md" href="/outfits/new">Start building</Link>
              </>
            )}
          </div>
          <div className="today-outfit-preview">
            {featuredItems.slice(0, 3).map((item, index) => item ? (
              <div className={`today-piece piece-${index + 1}`} key={item.id}>
                <ItemImage src={item.photos[0]} alt={item.name || item.type} />
              </div>
            ) : null)}
            <span className="occasion-stamp">{featured ? formatOccasion(featured.occasion) : "New look"}</span>
          </div>
        </article>

        <aside className="wardrobe-pulse">
          <div className="section-heading compact">
            <div><span className="section-kicker">Wardrobe pulse</span><h2>At a glance</h2></div>
          </div>
          <div className="pulse-stats">
            <Link href="/closet">
              <span className="stat-icon sage"><Shirt size={18} /></span>
              <span><strong>{owned.length}</strong><small>Pieces owned</small></span>
              <ArrowRight size={15} />
            </Link>
            <Link href="/outfits">
              <span className="stat-icon peach"><Sparkles size={18} /></span>
              <span><strong>{activeOutfits.filter((outfit) => !outfit.isDraft).length}</strong><small>Ready outfits</small></span>
              <ArrowRight size={15} />
            </Link>
            <Link href="/closet?status=want">
              <span className="stat-icon lilac"><Heart size={18} /></span>
              <span><strong>{wishlist.length}</strong><small>On your wishlist</small></span>
              <ArrowRight size={15} />
            </Link>
          </div>
          {attention.length ? (
            <Link href="/closet?attention=true" className="attention-note">
              <AlertTriangle size={17} />
              <span><strong>{attention.length} {attention.length === 1 ? "piece needs" : "pieces need"} attention</strong><small>A little care keeps favorites going.</small></span>
              <ArrowRight size={15} />
            </Link>
          ) : null}
        </aside>
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <span className="section-kicker">Recently added</span>
            <h2>New in your closet</h2>
          </div>
          <Link href="/closet" className="text-link">View the whole closet <ArrowRight size={15} /></Link>
        </div>
        <div className="recent-strip">
          {recent.map((item) => (
            <Link href={`/closet/${item.id}`} className="recent-item" key={item.id}>
              <ItemImage src={item.photos[0]} alt={item.name || item.type} />
              <span><strong>{item.name || item.type}</strong><small>{item.type} · {item.primaryColor}</small></span>
            </Link>
          ))}
          <Link href="/closet/new" className="recent-add">
            <span><Plus size={21} /></span>
            <strong>Add another piece</strong>
            <small>It takes about a minute</small>
          </Link>
        </div>
      </section>

      <section className="dashboard-lower-grid">
        <article className="last-wear-card">
          <div className="section-heading compact">
            <div><span className="section-kicker">Last worn</span><h2>Your latest entry</h2></div>
            <CalendarDays size={19} />
          </div>
          {lastWear ? (
            <div className="last-wear-content">
              <div className="mini-outfit-stack">
                {(lastOutfit?.itemIds ?? lastWear.itemIds).slice(0, 3).map((id, index) => {
                  const item = items.find((entry) => entry.id === id);
                  return item ? <ItemImage key={id} src={item.photos[0]} alt="" className={`stack-${index}`} /> : null;
                })}
              </div>
              <div>
                <p className="wear-date">{formatDate(lastWear.date, { weekday: "long", month: "short", day: "numeric" })}</p>
                <h3>{lastOutfit?.name || "A custom combination"}</h3>
                <p className="wear-note">“{lastWear.note || "No note added."}”</p>
                <span className={`feeling-pill feeling-${lastWear.feeling}`}>{lastWear.feeling.replace("_", " ")}</span>
              </div>
            </div>
          ) : (
            <div className="inline-empty"><BookHeart size={23} /><p>Log a wear to start learning what feels best.</p></div>
          )}
          <Link href="/diary" className="card-footer-link">Open wear diary <ArrowRight size={15} /></Link>
        </article>

        <article className="intent-card">
          <span className="intent-orbit orbit-one" />
          <span className="intent-orbit orbit-two" />
          <div className="intent-icon"><Sparkles size={22} /></div>
          <div>
            <span className="section-kicker">A small intention</span>
            <h2>Wear what already feels like you.</h2>
            <p>Your highest-rated pieces are a good place to begin when the morning feels busy.</p>
          </div>
          <Link href="/closet?rating=5">See your favorites <ArrowRight size={15} /></Link>
        </article>
      </section>
    </div>
  );
}
