/**
 * SacredSectionService
 * High-performance, zero-latency caching data service for Vrindopnisad Sacred Corpus:
 * - Stories (Katha Sanctuary)
 * - Biographies (Charitra Darshan)
 * - Places (Dham & Tirtha Explorer)
 * - Rituals (Nitya Upasana & Chanting Reader)
 *
 * Implements Tiered Caching:
 * 1. In-Memory Map (0ms immediate synchronous return)
 * 2. IndexedDB via idb-keyval (offline hydration, persistent across browser sessions)
 * 3. Network Fetch (/data/stories, /data/biographies, etc.)
 * 4. Curated Sacred Fallbacks (guaranteed zero-downtime, fully sanitized, Devanagari rich)
 */

import { get as idbGet, set as idbSet } from 'idb-keyval';
import {
  SacredStory,
  SacredStoryPreview,
  SacredBiography,
  SacredBiographyPreview,
  SacredPlace,
  SacredPlacePreview,
  SacredRitual,
  SacredRitualPreview,
  CorpusIndexManifest,
} from '../types/sacredSections';

// Storage cache keys
const IDB_KEY_STORIES_INDEX = 'vrindopnisad_sec_stories_idx_v1';
const IDB_KEY_BIOS_INDEX = 'vrindopnisad_sec_bios_idx_v1';
const IDB_KEY_PLACES_INDEX = 'vrindopnisad_sec_places_idx_v1';
const IDB_KEY_RITUALS_INDEX = 'vrindopnisad_sec_rituals_idx_v1';

// In-Memory cache maps
const memoryStories = new Map<string, SacredStory>();
const memoryBios = new Map<string, SacredBiography>();
const memoryPlaces = new Map<string, SacredPlace>();
const memoryRituals = new Map<string, SacredRitual>();

let cachedStoriesIndex: SacredStoryPreview[] | null = null;
let cachedBiosIndex: SacredBiographyPreview[] | null = null;
let cachedPlacesIndex: SacredPlacePreview[] | null = null;
let cachedRitualsIndex: SacredRitualPreview[] | null = null;

// ==========================================
// Curated Authentic Seed Data (Sanitized & Rich)
// ==========================================

