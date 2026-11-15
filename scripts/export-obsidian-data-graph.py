#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Vrindopnisad 2.0 - Obsidian Second Brain Data Graph Exporter
Generates interconnected Markdown files with [[Wikilinks]] into:
/Users/sakhi/Documents/Obsidian Vault/Projects/Vrindopnisad/Data Graph/
"""

import os
import re
import json
from collections import defaultdict

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
VAULT_DIR = "/Users/sakhi/Documents/Obsidian Vault"
PROJECT_GRAPH_DIR = os.path.join(VAULT_DIR, "Projects", "Vrindopnisad", "Data Graph")

DIRS = {
    "granthas": os.path.join(PROJECT_GRAPH_DIR, "Granthas"),
    "saints": os.path.join(PROJECT_GRAPH_DIR, "Saints"),
    "traditions": os.path.join(PROJECT_GRAPH_DIR, "Traditions"),
    "ragas": os.path.join(PROJECT_GRAPH_DIR, "Ragas"),
    "ashtayama": os.path.join(PROJECT_GRAPH_DIR, "Ashtayama"),
    "topics": os.path.join(PROJECT_GRAPH_DIR, "Topics"),
    "padas": os.path.join(PROJECT_GRAPH_DIR, "Padas"),
}

for d in DIRS.values():
    os.makedirs(d, exist_ok=True)

# 1. Load Source Data
with open(os.path.join(ROOT_DIR, "src", "data", "canonicalGranthas.json"), "r", encoding="utf-8") as f:
    granthas_list = json.load(f)

with open(os.path.join(ROOT_DIR, "src", "data", "canonicalSaints.json"), "r", encoding="utf-8") as f:
    saints_list = json.load(f)

with open(os.path.join(ROOT_DIR, "src", "data", "ashtayamaPeriods.json"), "r", encoding="utf-8") as f:
    ashtayama_list = json.load(f)

with open(os.path.join(ROOT_DIR, "src", "data", "sacredTopics.json"), "r", encoding="utf-8") as f:
    topics_list = json.load(f)

with open(os.path.join(ROOT_DIR, "public", "data", "scripture-hierarchy.json"), "r", encoding="utf-8") as f:
    hierarchy_data = json.load(f)

with open(os.path.join(ROOT_DIR, "public", "data", "granthas", "hit-chaurasi.json"), "r", encoding="utf-8") as f:
    hit_chaurasi_pads = json.load(f)

def safe_filename(name):
    clean = re.sub(r'[\\/*?:"<>|]', "", name).strip()
    return clean.replace("/", "-")

TRADITIONS_INFO = {
    "Shri Radhavallabh Sampradaya": {
        "devanagari": "श्री राधावल्लभ सम्प्रदाय",
        "founder": "Hit Harivansh Mahaprabhu",
        "philosophy": "हित रस / नित्य निकुंज विहार / अनन्य प्रेम लक्षणा भक्ति",
        "essence": "श्री हरिवंश महाप्रभु द्वारा प्रवर्तित श्री राधावल्लभ सम्प्रदाय में श्री राधारानी को ही सर्वोपरि इष्ट, गुरु व प्राण माना गया है। यहाँ युगल सरकार के नित्य विहार, निकुंज विलास व अनन्य भाव का निरूपण है।",
        "key_granthas": ["Hit Chaurasi", "Sphut Vani", "Bayalees Leela"],
        "key_saints": ["Hit Harivansh Mahaprabhu", "Dhruvdas", "Chacha Hit Vrindavan Das", "Hit Damodar Das", "Bhori Sakhi"],
    },
    "Shri Haridasi (Sakhi) Sampradaya": {
        "devanagari": "श्री हरिदासी (सखी) सम्प्रदाय",
        "founder": "Swami Haridas",
        "philosophy": "नित्य केलि / सखी भाव / निकुंज उपासना",
        "essence": "संगीत शिरोमणि स्वामी श्री हरिदास जी द्वारा प्रवर्तित सखी सम्प्रदाय में श्री बांकेबिहारी जी व श्री श्यामा-श्याम के सहज नित्य विलास का सखी भाव से अनवरत दर्शन व गान किया जाता है।",
        "key_granthas": ["Kelimal", "Biharin Dev Vani", "Lalit Kishori Vani"],
        "key_saints": ["Swami Haridas", "Vitthal Vipul Dev", "Biharin Dev", "Lalit Kishori Dev", "Pitambar Dev"],
    },
    "Shri Gaudiya Vaishnava Sampradaya": {
        "devanagari": "श्री गौड़ीय वैष्णव सम्प्रदाय",
        "founder": "Chaitanya Mahaprabhu",
        "philosophy": "अचिन्त्य भेदाभेद / मधुर रस / मंजरी भाव",
        "essence": "श्रीमन्महाप्रभु चैतन्य देव द्वारा उद्घाटित प्रेम-भक्ति धारा, जिसमें षड्गोस्वामियों (सनातन, रूप, जीव, रघुनाथ दास, रघुनाथ भट्ट, गोपाल भट्ट) ने वृन्दावन के लुप्त तीर्थों का प्राकट्य किया।",
        "key_granthas": ["Bhakti Rasamrita Sindhu", "Ujjvala Nilamani", "Radha Kripa Kataksha Stotram"],
        "key_saints": ["Chaitanya Mahaprabhu", "Roop Goswami", "Sanatan Goswami", "Jiva Goswami", "Raghunath Das Goswami"],
    },
    "Shri Pushtimarg (Vallabh Sampradaya)": {
        "devanagari": "श्री पुष्टिमार्ग (वल्लभ सम्प्रदाय)",
        "founder": "Vallabhacharya",
        "philosophy": "शुद्धाद्वैत / पुष्टि भक्ति / अष्टयाम सेवा",
        "essence": "जगद्गुरु श्री वल्लभाचार्य एवं श्री विट्ठलनाथ जी (गुसाईं जी) द्वारा संस्थापित पुष्टिमार्ग में भगवान के अनुग्रह (पुष्टि) को ही सर्वोपरि साधन माना गया है। अष्टछाप कवियों द्वारा हवेली संगीत व अष्टयाम सेवा का विधान है।",
        "key_granthas": ["Sur Sagar", "Paramanand Sagar", "Braj Bhajan"],
        "key_saints": ["Surdas", "Paramanand Das", "Kumbhandas", "Chaturbhujdas", "Govind Swami"],
    },
    "Shri Nimbarka Sampradaya": {
        "devanagari": "श्री निम्बार्क सम्प्रदाय",
        "founder": "Nimbarkacharya",
        "philosophy": "द्वैताद्वैत / युगल उपासना / सखी भाव",
        "essence": "भगवान हंस व सनकादिक कुमारों से प्रवाहित और श्री निम्बार्काचार्य जी द्वारा प्रचारित यह प्राचीनतम वैष्णव सम्प्रदाय है, जिसमें श्री राधा-माधव की युगल उपासना प्रथम स्थान पर है। श्री श्रीभट्ट व हरिव्यास देवाचार्य जी प्रमुख रसिक आचार्य हैं।",
        "key_granthas": ["Braj Binod", "Nagaridas Vani", "Narayan Swami Vani"],
        "key_saints": ["Nimbarkacharya", "Shribhatt", "Harivyas Devacharya", "Ghananand", "Nagari Das"],
    },
    "Sanatan Epic & Bhakti Tradition": {
        "devanagari": "सनातन महाकाव्य एवं रसिक संत परम्परा",
        "founder": "Maharshi Valmiki / Maharshi Ved Vyas",
        "philosophy": "धर्म, मर्यादा, शरणागति एवं अखिल भारतीय भक्ति आन्दोलन",
        "essence": "समस्त वैष्णव व आस्तिक परम्पराओं का मूल आधार, जिसमें आदिकाव्य वाल्मीकि रामायण, श्रीमद्भागवत, रामचरितमानस, भगवद्गीता तथा मीराबाई व रसखान जैसे अनन्य रसिक संतों की वाणी प्रवाहित होती है।",
        "key_granthas": ["Valmiki Ramayana", "Shrimad Bhagavatam", "Ramcharitmanas", "Bhagavad Gita", "Durga Saptashati", "Vyas Vani", "Meera Padavali", "Raskhan Padavali", "Bhakti Shatak", "Braj Dham Mahatmya"],
        "key_saints": ["Maharshi Valmiki", "Maharshi Ved Vyas", "Goswami Tulsidas", "Hariram Vyas", "Meera Bai", "Raskhan"],
    }
}

TRADITION_NAME_MAP = {
    "राधावल्लभ": "Shri Radhavallabh Sampradaya",
    "हरिदासी": "Shri Haridasi (Sakhi) Sampradaya",
    "अष्टछाप": "Shri Pushtimarg (Vallabh Sampradaya)",
    "निम्बार्क": "Shri Nimbarka Sampradaya",
    "रसिक परम्परा": "Sanatan Epic & Bhakti Tradition",
}

def resolve_tradition(raw_tradition):
    if not raw_tradition:
        return "Sanatan Epic & Bhakti Tradition"
    for k, v in TRADITION_NAME_MAP.items():
        if k in raw_tradition:
            return v
    return "Sanatan Epic & Bhakti Tradition"

# Grantha to Tradition & Recommendation mapping
GRANTHA_CONFIG = {
    "hit-chaurasi": {
        "titleEng": "Hit Chaurasi",
        "tradition": "Shri Radhavallabh Sampradaya",
        "recommended": ["Sphut Vani", "Kelimal", "Vyas Vani", "Bayalees Leela"],
        "ragas": ["Raga Vibhas", "Raga Bilawal", "Raga Kalyan", "Raga Sarang", "Raga Malhar", "Raga Gauri"],
        "ashtayama": ["1. Mangala (03.30 - 06.00 AM)", "2. Shringar (06.00 - 08.30 AM)", "8. Shayana & Nitya Ras (08.30 PM - 03.30 AM)"],
    },
    "kelimal": {
        "titleEng": "Kelimal",
        "tradition": "Shri Haridasi (Sakhi) Sampradaya",
        "recommended": ["Hit Chaurasi", "Vyas Vani", "Biharin Dev Vani", "Lalit Kishori Vani"],
        "ragas": ["Raga Kanhara", "Raga Sarang", "Raga Kedar", "Raga Malhar", "Raga Vibhas"],
        "ashtayama": ["2. Shringar (06.00 - 08.30 AM)", "8. Shayana & Nitya Ras (08.30 PM - 03.30 AM)"],
    },
    "vyas-vani": {
        "titleEng": "Vyas Vani",
        "tradition": "Sanatan Epic & Bhakti Tradition",
        "recommended": ["Hit Chaurasi", "Kelimal", "Bhakti Shatak", "Rasik Vani Sangrah"],
        "ragas": ["Raga Sarang", "Raga Gauri", "Raga Dhanashri", "Raga Kalyan"],
        "ashtayama": ["1. Mangala (03.30 - 06.00 AM)", "4. Rajbhog (10.30 AM - 03.30 PM)"],
    },
    "sur-sagar": {
        "titleEng": "Sur Sagar",
        "tradition": "Shri Pushtimarg (Vallabh Sampradaya)",
        "recommended": ["Paramanand Sagar", "Meera Padavali", "Raskhan Padavali", "Braj Bhajan"],
        "ragas": ["Raga Bilawal", "Raga Sarang", "Raga Asavari", "Raga Dhanashri"],
        "ashtayama": ["2. Shringar (06.00 - 08.30 AM)", "3. Gwal (08.30 - 10.30 AM)"],
    },
    "valmiki-ramayana": {
        "titleEng": "Valmiki Ramayana",
        "tradition": "Sanatan Epic & Bhakti Tradition",
        "recommended": ["Ramcharitmanas", "Shrimad Bhagavatam", "Bhagavad Gita"],
        "ragas": ["Raga Bhairav", "Raga Kedar"],
        "ashtayama": ["1. Mangala (03.30 - 06.00 AM)", "7. Sandhya Aarti (06.30 - 08.30 PM)"],
    },
    "shrimad-bhagavatam": {
        "titleEng": "Shrimad Bhagavatam",
        "tradition": "Sanatan Epic & Bhakti Tradition",
        "recommended": ["Bhagavad Gita", "Valmiki Ramayana", "Ramcharitmanas", "Sur Sagar"],
        "ragas": ["Raga Vibhas", "Raga Kanhara"],
        "ashtayama": ["1. Mangala (03.30 - 06.00 AM)", "8. Shayana & Nitya Ras (08.30 PM - 03.30 AM)"],
    },
    "ramcharitmanas": {
        "titleEng": "Ramcharitmanas",
        "tradition": "Sanatan Epic & Bhakti Tradition",
        "recommended": ["Valmiki Ramayana", "Bhagavad Gita", "Bhakti Shatak"],
        "ragas": ["Raga Kalyan", "Raga Gauri"],
        "ashtayama": ["4. Rajbhog (10.30 AM - 03.30 PM)", "7. Sandhya Aarti (06.30 - 08.30 PM)"],
    },
    "bhagavad-gita": {
        "titleEng": "Bhagavad Gita",
        "tradition": "Sanatan Epic & Bhakti Tradition",
        "recommended": ["Shrimad Bhagavatam", "Valmiki Ramayana", "Bhakti Shatak"],
        "ragas": ["Raga Bhairav"],
        "ashtayama": ["1. Mangala (03.30 - 06.00 AM)"],
    },
    "durga-saptashati": {
        "titleEng": "Durga Saptashati",
        "tradition": "Sanatan Epic & Bhakti Tradition",
        "recommended": ["Stotras", "Bhagavad Gita"],
        "ragas": ["Raga Bhairav"],
        "ashtayama": ["7. Sandhya Aarti (06.30 - 08.30 PM)"],
    },
    "bayalees-leela": {
        "titleEng": "Bayalees Leela",
        "tradition": "Shri Radhavallabh Sampradaya",
        "recommended": ["Hit Chaurasi", "Braj Dham Mahatmya", "Rasik Charitra Katha"],
        "ragas": ["Raga Sarang", "Raga Dhanashri"],
        "ashtayama": ["8. Shayana & Nitya Ras (08.30 PM - 03.30 AM)"],
    },
    "bhakti-shatak": {
        "titleEng": "Bhakti Shatak",
        "tradition": "Sanatan Epic & Bhakti Tradition",
        "recommended": ["Vyas Vani", "Ramcharitmanas"],
        "ragas": ["Raga Gauri"],
        "ashtayama": ["4. Rajbhog (10.30 AM - 03.30 PM)"],
    },
    "raskhan-padavali": {
        "titleEng": "Raskhan Padavali",
        "tradition": "Sanatan Epic & Bhakti Tradition",
        "recommended": ["Meera Padavali", "Sur Sagar", "Braj Rasiya"],
        "ragas": ["Raga Sarang", "Raga Kalyan", "Raga Malhar"],
        "ashtayama": ["3. Gwal (08.30 - 10.30 AM)", "6. Sandhya Bhog (05.00 - 06.30 PM)"],
    },
    "meera-padavali": {
        "titleEng": "Meera Padavali",
        "tradition": "Sanatan Epic & Bhakti Tradition",
        "recommended": ["Sur Sagar", "Raskhan Padavali", "Braj Bhajan"],
        "ragas": ["Raga Sarang", "Raga Sorath", "Raga Kafi"],
        "ashtayama": ["6. Sandhya Bhog (05.00 - 06.30 PM)", "7. Sandhya Aarti (06.30 - 08.30 PM)"],
    },
    "paramanand-sagar": {
        "titleEng": "Paramanand Sagar",
        "tradition": "Shri Pushtimarg (Vallabh Sampradaya)",
        "recommended": ["Sur Sagar", "Braj Bhajan"],
        "ragas": ["Raga Bilawal", "Raga Sarang"],
        "ashtayama": ["2. Shringar (06.00 - 08.30 AM)"],
    },
    "biharin-dev-vani": {
        "titleEng": "Biharin Dev Vani",
        "tradition": "Shri Haridasi (Sakhi) Sampradaya",
        "recommended": ["Kelimal", "Lalit Kishori Vani", "Hit Chaurasi"],
        "ragas": ["Raga Kanhara", "Raga Vibhas"],
        "ashtayama": ["8. Shayana & Nitya Ras (08.30 PM - 03.30 AM)"],
    },
    "lalit-kishori-vani": {
        "titleEng": "Lalit Kishori Vani",
        "tradition": "Shri Haridasi (Sakhi) Sampradaya",
        "recommended": ["Kelimal", "Biharin Dev Vani"],
        "ragas": ["Raga Kanhara", "Raga Sarang"],
        "ashtayama": ["8. Shayana & Nitya Ras (08.30 PM - 03.30 AM)"],
    },
    "stotras": {
        "titleEng": "Stotras",
        "tradition": "Sanatan Epic & Bhakti Tradition",
        "recommended": ["Durga Saptashati", "Braj Dham Mahatmya"],
        "ragas": ["Raga Bhairav", "Raga Kalyan"],
        "ashtayama": ["1. Mangala (03.30 - 06.00 AM)", "7. Sandhya Aarti (06.30 - 08.30 PM)"],
    },
    "braj-dham-mahatmya": {
        "titleEng": "Braj Dham Mahatmya",
        "tradition": "Sanatan Epic & Bhakti Tradition",
        "recommended": ["Bayalees Leela", "Rasik Charitra Katha"],
        "ragas": ["Raga Sarang"],
        "ashtayama": ["1. Mangala (03.30 - 06.00 AM)"],
    },
    "braj-binod": {
        "titleEng": "Braj Binod",
        "tradition": "Shri Nimbarka Sampradaya",
        "recommended": ["Nagaridas Vani", "Narayan Swami Vani"],
        "ragas": ["Raga Sarang"],
        "ashtayama": ["4. Rajbhog (10.30 AM - 03.30 PM)"],
    },
    "nagaridas-vani": {
        "titleEng": "Nagaridas Vani",
        "tradition": "Shri Nimbarka Sampradaya",
        "recommended": ["Braj Binod", "Narayan Swami Vani"],
        "ragas": ["Raga Sarang", "Raga Kalyan"],
        "ashtayama": ["4. Rajbhog (10.30 AM - 03.30 PM)"],
    },
    "narayan-swami-vani": {
        "titleEng": "Narayan Swami Vani",
        "tradition": "Shri Nimbarka Sampradaya",
        "recommended": ["Nagaridas Vani", "Braj Binod"],
        "ragas": ["Raga Sarang"],
        "ashtayama": ["4. Rajbhog (10.30 AM - 03.30 PM)"],
    },
    "braj-rasiya": {
        "titleEng": "Braj Rasiya",
        "tradition": "Sanatan Epic & Bhakti Tradition",
        "recommended": ["Braj Bhajan", "Raskhan Padavali"],
        "ragas": ["Raga Kafi", "Raga Basant"],
        "ashtayama": ["6. Sandhya Bhog (05.00 - 06.30 PM)"],
    },
    "braj-bhajan": {
        "titleEng": "Braj Bhajan",
        "tradition": "Sanatan Epic & Bhakti Tradition",
        "recommended": ["Braj Rasiya", "Sur Sagar"],
        "ragas": ["Raga Kalyan", "Raga Kafi"],
        "ashtayama": ["6. Sandhya Bhog (05.00 - 06.30 PM)"],
    },
    "chandrasakhi-padavali": {
        "titleEng": "Chandrasakhi Padavali",
        "tradition": "Sanatan Epic & Bhakti Tradition",
        "recommended": ["Sur Sagar", "Meera Padavali"],
        "ragas": ["Raga Sarang", "Raga Dhanashri"],
        "ashtayama": ["3. Gwal (08.30 - 10.30 AM)"],
    },
    "rasik-vani-sangrah": {
        "titleEng": "Rasik Vani Sangrah",
        "tradition": "Sanatan Epic & Bhakti Tradition",
        "recommended": ["Vyas Vani", "Hit Chaurasi"],
        "ragas": ["Raga Sarang", "Raga Gauri"],
        "ashtayama": ["4. Rajbhog (10.30 AM - 03.30 PM)"],
    },
    "rasik-charitra-katha": {
        "titleEng": "Rasik Charitra Katha",
        "tradition": "Sanatan Epic & Bhakti Tradition",
        "recommended": ["Bayalees Leela", "Braj Dham Mahatmya"],
        "ragas": ["Raga Sarang"],
        "ashtayama": ["4. Rajbhog (10.30 AM - 03.30 PM)"],
    }
}

# 1. Export Traditions
print("Generating Traditions nodes...")
for t_name, t_meta in TRADITIONS_INFO.items():
    t_file = os.path.join(DIRS["traditions"], f"{safe_filename(t_name)}.md")
    granthas_links = "\n".join([f"- [[Granthas/{safe_filename(g)}|{g}]]" for g in t_meta["key_granthas"]])
    saints_links = "\n".join([f"- [[Saints/{safe_filename(s)}|{s}]]" for s in t_meta["key_saints"]])
    
    content = f"""---
