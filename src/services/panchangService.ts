import { DayItem } from '../components/smaran/DateStrip';
import { formatDevanagariNumerals } from './cacheService';

export interface PanchangInfo {
  isoDate: string;
  istYear: number;
  istMonth: number;
  istDay: number;
  weekdayIndex: number;
  weekdayShort: string;
  weekdayDevanagari: string;
  gregorianLabel: string;
  tithiNumber: number; // 1..30 (1..15 Shukla, 16..30 Krishna)
  pakshaEnglish: 'Shukla' | 'Krishna';
  pakshaDevanagari: 'शुक्ल' | 'कृष्ण';
  tithiNameEnglish: string;
  tithiNameDevanagari: string;
  tithiShortDevanagari: string;
  masaEnglish: string;
  masaDevanagari: string;
  nakshatraEnglish: string;
  nakshatraDevanagari: string;
  specialOccasionDevanagari?: string;
  specialOccasionEnglish?: string;
}

export interface UpcomingFestivalInfo {
  nameDevanagari: string;
  nameEnglish: string;
  daysAway: number;
  dateLabel: string;
  tithiSummary: string;
}

export type TempleId = 'bihari' | 'vallabh' | 'raman' | 'barsana';

export interface TempleSevaSession {
  sevaDevanagari: string;
  sevaEnglish: string;
  praharLabel: string;
  startMin: number;
  endMin: number;
  bucket: 'morning' | 'rajbhog' | 'evening';
}

export interface LiveMandirSchedule {
  templeId: TempleId;
  templeName: string;
  sevaTitleEnglish: string;
  sevaTitleDevanagari: string;
  praharLabel: string;
  timeRangeLabel: string;
  isOpen: boolean;
  statusType: 'active' | 'upcoming' | 'completed';
  countdownLabel: string;
  isRajbhogSession: boolean;
  isEveningSession: boolean;
  imageUrl: string;
  indexNumber: string;
}

const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const WEEKDAYS_DEVANAGARI = [
  'रविवार',
  'सोमवार',
  'मंगलवार',
  'बुधवार',
  'गुरुवार',
  'शुक्रवार',
  'शनिवार',
] as const;

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

const MASA_NAMES: ReadonlyArray<{ en: string; hi: string }> = [
  { en: 'Chaitra', hi: 'चैत्र' },
  { en: 'Vaishakha', hi: 'वैशाख' },
  { en: 'Jyeshtha', hi: 'ज्येष्ठ' },
  { en: 'Ashadha', hi: 'आषाढ़' },
  { en: 'Shravana', hi: 'श्रावण' },
  { en: 'Bhadrapada', hi: 'भाद्रपद' },
  { en: 'Ashwin', hi: 'आश्विन' },
  { en: 'Kartika', hi: 'कार्तिक' },
  { en: 'Margashirsha', hi: 'मार्गशीर्ष' },
  { en: 'Pausha', hi: 'पौष' },
  { en: 'Magha', hi: 'माघ' },
  { en: 'Phalguna', hi: 'फाल्गुन' },
];

const TITHI_NAMES_1_TO_14: ReadonlyArray<{ en: string; hi: string }> = [
  { en: 'Pratipada', hi: 'प्रतिपदा' },
  { en: 'Dvitiya', hi: 'द्वितीया' },
  { en: 'Tritiya', hi: 'तृतीया' },
  { en: 'Chaturthi', hi: 'चतुर्थी' },
  { en: 'Panchami', hi: 'पञ्चमी' },
  { en: 'Shashthi', hi: 'षष्ठी' },
  { en: 'Saptami', hi: 'सप्तमी' },
  { en: 'Ashtami', hi: 'अष्टमी' },
  { en: 'Navami', hi: 'नवमी' },
  { en: 'Dashami', hi: 'दशमी' },
  { en: 'Ekadashi', hi: 'एकादशी' },
  { en: 'Dvadashi', hi: 'द्वादशी' },
  { en: 'Trayodashi', hi: 'त्रयोदशी' },
  { en: 'Chaturdashi', hi: 'चतुर्दशी' },
];

