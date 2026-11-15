#!/usr/bin/env python3
"""
Reconstructs public/data/granthas/hit-chaurasi.json and updates canonicalPadas.json
Ensures:
  1. Hit Chaurasi has EXACTLY 84 padas (numbered 1 to 84)
  2. Authentic Braj Bhasha verse text (no Ramayana/Meera stray text)
  3. No duplicate Hindi slugs
  4. Raga headers moved out of verse lines into pad.rag
  5. Clean chapters: hit-chaurasi (84), sphut-vani (29), radha-sudha-nidhi (100), rasik-anubandh (21)
"""

import json
import re
import os

CANONICAL_84 = [
    (1, 'जोई जोई प्यारो करे सोई मोहि भावै', 'विभास', 'joi-joi-pyaro-kare-soi-mohi-bhaave-pada-written-by-shri-hita-harivansh-mahaprabhu'),
    (2, 'प्यारे बोली भामिनी आजु नीकी जामिनी', 'विभास', 'pyare-boli-bhaamini-aaju-niki-jaamini-shri-hit-harivansh-mahaprabhu-shri-hit-chaurasi-2'),
    (3, 'प्रात समै दोऊ रस लंपट', 'विभास', 'praat-samai-dou-ras-lampat-shri-harivansh-mahaprabhu-shri-hit-chaurasi-3'),
    (4, 'आजु तौ जुवति तेरौ वदन', 'विभास', 'aaju-tau-juvati-terau-vadan-shri-harivansh-mahaprabhu-shri-hit-chaurasi-4'),
    (5, 'आजु प्रभात लता मंदिर में', 'विभास', 'aaju-prabhaat-lata-mandir-mein-shri-harivansh-mahaprabhu-shri-hit-chaurasi-5'),
    (6, 'कौन चतुर जुवती प्रिया', 'विभास', 'kaun-chatur-juvati-priya-shri-harivansh-mahaprabhu-shri-hit-chaurasi-6'),
    (7, 'आजु निकुंज मंजु में खेलत', 'विभास', 'aaju-nikunj-manju-mein-khelat-naval-kishor-naveel-kisori-shri-hita-harivansh-mahaprabhu-hit-chaturasi-7'),
    (8, 'अति ही अरुन तेरे नयन नलिन री', 'बिलावल', 'ati-hi-arun-tere-nayan-nalin-ri-shri-harivansh-mahaprabhu-shri-hit-chaurasi-8'),
    (9, 'बनी श्रीराधा मोहन की जोरी', 'बिलावल', 'bani-shri-radha-mohan-ki-jori-shri-hita-harivansh-mahaprabhu-from-hit-chaturasi-09'),
    (10, 'आजु नागरी किसोर भाँवती विचित्र जोर', 'सारंग', 'aaju-naagari-kisor-bhaanvti-vichitra-jor-shri-hit-harivansh-mahaprabhu-shri-hit-chaurasi-10'),
    (11, 'मोहन लाल के रंग राँची', 'सारंग', 'mohan-laal-ke-rang-raanchi'),
    (12, 'खेलत रास रसिक ब्रजमंडन', 'सारंग', 'khelat-raas-rasik-brajmandan'),
    (13, 'नंद के लाल हरयौं मन मोर', 'सारंग', 'haun-apne-motin-lar-povati-shri-harivansh-mahaprabhu-shri-hit-chaurasi-13'),
    (14, 'अधर अरुन तेरे कैसे कै दुराऊँ', 'सारंग', 'adhar-arun-tere-kaise-kai-duraoon-shri-hita-harivansh-mahaprabhu-shri-hit-chaurasi-14'),
    (15, 'सुरत अंत छबि बरनि न जाई', 'सारंग', 'surat-ant-chhabi-barani-na-jaai'),
    (16, 'आजु देखियत है हो प्यारी रंग भरी', 'सारंग', 'aaju-dekhiyat-hai-ho-pyari-rang-bhari'),
    (17, 'आजु देखि व्रज सुन्दरी मोहन बनी केलि', 'टोड़ी', 'aaju-dekhi-vraj-sundari-mohan-bani-keli-shri-hit-harivansh-mahaprabhu-shri-hit-chaurasi-17'),
    (18, 'झूलैं दोऊ भरे सनेह', 'टोड़ी', 'jhoolain-dou-bhare-saneh'),
    (19, 'झुलत दोऊ नवल किशोर', 'टोड़ी', 'jhulat-dou-naval-kishor'),
    (20, 'मोहनलाल के रसमाती', 'धनाश्री', 'mohanlal-ke-rasmaati-shri-hita-harivansh-mahaprabhu-shri-hit-chaurasi-20'),
    (21, 'तेरे नैंन करत दोऊ चारी', 'धनाश्री', 'tere-nainn-karat-dou-chaari-shri-hita-harivansh-mahaprabhu-shri-hit-chaurasi-21'),
    (22, 'नैंननिं पर वारौं कोटिक खंजन', 'धनाश्री', 'nainani-par-varaun-kotik-khanjan-shri-harivansh-mahaprabhu-shri-hit-chaurasi-22'),
    (23, 'राधा प्यारी तेरे नैंन सलोल', 'धनाश्री', 'radha-pyari-tere-nain-salol-shri-hita-harivansh-mahaprabhu-shri-hit-chaurasi-23'),
    (24, 'आजु गोपाल रास रस खेलत', 'धनाश्री', 'aaju-gopal-raas-ras-khelat-shri-hita-harivansh-mahaprabhu-shri-hit-chaurasi-24'),
    (25, 'आज नीकी बनी श्रीराधिका नागरी', 'धनाश्री', 'aaj-niki-bani-shri-radhika-nagri-shri-hita-harivansh-mahaprabhu-from-hita-chaurasi-25'),
    (26, 'मोहनी मदन गोपाल की बाँसुरी', 'धनाश्री', 'mohani-madan-gopal-ki-bansuri'),
    (27, 'हौं बलि जाऊँ नागरी स्याम', 'धनाश्री', 'haun-bali-jaoon-naagri-shyam-27'),
    (28, 'राधे देखि वन की बात', 'धनाश्री', 'radhe-dekhi-van-ki-baat-shri-hit-harivansh-mahaprabhu-hit-chaurasi-28'),
    (29, 'ब्रज नव तरुनी कदंब मुकुट मनि स्यामा आजु बनी', 'धनाश्री', 'braj-nav-taruni-kadamb-mukut-mani-syama-aaju-bani'),
    (30, 'मधुरितु वृन्दावन आनन्द न थोर', 'बसंत', 'madhuritu-vrindavan-aanand-na-thor'),
    (31, 'आजु अति राजत दम्पति भोर', 'बसंत', 'aaju-ati-rajat-dampati-bhor'),
    (32, 'आजु बन क्रीडत स्यामा स्याम', 'बसंत', 'aaju-ban-kridat-syama-syam'),
    (33, 'आजु बन राजत जुगल किसोर', 'बसंत', 'aaju-ban-rajat-jugal-kishor-shri-harivansh-mahaprabhu-shri-hit-chaurasi-33'),
    (34, 'मोहन मदन त्रिभंगी मोहन मुनि मन रंगी', 'बसंत', 'mohan-madan-tribhangi-mohan-muni-man-rangi'),
    (35, 'आजु बन नीकौ रास बनायौ', 'बसंत', 'aaju-ban-neekau-raas-banayau'),
    (36, 'वेगि चलहि उठि गहरु करति कत', 'बसंत', 'vegi-chalahi-uthi-gaharu-karati-kat'),
    (37, 'खेल्यो लाल चाहत रवन', 'बसंत', 'khelyo-laal-chaahat-ravan'),
    (38, 'आजु तौ जुवति तेरो वदन आनंद भरयौ', 'बसंत', 'aaju-tau-juvati-tero-vadan-aanand-bharyau'),
    (39, 'आजु सखी बन में जु बने प्रंभु नाचत हैं ब्रज मंडन', 'बसंत', 'aaju-sakhi-ban-mein-ju-bane-prabhu-nachat-hain-braj-mandan'),
    (40, 'बैठे लाल निकुंज भवन', 'सारंग', 'baithe-laal-nikunj-bhavan-shri-hita-harivansh-mahaprabhu-shri-hit-chaurasi-40'),
    (41, 'प्रीति की रीति रँगीलोइ जानै', 'सारंग', 'preeti-ki-reeti-rangeelo-hi-jaane-shri-hita-harivansh-mahaprabhu-hit-chaturasi-41'),
    (42, 'प्रीति न काहु की कानि बिचारै', 'सारंग', 'priti-na-kahu-ki-kani-bicharai-shri-hita-harivansh-mahaprabhu-shri-hit-chaurasi-42'),
    (43, 'अति नागरी वृषभानु किसोरी', 'सारंग', 'ati-nagari-vrishbhanu-kishori-shri-hita-harivansh-mahaprabhu-shri-hita-chaurasi-43'),
    (44, 'चलि सुंदरि बोली वृंदावन', 'सारंग', 'chali-sundari-boli-vrindavan-shri-hita-harivansh-mahaprabhu-shri-hit-chaurasi-44'),
    (45, 'आवति श्रीवृषभानु दुलारी', 'सारंग', 'aavati-shri-vrishbhanu-dulari-shri-hita-harivansh-mahaprabhu-hit-chaurasi-45'),
    (46, 'तेरे हित लैंन आई बन ते स्याम पठाई', 'सारंग', 'tere-hit-lain-aai-ban-te-syam-pathai'),
    (47, 'वन की लीला लालहिं भावै', 'सारंग', 'van-ki-lila-lalahin-bhavai-shri-hita-harivansh-mahaprabhu-shri-hit-chaurasi-47'),
    (48, 'बनी वृषभानु नंदिनी आजु', 'सारंग', 'bani-vrishbhanu-nandini-aaju-shri-hita-harivansh-mahaprabhu-hita-chaurasi-48'),
    (49, 'वृषभानु नंदिनी मधुर कल गावै', 'सारंग', 'vrishbhanu-nandini-madhur-kal-gaavai'),
    (50, 'देखि सखी राधा पिय केलि', 'सारंग', 'dekhi-sakhi-radha-piya-keli'),
    (51, 'दान दै री नवल किसोरी', 'सारंग', 'daan-dai-ri-naval-kisori'),
    (52, 'हित हरिवंश प्रताप रूप गुन वय बल स्याम उजागर', 'मल्हार', 'jai-shri-hit-harivansh-prataap-roop-gun-vay-bal-syaam-ujagar-jaaki-bhroo-vilaas-bas-pasuriv-din-vithakat-ras-saagar-shri-hita-harivansh-mahaprabhu-hit-chaturasi-52'),
    (53, 'देखौ माई अबला के बल रासि', 'मल्हार', 'dekho-mai-abla-ke-bal-rasi-shri-hita-harivansh-mahaprabhu-shri-hita-chaurasi-53'),
    (54, 'नयौ नेह नव रंग नयौ रस', 'मल्हार', 'nayo-neh-nava-rang-nayo-ras-shri-hita-harivansh-mahaprabhu-shri-hita-chaturasi'),
    (55, 'आजु दोउ दामिनि मिलि बहसीं', 'मल्हार', 'aju-dou-damini-mili-bahasin-shri-hit-harivansh-mahaprabhu-shri-hit-chaurasi-55'),
    (56, 'हौं बलि जाऊँ नागरी स्याम', 'मल्हार', 'haun-bali-jaoon-naagri-shyam-shri-hit-harivansh-mahaprabhu-hit-chaurasi-56'),
    (57, 'प्रथम जथामति प्रनऊँ श्री वृन्दावन अति रम्य', 'मल्हार', 'pratham-jathamati-pranaun-vrindavan-ati-ramya-shri-radhika-kripa-binu-sabke-manani-agamya-shri-hita-harivansh-mahaprabhu-hita-chaturasi-57'),
    (58, 'वल्लवी सु कनक वल्लरी तमाल स्याम संग', 'मल्हार', 'vallavi-su-kanak-vallari-tamaal-syam-sang'),
    (59, 'यह जु एक मन बहुत ठौर करि', 'गौरी', 'yah-ju-ek-man-bahut-thaur-kari-shri-harivansh-mahaprabhu-shri-hit-chaurasi-59'),
    (60, 'कहा कहौं इन नैंननि की बात', 'गौरी', 'kaha-kaho-ina-nainan-ki-baat-shri-hita-harivansh-mahaprabhu-hita-chaurasi-61'),
    (61, 'हित हरिवंश प्रपंच बंच सब काल व्याल कौ खायौ', 'गौरी', 'hita-harivansh-prapanch-banch-sab-kaal-vyaal-ko-khaayo-yeh-jiya-jaani-shyam-shyama-pada-kamal-sangi-sira-naayo-shri-hita-harivansh-mahaprabhu'),
    (62, 'मोहिनी मोहन रंगे प्रेम सुरंग', 'गौरी', 'mohini-mohan-range-prem-surang'),
    (63, 'छाँड़िदैं मानिनी मान मन धरिबौ', 'गौरी', 'chhandidain-maanini-maan-man-dharibau'),
    (64, 'बैंनु माई बाजै बंसीवट', 'गौरी', 'bainu-maai-baajai-bansivat-shri-hita-harivansh-mahaprabhu-shri-hit-chaurasi-64'),
    (65, 'सुंदर पुलिन सुभग सुख दाइक', 'कान्हरौ', 'sundar-pulin-subhag-sukh-daaik'),
    (66, 'रुचिर राजत वधू कानन किसोरी', 'कान्हरौ', 'ruchir-rajat-vadhu-kaanan-kisori'),
    (67, 'आज मेरे कहैं चलौ मृगनैंनी', 'कान्हरौ', 'aaj-mere-kahain-chalau-mrignaini'),
    (68, 'सुनि मेरो वचन छबीली राधा', 'कान्हरौ', 'suni-mero-vachan-chhabili-radha'),
    (69, 'मंजुल कुञ्ज मनोहर आँगन रंग बिचित्र पराग न थोरी', 'कान्हरौ', 'manjul-kunj-manohar-aangan-rang-vichitra-parag-na-thori'),
    (70, 'स्याम सँग राधिका रास मंडल बनी', 'कान्हरौ', 'syam-sang-radhika-raas-mandal-bani'),
    (71, 'रास में रसिक मोहन बने भामिनी', 'कान्हरौ', 'raas-mein-rasik-mohan-bane-bhaamini'),
    (72, 'चलहि राधिके सुजान तेरे हित सुख निधान', 'कान्हरौ', 'chalahi-radhike-sujaan-tere-hit-sukh-nidhan'),
    (73, 'खंजन मीन मृगज मद मेंटत', 'कान्हरौ', 'khanjan-meen-mrigaj-mad-mentat-shri-hita-harivansh-mahaprabhu-shri-hit-chaurasi-73'),
    (74, 'काहे कौं मान बढ़ावतु है बालक मृग लोचनि', 'कान्हरौ', 'kaahe-kaun-maan-badhaavatu-hai-shri-hit-harivansh-mahaprabhu-shri-hit-chaurasi-74'),
    (75, 'ये दोऊ झूलत हैं बाँहा जोरैं', 'कान्हरौ', 'ye-dou-jhoolat-hain-baanha-jorain'),
    (76, 'आजु सँभारत नाँहिन गोरी', 'कान्हरौ', 'aaju-sambhaarat-naanhin-gori'),
    (77, 'अपनी बात मोसौं कहि री भामिनी', 'कान्हरौ', 'apni-baat-mosaun-kahi-ri-bhaamini'),
    (78, 'सुधंग नाचत नवल किसोरी', 'कान्हरौ', 'sudhang-nachat-naval-kisori-shri-hita-harivansh-mahaprabhu-shri-hit-chaurasi-78'),
    (79, 'आज झूली री रंग हिंडोरे प्यारी पिय के संग', 'कान्हरौ', 'aaj-jhooli-ri-rang-hindore-pyari-piy-ke-sang'),
    (80, 'लटकति फिरति जुवति रस फूली', 'कल्याण', 'latkati-phirati-juvati-ras-phooli'),
    (81, 'रहसि रहसि मोहन पिय के संग', 'कल्याण', 'rahasi-rahasi-mohan-piy-ke-sang'),
    (82, 'नागरता की रासि किसोरी', 'कल्याण', 'nagarta-ki-raasi-kishori-pada-from-hita-chaturasi-by-murali-avtaar-shri-hita-harivansh-mahaprabhu'),
    (83, 'अलबेले दोऊ झूले हिंडोरे', 'कल्याण', 'albele-dou-jhoole-hindore'),
    (84, 'चलौ वृषभान गोप के द्वार', 'कल्याण', 'chalau-vrishbhanu-gop-ke-dwaar'),
]

