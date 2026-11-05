window.addEventListener("DOMContentLoaded",function(){
function initExpiryPage() {
var ids = ['ex-meta', 'ex-i18n', 'ex-stores', 'ex-classes', 'ex-items'], J = {};
for (var i = 0; i < ids.length; i++) {
var el = document.getElementById(ids[i]);
if (!el) {
initExpiryPage._t = (initExpiryPage._t || 0) + 1;
if (initExpiryPage._t < 100) { setTimeout(initExpiryPage, 100); return; }
console.error('Expiry page: data region ' + ids[i] + ' not found.');
return;
}
J[ids[i]] = JSON.parse(el.textContent);
}
var META = J['ex-meta'], I18N = J['ex-i18n'], STORES = J['ex-stores'],
CLASSES = J['ex-classes'], ITEMS = J['ex-items'];
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
function qe(v) { return Math.abs(v) < 1 && v !== 0 ? (Math.round(v * 100) / 100).toFixed(2) : q1(v); }
function q1(v) {
var r = Math.round(v * 10) / 10;
return r.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}
function dmy(s) { return s ? s.slice(8, 10) + '/' + s.slice(5, 7) + '/' + s.slice(0, 4) : '-'; }
function ymd(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
function toD(s) { return new Date(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)); }
function addDays(s, n) { var d = toD(s); d.setDate(d.getDate() + n); return ymd(d); }
function addMonths(s, n) { var d = toD(s); d.setMonth(d.getMonth() + n); return ymd(d); }
var DASH = String.fromCharCode(8212), SEP = ' ' + String.fromCharCode(8250) + ' ';
var SL = [ { k: 1, lb: 'Expired', cls: 'ex1' }, { k: 2, lb: '0-3 M', cls: 'ex2' },
{ k: 3, lb: '3-6 M', cls: 'ex3' }, { k: 4, lb: '6-9 M', cls: 'ex4' },
{ k: 5, lb: '9-12 M', cls: 'ex5' }, { k: 6, lb: '12+ M', cls: 'ex6' } ];
var SLN = { 1: 'EXPIRED', 2: '0-3 M', 3: '3-6 M', 4: '6-9 M', 5: '9-12 M', 6: '12+ M' };
var SL_DEF = [1, 2, 3], SL_ALL = [1, 2, 3, 4, 5, 6], RISK_MAX_SL = 5;
var STM = {}, TYPES = [], TORD = { 1: 1, 3: 2, 2: 3, 4: 4, 11: 5 };
(function () {
var seen = {};
STORES.forEach(function (s) {
STM[s.c] = s;
if (!seen[s.t]) { seen[s.t] = 1; TYPES.push({ t: s.t, tl: s.tl }); }
});
TYPES.sort(function (a, b) { return (TORD[a.t] || 9) - (TORD[b.t] || 9); });
})();
var ITM = {};
ITEMS.forEach(function (it, i) { ITM[it.c] = it; it.i = i; });
var CLN = {};
CLASSES.forEach(function (c) { CLN[c.c] = c.n; });
function brName(p) {
if (BR[p]) return BR[p];
for (var i = 0; i < STORES.length; i++) if (STORES[i].p === p) return STORES[i].pn;
return p;
}
var date = META.today, type = TYPES.length ? TYPES[0].t : 1;
var cls = '', qry = '', slices = SL_DEF.slice(), openB = null,
openS = null,
riskOnly = false;
var LOTS = [];
var SALES = {};
var RISK = {};
function rg(p) { return String(p).slice(0, 3); }
var SELL_TYPES = { 1: 1, 3: 1, 4: 1 };
var MPD = 30.44;
var loaded = false, collapsed = {}, noDate = 0;
var WHO = {}, openLot = null;
var fDate = document.getElementById('fDate'), fType = document.getElementById('fType'),
fClass = document.getElementById('fClass'), fItem = document.getElementById('fItem'),
fItemClr = document.getElementById('fItemClr'), sChips = document.getElementById('sliceChips'),
bChips = document.getElementById('branchChips'), tHead = document.getElementById('tableHead'),
wChips = document.getElementById('storeChips'), sGroup = document.getElementById('storeGroup'),
tBody = document.getElementById('tableBody'), backBtn = document.getElementById('backBtn');
var MAXD = addMonths(META.today, 24);
fDate.min = META.minD; fDate.max = MAXD; fDate.value = date;
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
var o = document.createElement('option'); o.value = c.c; o.textContent = c.n; fClass.appendChild(o);
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
function classify() {
var d3 = addMonths(date, 3), d6 = addMonths(date, 6), d9 = addMonths(date, 9),
d12 = addMonths(date, 12), d0 = toD(date);
noDate = 0;
LOTS.forEach(function (r) {
if (!r.e) { r.sl = 0; r.days = null; noDate++; return; }
r.sl = r.e < date ? 1 : r.e < d3 ? 2 : r.e < d6 ? 3 : r.e < d9 ? 4 : r.e < d12 ? 5 : 6;
r.days = Math.round((toD(r.e) - d0) / 86400000);
});
}
function fefo() {
var b0 = toD(META.balDate || date), scopes = { C: 1 }, pools = {}, pk = [];
RISK = {};
LOTS.forEach(function (r) {
var s = STM[r.s];
if (!s || !SELL_TYPES[s.t] || !r.e || r.b <= 0) return;
[ 'C', rg(s.p) ].forEach(function (sc) {
var pkey = sc + '|' + r.c, lk = pkey + '|' + r.e + '|' + r.l;
if (!pools[pkey]) { pools[pkey] = {}; pk.push(pkey); }
if (!pools[pkey][lk]) pools[pkey][lk] = { e: r.e, q: 0, key: lk };
pools[pkey][lk].q += r.b;
});
});
pk.forEach(function (pkey) {
var lots = [], k, used = 0, rate = SALES[pkey] || 0;
for (k in pools[pkey]) lots.push(pools[pkey][k]);
lots.sort(function (p, q) { return p.e < q.e ? -1 : p.e > q.e ? 1 : 0; });
lots.forEach(function (L) {
var db = (toD(L.e) - b0) / 86400000, m = db > 0 ? db / MPD : 0, cap = rate * m - used;
L.x = Math.min(L.q, Math.max(0, cap));
L.k = L.q - L.x;
used += L.x;
RISK[L.key] = L;
});
});
}
function inScope(r) {
var s = STM[r.s];
if (!s || s.t !== +type || !hasVal(slices, r.sl)) return false;
if (openB && s.p !== openB) return false;
return !openS || r.s === openS;
}
function stores() {
var seen = {}, out = [];
if (!openB) return out;
LOTS.forEach(function (r) {
var s = STM[r.s];
if (!s || s.t !== +type || s.p !== openB || !hasVal(slices, r.sl)) return;
if (!seen[r.s]) { seen[r.s] = 0; out.push(r.s); }
seen[r.s]++;
});
out.sort(function (a, b) { return stName(a) < stName(b) ? -1 : stName(a) > stName(b) ? 1 : 0; });
return out.map(function (c) { return { c: c, n: seen[c] }; });
}
function stName(c) { var s = STM[c]; return s ? (s.ns || s.na || s.n || c) : c; }
function branches() {
var seen = {}, out = [];
LOTS.forEach(function (r) {
var s = STM[r.s];
if (!s || s.t !== +type || !hasVal(slices, r.sl)) return;
if (!seen[s.p]) { seen[s.p] = 0; out.push(s.p); }
seen[s.p]++;
});
out.sort();
return out.map(function (p) { return { p: p, n: seen[p] }; });
}
function sliceCounts() {
var n = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
LOTS.forEach(function (r) {
var s = STM[r.s];
if (s && s.t === +type && r.sl && (!openB || s.p === openB) && (!openS || r.s === openS)) n[r.sl]++;
});
return n;
}
function itemRows() {
var q = qry.toLowerCase(), agg = {}, keys = [];
LOTS.forEach(function (r) {
if (!inScope(r)) return;
var it = ITM[r.c];
if (!it) return;
if (cls && it.cl !== cls) return;
if (q && it.c.toLowerCase().indexOf(q) === -1 && it.n.toLowerCase().indexOf(q) === -1) return;
var k = r.c + '|' + r.e + '|' + r.l;
if (!agg[k]) { agg[k] = { key: k, it: it, e: r.e, l: r.l, sl: r.sl, days: r.days, b: 0 }; keys.push(k); }
agg[k].b += r.b;
});
var out = [], hidden = 0, sc = openB ? rg(openB) : 'C';
keys.forEach(function (k) {
var a = agg[k], f = a.it.f || 1, v = a.b / f, R = RISK[sc + '|' + k], share;
if (v === 0) { hidden++; return; }
share = R && R.q > 0 ? Math.min(1, a.b / R.q) : 0;
a.x = R ? R.x * share : 0; a.k = R ? R.k * share : (a.b > 0 ? a.b : 0);
a.v = v; a.vx = a.x / f; a.va = (SALES[sc + '|' + a.it.c] || 0) / f;
if (v >= 1 && Math.abs(v - Math.round(v)) < 1e-6) { a.vx = Math.floor(a.vx + 1e-6); }
a.vk = a.sl && a.sl <= RISK_MAX_SL ? Math.max(0, v - a.vx) : 0;
if (riskOnly && !(a.vk > 0)) { return; }
out.push(a);
});
out.sort(function (x, y) {
if (x.it.i !== y.it.i) return x.it.i - y.it.i;
return x.e < y.e ? -1 : x.e > y.e ? 1 : 0;
});
return { rows: out, hidden: hidden };
}
var NCOL = 11;
function qz(v, it) { return v > 0 ? (v < 1 && it ? qb(v, it) : qe(v)) : DASH; }
function scopeTxt() { return openB ? 'Branch ' + brName(openB) + (openS ? SEP + stName(openS) : '') : 'Company'; }
function titleTxt() {
var t = TYPES.filter(function (x) { return x.t === +type; })[0];
return scopeTxt() + (t ? SEP + t.tl : '') + SEP + 'as of ' + dmy(date);
}
function render() {
paintChips();
var R = itemRows(), rows = R.rows;
document.getElementById('tableTitleText').textContent = 'Expiring Stock - ' + scopeTxt();
backBtn.style.display = openB ? '' : 'none';
document.getElementById('toggleAllBtn').style.display = rows.length ? '' : 'none';
document.getElementById('periodBadge').textContent = 'As of ' + dmy(date);
buildPrintFilters();
tHead.innerHTML = '<tr class="print-title-row"><th colspan="' + NCOL + '">' + esc(printTitle()) + '</th></tr><tr>' +
'<th class="c-code">ITEM CODE</th><th>DESCRIPTION</th><th>UNIT</th><th class="c-lot">LOT</th>' +
'<th class="c-exp">EXPIRY</th><th class="num c-days">DAYS</th><th class="c-st">STATUS</th><th class="num">QTY</th>' +
'<th class="num c-amc" title="Sales of this item per month in the selected scope (company or branch, all its warehouses), average of the last 6 complete months. Transfers between warehouses do not count.">SALES / M</th>' +
'<th class="num c-exs" title="What the scope will manage to sell of this lot before it expires at its current sales rate (nearer lots first)">SELL BEFORE EXP</th>' +
'<th class="num c-risk" title="What will still be unsold on the expiry date at the current sales rate (lots under one year)">WILL EXPIRE</th></tr>';
if (!rows.length) {
tBody.innerHTML = '<tr><td colspan="' + NCOL + '" style="text-align:center;color:var(--muted);padding:24px">' +
(loaded ? 'No expiring lots for this selection.' : 'Loading...') + '</td></tr>';
note(R); return;
}
var html = '', curC = null, tot = 0;
rows.forEach(function (r) {
var it = r.it;
if (it.cl !== curC) {
curC = it.cl;
var cnt = 0, seen = {};
for (var i = 0; i < rows.length; i++) if (rows[i].it.cl === curC && !seen[rows[i].it.c]) { seen[rows[i].it.c] = 1; cnt++; }
html += '<tr class="grp-row' + (collapsed[curC] ? '' : ' open') + '" data-c="' + esc(curC) + '">' +
'<td colspan="' + NCOL + '"><span class="tw">&#9654;</span> ' +
esc(CLN[curC] || ('Class ' + curC)) + '<span class="cnt">' + cnt + ' items</span></td></tr>';
}
html += '<tr class="child-row' + (collapsed[curC] ? ' hidden' : '') + '" data-c="' + esc(curC) + '">' +
'<td class="c-code">' + esc(it.c) + '</td>' +
'<td class="c-name" title="' + esc(it.bn ? 'Brand: ' + it.bn : '') + '">' + esc(it.n) + '</td>' +
'<td class="c-unit' + (it.nf ? ' nf' : '') + '">' + esc(it.u) + (it.nf ? ' *' : '') + '</td>' +
'<td class="c-lot">' + esc(r.l || DASH) + '</td>' +
'<td class="c-exp">' + dmy(r.e) + '</td>' +
'<td class="num c-days' + (r.days < 0 ? ' neg' : '') + '">' + (r.days === null ? DASH : r.days) + '</td>' +
'<td class="c-st"><span class="ex-badge ' + SL[r.sl - 1].cls + '">' + SLN[r.sl] + '</span></td>' +
'<td class="num c-tot">' + qb(r.v, it) + '</td>' +
'<td class="num c-amc">' + qz(r.va, it) + '</td>' +
'<td class="num c-exs">' + qz(r.vx, it) + '</td>' +
(r.vk > 0 ? '<td class="num c-risk neg dr" data-k="' + esc(r.key) + '" title="Where is this quantity, and who sells the item">' + qz(r.vk, it) + '</td>'
: '<td class="num c-risk">' + DASH + '</td>') + '</tr>';
if (openLot === r.key) html += whoHtml(r);
tot += r.v;
});
tBody.innerHTML = html;
Array.prototype.forEach.call(tBody.querySelectorAll('td.dr'), function (td) {
td.addEventListener('click', function () {
var k = td.getAttribute('data-k');
openLot = openLot === k ? null : k;
render();
});
});
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
note(R);
}
function whoHtml(r) {
var it = r.it, f = it.f || 1, ck = it.c, W = WHO[ck];
var wrap = function (inner) { return '<tr class="who-row"><td colspan="' + NCOL + '"><div class="who">' + inner + '</div></td></tr>'; };
if (!W) { loadWho(it.c, ck); return wrap('<span class="who-ld">Loading branches...</span>'); }
if (W.err) return wrap('<span class="who-ld">' + esc(W.err) + '</span>');
var LS = {}, br = {}, bk = [], lk = '|' + it.c + '|' + r.e + '|' + r.l;
W.rows.forEach(function (a) { LS[a[0]] = a[1] || ''; });
LOTS.forEach(function (x) {
var s = STM[x.s], g, b;
if (x.c !== it.c || x.e !== r.e || x.l !== r.l || !s || x.b <= 0) return;
g = rg(s.p);
if (!br[g]) { br[g] = { p: g, q: 0, ws: [], wm: {} }; bk.push(g); }
b = br[g]; b.q += x.b;
if (!b.wm[x.s]) { b.wm[x.s] = { s: x.s, q: 0, t: s.t, bn: brName(s.p) }; b.ws.push(b.wm[x.s]); }
b.wm[x.s].q += x.b;
});
function nearer(sc) {
var t = 0, k, pre = sc + '|' + it.c + '|';
for (k in RISK) if (k.indexOf(pre) === 0 && RISK[k].e < r.e) t += RISK[k].q;
return t / f;
}
var under = r.sl && r.sl <= RISK_MAX_SL;
function riskV(sc, q) {
var R = RISK[sc + lk], vq = q / f, vx;
if (!under) return 0;
if (!R || !(R.q > 0)) return vq;
vx = R.x * Math.min(1, q / R.q) / f;
if (vq >= 1 && Math.abs(vq - Math.round(vq)) < 1e-6) vx = Math.floor(vx + 1e-6);
return Math.max(0, vq - vx);
}
var un = ' <small class="who-u">' + esc(it.u) + '</small>';
function qu(v) { return v > 0 ? (v < 1 ? qb(v, it) : qe(v) + un) : DASH; }
var b0 = toD(META.balDate || date);
function lastSale(ls) {
if (!ls) return '<span class="ls-none">none</span>';
var mo = Math.floor((b0 - toD(ls)) / 86400000 / MPD);
return dmy(ls) + ' <span class="ls-tag' + (mo >= 6 ? ' ls6' : mo >= 3 ? ' ls3' : '') + '">' + (mo < 1 ? '< 1 M' : mo + ' M') + '</span>';
}
bk.forEach(function (p) { var b = br[p]; b.k = riskV(p, b.q); b.rate = SALES[p + '|' + it.c] || 0; b.near = nearer(p); b.ws.sort(function (x, y) { return y.q - x.q; }); });
bk.sort(function (p, q) { return br[q].k - br[p].k || br[q].q - br[p].q; });
var h = '<div class="who-title"><span class="wt-code">' + esc(it.c) + '</span>' + SEP + 'LOT <b>' + esc(r.l || DASH) + '</b>' +
SEP + 'EXPIRES <b>' + dmy(r.e) + '</b>' +
' <span class="ex-badge ' + SL[r.sl - 1].cls + '">' + SLN[r.sl] + '</span>' +
(r.days === null ? '' : '<span class="wt-days' + (r.days < 0 ? ' neg' : '') + '">' + (r.days < 0 ? 'EXPIRED ' + (-r.days) + ' DAYS AGO' : 'IN ' + r.days + ' DAYS') + '</span>') +
'</div>' +
'<table class="who-t"><thead><tr><th>BRANCH</th><th>WAREHOUSE</th><th class="num">THIS LOT</th>' +
'<th class="c-ls" title="Last sale of the item from this warehouse, and months since">LAST SALE</th>' +
'<th class="num" title="FEFO of the region (branch + reps + showroom): its sellable stock against its sales, nearer lots first">WILL EXPIRE</th>' +
'<th class="num" title="Sales of the item per month in the region, all its warehouses, last 6 complete months">SALES / M</th></tr></thead><tbody>';
bk.forEach(function (p) {
var b = br[p], n = b.ws.length, cls = ' class="who-br' + (b.k > 0 ? ' who-risk' : '') + '"';
b.ws.forEach(function (w, i) {
var s = STM[w.s];
h += '<tr' + cls + '><td class="ar">' + esc(w.bn) + '</td>' +
'<td class="ar wh">' + esc(stName(w.s)) + (s && s.t !== +type ? ' <small>' + esc(s.tl || '') + '</small>' : '') +
(s && !SELL_TYPES[s.t] ? ' <small class="ls-none">not sellable</small>' : '') + '</td>' +
'<td class="num">' + qu(w.q / f) + '</td>' +
'<td class="c-ls">' + lastSale(LS[w.s]) + '</td>' +
(i === 0 ? '<td class="num' + (b.k > 0 ? ' neg' : '') + '" rowspan="' + n + '">' + qu(b.k) +
(b.k > 0 && b.near > 0 ? '<div class="who-near">after ' + qe(b.near) + ' ' + esc(it.u) + ' of nearer lots</div>' : '') + '</td>' +
'<td class="num" rowspan="' + n + '">' + qu(b.rate / f) + '</td>' : '') + '</tr>';
});
});
if (!bk.length) h += '<tr><td colspan="6" class="who-ld">No warehouse holds this lot.</td></tr>';
return wrap(h + '</tbody></table>');
}
function loadWho(c, ck) {
if (WHO[ck + '~']) return;
WHO[ck + '~'] = 1;
apex.server.process('EXPIRY_AJAX', { x01: 'who', x02: date, x03: c }, {
success: function (d) { WHO[ck] = d && d.rows ? d : { err: 'Could not load branches.' }; render(); },
error: function () { WHO[ck] = { err: 'Could not load branches.' }; render(); }
});
}
function note(R) {
var el = document.getElementById('tableNote');
el.textContent = loaded ? '' : 'Loading lot balances...';
el.style.display = loaded ? 'none' : '';
}
function paintChips() {
var n = sliceCounts(), h = '', allOn = slices.length === SL_ALL.length;
h += '<span class="sk-chip sl tg' + (allOn ? ' on' : '') + '" data-k="all"><button type="button" class="ck" title="All slices; click again for the default (Expired, 0-3, 3-6)">All</button></span>';
SL.forEach(function (s) {
h += '<span class="sk-chip sl ' + s.cls + (hasVal(slices, s.k) ? ' on' : '') + '" data-k="' + s.k + '">' +
'<button type="button" class="ck" title="Show or hide this slice">' + s.lb + '<small>(' + n[s.k] + ')</small></button></span>';
});
h += '<span class="sk-chip sl rk' + (riskOnly ? ' on' : '') + '" data-k="risk"><button type="button" class="ck" title="Only lots with a quantity that will expire unsold">Will expire only</button></span>';
sChips.innerHTML = h;
Array.prototype.forEach.call(sChips.querySelectorAll('.sk-chip'), function (ch) {
var kk = ch.getAttribute('data-k');
ch.querySelector('.ck').addEventListener('click', function () {
if (kk === 'all') { slices = allOn ? SL_DEF.slice() : SL_ALL.slice(); }
else if (kk === 'risk') { riskOnly = !riskOnly; }
else {
var k = +kk, i = idxOf(slices, k);
if (i === -1) slices.push(k); else slices.splice(i, 1);
}
render();
});
});
var bs = branches();
h = '<span class="sk-chip' + (openB ? '' : ' on') + '" data-p=""><button type="button" class="ck" title="Whole company">Company</button></span>';
bs.forEach(function (b) {
h += '<span class="sk-chip' + (openB === b.p ? ' on' : '') + '" data-p="' + esc(b.p) + '">' +
'<button type="button" class="ck" title="Show the expiring lots of this branch">' + esc(brName(b.p)) +
'<small>(' + b.n + ')</small></button></span>';
});
bChips.innerHTML = h;
var ss = stores(), tot = 0;
var nb = 0;
STORES.forEach(function (w) { if (w.t === +type && w.p === openB) nb++; });
if (nb < 2) ss = [];
ss.forEach(function (w) { tot += w.n; });
if (ss.length) {
h = ss.length > 1 ? '<span class="sk-chip wh' + (openS ? '' : ' on') + '" data-s=""><button type="button" class="ck" title="All warehouses of the branch">All<small>(' + tot + ')</small></button></span>' : '';
ss.forEach(function (w) {
h += '<span class="sk-chip wh' + (openS === w.c || ss.length === 1 ? ' on' : '') + '" data-s="' + esc(w.c) + '">' +
'<button type="button" class="ck" title="Only this warehouse">' + esc(stName(w.c)) +
'<small>(' + w.n + ')</small></button></span>';
});
wChips.innerHTML = h;
sGroup.style.display = '';
Array.prototype.forEach.call(wChips.querySelectorAll('.sk-chip'), function (ch) {
var c = ch.getAttribute('data-s');
ch.querySelector('.ck').addEventListener('click', function () { openS = c || null; render(); });
});
} else {
wChips.innerHTML = ''; sGroup.style.display = 'none';
}
Array.prototype.forEach.call(bChips.querySelectorAll('.sk-chip'), function (ch) {
var p = ch.getAttribute('data-p');
ch.querySelector('.ck').addEventListener('click', function () {
openB = p || null; openS = null; render();
if (p) document.getElementById('printTablePanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
});
});
}
backBtn.addEventListener('click', function () { openB = null; openS = null; render(); });
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
apex.server.process('EXPIRY_AJAX', { x01: 'bal', x02: date }, {
success: function (d) {
fDate.disabled = false;
if (!d || d.err) { alert((d && d.err) || 'Could not load lot balances.'); return; }
LOTS = d.rows.map(function (a) { return { c: a[0], s: a[1], e: a[2], l: a[3], b: a[4] }; });
SALES = {};
(d.sales || []).forEach(function (a) {
SALES[a[1] + '|' + a[0]] = (SALES[a[1] + '|' + a[0]] || 0) + a[2];
SALES['C|' + a[0]] = (SALES['C|' + a[0]] || 0) + a[2];
});
META.amcFrom = d.w || ''; META.balDate = d.b || date;
WHO = {}; openLot = null;
classify();
fefo();
var bs = branches().map(function (b) { return b.p; });
if (openB && !hasVal(bs, openB)) openB = null;
if (openS && !STM[openS]) openS = null;
loaded = true; render();
},
error: function () {
fDate.disabled = false;
alert('Could not load lot balances. Make sure the EXPIRY_AJAX process exists.');
}
});
}
function setDate(s) {
if (!s || s < META.minD || s > MAXD) return;
date = s; fDate.value = s; load();
}
fDate.addEventListener('change', function () { setDate(fDate.value); });
fType.addEventListener('change', function () { type = +fType.value; openB = null; openS = null; paintTypeChips(); render(); });
fClass.addEventListener('change', function () { window.skSetClass(fClass.value); render(); });
var qt = null;
var itemMenu = document.getElementById('itemMenu'), shown = '';
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
slices = SL_DEF.slice(); riskOnly = false; openB = null; openS = null; openLot = null; collapsed = {}; allClosed = false;
document.getElementById('toggleAllBtn').textContent = 'Collapse all';
if (date !== META.today) setDate(META.today); else render();
});
function sliceTxt() {
var t = SL.filter(function (s) { return hasVal(slices, s.k); }).map(function (s) { return s.lb; }).join(', ') || 'None';
return riskOnly ? t + ' (will expire only)' : t;
}
function nowTxt() {
var d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; };
return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
}
function printTitle() { return 'Co. Dashboard | Stock Expiry - ' + titleTxt() + ' | Loaded ' + (META.asOf || '-') + ' | Printed ' + nowTxt(); }
function buildPrintFilters() {
var box = document.getElementById('printFilters');
var t = TYPES.filter(function (x) { return x.t === +type; })[0];
box.innerHTML = [
'<b>As of:</b> ' + dmy(date),
'<b>Type:</b> ' + esc(t ? t.tl : '-'),
'<b>Expiry:</b> ' + esc(sliceTxt()),
'<b>Scope:</b> ' + esc(scopeTxt()),
'<b>Class:</b> ' + (cls ? esc(CLN[cls] || cls) : 'All'),
'<b>Item:</b> ' + (qry ? esc(qry) : 'All'),
'<b>Stock as of:</b> ' + dmy(META.balDate || date),
'<b>Sales window:</b> ' + (META.amcFrom ? dmy(META.amcFrom) + ' to ' + dmy(addDays((META.balDate || date).slice(0, 8) + '01', -1)) : '-'),
'<b>Loaded:</b> ' + esc(META.asOf || '-')
].join('<span class="pf-sep">|</span>');
}
function printTable() {
var orig = document.title, th = document.querySelector('#printTablePanel .print-title-row th');
if (th) th.textContent = printTitle();
document.title = 'Stock_Expiry_' + date;
document.body.classList.add('print-mode-table');
var back = function () {
document.title = orig; document.body.classList.remove('print-mode-table');
window.removeEventListener('afterprint', back);
};
window.addEventListener('afterprint', back);
window.print();
}
function exportExcel() {
if (!loaded) { alert('Lot balances are still loading.'); return; }
if (!window.expiryXlsx) { alert('Excel writer not loaded (EXPIRY.XLSX.JS).'); return; }
var rows = itemRows().rows;
if (!rows.length) { alert('Nothing to export for this selection.'); return; }
window.expiryXlsx({
rows: rows, date: date, CLN: CLN, SLN: SLN, dmy: dmy, riskMax: RISK_MAX_SL,
suffix: (openB ? '_' + openB : '') + (openS ? '_' + openS : ''),
info: 'Stock Expiry - ' + titleTxt() + ' - expiry: ' + sliceTxt() +
(cls ? ' - class ' + (CLN[cls] || cls) : '') + (qry ? ' - search "' + qry + '"' : '') +
' - ' + rows.length + ' lots - loaded ' + (META.asOf || '-')
});
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
(function () {
var line = document.getElementById('asOfLine');
var ok = (META.asOf || '').slice(0, 10) === dmy(META.today);
line.classList.toggle('fresh', ok);
line.textContent = ok ? 'Movements loaded today ' + META.asOf
: 'Movements not loaded today ' + DASH + ' last load: ' + (META.asOf || 'never');
})();
load();
}
initExpiryPage();

});
