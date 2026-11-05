window.addEventListener("DOMContentLoaded",function(){
(function () {
var P = null, M = null, SEL = null, TAB = 'P', PF = '', AGE = '', PQ = '', NAV = [], busy = false, HITS = [], ACT = 0, QT = null, CHQ_BANK = 901, MIN = '2023-01-01';
var KM = { RCV: 'Received in portfolio', BNC: 'Bounced - back to portfolio', DEP: 'Deposited - out of portfolio', RET: 'Returned to customer', BIN: 'Received in bank', BBK: 'Bounced from bank', BOUT: 'Paid from bank' };
var KC = { RCV: 'CIN', BNC: 'CIN', DEP: 'COUT', RET: 'TOUT', BIN: 'TIN', BBK: 'TOUT', BOUT: 'TOUT' };
var SL = { RCV: 'Received in portfolio', BNC: 'Bounced - back to portfolio', DEP: 'Deposited in bank', RET: 'Returned to customer', BIN: 'Received in bank', BOUT: 'Paid from bank' }, SC = { RCV: '', BNC: ' out', DEP: ' end', RET: ' out', BIN: ' end', BOUT: ' out' };
var TT = { P: ['Cheques in Portfolio', 'Cheques under collection still in the portfolios: not deposited in a bank and not returned to the customer'], M: ['Cheque Movement', 'Search a cheque by its number or amount: every movement in the period, debit and credit, with the journal entry'] };
function $(id) { return document.getElementById(id); }
if (!$('pfBody')) { return; }
function esc(s) { return String(s === null || s === undefined ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function pad(n) { return (n < 10 ? '0' : '') + n; }
function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function dmy(s) { return s ? s.substr(8, 2) + '/' + s.substr(5, 2) + '/' + s.substr(0, 4) : ''; }
function r2(x) { return Math.round(x * 100) / 100; }
function nz(v) { return Math.round((+v || 0) * 100) !== 0; }
function has(v) { return v !== null && v !== undefined; }
function pl(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }
function fm(v) {
var neg = v < 0, a = Math.abs(v), s = a.toFixed(2), o = '', i = s.indexOf('.'), f = s.substr(i);
s = s.substr(0, i);
while (s.length > 3) { o = ',' + s.substr(s.length - 3) + o; s = s.substr(0, s.length - 3); }
return (neg && Math.round(a * 100) ? '-' : '') + s + o + f;
}
function cell(v, cls) { v = +v || 0; return '<td class="num' + (cls ? ' ' + cls : '') + (nz(v) ? (v < 0 ? ' neg' : '') : ' z') + '">' + (nz(v) ? fm(v) : '') + '</td>'; }
function pc(x, t) { return t ? (100 * x / t).toFixed(1) + '%' : ''; }
function pick(e, attr) {
var t = e.target;
while (t && t !== e.currentTarget && !(t.getAttribute && t.getAttribute(attr) !== null)) { t = t.parentNode; }
return t && t !== e.currentTarget ? t.getAttribute(attr) : null;
}
function errObj(x) { var t = x && x.responseText ? String(x.responseText).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').substr(0, 300) : ''; return t ? { error: t } : null; }
function kpi(k, l, v, s) { return '<div class="kpi ' + k + '"><div class="label">' + l + '</div><div class="value">' + v + '</div><div class="sub">' + s + '</div></div>'; }
function utc(s) { return Date.UTC(+s.substr(0, 4), +s.substr(5, 2) - 1, +s.substr(8, 2)); }
function days(a, b) { return Math.round((utc(b) - utc(a)) / 864e5); }
function ageK(d) { return d > 60 ? '3' : d > 30 ? '2' : '1'; }
function today() { return iso(new Date()); }
function keepP(r) {
if (PF && String(r[0]) !== PF) { return false; }
if (AGE && ageK(days(r[2], P.to)) !== AGE) { return false; }
return !PQ || [r[1], r[3], r[4], r[5]].join(' ').toLowerCase().indexOf(PQ) >= 0;
}
function chip(cls, on, attr, val, txt, n, tip) { return '<button type="button" class="chip ' + cls + (on ? ' on' : '') + '" ' + attr + '="' + val + '"' + (tip ? ' title="' + tip + '"' : '') + '>' + txt + (n === null ? '' : '<small>' + n + '</small>') + '</button>'; }
function renderP() {
var R = P.rows, F = P.pf, tot = 0, by = {}, cnt = { 1: 0, 2: 0, 3: 0 }, a3 = 0, old = 0, npf = 0, i, j, r, d, b, k, c, h, s, n, any = false, ft = 0, fn = 0;
for (i = 0; i < R.length; i++) {
r = R[i]; d = days(r[2], P.to); b = by[r[0]] || (by[r[0]] = { n: 0, v: 0 });
tot += +r[6]; b.n++; b.v += +r[6]; cnt[ageK(d)]++;
if (d > 60) { a3 += +r[6]; }
if (d > old) { old = d; }
}
for (i = 0; i < F.length; i++) { if (by[F[i][0]]) { npf++; } }
k = kpi('k-bl', 'Total cheques in portfolio', fm(tot), pl(R.length, 'cheque') + ' - ' + pl(npf, 'portfolio'));
c = chip('c-all', PF === '', 'data-p', '', 'All', R.length);
for (i = 0, j = 0; i < F.length; i++) {
b = by[F[i][0]];
c += chip('c-bal', PF === String(F[i][0]), 'data-p', F[i][0], esc(F[i][2] || F[i][1]), b ? b.n : 0, esc(F[i][1]));
if (b) { k += kpi(j % 2 ? 'k-p' : 'k-op', esc(F[i][2] || F[i][1]), fm(b.v), pl(b.n, 'cheque') + ' - ' + pc(b.v, tot)); j++; }
}
k += kpi('k-cr', 'Over 60 days in portfolio', fm(a3), pl(cnt[3], 'cheque') + (tot ? ' - ' + pc(a3, tot) : '') + (R.length ? ' - oldest ' + pl(old, 'day') : ''));
$('stKpi').innerHTML = '<div class="kpi-row cqk" style="grid-template-columns:repeat(' + (j + 2) + ',1fr)">' + k + '</div>';
$('stKpi').style.display = '';
$('pfChips').innerHTML = c;
$('ageChips').innerHTML = chip('c-all', AGE === '', 'data-g', '', 'All', null) + chip('c-bal', AGE === '1', 'data-g', '1', '0 - 30', cnt[1]) + chip('c-bal', AGE === '2', 'data-g', '2', '31 - 60', cnt[2]) + chip('c-wr', AGE === '3', 'data-g', '3', 'Over 60', cnt[3]);
h = '';
for (i = 0; i < F.length; i++) {
s = ''; n = 0; b = 0;
for (j = 0; j < R.length; j++) {
r = R[j];
if (r[0] !== F[i][0] || !keepP(r)) { continue; }
d = days(r[2], P.to); n++; b += +r[6];
s += '<tr class="drill-row" data-c="' + j + '" title="Open the cheque movement"><td class="c-code">' + esc(r[1] || '-') + '</td><td>' + dmy(r[2]) + '</td><td><span class="dy a' + ageK(d) + '">' + d + ' d</span></td>' +
'<td>' + esc(r[3] || '-') + '</td><td class="ds">' + esc(r[4] || r[5] || '') + '</td><td class="num bal">' + fm(+r[6]) + '</td></tr>';
}
if (!n) { continue; }
any = true; ft += b; fn += n;
h += '<div class="panel po-lv cqp"><div class="cqp-h"><div><small>Portfolio</small><strong>' + esc(F[i][1]) + '</strong></div><span class="sp"></span><span class="cqp-c">' + pl(n, 'cheque') + '</span><span class="cqp-c">' + pc(b, tot) + ' of all portfolios</span><span class="cqp-t">' + fm(b) + '</span></div>' +
'<div class="table-scroll"><table><colgroup><col style="width:11%"><col style="width:10%"><col style="width:8%"><col style="width:17%"><col><col style="width:14%"></colgroup><thead><tr><th>Cheque no.</th><th>Date</th><th>Days</th><th>Salesman</th><th>Customer</th><th class="num">Amount</th></tr></thead><tbody>' + s +
'</tbody><tfoot><tr class="tot"><td colspan="5">Total - ' + pl(n, 'cheque') + '</td><td class="num">' + fm(b) + '</td></tr></tfoot></table></div></div>';
}
if (!any) { h = '<div class="panel"><div class="dr-none">No cheques in the portfolios' + (PF || AGE || PQ ? ' for this filter' : ' at this date') + '</div></div>'; }
$('pfBody').innerHTML = h;
P.ft = ft; P.fn = fn;
title();
}
function isPf(r) { return +r[3] === CHQ_BANK; }
function entOf(r) { return has(r[8]) ? r[6] + '/' + r[7] + '/' + r[8] : ''; }
function evKind(E) {
var p = null, b = null, i;
for (i = 0; i < E.rows.length; i++) { if (isPf(E.rows[i])) { p = p || E.rows[i]; } else { b = b || E.rows[i]; } }
E.p = p; E.b = b;
if (p) { return +p[5] === 2 ? (+p[12] ? 'BNC' : 'RCV') : (+p[13] ? 'DEP' : 'RET'); }
return +b[5] === 2 ? 'BIN' : 'BOUT';
}
function prep(d) {
var R = d.rows, EV = [], ix = {}, i, j, r, e, k, any = false, bal = 0, out = [], day, pool, pickI, v;
for (i = 0; i < R.length; i++) { if (isPf(R[i])) { any = true; } }
for (i = 0; i < R.length; i++) {
r = R[i]; k = entOf(r) || ('k' + i);
if (!ix[k]) { ix[k] = { rows: [], dt: r[0], eff: 0 }; EV.push(ix[k]); }
e = ix[k];
if (+r[12]) { e.rows.push(r); } else { e.rows.unshift(r); }
if (r[0] < e.dt) { e.dt = r[0]; }
if (isPf(r)) { e.eff += (+r[10]) - (+r[11]); }
}
for (i = 0; i < EV.length; i++) { EV[i].k = evKind(EV[i]); }
EV.sort(function (a, b) { return a.dt < b.dt ? -1 : a.dt > b.dt ? 1 : 0; });
d.ev = [];
i = 0;
while (i < EV.length) {
day = EV[i].dt; pool = [];
while (i < EV.length && EV[i].dt === day) { pool.push(EV[i]); i++; }
while (pool.length) {
pickI = 0;
for (j = 0; j < pool.length; j++) { v = pool[j].eff; if (nz(bal) ? v < 0 : v > 0) { pickI = j; break; } }
e = pool.splice(pickI, 1)[0];
bal += e.eff; d.ev.push(e);
for (j = 0; j < e.rows.length; j++) {
r = e.rows[j];
r.c = any ? isPf(r) : !+r[12];
r.k = isPf(r) ? (+r[5] === 2 ? (+r[12] ? 'BNC' : 'RCV') : (+r[13] ? 'DEP' : 'RET')) : (+r[5] === 2 ? 'BIN' : (e.p ? 'BBK' : 'BOUT'));
out.push(r);
}
}
}
d.rows = out;
}
function stText(H) { return H[4] === 'D' ? 'Deposited ' + dmy(H[5]) : H[4] === 'R' ? 'Returned ' + dmy(H[5]) : H[4] === 'P' ? 'In portfolio' : '-'; }
function renderM() {
var H, R, S, i, r, b = 0, db = 0, cr = 0, n = 0, h, e, d, x;
if (!M) { $('mvBody').innerHTML = '<div class="dr-none">Type a cheque number or an amount, then pick the cheque from the list</div>'; title(); return; }
H = M.h; R = M.rows; S = M.ev;
h = '<div class="hb"><div class="hb-band"><div><small>Cheque no.</small><strong class="nm">' + esc(H[0] || '-') + '</strong></div><div><small>Amount</small><strong>' + fm(+H[1]) + '</strong></div>' +
(H[2] ? '<div><small>Customer</small><strong>' + esc(H[2]) + '</strong></div>' : '') + (H[3] ? '<div><small>Salesman</small><strong>' + esc(H[3]) + '</strong></div>' : '') +
'<div><small>Status</small><strong>' + stText(H) + '</strong></div><div><small>Period</small><strong>' + dmy(M.from) + ' - ' + dmy(M.to) + '</strong></div></div><div class="cq-jr">';
for (i = 0; i < S.length; i++) {
x = S[i]; r = x.rows[0]; d = i ? days(S[i - 1].dt, x.dt) : 0; e = entOf(r);
h += (i ? '<div class="ar">&#8594;</div>' : '') + '<div class="stp' + SC[x.k] + '"><small>' + (i + 1) + ' - ' + SL[x.k] + (i ? ' - ' + (d ? pl(d, 'day') + ' later' : 'same day') : '') + '</small><b>' + esc(((x.k === 'DEP' && x.b ? x.b : x.p || x.b)[4]) || '') + '</b><span>' + dmy(x.dt) + (e ? ' - entry ' + e : '') + '</span></div>';
}
h += '</div></div><div class="table-scroll"><table id="mvTable"><thead><tr><th>Date</th><th>Entry no.</th><th>Movement type</th><th>Bank / portfolio</th><th>Description</th><th class="num">Debit</th><th class="num">Credit</th><th class="num">Balance</th></tr></thead><tbody>';
for (i = 0; i < R.length; i++) {
r = R[i]; e = entOf(r);
if (r.c) { b += (+r[10]) - (+r[11]); db += +r[10]; cr += +r[11]; }
n++;
h += '<tr><td class="c-code">' + dmy(r[0]) + '</td>' + (e ? '<td class="c-code lnk" data-y="' + i + '" title="Open the journal entry' + (+r[12] ? ' - the entry of the paying movement of the same transfer' : '') + '">' + e + (+r[12] ? ' <span class="tag tf">paired</span>' : '') + '</td>' : '<td><span class="tag np">no entry</span></td>') +
'<td><span class="ty ' + KC[r.k] + '">' + KM[r.k] + '</span></td><td>' + esc(r[4] || '') + '</td><td class="ds">' + esc(r[9] || '') + '</td>' +
(r.c ? cell(r[10], 'db') + cell(r[11], 'cr') : '<td class="num prd" title="The bank side of the same entry - not added to the cheque balance">' + (nz(r[10]) ? fm(+r[10]) : '') + '</td><td class="num prd">' + (nz(r[11]) ? fm(+r[11]) : '') + '</td>') +
'<td class="num bal' + (b < 0 ? ' neg' : '') + '">' + fm(r2(b)) + '</td></tr>';
}
if (!n) { h += '<tr><td colspan="8" class="z" style="text-align:center;padding:16px">No movements of this cheque in the period</td></tr>'; }
h += '</tbody><tfoot><tr class="tot"><td colspan="5">Total - ' + pl(n, 'movement') + ' in ' + pl(S.length, 'step') + '</td><td class="num">' + fm(db) + '</td><td class="num">' + fm(cr) + '</td><td class="num">' + fm(r2(b)) + '</td></tr></tfoot></table></div>';
M.db = db; M.cr = cr; M.bal = r2(b);
$('mvBody').innerHTML = h;
title();
}
function loadChq() {
if (!SEL || busy) { return; }
busy = true;
$('mvBody').innerHTML = '<div class="dr-none">Loading...</div>';
apex.server.process('CHEQUES_AJAX', { x01: 'chq', x02: SEL[0], x03: SEL[1], x04: $('fFrom').value, x05: $('fTo').value }, {
dataType: 'json',
success: function (d) {
busy = false;
if (!d || d.error || !d.ok || !d.h) { M = null; $('mvBody').innerHTML = '<div class="dr-none">Could not load the cheque' + (d && d.error ? ' - ' + esc(d.error) : '') + '</div>'; return; }
prep(d); M = d; $('fFrom').value = d.from; $('fTo').value = d.to;
$('cqIn').value = d.h[0] || fm(+d.h[1]);
paintQuick(); renderM();
},
error: function (x) { var e = errObj(x); busy = false; $('mvBody').innerHTML = '<div class="dr-none">Could not load the cheque' + (e ? ' - ' + esc(e.error) : '. Please try again.') + '</div>'; }
});
}
function openChq(ty, ser) { SEL = [ty, ser]; closeSg(); setTab('M'); loadChq(); }
function closeSg() { $('cqSg').className = 'cq-sg'; }
function paintSg(q) {
var h = '', g = null, i, r;
for (i = 0; i < HITS.length; i++) {
r = HITS[i];
if (r[5] !== g) { g = r[5]; h += '<div class="gh">' + esc(g || '') + '</div>'; }
h += '<div data-i="' + i + '"' + (i === ACT ? ' class="act"' : '') + '><b>' + esc(r[2] || '-') + '</b><i>' + fm(+r[3]) + '</i><em>' + dmy(r[6]) + '</em><span dir="rtl">' + esc(r[4] || '') + '</span></div>';
}
$('cqSg').innerHTML = h || '<div class="none">No cheque matches in this period</div>';
$('cqSg').className = 'cq-sg' + (q ? ' open' : '');
}
function find() {
var q = String($('cqIn').value || '').replace(/[^0-9.]/g, '');
if (!q) { HITS = []; closeSg(); return; }
apex.server.process('CHEQUES_AJAX', { x01: 'find', x02: q, x03: $('fFrom').value, x04: $('fTo').value }, {
dataType: 'json',
success: function (d) {
if (!d || !d.ok || d.q !== String($('cqIn').value || '').replace(/[^0-9.]/g, '')) { return; }
HITS = d.rows || []; ACT = 0; paintSg(q);
}
});
}
function scrollAct() { var e = $('cqSg').querySelector('.act'); if (e && e.scrollIntoView) { e.scrollIntoView({ block: 'nearest' }); } }
function title() {
var t = '';
$('pgTitle').textContent = TT[TAB][0]; $('pgSub').textContent = TT[TAB][1];
if (TAB === 'P') {
$('periodBadge').textContent = P ? 'As of ' + dmy(P.to) : 'Loading';
if (P) { t = 'As of ' + dmy(P.to) + ' &nbsp;|&nbsp; ' + pl(P.fn || 0, 'cheque') + ' - ' + fm(P.ft || 0) + (PF || AGE || PQ ? ' - filtered' : '') + (P.asof ? ' &nbsp;|&nbsp; Data as of ' + esc(P.asof) : ''); }
} else {
$('periodBadge').textContent = dmy($('fFrom').value) + ' - ' + dmy($('fTo').value);
if (M) { t = 'Cheque ' + esc(M.h[0] || '-') + ' - ' + fm(+M.h[1]) + ' &nbsp;|&nbsp; Period ' + dmy(M.from) + ' - ' + dmy(M.to) + (M.asof ? ' &nbsp;|&nbsp; Data as of ' + esc(M.asof) : ''); }
}
$('stPTitle').innerHTML = '<div class="pt-h"><b>Co. Dashboard</b> | ' + TT[TAB][0] + '</div><div class="pt-s">' + t + '</div>';
}
function show() {
var l = NAV.length ? 1 : 0, B = $('cqTabs').getElementsByTagName('button'), i;
document.body.className = document.body.className.replace(/\s*st-lvl\d/g, '') + (l ? ' st-lvl1' : '');
$('lvPanel').style.display = l ? '' : 'none';
$('cqTabs').style.display = l ? 'none' : '';
$('tabP').style.display = !l && TAB === 'P' ? '' : 'none';
$('tabM').style.display = !l && TAB === 'M' ? '' : 'none';
for (i = 0; i < B.length; i++) { B[i].className = B[i].getAttribute('data-t') === TAB ? 'on' : ''; }
title();
}
function setTab(t) { TAB = t; NAV = []; show(); window.scrollTo(0, 0); }
function crumb(last) { return '<div class="table-header-row"><div class="crumb"><span class="c1" data-go="0">' + TT[TAB][0] + '</span><span class="sep">&#8250;</span><span class="c2">' + esc(last) + '</span></div><div class="lv-btns"><button type="button" class="back" data-go="0">&#8592; Back</button></div></div>'; }
function openEntry(y, t, n) { if (has(n) && window.jmEntry && window.jmEntry.open) { window.jmEntry.open(y, t, n); } }
function doPrint() {
var t = document.title, G = NAV.length && NAV[0].d;
if (TAB === 'P' ? !P : !M) { return; }
document.title = G ? 'Entry_' + G.y + '_' + G.t + '_' + G.n : TAB === 'P' ? 'Cheques_in_Portfolio_' + P.to : 'Cheque_' + (M.h[0] || M.h[9]) + '_' + M.from + '_' + M.to;
document.body.className += ' st-print';
window.print();
document.body.className = document.body.className.replace(/\s*st-print/g, '');
setTimeout(function () { document.title = t; }, 1500);
}
function cols(W, n) { var w = '<cols>', j; for (j = 0; j < n; j++) { w += '<col min="' + (j + 1) + '" max="' + (j + 1) + '" width="' + (W[j] || 14) + '" customWidth="1"/>'; } return w + '</cols>'; }
function pfName(c) { var i; for (i = 0; i < P.pf.length; i++) { if (P.pf[i][0] === c) { return P.pf[i][1]; } } return String(c); }
function excel() {
var G = NAV.length && NAV[0].d, head, lines = [], i, r, b = 0;
if (!window.svXlsx) { return; }
if (G) {
var EX = window.jmEntry.xl(G); head = EX.head; lines = EX.lines;
window.svXlsx.save('Journal entry ' + G.y + '/' + G.t + '/' + G.n + (G.dt ? ' - ' + dmy(G.dt) : '') + (G.ds ? ' - ' + G.ds : ''), head, lines, cols(EX.widths, head.length), 'Entry_' + G.y + '_' + G.t + '_' + G.n + '.xlsx', 'Entry');
return;
}
if (TAB === 'M') {
if (!M) { return; }
head = ['Date', 'Movement no.', 'Entry no.', 'Movement type', 'Bank / portfolio', 'Cheque no.', 'Description', 'Debit', 'Credit', 'Balance', 'Note'];
for (i = 0; i < M.rows.length; i++) {
r = M.rows[i];
if (r.c) { b += (+r[10]) - (+r[11]); }
lines.push([[dmy(r[0]), 0], [r[1] + ' / ' + r[2], 3], [entOf(r), 3], [KM[r.k], 0], [r[4] || '', 0], [r[14] || '', 3], [r[9] || '', 0], [r.c ? +r[10] : '', 5], [r.c ? +r[11] : '', 5], [r2(b), 5], [r.c ? '' : 'Bank side of the same entry - ' + fm(+r[10] + (+r[11])) + ' not added', 0]]);
}
window.svXlsx.save('Cheque Movement - cheque ' + (M.h[0] || '-') + ' - ' + fm(+M.h[1]) + (M.h[2] ? ' - ' + M.h[2] : '') + (M.h[3] ? ' - ' + M.h[3] : '') + ' - ' + stText(M.h) + ' - ' + dmy(M.from) + ' - ' + dmy(M.to) + ' - debit ' + fm(M.db) + ' - credit ' + fm(M.cr) + ' - balance ' + fm(M.bal) + (M.asof ? ' - data as of ' + M.asof : ''),
head, lines, cols([12, 16, 18, 22, 30, 14, 60, 14, 14, 15, 44], head.length), 'Cheque_' + (M.h[0] || M.h[9]) + '_' + M.from + '_' + M.to + '.xlsx', 'Cheque');
return;
}
if (!P) { return; }
head = ['Portfolio', 'Cheque no.', 'Date', 'Days', 'Salesman', 'Customer', 'Description', 'Amount'];
for (i = 0; i < P.rows.length; i++) { r = P.rows[i]; if (keepP(r)) { lines.push([[pfName(r[0]), 0], [r[1] || '', 3], [dmy(r[2]), 0], [days(r[2], P.to), 2], [r[3] || '', 0], [r[4] || '', 0], [r[5] || '', 0], [+r[6], 5]]); } }
window.svXlsx.save('Cheques in Portfolio - as of ' + dmy(P.to) + ' - ' + pl(P.fn, 'cheque') + ' - total ' + fm(P.ft) + (PF || AGE || PQ ? ' - filtered' : '') + (P.asof ? ' - data as of ' + P.asof : ''),
head, lines, cols([30, 14, 12, 8, 24, 46, 60, 15], head.length), 'Cheques_in_Portfolio_' + P.to + '.xlsx', 'Portfolio');
}
function run() {
if (busy) { return; }
busy = true; $('runBtn').disabled = true;
apex.server.process('CHEQUES_AJAX', { x01: 'run', x02: $('fAsOf').value }, {
dataType: 'json',
success: function (d) {
busy = false; $('runBtn').disabled = false;
if (!d || d.error || !d.ok) { $('pfBody').innerHTML = '<div class="panel"><div class="dr-none">Could not load' + (d && d.error ? ' - ' + esc(d.error) : '') + '</div></div>'; return; }
P = d; $('fAsOf').value = d.to;
renderP();
},
error: function (x) { var e = errObj(x); busy = false; $('runBtn').disabled = false; $('pfBody').innerHTML = '<div class="panel"><div class="dr-none">Could not load' + (e ? ' - ' + esc(e.error) : '. Please try again.') + '</div></div>'; }
});
}
var QKS = [['M', 'This month'], ['3', '3M'], ['Y', 'YTD'], ['A', 'All years']];
function quick(k) {
var t = new Date(), d, last;
if (k === 'M') { return [iso(new Date(t.getFullYear(), t.getMonth(), 1)), iso(t)]; }
if (k === 'Y') { return [t.getFullYear() + '-01-01', iso(t)]; }
if (k === 'A') { return [MIN, iso(t)]; }
d = new Date(t.getFullYear(), t.getMonth() - (+k), 1);
last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
d.setDate(Math.min(t.getDate(), last));
return [iso(d), iso(t)];
}
function paintQuick() {
var h = '', i, q;
for (i = 0; i < QKS.length; i++) { q = quick(QKS[i][0]); h += '<button type="button" class="chip' + ($('fFrom').value === q[0] && $('fTo').value === q[1] ? ' on c-all' : '') + '" data-q="' + QKS[i][0] + '">' + QKS[i][1] + '</button>'; }
$('quickChips').innerHTML = h;
if (TAB === 'M') { $('periodBadge').textContent = dmy($('fFrom').value) + ' - ' + dmy($('fTo').value); }
}
function setQuick(k) { var q = quick(k); $('fFrom').value = q[0]; $('fTo').value = q[1]; }
$('cqTabs').addEventListener('click', function (e) { var t = pick(e, 'data-t'); if (t && !busy) { setTab(t); if (t === 'M' && !M) { renderM(); $('cqIn').focus(); } } });
$('runBtn').addEventListener('click', run);
$('resetBtn').addEventListener('click', function () { $('fAsOf').value = today(); PF = ''; AGE = ''; run(); });
$('pfChips').addEventListener('click', function (e) { var p = pick(e, 'data-p'); if (p !== null && P) { PF = p; renderP(); } });
$('ageChips').addEventListener('click', function (e) { var g = pick(e, 'data-g'); if (g !== null && P) { AGE = g; renderP(); } });
$('pfBody').addEventListener('click', function (e) {
var c = pick(e, 'data-c'), r;
if (c === null || !P || busy) { return; }
r = P.rows[+c];
setQuick('A'); paintQuick();
openChq(r[7], r[8]);
});
$('cqIn').addEventListener('input', function () { clearTimeout(QT); QT = setTimeout(find, 250); });
$('cqIn').addEventListener('focus', function () { if (HITS.length && $('cqIn').value) { $('cqSg').className = 'cq-sg open'; } });
$('cqIn').addEventListener('keydown', function (e) {
var k = e.key || e.keyCode, open = $('cqSg').className.indexOf('open') >= 0;
if (k === 'ArrowDown' || k === 40) { if (open) { ACT = Math.min(ACT + 1, HITS.length - 1); paintSg(1); scrollAct(); } e.preventDefault(); }
else if (k === 'ArrowUp' || k === 38) { if (open) { ACT = Math.max(ACT - 1, 0); paintSg(1); scrollAct(); } e.preventDefault(); }
else if (k === 'Enter' || k === 13) { if (open && HITS[ACT]) { openChq(HITS[ACT][0], HITS[ACT][1]); } e.preventDefault(); }
else if (k === 'Escape' || k === 27) { closeSg(); }
});
$('cqSg').addEventListener('mousedown', function (e) { var i = pick(e, 'data-i'); if (i !== null && HITS[+i]) { e.preventDefault(); openChq(HITS[+i][0], HITS[+i][1]); } });
document.addEventListener('click', function (e) { var t = e.target; while (t && t !== document) { if (t.id === 'cqSg' || t.id === 'cqIn') { return; } t = t.parentNode; } closeSg(); });
$('resetBtnM').addEventListener('click', function () { if (busy) { return; } SEL = null; M = null; HITS = []; $('cqIn').value = ''; closeSg(); setQuick('Y'); paintQuick(); renderM(); $('cqIn').focus(); });
$('runBtnM').addEventListener('click', function () { paintQuick(); if (SEL) { loadChq(); } else { find(); } });
$('quickChips').addEventListener('click', function (e) {
var q = pick(e, 'data-q');
if (!q || busy) { return; }
setQuick(q); paintQuick();
if (SEL) { loadChq(); }
});
$('fFrom').addEventListener('change', paintQuick);
$('fTo').addEventListener('change', paintQuick);
$('mvBody').addEventListener('click', function (e) { var y = pick(e, 'data-y'), r; if (y !== null && M) { r = M.rows[+y]; openEntry(r[6], r[7], r[8]); } });
$('lvPanel').addEventListener('click', function (e) { if (pick(e, 'data-go') !== null && !busy) { NAV = []; show(); } });
if (window.jmExport && $('exportBox')) { window.jmExport.attach($('exportBox'), { pdf: doPrint, excel: excel }); }
else if ($('exportBox')) {
$('exportBox').innerHTML = '<button type="button" class="btn-print btn-excel" id="xlBtn">Export Excel</button> <button type="button" class="btn-print" id="pdfBtn">Print / PDF</button>';
$('xlBtn').addEventListener('click', excel);
$('pdfBtn').addEventListener('click', doPrint);
}
$('fAsOf').value = today();
setQuick('Y'); paintQuick();
show();
run();
})();

});
