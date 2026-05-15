
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  full_name text,
  title text,
  avatar_url text,
  location text,
  role text,
  plan text default 'free',
  updated_at timestamp with time zone
);
alter table public.profiles enable row level security;
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile" on public.profiles for insert with check ((select auth.uid()) = id);
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile" on public.profiles for update using ((select auth.uid()) = id);

-- 2. COMMUNITY POSTS
create table if not exists public.community_posts (
  id uuid default gen_random_uuid() primary key,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Idempotent Column Additions
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'plan') then
    alter table public.profiles add column plan text default 'free';
  end if;

  -- Normalize existing plan data and sync with subscription fields
  update public.profiles set 
    plan = 'free',
    subscription_tier = 'Free',
    subscription_status = 'inactive'
  where plan is null or plan not in ('pro', 'free');

  -- Ensure subscription columns exist
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'subscription_tier') then
    alter table public.profiles add column subscription_tier text default 'Free';
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'subscription_status') then
    alter table public.profiles add column subscription_status text default 'inactive';
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'subscription_end_date') then
    alter table public.profiles add column subscription_end_date timestamp with time zone;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'billing_cycle') then
    alter table public.profiles add column billing_cycle text;
  end if;

  -- Create subscription_transactions table
  create table if not exists public.subscription_transactions (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    amount decimal(12,2) not null,
    currency text default 'USD',
    status text not null, -- 'success', 'pending', 'failed'
    plan_type text not null, -- 'pro'
    billing_cycle text not null, -- 'monthly', 'yearly'
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
  );
  alter table public.subscription_transactions enable row level security;
  
  if not exists (
    select 1 from pg_policies where tablename = 'subscription_transactions' and policyname = 'Users can view their own transactions'
  ) then
    create policy "Users can view their own transactions" on public.subscription_transactions
      for select using (auth.uid() = user_id);
  end if;

  -- Add author_id (Standardizing on this to match Typescript interface)
  if not exists (select 1 from information_schema.columns where table_name = 'community_posts' and column_name = 'author_id') then
    alter table public.community_posts add column author_id uuid references auth.users(id) on delete cascade;
  end if;

  -- Add user_id (Backwards compatibility)
  if not exists (select 1 from information_schema.columns where table_name = 'community_posts' and column_name = 'user_id') then
    alter table public.community_posts add column user_id uuid references auth.users(id) on delete cascade;
  end if;
  
  if not exists (select 1 from information_schema.columns where table_name = 'community_posts' and column_name = 'image_url') then
    alter table public.community_posts add column image_url text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'community_posts' and column_name = 'tags') then
    alter table public.community_posts add column tags text[];
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'community_posts' and column_name = 'likes') then
    alter table public.community_posts add column likes int default 0;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'community_posts' and column_name = 'comments_count') then
    alter table public.community_posts add column comments_count int default 0;
  end if;
end $$;

-- RLS for Posts
alter table public.community_posts enable row level security;
drop policy if exists "Everyone can view community posts" on public.community_posts;
create policy "Everyone can view community posts" on public.community_posts for select using (true);

drop policy if exists "Authenticated users can create posts" on public.community_posts;
create policy "Authenticated users can create posts" on public.community_posts for insert with check (auth.role() = 'authenticated');

drop policy if exists "Users can update their own posts" on public.community_posts;
create policy "Users can update their own posts" on public.community_posts for update using ((select auth.uid()) = author_id OR (select auth.uid()) = user_id);

drop policy if exists "Users can delete their own posts" on public.community_posts;
create policy "Users can delete their own posts" on public.community_posts for delete using ((select auth.uid()) = author_id OR (select auth.uid()) = user_id);

