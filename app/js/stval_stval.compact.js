window.addEventListener("DOMContentLoaded",function(){
function initStvalPage() {
var ids = ['sk-meta', 'sk-i18n', 'sk-stores', 'sk-classes', 'sk-items'], J = {};
for (var i = 0; i < ids.length; i++) {
var el = document.getElementById(ids[i]);
if (!el) {
initStvalPage._t = (initStvalPage._t || 0) + 1;
if (initStvalPage._t < 100) { setTimeout(initStvalPage, 100); return; }
console.error('Stock value page: data region ' + ids[i] + ' not found.');
return;
}
J[ids[i]] = JSON.parse(el.textContent);
}
var META = J['sk-meta'], I18N = J['sk-i18n'], STORES = J['sk-stores'],
CLASSES = J['sk-classes'], ITEMS = J['sk-items'];
var BR = I18N.br || {}, AC = I18N.ac || {};
function idxOf(arr, v) { for (var i = 0; i < arr.length; i++) if (arr[i] === v) return i; return -1; }
function hasVal(arr, v) { return idxOf(arr, v) !== -1; }
function esc(s) {
return String(s === null || s === undefined ? '' : s).replace(/[&<>"]/g, function (m) {
return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m];
});
}
function qb(v, it) {
if (Math.abs(v) >= 1 || v === 0 || !(it.f > 1)) { return q1(v); }
var base = v * it.f, us = it.us || [], i, q, fc;
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
function fm(v) { return (Math.round(v * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fc(v) { return (Math.round(v * 10000) / 10000).toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 }); }
function dmy(s) { return s ? s.slice(8, 10) + '/' + s.slice(5, 7) + '/' + s.slice(0, 4) : '-'; }
var DASH = String.fromCharCode(8212), SEP = ' ' + String.fromCharCode(8250) + ' ', NE = String.fromCharCode(8800);
var STM = {}, TYPES = [], TORD = { 1: 1, 3: 2, 2: 3, 4: 4, 11: 5, 99: 6 };
(function () {
var seen = {};
STORES.forEach(function (s) {
STM[s.c] = s;
if (!seen[s.t]) { seen[s.t] = 1; TYPES.push({ t: s.t, tl: s.tl }); }
});
TYPES.sort(function (a, b) { return (TORD[a.t] || 9) - (TORD[b.t] || 9); });
})();
var ITM = {}; ITEMS.forEach(function (it) { ITM[it.c] = it; });
var CLN = {}; CLASSES.forEach(function (c) { CLN[c.c] = c.n; });
function brName(p) {
if (BR[p]) return BR[p];
for (var i = 0; i < STORES.length; i++) if (STORES[i].p === p) return STORES[i].pe || STORES[i].pn;
return p;
}
function stName(s) { return s.ns || s.na || s.n; }
function typeLabel() { var t = TYPES.filter(function (x) { return x.t === +type; })[0]; return type === '' ? 'All types' : (t ? t.tl : ''); }
var date = META.today, type = '', cls = '', qry = '', chk = '', LOT = false, nosut = false;
var openB = null, openS = null, collapsed = {}, allClosed = false;
var LD = { date: null, rows: [] }, loaded = false, busy = false;
var GL = { date: null, rows: [], asof: '' }, glBusy = false, glOff = false;
var fDate = document.getElementById('fDate'), fType = document.getElementById('fType'),
fClass = document.getElementById('fClass'), fItem = document.getElementById('fItem'),
fItemClr = document.getElementById('fItemClr'), itemMenu = document.getElementById('itemMenu'),
bChips = document.getElementById('branchChips'), wChips = document.getElementById('storeChips'), wGroup = document.getElementById('storeGroup'),
cChips = document.getElementById('checkChips'),
tHead = document.getElementById('tableHead'), tBody = document.getElementById('tableBody'),
backBtn = document.getElementById('backBtn'), noteEl = document.getElementById('tableNote'),
titleEl = document.getElementById('tableTitleText'), badge = document.getElementById('periodBadge'),
seg = document.getElementById('viewSeg'), toggleAll = document.getElementById('toggleAllBtn');
fDate.min = META.minD; fDate.max = META.today; fDate.value = date;
TYPES.forEach(function (t) { var o = document.createElement('option'); o.value = t.t; o.textContent = t.tl; fType.appendChild(o); });
CLASSES.forEach(function (c) { var o = document.createElement('option'); o.value = c.c; o.textContent = c.n; fClass.appendChild(o); });
(function () {
var btn = document.getElementById('fClassBtn'), lbl = document.getElementById('fClassLbl'), menu = document.getElementById('fClassMenu'),
qin = document.getElementById('fClassQ'), list = document.getElementById('fClassList'), pick = document.getElementById('clsPick'), m;
m = '<div class="ss-option" data-v="">All Classes</div>';
CLASSES.forEach(function (c) { m += '<div class="ss-option" data-v="' + esc(c.c) + '"><span class="ss-code">' + esc(c.c) + '</span>' + esc(c.n) + '</div>'; });
list.innerHTML = m;
function open(o) { menu.className = 'ss-menu' + (o ? ' open' : ''); if (o) { qin.value = ''; filt(); qin.focus(); } }
function filt() { var q = qin.value.toUpperCase(), L = list.children, i; for (i = 0; i < L.length; i++) L[i].style.display = !q || L[i].textContent.toUpperCase().indexOf(q) !== -1 ? '' : 'none'; }
window.svSetClass = function (v) { fClass.value = v; cls = v; lbl.textContent = v ? (CLN[v] || v) : 'All Classes'; btn.className = 'cls-btn' + (v ? ' picked' : ''); };
btn.addEventListener('click', function () { open(menu.className.indexOf('open') === -1); });
qin.addEventListener('input', filt);
qin.addEventListener('keydown', function (e) { if (e.key === 'Escape') open(false); });
list.addEventListener('click', function (e) {
var t = e.target;
while (t && t !== list && !(t.getAttribute && t.getAttribute('data-v') !== null)) t = t.parentNode;
if (!t || t === list) return;
window.svSetClass(t.getAttribute('data-v')); open(false); render();
});
document.addEventListener('click', function (e) { if (!pick.contains(e.target)) open(false); });
})();
function itemOk(c) {
var it = ITM[c], q = qry.toLowerCase();
if (!it) return false;
if (cls && it.cl !== cls) return false;
if (nosut && String(it.cl) === '1001') return false;
if (q && it.c.toLowerCase().indexOf(q) === -1 && it.n.toLowerCase().indexOf(q) === -1) return false;
return true;
}
function typeStores() {
var has = {};
LD.rows.forEach(function (r) { if (Math.abs(r[4]) > 0.0005 && itemOk(r[0])) has[r[1]] = 1; });
var ts = STORES.filter(function (s) { return (type === '' || s.t === +type) && has[s.c]; });
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
var all = STORES.filter(function (s) { return type === '' || s.t === +type; });
if (openS) return [openS];
if (openB) return all.filter(function (s) { return s.p === openB; }).map(function (s) { return s.c; });
return all.map(function (s) { return s.c; });
}
function scopeTxt() {
if (!openB) return 'Company';
var s = openS ? STM[openS] : null;
return brName(openB) + (s ? SEP + stName(s) : SEP + 'all warehouses');
}
function chipHtml(cl, on, k, v, lb, n, tip) {
return '<span class="sk-chip' + cl + (on ? ' on' : '') + '" data-' + k + '="' + esc(v) + '">' +
'<button type="button" class="ck" title="' + esc(tip) + '">' + esc(lb) + (n > 0 ? '<small>' + n + '</small>' : '') + '</button></span>';
}
function bindChips(box, k, fn) {
Array.prototype.forEach.call(box.querySelectorAll('.sk-chip'), function (ch) {
ch.querySelector('.ck').addEventListener('click', function () { fn(ch.getAttribute('data-' + k) || null); });
});
}
function paintChips(ts, R) {
var bs = branches(ts), h;
h = chipHtml('', !openB, 'p', '', 'Company', 0, 'Whole company');
bs.forEach(function (p) {
var n = ts.filter(function (s) { return s.p === p; }).length;
h += chipHtml('', openB === p, 'p', p, brName(p), n > 1 ? n : 0, 'Only this branch');
});
bChips.innerHTML = loaded && !bs.length ? '<span class="lbl-hint">No warehouses with stock for this selection</span>' : h;
bindChips(bChips, 'p', function (p) {
openB = p; openS = null; render();
if (openB) document.getElementById('printTablePanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
});
var ss = openB ? ts.filter(function (s) { return s.p === openB; }) : [];
h = '';
if (ss.length > 1) h = chipHtml(' wh', !openS, 's', '', 'All', 0, 'All warehouses of the branch');
ss.forEach(function (s) { h += chipHtml(' wh', openS === s.c || ss.length === 1, 's', s.c, stName(s), 0, 'Only this warehouse'); });
wChips.innerHTML = h;
wGroup.style.display = ss.length ? '' : 'none';
bindChips(wChips, 's', function (c) { openS = c; render(); });
cChips.innerHTML = chipHtml('', !chk, 'k', '', 'All items', 0, 'No check filter') +
chipHtml(' ck-price', chk === 'price', 'k', 'price', 'Cost above sale price', R.nPrice, 'Items whose unit cost (or one of their lots) is above the sale price') +
chipHtml(' ck-issue', chk === 'issue', 'k', 'issue', 'Cost issue', R.nIssue, 'Items with a lot in stock and no cost, a negative cost or a negative balance') +
chipHtml(' ck-sut', nosut, 'k', 'sut', nosut ? 'Sutures hidden' : 'Hide sutures', 0, 'Hide or show the surgical sutures (class 1001) - independent of the check filter');
bindChips(cChips, 'k', function (k) { if (k === 'sut') nosut = !nosut; else chk = k || ''; render(); });
}
function build(ts) {
var inScope = {}, byItem = {}, out = [], nLots = 0, vItems = 0, vLots = 0, bad = [], po = [], resV = 0, resN = 0, k;
scopeStores(ts).forEach(function (c) { inScope[c] = 1; });
LD.rows.forEach(function (r) {
if (!inScope[r[1]] || !itemOk(r[0])) return;
if (Math.abs(r[4]) <= 0.0005) { if (!chk && Math.abs(r[5]) > 0.005) { resV += r[5]; resN++; } return; }
var key = r[3] + '|' + r[2], m = byItem[r[0]] || (byItem[r[0]] = {});
m[key] = m[key] || { lot: r[3], exp: r[2], b: 0, v: 0 };
m[key].b += r[4]; m[key].v += r[5];
});
ITEMS.forEach(function (it) {
var m = byItem[it.c], lots = [], b = 0, v = 0, off = 0, pr = 0, row, f = it.f || 1;
if (!m) return;
for (k in m) {
if (Math.abs(m[k].b) <= 0.0005) continue;
m[k].off = (m[k].b < 0) || (m[k].v <= 0.005);
m[k].po = it.sp > 0 && m[k].b > 0 && (m[k].v / m[k].b * f) > it.sp + 0.00005;
if (m[k].off) off++;
if (m[k].po) pr++;
lots.push(m[k]); b += m[k].b; v += m[k].v;
}
if (!lots.length) return;
lots.sort(function (a, c) { return (a.exp || '9999') < (c.exp || '9999') ? -1 : ((a.exp || '9999') > (c.exp || '9999') ? 1 : (a.lot < c.lot ? -1 : 1)); });
row = { it: it, lots: lots, b: b, v: v, off: off, pr: pr, po: it.sp > 0 && b > 0 && (v / b * f) > it.sp + 0.00005 };
if (off) bad.push(it.c);
if (row.po || pr) po.push(it.c);
if (chk === 'price' && !(row.po || pr)) return;
if (chk === 'issue' && !off) return;
nLots += lots.length; vItems += v;
lots.forEach(function (l) { vLots += l.v; });
out.push(row);
});
return { rows: out, lots: nLots, vItems: vItems + resV, vLots: vLots + resV, resV: resV, resN: resN, bad: bad, po: po, nIssue: bad.length, nPrice: po.length };
}
function ucost(b, v, it) { return b ? v / b * (it.f || 1) : 0; }
function priceTxt(it) { return it.sp > 0 ? fc(it.sp) : DASH; }
function printTitle() {
return 'Co. Dashboard ' + DASH + ' Stock Value' + (LOT ? ' by Lot' : '') + ' ' + DASH + ' ' + scopeTxt() + SEP + typeLabel() + SEP + dmy(date);
}
function chkTxt() { return chk === 'price' ? 'Cost above sale price' : (chk === 'issue' ? 'Cost issue' : 'All items'); }
function sutTxt() { return nosut ? 'Sutures hidden' : ''; }
function buildPrintFilters() {
document.getElementById('printFilters').innerHTML = [
'<b>View:</b> ' + (LOT ? 'Lots' : 'Items'), '<b>Till date:</b> ' + dmy(date), '<b>Type:</b> ' + esc(typeLabel()),
'<b>Class:</b> ' + (cls ? esc(CLN[cls] || cls) : 'All'), '<b>Item:</b> ' + (qry ? esc(qry) : 'All'), '<b>Check:</b> ' + chkTxt() + (nosut ? ', sutures hidden' : ''),
'<b>Scope:</b> ' + esc(scopeTxt()), '<b>Loaded:</b> ' + esc(META.asOf || '-')
].join('<span class="pf-sep">|</span>');
}
function paintCard(R) {
var st = document.getElementById('valStatus'), diff = R.vItems - R.vLots;
document.getElementById('valItems').textContent = loaded ? fm(R.vItems) : DASH;
document.getElementById('valLots').textContent = loaded ? fm(R.vLots) : DASH;
document.getElementById('halfItems').style.opacity = LOT ? '0.55' : '1';
document.getElementById('halfLots').style.opacity = LOT ? '1' : '0.55';
st.className = 'sv-eq' + (loaded ? (Math.abs(diff) < 0.005 ? ' ok' : ' bad') : '');
st.textContent = !loaded ? DASH : (Math.abs(diff) < 0.005 ? '= matched' : NE + ' off by ' + fm(diff));
}
function head() {
var nc = LOT ? 9 : 7;
tHead.innerHTML = '<tr class="print-title-row"><th colspan="' + nc + '">' + esc(printTitle()) + '</th></tr><tr>' +
'<th class="c-code">ITEM CODE</th><th>DESCRIPTION</th><th>UNIT</th>' + (LOT ? '<th>LOT</th><th>EXPIRY</th>' : '') +
'<th class="num">QUANTITY</th><th class="num">UNIT COST</th><th class="num">SALE PRICE</th><th class="num">VALUE</th></tr>';
return nc;
}
function grpRow(curC, rows, nc) {
var cnt = 0, v = 0, i;
for (i = 0; i < rows.length; i++) if (rows[i].it.cl === curC) { cnt++; v += rows[i].v; }
return '<tr class="grp-row' + (collapsed[curC] ? '' : ' open') + '" data-c="' + esc(curC) + '">' +
'<td colspan="' + (nc - 1) + '"><span class="tw">&#9654;</span> ' + esc(CLN[curC] || ('Class ' + curC)) + '<span class="cnt">' + cnt + ' items</span></td>' +
'<td class="c-val">' + fm(v) + '</td></tr>';
}
function render() {
if (LD.date !== date) { load(); return; }
var ts = typeStores(), R = build(ts), rows = R.rows, nc, html = '', curC = null;
paintChips(ts, R);
paintCard(R);
paintGl();
titleEl.textContent = (LOT ? 'Lots' : 'Items') + SEP + scopeTxt() + (chk ? SEP + chkTxt() : '') + (nosut ? SEP + sutTxt() : '');
backBtn.style.display = openB ? '' : 'none';
toggleAll.style.display = rows.length ? '' : 'none';
badge.textContent = 'Till ' + dmy(date) + (LOT ? SEP + 'by lot' : '');
buildPrintFilters();
nc = head();
if (!rows.length) {
tBody.innerHTML = '<tr><td colspan="' + nc + '" style="text-align:center;color:var(--muted);padding:24px">' + (loaded ? 'No items with stock for this selection.' : 'Loading...') + '</td></tr>';
noteEl.style.display = 'none'; return;
}
rows.forEach(function (r) {
var it = r.it, hid = collapsed[it.cl] ? ' hidden' : '', f = it.f || 1, sp = '<td class="c-price">' + priceTxt(it) + '</td>';
var tip = r.off ? 'Cost issue: ' + r.off + ' lot(s) with no cost, negative cost or negative balance' : (r.po || r.pr ? 'Cost above the sale price' + (r.pr ? ' in ' + r.pr + ' lot(s)' : '') : '');
if (it.cl !== curC) { curC = it.cl; html += grpRow(curC, rows, nc); }
var first = '<td class="c-code">' + esc(it.c) + '</td><td class="c-name" title="' + esc(it.bn ? 'Brand: ' + it.bn : '') + '">' + esc(it.n) + '</td>' +
'<td class="c-unit' + (it.nf ? ' nf' : '') + '">' + esc(it.u) + (it.nf ? ' *' : '') + '</td>';
if (!LOT) {
html += '<tr class="child-row' + (r.off ? ' cost-off' : '') + (r.po || r.pr ? ' price-off' : '') + hid + '" data-c="' + esc(curC) + '" title="' + esc(tip) + '">' + first +
'<td class="num' + (r.b < 0 ? ' neg' : '') + '">' + qb(r.b / f, it) + '</td>' +
'<td class="c-cost">' + fc(ucost(r.b, r.v, it)) + '</td>' + sp + '<td class="c-val">' + fm(r.v) + '</td></tr>';
return;
}
r.lots.forEach(function (l, n) {
html += '<tr class="child-row' + (n ? ' lot-more' : '') + (l.off ? ' cost-off' : '') + (l.po ? ' price-off' : '') + hid + '" data-c="' + esc(curC) + '" title="' +
(l.off ? 'Cost issue: stock with no cost, negative cost or negative balance' : (l.po ? 'Lot cost above the sale price' : '')) + '">' +
(n ? '<td class="c-code"></td><td class="c-name"></td><td class="c-unit"></td>' : first) +
'<td class="c-lot">' + esc(l.lot || DASH) + '</td><td class="c-exp' + (l.exp && l.exp < date ? ' expd' : '') + '">' + (l.exp ? dmy(l.exp) : DASH) + '</td>' +
'<td class="num' + (l.b < 0 ? ' neg' : '') + '">' + qb(l.b / f, it) + '</td>' +
'<td class="c-cost">' + fc(ucost(l.b, l.v, it)) + '</td>' + sp + '<td class="c-val">' + fm(l.v) + '</td></tr>';
});
if (r.lots.length > 1) {
html += '<tr class="child-row lot-sum' + hid + '" data-c="' + esc(curC) + '">' +
'<td class="c-code"></td><td class="c-name">Total ' + esc(it.c) + '</td><td class="c-unit">' + esc(it.u) + '</td>' +
'<td class="c-lot">' + r.lots.length + ' lots</td><td class="c-exp"></td><td class="num c-tot">' + qb(r.b / f, it) + '</td>' +
'<td class="c-cost">' + fc(ucost(r.b, r.v, it)) + '</td>' + sp + '<td class="c-val c-tot">' + fm(r.v) + '</td></tr>';
}
});
if (R.resN) {
html += '<tr class="sv-res"><td colspan="' + (nc - 1) + '">Zero-quantity residue <span class="n">' + R.resN + ' lots</span> ' + DASH +
' value still carried by lots at zero quantity (system cost script); not on hand, part of the total</td><td class="c-val">' + fm(R.resV) + '</td></tr>';
}
html += '<tr class="sv-total"><td colspan="' + (nc - 1) + '">TOTAL ' + esc(scopeTxt()) + SEP + rows.length + ' items' + SEP + R.lots + ' lots' +
(R.resN ? SEP + 'on hand ' + fm((LOT ? R.vLots : R.vItems) - R.resV) + ' + residue ' + fm(R.resV) : '') + '</td><td class="c-val">' + fm(LOT ? R.vLots : R.vItems) + '</td></tr>';
tBody.innerHTML = html;
Array.prototype.forEach.call(tBody.querySelectorAll('tr.grp-row'), function (tr) {
tr.addEventListener('click', function () {
var c = tr.getAttribute('data-c');
collapsed[c] = !collapsed[c];
tr.classList.toggle('open', !collapsed[c]);
Array.prototype.forEach.call(tBody.querySelectorAll('tr.child-row[data-c="' + c + '"]'), function (x) { x.classList.toggle('hidden', !!collapsed[c]); });
});
});
noteEl.textContent = 'Value = sum of (quantity x line cost) of every movement of the lot in its warehouse; unit cost = value / quantity in the default unit (system method). Sale price = retail price of the default unit. Zero-quantity residue = value still carried by lots at zero quantity (system cost script); part of the totals and of the Inventory module figure.';
noteEl.style.display = '';
}
function paintGl() {
var card = document.getElementById('glCard'), body = document.getElementById('glBody'), st = document.getElementById('glStatus'),
gL = document.getElementById('glLedger'), gM = document.getElementById('glModule');
if (glOff || openB || !loaded) { card.style.display = 'none'; return; }
card.style.display = '';
document.getElementById('glScope').textContent = SEP + 'Company, all warehouses, all items' + SEP + 'till ' + dmy(date);
if (GL.date !== date) {
fetchGl(date);
body.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:14px">Loading ledger balances...</td></tr>';
st.className = 'sv-eq'; st.textContent = 'loading'; gL.textContent = DASH; gM.textContent = DASH;
return;
}
var mod = {}, cnt = {}, accs = {}, keys = [], h = '', tg = 0, tm = 0, tOn = 0, res = 0, nRes = 0, k;
LD.rows.forEach(function (r) {
var s = STM[r[1]], a = (s && s.a) ? s.a : '(none)';
mod[a] = (mod[a] || 0) + r[5];
if (Math.abs(r[4]) > 0.0005) { (cnt[a] || (cnt[a] = {}))[r[1]] = 1; tOn += r[5]; } else { res += r[5]; nRes++; }
accs[a] = 1;
});
GL.rows.forEach(function (g) { accs[g[0]] = 1; });
for (k in accs) keys.push(k);
keys.sort();
keys.forEach(function (a) {
var g = 0, i, ns = 0, d;
for (i = 0; i < GL.rows.length; i++) if (GL.rows[i][0] === a) g = GL.rows[i][1];
for (k in (cnt[a] || {})) ns++;
d = g - (mod[a] || 0); tg += g; tm += (mod[a] || 0);
h += '<tr><td class="acc">' + esc(a) + '</td><td>' + esc(AC[a] || (a === '(none)' ? 'no account on the warehouse card' : 'Inventory account')) + '</td><td>' + ns + '</td>' +
'<td class="num">' + fm(g) + '</td><td class="num">' + fm(mod[a] || 0) + '</td><td class="num ' + (Math.abs(d) < 0.005 ? 'd-ok' : 'd-bad') + '">' + fm(d) + '</td></tr>';
});
h += '<tr class="tot"><td class="acc">1103*</td><td>All inventory accounts</td><td></td><td class="num">' + fm(tg) + '</td><td class="num">' + fm(tm) + '</td><td class="num ' + (Math.abs(tg - tm) < 0.005 ? 'd-ok' : 'd-bad') + '">' + fm(tg - tm) + '</td></tr>';
body.innerHTML = h;
gL.textContent = fm(tg); gM.textContent = fm(tm);
gM.title = 'Total cost as in the system report (stock on hand ' + fm(tOn) + ' + ' + fm(res) + ' in ' + nRes + ' lots at zero quantity)';
st.className = 'sv-eq' + (Math.abs(tg - tm) < 0.005 ? ' ok' : ' bad');
st.innerHTML = (Math.abs(tg - tm) < 0.005 ? '= matched' : NE + ' ' + fm(tg - tm)) + '<small>ledger minus module</small>';
st.title = 'Ledger balance minus the inventory module total';
}
document.getElementById('glHead').addEventListener('click', function () {
var card = document.getElementById('glCard'), det = document.getElementById('glDetail'), open = det.style.display === 'none';
det.style.display = open ? '' : 'none';
card.classList.toggle('open', open);
});
function fetchGl(d) {
if (glBusy) return;
glBusy = true;
apex.server.process('STVAL_AJAX', { x01: 'gl', x02: d }, {
success: function (r) {
glBusy = false;
if (!r || r.err) { document.getElementById('glBody').innerHTML = '<tr><td colspan="6">Could not load the ledger balances.</td></tr>'; return; }
GL = { date: d, rows: r.rows || [], asof: r.asof || '' };
if (d === date) paintGl();
},
error: function () { glBusy = false; document.getElementById('glBody').innerHTML = '<tr><td colspan="6">Could not load the ledger balances.</td></tr>'; }
});
}
document.getElementById('glMonthEnd').addEventListener('click', function (e) {
e.stopPropagation();
var d = new Date(+META.today.slice(0, 4), +META.today.slice(5, 7) - 1, 0);
setDate(d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2));
});
function load() {
if (busy) return;
busy = true; loaded = false; fDate.disabled = true;
paintCard({ rows: [], lots: 0, vItems: 0, vLots: 0 });
document.getElementById('glCard').style.display = 'none';
if (GL.date !== date) fetchGl(date);
tBody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:24px">Loading...</td></tr>';
apex.server.process('STVAL_AJAX', { x01: 'bal', x02: date }, {
success: function (d) {
busy = false; fDate.disabled = false;
if (!d || d.err || d.error) { alert((d && (d.err || d.error)) || 'Could not load the stock value.'); return; }
LD = { date: date, rows: d.rows }; glOff = !!d.lim; loaded = true; render();
},
error: function () { busy = false; fDate.disabled = false; alert('Could not load the stock value. Make sure the STVAL_AJAX process exists.'); }
});
}
function setDate(s) {
if (!s || s < META.minD || s > META.today) return;
date = s; fDate.value = s; render();
}
fDate.addEventListener('change', function () { setDate(fDate.value); });
Array.prototype.forEach.call(seg.querySelectorAll('button'), function (b) {
b.addEventListener('click', function () {
var v = b.getAttribute('data-v') === 'lots';
if (v === LOT) return;
LOT = v;
Array.prototype.forEach.call(seg.querySelectorAll('button'), function (o) { o.className = o === b ? 'on' : ''; });
render();
});
});
backBtn.addEventListener('click', function () { if (openS) openS = null; else openB = null; render(); });
toggleAll.addEventListener('click', function () {
allClosed = !allClosed; collapsed = {};
if (allClosed) CLASSES.forEach(function (c) { collapsed[c.c] = true; });
collapsed['0'] = allClosed;
this.textContent = allClosed ? 'Expand all' : 'Collapse all';
render();
});
fType.addEventListener('change', function () { type = fType.value; render(); });
fClass.addEventListener('change', function () { window.svSetClass(fClass.value); render(); });
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
type = ''; fType.value = ''; window.svSetClass(''); qry = ''; chk = ''; nosut = false; fItem.value = ''; shown = ''; fItemClr.style.display = 'none'; itemMenu.style.display = 'none';
openB = null; openS = null; collapsed = {}; allClosed = false; toggleAll.textContent = 'Collapse all';
if (date !== META.today) setDate(META.today); else render();
});
function printSheet() {
if (!loaded) { alert('The stock value is still loading.'); return; }
if (!window.svPrint) { alert('Print function not loaded (STVAL_XLSX.JS).'); return; }
window.svPrint({ title: printTitle(), view: LOT ? 'Lots' : 'Items', scope: scopeTxt(), type: typeLabel(), date: dmy(date),
cls: cls ? (CLN[cls] || cls) : '', q: qry, chk: (chk ? chkTxt() : '') + (chk && nosut ? ', ' : '') + sutTxt() });
}
function exportExcel() {
if (!loaded) { alert('The stock value is still loading.'); return; }
if (!window.svXlsx) { alert('Excel writer not loaded (STVAL_XLSX.JS).'); return; }
var R = build(typeStores()), lines = [], headRow, widths, tot = LOT ? R.vLots : R.vItems;
if (!R.rows.length) { alert('Nothing to export for this selection.'); return; }
function ck(off, po) { return off ? 'cost issue' : (po ? 'cost above price' : ''); }
R.rows.forEach(function (r) {
var it = r.it, f = it.f || 1, p = it.sp > 0 ? [it.sp, 6] : ['', 0];
if (!LOT) { lines.push([[CLN[it.cl] || it.cl, 0], [it.c, 3], [it.n, 0], [it.u, 0], [r.b / f, 2], [ucost(r.b, r.v, it), 6], p, [r.v, 5], [ck(r.off, r.po || r.pr), 0]]); return; }
r.lots.forEach(function (l) {
lines.push([[CLN[it.cl] || it.cl, 0], [it.c, 3], [it.n, 0], [it.u, 0], [l.lot || '', 3], [l.exp ? dmy(l.exp) : '', 3], [l.b / f, 2], [ucost(l.b, l.v, it), 6], p, [l.v, 5], [ck(l.off, l.po), 0]]);
});
});
headRow = LOT ? ['CLASS', 'ITEM CODE', 'DESCRIPTION', 'UNIT', 'LOT', 'EXPIRY', 'QUANTITY', 'UNIT COST', 'SALE PRICE', 'VALUE', 'CHECK']
: ['CLASS', 'ITEM CODE', 'DESCRIPTION', 'UNIT', 'QUANTITY', 'UNIT COST', 'SALE PRICE', 'VALUE', 'CHECK'];
if (R.resN) {
var rl = [['', 0], ['', 3], ['Zero-quantity residue (' + R.resN + ' lots)', 0]]; while (rl.length < headRow.length - 2) rl.push(['', 0]); rl.push([R.resV, 5]); rl.push(['', 0]);
lines.push(rl);
}
var tl = [['TOTAL', 4]]; while (tl.length < headRow.length - 2) tl.push(['', 0]); tl.push([tot, 5]); tl.push(['', 0]);
lines.push(tl);
widths = '<cols><col min="1" max="1" width="22" customWidth="1"/><col min="2" max="2" width="15" customWidth="1"/>' +
'<col min="3" max="3" width="52" customWidth="1"/><col min="4" max="4" width="8" customWidth="1"/>' +
(LOT ? '<col min="5" max="5" width="16" customWidth="1"/><col min="6" max="6" width="12" customWidth="1"/>' : '') +
'<col min="' + (LOT ? 7 : 5) + '" max="' + headRow.length + '" width="14" customWidth="1"/></cols>';
var info = 'Stock Value' + (LOT ? ' by Lot' : '') + ' - till ' + dmy(date) + ' (inclusive) - ' + typeLabel() + ' - ' + scopeTxt() +
(cls ? ' - class ' + (CLN[cls] || cls) : '') + (qry ? ' - search "' + qry + '"' : '') + (chk ? ' - ' + chkTxt() : '') + (nosut ? ' - sutures hidden' : '') +
' - ' + R.rows.length + ' items, ' + R.lots + ' lots - Items total ' + fm(R.vItems) + ' / Lots total ' + fm(R.vLots) +
(R.resN ? ' (incl. zero-quantity residue ' + fm(R.resV) + ' in ' + R.resN + ' lots)' : '') + ' - loaded ' + (META.asOf || '-');
window.svXlsx.save(info, headRow, lines, widths, 'Stock_Value_' + (LOT ? 'Lots_' : '') + date + (openB ? '_' + openB : '') + (openS ? '_' + openS : '') + '.xlsx', 'Value ' + date);
}
(function () {
var box = document.getElementById('exportBox'), xb = document.getElementById('excelBtn'), pb = document.getElementById('printTableBtn');
xb.addEventListener('click', exportExcel);
pb.addEventListener('click', printSheet);
if (box && window.jmExport) { window.jmExport.attach(box, { excel: exportExcel, pdf: printSheet }); }
else { xb.style.display = ''; pb.style.display = ''; }
})();
(function () {
var line = document.getElementById('asOfLine');
var ok = (META.asOf || '').slice(0, 10) === dmy(META.today);
line.classList.toggle('fresh', ok);
line.textContent = ok ? 'Movements loaded today ' + META.asOf : 'Movements not loaded today ' + DASH + ' last load: ' + (META.asOf || 'never');
})();
load();
}
initStvalPage();

});
