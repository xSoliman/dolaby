"use client";

import {
  BookHeart,
  CalendarDays,
  ChevronDown,
  Clock3,
  Plus,
  Shirt,
  Sparkles,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { OutfitPreview } from "@/components/outfits/outfit-preview";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useWardrobe } from "@/components/wardrobe-provider";
import { FEELINGS, formatOccasion, OCCASIONS } from "@/lib/constants";
import { today } from "@/lib/format";
import type { Feeling, Occasion, WearEntryDraft } from "@/lib/types";

export default function DiaryPage() {
  const { wearEntries, outfits, items, deleteWearEntry } = useWardrobe();
  const { notify } = useToast();
  const [logOpen, setLogOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("log") === "true") setLogOpen(true);
  }, []);

  const itemIdsForEntry = (entry: (typeof wearEntries)[number]) => {
    const outfit = outfits.find((candidate) => candidate.id === entry.outfitId);
    return outfit?.itemIds ?? entry.itemIds;
  };

  const mostWorn = useMemo(() => {
    const counts = new Map<string, number>();
    wearEntries.forEach((entry) =>
      itemIdsForEntry(entry).forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1)),
    );
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    return top ? { item: items.find((item) => item.id === top[0]), count: top[1] } : null;
    // itemIdsForEntry is intentionally based on the current collections.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, outfits, wearEntries]);

  const thisMonth = wearEntries.filter((entry) => entry.date.startsWith(today().slice(0, 7))).length;
  const positive = wearEntries.filter((entry) => entry.feeling === "confident" || entry.feeling === "good").length;
  const grouped = wearEntries.reduce<Record<string, typeof wearEntries>>((groups, entry) => {
    const label = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(new Date(`${entry.date}T12:00:00`));
    (groups[label] ||= []).push(entry);
    return groups;
  }, {});

  const remove = async () => {
    if (!deleting) return;
    try { await deleteWearEntry(deleting); notify("Wear entry removed."); setDeleting(null); }
    catch (error) { notify(error instanceof Error ? error.message : "Could not remove this entry.", "error"); }
  };

  return (
    <div className="page-stack diary-page">
      <PageHeader eyebrow="Your feedback loop" title="Wear diary" description="Remember what you wore — and, more importantly, how it felt." action={<Button onClick={() => setLogOpen(true)}><Plus size={17} /> Log a wear</Button>} />

      <section className="diary-stats">
        <article><span className="stat-icon sage"><CalendarDays size={19} /></span><div><small>This month</small><strong>{thisMonth} wears</strong><p>{thisMonth ? "A real picture is taking shape." : "Your next wear starts the pattern."}</p></div></article>
        <article><span className="stat-icon peach"><TrendingUp size={19} /></span><div><small>Feeling good</small><strong>{wearEntries.length ? Math.round((positive / wearEntries.length) * 100) : 0}%</strong><p>Confident or good entries.</p></div></article>
        <article><span className="stat-icon lilac"><Shirt size={19} /></span><div><small>Most repeated</small><strong>{mostWorn?.item?.name || mostWorn?.item?.type || "Not enough data"}</strong><p>{mostWorn ? `${mostWorn.count} logged ${mostWorn.count === 1 ? "wear" : "wears"}.` : "Log a few days to find out."}</p></div></article>
      </section>

      <section className="diary-content">
        <div className="diary-timeline-head"><div><p className="eyebrow">Wear history</p><h2>Your recent days</h2></div><span><Clock3 size={15} /> Newest first</span></div>
        {wearEntries.length ? Object.entries(grouped).map(([month, entries]) => (
          <div className="diary-month" key={month}>
            <div className="month-marker"><span>{month}</span><i /></div>
            <div className="wear-entry-list">
              {entries.map((entry) => {
                const outfit = outfits.find((candidate) => candidate.id === entry.outfitId);
                const pieces = itemIdsForEntry(entry).map((id) => items.find((item) => item.id === id)).filter((item) => item !== undefined);
                const feeling = FEELINGS.find((option) => option.value === entry.feeling);
                return (
                  <article className="wear-entry-card" key={entry.id}>
                    <div className="wear-day"><strong>{new Date(`${entry.date}T12:00:00`).getDate()}</strong><small>{new Intl.DateTimeFormat("en", { weekday: "short" }).format(new Date(`${entry.date}T12:00:00`))}</small></div>
                    <div className="wear-entry-preview"><OutfitPreview items={pieces} /></div>
                    <div className="wear-entry-copy"><span className="occasion-label">{formatOccasion(entry.occasion)}</span><h3>{outfit?.name || "Custom combination"}</h3><p>{entry.note || "No note from this day."}</p><div className="wear-piece-names">{pieces.slice(0, 4).map((piece) => <span key={piece.id}>{piece.type}</span>)}</div></div>
                    <div className="wear-entry-feeling"><span className={`feeling-symbol feeling-${entry.feeling}`}>{feeling?.emoji}</span><strong>{feeling?.label}</strong><button onClick={() => setDeleting(entry.id)} aria-label="Remove diary entry"><Trash2 size={15} /></button></div>
                  </article>
                );
              })}
            </div>
          </div>
        )) : <EmptyState icon={BookHeart} title="Your diary starts with one real day" copy="Log what you wore and a quick feeling. Patterns will emerge without extra work." action={<Button onClick={() => setLogOpen(true)}><Plus size={16} /> Log today</Button>} />}
      </section>

      <section className="diary-reflection"><span><Sparkles size={20} /></span><div><p className="eyebrow">Why feelings matter</p><h2>The best wardrobe isn&apos;t the biggest. It&apos;s the one that feels like you.</h2><p>Short, honest notes become useful evidence for future shopping and outfit decisions.</p></div></section>

      <Modal open={logOpen} onClose={() => setLogOpen(false)} title="What did you wear?" eyebrow="A quick entry" size="lg">
        <WearLogForm onCancel={() => setLogOpen(false)} onDone={() => setLogOpen(false)} />
      </Modal>

      <Modal open={Boolean(deleting)} onClose={() => setDeleting(null)} title="Remove this diary entry?" eyebrow="Just checking" size="sm">
        <div className="confirm-dialog"><span className="confirm-icon"><Trash2 size={21} /></span><p>This day will be removed from your wear history. Your outfit and clothing items will stay.</p><div><Button variant="secondary" onClick={() => setDeleting(null)}>Keep entry</Button><Button variant="danger" onClick={() => void remove()}>Remove entry</Button></div></div>
      </Modal>
    </div>
  );
}

