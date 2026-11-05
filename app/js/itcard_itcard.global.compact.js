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
window.icExcel = function (C) {
function colRef(i) { return window.icColRef(i); }
function cs(ref, v, st) { return '<c r="' + ref + '" t="inlineStr" s="' + st + '"><is><t xml:space="preserve">' + window.icXmlEsc(v) + '</t></is></c>'; }
function cn(ref, v, st) {
if (v === null) return '';
v = Math.round(v * 10000) / 10000; st = st || 5;
if (st === 5 && v === Math.round(v)) st = 8;
return '<c r="' + ref + '" s="' + st + '"><v>' + v + '</v></c>';
}
function xrow(r, cells) {
var s = '<row r="' + r + '">';
cells.forEach(function (c, i) {
if (c[0] === null || c[0] === undefined) return;
s += c[1] >= 5 ? cn(colRef(i) + r, c[0], c[1]) : cs(colRef(i) + r, c[0], c[1]);
});
return s + '</row>';
}
function save(name, sheetName, x, nc, r, widths) {
var sheet = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
'<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
'<sheetViews><sheetView workbookViewId="0"><pane ySplit="2" topLeftCell="A3" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' +
'<sheetFormatPr defaultRowHeight="15"/>' + widths + '<sheetData>' + x + '</sheetData>' +
'<autoFilter ref="A2:' + colRef(nc - 1) + r + '"/></worksheet>';
var blob = window.icXlsxBlob(sheetName, sheet), a = document.createElement('a');
a.href = URL.createObjectURL(blob); a.download = name;
document.body.appendChild(a); a.click();
setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
}
var ADM = C.ADM, F = C.F, x = '', r = 2, c, head;
if (C.DOC) {
var h = C.DOC.h, kind = C.kindOf(h.tt, h.ef, h.tc), pc = ADM || h.tt === 2;
head = ['#', 'ITEM', 'DESCRIPTION', 'LOT', 'EXP', 'UNIT', 'QTY', 'BONUS'];
if (pc) head.push('PRICE', 'DISC', 'NET');
if (ADM) head.push('COST', 'VALUE');
x += xrow(1, [[kind + ' ' + h.doc + ' - ' + h.dt + ' - ' + h.sn + ' - ' + (h.party || (h.xf + ' to ' + h.xt)), 4]]);
x += xrow(2, head.map(function (hd) { return [hd, 1]; }));
C.DOC.lines.forEach(function (l, n) {
var net = l[10] === null ? null : l[7] * l[10] - l[11]; r++;
c = [[n + 1, 7], [l[1], 3], [l[2], 0], [l[4], 3], [l[5], 3], [l[6], 0], [l[7], 5], [l[9] || null, 5]];
if (pc) c.push([l[10], 6], [l[11] || null, 6], [net, 6]);
if (ADM) c.push([l[13] ? l[13] * (l[7] ? l[8] / l[7] : 1) : null, 5], [l[8] * l[13], 6]);
x += xrow(r, c);
});
save('Doc_' + String(h.doc).replace(/[^0-9A-Za-z_-]/g, '_') + '.xlsx', 'Doc ' + h.doc, x, head.length, r,
'<cols><col min="1" max="1" width="5" customWidth="1"/><col min="2" max="2" width="15" customWidth="1"/><col min="3" max="3" width="44" customWidth="1"/>' +
'<col min="4" max="4" width="14" customWidth="1"/><col min="5" max="' + head.length + '" width="12" customWidth="1"/></cols>');
return;
}
var L = C.L, all = C.store === null, item = C.item, AVG = C.AVG, oq = +C.DATA.open[0], ov = +C.DATA.open[1];
var info = 'Item Card - ' + item.c + ' ' + item.n + (AVG ? ' - All lots, moving average' : ' - Lot ' + (L ? L[1] : '-') + (L && L[2] ? ' exp ' + L[2] : '')) + ' - ' + C.scope +
' - ' + C.dmy(C.from) + ' to ' + C.dmy(C.to) + ' - unit ' + C.UN + (C.filtered ? ' - filtered' : '') +
(AVG && C.K ? ' - closing avg cost ' + C.fc(C.K.cost * F) + ' (item value / quantity, as the system item report)' : '');
head = ['#', 'DATE', 'DOC #', 'TYPE'];
if (AVG) head.push('LOT');
if (all) head.push('WAREHOUSE');
head.push('DETAILS'); if (ADM) head.push('COST', 'COST CHECK', 'PRICE');
head.push('IN QTY'); if (ADM) head.push('IN VALUE');
head.push('OUT QTY'); if (ADM) head.push('OUT VALUE');
head.push('BALANCE'); if (ADM) head.push('BAL. VALUE');
if (AVG) head.push('AVG COST');
x += xrow(1, [[info, 4]]) + xrow(2, head.map(function (hd) { return [hd, 1]; }));
var kd = (all ? 6 : 5) + (AVG ? 1 : 0);
r = 3;
c = [[null, 0], [C.dmy(C.from), 3], ['Opening balance', 0]];
while (c.length < head.length - (ADM ? 2 : 1) - (AVG ? 1 : 0)) c.push([null, 0]);
c.push([oq / F, 5]); if (ADM) c.push([ov, 6]);
if (AVG) c.push([oq > 0.0005 ? ov / oq * F : null, 5]);
x += xrow(3, c);
C.rows.forEach(function (w, n) {
var d = w.r, pr = w.sp !== null ? w.sp : w.pp; r++;
c = [[n + 1, 7], [d[0], 3], [d[3], 3], [C.kindOf(d[4], d[5], d[2]), 0]];
if (AVG) c.push([C.lotName(d[21]), 3]);
if (all) c.push([C.whName(d[8]), 0]);
c.push([(d[5] === 5 ? 'To ' : d[5] === 6 ? 'From ' : '') + C.party(d), 0]);
if (ADM) c.push([w.c ? w.c * F : null, 5], [w.odd ? (w.xfer ? 'received at ' + C.fc(w.c * F) + ', sent at ' + C.fc(w.ref * F) : 'off the lot average ' + C.fc(w.ref * F)) : null, 0], [pr, 6]);
c.push([w.qi ? w.qi / F : null, 5]); if (ADM) c.push([w.vi ? w.vi : null, 6]);
c.push([w.qo ? w.qo / F : null, 5]); if (ADM) c.push([w.vo ? w.vo : null, 6]);
c.push([w.bal / F, 5]); if (ADM) c.push([w.val, 6]);
if (AVG) c.push([w.avg * F, 5]);
x += xrow(r, c);
if (d[5] === 5 && d[16] !== null && (!d[17] || !all)) {
r++;
c = []; while (c.length < kd - 1) c.push([null, 0]);
c.push([!d[17] ? 'Not received yet at the destination' : 'Received ' + d[17] + ' at destination, qty ' + C.fq(+d[18] / F) + ' ' + C.UN, 0]);
x += xrow(r, c);
}
});
var nc = head.length;
save('Item_Card_' + item.c + '_' + (AVG ? 'avg' : L ? L[1] : 'lot') + '_' + C.from + '_' + C.to + (all ? '' : '_' + C.store) + '.xlsx', 'Card ' + item.c, x, nc, r,
'<cols><col min="1" max="1" width="5" customWidth="1"/><col min="2" max="2" width="11" customWidth="1"/>' +
'<col min="3" max="3" width="15" customWidth="1"/><col min="4" max="4" width="15" customWidth="1"/>' +
'<col min="5" max="' + kd + '" width="34" customWidth="1"/><col min="' + (kd + 1) + '" max="' + nc + '" width="13" customWidth="1"/></cols>');
};

