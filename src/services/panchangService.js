import { requestJson } from './http';
import { DEFAULT_PANCHANG_LOCATION as DEFAULT_LOCATION } from '../features/panchang/constants';
import { validCoordinates, validTimezone } from '../features/panchang/date';
import { mapBackendPanchang, assertBackendPanchangData, buildQuery, getDateISO, getSafeDateParts } from '../features/panchang/model';
export { getFallbackPanchangData, normalizePanchangData, getFestivalItems } from '../features/panchang/model';

const REAL_DATA_ERROR_MESSAGE = 'Panchang data unavailable. Please try again.';

async function getPanchangFromAPI({
  year,
  month,
  day,
  latitude = DEFAULT_LOCATION.latitude,
  longitude = DEFAULT_LOCATION.longitude,
  locationName = DEFAULT_LOCATION.locationName,
  timezone = DEFAULT_LOCATION.timezone,
  ayanamsa = DEFAULT_LOCATION.ayanamsa,
  signal,
}) {
  const dateParts = getSafeDateParts({ year, month, day });
  const dateISO = getDateISO(dateParts.year, dateParts.month, dateParts.day);
  if (!validCoordinates(latitude, longitude) || !validTimezone(timezone)) {
    throw new Error('Select a valid location and IANA timezone before loading Panchang.');
  }
  const query = buildQuery({
    date: dateISO,
    lat: Number(latitude),
    lon: Number(longitude),
    locationName: locationName || DEFAULT_LOCATION.locationName,
    timezone: timezone || DEFAULT_LOCATION.timezone,
    ayanamsa: ayanamsa || DEFAULT_LOCATION.ayanamsa,
  });
  const apiResponse = await requestJson(`/api/v1/panchang/daily?${query}`, { signal });
  if (apiResponse?.success === true && apiResponse.data) {
    assertBackendPanchangData(apiResponse.data);
    return mapBackendPanchang(apiResponse.data, dateParts);
  }
  throw new Error(REAL_DATA_ERROR_MESSAGE);
}


export { getPanchangFromAPI };
