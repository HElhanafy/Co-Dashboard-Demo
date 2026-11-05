window.stockLots = (function () {
var A = null;
var on = false, openB = null, openS = null, LD = { date: null, rows: [] }, busy = false;
var chips, wChips, wGroup, tHead, tBody, backBtn, titleEl, badge, noteEl, pfEl, seg, toggleAll;
function init(api) {
A = api;
chips = document.getElementById('branchChips'); wChips = document.getElementById('storeChips'); wGroup = document.getElementById('storeGroup');
tHead = document.getElementById('tableHead'); tBody = document.getElementById('tableBody'); backBtn = document.getElementById('backBtn');
titleEl = document.getElementById('tableTitleText'); badge = document.getElementById('periodBadge'); noteEl = document.getElementById('tableNote');
pfEl = document.getElementById('printFilters'); seg = document.getElementById('viewSeg'); toggleAll = document.getElementById('toggleAllBtn');
if (!seg) return;
Array.prototype.forEach.call(seg.querySelectorAll('button'), function (b) {
b.addEventListener('click', function () {
var v = b.getAttribute('data-v') === 'lots';
if (v === on) return;
on = v; A.setLot(on);
Array.prototype.forEach.call(seg.querySelectorAll('button'), function (o) { o.className = o === b ? 'on' : ''; });
if (!on) { openB = null; openS = null; }
A.render();
});
});
}
function fetchLots(date) {
if (busy) return;
busy = true;
noteEl.textContent = 'Loading lots...'; noteEl.style.display = '';
tBody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:24px">Loading lots...</td></tr>';
apex.server.process('STOCK_AJAX_LOTS', { x01: 'bal', x02: date }, {
success: function (d) {
busy = false;
if (!d || d.err) { alert((d && d.err) || 'Could not load lots.'); return; }
LD = { date: date, rows: d.rows };
if (on) render();
},
error: function () { busy = false; alert('Could not load lots. Make sure the STOCK_AJAX_LOTS process exists.'); }
});
}
function itemOk(st, c) {
var it = A.ITM[c], q = st.qry.toLowerCase();
if (!it) return false;
if (st.cls && it.cl !== st.cls) return false;
if (q && it.c.toLowerCase().indexOf(q) === -1 && it.n.toLowerCase().indexOf(q) === -1) return false;
return true;
}
function typeStores(st) {
var has = {};
LD.rows.forEach(function (r) { if (Math.abs(r[4]) > 0.0005 && itemOk(st, r[0])) has[r[1]] = 1; });
var ts = A.STORES.filter(function (s) { return s.t === st.type && has[s.c]; });
if (openB && !ts.some(function (s) { return s.p === openB; })) { openB = null; openS = null; }
if (openS && !ts.some(function (s) { return s.c === openS; })) openS = null;
return ts;
}
function branches(ts) {
var seen = {}, out = [];
ts.forEach(function (s) { if (!seen[s.p]) { seen[s.p] = 1; out.push(s.p); } });
out.sort();
return out;
}
function scopeStores(ts) {
if (openS) return [openS];
if (openB) return ts.filter(function (s) { return s.p === openB; }).map(function (s) { return s.c; });
return ts.map(function (s) { return s.c; });
}
function scopeTxt(ts) {
if (!openB) return 'Company';
var one = openS ? ts.filter(function (s) { return s.c === openS; })[0] : null;
return A.brName(openB) + (one ? A.SEP + A.stName(one) : A.SEP + 'all warehouses');
}
function paintChips(ts) {
var bs = branches(ts), h;
h = '<span class="sk-chip' + (openB ? '' : ' on') + '" data-p=""><button type="button" class="ck" title="Whole company">Company</button></span>';
bs.forEach(function (p) {
var n = ts.filter(function (s) { return s.p === p; }).length;
h += '<span class="sk-chip' + (openB === p ? ' on' : '') + '" data-p="' + A.esc(p) + '">' +
'<button type="button" class="ck" title="Lots of this branch">' + A.esc(A.brName(p)) + (n > 1 ? '<small>' + n + '</small>' : '') + '</button></span>';
});
chips.innerHTML = h;
Array.prototype.forEach.call(chips.querySelectorAll('.sk-chip'), function (ch) {
ch.querySelector('.ck').addEventListener('click', function () {
var p = ch.getAttribute('data-p');
openB = p || null; openS = null; render();
if (openB) document.getElementById('printTablePanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
});
});
var ss = openB ? ts.filter(function (s) { return s.p === openB; }) : [];
h = '';
if (ss.length) {
if (ss.length > 1) h = '<span class="sk-chip wh' + (openS ? '' : ' on') + '" data-s=""><button type="button" class="ck" title="All warehouses of the branch">All</button></span>';
ss.forEach(function (s) {
h += '<span class="sk-chip wh' + (openS === s.c || ss.length === 1 ? ' on' : '') + '" data-s="' + A.esc(s.c) + '">' +
'<button type="button" class="ck" title="Only this warehouse">' + A.esc(A.stName(s)) + '</button></span>';
});
}
wChips.innerHTML = h;
wGroup.style.display = ss.length ? '' : 'none';
Array.prototype.forEach.call(wChips.querySelectorAll('.sk-chip'), function (ch) {
var c = ch.getAttribute('data-s');
ch.querySelector('.ck').addEventListener('click', function () { openS = c || null; render(); });
});
}
function itemLots(st, ts) {
var inScope = {}, byItem = {}, out = [], hidden = 0;
scopeStores(ts).forEach(function (c) { inScope[c] = 1; });
LD.rows.forEach(function (r) {
if (!inScope[r[1]] || !itemOk(st, r[0])) return;
var k = r[3] + '|' + r[2], m = byItem[r[0]] || (byItem[r[0]] = {});
m[k] = m[k] || { lot: r[3], exp: r[2], b: 0 };
m[k].b += r[4];
});
A.ITEMS.forEach(function (it) {
var m = byItem[it.c];
if (!m) return;
var lots = [], k, tot = 0;
for (k in m) { if (Math.abs(m[k].b) > 0.0005) { lots.push(m[k]); tot += m[k].b; } }
if (!lots.length) { hidden++; return; }
lots.sort(function (a, b) { return (a.exp || '9999') < (b.exp || '9999') ? -1 : ((a.exp || '9999') > (b.exp || '9999') ? 1 : (a.lot < b.lot ? -1 : 1)); });
out.push({ it: it, lots: lots, t: tot / (it.f || 1) });
});
return { rows: out, hidden: hidden };
}
function typeLabel(st) { var t = A.TYPES.filter(function (x) { return x.t === st.type; })[0]; return t ? t.tl : ''; }
function printTitle() {
var st = A.state(), ts = typeStores(st);
var d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; };
return 'Co. Dashboard | Stock by Lot - ' + scopeTxt(ts) + ' ' + A.SEP + ' ' + typeLabel(st) + ' ' + A.SEP + ' ' + A.dmy(st.date) +
' | Loaded ' + (A.META.asOf || '-') + ' | Printed ' + p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
}
function buildPrintFilters(st, ts) {
pfEl.innerHTML = [
'<b>View:</b> Lots', '<b>Till date:</b> ' + A.dmy(st.date), '<b>Type:</b> ' + A.esc(typeLabel(st)),
'<b>Class:</b> ' + (st.cls ? A.esc(A.CLN[st.cls] || st.cls) : 'All'), '<b>Item:</b> ' + (st.qry ? A.esc(st.qry) : 'All'),
'<b>Scope:</b> ' + A.esc(scopeTxt(ts)), '<b>Loaded:</b> ' + A.esc(A.META.asOf || '-')
].join('<span class="pf-sep">|</span>');
}
function expTxt(e) { return e ? A.dmy(e) : A.DASH; }
function render() {
var st = A.state();
if (LD.date !== st.date) { fetchLots(st.date); paintHead(); return; }
var ts = typeStores(st), R = itemLots(st, ts), rows = R.rows, html = '', curC = null, nLots = 0;
paintChips(ts);
titleEl.textContent = 'Lots' + A.SEP + scopeTxt(ts);
backBtn.style.display = openB ? '' : 'none';
toggleAll.style.display = rows.length ? '' : 'none';
badge.textContent = 'Till ' + A.dmy(st.date) + A.SEP + 'by lot';
buildPrintFilters(st, ts);
paintHead();
if (!rows.length) {
tBody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:24px">No lots with stock for this selection.</td></tr>';
noteEl.style.display = 'none'; return;
}
rows.forEach(function (r) {
var it = r.it, i, cnt;
if (it.cl !== curC) {
curC = it.cl; cnt = 0;
for (i = 0; i < rows.length; i++) if (rows[i].it.cl === curC) cnt++;
html += '<tr class="grp-row' + (st.collapsed[curC] ? '' : ' open') + '" data-c="' + A.esc(curC) + '">' +
'<td colspan="6"><span class="tw">&#9654;</span> ' + A.esc(A.CLN[curC] || ('Class ' + curC)) + '<span class="cnt">' + cnt + ' items</span></td></tr>';
}
r.lots.forEach(function (l, n) {
var v = l.b / (it.f || 1); nLots++;
html += '<tr class="child-row' + (n ? ' lot-more' : '') + (st.collapsed[curC] ? ' hidden' : '') + '" data-c="' + A.esc(curC) + '">' +
(n ? '<td class="c-code"></td><td class="c-name"></td><td class="c-unit"></td>'
: '<td class="c-code">' + A.esc(it.c) + '</td><td class="c-name" title="' + A.esc(it.bn ? 'Brand: ' + it.bn : '') + '">' + A.esc(it.n) + '</td>' +
'<td class="c-unit' + (it.nf ? ' nf' : '') + '">' + A.esc(it.u) + (it.nf ? ' *' : '') + '</td>') +
'<td class="c-lot">' + A.esc(l.lot || A.DASH) + '</td><td class="c-exp' + (l.exp && l.exp < st.date ? ' expd' : '') + '">' + expTxt(l.exp) + '</td>' +
'<td class="num' + (v < 0 ? ' neg' : '') + '">' + A.qb(v, it) + '</td></tr>';
});
if (r.lots.length > 1) {
html += '<tr class="child-row lot-sum' + (st.collapsed[curC] ? ' hidden' : '') + '" data-c="' + A.esc(curC) + '">' +
'<td class="c-code"></td><td class="c-name">Total ' + A.esc(it.c) + '</td><td class="c-unit">' + A.esc(it.u) + '</td>' +
'<td class="c-lot">' + r.lots.length + ' lots</td><td class="c-exp"></td><td class="num c-tot">' + A.qb(r.t, it) + '</td></tr>';
}
});
tBody.innerHTML = html;
Array.prototype.forEach.call(tBody.querySelectorAll('tr.grp-row'), function (tr) {
tr.addEventListener('click', function () {
var c = tr.getAttribute('data-c');
st.collapsed[c] = !st.collapsed[c];
tr.classList.toggle('open', !st.collapsed[c]);
Array.prototype.forEach.call(tBody.querySelectorAll('tr.child-row[data-c="' + c + '"]'), function (x) {
x.classList.toggle('hidden', !!st.collapsed[c]);
});
});
});
noteEl.textContent = rows.length + ' items' + A.SEP + nLots + ' lots' + (R.hidden ? A.SEP + R.hidden + ' items without stock hidden' : '');
noteEl.style.display = '';
}
function paintHead() {
tHead.innerHTML = '<tr class="print-title-row"><th colspan="6">' + A.esc(printTitle()) + '</th></tr><tr>' +
'<th class="c-code">ITEM CODE</th><th>DESCRIPTION</th><th>UNIT</th><th>LOT</th><th>EXPIRY</th><th class="num">BALANCE</th></tr>';
}
function back() {
if (openS) openS = null; else openB = null;
render();
}
function excel() {
var st = A.state();
if (LD.date !== st.date) { alert('Lots are still loading.'); return; }
var ts = typeStores(st), R = itemLots(st, ts), lines = [], n = 0;
if (!R.rows.length) { alert('Nothing to export for this selection.'); return; }
R.rows.forEach(function (r) {
var it = r.it;
r.lots.forEach(function (l) {
n++;
lines.push([[A.CLN[it.cl] || it.cl, 0], [it.c, 3], [it.n, 0], [it.u, 0], [l.lot || '', 3], [l.exp ? A.dmy(l.exp) : '', 3], [l.b / (it.f || 1), 2]]);
});
});
var info = 'Stock by Lot - till ' + A.dmy(st.date) + ' (inclusive) - ' + typeLabel(st) + ' - ' + scopeTxt(ts) +
(st.cls ? ' - class ' + (A.CLN[st.cls] || st.cls) : '') + (st.qry ? ' - search "' + st.qry + '"' : '') +
' - ' + R.rows.length + ' items, ' + n + ' lots - loaded ' + (A.META.asOf || '-');
var widths = '<cols><col min="1" max="1" width="22" customWidth="1"/><col min="2" max="2" width="15" customWidth="1"/>' +
'<col min="3" max="3" width="52" customWidth="1"/><col min="4" max="4" width="8" customWidth="1"/>' +
'<col min="5" max="5" width="16" customWidth="1"/><col min="6" max="6" width="12" customWidth="1"/>' +
'<col min="7" max="7" width="13" customWidth="1"/></cols>';
A.saveXlsx(info, ['CLASS', 'ITEM CODE', 'DESCRIPTION', 'UNIT', 'LOT', 'EXPIRY', 'BALANCE'], lines, widths,
'Stock_Lots_' + st.date + (openB ? '_' + openB : '') + (openS ? '_' + openS : '') + '.xlsx', 'Lots ' + st.date);
}
return { init: init, render: render, back: back, excel: excel, printTitle: printTitle };
})();
