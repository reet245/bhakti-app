const test = require('node:test');
const assert = require('node:assert/strict');
const zlib = require('node:zlib');
const { optimizePng } = require('../scripts/optimize-web-png.cjs');

function chunk(type, data) {
  const buffer = Buffer.alloc(data.length + 12);
  buffer.writeUInt32BE(data.length); buffer.write(type, 4); data.copy(buffer, 8);
  let crc = 0xffffffff;
  for (const byte of buffer.subarray(4, -4)) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  buffer.writeUInt32BE((crc ^ 0xffffffff) >>> 0, buffer.length - 4);
  return buffer;
}
function readChunks(buffer) {
  const result = [];
  for (let offset = 8; offset < buffer.length;) {
    const length = buffer.readUInt32BE(offset);
    result.push({ type: buffer.toString('ascii', offset + 4, offset + 8), data: buffer.subarray(offset + 8, offset + 8 + length), bytes: buffer.subarray(offset, offset + 12 + length) });
    offset += length + 12;
  }
  return result;
}

test('PNG recompression preserves filtered scanlines, metadata chunks and CRCs exactly', () => {
  const header = Buffer.alloc(13); header.writeUInt32BE(128); header.writeUInt32BE(128, 4); header[8] = 8; header[9] = 6;
  const scanlines = Buffer.alloc(128 * (128 * 4 + 1));
  for (let row = 0; row < 128; row++) { scanlines[row * 513] = 0; scanlines.fill(127, row * 513 + 1, (row + 1) * 513); }
  const image = zlib.deflateSync(scanlines, { level: 0 });
  const original = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('tEXt', Buffer.from('Author\0Bhakti fixture')), chunk('IDAT', image.subarray(0, 100)), chunk('IDAT', image.subarray(100)), chunk('tEXt', Buffer.from('Description\0Preserve me')), chunk('IEND', Buffer.alloc(0))]);
  const optimized = optimizePng(original);
  assert.ok(optimized.length < original.length);
  const before = readChunks(original); const after = readChunks(optimized);
  assert.deepEqual(after.filter((item) => item.type !== 'IDAT').map((item) => item.bytes), before.filter((item) => item.type !== 'IDAT').map((item) => item.bytes));
  assert.deepEqual(zlib.inflateSync(Buffer.concat(after.filter((item) => item.type === 'IDAT').map((item) => item.data))), scanlines);
  // A second parse validates all newly written chunk CRCs and never grows the file.
  assert.equal(optimizePng(optimized), optimized);
});
