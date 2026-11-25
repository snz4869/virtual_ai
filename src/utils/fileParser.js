export const INLINE_GEMINI_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
];

export const OFFICE_DOC_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export const ALLOWED_FILE_TYPES = [
  ...INLINE_GEMINI_MIME_TYPES,
  ...OFFICE_DOC_MIME_TYPES,
];

const MAX_EXTRACTED_CHARS = 60000;

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const base64 = result.includes(',') ? result.split(',')[1] : '';
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Gagal membaca file sebagai Base64.'));
  });
}

async function inflateRawBytes(bytes) {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('Browser tidak mendukung dekompresi DOCX/XLSX (DecompressionStream).');
  }
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  const buffer = await new Response(stream).arrayBuffer();
  return new Uint8Array(buffer);
}

/**
 * Minimal ZIP reader untuk mengekstrak entry XML dari file .docx / .xlsx tanpa dependency eksternal.
 */
async function readZipEntries(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  const view = new DataView(arrayBuffer);
  const decoder = new TextDecoder('utf-8');

  // Cari End of Central Directory (EOCD) signature: 0x06054b50
  const minOffset = Math.max(0, bytes.length - 65557);
  let eocdOffset = -1;
  for (let i = bytes.length - 22; i >= minOffset; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset === -1) {
    throw new Error('Format file arsip DOCX/XLSX tidak valid.');
  }

  const totalEntries = view.getUint16(eocdOffset + 10, true);
  const cdOffset = view.getUint32(eocdOffset + 16, true);
  const entries = new Map();

  let ptr = cdOffset;
  for (let i = 0; i < totalEntries; i++) {
    if (ptr + 46 > bytes.length || view.getUint32(ptr, true) !== 0x02014b50) break;

    const compressionMethod = view.getUint16(ptr + 10, true);
    const compressedSize = view.getUint32(ptr + 20, true);
    const nameLen = view.getUint16(ptr + 28, true);
    const extraLen = view.getUint16(ptr + 30, true);
    const commentLen = view.getUint16(ptr + 32, true);
    const localHeaderOffset = view.getUint32(ptr + 42, true);

    const fileName = decoder.decode(bytes.subarray(ptr + 46, ptr + 46 + nameLen));
    ptr += 46 + nameLen + extraLen + commentLen;

    if (localHeaderOffset + 30 > bytes.length || view.getUint32(localHeaderOffset, true) !== 0x04034b50) {
      continue;
    }

    const localNameLen = view.getUint16(localHeaderOffset + 26, true);
    const localExtraLen = view.getUint16(localHeaderOffset + 28, true);
    const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen;
    const compressedSlice = bytes.subarray(dataStart, dataStart + compressedSize);

    entries.set(fileName, { compressionMethod, compressedSlice });
  }

  return {
    async readText(name) {
      const entry = entries.get(name);
      if (!entry) return null;
      let rawBytes;
      if (entry.compressionMethod === 0) {
        rawBytes = entry.compressedSlice;
      } else if (entry.compressionMethod === 8) {
        rawBytes = await inflateRawBytes(entry.compressedSlice);
      } else {
        throw new Error(`Metode kompresi ZIP tidak didukung (${entry.compressionMethod}).`);
      }
      return decoder.decode(rawBytes);
    },
    listNames() {
      return Array.from(entries.keys());
    },
  };
}

function parseXml(xmlText) {
  return new DOMParser().parseFromString(xmlText, 'application/xml');
}

async function extractDocxText(arrayBuffer) {
  const zip = await readZipEntries(arrayBuffer);
  const docXml = await zip.readText('word/document.xml');
  if (!docXml) throw new Error('Konten word/document.xml tidak ditemukan di file DOCX.');

  const doc = parseXml(docXml);
  const paragraphs = Array.from(doc.getElementsByTagNameNS('*', 'p'));
  const lines = [];

  for (const p of paragraphs) {
    const textNodes = Array.from(p.getElementsByTagNameNS('*', 't'));
    const line = textNodes.map((n) => n.textContent || '').join('').trim();
    if (line) lines.push(line);
  }

  const text = lines.join('\n').trim();
  if (!text) throw new Error('File DOCX tidak mengandung teks yang dapat diekstrak.');
  return text.slice(0, MAX_EXTRACTED_CHARS);
}

