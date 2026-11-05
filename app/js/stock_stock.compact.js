window.addEventListener("DOMContentLoaded",function(){
function initStockPage() {
var ids = ['sk-meta', 'sk-i18n', 'sk-stores', 'sk-classes', 'sk-items'], J = {};
for (var i = 0; i < ids.length; i++) {
var el = document.getElementById(ids[i]);
if (!el) {
initStockPage._t = (initStockPage._t || 0) + 1;
if (initStockPage._t < 100) { setTimeout(initStockPage, 100); return; }
console.error('Stock page: data region ' + ids[i] + ' not found.');
return;
}
J[ids[i]] = JSON.parse(el.textContent);
}
var META = J['sk-meta'], I18N = J['sk-i18n'], STORES = J['sk-stores'],
CLASSES = J['sk-classes'], ITEMS = J['sk-items'];
var BR = I18N.br || {};
function idxOf(arr, v) { for (var i = 0; i < arr.length; i++) if (arr[i] === v) return i; return -1; }
function hasVal(arr, v) { return idxOf(arr, v) !== -1; }
function esc(s) {
return String(s === null || s === undefined ? '' : s).replace(/[&<>"]/g, function (m) {
return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m];
});
}
function qb(v, it) {
if (Math.abs(v) >= 1 || v === 0 || !(it.f > 1)) { return q1(v); }
var base = v * it.f, us = it.us || [], i, q, nm, fc;
for (i = 0; i < us.length; i++) {
fc = +us[i][1]; q = base / fc;
if (Math.abs(q) >= 1) { return tag(q, us[i][0]); }
}
return tag(base, it.bu || '');
}
function tag(q, nm) {
var r = Math.round(q * 10) / 10, t;
t = r === 0 ? (Math.round(q * 1000) / 1000).toFixed(3) : (r % 1 ? r.toFixed(1) : String(r));
return '<span class="qb">' + t + ' ' + esc(nm) + '</span>';
}
function q1(v) {
var r = Math.round(v * 10) / 10;
return r.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}
function dmy(s) { return s ? s.slice(8, 10) + '/' + s.slice(5, 7) + '/' + s.slice(0, 4) : '-'; }
function addDays(s, n) {
var d = new Date(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10) + n);
return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
}
var DASH = String.fromCharCode(8212), SEP = ' ' + String.fromCharCode(8250) + ' ';
var STM = {};
var TYPES = [];
var TORD = { 1: 1, 3: 2, 2: 3, 4: 4, 11: 5 };
(function () {
var seen = {};
STORES.forEach(function (s) {
STM[s.c] = s;
if (!seen[s.t]) { seen[s.t] = 1; TYPES.push({ t: s.t, tl: s.tl }); }
});
TYPES.sort(function (a, b) { return (TORD[a.t] || 9) - (TORD[b.t] || 9); });
})();
var ITM = {};
ITEMS.forEach(function (it) { ITM[it.c] = it; });
var CLN = {};
CLASSES.forEach(function (c) { CLN[c.c] = c.n; });
function brName(p) {
if (BR[p]) return BR[p];
var s = null;
for (var i = 0; i < STORES.length; i++) if (STORES[i].p === p) { s = STORES[i]; break; }
return s ? s.pn : p;
}
var date = META.today, type = TYPES.length ? TYPES[0].t : 1;
var cls = '', qry = '', selB = [], openB = null,
REPS = 4,
selS = [],
selSFor = null;
function syncOpen() {
openB = selB.length === 1 ? selB[0] : null;
if (openB !== selSFor) {
selSFor = openB;
selS = (openB && +type !== REPS) ? branchStores(openB).map(function (s) { return s.c; }) : [];
}
}
function branchStores(p) { return typeStores().filter(function (s) { return s.p === p; }); }
function stName(s) { return s.ns || s.na || s.n; }
var BAL = {};
var loaded = false, collapsed = {};
var LOT = false;
var fDate = document.getElementById('fDate'), fType = document.getElementById('fType'),
fClass = document.getElementById('fClass'), fItem = document.getElementById('fItem'),
fItemClr = document.getElementById('fItemClr'), chips = document.getElementById('branchChips'), wChips = document.getElementById('storeChips'), wGroup = document.getElementById('storeGroup'),
tHead = document.getElementById('tableHead'), tBody = document.getElementById('tableBody'),
backBtn = document.getElementById('backBtn');
fDate.min = META.minD; fDate.max = META.today; fDate.value = date;
TYPES.forEach(function (t) {
var o = document.createElement('option'); o.value = t.t; o.textContent = t.tl; fType.appendChild(o);
});
fType.value = type;
var typeChips = document.getElementById('typeChips');
function paintTypeChips() {
if (!typeChips) return;
typeChips.innerHTML = TYPES.map(function (t) {
return '<button type="button"' + (t.t === +type ? ' class="on"' : '') + ' data-t="' + t.t + '">' + esc(t.tl) + '</button>';
}).join('');
}
if (typeChips) typeChips.addEventListener('click', function (e) {
var b = e.target; while (b && b !== typeChips && !(b.getAttribute && b.getAttribute('data-t'))) b = b.parentNode;
if (!b || b === typeChips) return;
fType.value = b.getAttribute('data-t');
fType.dispatchEvent(new Event('change'));
});
paintTypeChips();
CLASSES.forEach(function (c) {
var o = document.createElement('option'); o.value = c.c;
o.textContent = c.n; fClass.appendChild(o);
});
(function () {
var btn = document.getElementById('fClassBtn'), lbl = document.getElementById('fClassLbl'), menu = document.getElementById('fClassMenu'),
qin = document.getElementById('fClassQ'), list = document.getElementById('fClassList'), pick = document.getElementById('clsPick'), m;
if (!btn) { window.skSetClass = function (v) { fClass.value = v; cls = v; }; return; }
m = '<div class="ss-option" data-v="">All Classes</div>';
CLASSES.forEach(function (c) { m += '<div class="ss-option" data-v="' + esc(c.c) + '"><span class="ss-code">' + esc(c.c) + '</span>' + esc(c.n) + '</div>'; });
list.innerHTML = m;
function open(o) { menu.className = 'ss-menu' + (o ? ' open' : ''); menu.style.display = o ? 'block' : ''; if (o) { qin.value = ''; filt(); qin.focus(); } }
function filt() { var q = qin.value.toUpperCase(), L = list.children, i; for (i = 0; i < L.length; i++) L[i].style.display = !q || L[i].textContent.toUpperCase().indexOf(q) !== -1 ? '' : 'none'; }
window.skSetClass = function (v) { fClass.value = v; cls = v; lbl.textContent = v ? (CLN[v] || v) : 'All Classes'; btn.className = 'cls-btn' + (v ? ' picked' : ''); };
btn.addEventListener('click', function () { open(menu.className.indexOf('open') === -1); });
qin.addEventListener('input', filt);
qin.addEventListener('keydown', function (e) { if (e.key === 'Escape') open(false); });
list.addEventListener('click', function (e) {
var t = e.target;
while (t && t !== list && !(t.getAttribute && t.getAttribute('data-v') !== null)) t = t.parentNode;
if (!t || t === list) return;
window.skSetClass(t.getAttribute('data-v')); open(false); render();
});
document.addEventListener('click', function (e) { if (!pick.contains(e.target)) open(false); });
})();
var HAS = {};
function indexStock() {
HAS = {};
for (var c in BAL) for (var s in BAL[c]) if (Math.abs(BAL[c][s]) > 0.0005) HAS[s] = 1;
}
function typeStores() { return STORES.filter(function (s) { return s.t === +type && HAS[s.c]; }); }
function branches() {
var seen = {}, out = [];
typeStores().forEach(function (s) {
if (!seen[s.p]) { seen[s.p] = 1; out.push(s.p); }
});
out.sort();
return out;
}
function columns() {
if (openB) {
return branchStores(openB).filter(function (s) { return hasVal(selS, s.c); })
.map(function (s) { return { k: s.c, lb: stName(s), stores: [s.c] }; });
}
var bs = branches().filter(function (p) { return !selB.length || hasVal(selB, p); });
return bs.map(function (p) {
return { k: p, lb: brName(p),
stores: typeStores().filter(function (s) { return s.p === p; }).map(function (s) { return s.c; }) };
});
}
function showTot(cols) { return !(openB && cols.length === 1); }
function ncols(cols) { return cols.length + 3 + (showTot(cols) ? 1 : 0); }
function itemRows(cols) {
var out = [], hidden = 0, q = qry.toLowerCase(),
totS = openB ? branchStores(openB).map(function (s) { return s.c; }) : null;
ITEMS.forEach(function (it) {
if (cls && it.cl !== cls) return;
if (q && it.c.toLowerCase().indexOf(q) === -1 && it.n.toLowerCase().indexOf(q) === -1) return;
var b = BAL[it.c], vals = [], tot = 0, any = false;
for (var i = 0; i < cols.length; i++) {
var v = 0;
if (b) for (var j = 0; j < cols[i].stores.length; j++) v += (b[cols[i].stores[j]] || 0);
v = v / (it.f || 1);
if (v !== 0) any = true;
vals.push(v); if (!totS) tot += v;
}
if (totS && b) {
for (var k = 0; k < totS.length; k++) tot += (b[totS[k]] || 0);
tot = tot / (it.f || 1);
if (!cols.length && tot !== 0) any = true;
}
if (!any) { hidden++; return; }
out.push({ it: it, v: vals, t: tot });
});
return { rows: out, hidden: hidden };
}
function titleTxt() {
var t = TYPES.filter(function (x) { return x.t === +type; })[0];
return scopeTxt() + (t ? SEP + t.tl : '') + SEP + dmy(date);
}
function scopeTxt() {
if (!openB) return 'Stock by Branch';
var one = selS.length === 1 ? branchStores(openB).filter(function (s) { return s.c === selS[0]; })[0] : null;
return brName(openB) + (one ? SEP + stName(one) : SEP + 'warehouses');
}
function render() {
if (LOT && window.stockLots) { window.stockLots.render(); return; }
syncOpen();
paintChips();
var cols = columns(), R = itemRows(cols), rows = R.rows;
document.getElementById('tableTitleText').textContent = scopeTxt();
backBtn.style.display = openB ? '' : 'none';
document.getElementById('toggleAllBtn').style.display = rows.length ? '' : 'none';
document.getElementById('periodBadge').textContent = 'Till ' + dmy(date);
buildPrintFilters();
var h = '<tr class="print-title-row"><th colspan="' + ncols(cols) + '">' + esc(printTitle()) + '</th></tr><tr>' +
'<th class="c-code">ITEM CODE</th><th>DESCRIPTION</th><th>UNIT</th>';
cols.forEach(function (c) {
h += '<th class="num ar" title="' + esc(c.k) + '">' + esc(c.lb) + '</th>';
});
if (showTot(cols)) h += '<th class="num">TOTAL</th>';
h += '</tr>';
tHead.innerHTML = h;
if (!rows.length) {
tBody.innerHTML = '<tr><td colspan="' + ncols(cols) + '" style="text-align:center;color:var(--muted);padding:24px">' +
(loaded ? 'No items with stock for this selection.' : 'Loading...') + '</td></tr>';
note(R, cols); return;
}
var html = '', curC = null, n = 0;
rows.forEach(function (r) {
var it = r.it;
if (it.cl !== curC) {
curC = it.cl;
var cnt = 0; for (var i = 0; i < rows.length; i++) if (rows[i].it.cl === curC) cnt++;
html += '<tr class="grp-row' + (collapsed[curC] ? '' : ' open') + '" data-c="' + esc(curC) + '">' +
'<td colspan="' + ncols(cols) + '"><span class="tw">&#9654;</span> ' +
esc(CLN[curC] || ('Class ' + curC)) + '<span class="cnt">' + cnt + ' items</span></td></tr>';
}
html += '<tr class="child-row' + (collapsed[curC] ? ' hidden' : '') + '" data-c="' + esc(curC) + '">' +
'<td class="c-code">' + esc(it.c) + '</td>' +
'<td class="c-name" title="' + esc(it.bn ? 'Brand: ' + it.bn : '') + '">' + esc(it.n) + '</td>' +
'<td class="c-unit' + (it.nf ? ' nf' : '') + '">' + esc(it.u) + (it.nf ? ' *' : '') + '</td>';
r.v.forEach(function (v) {
html += v === 0 ? '<td class="num z">' + DASH + '</td>'
: '<td class="num' + (v < 0 ? ' neg' : '') + '">' + qb(v, it) + '</td>';
});
html += (showTot(cols) ? '<td class="num c-tot">' + qb(r.t, it) + '</td>' : '') + '</tr>';
n++;
});
tBody.innerHTML = html;
Array.prototype.forEach.call(tBody.querySelectorAll('tr.grp-row'), function (tr) {
tr.addEventListener('click', function () {
var c = tr.getAttribute('data-c');
collapsed[c] = !collapsed[c];
tr.classList.toggle('open', !collapsed[c]);
Array.prototype.forEach.call(tBody.querySelectorAll('tr.child-row[data-c="' + c + '"]'), function (x) {
x.classList.toggle('hidden', !!collapsed[c]);
});
});
});
note(R, cols);
}
function note(R, cols) {
var el = document.getElementById('tableNote');
el.textContent = loaded ? '' : 'Loading balances...';
el.style.display = loaded ? 'none' : '';
}
function typeStoreWord() {
var t = TYPES.filter(function (x) { return x.t === +type; })[0];
return t ? t.tl : 'warehouses';
}
function paintChips() {
var bs = branches(), h = '';
bs.forEach(function (p) {
var n = branchStores(p).length;
h += '<span class="sk-chip' + (hasVal(selB, p) ? ' on' : '') + '" data-p="' + esc(p) + '">' +
'<button type="button" class="ck" title="Toggle branch in the comparison">' + esc(brName(p)) +
(n > 1 ? '<small>(' + n + ')</small>' : '') + '</button></span>';
});
chips.innerHTML = h || '<span class="lbl-hint">' + (loaded ? 'No branches with stock for this warehouse type' : 'Loading...') + '</span>';
Array.prototype.forEach.call(chips.querySelectorAll('.sk-chip'), function (ch) {
var p = ch.getAttribute('data-p');
ch.querySelector('.ck').addEventListener('click', function () {
var i = idxOf(selB, p);
if (i === -1) selB.push(p); else selB.splice(i, 1);
render();
if (selB.length === 1) document.getElementById('printTablePanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
});
});
var ws = openB ? branchStores(openB) : [], wh = '';
ws.forEach(function (w) {
wh += '<span class="sk-chip wh' + (hasVal(selS, w.c) ? ' on' : '') + '" data-s="' + esc(w.c) + '">' +
'<button type="button" class="ck" title="Toggle warehouse column">' + esc(stName(w)) + '</button></span>';
});
wChips.innerHTML = wh;
wGroup.style.display = ws.length ? '' : 'none';
Array.prototype.forEach.call(wChips.querySelectorAll('.sk-chip'), function (ch) {
var c = ch.getAttribute('data-s');
ch.querySelector('.ck').addEventListener('click', function () {
var i = idxOf(selS, c);
if (i === -1) selS.push(c); else selS.splice(i, 1);
render();
});
});
}
backBtn.addEventListener('click', function () {
if (LOT && window.stockLots) { window.stockLots.back(); return; }
selB = []; render();
});
var allClosed = false;
document.getElementById('toggleAllBtn').addEventListener('click', function () {
allClosed = !allClosed;
collapsed = {};
if (allClosed) CLASSES.forEach(function (c) { collapsed[c.c] = true; });
collapsed['0'] = allClosed;
this.textContent = allClosed ? 'Expand all' : 'Collapse all';
render();
});
function load() {
loaded = false; fDate.disabled = true; render();
apex.server.process('STOCK_AJAX', { x01: 'bal', x02: date }, {
success: function (d) {
fDate.disabled = false;
if (!d || d.err) { alert((d && d.err) || 'Could not load balances.'); return; }
BAL = {};
d.rows.forEach(function (a) { (BAL[a[0]] || (BAL[a[0]] = {}))[a[1]] = a[2]; });
indexStock();
selB = selB.filter(function (p) { return hasVal(branches(), p); });
loaded = true; render();
},
error: function () {
fDate.disabled = false;
alert('Could not load balances. Make sure the STOCK_AJAX process exists.');
}
});
}
function setDate(s) {
if (!s || s < META.minD || s > META.today) return;
date = s; fDate.value = s; load();
}
fDate.addEventListener('change', function () { setDate(fDate.value); });
fType.addEventListener('change', function () { type = +fType.value; selB = []; paintTypeChips(); render(); });
fClass.addEventListener('change', function () { window.skSetClass(fClass.value); render(); });
var qt = null, itemMenu = document.getElementById('itemMenu'), shown = '';
fItem.addEventListener('input', function () {
fItemClr.style.display = fItem.value ? '' : 'none';
shown = '';
itemSearch();
clearTimeout(qt); qt = setTimeout(function () { qry = fItem.value.trim(); render(); }, 200);
});
fItem.addEventListener('focus', itemSearch);
function itemSearch() {
var q = fItem.value.trim().toLowerCase(), h = '', n = 0, i, it;
if (q.length < 2 || shown) { itemMenu.style.display = 'none'; return; }
for (i = 0; i < ITEMS.length && n < 20; i++) {
it = ITEMS[i];
if (it.c.toLowerCase().indexOf(q) !== -1 || it.n.toLowerCase().indexOf(q) !== -1) {
n++;
h += '<div class="ss-option" data-c="' + esc(it.c) + '"><span class="ss-code">' + esc(it.c) + '</span> ' + esc(it.n) + '<small>' + esc(CLN[it.cl] || '') + '</small></div>';
}
}
itemMenu.innerHTML = h || '<div class="ss-empty">No item matches</div>';
var rc = fItem.getBoundingClientRect();
itemMenu.style.position = 'fixed'; itemMenu.style.top = (rc.bottom + 4) + 'px'; itemMenu.style.left = rc.left + 'px';
itemMenu.style.width = rc.width + 'px'; itemMenu.style.minWidth = '0'; itemMenu.style.maxWidth = 'none';
itemMenu.style.maxHeight = Math.max(160, window.innerHeight - rc.bottom - 24) + 'px';
itemMenu.style.display = 'block';
Array.prototype.forEach.call(itemMenu.querySelectorAll('.ss-option'), function (o) {
o.addEventListener('click', function () { pickItem(o.getAttribute('data-c')); });
});
}
function pickItem(c) {
var it = ITM[c];
if (!it) return;
shown = it.c + SEP + it.n; fItem.value = shown; fItemClr.style.display = '';
itemMenu.style.display = 'none';
clearTimeout(qt); qry = it.c; render();
}
fItem.addEventListener('keydown', function (e) {
var open = itemMenu.style.display === 'block', opts = open ? itemMenu.querySelectorAll('.ss-option') : [], cur = -1, i, k = e.key;
for (i = 0; i < opts.length; i++) { if (opts[i].className.indexOf('active') !== -1) cur = i; }
if ((k === 'ArrowDown' || k === 'ArrowUp') && opts.length) {
e.preventDefault();
cur = k === 'ArrowDown' ? (cur + 1) % opts.length : (cur <= 0 ? opts.length - 1 : cur - 1);
for (i = 0; i < opts.length; i++) { opts[i].className = 'ss-option' + (i === cur ? ' active' : ''); }
if (opts[cur].scrollIntoView) opts[cur].scrollIntoView({ block: 'nearest' });
} else if (k === 'Enter') {
e.preventDefault();
if (open && opts.length) pickItem(opts[cur === -1 ? 0 : cur].getAttribute('data-c'));
} else if (k === 'Escape' && open) { itemMenu.style.display = 'none'; }
});
document.addEventListener('click', function (e) { if (!itemMenu.contains(e.target) && e.target !== fItem) itemMenu.style.display = 'none'; });
window.addEventListener('resize', function () { if (itemMenu.style.display === 'block') itemSearch(); });
window.addEventListener('scroll', function () { if (itemMenu.style.display === 'block') itemSearch(); }, true);
fItemClr.addEventListener('click', function () { fItem.value = ''; qry = ''; shown = ''; fItemClr.style.display = 'none'; itemMenu.style.display = 'none'; render(); fItem.focus(); });
document.getElementById('resetBtn').addEventListener('click', function () {
type = TYPES.length ? TYPES[0].t : 1; fType.value = type; paintTypeChips();
window.skSetClass(''); qry = ''; fItem.value = ''; shown = ''; fItemClr.style.display = 'none'; itemMenu.style.display = 'none';
selB = []; collapsed = {}; allClosed = false;
document.getElementById('toggleAllBtn').textContent = 'Collapse all';
if (date !== META.today) setDate(META.today); else render();
});
function nowTxt() {
var d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; };
return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
}
function printTitle() { return 'Co. Dashboard | Stock Balances - ' + titleTxt() + ' | Loaded ' + (META.asOf || '-') + ' | Printed ' + nowTxt(); }
function buildPrintFilters() {
var box = document.getElementById('printFilters');
var t = TYPES.filter(function (x) { return x.t === +type; })[0];
box.innerHTML = [
'<b>Till date:</b> ' + dmy(date),
'<b>Type:</b> ' + esc(t ? t.tl : '-'),
'<b>Class:</b> ' + (cls ? esc(CLN[cls] || cls) : 'All'),
'<b>Item:</b> ' + (qry ? esc(qry) : 'All'),
'<b>Branches:</b> ' + (openB ? esc(scopeTxt()) :
(selB.length ? selB.map(brName).map(esc).join(', ') : 'All')),
'<b>Loaded:</b> ' + esc(META.asOf || '-')
].join('<span class="pf-sep">|</span>');
}
function printTable() {
var orig = document.title, t = LOT && window.stockLots ? window.stockLots.printTitle() : printTitle();
var th = document.querySelector('#printTablePanel .print-title-row th');
if (th) th.textContent = t;
document.title = 'Stock_Balances_' + date;
document.body.classList.add('print-mode-table');
var back = function () {
document.title = orig; document.body.classList.remove('print-mode-table');
window.removeEventListener('afterprint', back);
};
window.addEventListener('afterprint', back);
window.print();
}
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
}).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
}
function colRef(i) {
var s = '';
i++;
while (i > 0) { var m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); }
return s;
}
function exportExcel() {
if (LOT && window.stockLots) { window.stockLots.excel(); return; }
if (!loaded) { alert('Balances are still loading.'); return; }
var cols = columns(), R = itemRows(cols), rows = R.rows;
if (!rows.length) { alert('Nothing to export for this selection.'); return; }
var t = TYPES.filter(function (x) { return x.t === +type; })[0];
var info = 'Stock Balances - till ' + dmy(date) + ' (inclusive) - ' + (t ? t.tl : '') +
(openB ? ' - ' + scopeTxt() : '') +
(cls ? ' - class ' + (CLN[cls] || cls) : '') + (qry ? ' - search "' + qry + '"' : '') +
' - ' + rows.length + ' items - loaded ' + (META.asOf || '-');
var head = ['CLASS', 'ITEM CODE', 'DESCRIPTION', 'UNIT'];
cols.forEach(function (c) { head.push(c.lb); });
if (showTot(cols)) head.push('TOTAL');
var lines = [];
rows.forEach(function (rw) {
var it = rw.it, cells = [[CLN[it.cl] || it.cl, 0], [it.c, 3], [it.n, 0], [it.u, 0]];
rw.v.forEach(function (v) { cells.push([v, 2]); });
if (showTot(cols)) cells.push([rw.t, 2]);
lines.push(cells);
});
var widths = '<cols><col min="1" max="1" width="22" customWidth="1"/><col min="2" max="2" width="15" customWidth="1"/>' +
'<col min="3" max="3" width="52" customWidth="1"/><col min="4" max="4" width="8" customWidth="1"/>' +
'<col min="5" max="' + head.length + '" width="13" customWidth="1"/></cols>';
saveXlsx(info, head, lines, widths, 'Stock_Balances_' + date + (openB ? '_' + openB : '') + '.xlsx', 'Stock ' + date);
}
function saveXlsx(info, head, lines, widths, fileName, sheetName) {
var nc = head.length, r = 1, x = '';
function cs(ref, v, st) { return '<c r="' + ref + '" t="inlineStr" s="' + st + '"><is><t xml:space="preserve">' + xmlEsc(v) + '</t></is></c>'; }
function cn(ref, v) { return '<c r="' + ref + '" s="2"><v>' + (Math.round(v * 10) / 10) + '</v></c>'; }
x += '<row r="1">' + cs('A1', info, 4) + '</row>';
r = 2; x += '<row r="2">';
head.forEach(function (h, i) { x += cs(colRef(i) + '2', h, 1); });
x += '</row>';
lines.forEach(function (cells) {
r++; x += '<row r="' + r + '">';
cells.forEach(function (c, i) { x += c[1] === 2 ? cn(colRef(i) + r, c[0]) : cs(colRef(i) + r, c[0], c[1]); });
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
'<numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0.0"/></numFmts>' +
'<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>' +
'<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>' +
'<fill><patternFill patternType="solid"><fgColor rgb="FFE8EAF6"/></patternFill></fill></fills>' +
'<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border>' +
'<border><left style="thin"><color rgb="FFBFC4D6"/></left><right style="thin"><color rgb="FFBFC4D6"/></right>' +
'<top style="thin"><color rgb="FFBFC4D6"/></top><bottom style="thin"><color rgb="FFBFC4D6"/></bottom><diagonal/></border></borders>' +
'<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
'<cellXfs count="5">' +
'<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/>' +
'<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
'<xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>' +
'<xf numFmtId="49" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>' +
'<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
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
(function () {
var box = document.getElementById('exportBox');
if (!box) return;
if (window.jmExport) { window.jmExport.attach(box, { pdf: printTable, excel: exportExcel }); return; }
box.innerHTML = '<button type="button" class="btn-print btn-excel" id="excelBtn">Export Excel</button> ' +
'<button type="button" class="btn-print" id="printTableBtn">Print / PDF</button>';
document.getElementById('excelBtn').addEventListener('click', exportExcel);
document.getElementById('printTableBtn').addEventListener('click', printTable);
})();
if (window.stockLots) {
window.stockLots.init({
META: META, STORES: STORES, CLASSES: CLASSES, ITEMS: ITEMS, ITM: ITM, CLN: CLN, TYPES: TYPES,
brName: brName, stName: stName, esc: esc, dmy: dmy, qb: qb, q1: q1, DASH: DASH, SEP: SEP,
saveXlsx: saveXlsx,
state: function () { return { date: date, type: +type, cls: cls, qry: qry, collapsed: collapsed }; },
setLot: function (on) { LOT = !!on; },
render: render
});
}
(function () {
var line = document.getElementById('asOfLine');
var ok = (META.asOf || '').slice(0, 10) === dmy(META.today);
line.classList.toggle('fresh', ok);
line.textContent = ok ? 'Movements loaded today ' + META.asOf
: 'Movements not loaded today ' + DASH + ' last load: ' + (META.asOf || 'never');
})();
load();
}
initStockPage();

});
