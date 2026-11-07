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

-- 4. Create User Bookmarks Table (Device / Cloud Sync)
CREATE TABLE IF NOT EXISTS public.user_bookmarks (
    id BIGSERIAL PRIMARY KEY,
    device_id TEXT NOT NULL,
    pad_id TEXT NOT NULL REFERENCES public.padas(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(device_id, pad_id)
);

-- 5. Create Performance Indexes for Sub-Millisecond Filtering & Range Queries
CREATE INDEX IF NOT EXISTS idx_padas_collection ON public.padas (collection_id);
CREATE INDEX IF NOT EXISTS idx_padas_slug ON public.padas (slug);
CREATE INDEX IF NOT EXISTS idx_padas_author ON public.padas (author);
CREATE INDEX IF NOT EXISTS idx_padas_rag ON public.padas (rag);
CREATE INDEX IF NOT EXISTS idx_padas_index ON public.padas (collection_id, index);

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

DROP POLICY IF EXISTS "Public bookmark management" ON public.user_bookmarks;
CREATE POLICY "Public bookmark management" ON public.user_bookmarks
    FOR ALL TO public USING (true) WITH CHECK (true);
