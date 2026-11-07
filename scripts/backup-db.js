/**
 * Vrindopnisad 2.0 - Production-Hardened Independent Database Export & Restore Utility
 * Addresses Supabase Free-Tier constraint: Supabase Free does NOT provide automated platform backups.
 * 
 * Features:
 * 1. Paginates Supabase REST queries in batches of 1,000 rows to prevent truncation.
 * 2. Compresses with Gzip (level 9).
 * 3. Encrypts archive with AES-256-GCM using BACKUP_ENCRYPTION_KEY.
 * 4. Fails with non-zero exit code if credentials are missing or errors occur.
 * 5. Performs automated roundtrip decryption & decompression restore verification.
 */

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://zxwecivyeurnyznfvdhw.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const ENCRYPTION_SECRET = process.env.BACKUP_ENCRYPTION_KEY;

if (!ENCRYPTION_SECRET || ENCRYPTION_SECRET.length < 32) {
  throw new Error(
    'BACKUP_ENCRYPTION_KEY must be configured with at least 32 characters.'
  );
}

function deriveKey(secret) {
  return crypto.createHash('sha256').update(String(secret)).digest();
}

function encrypt(buffer, key) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Format: [12 bytes IV] + [16 bytes Tag] + [Encrypted Payload]
  return Buffer.concat([iv, tag, encrypted]);
}

function decrypt(encryptedBuffer, key) {
  const iv = encryptedBuffer.subarray(0, 12);
  const tag = encryptedBuffer.subarray(12, 28);
  const data = encryptedBuffer.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]);
}

async function runBackup() {
  console.log('📦 Starting Vrindopnisad Independent Database Export...');

  if (!SUPABASE_SERVICE_KEY) {
    console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required to execute a database backup.');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const backupDir = path.resolve(projectRoot, 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPayload = {
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    sourceUrl: SUPABASE_URL,
    tables: {
      user_bookmarks: [],
    },
  };

  // 1. Paginated Export of user_bookmarks (Batches of 1,000)
  const PAGE_SIZE = 1000;
  let offset = 0;
  let totalBookmarks = 0;

  console.log('  → Fetching public.user_bookmarks in paginated batches...');
  while (true) {
    const { data, error } = await supabase
      .from('user_bookmarks')
      .select('id, user_id, device_id, pad_id, created_at')
      .order('id', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      console.error(`❌ Database query error at offset ${offset}:`, error.message);
      process.exit(1);
    }

    if (!data || data.length === 0) break;

    backupPayload.tables.user_bookmarks.push(...data);
    totalBookmarks += data.length;
    offset += PAGE_SIZE;

    if (data.length < PAGE_SIZE) break;
  }
  console.log(`  ✓ Successfully exported ${totalBookmarks} user bookmarks.`);

  // 2. Gzip Compression (Level 9)
  const jsonStr = JSON.stringify(backupPayload);
  const rawBytes = Buffer.byteLength(jsonStr);
  const gzBuffer = zlib.gzipSync(Buffer.from(jsonStr), { level: 9 });
  console.log(`  ✓ Compressed raw JSON (${(rawBytes / 1024).toFixed(1)} KB) to Gzip (${(gzBuffer.length / 1024).toFixed(1)} KB).`);

  // 3. AES-256-GCM Encryption
  const key = deriveKey(ENCRYPTION_SECRET);
  const encryptedPayload = encrypt(gzBuffer, key);
  const backupFile = path.resolve(backupDir, `vrind_backup_${timestamp}.enc`);

  fs.writeFileSync(backupFile, encryptedPayload);
  console.log(`✨ Encrypted backup written: ${path.basename(backupFile)} (${(encryptedPayload.length / 1024).toFixed(1)} KB)`);

  // 4. Automated Restore & Structural Integrity Verification
  console.log('🔍 Executing Automated Restore Verification...');
  try {
    const fileBytes = fs.readFileSync(backupFile);
    const decryptedGz = decrypt(fileBytes, key);
    const uncompressedJson = zlib.gunzipSync(decryptedGz).toString('utf-8');
    const restored = JSON.parse(uncompressedJson);

    if (
      restored.version === '2.0.0' &&
      Array.isArray(restored.tables?.user_bookmarks) &&
      restored.tables.user_bookmarks.length === totalBookmarks
    ) {
      console.log(`  ✓ Restore verification PASSED: Decrypted, decompressed, and validated ${restored.tables.user_bookmarks.length} records.`);
    } else {
      console.error('❌ Restore verification FAILED: Record mismatch or corrupt structure.');
      process.exit(1);
    }
  } catch (verifyErr) {
    console.error('❌ Restore verification FAILED with exception:', verifyErr);
    process.exit(1);
  }

  console.log('🎉 Backup & Verification pipeline completed successfully with 100% integrity.');
}

runBackup().catch((err) => {
  console.error('Fatal backup exception:', err);
  process.exit(1);
});
