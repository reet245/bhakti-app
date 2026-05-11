// ============================================================
// src/services/panchangService.js
// ============================================================
//
// WHY THIS FILE EXISTS:
//   A screen file should only handle WHAT TO SHOW (the UI).
//   It should NOT handle WHERE THE DATA COMES FROM.
//   This file owns all data-fetching so CalendarScreen stays
//   clean. To swap APIs in future, only this file changes.
//
// CURRENT STATE → Real sunrise/sunset from sunrise-sunset.org
//                 Tithi & festival still use placeholder logic
//                 (a real Panchang API can replace that later)
// ============================================================


// ------------------------------------------------------------
// Helper: formatUTCtoLocalTime
// ------------------------------------------------------------
// The API returns times in UTC format, e.g.:
//   "2026-05-05T00:05:56+00:00"
//
// We need to show the user their LOCAL time, e.g.:
//   "5:35 AM"
//
// HOW IT WORKS:
//   new Date(utcString) converts the UTC string into a
//   JavaScript Date object. The Date object always knows
//   the correct local time for the device's timezone.
//   .toLocaleTimeString() then formats it as a readable string.
//
// Parameters:
//   utcString → the raw UTC time string from the API
//
// Returns:
//   A readable local time string like "5:35 AM"
// ------------------------------------------------------------
function formatUTCtoLocalTime(utcString) {
  const date = new Date(utcString);
  // toLocaleTimeString formats the time based on the device's locale
  // { hour: '2-digit', minute: '2-digit' } = show hours and minutes only
  // e.g. "05:35 AM" or "5:35 AM" depending on device settings
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}


// ------------------------------------------------------------
// Helper: getTithi
// ------------------------------------------------------------
// WHAT IS A TITHI?
//   A Tithi is a lunar day in the Hindu calendar.
//   A lunar month has exactly 30 tithis — 15 in the bright
//   half (Shukla Paksha, new moon → full moon) and 15 in the
//   dark half (Krishna Paksha, full moon → new moon).
//
// HOW THE SIMULATION WORKS:
//   A real Tithi requires knowing the exact angle between the
//   Sun and Moon — that needs an astronomy API.
//   For now we simulate by mapping each calendar date (1–31)
//   to one of the 30 Tithi names using the modulo (%) operator.
//
//   date % 30  gives a number from 0 to 29
//   We use that number as an index into the TITHIS array.
//
//   Example:
//     date 1  → 1 % 30 = 1  → "Dwitiya"
//     date 15 → 15 % 30 = 15 → "Purnima"
//     date 30 → 30 % 30 = 0  → "Pratipada"
//
// WHY NOT A REAL ASTROLOGY API YET?
//   Free astrology APIs are rare and often require sign-up,
//   API keys, or paid plans. This simulation keeps the app
//   working beautifully while we evaluate which API to use.
//   When ready, only THIS function needs to change.
// ------------------------------------------------------------

// All 30 Tithi names in order (Shukla 1–15, then Krishna 1–15)
const TITHIS = [
  'Pratipada',   //  0 / 30 — 1st lunar day (new moon)
  'Dwitiya',     //  1
  'Tritiya',     //  2
  'Chaturthi',   //  3
  'Panchami',    //  4
  'Shashthi',    //  5
  'Saptami',     //  6
  'Ashtami',     //  7
  'Navami',      //  8
  'Dashami',     //  9
  'Ekadashi',    // 10 — auspicious fasting day
  'Dwadashi',    // 11
  'Trayodashi',  // 12
  'Chaturdashi', // 13
  'Purnima',     // 14 — full moon
  'Pratipada',   // 15 — start of dark half
  'Dwitiya',     // 16
  'Tritiya',     // 17
  'Chaturthi',   // 18
  'Panchami',    // 19
  'Shashthi',    // 20
  'Saptami',     // 21
  'Ashtami',     // 22
  'Navami',      // 23
  'Dashami',     // 24
  'Ekadashi',    // 25 — second Ekadashi of the month
  'Dwadashi',    // 26
  'Trayodashi',  // 27
  'Chaturdashi', // 28
  'Amavasya',    // 29 — new moon (no moon visible)
];

