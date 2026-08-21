# Digital Wardrobe — v1 Design Document

## 1. Problem Statement

Two goals sit at the center of this system, and both matter equally:

- **Organization and awareness** — having a real, structured, visual record of the clothing life: what's owned, its condition, where it came from, what's still wanted. Right now this awareness doesn't exist in any explicit form.
- **Decision fatigue and lack of intentional style direction** — clothes get worn randomly (whatever's in front of you), which leads to dissatisfaction at key moments: mornings and important events.

The system is meant to explicitly manage the clothing life end-to-end, not just serve as a means to fix the decision-fatigue symptom.

**Goal of v1:** Build the foundation — a structured record of items and stores — that provides organization/awareness immediately, and later enables outfit-building, gap analysis, and a "what should I wear" decision layer. v1 is intentionally scoped to data capture + manual outfit assembly, not smart suggestions.

**Guiding principle:** At the moment of getting dressed, the system must reduce decisions, not add them. Every feature is judged against this. Data entry must stay fast and low-friction, or the system dies in week two.

---

## 2. Core Entities (v1)

### 2.1 User
Added because the app will support multiple people (e.g. sharing with friends, each with their own private wardrobe).

**Fields:**
- `name`
- `email`
- `password` (hashed) — or OAuth-based auth, decide at build time
- `created_at`

**Note:** Every other entity below (Item, Store, Outfit, Wear Entry) belongs to a User via a `user_id` reference. Default assumption: each user's wardrobe is private to them — "sharing with friends" means friends get their own accounts/closets, not shared visibility into yours. Flag this if you actually want shared/visible closets — that's a different feature (permissions, following, etc.).

---

### 2.2 Item
The atomic unit of the system. Represents a single physical piece of clothing/accessory — owned or wanted.

**Structured fields (load-bearing, typed):**
- `name` — optional. Lets you refer to "the wedding blazer" instead of only browsing visually.
- `category` — top / bottom / outerwear / shoes / accessory (enum)
- `type` — e.g. t-shirt, dress shirt, blazer (enum, dependent on `category`) *(renamed from "subcategory")*
- `primary_color` (enum or simple string)
- `size` — free string (covers S/M/L, numeric, EU sizing, etc. — too inconsistent across categories to force into a strict enum)
- `material` — free string (covers blends like "60% cotton, 40% poly" without fighting an enum)
- `formality_score` — numeric scale (e.g. 1–5) for flexible outfit logic
- `warmth_level` — numeric scale or enum (light / medium / heavy)
- `ownership_status` — own / want *(renamed from "status" for clarity)*
- `needs_attention` — boolean. Generic flag for any condition issue (tailoring, repair, missing button, etc.) — specifics go in the `note` field rather than expanding this into a status list.
- `satisfaction_rating` — how you feel wearing it (seeded manually at first, later informed by the Wear Entry log)

**Shopping-related fields:**
- `price`
- `acquired_date` — *(renamed from "purchase_date")*. Applies mainly to owned items; can stay empty for "want" items.
- `source` — relation to **Store** entity. *(Brand and Store merged — see Store entity below.)*

**Flexible field:**
- `note` — free text. Replaces a formal tag system for v1.

**Media:**
- `photos` — **multi-valued**. Array of file/blob references, not stored directly in the database.

**UI behavior — value memory/autocomplete:** `size`, `material`, and `brand` stay plain strings (not enums), but the add/edit form should suggest previously-entered values for these fields as you type (i.e. autocomplete from distinct values already in your own data). No new entity needed — just a lookup query against existing entries. Keeps entry fast while nudging toward consistent values over time (e.g. always "Cotton" instead of a mix of "cotton"/"Cotton"/"100% cotton").

**Deferred to later versions:** structured tags/taxonomy, item variants (color variants of the same piece — each physical item is its own row for now), pairing/relationship data between items (can emerge from Outfits later).

---

### 2.3 Store
Represents a place (physical or online) and/or brand you buy from or are considering buying from. **Brand and Store are merged into one entity** — for personal wardrobe purposes, "who made it" and "where I got it" are usually the same mental bucket. Edge cases (multi-brand retailer) can be handled via the `note` field.

**Fields:**
- `name`
- `type` — online / physical / both (optional, could be a note instead)
- `url` — optional, for online stores
- `location` — address/city, mainly relevant for physical stores
- `photo` — single image (e.g. storefront, logo)
- `note` — free text ("good for basics," "sizing runs small," "check sale section seasonally")

**Relationship to Item:**
- For `ownership_status: want` items — a many-to-many-friendly relationship (an item can have a few candidate stores you're considering).
- For `ownership_status: own` items — simpler, one store as historical "where I got it" reference.

---

### 2.4 Outfit
A set of items assembled together. Manual in v1 — no auto-generation.

**Fields:**
- `items` — relation to multiple Items
- `name` — optional
- `occasion` — **enum** (see note below), not a separate entity
- `is_draft` — boolean (draft vs. finalized/approved combo)

**Occasion as enum, not entity:** e.g. `work`, `casual`, `date_night`, `event`, `gym`. Right now Occasion has no data of its own (no notes, no relations) — it's just a label, so a fixed enum does the job without extra complexity. Worth revisiting as a full entity later *only if* the future "target wardrobe" gap-analysis feature needs per-occasion planning data (e.g. "event outfits need 1 blazer, 2 shirts...").

---

### 2.5 Wear Entry
*(Renamed from "Log Entry" — names the actual action, not a generic label. Alternative naming considered: "Style Diary," if you want a more reflective/journal feel instead of transactional.)*

Small but central — the feedback loop that turns vague dissatisfaction into real data over time.

**Fields:**
- `date`
- `occasion` — enum, same list as Outfit
- `outfit` — relation to Outfit (or items directly, if no outfit was pre-built)
- `feeling` — quick rating/note on how it felt (e.g. confident / neutral / self-conscious)

---

## 3. Explicitly Deferred (Not in v1)

- Structured tag system (replaced by free-text `note` for now; revisit once real usage shows which descriptors are actually reused often)
- Item variants (same item in multiple colors) — model each physical piece as its own row
- Occasion as a full entity with its own planning data
- Occasion-based target wardrobe / gap analysis logic
- "What should I wear" auto-suggestion
- AI-generated outfit combinations
- Shared/visible closets between users (v1 assumes private wardrobes per user)

---

## 4. Future Features — Parking Lot (Not v1, Don't Forget)

- **Care subsystem** — how to care for / store each item, and general material care guidance (e.g. "dry clean only," "hand wash," "store folded not hung")
- **Shopping subsystem** — how/where to buy planned items, possibly tied into the Store entity and the future gap-analysis feature

---

## 5. Architecture Notes

- **App type:** Multi-user web app with authentication (supports sharing the app with friends, each with their own private wardrobe by default).
- **Database:** Relational (Postgres recommended given multi-user + many-to-many relations: Item↔Store, Outfit↔Item, User↔everything).
- **Images:** Stored as files/blob storage, referenced by path/URL in the DB — not stored as binary in the database itself. Item photos are multi-valued; Store photo is single-valued.
- **No AI in v1.** Manual outfit building first; smarter suggestions later, once there's real logged data to base them on.

### 5.1 Chosen Tech Stack

- **Frontend + Backend:** Next.js (React) — one codebase covering both UI and API routes, which keeps a solo/small build simple (single deploy target, no separate backend service needed for v1).
- **Database, Auth, and File Storage:** Supabase — Postgres-based, with authentication and object storage bundled in. Covers three of the app's core infra needs (relational DB, multi-user auth, item/store photo storage) from one provider, minimizing setup for v1.
- **Hosting:** Vercel — pairs natively with Next.js, zero-config deploys.

**Cost note:** This stack is free for personal/friends-scale use (Supabase free tier: ~500MB DB, ~1GB file storage, 50K MAUs; Vercel Hobby: free for non-commercial use). Two practical things to watch as usage grows:
- Supabase's file storage limit is the tightest constraint for a photo-heavy app — keep item/store photos compressed/resized on upload.
- Free Supabase projects auto-pause after 7 days of inactivity and require a manual unpause (or a lightweight scheduled ping to prevent it).

If storage ever becomes a bottleneck, item/store photos could be moved to a dedicated object storage provider (e.g. Cloudflare R2) while keeping Supabase for DB + Auth — a swap, not a redesign.

---

## 6. Build Order (v1)

1. **User model + authentication** — needed from the start now that it's multi-user.
2. **Item model + fast add-item flow** — photo(s) + core structured fields; note field optional.
3. **Store model + simple add-store flow.**
4. **Closet grid/browse view** — visualizing the collected items has standalone value even before outfits exist.
5. **Manual Outfit builder** — assemble items into outfits, tag with an occasion (enum).
6. **Wear Entry** — record what was worn and how it felt. Cheap to build, high payoff.
7. *(Post-v1)* Occasion-based target wardrobe + gap analysis, using Store relations to make the gap list actionable.
8. *(Post-v1)* "What should I wear" suggestion logic, informed by real logged data rather than assumptions.
9. *(Post-v1)* Care subsystem, Shopping subsystem.

---

## 7. Design Principles Recap

- Optimize for the "getting dressed" decision moment — build backward from that need.
- Keep the core schema small and boring at first; resist adding entities that are really just attributes.
- Prefer structured fields for anything you'll filter/sort/query reliably; use free text as the escape hatch for everything else.
- Let real usage data (via the Wear Entry) inform future features (tags, target wardrobes, suggestions) rather than guessing upfront.