title: "{t_name} • {t_meta['devanagari']}"
devanagari: "{t_meta['devanagari']}"
type: tradition
category: sampradaya
founder: "[[Saints/{safe_filename(t_meta['founder'])}|{t_meta['founder']}]]"
tags:
  - vrindopnisad/tradition
  - sampradaya
  - {safe_filename(t_name).lower()}
---

# 🏛️ {t_meta['devanagari']} ({t_name})

> [!NOTE] परम्परा परिचय व दार्शनिक सार
> **प्रवर्तक / आचार्य**: [[Saints/{safe_filename(t_meta['founder'])}|{t_meta['founder']}]]  
> **दार्शनिक आधार**: {t_meta['philosophy']}  
> **उपासना स्वरूप**: श्री युगल विलास, नित्य निकुंज रस व अनन्य शरणागति।

---

## 📖 सम्प्रदाय का पावन सार (Essence)
{t_meta['essence']}

---

## 📜 सम्प्रदाय के प्रमुख पावन ग्रन्थ (Canonical Scriptures)
{granthas_links}

---

## 🪷 प्रमुख आचार्य एवं रसिक संत मण्डल (Rasik Saints)
{saints_links}

---

## 🔗 सम्बन्धित दार्शनिक सोपान व अनुशंसाएँ (Recommendations)
- [[Topics/Nitya Nikunj Vihar|नित्य निकुंज विहार दर्शन]]
- [[_Master Sacred Knowledge Nexus|वृन्दोपनिषद् मास्टर डेटा नेक्सस]]
"""
    with open(t_file, "w", encoding="utf-8") as fp:
        fp.write(content)

# 2. Export Saints
print("Generating 131 Saints nodes...")
for s in saints_list:
    name_eng = s.get("nameEng", s["name"])
    devanagari = s["name"]
    tradition_eng = resolve_tradition(s.get("tradition"))
    biography = s.get("biography", "").strip()
    slug = s.get("slug", safe_filename(name_eng).lower())
    
    # Check authored granthas
    authored = []
    for g in granthas_list:
        if s["name"] in g.get("author", "") or devanagari in g.get("author", ""):
            cfg = GRANTHA_CONFIG.get(g["id"], {})
            t_eng = cfg.get("titleEng", g["name"])
            authored.append(t_eng)
    
    # Rasik Trinath (Contemporaries) detection
    contemporaries = []
    if "हरिवंश" in devanagari:
        contemporaries = ["Swami Haridas", "Hariram Vyas"]
    elif "हरिदास" in devanagari:
        contemporaries = ["Hit Harivansh Mahaprabhu", "Hariram Vyas", "Vitthal Vipul Dev"]
    elif "व्यास" in devanagari:
        contemporaries = ["Hit Harivansh Mahaprabhu", "Swami Haridas"]
    elif "सूरदास" in devanagari:
        contemporaries = ["Paramanand Das", "Kumbhandas", "Chaturbhujdas"]
    elif "मीरा" in devanagari:
        contemporaries = ["Surdas", "Raskhan", "Roop Goswami"]
    
    authored_md = "\n".join([f"- [[Granthas/{safe_filename(a)}|{a}]]" for a in authored]) if authored else "- विविध रसिक पद व स्फुट वाणी"
    contemp_md = "\n".join([f"- [[Saints/{safe_filename(c)}|{c}]]" for c in contemporaries]) if contemporaries else "- श्री धाम वृन्दावन के समकालीन रसिक संत मण्डल"
    
    s_file = os.path.join(DIRS["saints"], f"{safe_filename(name_eng)}.md")
    content = f"""---
