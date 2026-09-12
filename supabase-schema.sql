-- =========================================================
-- Muvi Database Schema for Supabase
-- Run this script in your Supabase Project -> SQL Editor
-- =========================================================

-- 1. Notes Table
CREATE TABLE IF NOT EXISTS public.notes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default_user',
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  color TEXT DEFAULT 'default',
  pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Index for fast user querying
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON public.notes(updated_at DESC);

-- 2. Vault Meta Table (Stores PBKDF2 salt and encrypted check phrase per user)
CREATE TABLE IF NOT EXISTS public.vault_meta (
  user_id TEXT PRIMARY KEY,
  salt TEXT NOT NULL,
  check_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 3. Vault Items Table (Client-side AES-256 encrypted items)
CREATE TABLE IF NOT EXISTS public.vault_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default_user',
  type TEXT NOT NULL, -- 'note' | 'file'
  title TEXT NOT NULL,
  encrypted_data TEXT NOT NULL,
  file_name TEXT,
  file_type TEXT,
  file_size INT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_vault_items_user_id ON public.vault_items(user_id);
CREATE INDEX IF NOT EXISTS idx_vault_items_updated_at ON public.vault_items(updated_at DESC);

-- 4. Shortcuts Table (Account & App Login Links)
CREATE TABLE IF NOT EXISTS public.shortcuts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default_user',
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  username_hint TEXT DEFAULT '',
  category TEXT NOT NULL DEFAULT 'General',
  color TEXT DEFAULT 'default',
  pinned BOOLEAN DEFAULT false,
  clicks INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_shortcuts_user_id ON public.shortcuts(user_id);
CREATE INDEX IF NOT EXISTS idx_shortcuts_updated_at ON public.shortcuts(updated_at DESC);

-- 5. Enable Row Level Security (RLS) if desired, or allow public access for anon keys
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shortcuts ENABLE ROW LEVEL SECURITY;

-- Allow read/write for anon and authenticated users
CREATE POLICY "Allow all on notes" ON public.notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on vault_meta" ON public.vault_meta FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on vault_items" ON public.vault_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on shortcuts" ON public.shortcuts FOR ALL USING (true) WITH CHECK (true);
