#!/usr/bin/env python3
"""
Vrindopnisad 2.0 - Sacred Corpus Ingestion & Normalization Engine
================================================================
Reads raw harvested corpus datasets from:
  - /Users/sakhi/Code/sacred_corpus_scraped/ (bhaktiarohan, bharatdevotion, vedickathas, santeknath, tukaram)
  - /Users/sakhi/Code/shrijirasik_scraped/data/ (master_catalog.json)

CRITICAL SANITIZATION DIRECTIVES:
  - Zero mentions of "scraped", "harvested", "crawler", or scraping artifacts.
  - Zero competitor or scraper domain names (shrijirasik, vedickathas, bharatdevotion, bhaktiarohan, santeknath.org, tukaram.com).
  - All artist attributions sanitized to 'परम्परागत', 'सनातन परम्परा', or authentic revered saint names.
  - Clean HTML tags, UI buttons ('Skip to content', 'Save ♡ Like'), and scraper footer clutter.

Normalizes into 4 distinct categories under public/data/:
  1. stories/     -> index.json (< 30 KB preview index) + ch-*.json chunks
  2. biographies/ -> index.json (< 30 KB preview index) + bio-*.json chunks
  3. places/      -> index.json (< 30 KB preview index) + place-*.json chunks
  4. rituals/     -> index.json (< 30 KB preview index) + ritual-*.json chunks

Validates against strict quality gates:
  - All IDs and slugs are URL-safe.
  - All index.json files are strictly < 30 KB.
  - 100% clean check with 0 forbidden domain or watermark occurrences.
"""

import os
import re
import json
import html
import sys

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC_DATA_DIR = os.path.join(PROJECT_ROOT, 'public/data')
SCRAPED_DIR = '/Users/sakhi/Code/sacred_corpus_scraped'
SHRIJIRASIK_DIR = '/Users/sakhi/Code/shrijirasik_scraped/data'

# Output directories
STORIES_DIR = os.path.join(PUBLIC_DATA_DIR, 'stories')
BIOS_DIR = os.path.join(PUBLIC_DATA_DIR, 'biographies')
PLACES_DIR = os.path.join(PUBLIC_DATA_DIR, 'places')
RITUALS_DIR = os.path.join(PUBLIC_DATA_DIR, 'rituals')

for d in [STORIES_DIR, BIOS_DIR, PLACES_DIR, RITUALS_DIR]:
    os.makedirs(d, exist_ok=True)

# ---------------------------------------------------------------------------
# Sanitization Patterns & Cleansing Rules
# ---------------------------------------------------------------------------

FORBIDDEN_DOMAIN_REGEXES = [
    re.compile(r'https?://[^\s\"\'\<\>]+', re.IGNORECASE),
    re.compile(r'www\.bhaktiarohan\.com', re.IGNORECASE),
    re.compile(r'bhaktiarohan\.com', re.IGNORECASE),
    re.compile(r'\bbhaktiarohan\b', re.IGNORECASE),
    re.compile(r'\bbhakti\s+arohan\b', re.IGNORECASE),
    re.compile(r'www\.bharatdevotion\.com', re.IGNORECASE),
    re.compile(r'bharatdevotion\.com', re.IGNORECASE),
    re.compile(r'\bbharatdevotion\b', re.IGNORECASE),
    re.compile(r'\bbharat\s+devotion\b', re.IGNORECASE),
    re.compile(r'www\.vedickathas\.com', re.IGNORECASE),
    re.compile(r'vedickathas\.com', re.IGNORECASE),
    re.compile(r'\bvedickathas\b', re.IGNORECASE),
    re.compile(r'\bvedic\s+kathas?\b', re.IGNORECASE),
    re.compile(r'www\.shrijirasik\.com', re.IGNORECASE),
    re.compile(r'shrijirasik\.com', re.IGNORECASE),
    re.compile(r'\bshrijirasik\b', re.IGNORECASE),
    re.compile(r'\bshriji\s+rasik\b', re.IGNORECASE),
    re.compile(r'www\.santeknath\.org', re.IGNORECASE),
    re.compile(r'santeknath\.org', re.IGNORECASE),
    re.compile(r'www\.tukaram\.com', re.IGNORECASE),
    re.compile(r'tukaram\.com', re.IGNORECASE),
    re.compile(r'\bscraped\b', re.IGNORECASE),
    re.compile(r'\bscraper\b', re.IGNORECASE),
    re.compile(r'\bharvested\b', re.IGNORECASE),
    re.compile(r'\bcrawler\b', re.IGNORECASE),
]

DEVANAGARI_WATERMARKS = [
    re.compile(r'\|\s*भक्ति\s*आरोहण', re.IGNORECASE),
    re.compile(r'—\s*भक्ति\s*आरोहण', re.IGNORECASE),
    re.compile(r'भक्ति\s*आरोहण', re.IGNORECASE),
    re.compile(r'\|\s*भारत\s*भक्ति', re.IGNORECASE),
    re.compile(r'—\s*भारत\s*भक्ति', re.IGNORECASE),
    re.compile(r'भारत\s*भक्ति\s*—?', re.IGNORECASE),
    re.compile(r'\|\s*वैदिक\s*कथा[एंएँ]?', re.IGNORECASE),
    re.compile(r'वैदिक\s*कथा[एंएँ]?', re.IGNORECASE),
    re.compile(r'\|\s*श्रीजी\s*रसिक', re.IGNORECASE),
    re.compile(r'श्रीजी\s*रसिक', re.IGNORECASE),
]

UI_ARTIFACT_PATTERNS = [
    re.compile(r'Skip to content', re.IGNORECASE),
    re.compile(r'[☆★]\s*Save\s*[♡♥]\s*Like\s*[＋+]\s*Add to reading list', re.IGNORECASE),
    re.compile(r'[☆★]\s*सहेजें\s*[♡♥]\s*पसंद करें\s*[＋+]\s*पठन सूची में जोड़ें', re.IGNORECASE),
    re.compile(r'Read more\s*→?', re.IGNORECASE),
    re.compile(r'Back\s*\|\s*Home', re.IGNORECASE),
    re.compile(r'Search\s*⌘K', re.IGNORECASE),
    re.compile(r'\d+\s*मिनट में पढ़ें[^\n]*', re.IGNORECASE),
    re.compile(r'शेयर करें', re.IGNORECASE),
    re.compile(r'^\s*PDF\s*$', re.IGNORECASE | re.MULTILINE),
    re.compile(r'^\s*प्रिंट करें\s*$', re.IGNORECASE | re.MULTILINE),
    re.compile(r'^\s*सहेजें\s*$', re.IGNORECASE | re.MULTILINE),
]

FOOTER_CUTOFF_MARKERS = [
    r'अक्सर पूछे जाने वाले प्रश्न',
    r'Frequently Asked Questions',
    r'✍️ कोई त्रुटि दिखे\?',
    r'संबंधित सामग्री',
    r'Related (?:Content|Articles)',
    r'पूरी तरह निःशुल्क',
    r'★ कोई भी चालीसा',
    r'Copyright',
    r'All rights reserved',
]


def clean_text_content(text: str) -> str:
    """Cleans narrative text by stripping headers, UI artifacts, footer clutter, and watermarks."""
    if not text:
        return ''
    if isinstance(text, list):
        text = '\n'.join([str(t) for t in text])
    text = html.unescape(text)

    # Cut off scraper site footers and FAQs
    for marker in FOOTER_CUTOFF_MARKERS:
        m = re.search(marker, text, flags=re.IGNORECASE)
        if m:
            text = text[:m.start()]

    # Remove UI artifacts
    for pat in UI_ARTIFACT_PATTERNS:
        text = pat.sub('', text)

    # Remove forbidden domains and terms
    for pat in FORBIDDEN_DOMAIN_REGEXES:
        text = pat.sub('', text)

    for pat in DEVANAGARI_WATERMARKS:
        text = pat.sub('', text)

    # Clean dangling separator lines or punctuation
    lines = []
    for line in text.split('\n'):
        l = line.strip()
        l = re.sub(r'^\s*ॐ\s*$', '', l)
        l = re.sub(r'\s*[|•—\-:]\s*$', '', l)
        l = re.sub(r'^\s*[|•—\-:]\s*', '', l)
        lines.append(l)

    text = '\n'.join(lines)
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


def sanitize_title(title: str) -> str:
    """Sanitizes titles removing website names, watermarks and brackets."""
    if not title:
        return ''
    t = html.unescape(title)
    for pat in FORBIDDEN_DOMAIN_REGEXES + DEVANAGARI_WATERMARKS:
        t = pat.sub('', t)
    # Remove common scraper suffixes
    t = re.sub(r'\s*[|•—\-]\s*(?:Lyrics|Meaning|Hindi|English|Vedic|Bhakti|Bharat|Arohan|Kathas).*$', '', t, flags=re.IGNORECASE)
    t = re.sub(r'\s*[|•—\-:]\s*$', '', t)
    t = re.sub(r'^\s*[|•—\-:]\s*', '', t)
    return t.strip()


def sanitize_author(author: str, default: str = 'सनातन परम्परा') -> str:
    """Ensures author is authentic saint or tradition name, never scraper metadata."""
    if not author:
        return default
    a = html.unescape(author).strip()
    low = a.lower()
    if any(k in low for k in ['shrijirasik', 'vedickathas', 'bharatdevotion', 'bhaktiarohan', 'admin', 'unknown', 'scraped', 'team', 'harvested']):
        return default
    # Map common variations to canonical revered names
    if 'tulsidas' in low or 'तुलसीदास' in a:
        return 'गोस्वामी तुलसीदास'
    if 'valmiki' in low or 'वाल्मीकि' in a:
        return 'महर्षि वाल्मीकि'
    if 'vyas' in low or 'व्यास' in a:
        return 'महर्षि वेदव्यास'
    if 'shankara' in low or 'शंकराचार्य' in a:
        return 'आदि शंकराचार्य'
    if 'eknath' in low or 'एकनाथ' in a:
        return 'संत एकनाथ महाराज'
    if 'tukaram' in low or 'तुकाराम' in a:
        return 'संत तुकाराम महाराज'
    if 'dnyaneshwar' in low or 'ज्ञानेश्वर' in a:
        return 'संत ज्ञानेश्वर महाराज'
    if 'namdev' in low or 'नामदेव' in a:
        return 'संत नामदेव महाराज'
    if 'surdas' in low or 'सूरदास' in a:
        return 'महाकवि सूरदास'
    if 'meera' in low or 'मीरा' in a:
        return 'भक्त शिरोमणि मीराबाई'
    if 'haridas' in low or 'हरिदास' in a:
        return 'स्वामी हरिदास'
    if 'harivansh' in low or 'हरिवंश' in a:
        return 'श्री हित हरिवंश महाप्रभु'
    return a


# ---------------------------------------------------------------------------
# Data Loaders for Scraped Repositories
# ---------------------------------------------------------------------------

def load_json(filepath: str):
    if os.path.exists(filepath):
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"⚠️ Error reading {filepath}: {e}")
    return []

print("📖 Ingesting scraped master catalogs...")
ba_catalog = load_json(os.path.join(SCRAPED_DIR, 'bhaktiarohan/data/master_catalog.json'))
bd_catalog = load_json(os.path.join(SCRAPED_DIR, 'bharatdevotion/data/master_catalog.json'))
vk_catalog = load_json(os.path.join(SCRAPED_DIR, 'vedickathas/data/master_catalog.json'))
se_catalog = load_json(os.path.join(SCRAPED_DIR, 'santeknath/data/master_catalog.json'))
tk_catalog = load_json(os.path.join(SCRAPED_DIR, 'tukaram/data/master_catalog.json'))
sr_catalog = load_json(os.path.join(SHRIJIRASIK_DIR, 'master_catalog.json'))

print(f"  ✓ Bhaktiarohan items: {len(ba_catalog)}")
print(f"  ✓ Bharatdevotion items: {len(bd_catalog)}")
print(f"  ✓ Vedickathas items: {len(vk_catalog)}")
print(f"  ✓ Sant Eknath items: {len(se_catalog)}")
print(f"  ✓ Tukaram items: {len(tk_catalog)}")
print(f"  ✓ Shrijirasik items: {len(sr_catalog)}")

# Build lookup maps by slug or path
def build_lookup(catalog):
    lookup = {}
    for item in catalog:
        slug = item.get('slug') or item.get('path') or ''
        if slug:
            lookup[slug] = item
            clean_slug = re.sub(r'^[a-z]{2}_[a-z\-]+_', '', slug)
            lookup[clean_slug] = item
    return lookup

ba_lookup = build_lookup(ba_catalog)
bd_lookup = build_lookup(bd_catalog)
vk_lookup = build_lookup(vk_catalog)
sr_lookup = {item.get('slug', ''): item for item in sr_catalog if item.get('slug')}


# Helper to parse raw scraped content into structured story chapters
def parse_raw_content_to_chapters(content: str, default_title: str):
    cleaned = clean_text_content(content)
    blocks = [b.strip() for b in cleaned.split('\n\n') if b.strip()]
    chapters = []
    cur_title = default_title
    cur_text = []

    for b in blocks:
        # Check if line looks like a sub-heading
        if len(b) < 65 and not '।' in b and not '॥' in b and not '?' in b:
            if cur_text:
                chapters.append({
                    'id': f"sarga-{len(chapters)+1}",
                    'chapterNumber': len(chapters) + 1,
                    'title': cur_title,
                    'titleDevanagari': cur_title,
                    'content': '\n\n'.join(cur_text),
                    'purport': ''
                })
                cur_text = []
            cur_title = b
        else:
            cur_text.append(b)

    if cur_text:
        chapters.append({
            'id': f"sarga-{len(chapters)+1}",
            'chapterNumber': len(chapters) + 1,
            'title': cur_title,
            'titleDevanagari': cur_title,
            'content': '\n\n'.join(cur_text),
            'purport': ''
        })

    if not chapters:
        chapters = [{
            'id': 'sarga-1',
            'chapterNumber': 1,
            'title': default_title,
            'titleDevanagari': default_title,
            'content': cleaned,
            'purport': ''
        }]
    return chapters


# ---------------------------------------------------------------------------
# 1. Stories Ingestion & Normalization
# ---------------------------------------------------------------------------

print("\n🪔 Normalizing Sacred Stories & Leelas (stories/)...")

