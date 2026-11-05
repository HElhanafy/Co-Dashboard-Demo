window.addEventListener("DOMContentLoaded",function(){
(function () {
var D = null, ARR = {}, MO = [], SHOW = '', OPEN = {}, COLL = {}, STK = {}, allClosed = false, busy = false;
var DP = '', NOSUT = false, SUT = 1001;
var NCOL = 10;
var VIEW = 'C', BR = '', LIM = 0, MINE = 1, BRC = {}, ARO = {};
var BRN = [['CEN', 'Central'], ['WST', 'West'], ['EST', 'East'], ['NTH', 'North']];
function brName(b) { var i; for (i = 0; i < BRN.length; i++) { if (BRN[i][0] === b) { return BRN[i][1]; } } return b === 'OTH' ? 'Other' : b; }
function $(id) { return document.getElementById(id); }
if (!$('poTable')) { return; }
function esc(s) { return String(s === null || s === undefined ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function fmt(v) {
var neg = v < 0, s = String(Math.round(Math.abs(v))), o = '';
while (s.length > 3) { o = ',' + s.substr(s.length - 3) + o; s = s.substr(0, s.length - 3); }
return (neg && (s + o) !== '0' ? '-' : '') + s + o;
}
function pad(n) { return (n < 10 ? '0' : '') + n; }
function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function dmy(s) { return s ? s.substr(8, 2) + '/' + s.substr(5, 2) + '/' + s.substr(0, 4) : ''; }
var NOW = iso(new Date()).substr(0, 7);
function moLbl(m) { return m.substr(5, 2) + '/' + m.substr(0, 4); }
function cell(v, cls) { return '<td class="num' + (cls ? ' ' + cls : '') + (Math.round(v) ? '' : ' z') + '">' + fmt(v) + '</td>'; }
function calc(r) {
var f = r[3] || 1, o = { code: r[0], name: r[1], unit: r[2], cls: r[4], cname: r[5] };
o.sales = r[6] / f; o.s1 = r[7] / f; o.s2 = r[8] / f; o.s3 = r[9] / f; o.so = o.sales - o.s1 - o.s2 - o.s3;
o.stock = r[10] / f; o.b1 = r[11] / f; o.b3 = r[12] / f; o.b4 = r[13] / f; o.b11 = r[14] / f; o.b2 = r[15] / f;
o.req = r[16] / f; o.cus = r[17] / f; o.tot = o.req + o.cus;
o.have = o.stock + o.tot; o.net = o.have - o.sales; o.f = f;
o.hid = r[6] === null;
o.oth = (r[18] || 0) / f;
if (o.hid) { o.sales = 0; o.so = 0; o.net = 0; }
return o;
}
var TYPES = [[1, 'Main warehouses'], [3, 'Government commitments'], [4, 'Salesmen warehouses'], [11, 'SFDA pledges'], [2, 'Damaged / expired - not counted']];
function lateQty(o) {
var a = ARR[o.code] || {}, j, q = 0;
for (j = 0; j < MO.length; j++) { if (MO[j] < NOW && a[MO[j]]) { q += a[MO[j]]; } }
return q / o.f;
}
function wide(kind, title, cols, total, groups) {
var h = '<div class="dr-box dr-' + kind + '"><h4>' + title + '</h4><div class="dr-tiles">', i, L = [], sum = 0, k = 0, gi, t;
for (i = 0; i < cols.length; i++) { if (Math.round(cols[i][1])) { L.push(cols[i]); if (!cols[i][2]) { sum += Math.abs(cols[i][1]); } } }
if (!L.length) { return '<div class="dr-box dr-' + kind + '"><h4>' + title + '</h4><div class="dr-none">Nothing to show</div></div>'; }
function tile(c) {
var w = c[2] || !sum ? 0 : Math.max(1, Math.min(100, Math.abs(c[1]) / sum * 100));
return '<div class="dr-tile' + (c[2] ? ' out' : '') + '"><b>' + esc(c[0]) + '</b><strong>' + fmt(c[1]) + '</strong>' + (w ? '<i style="width:' + w.toFixed(1) + '%"></i>' : '') + '</div>';
}
if (groups) {
for (gi = 0; gi < groups.length; gi++) {
h += '<div class="dr-grp' + (groups[gi][2] ? ' out' : '') + '"><span>' + esc(groups[gi][0]) + '</span><div>';
for (t = 0; t < groups[gi][1]; t++) { h += tile(L[k++]); }
h += '</div></div>';
}
} else {
for (i = 0; i < L.length; i++) { h += tile(L[i]); }
}
if (total) { h += (groups ? '<div class="dr-grp"><span>&nbsp;</span><div>' : '') + '<div class="dr-tile tot"><b>' + total[0] + '</b><strong>' + fmt(total[1]) + '</strong></div>' + (groups ? '</div></div>' : ''); }
return h + '</div></div>';
}
function monthsLate(m) {
var n = (+NOW.substr(0, 4) - +m.substr(0, 4)) * 12 + (+NOW.substr(5, 2) - +m.substr(5, 2));
return n + (n === 1 ? ' month late' : ' months late');
}
function drill(o, kind) {
var a = ARR[o.code] || {}, l = [], j, i, st, groups = [], c;
if (kind === 'o') {
for (j = 0; j < MO.length; j++) { if (MO[j] < NOW && a[MO[j]]) { l.push([moLbl(MO[j]) + ' - ' + monthsLate(MO[j]), a[MO[j]] / o.f]); } }
return wide('o', 'Overdue arrivals - ordered, arrival date passed, not received yet', l, ['Total overdue', lateQty(o)]);
}
if (kind === 'e') {
a = ARO[o.code] || {};
for (i = 0; i < BRN.length + 1; i++) {
c = i < BRN.length ? BRN[i][0] : 'OTH';
if (c === BR || !a[c]) { continue; }
for (j = 0; j < MO.length; j++) { if (a[c][MO[j]]) { l.push([brName(c) + ' - ' + moLbl(MO[j]) + (MO[j] < NOW ? ' - overdue' : ''), a[c][MO[j]] / o.f]); } }
}
return wide('e', 'Ordered for the other branches - where and when (ask purchasing to redirect if this branch needs it)', l, ['Total elsewhere', o.oth]);
}
if (kind === 's') {
return wide('s', 'Net sales by sector - ' + esc(o.unit), [['Medical', o.s1], ['Commercial', o.s2], ['Government', o.s3], ['Other sectors', o.so]], ['Total sales', o.sales]);
}
st = STK[o.code];
if (!st) { return '<div class="dr-box dr-b"><h4>Stock by warehouse - ' + esc(o.unit) + '</h4><div class="dr-none">' + (st === 0 ? 'Could not load the warehouses' : 'Loading the warehouses...') + '</div></div>'; }
for (i = 0; i < TYPES.length; i++) {
c = 0;
if (VIEW === 'B' && (TYPES[i][0] === 4 || TYPES[i][0] === 2)) { continue; }
for (j = 0; j < st.length; j++) { if (st[j][0] === TYPES[i][0] && (VIEW !== 'B' || st[j][3] === BR) && Math.round(st[j][2] / o.f)) { l.push([st[j][1], st[j][2] / o.f, TYPES[i][0] === 2]); c++; } }
if (c) { groups.push([TYPES[i][1], c, TYPES[i][0] === 2]); }
}
return wide('b', 'Stock by warehouse - ' + esc(o.unit) + (VIEW === 'B' ? ' - ' + brName(BR) + ' branch' : ''), l, [VIEW === 'B' ? 'Branch stock' : 'Total without damaged', o.stock], groups);
}
function loadStores(code) {
apex.server.process('POARR_AJAX', { x03: code }, {
dataType: 'json',
success: function (d) { STK[code] = d && d.ok ? d.stores : 0; if (OPEN[code] === 'b') { render(); } },
error: function () { STK[code] = 0; if (OPEN[code] === 'b') { render(); } }
});
}
function visible() {
var q = $('fItem').value.replace(/^\s+|\s+$/g, '').toUpperCase(), cl = $('fClass').value, i, o, r = { list: [], all: 0, short: 0 };
for (i = 0; i < D.length; i++) {
o = D[i];
if (cl && o.cls !== cl) { continue; }
if ((DP === 'M' && !(+o.cls < 2100)) || (DP === 'C' && !(+o.cls >= 2001)) || (NOSUT && +o.cls === SUT)) { continue; }
if (q && (o.code + ' ' + o.name).toUpperCase().split(q).length < 2) { continue; }
r.all++;
if (Math.round(o.net) < 0) { r.short++; }
if ((SHOW === 'short' && Math.round(o.net) >= 0) || (SHOW === 'po' && !Math.round(o.tot)) || (SHOW === 'nopo' && Math.round(o.tot)) || (SHOW === 'late' && !Math.round(lateQty(o))) ||
(SHOW === 'cus' && !Math.round(o.cus)) || (SHOW === 'req' && !Math.round(o.req))) { continue; }
r.list.push(o);
}
return r;
}
function excel() {
var V, now = NOW, FUT = [], late = 0, j, i, o, a, lq, head, lines = [], row, w = '<cols>', W, info, shows = { '': 'All items', short: 'Short only', po: 'With open orders', req: 'Required', cus: 'At customs', late: 'Overdue arrivals', nopo: 'No open orders' }, s, e, g;
if (!D || !window.svXlsx) { return; }
if (window.poLevels && window.poLevels.open()) { window.poLevels.excel(); return; }
V = visible();
for (j = 0; j < MO.length; j++) { if (MO[j] < now) { late = 1; } else { FUT.push(MO[j]); } }
head = ['Class', 'Code', 'Item', 'Unit', 'Net sales', 'Medical', 'Commercial', 'Government', 'Stock without damaged', 'Required', 'At customs', 'Total ordered', 'Stock + ordered', 'Surplus / shortage', 'Covers % of sales'];
if (VIEW === 'B') { head[8] = 'Branch stock (main + commitments + pledges)'; head.push('Coming elsewhere'); }
if (late) { head.push('Overdue'); }
for (j = 0; j < FUT.length; j++) { head.push(moLbl(FUT[j])); }
for (i = 0; i < V.list.length; i++) {
o = V.list[i]; a = ARR[o.code] || {};
row = [[o.cls + ' - ' + (o.cname || 'No class'), 0], [o.code, 3], [o.name, 0], [o.unit, 0], o.hid ? ['', 0] : [o.sales, 2], o.hid ? ['', 0] : [o.s1, 2], o.hid ? ['', 0] : [o.s2, 2], o.hid ? ['', 0] : [o.s3, 2], [o.stock, 2], [o.req, 2], [o.cus, 2], [o.tot, 2], [o.have, 2], o.hid ? ['', 0] : [o.net, 2],
Math.round(o.sales) > 0 ? [o.have / o.sales * 100, 2] : ['', 0]];
if (VIEW === 'B') { row.push(Math.round(o.oth) ? [o.oth, 2] : ['', 0]); }
if (late) { lq = 0; for (j = 0; j < MO.length; j++) { if (MO[j] < now && a[MO[j]]) { lq += a[MO[j]]; } } row.push(lq ? [lq / o.f, 2] : ['', 0]); }
for (j = 0; j < FUT.length; j++) { row.push(a[FUT[j]] ? [a[FUT[j]] / o.f, 2] : ['', 0]); }
lines.push(row);
}
W = [26, 16, 52, 8];
for (j = 4; j < head.length; j++) { W.push(14); }
for (j = 0; j < W.length; j++) { w += '<col min="' + (j + 1) + '" max="' + (j + 1) + '" width="' + W[j] + '" customWidth="1"/>'; }
s = $('jmHdrGroup'); e = document.querySelector('.jm-hdr-grp');
g = s && s.selectedIndex >= 0 ? s.options[s.selectedIndex].text : (e ? e.textContent : '');
g = (g || '').replace(/^\s+|\s+$/g, '');
info = 'PO Arrivals - ' + (VIEW === 'B' ? brName(BR) + ' branch' : 'company') + ' - sales period ' + dmy($('fFrom').value) + ' - ' + dmy($('fTo').value) + ' - ' + shows[SHOW] + (DP ? (DP === 'M' ? ' - medical items' : ' - commercial items') : '') + (NOSUT ? ' - sutures hidden' : '') + ($('fClass').value ? ' - class ' + $('fClass').value : '') + ' - quantities in the default unit' + (g ? ' - Data group: ' + g : '');
window.svXlsx.save(info, head, lines, w + '</cols>', 'PO_Arrivals_' + (VIEW === 'B' ? BR + '_' : '') + $('fFrom').value + '_' + $('fTo').value + '.xlsx', 'PO Arrivals');
}
function render() {
var q = $('fItem').value.replace(/^\s+|\s+$/g, '').toUpperCase(), cl = $('fClass').value, now = NOW,
h, i, j, o, lastCls = null, n = 0, all = 0, short = 0, a, body = '', FUT = [], late = [], lq, W, V, CNT = {};
if (!D) { return; }
for (j = 0; j < MO.length; j++) { if (MO[j] < now) { late.push(moLbl(MO[j])); } else { FUT.push(MO[j]); } }
var B = VIEW === 'B', X = B ? 1 : 0;
W = NCOL + X + (late.length ? 1 : 0) + FUT.length;
h = '<thead><tr><th rowspan="2">Code</th><th rowspan="2">Item</th><th rowspan="2">Unit</th>' +
'<th class="band b-sal">' + (B ? 'Branch sales' : 'Period sales') + '</th><th class="band b-stk">' + (B ? 'Branch stock' : 'Stock') + '</th><th class="band b-po" colspan="3">' + (B ? 'Coming to this branch' : 'Purchase orders') + '</th><th class="band b-net" colspan="2">' + (B ? 'Branch position' : 'Position') + '</th>' + (B ? '<th class="band b-oth">Other branches</th>' : '') +
(W > NCOL + X ? '<th class="band b-arr" colspan="' + (W - NCOL - X) + '">' + (B ? 'Arrival month - this branch' : 'Arrival month') + '</th>' : '') + '</tr>' +
'<tr><th class="num">Net sales</th><th class="num">' + (B ? 'Main + commitments + pledges' : 'Without damaged') + '</th><th class="num">Required</th><th class="num">At customs</th><th class="num">' + (B ? 'Total' : 'Total ordered') + '</th>' +
'<th class="num">' + (B ? 'Stock + coming' : 'Stock + ordered') + '</th><th class="num" title="Stock + ordered - period sales">Surplus / shortage</th>' + (B ? '<th class="num" title="Ordered for the other branches - click a figure to see where and when">Coming elsewhere</th>' : '');
if (late.length) { h += '<th class="num late" title="Arrival date already passed and not received: ' + late.join(', ') + '">Overdue</th>'; }
for (j = 0; j < FUT.length; j++) { h += '<th class="num">' + moLbl(FUT[j]) + '</th>'; }
h += '</tr></thead><tbody>';
V = visible();
all = V.all; short = V.short; n = V.list.length;
for (i = 0; i < n; i++) { o = V.list[i]; if (!CNT[o.cls]) { CNT[o.cls] = [0, 0]; } CNT[o.cls][0]++; if (Math.round(o.net) < 0) { CNT[o.cls][1]++; } }
for (i = 0; i < n; i++) {
o = V.list[i];
if (o.cls !== lastCls) {
body += '<tr class="cls" data-g="' + esc(o.cls) + '" title="Click to collapse or expand the class"><td colspan="' + W + '">' + (COLL[o.cls] ? '&#9656; ' : '&#9662; ') + '<bdi>' + esc(o.cls) + '</bdi> - <bdi>' + esc(o.cname || 'No class') + '</bdi>' +
'<span class="cls-n">' + fmt(CNT[o.cls][0]) + (CNT[o.cls][0] === 1 ? ' item' : ' items') + (CNT[o.cls][1] ? ' - ' + fmt(CNT[o.cls][1]) + ' short' : '') + '</span></td></tr>';
lastCls = o.cls;
}
if (COLL[o.cls]) { continue; }
body += '<tr><td class="c-code lnkc" data-i="' + esc(o.code) + '" title="Open the purchase orders of the item">' + esc(o.code) + '</td><td class="c-name">' + esc(o.name) + '</td><td>' + esc(o.unit) + '</td>' +
(o.hid ? '<td class="hid" title="Sales of a branch that is not yours">hidden</td>' : '<td class="num lnkc' + (OPEN[o.code] === 's' ? ' on' : '') + '" data-k="s" data-c="' + esc(o.code) + '">' + fmt(o.sales) + '</td>') +
'<td class="num lnkc' + (OPEN[o.code] === 'b' ? ' on' : '') + '" data-k="b" data-c="' + esc(o.code) + '">' + fmt(o.stock) + '</td>' +
cell(o.req) + cell(o.cus) + cell(o.tot) + '<td class="num">' + fmt(o.have) + '</td>' +
(o.hid ? '<td class="hid">hidden</td>' : '<td class="num net ' + (Math.round(o.net) < 0 ? 'neg' : 'pos') + '">' + fmt(o.net) + (Math.round(o.sales) > 0 ? '<small>covers ' + fmt(o.have / o.sales * 100) + '% of sales</small>' : '') + '</td>') +
(B ? (Math.round(o.oth) ? '<td class="num oth lnkc' + (OPEN[o.code] === 'e' ? ' on' : '') + '" data-k="e" data-c="' + esc(o.code) + '">' + fmt(o.oth) + '</td>' : '<td class="num oth z">0</td>') : '');
a = ARR[o.code] || {};
if (late.length) {
lq = 0;
for (j = 0; j < MO.length; j++) { if (MO[j] < now && a[MO[j]]) { lq += a[MO[j]]; } }
body += lq ? '<td class="num arr late lnkc' + (OPEN[o.code] === 'o' ? ' on' : '') + '" data-k="o" data-c="' + esc(o.code) + '">' + fmt(lq / o.f) + '</td>' : '<td></td>';
}
for (j = 0; j < FUT.length; j++) { body += a[FUT[j]] ? '<td class="num arr' + (FUT[j] === now ? ' now' : '') + '">' + fmt(a[FUT[j]] / o.f) + '</td>' : '<td></td>'; }
body += '</tr>';
if (OPEN[o.code]) { body += '<tr class="dr"><td colspan="' + W + '">' + drill(o, OPEN[o.code]) + '</td></tr>'; }
}
if (!n) { body = '<tr><td colspan="' + W + '" class="z" style="text-align:center;padding:22px">No items for this selection</td></tr>'; }
$('poTable').innerHTML = h + body + '</tbody>';
$('tableNote').textContent = n + (n === 1 ? ' item' : ' items');
$('poKpi').innerHTML = '<div class="po-k r"><b>Items short</b><strong>' + fmt(short) + '</strong><i>of ' + fmt(all) + (all ? ' (' + fmt(short / all * 100) + '%)' : '') + ' - stock + ordered below the sales of the period</i></div>';
$('poKpi').style.display = B && !MINE ? 'none' : '';
var chips = [['', 'All items'], ['short', 'Short only'], ['po', 'With open orders'], ['req', 'Required'], ['cus', 'At customs'], ['late', 'Overdue arrivals'], ['nopo', 'No open orders']], c = '';
for (i = 0; i < chips.length; i++) { c += '<button type="button" class="chip c-' + (chips[i][0] || 'all') + (SHOW === chips[i][0] ? ' on' : '') + '" data-s="' + chips[i][0] + '">' + chips[i][1] + '</button>'; }
$('showChips').innerHTML = c;
$('dpChips').innerHTML = '<button type="button" class="chip c-all' + (DP === 'M' ? ' on' : '') + '" data-d="M" title="Classes below 2100">Medical</button>' +
'<button type="button" class="chip c-po' + (DP === 'C' ? ' on' : '') + '" data-d="C" title="Classes from 2001">Commercial</button>' +
'<button type="button" class="chip c-short' + (NOSUT ? ' on' : '') + '" data-d="S" title="Hide or show the surgical sutures (class 1001)">' + (NOSUT ? 'Sutures hidden' : 'Hide sutures') + '</button>';
}
function fillClasses() {
var seen = {}, h = '<option value="">All classes</option>', m = '<div class="ss-option" data-v="">All classes</div>', i, cur = $('fClass').value;
for (i = 0; i < D.length; i++) {
if (!seen[D[i].cls]) {
seen[D[i].cls] = 1;
h += '<option value="' + esc(D[i].cls) + '">' + esc(D[i].cls) + ' - ' + esc(D[i].cname || 'No class') + '</option>';
m += '<div class="ss-option" data-v="' + esc(D[i].cls) + '"><span class="ss-code">' + esc(D[i].cls) + '</span>' + esc(D[i].cname || 'No class') + '</div>';
}
}
$('fClass').innerHTML = h;
$('fClassList').innerHTML = m;
setClass(seen[cur] ? cur : '');
}
function setClass(v) {
var s = $('fClass'), o;
s.value = v;
o = s.options[s.selectedIndex];
$('fClassLbl').textContent = o ? o.text : 'All classes';
$('fClassBtn').className = 'cls-btn' + (v ? ' picked' : '');
}
function classMenu(open) {
$('fClassMenu').className = 'ss-menu' + (open ? ' open' : '');
if (open) { $('fClassQ').value = ''; filterClasses(); $('fClassQ').focus(); }
}
function filterClasses() {
var q = $('fClassQ').value.toUpperCase(), L = $('fClassList').children, i;
for (i = 0; i < L.length; i++) { L[i].style.display = !q || L[i].textContent.toUpperCase().split(q).length > 1 ? '' : 'none'; }
}
$('fClassBtn').addEventListener('click', function () { classMenu($('fClassMenu').className.split('open').length < 2); });
$('fClassQ').addEventListener('input', filterClasses);
$('fClassList').addEventListener('click', function (e) {
var t = e.target;
while (t && t !== this && !(t.getAttribute && t.getAttribute('data-v') !== null)) { t = t.parentNode; }
if (!t || t === this) { return; }
setClass(t.getAttribute('data-v')); classMenu(false); render();
});
document.addEventListener('click', function (e) { var t = e.target; while (t && t !== $('clsPick')) { t = t.parentNode; } if (!t) { classMenu(false); } });
function run() {
if (busy) { return; }
busy = true;
$('runBtn').disabled = true;
$('tableNote').textContent = 'Loading...';
apex.server.process('POARR_AJAX', { x01: $('fFrom').value, x02: $('fTo').value, x04: VIEW === 'B' ? BR : '' }, {
dataType: 'json',
success: function (d) {
var i, a, seen = {};
busy = false; $('runBtn').disabled = false;
if (!d || d.error || !d.ok) { $('tableNote').textContent = 'Could not load' + (d && d.error ? ' - ' + d.error : ''); return; }
D = []; ARR = {}; ARO = {}; MO = []; OPEN = {}; STK = {};
LIM = d.lim || 0; MINE = d.mine === 0 ? 0 : 1; BRC = d.brc || {};
if (d.br) { VIEW = 'B'; BR = d.br; }
for (i = 0; i < d.rows.length; i++) { D.push(calc(d.rows[i])); }
for (i = 0; d.arb && i < d.arb.length; i++) {
a = d.arb[i];
if (!seen[a[2]]) { seen[a[2]] = 1; MO.push(a[2]); }
if (a[1] === BR) { if (!ARR[a[0]]) { ARR[a[0]] = {}; } ARR[a[0]][a[2]] = (ARR[a[0]][a[2]] || 0) + a[3]; continue; }
if (!ARO[a[0]]) { ARO[a[0]] = {}; }
if (!ARO[a[0]][a[1]]) { ARO[a[0]][a[1]] = {}; }
ARO[a[0]][a[1]][a[2]] = (ARO[a[0]][a[1]][a[2]] || 0) + a[3];
}
for (i = 0; d.arr && i < d.arr.length; i++) {
a = d.arr[i];
if (!ARR[a[0]]) { ARR[a[0]] = {}; }
ARR[a[0]][a[1]] = (ARR[a[0]][a[1]] || 0) + a[2];
if (!seen[a[1]]) { seen[a[1]] = 1; MO.push(a[1]); }
}
MO.sort();
$('fFrom').value = d.from; $('fTo').value = d.to;
$('periodBadge').textContent = dmy(d.from) + ' - ' + dmy(d.to);
paintQuick();
paintView();
fillClasses();
render();
},
error: function () { busy = false; $('runBtn').disabled = false; $('tableNote').textContent = 'Could not load. Please try again.'; }
});
}
$('runBtn').addEventListener('click', run);
$('resetBtn').addEventListener('click', function () {
var t = new Date();
$('fFrom').value = t.getFullYear() + '-01-01'; $('fTo').value = iso(t);
$('fItem').value = ''; setClass(''); SHOW = ''; DP = ''; NOSUT = false; run();
});
$('dpChips').addEventListener('click', function (e) {
var t = e.target, d;
while (t && t !== this && !(t.getAttribute && t.getAttribute('data-d'))) { t = t.parentNode; }
if (!t || t === this) { return; }
d = t.getAttribute('data-d');
if (d === 'S') { NOSUT = !NOSUT; } else { DP = DP === d ? '' : d; }
render();
});
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
(QKS[i] === 'Y' ? 'From 1 January to today' : 'The last ' + QKS[i] + (QKS[i] === '1' ? ' month' : ' months') + ' to today') + '">' + (QKS[i] === 'Y' ? 'YTD' : QKS[i] + 'M') + '</button>';
}
$('quickChips').innerHTML = h;
}
$('quickChips').addEventListener('click', function (e) {
var t = e.target;
while (t && t !== this && !(t.getAttribute && t.getAttribute('data-q'))) { t = t.parentNode; }
if (!t || t === this || busy) { return; }
$('fFrom').value = quickFrom(t.getAttribute('data-q')); $('fTo').value = iso(new Date());
paintQuick(); run();
});
$('fFrom').addEventListener('change', paintQuick);
$('fTo').addEventListener('change', paintQuick);
function paintView() {
var h = '', i;
$('viewSeg').innerHTML = (LIM ? '' : '<button type="button" data-v="C"' + (VIEW === 'C' ? ' class="on"' : '') + '>Company</button>') + '<button type="button" data-v="B"' + (VIEW === 'B' ? ' class="on"' : '') + '>Branch</button>';
for (i = 0; i < BRN.length; i++) { h += '<button type="button" class="chip c-all' + (BR === BRN[i][0] ? ' on' : '') + '" data-b="' + BRN[i][0] + '" title="Orders going to the ' + BRN[i][1] + ' warehouses">' + BRN[i][1] + '<small>' + fmt(BRC[BRN[i][0]] || 0) + '</small></button>'; }
$('brChips').innerHTML = h;
$('brGroup').style.display = VIEW === 'B' ? '' : 'none';
$('tableTitle').textContent = VIEW === 'B' ? 'Shipments going to ' + brName(BR) + ' - branch sales, branch stock, arrival months' : 'Ordered shipments and arrival months';
}
function pick(e, attr) {
var t = e.target;
while (t && t !== e.currentTarget && !(t.getAttribute && t.getAttribute(attr))) { t = t.parentNode; }
return t && t !== e.currentTarget ? t.getAttribute(attr) : null;
}
$('viewSeg').addEventListener('click', function (e) {
var v = pick(e, 'data-v');
if (!v || v === VIEW || busy) { return; }
VIEW = v; if (v === 'B' && !BR) { BR = 'CEN'; }
paintView(); run();
});
$('brChips').addEventListener('click', function (e) {
var b = pick(e, 'data-b');
if (!b || b === BR || busy) { return; }
BR = b; paintView(); run();
});
function runPrint(tableOnly) {
if (!D) { alert('The report is still loading.'); return; }
var d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; }, orig = document.title;
$('poPrinted').textContent = 'Sales ' + $('fFrom').value + ' to ' + $('fTo').value + ' | Printed ' + p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
document.title = 'PO_Arrivals_' + (tableOnly ? 'Table_' : 'Dashboard_') + $('fTo').value;
if (tableOnly) { document.body.classList.add('print-mode-table'); }
var back = function () { document.title = orig; document.body.classList.remove('print-mode-table'); window.removeEventListener('afterprint', back); };
window.addEventListener('afterprint', back);
window.print();
}
(function () {
var box = $('exportBox');
if (!box) { return; }
if (window.jmExport) { window.jmExport.attach(box, { pdf: function () { runPrint(true); }, excel: excel }); return; }
box.innerHTML = '<button type="button" class="btn-print" id="excelBtn">Export Excel</button>';
$('excelBtn').addEventListener('click', excel);
})();
$('toggleAllBtn').addEventListener('click', function () {
var i;
allClosed = !allClosed; COLL = {};
if (allClosed && D) { for (i = 0; i < D.length; i++) { COLL[D[i].cls] = true; } }
this.textContent = allClosed ? 'Expand all' : 'Collapse all';
render();
});
$('fItem').addEventListener('input', render);
$('showChips').addEventListener('click', function (e) {
var t = e.target;
while (t && t !== this && !(t.getAttribute && t.getAttribute('data-s') !== null)) { t = t.parentNode; }
if (t && t !== this) { SHOW = t.getAttribute('data-s'); render(); }
});
$('poTable').addEventListener('click', function (e) {
var t = e.target, k, c;
while (t && t !== this && !(t.getAttribute && (t.getAttribute('data-k') || t.getAttribute('data-i') || t.getAttribute('data-g') !== null))) { t = t.parentNode; }
if (!t || t === this) { return; }
if (t.getAttribute('data-i')) { if (window.poLevels) { window.poLevels.openItem(t.getAttribute('data-i')); } return; }
if (t.getAttribute('data-g') !== null) { c = t.getAttribute('data-g'); COLL[c] = !COLL[c]; render(); return; }
k = t.getAttribute('data-k'); c = t.getAttribute('data-c');
k = OPEN[c] === k ? null : k;
OPEN = {};
OPEN[c] = k;
if (OPEN[c] === 'b' && STK[c] === undefined) { loadStores(c); }
render();
});
(function () { var t = new Date(); $('fFrom').value = t.getFullYear() + '-01-01'; $('fTo').value = iso(t); })();
if (window.poLevels) { window.poLevels.init({ esc: esc, dmy: dmy }); }
run();
})();

});