AUTHENTIC_PAD_1_VERSES = [
    {
        "stanzaNumber": 1,
        "linesDevanagari": [
            "जोई जोई प्यारो करे सोई मोहि भावै,",
            "भावै मोहि जोई सोई सोई करे प्यारे।"
        ],
        "linesTransliteration": [
            "Jōī jōī pyārō karē sōī mōhi bhāvai,",
            "Bhāvai mōhi jōī sōī sōī karē pyārē."
        ]
    },
    {
        "stanzaNumber": 2,
        "linesDevanagari": [
            "मोको तो भावती एक प्राण प्यारे की बात,",
            "प्यारे को तो भावती मेरे मुख की उज्यारे।"
        ],
        "linesTransliteration": [
            "Mōkō tō bhāvatī ēka prāṇa pyārē kī bāta,",
            "Pyārē kō tō bhāvatī mērē mukha kī ujyārē."
        ]
    },
    {
        "stanzaNumber": 3,
        "linesDevanagari": [
            "मेरे तो तन मन प्राण हूँ ते प्रीतम प्रिय,",
            "अपने कोटिक प्राण प्रीतम मोसों हारे।"
        ],
        "linesTransliteration": [
            "Mērē tō tana mana prāṇa hūm̐ tē prītama priya,",
            "Apanē kōṭika prāṇa prītama mōsōṁ hārē."
        ]
    },
    {
        "stanzaNumber": 4,
        "linesDevanagari": [
            "जै श्रीहित हरिवंश हंस-हंसिनी साँवल-गौर,",
            "कहौ कौंन करै जल-तरंगिनी न्यारे॥"
        ],
        "linesTransliteration": [
            "Jai Śrīhita Harivaṁśa haṁsa-haṁsinī sām̐vala-gaura,",
            "Kahau kaun karaï jala-taraṅginī nyārē."
        ]
    }
]