function getTithi(date) {
  // date % 30 maps any date number to an index in TITHIS (0–29)
  // We subtract 1 from date first so date=1 maps to index 0
  const index = (date - 1) % 30;
  return TITHIS[index];
}


// ------------------------------------------------------------
// Helper: getFestival
// ------------------------------------------------------------
// WHAT IS THIS?
//   A simple lookup table that maps specific calendar dates
//   to well-known spiritual observances.
//
// HOW IT WORKS:
//   We define a plain object (FESTIVALS) where the key is
//   the date number and the value is the festival name.
//   If the tapped date exists as a key, we return its name.
//   Otherwise we return 'None'.
//
//   Example:
//     getFestival(1)  → "New Month Puja"
//     getFestival(15) → "Full Moon (Purnima)"
//     getFestival(7)  → "None"
//
// NOTE: These are fixed to calendar dates, not lunar dates.
//   A real Panchang API would calculate festivals based on
//   the actual lunar calendar, which varies each year.
// ------------------------------------------------------------

const FESTIVALS = {
  1:  'New Month Puja',        // 1st of every month
  5:  'Panchami Puja',         // 5th — Saraswati Panchami style
  10: 'Dashami',               // 10th
  11: 'Ekadashi Fast',         // 11th — fasting day
  14: 'Chaturdashi Puja',      // 14th
  15: 'Full Moon (Purnima)',   // 15th — full moon observance
  25: 'Ekadashi Fast',         // 25th — second Ekadashi
  29: 'Chaturdashi Puja',      // 29th
  30: 'Amavasya',              // 30th — new moon, ancestor rituals
};

function getFestival(date) {
  // Check if this date has an entry in FESTIVALS
  // If FESTIVALS[date] exists, return it; otherwise return 'None'
  return FESTIVALS[date] || 'None';
}


// ------------------------------------------------------------
// Helper: getDummyTithiAndFestival  (calls the two above)
// ------------------------------------------------------------
// This wrapper keeps the calling code in getPanchangFromAPI
// unchanged — it still calls getDummyTithiAndFestival(date)
// and gets back { tithi, festival }.
// ------------------------------------------------------------
function getDummyTithiAndFestival(date) {
  return {
    tithi:    getTithi(date),
    festival: getFestival(date),
  };
}