title: "{devanagari} ({name_eng})"
nameDevanagari: "{devanagari}"
nameEnglish: "{name_eng}"
slug: "{slug}"
type: saint
tradition: "[[Traditions/{safe_filename(tradition_eng)}|{tradition_eng}]]"
articlesCount: {s.get('articleCount', 1)}
tags:
  - vrindopnisad/saint
  - rasik-sant
  - {safe_filename(tradition_eng).lower()}
---

# 🪷 {devanagari} ({name_eng})

> [!NOTE] पावन संत परिचय
> **परम्परा / सम्प्रदाय**: [[Traditions/{safe_filename(tradition_eng)}|{tradition_eng}]]  
> **उपासना स्वरूप**: श्री वृन्दावन धाम नित्य निकुंज रस व अनन्य युगल उपासना।

---

## 📜 पावन जीवन चरित्र व महात्म्य
{biography if biography else f"{devanagari} श्री धाम वृन्दावन की पावन रसिक परम्परा के मूर्धन्य संत हैं, जिनकी वाणी नित्य स्वाध्याय व ध्यान साधना का पावन आधार है।"}

---

## 📚 रचित ग्रन्थ एवं वाणी संग्रह (Authored Scriptures)
{authored_md}

---

## 🤝 समकालीन रसिक संत मण्डल (Contemporaries & Trinity)
{contemp_md}

