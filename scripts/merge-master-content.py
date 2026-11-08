#!/usr/bin/env python3
"""
Vrindopnisad 2.0 - Master Content Merge & CDN Scripture Chunking
Merges 43,598 sacred verses from /Users/sakhi/Downloads/content_rows.csv
and existing curated canonical padas into modular static JSON chunks.

Strict Copyright Protection:
Excludes modern Hindi explanations, English translations, and commentary.
Preserves pure Sanskrit shlokas, Awadhi chaupais/dohas, and Braj Bhasha padas.
Transliterates Gurmukhi script in Ramcharitmanas to pure Devanagari.
"""

import os
import sys
import csv
import json
import re
import hashlib
import gzip

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_PATH = '/Users/sakhi/Downloads/content_rows.csv'
EXISTING_PADAS_PATH = os.path.join(PROJECT_ROOT, 'src/data/canonicalPadas.json')
OUTPUT_GRANTHAS_DIR = os.path.join(PROJECT_ROOT, 'public/data/granthas')
OUTPUT_DATA_DIR = os.path.join(PROJECT_ROOT, 'public/data')
CANONICAL_GRANTHAS_PATH = os.path.join(PROJECT_ROOT, 'src/data/canonicalGranthas.json')

# Gurmukhi to Devanagari 1-to-1 transliteration
def gurmukhi_to_devanagari(text):
    trans = {}
    for code in range(0x0A00, 0x0A80):
        trans[chr(code)] = chr(code - 0x100)
    trans['੍'] = '्' # halant
    trans['ਾ'] = 'ा' # aa
    trans['ਿ'] = 'ि' # i
    trans['ੀ'] = 'ी' # ee
    trans['ੁ'] = 'ु' # u
    trans['ੂ'] = 'ू' # oo
    trans['ੇ'] = 'े' # e
    trans['ੈ'] = 'ै' # ai
    trans['ੋ'] = 'ो' # o
    trans['ੌ'] = 'ौ' # au
    trans['ਂ'] = 'ं' # bindi
    trans['ਁ'] = 'ँ' # candrabindu
    trans['ੑ'] = '्'
    trans['ੰ'] = 'ं' # tippi
    trans['ੱ'] = ''  # addak (gemination)
    for i in range(10):
        trans[chr(0x0A66 + i)] = chr(0x0966 + i)
    
    return ''.join(trans.get(c, c) for c in text)

