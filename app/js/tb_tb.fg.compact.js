window.svXlsx = (function () {
var CTL = new RegExp('[' + String.fromCharCode(0) + '-' + String.fromCharCode(8) + String.fromCharCode(11) + String.fromCharCode(12) + String.fromCharCode(14) + '-' + String.fromCharCode(31) + ']', 'g');
var CRC = (function () {
var t = [], c, n, k;
for (n = 0; n < 256; n++) { c = n; for (k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c >>> 0; }
return t;
})();
function crc32(u8) {
var c = 0xFFFFFFFF;
for (var i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 0xFF] ^ (c >>> 8);
return (c ^ 0xFFFFFFFF) >>> 0;
}
function zipStore(files) {
var enc = new TextEncoder(), parts = [], cd = [], off = 0;
function u16(v) { return [v & 255, (v >> 8) & 255]; }
function u32(v) { return [v & 255, (v >> 8) & 255, (v >> 16) & 255, (v >>> 24) & 255]; }
files.forEach(function (f) {
var name = enc.encode(f.n), data = enc.encode(f.d), crc = crc32(data);
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
function xmlEsc(s) {
return String(s === null || s === undefined ? '' : s).replace(/[&<>"]/g, function (m) {
return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m];
}).replace(CTL, '');
}
function colRef(i) {
var s = '';
i++;
while (i > 0) { var m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); }
return s;
}
function save(info, head, lines, widths, fileName, sheetName) {
var nc = head.length, r = 1, x = '';
function cs(ref, v, st) { return '<c r="' + ref + '" t="inlineStr" s="' + st + '"><is><t xml:space="preserve">' + xmlEsc(v) + '</t></is></c>'; }
function cn(ref, v, st) {
var d = st === 2 ? 10 : (st === 5 ? 100 : 10000);
return '<c r="' + ref + '" s="' + st + '"><v>' + (Math.round(v * d) / d) + '</v></c>';
}
x += '<row r="1">' + cs('A1', info, 4) + '</row>';
r = 2; x += '<row r="2">';
head.forEach(function (h, i) { x += cs(colRef(i) + '2', h, 1); });
x += '</row>';
lines.forEach(function (cells) {
r++; x += '<row r="' + r + '">';
cells.forEach(function (c, i) {
x += (c[1] === 2 || c[1] === 5 || c[1] === 6) ? cn(colRef(i) + r, c[0], c[1]) : cs(colRef(i) + r, c[0], c[1]);
});
x += '</row>';
});
var last = colRef(nc - 1) + r;
var sheet = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
'<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
'<sheetViews><sheetView workbookViewId="0"><pane ySplit="2" topLeftCell="A3" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' +
'<sheetFormatPr defaultRowHeight="15"/>' + widths + '<sheetData>' + x + '</sheetData>' +
'<autoFilter ref="A2:' + last + '"/></worksheet>';
var styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
'<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
'<numFmts count="3"><numFmt numFmtId="164" formatCode="#,##0.0"/><numFmt numFmtId="165" formatCode="#,##0.00"/><numFmt numFmtId="166" formatCode="#,##0.0000"/></numFmts>' +
'<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>' +
'<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>' +
'<fill><patternFill patternType="solid"><fgColor rgb="FFE8EAF6"/></patternFill></fill></fills>' +
'<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border>' +
'<border><left style="thin"><color rgb="FFBFC4D6"/></left><right style="thin"><color rgb="FFBFC4D6"/></right>' +
'<top style="thin"><color rgb="FFBFC4D6"/></top><bottom style="thin"><color rgb="FFBFC4D6"/></bottom><diagonal/></border></borders>' +
'<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
'<cellXfs count="7">' +
'<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/>' +
'<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
'<xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>' +
'<xf numFmtId="49" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>' +
'<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
'<xf numFmtId="165" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>' +
'<xf numFmtId="166" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>' +
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
'<sheets><sheet name="' + xmlEsc(sheetName) + '" sheetId="1" r:id="rId1"/></sheets></workbook>' },
{ n: 'xl/_rels/workbook.xml.rels', d: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
'<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
'</Relationships>' },
{ n: 'xl/worksheets/sheet1.xml', d: sheet },
{ n: 'xl/styles.xml', d: styles }
];
var blob = zipStore(files);
var a = document.createElement('a');
a.href = URL.createObjectURL(blob);
a.download = fileName;
document.body.appendChild(a); a.click();
setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
}
return { save: save };
})();
window.svPrint = function (o) {
var orig = document.title, d = new Date(), tb = document.createElement('div'), cards = document.getElementById('valueCards');
var DASH = String.fromCharCode(8212), SEP = ' ' + String.fromCharCode(8250) + ' ';
function p2(v) { return (v < 10 ? '0' : '') + v; }
function esc(s) { return String(s === null || s === undefined ? '' : s).replace(/[&<>"]/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]; }); }
if (!cards) { window.print(); return; }
document.title = o.title || document.title;
tb.id = 'svPTitle';
tb.innerHTML = '<div class="pt-h"><b>Co. Dashboard</b> &nbsp;|&nbsp; Stock Value ' + DASH + ' ' + esc(o.view) + ' ' + DASH + ' ' + esc(o.scope) + SEP + esc(o.type) + '</div>' +
'<div class="pt-s">Till ' + esc(o.date) + ' (inclusive)' + (o.cls ? ' &nbsp;&middot;&nbsp; Class ' + esc(o.cls) : '') + (o.q ? ' &nbsp;&middot;&nbsp; Item &quot;' + esc(o.q) + '&quot;' : '') +
(o.chk ? ' &nbsp;&middot;&nbsp; ' + esc(o.chk) : '') + ' &nbsp;&middot;&nbsp; Values in SAR at cost (system cost script, all lots incl. zero-quantity residue)' +
' &nbsp;&middot;&nbsp; Printed ' + p2(d.getDate()) + '/' + p2(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + p2(d.getHours()) + ':' + p2(d.getMinutes()) + '</div>' +
'<div class="pt-c">The first box is the total of ' + esc(o.scope) + ' at this date (Items = Lots); the accounts box, when shown, compares the ledger accounts 1103 with the inventory module at the same date (company, all warehouses); the table lists the same value by class and ' + (o.view === 'Lots' ? 'lot' : 'item') + '.</div>';
cards.parentNode.insertBefore(tb, cards);
document.body.classList.add('print-mode-table'); document.body.classList.add('sv-pdf');
var back = function () {
if (tb.parentNode) tb.parentNode.removeChild(tb);
document.title = orig; document.body.classList.remove('print-mode-table'); document.body.classList.remove('sv-pdf');
window.removeEventListener('afterprint', back);
};
window.addEventListener('afterprint', back);
window.print();
};
(function () {
window.tbXl = function (S) {
var X = window.svXlsx, head, W, lines = [], i, L, r, t, w = '<cols>', sheet, info, bal = 0, dr = 0, cr = 0;
if (!X || !S.list) { return; }
function side(v) { return v > 0.005 ? [[v, 5], ['', 0]] : v < -0.005 ? [['', 0], [-v, 5]] : [['', 0], ['', 0]]; }
function mv(v) { return Math.abs(v) > 0.005 ? [v, 5] : ['', 0]; }
if (S.v === 'TB') {
sheet = 'Trial balance';
head = ['Account', 'Account name', 'Opening DR', 'Opening CR', 'Debit', 'Credit', 'Closing DR', 'Closing CR']; W = [16, 46, 16, 16, 16, 16, 16, 16];
for (i = 0; i < S.list.length; i++) {
r = S.list[i];
lines.push([[S.pad(r.a), 3], [r.name, 0]].concat(side(r.op), [mv(r.dr), mv(r.cr)], side(r.cl)));
}
t = S.tot;
lines.push([['', 3], ['TOTAL', 4], [t.opd, 5], [t.opc, 5], [t.dr, 5], [t.cr, 5], [t.cld, 5], [t.clc, 5]]);
info = 'Trial Balance - Level ' + S.lvl + ' - ' + S.path + ' - ' + S.from + ' to ' + S.to + ' - Cost: ' + S.cost;
} else if (S.v === 'ST') {
sheet = 'Statement';
head = ['Date', 'Entry', 'Description', 'Cost 1', 'Cost 2', 'Debit', 'Credit', 'Balance']; W = [12, 12, 50, 26, 26, 16, 16, 16];
bal = S.flt ? 0 : S.op;
if (!S.flt) {
dr = bal > 0 ? bal : 0; cr = bal < 0 ? -bal : 0;
lines.push([[S.fromM.slice(0, 4) + '-' + S.fromM.slice(4, 6) + '-01', 0], ['', 3], ['Opening Balance', 0], ['', 0], ['', 0], mv(dr), mv(cr), [bal, 5]]);
}
for (i = 0; i < S.list.length; i++) {
L = S.list[i];
bal = Math.round((bal + L.v) * 100) / 100;
if (L.v > 0) { dr += L.v; } else { cr += -L.v; }
lines.push([[L.dt, 0], [L.no, 3], [L.ds || '', 0], [S.c1(L.c1), 0], [S.c2(L.c2), 0], mv(L.v > 0 ? L.v : 0), mv(L.v < 0 ? -L.v : 0), [bal, 5]]);
}
lines.push([[S.flt ? 'FILTERED TOTAL' : 'TOTAL', 4], ['', 3], ['', 0], ['', 0], ['', 0], [dr, 5], [cr, 5], [bal, 5]]);
info = 'Account Statement - ' + S.pad(S.acc) + ' ' + S.name(S.acc) + ' - ' + S.from + ' to ' + S.to + ' - Cost: ' + S.cost +
(S.flt ? ' - filtered slice, balance restarts at 0' : '');
} else {
sheet = 'Entry';
head = ['#', 'Account', 'Account name', 'Description', 'Cost 1', 'Cost 2', 'Debit', 'Credit']; W = [6, 16, 40, 50, 26, 26, 16, 16];
for (i = 0; i < S.list.length; i++) {
L = S.list[i];
if (L.v > 0) { dr += L.v; } else { cr += -L.v; }
lines.push([[String(L.q), 3], [L.a, 3], [S.name(L.a), 0], [L.ds || S.eds || '', 0], [S.c1(L.c1), 0], [S.c2(L.c2), 0], mv(L.v > 0 ? L.v : 0), mv(L.v < 0 ? -L.v : 0)]);
}
lines.push([['', 3], ['', 3], ['TOTAL', 4], ['', 0], ['', 0], ['', 0], [dr, 5], [cr, 5]]);
info = 'Journal Entry ' + S.ref + ' - ' + S.edt + (S.eds ? ' - ' + S.eds : '');
}
for (i = 0; i < head.length; i++) { w += '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + W[i] + '" customWidth="1"/>'; }
X.save(info + ' - Data as of ' + (S.asof || '-'), head, lines, w + '</cols>', S.file, sheet);
};
}());
(function () {
function pick(id) {
var sel = document.getElementById(id), box, btn, menu;
if (!sel || sel.getAttribute('data-picked')) { return; }
box = document.createElement('div');
box.className = 'ms-box';
box.innerHTML = '<button type="button" class="ms-btn"></button><div class="ss-menu"></div>';
sel.parentNode.insertBefore(box, sel);
sel.style.display = 'none';
sel.setAttribute('data-picked', '1');
btn = box.firstChild;
menu = box.lastChild;
function label() {
var o = sel.options[sel.selectedIndex], t = o ? o.text : '';
if (btn.textContent !== t) { btn.textContent = t; }
btn.classList.toggle('picked', !!sel.value);
btn.disabled = sel.disabled;
}
btn.addEventListener('click', function () {
var open = menu.classList.contains('open'), i, d;
document.body.click();
if (open) { return; }
menu.innerHTML = '';
for (i = 0; i < sel.options.length; i++) {
d = document.createElement('div');
d.className = 'ss-option' + (i === sel.selectedIndex ? ' active' : '');
d.setAttribute('data-i', i);
d.textContent = sel.options[i].text;
menu.appendChild(d);
}
setTimeout(function () { menu.classList.add('open'); }, 0);
});
menu.addEventListener('click', function (e) {
var o = e.target.closest('.ss-option');
if (!o) { return; }
sel.selectedIndex = +o.getAttribute('data-i');
menu.classList.remove('open');
label();
sel.dispatchEvent(new Event('change', { bubbles: true }));
});
document.addEventListener('click', function (e) { if (!box.contains(e.target)) { menu.classList.remove('open'); } }, true);
label();
setInterval(label, 400);
}
function start() { pick('fC1'); pick('fC2A'); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', start); } else { start(); }
}());