export const SEED_STORIES: SacredStory[] = [
  {
    id: 'govardhan-dharan-leela',
    slug: 'govardhan-dharan-leela',
    title: 'Govardhan Dharan Leela: The Supreme Refuge',
    titleDevanagari: 'श्री गिरिराज गोवर्धन धारण लीला: शरणागति का परमोत्कर्ष',
    category: 'shrimad-bhagavatam',
    categoryHindi: 'श्रीमद्भागवत महापुराण',
    summary: 'इन्द्र के अभिमान का मर्दन और ब्रजवासियों की अटूट भक्ति की रक्षा हेतु कन्हैया द्वारा सात दिवस पर्यन्त गिरिराज गोवर्धन को कनिष्ठिका अंगुली पर धारण करने का दिव्य आख्यान।',
    readingTimeMinutes: 8,
    tradition: 'श्रीमद्भागवत एवं ब्रज रस परम्परा',
    tags: ['गोवर्धन', 'इन्द्र-मान-मर्दन', 'शरणागति', 'ब्रज लीला'],
    purport: 'भगवान का वास्तविक आश्रय ही समस्त लौकिक एवं पारलौकिक भयों से मुक्ति प्रदान करता है। बाह्य कर्मकाण्ड और अहंकार के सम्मुख निष्काम शरणागति ही भक्ति का सार है।',
    characters: [
      {
        name: 'श्री कृष्ण',
        nameDevanagari: 'श्री कृष्ण',
        role: 'गोपाल, गोवर्धनधारी भगवान',
        bioSnippet: 'परमब्रह्म जो ब्रज के गोपबालक बनकर भक्तों के प्रेम में बंधे हैं।'
      },
      {
        name: 'देवराज इन्द्र',
        nameDevanagari: 'इन्द्र देव',
        role: 'मेघों व वर्षा के अभिमानी देवता',
        bioSnippet: 'जिनके अभिमान का प्रभु ने प्रेमपूर्वक शमन किया।'
      },
      {
        name: 'नन्द महाराज',
        nameDevanagari: 'नन्दराय जी',
        role: 'ब्रजराज एवं वात्सल्य मूर्ति पिता',
        bioSnippet: 'जिन्होंने कन्हैया की मधुर वाणी पर परम्परागत इन्द्रयज्ञ को स्थगित कर गिरिराज पूजा का संकल्प लिया।'
      }
    ],
    chapters: [
      {
        id: 'ch-1-yajna-prashna',
        chapterNumber: 1,
        title: 'Dialogue with Nanda Baba',
        titleDevanagari: 'प्रथम अध्याय: नन्द बाबा से विचार-विमर्श',
        content: `शरद ऋतु के आगमन पर नन्दराय जी तथा समस्त ब्रजगोप इन्द्रयज्ञ की विशाल सामग्री संजो रहे थे। बालरूप नन्दनन्दन ने विनीत भाव से पिताश्री के चरणों में प्रणाम कर पूछा: 'हे तात! यह किस महानुष्ठान की तैयारी हो रही है? इसका फल क्या है?'

नन्द बाबा ने स्नेहपूर्वक उत्तर दिया: 'लाला! पर्जन्य (मेघ) इन्द्र के अधीन हैं। वे ही अमृतमयी वृष्टि कर हमारे गोधनों के लिए हरित तृण और कृषि उपजाते हैं।'

भगवान श्री कृष्ण ने लोकशिक्षा और गिरिराज पूजा की प्रतिष्ठा हेतु कहा: 'हे पिताश्री! हम वनचर और गिरिचर गोकुलवासी हैं। हमारे साक्षात देवता तो यह गिरिराज गोवर्धन, वन-उपवन और गौएं हैं, जो प्रत्यक्ष हमारा पालन करती हैं। अत: हमें प्रत्यक्ष देवता गिरिराज जी की महापूजा करनी चाहिए।'`,
        purport: 'प्रत्यक्ष प्रकृति, गौ और संतों की सेवा ही सच्चा यज्ञ है।',
        shlokas: [
          {
            devanagari: 'तस्माद् भजध्वं गिरिमर्चयध्वं क्षीरान्नहोमैर्विधिवद् द्विजाग्र्यैः।',
            meaning: 'अतः प्रत्यक्ष पूज्य गिरिराज की अर्चना करो, उत्तम पकवान, क्षीर और नवनीतों से ब्राह्मणों एवं गोधनों को तृप्त करो।',
            reference: 'श्रीमद्भागवत १०.२४.२६'
          }
        ]
      },
      {
        id: 'ch-2-giriraj-archan',
        chapterNumber: 2,
        title: 'Annakut Mahotsav',
        titleDevanagari: 'द्वितीय अध्याय: भव्य अन्नकूट महोत्सव',
        content: `कन्हैया के वचनों को शिरोधार्य कर समस्त ब्रजवासियों ने अन्नकूट का विराट आयोजन किया। पर्वताकार रोट, पायस, लड्डुओं और पकवानों की भोगमालाएं समर्पित की गईं।

तभी भगवान ने एक विशाल अलौकिक रूप प्रकट कर 'शैलोऽस्म्यहो' (मैं ही गिरिराज हूँ) उद्घोष करते हुए सब भोग स्वीकार किए और दूसरे रूप से स्वयं भी पूजा में सम्मिलित रहे।`,
        purport: 'भक्त और भगवान के मध्य अद्वैत प्रेम का स्वरूप ही अन्नकूट की भावना है।'
      },
      {
        id: 'ch-3-samvartaka-vrishti',
        chapterNumber: 3,
        title: 'Lifting Mount Govardhan',
        titleDevanagari: 'तृतीय अध्याय: सात दिवस छत्र-धारण',
        content: `जब इन्द्र को यज्ञ भंग का समाचार मिला, तो क्रोधोन्मत्त होकर उसने संवर्तक प्रलयंकारी मेघों को ब्रज पर मूसलधार प्रहार का आदेश दिया। वज्रपात और शिलावृष्टि से व्याकुल होकर समस्त गौएं और गोप कन्हैया की शरण में दौड़े।

तब कृपानिधान श्री कृष्ण ने बिना किसी प्रयास के, बालसुलभ लीला से गिरिराज गोवर्धन को उखाड़कर अपनी बाएं हाथ की कनिष्ठिका अंगुली पर छत्र के समान धारण कर लिया। समस्त ब्रजमंडल सात दिनों तक गिरिराज की छत्रछाया में निष्कम्प, आनंदमय और सुरक्षित रहा।`,
        purport: 'शरणागत वत्सल प्रभु की छत्रछाया में प्रकृति का कोई भी संताप भक्त को स्पर्श नहीं कर सकता।'
      }
    ]
  },
  {
    id: 'shabari-prema-bhakti',
    slug: 'shabari-prema-bhakti',
    title: 'Mata Shabari: The Pinnacle of Loving Devotion',
    titleDevanagari: 'माता शबरी: नवधा भक्ति एवं सहज प्रेम की पराकाष्ठा',
    category: 'ramayana',
    categoryHindi: 'श्री रामचरितमानस एवं रामायण',
    summary: 'मतंग ऋषि के आश्रम में वर्षों तक गुरुवचन पर अटल रहकर रघुनाथ के आगमन की प्रतीक्षा और रसभरे बेर समर्पित करने वाली अनन्य भक्त शबरी का अमर वृत्तांत।',
    readingTimeMinutes: 6,
    tradition: 'रामानन्दी एवं सनातन संत परम्परा',
    tags: ['शबरी', 'नवधा-भक्ति', 'श्रीराम', 'गुरु-निष्ठा'],
    purport: 'जाति, कुल, पद या विद्या भक्ति का मापदण्ड नहीं हैं। भगवान केवल प्रेम के भूखे हैं—"मानउँ एक भगति कर नाता"।',
    characters: [
      {
        name: 'माता शबरी',
        nameDevanagari: 'माता शबरी',
        role: 'मतंग शिष्या, निष्काम भक्त',
        bioSnippet: 'वृद्धावस्था तक प्रतिदिन प्रभु के स्वागत हेतु पुष्प बिछाने वाली प्रेम-प्रतिमा।'
      },
      {
        name: 'श्री रामचन्द्र',
        nameDevanagari: 'मर्यादा पुरुषोत्तम श्री राम',
        role: 'परब्रह्म अवतारी प्रभु',
        bioSnippet: 'जिन्होंने शबरी के जूठे बेरों को अमृतोपम मानकर नवधा भक्ति का उपदेश दिया।'
      }
    ],
    chapters: [
      {
        id: 'ch-1-guru-vachan',
        chapterNumber: 1,
        title: 'Faith in Guru Words',
        titleDevanagari: 'प्रथम अध्याय: गुरु वचनों पर अटल विश्वास',
        content: `महर्षि मतंग जब महाप्रयाण करने लगे, तो शबरी ने सजल नेत्रों से पूछा: 'प्रभो! मैं आपके बिना इस निर्जन वन में क्या करूंगी?'

ऋषिवर ने स्नेह से कहा: 'पुत्री! इसी आश्रम में धैर्यपूर्वक साधन करती रहो। एक दिन स्वयं साक्षात परब्रह्म श्री रामचन्द्र इस कुटीर में पधारेंगे। उनके दर्शन से तुम्हारा जीवन धन्य होगा।'

शबरी ने गुरु के इस एक वाक्य को अपने जीवन का प्राण बना लिया। नित्य प्रभात उठकर कांटों को झाड़ना, कोमल पल्लव बिछाना और मीठे फलों का चयन करना उसका दैनिक तप बन गया।`,
        purport: 'गुरुवाक्य में अटूट निष्ठा ही साक्षात्कार का अचूक सेतु है।'
      },
      {
        id: 'ch-2-raghupati-aagaman',
        chapterNumber: 2,
        title: 'Arrival of Sri Rama & Navadha Bhakti',
        titleDevanagari: 'द्वितीय अध्याय: प्रभु का आगमन व नवधा भक्ति',
        content: `अन्ततः वह पुण्य दिवस आया। श्री राम और लक्ष्मण आश्रम पहुंचे। शबरी रोमांचित हो उठी, चरणों में गिर पड़ी और चख-चख कर मीठे बेर प्रभु को अर्पित करने लगी।

श्री राम ने परम तृप्ति से उन उपहारों को ग्रहण किया और शबरी के संशय निवारण हेतु नवधा भक्ति का दिव्य उपदेश दिया: प्रथम भक्ति संतों का संग है, द्वितीय प्रभु कथा में प्रेम, और नवम सरल व निष्कपट स्वभाव है।`,
        purport: 'भगवान हृदय की शुद्धता और प्रीति स्वीकार करते हैं, बाह्य आडम्बर नहीं।'
      }
    ]
  }
];

