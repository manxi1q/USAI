-- ============================================================================
-- EAGLE WIRE — Supabase schema
-- Run this whole file once in the Supabase SQL Editor.
-- ============================================================================

-- ---------------------------------------------------------------- articles --
create table if not exists public.articles (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  outlet       text not null default 'eagle-wire',
  section      text not null,
  kicker       text not null,
  headline     text not null,
  dek          text not null default '',
  author       text not null,
  desk         text not null default '',
  image_url    text,
  caption      text,
  body         jsonb not null default '[]'::jsonb,
  is_lead      boolean not null default false,
  status       text not null default 'draft'
                 check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  created_by   uuid references auth.users (id) on delete set null
);

create index if not exists articles_published_idx
  on public.articles (outlet, status, published_at desc);
create index if not exists articles_section_idx
  on public.articles (outlet, section, status);

-- Keep updated_at honest, and stamp published_at the first time a piece goes live
create or replace function public.touch_article()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists articles_touch on public.articles;
create trigger articles_touch
  before insert or update on public.articles
  for each row execute function public.touch_article();

-- Only one lead story per outlet: publishing a new lead demotes the old one
create or replace function public.single_lead()
returns trigger
language plpgsql
as $$
begin
  if new.is_lead then
    update public.articles
       set is_lead = false
     where outlet = new.outlet
       and id <> new.id
       and is_lead;
  end if;
  return new;
end;
$$;

drop trigger if exists articles_single_lead on public.articles;
create trigger articles_single_lead
  after insert or update of is_lead on public.articles
  for each row when (new.is_lead) execute function public.single_lead();


-- ------------------------------------------------------------------ staff --
-- Who is allowed into the admin panel, and for which outlet.
create table if not exists public.staff (
  user_id  uuid primary key references auth.users (id) on delete cascade,
  outlet   text not null default 'eagle-wire',
  role     text not null default 'reporter'
             check (role in ('reporter', 'editor', 'admin')),
  byline   text,
  desk     text,
  added_at timestamptz not null default now()
);

create or replace function public.is_staff()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (select 1 from public.staff where user_id = auth.uid());
$$;


-- --------------------------------------------------------- row level security --
alter table public.articles enable row level security;
alter table public.staff    enable row level security;

-- The public site reads published stories only.
drop policy if exists "public reads published" on public.articles;
create policy "public reads published"
  on public.articles for select
  to anon, authenticated
  using (status = 'published');

-- Staff see everything, including drafts.
drop policy if exists "staff read all" on public.articles;
create policy "staff read all"
  on public.articles for select
  to authenticated
  using (public.is_staff());

drop policy if exists "staff write" on public.articles;
create policy "staff write"
  on public.articles for insert
  to authenticated
  with check (public.is_staff());

drop policy if exists "staff update" on public.articles;
create policy "staff update"
  on public.articles for update
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

drop policy if exists "staff delete" on public.articles;
create policy "staff delete"
  on public.articles for delete
  to authenticated
  using (public.is_staff());

-- Staff can see their own row (so the panel can show their byline).
drop policy if exists "read own staff row" on public.staff;
create policy "read own staff row"
  on public.staff for select
  to authenticated
  using (user_id = auth.uid());


-- ------------------------------------------------------------ image storage --
insert into storage.buckets (id, name, public)
values ('wire-images', 'wire-images', true)
on conflict (id) do nothing;

drop policy if exists "public reads wire images" on storage.objects;
create policy "public reads wire images"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'wire-images');

drop policy if exists "staff upload wire images" on storage.objects;
create policy "staff upload wire images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'wire-images' and public.is_staff());

drop policy if exists "staff replace wire images" on storage.objects;
create policy "staff replace wire images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'wire-images' and public.is_staff());


-- ============================================================================
-- AFTER RUNNING THIS FILE
--
-- 1. Authentication → Users → Add user. Create an account for yourself.
-- 2. Copy that user's UUID, then run:
--
--      insert into public.staff (user_id, outlet, role, byline, desk)
--      values ('PASTE-UUID-HERE', 'eagle-wire', 'admin', 'M. Breton', 'Capitol desk');
--
--    Nobody can reach the admin panel until they have a row in public.staff,
--    even with a valid login. That is the whole access control.
--
-- 3. Optional — seed the seven starter stories from articles.json using the
--    "Import from articles.json" button in the admin panel.
-- ============================================================================
