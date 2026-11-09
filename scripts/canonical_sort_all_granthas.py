#!/usr/bin/env python3
"""
Canonical In-Place Sorter and Sanitizer for all 29 Sacred Granthas
Sorts verses strictly by:
 1. Canonical Canto / Kanda / Skandha order
 2. Canonical Chapter / Adhyaya / Sarga order
 3. Canonical Verse / Doha / Shloka number ascending
And cleans all raw HTML entity artifacts (&zwnj;, &zwj;, etc.)
"""

import os
import re
import json
import glob

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../public/data/granthas'))

KANDA_ORDER = [
    'बालकाण्ड', 'अयोध्याकाण्ड', 'अरण्यकाण्ड', 'किष्किन्धाकाण्ड',
    'सुन्दरकाण्ड', 'लंकाकाण्ड', 'युद्धकाण्ड', 'उत्तरकाण्ड'
]
KANDA_RANK = {k: i for i, k in enumerate(KANDA_ORDER)}

def clean_text(val):
    if not isinstance(val, str):
        return val
    val = re.sub(r'&amp;', '&', val, flags=re.IGNORECASE)
    val = re.sub(r'&(?:zwnj|zwj|#x200c|#x200C|#8204|#x200d|#x200D|#8205);?', '', val, flags=re.IGNORECASE)
    val = re.sub(r'[\u200B-\u200D\uFEFF]', '', val)
    val = re.sub(r'&(?:ndash|#8211);', '–', val, flags=re.IGNORECASE)
    val = re.sub(r'&(?:lsquo|#8216);', '‘', val, flags=re.IGNORECASE)
    val = re.sub(r'&(?:rsquo|#8217);', '’', val, flags=re.IGNORECASE)
    val = re.sub(r'&(?:ldquo|#8220);', '“', val, flags=re.IGNORECASE)
    val = re.sub(r'&(?:rdquo|#8221);', '”', val, flags=re.IGNORECASE)
    val = re.sub(r'&(?:bull|#8226);', '•', val, flags=re.IGNORECASE)
    val = re.sub(r'&(?:nbsp|#160);', ' ', val, flags=re.IGNORECASE)
    val = re.sub(r'&(?:quot|#34);', '"', val, flags=re.IGNORECASE)
    val = re.sub(r'&(?:apos|#39);', "'", val, flags=re.IGNORECASE)
    return val

def sanitize_pad(pad):
    if 'titleDevanagari' in pad:
        pad['titleDevanagari'] = clean_text(pad['titleDevanagari'])
    if 'titleEnglish' in pad:
        pad['titleEnglish'] = clean_text(pad['titleEnglish'])
    if 'author' in pad:
        pad['author'] = clean_text(pad['author'])
    if 'chapterName' in pad:
        pad['chapterName'] = clean_text(pad['chapterName'])
    if 'rag' in pad and pad['rag']:
        pad['rag'] = clean_text(pad['rag'])
    if 'verses' in pad and isinstance(pad['verses'], list):
        for v in pad['verses']:
            if 'linesDevanagari' in v and isinstance(v['linesDevanagari'], list):
                v['linesDevanagari'] = [clean_text(l) for l in v['linesDevanagari']]
            if 'linesEnglish' in v and isinstance(v['linesEnglish'], list):
                v['linesEnglish'] = [clean_text(l) for l in v['linesEnglish']]
            if 'linesTransliteration' in v and isinstance(v['linesTransliteration'], list):
                v['linesTransliteration'] = [clean_text(l) for l in v['linesTransliteration']]
    return pad

def extract_primary_chapter_key(p):
    cid = p.get('chapterId') or ''
    cname = p.get('chapterName') or ''
    
    # 1. Kanda rank check (Manas / Valmiki)
    for k, rank in KANDA_RANK.items():
        if k in cname or k in cid:
            sarga_m = re.search(r'(?:सर्ग|sarga)[^\d]*(\d+)', cname + ' ' + cid, re.IGNORECASE)
            sarga_num = int(sarga_m.group(1)) if sarga_m else 0
            return (rank, sarga_num)
            
    # 2. Skandha / Canto (Bhagavatam)
    skandha_m = re.search(r'(?:स्कन्ध|skandha|canto)[^\d]*(\d+)', cname + ' ' + cid, re.IGNORECASE)
    if skandha_m:
        sk_num = int(skandha_m.group(1))
        adh_m = re.search(r'(?:अध्याय|adhyay|adhyaya|chapter)[^\d]*(\d+)', cname + ' ' + cid, re.IGNORECASE)
        adh_num = int(adh_m.group(1)) if adh_m else 0
        return (sk_num, adh_num)
        
    # 3. Adhyaya / Chapter (Gita / Durga Saptashati)
    adh_m = re.search(r'(?:अध्याय|adhyay|adhyaya|chapter)[^\d]*(\d+)', cname + ' ' + cid, re.IGNORECASE)
    if adh_m:
        return (0, int(adh_m.group(1)))
        
    # 4. Fallback: string key
    return (999, 0)

def extract_verse_num(p):
    v = p.get('verseNumber')
    if isinstance(v, int):
        return v
    if isinstance(v, str) and v.isdigit():
        return int(v)
    title = p.get('titleDevanagari', '')
    m = re.search(r'(\d+)\s*$', title)
    if m:
        return int(m.group(1))
    idx = p.get('index')
    if isinstance(idx, int):
        return idx
    return 0

def sort_grantha_pads(pads, grantha_id):
    def key_fn(p):
        ch_key = extract_primary_chapter_key(p)
        v_num = extract_verse_num(p)
        return (ch_key, v_num)
    
    return sorted(pads, key=key_fn)

def process_all():
    files = sorted(glob.glob(os.path.join(DATA_DIR, '*.json')))
    print(f"Found {len(files)} grantha files in {DATA_DIR}")
    
    total_pads = 0
    for fpath in files:
        fname = os.path.basename(fpath)
        gid = fname.replace('.json', '')
        with open(fpath, 'r', encoding='utf-8') as f:
            pads = json.load(f)
        
        if not isinstance(pads, list):
            continue
            
        pads = [sanitize_pad(p) for p in pads]
        pads = sort_grantha_pads(pads, gid)
        for idx, p in enumerate(pads, start=1):
            p['index'] = idx
            
        with open(fpath, 'w', encoding='utf-8') as f:
            json.dump(pads, f, ensure_ascii=False, indent=2)
            
        total_pads += len(pads)
        first_num = pads[0].get('verseNumber', pads[0].get('index', 1))
        last_num = pads[-1].get('verseNumber', pads[-1].get('index', len(pads)))
        print(f"✓ {gid:26}: {len(pads):5} verses sorted (start={first_num}, end={last_num})")
        
    print(f"\nSuccessfully canonical-sorted and sanitized all {total_pads} verses!")

if __name__ == '__main__':
    process_all()
