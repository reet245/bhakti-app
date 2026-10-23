import Constants from 'expo-constants';
import { Platform } from 'react-native';
import apiPolicy from '../utils/apiPolicy.cjs';

const BACKEND_PORT = 8080;
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

function isDev() {
  return typeof __DEV__ !== 'undefined' && __DEV__ === true;
}

function trimTrailingSlash(value) {
  return typeof value === 'string' ? value.trim().replace(/\/+$/, '') : '';
}

function getEnvApiBaseUrl() {
  return typeof process !== 'undefined'
    ? trimTrailingSlash(process.env.EXPO_PUBLIC_API_BASE_URL)
    : '';
}

function getHostName(value) {
  if (!value || typeof value !== 'string') {
    return '';
  }

  const cleanValue = value.trim();
  const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(cleanValue)
    ? cleanValue
    : `http://${cleanValue}`;

  try {
    return new URL(withProtocol).hostname;
  } catch {
    return cleanValue.split(':')[0];
  }
}

function getExpoHostName() {
  const hostCandidates = [
    Constants.expoConfig?.hostUri,
    Constants.expoGoConfig?.debuggerHost,
    Constants.manifest2?.extra?.expoClient?.hostUri,
    Constants.manifest?.debuggerHost,
    Constants.linkingUri,
    Constants.experienceUrl,
  ];

  const hostName = hostCandidates.map(getHostName).find(Boolean);

  if (!hostName || LOCAL_HOSTS.has(hostName)) {
    return '';
  }

  return hostName;
}

function getWebHostName() {
  if (typeof window === 'undefined') {
    return '';
  }

  const hostName = window.location?.hostname;
  if (!hostName || LOCAL_HOSTS.has(hostName)) {
    return '';
  }

  return hostName;
}

function resolveApiBaseUrl() {
  const envApiBaseUrl = getEnvApiBaseUrl();
  if (envApiBaseUrl) {
    try {
      return { url: apiPolicy.validateApiUrl(envApiBaseUrl, { production: !isDev() }), source: 'EXPO_PUBLIC_API_BASE_URL', error: null };
    } catch (error) {
      return { url: '', source: 'Invalid configuration', error: error.message };
    }
  }

  if (!isDev()) return { url: '', source: 'Missing configuration', error: 'The Bhakti backend has not been configured. Please contact the app owner.' };
  return inferApiBaseUrl();
}

function inferApiBaseUrl() {
  const expoHostName = getExpoHostName();
  if (expoHostName) {
    return {
      url: `http://${expoHostName}:${BACKEND_PORT}`,
      source: 'Expo host',
    };
  }

  const webHostName = getWebHostName();
  if (webHostName) {
    return {
      url: `http://${webHostName}:${BACKEND_PORT}`,
      source: 'Web host',
    };
  }

  if (Platform.OS === 'android') {
    return {
      url: `http://10.0.2.2:${BACKEND_PORT}`,
      source: 'Android emulator fallback',
    };
  }

  return {
    url: `http://localhost:${BACKEND_PORT}`,
    source: 'localhost fallback',
  };
}

const resolvedApiBaseUrl = resolveApiBaseUrl();

export const API_BASE_URL = resolvedApiBaseUrl.url;
export const API_BASE_URL_SOURCE = resolvedApiBaseUrl.source;
export const API_CONFIGURATION_ERROR = resolvedApiBaseUrl.error || null;

if (isDev()) {
  console.log('[Bhakti API] API_BASE_URL', API_BASE_URL);
  console.log('[Bhakti API] API_BASE_URL source', API_BASE_URL_SOURCE);
}
