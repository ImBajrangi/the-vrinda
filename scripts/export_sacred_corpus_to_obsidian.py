#!/usr/bin/env python3
"""
Vrindopnisad 2.0 • Obsidian Second Brain Sacred Corpus Exporter
Exports all normalized Stories, Biographies, Places, and Rituals into
interconnected, deeply linked Obsidian markdown notes with full wikilinks and YAML frontmatter.
"""

import os
import glob
import json
import re

VAULT_BASE = "/Users/sakhi/Documents/Obsidian Vault/Projects/Vrindopnisad/Data Graph"
STORIES_DIR = "/Users/sakhi/Code/vrindopnisad/public/data/stories"
BIOS_DIR = "/Users/sakhi/Code/vrindopnisad/public/data/biographies"
PLACES_DIR = "/Users/sakhi/Code/vrindopnisad/public/data/places"
RITUALS_DIR = "/Users/sakhi/Code/vrindopnisad/public/data/rituals"

def clean_filename(name: str) -> str:
    cleaned = re.sub(r'[\\/*?:"<>|]', "", name).strip()
    return cleaned

def export_stories():
    out_dir = os.path.join(VAULT_BASE, "Stories")
    os.makedirs(out_dir, exist_ok=True)
    count = 0
    files = glob.glob(os.path.join(STORIES_DIR, "ch-*.json"))
    for fpath in sorted(files):
        with open(fpath, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        slug = data.get("slug", "story")
        title_dev = data.get("titleDevanagari", data.get("title", slug))
        title_en = data.get("title", slug)
        category_hi = data.get("categoryHindi", "सनातन पौराणिक प्रसंग")
        summary = data.get("summary", "")
        reading_time = data.get("readingTimeMinutes", 5)
        tradition = data.get("tradition", "श्रीमद्भागवत एवं पुराण परम्परा")
        purport = data.get("purport", "")
        characters = data.get("characters", [])
        chapters = data.get("chapters", [])
        tags = data.get("tags", [])
        
        # Format markdown
        filename = clean_filename(title_dev.split(":")[0]) + ".md"
        out_path = os.path.join(out_dir, filename)
        
        tag_lines = "\n".join([f"  - {t}" for t in tags if t])
        char_list = "\n".join([f"- **{c.get('nameDevanagari', c.get('name', ''))}**: {c.get('role', '')}" for c in characters])
        
        chap_blocks = []
        for ch in chapters:
            ch_num = ch.get("chapterNumber", 1)
            ch_title = ch.get("titleDevanagari", ch.get("title", f"अध्याय {ch_num}"))
            ch_content = ch.get("content", "")
            ch_purport = ch.get("purport", "")
            block = f"### अध्याय {ch_num}: {ch_title}\n\n{ch_content}\n\n> [!TIP] आध्यात्मिक मर्म\n> {ch_purport}"
            chap_blocks.append(block)
        
        chaps_text = "\n\n---\n\n".join(chap_blocks)
        
        content = f"""---
title: "{title_dev}"
nameDevanagari: "{title_dev}"
nameEnglish: "{title_en}"
slug: "{slug}"
category: "{category_hi}"
readingTime: "{reading_time} min"
tradition: "[[Traditions/Sanatan Epic & Bhakti Tradition|{tradition}]]"
tags:
  - vrindopnisad/story
  - sacred-katha
  - leela
{tag_lines}
---

# 📖 {title_dev}
*({title_en})*

> [!NOTE] पावन प्रसंग सार एवं महात्म्य
> **मूल ग्रन्थ / परम्परा**: {tradition}  
> **श्रेणी**: {category_hi}  
> **अध्ययन समय**: {reading_time} मिनट  
> **सार**: {summary}

---

## 👥 प्रमुख पात्र (Sacred Characters)
{char_list}

---

## 📜 अध्याय-वार दिव्य कथा प्रसंग (Chapters & Leelas)
{chaps_text}

---

## 🪷 पारमार्थिक शिक्षा एवं दार्शनिक मर्म (Spiritual Significance)
> [!IMPORTANT] जीवन में धारण करने योग्य मर्म
> {purport}

---

## 🔗 सह-सम्बन्ध एवं संदर्भ (Related Nodes)
- [[_Master Sacred Knowledge Nexus|मास्टर डेटा नेक्सस]]
- [[Traditions/Sanatan Epic & Bhakti Tradition|सनातन महाकाव्य एवं भक्ति परम्परा]]
"""
        with open(out_path, "w", encoding="utf-8") as out_f:
            out_f.write(content.strip() + "\n")
        count += 1
    print(f"✓ Exported {count} Sacred Stories to Obsidian: {out_dir}")

def export_biographies():
    out_dir = os.path.join(VAULT_BASE, "Biographies")
    os.makedirs(out_dir, exist_ok=True)
    count = 0
    files = glob.glob(os.path.join(BIOS_DIR, "bio-*.json"))
    for fpath in sorted(files):
        with open(fpath, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        slug = data.get("slug", "saint")
        name_dev = data.get("nameDevanagari", slug)
        name_en = data.get("name", slug)
        honorific = data.get("titleHonorific", "परम पावन संत")
        period = data.get("period", "प्राचीन सनातन काल")
        tradition = data.get("tradition", "सनातन भक्ति परंपरा")
        guru = data.get("guru", "सनातन सद्गुरु")
        lineage = data.get("lineage", {})
        sampradaya = lineage.get("sampradaya", tradition)
        seat = lineage.get("seatOrPeetham", "पावन तीर्थ पीठ")
        birth_place = data.get("birthPlace", "पावन तीर्थ क्षेत्र")
        samadhi = data.get("samadhiLocation", {})
        samadhi_place = samadhi.get("place", "पावन समाधि")
        samadhi_dham = samadhi.get("dhamOrRegion", "श्री धाम")
        samadhi_sig = samadhi.get("darshanSignificance", "नित्य लीला प्रवेश")
        works = data.get("literaryWorks", [])
        leelas = data.get("keyLeelas", [])
        tags = data.get("tags", [])
        
        filename = clean_filename(name_dev) + ".md"
        out_path = os.path.join(out_dir, filename)
        
        tag_lines = "\n".join([f"  - {t}" for t in tags if t])
        
        works_list = "\n".join([f"- **{w.get('titleDevanagari', w.get('title', ''))}** ({w.get('versesCount', 0)} पद/श्लोक): {w.get('description', '')}" for w in works])
        leelas_list = "\n".join([f"### {l.get('title', 'पावन प्रसंग')}\n{l.get('description', '')}" for l in leelas])
        
        content = f"""---
title: "{name_dev}"
nameDevanagari: "{name_dev}"
nameEnglish: "{name_en}"
slug: "{slug}"
honorific: "{honorific}"
tradition: "[[Traditions/Sanatan Epic & Bhakti Tradition|{tradition}]]"
guru: "[[Saints/{guru}|{guru}]]"
birthPlace: "{birth_place}"
samadhi: "[[Places/{samadhi_dham}|{samadhi_place}]]"
tags:
  - vrindopnisad/saint
  - biography
  - charitra
{tag_lines}
---

# 🪔 {name_dev}
*({honorific})*

> [!NOTE] पावन परिचय एवं गुरु-परंपरा
> **आविर्भाव काल**: {period}  
> **जन्म स्थल**: {birth_place}  
> **परम पूज्य सद्गुरु**: [[Saints/{guru}|{guru}]]  
> **सम्प्रदाय / परम्परा**: {sampradaya}  
> **प्रधान पीठ**: {seat}  
> **पावन समाधि स्थल**: [[Places/{samadhi_dham}|{samadhi_place}]] ({samadhi_sig})

---

## 📜 दिव्य जीवन चरित्र एवं मुख्य लीलाएँ (Divine Leelas & Episodes)
{leelas_list}

---

## 📚 रचित पावन ग्रंथावली एवं साहित्य (Literary Works)
{works_list}

---

## 🔗 सह-सम्बन्ध एवं संदर्भ (Related Nodes)
- [[_Master Sacred Knowledge Nexus|मास्टर डेटा नेक्सस]]
- [[Traditions/Sanatan Epic & Bhakti Tradition|सम्प्रदाय व परंपरा]]
"""
        with open(out_path, "w", encoding="utf-8") as out_f:
            out_f.write(content.strip() + "\n")
        count += 1
    print(f"✓ Exported {count} Saint Biographies to Obsidian: {out_dir}")

def export_places():
    out_dir = os.path.join(VAULT_BASE, "Places")
    os.makedirs(out_dir, exist_ok=True)
    count = 0
    files = glob.glob(os.path.join(PLACES_DIR, "place-*.json"))
    for fpath in sorted(files):
        with open(fpath, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        slug = data.get("slug", "place")
        name_dev = data.get("nameDevanagari", slug)
        name_en = data.get("name", slug)
        region = data.get("regionNameHindi", "भारतवर्ष")
        brief = data.get("briefSignificance", "")
        deity_dev = data.get("deityDevanagari", "परब्रह्म परमात्मा")
        deity_en = data.get("deity", "Supreme Lord")
        parikrama_km = data.get("parikramaKm", 0)
        timings = data.get("darshanTimings", {})
        morning = timings.get("morning", {})
        evening = timings.get("evening", {})
        special_notes = timings.get("specialNotes", "ऋतु के अनुसार समय परिवर्तन सम्भव है।")
        kunds = data.get("nearbyKundsOrShilats", [])
        samadhis = data.get("samadhisNearby", [])
        leelas = data.get("associatedLeelas", [])
        rules = data.get("rulesAndEtiquette", [])
        
        filename = clean_filename(name_dev) + ".md"
        out_path = os.path.join(out_dir, filename)
        
        kunds_list = "\n".join([f"- {k}" for k in kunds])
        samadhis_list = "\n".join([f"- {s}" for s in samadhis])
        leelas_list = "\n".join([f"### {l.get('title', 'लीला प्रसंग')}\n{l.get('description', '')}" for l in leelas])
        rules_list = "\n".join([f"- {r}" for r in rules])
        
        content = f"""---
title: "{name_dev}"
nameDevanagari: "{name_dev}"
nameEnglish: "{name_en}"
slug: "{slug}"
region: "{region}"
deity: "{deity_dev}"
parikramaKm: {parikrama_km}
tags:
  - vrindopnisad/place
  - sacred-dham
  - tirtha
---

# 🏛️ {name_dev}
*({name_en})*

> [!NOTE] धाम परिचय एवं प्रधान आराध्य
> **प्रधान आराध्य देव**: {deity_dev} ({deity_en})  
> **पावन क्षेत्र**: {region}  
> **परिक्रमा मार्ग**: {parikrama_km} कि.मी.  
> **महिमा सार**: {brief}

---

## ⏰ दर्शन समय एवं आरती क्रम (Darshan & Aarti Timings)
- **प्रातः दर्शन**: {morning.get('open', '06:00')} - {morning.get('close', '12:00')} ({morning.get('aartiName', 'मंगला व शृंगार आरती')})
- **सायं दर्शन**: {evening.get('open', '16:00')} - {evening.get('close', '21:00')} ({evening.get('aartiName', 'संध्या व शयन आरती')})
- **विशेष निर्देश**: {special_notes}

---

## 🌊 पावन कुण्ड, शिलाएं एवं तीर्थ घाट (Sacred Kunds & Spots)
{kunds_list}

---

## 🪔 संतों के पावन समाधि स्थल (Saints Samadhis Nearby)
{samadhis_list}

---

## 📜 पावन लीला प्रसंग (Associated Leelas & History)
{leelas_list}

---

## 🌸 तीर्थ दर्शन एवं परिक्रमा मर्यादा नियम (Rules & Etiquette)
{rules_list}

---

## 🔗 सह-सम्बन्ध एवं संदर्भ (Related Nodes)
- [[_Master Sacred Knowledge Nexus|मास्टर डेटा नेक्सस]]
"""
        with open(out_path, "w", encoding="utf-8") as out_f:
            out_f.write(content.strip() + "\n")
        count += 1
    print(f"✓ Exported {count} Sacred Places to Obsidian: {out_dir}")

def export_rituals():
    out_dir = os.path.join(VAULT_BASE, "Rituals")
    os.makedirs(out_dir, exist_ok=True)
    count = 0
    files = glob.glob(os.path.join(RITUALS_DIR, "ritual-*.json"))
    for fpath in sorted(files):
        with open(fpath, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        slug = data.get("slug", "ritual")
        title_dev = data.get("titleDevanagari", slug)
        title_en = data.get("title", slug)
        category_hi = data.get("categoryHindi", "आरती एवं स्तोत्र")
        deity_dev = data.get("deityDevanagari", "इष्टदेव")
        author = data.get("author", "सनातन परम्परा")
        verses = data.get("totalVerses", 0)
        duration = data.get("durationMinutes", 5)
        stanzas = data.get("stanzas", [])
        tags = data.get("tags", [])
        
        filename = clean_filename(title_dev.split(":")[0]) + ".md"
        out_path = os.path.join(out_dir, filename)
        
        stanzas_text = []
        for s in stanzas:
            s_num = s.get("stanzaNumber", 1)
            lines = "\n".join(s.get("textDevanagari", []))
            meaning = s.get("meaning", "")
            stanzas_text.append(f"**॥ पद {s_num} ॥**\n\n{lines}\n\n*भावार्थ: {meaning}*")
        
        all_stanzas = "\n\n---\n\n".join(stanzas_text)
        tag_lines = "\n".join([f"  - {t}" for t in tags if t])
        
        content = f"""---
title: "{title_dev}"
nameDevanagari: "{title_dev}"
nameEnglish: "{title_en}"
slug: "{slug}"
category: "{category_hi}"
deity: "{deity_dev}"
author: "{author}"
totalVerses: {verses}
durationMinutes: {duration}
tags:
  - vrindopnisad/ritual
  - aarti
  - upasana
  - stotra
{tag_lines}
---

# 🔔 {title_dev}
*({title_en})*

> [!NOTE] उपासना विवरण एवं परिचय
> **आराध्य देव**: {deity_dev}  
> **श्रेणी**: {category_hi}  
> **रचयिता**: {author}  
> **कुल पद / श्लोक**: {verses}  
> **अनुमानित पाठ समय**: {duration} मिनट

---

## 🪔 संपूर्ण पाठ एवं पद्यात्मक भावार्थ (Sacred Text & Stanza Meanings)
{all_stanzas}

---

## 🔗 सह-सम्बन्ध एवं संदर्भ (Related Nodes)
- [[_Master Sacred Knowledge Nexus|मास्टर डेटा नेक्सस]]
"""
        with open(out_path, "w", encoding="utf-8") as out_f:
            out_f.write(content.strip() + "\n")
        count += 1
    print(f"✓ Exported {count} Sacred Rituals to Obsidian: {out_dir}")

def update_master_nexus():
    nexus_path = os.path.join(VAULT_BASE, "_Master Sacred Knowledge Nexus.md")
    if not os.path.exists(nexus_path):
        return
        
    with open(nexus_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    # Check if section 7 already exists
    if "## 🌟 7. पावन कथा, चरित्र, तीर्थ एवं नित्य उपासना नेक्सस" in content:
        print("✓ Master Nexus already contains Sacred Sections.")
        return

    new_section = """
---

## 🌟 7. पावन कथा, चरित्र, तीर्थ एवं नित्य उपासना नेक्सस (Sacred Sections)

```mermaid
graph TD
    classDef story fill:#FFF7ED,stroke:#EA580C,stroke-width:2px;
    classDef bio fill:#FFF1F2,stroke:#E11D48,stroke-width:2px;
    classDef place fill:#F0FDF4,stroke:#16A34A,stroke-width:2px;
    classDef ritual fill:#FEFCE8,stroke:#CA8A04,stroke-width:2px;

    S1["ध्रुव चरित्र"]:::story --> P1["मधुवन (मथुरा)"]:::place
    S2["प्रह्लाद चरित्र"]:::story --> R1["नृसिंह स्तुति"]:::ritual
    S3["गोवर्धन धारण"]:::story --> P2["गिरिराज गोवर्धन"]:::place
    
    B1["गोस्वामी तुलसीदास"]:::bio --> R2["हनुमान चालीसा"]:::ritual
    B1 --> P3["अयोध्या धाम"]:::place
    B2["संत एकनाथ"]:::bio --> P4["प्रतिष्ठान पैठण"]:::place
    B3["संत तुकाराम"]:::bio --> P5["पंढरपुर विट्ठल"]:::place
```

### क. दिव्य कथा व लीला नोड्स (12 Sacred Stories)
- [[Stories/ध्रुव चरित्र|ध्रुव चरित्र]] (अटल भक्ति व तपस्या)
- [[Stories/प्रह्लाद चरित्र|प्रह्लाद चरित्र]] (प्रभु का साक्षात् नृसिंह रूप)
- [[Stories/गजेंद्र मोक्ष|गजेंद्र मोक्ष]] (शरणम व आर्त पुकार)
- [[Stories/गोवर्धन धारण लीला|गोवर्धन धारण लीला]] (इंद्र मान मर्दन)
- [[Stories/समुद्र मंथन|समुद्र मंथन]] (अमृत प्राप्ति व शिव विषपान)
- [[Stories/सुदामा चरित्र|सुदामा चरित्र]] (मित्रता एवं निष्काम प्रेम)
- [[Stories/सीता स्वयंवर|सीता स्वयंवर]] (शिव धनुष भंग)
- [[Stories/नचिकेता कथा|नचिकेता कथा]] (कठोपनिषद् आत्मज्ञान)
- [[Stories/मार्कण्डेय चरित्र|मार्कण्डेय चरित्र]] (महामृत्युंजय सिद्धि)
- [[Stories/सत्यनारायण व्रत कथा|सत्यनारायण व्रत कथा]] (पंचम अध्याय महिमा)
- [[Stories/तुलसी विवाह व वृन्दा चरित्र|तुलसी विवाह व वृन्दा चरित्र]] (शालिग्राम सेवा)
- [[Stories/वट सावित्री व्रत कथा|वट सावित्री व्रत कथा]] (सतीत्व महिमा)

### ख. संत व ऋषि चरित्र नोड्स (12 Saint & Rishi Charitras)
- [[Biographies/गोस्वामी तुलसीदास जी|गोस्वामी तुलसीदास जी]] (रामचरितमानस रचयिता)
- [[Biographies/महर्षि वाल्मीकि जी|महर्षि वाल्मीकि जी]] (आदि कवि)
- [[Biographies/महर्षि वेदव्यास जी|महर्षि वेदव्यास जी]] (अठारह पुराण व महाभारत)
- [[Biographies/महर्षि अगस्त्य जी|महर्षि अगस्त्य जी]] (आदित्य हृदय स्तोत्र द्रष्टा)
- [[Biographies/महर्षि अत्रि जी|महर्षि अत्रि जी]] (सप्तर्षि, अनुसूया पति)
- [[Biographies/महर्षि अंगिरा जी|महर्षि अंगिरा जी]] (ऋग्वेद द्रष्टा)
- [[Biographies/संत एकनाथ महाराज|संत एकनाथ महाराज]] (एकनाथी भागवत)
- [[Biographies/संत तुकाराम महाराज|संत तुकाराम महाराज]] (तुकाराम गाथा)
- [[Biographies/संत ज्ञानेश्वर महाराज|संत ज्ञानेश्वर महाराज]] (ज्ञानेश्वरी)
- [[Biographies/मीराबाई|मीराबाई]] (अनन्य प्रेम दीवानी)
- [[Biographies/श्री हित हरिवंश महाप्रभु|श्री हित हरिवंश महाप्रभु]] (राधावल्लभ सम्प्रदाय)
- [[Biographies/स्वामी हरिदास जी|स्वामी हरिदास जी]] (निधिवन केलि कुंज)

### ग. पावन तीर्थ व धाम नोड्स (12 Sacred Dhams & Tirthas)
- [[Places/श्री वृन्दावन धाम|श्री वृन्दावन धाम]] (५००० देवालय, निधिवन, केलि निकुंज)
- [[Places/बरसाना धाम|बरसाना धाम]] (लाड़ली जी मन्दिर, भानु सरोवर)
- [[Places/मथुरा कृष्ण जन्मभूमि|मथुरा कृष्ण जन्मभूमि]] (केशव देव मन्दिर, विश्राम घाट)
- [[Places/गिरिराज गोवर्धन|गिरिराज गोवर्धन]] (२१ कि.मी. पावन परिक्रमा, दानघाटी)
- [[Places/श्री राम जन्मभूमि अयोध्या|श्री राम जन्मभूमि अयोध्या]] (सरयू तट, कनक भवन, हनुमान गढ़ी)
- [[Places/काशी विश्वनाथ ज्योतिर्लिंग|काशी विश्वनाथ ज्योतिर्लिंग]] (मणिकर्णिका, दशाश्वमेध घाट)
- [[Places/पंढरपुर विट्ठल-रुक्मिणी मन्दिर|पंढरपुर विट्ठल-रुक्मिणी मन्दिर]] (चंद्रभागा तट, वारकरी तीर्थ)
- [[Places/प्रतिष्ठान पैठण|प्रतिष्ठान पैठण]] (गोदावरी तट, एकनाथ समाधि)
- [[Places/जगन्नाथ पुरी धाम|जगन्नाथ पुरी धाम]] (चार धाम, श्री गुंडिचा मन्दिर)
- [[Places/बद्रीनाथ धाम|बद्रीनाथ धाम]] (अलकनंदा तट, बद्रीविशाल)
- [[Places/केदारनाथ ज्योतिर्लिंग|केदारनाथ ज्योतिर्लिंग]] (मंदाकिनी तट, रुद्र हिमालय)
- [[Places/रामेश्वरम ज्योतिर्लिंग|रामेश्वरम ज्योतिर्लिंग]] (रामनाथस्वामी मन्दिर, सेतुबंध)

### घ. नित्य उपासना, आरती व चालीसा नोड्स (11 Canonical Rituals)
- [[Rituals/आरती कुंजबिहारी की|आरती कुंजबिहारी की]] (श्री गिरिधर कृष्णमुरारी)
- [[Rituals/आरती कीजै हनुमान लला की|आरती कीजै हनुमान लला की]] (दुष्ट दलन रघुनाथ कला की)
- [[Rituals/ॐ जय जगदीश हरे|ॐ जय जगदीश हरे]] (सार्वभौमिक महाआरती)
- [[Rituals/श्री हनुमान चालीसा|श्री हनुमान चालीसा]] (संकटमोचन चालीस चौपाइयाँ)
- [[Rituals/श्री शिव चालीसा|श्री शिव चालीसा]] (जय गिरीश पति दीनदयाला)
- [[Rituals/श्री दुर्गा चालीसा|श्री दुर्गा चालीसा]] (नमो नमो दुर्गे सुख करनी)
- [[Rituals/मधुराष्टकम|मधुराष्टकम]] (अधरं मधुरं वदनं मधुरम्)
- [[Rituals/अच्युताष्टकम|अच्युताष्टकम]] (अच्युतं केशवं रामनारायणम्)
- [[Rituals/आदित्य हृदय स्तोत्र|आदित्य हृदय स्तोत्र]] (सूर्य नारायण कवच)
- [[Rituals/श्री रुद्राष्टकम|श्री रुद्राष्टकम]] (नमामीशमीशान निर्वाणरूपम्)
- [[Rituals/शिव ताण्डव स्तोत्रम्|शिव ताण्डव स्तोत्रम्]] (जटाटवीगलज्जलप्रवाहपावितस्थले)
"""
    with open(nexus_path, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n" + new_section.strip() + "\n")
    print("✓ Updated _Master Sacred Knowledge Nexus.md with all 4 Sacred Section clusters.")

if __name__ == "__main__":
    export_stories()
    export_biographies()
    export_places()
    export_rituals()
    update_master_nexus()
    print("✨ Sacred Corpus Obsidian Export completed successfully!")