window.icCalc = function (DATA, ADM, AVG, F) {
var out = [], bal = +DATA.open[0], val = +DATA.open[1], cost = 0, i, r, qi, qo, c, avg, odd = 0, x, sb = {}, s, k;
for (k in (DATA.opens || {})) { sb[k] = { bal: +DATA.opens[k][0], val: +DATA.opens[k][1] }; }
for (i = 0; i < DATA.rows.length; i++) {
r = DATA.rows[i]; qi = +r[14]; qo = +r[15]; c = +r[11];
k = AVG ? r[8] + '|' + r[21] : r[8];
s = sb[k] || (sb[k] = { bal: 0, val: 0 });
avg = s.bal > 0.0005 ? s.val / s.bal : 0;
x = { r: r, qi: qi, qo: qo, c: c, lc: c,
sp: r[12] === null ? null : +r[12] / (+r[10] || 1) * F,
pp: r[13] === null ? null : +r[13] / (+r[10] || 1) * F };
if (ADM && c && avg && r[4] !== 1 && r[4] !== 8 && r[5] !== 6 && Math.abs(c - avg) > 0.0005) { x.odd = true; x.ref = avg; odd++; }
else if (ADM && r[5] === 6 && r[22] !== null && r[22] !== undefined && Math.abs(c - +r[22]) > 0.0005) { x.odd = true; x.ref = +r[22]; x.xfer = true; odd++; }
s.bal += qi - qo; s.val += (qi - qo) * c;
x.vi = qi * c; x.vo = qo * c;
bal += qi - qo; val += (qi - qo) * c; cost = c;
x.bal = bal; x.val = val; x.avg = bal > 0.0005 ? val / bal : c;
out.push(x);
}
if (AVG || !cost) { if (bal > 0.0005) cost = val / bal; }
return { rows: out, bal: bal, val: val, cost: cost, odd: odd };
};
