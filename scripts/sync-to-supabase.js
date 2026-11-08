/**
 * Vrindopnisad 2.0 - Supabase Ingestion & Synchronization Script
 * Reads canonical JSON datasets and upserts all 4,204+ padas, granthas, and saints
 * into your connected Supabase PostgreSQL database.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://zxwecivyeurnyznfvdhw.supabase.co';
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4d2VjaXZ5ZXVybnl6bmZ2ZGh3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5NDA0NjI3MCwiZXhwIjoyMTA5NjIyMjcwfQ.1Y74OqI1LX9TZYM3ai9Eh9xDfAoCamgLQ2UnxsCOa08';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function syncAll() {
  console.log('🌸 Starting Supabase Data Synchronization for Vrindopnisad 2.0...');
  console.log(`➜ Target URL: ${SUPABASE_URL}\n`);

  // 1. Sync Granthas
  const granthasPath = path.resolve(projectRoot, 'src/data/canonicalGranthas.json');
  const granthas = JSON.parse(fs.readFileSync(granthasPath, 'utf-8'));
  console.log(`1. Uploading ${granthas.length} canonical granthas...`);

  const granthaRows = granthas.map((g) => ({
    id: g.id,
    name: g.name,
    author: g.author,
    count: g.count,
    slug: g.slug || g.id,
    description: g.description,
  }));

  const { error: gErr } = await supabase.from('granthas').upsert(granthaRows, { onConflict: 'id' });
  if (gErr) {
    if (gErr.code === 'PGRST205') {
      console.error('❌ Table "granthas" does not exist yet! Please run scripts/supabase_schema.sql in Supabase SQL Editor first.');
      process.exit(1);
    }
    console.error('Granthas sync error:', gErr);
  } else {
    console.log(`   ✓ Successfully synced ${granthaRows.length} granthas.`);
  }

  // 2. Sync Saints
  const saintsPath = path.resolve(projectRoot, 'src/data/canonicalSaints.json');
  const saints = JSON.parse(fs.readFileSync(saintsPath, 'utf-8'));
  console.log(`\n2. Uploading ${saints.length} canonical rasik saints...`);

  const saintRows = saints.map((s) => ({
    id: s.id,
    name: s.name,
    name_eng: s.nameEng || s.name,
    slug: s.slug || s.id,
    biography: s.biography,
    article_count: s.articleCount || 0,
    tradition: s.tradition,
  }));

  const { error: sErr } = await supabase.from('saints').upsert(saintRows, { onConflict: 'id' });
  if (sErr) {
    console.error('Saints sync error:', sErr);
  } else {
    console.log(`   ✓ Successfully synced ${saintRows.length} saints.`);
  }

  // 3. Sync Padas in Batches with Canonical Collection Normalization
  const padasPath = path.resolve(projectRoot, 'src/data/canonicalPadas.json');
  const padas = JSON.parse(fs.readFileSync(padasPath, 'utf-8'));
  console.log(`\n3. Uploading ${padas.length} canonical padas with lineage normalization in chunked batches...`);

  function resolveCollection(raw) {
    const author = (raw.author || raw.composer || 'श्री रसिक परंपरा').trim();
    const title = (raw.titleDevanagari || raw.title || 'श्री पद').trim();
    let col = raw.collectionId || raw.granthaId || '';
    if (!col || col === 'rasik-vani' || col === 'other') {
      if (/स्तोत्र|अष्टक|कटाक्ष/i.test(title)) col = 'stotras';
      else if (/हरिवंश|हित चौरासी|चतुरासी/i.test(author + title)) col = 'hit-chaurasi';
      else if (/हरिदास|केलिमाल/i.test(author + title)) col = 'kelimal';
      else if (/ध्रुवदास/i.test(author)) col = 'bayalees-leela';
      else if (/सूरदास/i.test(author)) col = 'sur-sagar';
      else if (/रसखान/i.test(author)) col = 'raskhan-padavali';
      else if (/लाल बलबीर/i.test(author)) col = 'braj-binod';
      else if (/कृपालु/i.test(author)) col = 'bhakti-shatak';
      else if (/व्यास/i.test(author)) col = 'vyas-vani';
      else if (/ललित किशोरी|ललित मोहिनी/i.test(author)) col = 'lalit-kishori-vani';
      else if (/बिहारिन|भगवत रसिक/i.test(author)) col = 'biharin-dev-vani';
      else if (/नारायण स्वामी/i.test(author)) col = 'narayan-swami-vani';
      else if (/दोहे|दोहा/i.test(author + title)) col = 'braj-dohe';
      else if (/सवैया/i.test(author + title)) col = 'braj-savaiya';
      else col = 'rasik-vani-sangrah';
    }
    return col;
  }

  const BATCH_SIZE = 150;
  let uploaded = 0;

  for (let i = 0; i < padas.length; i += BATCH_SIZE) {
    const chunk = padas.slice(i, i + BATCH_SIZE);
    const rows = chunk.map((p) => ({
      id: p.id,
      collection_id: resolveCollection(p),
      index: p.index || 1,
      title_devanagari: p.titleDevanagari || p.title || 'श्री पद',
      title_english: p.titleEnglish || p.titleEng || '',
      author: (p.author || 'श्री रसिक परंपरा').trim(),
      rag: (p.rag || '').trim(),
      slug: p.slug || p.id,
      verses: p.verses || p.stanzas || [],
    }));

    const { error: pErr } = await supabase.from('padas').upsert(rows, { onConflict: 'id' });
    if (pErr) {
      console.error(`Error in batch ${i} - ${i + chunk.length}:`, pErr);
    } else {
      uploaded += chunk.length;
      process.stdout.write(`   ✓ Uploaded ${uploaded} / ${padas.length} padas...\r`);
    }
  }

  console.log(`\n✨ Supabase Data Sync Complete! All ${uploaded} padas are now live in Supabase.`);
}

syncAll().catch((err) => {
  console.error('Sync failed:', err);
  process.exit(1);
});

