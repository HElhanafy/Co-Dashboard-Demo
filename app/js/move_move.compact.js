window.addEventListener("DOMContentLoaded",function(){
function initMovePage() {
var ids = ['mv-meta', 'mv-i18n', 'mv-classes'], J = {};
for (var i = 0; i < ids.length; i++) {
var el = document.getElementById(ids[i]);
if (!el || !document.getElementById('tableNote')) {
initMovePage._t = (initMovePage._t || 0) + 1;
if (initMovePage._t < 100) { setTimeout(initMovePage, 100); return; }
console.error('Move page: data region ' + ids[i] + ' not found.');
return;
}
J[ids[i]] = JSON.parse(el.textContent);
}
var META = J['mv-meta'], I18N = J['mv-i18n'], CLASSES = J['mv-classes'];
var KEY = 'mvDims', cached = null;
try { cached = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { cached = null; }
if (cached && cached.v === META.dimsV && cached.items) { startMovePage(META, I18N, CLASSES, cached.brands || {}, cached.items); return; }
document.getElementById('tableNote').textContent = 'Loading item master...';
apex.server.process('MOVE_AJAX', { x01: 'dims' }, {
success: function (d) {
if (!d || !d.items) { alert('Could not load the item master.'); return; }
try { localStorage.setItem(KEY, JSON.stringify({ v: META.dimsV, brands: d.brands, items: d.items })); } catch (e) {}
startMovePage(META, I18N, CLASSES, d.brands || {}, d.items);
},
error: function () { alert('Could not load the item master.'); }
});
}
function startMovePage(META, I18N, CLASSES, BRN, RAW) {
var ITEMS = RAW.map(function (a) {
return { c: a[0], n: a[1], cl: a[2], br: a[3], bn: BRN[a[3]] || '', u: a[4], f: +a[5] || 1, bu: a[6], us: a[7] || [], nf: a[8] };
});
var BR = I18N.br || {}, DP = I18N.dp || {};
var SCOPES = ['C', 'CEN', 'DHB', 'WST', 'EST', 'NTH'], SC0 = 'C';
if (I18N.sc && I18N.sc.length) { SCOPES = I18N.sc; SC0 = SCOPES[0]; }
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
function cell(v, it, extra) {
return v === 0 ? '<td class="num z' + (extra || '') + '">' + DASH + '</td>'
: '<td class="num' + (v < 0 ? ' neg' : '') + (extra || '') + '">' + qb(v, it) + '</td>';
}
function dmy(s) { return s ? s.slice(8, 10) + '/' + s.slice(5, 7) + '/' + s.slice(0, 4) : '-'; }
function ymd(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
function addMonths(s, n) {
var y = +s.slice(0, 4), m = +s.slice(5, 7) - 1 + n, d = +s.slice(8, 10);
var last = new Date(y, m + 1, 0).getDate();
return ymd(new Date(y, m, Math.min(d, last)));
}
var DASH = String.fromCharCode(8212), SEP = ' ' + String.fromCharCode(8250) + ' ';
var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function mlabel(ym) { return MON[+ym.slice(5, 7) - 1] + ' ' + ym.slice(2, 4); }
var PAT = { R: 'Regular: sold in 9+ of 12 months', I: 'Intermittent: sold in 3-8 of 12 months',
S: 'Slow: sold in 1-2 of 12 months', D: 'Dead: no sale in 12 months', N: 'New: first movement < 6 months' };
var ITM = {}; ITEMS.forEach(function (it) { ITM[it.c] = it; });
var CLN = {}; CLASSES.forEach(function (c) { CLN[c.c] = c.n; });
var CUM = {};
var from = META.defFrom, scope = SC0, cust = null, dead = 0, pat = '', exp = 0, hs = 0, rvo = 0,
cls = '', qry = '', ROWS = {}, loaded = false, collapsed = {}, allClosed = false, more = false;
function reduced() { return cust !== null; }
var CBR = '';
function regCol() { return cust !== null && scope === 'C' && !!CBR; }
var fFrom = document.getElementById('fFrom'), fClass = document.getElementById('fClass'),
fItem = document.getElementById('fItem'), fItemClr = document.getElementById('fItemClr'),
fCust = document.getElementById('fCust'), fCustClr = document.getElementById('fCustClr'),
custMenu = document.getElementById('custMenu'), itemMenu = document.getElementById('itemMenu'),
tHead = document.getElementById('tableHead'), tBody = document.getElementById('tableBody');
fFrom.min = META.minD; fFrom.max = META.today; fFrom.value = from;
document.getElementById('fTo').textContent = dmy(META.today);
CLASSES.forEach(function (c) {
var o = document.createElement('option'); o.value = c.c; o.textContent = c.n; fClass.appendChild(o);
});
var setCls = mvClsPick(fClass, CLASSES, CLN, function (v) { cls = v; }, function () { render(); });
function cutoff() { return dead ? addMonths(META.today, -dead) : null; }
var PATN = { R: 'Regular', I: 'Intermittent', S: 'Slow', D: 'Dead', N: 'New' };
function months() { return Math.round((new Date(META.today) - new Date(from)) / 864e5 / 30.4375 * 10) / 10; }
function itemRows() {
var out = [], q = qry.toLowerCase(), cut = cutoff(), NM = months();
ITEMS.forEach(function (it) {
var a = ROWS[it.c];
if (!a) return;
if (it.cl === '0') return;
if (cls && it.cl !== cls) return;
if (hs && /SUTU/i.test(CLN[it.cl] || '')) return;
if (q && it.c.toLowerCase().indexOf(q) === -1 && it.n.toLowerCase().indexOf(q) === -1) return;
if (cut && a[10] && a[10] >= cut) return;
if (pat && a[7] !== pat) return;
if (exp && !(a[6] > 0)) return;
var f = it.f || 1, av = NM > 0 ? a[3] / f / NM : 0, ps = a[23] || 0, on = ((a[19] || 0) + (a[20] || 0)) * ps;
if (rvo && !((a[7] === 'I' || a[27]) && a[9] - a[5] - on > 0)) return;
out.push({ it: it, op: a[1] / f, pu: a[2] / f, sa: a[3] / f, ot: a[4] / f, cl: a[5] / f, ex: a[6] / f,
pt: a[7], f3: a[8] / f, f6: a[9] / f, ls: a[10], na: a[11], sh: a[12], xc: a[13], rc: (a[2] + (a[14] || 0)) / f, ad: (a[4] - (a[14] || 0)) / f,
on: on / f, rq: (a[19] || 0) * ps / f, cq: (a[20] || 0) * ps / f, od: (a[21] || 0) * ps / f, om: a[22], ps: ps,
s1: (a[16] || 0) / f, s2: (a[17] || 0) / f, s3: (a[18] || 0) / f,
p3: Math.max(0, (a[8] - a[5] - on) / f), p6: Math.max(0, (a[9] - a[5] - on) / f),
rt: (a[24] || 0) / f, lt: (a[25] || 130) / 30.4, sf: (a[26] || 0) / f, cut: a[27] || 0,
rg: (a[15] || 0) / f, av: av, cv: av > 0 ? a[5] / f / av : 0, sh2: Math.max(0, (a[3] - a[5]) / f) });
});
return out;
}
function heads() {
var h = [['c-code', 'ITEM CODE'], ['', 'DESCRIPTION'], ['', 'UNIT']];
if (!reduced()) h.push(['num', 'OPENING'], ['num', 'RECEIPTS']);
h.push(['num', 'SALES']);
if (cust) h.push(['num', 'AVG / M']);
if (!reduced()) h.push(['num', 'ADJUSTMENTS']);
h.push(['num', cust ? (scope === 'C' ? 'CO. STOCK' : 'STOCK ' + (BR[scope] || scope).toUpperCase()) : 'STOCK']);
if (cust) {
if (regCol()) h.push(['num', 'STOCK ' + (BR[CBR] || CBR).toUpperCase()]);
h.push(['num', 'COVER (M)'], ['num', 'SHORT'], ['c-pat', 'PAT']); return h;
}
if (exp) h.push(['num', 'EXP 3M']);
h.push(['num', 'ON ORDER'], ['c-pat', 'PAT'], ['num', 'ORDER (3M COVER)'], ['num', 'ORDER (6M COVER)']);
return h;
}
function scopeTxt() { return (BR[scope] || scope) + (cust ? SEP + custName(cust) : ''); }
function titleTxt() { return scopeTxt() + SEP + dmy(from) + ' to ' + dmy(META.today) + (pat ? SEP + PATN[pat] : '') + (dead ? SEP + 'no sale ' + dead + 'm' : '') + (exp ? SEP + 'expiring 3m' : '') + (hs ? SEP + 'without sutures' : '') + (rvo ? SEP + 'to review' : '') + (cls ? SEP + (CLN[cls] || cls) : '') + (qry ? SEP + 'item ' + qry : ''); }
function custName(c) { var x = CUM[c]; return x ? c + ' - ' + x[1] : String(c); }
function render() {
if (window.mvSecClose) mvSecClose();
paintChips();
var rows = itemRows(), H = heads(), nc = H.length + (cust ? 0 : 2), FH = '<th class="num pr">NEED (LEAD+3M)</th><th class="num pr">NEED (LEAD+6M)</th>';
document.getElementById('tableTitleText').textContent = 'Item Movement ' + DASH + ' ' + scopeTxt();
document.getElementById('toggleAllBtn').style.display = rows.length ? '' : 'none';
document.getElementById('periodBadge').textContent = dmy(from) + SEP + dmy(META.today);
var h = '<tr class="print-title-row"><th colspan="' + nc + '">' + esc(printTitle()) + '</th></tr><tr>';
H.forEach(function (x) { h += (x[1] === 'PAT' && !cust ? FH : '') + '<th class="' + x[0] + '">' + x[1] + '</th>'; });
tHead.innerHTML = h + '</tr>';
if (!rows.length) {
tBody.innerHTML = '<tr><td colspan="' + nc + '" style="text-align:center;color:var(--muted);padding:24px">' +
(loaded ? 'No items for this selection.' : 'Loading...') + '</td></tr>';
note(); return;
}
var html = '', curC = null, red = reduced(), NM = months();
rows.forEach(function (r) {
var it = r.it;
if (it.cl !== curC) {
curC = it.cl;
var cnt = 0; for (var i = 0; i < rows.length; i++) if (rows[i].it.cl === curC) cnt++;
html += '<tr class="grp-row' + (collapsed[curC] ? '' : ' open') + '" data-c="' + esc(curC) + '">' +
'<td colspan="' + nc + '"><span class="tw">&#9654;</span> ' +
esc(CLN[curC] || ('Class ' + curC)) + '<span class="cnt">' + cnt + ' items</span></td></tr>';
}
var tn = function (c, nd, p) {
return 'Sales/month ' + q1(r.rt) + ' x (' + q1(r.lt) + ' months supplier lead time + ' + c + ' cover) + safety ' + q1(r.sf) +
' = need ' + q1(nd) + ' - stock ' + q1(r.cl) + ' - on order ' + q1(r.on) + ' = order ' + q1(p) +
(r.cut ? ' | ' + r.cut + ' one-off month(s) capped' : '') + (r.pt === 'I' ? ' | intermittent: review' : '');
}, rv = (r.pt === 'I' || r.cut) ? ' rv' : '',
tip3 = tn(3, r.f3, r.p3), tip6 = tn(6, r.f6, r.p6),
tipO = 'Required ' + q1(r.rq) + ' - at customs ' + q1(r.cq) + (r.od > 0 ? ' - OVERDUE ' + q1(r.od) + ' since ' + mlabel(r.om) : '') +
(r.ps < 1 ? ' - ' + Math.round(r.ps * 100) + '% of company orders (branch share of sales)' : '');
html += '<tr class="child-row' + (collapsed[curC] ? ' hidden' : '') + (r.xc ? ' mv-xc' : '') + '" data-c="' + esc(curC) + '" data-i="' + esc(it.c) + '">' +
'<td class="c-code">' + esc(it.c) + '</td>' +
'<td class="c-name' + (cust ? '' : ' mv-link') + '" title="' + esc((it.bn ? it.bn + ' - ' : '') + (cust ? '' : 'click: customers')) + '">' + esc(it.n) + '</td>' +
'<td class="c-unit' + (it.nf ? ' nf' : '') + '">' + esc(it.u) + (it.nf ? ' *' : '') + '</td>';
if (!red) html += cell(r.op, it) + cell(r.rc, it, ' c-rc mv-link" title="Purchases plus net transfers - click for the documents');
html += cell(r.sa, it, r.sa ? ' c-sa mv-pc" title="Click: net sales by sector' : '');
if (cust) html += cell(r.av, it);
if (!red) html += cell(r.ad, it, ' c-oth mv-link" title="Stock-take, samples, damaged, expired, cross-branch - click for the documents');
html += cell(r.cl, it, r.cl ? ' c-cl mv-pc" title="Click: stock by warehouse' : '') + (exp && !cust ? cell(r.ex, it, ' c-exp') : '') +
(cust ? '' : cell(r.on, it, r.on ? ' c-on mv-pc' + (r.od > 0 ? ' od' : '') + '" title="' + esc(tipO) : ''));
if (cust) {
if (regCol()) html += cell(r.rg, it);
html += '<td class="num c-cov ' + (r.av <= 0 ? 'z' : r.cv >= NM ? 'ok' : r.cv >= NM / 2 ? 'warn' : 'bad') + '" title="Months of stock at this customer\'s rate alone">' +
(r.av <= 0 ? DASH : q1(r.cv)) + '</td>' + cell(r.sh2, it, ' c-short');
}
if (!cust) html += cell(r.f3, it, ' pr') + cell(r.f6, it, ' pr');
html += '<td class="c-pat"><span class="pat pat-' + r.pt + '" title="' + esc(PAT[r.pt] || '') + '">' + r.pt + '</span></td>';
if (!cust) html += '<td class="num c-prop' + (r.p3 ? rv : '') + '" title="' + esc(tip3) + '">' + (r.p3 === 0 ? DASH : qb(r.p3, it)) + '</td>' +
'<td class="num c-prop' + (r.p6 ? rv : '') + '" title="' + esc(tip6) + '">' + (r.p6 === 0 ? DASH : qb(r.p6, it)) + '</td>';
html += '</tr>';
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
note();
}
function note() {
var el = document.getElementById('tableNote');
el.style.display = loaded ? 'none' : '';
document.getElementById('printTablePanel').classList.toggle('ld', !loaded);
}
tBody.addEventListener('click', function (e) {
var td = e.target.closest ? e.target.closest('td') : null;
if (!td) return;
var tr = td.parentNode, code = tr.getAttribute('data-i');
if (!code) return;
if (td.classList.contains('c-oth')) drillDocs(code, 'ad');
else if (td.classList.contains('c-rc')) drillDocs(code, 'rc');
else if (td.classList.contains('mv-pc')) cards(td, code);
else if (td.classList.contains('c-name') && !cust) drillCust(code);
});
function cards(td, code) {
if (mvSecIs(td)) { mvSecClose(); return; }
var w = itemRows().filter(function (x) { return x.it.c === code; })[0], L = [], u, f, o;
if (!w) return;
u = ' - ' + w.it.u; f = w.it.f || 1;
function Q(v) { return qb(v, w.it); }
function pc(v, t) { return t > 0 ? v / t * 100 : null; }
if (td.classList.contains('c-sa')) {
o = w.sa - w.s1 - w.s2 - w.s3;
[['Medical', w.s1], ['Commercial', w.s2], ['Government', w.s3], ['Other', Math.abs(o) >= 0.05 ? o : 0]].forEach(function (a) {
if (a[1]) L.push([a[0], Q(a[1]), pc(a[1], w.sa)]);
});
mvCards(td, 'Net sales by sector' + u, L, ['Total sales', Q(w.sa)]);
} else if (td.classList.contains('c-on')) {
L.push(['Required', Q(w.rq), pc(w.rq, w.on)], ['At customs', Q(w.cq), pc(w.cq, w.on)]);
if (w.od > 0) L.push(['Overdue', Q(w.od), pc(w.od, w.on), 'arrival since ' + mlabel(w.om), 'od']);
mvCards(td, 'Open purchase orders' + u + (w.ps < 1 ? ' - branch share ' + Math.round(w.ps * 100) + '% of company orders' : ''), L, ['On order', Q(w.on)]);
} else {
apex.server.process('MOVE_AJAX', { x01: 'stk', x03: scope, x05: code }, {
success: function (d) {
(d || []).forEach(function (s) { L.push([s[1], Q(s[2] / f), pc(s[2] / f, w.cl), s[3] ? Q(s[3] / f) + ' expired' : '']); });
mvCards(td, 'Stock for sale by warehouse' + u, L, ['Total stock', Q(w.cl)]);
}
});
}
}
function chipRow(el, keys, cur, lab, onPick) {
var h = '';
keys.forEach(function (k) {
var on = typeof cur === 'object' ? !!cur[k] : k === cur;
h += '<span class="sk-chip' + (on ? ' on' : '') + ' ck-' + esc(k) + '" data-k="' + esc(k) + '">' +
'<button type="button" class="ck">' + esc(lab(k)) + '</button></span>';
});
el.innerHTML = h;
Array.prototype.forEach.call(el.querySelectorAll('.sk-chip'), function (ch) {
ch.querySelector('.ck').addEventListener('click', function () { onPick(ch.getAttribute('data-k')); });
});
}
function paintChips() {
chipRow(document.getElementById('scopeChips'), SCOPES, scope, function (k) { return BR[k] || k; },
function (k) { if (k !== scope) { scope = k; load(); } });
var QKS = cust ? ['3', '6', 'Y', '12'] : ['1', '3', '6', 'Y', '12'], qk = '';
QKS.forEach(function (k) { if (quickFrom(k) === from) qk = k; });
chipRow(document.getElementById('quickChips'), QKS, qk, function (k) { return k === 'Y' ? 'YTD' : k + 'M'; },
function (k) { if (quickFrom(k) !== from) setFrom(quickFrom(k)); });
paintMore();
paintActive();
chipRow(document.getElementById('patChips'), ['R', 'I', 'S', 'D', 'N'], pat, function (k) { return PATN[k]; },
function (k) { pat = (k === pat) ? '' : k; render(); });
chipRow(document.getElementById('sutChips'), ['1'], String(hs || ''), function () { return 'Hide sutures'; },
function () { hs = hs ? 0 : 1; render(); });
chipRow(document.getElementById('rvChips'), ['1'], String(rvo || ''), function () { return 'To review'; },
function () { rvo = rvo ? 0 : 1; render(); });
chipRow(document.getElementById('expChips'), ['1'], String(exp || ''), function () { return 'Exp 3M'; },
function () { exp = exp ? 0 : 1; render(); });
chipRow(document.getElementById('deadChips'), ['1', '3', '6'], String(dead || ''), function (k) { return 'No sale ' + k + 'm'; },
function (k) { dead = (+k === dead) ? 0 : +k; render(); });
}
function quickFrom(k) {
var y = META.today.slice(0, 4) + '-01-01';
return k === 'Y' ? (y > META.minD ? y : META.minD) : addMonths(META.today, -(+k));
}
function paintMore() {
var n = (pat ? 1 : 0) + (dead ? 1 : 0) + (exp ? 1 : 0), mb = document.getElementById('moreBtn');
mb.style.display = cust ? 'none' : '';
mb.className = 'mv-more' + (more ? ' open' : '');
mb.innerHTML = (more ? 'Less filters' : 'More filters') + (n ? '<span class="n">' + n + '</span>' : '');
document.getElementById('patLine').style.display = (more && !cust) ? '' : 'none';
}
document.getElementById('moreBtn').addEventListener('click', function () { more = !more; paintMore(); });
function paintActive() {
var el = document.getElementById('activeLine'), L = [];
function add(t, f) { L.push([t, f]); }
if (from !== META.defFrom) add('From ' + dmy(from), function () { setFrom(META.defFrom); });
if (scope !== SC0) add(BR[scope] || scope, function () { scope = SC0; load(); });
if (cust !== null) add(custName(cust), function () { fCustClr.click(); });
if (cls) add(CLN[cls] || cls, function () { setCls(''); render(); });
if (qry) add('Item: ' + qry, function () { fItemClr.click(); });
if (pat) add(PATN[pat], function () { pat = ''; render(); });
if (dead) add('No sale ' + dead + 'm', function () { dead = 0; render(); });
if (exp) add('Expiring 3M', function () { exp = 0; render(); });
if (hs) add('Sutures hidden', function () { hs = 0; render(); });
if (rvo) add('To review', function () { rvo = 0; render(); });
el.style.display = L.length ? '' : 'none';
if (!L.length) return;
var h = 'Active:';
L.forEach(function (x, i) { h += '<span class="af">' + esc(x[0]) + '<button type="button" data-i="' + i + '">&times;</button></span>'; });
el.innerHTML = h + '<button type="button" class="clr">Clear all</button>';
Array.prototype.forEach.call(el.querySelectorAll('.af button'), function (b) {
b.addEventListener('click', function () { L[+b.getAttribute('data-i')][1](); });
});
el.querySelector('.clr').addEventListener('click', function () { document.getElementById('resetBtn').click(); });
}
document.getElementById('toggleAllBtn').addEventListener('click', function () {
allClosed = !allClosed;
collapsed = {};
if (allClosed) CLASSES.forEach(function (c) { collapsed[c.c] = true; });
collapsed['0'] = allClosed;
this.textContent = allClosed ? 'Expand all' : 'Collapse all';
render();
});
function load() {
loaded = false; fFrom.disabled = true; render();
apex.server.process('MOVE_AJAX', { x01: 'rows', x02: from, x03: scope, x04: '*', x05: cust ? String(cust) : '' }, {
success: function (d) {
fFrom.disabled = false;
if (!d || d.err) { alert((d && d.err) || 'Could not load the report.'); return; }
ROWS = {}; CBR = d.cbr || '';
d.rows.forEach(function (a) { ROWS[a[0]] = a; });
loaded = true; render();
},
error: function () {
fFrom.disabled = false;
alert('Could not load the report.');
}
});
}
function setFrom(s) {
if (!s || s < META.minD || s > META.today) return;
from = s; fFrom.value = s; load();
}
fFrom.addEventListener('change', function () { setFrom(fFrom.value); });
fClass.addEventListener('change', function () { setCls(fClass.value); render(); });
var qt = null;
fItem.addEventListener('input', function () {
fItemClr.style.display = fItem.value ? '' : 'none';
clearTimeout(qt); qt = setTimeout(function () { qry = fItem.value.trim(); itemSearch(); render(); }, 200);
});
fItem.addEventListener('focus', itemSearch);
function itemSearch() {
var q = qry.toLowerCase(), h = '', n = 0;
if (q.length < 2) { itemMenu.style.display = 'none'; return; }
for (var i = 0; i < ITEMS.length && n < 20; i++) {
var it = ITEMS[i];
if (it.cl === '0' || !ROWS[it.c]) continue;
if (it.c.toLowerCase().indexOf(q) !== -1 || it.n.toLowerCase().indexOf(q) !== -1) {
n++;
h += '<div class="ss-option" data-c="' + esc(it.c) + '"><span class="ss-code">' + esc(it.c) + '</span> ' + esc(it.n) + '</div>';
}
}
itemMenu.innerHTML = h || '<div class="ss-empty">No item matches</div>';
itemMenu.style.display = 'block';
Array.prototype.forEach.call(itemMenu.querySelectorAll('.ss-option'), function (o) {
o.addEventListener('click', function () { pickItem(o.getAttribute('data-c')); });
});
}
function pickItem(c) { qry = c; fItem.value = c; itemMenu.style.display = 'none'; fItemClr.style.display = ''; render(); }
fItemClr.addEventListener('click', function () { fItem.value = ''; qry = ''; fItemClr.style.display = 'none'; itemMenu.style.display = 'none'; render(); });
function menuKeys(inp, menu, pick) {
inp.addEventListener('keydown', function (e) {
var open = menu.style.display === 'block', opts = open ? menu.querySelectorAll('.ss-option') : [], cur = -1, i, k = e.key;
for (i = 0; i < opts.length; i++) { if (opts[i].className.indexOf('active') !== -1) cur = i; }
if ((k === 'ArrowDown' || k === 'ArrowUp') && opts.length) {
e.preventDefault();
cur = k === 'ArrowDown' ? (cur + 1) % opts.length : (cur <= 0 ? opts.length - 1 : cur - 1);
for (i = 0; i < opts.length; i++) { opts[i].className = 'ss-option' + (i === cur ? ' active' : ''); }
if (opts[cur].scrollIntoView) opts[cur].scrollIntoView({ block: 'nearest' });
} else if (k === 'Enter') {
e.preventDefault();
if (open && opts.length) pick(opts[cur === -1 ? 0 : cur].getAttribute('data-c'));
} else if (k === 'Escape' && open) { menu.style.display = 'none'; }
});
}
menuKeys(fItem, itemMenu, pickItem);
var ct = null;
fCust.addEventListener('input', function () {
fCustClr.style.display = fCust.value ? '' : 'none';
clearTimeout(ct); ct = setTimeout(custSearch, 300);
});
fCust.addEventListener('focus', custSearch);
document.addEventListener('click', function (e) {
if (!custMenu.contains(e.target) && e.target !== fCust) custMenu.style.display = 'none';
if (!itemMenu.contains(e.target) && e.target !== fItem) itemMenu.style.display = 'none';
});
function custSearch() {
var q = fCust.value.trim();
if (q.length < 2 || (cust && fCust.value === custName(cust))) { custMenu.style.display = 'none'; return; }
custMenu.innerHTML = '<div class="ss-empty">Searching...</div>'; custMenu.style.display = 'block';
apex.server.process('MOVE_AJAX', { x01: 'custs', x05: q }, { success: function (d) { custMenuFill(d || []); },
error: function () { custMenu.innerHTML = '<div class="ss-empty">Search failed</div>'; } });
}
function custMenuFill(list) {
var h = '';
list.forEach(function (c) {
CUM[c[0]] = c;
h += '<div class="ss-option" data-c="' + c[0] + '"><span class="ss-code">' + c[0] + '</span> ' + esc(c[1]) +
(c[2] && DP[c[2]] ? ' <small>' + esc(DP[c[2]]) + '</small>' : '') + '</div>';
});
custMenu.innerHTML = h || '<div class="ss-empty">No customer matches</div>';
custMenu.style.display = 'block';
Array.prototype.forEach.call(custMenu.querySelectorAll('.ss-option'), function (o) {
o.addEventListener('click', function () { pickCust(o.getAttribute('data-c')); });
});
}
function pickCust(c) { cust = +c; fCust.value = custName(cust); custMenu.style.display = 'none'; fCustClr.style.display = ''; load(); }
menuKeys(fCust, custMenu, pickCust);
fCustClr.addEventListener('click', function () {
fCust.value = ''; fCustClr.style.display = 'none'; custMenu.style.display = 'none';
if (cust !== null) { cust = null; load(); }
});
document.getElementById('resetBtn').addEventListener('click', function () {
setCls(''); qry = ''; fItem.value = ''; fItemClr.style.display = 'none'; itemMenu.style.display = 'none';
fCust.value = ''; fCustClr.style.display = 'none'; dead = 0; pat = ''; exp = 0; hs = 0; rvo = 0; collapsed = {}; allClosed = false;
document.getElementById('toggleAllBtn').textContent = 'Collapse all';
var reload = (from !== META.defFrom || scope !== SC0 || cust !== null);
from = META.defFrom; fFrom.value = from; scope = SC0; cust = null;
if (reload) load(); else render();
});
var XL = { expired: 'Expired within the period (not a document)', cross: 'Sales served from other branches, net (not a document)' };
function drillDocs(code, kind) {
var it = ITM[code], a = ROWS[code];
if (!it || !a) return;
var rc = kind === 'rc', tot = rc ? a[2] + (a[14] || 0) : a[4] - (a[14] || 0),
S = mvShell((rc ? 'Receipts - ' : 'Adjustments - ') + it.c + ' ' + it.n + ' - ' + scopeTxt().replace(new RegExp(SEP, 'g'), ' - '));
S.n.textContent = (rc ? 'Purchase documents by date, transfers as totals,' : 'Stock-take, sample, damage and other adjustment documents') + ' from ' + dmy(from) + ' to ' + dmy(META.today) + ' in ' + it.u + '. Sales and returns are in the SALES column.';
apex.server.process('MOVE_AJAX', { x01: 'docs', x02: from, x03: scope, x05: code, x06: kind }, {
success: function (d) {
var f = it.f || 1, sum = 0, h = '', rows = (d && d.rows) || [], x = (d && d.x) || [], ti = 0, to = 0, ni = 0, no = 0;
S.h.innerHTML = '<tr><th>DATE</th><th>DOCUMENT</th><th class="c-code">NO.</th><th>WAREHOUSE</th><th class="num">QTY (' + esc(it.u) + ')</th></tr>';
rows.forEach(function (r) {
sum += +r[4];
if (rc && +r[5] === 6) { ti += +r[4]; ni++; return; }
if (rc && +r[5] === 5) { to += +r[4]; no++; return; }
h += '<tr><td>' + dmy(r[0]) + '</td><td>' + esc(r[1]) + '</td><td class="c-code">' + esc(r[2]) + '</td><td>' + esc(r[3]) + '</td>' + cell(+r[4] / f, it) + '</tr>';
});
if (ni) h += '<tr><td colspan="4"><b>Transfers in (' + ni + ')</b></td>' + cell(ti / f, it) + '</tr>';
if (no) h += '<tr><td colspan="4"><b>Transfers out (' + no + ')</b></td>' + cell(to / f, it) + '</tr>';
x.forEach(function (p) {
if (+p[1] !== 0) { sum += +p[1]; h += '<tr><td colspan="4">' + (XL[p[0]] || p[0]) + '</td>' + cell(+p[1] / f, it) + '</tr>'; }
});
var rest = (tot - sum) / f;
if (Math.abs(rest) >= 0.0005) h += '<tr><td colspan="4">Unclassified / rounding</td>' + cell(rest, it) + '</tr>';
h += '<tr class="total-row"><td colspan="4">' + (rc ? 'RECEIPTS' : 'ADJUSTMENTS') + ' (as in the table)</td>' + cell(tot / f, it) + '</tr>';
S.d.innerHTML = h || '<tr><td colspan="5">No documents in the period.</td></tr>';
},
error: function () { S.d.innerHTML = '<tr><td>Could not load.</td></tr>'; }
});
}
function drillCust(code) {
var it = ITM[code];
if (it) mvPop({ it: it, sc: scope, from: from, title: scopeTxt().replace(new RegExp(String.fromCharCode(8250), 'g'), '-'), BR: BR, DP: DP, cust: cust,
cell: function (v, x) { return cell(v, it, x); } });
}
function printTitle() { return 'Co. Dashboard ' + DASH + ' Item Movement ' + DASH + ' ' + titleTxt(); }
document.getElementById('printTableBtn').addEventListener('click', function () {
var orig = document.title;
document.title = printTitle();
document.body.classList.add('print-mode-table');
var back = function () {
document.title = orig; document.body.classList.remove('print-mode-table');
window.removeEventListener('afterprint', back);
};
window.addEventListener('afterprint', back);
window.print();
});
function xmlEsc(s) { return window.mvXmlEsc(s); }
function colRef(i) { return window.mvColRef(i); }
function exportExcel() {
if (!loaded) { alert('The report is still loading.'); return; }
var rows = itemRows();
if (!rows.length) { alert('Nothing to export.'); return; }
var red = reduced();
var info = 'Item Movement - ' + titleTxt().replace(new RegExp(String.fromCharCode(8250), 'g'), '-') + ' - ' + rows.length + ' items - loaded ' + (META.asOf || '-') + ' - default unit';
var head = ['CLASS', 'ITEM CODE', 'DESCRIPTION', 'UNIT'];
heads().slice(3).forEach(function (x) { head.push(x[1]); });
if (!cust) head.push('NEED (LEAD+3M)', 'NEED (LEAD+6M)', 'ACTIVE MONTHS', 'LAST SALE', 'SALES / MONTH', 'LEAD TIME (DAYS)', 'SAFETY STOCK');
var nc = head.length, r = 1, x = '';
function cs(ref, v, st) { return '<c r="' + ref + '" t="inlineStr" s="' + st + '"><is><t xml:space="preserve">' + xmlEsc(v) + '</t></is></c>'; }
function cn(ref, v) { return '<c r="' + ref + '" s="2"><v>' + (Math.round(v * 10) / 10) + '</v></c>'; }
x += '<row r="1">' + cs('A1', info, 4) + '</row><row r="2">';
head.forEach(function (h, i) { x += cs(colRef(i) + '2', h, 1); });
x += '</row>';
r = 2;
rows.forEach(function (rw) {
var it = rw.it, vals = [], k; r++;
if (!red) vals.push(rw.op, rw.rc);
vals.push(rw.sa);
if (cust) vals.push(rw.av);
if (!red) vals.push(rw.ad);
vals.push(rw.cl);
if (cust) { if (regCol()) vals.push(rw.rg); vals.push(rw.cv, rw.sh2); }
if (exp && !cust) vals.push(rw.ex);
if (!cust) vals.push(rw.on);
x += '<row r="' + r + '">' + cs('A' + r, CLN[it.cl] || it.cl, 0) +
cs('B' + r, it.c, 3) + cs('C' + r, it.n, 0) + cs('D' + r, it.u, 0);
for (k = 0; k < vals.length; k++) x += cn(colRef(4 + k) + r, vals[k]);
k = 4 + vals.length;
x += cs(colRef(k) + r, PATN[rw.pt] || rw.pt, 3);
if (!cust) x += cn(colRef(k + 1) + r, rw.p3) + cn(colRef(k + 2) + r, rw.p6) +
cn(colRef(k + 3) + r, rw.f3) + cn(colRef(k + 4) + r, rw.f6) + cn(colRef(k + 5) + r, rw.na) +
cs(colRef(k + 6) + r, rw.ls ? dmy(rw.ls) : '', 3) + cn(colRef(k + 7) + r, rw.rt) + cn(colRef(k + 8) + r, Math.round(rw.lt * 30.4)) + cn(colRef(k + 9) + r, rw.sf);
x += '</row>';
});
var last = colRef(nc - 1) + r;
var widths = '<cols><col min="1" max="1" width="22" customWidth="1"/><col min="2" max="2" width="15" customWidth="1"/>' +
'<col min="3" max="3" width="52" customWidth="1"/><col min="4" max="4" width="8" customWidth="1"/>' +
'<col min="5" max="' + nc + '" width="13" customWidth="1"/></cols>';
var sheet = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
'<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
'<sheetViews><sheetView workbookViewId="0"><pane ySplit="2" topLeftCell="A3" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' +
'<sheetFormatPr defaultRowHeight="15"/>' + widths + '<sheetData>' + x + '</sheetData>' +
'<autoFilter ref="A2:' + last + '"/></worksheet>';
var blob = window.mvXlsxBlob('Movement ' + META.today, sheet);
var a = document.createElement('a');
a.href = URL.createObjectURL(blob);
a.download = 'Item_Movement_' + from + '_' + META.today + '_' + scope + '.xlsx';
document.body.appendChild(a); a.click();
setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
}
document.getElementById('excelBtn').addEventListener('click', exportExcel);
(function () {
var line = document.getElementById('asOfLine');
var ok = (META.asOf || '').slice(0, 10) === dmy(META.today);
line.classList.toggle('fresh', ok);
line.textContent = 'Last load ' + (ok ? 'today ' : '') + (META.asOf || 'never') +
SEP + 'forecast ' + (META.fcstAt || 'never');
line.title = 'Refresh Data reloads the current and previous month only. Edits to older movements appear after the nightly full rebuild.';
})();
load();
}
initMovePage();

});
