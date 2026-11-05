window.addEventListener("DOMContentLoaded",function(){
(function () {
var D = null, PER = 'ytd', IMO = '3';
var MN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
var DN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
var BL = ['0-30', '31-60', '61-90', '91-120', '121-150', '150+'];
var BC = ['#9fe1cb', '#5dcaa5', '#fac775', '#ef9f27', '#f09595', '#e24b4a'];
var UP = '&#9650;', DOWN = '&#9660;', GO = 'Open &#8250;';
function el(id) { return document.getElementById(id); }
function num(s) { var v = parseFloat(s); return isNaN(v) ? 0 : v; }
function fmt(v, dec) {
var neg = v < 0, s = Math.abs(v).toFixed(dec || 0), p = s.split('.'), i = p[0], o = '';
while (i.length > 3) { o = ',' + i.substr(i.length - 3) + o; i = i.substr(0, i.length - 3); }
return (neg ? '-' : '') + i + o + (p.length > 1 ? '.' + p[1] : '');
}
function mil(v) { return Math.abs(v) >= 1000000 ? fmt(v / 1000000, 1) + 'M' : (Math.abs(v) >= 1000 ? fmt(v / 1000, 0) + 'K' : fmt(v, 0)); }
function pct(a, b) { return b ? a / b * 100 : 0; }
function link(alias) { return 'f?p=Co.:' + alias + ':' + (window.$v ? $v('pInstance') : ''); }
function delta(cur, prev) {
if (!prev) { return ''; }
var g = (cur - prev) / Math.abs(prev) * 100;
return '<span class="' + (g >= 0 ? 'hm-up' : 'hm-dn') + '">' + (g >= 0 ? UP : DOWN) + ' ' + fmt(Math.abs(g), 1) + '%</span>';
}
function two(n) { return (n < 10 ? '0' : '') + n; }
function key(y, m) { return y + '-' + two(m); }
function mval(k) {
var m = D.sales.m, i;
for (i = 0; i < m.length; i++) { if (m[i][0] === k) { return num(m[i][1]); } }
return null;
}
function drawDay() {
var m = D.meta, dt = new Date(m.y, m.mo - 1, m.d);
el('hm-day').innerHTML = DN[dt.getDay()] + ' ' + m.d + ' ' + MN[m.mo - 1] + ' ' + m.y + ' - day ' + m.d + ' of ' + m.dim + ' - closed months archived, current month live';
}
function perTitle() {
var m = D.meta, ly = m.mo === 1 ? m.y - 1 : m.y, lm = m.mo === 1 ? 12 : m.mo - 1;
if (PER === 'ytd') { return 'January - ' + MN[m.mo - 1] + ' ' + m.y; }
if (PER === 'mon') { return MN[m.mo - 1] + ' ' + m.y; }
return MN[lm - 1] + ' ' + ly;
}
function salesTile() {
var m = D.meta, y = m.y, mo = m.mo, big = 0, prev = 0, ttl, cmp, i, v, side;
if (PER === 'ytd') {
for (i = 1; i <= mo; i++) { big += mval(key(y, i)) || 0; prev += mval(key(y - 1, i)) || 0; }
ttl = 'January - ' + MN[mo - 1] + ' ' + y;
cmp = 'vs same months last year';
} else if (PER === 'mon') {
big = mval(key(y, mo)) || 0; prev = mval(key(y - 1, mo)) || 0;
ttl = MN[mo - 1] + ' ' + y + ' - ' + m.d + ' days so far';
cmp = 'vs full ' + MN[mo - 1] + ' ' + (y - 1);
} else {
var ly = mo === 1 ? y - 1 : y, lm = mo === 1 ? 12 : mo - 1;
big = mval(key(ly, lm)) || 0; v = mval(key(ly - 1, lm)); prev = v === null ? 0 : v;
ttl = MN[lm - 1] + ' ' + ly;
cmp = 'vs ' + MN[lm - 1] + ' ' + (ly - 1);
}
var cur = mval(key(y, mo)) || 0, pace = m.d ? cur / m.d * m.dim : 0;
if (PER === 'mon') {
side = '<div><div class="hm-num hm-n20">' + fmt(pace) + '</div><div class="hm-sub">projected by day ' + m.dim + ' at the current pace</div></div>';
} else {
side = '<div><div class="hm-num hm-n20">' + fmt(cur) + '</div><div class="hm-sub">this month - pace ' + mil(pace) + ' by day ' + m.dim + '</div></div>';
}
return '<a class="hm-card hm-tile" href="' + link('SALES') + '"><div class="hm-lbl">Net sales <span>' + ttl + '</span></div>'
+ '<div class="hm-flex"><div><div class="hm-num hm-n32">' + fmt(big) + '<small>SAR</small></div><div class="hm-sub">' + cmp + ' ' + delta(big, prev) + (prev ? ' (' + fmt(prev) + ')' : '') + '</div></div>' + side + '</div>'
+ salesChart()
+ '<div class="hm-lg"><b style="background:#111c3a;margin-left:0"></b>' + y + '<b style="background:#c9cde6"></b>' + (y - 1) + (D.target ? '<b style="background:#22b8cf"></b>monthly target' : '') + '</div><span class="hm-go">' + GO + '</span></a>';
}
function salesChart() {
var m = D.meta, y = m.y, mo = m.mo, cur = [], old = [], mx = 0, i, v, tg = D.target ? num(D.target.ytd.ann) / 12 : 0;
for (i = 1; i <= 12; i++) {
v = mval(key(y - 1, i)); if (v !== null) { old.push([i, v]); if (v > mx) { mx = v; } }
if (i <= mo) { v = mval(key(y, i)) || 0; cur.push([i, v]); if (v > mx) { mx = v; } }
}
if (tg > mx) { mx = tg; }
if (!mx) { return ''; }
function X(i) { return 10 + (i - 1) * 45; }
function Y(v) { return (86 - Math.max(v, 0) / mx * 76).toFixed(1); }
function pts(a) { var s = [], j; for (j = 0; j < a.length; j++) { s.push(X(a[j][0]) + ',' + Y(a[j][1])); } return s.join(' '); }
var last = cur[cur.length - 1], s = '<svg viewBox="0 0 520 90" class="hm-chart">';
if (tg) { s += '<line x1="0" y1="' + Y(tg) + '" x2="520" y2="' + Y(tg) + '" stroke="#22b8cf" stroke-width="1.2" stroke-dasharray="5 4"/>'; }
s += '<polyline fill="none" stroke="#c9cde6" stroke-width="2" stroke-dasharray="4 3" points="' + pts(old) + '"/>';
s += '<polygon fill="#111c3a" fill-opacity=".08" points="' + X(cur[0][0]) + ',86 ' + pts(cur) + ' ' + X(last[0]) + ',86"/>';
s += '<polyline fill="none" stroke="#111c3a" stroke-width="2.6" points="' + pts(cur) + '"/>';
s += '<circle cx="' + X(last[0]) + '" cy="' + Y(last[1]) + '" r="4" fill="#22b8cf"/></svg>';
return s;
}
function targetTile() {
var t = D.target[PER], p = num(t.pct), per = num(t.per), adj = num(t.adj), f = Math.max(0, Math.min(p, 100)) / 100;
var note = PER === 'ytd' ? D.meta.mo + ' of 12 months' : (PER === 'mon' ? 'annual / 12, current month live' : 'annual / 12');
var col = p >= 90 ? '#1e8e4e' : (p >= 70 ? '#d98a00' : '#c0392b');
var ex = (60 - 48 * Math.cos(Math.PI * f)).toFixed(1), ey = (62 - 48 * Math.sin(Math.PI * f)).toFixed(1);
return '<a class="hm-card hm-tile hm-t-a" href="' + link('TARGET') + '"><div class="hm-lbl">Target achievement <span>' + perTitle() + '</span></div>'
+ '<svg viewBox="0 0 120 70" class="hm-gauge"><path d="M12,62 A48,48 0 0 1 108,62" fill="none" stroke="#eceef6" stroke-width="11" stroke-linecap="round"/>'
+ (f > 0 ? '<path d="M12,62 A48,48 0 0 1 ' + ex + ',' + ey + '" fill="none" stroke="' + col + '" stroke-width="11" stroke-linecap="round"/>' : '')
+ '<text x="60" y="58" text-anchor="middle" font-family="Segoe UI,Tahoma,sans-serif" font-size="21" font-weight="600" fill="#1a1f36">' + fmt(p, 1) + '%</text></svg>'
+ '<div class="hm-sub">' + mil(adj) + ' of ' + mil(per) + ' - total sales</div>'
+ '<div class="hm-sub">gap ' + mil(per - adj) + ' (' + fmt(pct(per - adj, per), 1) + '%) - ' + note + '</div><span class="hm-go">' + GO + '</span></a>';
}
function itemsTile() {
var it = D.items, e = it.exp, s = it.slow, h, soon, idle, ip;
h = '<a class="hm-card hm-tile hm-t-g" href="' + link(e ? 'EXPIRY' : 'MOVE') + '"><div class="hm-lbl">Items to move <span class="hm-mini" id="hm-mini"><i data-m="3"' + (IMO === '3' ? ' class="on"' : '') + '>3m</i><i data-m="6"' + (IMO === '6' ? ' class="on"' : '') + '>6m</i></span></div><div class="hm-flex hm-gap22">';
if (e) { soon = IMO === '3' ? e.m3[0] : e.i6; h += '<div><div class="hm-num">' + fmt(soon) + '</div><div class="hm-sub">expiring in ' + IMO + ' months</div></div>'; }
if (s) { idle = IMO === '3' ? s.m3 : s.m6; h += '<div><div class="hm-num">' + fmt(idle) + '</div><div class="hm-sub">no sale, in stock</div></div>'; }
h += '</div>';
if (s) { ip = pct(idle, s.tot); h += '<div class="hm-bar"><i style="width:' + ip.toFixed(1) + '%;background:#ef9f27"></i></div><div class="hm-sub hm-mt6">' + fmt(idle) + ' (' + fmt(ip, 1) + '%) of ' + fmt(s.tot) + ' stocked items are idle</div>'; }
if (e) { h += '<div class="hm-sub"><span class="hm-dn">' + fmt(e.x[0]) + ' expired in stock</span> - ' + fmt(e.x[1]) + ' lots</div>'; }
return h + '<span class="hm-go">' + GO + '</span></a>';
}
var SBR = { CEN: 'Central', WST: 'West', EST: 'East', NTH: 'North', ALL: 'Company' };
function shipTile() {
var s = D.ship, R = s.br, h, all = null, i;
if (!R.length) { return ''; }
for (i = 0; i < R.length; i++) { if (R[i][0] === 'ALL') { all = R[i]; } }
h = '<a class="hm-card hm-tile hm-t-s hm-sec" href="' + link('POARR') + '"><div class="hm-lbl">Shipments by branch <span>open purchase orders - orders (items)</span></div>'
+ '<div class="sb-grid" style="grid-template-columns:' + (D.sup ? '104px' : '170px') + ' repeat(' + R.length + ',minmax(0,1fr))"><div class="sb-h"></div>';
for (i = 0; i < R.length; i++) { h += '<div class="sb-h' + (R[i][0] === 'ALL' ? ' sb-t' : '') + '">' + (SBR[R[i][0]] || R[i][0]) + '</div>'; }
[['At customs', 1, 'cu', 'documents received'], ['Pending', 4, 'pe', 'ordered, documents not received'], ['Overdue', 6, 'od', 'arrival month passed']].forEach(function (k) {
var c = k[1];
h += '<div class="sb-k">' + k[0] + '<small>' + k[3] + '</small></div>';
for (i = 0; i < R.length; i++) {
var r = R[i];
h += '<div class="sb-v sb-' + k[2] + (r[0] === 'ALL' ? ' sb-t' : '') + (r[c] ? '' : ' z') + '">' + (r[c] ? fmt(r[c]) + '<small>' + fmt(r[c + 1]) + (r[c + 1] === 1 ? ' item' : ' items') + '</small>' : '&ndash;')
+ (c === 1 && r[1] && r[3] ? '<i class="sb-age' + (r[3] > 10 ? ' r' : '') + '">oldest ' + fmt(r[3]) + ' days</i>' : '') + '</div>';
}
});
h += '</div>';
if (s.cost && all && num(all[8]) > 0) { h += '<div class="sb-val">Value at customs incl. expenses <b>' + fmt(num(all[8])) + '</b> SAR<u>USD ' + fmt(num(all[8]) / 3.75) + '</u></div>'; }
return h + '<span class="hm-go">' + GO + '</span></a>';
}
function purBox() {
var p = el('hm-pur'), a = el('hm-ar');
if (!p && a) { p = document.createElement('div'); p.id = 'hm-pur'; p.className = 'hm-pur'; a.parentNode.insertBefore(p, a); }
return p;
}
function purLayout() {
var p = el('hm-pur'), s = el('hm-ship'), u = el('hm-sup');
if (p) { p.className = 'hm-pur' + (s && s.innerHTML && u && u.innerHTML ? ' hm-pur2' : ''); }
}
function drawShip() {
var w = el('hm-ship'), p = purBox();
if (!w && p) { w = document.createElement('div'); w.id = 'hm-ship'; p.appendChild(w); }
if (w) { w.innerHTML = D.ship ? shipTile() : ''; }
}
function hesc(s) { return String(s === null || s === undefined ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
function supTile() {
var s = D.sup, T = num(s.t), O = num(s.o), I = num(s.i), P = num(s.m[0]), U = num(s.un), mx = 0, i, h, v, lab, y = +s.m0.substr(0, 4), mo = +s.m0.substr(5, 2), k;
if (!T && !U) { return ''; }
for (i = 0; i < 8; i++) { if (num(s.m[i]) > mx) { mx = num(s.m[i]); } }
h = '<a class="hm-card hm-tile hm-t-v hm-sec" href="' + link('SUPAY') + '"><div class="hm-lbl">Supplier payables <span>by purchase order - orders dated this year - SAR</span></div>'
+ '<div class="hs-b"><div><div class="hs-k">Total payable</div><div class="hm-num">' + mil(T) + '</div><div class="hm-sub">' + s.ns + (s.ns === 1 ? ' supplier' : ' suppliers') + ' - ledger balance ' + mil(num(s.led)) + '</div>'
+ '<div class="hs-chips"><span class="hs-chip o">Orders<small>' + mil(O) + ' - ' + fmt(pct(O, T), 1) + '%</small></span><span class="hs-chip i">Invoices<small>' + mil(I) + ' - ' + fmt(pct(I, T), 1) + '%</small></span>'
+ (P ? '<span class="hs-chip d">Due passed<small>' + fmt(P) + '</small></span>' : '') + (U ? '<span class="hs-chip u">Unscheduled<small>' + mil(U) + '</small></span>' : '') + '</div></div>'
+ '<div><div class="hs-bt">Falls due by month - red = passed, pink = this month</div><div class="hs-bars">';
for (i = 0; i < 8; i++) {
v = num(s.m[i]); k = mo - 1 + i - 1;
lab = i === 0 ? 'Passed' : (i === 7 ? 'Later' : two((k % 12) + 1) + '/' + String(y + Math.floor(k / 12)).substr(2));
h += '<div class="hs-bar' + (i === 0 ? ' p' : (i === 1 ? ' n' : '')) + '"><b>' + (v ? mil(v) : '&ndash;') + '</b><u style="height:' + (mx ? Math.max(3, 52 * v / mx).toFixed(0) : 3) + 'px"></u><small>' + lab + '</small></div>';
}
h += '</div></div></div>';
if (s.top && s.top.length) {
h += '<div class="hs-top">';
for (i = 0; i < s.top.length; i++) { h += '<div><b title="' + hesc(s.top[i][1]) + '">' + hesc(s.top[i][1]) + '</b><i>' + fmt(num(s.top[i][2])) + '</i><u style="width:' + Math.max(4, pct(num(s.top[i][2]), num(s.top[0][2]))).toFixed(0) + '%"></u></div>'; }
h += '</div>';
}
return h + '<span class="hm-go">' + GO + '</span></a>';
}
function drawSup() {
var w = el('hm-sup'), p = purBox();
if (!w && p) { w = document.createElement('div'); w.id = 'hm-sup'; p.appendChild(w); }
if (w) { w.innerHTML = D.sup ? supTile() : (D.supx ? '<div class="hm-card hm-tile hm-t-v hm-sec"><div class="hm-lbl">Supplier payables</div><div class="hm-sub hm-mt6">Could not be computed - ' + hesc(D.supx) + '</div></div>' : ''); }
purLayout();
}
function arTile() {
var a = D.ar, b = [], sum = 0, mx = 0, i, w, bar = '', cols = '', lab = '';
for (i = 0; i < 6; i++) { b.push(Math.max(num(a.b[i]), 0)); sum += b[i]; if (b[i] > b[mx]) { mx = i; } }
for (i = 0; i < 6; i++) {
w = pct(b[i], sum).toFixed(1);
bar += '<i style="width:' + w + '%;background:' + BC[i] + '"></i>';
cols += (i ? ' ' : '') + 'minmax(44px,' + w + 'fr)';
lab += '<span>' + BL[i] + '<br>' + (i === mx ? '<b>' : '') + mil(b[i]) + ' (' + fmt(num(w), 0) + '%)' + (i === mx ? '</b>' : '') + '</span>';
}
return '<a class="hm-card hm-tile hm-t-p hm-sec" href="' + link('RECEIVABLES') + '"><div class="hm-lbl">Overdue receivables <span>customer-card terms - open invoices by age</span></div>'
+ '<div class="hm-argrid"><div><div class="hm-num">' + fmt(num(a.over)) + '<small>SAR</small></div><div class="hm-sub"><span class="hm-dn">' + fmt(num(a.pct), 1) + '%</span> of ' + fmt(num(a.open)) + ' open</div></div>'
+ '<div><div class="hm-bar hm-bar14">' + bar + '</div><div class="hm-arlab" style="grid-template-columns:' + cols + '">' + lab + '</div></div></div><span class="hm-go">' + GO + '</span></a>';
}
function profitTile() {
var p = D.profit[PER], ns = num(p.ns), cost = num(p.cost), gp = Math.round(ns) - Math.round(cost), mg = pct(gp, ns), cw = Math.max(0, Math.min(100, pct(cost, ns)));
return ringTile('hm-k-pink', link('PROFIT'), 'Profitability', perTitle(), mg, gp, 'gross profit', 'net sales', ns, 'cost of goods sold (' + fmt(pct(cost, ns), 1) + '%)', cost, '', '#22b8cf', '#fbd9ec');
}
function ringTile(cls, href, label, sub, mg, res, resLbl, l1, v1, l2, v2, note, col, track) {
var p = Math.max(0, Math.min(100, mg));
return '<a class="hm-card hm-kard ' + cls + '" href="' + href + '"><div class="hm-lbl">' + label + ' <span>' + sub + '</span></div>'
+ '<div class="hm-ring"><svg viewBox="0 0 42 42"><circle cx="21" cy="21" r="15.9" fill="none" stroke="' + track + '" stroke-width="5"/>'
+ (p > 0 ? '<circle cx="21" cy="21" r="15.9" fill="none" stroke="' + col + '" stroke-width="5" stroke-dasharray="' + p.toFixed(1) + ' ' + (100 - p).toFixed(1) + '" stroke-dashoffset="25"/>' : '')
+ '<text x="21" y="23.5" text-anchor="middle" font-family="Segoe UI,Tahoma,sans-serif" font-size="8" font-weight="600" fill="#1a1f36">' + fmt(mg, 1) + '%</text></svg>'
+ '<div><div class="hm-num hm-n22 ' + (res >= 0 ? 'hm-kc' : 'hm-crd') + '">' + fmt(res) + '</div><div class="hm-sub hm-mb6">' + resLbl + '</div>'
+ '<div class="hm-rl"><span>' + l1 + '</span><b>' + fmt(v1) + '</b></div><div class="hm-rl"><span>' + l2 + '</span><b>' + fmt(v2) + '</b></div></div></div>'
+ (note ? '<div class="hm-sub hm-mt6">' + note + '</div>' : '') + '<span class="hm-go">' + GO + '</span></a>';
}
function nice(s) {
var w = String(s).toLowerCase().split(' '), i;
for (i = 0; i < w.length; i++) { if (w[i]) { w[i] = w[i].charAt(0).toUpperCase() + w[i].substr(1); } }
return w.join(' ');
}
function inList(a, name) { var i; for (i = 0; i < a.length; i++) { if (a[i][0] === name) { return true; } } return false; }
function podium(rows, kind, other) {
var ord = [1, 0, 2], h = '<div class="hm-pod' + (kind === 'c' ? ' hm-podk' : '') + '">', i, r, k, tot, cash, cr, resp, cv, fo, eff, star, mx = 0;
for (k = 0; k < 3; k++) {
i = ord[k]; r = rows[i]; star = inList(other, r[0]) ? ' &#9733;' : '';
h += '<div class="hm-p' + (i + 1) + '"><b>' + (i + 1) + '</b><span>' + nice(r[0]) + star + '</span>';
if (kind === 's') {
tot = num(r[1]); cash = num(r[2]); cr = tot - cash;
h += '<u>' + fmt(tot) + '</u><span>cash ' + fmt(cash) + ' (' + fmt(pct(cash, tot), 0) + '%)</span><span>credit ' + fmt(cr) + ' (' + fmt(pct(cr, tot), 0) + '%)</span>' + (r[3] ? '<span>target ' + r[3] + '%</span>' : '');
} else {
resp = num(r[1]); cv = num(r[2]); fo = num(r[3]); eff = pct(cv, resp);
h += '<u>' + fmt(Math.min(eff, 100), 0) + '%</u><span>' + fmt(cv) + ' of ' + fmt(resp) + '</span><span>' + fmt(pct(fo, cv), 0) + '% from overdue' + (eff > 100 ? ' - ' + fmt(eff, 0) + '% raw' : '') + '</span>';
}
h += '</div>';
}
h += '</div>';
for (i = 0; i < rows.length; i++) { mx = Math.max(mx, kind === 's' ? num(rows[i][1]) : num(rows[i][2])); }
if (rows.length > 3) {
h += '<div class="hm-prow">';
for (i = 3; i < rows.length; i++) {
r = rows[i]; star = inList(other, r[0]) ? ' &#9733;' : '';
if (kind === 's') {
tot = num(r[1]); cash = num(r[2]); cr = tot - cash;
h += '<span class="hm-rk">' + (i + 1) + '</span><div><div class="hm-pn">' + nice(r[0]) + star + ' <span>cash ' + fmt(cash) + ' (' + fmt(pct(cash, tot), 0) + '%) - credit ' + fmt(cr) + ' (' + fmt(pct(cr, tot), 0) + '%)' + (r[3] ? ' - target ' + r[3] + '%' : '') + '</span></div>'
+ '<div class="hm-bar"><i style="width:' + pct(cash, mx).toFixed(1) + '%;background:#111c3a"></i><i style="width:' + pct(Math.max(cr, 0), mx).toFixed(1) + '%;background:#c6c9d0"></i></div></div><span class="hm-pv">' + fmt(tot) + '</span>';
} else {
resp = num(r[1]); cv = num(r[2]); fo = num(r[3]); eff = pct(cv, resp);
h += '<span class="hm-rk">' + (i + 1) + '</span><div><div class="hm-pn">' + nice(r[0]) + star + ' <span>' + fmt(cv) + ' of ' + fmt(resp) + ' - ' + fmt(pct(fo, cv), 0) + '% from overdue</span></div>'
+ '<div class="hm-bar"><i style="width:' + pct(fo, mx).toFixed(1) + '%;background:#22b8cf"></i><i style="width:' + pct(Math.max(cv - fo, 0), mx).toFixed(1) + '%;background:#f6b3d9"></i></div></div><span class="hm-pv">' + fmt(Math.min(eff, 100), 0) + '%</span>';
}
}
h += '</div>';
}
return h;
}
function drawPods() {
var p = D.pods || {}, s = p.sales || [], c = p.coll || [], h = '', n = 0, m = MN[D.meta.mo - 1] + ' ' + D.meta.y;
if (s.length >= 3) {
n++;
h += '<a class="hm-card" href="' + link('SALES') + '"><h3 class="hm-h3">Salesman of the month - sales <em>' + m + ' - private sector, cash first</em></h3>' + podium(s, 's', c)
+ '<div class="hm-lg hm-mt12"><b style="background:#111c3a;margin-left:0"></b>Cash<b style="background:#c6c9d0"></b>Credit - &#9733; on both podiums</div><span class="hm-go">' + GO + '</span></a>';
}
if (c.length >= 3) {
n++;
h += '<a class="hm-card" href="' + link('COLLECTION') + '"><h3 class="hm-h3">Salesman of the month - collection <em>' + m + ' - efficiency %, cash sales excluded</em></h3>' + podium(c, 'c', s)
+ '<div class="hm-lg hm-mt12"><b style="background:#22b8cf;margin-left:0"></b>From overdue<b style="background:#f6b3d9"></b>Regular - collected of collectible, capped at 100%</div><span class="hm-go">' + GO + '</span></a>';
}
el('hm-pods').className = n ? 'hm-sec hm-g' + n : '';
el('hm-pods').innerHTML = h;
}
function accTile() {
var a = D.acc[PER] || {}, rv = num(a.rv), cg = num(a.cg), sd = num(a.sd), ga = num(a.ga), oi = num(a.oi), zk = num(a.zk), np = num(a.np);
var ex = cg + sd + ga + zk, seg = [cg, sd, ga, Math.max(np, 0)], col = ['#9aa0d8', '#bfc3e8', '#dfe1f4', '#111c3a'], nm =['cost of sales', 'selling', 'admin', 'net'];
var sum = 0, i, bar = '', lg = '';
for (i = 0; i < 4; i++) { sum += Math.max(seg[i], 0); }
for (i = 0; i < 4; i++) {
bar += '<i style="width:' + pct(Math.max(seg[i], 0), sum).toFixed(1) + '%;background:' + col[i] + '"></i>';
lg += '<b style="background:' + col[i] + (i ? '' : ';margin-left:0') + '"></b>' + nm[i] + ' ' + mil(i === 3 ? np : seg[i]) + ' (' + fmt(pct(i === 3 ? np : seg[i], rv), 1) + '%)';
}
return '<a class="hm-card hm-kard hm-k-navy" href="' + link('FSIS') + '"><div class="hm-lbl hm-l1">Income statement <span>' + perTitle() + ' - company wide' + (PER === 'last' ? '' : ' - month live') + '</span></div>'
+ '<div class="hm-fin"><div><div class="hm-sub">Revenue</div><div class="hm-num hm-n26">' + fmt(rv) + '</div><div class="hm-sub">other income ' + fmt(oi) + ' (' + fmt(pct(oi, rv), 1) + '%)</div></div>'
+ '<div><div class="hm-sub">Expenses</div><div class="hm-num hm-n26">' + fmt(ex) + '</div><div class="hm-sub">' + fmt(pct(ex, rv), 1) + '% of revenue' + (zk ? ' - zakat ' + fmt(zk) : '') + '</div></div>'
+ '<div><div class="hm-sub">Net income</div><div class="hm-num hm-n26 ' + (np >= 0 ? 'hm-kc' : 'hm-crd') + '">' + fmt(np) + '</div><div class="hm-sub">net margin <b>' + fmt(pct(np, rv), 1) + '%</b></div></div></div>'
+ '<div class="hm-bar hm-bar12">' + bar + '</div><div class="hm-lg hm-mt6">' + lg + ' - of every 100 SAR of revenue</div><span class="hm-go">' + GO + '</span></a>';
}
function drawAcc() { el('hm-acc').innerHTML = D.acc ? accTile() : ''; }
function stockTile() {
var s = D.stock, sell = num(s.sell), cost = num(s.cost), gp = Math.round(sell) - Math.round(cost), cw = Math.max(0, Math.min(100, pct(cost, sell))), note = [];
if (s.xitems) { note.push('<span class="hm-dn">' + fmt(s.xitems) + ' expired items, cost ' + fmt(num(s.xcost)) + '</span> kept out'); }
if (s.nitems) { note.push(fmt(s.nitems) + ' items without a price, cost ' + fmt(num(s.ncost)) + ', kept out'); }
if (s.litems) { note.push(fmt(s.litems) + ' items priced below cost (-' + fmt(num(s.loss)) + ')'); }
return ringTile('hm-k-vio', link('STVAL'), 'Stock profitability', 'as of today - ' + fmt(s.items) + ' items', pct(gp, sell), gp, 'potential profit of current stock', 'at selling price', sell, 'at cost (' + fmt(pct(cost, sell), 1) + '%)', cost, note.join(' - '), '#7a4fc4', '#e6def6');
}
function drawProfit() { el('hm-profit').innerHTML = D.profit ? profitTile() : ''; }
function finLayout() {
var ids = ['hm-acc', 'hm-profit', 'hm-stock'], n = 0, i, e;
if (!el('hm-fin')) { return; }
for (i = 0; i < 3; i++) { e = el(ids[i]); if (e.innerHTML) { n++; e.style.display = ''; } else { e.style.display = 'none'; } }
el('hm-fin').className = n ? 'hm-fin3 hm-f' + (D.acc ? 'a' : '') + n : '';
}
var DST = 0, DFIX = '', DERR = '';
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
function driftTxt(msg) {
var re = /(\d\d)\/(\d{4}) \((-?\d+)\)/g, m, o = [], i, s, v, k;
while ((m = re.exec(msg))) {
v = num(m[3]); s = 0; k = m[2] + '-' + m[1];
if (D.sales) { for (i = 0; i < D.sales.m.length; i++) { if (D.sales.m[i][0] === k) { s = num(D.sales.m[i][1]); } } }
o.push(m[1] + '/' + m[2] + ' (' + (v > 0 ? '+' : '') + fmt(v) + (s ? ' = ' + fmt(pct(Math.abs(v), s), 1) + '% of the month' : '') + ')');
}
return o.length ? o.join(', ') : esc(msg);
}
function driftFix() {
DST = 2; DERR = ''; driftDraw();
apex.server.process('HOME_KPI_AJAX', { x01: 'rearch' }, {
success: function (r) {
if (!r || r.err || !r.ok) { DST = 4; DERR = r && r.err ? r.err : 'no answer'; driftDraw(); return; }
DST = 0;
if (r.st === 'SUCCESS') { DFIX = 'Sales archive re-archived ' + esc(r.done) + ' in ' + r.sec + ' s - now matches the system'; }
pull();
},
error: function () { DST = 4; DERR = 'request failed'; driftDraw(); }
});
}
function driftDraw() {
var x = D.drift, box = el('hm-integ'), h = '', s, g;
if (!box) {
if (!el('hm-alerts') || (!x && !DFIX)) { return; }
el('hm-alerts').insertAdjacentHTML('beforebegin', '<div id="hm-integ"></div>');
box = el('hm-integ');
}
s = x ? x.sales : null; g = x ? x.gl : null;
if (DFIX) { h += '<div class="hm-dr"><u class="g"></u><span class="hm-ok">' + DFIX + '</span></div>'; }
if (s && s.st === 'ERROR') { h += '<div class="hm-dr"><u></u><span>Sales archive check failed last night: ' + esc(s.msg) + '</span><i>' + s.at + '</i></div>'; }
if (s && s.st !== 'ERROR') {
h += '<div class="hm-dr"><u></u><span>Sales archive differs from the system: <strong>' + driftTxt(s.msg) + '</strong></span><i>detected ' + s.at + '</i>';
if (DST === 0) { h += '<button type="button" class="hm-drb" id="hm-dr-go">Re-archive</button>'; }
if (DST === 1) { h += '<span>Re-archive now?</span><button type="button" class="hm-drb" id="hm-dr-yes">Yes, re-archive</button><button type="button" class="hm-drb c" id="hm-dr-no">Cancel</button>'; }
if (DST === 2) { h += '<button type="button" class="hm-drb" disabled>Re-archiving...</button>'; }
if (DST === 4) { h += '<span class="hm-bad">Re-archive failed - ' + esc(DERR) + '</span><button type="button" class="hm-drb" id="hm-dr-go">Try again</button>'; }
h += '</div>';
}
if (g) { h += '<div class="hm-dr"><u></u><span>Ledger archive differs in a year not closed yet: <strong>' + esc(g.msg) + '</strong></span><i>detected ' + g.at + ' - re-archive is manual</i></div>'; }
box.innerHTML = h ? '<div class="hm-integ"><b>Data integrity</b>' + h + '</div>' : '';
if (el('hm-dr-go')) { el('hm-dr-go').onclick = function () { DST = 1; driftDraw(); }; }
if (el('hm-dr-no')) { el('hm-dr-no').onclick = function () { DST = 0; driftDraw(); }; }
if (el('hm-dr-yes')) { el('hm-dr-yes').onclick = driftFix; }
}
function alerts() {
var h = '', a = D.ar, t = D.target ? D.target.ytd : null, e =D.items ? D.items.exp : null, i, mx = 0, b, left;
if (a) {
for (i = 1; i < 6; i++) { if (num(a.b[i]) > num(a.b[mx])) { mx = i; } }
b = num(a.b[mx]);
if (b > 0) { h += '<a href="' + link('RECEIVABLES') + '"><u class="' + (mx >= 3 ? 'r' : 'a') + '"></u>' + mil(b) + ' (' + fmt(pct(b, num(a.open)), 1) + '% of open) of receivables now sit ' + BL[mx] + ' days - the largest aging bucket</a>'; }
}
if (t && D.meta.mo < 12) {
left = 12 - D.meta.mo;
b = num(t.gap) / left;
if (b > 0) { h += '<a href="' + link('TARGET') + '"><u class="a"></u>Target pace: ' + mil(b) + ' per month needed ' + MN[D.meta.mo] + (left > 1 ? '-December' : '') + ' to close ' + mil(num(t.gap)) + ' of class shortfalls (' + fmt(pct(num(t.gap), num(t.ann)), 1) + '% of the annual target)</a>'; }
}
if (e && (e.x[0] > 0 || e.m3[0] > 0)) { h += '<a href="' + link('EXPIRY') + '"><u class="r"></u>' + fmt(e.x[0]) + ' expired items still in stock - ' + fmt(e.m3[0]) + ' more expire within 3 months</a>'; }
el('hm-alerts').innerHTML = h ? '<div class="hm-alerts"><b>Needs attention</b>' + h + '</div>' : '';
}
function drawRow1() {
var h = '', n = 0;
if (D.sales) { h += salesTile(); n++; }
if (D.target) { h += targetTile(); n++; }
if (D.items && (D.items.exp || D.items.slow)) { h += itemsTile(); n++; }
var r = el('hm-row1');
r.className = 'hm-row1' + (D.sales ? ' hm-wide' : '') + ' hm-c' + n;
r.innerHTML = h;
var mi = el('hm-mini');
if (mi) {
mi.onclick = function (ev) {
var t = ev.target || ev.srcElement, v = t.getAttribute ? t.getAttribute('data-m') : null;
if (ev.preventDefault) { ev.preventDefault(); }
if (ev.stopPropagation) { ev.stopPropagation(); }
if (v && v !== IMO) { IMO = v; drawRow1(); }
return false;
};
}
}
function draw() {
drawDay();
driftDraw();
alerts();
drawRow1();
drawShip();
drawSup();
el('hm-ar').innerHTML = D.ar ? arTile() : '';
drawProfit();
drawAcc();
drawPods();
el('hm-stock').innerHTML = D.stock ? stockTile() : '';
finLayout();
el('hm-caps').style.visibility = (D.sales || D.target || D.profit || D.acc) ? 'visible' : 'hidden';
var any = D.sales || D.target || D.ar || D.profit || D.acc || D.stock || D.ship || D.sup || (D.items && (D.items.exp || D.items.slow));
el('hm-load').innerHTML = any ? '' : 'Use the side menu to open your reports.';
el('hm-load').style.display = any ? 'none' : 'block';
}
function bindCaps() {
var c = el('hm-caps');
if (!c) { return; }
c.onclick = function (ev) {
var t = ev.target || ev.srcElement, p = t.getAttribute ? t.getAttribute('data-p') : null, a, i;
if (!p || !D || p === PER) { return; }
PER = p;
a = c.getElementsByTagName('a');
for (i = 0; i < a.length; i++) { a[i].className = a[i].getAttribute('data-p') === p ? 'on' : ''; }
drawRow1();
drawProfit();
drawAcc();
};
}
function load() {
if (!el('hm-row1')) { return; }
bindCaps();
pull();
}
function pull() {
apex.server.process('HOME_KPI_AJAX', {}, {
success: function (d) {
if (!d || d.err || !d.ok) { el('hm-load').innerHTML = 'Could not load the board' + (d && d.err ? ' - ' + d.err : '') + '.'; return; }
D = d;
draw();
},
error: function () { el('hm-load').innerHTML = 'Could not load the board. Please refresh the page.'; }
});
}
load();
})();

});