---

## 🎯 अनुशंसित साधना सोपान (Recommended Next Exploration)
- **परम्परा अध्ययन**: [[Traditions/{safe_filename(tradition_eng)}|{tradition_eng}]]
- **मास्टर नेक्सस**: [[_Master Sacred Knowledge Nexus|वृन्दोपनिषद् मास्टर डेटा नेक्सस]]
"""
    with open(s_file, "w", encoding="utf-8") as fp:
        fp.write(content)

# 3. Export Granthas
print("Generating 29 Granthas nodes...")
for g in granthas_list:
    gid = g["id"]
    cfg = GRANTHA_CONFIG.get(gid, {})
    title_eng = cfg.get("titleEng", safe_filename(g["name"]))
    devanagari = g["name"]
    author_raw = g.get("author", "रसिक संत")
    
    # Find matching author node
    matched_author = None
    for s in saints_list:
        if s["name"] in author_raw or author_raw in s["name"]:
            matched_author = s.get("nameEng", s["name"])
            break
    author_link = f"[[Saints/{safe_filename(matched_author)}|{author_raw}]]" if matched_author else author_raw
    
    tradition_eng = cfg.get("tradition", resolve_tradition(author_raw))
    recommended = cfg.get("recommended", ["Hit Chaurasi", "Kelimal", "Vyas Vani"])
    ragas = cfg.get("ragas", ["Raga Vibhas", "Raga Sarang", "Raga Kalyan"])
    ashtayama = cfg.get("ashtayama", ["1. Mangala (03.30 - 06.00 AM)", "8. Shayana & Nitya Ras (08.30 PM - 03.30 AM)"])
    
    rec_md = "\n".join([f"- [[Granthas/{safe_filename(r)}|{r}]]" for r in recommended])
    ragas_md = "\n".join([f"- [[Ragas/{safe_filename(r)}|{r}]]" for r in ragas])
    ashtayama_md = "\n".join([f"- [[Ashtayama/{safe_filename(a)}|{a}]]" for a in ashtayama])
    
    # Chapter summary from hierarchy
    h_info = hierarchy_data.get("granthas", {}).get(gid, {})
    chapters = h_info.get("chapters", [])
    ch_md = "\n".join([f"- **{ch['name']}** ({ch['verseCount']} पद)" for ch in chapters[:10]]) if chapters else "- संपूर्ण संग्रह"
    if len(chapters) > 10:
        ch_md += f"\n- *...तथा {len(chapters) - 10} अन्य अध्याय/लीलाएं*"
        
    g_file = os.path.join(DIRS["granthas"], f"{safe_filename(title_eng)}.md")
    content = f"""---
title: "{devanagari} ({title_eng})"
nameDevanagari: "{devanagari}"
nameEnglish: "{title_eng}"
id: "{gid}"
author: "{author_link}"
tradition: "[[Traditions/{safe_filename(tradition_eng)}|{tradition_eng}]]"
category: "{g.get('category', 'Rasik Vani')}"
verseCount: {g.get('count', h_info.get('verseCount', 0))}
chaptersCount: {len(chapters)}
tags:
  - vrindopnisad/grantha
  - scripture
  - {safe_filename(title_eng).lower()}
---

# 📖 {devanagari} ({title_eng})

> [!NOTE] ग्रन्थ परिचय व सांख्यिकी
> **रचयिता**: {author_link}  
> **परम्परा**: [[Traditions/{safe_filename(tradition_eng)}|{tradition_eng}]]  
> **श्रेणी**: {g.get('category', 'Rasik Vani')}  
> **कुल पद / श्लोक**: {g.get('count', h_info.get('verseCount', 0))}  
> **अध्याय / लीलाएँ**: {len(chapters)}

---

## 🪷 ग्रन्थ का पावन सार (Essence & Significance)
{g.get('description', '')}

---

## 📑 प्रमुख अध्याय एवं लीला विभाजन (Chapters & Leelas)
{ch_md}

---

## 🎶 प्रमुख राग (Primary Musical Ragas)
{ragas_md}

---

## ⏰ सम्बद्ध अष्टयाम सेवा काल (Associated Ashtayama Prahar)
{ashtayama_md}

---

## 🧭 सह-सम्बन्धित ग्रन्थ अनुशंसाएँ (Correlated Recommendations)
> [!TIP] यदि आप इस ग्रन्थ का अनुशीलन कर रहे हैं, तो इन ग्रन्थों का पाठ भी करें:
{rec_md}

---

## 🔗 सम्बन्धित कड़ियाँ
- **मास्टर नेक्सस**: [[_Master Sacred Knowledge Nexus|वृन्दोपनिषद् मास्टर डेटा नेक्सस]]
"""
    with open(g_file, "w", encoding="utf-8") as fp:
        fp.write(content)

# 4. Export Ragas
print("Generating Ragas nodes...")
RAGAS_METADATA = {
    "Raga Vibhas": {"dev": "राग विभास", "prahar": "1. Mangala (03.30 - 06.00 AM)", "bhava": "प्रभात जागरण, शांत एवं माधुर्य भाव", "granthas": ["Hit Chaurasi", "Kelimal"]},
    "Raga Bilawal": {"dev": "राग बिलावल", "prahar": "2. Shringar (06.00 - 08.30 AM)", "bhava": "प्रातः शृंगार, हर्ष एवं युगल छवि दर्शन", "granthas": ["Hit Chaurasi", "Sur Sagar", "Paramanand Sagar"]},
    "Raga Sarang": {"dev": "राग सारंग", "prahar": "4. Rajbhog (10.30 AM - 03.30 PM)", "bhava": "मध्याह्न विलास, ग्रीष्म शीतलता व राजभोग", "granthas": ["Hit Chaurasi", "Kelimal", "Vyas Vani", "Sur Sagar"]},
    "Raga Kalyan": {"dev": "राग कल्याण", "prahar": "6. Sandhya Bhog (05.00 - 06.30 PM)", "bhava": "गोधूलि वेला, सायंकालीन मंगलाचरण व भोग", "granthas": ["Hit Chaurasi", "Ramcharitmanas", "Braj Bhajan"]},
    "Raga Malhar": {"dev": "राग मल्हार", "prahar": "वर्षा ऋतु / सार्वकालिक", "bhava": "मेघ घटा, हिंडोला झूलन व निकुंज वर्षा विलास", "granthas": ["Hit Chaurasi", "Kelimal", "Raskhan Padavali"]},
    "Raga Kafi": {"dev": "राग काफी", "prahar": "होरी उत्सव / सार्वकालिक", "bhava": "होली, वसंत रंग, आनंद उल्लास व चंचलता", "granthas": ["Braj Rasiya", "Braj Bhajan", "Meera Padavali"]},
    "Raga Bhairav": {"dev": "राग भैरव", "prahar": "1. Mangala (03.30 - 06.00 AM)", "bhava": "ब्राह्म मुहूर्त, गंभीरता, ध्यान व मंगलाचरण", "granthas": ["Valmiki Ramayana", "Stotras", "Durga Saptashati"]},
    "Raga Dhanashri": {"dev": "राग धनाश्री", "prahar": "3. Gwal (08.30 - 10.30 AM)", "bhava": "मनोहर प्रीति, सख्य भाव व वंशी नाद", "granthas": ["Hit Chaurasi", "Sur Sagar", "Vyas Vani"]},
    "Raga Gauri": {"dev": "राग गौरी", "prahar": "5. Utthapan (03.30 - 05.00 PM)", "bhava": "अपराह्न जागरण, भक्ति निष्ठा व शरणागति", "granthas": ["Hit Chaurasi", "Ramcharitmanas", "Vyas Vani"]},
    "Raga Kanhara": {"dev": "राग कान्हरौ", "prahar": "8. Shayana & Nitya Ras (08.30 PM - 03.30 AM)", "bhava": "निशा विलास, रास क्रीड़ा व गहन निकुंज माधुर्य", "granthas": ["Hit Chaurasi", "Kelimal", "Biharin Dev Vani", "Lalit Kishori Vani"]},
    "Raga Kedar": {"dev": "राग केदारौ", "prahar": "7. Sandhya Aarti (06.30 - 08.30 PM)", "bhava": "दीप आरती, शांत भक्ति एवं समर्पण", "granthas": ["Hit Chaurasi", "Kelimal"]},
    "Raga Basant": {"dev": "राग बसंत", "prahar": "वसंत ऋतु / सार्वकालिक", "bhava": "ऋतुराज वसंत, नवल युगल क्रीड़ा व फाग विलास", "granthas": ["Hit Chaurasi", "Braj Rasiya"]},
    "Raga Asavari": {"dev": "राग आसावरी", "prahar": "3. Gwal (08.30 - 10.30 AM)", "bhava": "गौचारण, विरह व व्याकुलता मिश्रित माधुर्य", "granthas": ["Sur Sagar", "Meera Padavali"]},
    "Raga Bihag": {"dev": "राग विहाग", "prahar": "8. Shayana & Nitya Ras (08.30 PM - 03.30 AM)", "bhava": "शयन सुख, सुखद विश्राम व अलौकिक विलास", "granthas": ["Hit Chaurasi", "Kelimal"]},
    "Raga Sorath": {"dev": "राग सोरठ", "prahar": "रात्रि द्वितीय प्रहर", "bhava": "अनन्य प्रीति, अनुराग व मधुर मिलन", "granthas": ["Meera Padavali", "Sur Sagar"]}
}

for r_name, r_meta in RAGAS_METADATA.items():
    r_file = os.path.join(DIRS["ragas"], f"{safe_filename(r_name)}.md")
    gr_links = "\n".join([f"- [[Granthas/{safe_filename(g)}|{g}]]" for g in r_meta["granthas"]])
    content = f"""---