export const SEED_BIOGRAPHIES: SacredBiography[] = [
  {
    id: 'swami-haridas-ji',
    slug: 'swami-haridas-ji',
    name: 'Swami Haridas Ji Maharaj',
    nameDevanagari: 'संगीत शिरोमणि स्वामी श्री हरिदास जी महाराज',
    titleHonorific: 'रसिक कुल चक्रवर्ती',
    period: '1478 - 1573 ई.',
    tradition: 'हरिदासी (सखी भाव) सम्प्रदाय',
    guru: 'श्री आशुधीर जी महाराज',
    lineage: {
      sampradaya: 'श्री हरिदासी सम्प्रदाय',
      guru: 'श्री आशुधीर जी देव',
      prominentDisciples: ['विट्ठल विपुल देव जी', 'तानसेन (संगीत शिष्य)'],
      seatOrPeetham: 'निधिवन राज, श्रीधाम वृन्दावन'
    },
    birthPlace: 'हरिदासपुर (अलीगढ़ / मथुरा सीमा)',
    samadhiLocation: {
      place: 'निधिवन राज',
      dhamOrRegion: 'श्रीधाम वृन्दावन',
      darshanSignificance: 'जहाँ स्वामी जी के अनन्य संगीत व लाड़-लड़ाने पर श्री बांके बिहारी जी साक्षात प्रकट हुए।'
    },
    literaryWorks: [
      {
        title: 'Kelimal',
        titleDevanagari: 'केलिमाल',
        description: 'नित्यविहार रस के ११० पदों का गूढ़ व मधुरतम संग्रह।',
        language: 'ब्रजभाषा',
        versesCount: 110
      },
      {
        title: 'Siddhant Ke Pad',
        titleDevanagari: 'सिद्धान्त के पद',
        description: 'वैराग्य, अनन्यता और सखी भाव की उपासना के दार्शनिक पद।',
        language: 'ब्रजभाषा',
        versesCount: 18
      }
    ],
    keyLeelas: [
      {
        title: 'श्री बांके बिहारी जी का प्राकट्य',
        description: 'निधिवन में स्वामी जी के तानपूरे के दिव्य स्वरों पर प्रिया-प्रियतम ने युगल रूप में दर्शन दिए और बाद में एक रूप होकर श्री बांके बिहारी विग्रह रूप में प्रतिष्ठित हुए।'
      },
      {
        title: 'सम्राट अकबर का निधिवन आगमन',
        description: 'तानसेन के आग्रह पर सम्राट अकबर छद्म वेश में स्वामी जी का निर्दोष पद गायन सुनने निधिवन पहुंचे।'
      }
    ],
    lifeSummary: 'स्वामी हरिदास जी संगीत और नित्यविहार रस के अप्रतिम आचार्य हैं। उन्होंने संसार के समस्त प्रलोभनों का त्याग कर वृन्दावन के निधिवन में कुंज-रस का साक्षात्कार कराया।',
    tags: ['स्वामी हरिदास', 'बांके बिहारी', 'निधिवन', 'केलिमाल', 'रसिक']
  },
  {
    id: 'jagadguru-hit-harivansh-mahaprabhu',
    slug: 'jagadguru-hit-harivansh-mahaprabhu',
    name: 'Hit Harivansh Mahaprabhu',
    nameDevanagari: 'गोस्वामी श्री हित हरिवंश महाप्रभु',
    titleHonorific: 'वंशी अवतार',
    period: '1502 - 1552 ई.',
    tradition: 'श्री राधावल्लभ सम्प्रदाय',
    guru: 'साक्षात श्री राधा जू (स्वप्न दीक्षा)',
    lineage: {
      sampradaya: 'श्री राधावल्लभ सम्प्रदाय',
      guru: 'साक्षात श्री राधारानी',
      prominentDisciples: ['श्री नवलदास जी', 'श्री दामोदरदास जी'],
      seatOrPeetham: 'श्री राधावल्लभ मन्दिर, वृन्दावन'
    },
    birthPlace: 'बाद ग्राम (मथुरा निकट)',
    samadhiLocation: {
      place: 'सेवा कुंज एवं मानसरोवर',
      dhamOrRegion: 'श्रीधाम वृन्दावन',
      darshanSignificance: 'प्रिया-प्रियतम की नित्य रासस्थली जहाँ महाप्रभु ने अपना देह त्याग किया।'
    },
    literaryWorks: [
      {
        title: 'Hit Chaurasi',
        titleDevanagari: 'श्री हित चौरासी',
        description: 'राधा-सुधा रस की चौरासी अमर वाणियां जो रसोपासना का सर्वोपरि ग्रन्थ हैं।',
        language: 'ब्रजभाषा',
        versesCount: 84
      },
      {
        title: 'Radha Sudha Nidhi',
        titleDevanagari: 'श्री राधा सुधा निधि',
        description: 'संस्कृत के २७० श्लोकों में श्री राधा की दास्य भक्ति का पराकाष्ठा वर्णन।',
        language: 'संस्कृत',
        versesCount: 270
      }
    ],
    keyLeelas: [
      {
        title: 'राधावल्लभ लाल का वृन्दावन आगमन',
        description: 'चरथावल से श्री राधावल्लभ लाल के विग्रह को लेकर वृन्दावन आगमन और मदन टेर पर प्रतिष्ठा।'
      }
    ],
    lifeSummary: 'श्री हित हरिवंश महाप्रभु ने रसोपासना में श्री राधा की प्रधानता और अहैतुकी दासी भाव की प्रतिष्ठा की। उनके अनुसार प्रिया जी की सेवा ही जीवन का चरम साध्य है।',
    tags: ['हित हरिवंश', 'राधावल्लभ', 'हित चौरासी', 'राधा सुधा निधि']
  },
  {
    id: 'sant-tukaram-maharaj',
    slug: 'sant-tukaram-maharaj',
    name: 'Sant Tukaram Maharaj',
    nameDevanagari: 'जगद्गुरु संत तुकाराम महाराज',
    titleHonorific: 'भक्त शिरोमणि',
    period: '1598 - 1650 ई.',
    tradition: 'वारकरी परम्परा (भागवत धर्म)',
    guru: 'बाबाजी चैतन्य',
    lineage: {
      sampradaya: 'वारकरी सम्प्रदाय',
      guru: 'बाबाजी चैतन्य',
      seatOrPeetham: 'देहू, महाराष्ट्र'
    },
    birthPlace: 'देहू (पुणे)',
    samadhiLocation: {
      place: 'इंद्रायणी तट (देहू)',
      dhamOrRegion: 'देहू, पंढरपुर परम्परा',
      darshanSignificance: 'सदेह वैकुंठ गमन स्थली जहाँ से भगवान का विमान उन्हें ले गया।'
    },
    literaryWorks: [
      {
        title: 'Tukaram Gatha',
        titleDevanagari: 'तुकाराम गाथा',
        description: 'साढ़े चार हजार से अधिक अभंगों का अमृत सागर जो विट्ठल भक्ति से परिपूर्ण है।',
        language: 'मराठी',
        versesCount: 4500
      }
    ],
    keyLeelas: [
      {
        title: 'इंद्रायणी नदी में बहियों का तरना',
        description: 'जब ईर्ष्यालु लोगों ने अभंगों की पांडुलिपियों को नदी में डुबो दिया, तो १३ दिनों के तप उपरांत पांडुलिपियां बिना भीगे जल के ऊपर तैरती हुई प्राप्त हुईं।'
      }
    ],
    lifeSummary: 'संत तुकाराम जी ने समाज के सभी वर्गों में ईश्वर-प्रेम, समानता और नाम-संकीर्तन की अलख जगाई। "वृक्षवल्ली आम्हा सोयरी" कहकर प्रकृति-प्रेम का सन्देश दिया।',
    tags: ['तुकाराम', 'विट्ठल', 'अभंग', 'वारकरी', 'देहू']
  },
  {
    id: 'sant-eknath-maharaj',
    slug: 'sant-eknath-maharaj',
    name: 'Sant Eknath Maharaj',
    nameDevanagari: 'संत एकनाथ महाराज',
    titleHonorific: 'शान्ति ब्रह्म',
    period: '1533 - 1599 ई.',
    tradition: 'वारकरी व दत्त परम्परा',
    guru: 'जनार्दन स्वामी',
    lineage: {
      sampradaya: 'वारकरी / भागवत परम्परा',
      guru: 'जनार्दन स्वामी',
      seatOrPeetham: 'पैठण, महाराष्ट्र'
    },
    birthPlace: 'पैठण',
    samadhiLocation: {
      place: 'गोदावरी तट (पैठण)',
      dhamOrRegion: 'पैठण',
      darshanSignificance: 'जल-समाधि स्थली'
    },
    literaryWorks: [
      {
        title: 'Eknathi Bhagavata',
        titleDevanagari: 'एकनाथी भागवत',
        description: 'श्रीमद्भागवत के एकादश स्कंध का अनुपम एवं गहन भाष्य।',
        language: 'मराठी'
      },
      {
        title: 'Bhavartha Ramayana',
        titleDevanagari: 'भावार्थ रामायण',
        description: 'भक्ति और राष्ट्र-जागरण से ओतप्रोत रामायण ग्रन्थ।'
      }
    ],
    keyLeelas: [
      {
        title: 'गर्दभ को गंगाजल पिलाना',
        description: 'काशी से रामेश्वरम के लिए लाया गया पवित्र गंगाजल प्यास से तड़पते गधे के मुख में उंडेलकर सर्वभूत-दया का प्रत्यक्ष प्रमाण दिया।'
      }
    ],
    lifeSummary: 'संत एकनाथ जी महाराज ने अपनी अगाध सहनशीलता और करुणा से भक्ति के आदर्श स्थापित किए। साक्षात विट्ठल उनके यहाँ "श्रीखण्डिया" बनकर जल भरते थे।',
    tags: ['एकनाथ', 'पैठण', 'भागवत', 'वारकरी']
  }
];

