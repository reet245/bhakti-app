import { API_BASE_URL, API_CONFIGURATION_ERROR } from '../config/api';
import jsonClient from '../utils/jsonClient.cjs';

export const requestJson = jsonClient.createJsonClient({ baseUrl: API_BASE_URL, configurationError: API_CONFIGURATION_ERROR });