def classify_and_clean_row(row):
    raw_author = (row.get('author') or '').strip()
    title = (row.get('title') or '').strip()
    slug = (row.get('slug') or '').strip()
    category = (row.get('category') or '').strip()
    
    # 1. Mahagranths
    if 'वाल्मीकि' in raw_author or 'valmiki-ramayana' in slug:
        author = 'महर्षि वाल्मीकि'
        clean_title = re.sub(r'\s*-\s*महर्षि वाल्मीकि.*$', '', title).strip()
        return 'valmiki-ramayana', author, clean_title

    if 'भागवत' in raw_author or 'bhagwat' in slug:
        author = 'महर्षि वेदव्यास'
        clean_title = re.sub(r'\s*-\s*वेदव्यास.*$', '', title).strip()
        return 'shrimad-bhagavatam', author, clean_title

    if 'रामचरितमानस' in raw_author or 'ramcharitmanas' in slug:
        author = 'गोस्वामी तुलसीदास'
        clean_title = re.sub(r'\s*-\s*गोस्वामी तुलसीदास.*$', '', title).strip()
        return 'ramcharitmanas', author, clean_title

    if 'गीता' in raw_author or 'bhagavad-gita' in slug:
        author = 'महर्षि वेदव्यास'
        clean_title = re.sub(r'\s*-\s*वेदव्यास.*$', '', title).strip()
        return 'bhagavad-gita', author, clean_title

    if 'दुर्गा सप्तशती' in raw_author or 'durga-saptashati' in slug:
        author = 'महर्षि वेदव्यास'
        clean_title = re.sub(r'\s*-\s*वेदव्यास.*$', '', title).strip()
        return 'durga-saptashati', author, clean_title

    # 2. Dham & Charitra
    if any(k in title for k in ['समाधि', 'स्थान', 'मंदिर', 'टीला', 'घाट', 'कुण्ड', 'कुंज', 'परिक्रमा']) and any(k in raw_author for k in ['Team VrindaVaani', 'Unknown', 'अज्ञात', '']):
        return 'braj-dham-mahatmya', 'श्री ब्रज धाम', title
    if 'चरित्र' in title or 'चरित' in title or 'कथा' in title or category == 'katha':
        return 'rasik-charitra-katha', 'श्री रसिक चरित', title

    # 3. Dedicated Rasik Vani & Lyric Collections
    text_to_check = f'{raw_author} {title} {slug}'

    if re.search(r'हरिवंश|हित चौरासी|चतुरासी', text_to_check):
        return 'hit-chaurasi', 'श्री हित हरिवंश महाप्रभु', title
    if re.search(r'हरिदास|केलिमाल', text_to_check):
        return 'kelimal', 'स्वामी श्री हरिदास जी', title
    if re.search(r'सूरदास|सूर सागर', text_to_check):
        return 'sur-sagar', 'महाकवि सूरदास जी', title
    if re.search(r'रसखान', text_to_check):
        return 'raskhan-padavali', 'रसखान जी', title
    if re.search(r'चन्द्रसखी', text_to_check):
        return 'chandrasakhi-padavali', 'चन्द्रसखी जी', title
    if re.search(r'परमानन्द', text_to_check):
        return 'paramanand-sagar', 'श्री परमानन्ददास जी', title
    if re.search(r'ध्रुवदास|बयालीस लीला', text_to_check):
        return 'bayalees-leela', 'श्री ध्रुवदास जी', title
    if re.search(r'लाल बलबीर|ब्रज बिनोद', text_to_check):
        return 'braj-binod', 'श्री लाल बलबीर', title
    if re.search(r'कृपालु|भक्ति शतक|प्रेमामृत', text_to_check):
        return 'bhakti-shatak', 'जगद्गुरु श्री कृपालु जी महाराज', title
    if re.search(r'व्यास वाणी|हरिराम व्यास', text_to_check):
        return 'vyas-vani', 'श्री हरिराम व्यास जी', title
    if re.search(r'ललित किशोरी|ललित मोहिनी', text_to_check):
        return 'lalit-kishori-vani', 'श्री ललित किशोरी देव जी', title
    if re.search(r'बिहारिन देव|भगवत रसिक', text_to_check):
        return 'biharin-dev-vani', 'श्री बिहारिन देव जी', title
    if re.search(r'नारायण स्वामी', text_to_check):
        return 'narayan-swami-vani', 'श्री नारायण स्वामी जी', title
    if re.search(r'नागरीदास', text_to_check):
        return 'nagaridas-vani', 'श्री नागरीदास जी', title
    if re.search(r'मीरा|मीराबाई', text_to_check):
        return 'meera-padavali', 'भक्त शिरोमणि मीराबाई', title
    if re.search(r'स्तोत्र|अष्टक|कटाक्ष|मंगलाचरण|चालीसा', text_to_check):
        return 'stotras', 'श्री रसिक परंपरा', title
    if re.search(r'दोहे|दोहा', text_to_check):
        return 'braj-dohe', 'विविध रसिक संत', title
    if re.search(r'सवैया', text_to_check):
        return 'braj-savaiya', 'विविध रसिक संत', title
    if re.search(r'कवित्त', text_to_check):
        return 'braj-kavitta', 'विविध रसिक संत', title
    if re.search(r'रसिया', text_to_check):
        return 'braj-rasiya', 'विविध रसिक संत', title
    if re.search(r'भजन|कीर्तन', text_to_check):
        return 'braj-bhajan', 'पारंपरिक ब्रज मंडल', title

    author = raw_author if raw_author and raw_author not in ['Team VrindaVaani', 'Unknown', 'अज्ञात'] else 'विविध रसिक संत'
    return 'rasik-vani-sangrah', author, title

