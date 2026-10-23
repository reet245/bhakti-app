function createJsonClient({ baseUrl, configurationError, fetchImpl = (...args) => fetch(...args) }) {
  return async function requestJson(path, { timeoutMs = 45000, signal, ...options } = {}) {
    if (configurationError || !baseUrl) throw new Error(configurationError || 'The backend has not been configured.');
    if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) throw new Error('Invalid API route.');
    if (signal?.aborted) throw Object.assign(new Error('Request cancelled.'), { name: 'AbortError' });
    const controller = new AbortController();
    let timedOut = false;
    const abort = () => controller.abort();
    if (signal?.aborted) abort();
    else signal?.addEventListener('abort', abort, { once: true });
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
    try {
      const response = await fetchImpl(`${baseUrl}${path}`, { ...options, signal: controller.signal, headers: { Accept: 'application/json', ...options.headers } });
      let result;
      try { result = await response.json(); } catch {
        if (controller.signal.aborted) throw Object.assign(new Error('Request cancelled.'), { name: 'AbortError' });
        throw new Error('The service returned an invalid response. Please try again.');
      }
      if (!response.ok || result?.success === false) {
        const error = new Error(typeof result?.message === 'string' ? result.message : 'The request could not be completed. Please try again.');
        error.status = response.status;
        throw error;
      }
      return result;
    } catch (error) {
      if (timedOut) throw new Error('The request took too long. Please try again.');
      if (signal?.aborted) throw Object.assign(new Error('Request cancelled.'), { name: 'AbortError' });
      if (error instanceof TypeError) throw new Error('Could not connect to the service. Check your connection and try again.');
      throw error;
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
    }
  };
}
module.exports = { createJsonClient };
