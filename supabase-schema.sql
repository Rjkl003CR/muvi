-- ============================================================
-- MUVI - Complete Supabase Schema
-- Run this entire script in: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text UNIQUE NOT NULL,
  password_hash text,
  name          text,
  avatar_url    text,
  email_verified boolean DEFAULT false,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- 2. MOVIES TABLE
CREATE TABLE IF NOT EXISTS public.movies (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid REFERENCES public.users(id) ON DELETE CASCADE,
  title          text NOT NULL,
  drive_file_id  text,
  drive_view_url text,
  original_url   text,
  file_size      bigint,
  mime_type      text,
  genres         text[],
  release_year   integer,
  imdb_rating    numeric(3,1),
  poster_url     text,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS movies_user_id_idx ON public.movies(user_id);

-- 3. NOTES TABLE
CREATE TABLE IF NOT EXISTS public.notes (
  id         text PRIMARY KEY,
  user_id    text NOT NULL,
  title      text NOT NULL DEFAULT 'Untitled Note',
  content    text DEFAULT '',
  tags       text[] DEFAULT '{}',
  color      text DEFAULT 'default',
  pinned     boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notes_user_id_idx ON public.notes(user_id);

-- 4. SHORTCUTS TABLE
CREATE TABLE IF NOT EXISTS public.shortcuts (
  id            text PRIMARY KEY,
  user_id       text NOT NULL,
  title         text NOT NULL,
  url           text NOT NULL,
  username_hint text DEFAULT '',
  category      text DEFAULT 'General',
  color         text DEFAULT 'default',
  pinned        boolean DEFAULT false,
  clicks        integer DEFAULT 0,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS shortcuts_user_id_idx ON public.shortcuts(user_id);

-- 5. VAULT META TABLE
CREATE TABLE IF NOT EXISTS public.vault_meta (
  id         text PRIMARY KEY,
  user_id    text NOT NULL UNIQUE,
  salt       text NOT NULL,
  iv         text NOT NULL,
  hint       text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6. VAULT ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.vault_items (
  id             text PRIMARY KEY,
  user_id        text NOT NULL,
  label          text NOT NULL,
  type           text DEFAULT 'text',
  encrypted_data text NOT NULL,
  iv             text NOT NULL,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS vault_items_user_id_idx ON public.vault_items(user_id);

-- 7. REFRESH TOKENS TABLE
CREATE TABLE IF NOT EXISTS public.refresh_tokens (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES public.users(id) ON DELETE CASCADE,
  token      text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS refresh_tokens_token_idx ON public.refresh_tokens(token);

-- 8. DISABLE RLS (service role key is used server-side, bypasses RLS anyway)
ALTER TABLE public.notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.shortcuts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_meta DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.movies DISABLE ROW LEVEL SECURITY;

SELECT 'All Muvi tables created successfully!' AS status;