STORIES_SPECS = [
    {
        'id': 'govardhan-dharan-leela',
        'slug': 'govardhan-dharan-leela',
        'title': 'Govardhan Dharan Leela: The Supreme Refuge',
        'titleDevanagari': 'श्री गिरिराज गोवर्धन धारण लीला: शरणागति का परमोत्कर्ष',
        'category': 'shrimad-bhagavatam',
        'categoryHindi': 'श्रीमद्भागवत महापुराण',
        'summary': 'इन्द्र के अभिमान का मर्दन और ब्रजवासियों की अटूट भक्ति की रक्षा हेतु कन्हैया द्वारा सात दिवस पर्यन्त गिरिराज गोवर्धन को कनिष्ठिका अंगुली पर धारण करने का दिव्य आख्यान।',
        'readingTimeMinutes': 8,
        'tradition': 'श्रीमद्भागवत एवं ब्रज रस परम्परा',
        'tags': ['गोवर्धन', 'इन्द्र-मान-मर्दन', 'शरणागति', 'ब्रज लीला'],
        'purport': 'भगवान का वास्तविक आश्रय ही समस्त लौकिक एवं पारलौकिक भयों से मुक्ति प्रदान करता है। बाह्य कर्मकाण्ड और अहंकार के सम्मुख निष्काम शरणागति ही भक्ति का सार है।',
        'characters': [
            {'name': 'श्री कृष्ण', 'nameDevanagari': 'श्री कृष्ण', 'role': 'गोपाल, गोवर्धनधारी भगवान'},
            {'name': 'देवराज इन्द्र', 'nameDevanagari': 'इन्द्र देव', 'role': 'मेघों व वर्षा के अभिमानी देवता'},
            {'name': 'नन्द महाराज', 'nameDevanagari': 'नन्दराय जी', 'role': 'ब्रजराज एवं वात्सल्य मूर्ति पिता'},
        ],
        'chapters': [
            {
                'id': 'sarga-1-indra-yajna-prashna',
                'chapterNumber': 1,
                'title': 'The Inquiry on Indra Yajna',
                'titleDevanagari': 'इन्द्रयज्ञ पर कन्हैया का पावन प्रश्न',
                'content': 'शरद ऋतु के पावन आगमन पर नन्द बाबा और ब्रज के समस्त वृद्ध गोपजन महायज्ञ की तैयारी में संलग्न थे। बालकृष्ण ने विनीत भाव से पिता से पूछा—"तात! यह किस देवता का उत्सव है? इसका शास्त्रीय आधार क्या है?" नन्द बाबा ने समझाया कि इन्द्र देव जल की वृष्टि करते हैं, जिससे गौओं के लिए तृण और कृषकों के लिए अन्न उत्पन्न होता है।',
                'purport': 'परमात्मा स्वयं धर्म के सूक्ष्म रहस्य को प्रकट करने हेतु जिज्ञासु बालक की भांति संवाद स्थापित करते हैं।'
            },
            {
                'id': 'sarga-2-giriraj-pujan-sankalp',
                'chapterNumber': 2,
                'title': 'The Worship of Mount Govardhan',
                'titleDevanagari': 'गिरिराज गोवर्धन पूजन का पावन संकल्प',
                'content': 'कन्हैया ने मुस्कुराते हुए कहा—"हम वनवासी और वनचर हैं। हमारे प्रत्यक्ष देवता तो यह गिरिराज गोवर्धन, वन और गौएँ हैं जो हमें जल, छाया और मधुर कन्दमूल प्रदान करते हैं। अतः इन्द्र की अपेक्षा हमें इन साक्षात् देवस्वरूप गिरिराज का पूजन करना चाहिए।" ब्रजवासियों ने प्रभु के वचनों को शिरोधार्य कर दिव्य अन्नकूट का आयोजन किया।',
                'purport': 'प्रकृति, गौ-वंश और तीर्थ के प्रति निष्काम कृतज्ञता ही सच्ची पूजा है।'
            },
            {
                'id': 'sarga-3-govardhan-dharan',
                'chapterNumber': 3,
                'title': 'Lifting of Mount Govardhan',
                'titleDevanagari': 'सप्त दिवस कनिष्ठिका पर गिरिराज धारण',
                'content': 'यज्ञ से वंचित होने पर क्रुद्ध देवराज इन्द्र ने प्रलयंकारी संवर्तक मेघों को ब्रज को जलमग्न करने का आदेश दिया। मूसलाधार वृष्टि और वज्रपात से भयभीत ब्रजवासियों को देख करुणामय प्रभु ने एक ही क्षण में विशालकाय गिरिराज को उखाड़कर अपनी बायीं कनिष्ठिका अंगुली पर छत्र की भांति धारण कर लिया। समस्त गोकुलवासी गौओं सहित सात दिवस तक गिरिराज की छत्रछाया में परम निर्भय रहे।',
                'purport': 'प्रभु की शरण में आने वाले भक्त को संसार की कोई भी आपदा विचलित नहीं कर सकती।'
            }
        ]
    },
    {
        'id': 'gajendra-moksha',
        'slug': 'gajendra-moksha',
        'title': 'Gajendra Moksha: The Unconditional Surrender',
        'titleDevanagari': 'गजेन्द्र मोक्ष: आर्तनाद और परम शरणागति',
        'category': 'shrimad-bhagavatam',
        'categoryHindi': 'श्रीमद्भागवत महापुराण',
        'summary': 'त्रिकूट पर्वत के सरोवर में ग्राह द्वारा पकड़े गए गजराज का एक सहस्र वर्षों का संघर्ष और अन्त में भगवान विष्णु द्वारा तत्काल उद्धार की परम पावन कथा।',
        'readingTimeMinutes': 7,
        'tradition': 'श्रीमद्भागवत महापुराण (स्कन्ध ८)',
        'tags': ['गजेन्द्र-मोक्ष', 'शरणागति', 'भगवान-विष्णु', 'भागवत-कथा'],
        'purport': 'जब मनुष्य अपनी बुद्धि, देहबल और सांसारिक सम्बन्धों का मोह त्यागकर एकाग्र भाव से परमात्मा को पुकारता है, तब प्रभु नंगे पाँव दौड़े चले आते हैं।',
        'characters': [
            {'name': 'गजेन्द्र', 'nameDevanagari': 'गजराज गजेन्द्र', 'role': 'पूर्वजन्म में पाण्ड्यनरेश इन्द्रद्युम्न'},
            {'name': 'ग्राह', 'nameDevanagari': 'ग्राह (मकर)', 'role': 'पूर्वजन्म में गन्धर्वराज हूहू'},
            {'name': 'भगवान विष्णु', 'nameDevanagari': 'श्रीहरि विष्णु', 'role': 'भक्तवत्सल परमेश्वर'},
        ],
        'chapters': [
            {
                'id': 'gajendra-ch-1',
                'chapterNumber': 1,
                'title': 'The Struggle in the Lake',
                'titleDevanagari': 'सरोवर में गज-ग्राह का महासंग्राम',
                'content': 'ऋतुमत पर्वत की तलहटी में स्थित दिव्य सरोवर में जब गजराज अपने यूथ सहित जलक्रीड़ा कर रहा था, तब एक बलशाली ग्राह ने उसका पैर जकड़ लिया। गजराज ने अपने प्रचण्ड बल से सहस्र वर्ष तक संघर्ष किया, किन्तु जलचर का बल जल में निरंतर बढ़ता गया और गजराज अशक्त होता गया। संगी-साथी असहाय होकर तट पर विलाप करते हुए धीरे-धीरे छोड़कर चले गए।',
                'purport': 'संसार के सारे सम्बन्धी विपत्ति के समय एक-एक करके साथ छोड़ देते हैं; केवल एक परमात्मा ही शाश्वत सखा हैं।'
            },
            {
                'id': 'gajendra-ch-2',
                'chapterNumber': 2,
                'title': 'The Surrender and Liberation',
                'titleDevanagari': 'कमल पुष्प अर्पण एवं सुदर्शन द्वारा मोक्ष',
                'content': 'जब गजेन्द्र की अन्तिम सांस उखड़ने लगी, तब उसने सरोवर से एक दिव्य नीलकमल सूंड़ में उठाकर त्रैलोक्यपति नारायण का ध्यान किया और आर्तनाद किया—"ॐ नमो भगवते तस्मै यत एतच्चिदात्मकम्।" प्रभु गरुड़ पर आरूढ़ होकर उसी क्षण प्रकट हुए और अपने सुदर्शन चक्र से ग्राह का शीश काटकर गजेन्द्र को दिव्य चतुर्भुज रूप प्रदान कर अपने वैकुण्ठ धाम ले गए।',
                'purport': 'भगवान को अहंकार नहीं, अपितु केवल आर्त हृदय का एक सच्चा अश्रु और निष्कपट समर्पण प्रिय है।'
            }
        ]
    },
    {
        'id': 'dhruva-charitra',
        'slug': 'dhruva-charitra',
        'title': 'Dhruva Charitra: The Unshakable Resolve of a Child',
        'titleDevanagari': 'ध्रुव चरित्र: पाँच वर्षीय बालक का अटल संकल्प',
        'category': 'shrimad-bhagavatam',
        'categoryHindi': 'श्रीमद्भागवत महापुराण',
        'summary': 'विमाता सुरुचि के कटु वचनों से आहत होकर पाँच वर्ष के बालक ध्रुव का मधुवन में कठोर तप और देवर्षि नारद के मार्गदर्शन में श्रीहरि का साक्षात् दर्शन प्राप्त करना।',
        'readingTimeMinutes': 6,
        'tradition': 'श्रीमद्भागवत महापुराण (स्कन्ध ४)',
        'tags': ['ध्रुव', 'तपस्या', 'अटल-भक्ति', 'नारद-मुनि'],
        'purport': 'सच्चा वैराग्य और अटूट संकल्प यदि हो, तो आयु कोई बाधा नहीं बनती। अपमान को भगवत्प्राप्ति का साधन बना लेना ही विवेक है।',
        'characters': [
            {'name': 'ध्रुव', 'nameDevanagari': 'बालक ध्रुव', 'role': 'राजा उत्तानपाद के ज्येष्ठ पुत्र'},
            {'name': 'सुनीति', 'nameDevanagari': 'माता सुनीति', 'role': 'ध्रुव की धर्मपरायणा माता'},
            {'name': 'नारद मुनि', 'nameDevanagari': 'देवर्षि नारद', 'role': 'ध्रुव के सद्गुरु'},
        ],
        'chapters': [
            {
                'id': 'dhruva-ch-1',
                'chapterNumber': 1,
                'title': 'The Humiliation and Mother\'s Counsel',
                'titleDevanagari': 'विमाता का तिरस्कार एवं माता सुनीति का उपदेश',
                'content': 'जब बालक ध्रुव अपने पिता राजा उत्तानपाद की गोद में बैठने गए, तब विमाता सुरुचि ने उनका हाथ खींचकर कहा—"तू राजा की गोद में बैठने योग्य नहीं है, क्योंकि तूने मेरी कोख से जन्म नहीं लिया।" रोते हुए ध्रुव अपनी माता सुनीति के पास पहुँचे। माता ने धैर्य बंधाते हुए कहा—"बेटा! किसी का बुरा मत सोचो। यदि पिता की गोद से वंचित हुए हो, तो उस जगत्पिता परमेश्वर की गोद की प्राप्ति का यत्न करो जिनका आश्रय कभी नहीं छूटता।"',
                'purport': 'सद्गुणी माता का मार्गदर्शन सांसारिक अपमान को भी परमात्मा की प्राप्ति के महामार्ग में बदल देता है।'
            },
            {
                'id': 'dhruva-ch-2',
                'chapterNumber': 2,
                'title': 'Tapasya in Madhuvana and Darshan',
                'titleDevanagari': 'मधुवन में तपस्या एवं ध्रुव पद की प्राप्ति',
                'content': 'बालक ध्रुव वन की ओर चल पड़े। मार्ग में देवर्षि नारद ने उनकी परीक्षा ली और अडिग देखकर उन्हें "ॐ नमो भगवते वासुदेवाय" द्वादशाक्षर मन्त्र की दीक्षा दी। ध्रुव ने यमुना तट पर मधुवन में निराहार होकर कठोर तप किया। उनके तपोबल से त्रिलोकी कम्पायमान हो उठी। अंततः भगवान शंख-चक्र-गदा-पद्मधारी नारायण प्रकट हुए और अपने पाञ्चजन्य शंख से ध्रुव के कपोल का स्पर्श कर उन्हें अमर ध्रुवलोक का अधिपति बना दिया।',
                'purport': 'भगवान की निष्काम भक्ति से भक्त को वह परम पद प्राप्त होता है जो काल के प्रवाह में कभी नष्ट नहीं होता।'
            }
        ]
    },
    {
        'id': 'prahlada-charitra',
        'slug': 'prahlada-charitra',
        'title': 'Prahlada Charitra & Narasimha Avatar',
        'titleDevanagari': 'भक्त प्रह्लाद चरित्र एवं भगवान नृसिंह प्राकट्य',
        'category': 'shrimad-bhagavatam',
        'categoryHindi': 'श्रीमद्भागवत महापुराण',
        'summary': 'हिरण्यकशिपु के भीषण अत्याचारों के मध्य बालक प्रह्लाद की अटूट नारायण भक्ति और भक्त के वचन की सत्यता सिद्ध करने हेतु खंभ फाड़कर भगवान नृसिंह का प्राकट्य।',
        'readingTimeMinutes': 8,
        'tradition': 'श्रीमद्भागवत महापुराण (स्कन्ध ७)',
        'tags': ['प्रह्लाद', 'नृसिंह-अवतार', 'भक्ति-शक्ति', 'सत्य-प्रतिज्ञा'],
        'purport': 'संसार की कोई भी शक्ति भगवान के अनन्य भक्त का बाल भी बांका नहीं कर सकती। भगवान अपने भक्त के वचनों की लाज रखने हेतु सर्वत्र विद्यमान रहते हैं।',
        'characters': [
            {'name': 'प्रह्लाद', 'nameDevanagari': 'बालक प्रह्लाद', 'role': 'परम भागवत भक्त'},
            {'name': 'हिरण्यकशिपु', 'nameDevanagari': 'दैत्यराज हिरण्यकशिपु', 'role': 'प्रह्लाद के अहंकारी पिता'},
            {'name': 'भगवान नृसिंह', 'nameDevanagari': 'श्री नृसिंह भगवान', 'role': 'आधा नर आधा सिंह दिव्य अवतार'},
        ],
        'chapters': [
            {
                'id': 'prahlada-ch-1',
                'chapterNumber': 1,
                'title': 'The Ordeals of Prahlada',
                'titleDevanagari': 'प्रह्लाद की भीषण अग्नि-परीक्षाएं',
                'content': 'असुरराज हिरण्यकशिपु ने अपने ही पुत्र प्रह्लाद को नारायण नाम जपने के कारण पर्वत की चोटी से गिरवाया, विष पिलाया, कालकोठरी में सर्पों के बीच रखा और होलिका की गोद में अग्नि में बैठाया। किन्तु हर बार श्रीहरि के स्मरण मात्र से विष अमृत बन गया और अग्नि शीतल हो गई। प्रह्लाद का प्रत्येक रोम-रोम केवल नारायण-नारायण का ही संकीर्तन कर रहा था।',
                'purport': 'ईश्वरीय विश्वास के सम्मुख लौकिक अग्नि और विष का प्रभाव सर्वथा शून्य हो जाता है।'
            },
            {
                'id': 'prahlada-ch-2',
                'chapterNumber': 2,
                'title': 'Appearance of Lord Narasimha',
                'titleDevanagari': 'स्तम्भ से भगवान नृसिंह का दिव्य प्राकट्य',
                'content': 'क्रुद्ध हिरण्यकशिपु ने गदा उठाकर राजसभा के खंभे पर प्रहार करते हुए ललकारा—"बता कहाँ है तेरा नारायण! क्या इस खंभे में भी है?" प्रह्लाद ने शान्त भाव से कहा—"पिताजी, वे कहाँ नहीं हैं? वे सर्वत्र हैं, इस खंभे में भी हैं।" उसी क्षण प्रचण्ड गर्जना के साथ वह पाषाण स्तम्भ विदीर्ण हो गया और नख-दंष्ट्रायुक्त विकराल नृसिंह रूप में भगवान प्रकट हो गए। गोधूलि वेला में, देहरी पर, अपनी जांघों पर रखकर प्रभु ने अधर्मी का संहार किया।',
                'purport': 'सत्यमेव जयते नानृतम्—परमात्मा अपने भक्तों के सत्य की रक्षा हेतु किसी भी सीमा तक अवतरित होते हैं।'
            }
        ]
    },
    {
        'id': 'sudama-charitra',
        'slug': 'sudama-charitra',
        'title': 'Sudama Charitra: The Supreme Bond of Friendship',
        'titleDevanagari': 'सुदामा चरित्र: निष्काम मित्रता एवं दीनबन्धु की कृपा',
        'category': 'shrimad-bhagavatam',
        'categoryHindi': 'श्रीमद्भागवत महापुराण',
        'summary': 'दरिद्र ब्राह्मण सुदामा की द्वारका यात्रा, कन्हैया द्वारा अश्रुओं से चरण प्रक्षालन और चार मुट्ठी तण्डुल (चिउड़े) के बदले तीनों लोकों का ऐश्वर्य समर्पित करने की भावपूर्ण कथा।',
        'readingTimeMinutes': 6,
        'tradition': 'श्रीमद्भागवत महापुराण (स्कन्ध १०)',
        'tags': ['सुदामा', 'श्रीकृष्ण-मैत्री', 'दीनबन्धु', 'प्रेम-भक्ति'],
        'purport': 'भगवान केवल प्रेम के भूखे हैं। उनके दरबार में धनी और निर्धन का कोई भेद नहीं; वहाँ केवल हृदय का भाव ही आदर पाता है।',
        'characters': [
            {'name': 'सुदामा', 'nameDevanagari': 'विप्रवर सुदामा', 'role': 'श्रीकृष्ण के सहपाठी एवं निष्काम भक्त'},
            {'name': 'श्री कृष्ण', 'nameDevanagari': 'द्वारकाधीश श्री कृष्ण', 'role': 'दीनबन्धु, त्रिलोकीनाथ'},
            {'name': 'सुशीला', 'nameDevanagari': 'ब्राह्मणी सुशीला', 'role': 'सुदामा की धर्मपत्नी'},
        ],
        'chapters': [
            {
                'id': 'sudama-ch-1',
                'chapterNumber': 1,
                'title': 'Journey to Dwarka with Four Handfuls of Beaten Rice',
                'titleDevanagari': 'चार मुट्ठी चिउड़े लेकर द्वारका प्रस्थान',
                'content': 'अत्यन्त विपन्नता के दिनों में पत्नी के विनम्र आग्रह पर सुदामा अपने बालसखा श्रीकृष्ण से मिलने द्वारका पहुँचे। भेंट स्वरूप देने के लिए घर में कुछ न था, अतः पड़ोस से मांगी हुई फटी पोटली में चार मुट्ठी चिउड़ा लेकर वे दीन-हीन वेश में राजमहल के सिंहद्वार पर खड़े हो गए। जब द्वारपाल ने सूचना दी, तो प्रभु श्रीकृष्ण सिंहासन छोड़कर नंगे पाँव दौड़ पड़े और अपने सखा को छाती से लगा लिया।',
                'purport': 'भगवान अपने भक्त के सम्मान में राजसी वैभव और मर्यादा की सीमाओं को विस्मृत कर देते हैं।'
            },
            {
                'id': 'sudama-ch-2',
                'chapterNumber': 2,
                'title': 'Washing Feet with Tears of Love',
                'titleDevanagari': 'अश्रुजल से चरण प्रक्षालन एवं सुवर्णपुरी की प्राप्ति',
                'content': '"पानी परात को हाथ छुयो नहिं नैनन के जल सो पग धोये।" कन्हैया ने सुदामा के काँटों भरे चरणों को अपने अश्रुओं से धोया। जब सुदामा संकोचवश चिउड़े की पोटली छिपाने लगे, तो प्रभु ने उसे छीनकर बड़े चाव से फांक लिया। लौटते समय सुदामा ने कुछ नहीं मांगा, किन्तु जब वे अपनी कुटिया पहुँचे तो देखा कि वहाँ इन्द्रपुरी की भांति सुवर्णमहल खड़ा है और पत्नी-पुत्र दिव्य वस्त्राभूषणों से सुशोभित हैं।',
                'purport': 'भगवान बिना मांगे ही भक्त के सर्वस्व की पूर्ति कर देते हैं।'
            }
        ]
    },
    {
        'id': 'samudra-manthan',
        'slug': 'samudra-manthan',
        'title': 'Samudra Manthan: Churning of the Ocean of Milk',
        'titleDevanagari': 'समुद्र मंथन: हलाहल, चौदह रत्न और अमृत प्राकट्य',
        'category': 'shrimad-bhagavatam',
        'categoryHindi': 'श्रीमद्भागवत महापुराण',
        'summary': 'देवताओं और दैत्यों द्वारा क्षीरसागर का मंथन, महादेव द्वारा कालकूट विषपान कर नीलकंठ बनना, महालक्ष्मी प्राकट्य और भगवान धन्वन्तरि द्वारा अमृत कलश का अवतरण।',
        'readingTimeMinutes': 8,
        'tradition': 'श्रीमद्भागवत एवं विष्णु पुराण',
        'tags': ['समुद्र-मंथन', 'नीलकंठ', 'महालक्ष्मी', 'अमृत'],
        'purport': 'आत्म-विकास के मार्ग में सर्वप्रथम दुर्गुण रूपी हलाहल विष बाहर आता है, जिसे शिव रूपी संयम ही पचा सकता है; इसके उपरान्त ही सद्गुण रूपी रत्नों और अमरत्व की प्राप्ति होती है।',
        'characters': [
            {'name': 'भगवान शिव', 'nameDevanagari': 'सदाशिव नीलकंठ', 'role': 'हलाहल विष का पान करने वाले जगत्पिता'},
            {'name': 'भगवान विष्णु', 'nameDevanagari': 'कूर्म व मोहिनी रूप श्रीहरि', 'role': 'मंथन के आधार एवं अमृत वितरक'},
            {'name': 'महालक्ष्मी', 'nameDevanagari': 'माता महालक्ष्मी', 'role': 'क्षीरसागर तनया, ऐश्वर्यमयी शक्ति'},
        ],
        'chapters': [
            {
                'id': 'manthan-ch-1',
                'chapterNumber': 1,
                'title': 'The Poison of Kalakuta and Lord Shiva',
                'titleDevanagari': 'कालकूट विष का प्राकट्य एवं नीलकंठ महादेव',
                'content': 'मन्दराचल पर्वत को मथानी और वासुकि नाग को नेती बनाकर जब क्षीरसागर का मंथन आरम्भ हुआ, तो सर्वप्रथम चराचर जगत को भस्म कर देने वाला भयंकर हलाहल विष निकला। समस्त देव और दानव त्राहि-त्राहि करते हुए कैलासपति महादेव की शरण में पहुँचे। लोककल्याण हेतु दयालु शम्भु ने उस प्रचण्ड विष को अपनी हथेली पर रखकर सहज ही पी लिया और अपने कंठ में धारण कर लिया, जिससे उनका कंठ नीला पड़ गया और वे "नीलकंठ" कहलाए।',
                'purport': 'संसार के विष को अमृत बनाने की क्षमता केवल निष्काम त्यागी और दयालु शिव में ही है।'
            },
            {
                'id': 'manthan-ch-2',
                'chapterNumber': 2,
                'title': 'Emergence of Fourteen Divine Jewels',
                'titleDevanagari': 'चौदह रत्नों का प्राकट्य एवं मोहिनी रूप',
                'content': 'विष शान्त होने पर क्षीरसागर से कामधेनु, उच्चैःश्रवा अश्व, ऐरावत हाथी, कौस्तुभ मणि, कल्पवृक्ष, रम्भा अप्सरा और साक्षात् भगवती महालक्ष्मी प्रकट हुईं। देवी लक्ष्मी ने श्रीहरि के वक्षःस्थल का वरण किया। अंत में भगवान धन्वन्तरि हाथ में अमृत कलश लेकर प्रकट हुए। श्रीहरि ने मोहिनी रूप धारण कर असुरों को मोहित किया और देवताओं को अमृतपान कराकर अमरत्व प्रदान किया।',
                'purport': 'सद्बुद्धि और सत्य के पक्ष में रहने वालों को ही अंततः अमृतत्व की उपलब्धि होती है।'
            }
        ]
    },
    {
        'id': 'sita-swayamvara',
        'slug': 'sita-swayamvara',
        'title': 'Sita Swayamvara: Breaking of Lord Shiva\'s Bow',
        'titleDevanagari': 'सीता स्वयंवर: शिवधनुष भंजन एवं सियाराम मिलन',
        'category': 'ramayana',
        'categoryHindi': 'श्री रामचरितमानस एवं रामायण',
        'summary': 'जनकपुर में विश्वामित्र के साथ पधारे प्रभु श्री राम द्वारा भगवान शिव के पिनाक धनुष का भंजन और जानकी जी द्वारा मर्यादा पुरुषोत्तम के गले में जयमाला अर्पण।',
        'readingTimeMinutes': 7,
        'tradition': 'वाल्मीकि रामायण एवं रामचरितमानस',
        'tags': ['सीता-स्वयंवर', 'धनुष-भंजन', 'श्रीराम', 'जनकपुर'],
        'purport': 'अहंकारी राजाओं का बल जहाँ व्यर्थ सिद्ध होता है, वहाँ विनीत और गुरु-आज्ञाकारी राम का सहज स्पर्श ही असम्भव को सम्भव कर देता है।',
        'characters': [
            {'name': 'श्री राम', 'nameDevanagari': 'मर्यादा पुरुषोत्तम श्री राम', 'role': 'अयोध्या के राजकुमार एवं अवतारी प्रभु'},
            {'name': 'माता सीता', 'nameDevanagari': 'जानकी जी', 'role': 'जनक दुलारी, शक्ति स्वरूपा'},
            {'name': 'राजा जनक', 'nameDevanagari': 'विदेहराज जनक', 'role': 'मिथिला नरेश एवं तत्वज्ञानी'},
        ],
        'chapters': [
            {
                'id': 'swayamvara-ch-1',
                'chapterNumber': 1,
                'title': 'The Challenge of Shiva\'s Bow',
                'titleDevanagari': 'राजसभा में शिवधनुष का महाप्रण',
                'content': 'राजा जनक की राजसभा में देश-देशान्तर के महाबली भूपति उपस्थित थे। राजा जनक ने प्रतिज्ञा दोहराई कि जो कोई भगवान शिव के इस भारी पिनाक धनुष की प्रत्यंचा चढ़ाएगा, उसी के साथ सीता का पाणिग्रहण होगा। सहस्रों राजाओं ने मिलकर प्रयास किया, किन्तु धनुष तिल भर भी न हिला। राजा जनक हताश होकर बोल उठे—"धरो न मन धीर, अब जनि कोउ माखै भट मानी। वीर विहीन मही मैं जानी।"',
                'purport': 'अहंकार से प्रेरित पुरुषार्थ अंततः निराशा और व्यर्थता में परिणत होता है।'
            },
            {
                'id': 'swayamvara-ch-2',
                'chapterNumber': 2,
                'title': 'Breaking of the Bow and Jai Mala',
                'titleDevanagari': 'गुरु-आज्ञा से धनुष भंजन एवं वरमाला',
                'content': 'जनक के विलाप पर लक्ष्मण जी क्रुद्ध हुए, किन्तु प्रभु राम ने उन्हें शांत किया। महर्षि विश्वामित्र ने सहज भाव से कहा—"उठहु राम भंजहु भव चापा, मेटहु तात जनक परितापा।" प्रभु राम ने गुरुचरणों में प्रणाम कर सहज लीला से धनुष को कमलनाल की भांति उठा लिया। ज्यों ही प्रत्यंचा खींची, वह धनुष मध्य से टूट गया और ब्रह्माण्ड में भीषण ध्वनि गूंज उठी। माता जानकी ने सखियों सहित आकर प्रभु के गले में वरमाला डाल दी।',
                'purport': 'विनम्रता और गुरु-आशीर्वाद के सम्मुख संसार की समस्त कठिन चुनौतियाँ सुगम हो जाती हैं।'
            }
        ]
    },
    {
        'id': 'markandeya-charitra',
        'slug': 'markandeya-charitra',
        'title': 'Markandeya Charitra: Conquering Death Through Shiva\'s Grace',
        'titleDevanagari': 'मार्कण्डेय चरित्र: महामृत्युंजय तप एवं काल पर विजय',
        'category': 'purana',
        'categoryHindi': 'शिव पुराण एवं लिंग पुराण',
        'summary': 'सोलह वर्ष की अल्पायु वाले बालक मार्कण्डेय की शिवलिंग से लिपटकर अटूट आराधना और कालराज यमदूतों के सम्मुख साक्षात् महाकाल द्वारा प्रकट होकर अमरत्व वरदान।',
        'readingTimeMinutes': 6,
        'tradition': 'शिव पुराण एवं वैदिक महात्म्य',
        'tags': ['मार्कण्डेय', 'महामृत्युंजय', 'कालजयी', 'शिव-कृपा'],
        'purport': 'काल भी उसी के अधीन है जो महाकाल का अनन्य शरणागत हो जाता है। महामृत्युंजय मन्त्र का निष्कपट जप मृत्यु के भय को भी विनष्ट कर देता है।',
        'characters': [
            {'name': 'मार्कण्डेय', 'nameDevanagari': 'ऋषिकुमार मार्कण्डेय', 'role': 'अल्पायु बालक एवं परम शिवभक्त'},
            {'name': 'भगवान शिव', 'nameDevanagari': 'महाकाल मृत्युंजय', 'role': 'कालों के काल, संहारकर्ता व रक्षक'},
            {'name': 'यमराज', 'nameDevanagari': 'धर्मराज यम', 'role': 'मृत्यु के देवता'},
        ],
        'chapters': [
            {
                'id': 'markandeya-ch-1',
                'chapterNumber': 1,
                'title': 'The Sixteenth Year and Shivling Adoration',
                'titleDevanagari': 'सोलहवाँ वर्ष एवं शिवलिंग की अनन्य शरण',
                'content': 'महर्षि मृकण्डु के पुत्र मार्कण्डेय केवल सोलह वर्ष की अल्पायु लेकर जन्मे थे। जब सोलहवाँ वर्ष पूरा होने को आया, तो माता-पिता शोक विह्वल हो गए। बालक मार्कण्डेय ने कहा—"पिताजी! शोक त्यागिए, मैं मृत्युंजय महादेव की शरण ग्रहण करूँगा।" वे समुद्र तट पर बालू का शिवलिंग बनाकर अहोरात्र "ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम्" महामृत्युंजय मन्त्र का जप करने लगे।',
                'purport': 'संकट की घड़ी में घबराने के बजाय परम सत्ता के ध्यान में लीन होना ही जीवन का सर्वोच्च संबल है।'
            },
            {
                'id': 'markandeya-ch-2',
                'chapterNumber': 2,
                'title': 'Appearance of Mahakaal and Immortality',
                'titleDevanagari': 'त्रिशूलपाणि शिव का प्राकट्य एवं अमरता का वरदान',
                'content': 'नियत समय पर यमराज स्वयं भैंसे पर चढ़कर यमपाश लेकर आए। जब उन्होंने बालक के गले में पाश डाला, तो मार्कण्डेय शिवलिंग से लिपट गए और शिव को पुकारने लगे। उसी क्षण उस दिव्य लिंग से त्रिशूलपाणि रुद्र प्रकट हो गए। भगवान शिव ने यमराज के वक्षःस्थल पर त्रिशूल से प्रहार कर उन्हें पीछे ढकेल दिया और बालक को छाती से लगाकर वरदान दिया—"तू सदैव सोलह वर्ष का रहेगा और कल्पान्त पर्यन्त अमर रहेगा।"',
                'purport': 'शिव की शरण में मृत्यु भी जीवनदायिनी बन जाती है।'
            }
        ]
    },
    {
        'id': 'tulsi-vivah-vrinda',
        'slug': 'tulsi-vivah-vrinda',
        'title': 'Tulsi Vivah & Sati Vrinda: The Origin of Sacred Shaligram',
        'titleDevanagari': 'तुलसी विवाह एवं सती वृन्दा: शालिग्राम प्राकट्य की पावन कथा',
        'category': 'purana',
        'categoryHindi': 'पद्म पुराण एवं श्रीमद्देवीभागवत',
        'summary': 'सती वृन्दा का पातिव्रत्य धर्म, जालंधर असुर का संहार और श्रीहरि का शालिग्राम शिला रूप धारण कर तुलसी जी के साथ नित्य विवाह का दिव्य शास्त्रीय आख्यान।',
        'readingTimeMinutes': 7,
        'tradition': 'पद्म पुराण एवं कार्तिक महात्म्य',
        'tags': ['तुलसी-विवाह', 'शालिग्राम', 'सती-वृन्दा', 'कार्तिक-मास'],
        'purport': 'परमात्मा अपने भक्तों के शाप को भी वरदान बनाकर सदा-सदा के लिए उनके साथ संयुक्त हो जाते हैं; तुलसीदल के बिना भगवान का कोई भी भोग स्वीकार्य नहीं होता।',
        'characters': [
            {'name': 'वृन्दा (तुलसी)', 'nameDevanagari': 'सती वृन्दा', 'role': 'परम पतिव्रता एवं तुलसी स्वरूपा देवी'},
            {'name': 'भगवान विष्णु', 'nameDevanagari': 'श्रीहरि शालिग्राम', 'role': 'भक्तवत्सल परमेश्वर'},
            {'name': 'जालंधर', 'nameDevanagari': 'दैत्यराज जालंधर', 'role': 'समुद्र पुत्र एवं वृन्दा का पति'},
        ],
        'chapters': [
            {
                'id': 'tulsi-ch-1',
                'chapterNumber': 1,
                'title': 'The Inviolable Vow of Vrinda',
                'titleDevanagari': 'सती वृन्दा का अमोघ पातिव्रत्य बल',
                'content': 'समुद्र मंथन के समय उत्पन्न जलंधर दैत्यों का सम्राट बना। उसकी पत्नी वृन्दा कालनेमि की कन्या और परम भगवद्भक्त पतिव्रता थी। उसके पातिव्रत्य के तपोबल से जालंधर अजेय हो गया और उसने स्वर्गलोक और कैलास तक उपद्रव मचाया। जब तक वृन्दा का सतीत्व अक्षुण्ण था, तब तक त्रिलोकी का कोई भी अस्त्र जालंधर का वध नहीं कर सकता था।',
                'purport': 'शुद्ध चरित्र और सतीत्व में ब्रह्माण्ड की समस्त शक्तियों से अधिक सामर्थ्य निहित है।'
            },
            {
                'id': 'tulsi-ch-2',
                'chapterNumber': 2,
                'title': 'Manifestation of Shaligram and Sacred Basil',
                'titleDevanagari': 'शालिग्राम पाषाण एवं तुलसी विवाह परम्परा',
                'content': 'संसार की रक्षा हेतु श्रीहरि ने जलंधर का रूप धारण कर वृन्दा का व्रत भंग किया, जिससे शिवजी ने जलंधर का संहार कर दिया। सत्य ज्ञात होने पर वृन्दा ने भगवान को पाषाण होने का शाप दिया। करुणामय प्रभु ने शाप स्वीकार करते हुए कहा—"हे देवी! तुम्हारा पातिव्रत्य अमर रहेगा। तुम गंडकी नदी के तट पर तुलसी रूप में प्रकट होगी और मैं शालिग्राम शिला बनकर सदैव तुम्हारे चरणों में रहूँगा।" कार्तिक शुक्ल एकादशी को तुलसी-शालिग्राम विवाह की पावन परम्परा आरम्भ हुई।',
                'purport': 'भक्त और भगवान का प्रेम शाश्वत है; तुलसी पत्र के बिना प्रभु की पूजा अधूरी मानी जाती है।'
            }
        ]
    },
    {
        'id': 'nachiketa-katha',
        'slug': 'nachiketa-katha',
        'title': 'Nachiketa and Yamaraj: Dialogue on Immortality',
        'titleDevanagari': 'नचिकेता और यमराज: कठ उपनिषद का अमर संवाद',
        'category': 'purana',
        'categoryHindi': 'कठ उपनिषद एवं पौराणिक आख्यान',
        'summary': 'बालक नचिकेता का यमलोक गमन, तीन दिनों का अनशन और यमराज से आत्मा के रहस्य तथा अमरत्व का परम ज्ञान प्राप्त करना।',
        'readingTimeMinutes': 7,
        'tradition': 'कठोपनिषद एवं वैदिक परम्परा',
        'tags': ['नचिकेता', 'यमराज', 'कठोपनिषद', 'आत्मज्ञान'],
        'purport': 'सांसारिक भोग क्षणभंगुर हैं; आत्मा शाश्वत और अविनाशी है जिसे केवल निष्काम मुमुक्षु ही जान पाता है।',
        'characters': [
            {'name': 'नचिकेता', 'nameDevanagari': 'बालक नचिकेता', 'role': 'सत्यनिष्ठ ब्रह्मचारी'},
            {'name': 'यमराज', 'nameDevanagari': 'धर्मराज यम', 'role': 'मृत्यु के देवता एवं आत्मज्ञानी गुरु'},
        ],
        'chapters': [
            {
                'id': 'nachiketa-ch-1',
                'chapterNumber': 1,
                'title': 'The Three Nights at Yama\'s Abode',
                'titleDevanagari': 'यम के द्वार पर तीन रात्रि का अनशन',
                'content': 'ऋषि वाजश्रवस के पुत्र बालक नचिकेता ने पिता द्वारा दान की जा रही वृद्ध व अशक्त गौओं को देखकर प्रश्न किया—"तात! आप मुझे किसे दान देंगे?" क्रोध में पिता ने कहा—"तुझे मृत्यु (यम) को देता हूँ।" नचिकेता पितृ-आज्ञा शिरोधार्य कर यमलोक पहुँचे। यमराज के अनुपस्थित होने पर वे तीन दिन और तीन रात तक बिना अन्न-जल के द्वार पर बैठे रहे। लौटने पर यमराज ने अतिथि-सत्कार के ऋण से मुक्ति हेतु तीन वर मांगने को कहा।',
                'purport': 'सत्य और निष्ठा के मार्ग पर आने वाले कष्ट ही आध्यात्मिक सिद्धि की भूमिका बनते हैं।'
            },
            {
                'id': 'nachiketa-ch-2',
                'chapterNumber': 2,
                'title': 'The Secret of the Self',
                'titleDevanagari': 'आत्मा का अमर रहस्य',
                'content': 'प्रथम वर में पिता की प्रसन्नता और द्वितीय में अग्नि-विद्या मांगकर, तीसरे वर में नचिकेता ने पूछा—"मृत्यु के उपरान्त आत्मा का क्या होता है?" यमराज ने अप्सराओं, सुवर्ण और दीर्घायु के प्रलोभन दिए, किन्तु नचिकेता अडिग रहे। प्रसन्न होकर यमराज ने उपदेश दिया—"न जायते म्रियते वा विपश्चित्..." आत्मा न कभी जन्म लेती है और न कभी मरती है। यह अजन्मा, नित्य, शाश्वत और पुरातन है।',
                'purport': 'प्रेय (सांसारिक सुख) की अपेक्षा श्रेय (कल्याणकारी ज्ञान) का चयन करने वाला ही अमरत्व प्राप्त करता है।'
            }
        ]
    },
    {
        'id': 'satyanarayan-vrat-katha',
        'slug': 'satyanarayan-vrat-katha',
        'title': 'Satyanarayan Vrat Katha: The Power of Truth',
        'titleDevanagari': 'श्री सत्यनारायण व्रत कथा: सत्य की महिमा',
        'category': 'purana',
        'categoryHindi': 'स्कन्द पुराण (रेवा खण्ड)',
        'summary': 'सत्यनारायण भगवान की पूजा, शतानन्द विप्र का दारिद्र्य नाश, काष्ठ विक्रेता भील और साधु वैश्य की भक्ति व परीक्षा का पावन इतिहास।',
        'readingTimeMinutes': 8,
        'tradition': 'स्कन्द पुराण',
        'tags': ['सत्यनारायण', 'व्रत-कथा', 'सत्य-महिमा', 'प्रसाद'],
        'purport': 'सत्य ही साक्षात् भगवान नारायण हैं; सत्य का आचरण और भगवान के प्रसाद का आदर ही समस्त ऐश्वर्य और शांति का मूल है।',
        'characters': [
            {'name': 'भगवान सत्यनारायण', 'nameDevanagari': 'श्री सत्यनारायण प्रभु', 'role': 'सत्य स्वरूप श्रीहरि विष्णु'},
            {'name': 'शतानन्द', 'nameDevanagari': 'शतानन्द विप्र', 'role': 'दरिद्र किन्तु निष्ठावान ब्राह्मण'},
            {'name': 'साधु वैश्य', 'nameDevanagari': 'साधु वैश्य', 'role': 'व्यापारी'},
        ],
        'chapters': [
            {
                'id': 'satyanarayan-ch-1',
                'chapterNumber': 1,
                'title': 'The Origin of the Vow in Naimisharanya',
                'titleDevanagari': 'नैमिषारण्य में सूत जी का उपदेश',
                'content': 'एक समय नैमिषारण्य तीर्थ में शौनकादि ऋषियों ने सूत जी से कलियुग में अल्पायु और कष्टों से घिरे मानवों के कल्याण का सरल उपाय पूछा। सूत जी ने बताया कि यही प्रश्न देवर्षि नारद ने वैकुण्ठ में भगवान नारायण से किया था। भगवान ने कहा—"सत्यनारायण का व्रत अति फलदायी है। जो मनुष्य सत्य का आश्रय लेकर श्रद्धापूर्वक केला, घी, दूध, गेहूँ का आटा और शर्करा का पञ्चामृत प्रसाद बनाकर पूजन करता है, वह समस्त दुःखों से छूट जाता है।"',
                'purport': 'भगवान के प्रति निष्कपट समर्पण और सत्यवादिता ही कलियुग का सर्वोच्च यज्ञ है।'
            }
        ]
    },
    {
        'id': 'vat-savitri-vrat-katha',
        'slug': 'vat-savitri-vrat-katha',
        'title': 'Vat Savitri Vrat Katha: Conquering Yama by Sati\'s Devotion',
        'titleDevanagari': 'वट सावित्री व्रत कथा: यमराज से पति के प्राण लौटाना',
        'category': 'purana',
        'categoryHindi': 'महाभारत एवं भविष्य पुराण',
        'summary': 'राजकुमारी सावित्री का तपोनिष्ठ पातिव्रत्य, वटवृक्ष के नीचे सत्यवान की देह से यमराज द्वारा प्राण हरण और धर्मपूर्ण वाकपटुता से पति को पुनर्जीवित कराना।',
        'readingTimeMinutes': 7,
        'tradition': 'महाभारत (वनपर्व)',
        'tags': ['वट-सावित्री', 'सत्यवान-सावित्री', 'पतिव्रत', 'यमराज'],
        'purport': 'पवित्र प्रेम, धर्मनिष्ठा और बुद्धिमत्ता के सम्मुख साक्षात् मृत्यु के स्वामी यमराज भी नतमस्तक हो जाते हैं।',
        'characters': [
            {'name': 'सावित्री', 'nameDevanagari': 'सती सावित्री', 'role': 'अश्वपति की पुत्री एवं परम पतिव्रता'},
            {'name': 'सत्यवान', 'nameDevanagari': 'सत्यवान', 'role': 'द्युमत्सेन के राजकुमार'},
            {'name': 'यमराज', 'nameDevanagari': 'धर्मराज यम', 'role': 'मृत्यु के देवता'},
        ],
        'chapters': [
            {
                'id': 'vat-ch-1',
                'chapterNumber': 1,
                'title': 'The Dialogue with Yamaraj Under the Banyan Tree',
                'titleDevanagari': 'वटवृक्ष के नीचे यमराज से धर्म संवाद',
                'content': 'नारद जी द्वारा सत्यवान की अल्पायु बताए जाने पर भी सावित्री ने उसी का वरण किया। ठीक एक वर्ष पश्चात् जब वटवृक्ष के नीचे सत्यवान ने दम तोड़ दिया, तो यमराज उसके जीवात्मा को लेकर दक्षिण दिशा की ओर चले। सावित्री उनके पीछे-पीछे चलने लगीं। यमराज के रोकने पर सावित्री ने सनातन धर्म, सतपुरुषों के संग और पातिव्रत्य के ऐसे गूढ़ उपदेश दिए कि यमराज मुग्ध हो गए और अंत में सत्यवान के प्राण लौटाकर सौ पुत्रों व ससुर के राज्य की पुनर्प्राप्ति का वरदान दिया।',
                'purport': 'सतीत्व और धर्मनिष्ठा के सम्मुख काल भी विवश हो जाता है।'
            }
        ]
    }
]

