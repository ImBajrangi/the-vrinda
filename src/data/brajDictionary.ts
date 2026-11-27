/**
 * Interactive Braj Bhasha & Sanskrit Sacred Vocabulary Engine
 * Ported from @sant-vaani/frontend to power tap-to-inspect word tooltips
 * and interactive Pad Vocabulary Study inside Vrindopnisad readers.
 */

export interface WordDefinition {
  word: string;
  translit: string;
  meaning: string;
  english: string;
  category: 'संज्ञा' | 'विशेषण' | 'क्रिया' | 'भाव' | 'स्थान';
}

export const BRAJ_DICTIONARY: Record<string, WordDefinition> = {
  'लाडिली': { word: 'लाडिली', translit: 'Laadili', meaning: 'अति लाड़ली व परम प्यारी श्री राधा रानी', english: 'Most beloved Sri Radha', category: 'संज्ञा' },
  'किशोरी': { word: 'किशोरी', translit: 'Kishori', meaning: 'नित्य नूतन यौवनमयी श्रीजी (श्री राधा)', english: 'Ever-youthful Divine Maiden', category: 'संज्ञा' },
  'नवल': { word: 'नवल', translit: 'Naval', meaning: 'सदा नवीन / चिर युवा / अद्भुत', english: 'Ever-fresh / youthful', category: 'विशेषण' },
  'छबीली': { word: 'छबीली', translit: 'Chhabili', meaning: 'परम रूपवान व लावण्यमयी श्रीजी', english: 'Radiantly graceful & charming', category: 'विशेषण' },
  'रसिक': { word: 'रसिक', translit: 'Rasik', meaning: 'दिव्य प्रेम रस के मर्मज्ञ व रसास्वादन करने वाले संत', english: 'Connoisseur of divine aesthetic love', category: 'संज्ञा' },
  'युगल': { word: 'युगल', translit: 'Yugal', meaning: 'श्री प्रिया-प्रीतम (श्री राधा-कृष्ण का युगल रूप)', english: 'The Divine Pair (Radha-Krishna)', category: 'संज्ञा' },
  'तन': { word: 'तन', translit: 'Tan', meaning: 'श्रीअंग / दिव्य कांति / गौर-श्याम विग्रह', english: 'Transcendental divine form', category: 'संज्ञा' },
  'राजति': { word: 'राजति', translit: 'Raajati', meaning: 'सुशोभित होती हैं / दिव्य रूप से विराजती हैं', english: 'Reigns radiantly / Splendidly adorned', category: 'क्रिया' },
  'जोरी': { word: 'जोरी', translit: 'Jori', meaning: 'दिव्य युगल जोड़ी (श्री राधा-कृष्ण)', english: 'Divine eternal pair', category: 'संज्ञा' },
  'नैननि': { word: 'नैननि', translit: 'Nainani', meaning: 'नेत्रों द्वारा / नयनों से निरखकर', english: 'Through the eyes', category: 'संज्ञा' },
  'सचुपावत': { word: 'सचुपावत', translit: 'Sachupaavat', meaning: 'परम सुख प्राप्त करते हैं / तृप्त होते हैं', english: 'Deriving transcendental bliss', category: 'क्रिया' },
  'कौतिक': { word: 'कौतिक', translit: 'Kautik', meaning: 'अद्भुत नित्य-क्रीड़ा / कौतुक / दिव्य लीला', english: 'Playful wonder / Divine pastime', category: 'भाव' },
  'निपट': { word: 'निपट', translit: 'Nipat', meaning: 'सर्वथा / अत्यंत / पूर्ण रूप से', english: 'Utterly / Completely', category: 'विशेषण' },
  'रसीले': { word: 'रसीले', translit: 'Raseele', meaning: 'दिव्य रस से परिपूर्ण / रसमयी / आनंददायक', english: 'Full of transcendental aesthetic nectar', category: 'विशेषण' },
  'मदन': { word: 'मदन', translit: 'Madan', meaning: 'कामदेव (जिन्हें मुग्ध करने वाले मदन-मोहन)', english: 'Cupid / Lord of desire', category: 'संज्ञा' },
  'सदन': { word: 'सदन', translit: 'Sadan', meaning: 'धाम / परम पावन निकुंज निवास', english: 'Abode / Divine dwelling', category: 'स्थान' },
  'सागर': { word: 'सागर', translit: 'Saagar', meaning: 'अथाह सिंधु / आनंद का महासागर', english: 'Boundless ocean of nectar', category: 'संज्ञा' },
  'नागरि': { word: 'नागरि', translit: 'Naagari', meaning: 'परम चतुर व रसिका शिरोमणि श्री राधा रानी', english: 'Wise & charming Queen of Divine Love', category: 'संज्ञा' },
  'कुंवरि': { word: 'कुंवरि', translit: 'Kunwari', meaning: 'श्री वृषभानु राजकुमारी (श्री राधा जी)', english: 'Divine Princess Sri Radha', category: 'संज्ञा' },
  'गोरी': { word: 'गोरी', translit: 'Gori', meaning: 'तप्त कंचन जैसी गौर वर्णमयी श्री राधा', english: 'Fair radiant golden Sri Radha', category: 'विशेषण' },
  'स्याम': { word: 'स्याम', translit: 'Syam', meaning: 'नीलमणि श्यामल वर्ण नंदनंदन श्रीकृष्ण', english: 'Dark-complexioned Lord Krishna', category: 'संज्ञा' },
  'सुंदर': { word: 'सुंदर', translit: 'Sundar', meaning: 'मनोहर / अलौकिक रूपवान', english: 'Exquisitely beautiful', category: 'विशेषण' },
  'नयोरी': { word: 'नयोरी', translit: 'Nayori', meaning: 'नित्य नूतन / अद्भुत नवीन', english: 'Ever-novel / pristine', category: 'विशेषण' },
  'प्रिया': { word: 'प्रिया', translit: 'Priya', meaning: 'प्राणप्यारी श्री राधा जी', english: 'Beloved Sri Radha', category: 'संज्ञा' },
  'प्रीतम': { word: 'प्रीतम', translit: 'Pritam', meaning: 'प्राणनाथ श्रीकृष्ण', english: 'Beloved Lord Krishna', category: 'संज्ञा' },
  'मनमोहन': { word: 'मनमोहन', translit: 'Manmohan', meaning: 'मन को मुग्ध करने वाले नंदनंदन श्रीकृष्ण', english: 'All-attractive Lord Krishna', category: 'संज्ञा' },
  'श्याम': { word: 'श्याम', translit: 'Shyam', meaning: 'नीलमेघ श्यामल श्रीकृष्ण', english: 'Dark-complexioned Beloved Krishna', category: 'संज्ञा' },
  'गौर': { word: 'गौर', translit: 'Gaur', meaning: 'तप्त सुवर्ण जैसी गौर कांति वाली श्री राधा', english: 'Golden luminous complexion', category: 'विशेषण' },
  'केकी': { word: 'केकी', translit: 'Keki', meaning: 'मयूर / मोर जो वृन्दावन में नर्तन करते हैं', english: 'Peacock', category: 'संज्ञा' },
  'बनराज': { word: 'बनराज', translit: 'Banraj', meaning: 'वनों का राजा / पावन श्री वृन्दावन धाम', english: 'King of forests / Sri Vrindavan', category: 'स्थान' },
  'कूक': { word: 'कूक', translit: 'Kook', meaning: 'पक्षियों विशेषकर मोर या कोयल की मधुर पुकार', english: 'Sweet bird call / melody', category: 'भाव' },
  'सुजस': { word: 'सुजस', translit: 'Sujas', meaning: 'पवित्र यश / दिव्य महिमा', english: 'Sacred fame / glory', category: 'भाव' },
  'लता': { word: 'लता', translit: 'Lata', meaning: 'निकुंजों की दिव्य व मनोहारिणी बेल', english: 'Divine flowering creeper', category: 'संज्ञा' },
  'द्रुम': { word: 'द्रुम', translit: 'Drum', meaning: 'वृन्दावन के दिव्य कल्पवृक्ष', english: 'Divine trees of Vrindavan', category: 'संज्ञा' },
  'निकुंजन': { word: 'निकुंजन', translit: 'Nikunjan', meaning: 'सघन लता-वृक्षों से आच्छादित दिव्य कुंज', english: 'Sacred flowering bower/grove', category: 'स्थान' },
  'रज': { word: 'रज', translit: 'Raj', meaning: 'श्री वृन्दावन की पावन व चिन्मय चरण-धूलि', english: 'Sacred dust of Vrindavan', category: 'संज्ञा' },
  'रेनुका': { word: 'रेनुका', translit: 'Renuka', meaning: 'धूलि का एक-एक दिव्य कण', english: 'Sacred dust particle', category: 'संज्ञा' },
  'पंकजन': { word: 'पंकजन', translit: 'Pankajan', meaning: 'कमल / श्री युगल के चरण कमल', english: 'Lotus flowers / Lotus feet', category: 'संज्ञा' },
  'सीस': { word: 'सीस', translit: 'Sees', meaning: 'मस्तक / सिर (जिस पर रज धारण की जाती है)', english: 'Head / Forehead', category: 'संज्ञा' },
  'रंगरेली': { word: 'रंगरेली', translit: 'Rangreli', meaning: 'परमानंद भरी दिव्य प्रेम-क्रीड़ा', english: 'Joyful divine pastime of bliss', category: 'भाव' },
  'केलि': { word: 'केलि', translit: 'Keli', meaning: 'नित्य विहार / दिव्य रास-विलास', english: 'Divine transcendental amorous play', category: 'भाव' },
  'विहार': { word: 'विहार', translit: 'Vihar', meaning: 'श्री प्रिया-प्रियतम का नित्य अगाध प्रेम संचार', english: 'Eternal divine pastimes', category: 'भाव' },
  'रास': { word: 'रास', translit: 'Raas', meaning: 'गोपियों व श्रीराधा-कृष्ण का दिव्य महा-नृत्य व रस-सागर', english: 'Supreme dance of divine love', category: 'भाव' },
  'सिरोमनी': { word: 'सिरोमनी', translit: 'Siromani', meaning: 'मुकुटमणि / सर्वश्रेष्ठ / सर्वोच्च', english: 'Crown jewel / Supreme pinnacle', category: 'विशेषण' },
  'कुलीन': { word: 'कुलीन', translit: 'Kuleen', meaning: 'रस-रीति में परम प्रवीण व उत्तम', english: 'Expert in divine aesthetics', category: 'विशेषण' },
  'सकल': { word: 'सकल', translit: 'Sakal', meaning: 'समस्त / सम्पूर्ण / सारा संसार', english: 'All / Entire universe', category: 'विशेषण' },
  'रसमूरति': { word: 'रसमूरति', translit: 'Rasmurati', meaning: 'दिव्य प्रेम रस की साक्षात मूर्ति', english: 'Living Embodiment of Nectar', category: 'संज्ञा' },
  'हितलीन': { word: 'हितलीन', translit: 'Hitleen', meaning: 'परम हित / अनन्य प्रेम रस में सदा लीन', english: 'Absorbed in eternal divine grace', category: 'भाव' },
  'अनुराग': { word: 'अनुराग', translit: 'Anuraag', meaning: 'निःस्वार्थ व प्रगाढ़ अनन्य प्रेम', english: 'Unconditional, intense spiritual love', category: 'भाव' },
  'माधुरी': { word: 'माधुरी', translit: 'Madhuri', meaning: 'अमृतमयी मिठास व नयनाभिराम सौंदर्य', english: 'Celestial sweetness and charm', category: 'भाव' },
  'छवि': { word: 'छवि', translit: 'Chhavi', meaning: 'दिव्य रूप का आलौकिक तेज व लावण्य', english: 'Radiant spiritual beauty', category: 'संज्ञा' },
  'नेह': { word: 'नेह', translit: 'Neh', meaning: 'कोमल स्नेह / निर्मल प्रेम', english: 'Tender affectionate devotion', category: 'भाव' },
  'करुणा': { word: 'करुणा', translit: 'Karuna', meaning: 'अहैतुकी दया व कृपा का प्रवाह', english: 'Uncaused compassion and mercy', category: 'भाव' },
  'दासी': { word: 'दासी', translit: 'Dasi', meaning: 'श्री राधा जी की चरण-सेविका सखी (मंजरी भाव)', english: 'Loving devotee maiden servitor', category: 'संज्ञा' },
  'अंगन': { word: 'अंगन', translit: 'Angan', meaning: 'श्री युगल सरकार का चिन्मय श्रीविग्रह / श्रीअंग', english: 'Transcendental divine form', category: 'संज्ञा' },
  'चरण': { word: 'चरण', translit: 'Charan', meaning: 'पावन चरण कमल', english: 'Holy lotus feet', category: 'संज्ञा' },
  'अमृत': { word: 'अमृत', translit: 'Amrit', meaning: 'अमरता व परमानंद प्रदान करने वाला रस', english: 'Immortal nectar of supreme bliss', category: 'संज्ञा' },
  'कुंज': { word: 'कुंज', translit: 'Kunj', meaning: 'लता-गुल्मों से घिरा एकांत पावन स्थल', english: 'Sacred grove / bower', category: 'स्थान' },
  'मंजरी': { word: 'मंजरी', translit: 'Manjari', meaning: 'श्री प्रिया-प्रियतम की अंतरंग सेविका सखी', english: 'Intimate confidential maiden', category: 'संज्ञा' },
  'हित': { word: 'हित', translit: 'Hit', meaning: 'परम कल्याणकारी शुद्ध अहैतुक प्रेम', english: 'Supreme selfless divine love', category: 'भाव' },
  'सखी': { word: 'सखी', translit: 'Sakhi', meaning: 'श्री राधा जी की प्राण-सहचरी सखी', english: 'Divine companion & eternal friend', category: 'संज्ञा' },
  'विलास': { word: 'विलास', translit: 'Vilas', meaning: 'आनंदमय क्रीड़ा व लीलामय सौंदर्य', english: 'Playful ecstatic splendor', category: 'भाव' },
  'माधव': { word: 'माधव', translit: 'Madhav', meaning: 'मा (लक्ष्मी/राधा) के स्वामी श्रीकृष्ण', english: 'Lord Krishna, master of all fortune', category: 'संज्ञा' },
  'गोविन्द': { word: 'गोविन्द', translit: 'Govind', meaning: 'गौवों व इंद्रियों को आनंद देने वाले श्रीकृष्ण', english: 'Lord who pleases cows and senses', category: 'संज्ञा' },
  'प्यारो': { word: 'प्यारो', translit: 'Pyaaro', meaning: 'प्राणप्रिय श्री श्यामसुंदर या श्री युगल सरकार', english: 'Beloved Divine Lord', category: 'संज्ञा' },
  'मोहि': { word: 'मोहि', translit: 'Mohi', meaning: 'मुझे / मेरे हृदय को', english: 'To me / Unto my heart', category: 'भाव' },
  'भावै': { word: 'भावै', translit: 'Bhaavai', meaning: 'प्रिय लगता है / हृदय को भाता है', english: 'Pleases / Delights the heart', category: 'क्रिया' },
  'जोई': { word: 'जोई', translit: 'Joi', meaning: 'जो कुछ भी (निःशर्त समर्पण का भाव)', english: 'Whatever / Whichever', category: 'विशेषण' },
  'सहज': { word: 'सहज', translit: 'Sahaj', meaning: 'स्वाभाविक, अकृत्रिम एवं अनादि', english: 'Natural, innate, effortless', category: 'विशेषण' },
  'मुरली': { word: 'मुरली', translit: 'Murali', meaning: 'श्रीकृष्ण की मनमोहनी वंशी / वेणु', english: 'Divine flute of Lord Krishna', category: 'संज्ञा' },
  'बंसी': { word: 'बंसी', translit: 'Bansi', meaning: 'रास का आह्वान करने वाली वेणु', english: 'Enchanting bamboo flute', category: 'संज्ञा' },
  'राधे': { word: 'राधे', translit: 'Radhe', meaning: 'करुणामयी श्रीवृषभानुनन्दिनी राधारानी', english: 'Compassionate Supreme Devi Radha', category: 'संज्ञा' },
  'वृन्दावन': { word: 'वृन्दावन', translit: 'Vrindavan', meaning: 'तुलसी (वृन्दा) व प्रेम से परिपूर्ण नित्य निकुंज धाम', english: 'Eternal sacred forest of Vrinda', category: 'स्थान' },
  'यमुना': { word: 'यमुना', translit: 'Yamuna', meaning: 'श्री कालिन्दी महारानी, श्याम की रसमयी नदी', english: 'Sacred river Yamuna / Kalindi', category: 'स्थान' },
  'अनन्य': { word: 'अनन्य', translit: 'Ananya', meaning: 'एकमात्र, किसी अन्य का आश्रय न लेने वाला', english: 'Unwaveringly single-pointed devotion', category: 'विशेषण' },
};

export function lookupBrajWord(rawWord: string): WordDefinition | null {
  if (!rawWord) return null;
  const clean = rawWord.replace(/[।॥,.\[\]()—–\-\d\s"'‘’“”]/g, '').trim();
  if (!clean || clean.length < 2) return null;

  if (BRAJ_DICTIONARY[clean]) {
    return BRAJ_DICTIONARY[clean];
  }

  for (const [key, val] of Object.entries(BRAJ_DICTIONARY)) {
    if (clean === key || clean.startsWith(key) || key.startsWith(clean)) {
      return { ...val, word: clean };
    }
  }

  for (const [key, val] of Object.entries(BRAJ_DICTIONARY)) {
    if (key.length >= 3 && clean.includes(key)) {
      return { ...val, word: clean };
    }
  }

  return null;
}

export function extractVerseDictionaryWords(verseText: string): WordDefinition[] {
  if (!verseText) return [];
  const seen = new Set<string>();
  const matched: WordDefinition[] = [];

  for (const [key, def] of Object.entries(BRAJ_DICTIONARY)) {
    if (verseText.includes(key) && !seen.has(key)) {
      seen.add(key);
      matched.push(def);
    }
  }
  return matched;
}
