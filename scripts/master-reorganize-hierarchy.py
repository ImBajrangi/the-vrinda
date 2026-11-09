#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Master Scripture Hierarchy & Canonical Reorganization Engine
1. Deduplicates scraper artifacts (e.g. Ramcharitmanas & Valmiki Ramayana duplicate pages).
2. Categorizes scriptures into authentic textual subdivisions:
   - Hit Chaurasi: Core 84 Padas, Sphut Vani (29), Radha Sudha Nidhi (100), Rasik Commentary
   - Kelimal: Kelimal 110 Padas, Siddhant ke Pad (18), Rasik Anubandh
   - Narayan Swami Vani: Authentic Leelas (Pada Siddhant, Maan Leela, Yugal Chhadam, etc.)
   - Bayalees Leela: Authentic Leelas of Shri Dhruvdas (Vrindavan Shat, Shringar Shat, etc.)
   - All other 25 Granthas: Authentic chapters and subdivisions
3. Groups verses by chapter/leela first, then sorts by verseNumber ascending within chapter.
4. Assigns clean sequential index (1..N) to all padas.
5. Rebuilds scripture-hierarchy.json and manifest.json.
"""

import os
import re
import json
import glob
import hashlib
import gzip
from collections import defaultdict, Counter

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
GRANTHAS_DIR = os.path.join(ROOT_DIR, "public", "data", "granthas")

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
    "बालकाण्ड", "अयोध्याकाण्ड", "अरण्यकाण्ड", "किष्किन्धाकाण्ड",
    "सुन्दरकाण्ड", "लंकाकाण्ड", "युद्धकाण्ड", "उत्तरकाण्ड"
]
KANDA_RANK = {k: i for i, k in enumerate(KANDA_ORDER)}

def clean_text(text):
    if not isinstance(text, str) or not text:
        return text or ""
    text = re.sub(r"&amp;", "&", text, flags=re.IGNORECASE)
    text = re.sub(r"&(?:zwnj|zwj|#x200c|#x200C|#8204|#x200d|#x200D|#8205);?", "", text, flags=re.IGNORECASE)
    text = re.sub(r"[\u200B-\u200D\uFEFF]", "", text)
    text = re.sub(r"&(?:ndash|#8211);", "–", text, flags=re.IGNORECASE)
    text = re.sub(r"&(?:lsquo|#8216);", "‘", text, flags=re.IGNORECASE)
    text = re.sub(r"&(?:rsquo|#8217);", "’", text, flags=re.IGNORECASE)
    text = re.sub(r"&(?:ldquo|#8220);", "“", text, flags=re.IGNORECASE)
    text = re.sub(r"&(?:rdquo|#8221);", "”", text, flags=re.IGNORECASE)
    text = re.sub(r"&(?:bull|#8226);", "•", text, flags=re.IGNORECASE)
    text = re.sub(r"&(?:nbsp|#160);", " ", text, flags=re.IGNORECASE)
    text = re.sub(r"&(?:quot|#34);", "\"", text, flags=re.IGNORECASE)
    text = re.sub(r"&(?:apos|#39);", "\x27", text, flags=re.IGNORECASE)
    return text.strip()

def sanitize_pad(p):
    p["titleDevanagari"] = clean_text(p.get("titleDevanagari", ""))
    if "titleEnglish" in p:
        p["titleEnglish"] = clean_text(p.get("titleEnglish", ""))
    if "author" in p:
        p["author"] = clean_text(p.get("author", ""))
    if "chapterName" in p:
        p["chapterName"] = clean_text(p.get("chapterName", ""))
    if "rag" in p and p["rag"]:
        p["rag"] = clean_text(p.get("rag", ""))
    if "verses" in p and isinstance(p["verses"], list):
        for v in p["verses"]:
            if "linesDevanagari" in v and isinstance(v["linesDevanagari"], list):
                v["linesDevanagari"] = [clean_text(l) for l in v["linesDevanagari"]]
            if "linesEnglish" in v and isinstance(v["linesEnglish"], list):
                v["linesEnglish"] = [clean_text(l) for l in v["linesEnglish"]]
            if "linesTransliteration" in v and isinstance(v["linesTransliteration"], list):
                v["linesTransliteration"] = [clean_text(l) for l in v["linesTransliteration"]]
    return p

def extract_author_and_meta(title, current_author):
    clean_t = clean_text(title)
    extracted_author = current_author or "विविध रसिक संत"
    sub_work = ""
    verse_num = None

    if " - " in clean_t:
        parts = clean_t.split(" - ")
        meta = parts[-1].strip()
        num_m = re.search(r"\((\d+)\)", meta)
        if num_m:
            verse_num = int(num_m.group(1))
            meta = re.sub(r"\(\d+\)", "", meta).strip()
        if "," in meta:
            subparts = [p.strip() for p in meta.split(",")]
            candidate_auth = subparts[0]
            if any(k in candidate_auth for k in ["श्री", "दास", "अलि", "अली", "देव", "संत", "व्यास", "हरिदास", "हरिवंश", "कृपालु", "रसखान", "सूरदास", "मीरा", "बिहारी", "स्वामी"]):
                extracted_author = candidate_auth
                sub_work = ", ".join(subparts[1:])
            else:
                sub_work = meta
        elif any(k in meta for k in ["श्री", "दास", "अलि", "अली", "देव", "व्यास", "हरिदास", "हरिवंश", "कृपालु", "रसखान", "सूरदास", "मीरा", "बिहारी", "स्वामी"]):
            extracted_author = meta
        else:
            sub_work = meta

    return extracted_author, sub_work, verse_num

def determine_grantha_subdivision(gid, p, idx):
    clean_t = clean_text(p.get("titleDevanagari", ""))
    curr_author = clean_text(p.get("author", ""))
    ext_author, sub_work, title_vnum = extract_author_and_meta(clean_t, curr_author)
    verse_no = title_vnum or p.get("verseNumber") or idx

    # 1. Valmiki Ramayana
    if gid == "valmiki-ramayana":
        km = re.search(r"([^\s,]+काण्ड)", clean_t)
        sm = re.search(r"सर्ग\s*(\d+)", clean_t)
        vm = re.search(r"श्लोक\s*(\d+)", clean_t)
        kanda = km.group(1) if km else "काण्ड"
        sarga = sm.group(1) if sm else "1"
        ch_id = f"{kanda}-sarga-{sarga}"
        ch_name = f"{kanda}, सर्ग {sarga}"
        verse_no = int(vm.group(1)) if vm else verse_no
        sort_rank = (KANDA_RANK.get(kanda, 99), int(sarga), verse_no)
        return ext_author, ch_id, ch_name, verse_no, sort_rank

    # 2. Shrimad Bhagavatam
    if gid == "shrimad-bhagavatam":
        sm = re.search(r"स्कन्ध\s*(\d+)", clean_t)
        am = re.search(r"अध्याय\s*(\d+)", clean_t)
        vm = re.search(r"श्लोक\s*(\d+)", clean_t)
        skandh_no = int(sm.group(1)) if sm else 1
        adhyay_no = int(am.group(1)) if am else 1
        ch_id = f"skandh-{skandh_no}-adhyay-{adhyay_no}"
        sk_label = SKANDHA_NAMES.get(skandh_no, f"स्कन्ध {skandh_no}")
        ch_name = f"{sk_label}, अध्याय {adhyay_no}"
        verse_no = int(vm.group(1)) if vm else verse_no
        sort_rank = (skandh_no, adhyay_no, verse_no)
        return ext_author, ch_id, ch_name, verse_no, sort_rank

    # 3. Ramcharitmanas
    if gid == "ramcharitmanas":
        km = re.search(r"([^\s,]+काण्ड)", clean_t)
        vm = re.search(r"(?:दोहा\/चौपाई|दोहा|चौपाई)\s*(\d+)", clean_t)
        kanda = km.group(1) if km else "बालकाण्ड"
        ch_id = f"kand-{kanda}"
        ch_name = f"{kanda}"
        verse_no = int(vm.group(1)) if vm else verse_no
        sort_rank = (KANDA_RANK.get(kanda, 99), 0, verse_no)
        return ext_author, ch_id, ch_name, verse_no, sort_rank

    # 4. Bhagavad Gita
    if gid == "bhagavad-gita":
        am = re.search(r"अध्याय\s*(\d+)", clean_t)
        vm = re.search(r"श्लोक\s*(\d+)", clean_t)
        ch_num = int(am.group(1)) if am else 1
        ch_name_sanskrit = GITA_CHAPTER_NAMES.get(ch_num, "")
        ch_id = f"adhyay-{ch_num}"
        ch_name = f"अध्याय {ch_num}: {ch_name_sanskrit}" if ch_name_sanskrit else f"अध्याय {ch_num}"
        verse_no = int(vm.group(1)) if vm else verse_no
        sort_rank = (0, ch_num, verse_no)
        return ext_author, ch_id, ch_name, verse_no, sort_rank

    # 5. Durga Saptashati
    if gid == "durga-saptashati":
        am = re.search(r"अध्याय\s*(\d+)", clean_t)
        vm = re.search(r"श्लोक\s*(\d+)", clean_t)
        ch_num = int(am.group(1)) if am else 1
        ch_id = f"adhyay-{ch_num}"
        ch_name = f"अध्याय {ch_num} (चरित्र {ch_num})"
        verse_no = int(vm.group(1)) if vm else verse_no
        sort_rank = (0, ch_num, verse_no)
        return ext_author, ch_id, ch_name, verse_no, sort_rank

    # 6. Sri Hit Chaurasi
    if gid == "hit-chaurasi":
        is_sphut = "स्फुट" in clean_t or "sphut" in p.get("id", "")
        is_sudha = "सुधा निधि" in clean_t or "सुधा निधि" in ext_author or "sudha-nidhi" in p.get("id", "")
        is_harivansh = ("हरिवंश" in ext_author or "मुरली अवतार" in ext_author) and not is_sudha

        if is_sphut:
            ch_id = "sphut-vani"
            ch_name = "श्री हित स्फुट वाणी (२९ पद)"
            sort_order = 2
        elif is_sudha:
            ch_id = "radha-sudha-nidhi"
            ch_name = "श्री राधा सुधा निधि (१०० श्लोक)"
            sort_order = 3
        elif is_harivansh:
            ch_id = "hit-chaurasi"
            ch_name = "श्री हित चौरासी (८४ पद)"
            sort_order = 1
        else:
            ch_id = "rasik-anubandh"
            ch_name = "रसिक वाणी अनुबन्ध व टीका"
            sort_order = 4

        vm = re.search(r"\((\d+)\)", clean_t)
        verse_no = int(vm.group(1)) if vm else verse_no
        sort_rank = (sort_order, 0, verse_no)
        return ext_author, ch_id, ch_name, verse_no, sort_rank

    # 7. Sri Kelimal
    if gid == "kelimal":
        is_siddhant = "सिद्धांत" in clean_t or "siddhant" in p.get("id", "")
        is_haridas = "हरिदास" in ext_author

        if is_siddhant:
            ch_id = "siddhant-ke-pad"
            ch_name = "सिद्धांत के पद (१८ पद)"
            sort_order = 2
        elif is_haridas:
            ch_id = "kelimal"
            ch_name = "श्री केलिमाल (११० पद)"
            sort_order = 1
        else:
            ch_id = "rasik-anubandh"
            ch_name = "रसिक वाणी अनुबन्ध"
            sort_order = 3

        vm = re.search(r"\((\d+)\)", clean_t)
        verse_no = int(vm.group(1)) if vm else verse_no
        sort_rank = (sort_order, 0, verse_no)
        return ext_author, ch_id, ch_name, verse_no, sort_rank

    # 8. Sri Narayan Swami Vani
    if gid == "narayan-swami-vani":
        sub_name = "सामान्य पद"
        for candidate in ["पद सिद्धान्त", "मान लीला दोहावाली", "युगल छदम लीला", "वन झूलन लीला",
                          "प्रेम परीक्षा लीला", "वसन्त लीला", "सम्भ्रम-मानलीला", "नवपनिहारी लीला",
                          "वंशी लीला", "रास पंचाध्यायी लीला", "नवलसखी दान लीला", "शयन लीला",
                          "सखी अनुराग लीला", "नवदुलहीन लीला", "नवदुलहिन लीला", "अनुराग रस"]:
            if candidate in clean_t or candidate in sub_work:
                sub_name = candidate.replace("नवदुलहिन", "नवदुलहीन")
                break
        ch_id = f"leela-{sub_name}"
        ch_name = sub_name
        vm = re.search(r"\((\d+)\)", clean_t)
        verse_no = int(vm.group(1)) if vm else verse_no
        sort_rank = (1 if sub_name != "सामान्य पद" else 9, hash(sub_name) % 1000, verse_no)
        return ext_author, ch_id, ch_name, verse_no, sort_rank

    # 9. Bayalees Leela (Shri Dhruvdas)
    if gid == "bayalees-leela":
        sub_name = "बयालीस लीला"
        for candidate in ["वृन्दावन शत लीला", "वृंदावन शत लीला", "श्रृंगार शत", "श्रिंगार शत",
                          "मन शिक्षा लीला", "मन शिक्षा", "ख्याल हुल्लास", "जीव दशा", "प्रेमावली",
                          "भजन शत", "पद्यावली", "युगल ध्यान", "अनुराग लता", "आनंदाष्टक", "रहस्य लता"]:
            if candidate in clean_t or candidate in sub_work:
                sub_name = candidate.replace("वृंदावन शत लीला", "वृन्दावन शत लीला").replace("श्रिंगार शत", "श्रृंगार शत").replace("मन शिक्षा", "मन शिक्षा लीला")
                break
        ch_id = f"leela-{sub_name}"
        ch_name = sub_name
        vm = re.search(r"\((\d+)\)", clean_t)
        verse_no = int(vm.group(1)) if vm else verse_no
        sort_rank = (1 if sub_name != "बयालीस लीला" else 9, hash(sub_name) % 1000, verse_no)
        return ext_author, ch_id, ch_name, verse_no, sort_rank

    # 10. General / Other Granthas: Use sub_work if available, else general
    ch_name = "सामान्य पद"
    if sub_work:
        last_part = sub_work.split(",")[-1].strip()
        if len(last_part) > 2 and not last_part.isdigit():
            ch_name = last_part

    ch_id = f"ch-{ch_name}"
    vm = re.search(r"\((\d+)\)", clean_t)
    verse_no = int(vm.group(1)) if vm else verse_no
    sort_rank = (1 if ch_name != "सामान्य पद" else 9, hash(ch_name) % 1000, verse_no)
    return ext_author, ch_id, ch_name, verse_no, sort_rank

def process_all():
    print(f"Executing Master Reorganization across {GRANTHAS_DIR}...")
    files = sorted(glob.glob(os.path.join(GRANTHAS_DIR, "*.json")))

    hierarchy_data = {
        "generatedAt": "2026-11-09T09:45:00Z",
        "stats": {
            "totalVerses": 0,
            "totalGranthas": len(files),
            "totalAuthors": 0,
            "totalChapters": 0
        },
        "granthas": {},
        "authors": {}
    }

    manifest_granthas = {}
    author_counter = Counter()
    author_granthas = defaultdict(set)
    total_pads_all = 0

    for fpath in files:
        fname = os.path.basename(fpath)
        gid = fname.replace(".json", "")

        with open(fpath, "r", encoding="utf-8") as fp:
            pads = json.load(fp)

        if not isinstance(pads, list):
            continue

        # Step 1: Deduplicate scraper artifact pages for Ramcharitmanas and Valmiki Ramayana
        if gid in ["ramcharitmanas", "valmiki-ramayana"]:
            dedup_dict = {}
            for p in pads:
                t = clean_text(p.get("titleDevanagari", ""))
                k = t
                if k not in dedup_dict:
                    dedup_dict[k] = p
                else:
                    old_len = sum(len(v.get("linesDevanagari", [])) for v in dedup_dict[k].get("verses", []))
                    new_len = sum(len(v.get("linesDevanagari", [])) for v in p.get("verses", []))
                    if new_len > old_len:
                        dedup_dict[k] = p
            print(f"  [{gid}] Deduplicated {len(pads)} -> {len(dedup_dict)} unique sacred verses.")
            pads = list(dedup_dict.values())

        # Step 2: Sanitize & Classify each pada
        annotated = []
        for idx, p in enumerate(pads, start=1):
            p = sanitize_pad(p)
            ext_auth, ch_id, ch_name, verse_no, sort_rank = determine_grantha_subdivision(gid, p, idx)
            p["author"] = ext_auth
            p["chapterId"] = ch_id
            p["chapterName"] = ch_name
            p["verseNumber"] = verse_no
            annotated.append((sort_rank, p))

            author_counter[ext_auth] += 1
            author_granthas[ext_auth].add(gid)

        # Step 3: Canonical stable sort: (chapter/leela rank, verse number)
        annotated.sort(key=lambda x: x[0])

        # Step 4: Reassign sequential 1..N index and collect chapter stats
        sorted_pads = []
        chapters_dict = {}

        for idx, (_, p) in enumerate(annotated, start=1):
            p["index"] = idx
            sorted_pads.append(p)

            ch_id = p["chapterId"]
            ch_name = p["chapterName"]
            if ch_id not in chapters_dict:
                chapters_dict[ch_id] = {
                    "id": ch_id,
                    "name": ch_name,
                    "verseCount": 0,
                    "firstPadId": p.get("id"),
                    "firstPadSlug": p.get("slug") or p.get("id")
                }
            chapters_dict[ch_id]["verseCount"] += 1

        # Step 5: Save cleanly formatted JSON
        with open(fpath, "w", encoding="utf-8") as fp:
            json.dump(sorted_pads, fp, ensure_ascii=False, indent=2)

        # Step 6: Compute hash & gzip size for manifest
        with open(fpath, "rb") as fp:
            raw_bytes = fp.read()
        file_hash = hashlib.sha256(raw_bytes).hexdigest()[:12]
        gz_bytes = len(gzip.compress(raw_bytes))

        manifest_granthas[gid] = {
            "count": len(sorted_pads),
            "hash": file_hash,
            "file": fname,
            "rawBytes": len(raw_bytes),
            "gzBytes": gz_bytes
        }

        # Step 7: Record Grantha in Hierarchy
        ch_list = list(chapters_dict.values())
        hierarchy_data["granthas"][gid] = {
            "id": gid,
            "verseCount": len(sorted_pads),
            "chaptersCount": len(ch_list),
            "chapters": ch_list
        }
        hierarchy_data["stats"]["totalChapters"] += len(ch_list)
        total_pads_all += len(sorted_pads)
        print(f"✓ {gid:24}: {len(sorted_pads):5} verses across {len(ch_list):2} chapters (hash={file_hash})")

    # Master Authors Summary
    hierarchy_data["stats"]["totalVerses"] = total_pads_all
    for auth, cnt in author_counter.most_common():
        hierarchy_data["authors"][auth] = {
            "name": auth,
            "verseCount": cnt,
            "granthas": sorted(list(author_granthas[auth]))
        }
    hierarchy_data["stats"]["totalAuthors"] = len(hierarchy_data["authors"])

    # Output master hierarchy JSON
    hier_path = os.path.join(ROOT_DIR, "public", "data", "scripture-hierarchy.json")
    with open(hier_path, "w", encoding="utf-8") as fp:
        json.dump(hierarchy_data, fp, ensure_ascii=False, indent=2)
    print(f"\n✓ Saved scripture hierarchy to {hier_path}")

    # Output updated manifest.json
    manifest_path = os.path.join(ROOT_DIR, "public", "data", "manifest.json")
    with open(manifest_path, "r", encoding="utf-8") as fp:
        manifest = json.load(fp)
    manifest["totalPadas"] = total_pads_all
    manifest["granthas"] = manifest_granthas
    manifest["generatedAt"] = "2026-11-09T09:45:00Z"
    with open(manifest_path, "w", encoding="utf-8") as fp:
        json.dump(manifest, fp, ensure_ascii=False, indent=2)
    print(f"✓ Updated manifest at {manifest_path}")

if __name__ == "__main__":
    process_all()