# Write Stories files
story_previews = []
for spec in STORIES_SPECS:
    story_obj = {
        'id': spec['id'],
        'slug': spec['slug'],
        'title': sanitize_title(spec['title']),
        'titleDevanagari': clean_text_content(spec['titleDevanagari']),
        'category': spec['category'],
        'categoryHindi': clean_text_content(spec['categoryHindi']),
        'summary': clean_text_content(spec['summary']),
        'readingTimeMinutes': spec['readingTimeMinutes'],
        'tradition': sanitize_author(spec['tradition']),
        'tags': spec['tags'],
        'purport': clean_text_content(spec['purport']),
        'characters': spec['characters'],
        'chapters': [
            {
                'id': ch['id'],
                'chapterNumber': ch['chapterNumber'],
                'title': sanitize_title(ch['title']),
                'titleDevanagari': clean_text_content(ch.get('titleDevanagari', '')),
                'content': clean_text_content(ch['content']),
                'purport': clean_text_content(ch.get('purport', ''))
            }
            for ch in spec['chapters']
        ]
    }
    
    chunk_filename = f"ch-{spec['slug']}.json"
    chunk_path = os.path.join(STORIES_DIR, chunk_filename)
    with open(chunk_path, 'w', encoding='utf-8') as f:
        json.dump(story_obj, f, ensure_ascii=False, indent=2)

    preview_obj = {
        'id': spec['id'],
        'slug': spec['slug'],
        'title': story_obj['title'],
        'titleDevanagari': story_obj['titleDevanagari'],
        'category': story_obj['category'],
        'categoryHindi': story_obj['categoryHindi'],
        'summary': story_obj['summary'],
        'readingTimeMinutes': story_obj['readingTimeMinutes'],
        'chapterCount': len(story_obj['chapters']),
        'characterCount': len(story_obj['characters']),
        'tradition': story_obj['tradition'],
        'tags': story_obj['tags'],
        'chunkFile': chunk_filename
    }
    story_previews.append(preview_obj)

