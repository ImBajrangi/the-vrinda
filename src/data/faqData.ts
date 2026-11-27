/**
 * Bilingual FAQ Repository combining @sant-vaani/frontend faqData.js
 * with practical guidance on Vrindopnisad reading & sadhana tools.
 */

export interface BilingualFaq {
  id: string;
  category: 'platform' | 'philosophy' | 'sadhana' | 'authenticity';
  questionHi: string;
  questionEn: string;
  answerHi: string;
  answerEn: string;
}

export const BILINGUAL_FAQS: BilingualFaq[] = [
  {
    id: 'what-is',
    category: 'platform',
    questionHi: 'वृन्दोपनिषद् (Vrindopnishad) क्या है?',
    questionEn: 'What is Vrindopnishad?',
    answerHi: 'वृन्दोपनिषद् वैदिक एवं ब्रज रसिक आध्यात्मिक धरोहर के संरक्षण हेतु समर्पित एक निःशुल्क डिजिटल आश्रम है। यहाँ संस्कृत श्लोक, पैंतालीस हज़ार से अधिक ब्रज वाणी पद, वाल्मीकि रामायण, श्रीमद्भागवत, आरती-चालीसा और संतों के चरित्र मूल पाठ एवं भावार्थ सहित उपलब्ध हैं।',
    answerEn: 'Vrindopnishad is a sacred digital sanctuary dedicated to preserving and sharing authentic spiritual and Vedic knowledge — including 44,000+ verses, epics, saints’ compositions, strotras, and commentaries in Devanagari, Roman transliteration, Hindi, and English.'
  },
  {
    id: 'etymology',
    category: 'philosophy',
    questionHi: '‘वृन्दोपनिषद्’ नाम का क्या अर्थ है?',
    questionEn: 'What does the word Vrindopnishad mean?',
    answerHi: 'यह शब्द दो पवित्र संस्कृत पदों ‘वृन्दा’ (वृन्दावन के पावन तुलसी कुंज एवं श्रीराधा-कृष्ण लीला धाम) और ‘उपनिषद्’ (सद्गुरु के समीप बैठकर प्राप्त होने वाला गोपनीय ब्रह्मज्ञान) के संयोग से बना है — अर्थात् ‘श्रीवृन्दावन से प्रवाहित दिव्य रसमय ज्ञान’।',
    answerEn: 'Vrindopnishad unites "Vrinda" (the sacred groves of Vrindavan) and "Upanishad" (wisdom received by sitting close to an Acharya) — meaning "the sacred knowledge flowing from Vrindavan."'
  },
  {
    id: 'is-free',
    category: 'platform',
    questionHi: 'क्या वृन्दोपनिषद् के सभी ग्रंथ और सुविधाएँ निःशुल्क हैं?',
    questionEn: 'Is Vrindopnishad free to use?',
    answerHi: 'हाँ, वृन्दोपनिषद् पूर्णतः निःशुल्क एवं विज्ञापन-मुक्त है। हमारा विश्वास है कि सनातन व रसिक वाणी ज्ञान बिना किसी आर्थिक बाधा के प्रत्येक साधक तक पहुँचना चाहिए।',
    answerEn: 'Yes, Vrindopnishad is completely free. Sacred spiritual literature should remain universally accessible without financial barriers.'
  },
  {
    id: 'languages',
    category: 'platform',
    questionHi: 'मंच पर पाठ किस-किस भाषा व लिपि में उपलब्ध है?',
    questionEn: 'What languages and scripts are available on the platform?',
    answerHi: 'मूल पाठ शुद्ध संस्कृत व ब्रज देवनागरी लिपि में, उच्चारण सुविधा के लिए रोमन / IAST लिप्यन्तरण में तथा अर्थ-विवेचन हिन्दी व अंग्रेजी दोनों भाषाओं में उपलब्ध हैं।',
    answerEn: 'Texts are presented in original Devanagari (Sanskrit & Braj Bhasha), Roman/Hinglish transliteration, with Hindi bhavarth and English explanations.'
  },
  {
    id: 'traditions',
    category: 'philosophy',
    questionHi: 'क्या वृन्दोपनिषद् किसी एक ही सम्प्रदाय तक सीमित है?',
    questionEn: 'Is Vrindopnishad associated with only one sect?',
    answerHi: 'वृन्दावन की श्री राधावल्लभ, हरिदासी (सखी), गौड़ीय, निम्बार्क और पुष्टिमार्गीय रसिक परंपराओं के साथ-साथ यह वाल्मीकि रामायण, गीता, भागवत, रामचरितमानस एवं सर्व-सनातन सन्त वाणी का समभाव से सम्मान व संकलन करता है।',
    answerEn: 'Rooted in Vrindavan’s Radhavallabh, Haridasi, and Gaudiya Vaishnava heritage, Vrindopnishad embraces seekers across all Sanatan lineages with scholarly care and reverence.'
  },
  {
    id: 'audio-chanting',
    category: 'sadhana',
    questionHi: 'क्या हम श्लोक और पदों का श्रवण भी कर सकते हैं?',
    questionEn: 'Can I listen to the verses being chanted?',
    answerHi: 'जी हाँ। पद पठन में Audio Shravan प्लेयर द्वारा शास्त्रीय राग-आधारित पाठ सुना जा सकता है और आरती-चालीसा व कथा पठन में इच्छा होने पर आप स्वयं शुभ घण्टा-नाद भी बजा सकते हैं। बिना आपकी अनुमति के कोई ध्वनि स्वतः नहीं बजती।',
    answerEn: 'Yes, Padavali compositions feature the optional Audio Shravan player, and temple chimes can be sounded on demand during worship reading without intrusive auto-play.'
  },
  {
    id: 'authenticity',
    category: 'authenticity',
    questionHi: 'क्या संस्कृत श्लोक और रसिक वाणी पाठ प्रामाणिक व सत्यापित हैं?',
    questionEn: 'Are the Sanskrit and Braj texts authenticated?',
    answerHi: 'समस्त ग्रंथ प्राचीन हस्तलिखित पाण्डुलिपियों, परम्परागत मठों के प्रामाणिक संस्करणों व संस्कृत-ब्रज विद्वानों की समीक्षा से मिलान कर शुद्ध देवनागरी में प्रकाशित किए जाते हैं।',
    answerEn: 'All texts are cross-checked against established scholarly editions, archival manuscripts, and traditional lineage publications to maintain linguistic fidelity.'
  },
  {
    id: 'upanishads-comparison',
    category: 'philosophy',
    questionHi: 'वैदिक उपनिषदों और वृन्दोपनिषद् में क्या सम्बन्ध है?',
    questionEn: 'How does Vrindopnishad compare with the classical Upanishads?',
    answerHi: 'जहाँ प्राचीन वैदिक उपनिषद निर्गुण-निराकार ब्रह्म और ज्ञान मार्ग की प्रतिष्ठा करते हैं, वहीं वृन्दोपनिषद् ‘रसो वै सः’ की श्रुति के अनुरूप उसी परम सत्ता को श्रीराधा-कृष्ण के मधुर रस और प्रेमा-भक्ति के रूप में उपासना का मार्ग दिखाता है।',
    answerEn: 'While classical Upanishads emphasize Jnana and formless Brahman realization, Vrindopnishad synthesizes Upanishadic truth with Bhakti — experiencing the Divine as Raso Vai Sah in Vrindavan.'
  },
  {
    id: 'word-dictionary',
    category: 'sadhana',
    questionHi: 'ब्रजभाषा के कठिन शब्दों का अर्थ पढ़ते समय कैसे समझें?',
    questionEn: 'How do I understand archaic Braj Bhasha terms while reading?',
    answerHi: 'आप पद्यावली पाठ में ‘शब्दकोश अध्ययन’ विकल्प खोलकर उस पद में आए कठिन ब्रज शब्दों का तुरंत अर्थ देख सकते हैं, या मुख्य ‘ब्रज शब्दकोश (/glossary)’ में विस्तृत दार्शनिक व्याख्या पढ़ सकते हैं।',
    answerEn: 'Use the interactive Braj Word Study panel inside Padavali Reader or explore the complete Braj Bhasha Glossary (/glossary) for etymology, meaning, and scriptural references.'
  },
  {
    id: 'offline-cache',
    category: 'platform',
    questionHi: 'क्या यह ऐप धीमे नेटवर्क या मोबाइल पर सुचारु चलता है?',
    questionEn: 'Does Vrindopnishad work smoothly on slower mobile devices?',
    answerHi: 'जी हाँ। ग्रंथों व पर्व-अध्यायों को छोटे-छोटे ऑन-डिमांड खण्डों में बाँटा गया है तथा IndexedDB ऑफलाइन कैश प्रणाली से एक बार पढ़ा गया पाठ दोबारा बिना प्रतीक्षा के तुरंत खुलता है।',
    answerEn: 'Yes. Scriptures are split into tiny micro-chunks backed by IndexedDB offline caching so opened chapters and verses reopen instantaneously on any device.'
  }
];