title: "{r_meta['dev']} ({r_name})"
devanagari: "{r_meta['dev']}"
english: "{r_name}"
prahar: "[[Ashtayama/{safe_filename(r_meta['prahar'])}|{r_meta['prahar']}]]"
bhava: "{r_meta['bhava']}"
type: raga
tags:
  - vrindopnisad/raga
  - sacred-music
---

# 🎵 {r_meta['dev']} ({r_name})

> [!NOTE] शास्त्रीय व रसिक परिचय
> **गायन काल / प्रहर**: [[Ashtayama/{safe_filename(r_meta['prahar'])}|{r_meta['prahar']}]]  
> **भाव / रस**: {r_meta['bhava']}

---

## 📜 राग का पावन स्वरूप
{r_meta['dev']} श्री धाम वृन्दावन की हवेली संगीत एवं ध्रुपद परम्परा का प्रमुख राग है, जिसमें रसिक संतों ने निकुंज लीला के पदों का गान किया है।

---

## 📚 इस राग में निबद्ध प्रमुख ग्रन्थ (Granthas in this Raga)
{gr_links}

---

## 🔗 सम्बन्धित कड़ियाँ
- **सम्बद्ध अष्टयाम**: [[Ashtayama/{safe_filename(r_meta['prahar'])}|{r_meta['prahar']}]]
- **मास्टर नेक्सस**: [[_Master Sacred Knowledge Nexus|वृन्दोपनिषद् मास्टर डेटा नेक्सस]]
"""
    with open(r_file, "w", encoding="utf-8") as fp:
        fp.write(content)

# 5. Export Ashtayama Periods
print("Generating Ashtayama nodes...")
ASHTAYAMA_META = {
    "1. Mangala (03.30 - 06.00 AM)": {
        "dev": "मंगला दर्शन एवं जागरण लीला",
        "time": "03:30 - 06:00 AM",
        "ragas": ["Raga Vibhas", "Raga Bhairav"],
        "bhava": "प्रभात जागरण (मंगला), सुरभि दोहन एवं युगल सरकार की मंगला आरती",
        "granthas": ["Hit Chaurasi", "Kelimal", "Vyas Vani"]
    },
    "2. Shringar (06.00 - 08.30 AM)": {
        "dev": "शृंगार दर्शन लीला",
        "time": "06:00 - 08:30 AM",
        "ragas": ["Raga Bilawal", "Raga Vibhas"],
        "bhava": "सखी शृंगार, दिव्य आभूषण परिधान व नित्य निकुंज रूप दर्शन",
        "granthas": ["Hit Chaurasi", "Kelimal", "Sur Sagar", "Paramanand Sagar"]
    },
    "3. Gwal (08.30 - 10.30 AM)": {
        "dev": "ग्वाल दर्शन एवं गौचारण लीला",
        "time": "08:30 - 10:30 AM",
        "ragas": ["Raga Asavari", "Raga Dhanashri"],
        "bhava": "सखा संग गौचारण, वन विहार, वंशी वट क्रीड़ा व कलेऊ भोग",
        "granthas": ["Sur Sagar", "Raskhan Padavali", "Chandrasakhi Padavali"]
    },
    "4. Rajbhog (10.30 AM - 03.30 PM)": {
        "dev": "राजभोग दर्शन एवं मध्याह्न विलास",
        "time": "10:30 AM - 03:30 PM",
        "ragas": ["Raga Sarang", "Raga Multani"],
        "bhava": "दिव्य छप्पन भोग, राजभोग आरती, मध्याह्न शीतलता व सुख शयन",
        "granthas": ["Hit Chaurasi", "Vyas Vani", "Ramcharitmanas", "Braj Binod"]
    },
    "5. Utthapan (03.30 - 05.00 PM)": {
        "dev": "उत्थापन दर्शन लीला",
        "time": "03:30 - 05:00 PM",
        "ragas": ["Raga Gauri"],
        "bhava": "अपराह्न जागरण, सखियों संग वन विहार व वंशी नाद",
        "granthas": ["Hit Chaurasi", "Kelimal", "Vyas Vani"]
    },
    "6. Sandhya Bhog (05.00 - 06.30 PM)": {
        "dev": "संध्या भोग एवं गोधूलि वेला",
        "time": "05:00 - 06:30 PM",
        "ragas": ["Raga Kalyan", "Raga Kafi"],
        "bhava": "गोधूलि बेला, सुरभियों की घर वापसी, संध्या भोग व मिलन",
        "granthas": ["Sur Sagar", "Meera Padavali", "Braj Rasiya"]
    },
    "7. Sandhya Aarti (06.30 - 08.30 PM)": {
        "dev": "संध्या आरती एवं ब्यारू भोग",
        "time": "06:30 - 08:30 PM",
        "ragas": ["Raga Kedar", "Raga Kalyan"],
        "bhava": "दीप दान, संध्या महा आरती, ब्यारू भोग व मधुर विश्राम",
        "granthas": ["Valmiki Ramayana", "Ramcharitmanas", "Stotras", "Meera Padavali"]
    },
    "8. Shayana & Nitya Ras (08.30 PM - 03.30 AM)": {
        "dev": "शयन दर्शन एवं नित्य रास विलास",
        "time": "08:30 PM - 03:30 AM",
        "ragas": ["Raga Kanhara", "Raga Bihag"],
        "bhava": "नित्य निकुंज विहार, महारास, शयन सेवा व अलौकिक युगल रस",
        "granthas": ["Hit Chaurasi", "Kelimal", "Biharin Dev Vani", "Lalit Kishori Vani", "Bayalees Leela"]
    }
}

for a_name, a_meta in ASHTAYAMA_META.items():
    a_file = os.path.join(DIRS["ashtayama"], f"{safe_filename(a_name)}.md")
    r_links = "\n".join([f"- [[Ragas/{safe_filename(r)}|{r}]]" for r in a_meta["ragas"]])
    g_links = "\n".join([f"- [[Granthas/{safe_filename(g)}|{g}]]" for g in a_meta["granthas"]])
    content = f"""---
title: "{a_meta['dev']} ({a_name})"
devanagari: "{a_meta['dev']}"
timeRange: "{a_meta['time']}"
bhava: "{a_meta['bhava']}"
type: ashtayama
tags:
  - vrindopnisad/ashtayama
  - seva-cycle
---

# 🕰️ {a_meta['dev']}

> [!NOTE] अष्टयाम सेवा काल
> **समय (Time Range)**: {a_meta['time']}  
> **लीला भाव**: {a_meta['bhava']}

---

## 🎶 इस काल के सम्बद्ध राग (Associated Ragas)
{r_links}

