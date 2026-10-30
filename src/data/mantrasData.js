import importedCorpus from './mantra-corpus/library.json';
import catalog from '../features/mantras/catalog.cjs';

export const CATEGORY_OPTIONS = [
  { id: 'mantras', label: 'Mantras', icon: '\u0950' },
  { id: 'shlokas', label: 'Gita Shlokas', labelHi: 'गीता श्लोक', icon: 'गी' },
  { id: 'aarti', label: 'Aarti', icon: '\u2726' },
  { id: 'chalisa', label: 'Chalisa', icon: '\u091a' },
  { id: 'bhajan', label: 'Bhajan', icon: '\u266b' },
  { id: 'stotra', label: 'Stotra', icon: '\u0938\u094d' },
  { id: 'kavach', label: 'Kavach', icon: '\u0915' },
  { id: 'vrat-katha', label: 'Vrat Katha', icon: '\u0935\u094d' },
  { id: 'festival-special', label: 'Festival Special', icon: '\u273a' },
];

export const DEITY_OPTIONS = [
  {
    id: 'shiv',
    englishName: 'Shiv Ji',
    hindiName: '\u0936\u093f\u0935 \u091c\u0940',
    image: require('../../assets/deities/full/shiv-ji.png'),
    thumbnailImage: require('../../assets/deities/thumbnails/shiv-ji.png'),
    symbol: '\u0950',
  },
  {
    id: 'ganesh',
    englishName: 'Ganesh Ji',
    hindiName: '\u0917\u0923\u0947\u0936 \u091c\u0940',
    image: require('../../assets/deities/full/ganesh-ji.png'),
    thumbnailImage: require('../../assets/deities/thumbnails/ganesh-ji.png'),
    symbol: '\u0917\u0902',
  },
  {
    id: 'hanuman',
    englishName: 'Hanuman Ji',
    hindiName: '\u0939\u0928\u0941\u092e\u093e\u0928 \u091c\u0940',
    image: require('../../assets/deities/full/hanuman-ji.png'),
    thumbnailImage: require('../../assets/deities/thumbnails/hanuman-ji.png'),
    symbol: '\u0930\u093e\u092e',
  },
  {
    id: 'durga',
    englishName: 'Durga Maa',
    hindiName: '\u0926\u0941\u0930\u094d\u0917\u093e \u092e\u093e\u0901',
    image: require('../../assets/deities/full/durga-ma.png'),
    thumbnailImage: require('../../assets/deities/thumbnails/durga-ma.png'),
    symbol: '\u0926\u0941\u0902',
  },
  {
    id: 'lakshmi',
    englishName: 'Lakshmi Maa',
    hindiName: '\u0932\u0915\u094d\u0937\u094d\u092e\u0940 \u092e\u093e\u0901',
    image: require('../../assets/deities/full/laxmi-ma.png'),
    thumbnailImage: require('../../assets/deities/thumbnails/laxmi-ma.png'),
    symbol: '\u0936\u094d\u0930\u0940',
  },
  {
    id: 'krishna',
    englishName: 'Krishna Ji',
    hindiName: '\u0915\u0943\u0937\u094d\u0923 \u091c\u0940',
    image: require('../../assets/deities/full/krishna-ji.png'),
    thumbnailImage: require('../../assets/deities/thumbnails/krishna-ji.png'),
    symbol: '\u0915\u0943',
  },
  {
    id: 'ram',
    englishName: 'Ram Ji',
    hindiName: '\u0930\u093e\u092e \u091c\u0940',
    image: require('../../assets/festivals/ram_navami.png'),
    symbol: '\u0930\u093e\u092e',
  },
  {
    id: 'saraswati',
    englishName: 'Saraswati Maa',
    hindiName: '\u0938\u0930\u0938\u094d\u0935\u0924\u0940 \u092e\u093e\u0901',
    image: require('../../assets/festivals/saraswati puja.png'),
    symbol: '\u0910\u0902',
  },
  { id: 'vishnu', englishName: 'Vishnu', hindiName: 'विष्णु', bengaliName: 'বিষ্ণু', image: null, symbol: 'ॐ' },
  { id: 'kali', englishName: 'Kali Maa', hindiName: 'काली माँ', bengaliName: 'কালী মা', image: null, symbol: 'काली' },
  { id: 'surya', englishName: 'Surya', hindiName: 'सूर्य', bengaliName: 'সূর্য', image: null, symbol: '☼' },
  { id: 'shani', englishName: 'Shani', hindiName: 'शनि', bengaliName: 'শনি', image: null, symbol: 'शं' },
  { id: 'universal', englishName: 'Daily prayers', hindiName: 'दैनिक प्रार्थना', bengaliName: 'নিত্য প্রার্থনা', image: null, symbol: 'ॐ' },
];

// Stable IDs keep existing favorites and Jaap sessions. Text and attribution
// come exclusively from the reviewed corpus; recordings stay native assets.
const READING_DEFAULTS = {
  'om-namah-shivaya': { chantCount: '108' },
  'maha-mrityunjaya': { chantCount: '108' },
  'shiv-aarti': { chantCount: '1', audio: require('../../assets/sounds/shiv-aarti.mp3') },
  'ganesh-vakratunda': { chantCount: '21' },
  'ganesh-aarti': { chantCount: '1', audio: require('../../assets/sounds/ganesh-aarti.mp3') },
  'hanuman-chalisa': { chantCount: '1' },
  'hanuman-kavach': { chantCount: '11' },
  'durga-stuti': { chantCount: '9' },
  'durga-aarti': { chantCount: '1', audio: require('../../assets/sounds/durga-aarti.mp3') },
  'lakshmi-mantra': { chantCount: '108' },
  'krishna-bhajan': { chantCount: '1' },
  'ram-raksha': { chantCount: '11' },
  'saraswati-vandana': { chantCount: '21' },
};
const FEATURED_IDS = ['om-namah-shivaya', 'maha-mrityunjaya', 'ganesh-vakratunda', 'lakshmi-mantra', 'saraswati-vandana', 'hanuman-chalisa', 'durga-stuti', 'krishna-bhajan', 'ram-raksha'];
export const MANTRA_LIBRARY = importedCorpus.map((item) => ({
  chantCount: item.categoryId === 'mantras' ? '108' : '1',
  language: 'Sanskrit',
  ...item,
  ...READING_DEFAULTS[item.id],
  featured: FEATURED_IDS.includes(item.id) || !!item.featured,
})).sort((a, b) => {
  const rank = (item) => item.categoryId === 'shlokas' ? 3 : item.isExcerpt ? 2 : item.featured ? 0 : 1;
  return rank(a) - rank(b);
});
const mantraIndex = new Map(MANTRA_LIBRARY.map((item) => [item.id, item]));

export function getMantraById(id, customMantras = []) {
  return mantraIndex.get(id) || customMantras.find((item) => item.id === id);
}

export function getDailyMantra(date = new Date()) {
  return catalog.dailyMantra(MANTRA_LIBRARY, date);
}

export const getMantraScript = catalog.getMantraScript;

export function getCategoryById(categoryId) {
  return CATEGORY_OPTIONS.find((category) => category.id === categoryId) ?? CATEGORY_OPTIONS[0];
}

export function getDeityById(deityId) {
  return DEITY_OPTIONS.find((deity) => deity.id === deityId) ?? DEITY_OPTIONS[0];
}