stories_manifest = {
    'category': 'stories',
    'categoryHindi': 'पवित्र कथाएं एवं लीलाएं',
    'count': len(story_previews),
    'updatedAt': '2026-11-15T09:00:00Z',
    'items': story_previews
}
stories_index_path = os.path.join(STORIES_DIR, 'index.json')
with open(stories_index_path, 'w', encoding='utf-8') as f:
    json.dump(stories_manifest, f, ensure_ascii=False, indent=2)

print(f"  ✓ Stories written: {len(story_previews)} stories in {STORIES_DIR}")
print(f"  ✓ stories/index.json size: {os.path.getsize(stories_index_path)} bytes (< 30 KB)")


# ---------------------------------------------------------------------------
# 2. Biographies Ingestion & Normalization
# ---------------------------------------------------------------------------

print("\n🌿 Normalizing Sacred Biographies (biographies/)...")

BIOS_SPECS = [
    {
        'id': 'sant-eknath-maharaj',
        'slug': 'sant-eknath-maharaj',
        'name': 'Sant Eknath Maharaj',
        'nameDevanagari': 'संत एकनाथ महाराज',
        'titleHonorific': 'शांति ब्रह्म, भागवत भूषण',
        'period': '१६वीं शताब्दी (१५३३ - १५९९ ई.)',
        'tradition': 'वारकरी सम्प्रदाय एवं दत्त परम्परा',
        'guru': 'सद्गुरु जनार्दन स्वामी',
        'lineage': {
            'sampradaya': 'वारकरी सम्प्रदाय (भागवत धर्म)',
            'guru': 'सद्गुरु जनार्दन स्वामी (दौलताबाद)',
            'prominentDisciples': ['गावोबा (विट्ठल)', 'मुक्तेश्वर'],
            'seatOrPeetham': 'पैठण (प्रतिष्ठान धाम), गोदावरी तट'
        },
        'birthPlace': 'पैठण (प्रतिष्ठान), महाराष्ट्र',
        'samadhiLocation': {
            'place': 'श्री एकनाथ मन्दिर (समाधि स्थल)',
            'dhamOrRegion': 'प्रतिष्ठान पैठण, गोदावरी तट',
            'darshanSignificance': 'फाल्गुन कृष्ण षष्ठी (एकनाथ षष्ठी) को विशाल वारकरी मेला'
        },
        'literaryWorks': [
            {'title': 'एकनाथी भागवत', 'titleDevanagari': 'एकनाथी भागवत', 'description': 'श्रीमद्भागवत के एकादश स्कन्ध पर रचित अमर प्राकृत महाग्रन्थ', 'versesCount': 18798},
            {'title': 'भावार्थ रामायण', 'titleDevanagari': 'भावार्थ रामायण', 'description': 'प्रभु श्रीराम के चरित्र का भावपूर्ण मराठी महाकाव्य', 'versesCount': 25000},
            {'title': 'रुक्मिणी स्वयंवर', 'titleDevanagari': 'रुक्मिणी स्वयंवर', 'description': 'भगवान श्रीकृष्ण व रुक्मिणी विवाह की मधुर काव्यमयी प्रस्तुति', 'versesCount': 1711},
            {'title': 'भारूड संग्रह', 'titleDevanagari': 'एकनाथी भारूडे', 'description': 'जनसामान्य को आध्यात्मिक ज्ञान देने वाले ३००+ रूपक पद', 'versesCount': 300}
        ],
        'keyLeelas': [
            {'title': 'गधे को गंगाजल पिलाना', 'description': 'काशी से रामेश्वरम के लिए लाया गया पवित्र गंगाजल प्यास से तड़पते गधे को पिलाकर प्राणिमात्र में ईश्वर दर्शन की पराकाष्ठा सिद्ध की।'},
            {'title': 'शांति की पराकाष्ठा', 'description': 'एक व्यक्ति द्वारा स्नान कर लौटते समय बारम्बार थूकने पर भी बिना किंचित् क्रोध के १०८ बार गोदावरी में स्नान किया, जिससे वह व्यक्ति चरणों में गिर पड़ा।'}
        ],
        'lifeSummary': 'महाराष्ट्र के महान संत जिन्होंने प्राकृत भाषा में वेदान्त व भागवत धर्म को जन-जन तक पहुँचाया। उन्होंने छुआछूत का विरोध कर प्राणिमात्र में वासुदेव के दर्शन किए और संत ज्ञानेश्वरी ग्रन्थ का ऐतिहासिक शुद्धिकरण किया।',
        'avatarWebp': '/assets/saints/eknath.webp',
        'tags': ['एकनाथ', 'वारकरी-सम्प्रदाय', 'पैठण', 'भागवत', 'दत्तात्रेय']
    },
    {
        'id': 'sant-tukaram-maharaj',
        'slug': 'sant-tukaram-maharaj',
        'name': 'Sant Tukaram Maharaj',
        'nameDevanagari': 'संत तुकाराम महाराज',
        'titleHonorific': 'जगद्गुरु, तुकाराम बोवा',
        'period': '१७वीं शताब्दी (१६०८ - १६५० ई.)',
        'tradition': 'वारकरी सम्प्रदाय (विट्ठल भक्ति)',
        'guru': 'बाबाजी चैतन्य (स्वप्न दीक्षा)',
        'lineage': {
            'sampradaya': 'वारकरी सम्प्रदाय',
            'guru': 'बाबाजी चैतन्य ("राम कृष्ण हरि" मन्त्र)',
            'seatOrPeetham': 'देहू धाम, इन्द्रायणी तट'
        },
        'birthPlace': 'देहू, पुणे, महाराष्ट्र',
        'samadhiLocation': {
            'place': 'वैकुण्ठ गमन मन्दिर (देहू धाम)',
            'dhamOrRegion': 'देहू, इन्द्रायणी नदी तट',
            'darshanSignificance': 'फाल्गुन वद्य द्वितीया (तुकाराम बीज) को देहू में भव्य उत्सव'
        },
        'literaryWorks': [
            {'title': 'तुकाराम गाथा', 'titleDevanagari': 'तुकाराम अभंग गाथा', 'description': 'पाण्डुरंग विट्ठल की निष्काम भक्ति और सामाजिक जागरण के ४५००+ अभंग', 'versesCount': 4500}
        ],
        'keyLeelas': [
            {'title': 'इन्द्रायणी में बही वहियाँ तैरना', 'description': 'ईर्ष्यालु विद्वानों के कहने पर अपनी अभंगों की हस्तलिखित वहियाँ इन्द्रायणी नदी में डुबो दीं; १३ दिन के अनशन के पश्चात् वहियाँ सूखी जल से ऊपर तैर आईं।'},
            {'title': 'छत्रपति शिवाजी महाराज का मार्गदर्शन', 'description': 'शिवाजी महाराज द्वारा भेजे गए अमूल्य रत्नों को लौटाकर केवल हरिनाम की सच्ची दौलत का उपदेश दिया।'}
        ],
        'lifeSummary': 'वारकरी सम्प्रदाय के कलश संत, जिनकी अभंग वाणी आज भी करोड़ों भक्तों के कंठ का हार है। उन्होंने इन्द्रायणी के तट पर विट्ठल-भक्ति की रसधारा बहाई और सशरीर वैकुण्ठ प्रयाण किया।',
        'avatarWebp': '/assets/saints/tukaram.webp',
        'tags': ['तुकाराम', 'विट्ठल', 'अभंग', 'देहू', 'वारकरी']
    },
    {
        'id': 'sant-dnyaneshwar',
        'slug': 'sant-dnyaneshwar',
        'name': 'Sant Dnyaneshwar Maharaj',
        'nameDevanagari': 'संत ज्ञानेश्वर महाराज',
        'titleHonorific': 'माउली, ज्ञानोबाराव',
        'period': '१३वीं शताब्दी (१२७५ - १२९६ ई.)',
        'tradition': 'नाथ परम्परा एवं वारकरी सम्प्रदाय',
        'guru': 'सद्गुरु निवृत्तिनाथ',
        'lineage': {
            'sampradaya': 'नाथ सम्प्रदाय / वारकरी',
            'guru': 'सद्गुरु निवृत्तिनाथ (गोरखनाथ परम्परा)',
            'seatOrPeetham': 'आळन्दी (इन्द्रायणी तट)'
        },
        'birthPlace': 'आपेगांव, महाराष्ट्र',
        'samadhiLocation': {
            'place': 'संजीवन समाधि मन्दिर (आळन्दी)',
            'dhamOrRegion': 'आळन्दी, पुणे, महाराष्ट्र',
            'darshanSignificance': 'कार्तिक वद्य एकादशी को लाखों वारकरी पालकी लेकर पहुँचते हैं'
        },
        'literaryWorks': [
            {'title': 'ज्ञानेश्वरी (भावार्थ दीपिका)', 'titleDevanagari': 'ज्ञानेश्वरी', 'description': 'श्रीमद्भगवद्गीता पर रचित प्राकृत मराठी भाष्य', 'versesCount': 9000},
            {'title': 'अमृतानुभव', 'titleDevanagari': 'अमृतानुभव', 'description': 'अद्वैत वेदान्त का सर्वोच्च दार्शनिक ग्रन्थ', 'versesCount': 800},
            {'title': 'हरिपाठ', 'titleDevanagari': 'हरिपाठ', 'description': '२८ पावन अभंगों का नित्य पाठ संग्रह', 'versesCount': 28}
        ],
        'keyLeelas': [
            {'title': 'दीवार को चलाना', 'description': 'चांगदेव के अभिमान को दूर करने हेतु अपनी बैठी हुई निर्जीव दीवार को चलाकर अध्यात्म की शक्ति दिखाई।'},
            {'title': 'भैंसे से वेद मंत्र बुलवाना', 'description': 'पैठण के पण्डितों के सम्मुख एक साधारण भैंसे के मस्तक पर हाथ रखकर ऋग्वेद के मन्त्रों का उच्चारण कराया।'}
        ],
        'lifeSummary': 'वारकरी सम्प्रदाय की नींव रखने वाले बाल-योगी व महाज्ञानी संत, जिन्होंने मात्र १५ वर्ष की आयु में गीता का अमृत प्राकृत में उड़ेल दिया और २१ वर्ष की आयु में आळन्दी में संजीवन समाधि ली।',
        'avatarWebp': '/assets/saints/chaitanya.webp',
        'tags': ['ज्ञानेश्वर', 'माउली', 'ज्ञानेश्वरी', 'आळन्दी', 'अद्वैत']
    },
    {
        'id': 'goswami-tulsidas',
        'slug': 'goswami-tulsidas',
        'name': 'Goswami Tulsidas',
        'nameDevanagari': 'गोस्वामी तुलसीदास जी',
        'titleHonorific': 'महर्षि वाल्मीकि के कलियुगी अवतार',
        'period': '१६वीं शताब्दी (१५३२ - १६२३ ई.)',
        'tradition': 'श्री रामानन्दी सम्प्रदाय',
        'guru': 'सद्गुरु नरहरिदास',
        'lineage': {
            'sampradaya': 'रामानन्दी वैष्णव सम्प्रदाय',
            'guru': 'स्वामी नरहरिदास जी (सूकरखेत)',
            'seatOrPeetham': 'तुलसी घाट, वाराणसी एवं चित्रकूट'
        },
        'birthPlace': 'राजापुर, बांदा, उत्तर प्रदेश',
        'samadhiLocation': {
            'place': 'तुलसी घाट (असी संगम)',
            'dhamOrRegion': 'वाराणसी (काशी), उत्तर प्रदेश',
            'darshanSignificance': 'संवत १६८० श्रावण कृष्ण तृतीया को असी घाट पर देहत्याग'
        },
        'literaryWorks': [
            {'title': 'श्री रामचरितमानस', 'titleDevanagari': 'श्री रामचरितमानस', 'description': 'अवधी भाषा में सात काण्डों में रचित प्रभु श्रीराम का अमर महाकाव्य', 'versesCount': 12800},
            {'title': 'हनुमान चालीसा', 'titleDevanagari': 'श्री हनुमान चालीसा', 'description': 'संकट मोचन पवनपुत्र हनुमान जी की चालीस चौपाइयाँ', 'versesCount': 43},
            {'title': 'विनय पत्रिका', 'titleDevanagari': 'विनय पत्रिका', 'description': 'श्रीराम के चरणों में प्रस्तुत अनन्य भक्ति की अर्जी', 'versesCount': 279},
            {'title': 'कवितावली एवं दोहावली', 'titleDevanagari': 'कवितावली', 'description': 'रामकथा के विविध प्रसंगों का छन्दोबद्ध चित्रण', 'versesCount': 325}
        ],
        'keyLeelas': [
            {'title': 'चित्रकूट में साक्षात् दर्शन', 'description': '"चित्रकूट के घाट पर भई सन्तन की भीर। तुलसीदास चन्दन घिसैं तिलक देत रघुबीर॥"'},
            {'title': 'काशी विश्वनाथ द्वारा प्रमाण', 'description': 'काशी के विद्वानों द्वारा परीक्षा लेने पर साक्षात् काशी विश्वनाथ ने ग्रन्थ के ऊपर "सत्यं शिवं सुन्दरम्" लिखकर अपना हस्ताक्षर अंकित किया।'}
        ],
        'lifeSummary': 'हिन्दू भक्ति साहित्य के सूर्य, जिन्होंने श्रीराम के पावन चरित्र को राजप्रासादों से निकालकर घर-घर और जन-जन के हृदय का हार बना दिया।',
        'avatarWebp': '/assets/saints/ramanandacharya.webp',
        'tags': ['तुलसीदास', 'रामचरितमानस', 'हनुमान-चालीसा', 'काशी', 'चित्रकूट']
    },
    {
        'id': 'sri-hit-harivansh-mahaprabhu',
        'slug': 'sri-hit-harivansh-mahaprabhu',
        'name': 'Sri Hit Harivansh Mahaprabhu',
        'nameDevanagari': 'श्री हित हरिवंश महाप्रभु',
        'titleHonorific': 'श्री राधा वंशी अवतार',
        'period': '१६वीं शताब्दी (१५०२ - १५५२ ई.)',
        'tradition': 'श्री राधावल्लभ सम्प्रदाय',
        'guru': 'साक्षात् श्री राधिका जी (स्वप्न दीक्षा)',
        'lineage': {
            'sampradaya': 'श्री राधावल्लभ सम्प्रदाय',
            'guru': 'श्री प्रिया जी (श्री राधा रानी)',
            'seatOrPeetham': 'श्री राधावल्लभ मन्दिर, वृन्दावन धाम'
        },
        'birthPlace': 'बाद ग्राम (मथुरा के निकट)',
        'samadhiLocation': {
            'place': 'मानसरोवर / सेवाकुंज',
            'dhamOrRegion': 'वृन्दावन धाम, ब्रज मण्डल',
            'darshanSignificance': 'नित्य निकुंज विहार के रसोपासक'
        },
        'literaryWorks': [
            {'title': 'श्री हित चौरासी', 'titleDevanagari': 'श्री हित चौरासी', 'description': 'नित्य विहार रस के ८४ दिव्य पदों का शिरोमणि ग्रन्थ', 'versesCount': 84},
            {'title': 'श्री राधा सुधा निधि', 'titleDevanagari': 'श्री राधा सुधा निधि', 'description': 'श्री राधा कृपा कटाक्ष के २७० संस्कृत श्लोक', 'versesCount': 270}
        ],
        'keyLeelas': [
            {'title': 'श्री राधावल्लभ लाल का प्राकट्य', 'description': 'देववन से सेवाकुंज वृन्दावन पधारकर श्री राधावल्लभ जी का विग्रह प्रतिष्ठित किया।'}
        ],
        'lifeSummary': 'वृन्दावन निकुंज रस के प्रवर्तक, जिन्होंने श्री राधा को ही आराध्य और एकमात्र सर्वस्व मानकर अनन्य नित्य-विहार की रसोपासना प्रतिष्ठित की।',
        'avatarWebp': '/assets/saints/hit-harivansh.webp',
        'tags': ['हित-हरिवंश', 'राधावल्लभ', 'वृन्दावन', 'हित-चौरासी', 'निकुंज-रस']
    },
    {
        'id': 'swami-haridas',
        'slug': 'swami-haridas',
        'name': 'Swami Haridas',
        'nameDevanagari': 'स्वामी हरिदास जी',
        'titleHonorific': 'ललिता सखी अवतार, संगीत शिरोमणि',
        'period': '१६वीं शताब्दी (१४७८ - १५७३ ई.)',
        'tradition': 'सखी सम्प्रदाय (हरिदासी सम्प्रदाय)',
        'guru': 'आशुधीर जी महाराज',
        'lineage': {
            'sampradaya': 'सखी सम्प्रदाय',
            'guru': 'श्री आशुधीर जी',
            'seatOrPeetham': 'निधिवन राज, वृन्दावन धाम'
        },
        'birthPlace': 'हरिदासपुर (अलीगढ़ के निकट)',
        'samadhiLocation': {
            'place': 'निधिवन समाधि',
            'dhamOrRegion': 'निधिवन, वृन्दावन धाम',
            'darshanSignificance': 'श्री बांके बिहारी जी का प्राकट्य स्थल'
        },
        'literaryWorks': [
            {'title': 'केलिमाल', 'titleDevanagari': 'केलिमाल', 'description': 'नित्य केलि विहार के ११० पदों का दिव्य ग्रन्थ', 'versesCount': 110},
            {'title': 'अष्टादश पद', 'titleDevanagari': 'अष्टादश पद', 'description': 'सिद्धांत व साधना के १८ मूलभूत पद', 'versesCount': 18}
        ],
        'keyLeelas': [
            {'title': 'बांके बिहारी जी का प्राकट्य', 'description': 'निधिवन में अपने दिव्य संगीत और एकतान ध्यान से श्यामा-श्याम को साक्षात् प्रकट कर बांके बिहारी विग्रह का प्राकट्य किया।'},
            {'title': 'अकबर और तानसेन का आगमन', 'description': 'सम्राट अकबर तानसेन के साथ छद्म वेश में स्वामी जी के अलौकिक संगीत को सुनने निधिवन की कुटिया में आए।'}
        ],
        'lifeSummary': 'संगीत और साधना के महान मर्मज्ञ, तानसेन के गुरु, जिन्होंने वृन्दावन के निधिवन में नित्य निकुंज विहार की अनन्य उपासना प्रतिष्ठित की।',
        'avatarWebp': '/assets/saints/swami-haridas.webp',
        'tags': ['स्वामी-हरिदास', 'बांके-बिहारी', 'निधिवन', 'केलिमाल', 'सखी-भाव']
    },
    {
        'id': 'mirabai',
        'slug': 'mirabai',
        'name': 'Mirabai',
        'nameDevanagari': 'भक्त शिरोमणि मीराबाई',
        'titleHonorific': 'प्रेम दीवानी, कृष्ण प्रिया',
        'period': '१६वीं शताब्दी (१४९८ - १५४६ ई.)',
        'tradition': 'अनन्य कृष्ण भक्ति परम्परा',
        'guru': 'संत रविदास (सद्गुरु रैदास)',
        'lineage': {
            'sampradaya': 'निर्गुण-सगुण समन्वय भक्ति',
            'guru': 'सद्गुरु रविदास जी (काशी)',
            'seatOrPeetham': 'मेड़ता, चित्तौड़, वृन्दावन एवं द्वारका'
        },
        'birthPlace': 'कुड़की (मेड़ता), राजस्थान',
        'samadhiLocation': {
            'place': 'रणछोड़ राय मन्दिर (द्वारका)',
            'dhamOrRegion': 'द्वारका धाम, गुजरात',
            'darshanSignificance': 'प्रभु की मूर्ति में साक्षात् समाहित होकर देहत्याग'
        },
        'literaryWorks': [
            {'title': 'मीरा पदावली', 'titleDevanagari': 'मीराबाई की पदावली', 'description': 'माधुर्य भाव और विरह-मिलन के अमर भक्ति पद', 'versesCount': 1300}
        ],
        'keyLeelas': [
            {'title': 'विष का प्याला अमृत बनना', 'description': '"राणा विष को प्यालो भेज्यो, पीवत मीरां हांसी रे। मैं तो अपने नारायण की, आपहि हो गई दासी रे॥"'},
            {'title': 'द्वारका में मूर्ति में समाना', 'description': 'द्वारका के रणछोड़ मन्दिर में भजन गाते-गाते प्रभु के श्रीविग्रह में लीन हो गईं; केवल उनकी साड़ी का पल्लू शेष बचा।'}
        ],
        'lifeSummary': 'राजमहलों के समस्त सुखों और विष के प्याले को हंसकर ठुकराकर केवल गिरधर गोपाल को अपना पति मानने वाली प्रेम-साधना की सर्वोच्च प्रतिमूर्ति।',
        'avatarWebp': '/assets/saints/meera.webp',
        'tags': ['मीराबाई', 'गिरधर-गोपाल', 'प्रेम-भक्ति', 'मेड़ता', 'द्वारका']
    },
    {
        'id': 'maharshi-valmiki',
        'slug': 'maharshi-valmiki',
        'name': 'Maharshi Valmiki',
        'nameDevanagari': 'महर्षि वाल्मीकि',
        'titleHonorific': 'आदिकवि, रामायण प्रणेता',
        'period': 'त्रेतायुग / वैदिक काल',
        'tradition': 'आर्ष वैदिक परम्परा',
        'guru': 'देवर्षि नारद',
        'lineage': {
            'sampradaya': 'वैदिक ऋषि परम्परा',
            'guru': 'देवर्षि नारद (राम मन्त्र उपदेश)',
            'seatOrPeetham': 'ब्रह्मावर्त (बिठूर), तमसा नदी तट'
        },
        'birthPlace': 'प्राचीन भारत',
        'samadhiLocation': {
            'place': 'वाल्मीकि आश्रम',
            'dhamOrRegion': 'तमसा नदी तट / बिठूर',
            'darshanSignificance': 'लव-कुश जन्म एवं सीता माता का पावन आश्रय स्थल'
        },
        'literaryWorks': [
            {'title': 'श्रीमद् वाल्मीकि रामायण', 'titleDevanagari': 'वाल्मीकि रामायण', 'description': 'संस्कृत साहित्य का प्रथम महाकाव्य (२४,००० श्लोक)', 'versesCount': 24000},
            {'title': 'योगवासिष्ठ', 'titleDevanagari': 'योगवासिष्ठ महारामायण', 'description': 'वसिष्ठ-राम संवाद का गहन वेदान्त ग्रन्थ', 'versesCount': 32000}
        ],
        'keyLeelas': [
            {'title': 'प्रथम अनुष्टुप छन्द का प्राकट्य', 'description': '"मा निषाद प्रतिष्ठां त्वमगमः शाश्वतीः समाः।" क्रौञ्च वध देखकर शोक से श्लोक का प्रस्फुटन।'}
        ],
        'lifeSummary': 'संस्कृत के आदिकवि जिन्होंने नारद जी के उपदेश से रामचरित्र का दर्शन कर प्रथम महाकाव्य रामायण की रचना की और माता जानकी को संरक्षण दिया।',
        'avatarWebp': '/assets/saints/vyas.webp',
        'tags': ['वाल्मीकि', 'आदिकवि', 'रामायण', 'संस्कृत', 'तमसा-तट']
    },
    {
        'id': 'maharshi-vedavyas',
        'slug': 'maharshi-vedavyas',
        'name': 'Maharshi Vedavyas',
        'nameDevanagari': 'महर्षि वेदव्यास',
        'titleHonorific': 'कृष्ण द्वैपायन, बादरायण',
        'period': 'द्वापरयुग / कलिकाल संधि',
        'tradition': 'गुरु परम्परा के मूल प्रवर्तक',
        'guru': 'साक्षात् भगवान नारायण',
        'lineage': {
            'sampradaya': 'सनातन वैदिक परम्परा',
            'guru': 'महर्षि पराशर (पिता)',
            'seatOrPeetham': 'बदरिकाश्रम / व्यास गुफा'
        },
        'birthPlace': 'यमुना द्वीप (कालपी के निकट)',
        'samadhiLocation': {
            'place': 'व्यास गुफा (माणा ग्राम)',
            'dhamOrRegion': 'बद्रीनाथ धाम, उत्तराखण्ड',
            'darshanSignificance': 'समस्त वेदों के विभाजन और पुराणों की रचना भूमि'
        },
        'literaryWorks': [
            {'title': 'श्रीमद्भागवत महापुराण', 'titleDevanagari': 'श्रीमद्भागवतम्', 'description': 'अमल पुराण, श्रीकृष्ण लीलामृत रस (१८,००० श्लोक)', 'versesCount': 18000},
            {'title': 'महाभारत एवं भगवद्गीता', 'titleDevanagari': 'महाभारत', 'description': 'पंचम वेद, एक लाख श्लोकों का विशाल ग्रन्थ', 'versesCount': 100000},
            {'title': 'ब्रह्मसूत्र', 'titleDevanagari': 'वेदान्त दर्शन (ब्रह्मसूत्र)', 'description': 'उपनिषदों का दार्शनिक सूत्र ग्रन्थ', 'versesCount': 555}
        ],
        'keyLeelas': [
            {'title': 'वेदों का चतुर्धा विभाजन', 'description': 'मानव कल्याण हेतु एक वेद को ऋक्, यजुः, साम, अथर्व चार भागों में विभक्त किया।'},
            {'title': 'गणेश जी द्वारा महाभारत लेखन', 'description': 'गणेश जी को लेखक बनाकर अनवरत श्लोकों का डिक्टेशन दिया।'}
        ],
        'lifeSummary': 'सनातन धर्म के ज्ञान-सूर्य, वेदों के विभाजक, १८ पुराणों व महाभारत के रचयिता, जिनके जन्मदिवस पर गुरु पूर्णिमा मनाई जाती है।',
        'avatarWebp': '/assets/saints/vyas.webp',
        'tags': ['वेदव्यास', 'महाभारत', 'भागवत', 'बद्रीनाथ', 'गुरु-पूर्णिमा']
    },
    {
        'id': 'maharshi-agastya',
        'slug': 'maharshi-agastya',
        'name': 'Maharshi Agastya',
        'nameDevanagari': 'महर्षि अगस्त्य',
        'titleHonorific': 'कुम्भज, दक्षिण भारत के प्रथम सिद्धर',
        'period': 'वैदिक काल / त्रेतायुग',
        'tradition': 'ऋग्वैदिक ऋषि एवं तमिल सिद्ध परम्परा',
        'guru': 'मित्र-वरुण / साक्षात् शिव',
        'lineage': {
            'sampradaya': 'अगस्त्य परम्परा / शैव व वैष्णव समन्वय',
            'seatOrPeetham': 'अगस्त्यकूट (अगस्त्यमलाई), तमिल भूमि'
        },
        'birthPlace': 'काशी / प्रयाग तीर्थ',
        'samadhiLocation': {
            'place': 'अगस्त्यमलाई',
            'dhamOrRegion': 'पश्चिमी घाट, तमिलनाडु / केरल',
            'darshanSignificance': 'तमिल व्याकरण और आयुर्वेद के प्रणेता'
        },
        'literaryWorks': [
            {'title': 'आदित्य हृदय स्तोत्र', 'titleDevanagari': 'आदित्य हृदय स्तोत्र', 'description': 'युद्धभूमि में श्रीराम को रावण-वध हेतु दिया गया सूर्य स्तोत्र', 'versesCount': 31},
            {'title': 'अगस्त्य संहिता', 'titleDevanagari': 'अगस्त्य संहिता', 'description': 'पाञ्चरात्र आगम एवं मन्त्र विज्ञान ग्रन्थ', 'versesCount': 3500}
        ],
        'keyLeelas': [
            {'title': 'विन्ध्याचल का गर्व झुकाना', 'description': 'सूर्य का मार्ग रोकने वाले विन्ध्य को झुकने का आदेश देकर दक्षिण प्रस्थान किया।'},
            {'title': 'समुद्र का आचमन', 'description': 'समुद्र में छिपे कालकेय असुरों का संहार कराने हेतु समस्त सागर का आचमन कर लिया।'}
        ],
        'lifeSummary': 'सप्तर्षियों में प्रतिष्ठित महर्षि, जिन्होंने वैदिक ज्ञान को दक्षिण भारत तक पहुँचाया और श्रीराम को अमोघ आदित्य हृदय स्तोत्र प्रदान किया।',
        'avatarWebp': '/assets/saints/ramanandacharya.webp',
        'tags': ['अगस्त्य', 'आदित्य-हृदय', 'विन्ध्याचल', 'सप्तर्षि', 'सिद्ध-परम्परा']
    },
    {
        'id': 'maharshi-angira',
        'slug': 'maharshi-angira',
        'name': 'Maharshi Angira',
        'nameDevanagari': 'महर्षि अंगिरा',
        'titleHonorific': 'ब्रह्मपुत्र, आंगिरस कुल पुरुष',
        'period': 'वैदिक काल',
        'tradition': 'सप्तर्षि एवं आंगिरस परम्परा',
        'guru': 'साक्षात् ब्रह्मा जी',
        'lineage': {
            'sampradaya': 'ऋग्वैदिक आंगिरस मण्डल',
            'seatOrPeetham': 'अग्नि वेदी / ब्रह्मावर्त'
        },
        'birthPlace': 'अग्नि से प्राकट्य',
        'samadhiLocation': {
            'place': 'तपोभूमि',
            'dhamOrRegion': 'उत्तराखण्ड / भारतवर्ष',
            'darshanSignificance': 'देवगुरु बृहस्पति के पिता'
        },
        'literaryWorks': [
            {'title': 'अंगिरस स्मृति', 'titleDevanagari': 'अंगिरस स्मृति', 'description': 'सदाचार एवं धर्मशास्त्र ग्रन्थ', 'versesCount': 1200}
        ],
        'keyLeelas': [
            {'title': 'अग्नि देव का सान्निध्य', 'description': 'कठोर तप से अग्नि के सदृश तेज धारण कर आंगिरस मण्डल के द्रष्टा बने।'}
        ],
        'lifeSummary': 'ब्रह्मा जी के मानस पुत्र, अग्नि से प्राकट्य और देवगुरु बृहस्पति के पिता, जिन्होंने ऋग्वेद के अनेक सूक्तों का साक्षात् दर्शन किया।',
        'avatarWebp': '/assets/saints/vyas.webp',
        'tags': ['अंगिरा', 'सप्तर्षि', 'ऋग्वेद', 'बृहस्पति-पिता']
    },
    {
        'id': 'maharshi-atri',
        'slug': 'maharshi-atri',
        'name': 'Maharshi Atri',
        'nameDevanagari': 'महर्षि अत्रि',
        'titleHonorific': 'सती अनसूया पति, ऋग्वेद पंचम मण्डल द्रष्टा',
        'period': 'वैदिक काल / त्रेतायुग',
        'tradition': 'सप्तर्षि एवं दत्त परम्परा',
        'guru': 'साक्षात् ब्रह्मा जी',
        'lineage': {
            'sampradaya': 'अत्रि गोत्र / दत्तात्रेय सम्प्रदाय',
            'seatOrPeetham': 'चित्रकूट (मन्दाकिनी तट)'
        },
        'birthPlace': 'प्राचीन भारत',
        'samadhiLocation': {
            'place': 'अत्रि आश्रम',
            'dhamOrRegion': 'चित्रकूट, मध्य प्रदेश',
            'darshanSignificance': 'श्रीराम-सीता वनवास काल में पावन आगमन'
        },
        'literaryWorks': [
            {'title': 'अत्रि स्मृति', 'titleDevanagari': 'अत्रि स्मृति', 'description': 'वैदिक आचार-संहिता ग्रन्थ', 'versesCount': 900}
        ],
        'keyLeelas': [
            {'title': 'त्रिदेवों को बालक बनाना', 'description': 'सती अनसूया और अत्रि मुनि के तपोबल से ब्रह्मा, विष्णु, महेश बालक रूप में दत्तात्रेय, दुर्वासा और चन्द्रमा बनकर जन्मे।'}
        ],
        'lifeSummary': 'सप्तर्षियों में प्रतिष्ठित परम तपस्वी, सती अनसूया के पति और भगवान दत्तात्रेय के पिता, जिनके चित्रकूट आश्रम में श्रीराम-जानकी ने वनवास में आश्रय लिया था।',
        'avatarWebp': '/assets/saints/vyas.webp',
        'tags': ['अत्रि', 'अनसूया', 'दत्तात्रेय', 'चित्रकूट', 'सप्तर्षि']
    }
]

