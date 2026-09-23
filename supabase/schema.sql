-- ArtSphere — Supabase schema (Stages 5–7)
-- Run this in the Supabase SQL editor after creating your project.
-- Safe to re-run: every statement is idempotent.

-- ============================================================================
-- User profiles
-- One row per auth.users record, created automatically at sign-up.
-- ============================================================================

create type public.user_role as enum ('buyer', 'artist', 'admin');

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  role public.user_role not null default 'buyer',
  avatar_url text,
  bio text,
  created_at timestamptz not null default now()
);

comment on table public.profiles is
  'Public profile data for every ArtSphere account (1:1 with auth.users).';

-- Keep profiles.email in sync with the auth user's email automatically.
create or replace function public.handle_auth_email_sync()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.profiles
     set email = new.email
   where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_email_changed on auth.users;
create trigger on_auth_email_changed
  after update on auth.users
  for each row execute function public.handle_auth_email_sync();

-- Create a profile whenever a new user signs up.
-- Role comes from the signup metadata (`role`), defaulting to buyer.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.email, ''),
    case
      when new.raw_user_meta_data ->> 'role' = 'artist' then 'artist'::public.user_role
      when new.raw_user_meta_data ->> 'role' = 'admin' then 'admin'::public.user_role
      else 'buyer'::public.user_role
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Self-updates may only touch profile fields — role and account_status are
-- admin-only (server-enforced; a client patching its own row to
-- role='admin' is rejected here, not just hidden in the UI).
create or replace function public.reject_profile_escalation()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if (new.role is distinct from old.role)
     or (new.account_status is distinct from old.account_status) then
    if not exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    ) then
      raise exception 'Only administrators can change roles or account status.'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_sensitive on public.profiles;
create trigger profiles_guard_sensitive
  before update on public.profiles
  for each row
  execute function public.reject_profile_escalation();

-- Admins may read every profile (needed for future admin tooling).
-- Promote admins manually for now:
--   update public.profiles set role = 'admin' where email = 'you@example.com';
drop policy if exists "profiles_admin_read_all" on public.profiles;
create policy "profiles_admin_read_all"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ============================================================================
-- Helper: current user's role (used by future policies for artworks, carts…)
-- ============================================================================

create or replace function public.current_role()
returns public.user_role
language sql
stable
security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ============================================================================
-- Categories (browse taxonomy; artworks reference by name)
-- ============================================================================

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

insert into public.categories (name, slug) values
  ('Paintings', 'paintings'),
  ('Digital Art', 'digital-art'),
  ('Photography', 'photography'),
  ('Illustrations', 'illustrations'),
  ('Sculptures', 'sculptures'),
  ('Abstract', 'abstract'),
  ('Portraits', 'portraits'),
  ('Traditional Art', 'traditional-art')
on conflict (name) do nothing;

alter table public.categories enable row level security;

-- Everyone can browse categories; only admins can change them.
drop policy if exists "categories_select_all" on public.categories;
create policy "categories_select_all"
  on public.categories for select
  using (true);

drop policy if exists "categories_admin_write" on public.categories;
create policy "categories_admin_write"
  on public.categories for insert
  to authenticated
  with check (public.current_role() = 'admin');

drop policy if exists "categories_admin_update" on public.categories;
create policy "categories_admin_update"
  on public.categories for update
  to authenticated
  using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

drop policy if exists "categories_admin_delete" on public.categories;
create policy "categories_admin_delete"
  on public.categories for delete
  to authenticated
  using (public.current_role() = 'admin');

-- ============================================================================
-- Artist profiles (extended studio info for profiles with role = 'artist')
-- ============================================================================

create table if not exists public.artist_profiles (
  artist_id uuid primary key references public.profiles(id) on delete cascade,
  studio_name text,
  location text,
  website text,
  statement text,
  created_at timestamptz not null default now()
);

alter table public.artist_profiles enable row level security;

drop policy if exists "artist_profiles_select_all" on public.artist_profiles;
create policy "artist_profiles_select_all"
  on public.artist_profiles for select
  using (true);

drop policy if exists "artist_profiles_write_own" on public.artist_profiles;
create policy "artist_profiles_write_own"
  on public.artist_profiles for insert
  with check (
    artist_id = auth.uid()
    and public.current_role() = 'artist'
  );