---

## 📖 इस काल के अनुशंसित ग्रन्थ (Recommended Scriptures)
{g_links}

---

## 🔗 सम्बन्धित कड़ियाँ
- [[Topics/Nitya Nikunj Vihar|नित्य निकुंज विहार दर्शन]]
- [[_Master Sacred Knowledge Nexus|वृन्दोपनिषद् मास्टर डेटा नेक्सस]]
"""
    with open(a_file, "w", encoding="utf-8") as fp:
        fp.write(content)

# 6. Export Topics
print("Generating Topics nodes...")
TOPICS_DATA = {
    "Nitya Nikunj Vihar": {
        "dev": "नित्य निकुंज विहार",
        "essence": "श्री वृन्दावन धाम की सर्वोच्च अंतरंग उपासना, जहाँ श्री प्रिया-प्रियतम बिना किसी वियोग के अखंड नित्य विलास में लीन रहते हैं। यहाँ प्रेम ही साधन और प्रेम ही साध्य है।",
        "traditions": ["Shri Radhavallabh Sampradaya", "Shri Haridasi (Sakhi) Sampradaya"],
        "granthas": ["Hit Chaurasi", "Kelimal", "Bayalees Leela"]
    },
    "Braj 84 Kos Parikrama": {
        "dev": "ब्रज चौरासी कोस परिक्रमा",
        "essence": "श्री धाम वृन्दावन, मथुरा, गोवर्धन, बरसाना, नन्दगांव सहित ब्रज के समस्त द्वादश वनों व उपवनों की पावन परिक्रमा जो समस्त पापों का शमन कर भगवत्-प्रेम प्रदान करती है।",
        "traditions": ["Sanatan Epic & Bhakti Tradition", "Shri Pushtimarg (Vallabh Sampradaya)"],
        "granthas": ["Braj Dham Mahatmya", "Rasik Charitra Katha"]
    },
    "Shri Yamuna Maharani": {
        "dev": "श्री यमुना महारानी जी",
        "essence": "श्री कालिन्दी जी पुष्टि व रस की अधिष्ठात्री देवी हैं, जिनकी कृपा से ही वृन्दावन रस में प्रवेश का अधिकार प्राप्त होता है।",
        "traditions": ["Shri Pushtimarg (Vallabh Sampradaya)", "Shri Radhavallabh Sampradaya"],
        "granthas": ["Hit Chaurasi", "Sur Sagar", "Stotras"]
    },
    "Ashtachhap Kavi Mandal": {
        "dev": "अष्टछाप कवि मण्डल",
        "essence": "महाप्रभु श्री वल्लभाचार्य एवं श्री विट्ठलनाथ जी द्वारा प्रतिष्ठित आठ प्रमुख सखा कवि (सूरदास, कुम्भनदास, परमानन्ददास, कृष्णदास, छीतस्वामी, गोविन्दस्वामी, चतुर्भुजदास, नन्ददास)।",
        "traditions": ["Shri Pushtimarg (Vallabh Sampradaya)"],
        "granthas": ["Sur Sagar", "Paramanand Sagar"]
    }
}

for t_name, t_meta in TOPICS_DATA.items():
    t_file = os.path.join(DIRS["topics"], f"{safe_filename(t_name)}.md")
    tr_links = "\n".join([f"- [[Traditions/{safe_filename(t)}|{t}]]" for t in t_meta["traditions"]])
    gr_links = "\n".join([f"- [[Granthas/{safe_filename(g)}|{g}]]" for g in t_meta["granthas"]])
    content = f"""---
title: "{t_meta['dev']} ({t_name})"
devanagari: "{t_meta['dev']}"
type: topic
tags:
  - vrindopnisad/topic
---

# 🌸 {t_meta['dev']} ({t_name})

> [!NOTE] विषय मर्म
> {t_meta['essence']}

---

## 🏛️ सम्बद्ध सम्प्रदाय (Associated Traditions)
{tr_links}

---

## 📖 सम्बद्ध ग्रन्थ (Associated Scriptures)
{gr_links}

---

## 🔗 सम्बन्धित कड़ियाँ
- [[_Master Sacred Knowledge Nexus|वृन्दोपनिषद् मास्टर डेटा नेक्सस]]
"""
    with open(t_file, "w", encoding="utf-8") as fp:
        fp.write(content)

# 7. Export Padas (All 84 Hit Chaurasi Padas + Celebrated Padas)
print("Generating Padas nodes (84 Hit Chaurasi + Celebrated)...")
for p in hit_chaurasi_pads:
    if p.get("chapterId") != "hit-chaurasi":
        continue
    num = p.get("verseNumber", 1)
    title_dev = p.get("titleDevanagari", f"पद {num}")
    rag = p.get("rag", "विभास")
    rag_eng = f"Raga {rag}" if not rag.startswith("राग") else f"Raga {rag[3:].strip()}"
    # Standardize Raga link
    if "विभास" in rag: rag_link = "Raga Vibhas"
    elif "बिलावल" in rag or "विलावल" in rag: rag_link = "Raga Bilawal"
    elif "सारंग" in rag: rag_link = "Raga Sarang"
    elif "कल्याण" in rag: rag_link = "Raga Kalyan"
    elif "मल्हार" in rag or "मलार" in rag: rag_link = "Raga Malhar"
    elif "कान्हर" in rag: rag_link = "Raga Kanhara"
    elif "धनाश्री" in rag: rag_link = "Raga Dhanashri"
    elif "गौरी" in rag: rag_link = "Raga Gauri"
    elif "बसंत" in rag: rag_link = "Raga Basant"
    elif "केदार" in rag: rag_link = "Raga Kedar"
    else: rag_link = "Raga Vibhas"
    
    # Text stanzas
    stanzas_text = []
    for v in p.get("verses", []):
        s_num = v.get("stanzaNumber", 1)
        lines = "\n".join(v.get("linesDevanagari", []))
        stanzas_text.append(f"### चरण {s_num}\n```text\n{lines}\n```")
    stanzas_md = "\n\n".join(stanzas_text)
    
    # Sequential link
    next_num = num + 1 if num < 84 else 1
    prev_num = num - 1 if num > 1 else 84
    next_link = f"[[Padas/Hit Chaurasi - Pad {next_num:02d}|अगला: पद {next_num}]]"
    prev_link = f"[[Padas/Hit Chaurasi - Pad {prev_num:02d}|पिछला: पद {prev_num}]]"
    
    p_file = os.path.join(DIRS["padas"], f"Hit Chaurasi - Pad {num:02d}.md")
    content = f"""---
title: "हित चौरासी पद {num} • {title_dev[:40]}"
verseNumber: {num}
grantha: "[[Granthas/Hit Chaurasi|Hit Chaurasi]]"
author: "[[Saints/Hit Harivansh Mahaprabhu|Hit Harivansh Mahaprabhu]]"
tradition: "[[Traditions/Shri Radhavallabh Sampradaya|Shri Radhavallabh Sampradaya]]"
raga: "[[Ragas/{safe_filename(rag_link)}|{rag}]]"
type: pada
tags:
  - vrindopnisad/pada
  - hit-chaurasi
---

# 🪷 श्री हित चौरासी — पद {num}

> [!NOTE] पावन पद सन्दर्भ
> **ग्रन्थ**: [[Granthas/Hit Chaurasi|श्री हित चौरासी]]  
> **रचयिता**: [[Saints/Hit Harivansh Mahaprabhu|श्री हित हरिवंश महाप्रभु]]  
> **राग**: [[Ragas/{safe_filename(rag_link)}|{rag}]]  
> **सम्प्रदाय**: [[Traditions/Shri Radhavallabh Sampradaya|श्री राधावल्लभ सम्प्रदाय]]

---

## 📜 मूल पावन पद (Devanagari Verses)

{stanzas_md}

---

