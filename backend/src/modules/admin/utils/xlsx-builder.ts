/**
 * Zero-dependency XLSX builder.
 *
 * Produces a valid OOXML .xlsx workbook using only Node.js built-ins:
 *  - `zlib.deflateRawSync`  for ZIP entry compression
 *  - Buffer manipulation    for ZIP binary framing
 *
 * No external packages needed.
 */
import { deflateRawSync } from 'zlib';

// ─────────────────────────────────────────────────────────────────────────────
// CRC-32 (required by ZIP spec for each entry)
// ─────────────────────────────────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (~c) >>> 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// Minimal ZIP builder (method 8 = deflate)
// ─────────────────────────────────────────────────────────────────────────────
interface ZipFile {
  name: string;
  data: Buffer;
}

function buildZip(files: ZipFile[]): Buffer {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  // DOS timestamp (always use a fixed date so output is deterministic)
  const dosTime = 0x0000;
  const dosDate = 0x0000;

  for (const file of files) {
    const nameBuf = Buffer.from(file.name, 'utf8');
    const compressed = deflateRawSync(file.data, { level: 6 });
    const crc = crc32(file.data);
    const uSize = file.data.length;
    const cSize = compressed.length;

    // Local file header (30 bytes) + filename + compressed data
    const local = Buffer.alloc(30 + nameBuf.length);
    local.writeUInt32LE(0x04034b50, 0);  // PK\x03\x04
    local.writeUInt16LE(20, 4);           // version needed: 2.0
    local.writeUInt16LE(0, 6);            // general purpose flags
    local.writeUInt16LE(8, 8);            // compression: deflate
    local.writeUInt16LE(dosTime, 10);
    local.writeUInt16LE(dosDate, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(cSize, 18);
    local.writeUInt32LE(uSize, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);           // extra field length
    nameBuf.copy(local, 30);
    localParts.push(local, compressed);

    // Central directory entry (46 bytes) + filename
    const central = Buffer.alloc(46 + nameBuf.length);
    central.writeUInt32LE(0x02014b50, 0); // PK\x01\x02
    central.writeUInt16LE(20, 4);          // version made by
    central.writeUInt16LE(20, 6);          // version needed
    central.writeUInt16LE(0, 8);           // flags
    central.writeUInt16LE(8, 10);          // compression
    central.writeUInt16LE(dosTime, 12);
    central.writeUInt16LE(dosDate, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(cSize, 20);
    central.writeUInt32LE(uSize, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt16LE(0, 30);          // extra length
    central.writeUInt16LE(0, 32);          // comment length
    central.writeUInt16LE(0, 34);          // disk start
    central.writeUInt16LE(0, 36);          // internal attrs
    central.writeUInt32LE(0, 38);          // external attrs
    central.writeUInt32LE(offset, 42);     // local header offset
    nameBuf.copy(central, 46);
    centralParts.push(central);

    offset += 30 + nameBuf.length + cSize;
  }

  const centralBuf = Buffer.concat(centralParts);

  // End of central directory record (22 bytes)
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);          // PK\x05\x06
  eocd.writeUInt16LE(0, 4);                    // disk number
  eocd.writeUInt16LE(0, 6);                    // start disk
  eocd.writeUInt16LE(files.length, 8);         // entries on disk
  eocd.writeUInt16LE(files.length, 10);        // total entries
  eocd.writeUInt32LE(centralBuf.length, 12);   // central dir size
  eocd.writeUInt32LE(offset, 16);              // central dir offset
  eocd.writeUInt16LE(0, 20);                   // comment length

  return Buffer.concat([...localParts, centralBuf, eocd]);
}

// ─────────────────────────────────────────────────────────────────────────────
// OOXML XML generators
// ─────────────────────────────────────────────────────────────────────────────
function xmlEsc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function contentTypesXml(sheetCount: number): string {
  const overrides = Array.from({ length: sheetCount }, (_, i) =>
    `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
  ).join('\n  ');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  ${overrides}
</Types>`;
}

function packageRelsXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;
}

function workbookXml(names: string[]): string {
  const sheets = names
    .map((n, i) => `<sheet name="${xmlEsc(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
    .join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>${sheets}</sheets>
</workbook>`;
}

function workbookRelsXml(sheetCount: number): string {
  const rels = Array.from({ length: sheetCount }, (_, i) =>
    `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`,
  ).join('\n  ');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${rels}
  <Relationship Id="rId${sheetCount + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;
}

/**
 * Styles:
 *  Index 0 — default
 *  Index 1 — header  (bold, light-grey fill #F3F4F6)
 *  Index 2 — present (green fill #D1FAE5)
 *  Index 3 — absent  (red fill #FEE2E2)
 */
function stylesXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts>
    <font><sz val="11"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><name val="Calibri"/></font>
  </fonts>
  <fills>
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF3F4F6"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFD1FAE5"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFEE2E2"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders>
    <border><left/><right/><top/><bottom/><diagonal/></border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
    <xf numFmtId="0" fontId="0" fillId="3" borderId="0" xfId="0" applyFill="1"/>
    <xf numFmtId="0" fontId="0" fillId="4" borderId="0" xfId="0" applyFill="1"/>
  </cellXfs>
</styleSheet>`;
}

// Column index → letter (A-Z for up to 26 columns)
function col(idx: number): string {
  return String.fromCharCode(65 + idx);
}

function worksheetXml(rows: XlsxRow[]): string {
  const HEADERS = ['Name', 'Email', 'Ticket Token', 'Registered At', 'Checked In At', 'Scanned By', 'Status'];

  const headerCells = HEADERS.map((h, c) =>
    `<c r="${col(c)}1" s="1" t="inlineStr"><is><t>${xmlEsc(h)}</t></is></c>`,
  ).join('');
  const headerRow = `<row r="1">${headerCells}</row>`;

  const dataRows = rows.map((row, ri) => {
    const r = ri + 2;
    const s = row.status === 'PRESENT' ? '2' : '3';
    const vals = [
      row.name ?? '',
      row.email ?? '',
      row.ticketToken ?? '',
      row.registeredAt ? new Date(row.registeredAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '',
      row.checkedInAt ? new Date(row.checkedInAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '',
      row.checkedInBy ?? '',
      row.status,
    ];
    const cells = vals.map((v, c) =>
      `<c r="${col(c)}${r}" s="${s}" t="inlineStr"><is><t>${xmlEsc(v)}</t></is></c>`,
    ).join('');
    return `<row r="${r}">${cells}</row>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    ${headerRow}
    ${dataRows}
  </sheetData>
</worksheet>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public types + entry point
// ─────────────────────────────────────────────────────────────────────────────
export interface XlsxRow {
  name: string;
  email: string;
  ticketToken: string | null;
  registeredAt: Date | string | null;
  checkedInAt: Date | string | null;
  checkedInBy: string | null;
  status: 'PRESENT' | 'ABSENT';
}

export interface XlsxSheet {
  name: string;
  rows: XlsxRow[];
}

/**
 * Build a proper OOXML .xlsx workbook (ZIP archive) in memory.
 * Supports multiple worksheets.
 */
export function buildXlsx(sheets: XlsxSheet[]): Buffer {
  const files: ZipFile[] = [
    { name: '[Content_Types].xml', data: Buffer.from(contentTypesXml(sheets.length), 'utf8') },
    { name: '_rels/.rels',          data: Buffer.from(packageRelsXml(), 'utf8') },
    { name: 'xl/workbook.xml',      data: Buffer.from(workbookXml(sheets.map((s) => s.name)), 'utf8') },
    { name: 'xl/_rels/workbook.xml.rels', data: Buffer.from(workbookRelsXml(sheets.length), 'utf8') },
    { name: 'xl/styles.xml',        data: Buffer.from(stylesXml(), 'utf8') },
    ...sheets.map((s, i) => ({
      name: `xl/worksheets/sheet${i + 1}.xml`,
      data: Buffer.from(worksheetXml(s.rows), 'utf8'),
    })),
  ];
  return buildZip(files);
}