export const SEED_PLACES: SacredPlace[] = [
  {
    id: 'shri-radha-raman-mandir',
    slug: 'shri-radha-raman-mandir',
    name: 'Shri Radha Raman Temple',
    nameDevanagari: 'श्री राधा रमण मन्दिर',
    dhamRegion: 'vrindavan',
    regionNameHindi: 'श्रीधाम वृन्दावन',
    briefSignificance: 'गोपाल भट्ट गोस्वामी जी की भक्ति से शालिग्राम शिला से स्वयंप्रकट त्रिभंगी ललित विग्रह, जहाँ ५०० वर्षों से अखंड अनल (अग्नि) प्रज्वलित है।',
    deity: 'Shri Radha Raman Dev',
    deityDevanagari: 'श्री राधा रमण लाल जू',
    darshanTimings: {
      morning: { open: '08:30 AM', close: '12:30 PM', aartiName: 'श्रृंगार एवं राजभोग आरती' },
      evening: { open: '06:00 PM', close: '09:00 PM', aartiName: 'संध्या व शयन आरती' },
      specialNotes: 'मन्दिर में माचिस का प्रयोग नहीं होता; ५०० वर्षों पूर्व प्रकट यज्ञ अग्नि से ही नित्य प्रसाद पकता है।'
    },
    parikramaKm: 2,
    associatedLeelas: [
      {
        title: 'शालिग्राम से प्राकट्य',
        description: 'वैशाख पूर्णिमा संवत १५९९ को दामोदर शालिग्राम शिला से श्री राधा रमण जी का अति मनोहारी विग्रह प्रकट हुआ।'
      }
    ],
    nearbyKundsOrShilats: ['सेवा कुंज', 'निधिवन', 'कालीदह'],
    samadhisNearby: ['श्रील गोपाल भट्ट गोस्वामी समाधि'],
    tags: ['राधारमण', 'वृन्दावन', 'शालिग्राम', 'स्वयंप्रकट', 'गौड़ीय']
  },
  {
    id: 'shri-banke-bihari-mandir',
    slug: 'shri-banke-bihari-mandir',
    name: 'Shri Banke Bihari Temple',
    nameDevanagari: 'श्री बांके बिहारी मन्दिर',
    dhamRegion: 'vrindavan',
    regionNameHindi: 'श्रीधाम वृन्दावन',
    briefSignificance: 'स्वामी हरिदास जी की संगीत साधना से प्रादुर्भूत रस मूर्ति। यहाँ परदा बार-बार डाला जाता है ताकि भक्त और ठाकुर जी की आंखें एकटक मिलकर मुग्ध न हो जाएं।',
    deity: 'Shri Banke Bihari Ji',
    deityDevanagari: 'श्री बांके बिहारी लाल',
    darshanTimings: {
      morning: { open: '07:45 AM', close: '12:00 PM', aartiName: 'श्रृंगार दर्शन (घंटी रहित)' },
      evening: { open: '05:30 PM', close: '09:30 PM', aartiName: 'शयन आरती' },
      specialNotes: 'यहाँ मन्दिर में कोई घण्टी नहीं बजती, ठाकुर जी के सुकोमल कानों के सुखार्थ केवल प्रेम-दर्शन होता है।'
    },
    parikramaKm: 3,
    associatedLeelas: [
      {
        title: 'परदा प्रथा का रहस्य',
        description: 'एक अनन्य भक्त के साथ बिहारी जी उसके गांव चले गए थे, तब से गोस्वामी जन पल-पल पर परदा डालकर प्रेम-बाण को नियंत्रित करते हैं।'
      }
    ],
    nearbyKundsOrShilats: ['निधिवन राज'],
    samadhisNearby: ['स्वामी हरिदास जी प्राकट्य स्थल'],
    tags: ['बांके बिहारी', 'वृन्दावन', 'हरिदास', 'झांकी']
  },
  {
    id: 'shri-radha-kund',
    slug: 'shri-radha-kund',
    name: 'Shri Radha Kund & Shyam Kund',
    nameDevanagari: 'श्री राधा कुण्ड एवं श्याम कुण्ड',
    dhamRegion: 'govardhan',
    regionNameHindi: 'गिरिराज गोवर्धन तलहटी',
    briefSignificance: 'समस्त ब्रह्माण्ड का सर्वाधिक पावन कुण्ड, जो स्वयं श्री राधा के प्रेम का घनीभूत स्वरूप माना जाता है। अरिष्टासुर वध के उपरांत प्रभु और प्रिया जी ने इसका निर्माण किया।',
    deity: 'Shri Radha-Krishna Yugala Rasa',
    deityDevanagari: 'श्री युगल सरकार',
    darshanTimings: {
      morning: { open: '04:00 AM', close: '12:00 PM', aartiName: 'मंगला व संगम आरती' },
      evening: { open: '04:00 PM', close: '09:00 PM', aartiName: 'संध्या दीपदान' },
      specialNotes: 'अहोई अष्टमी की अर्धरात्रि को कुण्ड में महास्नान का विशेष महात्म्य है।'
    },
    parikramaKm: 21,
    associatedLeelas: [
      {
        title: 'अरिष्ठासुर वध एवं कुण्ड निर्माण',
        description: 'गो-वंश रूपी अरिष्टासुर के वधोपरांत शुद्धि हेतु श्री कृष्ण ने वेणु से श्याम कुण्ड खोदा, और राधारानी ने अपनी सखियों के कंकणों से दिव्य राधा कुण्ड निर्मित किया।'
      }
    ],
    nearbyKundsOrShilats: ['कुसुम सरोवर', 'मानसी गंगा', 'गोविन्द कुण्ड'],
    samadhisNearby: ['श्रील रघुनाथ दास गोस्वामी समाधि', 'श्रील जीव गोस्वामी भजन कुटीर'],
    tags: ['राधाकुण्ड', 'श्यामकुण्ड', 'गोवर्धन', 'अहोई अष्टमी', 'रास']
  },
  {
    id: 'govardhan-parikrama',
    slug: 'govardhan-parikrama',
    name: 'Govardhan Hill Parikrama',
    nameDevanagari: 'श्री गिरिराज गोवर्धन परिक्रमा मार्ग',
    dhamRegion: 'govardhan',
    regionNameHindi: 'श्री गोवर्धन धाम',
    briefSignificance: 'सात कोस (२१ किलोमीटर) का परिक्रमा मार्ग जहाँ प्रत्येक शिला साक्षात कृष्ण का अंग मानी जाती है। पूँछरी का लौठा, जतीपुरा और दानघाटी इसके मुख्य केंद्र हैं।',
    deity: 'Giriraj Govardhan (Haridasa Varya)',
    deityDevanagari: 'गिरिराज महाराज',
    darshanTimings: {
      morning: { open: '05:00 AM', close: '12:00 PM', aartiName: 'दुग्ध अभिषेक दर्शन' },
      evening: { open: '04:00 PM', close: '10:00 PM', aartiName: 'संध्या आरती' },
      specialNotes: 'परिक्रमा २४ घण्टे खुली रहती है; ग्रीष्मकाल में रात्रि परिक्रमा अधिक सुखद होती है।'
    },
    parikramaKm: 21,
    associatedLeelas: [
      {
        title: 'दानघाटी मान लीला',
        description: 'गोपियों से दधि का दान मांगने का दिव्य स्थल जहाँ श्री कृष्ण ने लीला की।'
      }
    ],
    nearbyKundsOrShilats: ['मानसी गंगा', 'दानघाटी', 'मुखारविन्द जतीपुरा', 'राधाकुण्ड'],
    samadhisNearby: ['सूरदास जी समाधि (पारसौली)'],
    tags: ['गोवर्धन', 'परिक्रमा', 'दानघाटी', 'जतीपुरा', 'पूँछरी']
  }
];

