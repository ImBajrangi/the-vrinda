/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_GROQ_API_KEY?: string;
  readonly VITE_HF_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