drop policy if exists "artist_profiles_update_own" on public.artist_profiles;
create policy "artist_profiles_update_own"
  on public.artist_profiles for update
  using (artist_id = auth.uid())
  with check (artist_id = auth.uid());

-- ============================================================================
-- Artworks — artist-created listings. Ownership enforced by RLS:
-- an artist can only modify their own rows.
-- ============================================================================

create table if not exists public.artworks (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null default '',
  price numeric(12, 2) not null check (price >= 0),
  category text not null,
  type text not null check (type in ('original', 'print', 'digital')),
  medium text not null default '',
  dimensions text not null default '',
  year int not null default extract(year from now()),
  quantity int not null default 1 check (quantity >= 0),
  tags text[] not null default '{}',
  status text not null default 'draft'
    check (status in ('draft', 'published', 'sold', 'archived')),
  image_url text,
  image_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists artworks_artist_idx on public.artworks (artist_id);
create index if not exists artworks_status_idx on public.artworks (status);

-- Keep updated_at fresh.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists artworks_touch_updated_at on public.artworks;
create trigger artworks_touch_updated_at
  before update on public.artworks
  for each row execute function public.touch_updated_at();

alter table public.artworks enable row level security;

-- Everyone may browse published artwork.
drop policy if exists "artworks_read_published_or_own" on public.artworks;
create policy "artworks_read_published_or_own"
  on public.artworks for select
  using (
    status = 'published'
    or artist_id = auth.uid()
  );

-- Only artists may list; the row must belong to the caller.
drop policy if exists "artworks_insert_own" on public.artworks;
create policy "artworks_insert_own"
  on public.artworks for insert
  to authenticated
  with check (
    artist_id = auth.uid()
    and public.current_role() = 'artist'
  );

-- Only the owner may update their artwork.
drop policy if exists "artworks_update_own" on public.artworks;
create policy "artworks_update_own"
  on public.artworks for update
  to authenticated
  using (artist_id = auth.uid())
  with check (artist_id = auth.uid());

-- Only the owner may delete their artwork.
drop policy if exists "artworks_delete_own" on public.artworks;
create policy "artworks_delete_own"
  on public.artworks for delete
  to authenticated
  using (artist_id = auth.uid());

-- ============================================================================
-- Storage — artwork image uploads (public read, owner-scoped writes)
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('artwork-images', 'artwork-images', true)
on conflict (id) do nothing;

drop policy if exists "artwork_images_public_read" on storage.objects;
create policy "artwork_images_public_read"
  on storage.objects for select
  using (bucket_id = 'artwork-images');

drop policy if exists "artwork_images_owner_insert" on storage.objects;
create policy "artwork_images_owner_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'artwork-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "artwork_images_owner_update" on storage.objects;
create policy "artwork_images_owner_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'artwork-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "artwork_images_owner_delete" on storage.objects;
create policy "artwork_images_owner_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'artwork-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================================
-- Cart items — one row per artwork in a shopper's cart (Stage 7).
--
-- artwork_id holds a *catalogue* id: either a seeded sample id
-- ("dune-light-01", which lives in the client bundle) or an artist upload
-- ("up-" + artworks.id — strip the prefix for the FK target). It is text
-- rather than a foreign key so carts can hold both kinds.
-- ============================================================================

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  artwork_id text not null,
  quantity int not null default 1 check (quantity between 1 and 99),
  added_at timestamptz not null default now(),
  unique (user_id, artwork_id)
);

create index if not exists cart_items_user_idx on public.cart_items (user_id);

alter table public.cart_items enable row level security;

drop policy if exists "cart_items_select_own" on public.cart_items;
create policy "cart_items_select_own"
  on public.cart_items for select
  using (auth.uid() = user_id);

drop policy if exists "cart_items_insert_own" on public.cart_items;
create policy "cart_items_insert_own"
  on public.cart_items for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "cart_items_update_own" on public.cart_items;
create policy "cart_items_update_own"
  on public.cart_items for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "cart_items_delete_own" on public.cart_items;
create policy "cart_items_delete_own"
  on public.cart_items for delete
  to authenticated
  using (auth.uid() = user_id);

-- ============================================================================
-- Wishlist items — one row per saved artwork (same id scheme as cart_items).
-- ============================================================================

create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  artwork_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, artwork_id)
);

create index if not exists wishlist_items_user_idx on public.wishlist_items (user_id);

alter table public.wishlist_items enable row level security;