export const SEED_RITUALS: SacredRitual[] = [
  {
    id: 'shri-yamunashtakam',
    slug: 'shri-yamunashtakam',
    title: 'Shri Yamunashtakam',
    titleDevanagari: 'श्री यमुनाष्टकम् (श्रीमद्वल्लभाचार्य विरचितम्)',
    category: 'ashtakam',
    categoryHindi: 'अष्टकम',
    deity: 'Shri Yamuna Maharani',
    deityDevanagari: 'श्री यमुने महारानी',
    author: 'श्रीमद् वल्लभाचार्य महाप्रभु',
    totalVerses: 9,
    durationMinutes: 7,
    pujaVidhi: {
      timing: 'प्रातः काल अथवा यमुना तट पर संध्या दीपदान के समय',
      requiredItems: ['दीपक (कपूर अथवा घी)', 'यमुना जल', 'चन्दन', 'कमल अथवा सुगंधित पुष्प'],
      steps: [
        'पवित्र आचमन कर श्री यमुना जी का ध्यान करें।',
        'हस्त में जल अथवा पुष्प लेकर संकल्प करें।',
        'शांत एवं लयबद्ध स्वर में नौ श्लोकों का सस्वर पाठ करें।',
        'पाठ के अंत में श्री यमुना महारानी की आरती कर प्रणाम करें।'
      ],
      benefits: 'समस्त पापों का शमन, यमभय का निवारण और भगवान श्री कृष्ण के प्रति अनन्य प्रेम व भाव की प्राप्ति।'
    },
    stanzas: [
      {
        stanzaNumber: 1,
        textDevanagari: [
          'नमामि यमुनामहं सकल सिद्धि हेतुं मुदा,',
          'मुरारि पदपङ्कज स्फुरदमन्द रेणुत्कटाम्।',
          'तटस्थ नवकानन प्रकटमोद पुष्पाम्बुना,',
          'सुरासुर सुपूजित स्मरपितुः श्रियं बिभ्रतीम्॥ १ ॥'
        ],
        meaning: 'समस्त सिद्धियों को आनन्दपूर्वक देने वाली, श्री कृष्ण के चरणकमलों के पराग से सुशोभित, सुरम्य तटवर्ती उपवनों के सुगन्धित पुष्पों से सुवासित जल वाली और सुर-असुरों द्वारा पूजिता श्री यमुना जी को मैं सादर नमन करता हूँ।'
      },
      {
        stanzaNumber: 2,
        textDevanagari: [
          'कलिन्द गिरि मन्दिरे पतदमन्द मन्दोद्गिरा,',
          'विलास गमनाल्लसत्प्रकट गण्डशैलोन्नता।',
          'सघोष भयहारिणी कलित कालिदासन्निधौ,',
          'भजद्भिरभिसेवितां प्रणत कामदुग्धां भजे॥ २ ॥'
        ],
        meaning: 'कलिन्द पर्वत (यमुनोत्री) से मंद-मंद मधुर स्वर के साथ विलासपूर्वक प्रवाहित होती हुई, भक्तों की प्रार्थना पर मनोवांछित फल देने वाली कलिन्दनन्दिनी श्री यमुना जी का मैं भजन करता हूँ।'
      },
      {
        stanzaNumber: 3,
        textDevanagari: [
          'भुवं भुवनपावनीं प्रमथिताति मन्दोद्भवां,',
          'प्रफुल्ल सरसीरुह द्रवदगन्ध किञ्चिद्रजाम्।',
          'महीयस उरुक्रमात् परिपतद् गभीराम्बुना,',
          'समाविशति या हरौ सततमेव तामानतोस्मि॥ ३ ॥'
        ],
        meaning: 'समस्त भुवनों को पवित्र करने वाली, कमल पराग से महकती हुई, अथाह गम्भीर जलराशि से भगवान श्री हरि को नित्य आलिंगन करने वाली श्री यमुना जी को मेरा अनन्त प्रणाम है।'
      }
    ],
    tags: ['यमुनोत्री', 'यमुनाष्टकम्', 'वल्लभाचार्य', 'पुष्टिमार्ग', 'अष्टकम']
  },
  {
    id: 'shri-radha-kripa-kataksha-stotra',
    slug: 'shri-radha-kripa-kataksha-stotra',
    title: 'Shri Radha Kripa Kataksha Stotra',
    titleDevanagari: 'श्री राधा कृपा कटाक्ष स्तोत्रम्',
    category: 'stotra',
    categoryHindi: 'स्तोत्र',
    deity: 'Shri Radha Rani',
    deityDevanagari: 'श्री राधारानी (वृन्दावन ईश्वरी)',
    author: 'ऊर्ध्वाम्नाय तंत्र (परम्परागत)',
    totalVerses: 14,
    durationMinutes: 11,
    pujaVidhi: {
      timing: 'नित्य प्रातःकाल ब्रह्ममुहूर्त, अष्टमी या पूर्णिमा तिथि पर विशेष',
      requiredItems: ['गोपी चन्दन', 'तुलसी दल', 'पंचामृत', 'नीलाम्बरी अथवा पीताम्बरी वस्त्र'],
      steps: [
        'शुद्ध आसन पर पूर्वाभिमुख अथवा उत्तराभिमुख होकर बैठें।',
        'श्री राधारानी के चरणों का ध्यान कर मन को एकाग्र करें।',
        'लयबद्ध एवं भक्तिभाव से एक-एक चरण का उच्चारण करें।',
        'अन्तिम श्लोक पर वृन्दावन धूलि का स्मरण करते हुए मस्तक टेकें।'
      ],
      benefits: 'श्री राधारानी का अहैतुक अनुग्रह, निकुंज वास, काम-क्रोधादि से मुक्ति और अनन्य रसभक्ति की उपलब्धि।'
    },
    stanzas: [
      {
        stanzaNumber: 1,
        textDevanagari: [
          'मुनीन्द्रवृन्दवन्दिते त्रिलोकशोकहारिणि,',
          'प्रसन्नवक्त्रपङ्कजे निकुञ्जभूविलासिनी।',
          'व्रजेन्द्रभानुन्दिनि प्रपुण्यशैलशिल्पिनि,',
          'कदा करिष्यसीह मां कृपाकटाक्षभाजनम्॥ १ ॥'
        ],
        meaning: 'श्रेष्ठ मुनियों द्वारा वंदित, तीनों लोकों के दुखों को हरने वाली, प्रफुल्ल मुखकमल वाली, निकुंज में विलास करने वाली, हे वृषभानुनन्दिनी! आप मुझे अपने कृपा-कटाक्ष का पात्र कब बनाएंगी?'
      },
      {
        stanzaNumber: 2,
        textDevanagari: [
          'अशोकवृक्षवल्लरी वितानमण्डपस्थिते,',
          'प्रवालहेममालिनी सुवर्णपद्मधारिणि।',
          'सुचामरोत्कराभितः सुविप्रमण्डलार्चिते,',
          'कदा करिष्यसीह मां कृपाकटाक्षभाजनम्॥ २ ॥'
        ],
        meaning: 'अशोक वृक्ष की लताओं से वेष्टित मण्डप में विराजने वाली, सुवर्णमाला धारण करने वाली, हाथ में कमल पुष्प लिए, हे किशोरी जी! कब मुझ दीन पर आपका कृपा-कटाक्ष बरसेगा?'
      }
    ],
    tags: ['राधा कृपा कटाक्ष', 'राधारानी', 'बरसाना', 'स्तोत्र', 'निकुंज']
  },
  {
    id: 'shri-banke-bihari-aarti',
    slug: 'shri-banke-bihari-aarti',
    title: 'Shri Banke Bihari Aarti',
    titleDevanagari: 'श्री बांके बिहारी जी की आरती: श्री बांके बिहारी तेरी आरती गाऊं',
    category: 'aarti',
    categoryHindi: 'आरती',
    deity: 'Shri Banke Bihari Ji',
    deityDevanagari: 'श्री बांके बिहारी लाल जू',
    author: 'परम्परागत ब्रज रसिक',
    totalVerses: 7,
    durationMinutes: 5,
    pujaVidhi: {
      timing: 'प्रातःकाल श्रृंगार समय अथवा संध्याकाल',
      requiredItems: ['कपूर की पावन आरती', 'गुलाब जल', 'यमुना जल', 'चन्दन', 'भोग प्रसाद'],
      steps: [
        'आरती के थाल को प्रभु के चरणों से प्रारम्भ कर मुखकमल तक चतुर्दिश घुमाएं।',
        'ठाकुर जी के सुकोमल भाव को स्मरण करते हुए मधुर स्वर में गायन करें।',
        'आरती के उपरांत दोनों हाथों से दिव्य ज्योति ग्रहण करें।'
      ],
      benefits: 'संसार ताप का निवारण, मानसिक शांति और बांके बिहारी जी का निरंतर सानिध्य।'
    },
    stanzas: [
      {
        stanzaNumber: 1,
        textDevanagari: [
          'श्री बांके बिहारी तेरी आरती गाऊं,',
          'कुंज बिहारी तेरी आरती गाऊं।',
          'श्री श्यामसुन्दर तेरी आरती गाऊं,',
          'हे गिरिधर तेरी आरती गाऊं॥'
        ],
        meaning: 'हे बांके बिहारी! हे कुंज बिहारी! हे नन्दनन्दन श्यामसुन्दर! मैं नतमस्तक होकर आपकी मंगल आरती गाता हूँ।'
      },
      {
        stanzaNumber: 2,
        textDevanagari: [
          'मोर मुकुट प्रभु शीश पे सोहे,',
          'प्यारी बंशी मेरो मन मोहे।',
          'देखि छवि बलिहारी जाऊं,',
          'श्री बांके बिहारी तेरी आरती गाऊं॥'
        ],
        meaning: 'शीश पर मयूर पंख का मुकुट सुशोभित है और अधरों पर रखी बंशी मन को मोह लेती है। आपकी इस अप्रतिम छवि पर मैं बार-बार बलिहारी जाता हूँ।'
      }
    ],
    tags: ['बांके बिहारी आरती', 'आरती', 'वृन्दावन', 'नित्य उपासना']
  }
];