async function extractXlsxText(arrayBuffer) {
  const zip = await readZipEntries(arrayBuffer);

  const sharedStrings = [];
  const ssXml = await zip.readText('xl/sharedStrings.xml');
  if (ssXml) {
    const ssDoc = parseXml(ssXml);
    const siNodes = Array.from(ssDoc.getElementsByTagNameNS('*', 'si'));
    for (const si of siNodes) {
      const tNodes = Array.from(si.getElementsByTagNameNS('*', 't'));
      sharedStrings.push(tNodes.map((t) => t.textContent || '').join(''));
    }
  }

  const sheetNames = zip
    .listNames()
    .filter((name) => /^xl\/worksheets\/sheet\d+\.xml$/i.test(name))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  if (sheetNames.length === 0) {
    throw new Error('Worksheet tidak ditemukan di file XLSX.');
  }

  const sections = [];
  for (let sIdx = 0; sIdx < sheetNames.length; sIdx++) {
    const sheetXml = await zip.readText(sheetNames[sIdx]);
    if (!sheetXml) continue;

    const sheetDoc = parseXml(sheetXml);
    const rowNodes = Array.from(sheetDoc.getElementsByTagNameNS('*', 'row'));
    const rows = [];

    for (const row of rowNodes) {
      const cells = Array.from(row.getElementsByTagNameNS('*', 'c'));
      const values = cells.map((cell) => {
        const cellType = cell.getAttribute('t');
        if (cellType === 'inlineStr') {
          return Array.from(cell.getElementsByTagNameNS('*', 't'))
            .map((t) => t.textContent || '')
            .join('')
            .trim();
        }
        const vNode = cell.getElementsByTagNameNS('*', 'v')[0];
        if (!vNode) return '';
        const raw = vNode.textContent || '';
        if (cellType === 's') {
          const idx = Number.parseInt(raw, 10);
          return Number.isNaN(idx) ? raw : sharedStrings[idx] ?? '';
        }
        return raw;
      });

      if (values.some((v) => v !== '')) {
        rows.push(values.join(' | '));
      }
    }

    if (rows.length > 0) {
      sections.push(`--- Sheet ${sIdx + 1} ---\n${rows.join('\n')}`);
    }
  }

  const text = sections.join('\n\n').trim();
  if (!text) throw new Error('File XLSX tidak mengandung data sel yang dapat diekstrak.');
  return text.slice(0, MAX_EXTRACTED_CHARS);
}

/**
 * Siapkan payload lampiran file untuk dikirim ke AI.
 * - PDF & gambar: dikirim sebagai inlineData Base64 (didukung native oleh Gemini).
 * - DOCX & XLSX: diekstrak teksnya agar dapat dibaca baik oleh Gemini maupun DeepSeek.
 */
export async function prepareFilePayload(file) {
  if (!file) return null;

  if (INLINE_GEMINI_MIME_TYPES.includes(file.type)) {
    const base64 = await fileToBase64(file);
    return {
      base64,
      mimeType: file.type,
      fileName: file.name,
      extractedText: '',
    };
  }

  if (file.type === OFFICE_DOC_MIME_TYPES[0]) {
    const buffer = await file.arrayBuffer();
    const extractedText = await extractDocxText(buffer);
    return {
      base64: null,
      mimeType: file.type,
      fileName: file.name,
      extractedText,
    };
  }

  if (file.type === OFFICE_DOC_MIME_TYPES[1]) {
    const buffer = await file.arrayBuffer();
    const extractedText = await extractXlsxText(buffer);
    return {
      base64: null,
      mimeType: file.type,
      fileName: file.name,
      extractedText,
    };
  }

  throw new Error('Tipe file tidak didukung.');
}
