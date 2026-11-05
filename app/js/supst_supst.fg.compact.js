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
function pad(n) { return (n < 10 ? '0' : '') + n; }
function moLbl(m) { return m ? m.substr(5, 2) + '/' + m.substr(0, 4) : ''; }
function html(d, o) {
var h = d.h, L = d.lines, E = d.exp || [], inv = d.src === 'rcv', out = '', i, r, x, tq = 0, tv = 0, te = 0, post, rk, rcvs = {}, nr = 0, RATE = o.rate || 1, esc = o.esc, dmy = o.dmy,
t = new Date(), NOW = t.getFullYear() + '-' + pad(t.getMonth() + 1), ex = 0, sv = 0, al, ue, ld, sp, pf;
function fm(v, dd) {
var neg = v < 0, a = Math.abs(v), s, q = '', k, f = '';
if (dd === undefined) { dd = 2; }
s = a.toFixed(dd);
k = s.indexOf('.');
if (k >= 0) { f = s.substr(k); s = s.substr(0, k); }
while (s.length > 3) { q = ',' + s.substr(s.length - 3) + q; s = s.substr(0, s.length - 3); }
return (neg && Math.round(a * 100) ? '-' : '') + s + q + f;
}
function money(v) { v = +v || 0; return Math.round(v * 100) ? fm(v / RATE) : '<span class="z">0.00</span>'; }
function mz(v) { v = +v || 0; return Math.round(v * 100) ? fm(v / RATE) : '<span class="z">&mdash;</span>'; }
function kv(k, v, s) { return '<div class="oh-sec"><small>' + k + '</small><div class="oh-v">' + v + '</div>' + (s ? '<div class="oh-s">' + s + '</div>' : '') + '</div>'; }
function sumCol(c) { var j, s = 0; for (j = 0; j < E.length; j++) { s += +E[j][c] || 0; } return s; }
post = +h[23] ? (+h[24] === +h[23] ? '<span class="st ok">Posted</span>' : '<span class="st np">Not posted</span>') : '<span class="st req">Not received</span>';
for (i = 0; i < L.length; i++) { rk = L[i][10] + ':' + L[i][11]; if (inv && !rcvs[rk]) { rcvs[rk] = 1; nr++; } }
out += '<div class="oh"><div class="oh-band' + (inv ? ' inv' : '') + '"><div class="oh-b oh-b1"><small>' + (inv ? 'Purchase invoice' : 'Purchase order') + '</small><div class="oh-no">' + esc(h[2]) + '</div></div>' +
(inv ? '<div class="oh-b"><small>Invoice no.</small><div>' + (h[32] !== null ? h[32] + ' : ' + h[33] : '&mdash;') + (nr > 1 ? ' <span class="oh-since">+ ' + (nr - 1) + ' more</span>' : '') + '</div></div><div class="oh-b"><small>Order</small><div>' + h[0] + ' : ' + h[1] + '</div></div>' +
'<div class="oh-b"><small>Journal entry</small><div>' + (h[35] ? '<span class="jme-link" data-jme="' + h[35] + '">' + h[35].split('/').join(' / ') + '</span>' : '&mdash;') + '</div></div>'
: '<div class="oh-b"><small>Order no.</small><div>' + h[0] + ' : ' + h[1] + '</div></div>') +
'<div class="oh-b"><small>Order date</small><div>' + dmy(h[4]) + '</div></div>' +
'<div class="oh-b oh-bs"><small>Status</small><div>' + (h[31] === 'I' ? '<span class="st inv">Invoice - received</span>' : '<span class="st ord">Order - not received</span>') + (h[30] === 'X' ? '<span class="oh-since">expenses carried by this supplier on another supplier\'s order</span>' : '') + '</div></div>' +
(d.asof ? '<div class="oh-b oh-asof"><small>Data as of</small><div>' + esc(d.asof) + '</div></div>' : '') +
'<div class="oh-b oh-cur"><small>Currency</small><div class="oh-curv">' + (o.cur || 'SAR') + '</div></div></div>' +
'<div class="oh-grid">' + kv('Supplier', esc(h[5]), '') +
kv(inv ? 'Received' : 'Expected shipping', inv ? (h[26] ? dmy(h[26]) : '&mdash;') : (h[9] ? dmy(h[9]) : '&mdash;'), '') +
kv('Due month', moLbl(h[12]) + (h[12] && h[12] < NOW ? ' <i>passed</i>' : ''), '') +
kv('Credit', (h[11] === null ? '&mdash;' : h[11] + ' <i>days</i>'), '') +
kv('Vendor module', post, '') + '</div>' +
'<div class="oh-cost sp5">' + kv('Goods', money(h[13]), 'order lines: price - discounts, + VAT') +
kv('Expenses', money(h[16]), +h[14] ? 'freight + insurance of the receipt' : (+h[15] ? 'freight estimate on the order' : 'none')) +
kv('Amount', money(h[17]), 'goods + expenses') +
kv('Paid on the order', money(h[18]), h[19] ? 'last ' + dmy(h[19]) : 'no advance payment') +
'<div class="oh-sec tot"><small>Balance</small><div class="oh-v">' + money(h[21]) + '</div><div class="oh-s">' + (+h[20] ? 'paid on the invoice ' + fm(+h[20] / RATE) + ' - open ' + fm(+h[22] / RATE) : 'amount - paid on the order') + '</div></div></div>';
out += '<div class="oh-notes"><b>Code</b> ' + h[6] + (h[3] ? ' &nbsp; <b>Supplier inv.</b> ' + esc(h[3]) : '') + (+h[23] ? ' &nbsp; <b>Receipt</b> ' + esc(h[25]) + (h[34] ? ' &nbsp; <b>Receipt inv.</b> ' + esc(h[34]) : '') : '') +
(inv ? ' &nbsp; <b>Expected shipping</b> ' + dmy(h[9]) + (h[10] ? ' &nbsp; <b>Arrival</b> ' + dmy(h[10]) : '') : (h[10] ? ' &nbsp; <b>Arrival</b> ' + dmy(h[10]) : '')) +
' &nbsp; <b>Lines</b> ' + L.length + (+h[27] !== 1 ? ' &nbsp; <b>Order currency</b> ' + h[27] + ' @ ' + h[28] : '') + '</div>';
out += '</div>';
for (i = 0; i < E.length; i++) { ex += (+E[i][11] || 0) - (+E[i][10] || 0); }
for (i = 0; i < L.length; i++) { sv += +L[i][8]; }
out += '<h4 class="oh-h4">' + (inv ? 'Invoice items - import card' : 'Order items') + '</h4>';
if (inv) {
out += '<div class="table-scroll"><table id="invLines" class="card"><thead><tr><th>#</th>' + (nr > 1 ? '<th>Invoice</th>' : '') + '<th>Code</th><th>Item</th><th>Unit</th><th class="num">Qty</th><th class="num">Price</th><th class="num">Purchase</th><th class="num">Disc.</th><th class="num">Import cost</th><th class="num">Cost / unit</th><th class="num">Landed / unit</th><th class="num">Sale price</th><th class="num">Profit / unit</th><th class="num">Profit %</th></tr></thead><tbody>';
for (i = 0; i < L.length; i++) {
r = L[i]; tq += +r[4]; tv += +r[8];
al = sv ? ex * (+r[8]) / sv : 0; te += al; ue = +r[4] ? al / (+r[4]) : 0; ld = +r[5] + ue; sp = r[12] === null || r[12] === undefined ? null : +r[12]; pf = sp === null ? null : sp - ld;
out += '<tr><td class="c-code">' + (i + 1) + '</td>' + (nr > 1 ? '<td class="c-code">' + r[10] + ' : ' + r[11] + '</td>' : '') + '<td class="c-code">' + esc(r[1]) + '</td><td class="iname">' + esc(r[2]) + '</td><td>' + esc(r[3]) + '</td><td class="num">' + fm(+r[4], 0) + '</td>' +
'<td class="num">' + fm(+r[5] / RATE, 2) + '</td><td class="num">' + money(r[8]) + '</td><td class="num">' + mz(r[6]) + '</td><td class="num">' + money(al) + '</td><td class="num">' + fm(ue / RATE, 2) + '</td><td class="num tot">' + fm(ld / RATE, 2) + '</td>' +
'<td class="num">' + (sp === null ? '<span class="z">&mdash;</span>' : fm(sp / RATE, 2)) + '</td><td class="num' + (pf !== null && pf < 0 ? ' neg' : '') + '">' + (pf === null ? '<span class="z">&mdash;</span>' : fm(pf / RATE, 2)) + '</td><td class="num' + (pf !== null && pf < 0 ? ' neg' : '') + '">' + (pf === null || !sp ? '<span class="z">&mdash;</span>' : (100 * pf / sp).toFixed(2)) + '</td></tr>';
}
if (!L.length) { out += '<tr><td colspan="' + (14 + (nr > 1 ? 1 : 0)) + '" class="z" style="text-align:center;padding:16px">No lines</td></tr>'; }
out += '</tbody><tfoot><tr class="tot"><td colspan="' + (4 + (nr > 1 ? 1 : 0)) + '">Total</td><td class="num">' + fm(tq, 0) + '</td><td></td><td class="num">' + fm(tv / RATE) + '</td><td></td><td class="num">' + fm(te / RATE) + '</td><td colspan="5"></td></tr></tfoot></table></div>';
} else {
out += '<div class="table-scroll"><table id="invLines"><thead><tr><th>#</th><th>Code</th><th>Item</th><th>Unit</th><th class="num">Qty</th><th class="num">Price</th><th class="num">Discount</th><th class="num">VAT</th><th class="num">Total</th></tr></thead><tbody>';
for (i = 0; i < L.length; i++) {
r = L[i]; tq += +r[4]; tv += +r[8];
out += '<tr><td class="c-code">' + (i + 1) + '</td><td class="c-code">' + esc(r[1]) + '</td><td class="iname">' + esc(r[2]) + '</td><td>' + esc(r[3]) + '</td><td class="num">' + fm(+r[4], 0) + '</td><td class="num">' + fm(+r[5] / RATE, 2) + '</td><td class="num">' + mz(r[6]) + '</td><td class="num">' + mz(r[7]) + '</td><td class="num">' + money(r[8]) + '</td></tr>';
}
if (!L.length) { out += '<tr><td colspan="9" class="z" style="text-align:center;padding:16px">No lines</td></tr>'; }
out += '</tbody><tfoot><tr class="tot"><td colspan="4">Total</td><td class="num">' + fm(tq, 0) + '</td><td></td><td></td><td></td><td class="num">' + fm(tv / RATE) + '</td></tr></tfoot></table></div>';
}
out += '<h4 class="oh-h4">' + (inv ? 'Expenses - on the receipt' : 'Expenses - estimate on the order') + '</h4>';
if (!E.length) { out += '<div class="dr-none">No expense rows</div>'; }
else {
out += '<div class="table-scroll"><table class="po-exp"><thead><tr><th>#</th><th>Expense supplier</th><th>Doc no.</th>' + (inv ? '<th>Inv. date</th>' : '') + '<th class="num">Freight</th><th class="num">Customs</th><th class="num">Transport</th><th class="num">Insurance</th><th class="num">Commission</th><th class="num">Other</th><th class="num">VAT</th><th class="num">Total</th></tr></thead><tbody>';
for (i = 0; i < E.length; i++) {
r = E[i];
out += '<tr><td class="c-code">' + (i + 1) + '</td><td>' + esc(r[2]) + (String(r[3]) === String(h[6]) ? '' : ' <i class="brn">other supplier</i>') + (r[16] ? ' <i class="brn">' + esc(r[16]) + '</i>' : '') + '</td><td class="c-code">' + esc(r[14] || '') + '</td>' + (inv ? '<td class="c-code">' + dmy(r[15]) + '</td>' : '') +
'<td class="num">' + mz(r[4]) + '</td><td class="num">' + mz(r[5]) + '</td><td class="num">' + mz(r[7]) + '</td><td class="num">' + mz(r[6]) + '</td><td class="num">' + mz(r[8]) + '</td><td class="num">' + mz(r[9]) + '</td><td class="num">' + mz(r[10]) + '</td><td class="num tot">' + mz(r[11]) + '</td></tr>';
}
out += '</tbody><tfoot><tr class="tot"><td colspan="' + (inv ? 4 : 3) + '">Total expenses</td>';
for (x = 0; x < 7; x++) { out += '<td class="num">' + mz(sumCol([4, 5, 7, 6, 8, 9, 10][x])) + '</td>'; }
out += '<td class="num">' + fm(sumCol(11) / RATE) + '</td></tr></tfoot></table></div>';
}
return out;
}
window.spInvoice = { html: html };
})();
(function () {
var PM = { 2: 'Cash', 4: 'Cheque', 5: 'Accounts', 6: 'Transfer' };
function html(d, c) {
var H = d.h, N = d.lines || [], I = d.inv || [], O = d.po || [], B = d.by || [], esc = c.esc, dmy = c.dmy, fm = c.fm, cell = c.cell, pc = c.pc, has = c.has,
h, i, r, k, ti = 0, tp = 0, tb = 0, tv = 0, tx = 0, tt = 0, tr = 0, raw = +H[5], amt = Math.abs(raw), isPay = H[10] === 'PAY', rest, cur = !has(H[11]) || +H[11] === 1 ? 'SAR' : 'Currency ' + H[11];
h = '<div class="oh"><div class="oh-band"><div class="oh-b oh-b1"><small>' + c.typeOf(H[2], H[10]) + '</small><div class="oh-no">' + H[2] + ' / ' + H[3] + '</div></div>' +
'<div class="oh-b"><small>Date</small><div>' + dmy(H[4]) + '</div></div>' +
'<div class="oh-b oh-sup"><small>Supplier ' + H[0] + '</small><div>' + esc(H[1] || '') + '</div></div>' +
'<div class="oh-b"><small>Payment method</small><div>' + (has(H[27]) ? (PM[+H[27]] || 'Method ' + H[27]) : '&mdash;') + '</div></div>' +
'<div class="oh-b oh-bs"><small>Journal entry</small><div>' + (H[8] ? '<span class="oh-ent jme-link" data-jme="' + H[23] + '/' + H[24] + '/' + H[25] + '" title="Open the journal entry">' + esc(H[8]) + '</span>' : '') +
(+H[6] ? '' : '<span class="st np">Not posted</span>') + '</div></div>' +
'<div class="oh-b oh-cur"><small>' + (raw < 0 ? 'Amount - credit' : 'Amount - debit') + (cur === 'SAR' ? '' : ' - ' + cur + ' @ ' + H[12]) + '</small><div class="oh-curv">' + fm(amt) + '</div></div></div>' +
'<div class="oh-notes pl">' + esc(H[9] || '') + (H[22] ? '<br>' + esc(H[22]) : '') + (H[7] ? '<br>' + esc(H[7]) : '') + '</div></div>';
if (N.length) {
h += '<h4 class="oh-h4">Details - invoices entered in this movement</h4><div class="table-scroll"><table id="movLines"><thead><tr><th>#</th><th>Invoice no.</th><th>Supplier doc.</th><th>Invoice date</th><th>Due date</th><th class="num">Value</th><th class="num">VAT</th><th class="num">Total</th><th class="num">Still open</th></tr></thead><tbody>';
for (i = 0; i < N.length; i++) {
r = N[i]; tv += +r[6]; tx += +r[7]; tt += +r[8]; tr += +r[9];
h += '<tr><td class="c-code">' + (has(r[0]) ? r[0] : i + 1) + '</td><td class="c-code">' + esc(r[1] || '') + '</td><td class="c-code">' + esc(r[2] || '') + '</td><td class="c-code">' + dmy(r[3]) + '</td><td class="c-code">' + dmy(r[4]) + '</td>' +
cell(r[6]) + cell(r[7]) + cell(r[8], 'tt') + cell(r[9]) + '</tr>';
}
h += '</tbody><tfoot><tr class="tot"><td colspan="5">Total - ' + N.length + (N.length === 1 ? ' invoice' : ' invoices') + '</td><td class="num">' + fm(tv) + '</td><td class="num">' + fm(tx) + '</td><td class="num">' + fm(tt) + '</td><td class="num">' + fm(tr) + '</td></tr></tfoot></table></div>';
}
if (raw > 0 && (isPay || I.length || O.length)) {
h += '<div class="two"><div><h4 class="oh-h4">' + (isPay ? 'Invoices paid by this voucher' : 'Invoices settled by this movement') + '</h4>';
if (I.length) {
h += '<div class="table-scroll"><table id="payInv"><thead><tr><th>Type</th><th>Doc no.</th><th>Date</th><th class="num">Value</th><th class="num">Settled here</th><th class="num">%</th></tr></thead><tbody>';
for (i = 0; i < I.length; i++) {
r = I[i]; ti += +r[7]; k = r[0] === 'ADJ' ? 'FX / adjustment' : (c.KIND[r[0]] || 'Movement');
h += '<tr><td><span class="ty ' + (r[0] || 'OTH') + '">' + k + '</span></td>' +
'<td class="c-code' + (has(r[10]) ? ' lnk" data-i="' + i + '" title="Open the purchase invoice' : has(r[1]) ? ' lnk" data-v="' + i + '" title="Open the movement' : '') + '">' + esc(c.payDoc(r)) + '</td><td class="c-code">' + dmy(r[3]) + '</td>' +
cell(r[6]) + cell(r[7], 'db') + '<td class="num">' + pc(+r[7], amt) + '</td></tr>';
}
h += '</tbody><tfoot><tr class="tot"><td colspan="4">Allocated to invoices</td><td class="num">' + fm(ti) + '</td><td class="num">' + pc(ti, amt) + '</td></tr></tfoot></table></div>';
} else { h += '<div class="dr-none bx">No invoice allocated to this ' + (isPay ? 'voucher' : 'movement') + '</div>'; }
h += '</div><div><h4 class="oh-h4">Purchase orders paid in advance</h4>';
if (O.length) {
h += '<div class="table-scroll"><table id="payPo"><thead><tr><th>Order</th><th>Order supplier</th><th class="num">Paid here</th><th class="num">%</th></tr></thead><tbody>';
for (i = 0; i < O.length; i++) {
r = O[i]; tp += +r[5];
h += '<tr><td class="c-code' + (has(r[1]) ? ' lnk" data-o="' + i + '" title="Open the purchase order or invoice' : '') + '">' + esc(r[0] || '') + '</td><td>' + esc(r[4] || (has(r[3]) ? 'Supplier ' + r[3] : '')) + '</td>' + cell(r[5], 'db') + '<td class="num">' + pc(+r[5], amt) + '</td></tr>';
}
h += '</tbody><tfoot><tr class="tot"><td colspan="2">Paid in advance on orders</td><td class="num">' + fm(tp) + '</td><td class="num">' + pc(tp, amt) + '</td></tr></tfoot></table></div>';
} else { h += '<div class="dr-none bx">No advance payment on a purchase order in this ' + (isPay ? 'voucher' : 'movement') + '</div>'; }
h += '</div></div>';
rest = c.r2(amt - ti - tp);
if (c.nz(rest)) { h += '<div class="alert wr">Not allocated to any invoice or order: ' + fm(rest) + ' (' + pc(rest, amt) + ' of the amount)</div>'; }
}
if (B.length || raw < 0) {
h += '<h4 class="oh-h4">Settled by</h4>';
if (B.length) {
h += '<div class="table-scroll"><table id="payBy"><thead><tr><th>Voucher</th><th>Date</th><th>Type</th><th>Description</th><th class="num">Settled</th><th class="num">%</th></tr></thead><tbody>';
for (i = 0; i < B.length; i++) {
r = B[i]; tb += +r[3];
h += '<tr><td class="c-code lnk" data-m="' + i + '" title="Open the movement">' + r[0] + '/' + r[1] + '</td><td class="c-code">' + dmy(r[2]) + '</td><td><span class="ty ' + (r[4] || 'OTH') + '">' + c.typeOf(r[0], r[4]) + '</span></td><td class="ds">' + esc(r[5] || '') + '</td>' + cell(r[3], 'db') + '<td class="num">' + pc(+r[3], amt) + '</td></tr>';
}
h += '</tbody><tfoot><tr class="tot"><td colspan="4">Settled</td><td class="num">' + fm(tb) + '</td><td class="num">' + pc(tb, amt) + '</td></tr>' +
(raw < 0 ? '<tr class="tot"><td colspan="4">Still open</td><td class="num">' + fm(amt - tb) + '</td><td class="num">' + pc(amt - tb, amt) + '</td></tr>' : '') + '</tfoot></table></div>';
} else { h += '<div class="dr-none bx">Not settled by any payment yet - open ' + fm(amt) + '</div>'; }
}
return h;
}
window.stMov = { html: html };
})();
