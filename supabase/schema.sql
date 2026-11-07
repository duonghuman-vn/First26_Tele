-- Run in Supabase SQL Editor.
create extension if not exists pgcrypto;

-- Register exactly one owner email for this private installation.
-- Replace the email below before running this SQL.
create table if not exists public.private_owner (
  email text primary key
);
insert into public.private_owner (email)
values ('you@example.com')
on conflict (email) do nothing;

alter table public.private_owner enable row level security;
drop policy if exists "Owner can read own email" on public.private_owner;
create policy "Owner can read own email"
on public.private_owner for select to authenticated
using (lower(email) = lower(auth.jwt() ->> 'email'));

create table if not exists public.links (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  normalized_url text not null unique,
  title text not null,
  description text,
  image_url text,
  domain text not null,
  category text not null default 'Other',
  tags text[] not null default '{}',
  is_favorite boolean not null default false,
  telegram_user_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists links_created_at_idx on public.links (created_at desc);
create index if not exists links_category_idx on public.links (category);
create index if not exists links_favorite_idx on public.links (is_favorite) where is_favorite = true;
create index if not exists links_tags_idx on public.links using gin (tags);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists links_updated_at on public.links;
create trigger links_updated_at before update on public.links
for each row execute function public.set_updated_at();

alter table public.links enable row level security;

-- Signed-in dashboard users can read and update saved links.
drop policy if exists "Authenticated users can read links" on public.links;
create policy "Only private owner can read links"
on public.links for select to authenticated
using (exists (
  select 1 from public.private_owner
  where lower(email) = lower(auth.jwt() ->> 'email')
));

drop policy if exists "Authenticated users can update links" on public.links;
create policy "Only private owner can update links"
on public.links for update to authenticated
using (exists (
  select 1 from public.private_owner
  where lower(email) = lower(auth.jwt() ->> 'email')
))
with check (exists (
  select 1 from public.private_owner
  where lower(email) = lower(auth.jwt() ->> 'email')
));

-- No anon insert policy. Telegram webhook writes with service_role on the server.