function WearLogForm({ onCancel, onDone }: { onCancel: () => void; onDone: () => void }) {
  const { outfits, items, addWearEntry } = useWardrobe();
  const { notify } = useToast();
  const readyOutfits = outfits.filter((outfit) => !outfit.isDraft);
  const [draft, setDraft] = useState<WearEntryDraft>({ date: today(), occasion: "casual", outfitId: readyOutfits[0]?.id ?? null, itemIds: [], feeling: "good", note: "" });
  const [mode, setMode] = useState<"outfit" | "items">(readyOutfits.length ? "outfit" : "items");
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof WearEntryDraft>(key: K, value: WearEntryDraft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (mode === "outfit" && !draft.outfitId) { notify("Choose an outfit to log.", "error"); return; }
    if (mode === "items" && !draft.itemIds.length) { notify("Choose at least one piece.", "error"); return; }
    setSaving(true);
    try { await addWearEntry({ ...draft, outfitId: mode === "outfit" ? draft.outfitId : null, itemIds: mode === "items" ? draft.itemIds : [] }); notify("Wear added to your diary."); onDone(); }
    catch (error) { notify(error instanceof Error ? error.message : "Could not save this wear.", "error"); }
    finally { setSaving(false); }
  };

  return (
    <form className="wear-log-form" onSubmit={submit}>
      <div className="wear-basics">
        <label className="field"><span>Date</span><input type="date" value={draft.date} onChange={(event) => set("date", event.target.value)} required /></label>
        <label className="field"><span>Occasion</span><span className="select-wrap"><select value={draft.occasion} onChange={(event) => set("occasion", event.target.value as Occasion)}>{OCCASIONS.map((entry) => <option key={entry.value} value={entry.value}>{entry.label}</option>)}</select><ChevronDown size={16} /></span></label>
      </div>
      <fieldset className="field"><legend>What did you wear?</legend><div className="auth-tabs wear-mode-tabs"><button type="button" className={mode === "outfit" ? "active" : ""} onClick={() => setMode("outfit")}>A saved outfit</button><button type="button" className={mode === "items" ? "active" : ""} onClick={() => setMode("items")}>Choose pieces</button></div></fieldset>
      {mode === "outfit" ? <div className="wear-outfit-options">{readyOutfits.length ? readyOutfits.map((outfit) => { const pieces = outfit.itemIds.map((id) => items.find((item) => item.id === id)).filter((item) => item !== undefined); return <button type="button" key={outfit.id} className={draft.outfitId === outfit.id ? "active" : ""} onClick={() => set("outfitId", outfit.id)}><OutfitPreview items={pieces} /><span><strong>{outfit.name || "Untitled outfit"}</strong><small>{formatOccasion(outfit.occasion)} · {pieces.length} pieces</small></span>{draft.outfitId === outfit.id ? <i>✓</i> : null}</button>; }) : <p className="field-help">You don&apos;t have a ready outfit yet. Choose individual pieces instead.</p>}</div> : <div className="wear-item-options">{items.filter((item) => item.ownershipStatus === "own").map((item) => { const active = draft.itemIds.includes(item.id); return <button type="button" className={active ? "active" : ""} key={item.id} onClick={() => set("itemIds", active ? draft.itemIds.filter((id) => id !== item.id) : [...draft.itemIds, item.id])}><span>{item.photos[0] ? <img src={item.photos[0]} alt="" /> : <Shirt size={18} />}</span><small>{item.name || item.type}</small>{active ? <i>✓</i> : null}</button>; })}</div>}
      <fieldset className="field feeling-field"><legend>How did you feel?</legend><div className="feeling-options">{FEELINGS.map((feeling) => <button type="button" key={feeling.value} className={draft.feeling === feeling.value ? "active" : ""} onClick={() => set("feeling", feeling.value as Feeling)}><span>{feeling.emoji}</span><strong>{feeling.label}</strong></button>)}</div></fieldset>
      <label className="field"><span>A quick note <small>optional</small></span><textarea rows={3} value={draft.note} onChange={(event) => set("note", event.target.value)} placeholder="What worked? What felt off?" /></label>
      <div className="modal-form-actions"><Button variant="secondary" onClick={onCancel}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? "Saving…" : "Add to diary"}<BookHeart size={16} /></Button></div>
    </form>
  );
}
