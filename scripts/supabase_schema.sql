-- ==============================================================================
-- Vrindopnisad 2.0 - Supabase Canonical Schema & RLS Setup
-- Copy and paste this script directly into Supabase Dashboard -> SQL Editor -> Run
-- ==============================================================================

-- 1. Create Padas (Verses) Table
CREATE TABLE IF NOT EXISTS public.padas (
    id TEXT PRIMARY KEY,
    collection_id TEXT NOT NULL,
    index INTEGER DEFAULT 1,
    title_devanagari TEXT NOT NULL,
    title_english TEXT,
    author TEXT NOT NULL,
    rag TEXT,
    slug TEXT UNIQUE NOT NULL,
    duration TEXT DEFAULT '05:20',
    verses JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Granthas (Scripture Collections) Table
CREATE TABLE IF NOT EXISTS public.granthas (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    author TEXT NOT NULL,
    count INTEGER DEFAULT 0,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Saints (Rasik Traditions & Masters) Table
CREATE TABLE IF NOT EXISTS public.saints (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    name_eng TEXT,
    slug TEXT UNIQUE NOT NULL,
    biography TEXT,
    article_count INTEGER DEFAULT 0,
    tradition TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create or Migrate User Bookmarks Table (Secure Authenticated & Anonymous Auth Sync)
CREATE TABLE IF NOT EXISTS public.user_bookmarks (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id TEXT,
    pad_id TEXT NOT NULL REFERENCES public.padas(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, pad_id)
);

-- Idempotent Migration: Add user_id column if table was previously created with legacy schema
ALTER TABLE public.user_bookmarks 
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Relax NOT NULL constraint on legacy device_id column if previously applied
DO $$ 
BEGIN 
    ALTER TABLE public.user_bookmarks ALTER COLUMN device_id DROP NOT NULL;
EXCEPTION 
    WHEN OTHERS THEN NULL;
END $$;

-- Clean up any existing duplicate bookmarks if present before creating unique index
DELETE FROM public.user_bookmarks a USING public.user_bookmarks b
WHERE a.id < b.id 
  AND a.user_id = b.user_id 
  AND a.pad_id = b.pad_id;

-- Add Unique Index on (user_id, pad_id) for idempotent uniqueness enforcement
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_bookmarks_user_pad 
    ON public.user_bookmarks (user_id, pad_id) 
    WHERE user_id IS NOT NULL;

-- 5. Create Performance Indexes for Sub-Millisecond Filtering & Range Queries
CREATE INDEX IF NOT EXISTS idx_padas_collection ON public.padas (collection_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_padas_slug ON public.padas (slug);
CREATE INDEX IF NOT EXISTS idx_padas_author ON public.padas (author);
CREATE INDEX IF NOT EXISTS idx_padas_rag ON public.padas (rag);
CREATE INDEX IF NOT EXISTS idx_padas_collection_index ON public.padas (collection_id, "index");
CREATE INDEX IF NOT EXISTS idx_user_bookmarks_user ON public.user_bookmarks (user_id);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.padas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.granthas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_bookmarks ENABLE ROW LEVEL SECURITY;

-- 7. Grant Public Read Access to All Devotees (Clients)
DROP POLICY IF EXISTS "Public read access for padas" ON public.padas;
CREATE POLICY "Public read access for padas" ON public.padas
    FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Public read access for granthas" ON public.granthas;
CREATE POLICY "Public read access for granthas" ON public.granthas
    FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Public read access for saints" ON public.saints;
CREATE POLICY "Public read access for saints" ON public.saints
    FOR SELECT TO public USING (true);

-- 8. Allow Service Role Full Administrative Control for Sync Scripts
DROP POLICY IF EXISTS "Service role full access for padas" ON public.padas;
CREATE POLICY "Service role full access for padas" ON public.padas
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access for granthas" ON public.granthas;
CREATE POLICY "Service role full access for granthas" ON public.granthas
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access for saints" ON public.saints;
CREATE POLICY "Service role full access for saints" ON public.saints
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 9. Secure User Bookmark Access (Strictly isolated by auth.uid())
-- Eliminates device-ID spoofing: only the cryptographically verified owner can view/manage bookmarks
DROP POLICY IF EXISTS "Public bookmark management" ON public.user_bookmarks;
DROP POLICY IF EXISTS "Users can view own bookmarks" ON public.user_bookmarks;
CREATE POLICY "Users can view own bookmarks" ON public.user_bookmarks
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own bookmarks" ON public.user_bookmarks;
CREATE POLICY "Users can insert own bookmarks" ON public.user_bookmarks
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own bookmarks" ON public.user_bookmarks;
CREATE POLICY "Users can delete own bookmarks" ON public.user_bookmarks
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access for bookmarks" ON public.user_bookmarks;
CREATE POLICY "Service role full access for bookmarks" ON public.user_bookmarks
    FOR ALL TO service_role USING (true) WITH CHECK (true);

