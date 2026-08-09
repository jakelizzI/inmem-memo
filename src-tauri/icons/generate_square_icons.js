import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceIconPath = path.resolve(__dirname, '../../src/assets/icon.png');
const iconsDir = __dirname;
const publicDir = path.resolve(__dirname, '../../public');

// Simple PNG decoder
function decodePNG(buffer) {
  let offset = 8; // skip signature
  let width = 0;
  let height = 0;
  let bitDepth = 8;
  let colorType = 6; // RGBA
  const idatChunks = [];

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const data = buffer.slice(offset + 8, offset + 8 + length);
    offset += 12 + length;

    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === 'IDAT') {
      idatChunks.push(data);
    } else if (type === 'IEND') {
      break;
    }
  }

  const compressed = Buffer.concat(idatChunks);
  const decompressed = zlib.inflateSync(compressed);

  // Unfilter PNG scanlines (support standard filter types 0-4)
  const bytesPerPixel = colorType === 6 ? 4 : colorType === 2 ? 3 : 4;
  const stride = width * bytesPerPixel;
  const rawData = Buffer.alloc(width * height * 4); // Always output RGBA

  let srcPos = 0;
  const prevRow = Buffer.alloc(stride);
  const currentRow = Buffer.alloc(stride);

  for (let y = 0; y < height; y++) {
    const filterType = decompressed[srcPos++];
    for (let x = 0; x < stride; x++) {
      let val = decompressed[srcPos++];
      const a = x >= bytesPerPixel ? currentRow[x - bytesPerPixel] : 0;
      const b = prevRow[x];
      const c = x >= bytesPerPixel ? prevRow[x - bytesPerPixel] : 0;

      if (filterType === 1) { // Sub
        val = (val + a) & 0xff;
      } else if (filterType === 2) { // Up
        val = (val + b) & 0xff;
      } else if (filterType === 3) { // Average
        val = (val + Math.floor((a + b) / 2)) & 0xff;
      } else if (filterType === 4) { // Paeth
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        const pr = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
        val = (val + pr) & 0xff;
      }
      currentRow[x] = val;
    }

    // Copy to rawData (convert RGB to RGBA if needed)
    for (let x = 0; x < width; x++) {
      const dstIdx = (y * width + x) * 4;
      if (bytesPerPixel === 4) {
        rawData[dstIdx] = currentRow[x * 4];
        rawData[dstIdx + 1] = currentRow[x * 4 + 1];
        rawData[dstIdx + 2] = currentRow[x * 4 + 2];
        rawData[dstIdx + 3] = currentRow[x * 4 + 3];
      } else if (bytesPerPixel === 3) {
        rawData[dstIdx] = currentRow[x * 3];
        rawData[dstIdx + 1] = currentRow[x * 3 + 1];
        rawData[dstIdx + 2] = currentRow[x * 3 + 2];
        rawData[dstIdx + 3] = 255;
      }
    }
    currentRow.copy(prevRow);
  }

  return { width, height, data: rawData };
}

// Resample/Resize RGBA buffer to exact square target size with aspect ratio fit & padding
function createSquareImage(source, targetSize) {
  const targetData = Buffer.alloc(targetSize * targetSize * 4, 0); // Transparent RGBA

  const scale = Math.min(targetSize / source.width, targetSize / source.height);
  const drawWidth = Math.round(source.width * scale);
  const drawHeight = Math.round(source.height * scale);
  const offsetX = Math.floor((targetSize - drawWidth) / 2);
  const offsetY = Math.floor((targetSize - drawHeight) / 2);

  for (let ty = 0; ty < drawHeight; ty++) {
    const sy = Math.min(Math.floor(ty / scale), source.height - 1);
    for (let tx = 0; tx < drawWidth; tx++) {
      const sx = Math.min(Math.floor(tx / scale), source.width - 1);

      const srcIdx = (sy * source.width + sx) * 4;
      const dstIdx = ((offsetY + ty) * targetSize + (offsetX + tx)) * 4;

      targetData[dstIdx] = source.data[srcIdx];
      targetData[dstIdx + 1] = source.data[srcIdx + 1];
      targetData[dstIdx + 2] = source.data[srcIdx + 2];
      targetData[dstIdx + 3] = source.data[srcIdx + 3];
    }
  }

  return { width: targetSize, height: targetSize, data: targetData };
}

