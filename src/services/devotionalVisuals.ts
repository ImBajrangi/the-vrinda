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
  if (slug.includes('raskhan') || name.includes('रसखान')) return '/assets/saints/raskhan.jpg';
  if (slug.includes('nagaridas') || name.includes('नागरीदास')) return '/assets/saints/nagaridas.jpg';
  if (slug.includes('soordas') || slug.includes('surdas') || name.includes('सूरदास'))
    return '/assets/saints/surdas.jpg';
  if (slug.includes('meera') || name.includes('मीरा')) return '/assets/saints/meera.jpg';
  if (slug.includes('vyas') || name.includes('व्यास')) return '/assets/saints/vyas.jpg';
  if (slug.includes('haridas') || name.includes('हरिदास')) return '/assets/saints/swami-haridas.jpg';
  if (slug.includes('chaitanya') || name.includes('चैतन्य')) return '/assets/saints/chaitanya.jpg';
  if (slug.includes('vallabh') || name.includes('वल्लभ')) return '/assets/saints/vallabha.jpg';
  if (slug.includes('nimbark') || name.includes('निम्बार्क')) return '/assets/saints/nimbarka.jpg';

  // 2. Specific Braj & Sampradayic Saints
  if (slug.includes('kishori-ali') || name.includes('किशोरी अलि')) return '/assets/temples/radha-vallabh.jpg';
  if (slug.includes('vitthal-vipul') || name.includes('विट्ठल विपुल')) return '/assets/saints/swami-haridas.jpg';
  if (slug.includes('giridhar-lal') || name.includes('गिरिधर लाल')) return '/assets/temples/radha-raman.jpg';
  if (slug.includes('bhori-sakhi') || name.includes('भोरी सखी')) return '/assets/temples/barsana-radharani.jpg';
  if (slug.includes('hit-harivansh') || name.includes('हरिवंश')) return '/assets/temples/radha-vallabh.jpg';
  if (slug.includes('biharin-dev') || name.includes('बिहारिन देव')) return '/assets/temples/banke-bihari-v2.jpg';
  if (slug.includes('narayan-swami') || name.includes('नारायण स्वामी')) return '/assets/temples/aarti-lamp.jpg';
  if (slug.includes('lalit-kishori') || name.includes('ललित किशोरी')) return '/assets/temples/banke-bihari-v2.jpg';

  // 3. Tradition-based defaults
  if (tradition.includes('राधावल्लभ')) return '/assets/temples/radha-vallabh.jpg';
  if (tradition.includes('हरिदासी')) return '/assets/saints/swami-haridas.jpg';
  if (tradition.includes('अष्टछाप')) return '/assets/saints/surdas.jpg';
  if (tradition.includes('निम्बार्क')) return '/assets/saints/nimbarka.jpg';

  // 4. Rasik Parampara deterministic fallbacks
  const rasikFallbacks = [
    '/assets/saints/nagaridas.jpg',
    '/assets/temples/radha-raman.jpg',
    '/assets/saints/raskhan.jpg',
    '/assets/temples/keshi-ghat.jpg',
    '/assets/temples/barsana-radharani.jpg',
    '/assets/temples/diya-pujan.jpg',
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

