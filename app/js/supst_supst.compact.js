window.addEventListener("DOMContentLoaded",function(){
(function () {
var RATE = 1, USD = 3.75, D = null, ST = null, PAY = null, INV = null, GLE = null, LVL = 0, SHOW = '', KF = '', busy = false, CUSTOMS = '399999999999', DOT = ' ' + String.fromCharCode(183) + ' ';
var KIND = { INV: 'Invoice', EXP: 'Expense', PAY: 'Payment', RET: 'Return', ADJ: 'Adjustment', OTH: 'Other' };
var HEADS = ['Freight', 'Customs', 'Transport', 'Insurance', 'Commission', 'Others', 'VAT'];
var TYPES = { 100: 'Purchase - vendor module', 101: 'Purchase - purchasing system', 102: 'Credit adjustment', 103: 'Purchase - facilities', 105: 'Fixed assets', 106: 'FX difference adjustment', 107: 'Service purchase',
200: 'Purchase return', 201: 'Purchase return - vendor module', 202: 'Debit movement (tax)', 203: 'Debit adjustment', 204: 'Supplier discount note', 205: 'Registration expenses adjustment',
206: 'Supplier / customer settlement', 207: 'Service intermediary settlement', 300: 'Payment - bank transfer', 301: 'Payment - cheque', 901: 'Opening balance - credit', 902: 'Opening balance - debit' };
function $(id) { return document.getElementById(id); }
if (!$('stTable')) { return; }
function esc(s) { return String(s === null || s === undefined ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function pad(n) { return (n < 10 ? '0' : '') + n; }
function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function dmy(s) { return s ? s.substr(8, 2) + '/' + s.substr(5, 2) + '/' + s.substr(0, 4) : ''; }
function r2(x) { return Math.round(x * 100) / 100; }
function nz(v) { return Math.round((+v || 0) * 100) !== 0; }
function fm(v) {
v = v / RATE;
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
function has(v) { return v !== null && v !== undefined; }
function errObj(x) { var t = x && x.responseText ? String(x.responseText).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').substr(0, 300) : ''; return t ? { error: t } : null; }
function kpi(k, l, v, s, neg) { return '<div class="kpi ' + k + '"><div class="label">' + l + '</div><div class="value' + (neg ? ' neg' : '') + '">' + v + '</div><div class="sub">' + s + '</div></div>'; }
function closeOf(s) { return r2(+s[2] + (+s[4]) - (+s[3])); }
function att(s) { return (+s[6]) + (+s[7]) + (+s[8]); }
function list() {
var q = ($('fSup').value || '').toLowerCase().replace(/^\s+|\s+$/g, ''), out = [], i, s;
if (!D) { return out; }
for (i = 0; i < D.sup.length; i++) {
s = D.sup[i];
if (SHOW === 'B' && !nz(closeOf(s))) { continue; }
if (SHOW === 'W' && !att(s)) { continue; }
if (q && String(s[1] || '').toLowerCase().indexOf(q) < 0 && String(s[0]).indexOf(q) < 0) { continue; }
out.push(s);
}
return out;
}
function attTags(s) {
return (+s[6] ? '<span class="tag wr" title="Expense entries whose document field still carries the purchase order number">' + s[6] + ' doc no. not entered</span>' : '') +
(+s[7] ? '<span class="tag np" title="In the supplier ledger, not posted to the general ledger">' + s[7] + ' not posted to GL</span>' : '') +
(+s[8] ? '<span class="tag wr" title="Goods received in the warehouse, not posted to the supplier ledger - outside the balance">' + s[8] + (+s[8] === 1 ? ' receipt' : ' receipts') + ' not in ledger</span>' : '');
}
function render() {
var L = list(), h, i, s, c, to = 0, td = 0, tc = 0, tb = 0, tw = 0, tn = 0, tp = 0, tv = 0, na = 0;
h = '<thead><tr><th>Code</th><th>Supplier</th><th class="num">Opening</th><th class="num">Debit - paid</th><th class="num">Credit - invoiced</th><th class="num">Balance</th><th>Attention</th></tr></thead><tbody>';
for (i = 0; i < L.length; i++) {
s = L[i]; c = closeOf(s);
to += +s[2]; td += +s[3]; tc += +s[4]; tb += c; tw += +s[6]; tn += +s[7]; tp += +s[8]; tv += +s[9];
h += '<tr><td class="c-code">' + s[0] + '</td><td class="sname lnkc" data-s="' + s[0] + '" title="Open the statement">' + esc(s[1] || ('Supplier ' + s[0])) + '</td>' +
cell(s[2]) + cell(s[3], 'db') + cell(s[4], 'cr') + cell(c, 'tt') + '<td>' + attTags(s) + '</td></tr>';
}
if (!L.length) { h += '<tr><td colspan="7" class="z" style="text-align:center;padding:22px">No suppliers for this period and filter</td></tr>'; }
h += '</tbody>';
if (L.length) { h += '<tfoot><tr><td colspan="2">Total - ' + L.length + (L.length === 1 ? ' supplier' : ' suppliers') + '</td><td class="num">' + fm(to) + '</td><td class="num">' + fm(td) + '</td><td class="num">' + fm(tc) + '</td><td class="num">' + fm(tb) + '</td><td></td></tr></tfoot>'; }
$('stTable').innerHTML = h;
$('tableNote').textContent = L.length + (L.length === 1 ? ' supplier' : ' suppliers') + (D.asof ? ' - data as of ' + D.asof : '');
$('stPTitle').innerHTML = '<div class="pt-h"><b>Co. Dashboard</b> | Supplier Statement</div><div class="pt-s">Period ' + dmy(D.from) + ' - ' + dmy(D.to) + ' &nbsp;|&nbsp; ' + L.length + (L.length === 1 ? ' supplier' : ' suppliers') +
(SHOW === 'B' ? ' with a balance' : SHOW === 'W' ? ' needing attention' : '') + ($('fSup').value ? ' &nbsp;|&nbsp; Filter: ' + esc($('fSup').value) : '') + (D.asof ? ' &nbsp;|&nbsp; Data as of ' + esc(D.asof) : '') + '</div>';
$('stKpi').innerHTML = '<div class="kpi-row">' +
kpi('k-op', 'Opening balance', fm(to), 'before ' + dmy(D.from), to < 0) +
kpi('k-db', 'Debit - paid', fm(td), tc ? pc(td, tc) + ' of invoiced' : 'in the period') +
kpi('k-cr', 'Credit - invoiced', fm(tc), 'in the period') +
kpi('k-bl', 'Closing balance', fm(tb), L.length + (L.length === 1 ? ' supplier' : ' suppliers') + ' - at ' + dmy(D.to), tb < 0) + '</div><div class="kpi-row k3">' +
kpi('k-w', 'Doc no. not entered', tw, 'expense entries still on the order no.') +
kpi('k-n', 'Not posted to GL', tn, 'in the ledger, not in accounts') +
kpi('k-p', 'Received, not in ledger', fm(tv), tp + (tp === 1 ? ' receipt' : ' receipts') + ', outside the balance') + '</div>';
$('stKpi').style.display = '';
for (i = 0; i < D.sup.length; i++) { if (att(D.sup[i])) { na++; } }
paintShow(na);
}
function show(l) {
LVL = l;
document.body.className = document.body.className.replace(/\s*st-lvl\d/g, '') + (l ? ' st-lvl' + l : '');
$('stmtPanel').style.display = l === 1 ? '' : 'none';
$('payPanel').style.display = l === 2 ? '' : 'none';
$('invPanel').style.display = l === 3 ? '' : 'none';
$('glPanel').style.display = l === 4 ? '' : 'none';
window.scrollTo(0, 0);
}
function crumb(parts, back) {
var h = '<div class="table-header-row"><div class="crumb">', i;
for (i = 0; i < parts.length; i++) {
if (i) { h += '<span class="sep">&#8250;</span>'; }
h += '<span class="' + (parts[i][1] ? 'c1" data-go="' + parts[i][1] : 'c2') + '" title="' + esc(parts[i][0]) + '">' + esc(parts[i][0]) + '</span>';
}
return h + '</div><div class="lv-btns">' + curChips() + '<button type="button" class="back" data-go="' + back + '">&#8592; Back</button></div></div>';
}
function box(k, v, cls) { return '<div class="sb' + (cls ? ' ' + cls : '') + '"><small>' + k + '</small><strong>' + v + '</strong></div>'; }
function stName() { return ST ? (ST.name || ('Supplier ' + ST.code)) : ''; }
var NAV = [], PANEL = { st: ['stmtPanel', 1], mv: ['payPanel', 2], inv: ['invPanel', 3], gl: ['glPanel', 4] };
function navCrumb(extra) {
var p = [['Supplier Statement', '0']], i, n = NAV.length;
for (i = 0; i < n; i++) { p.push([NAV[i].t, extra || i < n - 1 ? 'n' + i : '']); }
if (extra) { p.push([extra, '']); }
return crumb(p, extra ? (n ? 'n' + (n - 1) : '0') : (n > 1 ? 'n' + (n - 2) : '0'));
}
function draw() {
var f = NAV[NAV.length - 1];
if (!f) { ST = null; PAY = null; INV = null; GLE = null; show(0); return; }
ST = NAV[0].k === 'st' ? NAV[0].d : null;
if (f.k === 'st') { renderStmt(); } else if (f.k === 'mv') { PAY = f.d; renderPay(); } else if (f.k === 'inv') { INV = f.d; renderInv(); } else { GLE = f.d; renderGl(); }
show(PANEL[f.k][1]);
}
function goNav(g) { if (g === '0') { NAV = []; } else { NAV.length = +g.substr(1) + 1; } draw(); }
function push(k, d, t) { NAV.push({ k: k, d: d, t: t }); draw(); }
function fail(k, d) { $(PANEL[k][0]).innerHTML = navCrumb('Not loaded') + '<div class="dr-none">Could not load' + (d && d.error ? ' - ' + esc(d.error) : '. Please try again.') + '</div>'; }
function openStmt(code) {
if (busy || !D) { return; }
busy = true;
$('stmtPanel').innerHTML = '<div class="dr-none">Loading...</div>';
show(1);
apex.server.process('SUPST_AJAX', { x01: 'stmt', x02: D.from, x03: D.to, x04: code }, {
dataType: 'json',
success: function (d) { busy = false; NAV = []; if (!d || d.error || !d.ok) { fail('st', d); return; } KF = ''; push('st', d, d.name || ('Supplier ' + d.code)); },
error: function (x) { busy = false; NAV = []; fail('st', errObj(x)); }
});
}
function expDesc(r) {
var a = [], j;
for (j = 0; j < 7; j++) { if (nz(r[16 + j])) { a.push(HEADS[j] + ' ' + fm(+r[16 + j])); } }
return a.length ? a.join(DOT) : (r[6] || '');
}
function kindOf(r) { return r[1] === 'INV' && nz(r[7]) && !nz(r[8]) ? 'Debit note' : (KIND[r[1]] || r[1]); }
function docNo(k, doc, ord, t, s) { var ts = has(t) ? t + '/' + s : ''; if ((k === 'INV' || k === 'RET') && has(ord)) { return String(ord); } if (k === 'EXP' && has(doc)) { return String(doc); } return ts; }
function tgt(r) { return (r[1] === 'INV' || r[1] === 'EXP') && has(r[13]) ? 'i' : 'p'; }
function docOf(r) { return docNo(r[1], r[4], r[5], r[2], r[3]); }
function descOf(r) { var t = r[1] === 'EXP' ? expDesc(r) : (r[6] || ''); return has(r[5]) && docOf(r) !== String(r[5]) ? 'Order ' + r[5] + (t ? DOT + t : '') : t; }
function payDoc(r) { var t = docNo(r[0], r[4], r[5], r[1], r[2]); return r[0] === 'EXP' && has(r[5]) && t !== String(r[5]) ? t + ' - order ' + r[5] : t; }
function warnTxt() { return String(ST.code) === CUSTOMS ? 'order no. - not a customs declaration no.' : 'order no. - supplier doc no. not entered'; }
var KORD = ['INV', 'EXP', 'PAY', 'ADJ', 'RET', 'OTH'], KLBL = { INV: 'Invoices', EXP: 'Expenses', PAY: 'Payments', ADJ: 'Adjustments', RET: 'Returns', OTH: 'Other', W: 'Doc no. not entered', N: 'Not posted to GL' };
function keep(r) { return KF === '' || (KF === 'W' ? !!+r[10] : KF === 'N' ? !+r[9] : r[1] === KF); }
function kchip(k, n) { return '<button type="button" class="chip k-' + (k || 'ALL') + (KF === k ? ' on' : '') + '" data-k="' + k + '">' + (k ? KLBL[k] : 'All') + '<small>' + n + '</small></button>'; }
function renderStmt() {
var d = ST, R = d.rows, P = d.pend || [], h, i, r, b = +d.open, db = 0, cr = 0, nw = 0, np = 0, pv = 0, pb, name = stName(), cnt = {}, fd = 0, fc = 0, ns = 0;
for (i = 0; i < R.length; i++) { r = R[i]; db += +r[7]; cr += +r[8]; cnt[r[1]] = (cnt[r[1]] || 0) + 1; if (+r[10]) { nw++; } if (!+r[9]) { np++; } }
h = navCrumb();
h += '<div class="sbx">' + box(d.code, esc(name), 'nm') + box('Opening', fm(+d.open)) + box('Debit - paid', fm(db), 'db') + box('Credit - invoiced', fm(cr), 'cr') + box('Balance', fm(+d.open + cr - db), 'bl') + '</div>';
h += '<div class="sp-ptitle">Period ' + dmy(d.from) + ' - ' + dmy(d.to) + (d.asof ? ' - data as of ' + esc(d.asof) : '') + '</div>';
if (nw) { h += '<div class="alert wr">&#9888; ' + nw + (nw === 1 ? ' expense entry still carries' : ' expense entries still carry') + ' the purchase order number in the document field - the ' + (String(d.code) === CUSTOMS ? 'customs declaration number' : 'supplier document number') + ' was not entered.</div>'; }
if (np) { h += '<div class="alert np">' + np + (np === 1 ? ' movement is' : ' movements are') + ' in the supplier ledger but not posted to the general ledger yet.</div>'; }
h += '<div class="sk-chips st-kf">' + kchip('', R.length);
for (i = 0; i < KORD.length; i++) { if (cnt[KORD[i]]) { h += kchip(KORD[i], cnt[KORD[i]]); } }
h += (nw ? kchip('W', nw) : '') + (np ? kchip('N', np) : '') + '</div>';
if (KF) { h += '<div class="sp-ptitle on">Showing: ' + KLBL[KF] + '</div>'; }
h += '<div class="table-scroll"><table id="stmtTable"><thead><tr><th>Date</th><th>Type</th><th>Doc no.</th><th>Description</th><th class="num">Debit</th><th class="num">Credit</th><th class="num">Balance</th></tr></thead><tbody>' +
'<tr class="opn"><td class="c-code">' + dmy(d.from) + '</td><td colspan="3">Opening balance</td><td></td><td></td><td class="num' + (b < 0 ? ' neg' : '') + '">' + fm(b) + '</td></tr>';
for (i = 0; i < R.length; i++) {
r = R[i]; b += (+r[8]) - (+r[7]);
if (!keep(r)) { continue; }
ns++; fd += +r[7]; fc += +r[8];
h += '<tr><td class="c-code">' + dmy(r[0]) + '</td><td><span class="ty ' + r[1] + '">' + kindOf(r) + '</span></td>' +
'<td class="c-code lnk" data-' + tgt(r) + '="' + i + '" title="' + (tgt(r) === 'i' ? 'Open the purchase invoice' : 'Open the movement') + '">' + esc(docOf(r)) + '</td>' +
'<td class="ds">' + esc(descOf(r)) +(+r[10] ? '<span class="tag wr">&#9888; ' + warnTxt() + '</span>' : '') + (!+r[9] ? '<span class="tag np">not posted to GL</span>' : '') + '</td>' +
cell(r[7], 'db') + cell(r[8], 'cr') + '<td class="num bal' + (b < 0 ? ' neg' : '') + '">' + fm(b) + '</td></tr>';
}
if (!ns) { h += '<tr><td colspan="7" class="z" style="text-align:center;padding:16px">No movements' + (KF ? ' of this type' : '') + ' in the period</td></tr>'; }
h += '</tbody><tfoot><tr class="tot"><td colspan="4">' + (KF ? KLBL[KF] + ' - ' : 'Period total - ') + ns + (ns === 1 ? ' movement' : ' movements') + '</td><td class="num">' + fm(fd) + '</td><td class="num">' + fm(fc) + '</td><td class="num">' + (KF ? '' : fm(b)) + '</td></tr></tfoot></table></div>';
if (P.length) {
pb = b;
h += '<h4 class="oh-h4 wr">&#9888; Received, not yet in the supplier ledger - not posted to suppliers and accounts, outside the balance above</h4>' +
'<div class="table-scroll"><table id="pendTable"><thead><tr><th>Date</th><th>Receipt</th><th>Order</th><th>Receipt inv.</th><th class="num">Value</th><th class="num">Balance after</th></tr></thead><tbody>';
for (i = 0; i < P.length; i++) {
r = P[i]; pv = r2(pv + (+r[5])); pb = r2(pb + (+r[5]));
h += '<tr class="pnd"><td class="c-code">' + dmy(r[0]) + '</td><td class="c-code">' + r[1] + ' : ' + r[2] + '</td><td class="c-code">' + esc(r[3] || '') + '</td><td class="c-code">' + esc(r[4] || '') + '</td>' + cell(r[5], 'cr') + '<td class="num">' + fm(pb) + '</td></tr>';
}
h += '</tbody><tfoot><tr class="tot"><td colspan="4">Balance after posting ' + (P.length === 1 ? 'this receipt' : 'these ' + P.length + ' receipts') + '</td><td class="num">' + fm(pv) + '</td><td class="num">' + fm(pb) + '</td></tr></tfoot></table></div>';
}
$('stmtPanel').innerHTML = h;
ST.db = db; ST.cr = cr; ST.close = b;
}
function openPay(id, ser) {
if (busy) { return; }
busy = true;
$('payPanel').innerHTML = '<div class="dr-none">Loading...</div>';
show(2);
apex.server.process('SUPST_AJAX', { x01: 'pay', x02: id, x03: ser }, {
dataType: 'json',
success: function (d) { busy = false; if (!d || d.error || !d.ok || !d.h) { fail('mv', d); return; } push('mv', d, (d.h[10] === 'PAY' ? 'Payment ' : 'Movement ') + d.h[2] + '/' + d.h[3]); },
error: function (x) { busy = false; fail('mv', errObj(x)); }
});
}
function typeOf(id, kind) { return TYPES[+id] || KIND[kind] || 'Movement'; }
function renderPay() {
var d = PAY, I = [], i;
for (i = 0; i < (d.inv || []).length; i++) { if (has(d.inv[i][1]) || nz(d.inv[i][7])) { I.push(d.inv[i]); } }
d.inv = I;
$('payPanel').innerHTML = navCrumb() +
(window.stMov ? window.stMov.html(d, { esc: esc, dmy: dmy, fm: fm, cell: cell, pc: pc, nz: nz, has: has, r2: r2, KIND: KIND, typeOf: typeOf, payDoc: payDoc }) : '<div class="dr-none">Movement drawing not loaded</div>');
}
function renderGl() { $('glPanel').innerHTML = navCrumb() + window.jmEntry.html(GLE, { esc: esc, dmy: dmy }); }
function openInv(t, s, supp) {
if (busy) { return; }
busy = true;
$('invPanel').innerHTML = '<div class="dr-none">Loading...</div>';
show(3);
apex.server.process('SUPAY_INV_AJAX', { x01: 'po', x02: t, x03: s, x04: supp }, {
dataType: 'json',
success: function (d) { busy = false; if (!d || d.error || !d.ok || !window.spInvoice) { fail('inv', d && d.error ? d : { error: window.spInvoice ? 'no data' : 'invoice drawing not loaded' }); return; } push('inv', d, (d.src === 'rcv' ? 'Invoice ' : 'Order ') + d.h[2]); },
error: function (x) { busy = false; fail('inv', errObj(x)); }
});
}
function renderInv() { $('invPanel').innerHTML = navCrumb() + window.spInvoice.html(INV, { esc: esc, dmy: dmy, rate: RATE, cur: RATE === 1 ? 'SAR' : 'USD' }); }
function doPrint() {
var t = document.title;
if (!D) { return; }
document.title = LVL === 4 && GLE ? 'Entry_' + GLE.y + '_' + GLE.t + '_' + GLE.n : LVL === 3 && INV ? (INV.src === 'rcv' ? 'INV_' : 'PO_') + INV.h[2] : LVL === 2 && PAY ? 'Movement_' + PAY.h[2] + '_' + PAY.h[3] : LVL === 1 && ST ? 'Supplier_Statement_' + ST.code + '_' + ST.from + '_' + ST.to : 'Supplier_Statement_' + D.from + '_' + D.to;
document.body.className += ' st-print';
window.print();
document.body.className = document.body.className.replace(/\s*st-print/g, '');
setTimeout(function () { document.title = t; }, 1500);
}
function cols(W, n) { var w = '<cols>', j; for (j = 0; j < n; j++) { w += '<col min="' + (j + 1) + '" max="' + (j + 1) + '" width="' + (W[j] || 14) + '" customWidth="1"/>'; } return w + '</cols>'; }
function excel() {
var head, lines = [], i, r, b, L, H;
if (!D || !window.svXlsx) { return; }
if (LVL === 3 && INV) {
H = INV.h;
head = ['#', 'Code', 'Item', 'Unit', 'Quantity', 'Bonus', 'Price', 'Discount', 'VAT', 'Total', 'Sale price'];
for (i = 0; i < INV.lines.length; i++) { r = INV.lines[i]; lines.push([[i + 1, 2], [r[1], 3], [r[2], 0], [r[3], 0], [+r[4], 2], [+r[9] || 0, 2], [+r[5], 5], [+r[6], 5], [+r[7], 5], [+r[8], 5], [has(r[12]) ? +r[12] : '', 5]]); }
xsave((INV.src === 'rcv' ? 'Purchase invoice ' : 'Purchase order ') + H[2] + ' - ' + H[5] + ' - ordered ' + dmy(H[4]) + ' - goods ' + fm(+H[13]) + ' - expenses ' + fm(+H[16]) + ' - balance ' + fm(+H[21]) + ' ' + (RATE === 1 ? 'SAR' : 'USD') + (INV.asof ? ' - data as of ' + INV.asof : ''),
head, lines, cols([5, 16, 52, 8, 12, 8, 12, 12, 10, 14, 12], head.length), (INV.src === 'rcv' ? 'INV_' : 'PO_') + H[2] + '.xlsx', INV.src === 'rcv' ? 'Invoice' : 'Order');
return;
}
if (LVL === 2 && PAY) {
H = PAY.h;
head = ['Section', 'Type', 'Doc no.', 'Date', 'Value', 'Settled'];
for (i = 0; i < (PAY.lines || []).length; i++) { r = PAY.lines[i]; lines.push([['Invoice entered in the movement', 0], ['', 0], [r[2] || r[1] || '', 3], [dmy(r[3]), 0], [+r[8], 5], [+r[8] - (+r[9]), 5]]); }
for (i = 0; i < PAY.inv.length; i++) { r = PAY.inv[i]; lines.push([['Settled by this movement', 0], [KIND[r[0]] || '', 0], [payDoc(r), 3], [dmy(r[3]), 0], [+r[6], 5], [+r[7], 5]]); }
for (i = 0; i < PAY.po.length; i++) { r = PAY.po[i]; lines.push([['Order paid in advance', 0], [r[4] || '', 0], [r[0] || '', 3], ['', 0], ['', 0], [+r[5], 5]]); }
for (i = 0; i < (PAY.by || []).length; i++) { r = PAY.by[i]; lines.push([['Settled by', 0], [typeOf(r[0], r[4]), 0], [r[0] + '/' + r[1], 3], [dmy(r[2]), 0], ['', 0], [+r[3], 5]]); }
xsave(typeOf(H[2], H[10]) + ' ' + H[2] + '/' + H[3] + ' - ' + (H[1] || H[0]) + ' - ' + dmy(H[4]) + ' - amount ' + fm(Math.abs(+H[5])) + (H[8] ? ' - GL entry ' + H[8] : '') + (PAY.asof ? ' - data as of ' + PAY.asof : ''),
head, lines, cols([24, 26, 22, 12, 14, 14], head.length), 'Movement_' + H[2] + '_' + H[3] + '.xlsx', 'Movement');
return;
}
if (LVL === 1 && ST) {
head = ['Date', 'Type', 'Doc no.', 'Description', 'Debit', 'Credit', 'Balance', 'Note'];
b = +ST.open;
lines.push([[dmy(ST.from), 0], ['Opening balance', 0], ['', 0], ['', 0], ['', 0], ['', 0], [b, 5], ['', 0]]);
for (i = 0; i < ST.rows.length; i++) {
r = ST.rows[i]; b += (+r[8]) - (+r[7]);
if (!keep(r)) { continue; }
lines.push([[dmy(r[0]), 0], [kindOf(r), 0], [docOf(r), 3], [descOf(r), 0], [+r[7], 5], [+r[8], 5], [r2(b), 5], [(+r[10] ? warnTxt() : '') + (+r[10] && !+r[9] ? ' - ' : '') + (!+r[9] ? 'not posted to GL' : ''), 0]]);
}
for (i = 0; i < (ST.pend || []).length; i++) { r = ST.pend[i]; b += +r[5]; lines.push([[dmy(r[0]), 0], ['Receipt not in ledger', 0], [r[1] + ' : ' + r[2], 3], [has(r[3]) ? 'Order ' + r[3] : '', 0], ['', 0], [+r[5], 5], [r2(b), 5], ['outside the ledger balance', 0]]); }
xsave('Supplier Statement - ' + (ST.name || '') + ' (' + ST.code + ') - ' + dmy(ST.from) + ' - ' + dmy(ST.to) + ' - opening ' + fm(+ST.open) + ' - debit ' + fm(ST.db) + ' - credit ' + fm(ST.cr) + ' - balance ' + fm(ST.close) + (KF ? ' - showing ' + KLBL[KF] + ' only' : '') + (ST.asof ? ' - data as of ' + ST.asof : ''),
head, lines, cols([12, 12, 18, 66, 14, 14, 15, 36], head.length), 'Supplier_Statement_' + ST.code + '.xlsx', 'Statement');
return;
}
L = list();
head = ['Code', 'Supplier', 'Opening', 'Debit - paid', 'Credit - invoiced', 'Balance', 'Movements', 'Doc no. not entered', 'Not posted to GL', 'Receipts not in ledger', 'Receipts value'];
for (i = 0; i < L.length; i++) { r = L[i]; lines.push([[r[0], 3], [r[1] || '', 0], [+r[2], 5], [+r[3], 5], [+r[4], 5], [closeOf(r), 5], [+r[5], 2], [+r[6], 2], [+r[7], 2], [+r[8], 2], [+r[9], 5]]); }
xsave('Supplier Statement - ' + dmy(D.from) + ' - ' + dmy(D.to) + ' - suppliers, opening, movement and balance' + (SHOW === 'B' ? ' - with balance' : SHOW === 'W' ? ' - needs attention' : '') + (D.asof ? ' - data as of ' + D.asof : ''),
head, lines, cols([16, 46, 15, 15, 16, 15, 11, 12, 12, 12, 14], head.length), 'Supplier_Statement_' + D.from + '_' + D.to + '.xlsx', 'Suppliers');
}
function run() {
if (busy) { return; }
busy = true; $('runBtn').disabled = true;
$('tableNote').textContent = 'Loading...';
apex.server.process('SUPST_AJAX', { x01: 'run', x02: $('fFrom').value, x03: $('fTo').value }, {
dataType: 'json',
success: function (d) {
busy = false; $('runBtn').disabled = false;
if (!d || d.error || !d.ok) { $('tableNote').textContent = 'Could not load' + (d && d.error ? ' - ' + d.error : ''); return; }
D = d; NAV = []; ST = null; PAY = null; INV = null; GLE = null;
$('fFrom').value = d.from; $('fTo').value = d.to;
$('periodBadge').textContent = dmy(d.from) + ' - ' + dmy(d.to);
paintQuick();
show(0);
render();
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
function paintShow(na) {
$('showChips').innerHTML = '<button type="button" class="chip c-all' + (SHOW === '' ? ' on' : '') + '" data-s="">All</button>' +
'<button type="button" class="chip c-bal' + (SHOW === 'B' ? ' on' : '') + '" data-s="B" title="Suppliers whose balance is not zero">With balance</button>' +
'<button type="button" class="chip c-wr' + (SHOW === 'W' ? ' on' : '') + '" data-s="W" title="Document numbers not entered, movements not posted to GL, receipts not in the ledger">Needs attention<small>' + (na || 0) + '</small></button>';
}
function curChips() {
return '<span class="lv-cur"><button type="button" class="chip c-all' + (RATE === 1 ? ' on' : '') + '" data-cur="1">SAR</button>' +
'<button type="button" class="chip c-usd' + (RATE !== 1 ? ' on' : '') + '" data-cur="U" title="SAR / ' + USD + '">USD</button></span>';
}
function paintCur() {
$('curChips').innerHTML = '<button type="button" class="chip c-all' + (RATE === 1 ? ' on' : '') + '" data-c="1">SAR</button>' +
'<button type="button" class="chip c-usd' + (RATE !== 1 ? ' on' : '') + '" data-c="U" title="SAR / ' + USD + '">USD</button>';
}
paintCur();
function setRate(c) {
RATE = c === 'U' ? USD : 1; paintCur();
if (D) { render(); } if (ST) { renderStmt(); } if (PAY) { renderPay(); } if (INV) { renderInv(); }
if (LVL) { draw(); }
}
$('curChips').addEventListener('click', function (e) { var c = pick(e, 'data-c'); if (c) { setRate(c); } });
document.addEventListener('click', function (e) {
var t = e.target && e.target.closest ? e.target.closest('[data-cur]') : null;
if (t) { setRate(t.getAttribute('data-cur')); }
});
function xsave(info, head, lines, c, name, sheet) {
var i, j;
if (RATE !== 1 && LVL !== 4) {
for (i = 0; i < lines.length; i++) { for (j = 0; j < lines[i].length; j++) { if (lines[i][j][1] === 5 && lines[i][j][0] !== '') { lines[i][j][0] = r2(lines[i][j][0] / RATE); } } }
info += ' - USD (SAR / ' + USD + ')';
}
window.svXlsx.save(info, head, lines, c, name, sheet);
}
$('runBtn').addEventListener('click', run);
$('resetBtn').addEventListener('click', function () {
var t = new Date();
$('fFrom').value = t.getFullYear() + '-01-01'; $('fTo').value = iso(t);
$('fSup').value = ''; SHOW = ''; RATE = 1; paintCur(); run();
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
SHOW = s;
if (D) { NAV = []; draw(); render(); }
});
$('stTable').addEventListener('click', function (e) {
var s = pick(e, 'data-s');
if (s) { openStmt(s); }
});
$('stmtPanel').addEventListener('click', function (e) {
var g = pick(e, 'data-go'), p = pick(e, 'data-p'), v = pick(e, 'data-i'), k = pick(e, 'data-k'), r;
if (g !== null) { goNav(g); return; }
if (!ST) { return; }
if (k !== null) { KF = k; renderStmt(); return; }
if (p !== null) { r = ST.rows[+p]; openPay(r[2], r[3]); return; }
if (v !== null) { r = ST.rows[+v]; openInv(r[13], r[14], r[15]); }
});
$('payPanel').addEventListener('click', function (e) {
var g = pick(e, 'data-go'), m = pick(e, 'data-m'), v = pick(e, 'data-v'), n = pick(e, 'data-i'), o = pick(e, 'data-o'), r;
if (g !== null) { goNav(g); return; }
if (!PAY) { return; }
if (m !== null) { r = PAY.by[+m]; openPay(r[0], r[1]); return; }
if (n !== null) { r = PAY.inv[+n]; openInv(r[10], r[11], r[12]); return; }
if (v !== null) { r = PAY.inv[+v]; openPay(r[1], r[2]); return; }
if (o !== null) { r = PAY.po[+o]; openInv(r[1], r[2], r[3]); }
});
$('glPanel').addEventListener('click', function (e) { var g = pick(e, 'data-go'); if (g !== null) { goNav(g); } });
$('invPanel').addEventListener('click', function (e) { var g = pick(e, 'data-go'); if (g !== null) { goNav(g); } });
if (window.jmExport && $('exportBox')) { window.jmExport.attach($('exportBox'), { pdf: doPrint, excel: excel }); }
else if ($('exportBox')) {
$('exportBox').innerHTML = '<button type="button" class="btn-print btn-excel" id="xlBtn">Export Excel</button> <button type="button" class="btn-print" id="pdfBtn">Print / PDF</button>';
$('xlBtn').addEventListener('click', excel);
$('pdfBtn').addEventListener('click', doPrint);
}
(function () { var t = new Date(); $('fFrom').value = t.getFullYear() + '-01-01'; $('fTo').value = iso(t); })();
paintShow(0);
run();
})();

});
