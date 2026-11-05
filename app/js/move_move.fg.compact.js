var MV_CRC = (function () {
var t = [], c, n, k;
for (n = 0; n < 256; n++) { c = n; for (k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c >>> 0; }
return t;
})();
function mvCrc32(u8) {
var c = 0xFFFFFFFF;
for (var i = 0; i < u8.length; i++) c = MV_CRC[(c ^ u8[i]) & 0xFF] ^ (c >>> 8);
return (c ^ 0xFFFFFFFF) >>> 0;
}
function mvZipStore(files) {
var enc = new TextEncoder(), parts = [], cd = [], off = 0;
function u16(v) { return [v & 255, (v >> 8) & 255]; }
function u32(v) { return [v & 255, (v >> 8) & 255, (v >> 16) & 255, (v >>> 24) & 255]; }
files.forEach(function (f) {
var name = enc.encode(f.n), data = enc.encode(f.d), crc = mvCrc32(data);
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
window.mvXmlEsc = function (s) {
return String(s === null || s === undefined ? '' : s).replace(/[&<>"]/g, function (m) {
return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m];
}).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
};
window.mvColRef = function (i) {
var s = '';
i++;
while (i > 0) { var m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); }
return s;
};
window.mvXlsxBlob = function (sheetName, sheet) {
var styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
'<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
'<numFmts count="2"><numFmt numFmtId="164" formatCode="#,##0.0"/><numFmt numFmtId="165" formatCode="#,##0.00"/></numFmts>' +
'<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>' +
'<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>' +
'<fill><patternFill patternType="solid"><fgColor rgb="FFE8EAF6"/></patternFill></fill></fills>' +
'<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
'<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
'<cellXfs count="6">' +
'<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
'<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>' +
'<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
'<xf numFmtId="49" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
'<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
'<xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
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
'<sheets><sheet name="' + mvXmlEsc(sheetName) + '" sheetId="1" r:id="rId1"/></sheets></workbook>' },
{ n: 'xl/_rels/workbook.xml.rels', d: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
'<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
'</Relationships>' },
{ n: 'xl/worksheets/sheet1.xml', d: sheet },
{ n: 'xl/styles.xml', d: styles }
];
return mvZipStore(files);
};
document.addEventListener('DOMContentLoaded', function () {
function jsonEl(id) { var e = document.getElementById(id); try { return e ? JSON.parse(e.textContent) : null; } catch (x) { return null; } }
var META = jsonEl('mv-meta') || {}, I18N = jsonEl('mv-i18n') || {}, CLASSES = jsonEl('mv-classes') || [];
var modeEl = document.getElementById('mvMode'), panel = document.getElementById('mvCostPanel');
if (!META.cost || !modeEl || !panel) return;
modeEl.style.display = '';
var SEP = String.fromCharCode(8250), DASH = String.fromCharCode(8211);
var BR = I18N.br || {}, SCOPES = ['C', 'CEN', 'DHB', 'WST', 'EST', 'NTH'], SC0 = 'C';
if (I18N.sc && I18N.sc.length) { SCOPES = I18N.sc; SC0 = SCOPES[0]; }
var QUICK = ['1M', '3M', '6M', 'YTD', '12M'], CLN = {};
CLASSES.forEach(function (c) { CLN[String(c.c)] = c.n; });
var S = { on: false, from: '', to: META.today, scope: SC0, quick: 'YTD', cls: '', lvl: 1, L1: null, L2: null, busy: false, badge: '' };
var CACHE = {};
var E = {};
['mvcFrom', 'mvcTo', 'mvcQuick', 'mvcClass', 'mvcReset', 'mvcScope', 'mvCostFilters', 'mvCostStrip', 'mvcTitle', 'mvcNote', 'mvcHint',
'mvcBack', 'mvcPF', 'mvcHead', 'mvcBody', 'periodBadge'].forEach(function (id) { E[id] = document.getElementById(id); });
function p2(v) { return (v < 10 ? '0' : '') + v; }
function dmy(iso) { return iso ? iso.slice(8, 10) + '/' + iso.slice(5, 7) + '/' + iso.slice(0, 4) : ''; }
function esc(s) { return String(s === null || s === undefined ? '' : s).replace(/[&<>"]/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]; }); }
function r2(v) { return Math.round((v || 0) * 100) / 100; }
function n2(v) { return r2(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function pct(a, b) { return b ? (100 * a / b).toFixed(1) + '%' : '-'; }
function isoDate(d) { return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); }
function dayBefore(iso) { var d = new Date(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)); d.setDate(d.getDate() - 1); return isoDate(d); }
function quickFrom(k, to) {
var y = +to.slice(0, 4), m = +to.slice(5, 7), n = { '1M': 0, '3M': 2, '6M': 5, '12M': 11 }[k];
if (k === 'YTD') return y + '-01-01';
m -= n; while (m < 1) { m += 12; y--; }
return y + '-' + p2(m) + '-01';
}
function clamp() {
var min = META.minD || '2023-01-01';
if (!S.to || S.to > META.today) S.to = META.today;
if (!S.from) S.from = quickFrom('YTD', S.to);
if (S.from < min) S.from = min;
if (S.from > S.to) S.from = S.to;
E.mvcFrom.value = S.from; E.mvcTo.value = S.to;
}
function scopeTxt() { return BR[S.scope] || S.scope; }
function periodTxt() { return dmy(S.from) + ' ' + DASH + ' ' + dmy(S.to); }
function purchLabel() { return S.scope === 'C' ? 'PURCHASES<br>(NET COST)' : 'RECEIPTS<br>(NET COST)'; }
function chipRow(el, keys, cur, lbl, onPick) {
var h = '';
keys.forEach(function (k) { h += '<span class="sk-chip' + (k === cur ? ' on' : '') + '" data-k="' + k + '"><button type="button" class="ck">' + esc(lbl(k)) + '</button></span>'; });
el.innerHTML = h;
Array.prototype.forEach.call(el.querySelectorAll('.sk-chip'), function (c) {
c.addEventListener('click', function () { onPick(c.getAttribute('data-k')); });
});
}
function paintChips() {
chipRow(E.mvcQuick, QUICK, S.quick, function (k) { return k; }, function (k) { S.quick = k; S.from = quickFrom(k, S.to); clamp(); paintChips(); reload(); });
chipRow(E.mvcScope, SCOPES, S.scope, function (k) { return BR[k] || k; }, function (k) { if (k !== S.scope) { S.scope = k; paintChips(); reload(); } });
}
(function () {
var h = '<option value="">All Classes</option>';
CLASSES.forEach(function (c) { h += '<option value="' + esc(String(c.c)) + '">' + esc(String(c.c)) + ' - ' + esc(c.n) + '</option>'; });
E.mvcClass.innerHTML = h;
})();
E.mvcFrom.min = META.minD || '2023-01-01'; E.mvcTo.min = META.minD || '2023-01-01'; E.mvcTo.max = META.today; E.mvcFrom.max = META.today;
E.mvcFrom.addEventListener('change', function () { S.from = E.mvcFrom.value; S.quick = ''; clamp(); paintChips(); reload(); });
E.mvcTo.addEventListener('change', function () { S.to = E.mvcTo.value; if (S.quick) S.from = quickFrom(S.quick, S.to); clamp(); reload(); });
E.mvcClass.addEventListener('change', function () { S.cls = E.mvcClass.value; S.lvl = S.cls ? 2 : 1; reload(); });
E.mvcReset.addEventListener('click', function () { S.to = META.today; S.quick = 'YTD'; S.from = quickFrom('YTD', S.to); S.scope = SC0; S.cls = ''; S.lvl = 1; E.mvcClass.value = ''; clamp(); paintChips(); reload(); });
E.mvcBack.addEventListener('click', function () { S.lvl = 1; S.cls = ''; E.mvcClass.value = ''; load(); });
Array.prototype.forEach.call(modeEl.querySelectorAll('.vw-b'), function (b) {
b.addEventListener('click', function () { setMode(b.getAttribute('data-m') === 'c'); });
});
function setMode(on) {
if (on === S.on) return;
S.on = on;
Array.prototype.forEach.call(modeEl.querySelectorAll('.vw-b'), function (b) { b.classList.toggle('on', (b.getAttribute('data-m') === 'c') === on); });
document.body.classList.toggle('mv-cost', on);
E.mvCostFilters.style.display = on ? '' : 'none';
panel.style.display = on ? '' : 'none';
E.mvCostStrip.style.display = on ? '' : 'none';
if (on) {
S.badge = E.periodBadge ? E.periodBadge.textContent : '';
load();
} else if (E.periodBadge) {
E.periodBadge.textContent = S.badge;
}
}
function reload() { if (S.on) load(); }
function take(lvl, cls, d) {
S.from = d.from; S.to = d.to; S.scope = d.scope; clamp();
if (lvl === 2) S.L2 = { cls: cls, d: d }; else S.L1 = d;
paint();
}
function load() {
var lvl = S.lvl, cls = S.cls, key = S.from + '|' + S.to + '|' + S.scope + '|' + lvl + '|' + (lvl === 2 ? cls : '');
if (CACHE[key]) { take(lvl, cls, CACHE[key]); return; }
S.busy = true; E.mvcNote.style.display = ''; panel.classList.add('ld');
apex.server.process('MOVE_COST_AJAX', { x01: lvl === 2 ? 'itm' : 'cls', x02: S.from, x03: S.scope, x04: S.to, x05: lvl === 2 ? cls : '' }, {
success: function (d) {
S.busy = false; E.mvcNote.style.display = 'none'; panel.classList.remove('ld');
if (!d || d.error) { E.mvcBody.innerHTML = '<tr><td colspan="7">' + esc(d && d.error ? d.error : 'No data') + '</td></tr>'; return; }
CACHE[key] = d;
take(lvl, cls, d);
},
error: function () { S.busy = false; E.mvcNote.style.display = 'none'; panel.classList.remove('ld'); E.mvcBody.innerHTML = '<tr><td colspan="7">Request failed</td></tr>'; }
});
}
function model(r) {
var pu = r[3] + (S.scope === 'C' ? 0 : r[4]);
return { k: r[0], n: r[1], op: r[2], pu: pu, sa: r[5], cl: r[7], ad: r[7] - r[2] - pu + r[6] };
}
function current() {
var d = S.lvl === 2 && S.L2 ? S.L2.d : S.L1, rows = [], res = null, t = { op: 0, pu: 0, sa: 0, cl: 0, ad: 0 };
if (!d) return null;
d.rows.forEach(function (r) { var m = model(r); rows.push(m); t.op += m.op; t.pu += m.pu; t.sa += m.sa; t.cl += m.cl; t.ad += m.ad; });
if (d.res && d.res[6] > 0) {
res = model([null, null, d.res[0], d.res[1], d.res[2], d.res[3], d.res[4], d.res[5]]); res.n = d.res[6];
if (r2(res.op) || r2(res.pu) || r2(res.sa) || r2(res.cl) || r2(res.ad)) { t.op += res.op; t.pu += res.pu; t.sa += res.sa; t.cl += res.cl; t.ad += res.ad; } else res = null;
}
return { d: d, rows: rows, res: res, t: t };
}
function titleTxt() { return 'Item Movement - Cost - ' + scopeTxt() + ' - ' + periodTxt() + (S.lvl === 2 ? ' - ' + S.cls + ' ' + (CLN[S.cls] || '') : ''); }
function adjCell(v, tag) {
var c = r2(v);
if (!c) return '<' + tag + ' class="num" style="color:#bbb">0.00</' + tag + '>';
return '<' + tag + ' class="num ' + (c < 0 ? 'neg' : 'pos') + '">' + (c > 0 ? '+' : '') + n2(c) + '</' + tag + '>';
}
function numCell(v) { var c = r2(v); return '<td class="num' + (c < 0 ? ' neg' : '') + '">' + n2(c) + '</td>'; }
function paint() {
var C = current(), lvl2 = S.lvl === 2, h, t;
if (!C) return;
t = C.t;
if (E.periodBadge) E.periodBadge.textContent = periodTxt() + ' ' + String.fromCharCode(183) + ' Cost view';
if (lvl2) {
E.mvcTitle.innerHTML = '<a id="mvcUp">Cost ' + String.fromCharCode(183) + ' ' + esc(scopeTxt()) + '</a><span class="sep">' + SEP + '</span><b>' + esc(S.cls) + ' ' + esc(CLN[S.cls] || '') + '</b>';
document.getElementById('mvcUp').addEventListener('click', function () { E.mvcBack.click(); });
} else {
E.mvcTitle.innerHTML = 'Item Movement ' + DASH + ' Cost <span class="cv-note">' + String.fromCharCode(183) + ' SAR at cost ' + String.fromCharCode(183) + ' ' + esc(scopeTxt()) + ' ' + String.fromCharCode(183) + ' ' + periodTxt() + '</span>';
}
E.mvcBack.style.display = lvl2 ? '' : 'none';
E.mvcHint.style.display = lvl2 ? 'none' : '';
E.mvcPF.innerHTML = '<b>Period:</b> ' + periodTxt() + ' &nbsp;|&nbsp; <b>Scope:</b> ' + esc(scopeTxt()) + ' &nbsp;|&nbsp; <b>Values:</b> SAR at cost (system cost script, all lots)' + ' &nbsp;|&nbsp; <b>Loaded:</b> ' + esc(META.asOf || '-');
var chg = t.op ? 100 * (t.cl - t.op) / t.op : 0;
E.mvCostStrip.innerHTML =
'<div class="cv-box op"><div class="l">Opening value</div><div class="v">' + n2(t.op) + '</div><div class="s">at ' + dmy(dayBefore(S.from)) + '</div></div>' +
'<div class="cv-box pu"><div class="l">' + (S.scope === 'C' ? 'Purchases (net cost)' : 'Receipts (net cost)') + '</div><div class="v">' + n2(t.pu) + '</div><div class="s">' + pct(t.pu, t.op) + ' of opening</div></div>' +
'<div class="cv-box sa"><div class="l">Sales (COGS)</div><div class="v">' + n2(t.sa) + '</div><div class="s">' + pct(t.sa, t.op + t.pu) + ' of available stock</div></div>' +
'<div class="cv-box cl"><div class="l">Closing value</div><div class="v">' + n2(t.cl) + '</div><div class="s">' + (chg >= 0 ? '+' : '') + chg.toFixed(1) + '% vs opening ' + String.fromCharCode(183) + ' adj ' + n2(t.ad) + '</div></div>';
E.mvcHead.innerHTML = '<tr>' + (lvl2 ? '<th>ITEM CODE</th><th>DESCRIPTION</th>' : '<th>CLASS</th><th>DESCRIPTION</th>') +
'<th class="num">OPENING<br>VALUE</th><th class="num">' + purchLabel() + '</th><th class="num">SALES<br>(COGS)</th><th class="num">ADJUST-<br>MENTS +/-</th><th class="num">CLOSING<br>VALUE</th></tr>';
h = '';
C.rows.forEach(function (m) {
h += '<tr>' + (lvl2 ? '<td class="cd">' + esc(m.k) + '</td><td class="dsc" title="' + esc(m.n) + '">' + esc(m.n) + '</td>'
: '<td class="cls" data-k="' + esc(m.k) + '">' + esc(m.k) + '</td><td class="cls" data-k="' + esc(m.k) + '">' + esc(m.n) + '</td>') +
numCell(m.op) + numCell(m.pu) + numCell(m.sa) + adjCell(m.ad, 'td') + numCell(m.cl) + '</tr>';
});
if (C.res) {
h += '<tr class="res"><td colspan="2">Zero-quantity residue (' + C.res.n + (lvl2 ? ' items' : ' classes') + ' without stock or movement)</td>' +
numCell(C.res.op) + numCell(C.res.pu) + numCell(C.res.sa) + adjCell(C.res.ad, 'td') + numCell(C.res.cl) + '</tr>';
}
if (!C.rows.length && !C.res) h = '<tr><td colspan="7">No values in this period.</td></tr>';
h += '<tr class="total-row"><td>TOTAL</td><td>' + C.rows.length + (lvl2 ? ' items' : ' classes') + '</td>' +
numCell(t.op) + numCell(t.pu) + numCell(t.sa) + adjCell(t.ad, 'td') + numCell(t.cl) + '</tr>';
E.mvcBody.innerHTML = h;
if (!lvl2) {
Array.prototype.forEach.call(E.mvcBody.querySelectorAll('td.cls'), function (td) {
td.addEventListener('click', function () { S.cls = td.getAttribute('data-k'); S.lvl = 2; E.mvcClass.value = S.cls; load(); panel.scrollIntoView({ block: 'start' }); });
});
}
}
(function () {
var box = document.getElementById('exportBox'), xb = document.getElementById('excelBtn'), pb = document.getElementById('printTableBtn');
if (box && window.jmExport) {
window.jmExport.attach(box, {
excel: function () { if (S.on) exportExcel(); else if (xb) xb.click(); },
pdf: function () { if (S.on) printCost(); else if (pb) pb.click(); }
});
return;
}
if (xb) xb.style.display = ''; if (pb) pb.style.display = '';
document.addEventListener('click', function (e) {
if (!S.on || !e.target || !e.target.closest) return;
var x = e.target.closest('#excelBtn'), p = e.target.closest('#printTableBtn');
if (!x && !p) return;
e.stopPropagation(); e.preventDefault();
if (x) exportExcel(); else printCost();
}, true);
})();
function exportExcel() {
var C = current(), lvl2 = S.lvl === 2, r = 2, x, i, last;
if (!C || S.busy) { alert('The table is still loading.'); return; }
function cs(ref, v, st) { return '<c r="' + ref + '" t="inlineStr" s="' + st + '"><is><t xml:space="preserve">' + window.mvXmlEsc(v) + '</t></is></c>'; }
function cn(ref, v) { return '<c r="' + ref + '" s="5"><v>' + r2(v) + '</v></c>'; }
var head = [lvl2 ? 'ITEM CODE' : 'CLASS', 'DESCRIPTION', 'OPENING VALUE', S.scope === 'C' ? 'PURCHASES (NET COST)' : 'RECEIPTS (NET COST)', 'SALES (COGS)', 'ADJUSTMENTS', 'CLOSING VALUE'];
x = '<row r="1">' + cs('A1', titleTxt() + ' - SAR at cost - loaded ' + (META.asOf || '-'), 4) + '</row><row r="2">';
head.forEach(function (t, i) { x += cs(window.mvColRef(i) + '2', t, 1); });
x += '</row>';
function line(k, n, m, st) {
r++;
x += '<row r="' + r + '">' + cs('A' + r, k, st || 3) + cs('B' + r, n, st || 0) + cn('C' + r, m.op) + cn('D' + r, m.pu) + cn('E' + r, m.sa) + cn('F' + r, m.ad) + cn('G' + r, m.cl) + '</row>';
}
C.rows.forEach(function (m) { line(m.k, m.n, m); });
if (C.res) line('', 'Zero-quantity residue (' + C.res.n + ')', C.res, 0);
line('TOTAL', C.rows.length + (lvl2 ? ' items' : ' classes'), C.t, 4);
last = 'G' + r;
var sheet = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
'<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
'<sheetViews><sheetView workbookViewId="0"><pane ySplit="2" topLeftCell="A3" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' +
'<sheetFormatPr defaultRowHeight="15"/><cols><col min="1" max="1" width="14" customWidth="1"/><col min="2" max="2" width="48" customWidth="1"/><col min="3" max="7" width="16" customWidth="1"/></cols>' +
'<sheetData>' + x + '</sheetData><autoFilter ref="A2:' + last + '"/></worksheet>';
var blob = window.mvXlsxBlob('Cost ' + S.to, sheet), a = document.createElement('a');
a.href = URL.createObjectURL(blob);
a.download = 'Item_Cost_' + S.from + '_' + S.to + '_' + S.scope + (lvl2 ? '_' + S.cls : '') + '.xlsx';
document.body.appendChild(a); a.click();
setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
}
function printCost() {
if (!current() || S.busy) { alert('The table is still loading.'); return; }
var orig = document.title, d = new Date(), tb = document.createElement('div'), lvl2 = S.lvl === 2;
document.title = 'Co. Dashboard - ' + titleTxt();
tb.id = 'mvcPTitle';
tb.innerHTML = '<div class="pt-h"><b>Co. Dashboard</b> &nbsp;|&nbsp; Item Movement ' + DASH + ' Cost ' + DASH + ' ' + esc(scopeTxt()) +
(lvl2 ? ' ' + DASH + ' ' + esc(S.cls) + ' ' + esc(CLN[S.cls] || '') : '') + '</div>' +
'<div class="pt-s">Period ' + periodTxt() + ' &nbsp;' + String.fromCharCode(183) + '&nbsp; Values in SAR at cost (system cost script, all lots)' +
' &nbsp;' + String.fromCharCode(183) + '&nbsp; Printed ' + p2(d.getDate()) + '/' + p2(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + p2(d.getHours()) + ':' + p2(d.getMinutes()) + '</div>' +
'<div class="pt-c">The four boxes are the totals of ' + esc(scopeTxt()) + ' for this period' + (lvl2 ? ' within class ' + esc(S.cls) : '') +
'; the table lists the same values by ' + (lvl2 ? 'item' : 'class') + '.</div>';
E.mvCostStrip.parentNode.insertBefore(tb, E.mvCostStrip);
document.body.classList.add('print-mode-table'); document.body.classList.add('mv-pcost');
var back = function () {
if (tb.parentNode) tb.parentNode.removeChild(tb);
document.title = orig; document.body.classList.remove('print-mode-table'); document.body.classList.remove('mv-pcost');
window.removeEventListener('afterprint', back);
};
window.addEventListener('afterprint', back);
window.print();
}
clamp(); paintChips();
});
function mvDmy(s) { return s ? s.slice(8, 10) + '/' + s.slice(5, 7) + '/' + s.slice(0, 4) : '-'; }
function mvSecClose() { var p = document.getElementById('mvSec'); if (p) p.parentNode.removeChild(p); }
window.mvSecIs = function (td) { var p = document.getElementById('mvSec'); return !!p && p._td === td; };
window.mvCards = function (td, title, L, T) {
mvSecClose();
var h = '', p, r, x;
L.forEach(function (a) {
h += '<div class="sc-b' + (a[4] ? ' ' + a[4] : '') + '"><span>' + mvXmlEsc(a[0]) + '</span><b>' + a[1] + '</b>' + (a[3] ? '<em>' + a[3] + '</em>' : '') +
(a[2] === null ? '' : '<i style="width:' + Math.max(0, Math.min(100, Math.round(a[2]))) + '%"></i>') + '</div>';
});
p = document.createElement('div');
p.id = 'mvSec';
p._td = td;
p.innerHTML = '<h4>' + mvXmlEsc(title) + '</h4><div class="sc-r">' + h + (T ? '<div class="sc-b t"><span>' + T[0] + '</span><b>' + T[1] + '</b></div>' : '') + '</div>';
document.body.appendChild(p);
r = td.getBoundingClientRect();
x = Math.min(r.left + window.pageXOffset, window.pageXOffset + document.documentElement.clientWidth - p.offsetWidth - 16);
p.style.left = Math.max(8, x) + 'px';
p.style.top = (r.bottom + window.pageYOffset + 4) + 'px';
};
document.addEventListener('click', function (e) {
var p = document.getElementById('mvSec');
if (p && !p.contains(e.target) && !(e.target.closest && e.target.closest('td.mv-pc'))) mvSecClose();
});
document.addEventListener('keydown', function (e) { if (e.key === 'Escape') mvSecClose(); });
window.mvShell = function (title) {
mvSecClose();
var el = document.getElementById('mvPop'), S;
if (!el) { el = document.createElement('div'); el.id = 'mvPop'; document.body.appendChild(el); }
el.innerHTML = '<div class="pp-box"><div class="pp-hd"><h3><span id="ppT"></span><small id="ppN"></small></h3><div class="pp-tools">' +
'<button type="button" class="btn-print btn-excel" id="ppX" style="display:none">Export Excel</button>' +
'<button type="button" class="btn-print" id="ppP">Print / PDF</button>' +
'<button type="button" class="btn-back" id="ppC">&#8592; Close</button></div></div>' +
'<div class="mv-drchips pp-bar" id="ppB"></div><div class="pp-sc"><table><thead id="ppH"></thead>' +
'<tbody id="ppD"><tr><td style="padding:16px;color:var(--muted)">Loading...</td></tr></tbody></table></div></div>';
el.style.display = 'flex';
document.body.style.overflow = 'hidden';
function g(i) { return document.getElementById(i); }
function close() { el.style.display = 'none'; document.body.style.overflow = ''; document.removeEventListener('keydown', key); }
function key(e) { if (e.key === 'Escape') close(); }
document.addEventListener('keydown', key);
el.onclick = function (e) { if (e.target === el) close(); };
S = { t: g('ppT'), n: g('ppN'), b: g('ppB'), h: g('ppH'), d: g('ppD'), x: g('ppX'), p: g('ppP') };
S.t.textContent = title;
g('ppC').onclick = close;
S.p.onclick = function () {
var orig = document.title;
document.title = 'Co. Dashboard - ' + S.t.textContent;
document.body.classList.add('mv-ppop');
var back = function () { document.title = orig; document.body.classList.remove('mv-ppop'); window.removeEventListener('afterprint', back); };
window.addEventListener('afterprint', back);
window.print();
};
return S;
};
window.mvPop = function (O) {
var it = O.it, f = it.f || 1, D = null, v = 'C', dv = '*', BR = O.BR, DP = O.DP,
MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
CMN = { M: 'month', Q: 'quarter', H: 'half year', Y: 'year' }, S = mvShell(ttl());
function lab(ym) {
var y = ym.slice(2, 4), m = +ym.slice(5, 7);
return D.cm === 'M' ? MON[m - 1] + ' ' + y : D.cm === 'Q' ? 'Q' + Math.ceil(m / 3) + ' ' + y : D.cm === 'H' ? 'H' + (m > 6 ? 2 : 1) + ' ' + y : ym.slice(0, 4);
}
function ttl() { return (v === 'S' ? 'Salesmen' : 'Customers') + ' - ' + it.c + ' ' + it.n + ' - ' + O.title; }
function sub() { return 'Net sales (' + it.u + ') ' + mvDmy(D.from) + ' to ' + mvDmy(D.to) + ' by ' + CMN[D.cm] + ' - ACTIVE = months with a sale of ' + D.pm; }
function rows() { return v === 'S' ? D.sm : D.rows.filter(function (r) { return dv === '*' || r[2] === dv; }); }
function sum(r) { for (var s = 0, j = 5; j < r.length; j++) s += r[j]; return s; }
S.p.style.display = 'none';
apex.server.process('MOVE_AJAX', { x01: 'cust', x02: O.from, x03: O.sc, x04: '*', x05: it.c }, {
success: function (d) {
if (!d || !d.b) { S.d.innerHTML = '<tr><td>Could not load.</td></tr>'; return; }
D = d; paint();
},
error: function () { S.d.innerHTML = '<tr><td>Could not load.</td></tr>'; }
});
function paint() {
var R = rows(), sm = v === 'S', nb = D.b.length, tot = [], gt = 0, h, i, seen = {}, divs = [];
S.t.textContent = ttl(); S.n.textContent = sub();
function bt(val, l) { return '<button type="button" class="vw-b' + (v === val ? ' on' : '') + '" data-v="' + val + '">' + l + '</button>'; }
h = '<div class="vw-seg">' + bt('C', 'Customers') + bt('S', 'Salesmen') + '</div>';
if (!sm) {
D.rows.forEach(function (r) { if (!seen[r[2]]) { seen[r[2]] = 1; divs.push(r[2]); } });
divs.sort();
if (divs.length > 1) {
h += '<span class="sk-chip' + (dv === '*' ? ' on' : '') + '" data-d="*"><button type="button" class="ck">All<small>' + D.rows.length + '</small></button></span>';
divs.forEach(function (x) {
var n = 0; D.rows.forEach(function (r) { if (r[2] === x) n++; });
h += '<span class="sk-chip' + (dv === x ? ' on' : '') + '" data-d="' + mvXmlEsc(x) + '"><button type="button" class="ck">' + mvXmlEsc(DP[x] || x || 'NA') + '<small>' + n + '</small></button></span>';
});
}
}
S.b.innerHTML = h;
Array.prototype.forEach.call(S.b.querySelectorAll('.vw-b'), function (b) {
b.onclick = function () { v = b.getAttribute('data-v'); paint(); };
});
Array.prototype.forEach.call(S.b.querySelectorAll('.sk-chip'), function (c) {
c.querySelector('.ck').onclick = function () { dv = c.getAttribute('data-d'); paint(); };
});
h = '<tr><th>' + (sm ? 'SALESMAN' : 'CUSTOMER</th><th>DIV') + '</th><th>BR</th><th class="num">TOTAL</th>';
D.b.forEach(function (x) { h += '<th class="num">' + lab(x) + '</th>'; });
S.h.innerHTML = h + '<th class="num">ACTIVE</th></tr>';
for (i = 0; i < nb; i++) tot.push(0);
h = '';
R.forEach(function (r) {
var s = sum(r), k = D.pm ? r[4] / D.pm : 0;
gt += s;
h += '<tr' + (!sm && O.cust !== null && r[0] === O.cust ? ' class="mv-hl"' : '') + '><td class="c-name" title="' + r[0] + '">' + mvXmlEsc(r[1]) + '</td>' +
(sm ? '' : '<td>' + mvXmlEsc(DP[r[2]] ? DP[r[2]].slice(0, 3) : r[2]) + '</td>') + '<td>' + mvXmlEsc(BR[r[3]] || r[3]) + '</td>' + O.cell(s / f, ' c-tot');
for (i = 0; i < nb; i++) { h += O.cell(r[5 + i] / f); tot[i] += r[5 + i]; }
h += '<td class="num"><span class="pat ' + (k >= 0.75 ? 'pat-R' : k >= 0.25 ? 'pat-I' : 'pat-S') + '">' + r[4] + '/' + D.pm + '</span></td></tr>';
});
h += '<tr class="total-row"><td>TOTAL ' + R.length + (sm ? ' salesmen' : ' customers</td><td>') + '</td><td></td>' + O.cell(gt / f, ' c-tot');
for (i = 0; i < nb; i++) h += O.cell(tot[i] / f);
S.d.innerHTML = R.length ? h + '<td></td></tr>' : '<tr><td>No sales in the period.</td></tr>';
S.x.style.display = S.p.style.display = R.length ? '' : 'none';
}
S.x.onclick = function () {
if (!D) return;
function cs(ref, x, st) { return '<c r="' + ref + '" t="inlineStr" s="' + st + '"><is><t xml:space="preserve">' + mvXmlEsc(x) + '</t></is></c>'; }
function cn(ref, x) { return '<c r="' + ref + '" s="2"><v>' + (Math.round(x * 10) / 10) + '</v></c>'; }
var R = rows(), sm = v === 'S', nb = D.b.length, r = 2, i, x, tot = [], gt = 0,
head = [sm ? 'SALESMAN' : 'CUSTOMER', 'CODE', 'DIVISION', 'BRANCH', 'TOTAL'].concat(D.b.map(lab), ['ACTIVE MONTHS']), nc = head.length;
x = '<row r="1">' + cs('A1', ttl() + ' - ' + sub(), 4) + '</row><row r="2">';
head.forEach(function (t, j) { x += cs(mvColRef(j) + '2', t, 1); });
x += '</row>';
for (i = 0; i < nb; i++) tot.push(0);
R.forEach(function (rw) {
var s = sum(rw); r++; gt += s;
x += '<row r="' + r + '">' + cs('A' + r, rw[1], 0) + cs('B' + r, String(rw[0]), 3) + cs('C' + r, sm ? '' : (DP[rw[2]] || rw[2]), 0) +
cs('D' + r, BR[rw[3]] || rw[3], 0) + cn('E' + r, s / f);
for (i = 0; i < nb; i++) { x += cn(mvColRef(5 + i) + r, rw[5 + i] / f); tot[i] += rw[5 + i]; }
x += cn(mvColRef(5 + nb) + r, rw[4]) + '</row>';
});
r++;
x += '<row r="' + r + '">' + cs('A' + r, 'TOTAL ' + R.length, 4) + cn('E' + r, gt / f);
for (i = 0; i < nb; i++) x += cn(mvColRef(5 + i) + r, tot[i] / f);
x += '</row>';
var sheet = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
'<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
'<sheetViews><sheetView workbookViewId="0"><pane ySplit="2" topLeftCell="A3" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' +
'<sheetFormatPr defaultRowHeight="15"/><cols><col min="1" max="1" width="44" customWidth="1"/><col min="2" max="4" width="14" customWidth="1"/>' +
'<col min="5" max="' + nc + '" width="11" customWidth="1"/></cols><sheetData>' + x + '</sheetData>' +
'<autoFilter ref="A2:' + mvColRef(nc - 1) + (r - 1) + '"/></worksheet>';
var blob = window.mvXlsxBlob(sm ? 'Salesmen' : 'Customers', sheet), a = document.createElement('a');
a.href = URL.createObjectURL(blob);
a.download = (sm ? 'Salesmen_' : 'Customers_') + it.c + '_' + O.sc + '_' + D.from + '_' + D.to + '.xlsx';
document.body.appendChild(a); a.click();
setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
};
};
