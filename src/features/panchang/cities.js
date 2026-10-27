// Rounded city-centre coordinates. Geographic reference: GeoNames (CC BY 4.0).
const places = [
  ['New Delhi', 'नई दिल्ली', 28.6139, 77.209], ['Mumbai', 'मुंबई', 19.076, 72.8777],
  ['Kolkata', 'कोलकाता', 22.5726, 88.3639], ['Chennai', 'चेन्नई', 13.0827, 80.2707],
  ['Bengaluru', 'बेंगलुरु', 12.9716, 77.5946], ['Hyderabad', 'हैदराबाद', 17.385, 78.4867],
  ['Varanasi', 'वाराणसी', 25.3176, 82.9739], ['Ujjain', 'उज्जैन', 23.1765, 75.7885],
  ['Ayodhya', 'अयोध्या', 26.7922, 82.1998], ['Mathura', 'मथुरा', 27.4924, 77.6737],
  ['Vrindavan', 'वृंदावन', 27.565, 77.6593], ['Haridwar', 'हरिद्वार', 29.9457, 78.1642],
  ['Jaipur', 'जयपुर', 26.9124, 75.7873], ['Ahmedabad', 'अहमदाबाद', 23.0225, 72.5714],
  ['Pune', 'पुणे', 18.5204, 73.8567], ['Lucknow', 'लखनऊ', 26.8467, 80.9462],
  ['Patna', 'पटना', 25.5941, 85.1376], ['Bhopal', 'भोपाल', 23.2599, 77.4126],
  ['Bhubaneswar', 'भुवनेश्वर', 20.2961, 85.8245], ['Guwahati', 'गुवाहाटी', 26.1445, 91.7362],
  ['Amritsar', 'अमृतसर', 31.634, 74.8723], ['Chandigarh', 'चंडीगढ़', 30.7333, 76.7794],
  ['Thiruvananthapuram', 'तिरुवनंतपुरम', 8.5241, 76.9366], ['Tirupati', 'तिरुपति', 13.6288, 79.4192],
];
export const offlineCities = places.map(([name, nameHi, latitude, longitude]) => ({
  locationName: `${name}, India`, resolvedPlaceName: `${name}, India`, nameHi, latitude, longitude, timezone: 'Asia/Kolkata',
}));
export function searchOfflineCities(query) {
  const term = String(query || '').trim().toLowerCase().replace(/,?\s*india$/, '').trim();
  return offlineCities.filter((place) => place.locationName.toLowerCase().includes(term) || place.nameHi.includes(term));
}
