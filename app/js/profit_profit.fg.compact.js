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
g = s && s.selectedIndex >= 0 ? s.options[s.selectedIndex].text : (e ? e.textContent : '');
g = (g || '').replace(/^\s+|\s+$/g, '');
return g ? ' - Data group: ' + g : '';
}
function short(v) {
var a = Math.abs(v);
if (a >= 1e6) { return (v / 1e6).toFixed(1) + 'M'; }
if (a >= 1e3) { return (v / 1e3).toFixed(0) + 'K'; }
return String(Math.round(v));
}
window.profitExcel = function (c) {
var head = [c.level], W = [46], lines = [], i, r, s, w = '<cols>', info, tS = 0, tC = 0, tQ = 0;
if (!window.svXlsx) { return; }
if (c.item) { head.unshift('Code'); W.unshift(16); head.push('Unit', 'Qty'); W.push(12, 12); }
head.push('Net sales', 'Cost', 'Gross profit', 'Margin %'); W.push(15, 15, 15, 11);
for (i = 0; i < c.rows.length; i++) {
r = c.rows[i]; s = [];
if (c.item) { s.push([r.code || '', 3]); }
s.push([r.name, 0]);
if (c.item) { s.push([r.unit || '', 0], [+r.qty || 0, 5]); }
s.push([+r.sales || 0, 5], [+r.cost || 0, 5], [+r.profit || 0, 5], [+r.margin || 0, 2]);
tS += +r.sales || 0; tC += +r.cost || 0; tQ += +r.qty || 0;
lines.push(s);
}
s = [];
if (c.item) { s.push(['', 0]); }
s.push(['TOTAL', 4]);
if (c.item) { s.push(['', 0], [tQ, 5]); }
s.push([tS, 5], [tC, 5], [tS - tC, 5], [tS ? (tS - tC) / tS * 100 : 0, 2]);
lines.push(s);
for (i = 0; i < head.length; i++) { w += '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + W[i] + '" customWidth="1"/>'; }
info = 'Profit by ' + c.level + (c.crumb ? ' - ' + c.crumb : '') + ' - ' + c.period + (c.asof ? ' - ' + c.asof : '') + grpTxt();
window.svXlsx.save(info, head, lines, w + '</cols>', c.file, 'Profit');
};
var chLast = null, chTimer = null;
window.profitChart = function (svg, o) {
var rtl = document.documentElement.getAttribute('dir') === 'rtl',
W = Math.max(320, Math.round(svg.getBoundingClientRect().width) || 1100), H = 200,
L = rtl ? 12 : 58, R = rtl ? 58 : 12, T = 18, B = 40, iw = W - L - R, ih = H - T - B, n = o.labels.length, gw = iw / n,
bw = Math.min(22, gw * 0.16), gap = Math.min(4, gw * 0.03), mx = 0, i, k, y, x, cx, s = '', g = '', d = rtl ? -1 : 1;
function bar(x, v, fill) {
var hh = Math.max(0, v) / mx * ih;
return '<rect x="' + x.toFixed(1) + '" y="' + (T + ih - hh).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + hh.toFixed(1) + '" rx="2" fill="' + fill + '"/>';
}
chLast = { svg: svg, o: o };
svg.removeAttribute('preserveAspectRatio');
svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
for (i = 0; i < n; i++) { if (o.sales[i] > mx) { mx = o.sales[i]; } if (o.cost[i] > mx) { mx = o.cost[i]; } if (o.profit[i] > mx) { mx = o.profit[i]; } }
if (mx <= 0 || n === 0) { svg.innerHTML = ''; return; }
mx *= 1.15;
for (i = 0; i <= 3; i++) {
y = T + ih - ih * i / 3;
g += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '" stroke="rgba(26,31,54,' + (i ? '0.07' : '0.18') + ')"' + (i ? ' stroke-dasharray="3 4"' : '') + '/>'
+ '<text x="' + (rtl ? W - R + 8 : L - 8) + '" y="' + (y + 3.5).toFixed(1) + '" text-anchor="' + (rtl ? 'start' : 'end') + '">' + short(mx * i / 3) + '</text>';
}
for (i = 0; i < n; i++) {
k = rtl ? n - 1 - i : i;
cx = L + k * gw + gw / 2;
x = cx - d * (bw + gap) - bw / 2;
s += bar(x, o.sales[i], '#c6c9d0') + bar(x + d * (bw + gap), o.cost[i], '#9aa1c9') + bar(x + 2 * d * (bw + gap), o.profit[i], '#111c3a');
s += '<text class="v" x="' + (x + 2 * d * (bw + gap) + bw / 2).toFixed(1) + '" y="' + (T + ih - Math.max(0, o.profit[i]) / mx * ih - 4).toFixed(1) + '" text-anchor="middle">' + short(o.profit[i]) + '</text>';
s += '<text x="' + cx.toFixed(1) + '" y="' + (H - 22) + '" text-anchor="middle">' + o.labels[i] + '</text>';
s += '<text class="m" x="' + cx.toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle">' + o.margin[i].toFixed(1) + '%</text>';
}
svg.innerHTML = g + s;
};
window.addEventListener('resize', function () {
window.clearTimeout(chTimer);
chTimer = window.setTimeout(function () { if (chLast && chLast.svg.isConnected) { window.profitChart(chLast.svg, chLast.o); } }, 150);
}, false);
window.addEventListener('beforeprint', function () {
var T = window.jmT || function (s) { return s; }, wrap = document.querySelector('.wrap'),
th = document.querySelector('#printTablePanel .print-title-row th'), pf = document.getElementById('printFilters'),
h1 = document.querySelector('.dash-header h1'), table = document.body.className.indexOf('print-mode-table') !== -1,
parts = th ? th.textContent.split(' | ') : [], sep = '<span class="pf-sep">|</span>', seg, box;
if (!wrap) { return; }
box = document.getElementById('jmPrintHead');
if (!box) { box = document.createElement('div'); box.id = 'jmPrintHead'; wrap.insertBefore(box, wrap.firstChild); }
seg = pf ? pf.innerHTML.split(sep) : [];
if (table && seg.length > 1) { seg.pop(); }
box.innerHTML = '<div class="ph-top"><b class="ph-co"></b><span class="ph-at"></span></div><div class="ph-title"></div><div class="ph-meta">' + seg.join(sep) + '</div>';
box.querySelector('.ph-co').textContent = T('Co. Dashboard');
box.querySelector('.ph-at').textContent = T(parts[3] || '');
box.querySelector('.ph-title').textContent = table ? T(parts[1] || '') : (h1 ? h1.textContent : '');
box = document.getElementById('jmPageCss');
if (!box) { box = document.createElement('style'); box.id = 'jmPageCss'; }
document.body.appendChild(box);
box.textContent = document.body.className.indexOf('sd-print') !== -1 ? '' : '@media print{@page{@top-right{content:none}@bottom-right{content:'
+ (window.JM_LANG === 'AR' ? '"\\0635 \\0641 \\062D \\0629  " counter(page) " \\0645 \\0646  " counter(pages)' : '"Page " counter(page) " of " counter(pages)')
+ ';font:8px sans-serif;color:#555}}}';
fitSheet(box, table, 230);
}, false);
function fitSheet(box, table, extra) {
var rows = document.querySelectorAll('#printTablePanel tr').length - 1, k = (700 - 95 - (table ? 0 : extra)) / Math.max(rows, 1) / 16.4;
if (!box.textContent || k >= 1 || k < 0.72) { return; }
box.textContent += '@media print{#printTablePanel{margin-bottom:0 !important}#printTablePanel table{font-size:' + (8.5 * k).toFixed(1) + 'px !important}'
+ '#printTablePanel th,#printTablePanel td{padding:' + (1.5 * k).toFixed(1) + 'px 4px !important;line-height:1.1 !important}}';
}
window.profitSpark = function (vals) {
var w = 96, h = 34, mx = 0, mn = 0, i, pts = [], span;
if (!vals || vals.length < 2) { return ''; }
for (i = 0; i < vals.length; i++) { if (vals[i] > mx) { mx = vals[i]; } if (vals[i] < mn) { mn = vals[i]; } }
span = (mx - mn) || 1;
for (i = 0; i < vals.length; i++) { pts.push(((i / (vals.length - 1)) * (w - 4) + 2).toFixed(1) + ',' + (h - 3 - (vals[i] - mn) / span * (h - 8)).toFixed(1)); }
return '<svg class="spark" viewBox="0 0 ' + w + ' ' + h + '"><polyline fill="none" stroke="#111c3a" stroke-width="2" stroke-linejoin="round" points="' + pts.join(' ') + '"/>'
+ '<circle cx="' + pts[pts.length - 1].split(',')[0] + '" cy="' + pts[pts.length - 1].split(',')[1] + '" r="3" fill="#22b8cf"/></svg>';
};
}());