-- 3. MEETINGS
create table if not exists public.meetings (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'meetings' and column_name = 'user_id') then
    alter table public.meetings add column user_id uuid references auth.users(id) on delete cascade;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'meetings' and column_name = 'investor_id') then
    alter table public.meetings add column investor_id uuid references auth.users(id) on delete cascade;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'meetings' and column_name = 'startup_id') then
    alter table public.meetings add column startup_id uuid references auth.users(id) on delete cascade;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'meetings' and column_name = 'title') then
    alter table public.meetings add column title text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'meetings' and column_name = 'guest_name') then
    alter table public.meetings add column guest_name text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'meetings' and column_name = 'guest_email') then
    alter table public.meetings add column guest_email text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'meetings' and column_name = 'guest_avatar') then
    alter table public.meetings add column guest_avatar text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'meetings' and column_name = 'start_time') then
    alter table public.meetings add column start_time timestamp with time zone;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'meetings' and column_name = 'end_time') then
    alter table public.meetings add column end_time timestamp with time zone;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'meetings' and column_name = 'duration') then
    alter table public.meetings add column duration int default 30;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'meetings' and column_name = 'type') then
    alter table public.meetings add column type text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'meetings' and column_name = 'status') then
    alter table public.meetings add column status text default 'confirmed';
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'meetings' and column_name = 'meeting_link') then
    alter table public.meetings add column meeting_link text;
  end if;
end $$;

alter table public.meetings enable row level security;
drop policy if exists "Users can view their own meetings" on public.meetings;
create policy "Users can view their own meetings" on public.meetings for select using ((select auth.uid()) = user_id OR (select auth.uid()) = investor_id OR (select auth.uid()) = startup_id);
drop policy if exists "Users can insert their own meetings" on public.meetings;
create policy "Users can insert their own meetings" on public.meetings for insert with check (auth.role() = 'authenticated');
drop policy if exists "Users can update their own meetings" on public.meetings;
create policy "Users can update their own meetings" on public.meetings for update using ((select auth.uid()) = user_id OR (select auth.uid()) = investor_id OR (select auth.uid()) = startup_id);
drop policy if exists "Users can delete their own meetings" on public.meetings;
create policy "Users can delete their own meetings" on public.meetings for delete using ((select auth.uid()) = user_id OR (select auth.uid()) = investor_id OR (select auth.uid()) = startup_id);

-- 4. CHATS & MESSAGES
create table if not exists public.chats (
  id uuid default gen_random_uuid() primary key,
  startup_id uuid references auth.users(id),
  investor_id uuid references auth.users(id),
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.chats enable row level security;
drop policy if exists "Users can view their chats" on public.chats;
create policy "Users can view their chats" on public.chats for select using ((select auth.uid()) = startup_id OR (select auth.uid()) = investor_id);
drop policy if exists "Users can insert chats" on public.chats;
create policy "Users can insert chats" on public.chats for insert with check ((select auth.uid()) = startup_id OR (select auth.uid()) = investor_id);

create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  chat_id uuid references public.chats(id) on delete cascade,
  sender_id uuid references auth.users(id),
  content text,
  type text default 'text',
  file_name text,
  file_size text,
  duration int,
  reactions jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'messages' and column_name = 'status') then
    alter table public.messages add column status text default 'sent';
  end if;
end $$;

alter table public.messages enable row level security;
drop policy if exists "Users can view messages in their chats" on public.messages;
create policy "Users can view messages in their chats" on public.messages for select using (
  exists (select 1 from public.chats where id = messages.chat_id and (startup_id = (select auth.uid()) or investor_id = (select auth.uid())))
);
drop policy if exists "Users can insert messages in their chats" on public.messages;
create policy "Users can insert messages in their chats" on public.messages for insert with check (
  exists (select 1 from public.chats where id = messages.chat_id and (startup_id = (select auth.uid()) or investor_id = (select auth.uid())))
);

-- STORAGE BUCKETS
insert into storage.buckets (id, name, public) values ('images', 'images', true) ON CONFLICT DO NOTHING;
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;
insert into storage.buckets (id, name, public) values ('videos', 'videos', true) ON CONFLICT DO NOTHING;
drop policy if exists "Public Access" on storage.objects;
create policy "Public Access" on storage.objects for select using ( bucket_id in ('images', 'avatars', 'videos') );
drop policy if exists "Auth Upload" on storage.objects;
create policy "Auth Upload" on storage.objects for insert with check ( auth.role() = 'authenticated' );

-- Reload Schema Cache
NOTIFY pgrst, 'reload config';
