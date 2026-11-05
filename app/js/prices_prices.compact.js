window.addEventListener("DOMContentLoaded",function(){
function initPricesPage() {
var ids = ['pl-meta', 'pl-classes', 'pl-items'], J = {};
for (var i = 0; i < ids.length; i++) {
var el = document.getElementById(ids[i]);
if (!el) {
initPricesPage._t = (initPricesPage._t || 0) + 1;
if (initPricesPage._t < 100) { setTimeout(initPricesPage, 100); return; }
console.error('Price list: data region ' + ids[i] + ' not found.');
return;
}
J[ids[i]] = JSON.parse(el.textContent);
}
var META = J['pl-meta'], CLASSES = J['pl-classes'], ITEMS = J['pl-items'];
function esc(s) {
return String(s === null || s === undefined ? '' : s).replace(/[&<>"]/g, function (m) {
return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m];
});
}
function fp(v) { return (Math.round(v * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fq(v) { var r = Math.round(v * 100) / 100; return r % 1 ? String(r) : String(Math.round(r)); }
function dmy(s) { return s ? s.slice(8, 10) + '/' + s.slice(5, 7) + '/' + s.slice(0, 4) : '-'; }
function ymd(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
function addDays(s, n) { var d = new Date(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10) + n); return ymd(d); }
var DASH = String.fromCharCode(8212), SEP = ' ' + String.fromCharCode(8250) + ' ', ARR = ' ' + String.fromCharCode(8594) + ' ';
var ITM = {}, CLN = {};
CLASSES.forEach(function (c) { CLN[c.c] = c.n; });
ITEMS.forEach(function (it) {
ITM[it.c] = it;
var d = null, i;
for (i = 0; i < it.us.length; i++) if (it.us[i][3] === 1) d = it.us[i];
it.d = d || it.us[0] || null;
it.p = it.d ? it.d[2] : 0;
it.last = '';
for (i = 0; i < it.us.length; i++) if (it.us[i][4] > it.last) it.last = it.us[i][4];
});
var RECENT = addDays(META.today, -30);
var view = 'def', cls = '', qry = '', show = '', collapsed = {}, allClosed = false;
var from = addDays(META.today, -90), to = META.today, LOGD = { f: null, t: null, rows: [] }, busy = false;
var fClass = document.getElementById('fClass'), fItem = document.getElementById('fItem'), fItemClr = document.getElementById('fItemClr'),
itemMenu = document.getElementById('itemMenu'), fFrom = document.getElementById('fFrom'), fTo = document.getElementById('fTo'),
sChips = document.getElementById('showChips'), tHead = document.getElementById('tableHead'), tBody = document.getElementById('tableBody'),
noteEl = document.getElementById('tableNote'), titleEl = document.getElementById('tableTitleText'), badge = document.getElementById('periodBadge'),
seg = document.getElementById('viewSeg'), toggleAll = document.getElementById('toggleAllBtn');
CLASSES.forEach(function (c) { var o = document.createElement('option'); o.value = c.c; o.textContent = c.n; fClass.appendChild(o); });
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
fFrom.min = META.minD; fFrom.max = META.today; fFrom.value = from;
fTo.min = META.minD; fTo.max = META.today; fTo.value = to;
function itemOk(it) {
var q = qry.toLowerCase();
if (cls && it.cl !== cls) return false;
if (q && it.c.toLowerCase().indexOf(q) === -1 && it.n.toLowerCase().indexOf(q) === -1) return false;
if (view !== 'log') {
if (show === 'chg' && !(it.last && it.last >= RECENT)) return false;
}
return true;
}
function items() { return ITEMS.filter(itemOk); }
function unitPrice(it, u) {
if (u[2] > 0) return { p: u[2], dv: false };
if (it.d && it.d[2] > 0 && it.d[1] > 0) return { p: it.d[2] * u[1] / it.d[1], dv: true };
return { p: 0, dv: false };
}
function lastTxt(u) { return u[4] ? dmy(u[4]) + ' (' + fp(u[5]) + ARR + fp(u[2]) + ')' : DASH; }
function chip(k, v, lb, n, tip) {
return '<span class="sk-chip' + (show === v ? ' on' : '') + '" data-k="' + v + '"><button type="button" class="ck" title="' + esc(tip) + '">' + lb + (n ? '<small>' + n + '</small>' : '') + '</button></span>';
}
function paintChips() {
var nChg = 0;
ITEMS.forEach(function (it) { if (it.last && it.last >= RECENT) nChg++; });
sChips.innerHTML = chip('k', '', 'All items', 0, 'No filter') +
chip('k', 'chg', 'Changed in the last 30 days', nChg, 'Items with a price change since ' + dmy(RECENT));
Array.prototype.forEach.call(sChips.querySelectorAll('.sk-chip'), function (ch) {
ch.querySelector('.ck').addEventListener('click', function () { show = ch.getAttribute('data-k') || ''; render(); });
});
sChips.parentNode.style.opacity = view === 'log' ? '0.4' : '1';
}
function viewTxt() { return view === 'def' ? 'Default unit' : (view === 'all' ? 'All units' : 'Changes ' + dmy(LOGD.f || from) + ' - ' + dmy(LOGD.t || to)); }
function nowTxt() {
var d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; };
return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
}
function printTitle() { return 'Co. Dashboard | Price List - ' + viewTxt() + (cls ? SEP + (CLN[cls] || cls) : '') + ' | Loaded ' + (META.asOf || '-') + ' | Printed ' + nowTxt(); }
function buildPrintFilters() {
document.getElementById('printFilters').innerHTML = [
'<b>View:</b> ' + esc(viewTxt()), '<b>Class:</b> ' + (cls ? esc(CLN[cls] || cls) : 'All'), '<b>Item:</b> ' + (qry ? esc(qry) : 'All'),
'<b>Show:</b> ' + (show === 'chg' ? 'Changed in the last 30 days' : 'All items'),
'<b>Prices loaded:</b> ' + esc(META.asOf || '-')
].join('<span class="pf-sep">|</span>');
}
function grpRow(c, cnt, nc) {
return '<tr class="grp-row' + (collapsed[c] ? '' : ' open') + '" data-c="' + esc(c) + '"><td colspan="' + nc + '"><span class="tw">&#9654;</span> ' +
esc(CLN[c] || ('Class ' + c)) + '<span class="cnt">' + cnt + ' items</span></td></tr>';
}
function bindGroups() {
Array.prototype.forEach.call(tBody.querySelectorAll('tr.grp-row'), function (tr) {
tr.addEventListener('click', function () {
var c = tr.getAttribute('data-c');
collapsed[c] = !collapsed[c];
tr.classList.toggle('open', !collapsed[c]);
Array.prototype.forEach.call(tBody.querySelectorAll('tr.child-row[data-c="' + c + '"]'), function (x) { x.classList.toggle('hidden', !!collapsed[c]); });
});
});
}
function render() {
paintChips();
Array.prototype.forEach.call(document.querySelectorAll('.pl-period'), function (g) { g.style.display = view === 'log' ? '' : 'none'; });
document.querySelector('.sk-row1').classList.toggle('pl-log', view === 'log');
titleEl.textContent = 'Price List' + SEP + viewTxt();
badge.textContent = viewTxt();
buildPrintFilters();
if (view === 'log') { renderLog(); return; }
var rows = items(), html = '', curC = null, nc = view === 'def' ? 5 : 6, n = 0;
tHead.innerHTML = '<tr class="print-title-row"><th colspan="' + nc + '">' + esc(printTitle()) + '</th></tr><tr>' +
'<th class="c-code">ITEM CODE</th><th>DESCRIPTION</th><th>UNIT</th>' + (view === 'all' ? '<th class="num">PACK</th>' : '') +
'<th class="num">PRICE</th><th class="c-last">LAST CHANGE</th></tr>';
if (!rows.length) {
tBody.innerHTML = '<tr><td colspan="' + nc + '" style="text-align:center;color:var(--muted);padding:24px">No items for this selection.</td></tr>';
noteEl.style.display = 'none'; return;
}
rows.forEach(function (it) {
var hid = collapsed[it.cl] ? ' hidden' : '', first, cnt = 0, i;
if (it.cl !== curC) { curC = it.cl; for (i = 0; i < rows.length; i++) if (rows[i].cl === curC) cnt++; html += grpRow(curC, cnt, nc); }
first = '<td class="c-code">' + esc(it.c) + '</td><td class="c-name" title="' + esc(it.bn ? 'Brand: ' + it.bn : '') + '">' + esc(it.n) + '</td>';
if (view === 'def') {
var d = it.d;
html += '<tr class="child-row' + hid + (it.p > 0 ? '' : ' nop') + '" data-c="' + esc(curC) + '">' + first +
'<td class="c-unit">' + (d ? esc(d[0]) : DASH) + '</td><td class="c-price">' + (it.p > 0 ? fp(it.p) : DASH) + '</td>' +
'<td class="c-last' + (d && d[4] && d[4] >= RECENT ? ' rec' : '') + '">' + (d ? lastTxt(d) : DASH) + '</td></tr>';
n++; return;
}
it.us.forEach(function (u, k) {
var pr = unitPrice(it, u);
html += '<tr class="child-row' + (k ? ' lot-more' : '') + hid + (u[3] === 1 ? ' du' : '') + (pr.p > 0 ? '' : ' nop') + '" data-c="' + esc(curC) + '">' +
(k ? '<td class="c-code"></td><td class="c-name"></td>' : first) +
'<td class="c-unit">' + esc(u[0]) + (u[3] === 1 ? ' <span class="dflt" title="Default unit">default</span>' : '') + '</td>' +
'<td class="num c-pack">' + (u[1] > 1 ? fq(u[1]) + ' x ' + esc(it.us[it.us.length - 1][0]) : DASH) + '</td>' +
'<td class="c-price' + (pr.dv ? ' dv' : '') + '" title="' + (pr.dv ? 'No price on file for this unit: derived from the default unit by the factor' : '') + '">' + (pr.p > 0 ? fp(pr.p) + (pr.dv ? '<small>derived</small>' : '') : DASH) + '</td>' +
'<td class="c-last' + (u[4] && u[4] >= RECENT ? ' rec' : '') + '">' + lastTxt(u) + '</td></tr>';
n++;
});
});
tBody.innerHTML = html;
bindGroups();
noteEl.textContent = rows.length + ' items' + (view === 'all' ? SEP + n + ' unit rows' : '') + SEP + 'prices in the default sale unit, VAT excluded as recorded in the system' + SEP + 'last change = date (old price ' + String.fromCharCode(8594) + ' new price)';
noteEl.style.display = '';
}
function logRows() {
return LOGD.rows.filter(function (r) { var it = ITM[r[1]]; return it ? itemOk(it) : !cls && !qry; });
}
function renderLog() {
tHead.innerHTML = '<tr class="print-title-row"><th colspan="7">' + esc(printTitle()) + '</th></tr><tr>' +
'<th>TIME</th><th class="c-code">ITEM CODE</th><th>DESCRIPTION</th><th>UNIT</th><th class="num">OLD PRICE</th><th class="num">NEW PRICE</th><th class="num">CHANGE</th></tr>';
if (LOGD.f !== from || LOGD.t !== to) {
tBody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:24px">' + (busy ? 'Loading price changes...' : 'Press Run to load the price changes of the period.') + '</td></tr>';
noteEl.style.display = 'none'; return;
}
var rows = logRows(), html = '';
if (!rows.length) {
tBody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:24px">No price changes in this period for this selection.</td></tr>';
noteEl.style.display = 'none'; return;
}
var curD = null;
rows.forEach(function (r) {
var it = ITM[r[1]], ch = r[3] > 0 ? (r[4] - r[3]) / r[3] * 100 : null, d = r[0].slice(0, 10), cnt = 0, i;
if (d !== curD) {
curD = d;
for (i = 0; i < rows.length; i++) if (rows[i][0].slice(0, 10) === d) cnt++;
html += '<tr class="grp-row' + (collapsed[d] ? '' : ' open') + '" data-c="' + d + '"><td colspan="7"><span class="tw">&#9654;</span> ' + dmy(d) + '<span class="cnt">' + cnt + (cnt > 1 ? ' changes' : ' change') + '</span></td></tr>';
}
html += '<tr class="child-row' + (collapsed[d] ? ' hidden' : '') + '" data-c="' + d + '"><td class="c-date">' + esc(r[0].slice(11)) + '</td>' +
'<td class="c-code">' + esc(r[1]) + '</td><td class="c-name">' + esc(it ? it.n : '') + '</td><td class="c-unit">' + esc(r[2]) + '</td>' +
'<td class="c-price old">' + fp(r[3]) + '</td><td class="c-price">' + fp(r[4]) + '</td>' +
'<td class="num ' + (r[4] > r[3] ? 'up' : 'down') + '">' + (ch === null ? 'new' : (ch > 0 ? '+' : '') + (Math.round(ch * 10) / 10).toFixed(1) + '%') + '</td></tr>';
});
tBody.innerHTML = html;
bindGroups();
noteEl.textContent = rows.length + ' price changes' + SEP + dmy(LOGD.f) + ' - ' + dmy(LOGD.t) + SEP + 'newest first' + SEP + 'default unit only';
noteEl.style.display = '';
}
function loadLog() {
if (busy) return;
busy = true; renderLog();
apex.server.process('PRICES_AJAX', { x01: 'log', x02: from, x03: to }, {
success: function (d) {
busy = false;
if (!d || d.err) { alert((d && d.err) || 'Could not load the price changes.'); return; }
LOGD = { f: d.f, t: d.t, rows: d.rows }; closeDates(); render();
},
error: function () { busy = false; alert('Could not load the price changes. Make sure the PRICES_AJAX process exists.'); }
});
}
document.getElementById('runBtn').addEventListener('click', function () {
var f = fFrom.value, t = fTo.value;
if (!f || !t || f > t) { alert('Pick a valid period.'); return; }
from = f; to = t; loadLog();
});
Array.prototype.forEach.call(seg.querySelectorAll('button'), function (b) {
b.addEventListener('click', function () {
var v = b.getAttribute('data-v');
if (v === view) return;
view = v;
Array.prototype.forEach.call(seg.querySelectorAll('button'), function (o) { o.className = o === b ? 'on' : ''; });
if (view === 'log' && LOGD.f !== from) { loadLog(); return; }
render();
});
});
function closeDates() { if (allClosed) LOGD.rows.forEach(function (r) { collapsed[r[0].slice(0, 10)] = true; }); }
toggleAll.addEventListener('click', function () {
allClosed = !allClosed; collapsed = {};
if (allClosed) CLASSES.forEach(function (c) { collapsed[c.c] = true; });
collapsed['0'] = allClosed;
closeDates();
this.textContent = allClosed ? 'Expand all' : 'Collapse all';
render();
});
fClass.addEventListener('change', function () { window.skSetClass(fClass.value); render(); });
var qt = null, shown = '';
fItem.addEventListener('input', function () {
fItemClr.style.display = fItem.value ? '' : 'none';
shown = ''; itemSearch();
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
window.skSetClass(''); qry = ''; show = ''; fItem.value = ''; shown = ''; fItemClr.style.display = 'none'; itemMenu.style.display = 'none';
collapsed = {}; allClosed = false; toggleAll.textContent = 'Collapse all';
from = addDays(META.today, -90); to = META.today; fFrom.value = from; fTo.value = to;
if (view === 'log' && LOGD.f !== from) { loadLog(); return; }
render();
});
function doPrint() {
var orig = document.title, th = document.querySelector('#printTablePanel .print-title-row th');
if (th) th.textContent = printTitle();
document.title = (view === 'log' ? 'Price_Changes_' : 'Price_List_') + META.today;
document.body.classList.add('print-mode-table');
var back = function () { document.title = orig; document.body.classList.remove('print-mode-table'); window.removeEventListener('afterprint', back); };
window.addEventListener('afterprint', back);
window.print();
}
function doExcel() {
if (!window.plXlsx) { alert('Excel writer not loaded (PRICES_XLSX.JS).'); return; }
var lines = [], head, widths, info, name;
if (view === 'log') {
if (LOGD.f !== from || LOGD.t !== to) { alert('Run the period first.'); return; }
logRows().forEach(function (r) {
var it = ITM[r[1]];
lines.push([[r[0], 3], [r[1], 3], [it ? it.n : '', 0], [r[2], 0], [r[3], 5], [r[4], 5], [r[3] > 0 ? Math.round((r[4] - r[3]) / r[3] * 1000) / 10 : '', r[3] > 0 ? 2 : 0]]);
});
head = ['DATE', 'ITEM CODE', 'DESCRIPTION', 'UNIT', 'OLD PRICE', 'NEW PRICE', 'CHANGE %'];
widths = '<cols><col min="1" max="1" width="17" customWidth="1"/><col min="2" max="2" width="15" customWidth="1"/><col min="3" max="3" width="52" customWidth="1"/><col min="4" max="7" width="13" customWidth="1"/></cols>';
info = 'Price changes ' + dmy(LOGD.f) + ' - ' + dmy(LOGD.t) + (cls ? ' - class ' + (CLN[cls] || cls) : '') + (qry ? ' - search "' + qry + '"' : '') + ' - ' + lines.length + ' changes - loaded ' + (META.asOf || '-');
name = 'Price_Changes_' + LOGD.f + '_' + LOGD.t + '.xlsx';
} else {
items().forEach(function (it) {
if (view === 'def') { lines.push([[CLN[it.cl] || it.cl, 0], [it.c, 3], [it.n, 0], [it.d ? it.d[0] : '', 0], [it.p, 5], [it.d && it.d[4] ? dmy(it.d[4]) : '', 3], [it.d && it.d[4] ? it.d[5] : '', it.d && it.d[4] ? 5 : 0]]); return; }
it.us.forEach(function (u) {
var pr = unitPrice(it, u);
lines.push([[CLN[it.cl] || it.cl, 0], [it.c, 3], [it.n, 0], [u[0], 0], [u[1], 2], [pr.p, 5], [pr.dv ? 'derived' : (u[3] === 1 ? 'default' : ''), 0], [u[4] ? dmy(u[4]) : '', 3], [u[4] ? u[5] : '', u[4] ? 5 : 0]]);
});
});
head = view === 'def' ? ['CLASS', 'ITEM CODE', 'DESCRIPTION', 'UNIT', 'PRICE', 'LAST CHANGE', 'PRICE BEFORE']
: ['CLASS', 'ITEM CODE', 'DESCRIPTION', 'UNIT', 'FACTOR', 'PRICE', 'NOTE', 'LAST CHANGE', 'PRICE BEFORE'];
widths = '<cols><col min="1" max="1" width="22" customWidth="1"/><col min="2" max="2" width="15" customWidth="1"/><col min="3" max="3" width="52" customWidth="1"/><col min="4" max="' + head.length + '" width="13" customWidth="1"/></cols>';
info = 'Price List - ' + viewTxt() + (cls ? ' - class ' + (CLN[cls] || cls) : '') + (qry ? ' - search "' + qry + '"' : '') + ' - ' + lines.length + ' rows - loaded ' + (META.asOf || '-');
name = 'Price_List_' + (view === 'def' ? 'Default_' : 'All_Units_') + META.today + '.xlsx';
}
if (!lines.length) { alert('Nothing to export for this selection.'); return; }
window.plXlsx.save(info, head, lines, widths, name, 'Prices');
}
(function () {
var box = document.getElementById('exportBox');
if (!box) return;
if (window.jmExport) { window.jmExport.attach(box, { pdf: doPrint, excel: doExcel }); return; }
box.innerHTML = '<button type="button" class="btn-print btn-excel" id="excelBtn">Export Excel</button> ' +
'<button type="button" class="btn-print" id="printTableBtn">Print / PDF</button>';
document.getElementById('excelBtn').addEventListener('click', doExcel);
document.getElementById('printTableBtn').addEventListener('click', doPrint);
})();
(function () {
var line = document.getElementById('asOfLine');
var ok = (META.asOf || '').slice(0, 10) === dmy(META.today);
line.classList.toggle('fresh', ok);
line.textContent = ok ? 'Prices loaded today ' + META.asOf : 'Prices not loaded today ' + DASH + ' last load: ' + (META.asOf || 'never');
})();
render();
}
initPricesPage();

});
