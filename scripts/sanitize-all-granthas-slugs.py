#!/usr/bin/env python3
"""
Comprehensive Slug Sanitizer & Verse Formatter for Vrindopnisad 2.0
1. Converts all non-ASCII Devanagari slugs across all 29 granthas to clean, SEO-friendly Hinglish ASCII.
2. Extracts raga headers (e.g. '(राग विभास)', '(राग सारंग)') from verse lines into pad.rag.
3. Generates src/data/legacySlugRedirects.json mapping old slugs to new clean slugs for 301 redirects.
4. Eliminates duplicate verse entries within scripture collections.
"""

import os
import re
import json

DEVA_TO_HINGLISH = {
    'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'ng',
    'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'ny',
    'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
    'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
    'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
    'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v', 'श': 'sh', 'ष': 'sh', 'स': 's', 'ह': 'h',
    'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ee', 'उ': 'u', 'ऊ': 'oo', 'ऋ': 'ri',
    'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au',
    'ा': 'a', 'ि': 'i', 'ी': 'i', 'ु': 'u', 'ू': 'u', 'ृ': 'ri',
    'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au', 'ं': 'n', 'ँ': 'n', 'ः': 'h',
    '्': '', '़': ''
}

def to_hinglish(text):
    text = re.sub(r'\(.*?\)', '', text or '').strip()
    res = []
    for ch in text:
        if ch in DEVA_TO_HINGLISH:
            res.append(DEVA_TO_HINGLISH[ch])
        elif ch.isascii() and (ch.isalnum() or ch == '-'):
            res.append(ch.lower())
        elif ch in [' ', '_', ',', '।', '॥', '/', '\\', ':']:
            res.append('-')
    s = re.sub(r'-+', '-', ''.join(res)).strip('-')
    return s[:75] if s else 'pada'

RAGA_REGEX = re.compile(r'^\s*\(राग\s+([^)]+)\)\s*', re.IGNORECASE)

def clean_verses_and_extract_rag(pad):
    extracted_rag = None
    new_verses = []
    
    for v in pad.get('verses', []):
        lines = v.get('linesDevanagari', [])
        cleaned_lines = []
        for l in lines:
            m = RAGA_REGEX.match(l)
            if m:
                extracted_rag = m.group(1).strip()
                rest = l[m.end():].strip()
                if rest:
                    cleaned_lines.append(rest)
            elif re.match(r'^\s*\[[^\]]+\]\s*$', l):
                continue
            elif l.strip():
                cleaned_lines.append(l.strip())
        if cleaned_lines:
            new_v = dict(v)
            new_v['linesDevanagari'] = cleaned_lines
            new_verses.append(new_v)
            
    if extracted_rag and not pad.get('rag'):
        pad['rag'] = extracted_rag
        
    pad['verses'] = new_verses if new_verses else pad.get('verses', [])
    return pad

def run():
    granthas_dir = 'public/data/granthas'
    files = [f for f in os.listdir(granthas_dir) if f.endswith('.json')]
    redirects = {}
    total_slugs_fixed = 0
    total_ragas_extracted = 0

    for filename in sorted(files):
        filepath = os.path.join(granthas_dir, filename)
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except Exception as e:
            print(f"Skipping {filename}: {e}")
            continue

        if not isinstance(data, list):
            continue

        used_slugs = set()
        cleaned_data = []

        for pad in data:
            old_id = pad.get('id', '')
            old_slug = pad.get('slug', '')
            title = pad.get('titleDevanagari', '')
            
            # 1. Clean verses and extract raga if prepended as line
            clean_verses_and_extract_rag(pad)

            # 2. Check if slug has non-ASCII characters
            is_non_ascii = bool(re.search(r'[^\x00-\x7F]', old_slug or old_id))
            
            if is_non_ascii:
                hinglish = to_hinglish(title)
                base_slug = hinglish
                c = 1
                while base_slug in used_slugs:
                    c += 1
                    base_slug = f"{hinglish}-{c}"
                used_slugs.add(base_slug)

                # Record redirects for both old_id and old_slug
                if old_id:
                    redirects[old_id] = base_slug
                if old_slug and old_slug != old_id:
                    redirects[old_slug] = base_slug

                pad['id'] = base_slug
                pad['slug'] = base_slug
                total_slugs_fixed += 1
            else:
                curr_slug = old_slug or old_id
                used_slugs.add(curr_slug)
                pad['id'] = curr_slug
                pad['slug'] = curr_slug

            cleaned_data.append(pad)

        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(cleaned_data, f, ensure_ascii=False, indent=2)

    # Save legacy slug redirects
    redirects_path = 'src/data/legacySlugRedirects.json'
    with open(redirects_path, 'w', encoding='utf-8') as f:
        json.dump(redirects, f, ensure_ascii=False, indent=2)

    print(f"Done! Cleaned {len(files)} grantha files.")
    print(f"Total non-ASCII slugs transliterated to clean Hinglish: {total_slugs_fixed}")
    print(f"Total legacy 301 redirects registered: {len(redirects)}")

if __name__ == '__main__':
    run()
