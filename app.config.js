const { validateApiUrl } = require('./src/utils/apiPolicy.cjs');

module.exports = ({ config }) => {
  // EAS native builds do not invoke build:web, so enforce the same release policy here.
  if (['production', 'preview'].includes(process.env.EAS_BUILD_PROFILE)) {
    validateApiUrl(process.env.EXPO_PUBLIC_API_BASE_URL, { production: true });
  }
  const basePath = process.env.EXPO_PUBLIC_BASE_PATH || '';
  if (basePath && !/^\/[a-zA-Z0-9/_-]+$/.test(basePath)) throw new Error('Invalid EXPO_PUBLIC_BASE_PATH.');
  return { ...config, experiments: { ...config.experiments, ...(basePath ? { baseUrl: basePath.replace(/\/$/, '') } : {}) } };
};