drop policy if exists "wishlist_items_select_own" on public.wishlist_items;
create policy "wishlist_items_select_own"
  on public.wishlist_items for select
  using (auth.uid() = user_id);

drop policy if exists "wishlist_items_insert_own" on public.wishlist_items;
create policy "wishlist_items_insert_own"
  on public.wishlist_items for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "wishlist_items_update_own" on public.wishlist_items;
create policy "wishlist_items_update_own"
  on public.wishlist_items for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "wishlist_items_delete_own" on public.wishlist_items;
create policy "wishlist_items_delete_own"
  on public.wishlist_items for delete
  to authenticated
  using (auth.uid() = user_id);

-- ============================================================================
-- Orders (Stage 8). One order per artist per checkout: a cart containing
-- pieces from two artists produces two orders sharing an order_group id.
--
-- artwork ids in order_items are catalogue ids; for artist uploads they
-- carry the `up-` prefix (strip it to resolve the artworks row).
-- ============================================================================

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  -- Groups orders placed together in one checkout.
  order_group text not null,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  -- Snapshot fields so order history renders without joins.
  buyer_name text not null default '',
  buyer_email text not null default '',
  artist_id uuid not null references public.profiles(id) on delete cascade,
  artist_name text not null default '',
  status text not null default 'pending'
    check (status in ('pending','confirmed','processing','shipped','delivered','cancelled')),
  payment_status text not null default 'pending'
    check (payment_status in ('pending','paid','failed','refunded')),
  payment_provider text not null default 'none'
    check (payment_provider in ('none','stripe','razorpay')),
  payment_reference text,
  subtotal numeric(12, 2) not null check (subtotal >= 0),
  shipping_fee numeric(12, 2) not null default 0 check (shipping_fee >= 0),
  total numeric(12, 2) not null check (total >= 0),
  currency text not null default 'INR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_buyer_idx on public.orders (buyer_id);
create index if not exists orders_artist_idx on public.orders (artist_id);
create index if not exists orders_group_idx on public.orders (order_group);

drop trigger if exists orders_touch_updated_at on public.orders;
create trigger orders_touch_updated_at
  before update on public.orders
  for each row execute function public.touch_updated_at();

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  artwork_id text not null,
  title text not null,
  artist_name text not null default '',
  image_url text,
  gradient text not null default '',
  ratio text not null default 'aspect-[4/5]',
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  quantity int not null check (quantity between 1 and 99),
  line_total numeric(12, 2) not null check (line_total >= 0)
);

create index if not exists order_items_order_idx on public.order_items (order_id);

-- Shipping snapshot, one row per order.
create table if not exists public.order_shipping (
  order_id uuid primary key references public.orders(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text not null default '',
  address text not null,
  city text not null,
  state text not null default '',
  postal_code text not null,
  country text not null
);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_shipping enable row level security;

-- Buyers see their orders; the selling artist sees orders for their work;
-- admins can audit everything.
drop policy if exists "orders_select_participant" on public.orders;
create policy "orders_select_participant"
  on public.orders for select
  using (
    buyer_id = auth.uid()
    or artist_id = auth.uid()
    or public.current_role() = 'admin'
  );

-- Orders are created server-side (payment provider webhooks / edge
-- functions) once a gateway is connected; until then the buyer's own
-- insert policy keeps the demo checkout working end to end.
drop policy if exists "orders_insert_own_buyer" on public.orders;
create policy "orders_insert_own_buyer"
  on public.orders for insert
  to authenticated
  with check (
    buyer_id = auth.uid()
    and status = 'pending'
    and payment_status = 'pending'
  );

-- Fulfilment status is the artist's to advance (never back to pending).
-- The trigger below ensures the artist can ONLY change `status` — never
-- payment_status, totals or buyer fields (an artist marking their own
-- orders 'paid' would otherwise be a one-request privilege escalation).
create or replace function public.reject_order_payment_edit()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Service-role / webhook context (payment provider, migrations): auth.uid()
  -- is null, so allow payment-field writes — RLS does not apply to it anyway.
  if auth.uid() is null then
    return new;
  end if;
  if (new.payment_status is distinct from old.payment_status)
     or (new.payment_provider is distinct from old.payment_provider)
     or (new.payment_reference is distinct from old.payment_reference)
     or (new.subtotal is distinct from old.subtotal)
     or (new.total is distinct from old.total)
     or (new.buyer_id is distinct from old.buyer_id) then
    if not exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    ) then
      -- Service-role/webhook writes (payment provider) bypass RLS, so this
      -- only ever fires for client-side writers: buyers and artists.
      raise exception 'Only a payment provider or an administrator can change payment details.'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists orders_guard_payment on public.orders;
