const deities = [
  {
    id: 'shiv',
    name: 'Shiv Ji',
    category: 'Shiva',
    subtitle: 'Mahadev • Destroyer of negativity',
    mantra: 'Om Namah Shivaya',
    image: require('../../assets/deities/shiv-ji.png'),
    aartiAudio: require('../../assets/sounds/shiv-aarti.mp3'),
    aartiVideo: require('../../assets/videos/aarti/shiv-aarti-loop.mp4'),
    preferredPrasad: 'Bel Patra',
  },
  {
    id: 'durga',
    name: 'Durga Ma',
    category: 'Shakti',
    subtitle: 'Shakti • Protector and mother',
    mantra: 'Om Dum Durgaye Namaha',
    image: require('../../assets/deities/durga-ma.png'),
    aartiAudio: require('../../assets/sounds/durga-aarti.mp3'),
    aartiVideo: require('../../assets/videos/aarti/durga-aarti-loop.mp4'),
    preferredPrasad: 'Halwa Puri',
  },
  {
    id: 'ganesh',
    name: 'Ganesh Ji',
    category: 'Popular',
    subtitle: 'Vighnaharta • Remover of obstacles',
    mantra: 'Om Gan Ganapataye Namaha',
    image: require('../../assets/deities/ganesh-ji.png'),
    aartiAudio: require('../../assets/sounds/ganesh-aarti.mp3'),
    aartiVideo: require('../../assets/videos/aarti/ganesh-aarti-loop.mp4'),
    preferredPrasad: 'Modak',
  },
  {
    id: 'krishna',
    name: 'Krishna Ji',
    category: 'Vishnu',
    subtitle: 'Govind • Love and divine wisdom',
    mantra: 'Hare Krishna Hare Rama',
    image: require('../../assets/deities/krishna-ji.png'),
    aartiAudio: require('../../assets/sounds/krishna-aarti.mp3'),
    aartiVideo: require('../../assets/videos/aarti/krishna-aarti-loop.mp4'),
    preferredPrasad: 'Makhan Mishri',
  },
  {
    id: 'hanuman',
    name: 'Hanuman Ji',
    category: 'Popular',
    subtitle: 'Bhakti • Strength and devotion',
    mantra: 'Om Hanumate Namaha',
    image: require('../../assets/deities/hanuman-ji.png'),
    aartiAudio: require('../../assets/sounds/hanuman-aarti.mp3'),
    aartiVideo: require('../../assets/videos/aarti/hanuman-aarti-loop.mp4'),
    preferredPrasad: 'Boondi Laddoo',
  },
  {
    id: 'lakshmi',
    name: 'Lakshmi Ma',
    category: 'Shakti',
    subtitle: 'Shri • Prosperity and grace',
    mantra: 'Om Shreem Mahalakshmiyei Namaha',
    image: require('../../assets/deities/laxmi-ma.png'),
    aartiAudio: null,
    aartiVideo: null,
    preferredPrasad: 'Kheer',
  },
];

const pujaItems = {
  flower: {
    id: 'flower',
    name: 'Flower',
    image: require('../../assets/puja-items/red-flower.png'),
  },
  diya: {
    id: 'diya',
    name: 'Diya',
    image: require('../../assets/puja-items/diya.png'),
  },
  agarbatti: {
    id: 'agarbatti',
    name: 'Agarbatti',
    image: require('../../assets/puja-items/agarbatti.png'),
  },
  prasad: {
    id: 'prasad',
    name: 'Prasad',
    image: require('../../assets/puja-items/prasad.png'),
  },
  bell: {
    id: 'bell',
    name: 'Bell',
    image: require('../../assets/puja-items/bell.png'),
    audio: require('../../assets/sounds/bell.mp3'),
  },
  aartiThali: {
    id: 'aarti',
    name: 'Aarti Thali',
    image: require('../../assets/puja-items/aarti-thali.png'),
  },
};

const pujaModes = {
  quick: {
    id: 'quick',
    name: 'Quick Puja',
    actions: ['flower', 'diya', 'bell'],
  },
  full: {
    id: 'full',
    name: 'Full Puja',
    actions: ['flower', 'diya', 'agarbatti', 'prasad', 'bell', 'aarti'],
  },
};

export { deities, pujaItems, pujaModes };