// Simple standard CRC32 implementation
function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// Encode RGBA buffer into a fully valid PNG
function encodePNG(image) {
  const { width, height, data } = image;
  const stride = width * 4;
  const rawScanlines = Buffer.alloc(height * (stride + 1));

  let pos = 0;
  for (let y = 0; y < height; y++) {
    rawScanlines[pos++] = 0; // Filter 0 (None)
    data.copy(rawScanlines, pos, y * stride, (y + 1) * stride);
    pos += stride;
  }

  const idatData = zlib.deflateSync(rawScanlines);

  // PNG Signature
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR Chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth
  ihdrData[9] = 6; // Color type 6 = RGBA
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace

  const ihdrChunk = createChunk('IHDR', ihdrData);
  const idatChunk = createChunk('IDAT', idatData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);

  chunk.writeUInt32BE(len, 0);
  typeBuf.copy(chunk, 4);
  data.copy(chunk, 8);

  const crcData = Buffer.concat([typeBuf, data]);
  chunk.writeUInt32BE(crc32(crcData), 8 + len);
  return chunk;
}

// Create multi-size ICO file
function createICO(images) {
  // images: array of { size, pngBuffer }
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // ICO Type
  header.writeUInt16LE(images.length, 4); // Image Count

  let offset = 6 + images.length * 16;
  const dirEntries = [];
  const payloads = [];

  for (const img of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.size >= 256 ? 0 : img.size, 0); // Width
    entry.writeUInt8(img.size >= 256 ? 0 : img.size, 1); // Height
    entry.writeUInt8(0, 2); // Color count
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Planes
    entry.writeUInt16LE(32, 6); // Bit depth
    entry.writeUInt32LE(img.pngBuffer.length, 8); // Size in bytes
    entry.writeUInt32LE(offset, 12); // Offset
    dirEntries.push(entry);
    payloads.push(img.pngBuffer);
    offset += img.pngBuffer.length;
  }

  return Buffer.concat([header, ...dirEntries, ...payloads]);
}

// Main Process
console.log('Reading source image from:', sourceIconPath);
const srcBuf = fs.readFileSync(sourceIconPath);
const decoded = decodePNG(srcBuf);
console.log(`Decoded source image: ${decoded.width}x${decoded.height}`);

const sizes = [32, 128, 256, 512];
const generatedPngs = {};

for (const s of sizes) {
  const squareImg = createSquareImage(decoded, s);
  const png = encodePNG(squareImg);
  generatedPngs[s] = png;
  console.log(`Generated exact square PNG: ${s}x${s} (${png.length} bytes)`);
}

// Write Tauri icons (Strictly Square)
fs.writeFileSync(path.join(iconsDir, '32x32.png'), generatedPngs[32]);
fs.writeFileSync(path.join(iconsDir, '128x128.png'), generatedPngs[128]);
fs.writeFileSync(path.join(iconsDir, '128x128@2x.png'), generatedPngs[256]);
fs.writeFileSync(path.join(iconsDir, 'icon.icns'), generatedPngs[512]);

// Write 512x512 for Linux AppImage / Debian
fs.writeFileSync(path.join(iconsDir, '512x512.png'), generatedPngs[512]);

// Write Multi-size ICO
const icoBuf = createICO([
  { size: 32, pngBuffer: generatedPngs[32] },
  { size: 128, pngBuffer: generatedPngs[128] },
  { size: 256, pngBuffer: generatedPngs[256] }
]);
fs.writeFileSync(path.join(iconsDir, 'icon.ico'), icoBuf);

// Write Web assets
fs.writeFileSync(path.join(publicDir, 'imm_icon.png'), generatedPngs[512]);
fs.writeFileSync(path.join(publicDir, 'favicon.png'), generatedPngs[32]);
fs.writeFileSync(sourceIconPath, generatedPngs[512]); // Update src/assets/icon.png to be perfect square

console.log('All square icons successfully generated and saved!');