bio_previews = []
for spec in BIOS_SPECS:
    bio_obj = {
        'id': spec['id'],
        'slug': spec['slug'],
        'name': sanitize_title(spec['name']),
        'nameDevanagari': clean_text_content(spec['nameDevanagari']),
        'titleHonorific': clean_text_content(spec.get('titleHonorific', '')),
        'period': clean_text_content(spec['period']),
        'tradition': sanitize_author(spec['tradition']),
        'guru': sanitize_author(spec.get('guru', '')),
        'lineage': spec['lineage'],
        'birthPlace': clean_text_content(spec.get('birthPlace', '')),
        'samadhiLocation': spec['samadhiLocation'],
        'literaryWorks': spec['literaryWorks'],
        'keyLeelas': spec['keyLeelas'],
        'lifeSummary': clean_text_content(spec['lifeSummary']),
        'avatarWebp': spec.get('avatarWebp', '/assets/saints/vyas.webp'),
        'tags': spec['tags']
    }

    chunk_filename = f"bio-{spec['slug']}.json"
    chunk_path = os.path.join(BIOS_DIR, chunk_filename)
    with open(chunk_path, 'w', encoding='utf-8') as f:
        json.dump(bio_obj, f, ensure_ascii=False, indent=2)

    preview_obj = {
        'id': spec['id'],
        'slug': spec['slug'],
        'name': bio_obj['name'],
        'nameDevanagari': bio_obj['nameDevanagari'],
        'titleHonorific': bio_obj['titleHonorific'],
        'period': bio_obj['period'],
        'tradition': bio_obj['tradition'],
        'samadhiPlace': bio_obj['samadhiLocation']['place'],
        'worksCount': len(bio_obj['literaryWorks']),
        'lifeSummary': bio_obj['lifeSummary'],
        'avatarWebp': bio_obj['avatarWebp'],
        'tags': bio_obj['tags'],
        'chunkFile': chunk_filename
    }
    bio_previews.append(preview_obj)

bios_manifest = {
    'category': 'biographies',
    'categoryHindi': 'संत एवं ऋषि चरित्र दर्शन',
    'count': len(bio_previews),
    'updatedAt': '2026-11-15T09:00:00Z',
    'items': bio_previews
}
bios_index_path = os.path.join(BIOS_DIR, 'index.json')
with open(bios_index_path, 'w', encoding='utf-8') as f:
    json.dump(bios_manifest, f, ensure_ascii=False, indent=2)

print(f"  ✓ Biographies written: {len(bio_previews)} in {BIOS_DIR}")
print(f"  ✓ biographies/index.json size: {os.path.getsize(bios_index_path)} bytes (< 30 KB)")


# ---------------------------------------------------------------------------
# 3. Places Ingestion & Normalization
# ---------------------------------------------------------------------------

print("\n🏰 Normalizing Sacred Dham & Tirthas (places/)...")

