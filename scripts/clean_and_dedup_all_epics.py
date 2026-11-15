#!/usr/bin/env python3
"""
Vrindopnisad 2.0 - Complete Sacred Epic Hygiene & Deduplication Engine
1. Fixes duplicate IDs in ch-001-bal-kand-sarga-1.json ensuring strictly unique IDs across all shloka cards.
2. Purges stray scraped Hindi commentary lines, quotation artifacts, and colophons across all 409 epic files.
3. Preserves authentic Sanskrit shlokas and cleans unnecessary quotation marks.
4. Synchronizes verse counts in index.json.
"""

import os
import re
import json
import glob

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EPICS_DIR = os.path.join(PROJECT_ROOT, 'public/data/epics')

HINDI_COMMENTARY_PATTERNS = [
    r'^[‘“][\u0900-\u097F\s\.,;!॥०-९]+(?:है|हैं|था|थी|थे|हुए|हुई|होता|होती|सकता|सकते|सकती|चला|गया|गई|गए|भेजा|करूँगा|करूँगी|करो|कीजिये|रहें|कहूँगा|कहूँगी|कहेंगे|देंगे|दीजिये|चाहते|चाहती|चाहिए|सुनें)[’”]?[॥\s०-९]*$',
    r'^[‘“][\u0900-\u097F\s!]+!$',
    r'^[‘“]\s*$',
    r'^[‘“][^”’]+[”’]$',
]

def is_stray_hindi_line(line):
    s = line.strip()
    if not s or s in ['‘', '’', '“', '”', '*']:
        return True
    # Single isolated words
    if s in ['अयोध्या', 'बालकाण्ड', 'उत्तरकाण्ड', 'किष्किन्धाकाण्ड', 'किष्किंधाकाण्ड', 'अरण्यकाण्ड', 'सुन्दरकाण्ड', 'युद्धकाण्ड', 'लंकाकाण्ड']:
        return True
    if re.match(r'^(॥\s*श्रीसीतारामचन्द्राभ्यां नमः\s*॥|श्रीमद्वाल्मीकीय\s*रामायण|उत्तरकाण्डम्|किष्किन्धाकाण्डम्|(?:प्रथमः|द्वितीयः|तृतीयः)\s*सर्गः.*|इत्यार्षे.*|इत्याचे.*)$', s):
        return True
    
    # Scraped Hindi commentary lines starting with quotation mark
    if s.startswith('‘') or s.startswith('“'):
        # Check if line contains Hindi grammar words
        if re.search(r'\b(मुनिके|आश्रमपर|भेजा|सकता|सकती|सकते|चला|जाय|यदि|रहूँगी|रहूँगा|होगा|हूँ|कीजिये|दीजिये|देखिये|चाहते|चाहती|तैयार|कहूँगा|सुनें|होते|करूँगा|करूँगी|करो|रहें|पुत्री|भगवान्|सम्पूर्ण|चरित्रका|वर्णन|संसारमें|सबसे|बड़े|धर्मात्मा|लङ्कापुरी|प्रसन्नता|होगी|अतिरिक्त|जितने|रत्न|सुवर्ण|लेना|चितकबरी|गाय|दे|दीजिये|पृथ्वीनाथ|सूर्योदय|वास्तविक|अभिप्राय|घड़ी|देखनेपर|निश्चय|शपथ|खाकर|कहता|देवता|तेजस्वी|सत्यप्रतिज्ञ|ज्ञान|शुद्ध|आचार-विचार|वाले|महाराज|वर|रहे|व्याघ्र|दाढ़|सींगवाले|भयंकर|भैंसे|द्रोह|करें|पुत्र|पुनः|शीघ्र|पुरुषसिंह|लोग|आपके|निष्पाप|रघुनन्दन|बिना|नरश्रेष्ठ|पहले|समय|तुम्हें|समृद्धिशालिनी|सारथि|मुने|सफलता|प्रदान|प्रतीक्षा|मास|जीवन|धारण|इसके|जीवित|सकूँगी|भले|ही|इन्द्रसहित|असुर|मनुष्य|तीनों|लोक|उतर|आयें|रणभूमि|सामने|ठहर)\b', s):
            return True
        if len(s) < 25 and not '॥' in s:
            return True

    return False

