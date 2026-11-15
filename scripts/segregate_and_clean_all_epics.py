#!/usr/bin/env python3
"""
Vrindopnisad 2.0 - Sacred Epic Content Segregation & Shloka Unbundling Engine
1. De-interleaves mixed sargas in Valmiki Ramayana (Kishkindhakanda Pampa lament vs Uttarakanda Agastya stuti).
2. Unbundles multi-shloka clumps (e.g. Shloka 28 with 28, 29, 30, 31, 32) into pristine standalone shloka cards.
3. Purges stray scraper artifacts across all 5 epics and 29 granthas:
   - Isolated words alone on lines: 'अयोध्या', 'बालकाण्ड', 'उत्तरकाण्ड'
   - Stray Hindi commentary prefixes like '‘पिताजी!...'
   - Scraper colophons like '॥ श्रीसीतारामचन्द्राभ्यां नमः॥', 'श्रीमद्वाल्मीकीय रामायण', etc.
"""

import os
import re
import json
import glob

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EPICS_DIR = os.path.join(PROJECT_ROOT, 'public/data/epics')
GRANTHAS_DIR = os.path.join(PROJECT_ROOT, 'public/data/granthas')

DEV_NUM_MAP = str.maketrans('०१२३४५६७८९', '0123456789')

def to_int(s):
    try:
        return int(str(s).translate(DEV_NUM_MAP))
    except:
        return 0

def clean_stray_line(line):
    if not line:
        return ''
    s = line.strip()
    # 1. Single word stray artifacts
    if s in ['अयोध्या', 'बालकाण्ड', 'उत्तरकाण्ड', 'किष्किन्धाकाण्ड', 'किष्किंधाकाण्ड', 'अरण्यकाण्ड', 'सुन्दरकाण्ड', 'युद्धकाण्ड']:
        return ''
    # 2. Scraper colophon & header lines
    if re.match(r'^(॥\s*श्रीसीतारामचन्द्राभ्यां नमः\s*॥|श्रीमद्वाल्मीकीय\s*रामायण|उत्तरकाण्डम्|किष्किन्धाकाण्डम्|(?:प्रथमः|द्वितीयः|तृतीयः)\s*सर्गः.*|इत्यार्षे.*|इत्याचे.*)$', s):
        return ''
    # 3. Stray Hindi translation quotes
    if re.match(r'^[‘“]पिताजी!', s):
        return ''
    return s

def clean_verse_lines(lines):
    cleaned = []
    for l in lines:
        cl = clean_stray_line(l)
        if cl:
            cleaned.append(cl)
    return cleaned

def is_uttara_verse(text):
    uttara_markers = [
        'उत्तरकाण्ड', 'राक्षसानां वधे', 'इत्याचे श्रीमद्रामायणे', 'अगस्त्य', 'कौशिकोऽथ', 'वसिष्ठः कश्यपो',
        'सम्प्राप्यैते', 'प्रतीहारस्तत', 'रामोऽभिवाद्य', 'कुशलं नो महाबाहो', 'नहि भारः स ते राम',
        'दिष्ट्या त्वया हतो राम', 'लक्ष्मणेन च धर्मात्मन्', 'दिष्ट्या प्रहस्तो', 'यस्य प्रमाणाद्',
        'त्रिशिराश्चातिकायश्च', 'कुम्भश्चैव निकुम्भश्च', 'युद्धोन्मत्तश्च', 'कुर्वन्तः कदनं',
        'दिष्ट्या त्वं राक्षसेन्द्रेण', 'दिष्टया तस्य महाबाहो', 'अभिनन्दाम ते सर्वे',
        'एते चान्ये च बहवो राक्षसाः', 'श्रुत्वा तु वचनं तेषां', 'महोदरं प्रहस्तं च',
        'अतिकायं त्रिशिरसं', 'कीदृशो वै प्रभावोऽस्य', 'शक्यं यदि मया श्रोतुं', 'शक्रोऽपि विजितस्तेन',
        'दत्त्वा पुण्यामिमां वीर'
    ]
    return any(m in text for m in uttara_markers)

