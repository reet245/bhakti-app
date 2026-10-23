const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const MAX_BYTES = 128 * 1024 * 1024;
const CRC_TABLE = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit++) value = (value >>> 1) ^ (value & 1 ? 0xedb88320 : 0);
  return value >>> 0;
});
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 255] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
function idatChunk(data) {
  const result = Buffer.allocUnsafe(data.length + 12);
  result.writeUInt32BE(data.length, 0);
  result.write('IDAT', 4, 'ascii');
  data.copy(result, 8);
  result.writeUInt32BE(crc32(result.subarray(4, result.length - 4)), result.length - 4);
  return result;
}

// Recompress only the existing filtered scanlines: no pixel/filter/palette changes.
function optimizePng(input) {
  if (input.length > MAX_BYTES || !input.subarray(0, 8).equals(SIGNATURE)) throw new Error('Unsupported PNG size or signature.');
  const chunks = [];
  let offset = 8;
  let endedIdat = false;
  let seenIdat = false;
  let seenEnd = false;
  while (offset < input.length) {
    if (offset + 12 > input.length) throw new Error('Truncated PNG chunk.');
    const length = input.readUInt32BE(offset);
    const end = offset + length + 12;
    if (end > input.length) throw new Error('Truncated PNG data.');
    const type = input.toString('ascii', offset + 4, offset + 8);
    if (crc32(input.subarray(offset + 4, end - 4)) !== input.readUInt32BE(end - 4)) throw new Error('Invalid PNG CRC.');
    if (!chunks.length && (type !== 'IHDR' || length !== 13)) throw new Error('Invalid PNG header.');
    if (type === 'IDAT') {
      if (endedIdat) throw new Error('Noncontiguous PNG image data.');
      seenIdat = true;
    } else if (seenIdat) endedIdat = true;
    chunks.push({ type, bytes: input.subarray(offset, end), data: input.subarray(offset + 8, end - 4) });
    offset = end;
    if (type === 'IEND') { seenEnd = length === 0 && offset === input.length; break; }
  }
  if (!seenIdat || !seenEnd) throw new Error('Incomplete PNG.');
  const original = zlib.inflateSync(Buffer.concat(chunks.filter((chunk) => chunk.type === 'IDAT').map((chunk) => chunk.data)), { maxOutputLength: MAX_BYTES });
  const compressed = zlib.deflateSync(original, { level: 9 });
  const verified = zlib.inflateSync(compressed, { maxOutputLength: MAX_BYTES });
  if (!verified.equals(original)) throw new Error('PNG lossless verification failed.');
  let inserted = false;
  const output = Buffer.concat([SIGNATURE, ...chunks.flatMap((chunk) => {
    if (chunk.type !== 'IDAT') return [chunk.bytes];
    if (inserted) return [];
    inserted = true;
    return [idatChunk(compressed)];
  })]);
  return output.length < input.length ? output : input;
}

function optimizeDirectory(root, { maxDurationMs = 90000 } = {}) {
  const directory = fs.realpathSync(root);
  // Require the export shell and bundle directory; reject a source media folder.
  if (!fs.statSync(path.join(directory, 'index.html')).isFile() || !fs.statSync(path.join(directory, '_expo')).isDirectory()) throw new Error('Expected an exported Expo web directory.');
  const startedAt = Date.now();
  const result = { scanned: 0, optimized: 0, skipped: 0, bytesBefore: 0, bytesSaved: 0, timeLimited: false };
  const pending = [directory];
  while (pending.length) {
    const current = pending.pop();
    for (const item of fs.readdirSync(current, { withFileTypes: true })) {
      if (Date.now() - startedAt > maxDurationMs) { result.timeLimited = true; return result; }
      const filename = path.join(current, item.name);
      if (item.isSymbolicLink()) continue;
      if (item.isDirectory()) { pending.push(filename); continue; }
      if (!item.isFile() || !/\.png$/i.test(item.name)) continue;
      result.scanned += 1;
      const stat = fs.statSync(filename);
      result.bytesBefore += stat.size;
      if (stat.size > MAX_BYTES) { result.skipped += 1; continue; }
      let temporary;
      try {
        const original = fs.readFileSync(filename);
        const optimized = optimizePng(original);
        if (optimized === original) continue;
        temporary = `${filename}.bhakti-png-${process.pid}.tmp`;
        fs.writeFileSync(temporary, optimized, { flag: 'wx', mode: stat.mode });
        fs.renameSync(temporary, filename);
        temporary = null;
        result.optimized += 1;
        result.bytesSaved += original.length - optimized.length;
      } catch { result.skipped += 1; }
      finally { if (temporary) { try { fs.unlinkSync(temporary); } catch {} } }
    }
  }
  return result;
}

module.exports = { optimizePng, optimizeDirectory };
if (require.main === module) {
  try { console.log(JSON.stringify(optimizeDirectory(process.argv[2]), null, 2)); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
