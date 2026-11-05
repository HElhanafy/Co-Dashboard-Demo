window.addEventListener("DOMContentLoaded",function(){
(function () {
var D = null, ST = null, NAV = [], SHOW = '', KF = '', KQ = '', busy = false, TITLE = 'Bank accounts', CHQ_BANK = 901, PAGE = 300, LIM = 300;
var KIND = { TIN: 'Incoming transfer', TOX: 'Outgoing transfer - external', TOL: 'Outgoing transfer - internal', CIN: 'Cheque received', COUT: 'Cheque paid', OPN: 'Opening', OTH: 'Other' };
var KORD = ['TIN', 'CIN', 'TOX', 'TOL', 'COUT', 'OPN', 'OTH'], KLBL = { TIN: 'Incoming transfers', TOX: 'External outgoing transfers', TOL: 'Internal outgoing transfers', CIN: 'Cheques received', COUT: 'Cheques paid', OPN: 'Opening', OTH: 'Other', P: 'POS sales', N: 'No journal entry' };
var BENF = { 3: 'Customer', 5: 'Supplier' };
function $(id) { return document.getElementById(id); }
if (!$('stTable')) { return; }
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
function cell(v, cls) { v = +v || 0; return '<td class="num' + (cls ? ' ' + cls : '') + (nz(v) ? (v < 0 ? ' neg' : '') : ' z') + '">' + fm(v) + '</td>'; }
function pc(x, t) { return t ? (100 * x / t).toFixed(1) + '%' : ''; }
function pick(e, attr) {
var t = e.target;
while (t && t !== e.currentTarget && !(t.getAttribute && t.getAttribute(attr) !== null)) { t = t.parentNode; }
return t && t !== e.currentTarget ? t.getAttribute(attr) : null;
}
function errObj(x) { var t = x && x.responseText ? String(x.responseText).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').substr(0, 300) : ''; return t ? { error: t } : null; }
function kpi(k, l, v, s, neg) { return '<div class="kpi ' + k + '"><div class="label">' + l + '</div><div class="value' + (neg ? ' neg' : '') + '">' + v + '</div><div class="sub">' + s + '</div></div>'; }
function dfb(d) { return d === null ? '' : nz(d) ? '<span class="dfb no">' + fm(d) + '</span>' : '<span class="dfb ok">&#10003; 0.00</span>'; }
function closeOf(a) { return r2(+a[4] + (+a[5]) - (+a[6])); }
function difOf(a) { return has(a[8]) ? r2(closeOf(a) - (+a[8])) : null; }
function isChq(a) { return +a[2] === CHQ_BANK; }
function list() {
var out = [], i, a;
if (!D) { return out; }
for (i = 0; i < D.acc.length; i++) {
a = D.acc[i];
if (SHOW === 'B' && isChq(a)) { continue; }
if (SHOW === 'C' && !isChq(a)) { continue; }
if (SHOW === 'D' && !nz(difOf(a))) { continue; }
out.push(a);
}
return out;
}
function render() {
var L = list(), h, i, g, a, c, d, to = 0, td = 0, tc = 0, tb = 0, tf = 0, bb = 0, bn = 0, cb = 0, cn = 0, nd = 0, sd = 0, any;
h = '<thead><tr><th>Account</th><th class="num">Opening</th><th class="num">Debit</th><th class="num">Credit</th><th class="num">Balance</th><th class="num">Ledger balance</th><th class="num">Difference</th></tr></thead><tbody>';
for (g = 0; g < 2; g++) {
any = false;
for (i = 0; i < L.length; i++) {
a = L[i];
if (isChq(a) !== (g === 1)) { continue; }
if (!any) { h += '<tr class="grp"><td colspan="7">' + (g ? 'Cheques under collection' : 'Banks') + '</td></tr>'; any = true; }
c = closeOf(a); d = difOf(a);
to += +a[4]; td += +a[5]; tc += +a[6]; tb += c; tf += d || 0;
h += '<tr class="drill-row" data-a="' + a[0] + '" title="Open the statement"><td class="sname"><span class="tw">&#9656;</span> ' + esc(a[1] || ('Account ' + a[0])) + '</td>' +
cell(a[4]) + cell(a[5], 'db') + cell(a[6], 'cr') + cell(c, 'bal') + (has(a[8]) ? cell(a[8]) : '<td class="num z">-</td>') + '<td class="num">' + dfb(d) + '</td></tr>';
}
}
if (!L.length) { h += '<tr><td colspan="7" class="z" style="text-align:center;padding:22px">No bank accounts for this period and filter</td></tr>'; }
h += '</tbody>';
if (L.length) { h += '<tfoot><tr><td>Total - ' + pl(L.length, 'account') + '</td><td class="num">' + fm(to) + '</td><td class="num">' + fm(td) + '</td><td class="num">' + fm(tc) + '</td><td class="num">' + fm(tb) + '</td><td class="num">' + fm(tb - tf) + '</td><td class="num">' + dfb(r2(tf)) + '</td></tr></tfoot>'; }
$('stTable').innerHTML = h;
for (i = 0; i < D.acc.length; i++) {
a = D.acc[i]; c = closeOf(a); d = difOf(a);
if (isChq(a)) { cb += c; cn++; } else { bb += c; bn++; }
if (nz(d)) { nd++; sd += d; }
}
$('tableNote').textContent = pl(L.length, 'account') + (D.asof ? ' - data as of ' + D.asof : '');
$('stPTitle').innerHTML = '<div class="pt-h"><b>Co. Dashboard</b> | Bank Statement</div><div class="pt-s">Period ' + dmy(D.from) + ' - ' + dmy(D.to) + ' &nbsp;|&nbsp; ' + pl(L.length, 'account') +
(SHOW === 'B' ? ' - banks' : SHOW === 'C' ? ' - cheques under collection' : SHOW === 'D' ? ' - differing from the ledger' : '') + (D.asof ? ' &nbsp;|&nbsp; Data as of ' + esc(D.asof) : '') + '</div>';
$('stKpi').innerHTML = '<div class="kpi-row bk3">' +
kpi('k-bl', 'Total balance', fm(bb + cb), pl(bn + cn, 'account') + ' - at ' + dmy(D.to), bb + cb < 0) +
kpi('k-op', 'Bank accounts', fm(bb), pl(bn, 'account') + (nz(bb + cb) ? ' - ' + pc(bb, bb + cb) : ''), bb < 0) +
kpi('k-p', 'Cheques under collection', fm(cb), pl(cn, 'account') + (nz(bb + cb) ? ' - ' + pc(cb, bb + cb) : '')) + '</div>';
$('stKpi').style.display = '';
paintShow(bn, cn, nd);
}
function show() {
var l = NAV.length ? 1 : 0;
document.body.className = document.body.className.replace(/\s*st-lvl\d/g, '') + (l ? ' st-lvl1' : '');
$('lvPanel').style.display = l ? '' : 'none';
window.scrollTo(0, 0);
}
function navCrumb(extra) {
var h = '<div class="table-header-row"><div class="crumb"><span class="c1" data-go="0">' + TITLE + '</span>', i, n = NAV.length, last;
for (i = 0; i < n; i++) { last = !extra && i === n - 1; h += '<span class="sep">&#8250;</span><span class="' + (last ? 'c2' : 'c1" data-go="n' + i) + '" title="' + esc(NAV[i].t) + '">' + esc(NAV[i].t) + '</span>'; }
if (extra) { h += '<span class="sep">&#8250;</span><span class="c2">' + esc(extra) + '</span>'; }
return h + '</div><div class="lv-btns"><button type="button" class="back" data-go="' + (extra ? (n ? 'n' + (n - 1) : '0') : (n > 1 ? 'n' + (n - 2) : '0')) + '">&#8592; Back</button></div></div>';
}
function top() { return NAV[NAV.length - 1]; }
function draw() {
var f = top(), i;
ST = null;
for (i = 0; i < NAV.length; i++) { if (NAV[i].k === 'st') { ST = NAV[i].d; } }
if (!f) { show(); return; }
if (f.k === 'st') { renderStmt(); } else if (f.k === 'mv') { renderMov(f.d); } else { $('lvPanel').innerHTML = navCrumb() + window.jmEntry.html(f.d, { esc: esc, dmy: dmy }); }
show();
}
function goNav(g) { if (g === '0') { NAV = []; } else { NAV.length = +g.substr(1) + 1; } draw(); }
function push(k, d, t) { NAV.push({ k: k, d: d, t: t }); draw(); }
function show1() { document.body.className = document.body.className.replace(/\s*st-lvl\d/g, '') + ' st-lvl1'; $('lvPanel').style.display = ''; }
function fail(d) { $('lvPanel').innerHTML = navCrumb('Not loaded') + '<div class="dr-none">Could not load' + (d && d.error ? ' - ' + esc(d.error) : '. Please try again.') + '</div>'; show1(); }
function loading() { $('lvPanel').innerHTML = navCrumb('Loading...') + '<div class="dr-none">Loading...</div>'; show1(); window.scrollTo(0, 0); }
function titles() { var a = [TITLE], i; for (i = 0; i < NAV.length; i++) { a.push(NAV[i].t); } return a; }
function ask(proc, x, ok) {
if (busy) { return; }
busy = true; loading();
apex.server.process(proc, x, {
dataType: 'json',
success: function (d) { busy = false; if (!d || d.error || !d.ok) { fail(d); return; } ok(d); },
error: function (e) { busy = false; fail(errObj(e)); }
});
}
function openStmt(code) {
if (!D) { return; }
NAV = [];
ask('BANKST_AJAX', { x01: 'stmt', x02: D.from, x03: D.to, x04: code }, function (d) { KF = ''; KQ = ''; LIM = PAGE; d.dx = window.bkDif ? window.bkDif.split(d.dif || []) : { real: d.dif || [], same: [] }; push('st', d, d.name || ('Account ' + d.code)); });
}
function kindOf(r) { var e = +r[3], t = +r[4]; return e === 2 ? 'OPN' : e === 1 ? (t === 2 ? 'TIN' : t === 1 ? (+r[16] === 1 ? 'TOX' : 'TOL') : 'OTH') : e === 0 ? (t === 2 ? 'CIN' : t === 1 ? 'COUT' : 'OTH') : 'OTH'; }
function entOf(r) { return has(r[7]) ? r[5] + '/' + r[6] + '/' + r[7] : ''; }
function keep(r) {
var q = KQ;
if (KF && (KF === 'P' ? !has(r[13]) : KF === 'N' ? has(r[7]) : kindOf(r) !== KF)) { return false; }
return !q || String(r[9] || '').toLowerCase().indexOf(q) >= 0 || entOf(r).indexOf(q) >= 0 || String(r[8] || '').toLowerCase().indexOf(q) >= 0 || String(r[14] || '').indexOf(q) >= 0 || (r[1] + '/' + r[2]).indexOf(q) >= 0;
}
function kchip(k, n) { return '<button type="button" class="chip k-' + (k || 'ALL') + (KF === k ? ' on' : '') + '" data-k="' + k + '">' + (k ? KLBL[k] : 'All') + '<small>' + n + '</small></button>'; }
function renderStmt() {
var d = ST, R = d.rows, i, r, db = 0, cr = 0, cl, df, dfo, h;
for (i = 0; i < R.length; i++) { db += +R[i][10]; cr += +R[i][11]; }
cl = r2(+d.open + db - cr); df = has(d.glc) ? r2(cl - (+d.glc)) : null; dfo = has(d.glo) ? r2(+d.open - (+d.glo)) : null;
d.db = db; d.cr = cr; d.close = cl;
h = navCrumb() + '<div class="hb"><div class="hb-band"><div><small>Bank account</small><strong class="nm">' + esc(d.name || d.code) + '</strong></div>' +
(has(d.acc) ? '<div><small>Ledger account</small><strong>' + d.acc + '</strong></div>' : '') + '<div><small>Movements</small><strong>' + R.length + '</strong></div><div><small>Period</small><strong>' + dmy(d.from) + ' - ' + dmy(d.to) + '</strong></div></div>' +
'<div class="hb-grid gb"><div class="hb-c"><h5>Balance - bank module</h5><div class="fl f4"><div><small>Opening</small><b>' + fm(+d.open) + '</b></div><div><small>Debit</small><b class="g">' + fm(db) + '</b></div><div><small>Credit</small><b class="r">' + fm(cr) + '</b></div><div class="bl"><small>Balance</small><b>' + fm(cl) + '</b></div></div></div>' +
'<div class="hb-c"><h5>Against the ledger - at ' + dmy(d.to) + '</h5><div class="two-b"><div><small>As the bank module</small><b>' + fm(cl) + '</b></div><div class="ac"><small>As the ledger</small><b>' + (has(d.glc) ? fm(+d.glc) : '-') + '</b>' +
(df === null ? '' : nz(df) ? '<div class="df">' + fm(df) + ' difference</div>' : '<div class="df ok">&#10003; equal</div>') + '</div></div></div></div></div>';
if (nz(df)) {
h += '<div class="wide-w"><span class="ic">!</span><div>The ledger differs from the bank module by ' + fm(df) + ' at ' + dmy(d.to) +
'<small>' + (nz(dfo) ? fm(dfo) + ' of it was already there at the opening' + (d.dx.real.length ? ' - ' : '') : '') + (d.dx.real.length ? d.dx.real.length + (d.dx.real.length === 1 ? ' line' : ' lines') + ' of this period listed under the statement' : '') + '</small></div></div>';
}
h += '<div class="sp-ptitle">Period ' + dmy(d.from) + ' - ' + dmy(d.to) + (d.asof ? ' - data as of ' + esc(d.asof) : '') + '</div>' +
'<div class="bk-tools"><div class="sk-chips st-kf" id="bkChips"></div><div class="search-select bk-q"><input type="text" id="bkQ" placeholder="Search description, movement, entry or invoice no..." autocomplete="off" value="' + esc(KQ) + '"></div></div><div id="bkBody"></div>';
$('lvPanel').innerHTML = h;
paintStmt();
}
function paintStmt() {
var d = ST, R = d.rows, h, c, i, r, b = +d.open, cnt = {}, np = 0, nn = 0, ns = 0, fd = 0, fc = 0, k, filt = KF || KQ;
for (i = 0; i < R.length; i++) { r = R[i]; k = kindOf(r); cnt[k] = (cnt[k] || 0) + 1; if (has(r[13])) { np++; } if (!has(r[7])) { nn++; } }
c = kchip('', R.length);
for (i = 0; i < KORD.length; i++) { if (cnt[KORD[i]]) { c += kchip(KORD[i], cnt[KORD[i]]); } }
$('bkChips').innerHTML = c + (np ? kchip('P', np) : '') + (nn ? kchip('N', nn) : '');
h = '<div class="table-scroll"><table id="stmtTable"><thead><tr><th>Date</th><th>Movement no.</th><th>Entry no.</th><th>Movement type</th><th>Sales invoice</th><th>Description</th><th class="num">Debit</th><th class="num">Credit</th><th class="num">Balance</th></tr></thead><tbody>' +
'<tr class="opn"><td class="c-code">' + dmy(d.from) + '</td><td></td><td></td><td><span class="ty OPN">Opening</span></td><td></td><td class="ds">Opening balance</td><td></td><td></td><td class="num bal' + (b < 0 ? ' neg' : '') + '">' + fm(b) + '</td></tr>';
for (i = 0; i < R.length; i++) {
r = R[i]; b += (+r[10]) - (+r[11]);
if (!keep(r)) { continue; }
ns++; fd += +r[10]; fc += +r[11]; k = kindOf(r);
if (ns > LIM) { continue; }
h += '<tr><td class="c-code">' + dmy(r[0]) + '</td><td class="c-code lnk" data-m="' + i + '" title="Open the movement">' + r[1] + ' / ' + r[2] + '</td>' + (entOf(r) ? '<td class="c-code lnk" data-y="' + i + '" title="Open the journal entry' + (+r[15] ? ' - the entry of the paying movement of the same transfer between banks' : '') + '">' + entOf(r) + (+r[15] ? ' <span class="tag tf">transfer</span>' : '') + '</td>' : '<td><span class="tag np">no entry</span></td>') +
'<td><span class="ty ' + k + '" title="' + esc(d.ty[r[1]] || '') + '">' + KIND[k] + '</span></td>' +
'<td class="c-code">' + (has(r[13]) ? '<span class="pos">POS</span> <span class="lnk2" data-d="' + i + '" title="Open the sales invoice">' + esc(r[14] || (r[12] + '/' + r[13])) + '</span>' : '') + '</td>' +
'<td class="ds">' + esc(r[9] || '') + '</td>' + cell(r[10], 'db') + cell(r[11], 'cr') + '<td class="num bal' + (b < 0 ? ' neg' : '') + '">' + fm(b) + '</td></tr>';
}
if (!ns) { h += '<tr><td colspan="9" class="z" style="text-align:center;padding:16px">No movements' + (filt ? ' for this filter' : '') + ' in the period</td></tr>'; }
if (ns > LIM) { h += '<tr class="more"><td colspan="9">Showing the first ' + LIM + ' of ' + ns + ' movements - the totals below are for all of them &nbsp; <button type="button" class="chip" data-n="' + PAGE + '">Show ' + Math.min(PAGE, ns - LIM) + ' more</button> <button type="button" class="chip" data-n="0">Show all ' + ns + '</button></td></tr>'; }
h += '</tbody><tfoot><tr class="tot"><td colspan="6">' + (filt ? 'Shown - ' : 'Period total - ') + pl(ns, 'movement') + '</td><td class="num">' + fm(fd) + '</td><td class="num">' + fm(fc) + '</td><td class="num">' + (filt ? '' : fm(b)) + '</td></tr></tfoot></table></div>';
if (window.bkDif) { h += window.bkDif.html(d.dx, { esc: esc, dmy: dmy, fm: fm, cell: cell, r2: r2, has: has }); }
$('bkBody').innerHTML = h;
}
function openMov(ty, ser) { ask('BANKST_AJAX', { x01: 'mov', x02: ty, x03: ser }, function (d) { if (!d.h) { fail({ error: 'movement not found' }); return; } push('mv', d, 'Movement ' + d.h[2] + ' / ' + d.h[3]); }); }
function row2(a, b, c, d) { return '<tr><td class="k">' + a + '</td><td>' + b + '</td><td class="k">' + (c || '') + '</td><td>' + (d || '') + '</td></tr>'; }
function renderMov(d) {
var H = d.h, raw = +H[6], ent = has(H[18]), bt = BENF[+H[21]] || 'Beneficiary', E = d.ent || [], h, i, r, v, ed = 0, ec = 0;
h = navCrumb() + '<div class="oh"><div class="oh-band"><div class="oh-b oh-b1"><small>' + esc(H[4] || 'Movement') + '</small><div class="oh-no">' + H[2] + ' / ' + H[3] + '</div></div>' +
'<div class="oh-b"><small>Date</small><div>' + dmy(H[5]) + '</div></div><div class="oh-b oh-sup"><small>Bank account</small><div>' + esc(H[1] || H[0]) + '</div></div>' +
'<div class="oh-b"><small>Cheque no.</small><div>' + (H[12] ? esc(H[12]) : (+H[7] === 1 ? 'Transfer' : '-')) + '</div></div>' +
'<div class="oh-b"><small>Journal entry</small><div>' + (ent ? '<span class="oh-ent" data-e="1" title="Open the journal entry">' + H[16] + ' / ' + H[17] + ' / ' + H[18] + '</span>' : (H[36] ? '<span class="oh-ent" data-e="2" title="Open the journal entry of the paying movement">' + esc(H[36].replace(/\//g, ' / ')) + '</span>' : '<span class="st np">no entry</span>')) + '</div></div>' +
'<div class="oh-b oh-cur"><small>' + (raw < 0 ? 'Credit' : 'Debit') + '</small><div class="oh-curv">' + fm(Math.abs(raw)) + '</div></div></div>' +
'<div class="oh-notes pl">' + (has(H[9]) ? '<i>Doc no. </i><b class="c-code">' + esc(H[9]) + '</b> &nbsp; ' : '') + esc(H[10] || '') + (H[11] ? '<br>' + esc(H[11]) : '') + '</div></div>';
if (has(H[32])) { h += '<div class="pdesc"><span class="pos">POS</span> Sales invoice <b class="lnk2" data-d="1">' + esc(H[33] || (H[31] + ' / ' + H[32])) + '</b> - paid by card, open it for the items</div>'; }
if (has(H[20])) { h += '<div class="pdesc">Transfer between banks - ' + (raw > 0 ? 'received from' : 'paid to') + ' movement <b class="lnk2" data-f="1">' + H[19] + ' / ' + H[20] + '</b>' + (H[35] ? ' of ' + esc(H[35]) : '') + (ent ? '' : ' - the journal entry is on that movement') + '</div>'; }
if (E.length) {
h += '<div class="oh-h4">Both sides of the movement - journal entry ' + d.ey + ' / ' + d.et + ' / ' + d.en + '</div><div class="table-scroll"><table id="entTable"><thead><tr><th>Account</th><th>Account name</th><th>Description</th><th class="num">Debit</th><th class="num">Credit</th></tr></thead><tbody>';
for (i = 0; i < E.length; i++) {
r = E[i]; v = +r[4]; if (v > 0) { ed += v; } else { ec -= v; }
h += '<tr' + (+r[6] ? ' class="me"' : '') + '><td class="c-code">' + esc(r[1] || '') + '</td><td class="sname">' + esc(r[2] || '') + (+r[6] ? ' <span class="tag bk">this bank account</span>' : '') + '</td><td class="ds">' + esc(r[3] || '') + '</td>' +
cell(v > 0 ? v : 0, 'db') + cell(v < 0 ? -v : 0, 'cr') + '</tr>';
}
h += '</tbody><tfoot><tr class="tot"><td colspan="3">Total - ' + pl(E.length, 'line') + '</td><td class="num">' + fm(ed) + '</td><td class="num">' + fm(ec) + '</td></tr></tfoot></table></div>';
}
h += '<div class="oh-h4">Movement details</div><div class="table-scroll"><table id="movTable" class="kv"><tbody>' +
row2('Bank account', esc(H[0] + ' - ' + (H[1] || '')), 'Ledger account', has(H[34]) ? '<span class="c-code">' + H[34] + '</span>' : '-') +
row2(bt, H[22] || H[23] ? esc((H[22] ? H[22] + ' - ' : '') + (H[23] || '')) : '-', 'Salesman', H[24] ? esc(H[24]) : '-') +
row2('Posted to the ledger', +H[15] ? '<span class="dfb ok">&#10003; Posted</span>' : '<span class="dfb no">Not posted</span>', 'Entered by', has(H[25]) ? 'User ' + H[25] : '-') +
(H[13] || H[14] ? row2('Cheque date', dmy(H[13]) || '-', 'Maturity date', dmy(H[14]) || '-') : '') +
(has(H[28]) || has(H[29]) ? row2('Cost centre', has(H[28]) ? H[28] : '-', 'Second cost centre', has(H[29]) ? H[29] : '-') : '') +
(has(H[26]) && +H[26] !== 1 ? row2('Currency', H[26], 'Rate', H[27]) : '') + '</tbody></table></div>';
$('lvPanel').innerHTML = h;
}
function openEntry(y, t, n) { if (has(n) && window.jmEntry && window.jmEntry.open) { window.jmEntry.open(y, t, n); } }
function openDoc(t, s) { if (window.salesDoc && has(s)) { window.salesDoc.open(t, s, { crumb: titles() }); } }
function doPrint() {
var t = document.title, f = top();
if (!D) { return; }
document.title = !f ? 'Bank_Statement_' + D.from + '_' + D.to : f.k === 'st' ? 'Bank_Statement_' + ST.code + '_' + ST.from + '_' + ST.to : f.k === 'mv' ? 'Bank_Movement_' + f.d.h[2] + '_' + f.d.h[3] : 'Entry_' + f.d.y + '_' + f.d.t + '_' + f.d.n;
if (f && f.k === 'st' && LIM < ST.rows.length) { LIM = 1e9; paintStmt(); }
document.body.className += ' st-print';
window.print();
document.body.className = document.body.className.replace(/\s*st-print/g, '');
setTimeout(function () { document.title = t; }, 1500);
}
function cols(W, n) { var w = '<cols>', j; for (j = 0; j < n; j++) { w += '<col min="' + (j + 1) + '" max="' + (j + 1) + '" width="' + (W[j] || 14) + '" customWidth="1"/>'; } return w + '</cols>'; }
function excel() {
var f = top(), head, lines = [], i, r, b, L, G, H;
if (!D || !window.svXlsx) { return; }
if (f && f.k === 'gl') {
G = f.d;
var EX = window.jmEntry.xl(G); head = EX.head; lines = EX.lines;
window.svXlsx.save('Journal entry ' + G.y + '/' + G.t + '/' + G.n + (G.dt ? ' - ' + dmy(G.dt) : '') + (G.ds ? ' - ' + G.ds : ''), head, lines, cols(EX.widths, head.length), 'Entry_' + G.y + '_' + G.t + '_' + G.n + '.xlsx', 'Entry');
return;
}
if (f && f.k === 'mv') {
H = f.d.h;
head = ['Field', 'Value'];
lines = [[['Movement', 0], [H[2] + ' / ' + H[3], 3]], [['Type', 0], [H[4] || '', 0]], [['Date', 0], [dmy(H[5]), 0]], [['Bank account', 0], [H[0] + ' - ' + (H[1] || ''), 0]], [[+H[6] < 0 ? 'Credit' : 'Debit', 0], [Math.abs(+H[6]), 5]],
[['Document no.', 0], [H[9] || '', 3]], [['Description', 0], [H[10] || '', 0]], [['Cheque no.', 0], [H[12] || '', 3]], [['Journal entry', 0], [has(H[18]) ? H[16] + '/' + H[17] + '/' + H[18] : (H[36] || ''), 3]],
[['Beneficiary', 0], [(H[22] ? H[22] + ' - ' : '') + (H[23] || ''), 0]], [['Salesman', 0], [H[24] || '', 0]], [['Sales invoice', 0], [H[33] || '', 3]]];
for (i = 0; i < (f.d.ent || []).length; i++) { r = f.d.ent[i]; lines.push([['Entry line ' + (i + 1) + ' - ' + (r[1] || '') + ' ' + (r[2] || '') + (+r[4] < 0 ? ' - credit' : ' - debit'), 0], [Math.abs(+r[4]), 5]]); }
window.svXlsx.save('Bank movement ' + H[2] + ' / ' + H[3] + ' - ' + (H[1] || '') + ' - ' + dmy(H[5]), head, lines, cols([22, 70], 2), 'Bank_Movement_' + H[2] + '_' + H[3] + '.xlsx', 'Movement');
return;
}
if (f && ST) {
head = ['Date', 'Movement no.', 'Entry no.', 'Movement type', 'Type name', 'Sales invoice', 'Cheque no.', 'Description', 'Debit', 'Credit', 'Balance'];
b = +ST.open;
lines.push([[dmy(ST.from), 0], ['', 0], ['', 0], ['Opening balance', 0], ['', 0], ['', 0], ['', 0], ['', 0], ['', 0], ['', 0], [b, 5]]);
for (i = 0; i < ST.rows.length; i++) {
r = ST.rows[i]; b += (+r[10]) - (+r[11]);
if (!keep(r)) { continue; }
lines.push([[dmy(r[0]), 0], [r[1] + ' / ' + r[2], 3], [entOf(r), 3], [KIND[kindOf(r)], 0], [ST.ty[r[1]] || '', 0], [r[14] || '', 3], [r[8] || '', 3], [r[9] || '', 0], [+r[10], 5], [+r[11], 5], [r2(b), 5]]);
}
window.svXlsx.save('Bank Statement - ' + (ST.name || '') + ' (' + ST.code + ') - ' + dmy(ST.from) + ' - ' + dmy(ST.to) + ' - opening ' + fm(+ST.open) + ' - debit ' + fm(ST.db) + ' - credit ' + fm(ST.cr) + ' - balance ' + fm(ST.close) +
(has(ST.glc) ? ' - ledger ' + fm(+ST.glc) : '') + (KF ? ' - showing ' + KLBL[KF] + ' only' : '') + (KQ ? ' - search ' + KQ : '') + (ST.asof ? ' - data as of ' + ST.asof : ''),
head, lines, cols([12, 16, 18, 18, 30, 12, 14, 66, 14, 14, 15], head.length), 'Bank_Statement_' + ST.code + '_' + ST.from + '_' + ST.to + '.xlsx', 'Statement');
return;
}
L = list();
head = ['Code', 'Account', 'Ledger account', 'Opening', 'Debit', 'Credit', 'Balance', 'Ledger balance', 'Difference', 'Movements'];
for (i = 0; i < L.length; i++) { r = L[i]; lines.push([[r[0], 3], [r[1] || '', 0], [has(r[3]) ? r[3] : '', 3], [+r[4], 5], [+r[5], 5], [+r[6], 5], [closeOf(r), 5], [has(r[8]) ? +r[8] : '', 5], [has(r[8]) ? difOf(r) : '', 5], [+r[7], 2]]); }
window.svXlsx.save('Bank Statement - ' + dmy(D.from) + ' - ' + dmy(D.to) + ' - bank accounts, opening, movement and balance against the ledger' + (D.asof ? ' - data as of ' + D.asof : ''),
head, lines, cols([10, 36, 16, 15, 15, 15, 15, 15, 14, 11], head.length), 'Bank_Statement_' + D.from + '_' + D.to + '.xlsx', 'Accounts');
}
function run() {
if (busy) { return; }
busy = true; $('runBtn').disabled = true;
$('tableNote').textContent = 'Loading...';
apex.server.process('BANKST_AJAX', { x01: 'run', x02: $('fFrom').value, x03: $('fTo').value }, {
dataType: 'json',
success: function (d) {
busy = false; $('runBtn').disabled = false;
if (!d || d.error || !d.ok) { $('tableNote').textContent = 'Could not load' + (d && d.error ? ' - ' + d.error : ''); return; }
D = d; NAV = []; ST = null;
$('fFrom').value = d.from; $('fTo').value = d.to;
$('periodBadge').textContent = dmy(d.from) + ' - ' + dmy(d.to);
paintQuick();
show();
render();
},
error: function (x) { var e = errObj(x); busy = false; $('runBtn').disabled = false; $('tableNote').textContent = 'Could not load' + (e ? ' - ' + e.error : '. Please try again.'); }
});
}
var QKS = [['M', 'This month', 'From the first of this month to today'], ['L', 'Last month', 'The whole of last month'], ['3', '3M', 'The last 3 months'], ['Y', 'YTD', 'From 1 January to today']];
function quick(k) {
var t = new Date(), d, last;
if (k === 'M') { return [iso(new Date(t.getFullYear(), t.getMonth(), 1)), iso(t)]; }
if (k === 'L') { return [iso(new Date(t.getFullYear(), t.getMonth() - 1, 1)), iso(new Date(t.getFullYear(), t.getMonth(), 0))]; }
if (k === 'Y') { return [t.getFullYear() + '-01-01', iso(t)]; }
d = new Date(t.getFullYear(), t.getMonth() - (+k), 1);
last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
d.setDate(Math.min(t.getDate(), last));
return [iso(d), iso(t)];
}
function paintQuick() {
var h = '', i, q;
for (i = 0; i < QKS.length; i++) {
q = quick(QKS[i][0]);
h += '<button type="button" class="chip' + ($('fFrom').value === q[0] && $('fTo').value === q[1] ? ' on' : '') + '" data-q="' + QKS[i][0] + '" title="' + QKS[i][2] + '">' + QKS[i][1] + '</button>';
}
$('quickChips').innerHTML = h;
}
function paintShow(bn, cn, nd) {
$('showChips').innerHTML = '<button type="button" class="chip c-all' + (SHOW === '' ? ' on' : '') + '" data-s="">All<small>' + (bn + cn) + '</small></button>' +
'<button type="button" class="chip c-bal' + (SHOW === 'B' ? ' on' : '') + '" data-s="B">Banks<small>' + bn + '</small></button>' +
'<button type="button" class="chip c-bal' + (SHOW === 'C' ? ' on' : '') + '" data-s="C">Cheques under collection<small>' + cn + '</small></button>' +
'<button type="button" class="chip c-wr' + (SHOW === 'D' ? ' on' : '') + '" data-s="D" title="Accounts whose balance in the bank module is not the balance of their ledger account">Differs from ledger<small>' + nd + '</small></button>';
}
function setQuick(k) { var q = quick(k); $('fFrom').value = q[0]; $('fTo').value = q[1]; }
$('runBtn').addEventListener('click', run);
$('resetBtn').addEventListener('click', function () { setQuick('M'); SHOW = ''; run(); });
$('quickChips').addEventListener('click', function (e) {
var q = pick(e, 'data-q');
if (!q || busy) { return; }
setQuick(q); paintQuick(); run();
});
$('fFrom').addEventListener('change', paintQuick);
$('fTo').addEventListener('change', paintQuick);
$('showChips').addEventListener('click', function (e) {
var s = pick(e, 'data-s');
if (s === null) { return; }
SHOW = s;
if (D) { NAV = []; draw(); render(); }
});
$('stTable').addEventListener('click', function (e) {
var a = pick(e, 'data-a');
if (a) { openStmt(a); }
});
$('lvPanel').addEventListener('input', function (e) {
if (e.target && e.target.id === 'bkQ' && ST) { KQ = String(e.target.value || '').toLowerCase().replace(/^\s+|\s+$/g, ''); LIM = PAGE; paintStmt(); }
});
$('lvPanel').addEventListener('click', function (e) {
var g = pick(e, 'data-go'), f = top(), k, m, v, x, r;
if (g !== null) { goNav(g); return; }
if (!f || busy) { return; }
if (f.k === 'st') {
k = pick(e, 'data-k'); m = pick(e, 'data-m'); v = pick(e, 'data-d'); x = pick(e, 'data-g');
if (k !== null) { KF = k; LIM = PAGE; paintStmt(); return; }
k = pick(e, 'data-n');
if (k !== null) { LIM = +k ? LIM + (+k) : 1e9; paintStmt(); return; }
if (v !== null) { r = ST.rows[+v]; openDoc(r[12], r[13]); return; }
if (m !== null) { r = ST.rows[+m]; openMov(r[1], r[2]); return; }
m = pick(e, 'data-y');
if (m !== null) { r = ST.rows[+m]; openEntry(r[5], r[6], r[7]); return; }
if (x !== null) { x = x.split('/'); openEntry(x[0], x[1], x[2]); return; }
x = pick(e, 'data-f');
if (x !== null) { x = x.split('/'); openMov(x[0], x[1]); }
return;
}
if (f.k === 'mv') {
r = f.d.h; x = pick(e, 'data-e');
if (x !== null) { openEntry(f.d.ey, f.d.et, f.d.en); return; }
if (pick(e, 'data-d') !== null) { openDoc(r[31], r[32]); return; }
if (pick(e, 'data-f') !== null) { openMov(r[19], r[20]); }
}
});
if (window.jmExport && $('exportBox')) { window.jmExport.attach($('exportBox'), { pdf: doPrint, excel: excel }); }
else if ($('exportBox')) {
$('exportBox').innerHTML = '<button type="button" class="btn-print btn-excel" id="xlBtn">Export Excel</button> <button type="button" class="btn-print" id="pdfBtn">Print / PDF</button>';
$('xlBtn').addEventListener('click', excel);
$('pdfBtn').addEventListener('click', doPrint);
}
setQuick('M');
paintShow(0, 0, 0);
run();
})();

});
