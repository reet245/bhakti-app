import { useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';

const HINDI = {
  'Search mantras, aarti, chalisa...': 'मंत्र, आरती, चालीसा खोजें…',
  'Deity Categories': 'देवता', 'Popular Mantras': 'लोकप्रिय मंत्र',
  'View All': 'सभी देखें', 'Show Less': 'कम दिखाएँ', 'No mantras found.': 'कोई मंत्र नहीं मिला।',
  'Audio unavailable': 'ऑडियो अनुपलब्ध', 'Recording unavailable': 'रिकॉर्डिंग अनुपलब्ध',
  'Play recording': 'रिकॉर्डिंग चलाएँ', 'Stop recording': 'रिकॉर्डिंग रोकें', 'Cancel loading recording': 'रिकॉर्डिंग लोड करना रद्द करें',
  'Remove from favorites': 'पसंदीदा से हटाएँ', 'Add to favorites': 'पसंदीदा में जोड़ें',
  'Mantra Details': 'मंत्र का विवरण', 'Sacred Chant': 'पवित्र मंत्र',
  'Meaning': 'अर्थ', 'Benefits': 'पारंपरिक महत्व', 'Best time to chant': 'जप का समय',
  'Recommended chant count': 'सुझाई गई जप संख्या', 'Chant count': 'जप संख्या',
  'Start Jaap': 'जप शुरू करें', 'Resume Jaap': 'जप जारी रखें', 'Pause Jaap': 'जप रोकें',
  'Jaap Counter': 'जप गणना', 'Reset': 'रीसेट', 'Jaap complete': 'जप पूरा हुआ',
  'Your devotional count has reached the target.': 'आपकी जप संख्या लक्ष्य तक पहुँच गई है।',
  'Tap to count': 'गिनने के लिए स्पर्श करें', 'Start or tap': 'शुरू करें या स्पर्श करें',
  'Mala': 'माला', 'Completed': 'पूरा हुआ', 'Time': 'समय', 'Add one chant': 'एक जप जोड़ें',
  'Loading saved progress…': 'सहेजी गई प्रगति लोड हो रही है…',
  'A matching recording is not available yet.': 'इस मंत्र की रिकॉर्डिंग अभी उपलब्ध नहीं है।',
  'Partial text. The complete work is not available in this edition.': 'आंशिक पाठ। इस संस्करण में पूरी रचना उपलब्ध नहीं है।',
  'A matching recording is not available for this chant. You can still read it and use the Jaap counter.': 'इस मंत्र की रिकॉर्डिंग उपलब्ध नहीं है। आप पाठ पढ़ सकते हैं और जप गणना कर सकते हैं।',
  'This recording could not be played. Please try again.': 'रिकॉर्डिंग नहीं चल सकी। कृपया फिर प्रयास करें।',
  'Saved devotional progress could not be loaded.': 'सहेजी गई प्रगति लोड नहीं हो सकी।',
  'Progress is available for this session, but could not be saved on this device.': 'इस सत्र की प्रगति उपलब्ध है, लेकिन इस डिवाइस पर सहेजी नहीं जा सकी।',
  'Read text source': 'पाठ का स्रोत देखें', 'Share': 'साझा करें', 'Read Story': 'कथा पढ़ें',
  'Mantras': 'मंत्र', 'Aarti': 'आरती', 'Chalisa': 'चालीसा', 'Bhajan': 'भजन',
  'Stotra': 'स्तोत्र', 'Kavach': 'कवच', 'Vrat Katha': 'व्रत कथा', 'Festival Special': 'उत्सव विशेष', 'Gita Shlokas': 'गीता श्लोक',
};

export default function useDevotionalCopy() {
  const { currentLanguage } = useLanguage();
  const isHindi = currentLanguage === 'hi';
  const ui = useCallback((text) => isHindi ? HINDI[text] || text : text, [isHindi]);
  return { ui, isHindi };
}
