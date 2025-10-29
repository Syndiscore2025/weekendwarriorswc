-- Minimal fixes to make Admin Dashboard fully functional
-- Run this in Supabase SQL Editor (safe to run multiple times)

-- 1) Ensure admins table exists + RLS + policy so a user can read their own row
create table if not exists admins (
  email text primary key
);

alter table admins enable row level security;

-- Replace any older/incorrect policies
drop policy if exists "admin_read_admins" on admins;
drop policy if exists "admins_read_admins" on admins;
drop policy if exists "Admins can read admins" on admins;

-- Allow each signed-in user to read only their own row in admins
create policy "self_read_admin" on admins for select using (email = auth.email());

-- Make sure your admin email exists
insert into admins (email)
values ('michael.horak01@gmail.com')
on conflict (email) do nothing;

-- 2) Ensure media bucket exists + storage policies for uploads
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- Reset storage policies
 drop policy if exists "public read media" on storage.objects;
 drop policy if exists "Public can read media" on storage.objects;
 drop policy if exists "public_read_media" on storage.objects;
 drop policy if exists "admins upload media" on storage.objects;
 drop policy if exists "Admins can upload media" on storage.objects;
 drop policy if exists "admin_upload_media" on storage.objects;
 drop policy if exists "admins delete media" on storage.objects;
 drop policy if exists "Admins can delete media" on storage.objects;
 drop policy if exists "admin_delete_media" on storage.objects;

-- Read for everyone (only from media bucket)
create policy "public_read_media" on storage.objects for select
  using (bucket_id = 'media');

-- Uploads/deletes only for admins
create policy "admin_upload_media" on storage.objects for insert
  with check (bucket_id = 'media' and exists (select 1 from admins where admins.email = auth.email()));

create policy "admin_delete_media" on storage.objects for delete
  using (bucket_id = 'media' and exists (select 1 from admins where admins.email = auth.email()));