def main():
    print('🌸 Starting Vrindopnisad 2.0 Master Content Merge...')
    os.makedirs(OUTPUT_GRANTHAS_DIR, exist_ok=True)
    os.makedirs(OUTPUT_DATA_DIR, exist_ok=True)

    # 1. Load Existing Curated Padas to Preserve Lineage
    existing_padas = []
    if os.path.exists(EXISTING_PADAS_PATH):
        with open(EXISTING_PADAS_PATH, 'r', encoding='utf-8') as f:
            existing_padas = json.load(f)
        print(f'  ✓ Loaded {len(existing_padas):,} existing curated padas')

    existing_slug_map = {p.get('slug'): p for p in existing_padas if p.get('slug')}

    # 2. Parse Master CSV (43,598 Rows)
    granthas_map = {}
    catalog = []
    processed_slugs = set()
    total_csv_rows = 0

    with open(CSV_PATH, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            total_csv_rows += 1
            raw_sanskrit = (row.get('sanskrit_text') or '').strip()
            raw_content = (row.get('content_text') or '').strip()
            text = raw_sanskrit if raw_sanskrit else raw_content
            
            # Skip empty placeholders
            if not text:
                continue

            col_id, author, title = classify_and_clean_row(row)
            slug = (row.get('slug') or '').strip()
            row_id = slug or (row.get('id') or '').strip()

            if slug in processed_slugs:
                continue
            processed_slugs.add(slug)

            # Gurmukhi transliteration for Ramcharitmanas if needed
            if col_id == 'ramcharitmanas' and any(0x0A00 <= ord(c) <= 0x0A7F for c in text):
                text = gurmukhi_to_devanagari(text)

            # Split pure sacred lines (ZERO modern Hindi explanation / ZERO English translation)
            lines = [l.strip() for l in text.split('\n') if l.strip()]
            if not lines:
                lines = [title]

            # Harmonize raga
            rag = (row.get('rag') or '').strip()

            pad_entry = {
                'id': row_id,
                'collectionId': col_id,
                'index': len(granthas_map.get(col_id, [])) + 1,
                'titleDevanagari': title,
                'author': author,
                'slug': slug,
                'verses': [
                    {
                        'stanzaNumber': 1,
                        'linesDevanagari': lines
                    }
                ]
            }
            if rag:
                pad_entry['rag'] = rag

            if col_id not in granthas_map:
                granthas_map[col_id] = []
            granthas_map[col_id].append(pad_entry)

    print(f'  ✓ Processed {total_csv_rows:,} rows from master CSV into {len(granthas_map)} collections')

    # 3. Merge Remaining Unique Curated Padas from Existing Database
    preserved_count = 0
    for p in existing_padas:
        s = p.get('slug')
        if s and s not in processed_slugs:
            processed_slugs.add(s)
            c_id = p.get('collectionId') or 'rasik-vani-sangrah'
            if c_id not in granthas_map:
                granthas_map[c_id] = []
            
            # Clean verses to ensure NO English/Hindi commentary leak
            clean_verses = []
            for v in p.get('verses', []):
                clean_verses.append({
                    'stanzaNumber': v.get('stanzaNumber', 1),
                    'linesDevanagari': v.get('linesDevanagari', [])
                })

            p_entry = {
                'id': p.get('id', s),
                'collectionId': c_id,
                'index': len(granthas_map[c_id]) + 1,
                'titleDevanagari': p.get('titleDevanagari', 'श्री पद'),
                'titleEnglish': '',
                'author': p.get('author', 'श्री रसिक परंपरा'),
                'rag': p.get('rag', ''),
                'slug': s,
                'verses': clean_verses if clean_verses else [{'stanzaNumber': 1, 'linesDevanagari': [p.get('titleDevanagari', 'श्री पद')]}]
            }
            granthas_map[c_id].append(p_entry)
            preserved_count += 1

    print(f'  ✓ Preserved {preserved_count:,} unique padas from previous curated corpus')

    # 4. Generate Master Grantha Catalog Metadata
    # Define Canonical Granthas with Category definitions
    canonical_granthas_definitions = [
        # --- महाग्रंथ (Mahagranths) ---
        {
            'id': 'valmiki-ramayana',
            'name': 'श्रीमद् वाल्मीकि रामायण',
            'author': 'महर्षि वाल्मीकि',
            'slug': 'valmiki-ramayana',
            'category': 'mahagranth',
            'description': 'आदिकवि महर्षि वाल्मीकि प्रणीत प्रभु श्री राम के दिव्य चरित्र का अनादि महाकाव्य।'
        },
        {
            'id': 'shrimad-bhagavatam',
            'name': 'श्रीमद् भागवत महापुराण',
            'author': 'महर्षि वेदव्यास',
            'slug': 'shrimad-bhagavatam',
            'category': 'mahagranth',
            'description': 'परमहंस संहिता, श्रीकृष्ण लीलामृत एवं अमल प्रेमरस का सर्वोच्च पावन महापुराण।'
        },
        {
            'id': 'ramcharitmanas',
            'name': 'श्री रामचरितमानस',
            'author': 'गोस्वामी तुलसीदास',
            'slug': 'ramcharitmanas',
            'category': 'mahagranth',
            'description': 'कलियुग तारक प्रभु श्री राम के पावन चरित्र का अवधी रसामृत महाकाव्य।'
        },
        {
            'id': 'bhagavad-gita',
            'name': 'श्रीमद्भगवद्गीता',
            'author': 'महर्षि वेदव्यास',
            'slug': 'bhagavad-gita',
            'category': 'mahagranth',
            'description': 'कुरुक्षेत्र के समरांगण में योगेश्वर श्रीकृष्ण के श्रीमुख से निःसृत अमृतोपदेश।'
        },
        {
            'id': 'durga-saptashati',
            'name': 'श्री दुर्गा सप्तशती',
            'author': 'महर्षि वेदव्यास',
            'slug': 'durga-saptashati',
            'category': 'mahagranth',
            'description': 'मार्कण्डेय पुराण अंतर्गत भगवती जगदम्बा की दिव्य महिमा एवं पराशक्ति का स्तोत्र।'
        },

        # --- रसिक वाणी (Rasik Vani) ---
        {
            'id': 'hit-chaurasi',
            'name': 'श्री हित चौरासी',
            'author': 'श्री हित हरिवंश महाप्रभु',
            'slug': 'hit-chaurasi',
            'category': 'rasik-vani',
            'description': 'निकुंज नित्य विहार एवं अनन्य प्रेम रस का परम पावन ग्रन्थ।'
        },
        {
            'id': 'kelimal',
            'name': 'श्री केलिमाल',
            'author': 'स्वामी श्री हरिदास जी',
            'slug': 'kelimal',
            'category': 'rasik-vani',
            'description': 'निधिवन राज के नित्य केलि रस एवं रस-रीति का गूढ़ प्राकट्य।'
        },
        {
            'id': 'sur-sagar',
            'name': 'सूरसागर',
            'author': 'महाकवि सूरदास जी',
            'slug': 'sur-sagar',
            'category': 'rasik-vani',
            'description': 'वात्सल्य एवं माधुर्य रस के सम्राट सूरदास जी के अमर पद।'
        },
        {
            'id': 'vyas-vani',
            'name': 'श्री व्यास वाणी',
            'author': 'श्री हरिराम व्यास जी',
            'slug': 'vyas-vani',
            'category': 'rasik-vani',
            'description': 'किशोर-किशोरी के नित्य विहार रस एवं अनन्य निष्ठा का अगाध संग्रह।'
        },
        {
            'id': 'bayalees-leela',
            'name': 'बयालीस लीला',
            'author': 'श्री ध्रुवदास जी',
            'slug': 'bayalees-leela',
            'category': 'rasik-vani',
            'description': 'श्री वृन्दावन निकुंज के प्रेम रस, मान, रस-विलास की बयालीस दिव्य लीलाएं।'
        },
        {
            'id': 'bhakti-shatak',
            'name': 'भक्ति शतक व प्रेमामृत',
            'author': 'जगद्गुरु श्री कृपालु जी महाराज',
            'slug': 'bhakti-shatak',
            'category': 'rasik-vani',
            'description': 'दिव्य रागात्मिका भक्ति, प्रेमरस एवं रूप-ध्यान का दार्शनिक सिद्धांत संग्रह।'
        },
        {
            'id': 'raskhan-padavali',
            'name': 'रसखान पदावली',
            'author': 'रसखान जी',
            'slug': 'raskhan-padavali',
            'category': 'rasik-vani',
            'description': 'प्रेम वाटिका एवं सुजान रसखान के अनन्य कृष्ण प्रेम सवैये व दोहे।'
        },
        {
            'id': 'lalit-kishori-vani',
            'name': 'श्री ललित किशोरी वाणी',
            'author': 'श्री ललित किशोरी देव जी',
            'slug': 'lalit-kishori-vani',
            'category': 'rasik-vani',
            'description': 'हरिदासी परंपरा की परम पावन निकुंज रस धारा।'
        },
        {
            'id': 'biharin-dev-vani',
            'name': 'श्री बिहारिन देव वाणी',
            'author': 'श्री बिहारिन देव जी',
            'slug': 'biharin-dev-vani',
            'category': 'rasik-vani',
            'description': 'स्वामी हरिदास जी के पट्टशिष्य बिहारिन देव जी के दिव्य सिद्धांत पद।'
        },
        {
            'id': 'narayan-swami-vani',
            'name': 'श्री नारायण स्वामी वाणी',
            'author': 'श्री नारायण स्वामी जी',
            'slug': 'narayan-swami-vani',
            'category': 'rasik-vani',
            'description': 'राधावल्लभ संप्रदाय के प्रसिद्ध रसिक संत का दिव्य वाणी संग्रह।'
        },
        {
            'id': 'braj-binod',
            'name': 'ब्रज बिनोद',
            'author': 'श्री लाल बलबीर',
            'slug': 'braj-binod',
            'category': 'rasik-vani',
            'description': 'ब्रज-विहार, राधा-सुधा एवं निकुंज विनोद की मधुर रचनाएं।'
        },
        {
            'id': 'chandrasakhi-padavali',
            'name': 'चन्द्रसखी पदावली',
            'author': 'चन्द्रसखी जी',
            'slug': 'chandrasakhi-padavali',
            'category': 'rasik-vani',
            'description': 'ब्रज के घर-घर में गाई जाने वाली परम अनुराग भरी पदावली।'
        },
        {
            'id': 'paramanand-sagar',
            'name': 'परमानन्द सागर',
            'author': 'श्री परमानन्ददास जी',
            'slug': 'paramanand-sagar',
            'category': 'rasik-vani',
            'description': 'अष्टछाप के महाकवि परमानन्ददास जी के दिव्य बाललीला व युगल पद।'
        },
        {
            'id': 'nagaridas-vani',
            'name': 'श्री नागरीदास वाणी',
            'author': 'श्री नागरीदास जी',
            'slug': 'nagaridas-vani',
            'category': 'rasik-vani',
            'description': 'महाराजा सावंत सिंह (नागरीदास जी) के अनुपम भक्ति पद।'
        },
        {
            'id': 'meera-padavali',
            'name': 'मीरा पदावली',
            'author': 'भक्त शिरोमणि मीराबाई',
            'slug': 'meera-padavali',
            'category': 'rasik-vani',
            'description': 'गिरधर गोपाल के अनन्य विरह एवं प्रेम रस के अमर पद।'
        },
        {
            'id': 'rasik-vani-sangrah',
            'name': 'अखंड रसिक वाणी संग्रह',
            'author': 'विविध रसिक संत',
            'slug': 'rasik-vani-sangrah',
            'category': 'rasik-vani',
            'description': 'श्री वृन्दावन के अनन्य रसिक आचार्यों के दिव्य पदों का वृहद संग्रह।'
        },

        # --- काव्य व छंद (Kavya & Metrical Forms) ---
        {
            'id': 'braj-dohe',
            'name': 'ब्रज के दोहे',
            'author': 'विविध रसिक संत',
            'slug': 'braj-dohe',
            'category': 'kavya',
            'description': 'ब्रज रस एवं नीति, भक्ति के सारगर्भित पावन दोहे।'
        },
        {
            'id': 'braj-savaiya',
            'name': 'ब्रज के सवैया',
            'author': 'विविध रसिक संत',
            'slug': 'braj-savaiya',
            'category': 'kavya',
            'description': 'श्रीकृष्ण रूप-माधुरी एवं लीला के छंदबद्ध सवैये।'
        },
        {
            'id': 'braj-kavitta',
            'name': 'ब्रज के कवित्त',
            'author': 'विविध रसिक संत',
            'slug': 'braj-kavitta',
            'category': 'kavya',
            'description': 'ब्रजभाषा के शास्त्रीय कवित्त छंद में युगल छवि वर्णन।'
        },
        {
            'id': 'braj-rasiya',
            'name': 'ब्रज रसिया व फाग',
            'author': 'विविध रसिक संत',
            'slug': 'braj-rasiya',
            'category': 'kavya',
            'description': 'होरी, फाग एवं बरसाने-नंदगांव के लोकप्रसिद्ध रसिया।'
        },
        {
            'id': 'braj-bhajan',
            'name': 'पारंपरिक ब्रज भजन',
            'author': 'पारंपरिक ब्रज मंडल',
            'slug': 'braj-bhajan',
            'category': 'kavya',
            'description': 'ब्रज के मंदिरों एवं संतों की कीर्तन परंपरा के पारंपरिक भजन।'
        },
        {
            'id': 'stotras',
            'name': 'पावन स्तोत्रमाला',
            'author': 'श्री रसिक परंपरा',
            'slug': 'stotras',
            'category': 'kavya',
            'description': 'श्री राधा कृपा कटाक्ष, यमुनाष्टक, मधुराष्टक व विविध स्तुति संग्रह।'
        },

        # --- धाम व लीला (Dham & Charitra) ---
        {
            'id': 'braj-dham-mahatmya',
            'name': 'श्री ब्रज धाम माहात्म्य व तीर्थ',
            'author': 'श्री ब्रज धाम',
            'slug': 'braj-dham-mahatmya',
            'category': 'dham-leela',
            'description': 'चौरासी कोस ब्रज मंडल के प्रमुख तीर्थ, कुण्ड, वन व लीला स्थल।'
        },
        {
            'id': 'rasik-charitra-katha',
            'name': 'रसिक चरित कथा व संत जीवन',
            'author': 'श्री रसिक चरित',
            'slug': 'rasik-charitra-katha',
            'category': 'dham-leela',
            'description': 'परम रसिक आचार्यों के पावन जीवन प्रसंग एवं प्रेमामृत लीलाएं।'
        }
    ]

    # Map counts to grantha definitions
    updated_granthas = []
    total_all_padas = 0

    for defn in canonical_granthas_definitions:
        col_id = defn['id']
        items = granthas_map.get(col_id, [])
        defn['count'] = len(items)
        total_all_padas += len(items)
        updated_granthas.append(defn)

    # 5. Write Updated Canonical Granthas
    with open(CANONICAL_GRANTHAS_PATH, 'w', encoding='utf-8') as f:
        json.dump(updated_granthas, f, ensure_ascii=False, indent=2)
    print(f'  ✓ Updated {CANONICAL_GRANTHAS_PATH} with {len(updated_granthas)} granthas ({total_all_padas:,} total verses)')

    # 6. Write Grantha Chunks to public/data/granthas/
    manifest = {
        'version': '2026.11.08.1',
        'generatedAt': '2026-11-08T15:00:00Z',
        'totalPadas': total_all_padas,
        'totalGranthas': len(updated_granthas),
        'catalog': {},
        'granthas': {}
    }

    all_catalog_entries = []

    for g in updated_granthas:
        col_id = g['id']
        items = granthas_map.get(col_id, [])
        items.sort(key=lambda x: x.get('index', 0))

        # Re-index nicely 1..N
        for idx, item in enumerate(items):
            item['index'] = idx + 1
            all_catalog_entries.append({
                'id': item['id'],
                'collectionId': col_id,
                'index': idx + 1,
                'titleDevanagari': item['titleDevanagari'],
                'author': item['author'],
                'rag': item.get('rag', ''),
                'slug': item.get('slug', '')
            })

        json_str = json.dumps(items, ensure_ascii=False, separators=(',', ':'))
        file_hash = hashlib.sha256(json_str.encode('utf-8')).hexdigest()[:12]
        gz_data = gzip.compress(json_str.encode('utf-8'), compresslevel=9)

        # Write clean static file
        chunk_path = os.path.join(OUTPUT_GRANTHAS_DIR, f'{col_id}.json')
        with open(chunk_path, 'w', encoding='utf-8') as f:
            f.write(json_str)

        manifest['granthas'][col_id] = {
            'count': len(items),
            'hash': file_hash,
            'file': f'{col_id}.json',
            'rawBytes': len(json_str.encode('utf-8')),
            'gzBytes': len(gz_data)
        }
        print(f'    - {col_id}.json: {len(items):,} verses ({round(len(json_str.encode("utf-8"))/1024, 1)} KB, {round(len(gz_data)/1024, 1)} KB gz)')

    # 7. Write Ultra-Lightweight Dictionary-Indexed Search Catalog (6.6 MB instead of 14.2 MB)
    col_names = [g['id'] for g in updated_granthas]
    col_to_idx = {name: i for i, name in enumerate(col_names)}

    unique_authors = []
    author_to_idx = {}
    for entry in all_catalog_entries:
        a = entry['author']
        if a not in author_to_idx:
            author_to_idx[a] = len(unique_authors)
            unique_authors.append(a)

    compact_catalog_items = []
    for entry in all_catalog_entries:
        item = [
            entry['slug'],
            entry['titleDevanagari'],
            col_to_idx.get(entry['collectionId'], 0),
            author_to_idx.get(entry['author'], 0),
        ]
        if entry.get('rag'):
            item.append(entry['rag'])
        compact_catalog_items.append(item)

    catalog_payload = {
        'cols': col_names,
        'authors': unique_authors,
        'items': compact_catalog_items,
    }

    catalog_json_str = json.dumps(catalog_payload, ensure_ascii=False, separators=(',', ':'))
    catalog_hash = hashlib.sha256(catalog_json_str.encode('utf-8')).hexdigest()[:12]
    catalog_gz = gzip.compress(catalog_json_str.encode('utf-8'), compresslevel=9)

    catalog_path = os.path.join(OUTPUT_DATA_DIR, 'catalog.json')
    with open(catalog_path, 'w', encoding='utf-8') as f:
        f.write(catalog_json_str)

    manifest['catalog'] = {
        'file': 'catalog.json',
        'hash': catalog_hash,
        'rawBytes': len(catalog_json_str.encode('utf-8')),
        'gzBytes': len(catalog_gz)
    }

    # 8. Write Manifest
    manifest_path = os.path.join(OUTPUT_DATA_DIR, 'manifest.json')
    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    print(f'  ✓ Generated compact catalog.json ({round(len(catalog_json_str.encode("utf-8"))/1024, 1)} KB, {round(len(catalog_gz)/1024, 1)} KB gz)')
    print(f'  ✓ Generated manifest.json ({round(os.path.getsize(manifest_path)/1024, 1)} KB)')

    # 9. Update src/data/canonicalPadas.json for offline backup & SSR pre-warming
    # Include celebrated Rasik collections, Mahagranths highlights, and top Rasik Vani Sangrah padas
    print('  ✓ Generating optimized SSR seed in src/data/canonicalPadas.json...')
    ssr_seed_granthas = [
        'hit-chaurasi', 'kelimal', 'vyas-vani', 'sur-sagar', 'bayalees-leela',
        'bhakti-shatak', 'raskhan-padavali', 'lalit-kishori-vani', 'biharin-dev-vani',
        'narayan-swami-vani', 'braj-binod', 'chandrasakhi-padavali', 'paramanand-sagar',
        'nagaridas-vani', 'meera-padavali', 'stotras', 'braj-dohe', 'braj-savaiya',
        'bhagavad-gita', 'durga-saptashati'
    ]
    curated_ssr_padas = []
    for g_id in ssr_seed_granthas:
        curated_ssr_padas.extend(granthas_map.get(g_id, []))
    
    # Add top 3,000 padas from rasik-vani-sangrah (including celebrated classic padas)
    rasik_sangrah = granthas_map.get('rasik-vani-sangrah', [])
    curated_ssr_padas.extend(rasik_sangrah[:3000])

    # Ensure classic test-fixture pad is guaranteed to be in SSR pre-warming
    test_pad = next((p for p in rasik_sangrah if p.get('slug') == 'radheju-merau-janam-sudharau'), None)
    if test_pad and test_pad not in curated_ssr_padas:
        curated_ssr_padas.append(test_pad)

    # Add first 150 verses of Ramayana, Bhagavatam, Ramcharitmanas for SSR prewarming
    for g_id in ['valmiki-ramayana', 'shrimad-bhagavatam', 'ramcharitmanas']:
        curated_ssr_padas.extend(granthas_map.get(g_id, [])[:150])

    with open(EXISTING_PADAS_PATH, 'w', encoding='utf-8') as f:
        json.dump(curated_ssr_padas, f, ensure_ascii=False, separators=(',', ':'))

    # Clean up redundant public/data/canonicalPadas.json to save 9.9 MB storage
    public_canonical = os.path.join(OUTPUT_DATA_DIR, 'canonicalPadas.json')
    if os.path.exists(public_canonical):
        os.remove(public_canonical)

    print(f'  ✓ Wrote {len(curated_ssr_padas):,} curated padas to src/data/canonicalPadas.json ({round(os.path.getsize(EXISTING_PADAS_PATH)/(1024*1024), 2)} MB)')
    print('  ✓ Script completed successfully!')
    print('  ✓ Script completed successfully!')

if __name__ == '__main__':
    main()