// ==========================================
// Service Implementation with Caching
// ==========================================

export class SacredSectionService {
  /**
   * Fetch Stories Index with 3-tier cache (Memory -> IDB -> Network -> Fallback)
   */
  static async getStoriesIndex(): Promise<SacredStoryPreview[]> {
    if (cachedStoriesIndex && cachedStoriesIndex.length > 0) {
      return cachedStoriesIndex;
    }

    // Try IndexedDB
    try {
      const persisted = await idbGet<SacredStoryPreview[]>(IDB_KEY_STORIES_INDEX);
      if (persisted && persisted.length > 0) {
        cachedStoriesIndex = persisted;
        // background sync
        this.syncStoriesIndexFromNetwork();
        return persisted;
      }
    } catch {
      // Continue to network
    }

    // Try Network
    try {
      const res = await fetch('/data/stories/index.json');
      if (res.ok) {
        const manifest: CorpusIndexManifest<SacredStoryPreview> | SacredStoryPreview[] = await res.json();
        const items = Array.isArray(manifest) ? manifest : manifest.items || [];
        if (items.length > 0) {
          cachedStoriesIndex = items;
          idbSet(IDB_KEY_STORIES_INDEX, items).catch(() => {});
          return items;
        }
      }
    } catch {
      // Network failed or data directory not yet generated
    }

    // Fallback to seed data previews
    const fallbacks: SacredStoryPreview[] = SEED_STORIES.map((s) => ({
      id: s.id,
      slug: s.slug,
      title: s.title,
      titleDevanagari: s.titleDevanagari,
      category: s.category,
      categoryHindi: s.categoryHindi,
      summary: s.summary,
      readingTimeMinutes: s.readingTimeMinutes,
      chapterCount: s.chapters.length,
      characterCount: s.characters.length,
      tradition: s.tradition,
      tags: s.tags,
    }));
    cachedStoriesIndex = fallbacks;
    return fallbacks;
  }