const NAKSHATRA_NAMES: ReadonlyArray<{ en: string; hi: string }> = [
  { en: 'Ashwini', hi: 'अश्विनी' },
  { en: 'Bharani', hi: 'भरणी' },
  { en: 'Krittika', hi: 'कृत्तिका' },
  { en: 'Rohini', hi: 'रोहिणी' },
  { en: 'Mrigashira', hi: 'मृगशिरा' },
  { en: 'Ardra', hi: 'आर्द्रा' },
  { en: 'Punarvasu', hi: 'पुनर्वसु' },
  { en: 'Pushya', hi: 'पुष्य' },
  { en: 'Ashlesha', hi: 'आश्लेषा' },
  { en: 'Magha', hi: 'मघा' },
  { en: 'Purva Phalguni', hi: 'पूर्वा फाल्गुनी' },
  { en: 'Uttara Phalguni', hi: 'उत्तरा फाल्गुनी' },
  { en: 'Hasta', hi: 'हस्त' },
  { en: 'Chitra', hi: 'चित्रा' },
  { en: 'Swati', hi: 'स्वाती' },
  { en: 'Vishakha', hi: 'विशाखा' },
  { en: 'Anuradha', hi: 'अनुराधा' },
  { en: 'Jyeshtha', hi: 'ज्येष्ठा' },
  { en: 'Mula', hi: 'मूल' },
  { en: 'Purva Ashadha', hi: 'पूर्वाषाढ़ा' },
  { en: 'Uttara Ashadha', hi: 'उत्तराषाढ़ा' },
  { en: 'Shravana', hi: 'श्रवण' },
  { en: 'Dhanishtha', hi: 'धनिष्ठा' },
  { en: 'Shatabhisha', hi: 'शतभिषा' },
  { en: 'Purva Bhadrapada', hi: 'पूर्व भाद्रपद' },
  { en: 'Uttara Bhadrapada', hi: 'उत्तर भाद्रपद' },
  { en: 'Revati', hi: 'रेवती' },
];

