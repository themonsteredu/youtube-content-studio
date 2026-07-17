create extension if not exists pgcrypto;

create type public.app_role as enum ('admin', 'editor');
create type public.asset_category as enum ('class', 'activity', 'portrait', 'space');
create type public.render_kind as enum ('thumbnail', 'intro');
create type public.render_status as enum ('processing', 'ready', 'failed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'editor',
  created_at timestamptz not null default now()
);

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  title text not null,
  storage_path text not null unique,
  public_url text not null,
  category public.asset_category not null default 'activity',
  tags text[] not null default '{}',
  focal_x smallint not null default 50 check (focal_x between 0 and 100),
  focal_y smallint not null default 50 check (focal_y between 0 and 100),
  recommended boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.render_jobs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  title text not null,
  kind public.render_kind not null,
  status public.render_status not null default 'processing',
  payload jsonb not null default '{}',
  output_url text,
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.profiles enable row level security;
alter table public.media_assets enable row level security;
alter table public.render_jobs enable row level security;

create function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create policy "profile self read" on public.profiles for select using (id = auth.uid());
create policy "admin assets" on public.media_assets for all using (public.is_admin()) with check (public.is_admin() and owner_id = auth.uid());
create policy "admin jobs" on public.render_jobs for all using (public.is_admin()) with check (public.is_admin() and owner_id = auth.uid());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('youtube-assets', 'youtube-assets', true, 10485760, array['image/jpeg','image/png','image/webp']),
       ('youtube-renders', 'youtube-renders', true, 524288000, array['video/mp4'])
on conflict (id) do nothing;

create policy "admin asset uploads" on storage.objects for insert to authenticated with check (bucket_id = 'youtube-assets' and public.is_admin() and (storage.foldername(name))[1] = auth.uid()::text);
create policy "public asset reads" on storage.objects for select using (bucket_id in ('youtube-assets', 'youtube-renders'));
create policy "service render writes" on storage.objects for insert to service_role with check (bucket_id = 'youtube-renders');
