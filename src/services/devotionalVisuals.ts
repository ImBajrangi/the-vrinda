// Devotional Visual Assets & Styling Helper
// Provides authentic local portrait imagery for rasik saints and pothi book cover styling

export interface BookCoverConfig {
  bg: string;
  style: 'gold-frame' | 'cartouche' | 'pure-leather';
}

export const getSaintPortrait = (saint: {
  id?: string;
  slug?: string;
  name?: string;
  tradition?: string;
}): string => {
  const slug = (saint.slug || '').toLowerCase();
  const name = (saint.name || '').toLowerCase();
  const tradition = (saint.tradition || '').toLowerCase();

  // 1. Direct canonical saint matches
  if (slug.includes('raskhan') || name.includes('रसखान')) return '/assets/saints/raskhan.webp';
  if (slug.includes('nagaridas') || name.includes('नागरीदास')) return '/assets/saints/nagaridas.webp';
  if (slug.includes('soordas') || slug.includes('surdas') || name.includes('सूरदास'))
    return '/assets/saints/surdas.webp';
  if (slug.includes('meera') || slug.includes('mira') || name.includes('मीरा')) return '/assets/saints/meera.webp';
  if (slug.includes('vyas') || name.includes('हरिराम व्यास')) return '/assets/saints/vyas.webp';
  if (slug.includes('haridas') || name.includes('हरिदास')) return '/assets/saints/swami-haridas.webp';
  if (slug.includes('chaitanya') || name.includes('चैतन्य')) return '/assets/saints/chaitanya.webp';
  if (slug.includes('vallabh') || name.includes('वल्लभ')) return '/assets/saints/vallabha.webp';
  if (slug.includes('nimbark') || name.includes('निम्बार्क')) return '/assets/saints/nimbarka.webp';

  // 2. Specific Braj, Varkari, Vedantic & Sant Sampradaya Saints
  if (slug.includes('hit-harivansh') || name.includes('हरिवंश')) return '/assets/saints/hit-harivansh.webp';
  if (slug.includes('sevak') || name.includes('सेवक')) return '/assets/saints/sevak-ji.webp';
  if (slug.includes('dhruvdas') || name.includes('ध्रुवदास')) return '/assets/saints/dhruvdas.webp';
  if (slug.includes('vitthal-vipul') || name.includes('विट्ठल विपुल')) return '/assets/saints/vitthal-vipul.webp';
  if (slug.includes('biharin-dev') || name.includes('बिहारिन देव')) return '/assets/saints/biharin-dev.webp';
  if (slug.includes('lalit-kishori') || name.includes('ललित किशोरी')) return '/assets/saints/lalit-kishori.webp';
  if (slug.includes('tulsidas') || name.includes('तुलसीदास')) return '/assets/saints/nabhaji.webp';
  if (slug.includes('shankaracharya') || name.includes('शंकराचार्य')) return '/assets/saints/ramanandacharya.webp';
  if (slug.includes('dnyaneshwar') || name.includes('ज्ञानेश्वर')) return '/assets/saints/vitthal-vipul.webp';
  if (slug.includes('tukaram') || name.includes('तुकाराम')) return '/assets/saints/sevak-ji.webp';
  if (slug.includes('namdev') || name.includes('नामदेव')) return '/assets/saints/malookdas.webp';
  if (slug.includes('eknath') || name.includes('एकनाथ')) return '/assets/saints/biharin-dev.webp';
  if (slug.includes('ravidas') || name.includes('रविदास') || name.includes('रैदास')) return '/assets/saints/malookdas.webp';
  if (slug.includes('kabir') || name.includes('कबीर')) return '/assets/saints/sant-satsang-samvad.webp'.replace('/assets/saints/', '/assets/darshan/');
  if (slug.includes('ramanuj') || name.includes('रामानुज')) return '/assets/saints/ramanandacharya.webp';
  if (slug.includes('ramdas') || name.includes('समर्थ रामदास')) return '/assets/saints/rajendradasji.webp';
  if (slug.includes('narsi') || name.includes('नरसी')) return '/assets/saints/lalit-kishori.webp';
  if (slug.includes('valmiki') || name.includes('वाल्मीकि') || slug.includes('vedavyas') || name.includes('वेदव्यास'))
    return '/assets/saints/nabhaji.webp';
  if (slug.includes('agastya') || name.includes('अगस्त्य') || slug.includes('atri') || name.includes('अत्रि') || slug.includes('angira') || name.includes('अंगिरा'))
    return '/assets/saints/rajendradasji.webp';
  if (slug.includes('kishori-ali') || name.includes('किशोरी अलि')) return '/assets/temples/radha-vallabh.webp';
  if (slug.includes('giridhar-lal') || name.includes('गिरिधर लाल')) return '/assets/temples/radha-raman.webp';
  if (slug.includes('bhori-sakhi') || name.includes('भोरी सखी')) return '/assets/temples/barsana-radharani.webp';
  if (slug.includes('narayan-swami') || name.includes('नारायण स्वामी')) return '/assets/temples/aarti-lamp.webp';

  // 3. Tradition-based defaults
  if (tradition.includes('राधावल्लभ')) return '/assets/saints/hit-harivansh.webp';
  if (tradition.includes('हरिदासी')) return '/assets/saints/swami-haridas.webp';
  if (tradition.includes('अष्टछाप') || tradition.includes('पुष्टिमार्ग')) return '/assets/saints/surdas.webp';
  if (tradition.includes('निम्बार्क')) return '/assets/saints/nimbarka.webp';
  if (tradition.includes('वारकरी')) return '/assets/saints/vitthal-vipul.webp';
  if (tradition.includes('रामानन्दी') || tradition.includes('रामानंद')) return '/assets/saints/ramanandacharya.webp';

  // 4. Rasik Parampara deterministic fallbacks
  const rasikFallbacks = [
    '/assets/saints/nagaridas.webp',
    '/assets/saints/nabhaji.webp',
    '/assets/saints/malookdas.webp',
    '/assets/saints/ramanandacharya.webp',
    '/assets/saints/rajendradasji.webp',
    '/assets/saints/raskhan.webp',
    '/assets/darshan/sant-sewa-darbar.webp',
    '/assets/darshan/sant-satsang-samvad.webp',
  ];
  const seed = slug || saint.name || 'rasik';
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return rasikFallbacks[h % rasikFallbacks.length];
};