  private static async syncStoriesIndexFromNetwork(): Promise<void> {
    try {
      const res = await fetch('/data/stories/index.json');
      if (res.ok) {
        const manifest: CorpusIndexManifest<SacredStoryPreview> | SacredStoryPreview[] = await res.json();
        const items = Array.isArray(manifest) ? manifest : manifest.items || [];
        if (items.length > 0) {
          cachedStoriesIndex = items;
          idbSet(IDB_KEY_STORIES_INDEX, items).catch(() => {});
        }
      }
    } catch {
      // silent background sync failure
    }
  }

  static async getStoryById(idOrSlug: string): Promise<SacredStory | null> {
    if (memoryStories.has(idOrSlug)) {
      return memoryStories.get(idOrSlug)!;
    }

    // Check seed collection first for instant 0ms resolve
    const seedMatch = SEED_STORIES.find((s) => s.id === idOrSlug || s.slug === idOrSlug);
    if (seedMatch) {
      memoryStories.set(idOrSlug, seedMatch);
      memoryStories.set(seedMatch.id, seedMatch);
      memoryStories.set(seedMatch.slug, seedMatch);
      return seedMatch;
    }

    // Try chunk fetch from public/data/stories/
    try {
      const chunkUrls = [
        `/data/stories/ch-${idOrSlug}.json`,
        `/data/stories/${idOrSlug}.json`,
      ];
      for (const url of chunkUrls) {
        try {
          const res = await fetch(url);
          if (res.ok) {
            const story: SacredStory = await res.json();
            memoryStories.set(idOrSlug, story);
            return story;
          }
        } catch {
          // continue
        }
      }
    } catch {
      // ignore
    }

    return null;
  }

  /**
   * Biographies Index
   */
  static async getBiographiesIndex(): Promise<SacredBiographyPreview[]> {
    if (cachedBiosIndex && cachedBiosIndex.length > 0) {
      return cachedBiosIndex;
    }

    try {
      const persisted = await idbGet<SacredBiographyPreview[]>(IDB_KEY_BIOS_INDEX);
      if (persisted && persisted.length > 0) {
        cachedBiosIndex = persisted;
        this.syncBiosIndexFromNetwork();
        return persisted;
      }
    } catch {
      // continue
    }

    try {
      const res = await fetch('/data/biographies/index.json');
      if (res.ok) {
        const manifest: CorpusIndexManifest<SacredBiographyPreview> | SacredBiographyPreview[] = await res.json();
        const items = Array.isArray(manifest) ? manifest : manifest.items || [];
        if (items.length > 0) {
          cachedBiosIndex = items;
          idbSet(IDB_KEY_BIOS_INDEX, items).catch(() => {});
          return items;
        }
      }
    } catch {
      // continue
    }

    const fallbacks: SacredBiographyPreview[] = SEED_BIOGRAPHIES.map((b) => ({
      id: b.id,
      slug: b.slug,
      name: b.name,
      nameDevanagari: b.nameDevanagari,
      titleHonorific: b.titleHonorific,
      period: b.period,
      tradition: b.tradition,
      samadhiPlace: b.samadhiLocation.place,
      worksCount: b.literaryWorks.length,
      lifeSummary: b.lifeSummary,
      tags: b.tags,
    }));
    cachedBiosIndex = fallbacks;
    return fallbacks;
  }

  private static async syncBiosIndexFromNetwork(): Promise<void> {
    try {
      const res = await fetch('/data/biographies/index.json');
      if (res.ok) {
        const manifest = await res.json();
        const items = Array.isArray(manifest) ? manifest : manifest.items || [];
        if (items.length > 0) {
          cachedBiosIndex = items;
          idbSet(IDB_KEY_BIOS_INDEX, items).catch(() => {});
        }
      }
    } catch {
      // silent
    }
  }

