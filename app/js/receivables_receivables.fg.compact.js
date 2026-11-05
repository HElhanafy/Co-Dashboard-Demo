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
function grpTxt() {
var s = document.getElementById('jmHdrGroup'), e = document.querySelector('.jm-hdr-grp'),
g = s && s.options && s.selectedIndex >= 0 ? s.options[s.selectedIndex].text : (s || e ? (s || e).textContent : '');
return (g || '').replace(/^\s+|\s+$/g, '');
}
window.arGrp = grpTxt;
window.addEventListener('beforeprint', function () {
var T = window.jmT || function (s) { return s; }, wrap = document.querySelector('.wrap'), sep = '<span class="pf-sep">|</span>',
th = document.querySelector('#printTablePanel .print-title-row th'), pf = document.getElementById('printFilters'),
table = document.body.className.indexOf('print-mode-table') !== -1, parts = th ? th.textContent.split(' | ') : [],
seg = pf ? pf.innerHTML.split(sep) : [], box, i, rows, k, H;
if (!wrap) { return; }
for (i = 1; i < seg.length; i++) { if (/\d\d\/\d\d\/\d{4} - \d\d\/\d\d\/\d{4}/.test(seg[i])) { seg.splice(i - 1, 1); break; } }
box = document.getElementById('jmPrintHead');
if (!box) { box = document.createElement('div'); box.id = 'jmPrintHead'; wrap.insertBefore(box, wrap.firstChild); }
box.innerHTML = '<div class="ph-top"><b class="ph-co"></b><span class="ph-at"></span></div><div class="ph-title"></div><div class="ph-meta">' + seg.join(sep) + '</div>';
box.querySelector('.ph-co').textContent = T('Co. Dashboard');
box.querySelector('.ph-at').textContent = T(parts[2] || '') + (parts[3] ? '  |  ' + T(parts[3]) : '');
box.querySelector('.ph-title').textContent = T(parts[1] || '');
box = document.getElementById('arFitCss');
if (!box) { box = document.createElement('style'); box.id = 'arFitCss'; }
document.body.appendChild(box);
box.textContent = '';
rows = document.querySelectorAll('#printTablePanel tr').length - 1;
H = 700 - 70 - (table ? 0 : 175);
k = H / Math.max(rows, 1) / 16.4;
if (k > 1) { k = Math.min(k, 1.3); while (k > 1 && rows * 16.4 / 14.2 * (8.5 * k * 1.3 + 2 * Math.min(1.5 + (k - 1) * 12, 5) + 1) > H * 0.96) { k -= 0.02; } }
if (k >= 0.72 && Math.abs(k - 1) > 0.01) {
box.textContent = '@media print{#printTablePanel table,#printTablePanel th,#printTablePanel td,#printTablePanel th.num,#printTablePanel td.num{font-size:' + (8.5 * k).toFixed(1) + 'px !important}'
+ '#printTablePanel th,#printTablePanel td{padding:' + (k > 1 ? Math.min(1.5 + (k - 1) * 12, 5) : 1.5 * k).toFixed(1) + 'px ' + (k > 1 ? 6 : 4) + 'px !important;line-height:' + (k > 1 ? 1.3 : 1.1) + ' !important}}';
}
}, false);
window.arXl = function (S) {
var X = window.svXlsx, v = S.v, head = [], W = [], lines = [], BL = ['0 - 30', '31 - 60', '61 - 90', '91 - 120', '121 - 150', 'Over 150'],
i, j, r, s, t, w = '<cols>', sheet = 'Aging', info, g = grpTxt();
if (!X || !v) { return; }
function low(a) { return a.charAt(0) + a.substring(1).toLowerCase(); }
function agLine(r, total) {
var s = [], j;
if (v.cust) { s.push([total ? '' : r._dk, 3]); }
s.push([total ? 'TOTAL' : r.name, total ? 4 : 0]);
if (v.cust) { s.push(!total && typeof r.dd === 'number' ? [r.dd, 2] : ['', 0]); }
for (j = 0; j < 6; j++) { s.push([r['b' + j], 5]); }
s.push([r.un, 5], [r.tot, 5], [r.od, 5], [r.coll, 5]);
return s;
}
if (v.k === 'AG') {
if (v.cust) { head.push('Code'); W.push(16); }
head.push(low(v.lbl)); W.push(v.cust ? 46 : 36);
if (v.cust) { head.push('Terms (days)'); W.push(12); }
for (j = 0; j < 6; j++) { head.push(BL[j]); W.push(14); }
head.push('Credit balance', 'Total balance', 'Overdue', 'Collected'); W.push(15, 16, 15, 15);
for (i = 0; i < v.list.length; i++) { lines.push(agLine(v.list[i], false)); }
lines.push(agLine(v.tot, true));
} else if (v.k === 'RTN') {
sheet = 'Returned cheques';
head = ['Code', 'Customer', 'Salesman', 'Returned chq invoices', 'Returned chq value', 'Total balance', 'Overdue']; W = [16, 46, 32, 12, 16, 16, 15];
for (i = 0; i < v.list.length; i++) { r = v.list[i]; lines.push([[r._dk, 3], [r.name, 0], [r.sn || '', 0], [r.rcn, 2], [r.rcv, 5], [r.tot, 5], [r.od, 5]]); }
t = v.tot;
lines.push([['', 3], ['TOTAL', 4], ['', 0], [t.rcn, 2], [t.rcv, 5], [t.tot, 5], [t.od, 5]]);
} else if (v.k === 'INV') {
sheet = 'Invoices';
head = ['Invoice no.', 'Invoice date', 'Terms (days)', 'Invoice value', 'Due date', 'Paid', 'Age (days)', 'Status', 'Returned chq', 'Open balance']; W = [22, 13, 12, 16, 13, 15, 11, 11, 13, 16];
for (i = 0; i < v.list.length; i++) {
r = v.list[i];
lines.push([[r.ref, 3], [r.d, 0], [r.dd, 2], [r.g, 5], [v.due(r), 0], [r.g - r.o, 5], [r.a, 2], [r.a > r.dd ? 'Overdue' : 'Current', 0], [r.rc === 1 ? 'RTN CHQ' : '', 0], [r.o, 5]]);
}
lines.push([['TOTAL', 4], ['', 0], ['', 0], [v.g, 5], ['', 0], [v.g - v.o, 5], ['', 0], ['', 0], ['', 0], [v.o, 5]]);
} else { return; }
for (i = 0; i < head.length; i++) { w += '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + W[i] + '" customWidth="1"/>'; }
info = S.title + (S.path ? ' - ' + S.path : '') + (v.k === 'INV' ? ' (' + v.code + ')' + (S.od ? ' - overdue only' : '') : '') +
' - Collections ' + S.period + ' - Data as of ' + (S.asof || '-') + (g ? ' - Data group: ' + g : '');
X.save(info, head, lines, w + '</cols>', S.file, sheet);
};
window.arSS = function (inp, menu, src, pick) {
var L = [], cur = -1, open = false;
function esc(s) { return String(s === null || s === undefined ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function lit() {
var o = menu.children, i, e;
for (i = 0; i < o.length; i++) { o[i].className = 'ss-option' + (i === cur ? ' active' : ''); }
e = L.length ? o[cur] : null;
if (e && e.offsetTop < menu.scrollTop) { menu.scrollTop = e.offsetTop; }
else if (e && e.offsetTop + e.offsetHeight > menu.scrollTop + menu.clientHeight) { menu.scrollTop = e.offsetTop + e.offsetHeight - menu.clientHeight; }
}
function draw() {
var h = '', i;
L = src((inp.value || '').replace(/^\s+|\s+$/g, '')) || [];
for (i = 0; i < L.length; i++) { h += '<div class="ss-option" data-i="' + i + '"><span class="ss-code">' + esc(L[i].c) + '</span><span>' + esc(L[i].cn) + '</span></div>'; }
menu.innerHTML = h || '<div class="ss-empty">No matching customer</div>';
menu.className = 'ss-menu open'; open = true; cur = -1; menu.scrollTop = 0;
}
function close() { menu.className = 'ss-menu'; open = false; cur = -1; }
function go(i) { var r = L[i]; if (!r) { return; } close(); pick(r.c, r.cn); }
inp.addEventListener('focus', draw);
inp.addEventListener('input', draw);
inp.addEventListener('click', function () { if (!open) { draw(); } });
inp.addEventListener('blur', function () { setTimeout(close, 150); });
inp.addEventListener('keydown', function (e) {
var k = e.keyCode;
if (k === 13) { e.preventDefault(); if (open) { go(cur < 0 ? 0 : cur); } return; }
if (k === 27) { close(); return; }
if (k !== 40 && k !== 38) { return; }
e.preventDefault();
if (!open) { draw(); }
if (!L.length) { return; }
cur = k === 40 ? Math.min(L.length - 1, cur + 1) : Math.max(0, cur - 1);
lit();
});
menu.addEventListener('mousedown', function (e) {
var t = e.target;
while (t && t !== menu && !(t.getAttribute && t.getAttribute('data-i') !== null)) { t = t.parentNode; }
e.preventDefault();
if (t && t !== menu) { go(+t.getAttribute('data-i')); }
});
document.addEventListener('click', function (e) {
var t = e.target;
while (t && t !== inp.parentNode) { t = t.parentNode; }
if (!t) { close(); }
});
};
}());