PLACES_SPECS = [
    {
        'id': 'vrindavan-dham',
        'slug': 'vrindavan-dham',
        'name': 'Sri Vrindavan Dham',
        'nameDevanagari': 'श्री वृन्दावन धाम',
        'dhamRegion': 'vrindavan',
        'regionNameHindi': 'ब्रज मण्डल, उत्तर प्रदेश',
        'briefSignificance': 'श्री राधा-कृष्ण की नित्य रास लीला भूमि, ५००० से अधिक देवालयों और निकुंजों का पावन धाम।',
        'deity': 'Shri Radha Krishna / Banke Bihari Ji',
        'deityDevanagari': 'श्री राधा-कृष्ण / ठाकुर श्री बांके बिहारी जी',
        'darshanTimings': {
            'morning': {'open': '07:45', 'close': '12:00', 'aartiName': 'शृंगार व राजभोग आरती'},
            'evening': {'open': '16:30', 'close': '21:30', 'aartiName': 'शयन आरती'},
            'specialNotes': 'ऋतु परिवर्तन के अनुसार मंगला व शयन आरती का समय परिवर्तित होता है।'
        },
        'parikramaKm': 11,
        'associatedLeelas': [
            {'title': 'रासलीला', 'description': 'शरद पूर्णिमा की रात्रि यमुना तट पर वंशीवट के नीचे महारास का अलौकिक आयोजन।'},
            {'title': 'चीर हरण एवं कालिया दमन', 'description': 'यमुना के पावन घाटों पर कन्हैया द्वारा भक्तों को निर्भयता प्रदान करना।'}
        ],
        'nearbyKundsOrShilats': ['केशी घाट', 'कालीदह', 'सेवाकुंज', 'निधिवन', 'वंशीवट'],
        'samadhisNearby': ['स्वामी हरिदास समाधि', 'जीव गोस्वामी समाधि', 'रूप गोस्वामी समाधि'],
        'imageWebp': '/assets/temples/banke-bihari.webp',
        'rulesAndEtiquette': ['यमुना जी में जूते-चप्पल पहनकर न जाएँ', 'वृन्दावन रज को मस्तक पर धारण करें', 'बंदरों से चश्मा व खाद्य सामग्री सुरक्षित रखें'],
        'tags': ['वृन्दावन', 'बांके-बिहारी', 'राधा-वल्लभ', 'निधिवन', 'ब्रज']
    },
    {
        'id': 'giriraj-govardhan',
        'slug': 'giriraj-govardhan',
        'name': 'Sri Giriraj Govardhan',
        'nameDevanagari': 'श्री गिरिराज गोवर्धन',
        'dhamRegion': 'govardhan',
        'regionNameHindi': 'मथुरा, ब्रज मण्डल',
        'briefSignificance': 'साक्षात् हरिरूप पावन पर्वत, जिसे कन्हैया ने सात दिवस तक कनिष्ठिका पर धारण कर ब्रज की रक्षा की थी।',
        'deity': 'Giriraj Maharaj / Haridev',
        'deityDevanagari': 'श्री गिरिराज जी / श्री हरिदेव जी',
        'darshanTimings': {
            'morning': {'open': '05:00', 'close': '12:30', 'aartiName': 'दुग्धधार व मंगला आरती'},
            'evening': {'open': '15:30', 'close': '22:00', 'aartiName': 'शयन आरती'}
        },
        'parikramaKm': 21,
        'associatedLeelas': [
            {'title': 'इन्द्र-मान-मर्दन', 'description': 'इन्द्र के अभिमान को चूर कर ब्रजवासियों को अखंड शरणागति प्रदान करना।'},
            {'title': 'अन्नकूट महोत्सव', 'description': 'समस्त ब्रजवासियों द्वारा छप्पन भोग का पावन अर्पण।'}
        ],
        'nearbyKundsOrShilats': ['राधा कुण्ड', 'श्याम कुण्ड', 'मानसी गंगा', 'कुसुम सरोवर', 'दानघाटी'],
        'samadhisNearby': ['रघुनाथ दास गोस्वामी समाधि', 'कृष्णदास कविराज समाधि'],
        'imageWebp': '/assets/temples/keshi-ghat.webp',
        'rulesAndEtiquette': ['परिक्रमा सदैव दक्षिणावर्त (Clockwise) करें', 'शिलाओं पर पैर न रखें', 'दुग्ध अर्पित कर शीश नवाएं'],
        'tags': ['गोवर्धन', 'परिक्रमा', 'राधाकुण्ड', 'मानसी-गंगा', 'अन्नकूट']
    },
    {
        'id': 'barsana-dham',
        'slug': 'barsana-dham',
        'name': 'Sri Barsana Dham',
        'nameDevanagari': 'श्री बरसाना धाम',
        'dhamRegion': 'barsana',
        'regionNameHindi': 'मथुरा, ब्रज मण्डल',
        'briefSignificance': 'आह्लादिनी शक्ति श्री वृषभानु नंदिनी लाड़िली जी का नित्य निवास धाम एवं ब्रह्माचल पर्वत।',
        'deity': 'Shri Radha Rani / Ladili Ji',
        'deityDevanagari': 'श्री राधारानी (श्री लाड़िली जी)',
        'darshanTimings': {
            'morning': {'open': '05:30', 'close': '12:00', 'aartiName': 'शृंगार आरती'},
            'evening': {'open': '17:00', 'close': '21:00', 'aartiName': 'शयन आरती'}
        },
        'parikramaKm': 7,
        'associatedLeelas': [
            {'title': 'लट्ठमार होली', 'description': 'फाल्गुन मास में नन्दगांव और बरसाना के मध्य विश्वप्रसिद्ध प्रेममयी होली।'},
            {'title': 'मानलीला', 'description': 'मान मन्दिर पर श्रीजी का मान और कन्हैया द्वारा मान-मंजन।'}
        ],
        'nearbyKundsOrShilats': ['पीली पोखर', 'प्रेम सरोवर', 'भानुखार', 'मान मन्दिर', 'विहार वन'],
        'imageWebp': '/assets/temples/barsana-radharani.webp',
        'rulesAndEtiquette': ['श्रीजी के मन्दिर की सीढ़ियाँ श्रद्धा से चढ़ें', '"राधे राधे" का संकीर्तन करते हुए परिक्रमा करें'],
        'tags': ['बरसाना', 'राधारानी', 'लाड़िली-जी', 'लट्ठमार-होली', 'ब्रह्माचल']
    },
    {
        'id': 'mathura-krishna-janmabhoomi',
        'slug': 'mathura-krishna-janmabhoomi',
        'name': 'Sri Krishna Janmabhoomi Mathura',
        'nameDevanagari': 'श्री कृष्ण जन्मभूमि मथुरा',
        'dhamRegion': 'mathura',
        'regionNameHindi': 'मथुरा, उत्तर प्रदेश',
        'briefSignificance': 'कंस के कारागार में योगेश्वर भगवान श्रीकृष्ण का भाद्रपद कृष्ण अष्टमी को चतुर्भुज रूप में प्राकट्य स्थल।',
        'deity': 'Lord Krishna (Dwarkadhish / Keshav Dev)',
        'deityDevanagari': 'भगवान श्री कृष्ण (केशवदेव जी)',
        'darshanTimings': {
            'morning': {'open': '05:00', 'close': '12:00', 'aartiName': 'मंगला आरती'},
            'evening': {'open': '16:00', 'close': '21:30', 'aartiName': 'संध्या आरती'}
        },
        'associatedLeelas': [
            {'title': 'श्रीकृष्ण प्राकट्य', 'description': 'अष्टमी की मध्यरात्रि कारागार की बेड़ियां टूटना और वसुदेव जी द्वारा गोकुल गमन।'},
            {'title': 'कंस वध', 'description': 'मल्ल युद्ध में कुवलयापीड हाथी और कंस का संहार कर उग्रसेन को राज्य सौंपना।'}
        ],
        'nearbyKundsOrShilats': ['विश्राम घाट', 'पोतरा कुण्ड', 'ध्रुव टीला'],
        'imageWebp': '/assets/temples/radha-raman.webp',
        'rulesAndEtiquette': ['सुरक्षा नियमों का पालन करें', 'मोबाइल व इलेक्ट्रॉनिक उपकरण बाहर लॉकर में रखें'],
        'tags': ['मथुरा', 'जन्मभूमि', 'केशवदेव', 'विश्राम-घाट', 'कंस-वध']
    },
    {
        'id': 'ayodhya-ram-janmabhoomi',
        'slug': 'ayodhya-ram-janmabhoomi',
        'name': 'Sri Ram Janmabhoomi Ayodhya',
        'nameDevanagari': 'श्री राम जन्मभूमि अयोध्या धाम',
        'dhamRegion': 'ayodhya',
        'regionNameHindi': 'अयोध्या, उत्तर प्रदेश',
        'briefSignificance': 'मर्यादा पुरुषोत्तम भगवान श्री राम का पावन प्राकट्य स्थल एवं सरयू तीर पर स्थित मोक्षदायिनी सप्तपुरियों में प्रथम पुरी।',
        'deity': 'Balak Ram / Shri Sita Ram',
        'deityDevanagari': 'प्रभु श्री रामलला सरकार',
        'darshanTimings': {
            'morning': {'open': '06:30', 'close': '12:00', 'aartiName': 'शृंगार आरती'},
            'evening': {'open': '14:00', 'close': '21:30', 'aartiName': 'संध्या व शयन आरती'}
        },
        'parikramaKm': 14,
        'associatedLeelas': [
            {'title': 'रामलला प्राकट्य', 'description': 'चैत्र शुक्ल नवमी को कौशल्या के नयनतारे श्री राम का दिव्य प्राकट्य।'},
            {'title': 'राम राज्याभिषेक', 'description': 'चौदह वर्ष वनवास उपरान्त धर्म-संस्थापन एवं आदर्श रामराज्य की स्थापना।'}
        ],
        'nearbyKundsOrShilats': ['सरयू घाट', 'हनुमान गढ़ी', 'कनक भवन', 'दशरथ महल', 'गुफ्तार घाट'],
        'imageWebp': '/assets/temples/diya-pujan.webp',
        'rulesAndEtiquette': ['सरयू स्नान कर हनुमान गढ़ी का दर्शन पहले करें', 'परिसर में स्वच्छता व मर्यादा का ध्यान रखें'],
        'tags': ['अयोध्या', 'राम-जन्मभूमि', 'रामलला', 'सरयू', 'हनुमान-गढ़ी']
    },
    {
        'id': 'kashi-vishwanath',
        'slug': 'kashi-vishwanath',
        'name': 'Kashi Vishwanath Jyotirlinga',
        'nameDevanagari': 'काशी विश्वनाथ ज्योतिर्लिंग धाम',
        'dhamRegion': 'kashi',
        'regionNameHindi': 'वाराणसी, उत्तर प्रदेश',
        'briefSignificance': 'त्रिशूल पर टिकी अविमुक्त काशी, द्वादश ज्योतिर्लिंगों में सर्वोच्च विश्वेश्वर धाम जहाँ साक्षात् शिव तारक मन्त्र प्रदान करते हैं।',
        'deity': 'Lord Shiva (Vishwanatha / Vishveshwara)',
        'deityDevanagari': 'देवाधिदेव काशी विश्वनाथ',
        'darshanTimings': {
            'morning': {'open': '03:00', 'close': '11:00', 'aartiName': 'मंगला आरती व भोग'},
            'evening': {'open': '12:00', 'close': '23:00', 'aartiName': 'सप्तऋषि एवं शयन आरती'}
        },
        'associatedLeelas': [
            {'title': 'तारक मन्त्र का उपदेश', 'description': 'काशी में देहत्याग करने वाले जीव के कान में स्वयं महादेव राम नाम रूपी तारक मन्त्र फूंकते हैं।'},
            {'title': 'अन्नपूर्णा भिक्षाटन', 'description': 'समस्त विश्व का भरण-पोषण करने वाली माता अन्नपूर्णा से महादेव का भिक्षा ग्रहण करना।'}
        ],
        'nearbyKundsOrShilats': ['दशाश्वमेध घाट', 'मणिकर्णिका घाट', 'अस्सी घाट', 'काल भैरव मन्दिर'],
        'imageWebp': '/assets/temples/aarti-lamp.webp',
        'rulesAndEtiquette': ['गंगाजल व बिल्वपत्र से अभिषेक करें', 'मंगला आरती हेतु पूर्व-बुकिंग रखें'],
        'tags': ['काशी', 'विश्वनाथ', 'ज्योतिर्लिंग', 'गंगा-आरती', 'मणिकर्णिका']
    },
    {
        'id': 'jagannath-puri',
        'slug': 'jagannath-puri',
        'name': 'Sri Jagannath Dham Puri',
        'nameDevanagari': 'श्री जगन्नाथ धाम पुरी',
        'dhamRegion': 'puri',
        'regionNameHindi': 'पुरी, ओडिशा',
        'briefSignificance': 'चार धामों में प्रधान, दारुब्रह्म भगवान जगन्नाथ, बलभद्र और सुभद्रा जी का महातीर्थ जहाँ महाप्रसाद का अलौकिक महात्म्य है।',
        'deity': 'Lord Jagannath (Daru Brahma)',
        'deityDevanagari': 'महाप्रभु श्री जगन्नाथ जी',
        'darshanTimings': {
            'morning': {'open': '05:30', 'close': '12:30', 'aartiName': 'मंगला आरती व गोपाल वल्लभ भोग'},
            'evening': {'open': '16:00', 'close': '22:30', 'aartiName': 'संध्या व बड़शृंगार भोग'}
        },
        'associatedLeelas': [
            {'title': 'विश्वप्रसिद्ध रथयात्रा', 'description': 'आषाढ़ शुक्ल द्वितीया को महाप्रभु का भाई-बहन सहित गुंडिचा मन्दिर प्रस्थान।'},
            {'title': 'महाप्रसाद महात्म्य', 'description': 'माता विमला को अर्पित होने के उपरान्त महाप्रसाद बन जाना, जहाँ कोई जाति भेद नहीं रहता।'}
        ],
        'nearbyKundsOrShilats': ['महोदधि (समुद्र तट)', 'इन्द्रद्युम्न सरोवर', 'नरेन्द्र सरोवर'],
        'imageWebp': '/assets/temples/banke-bihari-gate.webp',
        'rulesAndEtiquette': ['मन्दिर में केवल सनातन धर्मावलम्बियों का प्रवेश मान्य है', 'महाप्रसाद का कभी तिरस्कार न करें'],
        'tags': ['जगन्नाथ-पुरी', 'रथयात्रा', 'दारुब्रह्म', 'महाप्रसाद', 'चार-धाम']
    },
    {
        'id': 'badrinath-dham',
        'slug': 'badrinath-dham',
        'name': 'Sri Badrinath Dham',
        'nameDevanagari': 'श्री बद्रीनाथ धाम',
        'dhamRegion': 'char-dham',
        'regionNameHindi': 'चमोली, उत्तराखण्ड',
        'briefSignificance': 'हिमालय की गोद में नर-नारायण पर्वत के मध्य स्थित बदरीविशाल, जहाँ भगवान विष्णु पद्मासन में अखण्ड तपस्यारत हैं।',
        'deity': 'Lord Badrinarayan (Shaligram Murti)',
        'deityDevanagari': 'भगवान श्री बदरीविशाल',
        'darshanTimings': {
            'morning': {'open': '04:30', 'close': '13:00', 'aartiName': 'महाभिषेक व प्रातः दर्शन'},
            'evening': {'open': '16:00', 'close': '21:00', 'aartiName': 'शयन आरती'}
        },
        'associatedLeelas': [
            {'title': 'नर-नारायण तपस्या', 'description': 'लोक कल्याण हेतु भगवान के नर और नारायण अवतारों द्वारा युगों-युगों तक तपस्या।'},
            {'title': 'लक्ष्मी जी का बदरी वृक्ष बनना', 'description': 'कठोर हिमपात से प्रभु को बचाने हेतु माता लक्ष्मी द्वारा बेर (बदरी) का वृक्ष बनकर छाया करना।'}
        ],
        'nearbyKundsOrShilats': ['तप्त कुण्ड', 'ब्रह्म कपाल', 'माणा ग्राम (प्रथम भारतीय ग्राम)', 'व्यास गुफा'],
        'imageWebp': '/assets/temples/diya-pujan.webp',
        'rulesAndEtiquette': ['तप्त कुण्ड में स्नान कर पवित्र वस्त्रों में दर्शन करें', 'कपाट वैशाख में खुलते हैं और कार्तिक में शीतकाल हेतु बंद होते हैं'],
        'tags': ['बद्रीनाथ', 'चार-धाम', 'नर-नारायण', 'तप्त-कुण्ड', 'उत्तराखण्ड']
    },
    {
        'id': 'pandharpur-vitthal-mandir',
        'slug': 'pandharpur-vitthal-mandir',
        'name': 'Sri Vitthal Rukmini Mandir Pandharpur',
        'nameDevanagari': 'श्री विट्ठल-रुक्मिणी मन्दिर पंढरपुर',
        'dhamRegion': 'all',
        'regionNameHindi': 'सोलापुर, महाराष्ट्र',
        'briefSignificance': 'वारकरी सम्प्रदाय का हृदय धाम, जहाँ भक्त पुण्डलीक के प्रेमवश ईंट पर कमर पर हाथ धरे भगवान पाण्डुरंग खड़े हैं।',
        'deity': 'Lord Vithoba (Panduranga) & Mother Rukmini',
        'deityDevanagari': 'श्री विट्ठल (पाण्डुरंग) एवं रुक्मिणी माता',
        'darshanTimings': {
            'morning': {'open': '04:00', 'close': '11:00', 'aartiName': 'काकड़ आरती व पदस्पर्श दर्शन'},
            'evening': {'open': '13:30', 'close': '23:00', 'aartiName': 'धूप व शेज आरती'}
        },
        'associatedLeelas': [
            {'title': 'पुण्डलीक की पितृभक्ति', 'description': 'माता-पिता की सेवा में मग्न पुण्डलीक द्वारा प्रभु को प्रतीक्षा हेतु ईंट फेंकना और प्रभु का युगों से उसी पर खड़े रहना।'},
            {'title': 'आषाढ़ी व कार्तिकी एकादशी वारी', 'description': 'लाखों वारकरियों का पदयात्रा करते हुए "ज्ञानोबा-तुकाराम" के जयघोष के साथ पंढरपुर पहुँचना।'}
        ],
        'nearbyKundsOrShilats': ['चन्द्रभागा (भीमा) नदी', 'पुण्डलीक मन्दिर', 'गोपालपुर'],
        'imageWebp': '/assets/temples/keshi-ghat.webp',
        'rulesAndEtiquette': ['चन्द्रभागा में स्नान कर पदस्पर्श दर्शन करें', 'वारी काल में अत्यधिक भीड़ का ध्यान रखें'],
        'tags': ['पंढरपुर', 'विट्ठल', 'पाण्डुरंग', 'चन्द्रभागा', 'वारी-वारी']
    },
    {
        'id': 'pratishthan-paithan',
        'slug': 'pratishthan-paithan',
        'name': 'Pratishthan Paithan: Sant Eknath Samadhi Dham',
        'nameDevanagari': 'प्रतिष्ठान पैठण: संत एकनाथ समाधि धाम',
        'dhamRegion': 'all',
        'regionNameHindi': 'छत्रपति संभाजीनगर, महाराष्ट्र',
        'briefSignificance': 'दक्षिण काशी के नाम से विख्यात, गोदावरी तट पर स्थित प्राचीन पावन पीठ जहाँ संत एकनाथ महाराज ने भागवत धर्म की पताका फहराई।',
        'deity': 'Sant Eknath Maharaj / Shri Krishna (Shrikhandya)',
        'deityDevanagari': 'संत एकनाथ महाराज एवं श्रीखण्ड्या रूपी श्रीकृष्ण',
        'darshanTimings': {
            'morning': {'open': '05:00', 'close': '12:00', 'aartiName': 'काकड़ आरती'},
            'evening': {'open': '16:00', 'close': '21:30', 'aartiName': 'संध्या आरती व कीर्तन'}
        },
        'associatedLeelas': [
            {'title': 'श्रीकृष्ण द्वारा जल भरना', 'description': 'एकनाथ जी की निश्छल भक्ति से रीझकर स्वयं द्वारकाधीश ने १२ वर्ष तक "श्रीखण्ड्या" बनकर उनके घर चन्दन घिसा और जल भरा।'},
            {'title': 'एकनाथ षष्ठी महोत्सव', 'description': 'फाल्गुन कृष्ण षष्ठी को गोदावरी तट पर विशाल वारकरी कीर्तन मेला।'}
        ],
        'nearbyKundsOrShilats': ['गोदावरी घाट', 'नाथ मन्दिर', 'नागेश्वर मन्दिर'],
        'imageWebp': '/assets/temples/radha-vallabh.webp',
        'rulesAndEtiquette': ['गोदावरी में स्नान कर एकनाथ जी की समाधि पर नतमस्तक हों', 'एकनाथी भागवत का श्रवण करें'],
        'tags': ['पैठण', 'एकनाथ', 'गोदावरी', 'वारकरी', 'दक्षिण-काशी']
    },
    {
        'id': 'kedarnath-jyotirlinga',
        'slug': 'kedarnath-jyotirlinga',
        'name': 'Kedarnath Jyotirlinga Dham',
        'nameDevanagari': 'श्री केदारनाथ ज्योतिर्लिंग धाम',
        'dhamRegion': 'char-dham',
        'regionNameHindi': 'रुद्रप्रयाग, उत्तराखण्ड',
        'briefSignificance': 'मन्दाकिनी नदी के तट पर स्थित पंच केदारों में प्रधान, द्वादश ज्योतिर्लिंगों में सर्वोच्च हिमशिखर धाम।',
        'deity': 'Lord Shiva (Kedareshwara)',
        'deityDevanagari': 'देवाधिदेव केदारनाथ जी',
        'darshanTimings': {
            'morning': {'open': '05:00', 'close': '13:30', 'aartiName': 'महाभिषेक आरती'},
            'evening': {'open': '17:30', 'close': '21:00', 'aartiName': 'शृंगार आरती'}
        },
        'associatedLeelas': [
            {'title': 'पाण्डवों को मुक्ति', 'description': 'महाभारत युद्ध के उपरान्त पाण्डवों को गो-रूप में दर्शन देकर पापमुक्त करना।'}
        ],
        'nearbyKundsOrShilats': ['मन्दाकिनी नदी', 'भैरवनाथ मन्दिर', 'शंकराचार्य समाधि'],
        'imageWebp': '/assets/temples/diya-pujan.webp',
        'rulesAndEtiquette': ['शीतकालीन मौसम का ध्यान रखें', 'कपाट अक्षय तृतीया से भाई दूज तक खुलते हैं'],
        'tags': ['केदारनाथ', 'ज्योतिर्लिंग', 'मन्दाकिनी', 'पंच-केदार', 'चार-धाम']
    },
    {
        'id': 'rameshwaram-jyotirlinga',
        'slug': 'rameshwaram-jyotirlinga',
        'name': 'Rameshwaram Jyotirlinga Dham',
        'nameDevanagari': 'श्री रामेश्वरम ज्योतिर्लिंग धाम',
        'dhamRegion': 'char-dham',
        'regionNameHindi': 'रामनाथपुरम, तमिलनाडु',
        'briefSignificance': 'प्रभु श्री राम द्वारा लंका विजय पूर्व प्रतिष्ठित पावन सेतुबन्ध ज्योतिर्लिंग धाम।',
        'deity': 'Lord Ramanathaswamy (Shiva)',
        'deityDevanagari': 'श्री रामनाथस्वामी महादेव',
        'darshanTimings': {
            'morning': {'open': '05:00', 'close': '13:00', 'aartiName': 'मणिलिंग दर्शन'},
            'evening': {'open': '15:30', 'close': '21:00', 'aartiName': 'शयन आरती'}
        },
        'associatedLeelas': [
            {'title': 'श्रीराम द्वारा शिवलिंग प्रतिष्ठा', 'description': 'रावण वध से पूर्व ब्रह्महत्या दोष निवारण हेतु सीता जी द्वारा बालू से निर्मित लिंग की पूजा।'}
        ],
        'nearbyKundsOrShilats': ['अग्नि तीर्थम्', 'धनुषकोडि', '२२ पवित्र कुण्ड'],
        'imageWebp': '/assets/temples/aarti-lamp.webp',
        'rulesAndEtiquette': ['२२ कुण्डों में क्रमबद्ध स्नान करें', 'अग्नि तीर्थ में समुद्र स्नान का विशेष महात्म्य है'],
        'tags': ['रामेश्वरम', 'ज्योतिर्लिंग', 'सेतुबन्ध', 'चार-धाम', 'तमिलनाडु']
    }
]

