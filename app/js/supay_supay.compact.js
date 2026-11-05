window.addEventListener("DOMContentLoaded",function(){
(function () {
var SKIND = '', D = null, MO = [], SHOW = '', RATE = 1, USD = 3.75, LVL = 0, SUP = null, INV = null, busy = false, NOW, SETTLED = false, SMALL = 1, NSET = 0;
function $(id) { return document.getElementById(id); }
if (!$('spTable')) { return; }
function esc(s) { return String(s === null || s === undefined ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function pad(n) { return (n < 10 ? '0' : '') + n; }
function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function dmy(s) { return s ? s.substr(8, 2) + '/' + s.substr(5, 2) + '/' + s.substr(0, 4) : ''; }
function moLbl(m) { return m ? m.substr(5, 2) + '/' + m.substr(0, 4) : ''; }
function fm(v, d) {
var neg = v < 0, a = Math.abs(v), s, o = '', i, f = '';
if (d === undefined) { d = 2; }
s = a.toFixed(d);
i = s.indexOf('.');
if (i >= 0) { f = s.substr(i); s = s.substr(0, i); }
while (s.length > 3) { o = ',' + s.substr(s.length - 3) + o; s = s.substr(0, s.length - 3); }
return (neg && Math.round(a * 100) ? '-' : '') + s + o + f;
}
function money(v) { v = +v || 0; return Math.round(v * 100) ? fm(v / RATE) : '<span class="z">0.00</span>'; }
function cell(v, cls) { v = +v || 0; return '<td class="num' + (cls ? ' ' + cls : '') + (Math.round(v * 100) ? '' : ' z') + '">' + (Math.round(v * 100) ? fm(v / RATE) : '') + '</td>'; }
function cur() { return RATE === 1 ? 'SAR' : 'USD'; }
function pc(x, t) { return t ? (100 * x / t).toFixed(1) + '%' : '0%'; }
NOW = iso(new Date()).substr(0, 7);
function pick(e, attr) {
var t = e.target;
while (t && t !== e.currentTarget && !(t.getAttribute && t.getAttribute(attr) !== null)) { t = t.parentNode; }
return t && t !== e.currentTarget ? t.getAttribute(attr) : null;
}
function typeChip(r) { return r[6] === 'I' ? '<span class="st inv">Invoice</span>' : '<span class="st ord">Order</span>'; }
function tags(r) { return (r[6] === 'I' && !+r[20] ? '<span class="tag np" title="Receipt not posted to the vendor module yet">not posted</span>' : '') + (r[5] === 'X' ? '<span class="tag x" title="This supplier carries expenses on another supplier\'s order">expenses</span>' : ''); }
function groups() {
var q = ($('fSup').value || '').toLowerCase().replace(/^\s+|\s+$/g, ''), map = {}, list = [], i, j, r, s, g, ord, inv;
NSET = 0;
if (!D) { return list; }
for (i = 0; i < D.sup.length; i++) { s = D.sup[i]; map[s[0]] = { s: s, rows: [], o: [], inv: [], un: 0 }; }
for (i = 0; i < D.rows.length; i++) {
r = D.rows[i];
if (Math.abs(+r[18]) < SMALL) { NSET++; if (!SETTLED) { continue; } }
if (SHOW && r[6] !== SHOW) { continue; }
g = map[r[0]];
if (!g) { g = map[r[0]] = { s: [r[0], 'Supplier ' + r[0], 0, null, 0], rows: [], o: [], inv: [], un: 0 }; }
g.rows.push(r);
}
for (i = 0; i < D.sup.length; i++) {
g = map[D.sup[i][0]];
if (!g.rows.length) { continue; }
if (q && String(g.s[1]).toLowerCase().indexOf(q) < 0 && String(g.s[0]).indexOf(q) < 0) { continue; }
ord = []; inv = [];
for (j = 0; j < g.rows.length; j++) { (g.rows[j][6] === 'I' ? inv : ord).push(g.rows[j]); }
g.o = sumRows(ord); g.inv = sumRows(inv); g.un = g.o.un + g.inv.un;
list.push(g);
}
return list;
}
function sumRows(rows) {
var o = { m: {}, un: 0, tot: 0, n: rows.length }, i, r;
for (i = 0; i < rows.length; i++) {
r = rows[i];
if (+r[7] === 1) { o.un += +r[18]; continue; }
o.m[r[12]] = (o.m[r[12]] || 0) + (+r[18]);
o.tot += +r[18];
}
return o;
}
function monthsOf(list) {
var seen = {}, m = [], i, j, r;
for (i = 0; i < list.length; i++) { for (j = 0; j < list[i].rows.length; j++) { r = list[i].rows[j]; if (+r[7] !== 1 && r[12] && !seen[r[12]]) { seen[r[12]] = 1; m.push(r[12]); } } }
m.sort();
return m;
}
function hasUn(list) { var i, j; for (i = 0; i < list.length; i++) { for (j = 0; j < list[i].rows.length; j++) { if (+list[i].rows[j][7] === 1) { return true; } } } return false; }
function render() {
var list = groups(), h, i, j, g, o, inv, ord, tO = {}, tI = {}, gO = 0, gI = 0, gL = 0, gU = 0, past = 0, un = hasUn(list), W, both = SHOW === '', ns = 0;
MO = monthsOf(list);
W = 4 + (un ? 1 : 0) + MO.length + 1;
h = '<thead><tr><th></th><th class="band b-bal lb">Vendor module</th><th class="band b-ord" colspan="' + (un ? 2 : 1) + '">By order</th>' +
(MO.length ? '<th class="band b-mon" colspan="' + MO.length + '">Due month - ' + cur() + '</th>' : '') + '<th class="band b-tot">Total</th></tr><tr>' +
'<th>Supplier</th><th class="num lb">Ledger balance</th>' + (un ? '<th class="num" title="Orders not scheduled (ACT_FLAG = 1) - not spread over the months">Unscheduled</th>' : '') + '<th>Type</th>';
for (j = 0; j < MO.length; j++) { h += '<th class="num' + (MO[j] < NOW ? ' past' : '') + '"' + (MO[j] < NOW ? ' title="Due month passed"' : '') + '>' + moLbl(MO[j]) + '</th>'; }
h += '<th class="num">Total</th></tr></thead><tbody>';
for (i = 0; i < list.length; i++) {
g = list[i]; ns++;
o = g.o;
gO += o.tot; gI += g.inv.tot; gL += +g.s[2]; gU += g.un;
for (j = 0; j < MO.length; j++) { tO[MO[j]] = (tO[MO[j]] || 0) + (o.m[MO[j]] || 0); tI[MO[j]] = (tI[MO[j]] || 0) + (g.inv.m[MO[j]] || 0); if (MO[j] < NOW) { past += (o.m[MO[j]] || 0) + (g.inv.m[MO[j]] || 0); } }
h += '<tr><td class="sname lnkc" rowspan="' + (both ? 2 : 1) + '" data-s="' + g.s[0] + '" title="Open the supplier">' + esc(g.s[1]) + '<span class="brn"> ' + g.s[0] + '</span></td>' +
'<td class="num lb' + (Math.round(+g.s[2] * 100) ? '' : ' z') + '" rowspan="' + (both ? 2 : 1) + '">' + fm(+g.s[2] / RATE) + '</td>' +
(un ? cell(g.un).replace('<td class="num', '<td rowspan="' + (both ? 2 : 1) + '" class="num') : '');
if (SHOW !== 'I') {
h += '<td><span class="st ord lnkc" data-s="' + g.s[0] + '" data-k="O" title="Open the orders of this supplier">Orders</span></td>';
for (j = 0; j < MO.length; j++) { h += cell(o.m[MO[j]], MO[j] < NOW ? 'past' : ''); }
h += cell(o.tot, 'tt') + '</tr>';
}
if (SHOW !== 'O') {
h += (both ? '<tr class="inv">' : '') + '<td><span class="st inv lnkc" data-s="' + g.s[0] + '" data-k="I" title="Open the invoices of this supplier">Invoices</span></td>';
for (j = 0; j < MO.length; j++) { h += cell(g.inv.m[MO[j]], MO[j] < NOW ? 'past' : ''); }
h += cell(g.inv.tot, 'tt') + '</tr>';
}
}
if (!list.length) { h += '<tr><td colspan="' + W + '" class="z" style="text-align:center;padding:22px">No rows for this period and filter</td></tr>'; }
h += '</tbody>';
if (list.length) {
h += '<tfoot>';
if (SHOW !== 'I') {
h += '<tr><td>Orders - not received</td><td class="num lb" rowspan="' + (both ? 3 : 1) + '">' + fm(gL / RATE) + '</td>' + (un ? '<td class="num" rowspan="' + (both ? 3 : 1) + '">' + fm(gU / RATE) + '</td>' : '') + '<td></td>';
for (j = 0; j < MO.length; j++) { h += '<td class="num">' + fm((tO[MO[j]] || 0) / RATE) + '</td>'; }
h += '<td class="num">' + fm(gO / RATE) + '</td></tr>';
}
if (SHOW !== 'O') {
h += '<tr><td>Invoices - in the warehouse</td>' + (SHOW === 'I' ? '<td class="num lb">' + fm(gL / RATE) + '</td>' + (un ? '<td class="num">' + fm(gU / RATE) + '</td>' : '') : '') + '<td></td>';
for (j = 0; j < MO.length; j++) { h += '<td class="num">' + fm((tI[MO[j]] || 0) / RATE) + '</td>'; }
h += '<td class="num">' + fm(gI / RATE) + '</td></tr>';
}
if (both) {
h += '<tr class="gt"><td>Total</td><td></td>';
for (j = 0; j < MO.length; j++) { h += '<td class="num">' + fm(((tO[MO[j]] || 0) + (tI[MO[j]] || 0)) / RATE) + '</td>'; }
h += '<td class="num">' + fm((gO + gI) / RATE) + '</td></tr>';
}
h += '</tfoot>';
}
$('spTable').innerHTML = h;
$('tableNote').textContent = ns + (ns === 1 ? ' supplier' : ' suppliers') + ' - ' + cur() + (NSET && !SETTLED ? ' - ' + NSET + ' settled rows hidden' : '') + (D.asof ? ' - data as of ' + D.asof : '');
if ($('spTitle')) { $('spTitle').textContent = 'Supplier Payables - orders dated ' + dmy(D.from) + ' - ' + dmy(D.to) + ' - ' + cur() + (SHOW ? (SHOW === 'O' ? ' - orders only' : ' - invoices only') : '') + (D.asof ? ' - data as of ' + D.asof : ''); }
kpis(gO + gI, gO, gI, gL, past, ns);
paintShow();
}
function kpis(t, o, i, l, past, ns) {
$('spKpi').innerHTML =
'<div class="sp-k"><b>Total payable by order</b><strong>' + fm(t / RATE) + '</strong><i>' + ns + (ns === 1 ? ' supplier' : ' suppliers') + ' - ' + cur() + '</i></div>' +
'<div class="sp-k o"><b>Orders - not received</b><strong>' + fm(o / RATE) + '</strong><i>' + pc(o, t) + ' of total</i></div>' +
'<div class="sp-k i"><b>Invoices - in the warehouse</b><strong>' + fm(i / RATE) + '</strong><i>' + pc(i, t) + ' of total</i></div>' +
'<div class="sp-k l"><b>Ledger balance - vendor module</b><strong>' + fm(l / RATE) + '</strong><i>sum of the supplier accounts shown</i></div>' +
'<div class="sp-k d"><b>Due month passed</b><strong>' + fm(past / RATE) + '</strong><i>' + pc(past, t) + ' of total - months before ' + moLbl(NOW) + '</i></div>';
$('spKpi').style.display = D ? '' : 'none';
}
function show(l) {
LVL = l;
document.body.className = document.body.className.replace(/\s*sp-lvl\d/g, '') + (l ? ' sp-lvl' + l : '');
$('supPanel').style.display = l === 2 ? '' : 'none';
$('invPanel').style.display = l === 3 ? '' : 'none';
window.scrollTo(0, 0);
}
function crumb(parts, back, print) {
var h = '<div class="table-header-row"><div class="crumb">', i;
for (i = 0; i < parts.length; i++) {
if (i) { h += '<span class="sep">&#8250;</span>'; }
h += parts[i][1] ? '<span class="c1" data-go="' + parts[i][1] + '">' + esc(parts[i][0]) + '</span>' : '<span class="c2">' + esc(parts[i][0]) + '</span>';
}
return h + '</div><div class="lv-btns">' + curChips() + (print ? '<button type="button" class="btn-view po-print" data-go="print" title="Print or save as PDF">&#9113; Print / PDF</button>' : '') +
'<button type="button" class="back" data-go="' + back + '">&#8592; Back</button></div></div>';
}
function openSup(code, k) {
var list = groups(), i;
SUP = null; SKIND = k || '';
for (i = 0; i < list.length; i++) { if (String(list[i].s[0]) === String(code)) { SUP = list[i]; break; } }
if (!SUP) { return; }
renderSup();
show(2);
}
function renderSup() {
var g = SUP, rows = g.rows.slice(0), h, i, j, r, un = false, tm = {}, ta = 0, tp = 0, tb = 0, tu = 0, nO = 0, nI = 0, due = null, sameDue = true, mo = monthsOf([g]);
if (SKIND) { rows = rows.filter(function (x) { return (x[6] === 'I') === (SKIND === 'I'); }); }
rows.sort(function (a, b) { return a[3] < b[3] ? -1 : a[3] > b[3] ? 1 : a[2] - b[2]; });
for (i = 0; i < rows.length; i++) { r = rows[i]; if (+r[7] === 1) { un = true; } if (r[6] === 'I') { nI++; } else { nO++; } if (due === null) { due = r[11]; } else if (due !== r[11]) { sameDue = false; } }
h = crumb([['Supplier Payables', '0'], [g.s[1] + (SKIND ? ' - ' + (SKIND === 'I' ? 'invoices' : 'orders') : ''), '']], '0', true);
h += '<div class="ih"><span class="kv"><b>Supplier</b><span>' + g.s[0] + ' <i>' + esc(g.s[1]) + '</i></span></span>' +
'<span class="kv"><b>Ledger balance</b><span>' + fm(+g.s[2] / RATE) + ' <i>' + cur() + '</i></span></span>' +
(g.s[3] ? '<span class="kv"><b>Last payment</b><span>' + dmy(g.s[3]) + '</span></span>' : '') +
'<span class="kv"><b>Orders</b><span>' + fm(g.o.tot / RATE) + ' <i>' + nO + '</i></span></span><span class="kv"><b>Invoices</b><span>' + fm(g.inv.tot / RATE) + ' <i>' + nI + '</i></span></span>' +
'<span class="kv"><b>Total</b><span>' + fm((g.o.tot + g.inv.tot) / RATE) + '</span></span>' +
(sameDue && due !== null ? '<span class="kv"><b>Credit</b><span>' + due + ' <i>days after expected shipping</i></span></span>' : '') +
(D.asof ? '<span class="kv"><b>Data as of</b><span><i>' + esc(D.asof) + '</i></span></span>' : '') + '</div>' +
'<div class="sk-chips sp-kind">' + [['', 'All'], ['O', 'Orders'], ['I', 'Invoices']].map(function (x) {
return '<button type="button" class="chip ' + (x[0] === 'I' ? 'c-nopo' : x[0] === 'O' ? 'c-po' : 'c-all') + (SKIND === x[0] ? ' on' : '') + '" data-kind="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>';
var pd = false;
for (i = 0; i < rows.length; i++) { if (+rows[i][16]) { pd = true; } }
h += '<div class="table-scroll"><table id="supTable"><thead><tr><th>Doc no.</th><th>Supplier inv.</th><th>Type</th><th>Order date</th><th class="num">Amount</th>' + (pd ? '<th class="num">Paid</th><th>Last paid</th><th class="num">Balance</th>' : '') + '<th>Exp. shipping</th>';
for (j = 0; j < mo.length; j++) { h += '<th class="num' + (mo[j] < NOW ? ' past' : '') + '">' + moLbl(mo[j]) + '</th>'; }
h += (un ? '<th class="num">Unscheduled</th>' : '') + '</tr></thead><tbody>';
for (i = 0; i < rows.length; i++) {
r = rows[i];
ta += +r[15]; tp += +r[16]; tb += +r[18];
if (+r[7] === 1) { tu += +r[18]; } else { tm[r[12]] = (tm[r[12]] || 0) + (+r[18]); }
h += '<tr' + (r[6] === 'I' ? ' class="inv"' : '') + '><td class="c-code lnk" data-r="' + i + '" title="Open">' + esc(r[3]) + '</td><td class="c-code">' + esc(r[4]) + '</td><td>' + typeChip(r) + tags(r) + '</td><td class="c-code">' + dmy(r[8]) + '</td>' +
'<td class="num' + (pd ? '' : ' tot') + '">' + money(r[15]) + '</td>' + (pd ? '<td class="num">' + money(r[16]) + '</td><td class="c-code">' + (r[17] ? dmy(r[17]) : '<span class="z">&mdash;</span>') + '</td><td class="num tot">' + money(r[18]) + '</td>' : '') +
'<td class="c-code">' + dmy(r[9]) + '</td>';
for (j = 0; j < mo.length; j++) { h += '<td class="num' + (mo[j] < NOW ? ' past' : '') + '">' + (+r[7] !== 1 && r[12] === mo[j] ? fm(+r[18] / RATE) : '') + '</td>'; }
h += (un ? '<td class="num">' + (+r[7] === 1 ? fm(+r[18] / RATE) : '') + '</td>' : '') + '</tr>';
}
h += '</tbody><tfoot><tr class="tot"><td colspan="4">Total - ' + rows.length + ' rows</td><td class="num">' + fm(ta / RATE) + '</td>' + (pd ? '<td class="num">' + fm(tp / RATE) + '</td><td></td><td class="num">' + fm(tb / RATE) + '</td>' : '') + '<td></td>';
for (j = 0; j < mo.length; j++) { h += '<td class="num">' + fm((tm[mo[j]] || 0) / RATE) + '</td>'; }
h += (un ? '<td class="num">' + fm(tu / RATE) + '</td>' : '') + '</tr></tfoot></table></div>';
$('supPanel').innerHTML = h;
SUP.sorted = rows; SUP.mo = mo;
}
function openRow(r) {
if (r[6] === 'O' && r[5] === 'M' && window.poLevels) { window.poLevels.openPO(r[1], r[2]); return; }
openDetail(r[1], r[2], r[0]);
}
function openDetail(t, s, supp) {
if (busy) { return; }
busy = true;
$('invPanel').innerHTML = '<div class="dr-none">Loading...</div>';
show(3);
apex.server.process('SUPAY_INV_AJAX', { x01: 'po', x02: t, x03: s, x04: supp }, {
dataType: 'json',
success: function (d) { busy = false; if (!d || d.error || !d.ok) { $('invPanel').innerHTML = crumb([['Supplier Payables', '0'], [SUP ? SUP.s[1] : '', SUP ? 'sup' : '']], SUP ? 'sup' : '0') + '<div class="dr-none">Could not load' + (d && d.error ? ' - ' + esc(d.error) : '') + '</div>'; return; } INV = d; renderInv(d); },
error: function () { busy = false; $('invPanel').innerHTML = '<div class="dr-none">Could not load. Please try again.</div>'; }
});
}
function kv(k, v, s) { return '<div class="oh-sec"><small>' + k + '</small><div class="oh-v">' + v + '</div>' + (s ? '<div class="oh-s">' + s + '</div>' : '') + '</div>'; }
function renderInv(d) {
var h = d.h, L = d.lines, E = d.exp || [], inv = d.src === 'rcv', out, i, r, x, tq = 0, tb = 0, tv = 0, te = 0, post, hasB = false, rk, rcvs = {}, nr = 0;
out = crumb([['Supplier Payables', '0'], [SUP ? SUP.s[1] : h[5], SUP ? 'sup' : ''], [(inv ? 'Invoice ' : 'Order ') + h[2], '']], SUP ? 'sup' : '0', true);
post = +h[23] ? (+h[24] === +h[23] ? '<span class="st ok">Posted</span>' : '<span class="st np">Not posted</span>') : '<span class="st req">Not received</span>';
for (i = 0; i < L.length; i++) { if (+L[i][9]) { hasB = true; } rk = L[i][10] + ':' + L[i][11]; if (inv && !rcvs[rk]) { rcvs[rk] = 1; nr++; } }
out += '<div class="oh"><div class="oh-band' + (inv ? ' inv' : '') + '"><div class="oh-b oh-b1"><small>' + (inv ? 'Purchase invoice' : 'Purchase order') + '</small><div class="oh-no">' + esc(h[2]) + '</div></div>' +
(inv ? '<div class="oh-b"><small>Invoice no.</small><div>' + (h[32] !== null ? h[32] + ' : ' + h[33] : '&mdash;') + (nr > 1 ? ' <span class="oh-since">+ ' + (nr - 1) + ' more</span>' : '') + '</div></div><div class="oh-b"><small>Order</small><div>' + h[0] + ' : ' + h[1] + '</div></div>' +
'<div class="oh-b"><small>Journal entry</small><div>' + (h[35] ? '<span class="jme-link" data-jme="' + h[35] + '">' + h[35].split('/').join(' / ') + '</span>' : '&mdash;') + '</div></div>'
: '<div class="oh-b"><small>Order no.</small><div>' + h[0] + ' : ' + h[1] + '</div></div>') +
'<div class="oh-b"><small>Order date</small><div>' + dmy(h[4]) + '</div></div>' +
'<div class="oh-b oh-bs"><small>Status</small><div>' + (h[31] === 'I' ? '<span class="st inv">Invoice - received</span>' : '<span class="st ord">Order - not received</span>') + (h[30] === 'X' ? '<span class="oh-since">expenses carried by this supplier on another supplier\'s order</span>' : '') + '</div></div>' +
(d.asof ? '<div class="oh-b oh-asof"><small>Data as of</small><div>' + esc(d.asof) + '</div></div>' : '') +
'<div class="oh-b oh-cur"><small>Currency</small><div class="oh-curv">' + cur() + '</div></div></div>' +
'<div class="oh-grid">' + kv('Supplier', esc(h[5]), '') +
kv(inv ? 'Received' : 'Expected shipping', inv ? (h[26] ? dmy(h[26]) : '&mdash;') : (h[9] ? dmy(h[9]) : '&mdash;'), '') +
kv('Due month', moLbl(h[12]) + (h[12] && h[12] < NOW ? ' <i>passed</i>' : ''), '') +
kv('Credit', (h[11] === null ? '&mdash;' : h[11] + ' <i>days</i>'), '') +
kv('Vendor module', post, '') + '</div>' +
'<div class="oh-cost sp5">' + kv('Goods', money(h[13]), 'order lines: price - discounts, + VAT') +
kv('Expenses', money(h[16]), +h[14] ? 'freight + insurance of the receipt' : (+h[15] ? 'freight estimate on the order' : 'none')) +
kv('Amount', money(h[17]), 'goods + expenses') +
kv('Paid on the order', money(h[18]), h[19] ? 'last ' + dmy(h[19]) : 'no advance payment') +
'<div class="oh-sec tot"><small>Balance</small><div class="oh-v">' + money(h[21]) + '</div><div class="oh-s">' + (+h[20] ? 'paid on the invoice ' + fm(+h[20] / RATE) + ' - open ' + fm(+h[22] / RATE) : 'amount - paid on the order') + '</div></div></div>';
out += '<div class="oh-notes"><b>Code</b> ' + h[6] + (h[3] ? ' &nbsp; <b>Supplier inv.</b> ' + esc(h[3]) : '') + (+h[23] ? ' &nbsp; <b>Receipt</b> ' + esc(h[25]) + (h[34] ? ' &nbsp; <b>Receipt inv.</b> ' + esc(h[34]) : '') : '') +
(inv ? ' &nbsp; <b>Expected shipping</b> ' + dmy(h[9]) + (h[10] ? ' &nbsp; <b>Arrival</b> ' + dmy(h[10]) : '') : (h[10] ? ' &nbsp; <b>Arrival</b> ' + dmy(h[10]) : '')) +
' &nbsp; <b>Lines</b> ' + L.length + (+h[27] !== 1 ? ' &nbsp; <b>Order currency</b> ' + h[27] + ' @ ' + h[28] : '') + '</div>';
out += '</div>';
var ex = 0, sv = 0, al, ue, ld, sp, pf;
for (i = 0; i < E.length; i++) { ex += (+E[i][11] || 0) - (+E[i][10] || 0); }
for (i = 0; i < L.length; i++) { sv += +L[i][8]; }
out += '<h4 class="oh-h4">' + (inv ? 'Invoice items - import card' : 'Order items') + '</h4>';
if (inv) {
out += '<div class="table-scroll"><table id="invLines" class="card"><thead><tr><th>#</th>' + (nr > 1 ? '<th>Invoice</th>' : '') + '<th>Code</th><th>Item</th><th>Unit</th><th class="num">Qty</th><th class="num">Price</th><th class="num">Purchase</th><th class="num">Disc.</th><th class="num">Import cost</th><th class="num">Cost / unit</th><th class="num">Landed / unit</th><th class="num">Sale price</th><th class="num">Profit / unit</th><th class="num">Profit %</th></tr></thead><tbody>';
for (i = 0; i < L.length; i++) {
r = L[i]; tq += +r[4]; tv += +r[8];
al = sv ? ex * (+r[8]) / sv : 0; te += al; ue = +r[4] ? al / (+r[4]) : 0; ld = +r[5] + ue; sp = r[12] === null || r[12] === undefined ? null : +r[12]; pf = sp === null ? null : sp - ld;
out += '<tr><td class="c-code">' + (i + 1) + '</td>' + (nr > 1 ? '<td class="c-code">' + r[10] + ' : ' + r[11] + '</td>' : '') + '<td class="c-code">' + esc(r[1]) + '</td><td class="iname">' + esc(r[2]) + '</td><td>' + esc(r[3]) + '</td><td class="num">' + fm(+r[4], 0) + '</td>' +
'<td class="num">' + fm(+r[5] / RATE, 2) + '</td><td class="num">' + money(r[8]) + '</td><td class="num">' + mz(r[6]) + '</td><td class="num">' + money(al) + '</td><td class="num">' + fm(ue / RATE, 2) + '</td><td class="num tot">' + fm(ld / RATE, 2) + '</td>' +
'<td class="num">' + (sp === null ? '<span class="z">&mdash;</span>' : fm(sp / RATE, 2)) + '</td><td class="num' + (pf !== null && pf < 0 ? ' neg' : '') + '">' + (pf === null ? '<span class="z">&mdash;</span>' : fm(pf / RATE, 2)) + '</td><td class="num' + (pf !== null && pf < 0 ? ' neg' : '') + '">' + (pf === null || !sp ? '<span class="z">&mdash;</span>' : (100 * pf / sp).toFixed(2)) + '</td></tr>';
}
if (!L.length) { out += '<tr><td colspan="' + (14 + (nr > 1 ? 1 : 0)) + '" class="z" style="text-align:center;padding:16px">No lines</td></tr>'; }
out += '</tbody><tfoot><tr class="tot"><td colspan="' + (4 + (nr > 1 ? 1 : 0)) + '">Total</td><td class="num">' + fm(tq, 0) + '</td><td></td><td class="num">' + fm(tv / RATE) + '</td><td></td><td class="num">' + fm(te / RATE) + '</td><td colspan="5"></td></tr></tfoot></table></div>';
} else {
out += '<div class="table-scroll"><table id="invLines"><thead><tr><th>#</th><th>Code</th><th>Item</th><th>Unit</th><th class="num">Qty</th><th class="num">Price</th><th class="num">Discount</th><th class="num">VAT</th><th class="num">Total</th></tr></thead><tbody>';
for (i = 0; i < L.length; i++) {
r = L[i]; tq += +r[4]; tv += +r[8];
out += '<tr><td class="c-code">' + (i + 1) + '</td><td class="c-code">' + esc(r[1]) + '</td><td class="iname">' + esc(r[2]) + '</td><td>' + esc(r[3]) + '</td><td class="num">' + fm(+r[4], 0) + '</td><td class="num">' + fm(+r[5] / RATE, 2) + '</td><td class="num">' + mz(r[6]) + '</td><td class="num">' + mz(r[7]) + '</td><td class="num">' + money(r[8]) + '</td></tr>';
}
if (!L.length) { out += '<tr><td colspan="9" class="z" style="text-align:center;padding:16px">No lines</td></tr>'; }
out += '</tbody><tfoot><tr class="tot"><td colspan="4">Total</td><td class="num">' + fm(tq, 0) + '</td><td></td><td></td><td></td><td class="num">' + fm(tv / RATE) + '</td></tr></tfoot></table></div>';
}
out += '<h4 class="oh-h4">' + (inv ? 'Expenses - on the receipt' : 'Expenses - estimate on the order') + '</h4>';
if (!E.length) { out += '<div class="dr-none">No expense rows</div>'; }
else {
out += '<div class="table-scroll"><table class="po-exp"><thead><tr><th>#</th><th>Expense supplier</th><th>Doc no.</th>' + (inv ? '<th>Inv. date</th>' : '') + '<th class="num">Freight</th><th class="num">Customs</th><th class="num">Transport</th><th class="num">Insurance</th><th class="num">Commission</th><th class="num">Other</th><th class="num">VAT</th><th class="num">Total</th></tr></thead><tbody>';
for (i = 0; i < E.length; i++) {
r = E[i];
out += '<tr><td class="c-code">' + (i + 1) + '</td><td>' + esc(r[2]) + (String(r[3]) === String(h[6]) ? '' : ' <i class="brn">other supplier</i>') + (r[16] ? ' <i class="brn">' + esc(r[16]) + '</i>' : '') + '</td><td class="c-code">' + esc(r[14] || '') + '</td>' + (inv ? '<td class="c-code">' + dmy(r[15]) + '</td>' : '') +
'<td class="num">' + mz(r[4]) + '</td><td class="num">' + mz(r[5]) + '</td><td class="num">' + mz(r[7]) + '</td><td class="num">' + mz(r[6]) + '</td><td class="num">' + mz(r[8]) + '</td><td class="num">' + mz(r[9]) + '</td><td class="num">' + mz(r[10]) + '</td><td class="num tot">' + mz(r[11]) + '</td></tr>';
}
out += '</tbody><tfoot><tr class="tot"><td colspan="' + (inv ? 4 : 3) + '">Total expenses</td>';
for (x = 4; x <= 10; x++) { out += '<td class="num">' + mz(sumCol(E, x)) + '</td>'; }
out += '<td class="num">' + fm(sumCol(E, 11) / RATE) + '</td></tr></tfoot></table></div>';
}
$('invPanel').innerHTML = out;
}
function sumCol(E, x) { var i, t = 0; for (i = 0; i < E.length; i++) { t += +E[i][x] || 0; } return t; }
function mz(v) { v = +v || 0; return Math.round(v * 100) ? fm(v / RATE) : '<span class="z">&mdash;</span>'; }
function printLevel(n) {
var t = document.title;
document.title = 'Supplier_Payables_' + (n === 1 ? $('fFrom').value + '_' + $('fTo').value : (SUP ? SUP.s[0] : ''));
document.body.className += ' sp-print sp-p' + n;
window.print();
document.body.className = document.body.className.replace(/\s*(sp-print|sp-p\d)/g, '');
setTimeout(function () { document.title = t; }, 1500);
}
function doPrint() {
var t = document.title;
if (!INV) { return; }
document.title = (INV.src === 'rcv' ? 'INV_' : 'PO_') + INV.h[2];
document.body.className += ' po-lvl3 sp-print';
window.print();
document.body.className = document.body.className.replace(/\s*(po-lvl3|sp-print)/g, '');
setTimeout(function () { document.title = t; }, 1500);
}
function excel() {
if (!D || !window.svXlsx) { return; }
if (window.poLevels && window.poLevels.open()) { window.poLevels.excel(); return; }
if (window.spExcel) { window.spExcel({ D: D, MO: MO, SUP: SUP, INV: INV, LVL: LVL, RATE: RATE, SHOW: SHOW, SETTLED: SETTLED, groups: groups, fm: fm, dmy: dmy, moLbl: moLbl, cur: cur, from: $('fFrom').value, to: $('fTo').value }); }
}
function run() {
if (busy) { return; }
busy = true; $('runBtn').disabled = true;
$('tableNote').textContent = 'Loading...';
apex.server.process('SUPAY_AJAX', { x01: 'run', x02: $('fFrom').value, x03: $('fTo').value }, {
dataType: 'json',
success: function (d) {
busy = false; $('runBtn').disabled = false;
if (!d || d.error || !d.ok) { $('tableNote').textContent = 'Could not load' + (d && d.error ? ' - ' + d.error : ''); return; }
D = d; SUP = null; INV = null;
if (d.usd) { USD = +d.usd; if (RATE !== 1) { RATE = USD; } }
$('fFrom').value = d.from; $('fTo').value = d.to;
$('periodBadge').textContent = dmy(d.from) + ' - ' + dmy(d.to);
paintQuick();
show(0);
render();
},
error: function () { busy = false; $('runBtn').disabled = false; $('tableNote').textContent = 'Could not load. Please try again.'; }
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
(QKS[i] === 'Y' ? 'Orders from 1 January to today' : 'Orders of the last ' + QKS[i] + (QKS[i] === '1' ? ' month' : ' months')) + '">' + (QKS[i] === 'Y' ? 'YTD' : QKS[i] + 'M') + '</button>';
}
$('quickChips').innerHTML = h;
}
function paintShow() {
$('showChips').innerHTML = '<button type="button" class="chip c-all' + (SHOW === '' ? ' on' : '') + '" data-s="">All</button>' +
'<button type="button" class="chip c-po' + (SHOW === 'O' ? ' on' : '') + '" data-s="O" title="Orders not received yet">Orders</button>' +
'<button type="button" class="chip c-nopo' + (SHOW === 'I' ? ' on' : '') + '" data-s="I" title="Invoices - received in the warehouse">Invoices</button>' +
'<button type="button" class="chip c-usd' + (SETTLED ? ' on' : '') + '" data-s="S" title="Rows whose balance is under 1 SAR (rounding residues) are hidden - click to show them">Settled &lt; 1<small>' + NSET + '</small></button>';
}
function paintCur() {
$('curChips').innerHTML = '<button type="button" class="chip c-all' + (RATE === 1 ? ' on' : '') + '" data-c="1">SAR</button>' +
'<button type="button" class="chip c-usd' + (RATE !== 1 ? ' on' : '') + '" data-c="U" title="SAR / ' + USD + '">USD</button>';
}
function curChips() {
return '<span class="lv-cur"><button type="button" class="chip c-all' + (RATE === 1 ? ' on' : '') + '" data-cur="1">SAR</button>' +
'<button type="button" class="chip c-usd' + (RATE !== 1 ? ' on' : '') + '" data-cur="U" title="SAR / ' + USD + '">USD</button></span>';
}
function setRate(c) { RATE = c === 'U' ? USD : 1; paintCur(); repaint(); }
function repaint() { if (!D) { return; } render(); if (SUP) { renderSup(); } if (INV) { renderInv(INV); } if (window.poLevels && window.poLevels.refresh) { window.poLevels.refresh(); } }
$('runBtn').addEventListener('click', run);
$('resetBtn').addEventListener('click', function () {
var t = new Date();
$('fFrom').value = t.getFullYear() + '-01-01'; $('fTo').value = iso(t);
$('fSup').value = ''; SHOW = ''; SETTLED = false; paintShow(); run();
});
$('quickChips').addEventListener('click', function (e) {
var q = pick(e, 'data-q');
if (!q || busy) { return; }
$('fFrom').value = quickFrom(q); $('fTo').value = iso(new Date());
paintQuick(); run();
});
$('fFrom').addEventListener('change', paintQuick);
$('fTo').addEventListener('change', paintQuick);
$('fSup').addEventListener('input', function () { if (D) { render(); } });
$('showChips').addEventListener('click', function (e) {
var s = pick(e, 'data-s');
if (s === null) { return; }
if (s === 'S') { SETTLED = !SETTLED; } else { SHOW = s; }
paintShow(); if (D) { show(0); SUP = null; render(); }
});
$('curChips').addEventListener('click', function (e) {
var c = pick(e, 'data-c');
if (c) { setRate(c); }
});
$('poPanel').addEventListener('click', function (e) {
var c = pick(e, 'data-cur');
if (c) { setRate(c); }
});
(function () {
var box = $('exportBox');
if (!box) { return; }
var pdf = function () { if (!D) { return; } if (LVL === 3) { doPrint(); } else { printLevel(LVL === 2 ? 2 : 1); } };
if (window.jmExport) { window.jmExport.attach(box, { pdf: pdf, excel: excel }); return; }
box.innerHTML = '<button type="button" class="btn-print" id="excelBtn">Export Excel</button>';
$('excelBtn').addEventListener('click', excel);
})();
$('spTable').addEventListener('click', function (e) {
var s = pick(e, 'data-s');
if (s) { openSup(s, pick(e, 'data-k') || ''); }
});
$('supPanel').addEventListener('click', function (e) {
var g = pick(e, 'data-go'), r = pick(e, 'data-r'), c = pick(e, 'data-cur'), kd = pick(e, 'data-kind');
if (c) { setRate(c); return; }
if (kd !== null && SUP) { SKIND = kd; renderSup(); return; }
if (g === 'print') { printLevel(2); return; }
if (g === '0') { SUP = null; show(0); return; }
if (r !== null && SUP) { openRow(SUP.sorted[+r]); }
});
$('invPanel').addEventListener('click', function (e) {
var g = pick(e, 'data-go'), c = pick(e, 'data-cur');
if (c) { setRate(c); return; }
if (g === 'print') { doPrint(); return; }
if (g === '0') { INV = null; SUP = null; show(0); return; }
if (g === 'sup') { INV = null; show(2); }
});
(function () { var t = new Date(); $('fFrom').value = t.getFullYear() + '-01-01'; $('fTo').value = iso(t); })();
paintShow(); paintCur();
if (window.poLevels) {
window.poLevels.init({ esc: esc, dmy: dmy }, {
root: 'Supplier Payables',
rate: function () { return RATE; },
tools: curChips,
parts: function () { return SUP ? [[SUP.s[1], 'sup']] : []; },
onGo: function (g) { if (g === 'sup' && SUP) { show(2); } else { SUP = null; show(0); } },
onFail: function (t, s) { openDetail(t, s, SUP ? SUP.s[0] : ''); }
});
}
run();
})();

});
