-- Dolaby v1 database schema
-- Run this file once in the Supabase SQL editor for a new project.

create extension if not exists "pgcrypto";

create type public.item_category as enum ('top', 'bottom', 'underwear', 'outerwear', 'shoes', 'accessory');
create type public.warmth_level as enum ('light', 'medium', 'heavy');
create type public.ownership_status as enum ('own', 'want');
create type public.store_type as enum ('online', 'physical', 'both');
create type public.occasion as enum ('work', 'casual', 'date_night', 'event', 'gym');
create type public.wear_feeling as enum ('confident', 'good', 'neutral', 'self_conscious');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  created_at timestamptz not null default now()
);

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  type public.store_type,
  url text,
  location text,
  photo_path text,
  note text check (char_length(note) <= 2000),
  created_at timestamptz not null default now(),
  is_archived boolean not null default false,
  unique (id, user_id)
);

create table public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text,
  category public.item_category not null,
  type text not null,
  primary_color text not null,
  size text,
  material text,
  formality_score smallint not null default 2 check (formality_score between 1 and 5),
  warmth_level public.warmth_level not null default 'light',
  ownership_status public.ownership_status not null default 'own',
  needs_attention boolean not null default false,
  satisfaction_rating smallint check (satisfaction_rating between 1 and 5),
  price numeric(12, 2) check (price is null or price >= 0),
  acquired_date date,
  source_store_id uuid,
  note text check (char_length(note) <= 4000),
  created_at timestamptz not null default now(),
  is_archived boolean not null default false,
  unique (id, user_id),
  foreign key (source_store_id, user_id)
    references public.stores(id, user_id)
    on delete set null (source_store_id),
  constraint acquired_only_when_owned check (ownership_status = 'own' or acquired_date is null)
);

create table public.item_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null,
  storage_path text not null,
  sort_order smallint not null default 0 check (sort_order between 0 and 4),
  created_at timestamptz not null default now(),
  foreign key (item_id, user_id) references public.items(id, user_id) on delete cascade,
  unique (item_id, storage_path)
);

create table public.item_store_candidates (
  item_id uuid not null,
  store_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (item_id, store_id),
  foreign key (item_id, user_id) references public.items(id, user_id) on delete cascade,
  foreign key (store_id, user_id) references public.stores(id, user_id) on delete cascade
);

create table public.outfits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text,
  occasion public.occasion not null,
  is_draft boolean not null default true,
  created_at timestamptz not null default now(),
  is_archived boolean not null default false,
  unique (id, user_id)
);

create table public.outfit_items (
  outfit_id uuid not null,
  item_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  primary key (outfit_id, item_id),
  foreign key (outfit_id, user_id) references public.outfits(id, user_id) on delete cascade,
  foreign key (item_id, user_id) references public.items(id, user_id) on delete cascade
);

create table public.wear_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  occasion public.occasion not null,
  outfit_id uuid,
  feeling public.wear_feeling not null,
  note text check (char_length(note) <= 2000),
  created_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (outfit_id, user_id)
    references public.outfits(id, user_id)
    on delete set null (outfit_id)
);

create table public.wear_entry_items (
  wear_entry_id uuid not null,
  item_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (wear_entry_id, item_id),
  foreign key (wear_entry_id, user_id) references public.wear_entries(id, user_id) on delete cascade,
  foreign key (item_id, user_id) references public.items(id, user_id) on delete cascade
);

-- One optional read-only share link per wardrobe. The token is unguessable;
-- viewing happens through a server API that checks it, so this table stays
-- owner-only under row-level security with no anonymous policies.
create table public.wardrobe_shares (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  token text not null unique,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create index items_user_category_idx on public.items(user_id, category);
create index items_user_ownership_idx on public.items(user_id, ownership_status);
create index items_user_attention_idx on public.items(user_id, needs_attention) where needs_attention;
create index stores_user_name_idx on public.stores(user_id, name);
create index outfits_user_occasion_idx on public.outfits(user_id, occasion);
create index wear_entries_user_date_idx on public.wear_entries(user_id, date desc);
create index item_photos_item_order_idx on public.item_photos(item_id, sort_order);
create index outfit_items_outfit_order_idx on public.outfit_items(outfit_id, sort_order);

-- A profile mirrors the small amount of user data the product needs.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1)),
    coalesce(new.email, '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Every row is private to its owner. Join tables also carry user_id so their
-- policies remain simple and cross-user relationships are rejected by FKs.
alter table public.profiles enable row level security;
alter table public.stores enable row level security;
alter table public.items enable row level security;
alter table public.item_photos enable row level security;
alter table public.item_store_candidates enable row level security;
alter table public.outfits enable row level security;
alter table public.outfit_items enable row level security;
alter table public.wear_entries enable row level security;
alter table public.wear_entry_items enable row level security;
alter table public.wardrobe_shares enable row level security;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "stores_owner_all" on public.stores for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "items_owner_all" on public.items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "item_photos_owner_all" on public.item_photos for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "item_store_candidates_owner_all" on public.item_store_candidates for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "outfits_owner_all" on public.outfits for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "outfit_items_owner_all" on public.outfit_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "wear_entries_owner_all" on public.wear_entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "wear_entry_items_owner_all" on public.wear_entry_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "wardrobe_shares_owner_all" on public.wardrobe_shares for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Private media bucket. Paths are always `{user_id}/items/...` or
-- `{user_id}/stores/...`; the app creates short-lived signed URLs for display.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'wardrobe-media',
  'wardrobe-media',
  false,
  6291456,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "media_select_own" on storage.objects
for select to authenticated
using (bucket_id = 'wardrobe-media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "media_insert_own" on storage.objects
for insert to authenticated
with check (bucket_id = 'wardrobe-media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "media_update_own" on storage.objects
for update to authenticated
using (bucket_id = 'wardrobe-media' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'wardrobe-media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "media_delete_own" on storage.objects
for delete to authenticated
using (bucket_id = 'wardrobe-media' and (storage.foldername(name))[1] = auth.uid()::text);
