# Dolaby

Dolaby is a calm, private digital wardrobe for cataloging clothes, saving manual outfits, remembering useful stores, and recording how each wear felt.

The implementation follows `dolaby-requirements-v1.md`: Next.js handles the product and authentication UI, Supabase provides Postgres/Auth/private object storage, and the repository is ready for a Vercel deployment.

## What is included

- Email/password authentication and account creation through Supabase
- Private, multi-user data enforced with row-level security
- A fast item form with dependent categories/types, remembered size and material values, multi-photo upload, ownership state, rating, care flag, store relationships, and shopping details
- Visual closet search, category/status filters, wishlist, favorites, and care views
- Store and brand CRUD with a single private image
- Manual outfit builder with drafts and ready looks
- Wear diary with saved-outfit or ad-hoc item logging and quick feeling feedback
- Read-only wardrobe sharing through a revocable link (`/s/[token]`)
- Responsive desktop/mobile layouts
- Browser-persistent demo mode for trying every flow without infrastructure

## Run locally

Requirements: Node.js 20+ and npm.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Without environment variables, Dolaby starts in demo mode. Every demo change is stored in local storage and can be reset from Settings.

## Connect Supabase

1. Create a Supabase project.
2. Open its SQL editor and run [`supabase/schema.sql`](./supabase/schema.sql). This creates the enums, relational tables, indexes, new-user profile trigger, row-level-security policies, and private `wardrobe-media` bucket.
3. Copy `.env.example` to `.env.local` and fill in the project URL and anonymous key:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

   The service-role key stays on the server and powers the read-only share-link
   API (`/api/share/[token]`). Without it, share links return a
   “not configured” message; everything else keeps working.

4. In Supabase Authentication → URL Configuration, set the Site URL to your local or production URL and add `/auth/callback` as an allowed redirect path.
5. Restart the dev server. The sign-in and create-account forms will now use Supabase; the demo remains available as a separate option.

For an existing database, do not rerun the full schema. Apply new SQL files from [`supabase/migrations`](./supabase/migrations) in timestamp order.

Item uploads are resized in the browser to a maximum 1600px edge and encoded as JPEG before entering the private bucket. Database records store only storage paths; the UI creates one-hour signed URLs for display.

## Sharing

Settings → Sharing creates one read-only link per wardrobe (`/s/[token]`). Viewers
see pieces, ready outfits, and stores with photos across Closet/Outfits/Stores
tabs; the wear diary and shopping details stay private. The owner can turn the link off or generate a new one at
any time, which immediately invalidates the old link. In demo mode the link
previews the demo wardrobe on the same device only.

## Quality checks

```bash
npm run typecheck
npm run lint
npm run build
```

## Deploy

Import the repository into Vercel, add the two public Supabase environment variables plus `SUPABASE_SERVICE_ROLE_KEY`, and deploy. Add the resulting Vercel domain to Supabase's allowed redirect URLs.

## Data model notes

- One owned item has one historical source store. Wishlist items can have several candidate stores through `item_store_candidates`.
- Item photos are separate rows so they can be ordered and extended later without changing the item record.
- Outfit/item and wear-entry/item relations use join tables.
- Every entity and join row includes `user_id`; row-level policies compare it with `auth.uid()`.
- One wardrobe has at most one share row in `wardrobe_shares`; viewing happens through the service-role share API, never through anonymous table access.
- Archiving is a per-row `is_archived` flag on items, stores, and outfits. Archived rows leave every active view, count, builder, diary picker, and share link, and can be restored from their own Archived views. Wear entries are history and are never archived.
- Structured tags, suggestions, gap analysis, care workflows, and shopping workflows remain intentionally outside v1.
