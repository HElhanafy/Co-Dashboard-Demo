window.addEventListener("DOMContentLoaded",function(){
function initSmCard() {
var el = document.getElementById('sm-meta');
if (!el || !document.getElementById('tableBody')) {
initSmCard._t = (initSmCard._t || 0) + 1;
if (initSmCard._t < 100) { setTimeout(initSmCard, 100); return; }
console.error('Salesman card: data region not found.');
return;
}
var META = JSON.parse(el.textContent);
var REPS = META.reps || [];
var RM = {}; REPS.forEach(function (r) { RM[r[0]] = r; });
var PS = {}, PL = [];
REPS.forEach(function (r) { var k = r[6] || r[0], p = PS[k]; if (!p) { p = PS[k] = { k: k, reps: [] }; PL.push(p); } p.reps.push(r); });
PL.forEach(function (p) {
p.reps.sort(function (a, b) { return +a[0] - +b[0]; });
var h = RM[p.k]; p.name = p.k === 'GOV' ? 'GOVERNMENT SECTOR' : h ? h[1] : (p.reps.length > 1 && p.reps[0][3] !== '-' ? p.reps[0][3] : p.reps[0][1]);
p.one = p.k === 'GOV' || p.reps.every(function (r) { return r[4] === p.reps[0][4]; });
});
var CODE = {}; REPS.forEach(function (r) { CODE[r[0]] = PS[r[6] || r[0]]; });
function esc(s) {
return String(s === null || s === undefined ? '' : s).replace(/[&<>"]/g, function (m) {
return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m];
});
}
function idxOf(arr, v) { for (var i = 0; i < arr.length; i++) { if (arr[i] === v) return i; } return -1; }
function dmy(s) { return s ? s.slice(8, 10) + '/' + s.slice(5, 7) + '/' + s.slice(0, 4) : '-'; }
var DASH = String.fromCharCode(8212), SEP = ' ' + String.fromCharCode(8250) + ' ', MB = 1000;
var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function fm(v) { v = Math.round(v * 100) / 100; if (Math.abs(v) < 0.005) v = 0; return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function f0(v) { return Math.round(v).toLocaleString('en-US'); }
function pct(v) { return v === null ? DASH : (Math.round(v * 10) / 10).toFixed(1) + '%'; }
function ratio(n, d) { return Math.abs(d) < MB ? null : Math.max(-999, Math.min(999, n / d * 100)); }
function tdm(v, cls) { return Math.abs(v) < 0.005 ? '<td class="num z">' + DASH + '</td>' : '<td class="num ' + (cls || '') + (v < 0 ? ' neg' : '') + '">' + fm(v) + '</td>'; }
function tdp(v, cls) { return '<td class="num pct ' + (cls || '') + (v !== null && v < 0 ? ' neg' : '') + '">' + pct(v) + '</td>'; }
function tdi(v) { return '<td class="num">' + (v ? f0(v) : DASH) + '</td>'; }
function tdt(v, cls) { return '<td class="txt ' + (cls || '') + '">' + esc(v) + '</td>'; }
function mlab(y, m) { return MON[m - 1] + ' ' + y; }
var sm = null, D = null, busy = false, view = 'months', Y = META.year, M1 = 1, M2 = META.month, ROWS = null;
var fSm = document.getElementById('fSm'), fYear = document.getElementById('fYear'), fM1 = document.getElementById('fM1'), fM2 = document.getElementById('fM2'),
runBtn = document.getElementById('runBtn'), resetBtn = document.getElementById('resetBtn'),
cardHead = document.getElementById('cardHead'), cardL1 = document.getElementById('cardL1'), cardL2 = document.getElementById('cardL2'),
kpiPanel = document.getElementById('kpiPanel'), kS = document.getElementById('kpiSales'), kT = document.getElementById('kpiTarget'), kC = document.getElementById('kpiColl'),
viewChips = document.getElementById('viewChips'), titleEl = document.getElementById('tableTitleText'), pfEl = document.getElementById('printFilters'),
tHead = document.getElementById('tableHead'), tBody = document.getElementById('tableBody'), tFoot = document.getElementById('tableFoot'),
note = document.getElementById('tableNote'), foot = document.getElementById('tableFootNote'), badge = document.getElementById('periodBadge'),
asOf = document.getElementById('asOfLine'), excelBtn = null, printBtn = null, yearChips = document.getElementById('yearChips');
function canExp(v) { if (excelBtn) { excelBtn.disabled = !v; printBtn.disabled = !v; } }
function paintYears() {
if (!yearChips) return;
yearChips.innerHTML = Array.prototype.map.call(fYear.options, function (o) {
return '<button type="button"' + (o.value === fYear.value ? ' class="on"' : '') + ' data-y="' + o.value + '">' + o.value + '</button>';
}).join('');
}
if (yearChips) yearChips.addEventListener('click', function (e) {
var b = e.target; while (b && b !== yearChips && !(b.getAttribute && b.getAttribute('data-y'))) b = b.parentNode;
if (!b || b === yearChips) return;
fYear.value = b.getAttribute('data-y');
fYear.dispatchEvent(new Event('change'));
});
var y, o, i;
for (y = META.year; y >= META.minYear; y--) { o = document.createElement('option'); o.value = String(y); o.textContent = String(y); fYear.appendChild(o); }
for (i = 1; i <= 12; i++) {
o = document.createElement('option'); o.value = String(i); o.textContent = MON[i - 1]; fM1.appendChild(o);
o = document.createElement('option'); o.value = String(i); o.textContent = MON[i - 1]; fM2.appendChild(o);
}
function setPeriodDefaults() {
fYear.value = String(Y); fM1.value = '1';
fM2.value = String(Y === META.year ? META.month : 12);
paintYears();
}
setPeriodDefaults();
fYear.addEventListener('change', function () { Y = +fYear.value; if (Y === META.year && +fM2.value > META.month) fM2.value = String(META.month); paintYears(); });
asOf.textContent = 'Profit nightly ' + (META.asofProfit || '-') + SEP + 'Receivables ' + (META.asofAR || '-') + SEP + 'Collection archive through ' + (META.collThru || '-');
asOf.classList.add('fresh');
var SMS = PL.slice().sort(function (a, b) { return String(a.name).replace(/^\s+/, '').localeCompare(String(b.name).replace(/^\s+/, '')); });
SMS.forEach(function (p) { o = document.createElement('option'); o.value = p.k; o.textContent = p.name; fSm.appendChild(o); });
var smDivG = document.getElementById('smDivG'), smDiv = document.getElementById('smDiv'), per = null, IN = {};
var smBtn = document.getElementById('fSmBtn'), smLbl = document.getElementById('fSmLbl'), smMenu = document.getElementById('fSmMenu'),
smQ = document.getElementById('fSmQ'), smList = document.getElementById('fSmList'), smPick = document.getElementById('smPick');
if (smList) {
smList.innerHTML = SMS.map(function (r) {
return '<div class="ss-option" data-v="' + esc(r.k) + '">' + esc(r.name) + '<small>' + esc(String(r.reps[0][2]).replace(/ REGION$/, '')) + '</small></div>';
}).join('');
var smPlace = function () {
var rc = smBtn.getBoundingClientRect();
smMenu.style.position = 'fixed'; smMenu.style.top = (rc.bottom + 4) + 'px'; smMenu.style.left = rc.left + 'px';
smMenu.style.width = rc.width + 'px'; smMenu.style.minWidth = '0'; smMenu.style.maxWidth = rc.width + 'px';
smMenu.style.maxHeight = Math.min(360, Math.max(200, window.innerHeight - rc.bottom - 24)) + 'px';
};
var smOpen = function (v) { smMenu.className = 'ss-menu' + (v ? ' open' : ''); smMenu.style.display = v ? 'block' : ''; if (v) { smPlace(); smQ.value = ''; smFilt(); smQ.focus(); } };
window.addEventListener('resize', function () { if (smMenu.className.indexOf('open') !== -1) smPlace(); });
window.addEventListener('scroll', function () { if (smMenu.className.indexOf('open') !== -1) smPlace(); }, true);
var smFilt = function () { var q = smQ.value.toUpperCase(), L = smList.children, i; for (i = 0; i < L.length; i++) L[i].style.display = !q || L[i].textContent.toUpperCase().indexOf(q) !== -1 ? '' : 'none'; };
smBtn.addEventListener('click', function () { smOpen(smMenu.className.indexOf('open') === -1); });
smQ.addEventListener('input', smFilt);
smQ.addEventListener('keydown', function (e) {
if (e.key === 'Escape') { smOpen(false); smBtn.focus(); }
else if (e.key === 'Enter') {
e.preventDefault();
for (var i = 0; i < smList.children.length; i++) if (smList.children[i].style.display !== 'none') { pickSm(PS[smList.children[i].getAttribute('data-v')]); smOpen(false); smBtn.focus(); return; }
}
});
smList.addEventListener('click', function (e) {
var t = e.target; while (t && t !== smList && !(t.getAttribute && t.getAttribute('data-v'))) t = t.parentNode;
if (!t || t === smList) return;
pickSm(PS[t.getAttribute('data-v')]); smOpen(false); smBtn.focus();
});
smBtn.addEventListener('keydown', function (e) { if (e.key === 'Enter' && sm && !runBtn.disabled && !busy && smMenu.className.indexOf('open') === -1) { e.preventDefault(); runBtn.click(); } });
document.addEventListener('click', function (e) { if (!smPick.contains(e.target)) smOpen(false); });
}
fSm.addEventListener('change', function () { pickSm(PS[fSm.value] || null); });
fSm.addEventListener('keydown', function (e) { if (e.key === 'Enter' && sm && !runBtn.disabled && !busy) { e.preventDefault(); runBtn.click(); } });
function pickSm(p, code) {
per = p; if (!p) { if (smDivG) smDivG.style.display = 'none'; setSm(null); return; }
fSm.value = p.k;
if (smDivG) {
smDivG.style.display = p.reps.length > 1 ? '' : 'none';
smDiv.innerHTML = '<button type="button" class="chip mini" data-c="">All</button>' + p.reps.map(function (r) {
return '<button type="button" class="chip mini" data-c="' + esc(r[0]) + '">' + esc(p.one || r[4] === '-' ? String(r[1]).replace(/^.* - /, '') : r[4]) + '</button>';
}).join('');
}
pickDiv(p.reps.length > 1 ? code || '' : p.reps[0][0]);
}
function pickDiv(c) {
var L = c ? [RM[c]] : per.reps, r = L[0];
IN = {}; L.forEach(function (x) { IN[x[0]] = 1; });
if (smDiv) Array.prototype.forEach.call(smDiv.children, function (b) { b.className = 'chip mini' + (b.getAttribute('data-c') === c ? ' on' : ''); });
setSm(L.length > 1 ? [L.map(function (x) { return x[0]; }).join(','), per.name, r[2], r[3], per.one ? r[4] : L.map(function (x) { return x[4]; }).join(' + '), 0] : [r[0], per.reps.length > 1 ? r[1] : per.name, r[2], r[3], r[4], r[5]]);
}
if (smDiv) smDiv.addEventListener('click', function (e) { var b = e.target; if (b && b.hasAttribute && b.hasAttribute('data-c') && per) pickDiv(b.getAttribute('data-c')); });
function setSm(r) {
sm = r; D = null; ROWS = null;
cardHead.style.display = 'none'; kpiPanel.style.display = 'none'; viewChips.style.display = 'none';
tHead.innerHTML = ''; tBody.innerHTML = ''; tFoot.innerHTML = ''; titleEl.textContent = 'Details'; pfEl.innerHTML = ''; foot.textContent = '';
canExp(false);
if (smLbl) { smLbl.textContent = per ? per.name : 'Select a salesman...'; smBtn.className = 'cls-btn' + (r ? ' picked' : ''); }
if (!r) { runBtn.disabled = true; note.textContent = 'Select a salesman, then Run'; badge.textContent = 'Select a salesman'; return; }
runBtn.disabled = false; note.textContent = 'Press Run to build the card'; badge.textContent = 'Press Run';
}
resetBtn.addEventListener('click', function () {
Y = META.year; setPeriodDefaults(); fSm.value = ''; pickSm(null); (smBtn || fSm).focus();
});
runBtn.addEventListener('click', function () {
if (!sm || busy) return;
Y = +fYear.value; M1 = +fM1.value; M2 = +fM2.value;
if (M1 > M2) { M1 = M2; fM1.value = String(M1); }
if (Y === META.year && M2 > META.month) { M2 = META.month; fM2.value = String(M2); }
busy = true; note.textContent = 'Loading...'; note.classList.add('busy'); tBody.classList.add('dim');
apex.server.process('SMCARD_AJAX', { x01: 'card', x02: sm[0], x03: String(Y), x04: String(M1), x05: String(M2) }, {
success: function (d) {
busy = false; note.classList.remove('busy'); tBody.classList.remove('dim');
if (!d || d.error) { note.textContent = 'Could not load' + (d && d.error ? ': ' + d.error : '') + '.'; return; }
D = d; render();
},
error: function (xhr) {
busy = false; note.classList.remove('busy'); tBody.classList.remove('dim');
note.textContent = 'Could not load SMCARD_AJAX (' + (xhr ? xhr.status : '?') + ').';
if (window.console) console.error('SMCARD_AJAX', xhr && xhr.status, xhr && xhr.responseText);
}
});
});
var K = null;
function compute() {
var n = M2 - M1 + 1, m, r, k = { n: n, live: (Y === META.year && M2 >= META.month) ? META.month : 0 };
k.mon = {}; k.prev = {};
D.months.forEach(function (x) { (x[0] === Y ? k.mon : k.prev)[x[1]] = { s: +x[2], c: +x[3], nc: +x[4] }; });
k.sales = 0; k.cost = 0; k.psales = 0;
for (m = M1; m <= M2; m++) { r = k.mon[m]; if (r) { k.sales += r.s; k.cost += r.c; } r = k.prev[m]; if (r) k.psales += r.s; }
k.gp = k.sales - k.cost; k.margin = ratio(k.gp, k.sales); k.growth = ratio(k.sales - k.psales, Math.abs(k.psales));
k.cust = D.customers.length;
k.annual = 0; k.periodT = 0; k.inScope = 0; k.outScope = 0; k.adj = 0; k.gapY = 0; k.onTrack = 0; k.ncls = 0;
k.total = D.classes.filter(function (c) { return c[0] === 'ALL'; })[0] || null;
if (k.total) {
k.ncls = 1; k.annual = +k.total[2]; k.periodT = k.annual / 12 * n;
D.classes.forEach(function (c) { k.inScope += +c[3]; });
k.adj = k.inScope; k.gapY = Math.max(0, k.annual - k.inScope); k.onTrack = k.inScope >= k.periodT ? 1 : 0;
} else D.classes.forEach(function (c) {
var tg = +c[2], s = +c[3], pt = tg / 12 * n;
if (tg > 0) { k.ncls++; k.annual += tg; k.periodT += pt; k.inScope += s; k.adj += Math.min(s, pt); k.gapY += Math.max(0, tg - s); if (s >= pt) k.onTrack++; }
else k.outScope += s;
});
k.ach = k.periodT > 0 ? k.adj / k.periodT * 100 : null;
k.short = Math.max(0, k.periodT - k.adj);
k.left = M1 === 1 ? 12 - M2 : -1;
k.reqMo = k.left > 0 ? k.gapY / k.left : null;
k.coll = {}; D.coll.forEach(function (x) { k.coll[x[0]] = x; });
k.collRows = [];
var last = null;
for (m = 1; m <= M2; m++) {
var key = Y + '-' + (m < 10 ? '0' : '') + m, pk = m === 1 ? (Y - 1) + '-12' : Y + '-' + (m - 1 < 10 ? '0' : '') + (m - 1);
var cur = k.coll[key], prv = k.coll[pk];
if (!cur) continue;
var oo = prv ? +prv[2] : 0, dnp = prv ? +prv[6] : 0, rc = +cur[4], ov = +cur[2], op = +cur[3], resp = oo + rc + dnp;
var row = { m: m, key: key, oo: oo, dnp: dnp, rc: rc, ov: ov, op: op, rec: oo + rc - op, coll: +cur[5], open: +cur[1], b150: +cur[7], nc: +cur[8], ni: +cur[9],
ach: resp >= MB && prv ? (1 - ov / resp) * 100 : null, recp: (oo + rc) >= MB && prv ? (oo + rc - op) / (oo + rc) * 100 : null, hasPrev: !!prv };
k.collRows.push(row);
if (m >= M1) last = row;
}
k.lastColl = last;
k.collected = 0; k.collRows.forEach(function (x) { if (x.m >= M1 && x.m <= M2) k.collected += x.coll; });
k.arOpen = 0; k.arOvd = 0; k.ar120 = 0; k.arRc = 0; k.arCust = 0; k.arCb = 0; k.arMap = {};
D.ar.forEach(function (a) { k.arMap[a[0]] = a; k.arOpen += +a[3]; k.arOvd += +a[4]; k.ar120 += +a[5]; k.arRc += +a[6]; k.arCb += +a[9]; if (+a[3] > 0) k.arCust++; });
k.risk = ratio(k.ar120, k.arOpen);
k.names = {}; D.customers.forEach(function (c) { k.names[c[0]] = c[1]; }); D.ar.forEach(function (a) { k.names[a[0]] = a[1]; });
k.xf = {}; k.xin = 0; k.xout = 0;
D.xfers.forEach(function (x) {
var p = k.xf[x[1]]; if (!p || x[0] >= p[0]) k.xf[x[1]] = x;
if (x[0].slice(0, 4) === String(Y)) { if (IN[x[3]]) k.xin++; else k.xout++; }
});
return k;
}
function xfPick(cc, mode) {
var x = K.xf[cc];
if (!x || x[0].slice(0, 4) !== String(Y)) return null;
if (mode === 'ar' && IN[x[3]]) return x;
if (mode === 'sales' && IN[x[2]]) return x;
return null;
}
function xfBadge(cc, mode) {
var x = xfPick(cc, mode);
if (!x) return '<span class="xf none">' + DASH + '</span>';
if (mode === 'ar') return '<span class="xf in" title="Received from ' + esc(x[5]) + ' (' + esc(x[2]) + ') on ' + dmy(x[0]) + ', balance moved ' + fm(+x[4]) + ' - the previous salesman created the older invoices">from ' + esc(x[5]) + SEP + dmy(x[0]) + '</span>';
return '<span class="xf out" title="Handed over to ' + esc(x[6]) + ' (' + esc(x[3]) + ') on ' + dmy(x[0]) + ', balance moved ' + fm(+x[4]) + ' - the receiving salesman follows this customer now">to ' + esc(x[6]) + SEP + dmy(x[0]) + '</span>';
}
function xfText(cc, mode) {
var x = xfPick(cc, mode);
if (!x) return '';
return (mode === 'ar' ? 'from ' + x[5] : 'to ' + x[6]) + ' on ' + dmy(x[0]);
}
function kpi(cls, label, value, sub, vcls) {
return '<div class="kpi ' + cls + '"><div class="label">' + label + '</div><div class="value' + (vcls ? ' ' + vcls : '') + '">' + value + '</div>' + (sub ? '<div class="sub">' + sub + '</div>' : '') + '</div>';
}
function money(v) { return fm(v); }
function rate(v, hi, mid) { return v === null ? DASH : '<span class="rate ' + (v >= hi ? 'ok' : (v >= mid ? 'mid' : 'low')) + '">' + pct(v) + '</span>'; }
function growthHtml(v) { return v === null ? '<span class="dim">no base</span>' : '<span class="pill ' + (v >= 0 ? 'pos' : 'neg') + '">' + (v >= 0 ? '&#9650; ' : '&#9660; ') + pct(Math.abs(v)) + '</span>'; }
function periodLabel() { return (M1 === M2 ? MON[M1 - 1] : MON[M1 - 1] + ' - ' + MON[M2 - 1]) + ' ' + Y; }
function render() {
K = compute();
badge.textContent = periodLabel() + (K.live ? ' (current month live)' : '');
cardL1.innerHTML = '<span class="ic-code">' + esc(sm[0].replace(/,/g, ' + ')) + '</span><span class="ic-name">' + esc(sm[1]) + '</span>' +
'<span class="ic-dv">' + esc(sm[4]) + (sm[5] ? ' ' + sm[5] + '%' : '') + '</span><span class="ic-wh"><bdi>' + esc(sm[2]) + '</bdi></span>';
var cells = [['Supervisor', esc(sm[3])], ['Period', esc(periodLabel()) + ' <i>' + K.n + ' month' + (K.n > 1 ? 's' : '') + '</i>'],
['Active customers', K.cust + ' <i>with sales in the period</i>'], ['Customers with balance', K.arCust + ' <i>today</i>'],
['Transfers ' + Y, (K.xin || K.xout ? K.xin + ' <i>received</i> ' + SEP + ' ' + K.xout + ' <i>handed over</i>' : DASH)]];
var h = '';
cells.forEach(function (c) { h += '<span class="ic-kv"><span class="ic-k">' + c[0] + '</span><span class="ic-v">' + c[1] + '</span></span>'; });
cardL2.innerHTML = h; cardHead.style.display = '';
kS.innerHTML = kpi('hero', 'Net sales', money(K.sales), growthHtml(K.growth) + 'vs ' + (Y - 1), 'v-navy') +
kpi('', 'Previous year', K.psales ? money(K.psales) : DASH, 'same months of ' + (Y - 1)) +
kpi('', 'Gross profit', money(K.gp), 'sales minus cost of goods', K.gp < 0 ? 'v-neg' : 'v-navy') +
kpi('', 'Gross margin', rate(K.margin, 30, 20), K.margin === null ? 'no base' : 'of net sales') +
kpi('', 'Monthly average', money(K.sales / K.n), K.n + ' month' + (K.n > 1 ? 's' : '')) +
kpi('', 'Active customers', String(K.cust), 'bought in the period', 'v-purple');
var kTg = document.getElementById('kTgNote');
if (kTg) kTg.textContent = K.total ? 'SAR, on the total' : 'SAR, capped per class';
if (K.annual > 0) {
var cls = K.ach === null ? '' : (K.ach >= 95 ? '' : (K.ach >= 80 ? 'mid' : 'low'));
kT.innerHTML = kpi('', 'Annual target', money(K.annual), K.total ? 'Total target' : K.ncls + ' classes with a target') +
kpi('', 'Period target', money(K.periodT), 'annual / 12 x ' + K.n + ' month' + (K.n > 1 ? 's' : '')) +
kpi('', 'Actual in scope', money(K.inScope), K.outScope > 0.005 ? '+ ' + fm(K.outScope) + ' outside scope' : 'all sales inside scope', 'v-navy') +
'<div class="kpi hero"><div class="label">Achievement' + (K.total ? '' : ' <span class="dim">capped</span>') + '</div><div class="value">' + rate(K.ach, 95, 80) + '</div>' +
'<div class="ach-bar ' + cls + '"><i style="width:' + (K.ach === null ? 0 : Math.min(100, Math.max(0, K.ach))) + '%"></i></div>' +
'<div class="sub">' + (K.total ? 'Total sales against the total target' : (K.periodT > 0 && K.inScope > 0 ? 'gross ' + pct(K.inScope / K.periodT * 100) + ', ' : '') + K.onTrack + ' of ' + K.ncls + ' classes on track') + '</div></div>' +
kpi('', 'Real shortfall', K.short < 1 ? '0' : money(-K.short), K.total ? 'Against the total target' : (K.short < 1 ? 'every class met its share' : 'sum of class shortfalls'), K.short >= 1 ? 'v-neg' : 'v-pos') +
kpi('', 'Needed / month', K.reqMo === null ? DASH : money(K.reqMo), K.left > 0 ? K.left + ' month' + (K.left > 1 ? 's' : '') + ' left to close ' + fm(K.gapY) : (K.left === 0 ? 'year complete' : 'start the period in January'), 'v-amber');
} else {
kT.innerHTML = '<div class="kpi k-none"><div class="label">No target for ' + Y + '</div><div class="sub">' +
(K.sales ? 'All ' + fm(K.sales) + ' SAR of sales fall outside any target scope - achievement is not measured for this salesman.' : 'Nothing to measure.') + '</div></div>';
}
var L = K.lastColl;
kC.innerHTML = kpi('hero', 'Closing overdue', L ? money(L.ov) : DASH, L ? 'end of ' + mlab(Y, L.m) : 'no archived month', L && L.ov > 0 ? 'v-neg' : '') +
kpi('', 'Collection achievement', L ? rate(L.ach, 80, 50) : DASH, L ? (L.ach === null ? 'base under 1,000' : 'month ' + MON[L.m - 1] + ', capped rule') : '') +
kpi('', 'Recovery of old overdue', L ? rate(L.recp, 80, 50) : DASH, L ? (L.recp === null ? 'base under 1,000' : fm(L.rec) + ' of ' + fm(L.oo + L.rc)) : '') +
kpi('', 'Collected in period', money(K.collected), 'archived months only', 'v-pos') +
kpi('', 'Open balance today', money(K.arOpen), K.arCust + ' customer' + (K.arCust === 1 ? '' : 's') + (K.arCb < -0.005 ? ', credit ' + fm(-K.arCb) : ''), 'v-navy') +
kpi('', 'Overdue today', money(K.arOvd), K.arOpen > 0 ? pct(K.arOvd / K.arOpen * 100) + ' of open' : DASH, K.arOvd > 0 ? 'v-neg' : '') +
kpi('', 'Older than 120 days', money(K.ar120), (K.risk === null ? DASH : pct(K.risk) + ' of open') + (K.arRc > 0 ? ', rtn chq ' + fm(K.arRc) : ''), K.ar120 > 0 ? 'v-amber' : '');
kpiPanel.style.display = '';
viewChips.style.display = '';
canExp(true);
note.textContent = '';
paintTable();
}
Array.prototype.forEach.call(viewChips.querySelectorAll('.chip'), function (b) {
b.addEventListener('click', function () {
view = b.getAttribute('data-v');
Array.prototype.forEach.call(viewChips.querySelectorAll('.chip'), function (x) { x.className = 'chip mini' + (x === b ? ' on' : ''); });
if (D) paintTable();
});
});
function head(cols) { var s = '<tr>'; cols.forEach(function (c) { s += '<th class="' + (c[1] || 'num') + '">' + c[0] + '</th>'; }); tHead.innerHTML = s + '</tr>'; }
function paintTable() {
var h = '', tot, cols, m, r, n = 0, rows = [], mode;
ROWS = { view: view, head: [], rows: [] };
pfEl.innerHTML = ['<b>' + esc(sm[0]) + '</b> ' + esc(sm[1]), esc(sm[2]), esc(periodLabel())].join('<span class="pf-sep">|</span>');
foot.textContent = '';
if (view === 'months') {
titleEl.textContent = 'Months';
cols = [['MONTH', 'txt'], ['NET SALES'], ['PREV YEAR'], ['GROWTH %'], ['COST'], ['GROSS PROFIT'], ['MARGIN %'], ['CUSTOMERS'], ['COLLECTED'], ['CLOSING OVERDUE']];
head(cols); tot = { s: 0, p: 0, c: 0, nc: 0, cl: 0 };
for (m = M1; m <= M2; m++) {
r = K.mon[m] || { s: 0, c: 0, nc: 0 }; var p = K.prev[m] ? K.prev[m].s : 0, cr = null;
K.collRows.forEach(function (x) { if (x.m === m) cr = x; });
tot.s += r.s; tot.p += p; tot.c += r.c; tot.cl += cr ? cr.coll : 0;
h += '<tr' + (m === K.live ? ' class="live" title="Current month: sales up to last night, no archived collection month yet"' : '') + '>' + tdt(mlab(Y, m)) + tdm(r.s) + tdm(p) + tdp(ratio(r.s - p, Math.abs(p))) +
tdm(r.c) + tdm(r.s - r.c) + tdp(ratio(r.s - r.c, r.s)) + tdi(r.nc) + tdm(cr ? cr.coll : 0) + tdm(cr ? cr.ov : 0) + '</tr>';
ROWS.rows.push([[mlab(Y, m), 0], [r.s, 6], [p, 6], [ratio(r.s - p, Math.abs(p)), 6], [r.c, 6], [r.s - r.c, 6], [ratio(r.s - r.c, r.s), 6], [r.nc, 7], [cr ? cr.coll : 0, 6], [cr ? cr.ov : 0, 6]]);
}
tBody.innerHTML = h;
tFoot.innerHTML = '<tr class="tot"><td>TOTAL</td>' + tdm(tot.s) + tdm(tot.p) + tdp(ratio(tot.s - tot.p, Math.abs(tot.p))) + tdm(tot.c) + tdm(tot.s - tot.c) + tdp(ratio(tot.s - tot.c, tot.s)) + '<td class="num">' + K.cust + '</td>' + tdm(tot.cl) + '<td class="num">' + DASH + '</td></tr>';
foot.textContent = 'Sales and cost from the nightly profit table (invoice salesman). Collected and closing overdue from the collection archive (current salesman of the customer).';
} else if (view === 'customers') {
titleEl.textContent = 'Customers';
cols = [['#', 'txt'], ['CODE', 'txt'], ['CUSTOMER', 'txt'], ['DIVISION', 'txt'], ['NET SALES'], ['SHARE %'], ['GROSS PROFIT'], ['MARGIN %'], ['LAST SALE', 'txt'], ['OPEN TODAY'], ['OVERDUE TODAY'], ['NOW WITH', 'txt']];
head(cols); tot = { s: 0, c: 0, op: 0, ov: 0 };
D.customers.forEach(function (c) {
var s = +c[3], cs = +c[4], a = K.arMap[c[0]], op = a ? +a[3] : 0, ov = a ? +a[4] : 0; n++;
tot.s += s; tot.c += cs; tot.op += op; tot.ov += ov;
h += '<tr><td class="seq">' + n + '</td>' + tdt(c[0], 'code') + tdt(c[1], 'nm') + tdt(c[2], 'dim') + tdm(s) + tdp(ratio(s, K.sales)) + tdm(s - cs) + tdp(ratio(s - cs, s)) +
tdt(mlab(Y, +c[5])) + tdm(op) + tdm(ov) + '<td class="txt">' + xfBadge(c[0], 'sales') + '</td></tr>';
ROWS.rows.push([[n, 7], [c[0], 3], [c[1], 0], [c[2], 0], [s, 6], [ratio(s, K.sales), 6], [s - cs, 6], [ratio(s - cs, s), 6], [mlab(Y, +c[5]), 0], [op, 6], [ov, 6], [xfText(c[0], 'sales'), 0]]);
});
tBody.innerHTML = h || '<tr><td colspan="12" class="txt dim">No sales in the period.</td></tr>';
tFoot.innerHTML = '<tr class="tot"><td colspan="4">TOTAL ' + n + ' customers</td>' + tdm(tot.s) + '<td class="num">100.0%</td>' + tdm(tot.s - tot.c) + tdp(ratio(tot.s - tot.c, tot.s)) + '<td></td>' + tdm(tot.op) + tdm(tot.ov) + '<td></td></tr>';
foot.textContent = 'Sales by invoice salesman. Open and overdue only while the customer is still with this salesman. NOW WITH: customers handed over to another salesman in ' + Y + ' (he follows them now).';
} else if (view === 'classes') {
titleEl.textContent = 'Classes';
cols = [['#', 'txt'], ['CLASS', 'txt'], ['NAME', 'txt'], ['ANNUAL TARGET'], ['PERIOD TARGET'], ['ACTUAL'], ['ACH %'], ['VARIANCE'], ['GROSS PROFIT'], ['MARGIN %']];
head(cols); tot = { t: 0, pt: 0, s: 0, adj: 0, c: 0 };
D.classes.forEach(function (c) {
var tg = +c[2], s = +c[3], cs = +c[4], pt = tg / 12 * K.n, ach = tg > 0 ? Math.min(s, pt) / pt * 100 : null;
if (c[0] === 'ALL') { tot.t += tg; tot.pt += pt; return; }
n++;
tot.t += tg; tot.pt += pt; tot.s += s; tot.c += cs; if (tg > 0) tot.adj += Math.min(s, pt);
h += '<tr' + (tg > 0 ? '' : ' class="live" title="No target for this class: outside the target scope"') + '><td class="seq">' + n + '</td>' + tdt(c[0], 'code') + tdt(c[1], 'nm') + tdm(tg) + tdm(pt) + tdm(s) +
'<td class="num pct ' + (ach === null ? 'dim' : (ach >= 95 ? 'pos' : (ach < 80 ? 'neg' : ''))) + '">' + (ach === null ? (K.total ? DASH : 'out of scope') : pct(ach)) + '</td>' +
(tg > 0 ? tdm(s - pt) : '<td class="num z">' + DASH + '</td>') + tdm(s - cs) + tdp(ratio(s - cs, s)) + '</tr>';
ROWS.rows.push([[n, 7], [c[0], 3], [c[1], 0], [tg, 6], [pt, 6], [s, 6], [ach, 6], [tg > 0 ? s - pt : null, 6], [s - cs, 6], [ratio(s - cs, s), 6]]);
});
tBody.innerHTML = h || '<tr><td colspan="10" class="txt dim">No classes.</td></tr>';
tFoot.innerHTML = '<tr class="tot"><td colspan="3">TOTAL ' + n + ' classes</td>' + tdm(tot.t) + tdm(tot.pt) + tdm(tot.s) + '<td class="num pct">' + (tot.pt > 0 ? pct((K.total ? tot.s : tot.adj) / tot.pt * 100) : DASH) + '</td>' + tdm(tot.s - tot.pt) + tdm(tot.s - tot.c) + tdp(ratio(tot.s - tot.c, tot.s)) + '</tr>';
foot.textContent = K.total ? 'Judged on the total target. Sales by class are for information.' : 'ACH % is capped per class (over-target sales do not compensate other classes), as on the Target page. Period target = annual / 12 x months in the period.';
} else if (view === 'coll') {
titleEl.textContent = 'Collection';
cols = [['MONTH', 'txt'], ['OPENING OVERDUE'], ['RTN CHQ'], ['DUE IN MONTH'], ['CLOSING OVERDUE'], ['RECOVERED'], ['ACHIEVEMENT %'], ['RECOVERY %'], ['COLLECTED'], ['OPEN BALANCE'], ['> 150 DAYS'], ['CUSTOMERS'], ['INVOICES']];
head(cols);
K.collRows.forEach(function (x) {
h += '<tr' + (x.m >= M1 && x.m <= M2 ? ' class="cur"' : '') + '>' + tdt(mlab(Y, x.m)) + tdm(x.oo) + tdm(x.rc) + tdm(x.dnp) + tdm(x.ov) + tdm(x.rec) + tdp(x.ach) + tdp(x.recp) + tdm(x.coll) + tdm(x.open) + tdm(x.b150) + tdi(x.nc) + tdi(x.ni) + '</tr>';
ROWS.rows.push([[mlab(Y, x.m), 0], [x.oo, 6], [x.rc, 6], [x.dnp, 6], [x.ov, 6], [x.rec, 6], [x.ach, 6], [x.recp, 6], [x.coll, 6], [x.open, 6], [x.b150, 6], [x.nc, 7], [x.ni, 7]]);
});
tBody.innerHTML = h || '<tr><td colspan="13" class="txt dim">No archived month for this salesman in ' + Y + '.</td></tr>';
tFoot.innerHTML = '';
foot.textContent = 'Archived months only, by the current salesman of the customer. Achievement = 1 - closing / (opening + rtn chq + due in month); Recovery = (opening + rtn chq - remaining old) / (opening + rtn chq). Rows in the selected period are shaded.';
} else {
titleEl.textContent = 'Open invoices today';
cols = [['#', 'txt'], ['CODE', 'txt'], ['CUSTOMER', 'txt'], ['DIVISION', 'txt'], ['OPEN'], ['OVERDUE'], ['> 120 DAYS'], ['RTN CHQ'], ['INVOICES'], ['OLDEST (DAYS)'], ['CREDIT BAL'], ['FROM', 'txt']];
head(cols); tot = { op: 0, ov: 0, g: 0, rc: 0, ni: 0, cb: 0 };
D.ar.forEach(function (a) {
n++; tot.op += +a[3]; tot.ov += +a[4]; tot.g += +a[5]; tot.rc += +a[6]; tot.ni += +a[7]; tot.cb += +a[9];
h += '<tr><td class="seq">' + n + '</td>' + tdt(a[0], 'code') + tdt(a[1], 'nm') + tdt(a[2], 'dim') + tdm(+a[3]) + tdm(+a[4]) + tdm(+a[5]) + tdm(+a[6]) + tdi(+a[7]) + tdi(+a[8]) + tdm(+a[9]) + '<td class="txt">' + xfBadge(a[0], 'ar') + '</td></tr>';
ROWS.rows.push([[n, 7], [a[0], 3], [a[1], 0], [a[2], 0], [+a[3], 6], [+a[4], 6], [+a[5], 6], [+a[6], 6], [+a[7], 7], [+a[8], 7], [+a[9], 6], [xfText(a[0], 'ar'), 0]]);
});
tBody.innerHTML = h || '<tr><td colspan="12" class="txt dim">No open balance today.</td></tr>';
tFoot.innerHTML = '<tr class="tot"><td colspan="4">TOTAL ' + n + ' customers</td>' + tdm(tot.op) + tdm(tot.ov) + tdm(tot.g) + tdm(tot.rc) + tdi(tot.ni) + '<td></td>' + tdm(tot.cb) + '<td></td></tr>';
foot.textContent = 'Nightly receivables snapshot, customers currently assigned to this salesman. Overdue by the customer card terms; age from the invoice date. FROM: customers received by transfer in ' + Y + ' (the previous salesman created the older invoices).';
}
ROWS.head = cols.map(function (c) { return c[0]; });
}
function runPrint(tableOnly) {
if (!D) { alert('Run the card first.'); return; }
var orig = document.title;
document.title = 'Salesman Card - ' + sm[1] + (tableOnly ? ' - ' + titleEl.textContent : ' - Dashboard') + ' - ' + periodLabel();
if (tableOnly) document.body.classList.add('print-mode-table');
var back = function () {
document.title = orig; document.body.classList.remove('print-mode-table');
window.removeEventListener('afterprint', back);
};
window.addEventListener('afterprint', back);
window.print();
}
function doPrint() { runPrint(true); }
var dashBtn = document.getElementById('printDashBtn');
if (dashBtn) dashBtn.addEventListener('click', function () { runPrint(false); });
function grpTxt() {
var s = document.getElementById('jmHdrGroup'), e = document.querySelector('.jm-hdr-grp'),
g = s && s.selectedIndex >= 0 ? s.options[s.selectedIndex].text : (e ? e.textContent : '');
g = (g || '').replace(/^\s+|\s+$/g, '');
return g ? ' - Data group: ' + g : '';
}
function doExcel() {
if (!D || !ROWS) { alert('Run the card first.'); return; }
if (!window.smExcel) return;
window.smExcel({
name: 'Salesman_Card_' + sm[0].replace(/,/g, '-') + '_' + view + '_' + Y + '_' + M1 + '-' + M2 + '.xlsx',
sheet: titleEl.textContent.slice(0, 30),
title: 'Salesman Card - ' + sm[0] + ' ' + sm[1] + ' - ' + sm[2] + ' - ' + titleEl.textContent + ' - ' + periodLabel() + grpTxt(),
head: ROWS.head, rows: ROWS.rows
});
}
(function () {
var box = document.getElementById('exportBox');
if (!box) return;
if (window.jmExport) { window.jmExport.attach(box, { pdf: doPrint, excel: doExcel }); return; }
box.innerHTML = '<button type="button" class="btn-print btn-excel" id="excelBtn" disabled>Export Excel</button> ' +
'<button type="button" class="btn-print" id="printTableBtn" disabled>Print / PDF</button>';
excelBtn = document.getElementById('excelBtn'); printBtn = document.getElementById('printTableBtn');
excelBtn.addEventListener('click', doExcel);
printBtn.addEventListener('click', doPrint);
})();
(function () {
var hs = String(window.location.hash || ''), p = {}, r;
if (hs.length < 2) return;
hs.slice(1).split('&').forEach(function (kv) { var a = kv.split('='); if (a.length === 2) p[a[0]] = decodeURIComponent(a[1]); });
if (!p.s || !CODE[p.s]) return;
if (p.y && +p.y >= META.minYear && +p.y <= META.year) { Y = +p.y; fYear.value = p.y; paintYears(); }
if (p.f) fM1.value = String(Math.max(1, Math.min(12, +p.f)));
if (p.t) fM2.value = String(Math.max(1, Math.min(12, +p.t)));
pickSm(CODE[p.s], CODE[p.s].reps.length > 1 ? p.s : ''); runBtn.click();
})();
}
initSmCard();

});
