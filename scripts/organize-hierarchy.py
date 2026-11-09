#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Organize Scripture Hierarchy & Automatic Author Attribution
Generates canonical subdivisions (Chapters/Kandas/Skandhas) and maps 165+ authors.
"""

import json, glob, os, re
from collections import defaultdict, Counter

GITA_CHAPTER_NAMES = {
    1: "अर्जुनविषादयोग", 2: "सांख्ययोग", 3: "कर्मयोग", 4: "ज्ञानकर्मसंन्यासयोग",
    5: "कर्मसंन्यासयोग", 6: "आत्मसंयमयोग", 7: "ज्ञानविज्ञानयोग", 8: "अक्षरब्रह्मयोग",
    9: "राजविद्याराजगुह्ययोग", 10: "विभूतियोग", 11: "विश्वरूपदर्शनयोग", 12: "भक्तियोग",
    13: "क्षेत्र-क्षेत्रज्ञविभागयोग", 14: "गुणत्रयविभागयोग", 15: "पुरुषोत्तमयोग",
    16: "दैवासुरसंपद्विभागयोग", 17: "श्रद्धात्रयविभागयोग", 18: "मोक्षसंन्यासयोग"
}

SKANDHA_NAMES = {
    1: "प्रथम स्कन्ध (सृष्टि लीला)",
    2: "द्वितीय स्कन्ध (साधन लीला)",
    3: "तृतीय स्कन्ध (सर्ग लीला)",
    4: "चतुर्थ स्कन्ध (विसर्ग लीला)",
    5: "पंचम स्कन्ध (स्थान लीला)",
    6: "षष्ठ स्कन्ध (पोषण लीला)",
    7: "सप्तम स्कन्ध (ऊति लीला)",
    8: "अष्टम स्कन्ध (मन्वन्तर लीला)",
    9: "नवम स्कन्ध (ईशानुकथा लीला)",
    10: "दशम स्कन्ध (श्रीकृष्ण निरोध लीला)",
    11: "एकादश स्कन्ध (मुक्ति लीला)",
    12: "द्वादश स्कन्ध (आश्रय लीला)"
}

KANDA_ORDER = [
    "बालकाण्ड", "अयोध्याकाण्ड", "अरण्यकाण्ड", "किष्किन्धाकाण्ड", "सुन्दरकाण्ड", "युद्धकाण्ड", "लंकाकाण्ड", "उत्तरकाण्ड"
]

def clean_text(text):
    if not text:
        return ""
    text = text.replace("&amp;", "&")
    text = re.sub(r"&(?:zwnj|zwj|#x200c|#x200C|#8204|#x200d|#x200D|#8205);?", "", text)
    text = re.sub(r"&(?:ndash|#8211);", "–", text)
    text = re.sub(r"&(?:lsquo|#8216);", "‘", text)
    text = re.sub(r"&(?:rsquo|#8217);", "’", text)
    text = re.sub(r"&(?:ldquo|#8220);", "“", text)
    text = re.sub(r"&(?:rdquo|#8221);", "”", text)
    text = re.sub(r"&(?:bull|#8226);", "•", text)
    text = re.sub(r"&(?:nbsp|#160);", " ", text)
    text = re.sub(r"&(?:quot|#34);", "\"", text)
    text = re.sub(r"&(?:apos|#39);", "\x27", text)
    return text.strip()

def extract_author_and_title(title, current_author):
    clean_t = clean_text(title)
    extracted_author = current_author
    sub_work = ""
    verse_num = None

    # Check suffix attribution patterns like:
    # "राजत आजु कुँवरि अति नीकी - श्री अलबेली अलि, समय प्रबन्ध (122)"
    if " - " in clean_t:
        parts = clean_t.split(" - ")
        meta = parts[-1].strip()
        # Parse verse number if present
        num_m = re.search(r"\((\d+)\)", meta)
        if num_m:
            verse_num = int(num_m.group(1))
            meta = re.sub(r"\(\d+\)", "", meta).strip()
        if "," in meta:
            subparts = [p.strip() for p in meta.split(",")]
            candidate_auth = subparts[0]
            if any(k in candidate_auth for k in ["श्री", "दास", "अलि", "अली", "देव", "संत", "व्यास", "हरिदास", "हरिवंश", "कृपालु", "रसखान", "सूरदास", "मीरा", "बिहारी"]):
                extracted_author = candidate_auth
                sub_work = ", ".join(subparts[1:])
        elif any(k in meta for k in ["श्री", "दास", "अलि", "अली", "देव", "व्यास", "हरिदास", "हरिवंश", "कृपालु", "रसखान", "सूरदास", "मीरा", "बिहारी"]):
            extracted_author = meta

    return extracted_author, sub_work, verse_num

def parse_division(gid, title, index):
    clean_t = clean_text(title)
    ch_id = "general"
    ch_name = "सामान्य पद"
    verse_no = index

    if gid == "valmiki-ramayana":
        km = re.search(r"([^\s,]+काण्ड)", clean_t)
        sm = re.search(r"सर्ग\s*(\d+)", clean_t)
        vm = re.search(r"श्लोक\s*(\d+)", clean_t)
        kanda = km.group(1) if km else "काण्ड"
        sarga = sm.group(1) if sm else "1"
        ch_id = f"{kanda}-sarga-{sarga}"
        ch_name = f"{kanda}, सर्ग {sarga}"
        verse_no = int(vm.group(1)) if vm else index

    elif gid == "shrimad-bhagavatam":
        sm = re.search(r"स्कन्ध\s*(\d+)", clean_t)
        am = re.search(r"अध्याय\s*(\d+)", clean_t)
        vm = re.search(r"श्लोक\s*(\d+)", clean_t)
        skandh_no = int(sm.group(1)) if sm else 1
        adhyay_no = int(am.group(1)) if am else 1
        ch_id = f"skandh-{skandh_no}-adhyay-{adhyay_no}"
        sk_label = SKANDHA_NAMES.get(skandh_no, f"स्कन्ध {skandh_no}")
        ch_name = f"{sk_label}, अध्याय {adhyay_no}"
        verse_no = int(vm.group(1)) if vm else index

    elif gid == "ramcharitmanas":
        km = re.search(r"([^\s,]+काण्ड)", clean_t)
        vm = re.search(r"(?:दोहा\/चौपाई|दोहा|चौपाई)\s*(\d+)", clean_t)
        kanda = km.group(1) if km else "बालकाण्ड"
        ch_id = f"kand-{kanda}"
        ch_name = f"{kanda}"
        verse_no = int(vm.group(1)) if vm else index

    elif gid == "bhagavad-gita":
        am = re.search(r"अध्याय\s*(\d+)", clean_t)
        vm = re.search(r"श्लोक\s*(\d+)", clean_t)
        ch_num = int(am.group(1)) if am else 1
        ch_name_sanskrit = GITA_CHAPTER_NAMES.get(ch_num, "")
        ch_id = f"adhyay-{ch_num}"
        ch_name = f"अध्याय {ch_num}: {ch_name_sanskrit}" if ch_name_sanskrit else f"अध्याय {ch_num}"
        verse_no = int(vm.group(1)) if vm else index

    elif gid == "durga-saptashati":
        am = re.search(r"अध्याय\s*(\d+)", clean_t)
        vm = re.search(r"श्लोक\s*(\d+)", clean_t)
        ch_num = int(am.group(1)) if am else 1
        ch_id = f"adhyay-{ch_num}"
        ch_name = f"अध्याय {ch_num} (चरित्र {ch_num})"
        verse_no = int(vm.group(1)) if vm else index

    elif gid == "bayalees-leela":
        lm = re.search(r"([^\s,]+(?:लीला|मंजरी|मुक्तावली|विलावली))", clean_t)
        vm = re.search(r"\((\d+)\)", clean_t)
        leela = lm.group(1) if lm else "बयालीस लीला"
        ch_id = f"leela-{leela}"
        ch_name = leela
        verse_no = int(vm.group(1)) if vm else index

    elif gid == "hit-chaurasi":
        if "स्फुट" in clean_t:
            ch_id = "sphut-vani"
            ch_name = "श्री हित स्फुट वाणी"
        else:
            ch_id = "hit-chaurasi"
            ch_name = "श्री हित चौरासी (८४ पद)"
        vm = re.search(r"\((\d+)\)", clean_t)
        verse_no = int(vm.group(1)) if vm else index

    elif gid == "kelimal":
        if "सिद्धांत" in clean_t:
            ch_id = "siddhant"
            ch_name = "सिद्धांत के पद"
        else:
            ch_id = "kelimal"
            ch_name = "श्री केलिमाल (११० पद)"
        vm = re.search(r"\((\d+)\)", clean_t)
        verse_no = int(vm.group(1)) if vm else index

    elif gid == "bhakti-shatak":
        ch_id = "bhakti-shatak"
        ch_name = "भक्ति शतक (१०० दोहे)"
        vm = re.search(r"\((\d+)\)", clean_t)
        verse_no = int(vm.group(1)) if vm else index

    return ch_id, ch_name, verse_no

def chapter_sort_key(ch):
    name = ch.get("name", "")
    # Gita / Saptashati / Bhagavatam Adhyaya
    m = re.search(r"अध्याय\s*(\d+)", name)
    if m:
        sk = re.search(r"स्कन्ध\s*(\d+)", name)
        sk_num = int(sk.group(1)) if sk else 0
        return (sk_num, int(m.group(1)))
    # Ramayana / Manas Kanda
    for idx, k in enumerate(KANDA_ORDER):
        if k in name:
            sarga = re.search(r"सर्ग\s*(\d+)", name)
            s_num = int(sarga.group(1)) if sarga else 0
            return (idx, s_num)
    return (999, name)

def process_all_granthas():
    base_dir = "public/data/granthas"
    hierarchy_data = {
        "granthas": {},
        "authors": {},
        "stats": {
            "totalVerses": 0,
            "totalGranthas": 0,
            "totalAuthors": 0,
            "totalChapters": 0
        }
    }

    author_counter = Counter()
    author_granthas = defaultdict(set)
    author_verses = defaultdict(list)

    grantha_files = sorted(glob.glob(os.path.join(base_dir, "*.json")))
    hierarchy_data["stats"]["totalGranthas"] = len(grantha_files)

    for g_path in grantha_files:
        gid = os.path.basename(g_path).replace(".json", "")
        with open(g_path, "r", encoding="utf-8") as f:
            raw = json.load(f)
        padas = raw if isinstance(raw, list) else raw.get("padas", [])
        hierarchy_data["stats"]["totalVerses"] += len(padas)

        chapters_dict = {}
        updated_padas = []

        for p in padas:
            title = p.get("titleDevanagari") or ""
            author = p.get("author") or "विविध रसिक संत"
            index = p.get("index", 1)

            # 1. Clean HTML Entities in lines and titles
            clean_t = clean_text(title)
            p["titleDevanagari"] = clean_t

            verses = p.get("verses", [])
            for v in verses:
                v["linesDevanagari"] = [clean_text(l) for l in v.get("linesDevanagari", [])]
                if "linesTransliteration" in v:
                    v["linesTransliteration"] = [clean_text(l) for l in v.get("linesTransliteration", [])]

            # 2. Extract author & chapter division
            ext_author, sub_work, verse_num = extract_author_and_title(clean_t, author)
            ch_id, ch_name, verse_no = parse_division(gid, clean_t, verse_num or index)

            p["author"] = ext_author
            p["chapterId"] = ch_id
            p["chapterName"] = ch_name
            p["verseNumber"] = verse_no

            author_counter[ext_author] += 1
            author_granthas[ext_author].add(gid)

            # Record chapter stats
            if ch_id not in chapters_dict:
                chapters_dict[ch_id] = {
                    "id": ch_id,
                    "name": ch_name,
                    "verseCount": 0,
                    "firstPadId": p.get("id"),
                    "firstPadSlug": p.get("slug") or p.get("id")
                }
            chapters_dict[ch_id]["verseCount"] += 1
            updated_padas.append(p)

        # Save cleaned & enriched grantha json
        with open(g_path, "w", encoding="utf-8") as f:
            json.dump(updated_padas, f, ensure_ascii=False, indent=2)

        # Record grantha hierarchy
        sorted_chapters = sorted(list(chapters_dict.values()), key=chapter_sort_key)
        hierarchy_data["granthas"][gid] = {
            "id": gid,
            "verseCount": len(padas),
            "chaptersCount": len(sorted_chapters),
            "chapters": sorted_chapters
        }
        hierarchy_data["stats"]["totalChapters"] += len(sorted_chapters)
        print(f"✓ Processed {gid}: {len(padas)} verses across {len(sorted_chapters)} chapters")

    # Build Authors Index
    for auth, cnt in author_counter.most_common():
        hierarchy_data["authors"][auth] = {
            "name": auth,
            "verseCount": cnt,
            "granthas": sorted(list(author_granthas[auth]))
        }
    hierarchy_data["stats"]["totalAuthors"] = len(hierarchy_data["authors"])

    # Output master hierarchy JSON
    out_path = "public/data/scripture-hierarchy.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(hierarchy_data, f, ensure_ascii=False, indent=2)

    print(f"\n✨ Master Hierarchy generated at {out_path}!")
    print(f"Total Verses: {hierarchy_data['stats']['totalVerses']}")
    print(f"Total Authors: {hierarchy_data['stats']['totalAuthors']}")
    print(f"Total Chapters/Subdivisions: {hierarchy_data['stats']['totalChapters']}")

if __name__ == "__main__":
    process_all_granthas()
