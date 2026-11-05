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
window.cuXl = function (S) {
var D = S.D, G = S.G, f = S.f, fm = S.fm, dmy = S.dmy, X = window.svXlsx, head, lines = [], i, r, b, e, u, m, L, H, t, per = dmy(D.from) + ' - ' + dmy(D.to), tail = S.grp + (D.asof ? ' - data as of ' + D.asof : '');
function cols(W, n) { var w = '<cols>', j; for (j = 0; j < n; j++) { w += '<col min="' + (j + 1) + '" max="' + (j + 1) + '" width="' + (W[j] || 14) + '" customWidth="1"/>'; } return w + '</cols>'; }
function nums(e) { return [[e.opn, 5], [e.db + e.pv, 5], [e.cr, 5], [S.bal(e), 5], [e.od, 5], [e.b[0], 5], [e.b[1], 5], [e.b[2], 5], [e.b[3], 5], [e.b[4], 5], [e.b[5], 5], [e.pn, 2], [e.pv, 5]]; }
var NH = ['Opening', 'Debit', 'Credit', 'Balance', 'Overdue', '0 - 30', '31 - 60', '61 - 90', '91 - 120', '121 - 150', 'Over 150', 'Docs not posted', 'Not posted value'];
var NW = [15, 15, 15, 15, 15, 13, 13, 13, 13, 13, 13, 10, 14];
function one(c) { var a = { opn: +c[6], db: +c[7], cr: +c[8], pv: +c[11], pn: +c[10], od: +c[19], b: [] }, j; for (j = 0; j < 6; j++) { a.b.push(+c[13 + j]); } return a; }
if (!X) { return; }
if (!f) {
head = ['Supervisor code', 'Supervisor', 'Salesman code', 'Salesman', 'Customers'].concat(NH);
for (i = 0; i < G.ord.length; i++) { u = G.ord[i]; for (b = 0; b < u.kl.length; b++) { m = u.kl[b]; lines.push([[u.code, 3], [u.name || '', 0], [m.code, 3], [m.name || '', 0], [m.n, 2]].concat(nums(m))); } }
X.save('Customer Statement - ' + per + ' - supervisors and salesmen, opening, movement, balance and aging' + (S.SHOW === 'O' ? ' - customers with overdue' : S.SHOW === 'N' ? ' - customers with unposted documents' : '') + tail,
head, lines, cols([12, 30, 12, 30, 10].concat(NW), head.length), 'Customer_Statement_' + D.from + '_' + D.to + '.xlsx', 'Supervisors');
return;
}
if (f.k === 'sup' || f.k === 'sm') {
L = [];
if (f.k === 'sm') { L = S.custList(S.getM(f.d)); } else { u = G.sup[f.d]; for (i = 0; i < u.kl.length; i++) { L = L.concat(S.custList(u.kl[i])); } }
head = ['Salesman', 'Code', 'Customer', 'Type', 'Credit limit'].concat(NH);
for (i = 0; i < L.length; i++) { r = L[i]; if (f.k === 'sm' && !S.keepC(r)) { continue; } lines.push([[r[5] || '', 3], [r[0], 3], [r[1] || '', 0], [+r[2] ? 'Cash' : 'Credit', 0], [+r[3], 5]].concat(nums(one(r)))); }
X.save('Customer Statement - ' + f.t + ' - ' + per + ' - customers, opening, movement, balance and aging' + tail, head, lines, cols([10, 16, 46, 8, 14].concat(NW), head.length), 'Customers_' + String(f.d).replace('*', 'all_') + '_' + D.from + '_' + D.to + '.xlsx', 'Customers');
return;
}
if (f.k === 'st') {
t = S.ST; e = t.e;
head = ['Date', 'Type', 'Doc no.', 'Description', 'Due date', 'Open on it', 'Debit', 'Credit', 'Balance', 'Note'];
b = +t.open;
lines.push([[dmy(t.from), 0], ['Opening balance', 0], ['', 0], ['', 0], ['', 0], ['', 0], ['', 0], ['', 0], [b, 5], ['', 0]]);
for (i = 0; i < t.all.length; i++) {
r = t.all[i]; b += (+r[10]) - (+r[11]); u = S.dueOf(r);
if (!S.keepR(r, u)) { continue; }
lines.push([[dmy(r[0]), 0], [S.KIND[r[1]] || r[1], 0], [S.docOf(r), 3], [r[9] || '', 0], [u ? dmy(u.d) : '', 0], [u ? u.open : '', 5], [+r[10], 5], [+r[11], 5], [S.r2(b), 5],
[(r[19] ? 'not posted to the customer ledger' : '') + (u && u.ovd ? u.late + ' days late' : ''), 0]]);
}
X.save('Customer Statement - ' + (t.c[1] || '') + ' (' + t.c[0] + ') - salesman ' + (t.c[7] || '') + ' - ' + dmy(t.from) + ' - ' + dmy(t.to) + ' - opening ' + fm(e.opn) + ' - debit ' + fm(e.db + e.pv) + ' - credit ' + fm(e.cr) + ' - balance as system ' + fm(S.bal(e)) + ' - as accounts ' + fm(S.bal(e) - e.pv) +
' - overdue ' + fm(e.od) + (S.KF ? ' - showing ' + S.KLBL[S.KF] + ' only' : '') + tail, head, lines, cols([12, 14, 18, 60, 12, 14, 14, 14, 15, 30], head.length), 'Customer_Statement_' + t.c[0] + '.xlsx', 'Statement');
return;
}
if (f.k === 'mv') {
H = f.d.h;
head = ['Section', 'Document', 'Type', 'Date', 'Value', 'Settled'];
for (i = 0; i < (f.d.set || []).length; i++) { r = f.d.set[i]; lines.push([['Settled by this movement', 0], [S.mdoc(r, 4), 3], [S.KIND[r[5]] || '', 0], [dmy(r[4]), 0], [+r[9], 5], [+r[10], 5]]); }
for (i = 0; i < (f.d.by || []).length; i++) { r = f.d.by[i]; lines.push([['Settled by', 0], [r[0] + ' / ' + r[1], 3], [S.KIND[r[5]] || '', 0], [dmy(r[4]), 0], ['', 0], [+r[7], 5]]); }
X.save((H[8] || 'Movement') + ' ' + H[2] + ' / ' + H[3] + ' - ' + (H[1] || H[0]) + ' - ' + dmy(H[6]) + ' - amount ' + fm(+H[9] || +H[10]) + (S.has(H[16]) ? ' - entry ' + H[14] + '/' + H[15] + '/' + H[16] : '') + tail,
head, lines, cols([26, 20, 16, 12, 15, 15], head.length), 'Movement_' + H[2] + '_' + H[3] + '.xlsx', 'Movement');
return;
}
H = f.d;
var EX = window.jmEntry.xl(H); head = EX.head; lines = EX.lines;
X.save('Journal entry ' + H.y + '/' + H.t + '/' + H.n + (H.dt ? ' - ' + dmy(H.dt) : '') + (H.ds ? ' - ' + H.ds : ''), head, lines, cols(EX.widths, head.length), 'Entry_' + H.y + '_' + H.t + '_' + H.n + '.xlsx', 'Entry');
};
window.cuMov = { html: function (d, S) {
var esc = S.esc, dmy = S.dmy, fm = S.fm, cell = S.cell, pc = S.pc, nz = S.nz, has = S.has, r2 = S.r2, iso = S.iso, pl = S.pl, KIND = S.KIND, PAYM = S.PAYM, mdoc = S.mdoc;
var H = d.h, S = d.set || [], B = d.by || [], amt = nz(H[9]) ? +H[9] : +H[10], h, i, r, ts = 0, tv = 0, tl = 0, p, dd;
h = '<div class="oh"><div class="oh-band"><div class="oh-b oh-b1"><small>' + esc(H[8] || KIND[H[7]] || 'Movement') + '</small><div class="oh-no">' + H[2] + ' / ' + H[3] + '</div></div>' +
'<div class="oh-b"><small>Date</small><div>' + dmy(H[6]) + '</div></div><div class="oh-b oh-sup"><small>Customer</small><div>' + esc(H[0] + ' - ' + (H[1] || '')) + '</div></div>' +
'<div class="oh-b"><small>Payment</small><div>' + (PAYM[+H[17]] || '-') + '</div></div>' +
'<div class="oh-b"><small>Journal entry</small><div>' + (has(H[16]) && +H[16] ? '<span class="oh-ent" data-e="1" title="Open the journal entry">' + H[14] + ' / ' + H[15] + ' / ' + H[16] + '</span>' : (+H[11] ? '-' : '<span class="st np">not posted</span>')) + '</div></div>' +
'<div class="oh-b oh-cur"><small>' + (nz(H[9]) ? 'Debit' : 'Credit') + '</small><div class="oh-curv">' + fm(amt) + '</div></div></div>' +
'<div class="oh-notes pl">' + (has(H[12]) ? '<i>Doc no. </i><b class="c-code">' + esc(H[12]) + '</b> &nbsp; ' : '') + esc(H[13] || '') + '</div></div>';
if (has(H[18])) { h += '<div class="pdesc">Sales document <b class="lnk2" data-d="1">' + H[18] + ' / ' + H[19] + '</b> - open it for the items' + (+H[20] ? ' <i>- payment term ' + H[20] + ' days</i>' : '') + '</div>'; }
if (S.length) {
h += '<div class="oh-h4">' + (H[7] === 'RCP' ? 'Invoices settled by this receipt' : 'Settled by this movement') + '</div><div class="table-scroll"><table><thead><tr><th>Document</th><th>Type</th><th>Date</th><th>Due date</th><th class="num">Value</th><th class="num">Settled here</th><th class="num">% of movement</th><th class="num">Left on it</th></tr></thead><tbody>';
for (i = 0; i < S.length; i++) {
r = S[i]; ts += +r[10]; tv += +r[9]; tl += Math.max(0, (+r[9]) - (+r[11]));
dd = '';
if (r[4] && r[5] === 'INV' && +r[8] > 0) { p = r[4].split('-'); dd = dmy(iso(new Date(+p[0], +p[1] - 1, +p[2] + (+r[8])))); }
h += '<tr><td class="c-code lnk" data-s="' + i + '">' + mdoc(r, 4) + '</td><td><span class="ty ' + (r[5] || 'OTH') + '">' + (KIND[r[5]] || '-') + '</span></td><td class="c-code">' + dmy(r[4]) + '</td><td class="c-code">' + dd + '</td>' +
cell(r[9]) + cell(r[10], 'db') + '<td class="num">' + pc(+r[10], amt) + '</td>' + cell(Math.max(0, (+r[9]) - (+r[11])), 'cr') + '</tr>';
}
h += '</tbody><tfoot><tr class="tot"><td colspan="4">Total - ' + pl(S.length, 'document') + '</td><td class="num">' + fm(tv) + '</td><td class="num">' + fm(ts) + '</td><td class="num">' + pc(ts, amt) + '</td><td class="num">' + fm(tl) + '</td></tr></tfoot></table></div>';
}
if (H[7] !== 'INV' && nz(r2(amt - ts))) { h += '<div class="alert wr" style="margin-top:10px">&#9888; ' + fm(amt - ts) + ' of this movement is not allocated to any invoice' + (S.length ? '' : ' - no invoice was chosen when it was entered') + '.</div>'; }
if (B.length) {
ts = 0;
h += '<div class="oh-h4">Settled by</div><div class="table-scroll"><table><thead><tr><th>Movement</th><th>Type</th><th>Doc no.</th><th>Date</th><th class="num">Settled</th><th class="num">% of this document</th></tr></thead><tbody>';
for (i = 0; i < B.length; i++) { r = B[i]; ts += +r[7]; h += '<tr><td class="c-code lnk" data-b="' + i + '">' + r[0] + ' / ' + r[1] + '</td><td><span class="ty ' + (r[5] || 'OTH') + '">' + (KIND[r[5]] || '-') + '</span></td><td class="c-code">' + esc(r[6] || '') + '</td><td class="c-code">' + dmy(r[4]) + '</td>' + cell(r[7], 'db') + '<td class="num">' + pc(+r[7], amt) + '</td></tr>'; }
h += '</tbody><tfoot><tr class="tot"><td colspan="4">Total - ' + pl(B.length, 'movement') + '</td><td class="num">' + fm(ts) + '</td><td class="num">' + pc(ts, amt) + '</td></tr></tfoot></table></div>';
if (nz(r2(amt - ts))) { h += '<div class="pdesc" style="margin-top:8px">Left open on this document by its allocations: <b>' + fm(amt - ts) + '</b></div>'; }
}
return h;
} };
window.cuSS = function (inp, src, pick) {
var box = document.createElement('div'), L = [], cur = -1, open = false, tm = null;
function esc(s) { return String(s === null || s === undefined ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function paint() {
var h = '', i;
for (i = 0; i < L.length; i++) { h += '<div class="ss-it' + (i === cur ? ' on' : '') + '" data-i="' + i + '"><code>' + esc(L[i][0]) + '</code><span>' + esc(L[i][1]) + '</span><em>' + esc(L[i][2]) + '</em></div>'; }
box.innerHTML = h || '<div class="ss-no">No customer matches</div>';
box.style.display = ''; open = true;
var e = box.children[cur];
if (e && e.offsetTop < box.scrollTop) { box.scrollTop = e.offsetTop; }
else if (e && e.offsetTop + e.offsetHeight > box.scrollTop + box.clientHeight) { box.scrollTop = e.offsetTop + e.offsetHeight - box.clientHeight; }
}
function close() { box.style.display = 'none'; open = false; cur = -1; }
function go(i) { var r = L[i]; if (!r) { return; } close(); pick(r[0]); }
function val() { return (inp.value || '').replace(/^\s+|\s+$/g, ''); }
function look() {
var q = val();
clearTimeout(tm);
if (q.length < 2) { close(); return; }
tm = setTimeout(function () { src(q, function (rows) { if (val() !== q || document.activeElement !== inp) { return; } L = rows || []; cur = L.length ? 0 : -1; paint(); }); }, 220);
}
box.className = 'ss-list'; box.style.display = 'none';
inp.parentNode.appendChild(box);
inp.addEventListener('input', look);
inp.addEventListener('focus', look);
inp.addEventListener('keydown', function (e) {
var k = e.keyCode;
if (k === 13) { e.preventDefault(); if (open) { go(cur); } return; }
if (!open) { return; }
if (k === 40) { cur = Math.min(L.length - 1, cur + 1); paint(); e.preventDefault(); }
else if (k === 38) { cur = Math.max(0, cur - 1); paint(); e.preventDefault(); }
else if (k === 27) { close(); }
});
box.addEventListener('mousedown', function (e) {
var t = e.target;
while (t && t !== box && !(t.getAttribute && t.getAttribute('data-i') !== null)) { t = t.parentNode; }
e.preventDefault();
if (t && t !== box) { go(+t.getAttribute('data-i')); }
});
inp.addEventListener('blur', function () { setTimeout(close, 150); });
};
(function () {
window.addEventListener('beforeprint', function () {
var b = document.body, pt = document.getElementById('stPTitle'), h, s, d = new Date(), st, rows = 0, i, t, k, H,
p = function (n) { return (n < 10 ? '0' : '') + n; }, T = window.jmT || function (x) { return x; };
if (b.className.indexOf('st-print') === -1) { return; }
if (pt && pt.querySelector('.pt-h')) {
h = pt.querySelector('.pt-h'); s = pt.querySelector('.pt-s');
pt.innerHTML = '<div class="ph-top"><b class="ph-co"></b><span></span></div><div class="ph-title"></div><div class="ph-meta">' + (s ? s.innerHTML : '') + '</div>';
pt.querySelector('.ph-co').textContent = h.querySelector('b') ? h.querySelector('b').textContent : T('Co. Dashboard');
pt.querySelector('.ph-top span').textContent = T('Printed ' + p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()));
pt.querySelector('.ph-title').textContent = h.textContent.replace(/^[^|]*\|\s*/, '');
}
st = document.getElementById('stFitCss');
if (!st) { st = document.createElement('style'); st.id = 'stFitCss'; }
b.appendChild(st); st.textContent = '';
t = document.querySelectorAll('.wrap table');
for (i = 0; i < t.length; i++) { if (t[i].offsetParent !== null) { rows += t[i].querySelectorAll('tbody tr, tfoot tr').length; } }
H = 700 - (b.className.indexOf('st-lvl1') === -1 ? 160 : 260);
k = Math.min(H / Math.max(rows, 1) / 22, 1.15);
if (k >= 0.8 && Math.abs(k - 1) > 0.01) {
st.textContent = '@media print{body.st-print table,body.st-print tbody td{font-size:' + (10 * k).toFixed(1) + 'px !important}'
+ 'body.st-print tbody td{padding:' + (3 * k).toFixed(1) + 'px 7px !important}body.st-print .panel{margin-bottom:0 !important}}';
}
}, false);
}());
