window.addEventListener("DOMContentLoaded",function(){
(function () {
var D = null, G = null, ST = null, NAV = [], SHOW = '', CF = '', KF = '', busy = false, AJ = 'CUSTST_AJAX', TITLE = 'Customer Statement';
var KIND = { INV: 'Invoice', RET: 'Return', RCP: 'Receipt', ADJ: 'Adjustment', PUR: 'Purchase settlement', RCH: 'Bounced cheque', OPN: 'Opening', OTH: 'Other' };
var KLBL = { INV: 'Invoices', RET: 'Returns', RCP: 'Receipts', ADJ: 'Adjustments', PUR: 'Purchase settlement', RCH: 'Bounced cheques', OPN: 'Opening', OTH: 'Other', OVD: 'Overdue', N: 'Not posted' };
var KORD = ['INV', 'RET', 'RCP', 'ADJ', 'PUR', 'RCH', 'OPN', 'OTH'];
var BL = ['0 - 30', '31 - 60', '61 - 90', '91 - 120', '121 - 150', '&gt; 150'];
var PAYM = { 1: 'Cheque / transfer', 2: 'Cash' }, TW = '<span class="tw">&#9656;</span> ';
function $(id) { return document.getElementById(id); }
if (!$('stTable')) { return; }
function esc(s) { return String(s === null || s === undefined ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function pad(n) { return (n < 10 ? '0' : '') + n; }
function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function dmy(s) { return s ? s.substr(8, 2) + '/' + s.substr(5, 2) + '/' + s.substr(0, 4) : ''; }
function r2(x) { return Math.round(x * 100) / 100; }
function nz(v) { return Math.round((+v || 0) * 100) !== 0; }
function fm(v) {
var neg = v < 0, a = Math.abs(v), s = a.toFixed(2), o = '', i = s.indexOf('.'), f = s.substr(i);
s = s.substr(0, i);
while (s.length > 3) { o = ',' + s.substr(s.length - 3) + o; s = s.substr(0, s.length - 3); }
return (neg && Math.round(a * 100) ? '-' : '') + s + o + f;
}
function cell(v, cls, sub) { v = +v || 0; return '<td class="num' + (cls ? ' ' + cls : '') + (nz(v) ? (v < 0 ? ' neg' : '') : ' z') + '">' + fm(v) + (sub && nz(v) ? '<span class="s2">' + sub + '</span>' : '') + '</td>'; }
function pc(x, t) { return nz(t) ? (100 * x / t).toFixed(1).replace(/^-(0\.0)$/, '$1') + '%' : ''; }
function pl(n, w) { return n + ' ' + w + (n === 1 ? '' : (/s$/.test(w) ? 'es' : 's')); }
function pick(e, attr) {
var t = e.target;
while (t && t !== e.currentTarget && !(t.getAttribute && t.getAttribute(attr) !== null)) { t = t.parentNode; }
return t && t !== e.currentTarget ? t.getAttribute(attr) : null;
}
function has(v) { return v !== null && v !== undefined && v !== ''; }
function errObj(x) { var t = x && x.responseText ? String(x.responseText).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').substr(0, 300) : ''; return t ? { error: t } : null; }
function kpi(k, l, v, s, neg, x) { return '<div class="kpi ' + k + (x ? ' kx" data-x="' + x + '" title="Show these customers' : '') + '"><div class="label">' + l + '</div><div class="value' + (neg ? ' neg' : '') + '">' + v + '</div><div class="sub">' + s + '</div></div>'; }
function newAg(code, name) { return { code: code, name: name, n: 0, ncr: 0, nca: 0, opn: 0, db: 0, cr: 0, pn: 0, pv: 0, un: 0, b: [0, 0, 0, 0, 0, 0], od: 0, tot: 0, nov: 0, kids: {}, kl: [], list: [] }; }
function cbal(c) { return r2(+c[6] + (+c[7]) - (+c[8]) + (+c[11])); }
function over(c) { return +c[3] > 0 && cbal(c) > +c[3]; }
function add(e, c) {
var j;
e.n++; if (+c[2]) { e.nca++; } else { e.ncr++; }
e.opn += +c[6]; e.db += +c[7]; e.cr += +c[8]; e.pn += +c[10]; e.pv += +c[11]; e.un += +c[12];
for (j = 0; j < 6; j++) { e.b[j] += +c[13 + j]; }
e.od += +c[19]; e.tot += +c[20]; if (over(c)) { e.nov++; }
}
function bal(e) { return r2(e.opn + e.db - e.cr + e.pv); }
function build() {
var i, c, s, uk, mk, u, m;
G = { sup: {}, ord: [], sm: {}, T: newAg('', 'Total'), np: 0, no: 0, nc: 0, nh: 0, cab: 0 };
for (i = 0; i < D.cust.length; i++) {
c = D.cust[i];
s = D.sm[c[5]] || ['(No salesman)', '0', '(No salesman)', 0];
if (+c[10]) { G.np++; } if (nz(c[19])) { G.no++; }
if (SHOW === 'O' && !nz(c[19])) { continue; }
if (SHOW === 'N' && !+c[10]) { continue; }
uk = s[1] || '0'; mk = c[5] || '0';
u = G.sup[uk]; if (!u) { u = G.sup[uk] = newAg(uk, s[2]); G.ord.push(u); }
m = u.kids[mk]; if (!m) { m = u.kids[mk] = G.sm[mk] = newAg(mk, s[0]); m.up = u; u.kl.push(m); }
add(u, c); add(m, c); add(G.T, c); m.list.push(c);
if (+c[2]) { G.cab += cbal(c); if (nz(cbal(c))) { G.nh++; } } else if (nz(cbal(c))) { G.nc++; }
}
G.ord.sort(function (a, b) { return bal(b) - bal(a); });
for (i = 0; i < G.ord.length; i++) {
G.ord[i].kl.sort(function (a, b) { return bal(b) - bal(a); });
}
}
function agBar(b, mini) {
var t = 0, j, h = '<div class="ag' + (mini ? ' mini' : '') + '">';
for (j = 0; j < 6; j++) { if (b[j] > 0) { t += b[j]; } }
for (j = 0; j < 6; j++) { if (b[j] > 0) { h += '<i class="a' + j + '" style="width:' + (100 * b[j] / t).toFixed(2) + '%" title="' + BL[j] + ' days: ' + fm(b[j]) + ' (' + pc(b[j], t) + ')"></i>'; } }
return h + '</div>';
}
function agLeg(e) {
var j, h = '<div class="ag-leg">';
for (j = 0; j < 6; j++) { h += '<div><i class="a' + j + '"></i>' + BL[j] + '<b>' + fm(e.b[j]) + '</b><em>' + (pc(e.b[j], e.tot - e.un) || '0.0%') + '</em></div>'; }
return h + '</div>' + (nz(e.un) ? '<div class="lm-row"><span>Credit balances not matched to invoices</span><b>' + fm(e.un) + '</b></div>' : '');
}
function tagsOf(pn, ov) { return (pn ? ' <span class="tag np" title="Sales documents not posted to the customer ledger - inside the balance as the system shows it">' + pn + ' not posted</span>' : '') + (ov ? ' <span class="tag wr">' + ov + '</span>' : ''); }
function balBlock(e, sys, acc) {
return '<div class="hb-c"><h5>Balance</h5><div class="fl"><div><small>Opening</small><b>' + fm(e.opn) + '</b></div><div><small>Debit</small><b class="g">' + fm(e.db + e.pv) + '</b></div><div><small>Credit</small><b class="r">' + fm(e.cr) + '</b></div></div>' +
'<div class="two-b"><div><small>' + sys + '</small><b>' + fm(bal(e)) + '</b></div><div class="ac"><small>' + acc + '</small><b>' + fm(bal(e) - e.pv) + '</b>' + (nz(e.pv) ? '<div class="df">' + fm(e.pv) + ' not posted</div>' : '') + '</div></div></div>';
}
function agBlock(e) {
return '<div class="hb-c"><h5>Debt aging - open invoices today, by invoice age in days</h5>' + agBar(e.b) + agLeg(e) +
'<div class="lm-row"><span>Overdue - past the payment terms <b class="r">' + fm(e.od) + '</b>' + (nz(e.od) ? ' - ' + pc(e.od, e.tot - e.un) + ' of the open invoices' : '') + '</span></div></div>';
}
function band(small, name, cells) {
var h = '<div class="hb-band"><div><small>' + esc(small) + '</small><strong class="nm">' + esc(name) + '</strong></div>', i;
for (i = 0; i < cells.length; i++) { h += '<div><small>' + cells[i][0] + '</small><strong>' + cells[i][1] + '</strong></div>'; }
return h + '</div>';
}
function per() { return dmy(D.from) + ' - ' + dmy(D.to); }
function ccPills(e) { return '<span class="cc cr">Credit ' + e.ncr + '</span> <span class="cc ca">Cash ' + e.nca + '</span>'; }
function rowNums(e, of) { return cell(e.opn) + cell(e.db + e.pv, 'db') + cell(e.cr, 'cr') + cell(bal(e), 'bal', of ? pc(bal(e), of) + ' of supervisor' : '') + cell(e.od, 'cr', pc(e.od, e.tot - e.un)) + '<td>' + agBar(e.b, 1) + '</td>'; }
function footNums(e) { return '<td class="num">' + fm(e.opn) + '</td><td class="num">' + fm(e.db + e.pv) + '</td><td class="num">' + fm(e.cr) + '</td><td class="num">' + fm(bal(e)) + '</td><td class="num">' + fm(e.od) + '<span class="s2">' + pc(e.od, e.tot - e.un) + '</span></td><td></td>'; }
function render() {
var L = G.ord, T = G.T, h, i, u, one;
h = '<thead><tr><th>Supervisor</th><th class="num">Salesmen</th><th>Customers</th><th class="num">Opening</th><th class="num">Debit</th><th class="num">Credit</th><th class="num">Balance</th><th class="num">Overdue</th><th>Aging</th><th>Attention</th></tr></thead><tbody>';
for (i = 0; i < L.length; i++) {
u = L[i]; one = u.kl.length === 1;
h += '<tr class="drill-row" data-u="' + esc(u.code) + '" title="' + (one ? 'Open the customers' : 'Open the salesmen') + '"><td class="sname">' + TW + esc(u.name) + '</td>' +
'<td class="num' + (one ? ' z' : ' tt') + '">' + u.kl.length + '</td><td><b>' + u.n + '</b></td>' + rowNums(u) + '<td>' + tagsOf(u.pn, u.nov ? u.nov + ' over limit' : '') + '</td></tr>';
}
if (!L.length) { h += '<tr><td colspan="10" class="z" style="text-align:center;padding:22px">No customers for this period and filter</td></tr>'; }
h += '</tbody>';
if (L.length) { h += '<tfoot><tr><td>Total - ' + pl(L.length, 'supervisor') + '</td><td class="num">' + count(G.sm) + '</td><td>' + T.n + '</td>' + footNums(T) + '<td>' + tagsOf(T.pn, '') + '</td></tr></tfoot>'; }
$('stTable').innerHTML = h;
$('tableNote').textContent = pl(L.length, 'supervisor') + ' - ' + pl(T.n, 'customer') + (D.asof ? ' - data as of ' + D.asof : '');
$('stPTitle').innerHTML = '<div class="pt-h"><b>Co. Dashboard</b> | ' + TITLE + '</div><div class="pt-s">Period ' + per() + ' &nbsp;|&nbsp; ' + pl(L.length, 'supervisor') + ', ' + pl(T.n, 'customer') +
(SHOW === 'O' ? ' with overdue' : SHOW === 'N' ? ' with unposted documents' : '') + grpTxt(' &nbsp;|&nbsp; ') + (D.asof ? ' &nbsp;|&nbsp; Data as of ' + esc(D.asof) : '') + '</div>';
$('stKpi').innerHTML = '<div class="kpi-row">' +
kpi('k-bl', 'Receivables balance', fm(bal(T)), pl(T.n, 'customer') + ' - ' + pl(count(G.sm), 'salesman').replace('salesmans', 'salesmen') + ' - at ' + dmy(D.to), bal(T) < 0) +
kpi('k-cr', 'Overdue', fm(T.od), (pc(T.od, T.tot - T.un) || '0.0%') + ' of the open invoices today', 0, 'O') +
kpi('k-op', 'Credit customers', fm(bal(T) - G.cab), pl(G.nc, 'customer') + ' with a balance - ' + (pc(bal(T) - G.cab, bal(T)) || '0.0%'), 0, 'C') +
kpi('k-p', 'Cash customers', fm(G.cab), pl(G.nh, 'customer') + ' with a balance - ' + (pc(G.cab, bal(T)) || '0.0%'), 0, 'H') + '</div><div class="kpi-row k3">' +
kpi('k-n', 'Not posted to customers', fm(T.pv), pl(T.pn, 'document') + ' - accounts must post them', 0, 'N') +
kpi('k-w', 'Over credit limit', pl(T.nov, 'customer'), (pc(T.nov, T.n) || '0.0%') + ' of the customers shown', 0, 'L') +
kpi('k-db', 'Credit movements', fm(T.cr), 'receipts, returns and credit notes in the period') + '</div>';
$('stKpi').style.display = '';
paintShow();
}
function count(o) { var k, n = 0; for (k in o) { if (o.hasOwnProperty(k)) { n++; } } return n; }
function grpTxt(sep) { var e = $('jmHdrGroup') || document.querySelector('.jm-hdr-grp'), t = e ? (e.options && e.selectedIndex >= 0 ? e.options[e.selectedIndex].text : e.textContent) : ''; t = (t || '').replace(/^\s+|\s+$/g, ''); return t ? sep + 'Data group: ' + esc(t) : ''; }
function show() {
var l = NAV.length ? 1 : 0;
document.body.className = document.body.className.replace(/\s*st-lvl\d/g, '') + (l ? ' st-lvl1' : '');
$('lvPanel').style.display = l ? '' : 'none';
window.scrollTo(0, 0);
}
function navCrumb(extra) {
var h = '<div class="table-header-row"><div class="crumb"><span class="c1" data-go="0">Supervisors</span>', i, n = NAV.length, last;
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
if (f.k === 'sup') { renderSup(f.d); } else if (f.k === 'sm') { renderSm(f.d); } else if (f.k === 'st') { renderStmt(); } else if (f.k === 'mv') { renderMov(f.d); } else { $('lvPanel').innerHTML = navCrumb() + window.jmEntry.html(f.d, { esc: esc, dmy: dmy }); }
show();
}
function goNav(g) { if (g === '0') { NAV = []; } else { NAV.length = +g.substr(1) + 1; } draw(); }
function push(k, d, t) { NAV.push({ k: k, d: d, t: t }); draw(); }
function fail(d) { $('lvPanel').innerHTML = navCrumb('Not loaded') + '<div class="dr-none">Could not load' + (d && d.error ? ' - ' + esc(d.error) : '. Please try again.') + '</div>'; show1(); }
function show1() { document.body.className = document.body.className.replace(/\s*st-lvl\d/g, '') + ' st-lvl1'; $('lvPanel').style.display = ''; }
function loading() { $('lvPanel').innerHTML = navCrumb('Loading...') + '<div class="dr-none">Loading...</div>'; show1(); window.scrollTo(0, 0); }
function ask(proc, args, ok) {
if (busy) { return; }
busy = true; loading();
apex.server.process(proc, args, { dataType: 'json',
success: function (d) { busy = false; if (!d || d.error || !d.ok) { fail(d); return; } ok(d); },
error: function (x) { busy = false; fail(errObj(x)); } });
}
function openSup(code) {
var u = G.sup[code];
if (!u) { return; }
CF = '';
if (u.kl.length === 1) { push('sm', u.kl[0].code, u.kl[0].name); } else { push('sup', code, u.name); }
}
function renderSup(code) {
var u = G.sup[code], h, i, m;
if (!u) { NAV = []; draw(); return; }
h = navCrumb() + '<div class="hb">' + band('Supervisor', u.name, [['Salesmen', u.kl.length], ['Customers', u.n], ['Period', per()]]) + '<div class="hb-grid g2">' + balBlock(u, 'Balance', 'Posted only') + agBlock(u) + '</div></div>' +
'<div class="table-scroll"><table><thead><tr><th>Salesman</th><th>Customers</th><th class="num">Opening</th><th class="num">Debit</th><th class="num">Credit</th><th class="num">Balance</th><th class="num">Overdue</th><th>Aging</th><th>Attention</th></tr></thead><tbody>';
for (i = 0; i < u.kl.length; i++) {
m = u.kl[i];
h += '<tr class="drill-row" data-m="' + esc(m.code) + '" title="Open the customers"><td class="sname">' + TW + esc(m.name) + '</td><td><b>' + m.n + '</b> &nbsp;' + ccPills(m) + '</td>' + rowNums(m, bal(u)) + '<td>' + tagsOf(m.pn, m.nov ? m.nov + ' over limit' : '') + '</td></tr>';
}
h += '</tbody><tfoot><tr class="tot"><td>Total - ' + pl(u.kl.length, 'salesman').replace('salesmans', 'salesmen') + '</td><td>' + u.n + '</td>' + footNums(u) + '<td></td></tr></tfoot></table></div>';
$('lvPanel').innerHTML = h;
}
function keepC(c) { return CF === '' || (CF === 'C' ? !+c[2] : CF === 'H' ? !!+c[2] : CF === 'O' ? nz(c[19]) : CF === 'N' ? !!+c[10] : over(c)); }
function fchip(k, cls, lbl, n) { return n || !k ? '<button type="button" class="chip ' + cls + (CF === k ? ' on' : '') + '" data-f="' + k + '">' + lbl + '<small>' + n + '</small></button>' : ''; }
function custList(m) { var L = m.list.slice(0); L.sort(function (a, b) { return cbal(b) - cbal(a); }); return L; }
var FL = { C: 'Credit customers with a balance', H: 'Cash customers with a balance', O: 'Customers with overdue invoices', N: 'Customers with unposted documents', L: 'Customers over the credit limit' };
function inFl(k, c) { return k === 'C' ? !+c[2] && nz(cbal(c)) : k === 'H' ? !!+c[2] && nz(cbal(c)) : k === 'O' ? nz(c[19]) : k === 'N' ? !!+c[10] : over(c); }
function getM(d) {
var k, m, i, c;
if (String(d).charAt(0) !== '*') { return G.sm[d]; }
k = d.charAt(1); m = newAg('', FL[k]); m.fl = 1;
for (i = 0; i < D.cust.length; i++) { c = D.cust[i]; if (inFl(k, c)) { add(m, c); m.list.push(c); } }
return m;
}
function renderSm(code) {
var m = getM(code), h, i, c, L, e, n = 0, no = 0, np = 0, nl = 0, T = newAg('', '');
if (!m) { NAV = []; draw(); return; }
L = custList(m);
for (i = 0; i < L.length; i++) { c = L[i]; if (nz(c[19])) { no++; } if (+c[10]) { np++; } if (over(c)) { nl++; } }
h = navCrumb() + '<div class="hb">' + band(m.fl ? 'All salesmen' : 'Salesman', m.name, [[m.fl ? 'Supervisors' : 'Supervisor', m.fl ? 'All' : esc(m.up.name)], ['Customers', m.n], ['Period', per()]]) + '<div class="hb-grid g2">' + balBlock(m, 'Balance', 'Posted only') + agBlock(m) + '</div></div>' +
'<div class="sk-chips st-kf">' + fchip('', 'c-all', 'All', L.length) + fchip('C', 'c-cr', 'Credit', m.ncr) + fchip('H', 'c-ca', 'Cash', m.nca) + fchip('O', 'c-wr', 'Overdue', no) + fchip('L', 'c-wr', 'Over limit', nl) + fchip('N', 'c-np', 'Not posted', np) + '</div>' +
'<div class="table-scroll"><table><thead><tr><th>Code</th><th>Customer</th><th>Type</th><th class="num">Opening</th><th class="num">Debit</th><th class="num">Credit</th><th class="num">Balance</th><th class="num">Overdue</th><th>Aging</th><th>Limit used</th></tr></thead><tbody>';
for (i = 0; i < L.length; i++) {
c = L[i];
if (!keepC(c)) { continue; }
n++; e = newAg('', ''); add(e, c); add(T, c);
h += '<tr class="drill-row" data-c="' + esc(c[0]) + '" title="Open the statement"><td class="c-code">' + esc(c[0]) + '</td><td class="sname">' + TW + esc(c[1] || c[0]) + tagsOf(+c[10], over(c) ? 'over limit' : '') + (m.fl ? '<span class="s2">' + esc((D.sm[c[5]] || [''])[0]) + '</span>' : '') + '</td>' +
'<td><span class="cc ' + (+c[2] ? 'ca">Cash' : 'cr">Credit') + '</span></td>' + rowNums(e) + '<td>' + limCell(cbal(c), +c[3]) + '</td></tr>';
}
if (!n) { h += '<tr><td colspan="10" class="z" style="text-align:center;padding:16px">No customers of this kind</td></tr>'; }
h += '</tbody><tfoot><tr class="tot"><td colspan="3">Total - ' + pl(n, 'customer') + '</td>' + footNums(T) + '<td></td></tr></tfoot></table></div>';
$('lvPanel').innerHTML = h;
}
function limCls(b, l) { return b > l ? ' ov' : b >= 0.8 * l ? ' hi' : ''; }
function limCell(b, l) { return l > 0 ? '<span class="lim mini' + limCls(b, l) + '"><i style="width:' + Math.max(0, Math.min(100, 100 * b / l)).toFixed(1) + '%"></i></span>' + pc(b, l) : '<span class="z">-</span>'; }
function openStmt(code) {
ask(AJ, { x01: 'stmt', x02: D.from, x03: D.to, x04: code }, function (d) {
var i, p;
KF = '';
d.all = d.rows.slice(0);
for (i = 0; i < (d.pend || []).length; i++) { p = d.pend[i]; d.all.push([p[0], +p[4] === 4 ? 'RET' : 'INV', null, null, null, null, p[1], p[2], p[3], p[6], +p[7] > 0 ? +p[7] : 0, +p[7] < 0 ? -p[7] : 0, 0, p[5], null, null, null, +p[7] > 0 ? +p[7] : 0, null, 1]); }
push('st', d, d.c[0] + ' - ' + (d.c[1] || ''));
});
}
function today0() { var t = new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate()); }
function dueOf(r) {
var p, n, d, late;
if (r[1] !== 'INV' || !nz(r[10])) { return null; }
p = r[0].split('-'); n = +r[13] > 0 ? +r[13] : +ST.c[5];
d = new Date(+p[0], +p[1] - 1, +p[2] + n);
late = Math.round((today0() - d) / 864e5);
return { d: iso(d), open: +r[17] || 0, late: late, ovd: nz(r[17]) && late > 0 };
}
function docOf(r) { return has(r[6]) && (r[1] === 'INV' || r[1] === 'RET') ? r[6] + ' / ' + r[7] : has(r[8]) ? String(r[8]) : r[2] + ' / ' + r[3]; }
function keepR(r, u) { return KF === '' || (KF === 'OVD' ? !!(u && u.ovd) : KF === 'N' ? !!r[19] : r[1] === KF); }
function kchip(k, n) { return '<button type="button" class="chip k-' + (k || 'ALL') + (KF === k ? ' on' : '') + '" data-k="' + k + '">' + (k ? KLBL[k] : 'All') + '<small>' + n + '</small></button>'; }
function stSum() {
var d = ST, R = d.all, i, r, e = newAg(d.c[0], d.c[1]);
e.opn = +d.open; e.un = +d.ag[0]; e.od = +d.ag[7]; e.tot = +d.ag[8];
for (i = 0; i < 6; i++) { e.b[i] = +d.ag[1 + i]; }
for (i = 0; i < R.length; i++) { r = R[i]; if (r[19]) { e.pn++; e.pv += (+r[10]) - (+r[11]); } else { e.db += +r[10]; e.cr += +r[11]; } }
d.e = e;
return e;
}
function renderStmt() {
var d = ST, R = d.all, c = d.c, e = stSum(), h, i, r, u, b = +d.open, cnt = {}, no = 0, ns = 0, fd = 0, fc = 0, lim = +c[4], sys = bal(e), gap;
for (i = 0; i < R.length; i++) { r = R[i]; cnt[r[1]] = (cnt[r[1]] || 0) + 1; u = dueOf(r); if (u && u.ovd) { no++; } }
h = navCrumb() + '<div class="hb">' + band(c[0], c[1] || c[0], [['Salesman', esc(c[7] || '')], ['Type', '<span class="cc ' + (+c[3] ? 'ca">Cash' : 'cr">Credit') + '</span>'], ['Payment term', +c[5] + ' days'], ['Period', dmy(d.from) + ' - ' + dmy(d.to)]]) +
'<div class="hb-grid">' + balBlock(e, 'As system', 'As accounts (posted)') + agBlock(e) +
'<div class="hb-c"><h5>Credit limit</h5>' + (lim > 0 ? '<div class="lm-top"><b>' + pc(sys, lim) + '</b><span>used</span></div><span class="lim' + limCls(sys, lim) + '"><i style="width:' + Math.max(0, Math.min(100, 100 * sys / lim)).toFixed(1) + '%"></i></span><div class="lm-row"><span>Limit</span><b>' + fm(lim) + '</b></div><div class="lm-row"><span>Available</span><b' + (lim - sys < 0 ? ' class="r"' : '') + '>' + fm(lim - sys) + '</b></div>' : '<div class="dr-none">No credit limit on the customer card</div>') + '</div></div></div>';
h += '<div class="sp-ptitle">Period ' + dmy(d.from) + ' - ' + dmy(d.to) + (d.asof ? ' - data as of ' + esc(d.asof) : '') + '</div>';
if (e.pn) { h += '<div class="wide-w"><span class="ic">!</span><div>' + pl(e.pn, 'sales document') + ' of ' + fm(e.pv) + (e.pn === 1 ? ' is' : ' are') + ' not posted to the customer ledger - the balance as the system is ' + fm(sys) + ', as accounts ' + fm(sys - e.pv) + '<small>Accounts must post ' + (e.pn === 1 ? 'it' : 'them') + ' and approve the statement before it is sent to the customer</small></div></div>'; }
gap = r2(e.tot - (sys - e.pv));
if (d.to === iso(new Date()) && nz(gap)) { h += '<div class="alert wr">&#9888; The aging total ' + fm(e.tot) + ' differs from the posted balance ' + fm(sys - e.pv) + ' by ' + fm(gap) + ' - the aging is of the night run; if the difference stays, the receipts of this customer were not allocated correctly when entered.</div>'; }
h += '<div class="sk-chips st-kf">' + kchip('', R.length);
for (i = 0; i < KORD.length; i++) { if (cnt[KORD[i]]) { h += kchip(KORD[i], cnt[KORD[i]]); } }
h += (no ? kchip('OVD', no) : '') + (e.pn ? kchip('N', e.pn) : '') + '</div>';
if (KF) { h += '<div class="sp-ptitle on">Showing: ' + KLBL[KF] + '</div>'; }
h += '<div class="table-scroll"><table><thead><tr><th>Date</th><th>Type</th><th>Doc no.</th><th>Description</th><th>Due date</th><th class="num">Debit</th><th class="num">Credit</th><th class="num">Balance</th></tr></thead><tbody>' +
'<tr class="opn"><td class="c-code">' + dmy(d.from) + '</td><td colspan="4">Opening balance</td><td></td><td></td><td class="num' + (b < 0 ? ' neg' : '') + '">' + fm(b) + '</td></tr>';
for (i = 0; i < R.length; i++) {
r = R[i]; b += (+r[10]) - (+r[11]); u = dueOf(r);
if (!keepR(r, u)) { continue; }
ns++; fd += +r[10]; fc += +r[11];
h += '<tr class="' + (r[19] ? 'pnd' : u && u.ovd ? 'ovd' : '') + '"><td class="c-code">' + dmy(r[0]) + '</td><td><span class="ty ' + r[1] + '">' + (KIND[r[1]] || r[1]) + '</span></td>' +
'<td class="c-code lnk" data-r="' + i + '" title="' + (has(r[6]) ? 'Open the document' : 'Open the movement') + '">' + esc(docOf(r)) + '</td>' +
'<td class="ds">' + esc(r[9] || '') + (r[19] ? '<span class="tag np">not posted</span>' : !+r[12] ? '<span class="tag np">not posted to GL</span>' : '') + '</td>' +
(u ? '<td class="dd c-code' + (nz(u.open) ? '' : ' pd') + '">' + dmy(u.d) + (nz(u.open) ? (u.late > 0 ? '<span class="du ov">' + u.late + ' d late - ' + fm(u.open) + '</span>' : '<span class="du ok">in ' + (-u.late) + ' d</span>') : '<span class="du pd">paid</span>') + '</td>' : '<td></td>') +
cell(r[10], 'db') + cell(r[11], 'cr') + '<td class="num bal' + (b < 0 ? ' neg' : '') + '">' + fm(b) + '</td></tr>';
}
if (!ns) { h += '<tr><td colspan="8" class="z" style="text-align:center;padding:16px">No movements' + (KF ? ' of this type' : '') + ' in the period</td></tr>'; }
h += '</tbody><tfoot><tr class="tot"><td colspan="5">' + (KF ? KLBL[KF] + ' - ' : 'Period total - ') + pl(ns, 'movement') + '</td><td class="num">' + fm(fd) + '</td><td class="num">' + fm(fc) + '</td><td class="num">' + (KF ? '' : fm(b)) + '</td></tr></tfoot></table></div>';
$('lvPanel').innerHTML = h;
}
function titles() { var a = [TITLE], i; for (i = 0; i < NAV.length; i++) { a.push(NAV[i].t); } return a; }
function openDoc(t, s) { if (window.salesDoc) { window.salesDoc.open(t, s, { crumb: titles() }); } }
function openMov(id, ser, ma, sa) { ask(AJ, { x01: 'mov', x02: id, x03: ser, x04: ma, x05: sa }, function (d) { if (!d.h) { fail({ error: 'movement not found' }); return; } push('mv', d, (d.h[7] === 'RCP' ? 'Receipt ' : 'Movement ') + (has(d.h[12]) ? d.h[12] : d.h[2] + ' / ' + d.h[3])); }); }
function mdoc(r, a) { return has(r[a + 2]) ? r[a + 2] + ' / ' + r[a + 3] : r[0] + ' / ' + r[1]; }
function renderMov(d) { $('lvPanel').innerHTML = navCrumb() + (window.cuMov ? window.cuMov.html(d, { esc: esc, dmy: dmy, fm: fm, cell: cell, pc: pc, nz: nz, has: has, r2: r2, iso: iso, pl: pl, KIND: KIND, PAYM: PAYM, mdoc: mdoc }) : '<div class="dr-none">Movement drawing not loaded</div>'); }
function openEntry(y, t, n) { if (has(n) && window.jmEntry && window.jmEntry.open) { window.jmEntry.open(y, t, n); } }
function doPrint() {
var t = document.title, f = top();
if (!D) { return; }
document.title = (f ? f.t : TITLE + ' ' + D.from + ' ' + D.to).replace(/[^A-Za-z0-9]+/g, '_');
document.body.className += ' st-print';
window.print();
document.body.className = document.body.className.replace(/\s*st-print/g, '');
setTimeout(function () { document.title = t; }, 1500);
}
function excel() {
if (D && window.cuXl) { window.cuXl({ D: D, G: G, ST: ST, NAV: NAV, f: top(), SHOW: SHOW, CF: CF, KF: KF, KIND: KIND, KLBL: KLBL, BL: BL, fm: fm, dmy: dmy, r2: r2, has: has, bal: bal, cbal: cbal, over: over, keepC: keepC, keepR: keepR, getM: getM, dueOf: dueOf, docOf: docOf, mdoc: mdoc, custList: custList, grp: grpTxt(' - ').replace(/&amp;/g, '&') }); }
}
function run() {
if (busy) { return; }
busy = true; $('runBtn').disabled = true;
$('tableNote').textContent = 'Loading...';
apex.server.process(AJ, { x01: 'run', x02: $('fFrom').value, x03: $('fTo').value }, {
dataType: 'json',
success: function (d) {
busy = false; $('runBtn').disabled = false;
if (!d || d.error || !d.ok) { $('tableNote').textContent = 'Could not load' + (d && d.error ? ' - ' + d.error : ''); return; }
D = d; NAV = [];
$('fFrom').value = d.from; $('fTo').value = d.to;
$('periodBadge').textContent = per();
paintQuick(); build(); draw(); render();
},
error: function (x) { var e = errObj(x); busy = false; $('runBtn').disabled = false; $('tableNote').textContent = 'Could not load' + (e ? ' - ' + e.error : '. Please try again.'); }
});
}
var QKS = ['1', '3', '6', 'Y', '12'];
function quickFrom(k) {
var t = new Date(), d, last, r;
if (k === 'Y') { return t.getFullYear() + '-01-01'; }
d = new Date(t.getFullYear(), t.getMonth() - (+k), 1);
last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
d.setDate(Math.min(t.getDate(), last));
r = iso(d);
return r < '2023-01-01' ? '2023-01-01' : r;
}
function paintQuick() {
var h = '', i, today = iso(new Date());
for (i = 0; i < QKS.length; i++) {
h += '<button type="button" class="chip' + ($('fTo').value === today && $('fFrom').value === quickFrom(QKS[i]) ? ' on' : '') + '" data-q="' + QKS[i] + '" title="' +
(QKS[i] === 'Y' ? 'From 1 January to today' : 'The last ' + QKS[i] + (QKS[i] === '1' ? ' month' : ' months')) + '">' + (QKS[i] === 'Y' ? 'YTD' : QKS[i] + 'M') + '</button>';
}
$('quickChips').innerHTML = h;
}
function paintShow() {
$('showChips').innerHTML = '<button type="button" class="chip c-all' + (SHOW === '' ? ' on' : '') + '" data-s="">All<small>' + (D ? D.cust.length : 0) + '</small></button>' +
'<button type="button" class="chip c-wr' + (SHOW === 'O' ? ' on' : '') + '" data-s="O" title="Customers with invoices past their payment terms">With overdue<small>' + (G ? G.no : 0) + '</small></button>' +
'<button type="button" class="chip c-np' + (SHOW === 'N' ? ' on' : '') + '" data-s="N" title="Customers with sales documents not posted to the customer ledger">Not posted<small>' + (G ? G.np : 0) + '</small></button>';
}
$('runBtn').addEventListener('click', run);
$('resetBtn').addEventListener('click', function () {
var t = new Date();
$('fFrom').value = t.getFullYear() + '-01-01'; $('fTo').value = iso(t);
$('fSup').value = ''; SHOW = ''; run();
});
$('quickChips').addEventListener('click', function (e) {
var q = pick(e, 'data-q');
if (!q || busy) { return; }
$('fFrom').value = quickFrom(q); $('fTo').value = iso(new Date());
paintQuick(); run();
});
$('fFrom').addEventListener('change', paintQuick);
$('fTo').addEventListener('change', paintQuick);
if (window.cuSS) {
window.cuSS($('fSup'), function (q, cb) {
apex.server.process(AJ, { x01: 'find', x02: q }, { dataType: 'json', success: function (d) { cb(d && d.list ? d.list : []); }, error: function () { cb([]); } });
}, function (code) { $('fSup').value = ''; if (!busy) { NAV = []; openStmt(code); } });
}
$('stKpi').addEventListener('click', function (e) { var x = pick(e, 'data-x'); if (x && D && !busy) { CF = ''; NAV = []; push('sm', '*' + x, FL[x]); } });
$('showChips').addEventListener('click', function (e) {
var s = pick(e, 'data-s');
if (s === null || !D) { return; }
SHOW = s; NAV = []; build(); draw(); render();
});
$('stTable').addEventListener('click', function (e) { var u = pick(e, 'data-u'); if (u !== null && !busy) { openSup(u); } });
$('lvPanel').addEventListener('click', function (e) {
var g = pick(e, 'data-go'), v = pick(e, 'data-m'), f = top(), r;
if (g !== null) { if (!busy) { goNav(g); } return; }
if (busy || !f) { return; }
if (v !== null) { CF = ''; push('sm', v, G.sm[v].name); return; }
if (f.k === 'sm' && !getM(f.d)) { return; }
v = pick(e, 'data-c'); if (v !== null) { openStmt(v); return; }
v = pick(e, 'data-f'); if (v !== null) { CF = v; renderSm(f.d); return; }
v = pick(e, 'data-k'); if (v !== null && ST) { KF = v; renderStmt(); return; }
v = pick(e, 'data-r'); if (v !== null && ST) { r = ST.all[+v]; if (has(r[6]) && (r[1] === 'INV' || r[1] === 'RET')) { openDoc(r[6], r[7]); } else { openMov(r[2], r[3], r[4], r[5]); } return; }
if (f.k !== 'mv') { return; }
if (pick(e, 'data-e') !== null) { openEntry(f.d.h[14], f.d.h[15], f.d.h[16]); return; }
if (pick(e, 'data-d') !== null) { openDoc(f.d.h[18], f.d.h[19]); return; }
v = pick(e, 'data-s'); if (v !== null) { r = f.d.set[+v]; if (has(r[6]) && (r[5] === 'INV' || r[5] === 'RET')) { openDoc(r[6], r[7]); } else { openMov(r[0], r[1], r[2], r[3]); } return; }
v = pick(e, 'data-b'); if (v !== null) { r = f.d.by[+v]; openMov(r[0], r[1], r[2], r[3]); }
});
if (window.jmExport && $('exportBox')) { window.jmExport.attach($('exportBox'), { pdf: doPrint, excel: excel }); }
else if ($('exportBox')) {
$('exportBox').innerHTML = '<button type="button" class="btn-print btn-excel" id="xlBtn">Export Excel</button> <button type="button" class="btn-print" id="pdfBtn">Print / PDF</button>';
$('xlBtn').addEventListener('click', excel);
$('pdfBtn').addEventListener('click', doPrint);
}
(function () { var t = new Date(); $('fFrom').value = t.getFullYear() + '-01-01'; $('fTo').value = iso(t); })();
paintShow();
run();
})();

});
