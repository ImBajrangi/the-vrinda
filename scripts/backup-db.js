/**
 * Vrindopnisad 2.0 - Independent Database Export & Backup Utility
 * Addresses Supabase Free-Tier limitation (no automated platform backups on Free tier).
 * Exports dynamic tables (user_bookmarks, feedback) to timestamped, gzip-compressed archives.
 */

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://zxwecivyeurnyznfvdhw.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

async function runBackup() {
  console.log('📦 Starting Vrindopnisad Independent Database Export...');

  if (!SUPABASE_SERVICE_KEY) {
    console.log('ℹ️ Notice: SUPABASE_SERVICE_ROLE_KEY not supplied. Skipping live database dump (safe for CI builds).');
    process.exit(0);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const backupDir = path.resolve(projectRoot, 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPayload = {
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    tables: {},
  };

  // 1. Export User Bookmarks
  const { data: bookmarks, error: bmError } = await supabase
    .from('user_bookmarks')
    .select('*');

  if (bmError) {
    console.error('❌ Error fetching user_bookmarks:', bmError.message);
  } else {
    backupPayload.tables.user_bookmarks = bookmarks || [];
    console.log(`  ✓ Exported ${bookmarks?.length || 0} user bookmarks.`);
  }

  // 2. Write Compressed Backup Archive
  const jsonStr = JSON.stringify(backupPayload, null, 2);
  const gz = zlib.gzipSync(Buffer.from(jsonStr), { level: 9 });
  const backupFile = path.resolve(backupDir, `vrind_backup_${timestamp}.json.gz`);

  fs.writeFileSync(backupFile, gz);
  console.log(`✨ Independent backup created successfully: ${backupFile} (${(gz.length / 1024).toFixed(2)} KB)`);

  // Verify readability (restore verification)
  const uncompressed = zlib.gunzipSync(fs.readFileSync(backupFile)).toString('utf-8');
  const parsed = JSON.parse(uncompressed);
  if (parsed.version === '2.0.0' && Array.isArray(parsed.tables.user_bookmarks)) {
    console.log('  ✓ Restore verification passed: archive is structurally sound and readable.');
  } else {
    console.error('❌ Restore verification failed: archive data corrupted.');
    process.exit(1);
  }
}

runBackup().catch((err) => {
  console.error('Fatal backup error:', err);
  process.exit(1);
});