const BRAJ_UTSAV_BY_MASA_TITHI: Record<string, { hi: string; en: string }> = {
  'Chaitra-9': { hi: 'श्री राम नवमी', en: 'Shri Rama Navami' },
  'Chaitra-11': { hi: 'कामदा एकादशी', en: 'Kamada Ekadashi' },
  'Chaitra-15': { hi: 'हनुमान जयंती • चैत्र पूर्णिमा', en: 'Hanuman Jayanti & Chaitra Purnima' },
  'Vaishakha-3': { hi: 'अक्षय तृतीया (चन्दन यात्रा)', en: 'Akshaya Tritiya & Chandan Yatra' },
  'Vaishakha-11': { hi: 'मोहिनी एकादशी', en: 'Mohini Ekadashi' },
  'Vaishakha-14': { hi: 'श्री नृसिंह चतुर्दशी', en: 'Narasimha Chaturdashi' },
  'Vaishakha-15': { hi: 'वैशाख पूर्णिमा', en: 'Vaishakha Purnima' },
  'Jyeshtha-10': { hi: 'गंगा दशहरा', en: 'Ganga Dussehra' },
  'Jyeshtha-11': { hi: 'निर्जला एकादशी', en: 'Nirjala Ekadashi' },
  'Jyeshtha-15': { hi: 'ज्येष्ठ स्नान पूर्णिमा', en: 'Snana Yatra Purnima' },
  'Ashadha-2': { hi: 'श्री जगन्नाथ रथ यात्रा', en: 'Ratha Yatra' },
  'Ashadha-11': { hi: 'देवशयनी एकादशी', en: 'Devshayani Ekadashi' },
  'Ashadha-15': { hi: 'गुरु पूर्णिमा (व्यास पूजा)', en: 'Guru Purnima' },
  'Shravana-3': { hi: 'हरियाली तीज (झूलनोत्सव)', en: 'Hariyali Teej (Jhulanotsava)' },
  'Shravana-11': { hi: 'पवित्रा एकादशी', en: 'Pavitra Ekadashi' },
  'Shravana-15': { hi: 'श्रावण पूर्णिमा (रक्षाबंधन)', en: 'Shravana Purnima' },
  'Bhadrapada-23': { hi: 'श्री कृष्ण जन्माष्टमी', en: 'Shri Krishna Janmashtami' },
  'Bhadrapada-8': { hi: 'श्री राधाष्टमी (बरसाना महोत्सव)', en: 'Shri Radhashtami (Barsana)' },
  'Bhadrapada-11': { hi: 'परिवर्तिनी एकादशी', en: 'Parivartini Ekadashi' },
  'Ashwin-10': { hi: 'विजयादशमी महोत्सव', en: 'Vijayadashami' },
  'Ashwin-11': { hi: 'पापांकुशा एकादशी', en: 'Papankusha Ekadashi' },
  'Ashwin-15': { hi: 'शरद पूर्णिमा (महारास उत्सव)', en: 'Sharad Purnima (Maharas)' },
  'Kartika-8': { hi: 'गोपाष्टमी महोत्सव', en: 'Gopashtami Mahotsav' },
  'Kartika-9': { hi: 'अक्षय नवमी (मथुरा परिक्रमा)', en: 'Akshaya Navami' },
  'Kartika-11': { hi: 'देवउठनी (प्रबोधिनी) एकादशी', en: 'Devuthani Ekadashi' },
  'Kartika-15': { hi: 'कार्तिक पूर्णिमा (देव दीपावली)', en: 'Kartika Purnima' },
  'Kartika-30': { hi: 'श्री दीपावली महोत्सव', en: 'Deepavali Mahotsav' },
  'Kartika-1': { hi: 'गोवर्धन पूजा एवं अन्नकूट', en: 'Govardhan Annakut' },
  'Margashirsha-5': { hi: 'श्री बिहार पंचमी (बाँके बिहारी प्राकट्य)', en: 'Bihar Panchami (Banke Bihari)' },
  'Margashirsha-11': { hi: 'मोक्षदा एकादशी (गीता जयंती)', en: 'Mokshada Ekadashi & Gita Jayanti' },
  'Margashirsha-15': { hi: 'मार्गशीर्ष पूर्णिमा', en: 'Margashirsha Purnima' },
  'Pausha-11': { hi: 'पौष पुत्रदा एकादशी', en: 'Pausha Putrada Ekadashi' },
  'Pausha-15': { hi: 'पौष पूर्णिमा', en: 'Pausha Purnima' },
  'Magha-5': { hi: 'बसंत पंचमी (फाग उत्सव आरंभ)', en: 'Vasant Panchami' },
  'Magha-11': { hi: 'जया एकादशी', en: 'Jaya Ekadashi' },
  'Magha-15': { hi: 'माघ पूर्णिमा', en: 'Magha Purnima' },
  'Magha-29': { hi: 'महाशिवरात्रि (गोपेश्वर महादेव)', en: 'Mahashivaratri' },
  'Phalguna-9': { hi: 'बरसाना लठामार होली', en: 'Barsana Lathmar Holi' },
  'Phalguna-11': { hi: 'रंगभरी (आमलकी) एकादशी', en: 'Rangbhari Ekadashi' },
  'Phalguna-15': { hi: 'गौर पूर्णिमा एवं होलिकोत्सव', en: 'Gaura Purnima & Holi' },
};

const DEG2RAD = Math.PI / 180;
const IST_OFFSET_MS = 330 * 60 * 1000;

function norm360(deg: number): number {
  const m = deg % 360;
  return m < 0 ? m + 360 : m;
}

function getJulianDaysSinceJ2000(utcMs: number): number {
  return (utcMs - Date.UTC(2000, 0, 1, 12, 0, 0)) / 86400000;
}

function getSolarLongitude(d: number): number {
  const l = norm360(280.46 + 0.9856474 * d);
  const g = norm360(357.528 + 0.9856003 * d) * DEG2RAD;
  return norm360(l + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g));
}

function getLunarLongitude(d: number): number {
  const lm = norm360(218.3165 + 13.17639648 * d);
  const mm = norm360(134.9634 + 13.06499295 * d) * DEG2RAD;
  const f = norm360(93.2721 + 13.22935024 * d) * DEG2RAD;
  const elongation = norm360(297.8502 + 12.19074912 * d) * DEG2RAD;
  const ms = norm360(357.5291 + 0.98560028 * d) * DEG2RAD;
  return norm360(
    lm +
      6.2886 * Math.sin(mm) +
      1.274 * Math.sin(2 * elongation - mm) +
      0.6583 * Math.sin(2 * elongation) +
      0.2136 * Math.sin(2 * mm) -
      0.1851 * Math.sin(ms) -
      0.1143 * Math.sin(2 * f)
  );
}