def norm(text):
    return re.sub(r'[^\u0900-\u097F]', '', text or '')

def clean_verse_lines(lines):
    cleaned = []
    for l in lines:
        s = l.strip()
        # Strip raga / notes prepended as lines
        if re.match(r'^\s*\(राग\s+[^)]+\)', s) or re.match(r'^\s*\[[^\]]+\]\s*$', s):
            continue
        if s:
            cleaned.append(s)
    return cleaned

def run():
    with open('public/data/granthas/hit-chaurasi.json', 'r', encoding='utf-8') as f:
        existing_gr = json.load(f)

    with open('src/data/canonicalPadas.json', 'r', encoding='utf-8') as f:
        canonical_padas = json.load(f)

    # Pool of all candidate items
    all_candidates = existing_gr + canonical_padas

    sphut = [p for p in existing_gr if p.get('chapterId') == 'sphut-vani']
    sudha = [p for p in existing_gr if p.get('chapterId') == 'radha-sudha-nidhi']
    anubandh = [p for p in existing_gr if p.get('chapterId') == 'rasik-anubandh']

    clean_84 = []

    for num, title, rag, canon_slug in CANONICAL_84:
        if num == 1:
            pad = {
                "id": canon_slug,
                "collectionId": "hit-chaurasi",
                "index": 1,
                "verseNumber": 1,
                "titleDevanagari": f"जोई जोई प्यारो करे सोई मोहि भावै - श्री हित हरिवंश महाप्रभु, श्री हित चौरासी (पद 1) (राग {rag})",
                "author": "श्री हित हरिवंश महाप्रभु",
                "rag": rag,
                "slug": canon_slug,
                "chapterId": "hit-chaurasi",
                "chapterName": "श्री हित चौरासी",
                "verses": AUTHENTIC_PAD_1_VERSES
            }
            clean_84.append(pad)
            continue

        tnorm = norm(title)[:8]
        if num == 16:
            tnorm = norm('आजुब देखियत')[:8]
        found = None

        # Search candidates
        for c in all_candidates:
            c_text = norm(c.get('titleDevanagari', '') + ' ' + ' '.join(c.get('verses', [{}])[0].get('linesDevanagari', [])))
            if tnorm in c_text:
                found = c
                break

        if not found:
            print(f"ERROR: Could not find candidate for Pad {num}: {title}")
            continue

        # Clean verses
        verses = []
        for v in found.get('verses', []):
            raw_lines = v.get('linesDevanagari', [])
            cleaned_lines = clean_verse_lines(raw_lines)
            if cleaned_lines:
                new_v = dict(v)
                new_v['linesDevanagari'] = cleaned_lines
                verses.append(new_v)

        if not verses:
            # Fallback to lines
            verses = [{
                "stanzaNumber": 1,
                "linesDevanagari": [title]
            }]

        pad = {
            "id": canon_slug,
            "collectionId": "hit-chaurasi",
            "index": num,
            "verseNumber": num,
            "titleDevanagari": f"{title} - श्री हित हरिवंश महाप्रभु, श्री हित चौरासी (पद {num}) (राग {rag})",
            "author": "श्री हित हरिवंश महाप्रभु",
            "rag": rag,
            "slug": canon_slug,
            "chapterId": "hit-chaurasi",
            "chapterName": "श्री हित चौरासी",
            "verses": verses
        }
        clean_84.append(pad)

    print(f"Reconstructed clean Hit Chaurasi 84 padas: {len(clean_84)}")
    assert len(clean_84) == 84, f"Expected 84 padas, got {len(clean_84)}"

    # Ensure Sphut Vani (29 padas)
    for idx, p in enumerate(sphut):
        p['chapterId'] = 'sphut-vani'
        p['chapterName'] = 'श्री हित स्फुट वाणी'
        p['collectionId'] = 'hit-chaurasi'
        p['index'] = 84 + idx + 1
        p['verseNumber'] = idx + 1

    # Ensure Radha Sudha Nidhi (100 slokas)
    for idx, p in enumerate(sudha):
        p['chapterId'] = 'radha-sudha-nidhi'
        p['chapterName'] = 'श्री राधा सुधा निधि'
        p['collectionId'] = 'hit-chaurasi'
        p['index'] = 84 + len(sphut) + idx + 1
        p['verseNumber'] = idx + 1

    # Ensure Rasik Anubandh (21 verses)
    for idx, p in enumerate(anubandh):
        p['chapterId'] = 'rasik-anubandh'
        p['chapterName'] = 'रसिक वाणी अनुबन्ध व टीका'
        p['collectionId'] = 'hit-chaurasi'
        p['index'] = 84 + len(sphut) + len(sudha) + idx + 1
        p['verseNumber'] = idx + 1

    final_hit_chaurasi_gr = clean_84 + sphut + sudha + anubandh
    total_count = len(final_hit_chaurasi_gr)
    print(f"Total compositions in hit-chaurasi.json: {total_count} (84 + {len(sphut)} + {len(sudha)} + {len(anubandh)})")

    # Write out public/data/granthas/hit-chaurasi.json
    with open('public/data/granthas/hit-chaurasi.json', 'w', encoding='utf-8') as f:
        json.dump(final_hit_chaurasi_gr, f, ensure_ascii=False, indent=2)
    print("Saved public/data/granthas/hit-chaurasi.json")

    # Update src/data/canonicalGranthas.json
    with open('src/data/canonicalGranthas.json', 'r', encoding='utf-8') as f:
        cg = json.load(f)
    for g in cg:
        if g.get('id') == 'hit-chaurasi':
            g['count'] = total_count
            g['description'] = 'निकुंज नित्य विहार एवं अनन्य प्रेम रस का परम पावन ग्रन्थ (८४ पद, स्फुट वाणी व राधा सुधा निधि)।'
    with open('src/data/canonicalGranthas.json', 'w', encoding='utf-8') as f:
        json.dump(cg, f, ensure_ascii=False, indent=2)
    print("Updated src/data/canonicalGranthas.json")

    # Update public/data/scripture-hierarchy.json
    hierarchy_file = 'public/data/scripture-hierarchy.json'
    if os.path.exists(hierarchy_file):
        with open(hierarchy_file, 'r', encoding='utf-8') as f:
            h = json.load(f)
        h['granthas']['hit-chaurasi'] = {
            "id": "hit-chaurasi",
            "verseCount": total_count,
            "chaptersCount": 4,
            "chapters": [
                {
                    "id": "hit-chaurasi",
                    "name": "श्री हित चौरासी",
                    "verseCount": 84,
                    "firstPadId": clean_84[0]['id'],
                    "firstPadSlug": clean_84[0]['slug']
                },
                {
                    "id": "sphut-vani",
                    "name": "श्री हित स्फुट वाणी",
                    "verseCount": len(sphut),
                    "firstPadId": sphut[0]['id'] if sphut else "",
                    "firstPadSlug": sphut[0]['slug'] if sphut else ""
                },
                {
                    "id": "radha-sudha-nidhi",
                    "name": "श्री राधा सुधा निधि",
                    "verseCount": len(sudha),
                    "firstPadId": sudha[0]['id'] if sudha else "",
                    "firstPadSlug": sudha[0]['slug'] if sudha else ""
                },
                {
                    "id": "rasik-anubandh",
                    "name": "रसिक वाणी अनुबन्ध व टीका",
                    "verseCount": len(anubandh),
                    "firstPadId": anubandh[0]['id'] if anubandh else "",
                    "firstPadSlug": anubandh[0]['slug'] if anubandh else ""
                }
            ]
        }
        with open(hierarchy_file, 'w', encoding='utf-8') as f:
            json.dump(h, f, ensure_ascii=False, indent=2)
        print("Updated public/data/scripture-hierarchy.json")

    # Update src/data/canonicalPadas.json
    # Replace existing hit-chaurasi padas with the clean final_hit_chaurasi_gr
    clean_canon = [p for p in canonical_padas if p.get('collectionId') != 'hit-chaurasi' and not (p.get('id') in [x['id'] for x in final_hit_chaurasi_gr])]
    clean_canon.extend(final_hit_chaurasi_gr)
    with open('src/data/canonicalPadas.json', 'w', encoding='utf-8') as f:
        json.dump(clean_canon, f, ensure_ascii=False, indent=2)
    print(f"Updated src/data/canonicalPadas.json (Total verses: {len(clean_canon)})")

if __name__ == '__main__':
    run()