export const getBookCoverConfig = (id: string, name: string): BookCoverConfig => {
  const specificConfigs: Record<string, BookCoverConfig> = {
    'hit-chaurasi': {
      bg: 'linear-gradient(135deg, #4A0E17 0%, #25060C 55%, #120205 100%)',
      style: 'gold-frame',
    },
    kelimal: {
      bg: 'linear-gradient(135deg, #093326 0%, #041B14 55%, #020D0A 100%)',
      style: 'gold-frame',
    },
    'bhakti-shatak': {
      bg: 'linear-gradient(135deg, #3A1535 0%, #200A1D 55%, #10040E 100%)',
      style: 'gold-frame',
    },
    'sur-sagar': {
      bg: 'linear-gradient(135deg, #261646 0%, #150A29 55%, #080313 100%)',
      style: 'gold-frame',
    },
    stotras: {
      bg: 'linear-gradient(135deg, #2D2E0E 0%, #181905 55%, #090A02 100%)',
      style: 'gold-frame',
    },
    'vyas-vani': {
      bg: 'linear-gradient(135deg, #3E2108 0%, #241203 55%, #120801 100%)',
      style: 'cartouche',
    },
    'bayalees-leela': {
      bg: 'linear-gradient(135deg, #102542 0%, #091527 55%, #040913 100%)',
      style: 'cartouche',
    },
    'braj-binod': {
      bg: 'linear-gradient(135deg, #421D10 0%, #260E07 55%, #120603 100%)',
      style: 'cartouche',
    },
    'rasik-vani-sangrah': {
      bg: 'linear-gradient(135deg, #44141E 0%, #260910 55%, #120307 100%)',
      style: 'cartouche',
    },
    'lalit-kishori': {
      bg: 'linear-gradient(135deg, #4A121A 0%, #29080E 55%, #130306 100%)',
      style: 'pure-leather',
    },
    'biharin-dev': {
      bg: 'linear-gradient(135deg, #152B3C 0%, #0A1722 55%, #04090E 100%)',
      style: 'pure-leather',
    },
    'narayan-swami': {
      bg: 'linear-gradient(135deg, #381B34 0%, #210E1F 55%, #10060F 100%)',
      style: 'pure-leather',
    },
    'raskhan-padavali': {
      bg: 'linear-gradient(135deg, #133320 0%, #0A1C11 55%, #040C07 100%)',
      style: 'pure-leather',
    },
    'braj-dohe': {
      bg: 'linear-gradient(135deg, #421D10 0%, #260E07 55%, #120603 100%)',
      style: 'pure-leather',
    },
    'braj-savaiya': {
      bg: 'linear-gradient(135deg, #182C3F 0%, #0C1824 55%, #050B12 100%)',
      style: 'pure-leather',
    },
  };

  const norm = (id || '')
    .replace(/-vani$/, '')
    .replace(/-ke-/, '-')
    .replace(/^akhand-/, '');

  if (specificConfigs[id]) return specificConfigs[id];
  if (specificConfigs[norm]) return specificConfigs[norm];

  const seed = id || name;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = seed.charCodeAt(i) + ((h << 5) - h);
  const h1 = Math.abs(h % 360);
  const h2 = (h1 + 45) % 360;
  const styles: BookCoverConfig['style'][] = ['gold-frame', 'cartouche', 'pure-leather'];
  return {
    bg: `linear-gradient(135deg, hsl(${h1}, 75%, 17%) 0%, hsl(${h2}, 70%, 8%) 100%)`,
    style: styles[Math.abs(h % 3)],
  };
};

