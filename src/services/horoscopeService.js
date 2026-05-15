const SAFE_MESSAGE = "Unable to load today's horoscope. Please try again later.";

export async function getDailyHoroscopes(languageCode = 'en') {
  return {
    aries: { horoscope: SAFE_MESSAGE },
    taurus: { horoscope: SAFE_MESSAGE },
    gemini: { horoscope: SAFE_MESSAGE },
    cancer: { horoscope: SAFE_MESSAGE },
    leo: { horoscope: SAFE_MESSAGE },
    virgo: { horoscope: SAFE_MESSAGE },
    libra: { horoscope: SAFE_MESSAGE },
    scorpio: { horoscope: SAFE_MESSAGE },
    sagittarius: { horoscope: SAFE_MESSAGE },
    capricorn: { horoscope: SAFE_MESSAGE },
    aquarius: { horoscope: SAFE_MESSAGE },
    pisces: { horoscope: SAFE_MESSAGE },
  };
}
