import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) ||
  'https://zxwecivyeurnyznfvdhw.supabase.co';

const SUPABASE_ANON_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4d2VjaXZ5ZXVybnl6bmZ2ZGh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQwNDYyNzAsImV4cCI6MjEwOTYyMjI3MH0.RJA0oYSy6rOIDYihis1dymV_dYE6TSEJelk9iN1MYuA';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export interface SupabasePadaRow {
  id: string;
  collection_id: string;
  index: number;
  title_devanagari: string;
  title_english?: string;
  author: string;
  rag?: string;
  slug: string;
  verses: any;
  created_at?: string;
}

export interface SupabaseGranthaRow {
  id: string;
  name: string;
  author: string;
  count: number;
  slug: string;
  description: string;
}

export interface SupabaseSaintRow {
  id: string;
  name: string;
  name_eng: string;
  slug: string;
  biography: string;
  article_count: number;
  tradition: string;
}

