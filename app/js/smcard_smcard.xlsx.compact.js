var IC_CRC = (function () {
var t = [], c, n, k;
for (n = 0; n < 256; n++) { c = n; for (k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c >>> 0; }
return t;
})();
function icCrc32(u8) {
var c = 0xFFFFFFFF;
for (var i = 0; i < u8.length; i++) c = IC_CRC[(c ^ u8[i]) & 0xFF] ^ (c >>> 8);
return (c ^ 0xFFFFFFFF) >>> 0;
}
function icZipStore(files) {
var enc = new TextEncoder(), parts = [], cd = [], off = 0;
function u16(v) { return [v & 255, (v >> 8) & 255]; }
function u32(v) { return [v & 255, (v >> 8) & 255, (v >> 16) & 255, (v >>> 24) & 255]; }
files.forEach(function (f) {
var name = enc.encode(f.n), data = enc.encode(f.d), crc = icCrc32(data);
var hdr = [].concat([0x50, 0x4B, 3, 4], u16(20), u16(0x0800), u16(0), u16(0), u16(0x21),
u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0));
parts.push(new Uint8Array(hdr), name, data);
cd.push([[].concat([0x50, 0x4B, 1, 2], u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21),
u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), u16(0), u16(0), u16(0),
u32(0), u32(off)), name]);
off += hdr.length + name.length + data.length;
});
var cdStart = off, cdLen = 0;
cd.forEach(function (e) { parts.push(new Uint8Array(e[0]), e[1]); cdLen += e[0].length + e[1].length; });
parts.push(new Uint8Array([].concat([0x50, 0x4B, 5, 6], u16(0), u16(0), u16(files.length), u16(files.length),
u32(cdLen), u32(cdStart), u16(0))));
return new Blob(parts, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
window.icXmlEsc = function (s) {
return String(s === null || s === undefined ? '' : s).replace(/[&<>"]/g, function (m) {
return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m];
}).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
};
window.icColRef = function (i) {
var s = '';
i++;
while (i > 0) { var m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); }
return s;
};
window.icXlsxBlob = function (sheetName, sheet) {
var styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
'<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
'<numFmts count="4"><numFmt numFmtId="164" formatCode="#,##0.0"/><numFmt numFmtId="165" formatCode="#,##0.###"/><numFmt numFmtId="166" formatCode="#,##0.00"/><numFmt numFmtId="167" formatCode="#,##0"/></numFmts>' +
'<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>' +
'<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>' +
'<fill><patternFill patternType="solid"><fgColor rgb="FFE8EAF6"/></patternFill></fill></fills>' +
'<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
'<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
'<cellXfs count="9">' +
'<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
'<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>' +
'<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
'<xf numFmtId="49" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
'<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
'<xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
'<xf numFmtId="166" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
'<xf numFmtId="1" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
'<xf numFmtId="167" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
'</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
var files = [
{ n: '[Content_Types].xml', d: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
'<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
'<Default Extension="xml" ContentType="application/xml"/>' +
'<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
'<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
'<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
'</Types>' },
{ n: '_rels/.rels', d: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
'</Relationships>' },
{ n: 'xl/workbook.xml', d: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
'<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
'<sheets><sheet name="' + icXmlEsc(sheetName) + '" sheetId="1" r:id="rId1"/></sheets></workbook>' },
{ n: 'xl/_rels/workbook.xml.rels', d: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
'<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
'</Relationships>' },
{ n: 'xl/worksheets/sheet1.xml', d: sheet },
{ n: 'xl/styles.xml', d: styles }
];
return icZipStore(files);
};
window.smExcel = function (S) {
function colRef(i) { return window.icColRef(i); }
function cs(ref, v, st) { return '<c r="' + ref + '" t="inlineStr" s="' + st + '"><is><t xml:space="preserve">' + window.icXmlEsc(v) + '</t></is></c>'; }
function cn(ref, v, st) { v = Math.round(v * 10000) / 10000; return '<c r="' + ref + '" s="' + st + '"><v>' + v + '</v></c>'; }
function xrow(r, cells) {
var s = '<row r="' + r + '">';
cells.forEach(function (c, i) {
if (c[0] === null || c[0] === undefined || c[0] === '') return;
s += c[1] >= 5 ? cn(colRef(i) + r, +c[0], c[1]) : cs(colRef(i) + r, c[0], c[1]);
});
return s + '</row>';
}
var x = xrow(1, [[S.title, 4]]) + xrow(2, S.head.map(function (hd) { return [hd, 1]; })), r = 2, nc = S.head.length, w = '<cols>';
S.rows.forEach(function (row) { r++; x += xrow(r, row); });
for (var i = 0; i < nc; i++) {
var lab = S.head[i], wd = i === 0 ? 6 : (lab === 'CUSTOMER' || lab === 'NAME' ? 40 : (lab === 'NOW WITH' || lab === 'FROM' || lab === 'TO' ? 26 : 14));
w += '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + wd + '" customWidth="1"/>';
}
w += '</cols>';
var sheet = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
'<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
'<sheetViews><sheetView workbookViewId="0"><pane ySplit="2" topLeftCell="A3" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' +
'<sheetFormatPr defaultRowHeight="15"/>' + w + '<sheetData>' + x + '</sheetData>' +
'<autoFilter ref="A2:' + colRef(nc - 1) + r + '"/></worksheet>';
var blob = window.icXlsxBlob(S.sheet, sheet), a = document.createElement('a');
a.href = URL.createObjectURL(blob); a.download = S.name;
document.body.appendChild(a); a.click();
setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
};
window.addEventListener('beforeprint', function () {
var T = window.jmT || function (s) { return s; }, wrap = document.querySelector('.wrap'), pf = document.getElementById('printFilters'),
h1 = document.querySelector('.dash-header h1'), tt = document.getElementById('tableTitleText'),
table = document.body.className.indexOf('print-mode-table') !== -1, d = new Date(), box,
p = function (n) { return (n < 10 ? '0' : '') + n; };
if (!wrap) { return; }
box = document.getElementById('jmPrintHead');
if (!box) { box = document.createElement('div'); box.id = 'jmPrintHead'; wrap.insertBefore(box, wrap.firstChild); }
box.innerHTML = '<div class="ph-top"><b class="ph-co"></b><span class="ph-at"></span></div><div class="ph-title"></div><div class="ph-meta">' + (pf ? pf.innerHTML : '') + '</div>';
box.querySelector('.ph-co').textContent = T('Co. Dashboard');
box.querySelector('.ph-at').textContent = T('Printed ' + p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()));
box.querySelector('.ph-title').textContent = table ? (tt ? tt.textContent : '') : (h1 ? h1.textContent : '');
box = document.getElementById('jmPageCss');
if (!box) { box = document.createElement('style'); box.id = 'jmPageCss'; }
document.body.appendChild(box);
box.textContent = document.body.className.indexOf('sd-print') !== -1 ? '' : '@media print{@page{@top-right{content:none}@bottom-right{content:'
+ (window.JM_LANG === 'AR' ? '"\\0635 \\0641 \\062D \\0629  " counter(page) " \\0645 \\0646  " counter(pages)' : '"Page " counter(page) " of " counter(pages)')
+ ';font:8px sans-serif;color:#555}}}';
smFitSheet(box, table);
}, false);
function smFitSheet(box, table) {
var rows = document.querySelectorAll('#printTablePanel tr').length - 1, k = (700 - 95 - (table ? 0 : 260)) / Math.max(rows, 1) / 16.4;
if (!box.textContent || k >= 1 || k < 0.72) { return; }
box.textContent += '@media print{#printTablePanel table,#printTablePanel td.num,#printTablePanel th.num{font-size:' + (8.5 * k).toFixed(1) + 'px !important}'
+ '#printTablePanel th,#printTablePanel td{padding:' + (1.5 * k).toFixed(1) + 'px 4px !important;line-height:1.1 !important}}';
}