def process_ch001():
    ch001_path = os.path.join(EPICS_DIR, 'valmiki-ramayana/ch-001-bal-kand-sarga-1.json')
    if not os.path.exists(ch001_path):
        print(f"Warning: {ch001_path} not found")
        return

    with open(ch001_path, 'r', encoding='utf-8') as f:
        items = json.load(f)

    print(f"Processing ch-001 with {len(items)} items...")

    kishkindha_shlokas = []
    uttara_shlokas = []

    for it in items:
        verses = it.get('verses', [{}])
        raw_lines = verses[0].get('linesDevanagari', []) if verses else []
        lines = clean_verse_lines(raw_lines)
        if not lines:
            continue
        text = ' '.join(lines)
        is_utt = is_uttara_verse(text)

        # Check for multiple embedded ॥ N ॥ in this item
        curr_lines = []
        target = uttara_shlokas if is_utt else kishkindha_shlokas

        for l in lines:
            curr_lines.append(l)
            m = re.search(r'॥\s*([\d०-९]+)\s*॥', l)
            if m:
                v_num = to_int(m.group(1))
                target.append({
                    'num': v_num,
                    'lines': curr_lines,
                    'orig_id': it.get('id'),
                    'is_uttara': is_utt
                })
                curr_lines = []
        if curr_lines:
            # Trailing lines
            v_num = it.get('verseNumber', 1)
            target.append({
                'num': v_num,
                'lines': curr_lines,
                'orig_id': it.get('id'),
                'is_uttara': is_utt
            })

    # Resolve dangling single-line couplets in Kishkindha
    resolved_kishkindha = []
    idx = 0
    while idx < len(kishkindha_shlokas):
        curr = kishkindha_shlokas[idx]
        # If single line without terminal danda and next starts with terminal danda
        if len(curr['lines']) == 1 and not re.search(r'॥\s*[\d०-९]+\s*॥', curr['lines'][0]) and idx + 1 < len(kishkindha_shlokas):
            nxt = kishkindha_shlokas[idx + 1]
            merged_lines = curr['lines'] + nxt['lines']
            resolved_kishkindha.append({
                'num': nxt['num'],
                'lines': merged_lines,
                'orig_id': nxt['orig_id'],
                'is_uttara': False
            })
            idx += 2
            continue
        resolved_kishkindha.append(curr)
        idx += 1

    # Sort Kishkindha shlokas strictly by verse number
    resolved_kishkindha.sort(key=lambda s: s['num'])
    # Sort Uttara shlokas strictly by verse number
    uttara_shlokas.sort(key=lambda s: s['num'])

    # Build segregated pristine items for ch-001
    final_items = []
    card_index = 1

    # Section 1: Kishkindha Sarga 1 (Pampa Darshan)
    for sh in resolved_kishkindha:
        v_num = sh['num']
        item_id = f"valmiki-ramayana-1-sarga-1-shlok-{v_num}"
        final_items.append({
            'id': item_id,
            'collectionId': 'valmiki-ramayana',
            'index': card_index,
            'titleDevanagari': f"वाल्मीकि रामायण, बालकाण्ड, सर्ग 1, श्लोक {v_num}",
            'author': 'महर्षि वाल्मीकि',
            'slug': item_id,
            'verses': [{
                'stanzaNumber': 1,
                'linesDevanagari': sh['lines']
            }],
            'chapterId': 'bal-kand-sarga-1',
            'chapterName': 'बालकाण्ड, सर्ग 1',
            'verseNumber': v_num
        })
        card_index += 1

    # Section 2: Uttara Sarga 1 (Agastya Arrival & Indrajit Slaying Praise)
    for sh in uttara_shlokas:
        v_num = sh['num']
        item_id = f"valmiki-ramayana-1-sarga-1-shlok-uttara-{v_num}"
        final_items.append({
            'id': item_id,
            'collectionId': 'valmiki-ramayana',
            'index': card_index,
            'titleDevanagari': f"वाल्मीकि रामायण, बालकाण्ड (उत्तरकाण्ड प्रसंग), सर्ग 1, श्लोक {v_num}",
            'author': 'महर्षि वाल्मीकि',
            'slug': item_id,
            'verses': [{
                'stanzaNumber': 1,
                'linesDevanagari': sh['lines']
            }],
            'chapterId': 'bal-kand-sarga-1',
            'chapterName': 'बालकाण्ड, सर्ग 1',
            'verseNumber': v_num
        })
        card_index += 1

    print(f"Ch-001 de-interleaved & unbundled: {len(final_items)} pristine shlokas (Kishkindha: {len(resolved_kishkindha)}, Uttara: {len(uttara_shlokas)})")

    with open(ch001_path, 'w', encoding='utf-8') as f:
        json.dump(final_items, f, ensure_ascii=False, indent=2)

def clean_all_epic_files():
    print("Purging stray scraper artifacts across all epic chapters...")
    cleaned_files = 0
    cleaned_lines_count = 0

    for fpath in glob.glob(os.path.join(EPICS_DIR, '**/*.json'), recursive=True):
        if 'manifest.json' in fpath or 'chapter-snippets.json' in fpath or 'index.json' in fpath:
            continue
        try:
            with open(fpath, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except Exception as e:
            continue

        items = data if isinstance(data, list) else data.get('padas', [])
        modified = False

        for it in items:
            for v in it.get('verses', []):
                lines = v.get('linesDevanagari', [])
                new_lines = clean_verse_lines(lines)
                if len(new_lines) != len(lines):
                    cleaned_lines_count += (len(lines) - len(new_lines))
                    v['linesDevanagari'] = new_lines
                    modified = True

        if modified:
            with open(fpath, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            cleaned_files += 1

    print(f"Cleaned {cleaned_lines_count} stray lines across {cleaned_files} epic files.")

def clean_all_grantha_files():
    print("Purging stray scraper artifacts across public/data/granthas/...")
    cleaned_lines_count = 0

    for fpath in glob.glob(os.path.join(GRANTHAS_DIR, '*.json')):
        try:
            with open(fpath, 'r', encoding='utf-8') as f:
                items = json.load(f)
        except:
            continue

        if not isinstance(items, list):
            continue

        modified = False
        for it in items:
            for v in it.get('verses', []):
                lines = v.get('linesDevanagari', [])
                new_lines = clean_verse_lines(lines)
                if len(new_lines) != len(lines):
                    cleaned_lines_count += (len(lines) - len(new_lines))
                    v['linesDevanagari'] = new_lines
                    modified = True

        if modified:
            with open(fpath, 'w', encoding='utf-8') as f:
                json.dump(items, f, ensure_ascii=False, indent=2)

    print(f"Cleaned {cleaned_lines_count} stray lines in public/data/granthas/.")

if __name__ == '__main__':
    clean_all_grantha_files()
    clean_all_epic_files()
    process_ch001()
    print("✨ Segregation & cleaning engine completed successfully!")
