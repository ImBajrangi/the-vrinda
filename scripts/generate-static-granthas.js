/**
 * Vrindopnisad 2.0 - Static Scripture Chunking & CDN Asset Sync
 * Ensures all partitioned canonical scripture chunks (44,368+ verses)
 * and lightweight catalog/manifest files are synchronized to public and dist.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

export function generateStaticGranthas(outputDirs = ['public', 'dist']) {
  console.log('🌸 Synchronizing Master Scripture Chunks (44,368+ verses) to CDN build targets...');

  const sourceDataDir = path.resolve(projectRoot, 'public/data');
  const sourceGranthasDir = path.resolve(sourceDataDir, 'granthas');

  if (!fs.existsSync(sourceGranthasDir)) {
    console.warn('⚠️ Warning: public/data/granthas not found. Run python3 scripts/merge-master-content.py first.');
    return;
  }

  const chunkFiles = fs.readdirSync(sourceGranthasDir).filter((f) => f.endsWith('.json'));
  console.log(`  ✓ Found ${chunkFiles.length} canonical scripture chunks in public/data/granthas`);

  for (const dirName of outputDirs) {
    if (dirName === 'public') continue; // Source is already in public
    const baseDir = path.resolve(projectRoot, dirName);
    if (!fs.existsSync(baseDir)) continue;

    const targetDataDir = path.resolve(baseDir, 'data');
    const targetGranthasDir = path.resolve(targetDataDir, 'granthas');
    fs.mkdirSync(targetGranthasDir, { recursive: true });

    // Sync manifest.json
    if (fs.existsSync(path.resolve(sourceDataDir, 'manifest.json'))) {
      fs.copyFileSync(
        path.resolve(sourceDataDir, 'manifest.json'),
        path.resolve(targetDataDir, 'manifest.json')
      );
    }

    // Sync catalog.json
    if (fs.existsSync(path.resolve(sourceDataDir, 'catalog.json'))) {
      fs.copyFileSync(
        path.resolve(sourceDataDir, 'catalog.json'),
        path.resolve(targetDataDir, 'catalog.json')
      );
    }

    // Remove redundant monolithic canonicalPadas.json to preserve storage diet
    const staleCanonical = path.resolve(targetDataDir, 'canonicalPadas.json');
    if (fs.existsSync(staleCanonical)) {
      fs.unlinkSync(staleCanonical);
    }

    // Sync all grantha chunks
    for (const file of chunkFiles) {
      fs.copyFileSync(
        path.resolve(sourceGranthasDir, file),
        path.resolve(targetGranthasDir, file)
      );
    }
    console.log(`  ✓ Copied ${chunkFiles.length} scripture chunks, manifest, and catalog to ${dirName}/data/`);
  }

  console.log('✨ All CDN Scripture Chunks synced successfully!\n');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateStaticGranthas();
}
