(function () {
var P = null, DOC = null, CALC = null, STACK = [], OPT = {};
var ICO = '<svg viewBox="0 0 24 24"><path d="M4 20V6l8-3 8 3v14"/><path d="M4 20h16"/><path d="M9 20v-5h6v5"/><path d="M9 9h.01M15 9h.01M9 12h.01M15 12h.01"/></svg>';
var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
var COLS = ['d', 'doc', 'no', 'kind', 'cn', 'sn', 'n', 'gross', 'disc', 'net', 'cost', 'profit', 'm'];
function esc(s) {
return String(s === null || s === undefined ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function fm(n, d) {
var neg, p;
d = (d === undefined || d === null) ? 2 : d;
n = +n || 0; neg = n < 0;
p = Math.abs(n).toFixed(d).split('.');
p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
return (neg && Math.abs(n) >= 0.5 / Math.pow(10, d) ? '-' : '') + p.join('.');
}
function qty(n) { n = +n || 0; return Math.round(n * 100) % 100 === 0 ? fm(n, 0) : fm(n, 2); }
function pc(a, b) { return b ? (a / b * 100).toFixed(1) + '%' : '-'; }
function zero(n) { return Math.round((+n || 0) * 100) ? fm(n) : '<span class="z">-</span>'; }
function dmy(s) { return s ? String(s).substr(8, 2) + '/' + String(s).substr(5, 2) + '/' + String(s).substr(0, 4) : ''; }
function mmyyyy(s) { return s ? String(s).substr(5, 2) + '/' + String(s).substr(0, 4) : ''; }
function docNo(h) { return h.t + ' / ' + h.s; }
function hasCls(c) { return new RegExp('(^|\\s)' + c + '(\\s|$)').test(document.body.className); }
function addCls(c) { if (!hasCls(c)) { document.body.className += ' ' + c; } }
function delCls(c) { document.body.className = document.body.className.replace(new RegExp('(^|\\s)' + c + '(?=\\s|$)', 'g'), ''); }
function flagOf(m) { return m < 0 ? 'bad' : (m >= 0.95 ? 'chk' : (m < 0.10 ? 'low' : '')); }
function flag(m) {
var k = flagOf(m);
return k === 'bad' ? '<span class="sd-bdg bad">loss</span>' : (k === 'chk' ? '<span class="sd-bdg chk">check cost</span>' : (k === 'low' ? '<span class="sd-bdg low">low</span>' : ''));
}
function bar(m) {
var k = m < 0 ? 'bad' : (m < 0.10 ? 'low' : '');
return '<span class="sd-bar"><i class="' + k + '" style="width:' + Math.max(0, Math.min(100, m * 100)).toFixed(0) + '%"></i></span>' + (m * 100).toFixed(1) + '%' + flag(m);
}
function panel() {
var w;
if (P && document.getElementById('sdPanel') === P) { return P; }
P = document.getElementById('sdPanel');
if (!P) {
w = (OPT.root && document.getElementById(OPT.root)) || document.querySelector('.wrap') || document.body;
P = document.createElement('div');
P.id = 'sdPanel';
w.appendChild(P);
}
P.addEventListener('click', onClick);
return P;
}
function topHtml(ready) {
var i, c = OPT.crumb || [], h = '<div class="sd-head"><div class="sd-crumb">';
for (i = 0; i < c.length; i++) { h += '<span class="c1" data-sd="close">' + esc(c[i]) + '</span><span class="sep">&rsaquo;</span>'; }
for (i = 0; i < STACK.length; i++) {
if (i < STACK.length - 1) { h += '<span class="c1" data-sd="go" data-i="' + i + '">' + esc(STACK[i].label) + '</span><span class="sep">&rsaquo;</span>'; }
else { h += '<span class="c2">' + esc(STACK[i].label) + '</span>'; }
}
h += '</div><div class="sd-btns">';
if (ready) { h += '<div class="jx"><button type="button" class="jx-btn" data-sd="print">&#8681; Export PDF</button></div>'; }
h += '<button type="button" class="sd-back" data-sd="back">&lsaquo; Back</button></div></div>';
return h;
}
function calc(D) {
var i, L, r, rows = [], T = { qty: 0, bonus: 0, gross: 0, ld: 0, lines: 0, vat: 0, cost: 0 };
for (i = 0; i < D.lines.length; i++) {
L = D.lines[i];
r = { sn: L[0], code: L[1], name: L[2], cfg: L[3], unit: L[4], qty: +L[5] || 0, bonus: +L[6] || 0, price: +L[7] || 0, d1: +L[8] || 0, vat: +L[9] || 0, cost: +L[10] || 0 };
r.gross = r.qty * r.price; r.ld = r.qty * r.d1; r.net = r.gross - r.ld;
r.profit = r.net - r.cost; r.m = r.net ? r.profit / r.net : 0;
r.cu = r.qty ? r.cost / r.qty : 0; r.pu = r.qty ? r.profit / r.qty : 0;
T.qty += r.qty; T.bonus += r.bonus; T.gross += r.gross; T.ld += r.ld; T.lines += r.net; T.vat += r.vat; T.cost += r.cost;
rows.push(r);
}
T.hdr = +D.h.hdr || 0; T.tr = +D.h.tr || 0;
T.net = T.lines - T.hdr;
T.profit = T.net - T.cost; T.m = T.net ? T.profit / T.net : 0;
T.total = T.net + T.tr + T.vat;
return { rows: rows, T: T };
}
function headHtml(D) {
var H = D.h, h = '';
h += '<div class="sd-oh"><div class="sd-band' + (H.ret ? ' ret' : '') + '">';
h += '<div class="sd-b"><small>' + (H.ret ? 'Sales return' : 'Sales invoice') + '</small><div class="sd-no">' + esc(docNo(H)) + '</div></div>';
if (H.doc) { h += '<div class="sd-b"><small>Doc no.</small><div>' + esc(H.doc) + '</div></div>'; }
h += '<div class="sd-b"><small>Date</small><div>' + dmy(H.d) + '</div></div>';
h += '<div class="sd-b"><small>Type</small><div><span class="sd-chip ' + (H.ret ? 'retc' : (H.cash ? 'cash' : '')) + '">' + (H.cash ? 'CASH' : 'CREDIT') + '</span>' + (H.terms ? ' &nbsp;' + esc(H.terms) + ' days' : '') + '</div></div>';
h += '<div class="sd-b"><small>Transaction type</small><div dir="auto">' + esc(H.tn) + '</div></div>';
h += '<div class="sd-b sd-asof"><small>Data as of</small><div>Live &middot; ' + esc(D.now) + '</div></div>';
h += '</div><div class="sd-body">';
h += '<div class="sd-cust"><div class="sd-ico">' + ICO + '</div><div><small>Customer</small><div class="sd-name" dir="auto">' + esc(H.cn) + '</div><span class="sd-code">' + esc(H.cu) + '</span></div></div>';
h += '<div class="sd-ref"><small>Salesman</small><div class="v txt" dir="auto">' + esc(H.sn) + '</div><span class="sd-code">' + esc(H.sm) + '</span></div>';
if (H.ret && H.ot !== null && H.os !== null) {
h += '<div class="sd-ref"><small>Return of invoice</small><div class="v lnk" data-sd="orig">' + esc(H.ot + ' / ' + H.os) + '</div>' + (H.odoc ? '<span class="sd-code">doc ' + esc(H.odoc) + '</span>' : '') + '</div>';
}
if (H.gl) { h += '<div class="sd-ref"><small>Ledger entry</small><div class="v"><span class="jme-link" data-jme-doc="1" data-jme="' + esc(H.gl) + '" title="Open the journal entry">' + esc(H.gl) + '</span></div></div>'; }
h += '</div>';
if (H.desc) { h += '<div class="sd-notes"><b>Description</b><span dir="auto">' + esc(H.desc) + '</span></div>'; }
h += '</div>';
return h;
}
function tableHtml(D, C) {
var T = C.T, cost = +D.cost === 1, hasV = Math.round(T.vat * 100) !== 0, hasB = T.bonus !== 0, i, r, h = '';
h += '<div class="sd-h4">Items</div><div class="sd-scroll"><table class="sd-t"><thead><tr>';
h += '<th>#</th><th>Item code</th><th>Description</th><th class="num">Config ID</th><th>Unit</th><th class="num">Qty</th>';
if (hasB) { h += '<th class="num">Bonus</th>'; }
h += '<th class="num">Price</th><th class="num">Disc.</th><th class="num">Net price</th><th class="num">Net value</th>';
if (hasV) { h += '<th class="num">VAT</th>'; }
if (cost) { h += '<th class="num cg">Cost / unit</th><th class="num cg">Profit / unit</th><th class="num cg">Margin</th>'; }
h += '</tr></thead><tbody>';
for (i = 0; i < C.rows.length; i++) {
r = C.rows[i];
h += '<tr><td class="mut">' + (i + 1) + '</td><td class="code">' + esc(r.code) + '</td><td class="iname">' + esc(r.name) + '</td>';
h += '<td class="num mut">' + (r.cfg === null ? '' : esc(r.cfg)) + '</td><td>' + esc(r.unit) + '</td><td class="num">' + qty(r.qty) + '</td>';
if (hasB) { h += '<td class="num">' + (r.bonus ? qty(r.bonus) : '<span class="z">-</span>') + '</td>'; }
h += '<td class="num">' + fm(r.price) + '</td><td class="num">' + zero(r.d1) + '</td><td class="num"><b>' + fm(r.price - r.d1) + '</b></td><td class="num"><b>' + fm(r.net) + '</b></td>';
if (hasV) { h += '<td class="num">' + zero(r.vat) + '</td>'; }
if (cost) {
h += '<td class="num cg">' + fm(r.cu) + '</td><td class="num cg' + (r.profit < 0 ? ' neg' : '') + '"><b>' + fm(r.pu) + '</b></td><td class="num cg">' + bar(r.m) + '</td>';
}
h += '</tr>';
}
h += '</tbody><tfoot><tr><td colspan="5">Total &middot; ' + C.rows.length + (C.rows.length === 1 ? ' line' : ' lines') + '</td><td class="num">' + qty(T.qty) + '</td>';
if (hasB) { h += '<td class="num">' + qty(T.bonus) + '</td>'; }
h += '<td></td><td></td><td></td><td class="num">' + fm(T.lines) + '</td>';
if (hasV) { h += '<td class="num">' + fm(T.vat) + '</td>'; }
if (cost) { h += '<td></td><td></td><td></td>'; }
h += '</tr></tfoot></table></div>';
return h;
}
function boxesHtml(D, C) {
var T = C.T, cost = +D.cost === 1, h = '<div class="sd-boxes">';
if (cost) {
h += '<div class="sd-box pf"><h5>Profitability</h5>';
h += '<div class="r"><span>Net sales</span><b>' + fm(T.net) + '</b></div>';
h += '<div class="r"><span>Cost <i>' + pc(T.cost, T.net) + '</i></span><b>' + fm(T.cost) + '</b></div>';
h += '<div class="r t"><span>Profit <i>' + pc(T.profit, T.net) + '</i></span><b>' + fm(T.profit) + '</b></div>';
h += '</div>';
}
h += '<div class="sd-box"><h5>' + (D.h.ret ? 'Return totals' : 'Invoice totals') + '</h5>';
h += '<div class="r"><span>Grand total</span><b>' + fm(T.gross) + '</b></div>';
h += '<div class="r"><span>Discount <i>' + pc(T.ld + T.hdr, T.gross) + '</i></span><b>' + fm(T.ld + T.hdr) + '</b></div>';
if (Math.round(T.hdr * 100) !== 0) {
h += '<div class="r sub"><span>Lines</span><b>' + fm(T.ld) + '</b></div>';
h += '<div class="r sub"><span>Invoice header</span><b>' + fm(T.hdr) + '</b></div>';
}
h += '<div class="r"><span>Total before VAT</span><b>' + fm(T.net) + '</b></div>';
h += '<div class="r"><span>Transport</span><b>' + fm(T.tr) + '</b></div>';
h += '<div class="r"><span>Total VAT 15%</span><b>' + fm(T.vat) + '</b></div>';
h += '<div class="r t"><span>Total after VAT</span><b>' + fm(T.total) + '</b></div>';
h += '</div></div>';
return h;
}
function renderDoc() {
CALC = calc(DOC);
panel().innerHTML = topHtml(true) + headHtml(DOC) + tableHtml(DOC, CALC) + boxesHtml(DOC, CALC);
}
function listRows(L) {
var i, R, r, out = [];
for (i = 0; i < L.data.docs.length; i++) {
R = L.data.docs[i];
r = { t: R[0], s: R[1], no: R[2], d: R[3], cash: +R[4], ret: +R[5], sm: R[6], sn: R[7], cu: R[8], cn: R[9], n: +R[10] || 0 };
r.sg = r.ret ? -1 : 1;
r.doc = r.t * 10000000 + r.s;
r.kind = r.ret ? 2 : (r.cash ? 0 : 1);
r.gross = r.sg * (+R[11] || 0);
r.disc = r.sg * ((+R[12] || 0) + (+R[13] || 0));
r.cost = r.sg * (+R[14] || 0);
r.hdr = +R[13] || 0;
r.net = r.gross - r.disc;
r.profit = r.net - r.cost; r.m = r.net ? r.profit / r.net : 0;
r.fl = +L.data.cost === 1 ? flagOf(r.m) : '';
out.push(r);
}
return out;
}
function listSum(list) {
var i, T = { n: 0, cash: 0, credit: 0, ret: 0, fl: 0, gross: 0, disc: 0, net: 0, cost: 0 };
for (i = 0; i < list.length; i++) {
T.n++; if (list[i].ret) { T.ret++; } else if (list[i].cash) { T.cash++; } else { T.credit++; } if (list[i].fl) { T.fl++; }
T.gross += list[i].gross; T.disc += list[i].disc; T.net += list[i].net; T.cost += list[i].cost;
}
T.profit = T.net - T.cost; T.m = T.net ? T.profit / T.net : 0;
return T;
}
function listFilter(list, f) {
var i, out = [];
for (i = 0; i < list.length; i++) {
if (f === 'cash' && (list[i].ret || !list[i].cash)) { continue; }
if (f === 'credit' && (list[i].ret || list[i].cash)) { continue; }
if (f === 'ret' && !list[i].ret) { continue; }
if (f === 'fl' && !list[i].fl) { continue; }
out.push(list[i]);
}
return out;
}
function listSort(list, L) {
var k = COLS[L.sk] || 'd';
return list.slice().sort(function (a, b) {
var x = a[k], y = b[k], ma = a.d.substr(0, 7), mb = b.d.substr(0, 7);
if (ma !== mb) { return ma < mb ? -1 : 1; }
if (x === y) { return a.d < b.d ? -1 : (a.d > b.d ? 1 : a.s - b.s); }
return (x < y ? -1 : 1) * L.sd;
});
}
function listHead(L, TA) {
var sc = L.data.scope, h = '<div class="sd-oh"><div class="sd-band">';
h += '<div class="sd-b"><small>Sales documents of ' + (sc.cu ? 'customer' : 'salesman') + '</small><div class="sd-big" dir="auto">' + esc(sc.cu ? sc.cn : sc.sn) + '</div>'
+ '<span class="sd-code w">' + esc(sc.cu ? sc.cu : sc.sm) + '</span></div>';
if (sc.cu && sc.sm) { h += '<div class="sd-b"><small>Salesman</small><div dir="auto">' + esc(sc.sn) + '</div><span class="sd-code w">' + esc(sc.sm) + '</span></div>'; }
h += '<div class="sd-b"><small>Period</small><div>' + (sc.from === sc.to ? mmyyyy(sc.from) : mmyyyy(sc.from) + ' - ' + mmyyyy(sc.to)) + '</div></div>';
h += '<div class="sd-b"><small>Cash</small><div>' + TA.cash + '</div></div>';
h += '<div class="sd-b"><small class="sd-cc">Credit</small><div>' + TA.credit + '</div></div>';
h += '<div class="sd-b"><small>Returns</small><div>' + TA.ret + '</div></div>';
h += '<div class="sd-b sd-asof"><small>Data as of</small><div>Live &middot; ' + esc(L.data.now) + '</div></div>';
h += '</div>';
if (+L.data.more === 1) { h += '<div class="sd-notes"><b>Note</b>Only the first 1,500 documents of the period are listed. Narrow the period to see them all.</div>'; }
h += '</div>';
return h;
}
function listChips(L, TA) {
var C = [['all', 'All', TA.n], ['cash', 'Cash', TA.cash], ['credit', 'Credit', TA.credit], ['ret', 'Returns', TA.ret]], i, h = '<div class="sl-tools"><div class="sd-h4">Documents</div><div class="sl-chips">';
if (+L.data.cost === 1) { C.push(['fl', 'Flagged', TA.fl]); }
for (i = 0; i < C.length; i++) { h += '<span class="sl-chip' + (L.f === C[i][0] ? ' on' : '') + '" data-sd="filter" data-f="' + C[i][0] + '">' + C[i][1] + '<b>' + C[i][2] + '</b></span>'; }
return h + '</div></div>';
}
function listTable(L, list) {
var sc = L.sc, cost = +L.data.cost === 1, showCu = !sc.cu, showSm = !sc.sm, i, r, g = '', part = [], n = 0, span, h;
function th(i, label, cls) { return '<th class="srt' + (cls ? ' ' + cls : '') + '" data-sd="sort" data-i="' + i + '">' + label + (L.sk === i ? (L.sd === 1 ? ' &#9650;' : ' &#9660;') : '') + '</th>'; }
function tot(label, T, cls) {
var x = '<tr' + (cls ? ' class="' + cls + '"' : '') + '><td colspan="' + span + '">' + label + '</td>';
x += '<td class="num"></td><td class="num">' + fm(T.gross) + '</td><td class="num">' + fm(T.disc) + '</td><td class="num">' + fm(T.net) + '</td>';
if (cost) { x += '<td class="num">' + fm(T.cost) + '</td><td class="num">' + fm(T.profit) + '</td><td class="num">' + (T.m * 100).toFixed(1) + '%</td>'; }
return x + '</tr>';
}
span = 5 + (showCu ? 1 : 0) + (showSm ? 1 : 0);
h = '<div class="sd-scroll"><table class="sd-t"><thead><tr><th>#</th>' + th(0, 'Date') + th(1, 'Document') + th(2, 'Doc no.', 'num') + th(3, 'Type');
if (showCu) { h += th(4, 'Customer'); }
if (showSm) { h += th(5, 'Salesman'); }
h += th(6, 'Lines', 'num') + th(7, 'Gross', 'num') + th(8, 'Discount', 'num') + th(9, 'Net value', 'num');
if (cost) { h += th(10, 'Cost', 'num cg') + th(11, 'Profit', 'num cg') + th(12, 'Margin', 'num cg'); }
h += '</tr></thead><tbody>';
if (!list.length) { h += '<tr><td colspan="' + (span + 4 + (cost ? 3 : 0)) + '" class="sl-none">No documents in this filter.</td></tr>'; }
for (i = 0; i < list.length; i++) {
r = list[i];
if (r.d.substr(0, 7) !== g) {
if (part.length) { h += tot('Total of ' + MONTHS[+g.substr(5, 2) - 1] + ' ' + g.substr(0, 4) + ' &middot; ' + part.length + (part.length === 1 ? ' document' : ' documents'), listSum(part), 'sub'); }
g = r.d.substr(0, 7); part = []; n = 0;
h += '<tr class="grp"><td colspan="' + (span + 4 + (cost ? 3 : 0)) + '">' + MONTHS[+g.substr(5, 2) - 1] + ' ' + g.substr(0, 4) + '</td></tr>';
}
part.push(r); n++;
h += '<tr class="go' + (r.ret ? ' rt' : '') + '" data-sd="doc" data-t="' + r.t + '" data-s="' + r.s + '"><td class="mut">' + n + '</td><td>' + dmy(r.d) + '</td>';
h += '<td class="docn">' + r.t + ' / ' + r.s + '</td><td class="num mut">' + esc(r.no) + '</td>';
h += '<td><span class="sl-tag ' + (r.ret ? 'ret' : (r.cash ? 'cash' : 'credit')) + '">' + (r.ret ? 'RETURN' : (r.cash ? 'CASH' : 'CREDIT')) + '</span></td>';
if (showCu) { h += '<td class="iname" dir="auto">' + esc(r.cn) + '</td>'; }
if (showSm) { h += '<td class="iname" dir="auto">' + esc(r.sn) + '</td>'; }
h += '<td class="num">' + r.n + '</td><td class="num">' + fm(r.gross) + '</td>';
h += '<td class="num">' + (Math.round(r.disc * 100) ? fm(r.disc) : '<span class="z">-</span>') + (r.hdr ? ' <span class="sd-bdg chk">hdr</span>' : '') + '</td><td class="num"><b>' + fm(r.net) + '</b></td>';
if (cost) { h += '<td class="num cg">' + fm(r.cost) + '</td><td class="num cg' + (r.profit < 0 ? ' neg' : '') + '"><b>' + fm(r.profit) + '</b></td><td class="num cg">' + bar(r.m) + '</td>'; }
h += '</tr>';
}
if (part.length) { h += tot('Total of ' + MONTHS[+g.substr(5, 2) - 1] + ' ' + g.substr(0, 4) + ' &middot; ' + part.length + (part.length === 1 ? ' document' : ' documents'), listSum(part), 'sub'); }
h += '</tbody><tfoot>' + tot('Total &middot; ' + list.length + (list.length === 1 ? ' document' : ' documents'), listSum(list)) + '</tfoot></table></div>';
return h;
}
function listBoxes(L, T) {
var h = '<div class="sd-boxes">';
if (+L.data.cost === 1) {
h += '<div class="sd-box pf"><h5>Profitability</h5><div class="r"><span>Net sales</span><b>' + fm(T.net) + '</b></div>';
h += '<div class="r"><span>Cost <i>' + pc(T.cost, T.net) + '</i></span><b>' + fm(T.cost) + '</b></div>';
h += '<div class="r t"><span>Profit <i>' + pc(T.profit, T.net) + '</i></span><b>' + fm(T.profit) + '</b></div></div>';
}
h += '<div class="sd-box"><h5>Sales totals</h5><div class="r"><span>Gross</span><b>' + fm(T.gross) + '</b></div>';
h += '<div class="r"><span>Discount <i>' + pc(T.disc, T.gross) + '</i></span><b>' + fm(T.disc) + '</b></div>';
h += '<div class="r t"><span>Net sales</span><b>' + fm(T.net) + '</b></div></div></div>';
return h;
}
function renderList(L) {
var all = listRows(L), TA = listSum(all), list;
if (L.f === 'fl' && +L.data.cost !== 1) { L.f = 'all'; }
list = listSort(listFilter(all, L.f), L);
panel().innerHTML = topHtml(true) + listHead(L, TA) + listChips(L, TA) + listTable(L, list) + listBoxes(L, listSum(list));
}
function message(txt, err) {
panel().innerHTML = topHtml(false) + '<div class="sd-msg' + (err ? ' err' : '') + '">' + esc(txt) + '</div>';
}
function errText(d, cur) {
if (!d) { return 'Could not load: empty reply'; }
if (d.error === 'not allowed') { return 'You do not have access to this document.'; }
if (d.error === 'document not found') { return 'Document ' + cur.t + ' / ' + cur.s + ' was not found.'; }
return 'Could not load: ' + d.error;
}
function load() {
var cur = STACK[STACK.length - 1], p;
DOC = null; CALC = null;
addCls('sd-open');
window.scrollTo(0, 0);
if (cur.k === 'list') {
if (cur.data) { renderList(cur); return; }
message('Loading the documents ...', false);
p = { x01: 'docs', x02: cur.sc.from, x03: cur.sc.to, x04: cur.sc.sm || '', x05: cur.sc.cu || '' };
} else {
message('Loading ' + cur.label + ' ...', false);
p = { x01: 'inv', x02: String(cur.t), x03: String(cur.s) };
}
apex.server.process('SALES_DOC_AJAX', p, {
dataType: 'json',
success: function (d) {
if (STACK.length === 0 || STACK[STACK.length - 1] !== cur) { return; }
if (!d || d.error) { message(errText(d, cur), true); return; }
if (cur.k === 'list') { cur.data = d; renderList(cur); return; }
DOC = d;
cur.label = (d.h.ret ? 'Return ' : 'Invoice ') + docNo(d.h);
renderDoc();
},
error: function () {
if (STACK.length === 0 || STACK[STACK.length - 1] !== cur) { return; }
message('Could not reach the server. Try again.', true);
}
});
}
function pushDoc(t, s) {
STACK.push({ k: 'doc', t: t, s: s, label: 'Document ' + t + ' / ' + s });
load();
}
function close() {
STACK = []; DOC = null; CALC = null;
delCls('sd-open');
if (P) { P.innerHTML = ''; }
if (typeof OPT.onClose === 'function') { OPT.onClose(); }
}
function back() {
if (STACK.length > 1) { STACK.pop(); load(); return; }
close();
}
function doPrint() {
var t = document.title, cur = STACK[STACK.length - 1];
if (!cur) { return; }
document.title = cur.k === 'list' ? 'Sales_documents_' + cur.sc.from + '_' + cur.sc.to : ((DOC && DOC.h.ret) ? 'Return_' : 'Invoice_') + cur.t + '_' + cur.s;
addCls('sd-print');
window.print();
delCls('sd-print');
setTimeout(function () { document.title = t; }, 1500);
}
function pick(e, a) {
var t = e.target;
while (t && t !== P) { if (t.getAttribute && t.getAttribute(a) !== null) { return t; } t = t.parentNode; }
return null;
}
function onClick(e) {
var t = pick(e, 'data-sd'), a, cur = STACK[STACK.length - 1], i;
if (!t) { return; }
a = t.getAttribute('data-sd');
if (a === 'back') { back(); return; }
if (a === 'close') { close(); return; }
if (a === 'print') { doPrint(); return; }
if (a === 'go') { STACK.length = (+t.getAttribute('data-i')) + 1; load(); return; }
if (a === 'orig' && DOC) { pushDoc(DOC.h.ot, DOC.h.os); return; }
if (a === 'doc') { pushDoc(+t.getAttribute('data-t'), +t.getAttribute('data-s')); return; }
if (a === 'filter' && cur && cur.k === 'list') { cur.f = t.getAttribute('data-f'); renderList(cur); return; }
if (a === 'sort' && cur && cur.k === 'list') {
i = +t.getAttribute('data-i');
if (cur.sk === i) { cur.sd = -cur.sd; } else { cur.sk = i; cur.sd = 1; }
renderList(cur);
}
}
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
window.salesDoc = {
open: function (t, s, o) { OPT = o || {}; STACK = []; panel(); pushDoc(t, s); },
list: function (sc, o) {
OPT = o || {}; STACK = []; panel();
STACK.push({ k: 'list', sc: { from: sc.from, to: sc.to || sc.from, sm: sc.sm || '', cu: sc.cu || '' }, label: sc.label || 'Invoices', data: null, f: 'all', sk: 0, sd: 1 });
load();
},
close: close,
isOpen: function () { return hasCls('sd-open'); }
};
}());