create trigger orders_guard_payment
  before update on public.orders
  for each row
  execute function public.reject_order_payment_edit();

drop policy if exists "orders_update_artist" on public.orders;
create policy "orders_update_artist"
  on public.orders for update
  to authenticated
  using (artist_id = auth.uid())
  with check (artist_id = auth.uid());

drop policy if exists "orders_update_admin" on public.orders;
create policy "orders_update_admin"
  on public.orders for update
  to authenticated
  using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

-- ============================================================================
-- Moderation + reports (Stage 9)
--
-- Moderation state lives on artworks: a rejected/removed listing is hidden
-- from the public catalogue by the read policy itself (server-enforced —
-- the UI is not trusted to hide anything).
-- ============================================================================

alter table public.artworks add column if not exists moderation text
  not null default 'approved'
  check (moderation in ('approved', 'rejected', 'removed'));
alter table public.artworks add column if not exists moderation_note text;

-- Public browsing sees only approved + published artwork (or your own rows
-- regardless of moderation state, so artists can still manage them).
drop policy if exists "artworks_read_published_or_own" on public.artworks;
create policy "artworks_read_published_or_own"
  on public.artworks for select
  using (
    (status = 'published' and moderation = 'approved')
    or artist_id = auth.uid()
  );

-- Reports against artwork, artists or users.
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('artwork', 'artist', 'user')),
  target_id text not null,
  target_label text not null default '',
  reporter_id uuid references public.profiles(id) on delete set null,
  reporter_name text not null default '',
  reason text not null,
  details text not null default '',
  status text not null default 'open'
    check (status in ('open', 'resolved', 'dismissed')),
  resolution_note text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists reports_status_idx on public.reports (status);

alter table public.reports enable row level security;

-- Any signed-in user can file a report; everyone can read the queue is
-- NOT desired — reports are visible to their reporter and to admins.
drop policy if exists "reports_insert_any_user" on public.reports;
create policy "reports_insert_any_user"
  on public.reports for insert
  to authenticated
  with check (reporter_id = auth.uid());

drop policy if exists "reports_select_own_or_admin" on public.reports;
create policy "reports_select_own_or_admin"
  on public.reports for select
  using (
    reporter_id = auth.uid()
    or public.current_role() = 'admin'
  );

drop policy if exists "reports_update_admin" on public.reports;
create policy "reports_update_admin"
  on public.reports for update
  to authenticated
  using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

-- Account disable flag on profiles; disabled accounts are denied tokens
-- by a trigger (server-side enforcement, not UI hiding).
alter table public.profiles add column if not exists account_status text
  not null default 'active'
  check (account_status in ('active', 'disabled'));

create or replace function public.reject_disabled_users()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if exists (
    select 1 from public.profiles p
    where p.id = new.id and p.account_status = 'disabled'
  ) then
    raise exception 'This account has been disabled by an administrator.'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_token_refresh on auth.users;
create trigger on_auth_token_refresh
  before update on auth.users
  for each row
  when (old.last_sign_in_at is distinct from new.last_sign_in_at)
  execute function public.reject_disabled_users();

-- Order items follow their order's visibility.
drop policy if exists "order_items_select_via_order" on public.order_items;
create policy "order_items_select_via_order"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (
          o.buyer_id = auth.uid()
          or o.artist_id = auth.uid()
          or public.current_role() = 'admin'
        )
    )
  );

drop policy if exists "order_items_insert_via_order" on public.order_items;
create policy "order_items_insert_via_order"
  on public.order_items for insert
  to authenticated
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and o.buyer_id = auth.uid()
    )
  );

-- Shipping details: visible to the participants, written by the buyer.
drop policy if exists "order_shipping_select_via_order" on public.order_shipping;
create policy "order_shipping_select_via_order"
  on public.order_shipping for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (
          o.buyer_id = auth.uid()
          or o.artist_id = auth.uid()
          or public.current_role() = 'admin'
        )
    )
  );

drop policy if exists "order_shipping_insert_via_order" on public.order_shipping;
create policy "order_shipping_insert_via_order"
  on public.order_shipping for insert
  to authenticated
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and o.buyer_id = auth.uid()
    )
  );