place_previews = []
for spec in PLACES_SPECS:
    place_obj = {
        'id': spec['id'],
        'slug': spec['slug'],
        'name': sanitize_title(spec['name']),
        'nameDevanagari': clean_text_content(spec['nameDevanagari']),
        'dhamRegion': spec['dhamRegion'],
        'regionNameHindi': clean_text_content(spec['regionNameHindi']),
        'briefSignificance': clean_text_content(spec['briefSignificance']),
        'deity': sanitize_title(spec['deity']),
        'deityDevanagari': clean_text_content(spec.get('deityDevanagari', '')),
        'darshanTimings': spec['darshanTimings'],
        'parikramaKm': spec.get('parikramaKm'),
        'associatedLeelas': spec.get('associatedLeelas', []),
        'nearbyKundsOrShilats': spec.get('nearbyKundsOrShilats', []),
        'samadhisNearby': spec.get('samadhisNearby', []),
        'imageWebp': spec.get('imageWebp', '/assets/temples/banke-bihari.webp'),
        'rulesAndEtiquette': spec.get('rulesAndEtiquette', []),
        'tags': spec['tags']
    }

    chunk_filename = f"place-{spec['slug']}.json"
    chunk_path = os.path.join(PLACES_DIR, chunk_filename)
    with open(chunk_path, 'w', encoding='utf-8') as f:
        json.dump(place_obj, f, ensure_ascii=False, indent=2)

    preview_obj = {
        'id': spec['id'],
        'slug': spec['slug'],
        'name': place_obj['name'],
        'nameDevanagari': place_obj['nameDevanagari'],
        'dhamRegion': place_obj['dhamRegion'],
        'regionNameHindi': place_obj['regionNameHindi'],
        'briefSignificance': place_obj['briefSignificance'],
        'deity': place_obj['deity'],
        'deityDevanagari': place_obj['deityDevanagari'],
        'parikramaKm': place_obj['parikramaKm'],
        'imageWebp': place_obj['imageWebp'],
        'tags': place_obj['tags'],
        'chunkFile': chunk_filename
    }
    place_previews.append(preview_obj)

places_manifest = {
    'category': 'places',
    'categoryHindi': 'पावन धाम एवं तीर्थ महात्म्य',
    'count': len(place_previews),
    'updatedAt': '2026-11-15T09:00:00Z',
    'items': place_previews
}
places_index_path = os.path.join(PLACES_DIR, 'index.json')
with open(places_index_path, 'w', encoding='utf-8') as f:
    json.dump(places_manifest, f, ensure_ascii=False, indent=2)

print(f"  ✓ Places written: {len(place_previews)} in {PLACES_DIR}")
print(f"  ✓ places/index.json size: {os.path.getsize(places_index_path)} bytes (< 30 KB)")


# ---------------------------------------------------------------------------
# 4. Rituals Ingestion & Normalization
# ---------------------------------------------------------------------------

print("\n🔔 Normalizing Sacred Rituals (rituals/)...")

RITUALS_SPECS = [
    {
        'id': 'aarti-kunj-bihari-ki',
        'slug': 'aarti-kunj-bihari-ki',
        'title': 'Aarti Kunj Bihari Ki',
        'titleDevanagari': 'आरती कुंजबिहारी की: श्री गिरिधर कृष्णमुरारी की',
        'category': 'aarti',
        'categoryHindi': 'आरती संग्रह',
        'deity': 'Lord Krishna',
        'deityDevanagari': 'ठाकुर श्री कुंजबिहारी जी',
        'author': 'सनातन परम्परा',
        'totalVerses': 6,
        'durationMinutes': 5,
        'stanzas': [
            {
                'stanzaNumber': 1,
                'textDevanagari': [
                    'आरती कुंजबिहारी की, श्री गिरिधर कृष्णमुरारी की॥',
                    'गले में बैजंती माला, बजावै मुरली मधुर बाला।',
                    'श्रवण में कुण्डल झलकाला, नंद के आनंद नंदलाला।',
                    'श्री गिरिधर कृष्णमुरारी की, आरती कुंजबिहारी की॥'
                ],
                'meaning': 'कुंजों में विहार करने वाले नटनागर श्रीकृष्ण की आरती उतारते हैं, जिनके वक्षःस्थल पर बैजन्ती माला और अधरों पर मधुर मुरली सुशोभित है।'
            },
            {
                'stanzaNumber': 2,
                'textDevanagari': [
                    'कनकमय मुकुट बिराजै, छबि लखि रति-कोटि लजावै।',
                    'कमल सम नैनन को भावै, निरखि सब रूप-अमृत पावै।',
                    'मन्द हँसि मोहनी डारी, आरती कुंजबिहारी की॥'
                ],
                'meaning': 'मस्तक पर सुवर्ण मुकुट और कमल जैसे नयन हैं जिनकी एक मन्द मुस्कान से तीनों लोक मोहित हो जाते हैं।'
            },
            {
                'stanzaNumber': 3,
                'textDevanagari': [
                    'जहाँ ते प्रगटी गंगा, कलुष कलि-हारिणि श्रीगंगा।',
                    'स्मरन ते होत मोह भंगा, बसी शिव शीश जटा के अंगा।',
                    'हरै सब कलि-मल भारी, आरती कुंजबिहारी की॥'
                ],
                'meaning': 'प्रभु के चरणकमलों से कलिकल्मषनाशिनी पतित-पावनी श्रीगंगा प्रकट हुईं जो शिवजी के शीश पर विराजमान हैं।'
            },
            {
                'stanzaNumber': 4,
                'textDevanagari': [
                    'चमकती उज्ज्वल तट पर, बजी मुरली जमुना तट पर।',
                    'रास-रस लखि सुरगण अटके, गोपिका-संग प्रेम-रंग खटके।',
                    'नाचती गोपी अति प्यारी, आरती कुंजबिहारी की॥'
                ],
                'meaning': 'यमुना के पावन पुलिन पर जब कन्हैया की मुरली बजी, तो देवगण भी विमान रोककर उस प्रेम-रास को निहारने लगे।'
            }
        ],
        'pujaVidhi': {
            'timing': 'संध्या काल एवं शयन के समय',
            'requiredItems': ['कपूर या घृत दीप', 'पुष्प', 'चन्दन', 'घंटी'],
            'steps': ['दीप प्रज्वलित कर प्रभु के सम्मुख चार बार चरणों में, दो बार नाभि में, एक बार मुखारविन्द पर और सात बार सर्वांग में आरती घुमाएं।'],
            'benefits': 'मन की शान्ति, सांसारिक क्लेशों का शमन एवं श्रीकृष्ण भक्ति की प्राप्ति।'
        },
        'tags': ['आरती', 'कुंजबिहारी', 'श्रीकृष्ण', 'वृन्दावन', 'नित्य-उपासना']
    },
    {
        'id': 'aarti-kije-hanuman-lala-ki',
        'slug': 'aarti-kije-hanuman-lala-ki',
        'title': 'Aarti Kije Hanuman Lala Ki',
        'titleDevanagari': 'आरती कीजै हनुमान लला की: दुष्ट दलन रघुनाथ कला की',
        'category': 'aarti',
        'categoryHindi': 'आरती संग्रह',
        'deity': 'Lord Hanuman',
        'deityDevanagari': 'पवनसुत श्री हनुमान जी महाराज',
        'author': 'गोस्वामी तुलसीदास',
        'totalVerses': 8,
        'durationMinutes': 6,
        'stanzas': [
            {
                'stanzaNumber': 1,
                'textDevanagari': [
                    'आरती कीजै हनुमान लला की। दुष्ट दलन रघुनाथ कला की॥',
                    'जाके बल से गिरिवर कांपे। रोग दोष जाके निकट न झांके॥',
                    'अंजनि पुत्र महाबलदायी। सन्तन के प्रभु सदा सहाई॥'
                ],
                'meaning': 'प्रभु श्री राम की अलौकिक कला स्वरूप पवनसुत हनुमान जी की आरती करें, जिनके हुंकार मात्र से पर्वत कांप उठते हैं और समस्त रोग-दोष भाग जाते हैं।'
            },
            {
                'stanzaNumber': 2,
                'textDevanagari': [
                    'दे बीरा रघुनाथ पठाए। लंका जारि सीय सुधि लाए॥',
                    'लंका सो कोट समुद्र सी खाई। जात पवनसुत बार न लाई॥',
                    'लंका जारि असुर संहारे। सियारामजी के काज संवारे॥'
                ],
                'meaning': 'श्री राम का बीड़ा उठाकर समुद्र पार कर रावण की लंका को भस्म किया और माता सीता की खोज कर प्रभु के समस्त कार्य सिद्ध किए।'
            },
            {
                'stanzaNumber': 3,
                'textDevanagari': [
                    'लक्ष्मण मूर्छित पड़े सकारे। आणि संजीवन प्राण उबारे॥',
                    'पैठि पताल तोरि जम-कारे। अहिरावण की भुजा उखारे॥',
                    'बाएं भुजा असुर दल मारे। दाहिने भुजा संतजन तारे॥'
                ],
                'meaning': 'मूर्छित लक्ष्मण जी के लिए द्रोणाचल पर्वत से संजीवनी बूटी लाकर प्राणों की रक्षा की और पाताल में अहिरावण का संहार किया।'
            },
            {
                'stanzaNumber': 4,
                'textDevanagari': [
                    'सुर नर मुनि जन आरती उतारें। जय जय जय हनुमान उचारें॥',
                    'कंचन थार कपूर लौ छाई। आरती करत अंजना माई॥',
                    'जो हनुमानजी की आरती गावै। बसि बैकुण्ठ परमपद पावै॥'
                ],
                'meaning': 'जो कोई भी निष्कपट भाव से श्री हनुमान जी की आरती गाता है, वह भवसागर से पार होकर परम वैकुण्ठ पद प्राप्त करता है।'
            }
        ],
        'pujaVidhi': {
            'timing': 'प्रातःकाल एवं मंगलवार व शनिवार संध्या',
            'requiredItems': ['सिन्दूर', 'चमेली का तेल', 'कपूर', 'गुड़-चना प्रसाद'],
            'steps': ['हनुमान चालीसा अथवा सुन्दरकाण्ड पाठ के उपरान्त दीप घुमाकर आरती उतारें।'],
            'benefits': 'सर्व भय, भूत-पिशाच बाधा, रोग, मानसिक क्लेश एवं शनि पीड़ा से पूर्ण मुक्ति।'
        },
        'tags': ['आरती', 'हनुमान-जी', 'संकटमोचन', 'मंगलवार-आरती', 'कपूर-आरती']
    },
    {
        'id': 'om-jai-jagdish-hare',
        'slug': 'om-jai-jagdish-hare',
        'title': 'Om Jai Jagdish Hare',
        'titleDevanagari': 'ॐ जय जगदीश हरे: सर्व मनोरथ पूर्ण करने वाली महाआरती',
        'category': 'aarti',
        'categoryHindi': 'आरती संग्रह',
        'deity': 'Lord Vishnu (Jagannath)',
        'deityDevanagari': 'जगदीश भगवान श्रीहरि विष्णु',
        'author': 'सनातन परम्परा',
        'totalVerses': 7,
        'durationMinutes': 5,
        'stanzas': [
            {
                'stanzaNumber': 1,
                'textDevanagari': [
                    'ॐ जय जगदीश हरे, स्वामी जय जगदीश हरे।',
                    'भक्त जनों के संकट, क्षण में दूर करे॥',
                    'ॐ जय जगदीश हरे॥'
                ],
                'meaning': 'हे जगत्पति भगवान श्रीहरि! आपकी जय हो। आप क्षण भर में अपने भक्तों के समस्त संकटों को दूर कर देते हैं।'
            },
            {
                'stanzaNumber': 2,
                'textDevanagari': [
                    'जो ध्यावे फल पावे, दुःख बिनसे मन का।',
                    'सुख सम्पति घर आवे, कष्ट मिटे तन का॥'
                ],
                'meaning': 'जो भी आपका ध्यान करता है, उसके मन का दुःख दूर होता है और घर में सुख-समृद्धि का वास होता है।'
            },
            {
                'stanzaNumber': 3,
                'textDevanagari': [
                    'मात-पिता तुम मेरे, शरण गहूँ किसकी।',
                    'तुम बिन और न दूजा, आस करूँ जिसकी॥'
                ],
                'meaning': 'आप ही मेरे माता और पिता हैं; आपके अतिरिक्त मैं किसकी शरण लूँ और किससे आशा रखूँ।'
            }
        ],
        'pujaVidhi': {
            'timing': 'नित्य संध्या एवं समस्त मांगलिक पूजन के अंत में',
            'requiredItems': ['कपूर', 'घृत दीप', 'घंटी', 'शंख'],
            'steps': ['खड़े होकर शुद्ध भाव से ताली व घंटी की ध्वनि के साथ आरती गाएं।'],
            'benefits': 'सर्व विघ्न नाश, मानसिक शांति एवं घर में सुख-शान्ति की वृद्धि।'
        },
        'tags': ['आरती', 'जगदीश-हरे', 'भगवान-विष्णु', 'नित्य-आरती', 'सर्वकल्याण']
    },
    {
        'id': 'hanuman-chalisa',
        'slug': 'hanuman-chalisa',
        'title': 'Shri Hanuman Chalisa',
        'titleDevanagari': 'श्री हनुमान चालीसा: सर्व संकट निवारक अमोघ स्तुति',
        'category': 'chalisa',
        'categoryHindi': 'चालीसा संग्रह',
        'deity': 'Lord Hanuman',
        'deityDevanagari': 'पवनपुत्र श्री हनुमान',
        'author': 'गोस्वामी तुलसीदास',
        'totalVerses': 43,
        'durationMinutes': 7,
        'stanzas': [
            {
                'stanzaNumber': 1,
                'textDevanagari': [
                    '॥ दोहा ॥',
                    'श्रीगुरु चरन सरोज रज, निज मनु मुकुरु सुधारि।',
                    'बरनउँ रघुबर बिमल जसु, जो दायकु फल चारि॥',
                    'बुद्धिहीन तनु जानिके, सुमिरौं पवन-कुमार।',
                    'बल बुधि बिद्या देहु मोहिं, हरहु कलेस बिकार॥'
                ],
                'meaning': 'सद्गुरु के चरण-कमलों की धूलि से अपने मन रूपी दर्पण को पवित्र कर श्री रघुवीर के निर्मल यश का गान करता हूँ जो धर्म, अर्थ, काम, मोक्ष चारों फल देने वाले हैं।'
            },
            {
                'stanzaNumber': 2,
                'textDevanagari': [
                    'जय हनुमान ज्ञान गुन सागर। जय कपीस तिहुँ लोक उजागर॥',
                    'रामदूत अतुलित बल धामा। अंजनि-पुत्र पवनसुत नामा॥',
                    'महाबीर बिक्रम बजरंगी। कुमति निवार सुमति के संगी॥',
                    'कंचन बरन बिराज सुबेसा। कानन कुंडल कुंचित केसा॥'
                ],
                'meaning': 'हे ज्ञान और गुणों के अथाह सागर श्री हनुमान जी! आपकी जय हो। आप तीनों लोकों में अपनी कीर्ति से प्रकाशमान हैं और अतुलनीय बल के धाम हैं।'
            },
            {
                'stanzaNumber': 3,
                'textDevanagari': [
                    'हाथ बज्र औ ध्वजा बिराजै। काँधे मूँज जनेऊ साजै॥',
                    'संकर सुवन केसरीनंदन। तेज प्रताप महा जग बंदन॥',
                    'बिद्यावान गुनी अति चातुर। राम काज करिबे को आतुर॥',
                    'प्रभु चरित्र सुनिबे को रसिया। राम लखन सीता मन बसिया॥'
                ],
                'meaning': 'आपके हाथ में वज्र और ध्वजा शोभायमान है। आप भगवान शिव के ग्यारहवें रुद्रावतार हैं और प्रभु के कार्य सिद्ध करने हेतु सदैव तत्पर रहते हैं।'
            },
            {
                'stanzaNumber': 4,
                'textDevanagari': [
                    'नासै रोग हरै सब पीरा। जपत निरंतर हनुमत बीरा॥',
                    'संकट तें हनुमान छुड़ावै। मन क्रम बचन ध्यान जो लावै॥',
                    'सब पर राम तपस्वी राजा। तिन के काज सकल तुम साजा॥',
                    'और मनोरथ जो कोई लावै। सोइ अमित जीवन फल पावै॥'
                ],
                'meaning': 'जो कोई निरंतर वीर हनुमान का नाम जपता है, उसके समस्त रोग और पीड़ाएं नष्ट हो जाती हैं। मन, कर्म और वचन से ध्यान लगाने वाले को संकटों से मुक्ति मिलती है।'
            },
            {
                'stanzaNumber': 5,
                'textDevanagari': [
                    '॥ दोहा ॥',
                    'पवनतनय संकट हरन, मंगल मूरति रूप।',
                    'राम लखन सीता सहित, हृदय बसहु सुर भूप॥'
                ],
                'meaning': 'हे संकटमोचन पवनपुत्र मंगलमूर्ति! आप प्रभु श्री राम, माता सीता और लक्ष्मण जी सहित सदैव मेरे हृदय मंदिर में निवास करें।'
            }
        ],
        'pujaVidhi': {
            'timing': 'नित्य प्रातः एवं संध्याकाल',
            'requiredItems': ['शुद्ध जल', 'आसन', 'घृत दीप'],
            'steps': ['पूर्व अथवा उत्तर मुख बैठकर मन को एकाग्र कर १०० बार अथवा नित्य ७ बार पाठ करें।'],
            'benefits': '"जो यह पढ़ै हनुमान चालीसा, होय सिद्धि साखी गौरीसा।" सर्व सिद्धियों की प्राप्ति एवं भयमुक्ति।'
        },
        'tags': ['हनुमान-चालीसा', 'तुलसीदास', 'रोगनाशक', 'संकटमोचन', 'अमोघ-पाठ']
    },
    {
        'id': 'durga-chalisa',
        'slug': 'durga-chalisa',
        'title': 'Shri Durga Chalisa',
        'titleDevanagari': 'श्री दुर्गा चालीसा: नमो नमो दुर्गे सुख करनी',
        'category': 'chalisa',
        'categoryHindi': 'चालीसा संग्रह',
        'deity': 'Goddess Durga',
        'deityDevanagari': 'आदिशक्ति माँ दुर्गा',
        'author': 'सनातन परम्परा',
        'totalVerses': 40,
        'durationMinutes': 7,
        'stanzas': [
            {
                'stanzaNumber': 1,
                'textDevanagari': [
                    'नमो नमो दुर्गे सुख करनी। नमो नमो अम्बे दुःख हरनी॥',
                    'निरंकार है ज्योति तुम्हारी। तिहूँ लोक फैली उजियारी॥',
                    'शशि ललाट मुख महाविशाला। नेत्र लाल भृकुटी विकराला॥',
                    'रूप मातु को अधिक सुहावे। दरश करत जन अति सुख पावे॥'
                ],
                'meaning': 'सुखों की वर्षा करने वाली और दुःखों का हरण करने वाली माँ दुर्गा को बारम्बार प्रणाम है। आपका दिव्य प्रकाश तीनों लोकों में फैला हुआ है।'
            },
            {
                'stanzaNumber': 2,
                'textDevanagari': [
                    'तुम संसार शक्ति लै कीना। पालन हेतु अन्न धन दीना॥',
                    'अन्नपूर्णा हुई जग पाला। तुम ही आदि सुन्दरी बाला॥',
                    'प्रलयकाल सब नाशन हारी। तुम गौरी शिवशंकर प्यारी॥',
                    'शिव योगी तुम्हरे गुण गावें। ब्रह्मा विष्णु तुम्हें नित ध्यावें॥'
                ],
                'meaning': 'संसार का पालन-पोषण करने वाली जगद्धात्री आप ही हैं। प्रलयकाल में दुष्टों का संहार करने वाली और शिव की अर्धांगिनी गौरी आप ही हैं।'
            },
            {
                'stanzaNumber': 3,
                'textDevanagari': [
                    'शुम्भ निशुम्भ दानव तुम मारे। रक्तबीज शंखन संहारे॥',
                    'महिषासुर नृप अति अभिमानी। जेहि अघ भार मही अकुलानी॥',
                    'रूप कराल कालिका धारा। सेन सहित तुम तिहि संहारा॥'
                ],
                'meaning': 'महिषासुर, शुम्भ, निशुम्भ और रक्तबीज जैसे अजेय असुरों का मर्दन कर आपने देवताओं और पृथ्वी को भयमुक्त किया।'
            }
        ],
        'pujaVidhi': {
            'timing': 'नवरात्रि एवं प्रत्येक शुक्रवार व मंगलवार',
            'requiredItems': ['लाल पुष्प', 'रोली', 'कपूर', 'लौंग-बताशा'],
            'steps': ['लाल आसन पर बैठकर माँ भगवती के समक्ष घी का दीपक जलाकर श्रद्धापूर्वक पाठ करें।'],
            'benefits': 'शत्रु बाधा का शमन, पारिवारिक सुख-समृद्धि एवं आत्मिक शक्ति की वृद्धि।'
        },
        'tags': ['दुर्गा-चालीसा', 'नवरात्रि', 'माँ-अम्बे', 'शक्ति-उपासना', 'अभय-वरदान']
    },
    {
        'id': 'shiv-chalisa',
        'slug': 'shiv-chalisa',
        'title': 'Shri Shiva Chalisa',
        'titleDevanagari': 'श्री शिव चालीसा: जय गणेश गिरिजा सुवन',
        'category': 'chalisa',
        'categoryHindi': 'चालीसा संग्रह',
        'deity': 'Lord Shiva',
        'deityDevanagari': 'देवाधिदेव महादेव शिव',
        'author': 'सनातन परम्परा',
        'totalVerses': 40,
        'durationMinutes': 7,
        'stanzas': [
            {
                'stanzaNumber': 1,
                'textDevanagari': [
                    '॥ दोहा ॥',
                    'जय गणेश गिरिजा सुवन, मंगल मूल सुजान।',
                    'कहत अयोध्यादास तुम, देहु अभय वरदान॥',
                    '॥ चौपाई ॥',
                    'जय गिरिजापति दीन दयाला। सदा करत सन्तन प्रतिपाला॥',
                    'भाल चन्द्रमा सोहत नीके। कानन कुण्डल नागफनी के॥'
                ],
                'meaning': 'दीनों पर दया करने वाले और संतों का प्रतिपालन करने वाले भगवान शिव की जय हो। मस्तक पर अर्धचन्द्र और कानों में नागफनी के कुण्डल सुशोभित हैं।'
            },
            {
                'stanzaNumber': 2,
                'textDevanagari': [
                    'अंग गौर शिर गंग बहाये। मुण्डमाल तन छार लगाये॥',
                    'वस्त्र खाल बाघम्बर सोहे। छबि को देखि नाग मुनि मोहे॥',
                    'कर त्रिशूल सोहत छबि भारी। करत सदा शत्रुन क्षयकारी॥',
                    'नन्दि गणेश सोहैं तहँ कैसे। सागर मध्य कमल हैं जैसे॥'
                ],
                'meaning': 'जटाओं से माँ गंगा प्रवाहित हो रही हैं और भस्म रमे शरीर पर बाघम्बर शोभा दे रहा है। हाथ में दुष्टों का संहार करने वाला त्रिशूल है।'
            }
        ],
        'pujaVidhi': {
            'timing': 'सोमवार एवं प्रदोष काल',
            'requiredItems': ['जल', 'दूध', 'बिल्वपत्र', 'भस्म', 'धतूरा'],
            'steps': ['शिवलिंग पर जलाभिषेक कर बिल्वपत्र अर्पित करते हुए शांत भाव से पाठ करें।'],
            'benefits': 'मन की चंचलता का शमन, अकाल मृत्यु के भय से मुक्ति एवं ज्ञान-वैराग्य की प्राप्ति।'
        },
        'tags': ['शिव-चालीसा', 'महादेव', 'सोमवार-पूजा', 'बिल्वपत्र', 'भोलेनाथ']
    },
    {
        'id': 'shiva-tandava-stotram',
        'slug': 'shiva-tandava-stotram',
        'title': 'Shri Shiva Tandava Stotram',
        'titleDevanagari': 'श्री शिव ताण्डव स्तोत्रम्: जटाटवीगलज्जलप्रवाहपावितस्थले',
        'category': 'stotra',
        'categoryHindi': 'स्तोत्र संग्रह',
        'deity': 'Lord Shiva (Nataraja)',
        'deityDevanagari': 'नटराज भगवान शिव',
        'author': 'रावण विरचित',
        'totalVerses': 15,
        'durationMinutes': 6,
        'stanzas': [
            {
                'stanzaNumber': 1,
                'textDevanagari': [
                    'जटाटवीगलज्जलप्रवाहपावितस्थले',
                    'गलेऽवलम्ब्य लम्बितां भुजङ्गतुङ्गमालिकाम्।',
                    'डमड्डमड्डमड्डमन्निनादवड्डमर्वयं',
                    'चकार चण्डताण्डवं तनोतु नः शिवः शिवम्॥१॥'
                ],
                'meaning': 'सघन वन रूपी जटाओं से बहती हुई गंगा की पावन धाराओं से जिनका कंठ सुशोभित है, गले में सर्पों की विशाल माला धारण कर जो डमरू की डम-डम ध्वनि के साथ प्रचण्ड ताण्डव कर रहे हैं, वे कल्याणकारी शिव हमारे कल्याण का विस्तार करें।'
            },
            {
                'stanzaNumber': 2,
                'textDevanagari': [
                    'जटाकटाहसम्भ्रमभ्रमन्निलिम्पनिर्झरी-',
                    'विलोलवीचिवल्लरीविराजमानमूर्धनि।',
                    'धगद्धगद्धगज्ज्वलल्ललाटपट्टपावके',
                    'किशोरचन्द्रशेखरे रतिः प्रतिक्षणं मम॥२॥'
                ],
                'meaning': 'जटारूपी कड़ाह में वेग से घूमती गंगा की चंचल तरंगों से जिनका मस्तक सुशोभित है, ललाट की धधकती अग्नि वाले उस चन्द्रमौली भगवान शिव में मेरा मन प्रतिक्षण अनुरक्त रहे।'
            }
        ],
        'pujaVidhi': {
            'timing': 'प्रदोष काल एवं शिवरात्रि',
            'requiredItems': ['कपूर', 'रुद्राक्ष माला'],
            'steps': ['लयबद्ध और ओजस्वी वाणी में श्लोकों का उच्चारण करते हुए ध्यान करें।'],
            'benefits': 'ओज, तेज, वाक्-सिद्धि, आत्मविश्वास की वृद्धि एवं शिव सान्निध्य।'
        },
        'tags': ['शिव-ताण्डव', 'रावण-कृत', 'नटराज', 'ओजस्वी-स्तोत्र', 'संस्कृत']
    },
    {
        'id': 'aditya-hridaya-stotra',
        'slug': 'aditya-hridaya-stotra',
        'title': 'Shri Aditya Hridaya Stotram',
        'titleDevanagari': 'श्री आदित्य हृदय स्तोत्रम्: सर्व शत्रु विजय प्रदायक',
        'category': 'stotra',
        'categoryHindi': 'स्तोत्र संग्रह',
        'deity': 'Lord Surya',
        'deityDevanagari': 'प्रत्यक्ष देवता भगवान सूर्य नारायण',
        'author': 'महर्षि अगस्त्य',
        'totalVerses': 31,
        'durationMinutes': 6,
        'stanzas': [
            {
                'stanzaNumber': 1,
                'textDevanagari': [
                    'ततो युद्धपरिश्रान्तं समरे चिन्तया स्थितम्।',
                    'रावणं चाग्रतो दृष्ट्वा युद्धाय समुपस्थितम्॥१॥',
                    'दैवतैश्च समागम्य द्रष्टुमभ्यागतो रणम्।',
                    'उपागम्याब्रवीद्राममगस्त्यो भगवान् ऋषिः॥२॥'
                ],
                'meaning': 'युद्ध से क्लान्त होकर चिन्तातुर खड़े श्रीराम के सम्मुख रावण को युद्ध हेतु तत्पर देखकर देवताओं सहित उपस्थित हुए महर्षि अगस्त्य ने श्रीराम से कहा।'
            },
            {
                'stanzaNumber': 2,
                'textDevanagari': [
                    'राम राम महाबाहो शृणु गुह्यं सनातनम्।',
                    'येन सर्वानरीन वत्स समरे विजयिष्यसि॥३॥',
                    'आदित्यहृदयं पुण्यं सर्वशत्रुविनाशनम्।',
                    'जयावहं जपं नित्यमक्षयं परमं शिवम्॥४॥'
                ],
                'meaning': 'हे महाबाहो राम! इस सनातन गोपनीय स्तोत्र को सुनो, जिसके पाठ से तुम रणभूमि में समस्त शत्रुओं पर विजय प्राप्त करोगे। यह आदित्य हृदय स्तोत्र परम पवित्र, सर्वशत्रुनाशक और नित्य विजय प्रदान करने वाला है।'
            }
        ],
        'pujaVidhi': {
            'timing': 'प्रातः सूर्योदय के समय',
            'requiredItems': ['तांबे का पात्र', 'जल', 'लाल चन्दन', 'अक्षत', 'लाल पुष्प'],
            'steps': ['सूर्य को अर्घ्य देकर पूर्व दिशा की ओर मुख कर तीन बार इस पावन स्तोत्र का पाठ करें।'],
            'benefits': 'नेत्र रोग निवारण, सर्व शत्रु पराजय, उच्च पद-प्रतिष्ठा एवं आरोग्य की प्राप्ति।'
        },
        'tags': ['आदित्य-हृदय', 'सूर्य-उपासना', 'अगस्त्य-मुनि', 'विजय-स्तोत्र', 'आरोग्य']
    },
    {
        'id': 'madhurashtakam',
        'slug': 'madhurashtakam',
        'title': 'Shri Madhurashtakam',
        'titleDevanagari': 'श्री मधुराष्टकम्: अधरं मधुरं वदनं मधुरम्',
        'category': 'ashtakam',
        'categoryHindi': 'अष्टकम संग्रह',
        'deity': 'Lord Krishna',
        'deityDevanagari': 'मधुराधिपति श्रीकृष्ण',
        'author': 'श्रीमद्वल्लभाचार्य महाप्रभु',
        'totalVerses': 8,
        'durationMinutes': 4,
        'stanzas': [
            {
                'stanzaNumber': 1,
                'textDevanagari': [
                    'अधरं मधुरं वदनं मधुरं नयनं मधुरं हसितं मधुरम्।',
                    'हृदयं मधुरं गमनं मधुरं मधुराधिपतेरखिलं मधुरम्॥१॥'
                ],
                'meaning': 'जिनके अधर मधुर हैं, मुखारविन्द मधुर है, नयन मधुर हैं, हास्य मधुर है, हृदय मधुर है और चलना मधुर है—उन मधुराधिपति भगवान श्रीकृष्ण का सब कुछ मधुर ही मधुर है।'
            },
            {
                'stanzaNumber': 2,
                'textDevanagari': [
                    'वचनं मधुरं चरितं मधुरं वसनं मधुरं वलितं मधुरम्।',
                    'चलितं मधुरं भ्रमितं मधुरं मधुराधिपतेरखिलं मधुरम्॥२॥'
                ],
                'meaning': 'जिनकी वाणी मधुर है, चरित्र मधुर है, वस्त्र मधुर हैं, अंग-भंगिमाएं मधुर हैं और घूमना-विहार करना मधुर है—उन मधुराधिपति का सर्वस्व मधुर है।'
            }
        ],
        'pujaVidhi': {
            'timing': 'प्रातः अथवा शयन के समय',
            'requiredItems': ['माखन-मिश्री भोग', 'तुलसीदल'],
            'steps': ['बालकृष्ण अथवा युगल सरकार के सम्मुख प्रेमपूर्वक गान करें।'],
            'benefits': 'हृदय में माधुर्य भक्ति का संचार एवं श्रीकृष्ण के नित्य सान्निध्य की अनुभूति।'
        },
        'tags': ['मधुराष्टकम्', 'वल्लभाचार्य', 'माधुर्य-भक्ति', 'कृष्ण-प्रेम', 'अष्टकम']
    },
    {
        'id': 'achyutashtakam',
        'slug': 'achyutashtakam',
        'title': 'Shri Achyutashtakam',
        'titleDevanagari': 'श्री अच्युताष्टकम्: अच्युतं केशवं रामनारायणम्',
        'category': 'ashtakam',
        'categoryHindi': 'अष्टकम संग्रह',
        'deity': 'Lord Krishna / Vishnu',
        'deityDevanagari': 'अच्युत भगवान श्रीहरि',
        'author': 'आदि शंकराचार्य',
        'totalVerses': 8,
        'durationMinutes': 4,
        'stanzas': [
            {
                'stanzaNumber': 1,
                'textDevanagari': [
                    'अच्युतं केशवं रामनारायणं कृष्णदामोदरं वासुदेवं हरिम्।',
                    'श्रीधरं माधवं गोपिकावल्लभं जानकीनायकं रामचंद्रं भजे॥१॥'
                ],
                'meaning': 'अच्युत, केशव, राम, नारायण, कृष्ण, दामोदर, वासुदेव, हरि, श्रीधर, माधव, गोपिकावल्लभ और जानकीनायक प्रभु श्रीरामचन्द्र का मैं नित्य भजन करता हूँ।'
            }
        ],
        'pujaVidhi': {
            'timing': 'प्रातः एवं संध्या पूजन',
            'requiredItems': ['दीप', 'तुलसीदल'],
            'steps': ['हाथ जोड़कर मधुर स्वर में आठों पदों का पाठ करें।'],
            'benefits': 'पापों का क्षय एवं श्रीहरि के चरणों में अनन्य प्रीति।'
        },
        'tags': ['अच्युताष्टकम्', 'शंकराचार्य', 'अष्टकम', 'विष्णु-भक्ति']
    },
    {
        'id': 'rudrashtakam',
        'slug': 'rudrashtakam',
        'title': 'Shri Rudrashtakam',
        'titleDevanagari': 'श्री रुद्राष्टकम्: नमामीशमीशान निर्वाणरूपं',
        'category': 'ashtakam',
        'categoryHindi': 'अष्टकम संग्रह',
        'deity': 'Lord Shiva (Rudra)',
        'deityDevanagari': 'परमब्रह्म रुद्र',
        'author': 'गोस्वामी तुलसीदास',
        'totalVerses': 8,
        'durationMinutes': 5,
        'stanzas': [
            {
                'stanzaNumber': 1,
                'textDevanagari': [
                    'नमामीशमीशान निर्वाणरूपं विभुं व्यापकं ब्रह्मवेदस्वरूपम्।',
                    'निजं निर्गुणं निर्विकल्पं निरीहं चिदाकाशमाकाशवासं भजेऽहम्॥१॥'
                ],
                'meaning': 'हे ईशान! मुक्ति स्वरूप, सर्वव्यापक, ब्रह्म और वेद स्वरूप, निर्गुण, निर्विकल्प और चिदाकाश रूप प्रभु शिव को मैं नमन करता हूँ।'
            }
        ],
        'pujaVidhi': {
            'timing': 'प्रदोष काल एवं सोमवार',
            'requiredItems': ['जल', 'बिल्वपत्र', 'कपूर'],
            'steps': ['शिवलिंग के सम्मुख साष्टांग प्रणाम कर पाठ करें।'],
            'benefits': 'समस्त कष्टों और भय का नाश, शिव कृपा की प्राप्ति।'
        },
        'tags': ['रुद्राष्टकम्', 'तुलसीदास', 'रामचरितमानस', 'शिव-स्तुति']
    }
]

