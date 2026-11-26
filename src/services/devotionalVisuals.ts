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
  if (slug.includes('meera') || name.includes('मीरा')) return '/assets/saints/meera.webp';
  if (slug.includes('vyas') || name.includes('व्यास')) return '/assets/saints/vyas.webp';
  if (slug.includes('haridas') || name.includes('हरिदास')) return '/assets/saints/swami-haridas.webp';
  if (slug.includes('chaitanya') || name.includes('चैतन्य')) return '/assets/saints/chaitanya.webp';
  if (slug.includes('vallabh') || name.includes('वल्लभ')) return '/assets/saints/vallabha.webp';
  if (slug.includes('nimbark') || name.includes('निम्बार्क')) return '/assets/saints/nimbarka.webp';

  // 2. Specific Braj & Sampradayic Saints
  if (slug.includes('hit-harivansh') || name.includes('हरिवंश')) return '/assets/saints/hit-harivansh.webp';
  if (slug.includes('sevak') || name.includes('सेवक')) return '/assets/saints/sevak-ji.webp';
  if (slug.includes('dhruvdas') || name.includes('ध्रुवदास')) return '/assets/saints/dhruvdas.webp';
  if (slug.includes('vitthal-vipul') || name.includes('विट्ठल विपुल')) return '/assets/saints/vitthal-vipul.webp';
  if (slug.includes('biharin-dev') || name.includes('बिहारिन देव')) return '/assets/saints/biharin-dev.webp';
  if (slug.includes('lalit-kishori') || name.includes('ललित किशोरी')) return '/assets/saints/lalit-kishori.webp';
  if (slug.includes('kishori-ali') || name.includes('किशोरी अलि')) return '/assets/temples/radha-vallabh.webp';
  if (slug.includes('giridhar-lal') || name.includes('गिरिधर लाल')) return '/assets/temples/radha-raman.webp';
  if (slug.includes('bhori-sakhi') || name.includes('भोरी सखी')) return '/assets/temples/barsana-radharani.webp';
  if (slug.includes('narayan-swami') || name.includes('नारायण स्वामी')) return '/assets/temples/aarti-lamp.webp';

  // 3. Tradition-based defaults
  if (tradition.includes('राधावल्लभ')) return '/assets/temples/radha-vallabh.webp';
  if (tradition.includes('हरिदासी')) return '/assets/saints/swami-haridas.webp';
  if (tradition.includes('अष्टछाप')) return '/assets/saints/surdas.webp';
  if (tradition.includes('निम्बार्क')) return '/assets/saints/nimbarka.webp';

  // 4. Rasik Parampara deterministic fallbacks
  const rasikFallbacks = [
    '/assets/saints/nagaridas.webp',
    '/assets/temples/radha-raman.webp',
    '/assets/saints/raskhan.webp',
    '/assets/temples/keshi-ghat.webp',
    '/assets/temples/barsana-radharani.webp',
    '/assets/temples/diya-pujan.webp',
  ];
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
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

/** Authentic Braj Dham / Temple / Tirtha photography resolver */
export const getDhamArtwork = (place: {
  id?: string;
  slug?: string;
  region?: string;
  nameDevanagari?: string;
}): string => {
  const key = `${place.id || ''} ${place.slug || ''} ${place.nameDevanagari || ''}`.toLowerCase();
  if (key.includes('raman') || key.includes('रमण')) return '/assets/darshan/radharaman-yugal.webp';
  if (key.includes('vallabh') || key.includes('वल्लभ') || key.includes('hit')) return '/assets/darshan/radhavallabh-peacock.webp';
  if (key.includes('bihari') || key.includes('बिहारी')) return '/assets/temples/banke-bihari-v2.webp';
  if (key.includes('barsana') || key.includes('बरसाना') || key.includes('radharani') || key.includes('राधारानी') || key.includes('लाड़िली'))
    return '/assets/temples/barsana-radharani.webp';
  if (key.includes('yamuna') || key.includes('यमुना') || key.includes('keshi') || key.includes('केशी') || key.includes('ghat') || key.includes('घाट'))
    return '/assets/temples/keshi-ghat.webp';
  if (key.includes('nidhivan') || key.includes('निधिवन') || key.includes('seva') || key.includes('सेवा'))
    return '/assets/darshan/radhavallabh-phool.webp';

  const pool = [
    '/assets/darshan/mandapa-aarti-seva.webp',
    '/assets/darshan/radharaman-yugal.webp',
    '/assets/temples/banke-bihari-gate.webp',
    '/assets/temples/keshi-ghat.webp',
    '/assets/darshan/radhavallabh-phool.webp',
    '/assets/darshan/radharaman-simhasan.webp',
    '/assets/darshan/radhavallabh-peacock.webp',
    '/assets/temples/radha-vallabh.webp',
  ];
  return pool[hashIndex(place.slug || place.id || place.region || 'braj', pool.length)];
};