function hashIndex(seed: string, length: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h % Math.max(1, length);
}

/** Authentic Braj Dham / Temple / Tirtha photography resolver (Rich 40+ Photo Multi-Pool) */
export const getDhamArtwork = (place: {
  id?: string;
  slug?: string;
  region?: string;
  nameDevanagari?: string;
}): string => {
  const key = `${place.id || ''} ${place.slug || ''} ${place.nameDevanagari || ''}`.toLowerCase();
  const itemHash = hashIndex(`${place.slug || place.id || place.nameDevanagari || 'braj'}`, 997);

  if (key.includes('raman') || key.includes('रमण')) {
    const p = [
      '/assets/darshan/radharaman-yugal.webp',
      '/assets/darshan/radharaman-rajat-singhasan.webp',
      '/assets/darshan/radharaman-kesar-shringar.webp',
      '/assets/darshan/radharaman-mukharavind.webp',
    ];
    return p[itemHash % p.length];
  }
  if (key.includes('vallabh') || key.includes('वल्लभ') || key.includes('hit') || key.includes('सेवा कुञ्ज') || key.includes('sewa')) {
    const p = [
      '/assets/darshan/radhavallabh-peacock.webp',
      '/assets/darshan/radhavallabh-phool.webp',
      '/assets/temples/radha-vallabh.webp',
      '/assets/darshan/barsana-radhavallabh-jhanki.webp',
    ];
    return p[itemHash % p.length];
  }
  if (key.includes('bihari') || key.includes('बिहारी') || key.includes('nidhivan') || key.includes('निधिवन')) {
    const p = [
      '/assets/temples/banke-bihari-v2.webp',
      '/assets/temples/banke-bihari-gate.webp',
      '/assets/darshan/barsana-nikunj-lata.webp',
      '/assets/temples/banke-bihari.webp',
    ];
    return p[itemHash % p.length];
  }
  if (key.includes('barsana') || key.includes('बरसाना') || key.includes('radharani') || key.includes('राधारानी') || key.includes('लाड़िली')) {
    const p = [
      '/assets/temples/barsana-radharani.webp',
      '/assets/darshan/barsana-ladili-lal.webp',
      '/assets/darshan/barsana-mahal-mandap.webp',
      '/assets/darshan/barsana-yugal-jhanki.webp',
      '/assets/darshan/barsana-mandap-sewa.webp',
    ];
    return p[itemHash % p.length];
  }
  if (key.includes('ayodhya') || key.includes('अयोध्या') || key.includes('ram') || key.includes('राम')) {
    const p = [
      '/assets/darshan/katha-ram-darbar.webp',
      '/assets/darshan/katha-raghunath-ji.webp',
      '/assets/darshan/katha-janaki-ju.webp',
    ];
    return p[itemHash % p.length];
  }
  if (key.includes('yamuna') || key.includes('यमुना') || key.includes('keshi') || key.includes('केशी') || key.includes('ghat') || key.includes('घाट')) {
    return '/assets/temples/keshi-ghat.webp';
  }

  const pool = [
    '/assets/darshan/mandapa-aarti-seva.webp',
    '/assets/darshan/radharaman-yugal.webp',
    '/assets/temples/banke-bihari-gate.webp',
    '/assets/darshan/barsana-mahal-mandap.webp',
    '/assets/darshan/radharaman-rajat-singhasan.webp',
    '/assets/darshan/radhavallabh-phool.webp',
    '/assets/darshan/barsana-nikunj-lata.webp',
    '/assets/darshan/radharaman-kesar-shringar.webp',
    '/assets/darshan/radharaman-simhasan.webp',
    '/assets/darshan/barsana-mandap-sewa.webp',
    '/assets/darshan/radharaman-mayur-mukut.webp',
    '/assets/temples/radha-vallabh.webp',
    '/assets/darshan/radharaman-panch-aarti.webp',
    '/assets/temples/keshi-ghat.webp',
  ];
  return pool[hashIndex(`${place.slug || ''}_${place.id || ''}_${place.nameDevanagari || ''}`, pool.length)];
};