// ------------------------------------------------------------
// getPanchangFromAPI  (main exported function)
// ------------------------------------------------------------
// Fetches real sunrise & sunset from the free API at:
//   https://api.sunrise-sunset.org
//
// Parameters:
//   { year, month, day, latitude, longitude }
//   month is the JavaScript Date month (0-11), so we convert it
//   to a calendar month (1-12) before calling the API.
//
// Returns:
//   { tithi, festival, sunrise, sunset }
// ------------------------------------------------------------
async function getPanchangFromAPI({ year, month, day, latitude, longitude }) {
  const apiMonth = month + 1;
  const dateString = [
    year,
    String(apiMonth).padStart(2, '0'),
    String(day).padStart(2, '0'),
  ].join('-');

  // ----------------------------------------------------------
  // STEP 2: Build the API URL
  // ----------------------------------------------------------
  // We plug latitude, longitude, and YYYY-MM-DD date into the URL.
  // formatted=0 tells the API to give us raw UTC times (not
  // pre-formatted strings), so we can convert them ourselves.
  //
  // Template literals (backticks + ${}) let us embed variables
  // inside a string cleanly.
  // ----------------------------------------------------------
  const url =
    `https://api.sunrise-sunset.org/json?lat=${latitude}&lng=${longitude}&date=${dateString}&formatted=0`;

  // ----------------------------------------------------------
  // STEP 5: Wrap everything in try/catch for error handling
  // ----------------------------------------------------------
  // "try" → attempt the network call
  // "catch" → if ANYTHING goes wrong (no internet, API down,
  //            bad response...) we land here safely and return
  //            fallback data instead of crashing the app.
  // ----------------------------------------------------------
  try {

    // --------------------------------------------------------
    // STEP 2: Call the API using fetch()
    // --------------------------------------------------------
    // HOW fetch() WORKS:
    //   fetch(url) sends an HTTP GET request to the URL.
    //   It returns a Promise, so we "await" it.
    //   Once the server responds, "response" holds the result.
    //   At this point the data is still raw (not usable yet).
    // --------------------------------------------------------
    const response = await fetch(url);

    // --------------------------------------------------------
    // STEP 3: Convert response to a usable JavaScript object
    // --------------------------------------------------------
    // HOW response.json() WORKS:
    //   The server sends data as a JSON string, which looks like:
    //   '{"results":{"sunrise":"2026-05-05T00:05:56+00:00",...}}'
    //
    //   response.json() reads that string and converts it into
    //   a real JavaScript object we can access with dot notation:
    //   data.results.sunrise, data.results.sunset, etc.
    //
    //   It is also async, so we "await" it too.
    // --------------------------------------------------------
    const data = await response.json();

    // --------------------------------------------------------
    // Check that the API returned a successful status
    // --------------------------------------------------------
    // The API sets data.status = "OK" when everything worked.
    // If it is anything else, we throw an error to trigger
    // the catch block below.
    // --------------------------------------------------------
    if (data.status !== 'OK') {
      throw new Error('API returned non-OK status: ' + data.status);
    }

    // --------------------------------------------------------
    // STEP 3: Extract sunrise and sunset from the response
    // --------------------------------------------------------
    // The API response shape looks like:
    // {
    //   status: "OK",
    //   results: {
    //     sunrise: "2026-05-05T00:05:56+00:00",   ← UTC time
    //     sunset:  "2026-05-05T13:29:50+00:00",   ← UTC time
    //     ...other fields we don't need...
    //   }
    // }
    //
    // We reach into data.results to get the two fields we need,
    // then pass them to our helper to convert to local time.
    // --------------------------------------------------------
    const sunriseLocal = formatUTCtoLocalTime(data.results.sunrise);
    const sunsetLocal  = formatUTCtoLocalTime(data.results.sunset);

    // --------------------------------------------------------
    // STEP 4: Combine real API data + placeholder tithi/festival
    // --------------------------------------------------------
    const { tithi, festival } = getDummyTithiAndFestival(day);

    // Return the final object to CalendarScreen
    return {
      tithi,
      festival,
      sunrise: sunriseLocal,  // e.g. "5:35 AM"
      sunset:  sunsetLocal,   // e.g. "7:01 PM"
    };

  } catch (error) {

    // --------------------------------------------------------
    // STEP 5: Fallback data if API call fails
    // --------------------------------------------------------
    // Reasons this could trigger:
    //   - No internet connection on the device
    //   - The API server is temporarily down
    //   - Invalid latitude/longitude values
    //   - Any unexpected error in the code above
    //
    // Instead of crashing, we return safe placeholder values
    // so the app still works and shows something to the user.
    // --------------------------------------------------------
    console.warn('panchangService: API call failed, using fallback.', error.message);

    const { tithi, festival } = getDummyTithiAndFestival(day);

    return {
      tithi,
      festival,
      sunrise: 'Unavailable',  // shown when API fails
      sunset:  'Unavailable',
    };
  }
}


// ------------------------------------------------------------
// Export
// ------------------------------------------------------------
// CalendarScreen imports this with:
//   import { getPanchangFromAPI } from '../services/panchangService';
// ------------------------------------------------------------
export { getPanchangFromAPI };
