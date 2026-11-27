/**
 * Sacred Braj & Sanatan Festival Heritage Collection
 * Expanded & bilingual (Hindi + English) from @sant-vaani/frontend festivalsData.js
 * Styled cleanly for SEO Article/FAQ rich results and joyful cultural contemplation.
 */

export interface FestivalFaq {
  questionHi: string;
  questionEn: string;
  answerHi: string;
  answerEn: string;
}

export interface FestivalGuideEntry {
  slug: string;
  name: string;
  hindiName: string;
  seasonTag: string;
  timelineHi: string;
  timelineEn: string;
  primaryTemple: string;
  recommendedRaga: string;
  descriptionHi: string;
  descriptionEn: string;
  historyHi: string;
  historyEn: string;
  meaningHi: string;
  meaningEn: string;
  celebrationHi: string;
  celebrationEn: string;
  plateImage: string;
  faqs: FestivalFaq[];
}

export const FESTIVALS_LIST: FestivalGuideEntry[] = [
  {
    slug: 'jhulan-yatra',
    name: 'Jhulan Yatra',
    hindiName: 'श्री झूलन यात्रा (सावन झूला महोत्सव)',
    seasonTag: 'पावस / सावन महोत्सव',
    timelineHi: 'श्रावण शुक्ल एकादशी से श्रावण पूर्णिमा (रक्षाबन्धन तक, ५ दिवसीय)',
    timelineEn: 'Shravana Shukla Ekadashi to Purnima (July–August)',
    primaryTemple: 'श्री राधावल्लभ मंदिर, श्री बांके बिहारी मंदिर, निधिवन राज',
    recommendedRaga: 'राग मल्हार व राग सारंग',
    descriptionHi: 'वर्षा ऋतु के मेघ-मल्हार मध्य श्री प्रिया-प्रीतम के स्वर्ण-रजत हिंडोले में झूलने की दिव्य रसिक लीला।',
    descriptionEn: 'The monsoon swing festival of Shri Radha Krishna in the green bowers of Vrindavan.',
    historyHi: 'झूलन यात्रा वृन्दावन के सर्वाधिक मनोहर उत्सवों में से एक है, जिसका उद्गम निधिवन और सेवा कुंज की पावस लीलाओं से हुआ। हरियाली तीज पर ठाकुर जी को हरे रेशमी वस्त्र धारण कराकर चमेली और स्वर्ण-रजत के हिंडोलों में विराजमान किया जाता है।',
    historyEn: 'Jhulan Yatra originates from the ancient monsoon pastimes of Shri Radha and Krishna swinging beneath emerald creepers in Nidhivan and Seva Kunj. Deities are adorned in verdant silk (Hariyali Teej) and seated on swings woven with jasmine and silver.',
    meaningHi: 'झूले की ऊँची-नीची गति मिलन के परमानन्द और स्नेह के मधुर उतार-चढ़ाव का प्रतीक है। गरजते मेघ, नाचते मयूर और रिमझिम फुहारें भी निकुंज विहार की इस रसमयी आराधना में सहभागी हो जाते हैं।',
    meaningEn: 'The swinging rhythm reflects the dynamic bliss of divine love, where clouds, peacocks, and raindrops join the secluded aesthetics of Nikunj Vihar.',
    celebrationHi: 'वृन्दावन के सप्त देवालयों व प्राचीन मंदिरों में चाँदी, सोने और चन्दन के हिंडोले पुष्पों से सजते हैं। रसिक भक्त राग मल्हार और सारंग में झूला-गीत गाते हुए सखी भाव से युगल सरकार को झूला झुलाते हैं।',
    celebrationEn: 'Across Vrindavan, silver and sandalwood swings bloom with fresh flowers while devotees sing seasonal Jhulan pads in Raga Malhar and Sarang.',
    plateImage: '/assets/darshan/barsana-radhavallabh-jhanki.webp',
    faqs: [
      {
        questionHi: 'वृन्दावन में झूलन यात्रा कब मनाई जाती है?',
        questionEn: 'When is Jhulan Yatra celebrated?',
        answerHi: 'हर वर्ष वर्षा ऋतु में हरियाली तीज से आरम्भ होकर मुख्यतः श्रावण शुक्ल एकादशी से पूर्णिमा (रक्षाबंधन) तक यह महामहोत्सव धूमधाम से मनाया जाता है।',
        answerEn: 'Every year in the monsoon month of Shravana, culminating from Shukla Ekadashi through Purnima.'
      },
      {
        questionHi: 'हिंडोले में झूला झूलने का आध्यात्मिक भाव क्या है?',
        questionEn: 'What is the spiritual significance of the swing?',
        answerHi: 'झूला (हिंडोला) युगल किशोर के अन्तरंग केलि विलास का प्रतीक है, जहाँ साधक सखी भाव से प्रिया-प्रीतम के सुख हेतु पेंग बढ़ाता है।',
        answerEn: 'The swing signifies the intimate loving play (Vihar) of Radha-Krishna, awakening Sakhi Bhava service in devotees.'
      }
    ]
  },
  {
    slug: 'radhashtami',
    name: 'Radhashtami',
    hindiName: 'श्री राधाष्टमी महामहोत्सव',
    seasonTag: 'प्राकट्य महोत्सव',
    timelineHi: 'भाद्रपद शुक्ल अष्टमी (अरुणोदय वेला, अगस्त–सितम्बर)',
    timelineEn: 'Bhadrapada Shukla Ashtami (August–September)',
    primaryTemple: 'श्री लाडिली लाल मंदिर (बरसाना), श्री राधावल्लभ मंदिर (वृन्दावन)',
    recommendedRaga: 'राग बिलावल व बधाई पद',
    descriptionHi: 'निकुंजेश्वरी करुणामयी श्री वृषभानुनन्दिनी राधारानी का पावन प्राकट्य दिवस एवं रसिक सम्प्रदायों का प्राणोत्सव।',
    descriptionEn: 'The divine appearance festival of Srimati Radharani in Barsana and across all Braj rasik lineages.',
    historyHi: 'बरसाना के रावल ग्राम व गहवर वन में भाद्रपद शुक्ल अष्टमी को श्रीजी का प्राकट्य हुआ। श्री हित हरिवंश महाप्रभु जी ने वृन्दावन में श्री राधावल्लभ लाल के प्रांगण में नौ-दिवसीय बधाई गान एवं महाभिषेक उत्सव की भव्य परम्परा प्रतिष्ठित की।',
    historyEn: 'Radhashtami commemorates the appearance of Srimati Radharani. In the Radhavallabh tradition founded by Shri Hit Harivansh Mahaprabhu, nine continuous days of celebratory Badhai pads and temple processions fill Vrindavan.',
    meaningHi: 'रसिक उपासना में श्री राधा रानी ही समस्त रस, करुणा और श्रीकृष्ण के आल्हाद की मूल सत्ता हैं। राधाष्टमी साधक को अभिमान छोड़कर श्रीजी के चरण कमलों में अनन्य शरणागति का स्मरण कराती है।',
    meaningEn: 'In Rasik bhakti, Shri Radha is the sovereign source of all compassion and divine joy. Celebrating Her appearance renews unconditional surrender (Radha Dasya).',
    celebrationHi: 'बरसाना व वृन्दावन के मंदिरों के पट प्रातः ४ बजे खुल जाते हैं। पंचामृत से महाभिषेक, चाव-बधाई के पद, केसर-हल्दी की वर्षा और संकीर्तन की छटा पूरे ब्रजमण्डल को पीताम्बरमय बना देती है।',
    celebrationEn: 'Temples open before dawn at 4 AM for Panchamrita Abhishek while saffron, turmeric, and joyous Badhai chants fill temple courtyards.',
    plateImage: '/assets/temples/barsana-radharani.webp',
    faqs: [
      {
        questionHi: 'वृन्दावन में राधाष्टमी का भव्य उत्सव किसने आरम्भ किया?',
        questionEn: 'Who established grand Radhashtami celebrations in Vrindavan?',
        answerHi: 'श्री हित हरिवंश महाप्रभु जी ने श्री राधावल्लभ सम्प्रदाय के माध्यम से वृन्दावन में नित्य बधाई गान और भव्य राधाष्टमी महोत्सव का शंखनाद किया।',
        answerEn: 'Shri Hit Harivansh Mahaprabhu established the grand Vrindavan celebration tradition centering all devotion on Radha Rani.'
      },
      {
        questionHi: 'राधाष्टमी व्रत किस प्रकार रखा जाता है?',
        questionEn: 'How is Radhashtami fasting observed?',
        answerHi: 'भक्तगण मध्याह्न वेला तक उपवास रखकर श्रीजी की जन्म-आरती, बधाई पद श्रवण तथा मध्याह्न प्रसाद पान कर व्रत पूर्ण करते हैं।',
        answerEn: 'Devotees fast until midday darshan and noon aarti before partaking in consecrated festive prasadam.'
      }
    ]
  },
  {
    slug: 'sharad-purnima',
    name: 'Sharad Purnima',
    hindiName: 'शरद पूर्णिमा (महारास महोत्सव)',
    seasonTag: 'शरद चन्द्रोदय',
    timelineHi: 'आश्विन शुक्ल पूर्णिमा (अक्टूबर)',
    timelineEn: 'Ashvina Purnima (October)',
    primaryTemple: 'वंशीवट, श्री बांके बिहारी मंदिर, सेवा कुंज',
    recommendedRaga: 'राग कल्याण व रास के पद',
    descriptionHi: 'सोलह कलाओं से परिपूर्ण शरद चन्द्र की चाँदनी में श्री वंशीवट पर हुए दिव्य महारास की अमर रात्रि।',
    descriptionEn: 'The eternal night of the Maharaas dance illuminated by the autumn full moon at Vanshivata.',
    historyHi: 'आश्विन पूर्णिमा की शीतल रात्रि में यमुना तट स्थित वंशीवट पर श्रीकृष्ण ने वेणु नाद से गोपियों का आह्वान कर अनन्त महारास रचा। प्रत्येक गोपी के मध्य एक श्यामसुन्दर प्रकट होकर दिव्य नृत्य में लीन हुए।',
    historyEn: 'On the luminous night of Sharad Purnima, Krishna sounded His flute at Vanshivata beside the Yamuna, expanding Himself alongside every Gopi for the celestial Maharaas.',
    meaningHi: 'शरद महारास जीवात्मा और परमात्मा के निर्मल, अहंकार-रहित महामिलन का प्रतीक है। काम को भस्म कर शुद्ध निष्काम प्रेम रस की विजय ही इस रात्रि का गूढ़ रहस्य है।',
    meaningEn: 'The Maharaas represents the transcendental union of individual souls with the Supreme, where selfish desire dissolves into selfless aesthetic bliss (Rasa).',
    celebrationHi: 'सभी प्रमुख मंदिरों में ठाकुर जी धवल (श्वेत) जरी-पोशाक, मुकुट और वंशी धारण कर धवल दर्शन देते हैं। रात्रि में अमृतमयी चन्द्र-किरणों के नीचे खीर का भोग रखकर प्रातः प्रसाद रूप में वितरित किया जाता है।',
    celebrationEn: 'Deities wear shimmering white moonlight attire with golden crowns and flutes while milk kheer rests beneath full moonbeams to absorb cooling nectar.',
    plateImage: '/assets/temples/keshi-ghat.webp',
    faqs: [
      {
        questionHi: 'वंशीवट कहाँ स्थित है और इसका क्या महत्व है?',
        questionEn: 'What is the significance of Vanshivata?',
        answerHi: 'वंशीवट वृन्दावन में यमुना किनारे स्थित वह पावन वटवृक्ष है जहाँ शरद पूर्णिमा की रात्रि में श्रीकृष्ण ने वंशी बजाकर महारास प्रारम्भ किया था।',
        answerEn: 'Vanshivata is the sacred banyan grove beside the Yamuna where Krishna played His flute to summon the Gopis for Maharaas.'
      },
      {
        questionHi: 'शरद पूर्णिमा पर चाँदनी में खीर क्यों रखी जाती है?',
        questionEn: 'Why is kheer placed in moonlight on Sharad Purnima?',
        answerHi: 'शास्त्र मान्यता के अनुसार शरद पूर्णिमा को चन्द्रमा अपनी सम्पूर्ण सोलह कलाओं से अमृतमयी रश्मियाँ बरसाता है, जिन्हें श्वेत खीर ग्रहण कर आरोग्यता प्रदान करती है।',
        answerEn: 'The moon radiates all sixteen celestial kalas on this night, infusing the milk pudding with cooling spiritual vitality.'
      }
    ]
  },
  {
    slug: 'latthmar-holi',
    name: 'Braj Holi & Rangotsav',
    hindiName: 'ब्रज होरी एवं रंगोत्सव (बरसाना-नन्दगाँव)',
    seasonTag: 'वसन्त / फाल्गुन',
    timelineHi: 'वसन्त पंचमी से फाल्गुन पूर्णिमा एवं रंग पंचमी तक (४० दिवसीय)',
    timelineEn: 'Basant Panchami through Phalguna Purnima (40-day Braj Utsav)',
    primaryTemple: 'श्री राधारानी मंदिर बरसाना, श्री बांके बिहारी, दाऊजी मंदिर',
    recommendedRaga: 'राग धमार, काफ़ी व होरी पद',
    descriptionHi: 'वसन्त पंचमी से आरम्भ होकर ४० दिन चलने वाला ब्रज का अलौकिक गुलाल, धमार कीर्तन व लट्ठमार होरी महोत्सव।',
    descriptionEn: 'Vrindavan’s legendary 40-day festival of spring colors, Dhamar kirtan, and playful Braj devotion.',
    historyHi: 'वसन्त पंचमी के दिन श्री बांके बिहारी व श्री राधावल्लभ मंदिर में प्रथम गुलाल अर्पण से ब्रज की होरी आरम्भ होती है। लड्डूमार होरी, बरसाना की लट्ठमार होरी, नन्दगाँव उत्सव और दाऊजी के हुरंगे तक सम्पूर्ण ब्रज प्रेम-रंग में सराबोर हो जाता है।',
    historyEn: 'Opening on Basant Panchami with the first offering of gulal, Braj celebrates forty unbroken days of Ladoo Holi, Barsana Latthmar Holi, Nandgaon festivities, and Dauji Huranga.',
    meaningHi: 'रसिकों की होरी बाहरी रंगों से अधिक श्री युगल सरकार के अनुराग-रंग में हृदय के रँग जाने का उत्सव है — जिसमें अभिमान गलकर प्रेम की पिचकारी में समा जाता है।',
    meaningEn: 'More than outward pigment, Braj Holi symbolizes drenching the heart in pure Anuraag (divine affection) and shedding worldly pride.',
    celebrationHi: 'टेसू के फूलों का केसरिया जल, अबीर-गुलाल की वर्षा और मृदंग की थाप पर रसिक संतों के होरी-धमार के पद पूरे परिक्रमा मार्ग व देवालयों में गूँजते हैं।',
    celebrationEn: 'Saffron tesu-flower showers, rosewater, and rhythmic Dhamar-Hori compositions echo throughout Vrindavan and Barsana temples.',
    plateImage: '/assets/darshan/radharaman-gulabi-pag.webp',
    faqs: [
      {
        questionHi: 'ब्रज में होरी उत्सव कितने दिन चलता है?',
        questionEn: 'How long does the Braj Holi festival last?',
        answerHi: 'ब्रज मण्डल के मंदिरों में होरी उत्सव वसन्त पंचमी से आरम्भ होकर फाल्गुन पूर्णिमा के पश्चात् रंग पंचमी तक पूरे ४०–४५ दिनों तक चलता है।',
        answerEn: 'From Basant Panchami in late winter all the way to Rang Panchami after Phalguna Purnima (around 40 days).'
      }
    ]
  },
  {
    slug: 'krishna-janmashtami',
    name: 'Shri Krishna Janmashtami & Nandotsav',
    hindiName: 'श्री कृष्ण जन्माष्टमी एवं नन्दोत्सव',
    seasonTag: 'प्राकट्य महोत्सव',
    timelineHi: 'भाद्रपद कृष्ण अष्टमी (अर्धरात्रि रोहिणी नक्षत्र) एवं नवमी नन्दोत्सव',
    timelineEn: 'Bhadrapada Krishna Ashtami Midnight & Next Morning Nandotsav',
    primaryTemple: 'श्री कृष्ण जन्मभूमि मथुरा, श्री बांके बिहारी मंदिर, श्री राधारमण मंदिर',
    recommendedRaga: 'राग देवगन्धार व बधाई कीर्तन',
    descriptionHi: 'अर्धरात्रि के पावन अवतरण, दिव्य मंगला आरती तथा अगले प्रातः नन्दोत्सव की वात्सल्य रस धारा।',
    descriptionEn: 'The midnight birth celebration of Lord Shri Krishna followed by morning Nandotsav festivities in Braj.',
    historyHi: 'भाद्रपद कृष्ण अष्टमी की मध्यरात्रि रोहिणी नक्षत्र में मथुरा में भगवान श्रीकृष्ण का प्राकट्य हुआ। वृन्दावन के श्री बांके बिहारी मंदिर में वर्ष में केवल इसी रात्रि को एकमात्र मङ्गला आरती के दर्शन होते हैं, जबकि श्री राधारमण जी में अभिषेक दिन में किया जाता है।',
    historyEn: 'Commemorating Lord Krishna’s midnight appearance in Mathura, Vrindavan’s Banke Bihari Temple opens uniquely once a year for midnight Mangala Aarti.',
    meaningHi: 'जन्माष्टमी जीवन के तमस (अन्धकार) में परमात्मा के करुणामय प्राकट्य तथा नन्दोत्सव उस आनन्द को निःस्वार्थ लुटाने के वात्सल्य भाव का पर्व है।',
    meaningEn: 'Janmashtami signifies light piercing cosmic darkness, while Nandotsav embodies overflowing paternal love and generosity.',
    celebrationHi: 'भक्तगण निर्जला या फलाहार व्रत रखकर मध्यरात्रि शंख-घण्टा नाद के साथ जन्म दर्शन, पंचामृत अभिषेक व छप्पन भोग अर्पण करते हैं।',
    celebrationEn: 'Devotees observe fasts until midnight conch and bell chants welcome the birth darshan, Panchamrita snan, and 56-item Annakut offerings.',
    plateImage: '/assets/temples/banke-bihari.webp',
    faqs: [
      {
        questionHi: 'बांके बिहारी मंदिर में मङ्गला आरती कब होती है?',
        questionEn: 'When does Mangala Aarti happen at Banke Bihari Temple?',
        answerHi: 'श्री बांके बिहारी मंदिर में वर्ष में केवल एक बार, श्री कृष्ण जन्माष्टमी की मध्यरात्रि के पश्चात् ही पावन मङ्गला आरती सम्पन्न होती है।',
        answerEn: 'Only once a year after midnight on Shri Krishna Janmashtami.'
      }
    ]
  },
  {
    slug: 'gopashtami',
    name: 'Gopashtami & Akshay Navami',
    hindiName: 'श्री गोपाष्टमी व ब्रज गोचारण महोत्सव',
    seasonTag: 'कार्तिक मास उत्सव',
    timelineHi: 'कार्तिक शुक्ल अष्टमी (अक्टूबर–नवम्बर)',
    timelineEn: 'Kartika Shukla Ashtami (Autumn)',
    primaryTemple: 'गौशाला, गोवर्धन, राधाकुण्ड, श्री राधा दामोदर मंदिर',
    recommendedRaga: 'राग सारंग व गोचारण पद',
    descriptionHi: 'नन्दनन्दन श्रीकृष्ण द्वारा प्रथम बार गौचारण वन-गमन एवं श्रीराधा जी के ग्वाल वेश धारण की मधुर लीला का पर्व।',
    descriptionEn: 'Celebrating the day young Krishna first led Braj’s cows into Vrindavan’s groves alongside Gopas.',
    historyHi: 'कार्तिक शुक्ल अष्टमी को नन्दबाबा ने श्रीकृष्ण व बलराम को बछड़ों से बड़ी गायों के चारण का अधिकार दिया। रसिक साहित्य में वर्णन है कि इस दिन प्रिया जी भी सखा रूप में श्रीकृष्ण के संग गोचारण वन पधारी थीं।',
    historyEn: 'On Kartika Shukla Ashtami, Nanda Baba entrusted Krishna and Balarama with herding full-grown cows; Rasik texts joyfully describe Shri Radha joining in pastoral disguise.',
    meaningHi: 'गोपाष्टमी प्रकृति, गौ-वंश, ब्रज-वनों और ईश्वर के सख्य-प्रेम की एकात्मता का पावन संदेश देती है।',
    meaningEn: 'Gopashtami honors harmony with cows, forests, humility, and joyful sakhya-bhava service.',
    celebrationHi: 'गौ-माताओं को स्नान, तिलक व गुड़-चने का ग्रास खिलाकर पूजन किया जाता है और मंदिरों में कार्तिक नियम सेवा के अन्तर्गत विशेष दर्शन होते हैं।',
    celebrationEn: 'Sacred cows are bathed, decorated with tilak and turmeric, and fed sweet treats across Braj’s temples and gaushalas.',
    plateImage: '/assets/temples/radha-raman.webp',
    faqs: [
      {
        questionHi: 'गोपाष्टमी का मुख्य सन्देश क्या है?',
        questionEn: 'What is the main significance of Gopashtami?',
        answerHi: 'गोपाष्टमी भगवान श्रीकृष्ण की गो-भक्ति तथा प्रकृति व समस्त प्राणियों के प्रति करुणा और सेवा का पावन उत्सव है।',
        answerEn: 'It celebrates Krishna’s devotion to cows and compassion toward nature and all living beings.'
      }
    ]
  }
];

export const FESTIVALS_BY_SLUG: Record<string, FestivalGuideEntry> = Object.fromEntries(
  FESTIVALS_LIST.map((f) => [f.slug, f])
);