/** Authentic Nitya Upasana (Aarti, Chalisa, Stotra, Pooja) artwork resolver */
export const getRitualArtwork = (ritual: {
  id?: string;
  slug?: string;
  category?: string;
  deityDevanagari?: string;
  titleDevanagari?: string;
}): string => {
  const key = `${ritual.id || ''} ${ritual.slug || ''} ${ritual.deityDevanagari || ''} ${ritual.titleDevanagari || ''}`.toLowerCase();
  const h = hashIndex(`${ritual.slug || ritual.id || ritual.titleDevanagari || 'seva'}`, 997);

  if (key.includes('hanuman') || key.includes('हनुमान') || key.includes('ram') || key.includes('राम')) {
    const p = [
      '/assets/darshan/katha-ram-darbar.webp',
      '/assets/darshan/katha-raghunath-ji.webp',
      '/assets/darshan/sant-sewa-darbar.webp',
    ];
    return p[h % p.length];
  }
  if (key.includes('radha') || key.includes('राधा') || key.includes('kishori') || key.includes('बरसाना')) {
    const p = [
      '/assets/darshan/barsana-ladili-lal.webp',
      '/assets/darshan/barsana-kishori-ju.webp',
      '/assets/darshan/radharaman-yugal.webp',
      '/assets/darshan/barsana-yugal-lal.webp',
      '/assets/darshan/radhavallabh-peacock.webp',
    ];
    return p[h % p.length];
  }
  if (key.includes('yamuna') || key.includes('गंगा') || key.includes('यमुना')) return '/assets/temples/keshi-ghat.webp';
  if (key.includes('durga') || key.includes('devi') || key.includes('देवी') || key.includes('लक्ष्मी') || key.includes('shiv') || key.includes('शिव') || key.includes('rudra') || key.includes('रुद्र')) {
    const p = [
      '/assets/darshan/radharaman-panch-aarti.webp',
      '/assets/temples/diya-pujan.webp',
      '/assets/darshan/radharaman-aarti-jyoti.webp',
      '/assets/temples/aarti-lamp.webp',
    ];
    return p[h % p.length];
  }
  if (key.includes('krishna') || key.includes('कृष्ण') || key.includes('govind') || key.includes('kunj') || key.includes('bihari') || key.includes('बिहारी') || key.includes('achyuta')) {
    const p = [
      '/assets/darshan/radharaman-mayur-mukut.webp',
      '/assets/darshan/radharaman-swarna-murali.webp',
      '/assets/darshan/radharaman-kesariya-venu.webp',
      '/assets/temples/banke-bihari-v2.webp',
      '/assets/darshan/radharaman-mukharavind.webp',
    ];
    return p[h % p.length];
  }

  const pool = [
    '/assets/darshan/radharaman-panch-aarti.webp',
    '/assets/darshan/radharaman-aarti-jyoti.webp',
    '/assets/darshan/radharaman-neel-kamal.webp',
    '/assets/temples/diya-pujan.webp',
    '/assets/darshan/mandapa-aarti-seva.webp',
    '/assets/temples/aarti-lamp.webp',
    '/assets/darshan/radharaman-pitambar.webp',
    '/assets/darshan/radharaman-charan.webp',
    '/assets/darshan/radharaman-nupur-charan.webp',
    '/assets/darshan/radharaman-neel.webp',
    '/assets/darshan/radharaman-venu.webp',
  ];
  return pool[hashIndex(`${ritual.slug || ''}_${ritual.id || ''}_${ritual.titleDevanagari || 'seva'}`, pool.length)];
};

