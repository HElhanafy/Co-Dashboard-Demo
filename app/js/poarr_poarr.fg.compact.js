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
var LVL = 0, ITEM = null, ORD = null, PO = null, busy = false, H = null, O = {};
function $(id) { return document.getElementById(id); }
function root() { return O.root || 'PO Arrivals'; }
function fm(v, d) {
var neg = v < 0, a = Math.abs(v), s, o = '', i, f = '';
if (d === undefined) { d = Math.round(a * 100) / 100 === Math.round(a) ? 0 : 2; }
s = a.toFixed(d);
i = s.indexOf('.');
if (i >= 0) { f = s.substr(i); s = s.substr(0, i); }
while (s.length > 3) { o = ',' + s.substr(s.length - 3) + o; s = s.substr(0, s.length - 3); }
return (neg ? '-' : '') + s + o + f;
}
function rate() { return O.rate ? (+O.rate() || 1) : 1; }
function money(v) { return v === null || v === undefined ? '<span class="z">&mdash;</span>' : fm(+v / rate(), 2); }
function price(v) { var s; if (v === null || v === undefined) { return money(v); } s = fm(+v / rate(), 4); return s.replace(/(\.\d\d[1-9]?)0+$/, '$1'); }
function p4(v) { var s; if (v === null || v === undefined) { return money(v); } s = fm(+v, 4); return s.replace(/(\.\d\d[1-9]?)0+$/, '$1'); }
function mo(v) { return v === null || v === undefined ? money(v) : fm(+v, 2); }
var USD = 3.75;
function sar(v, h) { return +h[12] === 1 ? +v : +v * (+h[13] || 1); }
function usd(v, h) { return v === null || v === undefined ? null : sar(v, h) / USD; }
function other(v, h) { return v === null || v === undefined ? null : (rate() === 1 ? usd(v, h) : sar(v, h)); }
function oName() { return rate() === 1 ? 'USD' : 'SAR'; }
function m2(v, h) { return (rate() === 1 ? money(v) : (v === null || v === undefined ? money(v) : fm(sar(v, h) / rate(), 2))) + (v === null || v === undefined ? '' : '<small class="usd">' + fm(other(v, h), 2) + ' ' + oName() + '</small>'); }
function today() { var t = new Date(); return t.getFullYear() + '-' + (t.getMonth() < 9 ? '0' : '') + (t.getMonth() + 1) + '-' + (t.getDate() < 10 ? '0' : '') + t.getDate(); }
var TODAY = today();
function stat(att, arr) {
if (+att === 1) { return ['cus', 'At customs']; }
if (arr && arr < TODAY) { return ['late', 'Overdue']; }
if (!arr) { return ['req', 'No date']; }
return ['req', 'Required'];
}
function chip(s) { return '<span class="st ' + s[0] + '">' + s[1] + '</span>'; }
function pono(t, s) { return t + ' : ' + s; }
function curName(c) { return +c === 1 ? 'SAR' : 'Currency ' + c; }
function show(l) {
LVL = l;
document.body.className = document.body.className.replace(/\s*po-lvl\d/g, '') + (l ? ' po-lvl' + l : '');
$('ordPanel').style.display = l === 2 ? '' : 'none';
$('poPanel').style.display = l === 3 ? '' : 'none';
window.scrollTo(0, 0);
}
function crumb(parts, back, print) {
var h = '<div class="table-header-row"><div class="crumb">', i;
for (i = 0; i < parts.length; i++) {
if (i) { h += '<span class="sep">&#8250;</span>'; }
h += parts[i][1] ? '<span class="c1" data-go="' + parts[i][1] + '">' + H.esc(parts[i][0]) + '</span>' : '<span class="c2">' + H.esc(parts[i][0]) + '</span>';
}
return h + '</div><div class="lv-btns">' + (O.tools ? O.tools() : '') + (print ? '<button type="button" class="btn-view po-print" data-go="print" title="Print the order or save it as PDF">&#9113; Print / PDF</button>' : '') +
'<button type="button" class="back" data-go="' + back + '">&#8592; Back</button></div></div>';
}
function doPrint() {
var t = document.title;
if (!PO) { return; }
document.title = 'PO_' + PO.h[0] + '_' + PO.h[1] + (PO.h[2] ? '_doc' + PO.h[2] : '');
window.print();
setTimeout(function () { document.title = t; }, 1500);
}
function kv(k, v, s) { return '<div class="oh-sec"><small>' + k + '</small><div class="oh-v">' + v + '</div>' + (s ? '<div class="oh-s">' + s + '</div>' : '') + '</div>'; }
function fail(id, msg) { $(id).innerHTML = crumb([[root(), '0']], '0') + '<div class="dr-none">' + H.esc(msg) + '</div>'; }
function renderOrders(d) {
var o = d.orders, i, r, s, h, n = o.length, qOrd = 0, qCus = 0, qLate = 0, cost = d.cost === 1, W = cost ? 13 : 11;
ITEM = { code: d.item[0], name: d.item[1], unit: d.item[2] };
for (i = 0; i < n; i++) {
r = o[i]; s = stat(r[10], r[8]);
qOrd += r[12];
if (s[0] === 'cus') { qCus += r[12]; }
if (s[0] === 'late') { qLate += r[12]; }
}
h = crumb([[root(), '0'], [ITEM.code + ' - ' + ITEM.name, ''], ['Open orders (' + n + ')', '']], '0');
h += '<div class="ih"><span class="kv"><b>Item</b><span>' + H.esc(ITEM.code) + ' <i>' + H.esc(ITEM.name) + '</i></span></span><span class="kv"><b>Unit</b><span>' + H.esc(ITEM.unit) + '</span></span>' +
'<span class="kv"><b>Open orders</b><span>' + n + '</span></span><span class="kv"><b>Ordered</b><span>' + fm(qOrd) + ' <i>' + H.esc(ITEM.unit) + '</i></span></span>' +
'<span class="kv"><b>At customs</b><span>' + fm(qCus) + '</span></span><span class="kv"><b>Overdue</b><span class="' + (qLate ? 'neg' : '') + '">' + fm(qLate) + '</span></span>' +
(d.asof ? '<span class="kv"><b>Data as of</b><span><i>' + H.esc(d.asof) + '</i></span></span>' : '') + '</div>';
h += '<div class="table-scroll"><table id="ordTable"><thead><tr><th>PO no.</th><th>Doc no.</th><th>Order date</th><th>Supplier</th><th>Destination</th><th>Shipping</th><th>Arrival</th><th>Status</th>' +
'<th class="num">This item</th><th class="num">Order lines</th><th class="num">Order qty</th>' + (cost ? '<th class="num">Order value</th><th class="num">Expenses</th>' : '') + '</tr></thead><tbody>';
if (!n) { h += '<tr><td colspan="' + W + '" class="z" style="text-align:center;padding:22px">No open orders for this item</td></tr>'; }
for (i = 0; i < n; i++) {
r = o[i]; s = stat(r[10], r[8]);
h += '<tr><td class="c-code lnk" data-po="' + r[0] + '/' + r[1] + '" title="Open the order">' + pono(r[0], r[1]) + '</td><td class="c-code">' + H.esc(r[2]) + '</td><td class="c-code">' + H.dmy(r[3]) + '</td>' +
'<td>' + H.esc(r[4]) + '</td><td>' + H.esc(r[5]) + (r[6] ? ' <i class="brn">' + H.esc(r[6]) + '</i>' : '') + '</td><td class="c-code">' + H.dmy(r[7]) + '</td>' +
'<td class="c-code' + (s[0] === 'late' ? ' neg' : '') + '">' + H.dmy(r[8]) + '</td><td>' + chip(s) + (s[0] === 'cus' && r[9] ? '<small class="since">docs received ' + H.dmy(r[9]) + '</small>' : '') + '</td>' +
'<td class="num"><b>' + fm(r[12]) + '</b> <i class="un">' + H.esc(r[13] || ITEM.unit) + '</i></td><td class="num">' + r[14] + '</td><td class="num">' + fm(r[15]) + '</td>' +
(cost ? '<td class="num">' + money(r[16]) + '</td><td class="num">' + money(r[17]) + '</td>' : '') + '</tr>';
}
h += '</tbody>' + (n ? '<tfoot><tr class="tot"><td colspan="8">Total - this item</td><td class="num">' + fm(qOrd) + '</td><td></td><td></td>' + (cost ? '<td></td><td></td>' : '') + '</tr></tfoot>' : '') + '</table></div>';
$('ordPanel').innerHTML = h;
}
function openItem(code) {
if (busy) { return; }
busy = true;
$('ordPanel').innerHTML = '<div class="dr-none">Loading the orders...</div>';
show(2);
apex.server.process('POARR_PO_AJAX', { x01: 'orders', x02: code }, {
dataType: 'json',
success: function (d) { busy = false; if (!d || d.error || !d.ok) { fail('ordPanel', 'Could not load' + (d && d.error ? ' - ' + d.error : '')); return; } ORD = d; renderOrders(d); },
error: function () { busy = false; fail('ordPanel', 'Could not load. Please try again.'); }
});
}
function renderPO(d) {
var h = d.h, L = d.lines, E = d.exp || [], cost = d.cost === 1, s = stat(h[10], h[8]), i, r, x, out, tq = 0, tv = 0, tot = 0, hasH = false, hasV = false, expT = 0, paidT = 0, cur = curName(h[12]);
var parts = [[root(), '0']].concat(O.parts ? O.parts() : []), back = '0';
if (ITEM) { parts.push([ITEM.code, '2'], ['Open orders', '2']); back = '2'; }
else if (parts.length > 1) { back = parts[parts.length - 1][1]; }
parts.push(['PO ' + pono(h[0], h[1]), '']);
out = crumb(parts, back, true);
out += '<div class="oh"><div class="oh-band"><div class="oh-b oh-b1"><small>Purchase order</small><div class="oh-no">' + pono(h[0], h[1]) + '</div></div>' +
'<div class="oh-b"><small>Doc no.</small><div>' + H.esc(h[2]) + '</div></div><div class="oh-b"><small>Order date</small><div>' + H.dmy(h[3]) + '</div></div>' +
'<div class="oh-b oh-bs"><small>Status</small><div>' + chip(s) + (s[0] === 'cus' && h[9] ? '<span class="oh-since">documents received ' + H.dmy(h[9]) + ' - shipment at customs</span>' : (s[0] === 'late' ? '<span class="oh-since">arrival date passed, not received</span>' : '')) + '</div></div>' +
(d.asof ? '<div class="oh-b oh-asof"><small>Data as of</small><div>' + H.esc(d.asof) + '</div></div>' : '') +
(O.rate ? '<div class="oh-b oh-cur"><small>Currency</small><div class="oh-curv">' + (rate() === 1 ? 'SAR' : 'USD') + '</div></div>' : '') + '</div>' +
'<div class="oh-grid">' + kv('Supplier', H.esc(h[4]), '') + kv('Destination', H.esc(h[5]), h[6] ? H.esc(h[6]) + ' branch' : '') +
kv('Shipping date', h[7] ? H.dmy(h[7]) : '&mdash;', '') + kv('Arrival date', '<span class="' + (s[0] === 'late' ? 'neg' : '') + '">' + (h[8] ? H.dmy(h[8]) : '&mdash;') + '</span>', s[0] === 'late' ? 'date passed, not received' : '') +
kv('Lines', h[15] + ' <i>' + (h[15] === 1 ? 'line' : 'lines') + '</i>', fm(h[16]) + ' units in the unit of each line') + '</div>';
if (cost) {
expT = +h[20] || 0; paidT = +h[21] || 0;
tot = (+h[17] || 0) - (+h[18] || 0) + (+h[19] || 0) + expT;
out += '<div class="oh-cost">' + kv('Currency', H.esc(cur) + (+h[13] !== 1 ? ' <i>@ ' + fm(+h[13], 4) + '</i>' : '') + (rate() !== 1 ? ' <i>shown in USD</i>' : ''), 'USD @ ' + USD + ' SAR') +
kv('Goods value', m2(h[17], h), 'lines: quantity x price') +
kv('Order discount', money(h[18]), '') + kv('VAT', money(h[19]), '') +
kv('Expenses', m2(expT, h), 'freight, customs, insurance...') + kv('Paid expenses', money(paidT), 'expense vouchers') +
'<div class="oh-sec tot"><small>Total incl. expenses</small><div class="oh-v">' + m2(tot, h) + '</div><div class="oh-s">goods - discount + VAT + expenses</div></div></div>';
}
if (h[14]) { out += '<div class="oh-notes"><b>Notes</b> ' + H.esc(h[14]) + '</div>'; }
out += '</div>';
out += '<div class="table-scroll"><table id="poLines"><thead><tr><th>#</th><th>Code</th><th>Item</th><th>Unit</th><th class="num">Ordered</th>' +
(cost ? '<th class="num">Price</th><th class="num usdh">Price ' + oName() + '</th><th class="num">Disc %</th><th class="num">Net price</th><th class="num">VAT</th><th class="num">Total</th><th class="num usdh">Total ' + oName() + '</th>' : '') + '</tr></thead><tbody>';
for (i = 0; i < L.length; i++) {
r = L[i]; tq += r[4]; tv += (+r[9] || 0);
out += '<tr' + (ITEM && r[1] === ITEM.code ? ' class="me"' : '') + '><td class="c-code">' + r[0] + '</td><td class="c-code">' + H.esc(r[1]) + '</td><td>' + H.esc(r[2]) + '</td><td>' + H.esc(r[3]) + '</td><td class="num">' + fm(r[4]) + '</td>' +
(cost ? '<td class="num">' + price(r[5]) + '</td><td class="num usdc">' + p4(other(r[5], h)) + '</td><td class="num">' + (r[6] ? fm(+r[6], 2) : '<span class="z">0</span>') + '</td><td class="num">' + price(r[5] === null ? null : +r[5] * (1 - (+r[6] || 0) / 100)) + '</td><td class="num">' + (r[8] ? fm(+r[8] / rate(), 2) : '<span class="z">0</span>') + '</td><td class="num">' + money(r[9]) + '</td><td class="num usdc">' + mo(other(r[9], h)) + '</td>' : '') + '</tr>';
}
out += '</tbody><tfoot><tr class="tot"><td colspan="4">Total</td><td class="num">' + fm(tq) + '</td>' + (cost ? '<td></td><td></td><td></td><td></td><td></td><td class="num">' + fm(tv / rate(), 2) + '</td><td class="num usdc">' + fm(other(tv, h), 2) + '</td>' : '') + '</tr></tfoot></table></div>';
if (cost) {
for (i = 0; i < E.length; i++) { if (E[i][0] === 'H') { hasH = true; } else { hasV = true; } }
out += '<h4 class="oh-h4">Order expenses</h4>';
if (!hasH) { out += '<div class="dr-none">No expenses recorded on this order</div>'; }
else {
out += '<div class="table-scroll"><table class="po-exp"><thead><tr><th>#</th><th>Supplier</th><th>Doc no.</th><th class="num">Freight</th><th class="num">Customs</th><th class="num">Transport</th><th class="num">Insurance</th><th class="num">Commission</th><th class="num">Other</th><th class="num">Total</th></tr></thead><tbody>';
for (i = 0; i < E.length; i++) {
r = E[i]; if (r[0] !== 'H') { continue; }
out += '<tr><td class="c-code">' + r[1] + '</td><td>' + H.esc(r[2]) + '</td><td class="c-code">' + H.esc(r[3]) + '</td>';
for (x = 5; x <= 11; x++) { out += '<td class="num' + (x === 11 ? ' tot' : '') + '">' + (+r[x] ? m2(+r[x], h) : '<span class="z">0.00</span>') + '</td>'; }
out += '</tr>';
}
out += '</tbody><tfoot><tr class="tot"><td colspan="9">Total expenses</td><td class="num">' + m2(expT, h) + '</td></tr></tfoot></table></div>';
}
out += '<h4 class="oh-h4">Paid expenses - vouchers</h4>';
if (!hasV) { out += '<div class="dr-none">No expense vouchers on this order yet</div>'; }
else {
out += '<div class="table-scroll"><table class="po-exp"><thead><tr><th>#</th><th>Supplier</th><th>Doc no.</th><th>Date</th><th>Description</th><th class="num">Total</th></tr></thead><tbody>';
for (i = 0; i < E.length; i++) {
r = E[i]; if (r[0] !== 'V') { continue; }
out += '<tr><td class="c-code">' + r[1] + '</td><td>' + H.esc(r[2]) + '</td><td class="c-code">' + H.esc(r[3]) + '</td><td class="c-code">' + H.dmy(r[4]) + '</td><td>' + H.esc(r[12]) + '</td><td class="num tot">' + fm(+r[11] / rate(), 2) + '</td></tr>';
}
out += '</tbody><tfoot><tr class="tot"><td colspan="5">Total paid</td><td class="num">' + fm(paidT / rate(), 2) + '</td></tr></tfoot></table></div>';
}
}
out += '<div class="oh-foot">Open lines only - a line already received leaves the order.' + (cost ? ' Values in ' + H.esc(cur) + ', as entered on the order.' : '') + (d.asof ? ' Data as of ' + H.esc(d.asof) + '.' : '') + '</div>';
$('poPanel').innerHTML = out;
}
function openPO(t, s) {
if (busy) { return; }
busy = true;
$('poPanel').innerHTML = '<div class="dr-none">Loading the order...</div>';
show(3);
apex.server.process('POARR_PO_AJAX', { x01: 'po', x02: t, x03: s }, {
dataType: 'json',
success: function (d) {
busy = false;
if (!d || d.error || !d.ok) {
if (O.onFail) { show(0); O.onFail(t, s, d && d.error ? d.error : ''); return; }
fail('poPanel', 'Could not load' + (d && d.error ? ' - ' + d.error : '')); return;
}
PO = d; renderPO(d);
},
error: function () { busy = false; fail('poPanel', 'Could not load. Please try again.'); }
});
}
function excel() {
var head, lines = [], i, r, w = '<cols>', W, j, cost, s;
if (!window.svXlsx) { return; }
if (LVL === 2 && ORD) {
cost = ORD.cost === 1;
head = ['PO no.', 'Doc no.', 'Order date', 'Supplier', 'Destination', 'Branch', 'Shipping date', 'Arrival date', 'Status', 'This item', 'Unit', 'Order lines', 'Order qty'];
if (cost) { head.push('Order value', 'Expenses'); }
for (i = 0; i < ORD.orders.length; i++) {
r = ORD.orders[i]; s = stat(r[10], r[8]);
lines.push([[r[0] + ' : ' + r[1], 3], [r[2], 3], [H.dmy(r[3]), 0], [r[4], 0], [r[5], 0], [r[6] || '', 0], [H.dmy(r[7]), 0], [H.dmy(r[8]), 0], [s[1], 0], [r[12], 2], [r[13] || ITEM.unit, 0], [r[14], 2], [r[15], 2]].concat(cost ? [[r[16] === null ? '' : +r[16] / rate(), 2], [r[17] === null ? '' : +r[17] / rate(), 2]] : []));
}
W = [14, 12, 12, 40, 26, 10, 13, 13, 12, 12, 8, 10, 12, 14, 14];
for (j = 0; j < head.length; j++) { w += '<col min="' + (j + 1) + '" max="' + (j + 1) + '" width="' + W[j] + '" customWidth="1"/>'; }
window.svXlsx.save('PO Arrivals - open purchase orders of item ' + ITEM.code + ' - ' + ITEM.name + (ORD.asof ? ' - data as of ' + ORD.asof : ''), head, lines, w + '</cols>', 'PO_Orders_' + ITEM.code + '.xlsx', 'Open orders');
return;
}
if (LVL === 3 && PO) {
cost = PO.cost === 1; r = PO.h;
head = ['#', 'Code', 'Item', 'Unit', 'Ordered'];
if (cost) { head.push('Price', 'Price ' + oName(), 'Disc %', 'VAT', 'Total', 'Total ' + oName()); }
for (i = 0; i < PO.lines.length; i++) {
s = PO.lines[i];
lines.push([[s[0], 2], [s[1], 3], [s[2], 0], [s[3], 0], [s[4], 2]].concat(cost ? [[s[5] === null ? '' : +s[5] / rate(), 2], [s[5] === null ? '' : other(s[5], r), 2], [s[6] || 0, 2], [(+s[8] || 0) / rate(), 2], [s[9] === null ? '' : +s[9] / rate(), 2], [s[9] === null ? '' : other(s[9], r), 2]] : []));
}
W = [5, 16, 52, 8, 12, 12, 12, 8, 10, 14, 14];
for (j = 0; j < head.length; j++) { w += '<col min="' + (j + 1) + '" max="' + (j + 1) + '" width="' + W[j] + '" customWidth="1"/>'; }
window.svXlsx.save('Purchase order ' + pono(r[0], r[1]) + ' - doc ' + r[2] + ' - ' + r[4] + ' - ordered ' + H.dmy(r[3]) + ' - to ' + r[5] + ' - shipping ' + H.dmy(r[7]) + ' - arrival ' + H.dmy(r[8]) +
(cost ? ' - goods value ' + fm((+r[17] || 0) / rate(), 2) + ' - expenses ' + fm((+r[20] || 0) / rate(), 2) + ' ' + (rate() === 1 ? curName(r[12]) : 'USD') + ' - USD @ ' + USD : '') + (PO.asof ? ' - data as of ' + PO.asof : ''),
head, lines, w + '</cols>', 'PO_' + r[0] + '_' + r[1] + '.xlsx', 'Purchase order');
}
}
function go(l) {
if (l === '0') { ITEM = null; ORD = null; PO = null; show(0); if (O.onGo) { O.onGo('0'); } return; }
if (l === '2') { PO = null; show(2); return; }
PO = null; show(0); if (O.onGo) { O.onGo(l); }
}
function onClick(e) {
var t = e.target, g, p;
while (t && t !== this && !(t.getAttribute && (t.getAttribute('data-go') || t.getAttribute('data-po')))) { t = t.parentNode; }
if (!t || t === this) { return; }
g = t.getAttribute('data-go'); p = t.getAttribute('data-po');
if (g === 'print') { doPrint(); return; }
if (g !== null && g !== '') { go(g); return; }
if (p) { p = p.split('/'); openPO(p[0], p[1]); }
}
window.poLevels = {
init: function (helpers, opts) {
H = helpers; O = opts || {};
$('ordPanel').addEventListener('click', onClick);
$('poPanel').addEventListener('click', onClick);
},
openItem: openItem,
openPO: openPO,
refresh: function () { if (LVL === 3 && PO) { renderPO(PO); } else if (LVL === 2 && ORD) { renderOrders(ORD); } },
open: function () { return LVL; },
excel: excel
};
})();
