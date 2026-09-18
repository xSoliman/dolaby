-- Object archiving: soft-hide items, stores, and outfits without deleting them.
-- Apply to existing Dolaby databases in timestamp order. Wear entries are
-- history and are intentionally not archivable.

alter table public.items add column if not exists is_archived boolean not null default false;
alter table public.stores add column if not exists is_archived boolean not null default false;
alter table public.outfits add column if not exists is_archived boolean not null default false;