## 🧭 स्वाध्याय प्रवाह व पद शृंखला (Sadhana Stream)
- ⬅️ {prev_link}
- ➡️ {next_link}
- 📖 सम्पूर्ण ग्रन्थ: [[Granthas/Hit Chaurasi|श्री हित चौरासी (84 पद)]]
- 🏛️ मास्टर नेक्सस: [[_Master Sacred Knowledge Nexus|वृन्दोपनिषद् मास्टर डेटा नेक्सस]]
"""
    with open(p_file, "w", encoding="utf-8") as fp:
        fp.write(content)

# 8. Export Celebrated Core Padas from Other Granthas
CELEBRATED_PADAS = [
    {
        "file": "Kelimal - Pad 01.md",
        "title": "केलिमाल पद 1 • ज्यौंही-ज्यौंही तुम राखत हौ",
        "num": 1,
        "grantha": "Kelimal",
        "author": "Swami Haridas",
        "raga": "Raga Vibhas",
        "tradition": "Shri Haridasi (Sakhi) Sampradaya",
        "text": "ज्यौंही-ज्यौंही तुम राखत हौ त्यौंही-त्यौंही रहियतु है बलिहारी।\nऔर कोऊ कछु कहत न काहू के कहै न कछु बहियतु है बलिहारी॥\nतुम हौ ठाकुर हम हैं चेरी करहु सोई जो भावै।\nश्रीहरिदास के स्वामी स्यामा-कुंजबिहारी मोकौं तुव चरन सुहावै॥"
    },
    {
        "file": "Vyas Vani - Pad 01.md",
        "title": "व्यास वाणी पद 1 • व्यासहि अब जिनि जानियौ",
        "num": 1,
        "grantha": "Vyas Vani",
        "author": "Hariram Vyas",
        "raga": "Raga Sarang",
        "tradition": "Sanatan Epic & Bhakti Tradition",
        "text": "व्यासहि अब जिनि जानियौ कोऊ काहू के आधीन।\nराधावल्लभ लाल की कृपा भई अति दीन॥\nजाति पांति कुल कर्म सब दियो विसारि बहाय।\nव्यास एक हरिदास हित गावत नित्य सहाय॥"
    },
    {
        "file": "Sur Sagar - Pad 01.md",
        "title": "सूरसागर पद 1 • प्रभु मेरे अवगुण चित ना धरो",
        "num": 1,
        "grantha": "Sur Sagar",
        "author": "Surdas",
        "raga": "Raga Bilawal",
        "tradition": "Shri Pushtimarg (Vallabh Sampradaya)",
        "text": "प्रभु मेरे अवगुण चित ना धरो।\nसमदरसी है नाम तिहारो, चाहो तो पार करो॥\nएक लोहा पूजा में राखत, एक घर बधिक परो।\nपारस गुण अवगुण नहीं चितवत, कंचन करत खरो॥\nसूरदास की विनती यह है, अब मोहि पार करो॥"
    },
    {
        "file": "Raskhan - Pad 01.md",
        "title": "रसखान पद 1 • मानुष हों तो वही रसखानि",
        "num": 1,
        "grantha": "Raskhan Padavali",
        "author": "Raskhan",
        "raga": "Raga Kalyan",
        "tradition": "Sanatan Epic & Bhakti Tradition",
        "text": "मानुष हों तो वही रसखानि बसौं ब्रज गोकुल गाँव के ग्वारन।\nजो पसु हों तो कहा बस मेरो चरौं नित नंद की धेनु मंझारन॥\nपाहन हों तो वही गिरि को जो धर्यो कर छत्र पुरंदर धारन।\nजो खग हों तो बसेरो करौं मिलि कालिंदी कूल कदंब की डारन॥"
    },
    {
        "file": "Meera - Pad 01.md",
        "title": "मीराबाई पद 1 • पायो जी मैंने राम रतन धन पायो",
        "num": 1,
        "grantha": "Meera Padavali",
        "author": "Meera Bai",
        "raga": "Raga Kalyan",
        "tradition": "Sanatan Epic & Bhakti Tradition",
        "text": "पायो जी मैंने राम रतन धन पायो।\nवस्तु अमोलक दी मेरे सतगुरू, किरपा कर अपनायो॥\nजनम जनम की पूंजी पाई, जग में सभी खोवायो।\nखरचै नहिं कोई चोर न लेवै, दिन दिन बढ़त सवायो॥\nसत की नाव खेवटिया सतगुरू, भवसागर तर आयो।\nमीरा के प्रभु गिरिधर नागर, हरष हरष जस गायो॥"
    },
    {
        "file": "Radha Kripa Kataksha Stotram.md",
        "title": "श्री राधा कृपा कटाक्ष स्तोत्रम्",
        "num": 1,
        "grantha": "Stotras",
        "author": "Sanatan Epic & Bhakti Tradition",
        "raga": "Raga Bhairav",
        "tradition": "Sanatan Epic & Bhakti Tradition",
        "text": "मुनीन्द्रवृन्दवन्दिते त्रिलोकशोकहारिणी,\nप्रसन्नवक्त्रपङ्कजे निकुञ्जभूविलासिनी।\nव्रजेन्द्रभानुशालिनी व्रजेन्द्रसूनुसङ्गिनी,\nकदा करिष्यसीह मां कृपाकटाक्षभाजनम्॥"
    }
]

for cp in CELEBRATED_PADAS:
    p_file = os.path.join(DIRS["padas"], cp["file"])
    content = f"""---
title: "{cp['title']}"
grantha: "[[Granthas/{safe_filename(cp['grantha'])}|{cp['grantha']}]]"
author: "[[Saints/{safe_filename(cp['author'])}|{cp['author']}]]"
tradition: "[[Traditions/{safe_filename(cp['tradition'])}|{cp['tradition']}]]"
raga: "[[Ragas/{safe_filename(cp['raga'])}|{cp['raga']}]]"
type: pada
tags:
  - vrindopnisad/pada
  - celebrated-pada
---

# 🪷 {cp['title']}

> [!NOTE] पावन पद सन्दर्भ
> **ग्रन्थ**: [[Granthas/{safe_filename(cp['grantha'])}|{cp['grantha']}]]  
> **रचयिता**: [[Saints/{safe_filename(cp['author'])}|{cp['author']}]]  
> **राग**: [[Ragas/{safe_filename(cp['raga'])}|{cp['raga']}]]  
> **सम्प्रदाय**: [[Traditions/{safe_filename(cp['tradition'])}|{cp['tradition']}]]

---

## 📜 मूल पावन पाठ (Sacred Verses)
```text
{cp['text']}
```

---

## 🧭 सह-सम्बन्धित अनुशंसाएँ (Correlated Recommendations)
- 📖 सम्पूर्ण ग्रन्थ: [[Granthas/{safe_filename(cp['grantha'])}|{cp['grantha']}]]
- 🪷 रचयिता संत: [[Saints/{safe_filename(cp['author'])}|{cp['author']}]]
- 🏛️ मास्टर नेक्सस: [[_Master Sacred Knowledge Nexus|वृन्दोपनिषद् मास्टर डेटा नेक्सस]]
"""
    with open(p_file, "w", encoding="utf-8") as fp:
        fp.write(content)

# 9. Export Master Sacred Knowledge Nexus
print("Generating Master Sacred Knowledge Nexus node...")
nexus_file = os.path.join(PROJECT_GRAPH_DIR, "_Master Sacred Knowledge Nexus.md")
content = """---
title: "वृन्दोपनिषद् 2.0 • मास्टर डेटा नेक्सस एवं अनुशंसा नेटवर्क (Master Sacred Knowledge Nexus)"
type: nexus
project: vrindopnisad
tags:
  - vrindopnisad/nexus
  - recommendation-graph
  - knowledge-network
---

# 🌌 वृन्दोपनिषद् 2.0 • मास्टर डेटा नेक्सस एवं अनुशंसा नेटवर्क

> [!IMPORTANT] ऑब्सीडियन नॉलेज ग्राफ एवं सह-सम्बन्ध नेटवर्क
> यह फ़ाइल **वृन्दोपनिषद् 2.0** के समस्त 29 पावन महाग्रन्थों, 131 रसिक संतों, 6 मुख्य परम्पराओं, शास्त्रीय रागों, दैनिक अष्टयाम सेवा कालों एवं पावन पदों का **केन्द्रीय नोड (Central Nexus Hub)** है।  
> **ऑब्सीडियन ग्राफ व्यू (Graph View)** खोलने पर आपको इन सभी नोड्स के बीच सघन सम्बन्ध, प्रवाह एवं अनुशंसा तारतम्य स्पष्ट दिखाई देगा।

---

