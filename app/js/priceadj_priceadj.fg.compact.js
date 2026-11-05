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
window.addEventListener('beforeprint', function () {
var T = window.jmT || function (s) { return s; }, wrap = document.querySelector('.wrap'), p = window.paPrint || {}, box, css, d = new Date(),
z = function (n) { return (n < 10 ? '0' : '') + n; };
if (!wrap) { return; }
box = document.getElementById('jmPrintHead');
if (!box) { box = document.createElement('div'); box.id = 'jmPrintHead'; wrap.insertBefore(box, wrap.firstChild); }
box.innerHTML = '<div class="ph-top"><b class="ph-co"></b><span class="ph-at"></span></div><div class="ph-title"></div><div class="ph-meta"></div>';
box.querySelector('.ph-co').textContent = T('Co. Dashboard');
box.querySelector('.ph-at').textContent = T('Printed') + ' ' + z(d.getDate()) + '/' + z(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + z(d.getHours()) + ':' + z(d.getMinutes());
box.querySelector('.ph-title').textContent = p.title || '';
box.querySelector('.ph-meta').textContent = p.meta || '';
css = document.getElementById('jmPageCss');
if (!css) { css = document.createElement('style'); css.id = 'jmPageCss'; }
document.body.appendChild(css);
css.textContent = '@media print{@page{size:A4 ' + (document.body.classList.contains('pa-pdf-sales') ? 'portrait' : 'landscape') + ' !important;@top-right{content:none}@bottom-right{content:'
+ (window.JM_LANG === 'AR' ? '"\\0635 \\0641 \\062D \\0629  " counter(page) " \\0645 \\0646  " counter(pages)' : '"Page " counter(page) " of " counter(pages)')
+ ';font:8px sans-serif;color:#555}}}';
}, false);
window.paBulk = function (api) {
const $ = api.$, T = api.T, esc = api.esc, r4 = api.r4, dlg = api.dlg, edits = api.edits();
const shown = api.rows();
dlg('<h4>' + T('Bulk change') + '</h4><p>' + T('Applies to the items shown in the table now') + ' (<b>' + shown.length + '</b>), ' + T('on the current price of the default unit. The other units follow their factor.') + '</p>'
+ '<div class="grid"><div class="filter-group"><label>' + T('Change by') + '</label><select id="bkMode"><option value="P">' + T('Percent %') + '</option><option value="A">' + T('Amount') + '</option></select></div>'
+ '<div class="filter-group"><label>' + T('Value') + '</label><input type="text" class="val" id="bkVal" placeholder="5" inputmode="decimal"></div></div>'
+ '<div class="pa-note warn" id="bkNote">' + T('Important: a value with a minus sign lowers the prices (for example -5).') + '</div>'
+ '<label class="chk"><input type="checkbox" id="bkOver"> ' + T('Overwrite the prices already edited') + '</label>'
+ '<div class="res" id="bkRes"></div>'
+ '<div class="pa-row"><button type="button" class="pa-btn quiet" data-close>' + T('Close') + '</button><button type="button" class="pa-btn" id="bkGo">' + T('Apply to the draft') + '</button></div>', close => {
const calc = run => {
const mode = $('bkMode').value, v = parseFloat(String($('bkVal').value).replace(/,/g, '')), over = $('bkOver').checked;
let n = 0, skip = 0, bad = 0, none = 0;
const neg = !isNaN(v) && v < 0;
$('bkVal').classList.toggle('neg', neg);
$('bkNote').className = 'pa-note ' + (neg ? 'bad' : 'warn');
$('bkNote').textContent = neg ? T('Minus value: the prices of the items shown will be LOWERED.') : T('Important: a value with a minus sign lowers the prices (for example -5).');
if (isNaN(v)) { $('bkRes').innerHTML = T('Enter a value'); return; }
shown.forEach(r => {
if (edits[r.code] && !over) { skip++; return; }
if (!(r.cur > 0)) { none++; return; }
const nv = r4(mode === 'P' ? r.cur * (1 + v / 100) : r.cur + v);
if (!(nv > 0)) { bad++; return; }
n++;
if (run) { edits[r.code] = [nv, 'BULK']; }
});
$('bkRes').innerHTML = '<b>' + n + '</b> ' + T('items will change') + (skip ? ' &middot; ' + skip + ' ' + T('kept (edited already)') : '') + (none ? ' &middot; ' + none + ' ' + T('without a current price') : '') + (bad ? ' &middot; ' + bad + ' ' + T('refused (zero or below)') : '');
if (run && n) { close(); api.changed(); }
};
['bkMode', 'bkVal', 'bkOver'].forEach(id => { $(id).addEventListener('input', () => calc(false)); $(id).addEventListener('change', () => calc(false)); });
$('bkVal').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); calc(true); } });
$('bkGo').addEventListener('click', () => calc(true));
$('bkVal').focus();
});
};
window.paPaste = function (api) {
const $ = api.$, T = api.T, esc = api.esc, r4 = api.r4, dlg = api.dlg, edits = api.edits(), byCode = api.byCode();
dlg('<h4>' + T('Paste from Excel') + '</h4><p>' + T('Copy two columns from Excel: item code and the new price of the default unit, then paste them here. Only the items of this class are taken.') + '</p>'
+ '<textarea id="psTxt" placeholder="10501000110&#9;72.500"></textarea><div class="res" id="psRes"></div>'
+ '<div class="pa-row"><button type="button" class="pa-btn quiet" data-close>' + T('Close') + '</button><button type="button" class="pa-btn" id="psChk">' + T('Check') + '</button><button type="button" class="pa-btn" id="psGo" disabled>' + T('Apply to the draft') + '</button></div>', close => {
let good = [];
const check = () => {
const lines = String($('psTxt').value).split(/\r?\n/);
let notIn = [], bad = [];
good = [];
lines.forEach(l => {
if (!l.replace(/\s/g, '')) return;
const cells = l.indexOf('\t') !== -1 ? l.split('\t') : l.split(/[;,]/);
const c = String(cells[0] || '').trim(), v = parseFloat(String(cells[1] || '').replace(/,/g, '').trim());
if (!byCode[c]) { notIn.push(c || '?'); return; }
if (!(v > 0)) { bad.push(c); return; }
good.push([c, r4(v)]);
});
$('psRes').innerHTML = '<b>' + good.length + '</b> ' + T('lines ready') + (notIn.length ? '<br>' + notIn.length + ' ' + T('not in this class') + ': ' + esc(notIn.slice(0, 12).join(', ')) + (notIn.length > 12 ? ' ...' : '') : '')
+ (bad.length ? '<br>' + bad.length + ' ' + T('without a valid price') + ': ' + esc(bad.slice(0, 12).join(', ')) : '');
$('psGo').disabled = !good.length;
};
$('psChk').addEventListener('click', check);
$('psTxt').addEventListener('paste', () => setTimeout(check, 0));
$('psGo').addEventListener('click', () => { good.forEach(g => { edits[g[0]] = [g[1], 'PASTE']; }); close(); api.changed('EDITED'); });
$('psTxt').focus();
});
};
window.paExcel = function (c) {
const view = c.view, blines = c.blines, SEE = c.see;
if (!window.svXlsx) return;
let head, lines = [], W;
if (view === 'EDIT') {
head = ['Code', 'Item', 'Unit', 'Factor', 'Current price', 'New price', 'Change %'];
W = [16, 46, 12, 9, 14, 14, 10];
if (SEE) { head.push('Avg cost', 'Profit', 'Margin %'); W.push(14, 14, 10); }
c.rows.forEach(r => {
const s = [[r.code, 3], [r.name, 0], [r.unit, 0], [r.fac, 6], [r.cur == null ? '' : r.cur, r.cur == null ? 0 : 6], [r.np == null ? '' : r.np, r.np == null ? 0 : 6], [r.chg == null ? '' : r.chg, r.chg == null ? 0 : 2]];
if (SEE) s.push([r.cost == null ? '' : r.cost, r.cost == null ? 0 : 6], [r.prof == null ? '' : r.prof, r.prof == null ? 0 : 5], [r.mg == null ? '' : r.mg, r.mg == null ? 0 : 2]);
lines.push(s);
});
} else if (view === 'BLINES' && blines) {
head = ['Code', 'Item', 'Unit', 'Factor', 'Old price', 'New price', 'Result', 'Message'];
W = [16, 46, 12, 9, 14, 14, 12, 40];
(blines.rows || []).forEach(r => {
if (blines.status === 'DRAFT' || blines.status === 'CANCELLED') lines.push([[r[0], 3], [r[1] || '', 0], ['default', 0], [r[3], 6], [r[4] == null ? '' : r[4], r[4] == null ? 0 : 6], [r[5], 6], [r[7] || '', 0], ['', 0]]);
else lines.push([[r[0], 3], [r[1] || '', 0], [r[2] || '', 0], [r[3] == null ? '' : r[3], r[3] == null ? 0 : 6], [r[4] == null ? '' : r[4], r[4] == null ? 0 : 6], [r[5] == null ? '' : r[5], r[5] == null ? 0 : 6], [r[6] || '', 0], [r[7] || '', 0]]);
});
} else { return; }
let w = '<cols>';
W.forEach((x, i) => { w += '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + x + '" customWidth="1"/>'; });
window.svXlsx.save(c.info, head, lines, w + '</cols>', c.file, 'Prices');
};
window.paPrintNow = function (c) {
const T = c.T, esc = c.esc, fx = c.fx, st = c.blines ? c.blines.status : '', b = c.bsel, orig = document.title;
let mode = '', title = c.title, meta = c.cls ? T('Class') + ': ' + c.clsName : '', file = 'Price_Adjustment_' + c.stamp;
if (c.view === 'EDIT' || c.view === 'REVIEW') {
mode = 'pa-pdf-draft';
title = T('Price change draft') + (c.draftNo ? ' #' + c.draftNo : '') + (c.clsName ? ' - ' + c.clsName : '');
meta += (meta ? '  |  ' : '') + T('Draft - before approval');
file = 'Price_Change_Draft_' + (c.draftNo || c.cls) + '_' + c.stamp;
} else if (c.view === 'BLINES' && b && (st === 'APPLIED' || st === 'REVERSED')) {
mode = 'pa-pdf-sales';
title = T('Sales price list') + ' - ' + T('Price change') + ' #' + b[0] + (b[3] ? ' - ' + b[3] : '');
meta = '';
file = 'Price_List_Change_' + b[0] + '_' + c.stamp;
let last = '', body = '';
(c.blines.rows || []).forEach(r => {
if (r[6] !== 'WRITTEN' && r[6] !== 'REVERSED') { return; }
const same = r[0] === last;
last = r[0];
body += '<tr><td class="code">' + (same ? '' : esc(r[0])) + '</td><td class="nm">' + (same ? '' : esc(r[1])) + '</td><td>' + esc(r[2]) + '</td>'
+ '<td class="num">' + (r[4] == null ? '&mdash;' : fx(r[4])) + '</td><td class="num np-new">' + fx(r[5]) + '</td></tr>';
});
document.getElementById('tableHead').innerHTML = '<tr><th class="c-code">' + T('Code') + '</th><th>' + T('Item') + '</th><th class="c-unit">' + T('Unit') + '</th><th class="num">'
+ T('Old price') + '</th><th class="num">' + T('New price') + '</th></tr>';
document.getElementById('tableBody').innerHTML = body;
}
window.paPrint = { title: title, meta: meta };
document.title = file;
if (mode) { document.body.classList.add(mode); }
const restore = () => {
document.title = orig;
if (mode) { document.body.classList.remove(mode); }
if (mode === 'pa-pdf-sales') { c.render(); }
window.removeEventListener('afterprint', restore);
};
window.addEventListener('afterprint', restore);
window.print();
};
window.paFind = function (A) {
const inp = A.$('itemInput');
if (!inp) return;
inp.placeholder = A.T('Item code or name');
const m = document.createElement('div');
m.className = 'ss-menu'; m.id = 'itemMenu';
document.body.appendChild(m);
let hov = -1, seq = 0, tm = null, list = [];
const ar = () => window.JM_LANG === 'AR';
function place() {
const r = inp.getBoundingClientRect(), w = Math.min(Math.max(r.width, 680), window.innerWidth - 16), below = window.innerHeight - r.bottom - 12, above = r.top - 12, up = below < 220 && above > below;
m.style.width = w + 'px';
m.style.left = (ar() ? Math.max(8, r.right - w) : Math.min(r.left, window.innerWidth - w - 8)) + 'px';
m.style.maxHeight = Math.min(360, up ? above : below) + 'px';
m.style.top = up ? 'auto' : (r.bottom + 4) + 'px';
m.style.bottom = up ? (window.innerHeight - r.top + 4) + 'px' : 'auto';
}
function close() { m.classList.remove('open'); hov = -1; }
function draw(msg) {
m.innerHTML = list.length ? list.map((x, i) => '<div class="ss-option" data-i="' + i + '"><span class="ss-code">' + A.esc(x[0]) + '</span><span class="ss-n" title="' + A.esc(x[1] || x[2]) + '">'
+ A.esc(x[1] || x[2]) + '</span><span class="ss-cls">' + A.esc(A.clsName(x[3])) + '</span></div>').join('') : '<div class="ss-empty">' + A.esc(A.T(msg)) + '</div>';
hov = -1; place(); m.classList.add('open');
}
function look() {
const t = inp.value.trim();
if (t.length < 2 || (A.cls() && A.rows().length)) { close(); return; }
const my = ++seq;
list = []; draw('Searching...');
A.call({ x01: 'find', x02: t }, d => { if (my !== seq) return; list = d.rows || []; draw('No matching item'); },
e => { if (my !== seq) return; list = []; draw(String(e)); });
}
function pick(i) { const x = list[i]; if (!x) return; close(); A.pick(x[3], x[0]); }
inp.addEventListener('input', () => { clearTimeout(tm); tm = setTimeout(look, 300); });
inp.addEventListener('keydown', e => {
if (!m.classList.contains('open')) { if (e.key === 'Enter') { e.preventDefault(); clearTimeout(tm); look(); } return; }
const opts = m.querySelectorAll('.ss-option');
if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
e.preventDefault();
if (!opts.length) return;
hov = e.key === 'ArrowDown' ? Math.min(hov + 1, opts.length - 1) : Math.max(hov - 1, 0);
opts.forEach(o => o.classList.remove('active'));
opts[hov].classList.add('active');
opts[hov].scrollIntoView({ block: 'nearest' });
} else if (e.key === 'Enter') {
e.preventDefault();
if (opts.length) pick(hov >= 0 ? hov : 0);
} else if (e.key === 'Escape') {
close();
}
});
m.addEventListener('mousedown', e => { const o = e.target.closest('.ss-option'); if (o) { e.preventDefault(); pick(+o.getAttribute('data-i')); } });
document.addEventListener('click', e => { if (e.target !== inp && !(e.target.closest && e.target.closest('#itemMenu'))) close(); });
['scroll', 'resize'].forEach(ev => window.addEventListener(ev, e => { if (m.classList.contains('open') && !(e.target && e.target.closest && e.target.closest('#itemMenu'))) place(); }, true));
};
}());