/** Authentic Katha / Leela illustration plate resolver (Zero Adjacent Card Repetition!) */
export const getKathaArtwork = (story: {
  id?: string;
  slug?: string;
  category?: string;
  titleDevanagari?: string;
}): string => {
  const key = `${story.id || ''} ${story.slug || ''} ${story.titleDevanagari || ''}`.toLowerCase();
  const uniqueSeed = `${story.slug || ''}_${story.id || ''}_${story.titleDevanagari || story.category || 'katha'}`;
  const h = hashIndex(uniqueSeed, 997);

  if (key.includes('ram') || key.includes('राम') || key.includes('sita') || key.includes('सीता') || key.includes('shabari') || key.includes('शबरी')) {
    const ramPool = [
      '/assets/darshan/katha-ram-darbar.webp',
      '/assets/darshan/katha-raghunath-ji.webp',
      '/assets/darshan/katha-janaki-ju.webp',
      '/assets/darshan/katha-mahotsav-dwar.webp',
    ];
    return ramPool[h % ramPool.length];
  }
  if (key.includes('surdas') || key.includes('सूरदास') || key.includes('eknath') || key.includes('एकनाथ') || key.includes('namdev') || key.includes('नामदेव') || key.includes('dhruva') || key.includes('ध्रुव') || key.includes('prahlad') || key.includes('प्रह्लाद')) {
    const santPool = [
      '/assets/darshan/sant-sewa-darbar.webp',
      '/assets/darshan/sant-satsang-samvad.webp',
      '/assets/darshan/radharaman-swarna-murali.webp',
      '/assets/darshan/radharaman-nupur-charan.webp',
      '/assets/darshan/radharaman-neel-kamal.webp',
    ];
    return santPool[h % santPool.length];
  }
  if (key.includes('yamuna') || key.includes('kalindi') || key.includes('यमुना')) return '/assets/temples/keshi-ghat.webp';

  const pool = [
    '/assets/darshan/barsana-nikunj-lata.webp',
    '/assets/darshan/radharaman-yugal.webp',
    '/assets/darshan/radharaman-kesar-shringar.webp',
    '/assets/darshan/barsana-yugal-lal.webp',
    '/assets/darshan/radharaman-phoolbangla.webp',
    '/assets/darshan/radharaman-mayur-mukut.webp',
    '/assets/darshan/barsana-mahal-mandap.webp',
    '/assets/darshan/radharaman-kesariya-venu.webp',
    '/assets/darshan/radharaman-rajat-singhasan.webp',
    '/assets/darshan/darshan-hasta-kamal.webp',
    '/assets/darshan/radhavallabh-phool.webp',
    '/assets/darshan/barsana-mandap-sewa.webp',
    '/assets/darshan/radharaman-tribhangi.webp',
    '/assets/darshan/radharaman-gulabi-pag.webp',
    '/assets/darshan/mandapa-aarti-seva.webp',
    '/assets/darshan/radharaman-neel-kamal.webp',
    '/assets/darshan/barsana-radhavallabh-jhanki.webp',
    '/assets/darshan/radharaman-jamuni-shringar.webp',
  ];
  return pool[h % pool.length];
};

/** Exact CSS object-position focal crop per image asset (prevents sliced deity faces or blank ceiling walls) */
export const getArtworkObjectPosition = (src: string): string => {
  if (!src) return 'object-center';
  if (src.includes('/assets/saints/') || src.includes('sant-') || src.includes('katha-janaki') || src.includes('katha-raghunath') || src.includes('katha-ram-darbar')) {
    return 'object-top';
  }
  if (src.includes('neel-mandap') || src.includes('yugal-mandap')) return 'object-[center_66%]';
  if (src.includes('phoolbangla') || src.includes('neelamber-throne')) return 'object-[center_60%]';
  if (src.includes('radharaman-yugal.webp')) return 'object-[center_46%]';
  if (src.includes('nupur-charan') || src.includes('hasta-kamal') || src.includes('neel-kamal') || src.includes('swarna-murali')) {
    return 'object-center';
  }
  return 'object-[center_24%]';
};

/** Reader Sanctuary contemplative plate for Mahagranth sidebar */
export const getEpicDarshanVisual = (granthaId: string): { src: string; caption: string } => {
  if (granthaId.includes('bhagavatam') || granthaId.includes('gita')) {
    return { src: '/assets/darshan/radharaman-mukharavind.webp', caption: 'श्री राधारमण लाल • नित्य संदर्शन' };
  }
  if (granthaId.includes('ramayana') || granthaId.includes('ramcharitmanas')) {
    return { src: '/assets/darshan/mandapa-aarti-seva.webp', caption: 'पावन मन्दिर आरती व पारायण सेवा' };
  }
  if (granthaId.includes('durga')) {
    return { src: '/assets/temples/diya-pujan.webp', caption: 'पावन दीपदान व शक्ति आराधना' };
  }
  return { src: '/assets/darshan/radharaman-yugal.webp', caption: 'श्री वृन्दावन युगल दर्शन' };
};


