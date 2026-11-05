(function () {
function pad(n) { return (n < 10 ? '0' : '') + n; }
function moLbl(m) { return m ? m.substr(5, 2) + '/' + m.substr(0, 4) : ''; }
function html(d, o) {
var h = d.h, L = d.lines, E = d.exp || [], inv = d.src === 'rcv', out = '', i, r, x, tq = 0, tv = 0, te = 0, post, rk, rcvs = {}, nr = 0, RATE = o.rate || 1, esc = o.esc, dmy = o.dmy,
t = new Date(), NOW = t.getFullYear() + '-' + pad(t.getMonth() + 1), ex = 0, sv = 0, al, ue, ld, sp, pf;
function fm(v, dd) {
var neg = v < 0, a = Math.abs(v), s, q = '', k, f = '';
if (dd === undefined) { dd = 2; }
s = a.toFixed(dd);
k = s.indexOf('.');
if (k >= 0) { f = s.substr(k); s = s.substr(0, k); }
while (s.length > 3) { q = ',' + s.substr(s.length - 3) + q; s = s.substr(0, s.length - 3); }
return (neg && Math.round(a * 100) ? '-' : '') + s + q + f;
}
function money(v) { v = +v || 0; return Math.round(v * 100) ? fm(v / RATE) : '<span class="z">0.00</span>'; }
function mz(v) { v = +v || 0; return Math.round(v * 100) ? fm(v / RATE) : '<span class="z">&mdash;</span>'; }
function kv(k, v, s) { return '<div class="oh-sec"><small>' + k + '</small><div class="oh-v">' + v + '</div>' + (s ? '<div class="oh-s">' + s + '</div>' : '') + '</div>'; }
function sumCol(c) { var j, s = 0; for (j = 0; j < E.length; j++) { s += +E[j][c] || 0; } return s; }
post = +h[23] ? (+h[24] === +h[23] ? '<span class="st ok">Posted</span>' : '<span class="st np">Not posted</span>') : '<span class="st req">Not received</span>';
for (i = 0; i < L.length; i++) { rk = L[i][10] + ':' + L[i][11]; if (inv && !rcvs[rk]) { rcvs[rk] = 1; nr++; } }
out += '<div class="oh"><div class="oh-band' + (inv ? ' inv' : '') + '"><div class="oh-b oh-b1"><small>' + (inv ? 'Purchase invoice' : 'Purchase order') + '</small><div class="oh-no">' + esc(h[2]) + '</div></div>' +
(inv ? '<div class="oh-b"><small>Invoice no.</small><div>' + (h[32] !== null ? h[32] + ' : ' + h[33] : '&mdash;') + (nr > 1 ? ' <span class="oh-since">+ ' + (nr - 1) + ' more</span>' : '') + '</div></div><div class="oh-b"><small>Order</small><div>' + h[0] + ' : ' + h[1] + '</div></div>' +
'<div class="oh-b"><small>Journal entry</small><div>' + (h[35] ? '<span class="jme-link" data-jme="' + h[35] + '">' + h[35].split('/').join(' / ') + '</span>' : '&mdash;') + '</div></div>'
: '<div class="oh-b"><small>Order no.</small><div>' + h[0] + ' : ' + h[1] + '</div></div>') +
'<div class="oh-b"><small>Order date</small><div>' + dmy(h[4]) + '</div></div>' +
'<div class="oh-b oh-bs"><small>Status</small><div>' + (h[31] === 'I' ? '<span class="st inv">Invoice - received</span>' : '<span class="st ord">Order - not received</span>') + (h[30] === 'X' ? '<span class="oh-since">expenses carried by this supplier on another supplier\'s order</span>' : '') + '</div></div>' +
(d.asof ? '<div class="oh-b oh-asof"><small>Data as of</small><div>' + esc(d.asof) + '</div></div>' : '') +
'<div class="oh-b oh-cur"><small>Currency</small><div class="oh-curv">' + (o.cur || 'SAR') + '</div></div></div>' +
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
for (x = 0; x < 7; x++) { out += '<td class="num">' + mz(sumCol([4, 5, 7, 6, 8, 9, 10][x])) + '</td>'; }
out += '<td class="num">' + fm(sumCol(11) / RATE) + '</td></tr></tfoot></table></div>';
}
return out;
}
window.spInvoice = { html: html };
})();
