function isPrivateLanHost(hostName) {
  const host = String(hostName || '').toLowerCase().replace(/^\[(.*)\]$/, '$1').replace(/\.+$/, '');
  if (!host || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) return true;

  // URL normalizes abbreviated, hexadecimal, and integer IPv4 literals before this check.
  const ipv4 = host.split('.');
  if (ipv4.length === 4 && ipv4.every((part) => /^\d+$/.test(part))) {
    const [first, second] = ipv4.map(Number);
    return first === 0 || first === 10 || first === 127
      || (first === 169 && second === 254)
      || (first === 172 && second >= 16 && second <= 31)
      || (first === 192 && second === 168);
  }

  if (host === '::' || host === '::1' || /^f[cd][0-9a-f]{2}:/.test(host) || /^fe[89ab][0-9a-f]:/.test(host)) return true;

  // IPv4-mapped IPv6 must follow the same rule as its embedded IPv4 address.
  const mapped = /^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/.exec(host);
  if (mapped) {
    const high = parseInt(mapped[1], 16);
    const low = parseInt(mapped[2], 16);
    return isPrivateLanHost(`${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`);
  }
  return false;
}

function validateApiUrl(value, { production = false } = {}) {
  const text = typeof value === 'string' ? value.trim().replace(/\/+$/, '') : '';
  if (!text) throw new Error('Set EXPO_PUBLIC_API_BASE_URL to the HTTPS address of your Bhakti backend.');
  let url;
  try { url = new URL(text); } catch { throw new Error('The backend URL is invalid.'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error('Use an HTTP(S) backend URL without credentials, query parameters, or fragments.');
  }
  if (production && (url.protocol !== 'https:' || isPrivateLanHost(url.hostname))) {
    throw new Error('Production requires a public HTTPS backend URL.');
  }
  return text;
}
module.exports = { validateApiUrl };