function getLahiriAyanamsha(d: number): number {
  const yearsSince2000 = d / 365.25;
  return 23.854 + 0.013969 * yearsSince2000;
}

export function getIstParts(date: Date = new Date()): {
  year: number;
  month: number; // 1..12
  day: number; // 1..31
  weekday: number; // 0..6
  minutesOfDay: number; // 0..1439
} {
  const ist = new Date(date.getTime() + IST_OFFSET_MS);
  return {
    year: ist.getUTCFullYear(),
    month: ist.getUTCMonth() + 1,
    day: ist.getUTCDate(),
    weekday: ist.getUTCDay(),
    minutesOfDay: ist.getUTCHours() * 60 + ist.getUTCMinutes(),
  };
}

export function getDateForIstOffset(baseDate: Date, deltaDays: number): Date {
  const p = getIstParts(baseDate);
  // Return UTC instant corresponding to 12:00 IST on that target IST day
  return new Date(Date.UTC(p.year, p.month - 1, p.day + deltaDays, 6, 30, 0));
}

export function getIstIsoDate(date: Date = new Date()): string {
  const p = getIstParts(date);
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

export function computePanchangForDate(date: Date = new Date()): PanchangInfo {
  const { year, month, day, weekday } = getIstParts(date);
  // Evaluate astronomical ephemeris at Braj sunrise (~06:30 IST = 01:00 UTC)
  const sunriseUtcMs = Date.UTC(year, month - 1, day, 1, 0, 0);
  const d = getJulianDaysSinceJ2000(sunriseUtcMs);

  const sunLon = getSolarLongitude(d);
  const moonLon = getLunarLongitude(d);
  const ayanamsha = getLahiriAyanamsha(d);

  const elongation = norm360(moonLon - sunLon);
  const tithiNumber = Math.min(30, Math.max(1, Math.floor(elongation / 12) + 1));

  const siderealMoon = norm360(moonLon - ayanamsha);
  const nakIndex = Math.floor(siderealMoon / (360 / 27)) % 27;
  const nak = NAKSHATRA_NAMES[nakIndex];

  // Amanta Masa via sidereal solar rashi at the preceding Amavasya
  const approxDaysSinceAmavasya = (elongation / 360) * 29.530588;
  const dAmavasya = d - approxDaysSinceAmavasya;
  const siderealSunAtAmavasya = norm360(
    getSolarLongitude(dAmavasya) - getLahiriAyanamsha(dAmavasya)
  );
  const amantaMasaIdx = (Math.floor(siderealSunAtAmavasya / 30) + 1) % 12;

  // Vrindavan uses Purnimanta lunar month: Krishna Paksha shifts forward by +1 month
  const isShukla = tithiNumber <= 15;
  const masaIdx = isShukla ? amantaMasaIdx : (amantaMasaIdx + 1) % 12;
  const masa = MASA_NAMES[masaIdx];

  const pakshaEnglish: 'Shukla' | 'Krishna' = isShukla ? 'Shukla' : 'Krishna';
  const pakshaDevanagari: 'शुक्ल' | 'कृष्ण' = isShukla ? 'शुक्ल' : 'कृष्ण';

  let tithiNameEnglish: string;
  let tithiNameDevanagari: string;
  if (tithiNumber === 15) {
    tithiNameEnglish = 'Purnima';
    tithiNameDevanagari = 'पूर्णिमा';
  } else if (tithiNumber === 30) {
    tithiNameEnglish = 'Amavasya';
    tithiNameDevanagari = 'अमावस्या';
  } else {
    const tIdx = (tithiNumber - 1) % 15;
    const entry = TITHI_NAMES_1_TO_14[tIdx];
    tithiNameEnglish = entry.en;
    tithiNameDevanagari = entry.hi;
  }

  // Named Vrindavan Utsav or Vrat match
  const key = `${masa.en}-${tithiNumber}`;
  const namedUtsav = BRAJ_UTSAV_BY_MASA_TITHI[key];
  let specialOccasionDevanagari = namedUtsav?.hi;
  let specialOccasionEnglish = namedUtsav?.en;
  if (!specialOccasionDevanagari) {
    const tInPaksha = ((tithiNumber - 1) % 15) + 1;
    if (tInPaksha === 11) {
      specialOccasionDevanagari = `${masa.hi} एकादशी व्रत`;
      specialOccasionEnglish = `${masa.en} Ekadashi`;
    } else if (tInPaksha === 13) {
      specialOccasionDevanagari = 'प्रदोष व्रत';
      specialOccasionEnglish = 'Pradosh Vrat';
    } else if (tithiNumber === 15) {
      specialOccasionDevanagari = `${masa.hi} पूर्णिमा`;
      specialOccasionEnglish = `${masa.en} Purnima`;
    } else if (tithiNumber === 30) {
      specialOccasionDevanagari = `${masa.hi} अमावस्या`;
      specialOccasionEnglish = `${masa.en} Amavasya`;
    }
  }

  return {
    isoDate: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    istYear: year,
    istMonth: month,
    istDay: day,
    weekdayIndex: weekday,
    weekdayShort: WEEKDAYS_SHORT[weekday],
    weekdayDevanagari: WEEKDAYS_DEVANAGARI[weekday],
    gregorianLabel: `${day} ${MONTHS_SHORT[month - 1]} ${year}`,
    tithiNumber,
    pakshaEnglish,
    pakshaDevanagari,
    tithiNameEnglish,
    tithiNameDevanagari,
    tithiShortDevanagari:
      tithiNumber === 15 || tithiNumber === 30
        ? tithiNameDevanagari
        : `${isShukla ? 'शु.' : 'कृ.'} ${tithiNameDevanagari}`,
    masaEnglish: masa.en,
    masaDevanagari: masa.hi,
    nakshatraEnglish: nak.en,
    nakshatraDevanagari: nak.hi,
    specialOccasionDevanagari,
    specialOccasionEnglish,
  };
}

export function getNextUpcomingFestival(fromDate: Date = new Date()): UpcomingFestivalInfo {
  for (let delta = 0; delta <= 45; delta++) {
    const checkDate = getDateForIstOffset(fromDate, delta);
    const p = computePanchangForDate(checkDate);
    if (p.specialOccasionEnglish && p.specialOccasionDevanagari) {
      const key = `${p.masaEnglish}-${p.tithiNumber}`;
      const isMajor =
        Boolean(BRAJ_UTSAV_BY_MASA_TITHI[key]) ||
        ((p.tithiNumber - 1) % 15) + 1 === 11 ||
        p.tithiNumber === 15;
      if (isMajor) {
        return {
          nameDevanagari: p.specialOccasionDevanagari,
          nameEnglish: p.specialOccasionEnglish,
          daysAway: delta,
          dateLabel:
            delta === 0
              ? 'Today'
              : delta === 1
                ? 'Tomorrow'
                : `${p.istDay} ${MONTHS_SHORT[p.istMonth - 1]} (${formatDevanagariNumerals(delta)} दिन)`,
          tithiSummary: `${p.masaDevanagari} ${p.pakshaDevanagari} ${p.tithiNameDevanagari}`,
        };
      }
    }
  }
  const p = computePanchangForDate(fromDate);
  return {
    nameDevanagari: `${p.masaDevanagari} एकादशी`,
    nameEnglish: `${p.masaEnglish} Ekadashi`,
    daysAway: 7,
    dateLabel: p.gregorianLabel,
    tithiSummary: `${p.masaDevanagari} ${p.pakshaDevanagari} ${p.tithiNameDevanagari}`,
  };
}

export function getWeekPanchangDays(baseDate: Date = new Date()): DayItem[] {
  const { weekday, year, month, day } = getIstParts(baseDate);
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  const todayIso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const days: DayItem[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(Date.UTC(year, month - 1, day + mondayOffset + i, 6, 30, 0));
    const panchang = computePanchangForDate(d);
    days.push({
      dayName: panchang.weekdayShort,
      dateNum: panchang.istDay,
      isToday: panchang.isoDate === todayIso,
      tithiLabel: panchang.tithiShortDevanagari,
      isoDate: panchang.isoDate,
      panchang,
    });
  }
  return days;
}

function formatTime12h(minutesOfDay: number): string {
  const normalized = ((minutesOfDay % 1440) + 1440) % 1440;
  const h24 = Math.floor(normalized / 60);
  const m = normalized % 60;
  const suffix = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${suffix}`;
}

interface TempleConfig {
  id: TempleId;
  templeName: string;
  imageUrl: string;
  indexNumber: string;
  winterTimeRange: string;
  summerTimeRange: string;
  winterSessions: TempleSevaSession[];
  summerSessions: TempleSevaSession[];
}

// Authentic seasonal Vrindavan & Barsana Darshan & Ashtayama Aarti timings
const TEMPLE_CONFIGS: Record<TempleId, TempleConfig> = {
  bihari: {
    id: 'bihari',
    templeName: 'Shri Banke Bihari Temple (श्री बाँके बिहारी)',
    imageUrl: '/assets/temples/banke-bihari-v2.webp',
    indexNumber: '01',
    winterTimeRange: '08:45 AM - 01:00 PM • 04:30 PM - 08:30 PM',
    summerTimeRange: '07:45 AM - 12:00 PM • 05:30 PM - 09:30 PM',
    winterSessions: [
      { sevaDevanagari: 'शृंगार एवं प्रातः दर्शन', sevaEnglish: 'Shringar & Morning Darshan', praharLabel: 'प्रातः अष्टयाम', startMin: 525, endMin: 660, bucket: 'morning' },
      { sevaDevanagari: 'राजभोग दर्शन व आरती', sevaEnglish: 'Rajbhog Darshan & Aarti', praharLabel: 'मध्याह्न अष्टयाम', startMin: 660, endMin: 780, bucket: 'rajbhog' },
      { sevaDevanagari: 'संध्या एवं शयन दर्शन', sevaEnglish: 'Sandhya & Shayana Darshan', praharLabel: 'सायं अष्टयाम', startMin: 990, endMin: 1230, bucket: 'evening' },
    ],
    summerSessions: [
      { sevaDevanagari: 'शृंगार एवं प्रातः दर्शन', sevaEnglish: 'Shringar & Morning Darshan', praharLabel: 'प्रातः अष्टयाम', startMin: 465, endMin: 600, bucket: 'morning' },
      { sevaDevanagari: 'राजभोग दर्शन व आरती', sevaEnglish: 'Rajbhog Darshan & Aarti', praharLabel: 'मध्याह्न अष्टयाम', startMin: 600, endMin: 720, bucket: 'rajbhog' },
      { sevaDevanagari: 'संध्या एवं शयन दर्शन', sevaEnglish: 'Sandhya & Shayana Darshan', praharLabel: 'सायं अष्टयाम', startMin: 1050, endMin: 1290, bucket: 'evening' },
    ],
  },
  vallabh: {
    id: 'vallabh',
    templeName: 'Shri Radha Vallabh Lal (श्री राधा वल्लभ)',
    imageUrl: '/assets/temples/radha-vallabh.webp',
    indexNumber: '02',
    winterTimeRange: '05:30 AM - 12:00 PM • 05:00 PM - 08:45 PM',
    summerTimeRange: '05:00 AM - 12:00 PM • 05:30 PM - 09:00 PM',
    winterSessions: [
      { sevaDevanagari: 'मंगला एवं धूप शृंगार दर्शन', sevaEnglish: 'Mangala & Shringar Darshan', praharLabel: 'प्रातः अष्टयाम', startMin: 330, endMin: 570, bucket: 'morning' },
      { sevaDevanagari: 'राजभोग दर्शन एवं महाप्रसाद', sevaEnglish: 'Rajbhog Darshan & Mahaprasad', praharLabel: 'मध्याह्न अष्टयाम', startMin: 570, endMin: 720, bucket: 'rajbhog' },
      { sevaDevanagari: 'उत्थापन, संध्या व शयन आरती', sevaEnglish: 'Utthapan, Sandhya & Shayana', praharLabel: 'सायं अष्टयाम', startMin: 1020, endMin: 1245, bucket: 'evening' },
    ],
    summerSessions: [
      { sevaDevanagari: 'मंगला एवं धूप शृंगार दर्शन', sevaEnglish: 'Mangala & Shringar Darshan', praharLabel: 'प्रातः अष्टयाम', startMin: 300, endMin: 570, bucket: 'morning' },
      { sevaDevanagari: 'राजभोग दर्शन एवं महाप्रसाद', sevaEnglish: 'Rajbhog Darshan & Mahaprasad', praharLabel: 'मध्याह्न अष्टयाम', startMin: 570, endMin: 720, bucket: 'rajbhog' },
      { sevaDevanagari: 'उत्थापन, संध्या व शयन आरती', sevaEnglish: 'Utthapan, Sandhya & Shayana', praharLabel: 'सायं अष्टयाम', startMin: 1050, endMin: 1260, bucket: 'evening' },
    ],
  },
  raman: {
    id: 'raman',
    templeName: 'Shri Radha Raman Ji (श्री राधा रमण)',
    imageUrl: '/assets/darshan/radharaman-simhasan.webp',
    indexNumber: '03',
    winterTimeRange: '08:00 AM - 12:30 PM • 05:30 PM - 08:30 PM',
    summerTimeRange: '08:00 AM - 12:30 PM • 06:00 PM - 09:00 PM',
    winterSessions: [
      { sevaDevanagari: 'मंगला व प्रातः शृंगार आरती', sevaEnglish: 'Mangala & Shringar Aarti', praharLabel: 'प्रातः अष्टयाम', startMin: 480, endMin: 645, bucket: 'morning' },
      { sevaDevanagari: 'राजभोग दर्शन व आरती', sevaEnglish: 'Rajbhog Darshan & Aarti', praharLabel: 'मध्याह्न अष्टयाम', startMin: 645, endMin: 750, bucket: 'rajbhog' },
      { sevaDevanagari: 'संध्या आरती व शयन दर्शन', sevaEnglish: 'Sandhya Aarti & Shayana', praharLabel: 'संध्या अष्टयाम', startMin: 1050, endMin: 1230, bucket: 'evening' },
    ],
    summerSessions: [
      { sevaDevanagari: 'मंगला व प्रातः शृंगार आरती', sevaEnglish: 'Mangala & Shringar Aarti', praharLabel: 'प्रातः अष्टयाम', startMin: 480, endMin: 645, bucket: 'morning' },
      { sevaDevanagari: 'राजभोग दर्शन व आरती', sevaEnglish: 'Rajbhog Darshan & Aarti', praharLabel: 'मध्याह्न अष्टयाम', startMin: 645, endMin: 750, bucket: 'rajbhog' },
      { sevaDevanagari: 'संध्या आरती व शयन दर्शन', sevaEnglish: 'Sandhya Aarti & Shayana', praharLabel: 'संध्या अष्टयाम', startMin: 1080, endMin: 1260, bucket: 'evening' },
    ],
  },
  barsana: {
    id: 'barsana',
    templeName: 'Barsana Ladili Lal Ji (बरसाना श्रीजी)',
    imageUrl: '/assets/temples/barsana-radharani.webp',
    indexNumber: '04',
    winterTimeRange: '05:30 AM - 02:00 PM • 04:30 PM - 08:45 PM',
    summerTimeRange: '05:00 AM - 02:00 PM • 05:00 PM - 09:15 PM',
    winterSessions: [
      { sevaDevanagari: 'मंगला, पीली पोखर व शृंगार', sevaEnglish: 'Mangala & Shringar Darshan', praharLabel: 'प्रातः अष्टयाम', startMin: 330, endMin: 660, bucket: 'morning' },
      { sevaDevanagari: 'राजभोग सेवा व महाआरती', sevaEnglish: 'Rajbhog Seva & Maha Aarti', praharLabel: 'मध्याह्न अष्टयाम', startMin: 660, endMin: 840, bucket: 'rajbhog' },
      { sevaDevanagari: 'संध्या व शयन चंवर सेवा', sevaEnglish: 'Sandhya & Shayana Chamara Seva', praharLabel: 'निशा शयन', startMin: 990, endMin: 1245, bucket: 'evening' },
    ],
    summerSessions: [
      { sevaDevanagari: 'मंगला, पीली पोखर व शृंगार', sevaEnglish: 'Mangala & Shringar Darshan', praharLabel: 'प्रातः अष्टयाम', startMin: 300, endMin: 660, bucket: 'morning' },
      { sevaDevanagari: 'राजभोग सेवा व महाआरती', sevaEnglish: 'Rajbhog Seva & Maha Aarti', praharLabel: 'मध्याह्न अष्टयाम', startMin: 660, endMin: 840, bucket: 'rajbhog' },
      { sevaDevanagari: 'संध्या व शयन चंवर सेवा', sevaEnglish: 'Sandhya & Shayana Chamara Seva', praharLabel: 'निशा शयन', startMin: 1020, endMin: 1275, bucket: 'evening' },
    ],
  },
};

export function isVrindavanWinterSeason(istMonth: number): boolean {
  // Nov (11), Dec (12), Jan (1), Feb (2) observe Sheeta (Winter) Mandir timings in Braj
  return istMonth >= 11 || istMonth <= 2;
}

export function computeLiveMandirSchedule(
  templeId: TempleId,
  istMins: number,
  istMonth: number,
  isViewingToday: boolean,
  selectedPanchang?: PanchangInfo
): LiveMandirSchedule {
  const cfg = TEMPLE_CONFIGS[templeId];
  const isWinter = isVrindavanWinterSeason(istMonth);
  const sessions = isWinter ? cfg.winterSessions : cfg.summerSessions;
  const timeRangeLabel = isWinter ? cfg.winterTimeRange : cfg.summerTimeRange;

  if (!isViewingToday && selectedPanchang) {
    const occasionNote = selectedPanchang.specialOccasionDevanagari
      ? `${selectedPanchang.specialOccasionDevanagari} • विशेष दर्शन`
      : `${selectedPanchang.tithiNameDevanagari} नित्य अष्टयाम दर्शन`;
    const featured = sessions[isWinter ? 2 : 0];
    return {
      templeId,
      templeName: cfg.templeName,
      sevaTitleEnglish: featured.sevaEnglish,
      sevaTitleDevanagari: featured.sevaDevanagari,
      praharLabel: `${selectedPanchang.weekdayDevanagari} • ${selectedPanchang.tithiShortDevanagari}`,
      timeRangeLabel,
      isOpen: false,
      statusType: 'upcoming',
      countdownLabel: occasionNote,
      isRajbhogSession: true,
      isEveningSession: true,
      imageUrl: cfg.imageUrl,
      indexNumber: cfg.indexNumber,
    };
  }

  // 1. Check if mandir doors are open right now
  for (const s of sessions) {
    if (istMins >= s.startMin && istMins < s.endMin) {
      const rem = s.endMin - istMins;
      const hrs = Math.floor(rem / 60);
      const mins = rem % 60;
      const countdownLabel =
        hrs > 0 ? `दर्शन खुले • ${hrs}घं ${mins}मि शेष` : `दर्शन खुले • ${mins}मि शेष`;

      return {
        templeId,
        templeName: cfg.templeName,
        sevaTitleEnglish: s.sevaEnglish,
        sevaTitleDevanagari: s.sevaDevanagari,
        praharLabel: s.praharLabel,
        timeRangeLabel,
        isOpen: true,
        statusType: 'active',
        countdownLabel,
        isRajbhogSession: s.bucket === 'rajbhog',
        isEveningSession: s.bucket === 'evening',
        imageUrl: cfg.imageUrl,
        indexNumber: cfg.indexNumber,
      };
    }
  }

  // 2. Doors resting right now: find next session today
  const nextToday = sessions.find((s) => istMins < s.startMin);
  if (nextToday) {
    return {
      templeId,
      templeName: cfg.templeName,
      sevaTitleEnglish: nextToday.sevaEnglish,
      sevaTitleDevanagari: nextToday.sevaDevanagari,
      praharLabel: nextToday.praharLabel,
      timeRangeLabel,
      isOpen: false,
      statusType: 'upcoming',
      countdownLabel: `पट बंद • ${formatTime12h(nextToday.startMin)} पर ${nextToday.sevaDevanagari.split(' ')[0]}`,
      isRajbhogSession: nextToday.bucket === 'rajbhog',
      isEveningSession: nextToday.bucket === 'evening',
      imageUrl: cfg.imageUrl,
      indexNumber: cfg.indexNumber,
    };
  }

  // 3. Past last Shayana closing for tonight
  const firstTomorrow = sessions[0];
  return {
    templeId,
    templeName: cfg.templeName,
    sevaTitleEnglish: 'Shayana Vishrama (Night Rest)',
    sevaTitleDevanagari: 'रात्रि शयन विश्राम',
    praharLabel: 'निशीथ अष्टयाम',
    timeRangeLabel,
    isOpen: false,
    statusType: 'completed',
    countdownLabel: `शयन विश्राम • कल ${formatTime12h(firstTomorrow.startMin)} से`,
    isRajbhogSession: false,
    isEveningSession: true,
    imageUrl: cfg.imageUrl,
    indexNumber: cfg.indexNumber,
  };
}