/** Authentic Nitya Upasana (Aarti, Chalisa, Stotra, Pooja) artwork resolver */
export const getRitualArtwork = (ritual: {
  id?: string;
  category?: string;
  deityDevanagari?: string;
  titleDevanagari?: string;
}): string => {
  const key = `${ritual.id || ''} ${ritual.deityDevanagari || ''} ${ritual.titleDevanagari || ''}`.toLowerCase();
  if (key.includes('radharaman') || key.includes('राधारमण') || key.includes('राधा रमण'))
    return '/assets/darshan/radharaman-mukharavind.webp';
  if (key.includes('radhavallabh') || key.includes('राधावल्लभ') || key.includes('हित'))
    return '/assets/darshan/radhavallabh-peacock.webp';
  if (key.includes('bihari') || key.includes('बिहारी')) return '/assets/temples/banke-bihari-v2.webp';
  if (key.includes('radha') || key.includes('राधा') || key.includes('kishori'))
    return '/assets/darshan/radharaman-yugal.webp';
  if (key.includes('krishna') || key.includes('कृष्ण') || key.includes('govind') || key.includes('kunj'))
    return '/assets/darshan/radharaman-pitambar.webp';
  if (key.includes('durga') || key.includes('devi') || key.includes('देवी') || key.includes('लक्ष्मी'))
    return '/assets/temples/diya-pujan.webp';
  if (key.includes('yamuna') || key.includes('गंगा') || key.includes('यमुना'))
    return '/assets/temples/keshi-ghat.webp';

  const cat = (ritual.category || '').toLowerCase();
  const aartiPool = [
    '/assets/temples/aarti-lamp.webp',
    '/assets/temples/diya-pujan.webp',
    '/assets/darshan/mandapa-aarti-seva.webp',
    '/assets/darshan/radharaman-yugal.webp',
    '/assets/darshan/radhavallabh-peacock.webp',
  ];
  if (cat === 'aarti') return aartiPool[hashIndex(ritual.id || ritual.titleDevanagari || 'aarti', aartiPool.length)];
  const pool = [
    '/assets/darshan/radharaman-neel.webp',
    '/assets/darshan/radharaman-venu.webp',
    '/assets/temples/diya-pujan.webp',
    '/assets/darshan/mandapa-aarti-seva.webp',
    '/assets/temples/aarti-lamp.webp',
    '/assets/darshan/radharaman-pitambar.webp',
  ];
  return pool[hashIndex(ritual.id || ritual.titleDevanagari || 'seva', pool.length)];
};

/** Authentic Katha / Leela illustration plate resolver */
export const getKathaArtwork = (story: {
  id?: string;
  category?: string;
  titleDevanagari?: string;
}): string => {
  const key = `${story.id || ''} ${story.titleDevanagari || ''}`.toLowerCase();
  if (key.includes('yamuna') || key.includes('kalindi') || key.includes('यमुना')) return '/assets/temples/keshi-ghat.webp';
  if (key.includes('radha') || key.includes('nikunj') || key.includes('राधा') || key.includes('रास'))
    return '/assets/darshan/radharaman-phoolbangla.webp';
  if (key.includes('krishna') || key.includes('govardhan') || key.includes('कृष्ण') || key.includes('गोवर्धन'))
    return '/assets/darshan/radharaman-pitambar.webp';

  const pool = [
    '/assets/darshan/mandapa-aarti-seva.webp',
    '/assets/darshan/radharaman-yugal.webp',
    '/assets/darshan/radhavallabh-phool.webp',
    '/assets/temples/banke-bihari-gate.webp',
    '/assets/temples/keshi-ghat.webp',
    '/assets/darshan/radharaman-neel.webp',
  ];
  return pool[hashIndex(story.id || story.category || 'katha', pool.length)];
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


