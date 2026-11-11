/**
 * Route Inventory for Bhav & Path Domains
 */
export const DOMAINS = {
  bhav: 'https://bhav.vrindopnishad.in',
  path: 'https://path.vrindopnishad.in',
};

export const BHAV_ROUTES = [
  '/',
  '/?tab=smaran',
  '/?tab=feed',
  '/?tab=milestones',
  '/?tab=padavali',
];

export const PATH_ROUTES = [
  '/',
  '/?tab=granthas',
  '/?tab=granthas&grantha=valmiki-ramayana',
  '/?tab=granthas&grantha=shrimad-bhagavatam',
  '/?tab=granthas&grantha=ramcharitmanas',
  '/?tab=granthas&grantha=bhagavad-gita',
  '/?tab=granthas&grantha=durga-saptashati',
];

export const CANONICAL_EPICS = [
  { id: 'valmiki-ramayana', name: 'श्रीमद् वाल्मीकि रामायण', author: 'महर्षि वाल्मीकि' },
  { id: 'shrimad-bhagavatam', name: 'श्रीमद् भागवत महापुराण', author: 'महर्षि वेदव्यास' },
  { id: 'ramcharitmanas', name: 'श्री रामचरितमानस', author: 'गोस्वामी तुलसीदास' },
  { id: 'bhagavad-gita', name: 'श्रीमद्भगवद्गीता', author: 'महर्षि वेदव्यास' },
  { id: 'durga-saptashati', name: 'श्री दुर्गा सप्तशती', author: 'महर्षि मार्कण्डेय' },
];

export const DEEP_LINKS = {
  ramayanaChapter1: `${DOMAINS.path}/?tab=granthas&grantha=valmiki-ramayana&chapter=k1_s1`,
  gitaChapter1: `${DOMAINS.path}/?tab=granthas&grantha=bhagavad-gita&chapter=a1`,
  hitChaurasiPad1: `${DOMAINS.bhav}/?tab=padavali&pad=hit-chaurasi-001`,
  saintBhoriSakhi: `${DOMAINS.bhav}/?tab=padavali&author=saint-bhori-sakhi`,
};