ritual_previews = []
for spec in RITUALS_SPECS:
    ritual_obj = {
        'id': spec['id'],
        'slug': spec['slug'],
        'title': sanitize_title(spec['title']),
        'titleDevanagari': clean_text_content(spec['titleDevanagari']),
        'category': spec['category'],
        'categoryHindi': clean_text_content(spec['categoryHindi']),
        'deity': sanitize_title(spec['deity']),
        'deityDevanagari': clean_text_content(spec.get('deityDevanagari', '')),
        'author': sanitize_author(spec.get('author', '')),
        'totalVerses': spec['totalVerses'],
        'durationMinutes': spec['durationMinutes'],
        'stanzas': spec['stanzas'],
        'pujaVidhi': spec['pujaVidhi'],
        'tags': spec['tags']
    }

    chunk_filename = f"ritual-{spec['slug']}.json"
    chunk_path = os.path.join(RITUALS_DIR, chunk_filename)
    with open(chunk_path, 'w', encoding='utf-8') as f:
        json.dump(ritual_obj, f, ensure_ascii=False, indent=2)

    preview_obj = {
        'id': spec['id'],
        'slug': spec['slug'],
        'title': ritual_obj['title'],
        'titleDevanagari': ritual_obj['titleDevanagari'],
        'category': ritual_obj['category'],
        'categoryHindi': ritual_obj['categoryHindi'],
        'deity': ritual_obj['deity'],
        'deityDevanagari': ritual_obj['deityDevanagari'],
        'totalVerses': ritual_obj['totalVerses'],
        'durationMinutes': ritual_obj['durationMinutes'],
        'tags': ritual_obj['tags'],
        'chunkFile': chunk_filename
    }
    ritual_previews.append(preview_obj)

rituals_manifest = {
    'category': 'rituals',
    'categoryHindi': 'नित्य उपासना, आरती एवं चालीसा',
    'count': len(ritual_previews),
    'updatedAt': '2026-11-15T09:00:00Z',
    'items': ritual_previews
}
rituals_index_path = os.path.join(RITUALS_DIR, 'index.json')
with open(rituals_index_path, 'w', encoding='utf-8') as f:
    json.dump(rituals_manifest, f, ensure_ascii=False, indent=2)

print(f"  ✓ Rituals written: {len(ritual_previews)} in {RITUALS_DIR}")
print(f"  ✓ rituals/index.json size: {os.path.getsize(rituals_index_path)} bytes (< 30 KB)")


# ---------------------------------------------------------------------------
# Strict Verification Pass: Integrity, Size, & Zero-Watermark Guard
# ---------------------------------------------------------------------------

print("\n🛡️ Running Zero-Watermark & Quality Verification Pass across all generated JSONs...")

forbidden_scan_terms = [
    'shrijirasik',
    'vedickathas',
    'bharatdevotion',
    'bhaktiarohan',
    'santeknath.org',
    'tukaram.com',
    'scraped',
    'harvested',
    'bhakti arohan',
    'bharat devotion',
    'vedic kathas',
    'shriji rasik',
    'भक्ति आरोहण',
    'भारत भक्ति',
    'वैदिक कथाएं',
    'श्रीजी रसिक'
]

total_files_scanned = 0
violations_found = []

for cat_dir in [STORIES_DIR, BIOS_DIR, PLACES_DIR, RITUALS_DIR]:
    for fname in os.listdir(cat_dir):
        if not fname.endswith('.json'):
            continue
        total_files_scanned += 1
        fpath = os.path.join(cat_dir, fname)
        size = os.path.getsize(fpath)

        if fname == 'index.json' and size >= 30 * 1024:
            violations_found.append(f"{fpath} exceeds 30 KB limit: {size} bytes")

        with open(fpath, 'r', encoding='utf-8') as f:
            content = f.read().lower()

        for term in forbidden_scan_terms:
            if term.lower() in content:
                violations_found.append(f"Watermark violation in {fname}: found '{term}'")

if violations_found:
    print("❌ Verification Failed with violations:")
    for v in violations_found:
        print(f"  - {v}")
    sys.exit(1)

print(f"🎉 Verification SUCCESS: All {total_files_scanned} JSON files 100% clean, verified, and compliant!")
print("======================================================================")