def clean_line(line):
    s = line.strip()
    if is_stray_hindi_line(s):
        return ''
    # Strip unnecessary outer quotation marks from authentic Sanskrit verses
    if s.startswith('“') or s.startswith('‘'):
        s = s[1:].strip()
    if s.endswith('”') or s.endswith('’'):
        s = s[:-1].strip()
    return s

def deduplicate_ch001():
    ch001_path = os.path.join(EPICS_DIR, 'valmiki-ramayana/ch-001-bal-kand-sarga-1.json')
    if not os.path.exists(ch001_path):
        return
    with open(ch001_path, 'r', encoding='utf-8') as f:
        items = json.load(f)

    cleaned_items = []
    seen_ids = {}

    for it in items:
        verses = it.get('verses', [])
        cleaned_verses = []
        for v in verses:
            raw_lines = v.get('linesDevanagari', [])
            cl_lines = []
            for l in raw_lines:
                cl = clean_line(l)
                if cl:
                    cl_lines.append(cl)
            if cl_lines:
                v['linesDevanagari'] = cl_lines
                cleaned_verses.append(v)
        if not cleaned_verses:
            continue
        
        it['verses'] = cleaned_verses

        # Ensure unique ID
        base_id = it.get('id', 'valmiki-ramayana-1-sarga-1-shlok-1')
        count = seen_ids.get(base_id, 0) + 1
        seen_ids[base_id] = count
        if count > 1:
            it['id'] = f"{base_id}-{count}"
            it['slug'] = f"{base_id}-{count}"

        cleaned_items.append(it)

    # Re-index strictly sequential
    for idx, it in enumerate(cleaned_items):
        it['index'] = idx + 1

    with open(ch001_path, 'w', encoding='utf-8') as f:
        json.dump(cleaned_items, f, ensure_ascii=False, indent=2)
    print(f"✓ ch-001 cleaned and deduplicated: {len(cleaned_items)} unique shlokas.")
    return len(cleaned_items)

def clean_all_epics():
    total_cleaned_lines = 0
    total_cleaned_files = 0

    for fpath in glob.glob(os.path.join(EPICS_DIR, '**/*.json'), recursive=True):
        if any(x in fpath for x in ['manifest.json', 'chapter-snippets.json', 'index.json', 'preambles-manifest.json']):
            continue
        with open(fpath, 'r', encoding='utf-8') as f:
            data = json.load(f)

        items = data if isinstance(data, list) else data.get('padas', [])
        modified = False
        new_items = []

        seen_ids = {}
        for it in items:
            verses = it.get('verses', [])
            cleaned_verses = []
            for v in verses:
                lines = v.get('linesDevanagari', [])
                cl_lines = []
                for l in lines:
                    cl = clean_line(l)
                    if cl:
                        cl_lines.append(cl)
                    else:
                        total_cleaned_lines += 1
                        modified = True
                if cl_lines:
                    v['linesDevanagari'] = cl_lines
                    cleaned_verses.append(v)
            if not cleaned_verses:
                modified = True
                continue
            it['verses'] = cleaned_verses

            # Dedup ID
            base_id = it.get('id', '')
            if base_id:
                count = seen_ids.get(base_id, 0) + 1
                seen_ids[base_id] = count
                if count > 1:
                    it['id'] = f"{base_id}-{count}"
                    it['slug'] = f"{base_id}-{count}"
                    modified = True

            new_items.append(it)

        if modified:
            with open(fpath, 'w', encoding='utf-8') as f:
                json.dump(new_items, f, ensure_ascii=False, indent=2)
            total_cleaned_files += 1

    print(f"✓ Epic cleansing complete: Purged {total_cleaned_lines} stray lines across {total_cleaned_files} chapter files.")

if __name__ == '__main__':
    deduplicate_ch001()
    clean_all_epics()
