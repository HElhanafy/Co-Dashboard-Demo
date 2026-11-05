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
if (!window.jmExport) {
var JX = null;
function jxClose() { if (JX) { JX.className = JX.className.replace(/(^|\s)open(?=\s|$)/g, ''); JX = null; } }
document.addEventListener('click', function (e) { if (JX && !JX.contains(e.target)) { jxClose(); } });
document.addEventListener('keydown', function (e) { if (e.keyCode === 27) { jxClose(); } });
window.jmExport = {
attach: function (host, o) {
var pdf = typeof o.pdf === 'function' ? o.pdf : null, xl = typeof o.excel === 'function' ? o.excel : null, h;
if (!host) { return; }
if (pdf && xl) {
h = '<div class="jx"><button type="button" class="jx-btn" data-jx="menu">&#8681; Export<i class="jx-chev"></i></button>'
+ '<div class="jx-menu"><button type="button" data-jx="xl"><i class="xl">XLS</i>Excel</button><button type="button" data-jx="pdf"><i class="pdf">PDF</i>PDF</button></div></div>';
} else if (pdf || xl) {
h = '<div class="jx"><button type="button" class="jx-btn" data-jx="' + (xl ? 'xl' : 'pdf') + '">&#8681; Export ' + (xl ? 'Excel' : 'PDF') + '</button></div>';
} else { h = ''; }
host.innerHTML = h;
host.onclick = function (e) {
var t = e.target, a = null, box;
while (t && t !== host) { if (t.getAttribute && t.getAttribute('data-jx')) { a = t.getAttribute('data-jx'); break; } t = t.parentNode; }
if (!a) { return; }
box = host.querySelector('.jx');
if (a === 'menu') {
if (JX === box) { jxClose(); } else { jxClose(); box.className += ' open'; JX = box; }
e.stopPropagation(); return;
}
jxClose();
if (a === 'pdf' && pdf) { pdf(); }
if (a === 'xl' && xl) { xl(); }
};
},
close: jxClose
};
}
window.fsXl = function (S) {
var X = window.svXlsx, head = [], W = [], lines = [], i, y, r, L, v, w = '<cols>', sheet, info, dr = 0, cr = 0, tot = [];
if (!X) { return; }
function num(n) { return Math.abs(n) > 0.004 ? [Math.round(n * 100) / 100, 5] : ['', 0]; }
function hidden(ln, disp) {
var k;
for (k = 0; k < S.hide.length; k++) { if (S.hide[k] === ln.id) { for (y = 0; y < disp.length; y++) { if (Math.abs(disp[y] || 0) > 0.004) { return false; } } return true; } }
return false;
}
function cell(ln, raw) {
var d = ln.neg ? -raw : raw;
if (ln.neg && !S.flip) { return num(-d); }
return num(d);
}
function diff(a, b) { var d = b - a; return [num(d), Math.abs(a) > 0.004 ? [Math.round(d / Math.abs(a) * 10000) / 100, 5] : ['', 0]]; }
var withDiff = S.cols.length === 2;
if (S.v === 'ST') {
sheet = 'Statement';
head = ['Line']; W = [48];
for (y = 0; y < S.cols.length; y++) { head.push(S.cols[y].lb + (S.cols[y].sub ? ' (' + S.cols[y].sub + ')' : '')); W.push(16); }
if (withDiff) { head.push('Change', '%'); W.push(16, 10); }
for (i = 0; i < S.lines.length; i++) {
L = S.lines[i]; v = S.vals[L.id] || []; r = [];
var disp = [];
for (y = 0; y < S.cols.length; y++) { disp.push(L.neg ? -(v[y] || 0) : (v[y] || 0)); }
if (hidden(L, disp)) { continue; }
r.push([L.lbl, L.t === 'd' ? 4 : 0]);
for (y = 0; y < S.cols.length; y++) { r.push(cell(L, v[y] || 0)); }
if (withDiff) { r = r.concat(diff(disp[0], disp[1])); }
lines.push(r);
}
info = S.title + ' - ' + S.period;
} else if (S.v === 'DR') {
sheet = 'Accounts';
head = ['Account', 'Name']; W = [16, 46];
for (y = 0; y < S.cols.length; y++) { head.push(S.cols[y].lb + (S.cols[y].sub ? ' (' + S.cols[y].sub + ')' : '')); W.push(16); tot.push(0); }
if (withDiff) { head.push('Change', '%'); W.push(16, 10); }
for (i = 0; i < S.accs.length; i++) {
r = [[S.accs[i].a, 3], [S.accs[i].n, 0]];
for (y = 0; y < S.cols.length; y++) { tot[y] += S.accs[i].v[y]; r.push(num(S.accs[i].v[y])); }
if (withDiff) { r = r.concat(diff(S.accs[i].v[0], S.accs[i].v[1])); }
lines.push(r);
}
r = [['', 3], [S.line ? S.line.lbl : 'TOTAL', 4]];
for (y = 0; y < S.cols.length; y++) { r.push(num(tot[y])); }
if (withDiff) { r = r.concat(diff(tot[0], tot[1])); }
lines.push(r);
info = S.title + ' - ' + (S.line ? S.line.lbl : '') + ' - accounts - ' + S.period;
} else if (S.v === 'LS') {
sheet = 'Ledger';
head = ['Date', 'Entry', 'Description', 'Cost 1', 'Cost 2', 'Debit', 'Credit']; W = [12, 12, 50, 26, 26, 16, 16];
for (i = 0; i < S.rows.length; i++) {
r = S.rows[i].r; dr += S.rows[i].d0; cr += S.rows[i].c0;
lines.push([[r.dt, 0], [r.no, 3], [r.ds || '', 0], [S.c1n(r.c1), 0], [S.c2n(r.c2), 0], num(S.rows[i].d0), num(S.rows[i].c0)]);
}
lines.push([['TOTAL', 4], ['', 3], [S.acc.n, 0], ['', 0], ['', 0], num(dr), num(cr)]);
lines.push([['NET', 4], ['', 3], ['', 0], ['', 0], ['', 0], num(S.line && S.line.neg ? dr - cr : cr - dr), ['', 0]]);
info = S.title + ' - ' + (S.line ? S.line.lbl + ' - ' : '') + S.acc.n + ' (' + S.acc.a + ') - ledger statement - ' + S.period;
} else {
sheet = 'Entry';
head = ['#', 'Account', 'Account name', 'Description', 'Cost 1', 'Cost 2', 'Debit', 'Credit']; W = [6, 16, 40, 50, 26, 26, 16, 16];
L = (S.en && S.en.lines) || [];
for (i = 0; i < L.length; i++) {
v = parseFloat(L[i].v) || 0;
if (v > 0) { dr += v; } else { cr += -v; }
lines.push([[String(L[i].q), 3], [L[i].a, 3], [L[i].an || '', 0], [L[i].ds || '', 0], [S.c1n(L[i].c1), 0], [S.c2n(L[i].c2), 0], num(v > 0 ? v : 0), num(v < 0 ? -v : 0)]);
}
lines.push([['', 3], ['', 3], ['TOTAL', 4], ['', 0], ['', 0], ['', 0], num(dr), num(cr)]);
info = S.title + ' - Journal entry ' + S.entry.t + '/' + S.entry.n + (S.en && S.en.dt ? ' - ' + S.en.dt : '') + (S.en && S.en.ds ? ' - ' + S.en.ds : '');
}
for (i = 0; i < head.length; i++) { w += '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + W[i] + '" customWidth="1"/>'; }
X.save(info + (S.scope ? ' - ' + S.scope : '') + ' - Data as of ' + (S.asof || '-'), head, lines, w + '</cols>', S.file, sheet);
};
}());
(function () {
function pick(sel) {
var box = document.createElement('div'), btn, menu;
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
document.addEventListener('click', function (e) { if (!box.contains(e.target)) { menu.classList.remove('open'); } });
label();
setInterval(label, 400);
}
var n = 0, t = setInterval(function () {
var ids = ['fC1A', 'fC1B', 'fC2A'], i, s;
for (i = 0; i < ids.length; i++) {
s = document.getElementById(ids[i]);
if (s && !s.getAttribute('data-picked')) { pick(s); }
}
if (++n > 40) { clearInterval(t); }
}, 250);
}());
(function () {
var CMP = false, CUSTOM = false, C, box;
function $(id) { return document.getElementById(id); }
function group(id) { return $(id).parentNode; }
function btn(k, t) { return '<button type="button" class="fs-cap" data-k="' + k + '">' + t + '</button>'; }
function prev() { return C.curMo > 1 ? C.curMo - 1 : 12; }
function set(yF, yT, mF, mT) {
$('fYF').value = String(yF); $('fYT').value = String(yT); $('fMF').value = String(mF); $('fMT').value = String(mT);
$('fYF').dispatchEvent(new Event('change'));
}
function months(a, b, py) {
var s = C.st;
if (CMP) { set(s.yF, s.yT, a, b); } else { set(py ? C.curY - 1 : C.curY, py ? C.curY - 1 : C.curY, a, b); }
}
function active() {
var s = C.st;
if (CUSTOM) { return 'custom'; }
if (s.mF === C.curMo && s.mT === C.curMo) { return 'this'; }
if (s.mF === prev() && s.mT === prev()) { return 'last'; }
if (s.mF === 1 && s.mT === C.curMo) { return 'ytd'; }
return 'custom';
}
function paint() {
var a = active(), bs = box.querySelectorAll('.fs-cap'), i, k;
for (i = 0; i < bs.length; i++) {
k = bs[i].getAttribute('data-k');
bs[i].classList.toggle('on', k === a || k === (CMP ? 'cmp' : 'cur'));
}
group('fYF').classList.toggle('fs-off', !CMP);
group('fYT').classList.toggle('fs-off', !CMP);
group('fMF').classList.toggle('fs-off', a !== 'custom');
group('fMT').classList.toggle('fs-off', a !== 'custom');
}
function click(k) {
if (k === 'custom') { CUSTOM = true; }
else if (k === 'this') { CUSTOM = false; months(C.curMo, C.curMo); }
else if (k === 'last') { CUSTOM = false; months(prev(), prev(), C.curMo === 1); }
else if (k === 'ytd') { CUSTOM = false; months(1, C.curMo); }
else if (k === 'cur') { CMP = false; set(C.curY, C.curY, C.st.mF, C.st.mT); }
else if (k === 'cmp' && !CMP) { CMP = true; CUSTOM = false; set(C.minY, C.curY, 1, C.curMo); if ($('fCmp').querySelector('option[value=Y]')) { $('fCmp').value = 'Y'; $('fCmp').dispatchEvent(new Event('change')); } }
paint();
}
var n = 0, t = setInterval(function () {
var p = document.querySelector('.fs-period');
if (++n > 40) { clearInterval(t); }
C = window.FS && window.FS.core;
if (!p || !C || !$('fYF') || !$('fYF').options.length) { return; }
clearInterval(t);
CMP = C.st.yF !== C.st.yT;
box = document.createElement('div');
box.className = 'fs-caps';
box.innerHTML = '<div class="fs-capg"><label>Period</label><div class="fs-capr">' + btn('this', 'This month') + btn('last', 'Previous month') + btn('ytd', 'Year to date') + btn('custom', 'Custom period') + '</div></div>' +
'<div class="fs-capg"><label>Year</label><div class="fs-capr">' + btn('cur', 'Current year') + btn('cmp', 'Compare years') + '</div></div>';
p.insertBefore(box, p.firstChild);
box.addEventListener('click', function (e) { var b = e.target.closest('.fs-cap'); if (b) { click(b.getAttribute('data-k')); } });
$('resetBtn').addEventListener('click', function () { CMP = false; CUSTOM = false; setTimeout(paint, 0); });
['fYF', 'fYT', 'fMF', 'fMT'].forEach(function (id) { $(id).addEventListener('change', function () { setTimeout(paint, 0); }); });
paint();
}, 250);
}());
window.fsKpiY = function (val, sub, k, yrs, cols, fmtAcc, fmt) {
var h = '<div class="ky-list">', i, v, p, d;
for (i = 0; i < yrs.length; i++) {
v = (yrs[i][k] || {}).val || 0;
p = i ? ((yrs[i - 1][k] || {}).val || 0) : 0;
d = i && Math.abs(p) > 0.004 ? ((v - p) / Math.abs(p)) * 100 : null;
h += '<div class="ky' + (i === yrs.length - 1 ? ' last' : '') + (v < -0.004 ? ' neg' : '') + '"><span class="ky-y">' + cols[i].lb + '</span><span class="ky-v">' + fmtAcc(v) + '</span>' +
'<span class="ky-d' + (d === null ? '' : d < 0 ? ' dn' : ' up') + '">' + (d === null ? '' : (d >= 0 ? '+' : '') + fmt(d) + '%') + '</span></div>';
}
val.textContent = '';
val.className = 'kpi-value ky-off';
sub.innerHTML = h + '</div>';
};
window.fsPrep = function (tall, now, mode) {
var pf = document.querySelector('#printTablePanel .print-filters'), old = document.getElementById('fsPrinted'), pg = null;
if (old) { old.parentNode.removeChild(old); }
if (pf) { pf.insertAdjacentHTML('beforeend', '<span id="fsPrinted"><span class="pf-sep">|</span><b>Printed:</b> ' + now + '</span>'); }
if (tall) {
pg = document.createElement('style');
var n = 1, rows = document.querySelectorAll('#fsTable tbody tr'), i, h, x = 'body.fs-tall #fsTable ';
for (i = 0; i < rows.length; i++) { if (rows[i].offsetParent) { n++; } }
h = Math.min(Math.floor((mode ? 960 : 740) / n), 64);
pg.textContent = '@media print{@page{size:A4 portrait}' + (h > 24 ? x + 'td,' + x + 'th.val,' + x + 'td.val,' + x + '.fs-lbl{height:' + h + 'px;font-size:' + (h > 40 ? 14 : 12.5) + 'px !important;vertical-align:middle}' : '') + '}';
document.body.appendChild(pg);
document.body.classList.add('fs-tall');
}
return function () {
if (pg) { pg.parentNode.removeChild(pg); document.body.classList.remove('fs-tall'); }
};
};