## 🏛️ 1. षड्-सम्प्रदाय एवं परम्परा नोड्स (6 Core Traditions)
सम्प्रदाय किसी भी रसिक वाणी व ग्रन्थ की दार्शनिक आधारशिला हैं:
- [[Traditions/Shri Radhavallabh Sampradaya|श्री राधावल्लभ सम्प्रदाय]] (हित रस, नित्य निकुंज विहार)
- [[Traditions/Shri Haridasi (Sakhi) Sampradaya|श्री हरिदासी (सखी) सम्प्रदाय]] (नित्य केलि, संगीत साधना)
- [[Traditions/Shri Gaudiya Vaishnava Sampradaya|श्री गौड़ीय वैष्णव सम्प्रदाय]] (मधुर रस, षड्गोस्वामी परम्परा)
- [[Traditions/Shri Pushtimarg (Vallabh Sampradaya)|श्री पुष्टिमार्ग (वल्लभ सम्प्रदाय)]] (अनुग्रह पुष्टि, अष्टछाप सेवा)
- [[Traditions/Shri Nimbarka Sampradaya|श्री निम्बार्क सम्प्रदाय]] (द्वैताद्वैत, युगल उपासना)
- [[Traditions/Sanatan Epic & Bhakti Tradition|सनातन महाकाव्य एवं रसिक संत परम्परा]] (महाकाव्य, मीरा, रसखान)

---

## 📖 2. प्रमुख ग्रन्थ क्लस्टर्स (Scripture Clusters for Recommendations)

```mermaid
graph TD
    classDef radha fill:#FEF3C7,stroke:#D97706,stroke-width:2px;
    classDef sakhi fill:#DCFCE7,stroke:#16A34A,stroke-width:2px;
    classDef pushti fill:#EFF6FF,stroke:#2563EB,stroke-width:2px;
    classDef epic fill:#FCE7F3,stroke:#DB2777,stroke-width:2px;

    HC["श्री हित चौरासी"]:::radha --> KM["श्री केलिमाल"]:::sakhi
    HC --> VV["श्री व्यास वाणी"]:::epic
    HC --> BL["बयालीस लीला"]:::radha

    KM --> BD["बिहारीन देव वाणी"]:::sakhi
    KM --> LK["ललित किशोरी वाणी"]:::sakhi

    SS["सूरसागर"]:::pushti --> PS["परमानन्द सागर"]:::pushti
    SS --> RP["रसखान पदावली"]:::epic
    SS --> MP["मीरा पदावली"]:::epic

    VR["वाल्मीकि रामायण"]:::epic --> RM["रामचरितमानस"]:::epic
    SB["श्रीमद्भागवत"]:::epic --> BG["भगवद्गीता"]:::epic
```

### क. रसिक निकुंज विलास समूह (Rasik Nikunj Cluster)
- [[Granthas/Hit Chaurasi|श्री हित चौरासी]] (84 पावन पद)
- [[Granthas/Kelimal|श्री केलिमाल]] (110 पद व सिद्धांत)
- [[Granthas/Vyas Vani|श्री व्यास वाणी]] (सिद्धान्त व रसिक वाणी)
- [[Granthas/Bayalees Leela|बयालीस लीला]] (श्री ध्रुवदास जी)
- [[Granthas/Biharin Dev Vani|बिहारीन देव वाणी]]
- [[Granthas/Lalit Kishori Vani|ललित किशोरी वाणी]]

### ख. अष्टछाप एवं पुष्टि प्रेम समूह (Pushtimarg & Ashtachhap Cluster)
- [[Granthas/Sur Sagar|सूरसागर]] (सूरदास जी)
- [[Granthas/Paramanand Sagar|परमानन्द सागर]]
- [[Granthas/Braj Bhajan|ब्रज भजन]]

### ग. सनातन अमर महाकाव्य समूह (Sanatan Monumental Epics Cluster)
- [[Granthas/Valmiki Ramayana|श्रीमद् वाल्मीकि रामायण]] (408 सर्ग)
- [[Granthas/Shrimad Bhagavatam|श्रीमद्भागवत महापुराण]] (334 अध्याय)
- [[Granthas/Ramcharitmanas|श्रीरामचरितमानस]] (7 काण्ड)
- [[Granthas/Bhagavad Gita|श्रीमद्भगवद्गीता]] (18 अध्याय)
- [[Granthas/Durga Saptashati|श्री दुर्गा सप्तशती]] (14 अध्याय)

---

## 🪷 3. रसिक त्रिनाथ एवं शीर्ष संत नोड्स (Rasik Trinity & Saints)
- [[Saints/Hit Harivansh Mahaprabhu|श्री हित हरिवंश महाप्रभु]]
- [[Saints/Swami Haridas|स्वामी श्री हरिदास जी]]
- [[Saints/Hariram Vyas|श्री हरिराम व्यास जी]]
- [[Saints/Surdas|महाकवि सूरदास जी]]
- [[Saints/Meera Bai|भक्त शिरोमणि मीराबाई]]
- [[Saints/Raskhan|रसखान जी]]
- [[Saints/Goswami Tulsidas|गोस्वामी तुलसीदास जी]]
- [[Saints/Maharshi Valmiki|महर्षि वाल्मीकि]]
- [[Saints/Maharshi Ved Vyas|महर्षि वेदव्यास]]

---

## 🕰️ 4. अष्टयाम सेवा काल चक्र (8 Prahar Ashtayama Cycle)
1. [[Ashtayama/1. Mangala (03.30 - 06.00 AM)|1. मंगला जागरण (03:30 - 06:00 AM)]]
2. [[Ashtayama/2. Shringar (06.00 - 08.30 AM)|2. शृंगार दर्शन (06:00 - 08:30 AM)]]
3. [[Ashtayama/3. Gwal (08.30 - 10.30 AM)|3. ग्वाल गौचारण (08:30 - 10:30 AM)]]
4. [[Ashtayama/4. Rajbhog (10.30 AM - 03.30 PM)|4. राजभोग दर्शन (10:30 AM - 03:30 PM)]]
5. [[Ashtayama/5. Utthapan (03.30 - 05.00 PM)|5. उत्थापन वेला (03:30 - 05:00 PM)]]
6. [[Ashtayama/6. Sandhya Bhog (05.00 - 06.30 PM)|6. संध्या भोग (05:00 - 06:30 PM)]]
7. [[Ashtayama/7. Sandhya Aarti (06.30 - 08.30 PM)|7. संध्या आरती (06:30 - 08:30 PM)]]
8. [[Ashtayama/8. Shayana & Nitya Ras (08.30 PM - 03.30 AM)|8. शयन व नित्य रास (08:30 PM - 03:30 AM)]]

---

## 🎶 5. शास्त्रीय एवं हवेली राग नोड्स (Sacred Ragas)
- प्रातः काल: [[Ragas/Raga Vibhas|राग विभास]], [[Ragas/Raga Bilawal|राग बिलावल]], [[Ragas/Raga Bhairav|राग भैरव]]
- मध्याह्न काल: [[Ragas/Raga Sarang|राग सारंग]], [[Ragas/Raga Dhanashri|राग धनाश्री]]
- सायंकाल: [[Ragas/Raga Kalyan|राग कल्याण]], [[Ragas/Raga Kedar|राग केदारौ]]
- रात्रि काल: [[Ragas/Raga Kanhara|राग कान्हरौ]], [[Ragas/Raga Bihag|राग विहाग]]
- ऋतु राग: [[Ragas/Raga Malhar|राग मल्हार]], [[Ragas/Raga Basant|राग बसंत]], [[Ragas/Raga Kafi|राग काफी]]

---

## 🎯 6. अनुशंसा प्रणाली परिष्कार (Recommendation Engine Logic)
आप ऑब्सीडियन में इन लिंक्स को देखकर नए संबंध जोड़ सकते हैं:
1. **काल-आधारित अनुशंसा**: जब कोई यूज़र प्रातः 6 बजे ऐप खोले, तो [[Ashtayama/2. Shringar (06.00 - 08.30 AM)|शृंगार]] से जुड़े [[Ragas/Raga Bilawal|बिलावल]] राग के पद सामने आएं।
2. **ग्रन्थ-आधारित अनुशंसा**: [[Granthas/Hit Chaurasi|श्री हित चौरासी]] पढ़ने वाले को [[Granthas/Kelimal|केलिमाल]] और [[Granthas/Vyas Vani|व्यास वाणी]] सुझाई जाए।
3. **संत-आधारित अनुशंसा**: [[Saints/Swami Haridas|स्वामी हरिदास]] के पाठकों को उनके शिष्य [[Saints/Vitthal Vipul Dev|विट्ठल विपुल देव]] और [[Saints/Biharin Dev|बिहारीन देव]] की वाणी दिखाई जाए।
"""
with open(nexus_file, "w", encoding="utf-8") as fp:
    fp.write(content)

print(f"✓ All Obsidian Data Graph nodes generated successfully in {PROJECT_GRAPH_DIR}!")