  static async getBiographyById(idOrSlug: string): Promise<SacredBiography | null> {
    if (memoryBios.has(idOrSlug)) {
      return memoryBios.get(idOrSlug)!;
    }

    const seedMatch = SEED_BIOGRAPHIES.find((b) => b.id === idOrSlug || b.slug === idOrSlug);
    if (seedMatch) {
      memoryBios.set(idOrSlug, seedMatch);
      memoryBios.set(seedMatch.id, seedMatch);
      memoryBios.set(seedMatch.slug, seedMatch);
      return seedMatch;
    }

    try {
      const chunkUrls = [
        `/data/biographies/bio-${idOrSlug}.json`,
        `/data/biographies/${idOrSlug}.json`,
      ];
      for (const url of chunkUrls) {
        try {
          const res = await fetch(url);
          if (res.ok) {
            const bio: SacredBiography = await res.json();
            memoryBios.set(idOrSlug, bio);
            return bio;
          }
        } catch {
          // continue
        }
      }
    } catch {
      // ignore
    }

    return null;
  }

  /**
   * Sacred Places (Dham & Tirtha) Index
   */
  static async getPlacesIndex(): Promise<SacredPlacePreview[]> {
    if (cachedPlacesIndex && cachedPlacesIndex.length > 0) {
      return cachedPlacesIndex;
    }

    try {
      const persisted = await idbGet<SacredPlacePreview[]>(IDB_KEY_PLACES_INDEX);
      if (persisted && persisted.length > 0) {
        cachedPlacesIndex = persisted;
        this.syncPlacesIndexFromNetwork();
        return persisted;
      }
    } catch {
      // continue
    }

    try {
      const res = await fetch('/data/places/index.json');
      if (res.ok) {
        const manifest = await res.json();
        const items = Array.isArray(manifest) ? manifest : manifest.items || [];
        if (items.length > 0) {
          cachedPlacesIndex = items;
          idbSet(IDB_KEY_PLACES_INDEX, items).catch(() => {});
          return items;
        }
      }
    } catch {
      // continue
    }

    const fallbacks: SacredPlacePreview[] = SEED_PLACES.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      nameDevanagari: p.nameDevanagari,
      dhamRegion: p.dhamRegion,
      regionNameHindi: p.regionNameHindi,
      briefSignificance: p.briefSignificance,
      deity: p.deity,
      deityDevanagari: p.deityDevanagari,
      parikramaKm: p.parikramaKm,
      tags: p.tags,
    }));
    cachedPlacesIndex = fallbacks;
    return fallbacks;
  }

  private static async syncPlacesIndexFromNetwork(): Promise<void> {
    try {
      const res = await fetch('/data/places/index.json');
      if (res.ok) {
        const manifest = await res.json();
        const items = Array.isArray(manifest) ? manifest : manifest.items || [];
        if (items.length > 0) {
          cachedPlacesIndex = items;
          idbSet(IDB_KEY_PLACES_INDEX, items).catch(() => {});
        }
      }
    } catch {
      // silent
    }
  }

  static async getPlaceById(idOrSlug: string): Promise<SacredPlace | null> {
    if (memoryPlaces.has(idOrSlug)) {
      return memoryPlaces.get(idOrSlug)!;
    }

    const seedMatch = SEED_PLACES.find((p) => p.id === idOrSlug || p.slug === idOrSlug);
    if (seedMatch) {
      memoryPlaces.set(idOrSlug, seedMatch);
      memoryPlaces.set(seedMatch.id, seedMatch);
      memoryPlaces.set(seedMatch.slug, seedMatch);
      return seedMatch;
    }

    try {
      const chunkUrls = [
        `/data/places/place-${idOrSlug}.json`,
        `/data/places/${idOrSlug}.json`,
      ];
      for (const url of chunkUrls) {
        try {
          const res = await fetch(url);
          if (res.ok) {
            const place: SacredPlace = await res.json();
            memoryPlaces.set(idOrSlug, place);
            return place;
          }
        } catch {
          // continue
        }
      }
    } catch {
      // ignore
    }

    return null;
  }

  /**
   * Sacred Rituals Index
   */
  static async getRitualsIndex(): Promise<SacredRitualPreview[]> {
    if (cachedRitualsIndex && cachedRitualsIndex.length > 0) {
      return cachedRitualsIndex;
    }

    try {
      const persisted = await idbGet<SacredRitualPreview[]>(IDB_KEY_RITUALS_INDEX);
      if (persisted && persisted.length > 0) {
        cachedRitualsIndex = persisted;
        this.syncRitualsIndexFromNetwork();
        return persisted;
      }
    } catch {
      // continue
    }

    try {
      const res = await fetch('/data/rituals/index.json');
      if (res.ok) {
        const manifest = await res.json();
        const items = Array.isArray(manifest) ? manifest : manifest.items || [];
        if (items.length > 0) {
          cachedRitualsIndex = items;
          idbSet(IDB_KEY_RITUALS_INDEX, items).catch(() => {});
          return items;
        }
      }
    } catch {
      // continue
    }

    const fallbacks: SacredRitualPreview[] = SEED_RITUALS.map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      titleDevanagari: r.titleDevanagari,
      category: r.category,
      categoryHindi: r.categoryHindi,
      deity: r.deity,
      deityDevanagari: r.deityDevanagari,
      totalVerses: r.totalVerses,
      durationMinutes: r.durationMinutes,
      tags: r.tags,
    }));
    cachedRitualsIndex = fallbacks;
    return fallbacks;
  }

  private static async syncRitualsIndexFromNetwork(): Promise<void> {
    try {
      const res = await fetch('/data/rituals/index.json');
      if (res.ok) {
        const manifest = await res.json();
        const items = Array.isArray(manifest) ? manifest : manifest.items || [];
        if (items.length > 0) {
          cachedRitualsIndex = items;
          idbSet(IDB_KEY_RITUALS_INDEX, items).catch(() => {});
        }
      }
    } catch {
      // silent
    }
  }

  static async getRitualById(idOrSlug: string): Promise<SacredRitual | null> {
    if (memoryRituals.has(idOrSlug)) {
      return memoryRituals.get(idOrSlug)!;
    }

    const seedMatch = SEED_RITUALS.find((r) => r.id === idOrSlug || r.slug === idOrSlug);
    if (seedMatch) {
      memoryRituals.set(idOrSlug, seedMatch);
      memoryRituals.set(seedMatch.id, seedMatch);
      memoryRituals.set(seedMatch.slug, seedMatch);
      return seedMatch;
    }

    try {
      const chunkUrls = [
        `/data/rituals/ritual-${idOrSlug}.json`,
        `/data/rituals/${idOrSlug}.json`,
      ];
      for (const url of chunkUrls) {
        try {
          const res = await fetch(url);
          if (res.ok) {
            const ritual: SacredRitual = await res.json();
            memoryRituals.set(idOrSlug, ritual);
            return ritual;
          }
        } catch {
          // continue
        }
      }
    } catch {
      // ignore
    }

    return null;
  }
}
