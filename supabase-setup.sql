-- BAZARA setup for Supabase SQL Editor
-- Run this only in your own new Supabase project.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text not null default '',
  role text not null default 'member' check (role in ('member','owner')),
  created_at timestamptz not null default now()
);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 120),
  price numeric(14,0) not null check (price >= 0),
  category text not null check (category in ('ئەلیکترۆنیات','ئۆتۆمبێل','خانوو و زەوی','ماڵ و ژیان','کار و خزمەتگوزاری')),
  location text not null check (char_length(location) between 1 and 100),
  description text not null default '' check (char_length(description) <= 3000),
  image_url text not null,
  image_path text not null,
  status text not null default 'pending' check (status in ('pending','active','rejected')),
  created_at timestamptz not null default now()
);

create index if not exists listings_status_created_idx on public.listings(status, created_at desc);
create index if not exists listings_user_id_idx on public.listings(user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'member'
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.is_bazara_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'owner'
  );
$$;

alter table public.profiles enable row level security;
alter table public.listings enable row level security;

drop policy if exists "profiles read self or owner" on public.profiles;
create policy "profiles read self or owner"
on public.profiles for select to authenticated
using (id = (select auth.uid()) or public.is_bazara_owner());

-- No member can promote themselves. Only the already-assigned owner can change roles.
drop policy if exists "owner updates profiles" on public.profiles;
create policy "owner updates profiles"
on public.profiles for update to authenticated
using (public.is_bazara_owner())
with check (public.is_bazara_owner());

drop policy if exists "public reads active listings" on public.listings;
create policy "public reads active listings"
on public.listings for select to anon, authenticated
using (status = 'active' or user_id = (select auth.uid()) or public.is_bazara_owner());

drop policy if exists "members insert own pending listings" on public.listings;
create policy "members insert own pending listings"
on public.listings for insert to authenticated
with check (
  user_id = (select auth.uid())
  and status = 'pending'
);

drop policy if exists "owner updates listings" on public.listings;
create policy "owner updates listings"
on public.listings for update to authenticated
using (public.is_bazara_owner())
with check (public.is_bazara_owner());

drop policy if exists "members update own pending listings" on public.listings;
create policy "members update own pending listings"
on public.listings for update to authenticated
using (user_id = (select auth.uid()) and status = 'pending')
with check (user_id = (select auth.uid()) and status = 'pending');

drop policy if exists "owner deletes listings" on public.listings;
create policy "owner deletes listings"
on public.listings for delete to authenticated
using (public.is_bazara_owner());

drop policy if exists "members delete own pending listings" on public.listings;
create policy "members delete own pending listings"
on public.listings for delete to authenticated
using (user_id = (select auth.uid()) and status = 'pending');

-- Storage bucket for ad images. Public read allows listing images to show without login.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listing-images', 'listing-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "members upload images to own folder" on storage.objects;
create policy "members upload images to own folder"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'listing-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "members delete own images" on storage.objects;
create policy "members delete own images"
on storage.objects for delete to authenticated
using (
  bucket_id = 'listing-images'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or public.is_bazara_owner()
  )
);

-- After signing up with safarsherzad13@gmail.com and confirming that account,
-- run the owner-promotion SQL from README. Never expose a service_role key in frontend.
