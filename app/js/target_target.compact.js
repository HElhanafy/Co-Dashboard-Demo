window.addEventListener("DOMContentLoaded",function(){
function initTargetDashboard() {
const dataEl = document.getElementById('target-data');
if (!dataEl) {
initTargetDashboard._t = (initTargetDashboard._t || 0) + 1;
if (initTargetDashboard._t < 100) { setTimeout(initTargetDashboard, 100); return; }
console.error('Target dashboard: data region not found.');
return;
}
const DATA = JSON.parse(dataEl.textContent);
const BASE_YEAR = DATA.baseYear || 2023;
const MONTHS = ['01','02','03','04','05','06','07','08','09','10','11','12'];
const MLAB = { '01':'January','02':'February','03':'March','04':'April','05':'May','06':'June',
'07':'July','08':'August','09':'September','10':'October','11':'November','12':'December' };
const fmt = n => Math.round(n).toLocaleString('en-US');
const esc = s => String(s).replace(/[&<>"]/g, m =>
({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[m]));
function idxOf(arr, v) { for (let i = 0; i < arr.length; i++) if (arr[i] === v) return i; return -1; }
function toMap(list, keyF, valF) {
const m = {};
for (let i = 0; i < list.length; i++) { m[keyF(list[i])] = valF(list[i]); }
return m;
}
const DEPT_NAME  = toMap(DATA.depts,   x => x.c, x => x.n);
const DEPT_CODE  = toMap(DATA.depts,   x => x.n, x => x.c);      // the dominant division of a salesman arrives as a name
const AREA_NAME  = toMap(DATA.areas,   x => String(x.c), x => x.n);
const SUP_NAME   = toMap(DATA.sups,    x => x.c, x => x.n);
const REP_NAME   = toMap(DATA.reps,    x => String(x.c), x => x.n);
const REP_AREA   = toMap(DATA.reps,    x => String(x.c), x => String(x.a));
const REP_SUP    = toMap(DATA.reps,    x => String(x.c), x => x.s);
const REP_DEPT   = toMap(DATA.reps,    x => String(x.c), x => DEPT_CODE[x.d] || 'NA');
const CLASS_NAME = toMap(DATA.classes, x => String(x.c), x => x.n);
const SEC_NAME = { P: 'Private Sector', G: 'Government Sector' };
const secOf = d => (d === '3001' ? 'G' : 'P');
const TGT = [];
for (let i = 0; i < DATA.tgts.length; i++) {
const a = DATA.tgts[i], rep = String(a[1]);
const d = a[4] || REP_DEPT[rep] || 'NA';
TGT.push({ y: String(a[0]), r: rep, c: String(a[2]), d: d, s: secOf(d), t: a[3] });
}
const ACT = [];
for (let i = 0; i < DATA.recs.length; i++) {
const a = DATA.recs[i], mi = a[0];
ACT.push({ y: String(BASE_YEAR + Math.floor(mi / 12)), mi: mi % 12, d: a[1], s: secOf(a[1]), r: String(a[2]), c: String(a[3]), v: a[4] });
}
function fld(r, level) {
if (level === 'SECTOR') return r.s;
if (level === 'DEPT')  return r.d;
if (level === 'AREA')  return REP_AREA[r.r] || '0';
if (level === 'SUP')   return REP_SUP[r.r] || r.r;
if (level === 'REP')   return r.r;
return r.c;
}
function nameOf(level, code) {
if (level === 'SECTOR') return SEC_NAME[code];
if (level === 'DEPT')  return DEPT_NAME[code] || code;
if (level === 'AREA')  return AREA_NAME[code] || (code === '0' ? '-' : code);
if (level === 'SUP')   return SUP_NAME[code] || REP_NAME[code] || code;
if (level === 'REP')   return REP_NAME[code] || code;
return CLASS_NAME[code] || code;
}
function band(p) { return p >= 95 ? 'hi' : (p >= 80 ? 'mid' : 'low'); }
function achCell(actual, target) {
if (!target) return '<span class="a-na">&mdash;</span>';
const p = (actual / target) * 100;
return '<div class="ac-cell a-' + band(p) + '"><span class="ac-bar"><i style="width:' +
Math.max(0, Math.min(100, p)).toFixed(0) + '%"></i></span>' + p.toFixed(1) + '%</div>';
}
const yearSel = document.getElementById('fYear');
const years = [];
TGT.forEach(r => { if (idxOf(years, r.y) === -1) years.push(r.y); });
years.sort();
years.forEach(y => {
const o = document.createElement('option'); o.value = y; o.textContent = y;
yearSel.appendChild(o);
});
yearSel.value = years[years.length - 1];
const mFrom = document.getElementById('fMonthFrom'), mTo = document.getElementById('fMonthTo');
MONTHS.forEach(m => {
const a = document.createElement('option'); a.value = m; a.textContent = MLAB[m]; mFrom.appendChild(a);
const b = document.createElement('option'); b.value = m; b.textContent = MLAB[m]; mTo.appendChild(b);
});
mFrom.value = '01';
mTo.value = MONTHS[new Date().getMonth()];
function monthRange() {
const i = idxOf(MONTHS, mFrom.value), j = idxOf(MONTHS, mTo.value);
const lo = Math.min(i, j), hi = Math.max(i, j);
return { lo: lo, hi: hi, count: hi - lo + 1 };
}
function periodText() {
const mr = monthRange();
return 'Year: ' + yearSel.value + ' (' + MLAB[MONTHS[mr.lo]] + ' - ' + MLAB[MONTHS[mr.hi]] + ')';
}
function periodKeys() {
const mr = monthRange();
return { from: yearSel.value + '-' + MONTHS[mr.lo], to: yearSel.value + '-' + MONTHS[mr.hi] };
}
let scope = {};
let currentLevel = 'SECTOR';
let drillStack = [];
let sortKey = 'total', sortDir = -1;
function resetSort() { sortKey = 'total'; sortDir = -1; classFlt = 'ALL'; }
let classFlt = 'ALL';
const FLT = { ALL: 'All', UP: 'Above 90%', DOWN: 'Below 90%' };
const showFlt = () => currentLevel === 'CLASS' && !grossAt('CLASS');
function fltRows(list) {
if (!showFlt() || classFlt === 'ALL') return list;
return list.filter(r => r.salesPct !== null && (classFlt === 'UP' ? r.salesPct >= 90 : r.salesPct < 90));
}
const TAB_LABEL = { SECTOR: 'Sector', DEPT: 'Division', AREA: 'Area', SUP: 'Salesman', REP: 'Salesman', CLASS: 'Class' };
const LABEL = { SECTOR: 'SECTOR', DEPT: 'DIVISION', AREA: 'AREA', SUP: 'SALESMAN', REP: 'SALESMAN', CLASS: 'CLASS' };
function grossAt(level) {
if (scope.sec === 'G' || level === 'SECTOR' || level === 'DEPT' || level === 'AREA') return true;
return level === 'CLASS' && !scope.sup && !scope.rep;
}
function tabsFor(s) {
if (s.rep)  return ['CLASS'];
if (s.sec === 'G') return ['REP'];
if (s.sup)  return ['REP', 'CLASS'];       // Salesman appears only inside a supervisor
if (s.area) return ['SUP', 'CLASS'];
if (s.dept) return ['AREA', 'SUP', 'CLASS'];
return s.sec ? ['DEPT'] : ['SECTOR'];
}
function cloneScope(s) { const o = {}; for (const k in s) o[k] = s[k]; return o; }
function pushState() { drillStack.push({ level: currentLevel, scope: cloneScope(scope) }); }
function goBack() {
if (!drillStack.length) return;
const st = drillStack.pop();
currentLevel = st.level; scope = st.scope;
resetSort();
render();
}
function renderTabs() {
const tabs = tabsFor(scope);
const bar = document.getElementById('levelTabs');
const flt = showFlt();
bar.style.display = tabs.length > 1 || flt ? '' : 'none';
bar.innerHTML = (tabs.length > 1 ? tabs.map(t =>
'<button type="button" class="lvl-btn' + (t === currentLevel ? ' active' : '') +
'" data-level="' + t + '">' + TAB_LABEL[t] + '</button>'
).join('') : '') + (flt ? Object.keys(FLT).map((k, i) =>
'<button type="button" class="lvl-btn' + (k === classFlt ? ' active' : '') + '" data-flt="' + k + '"' +
(i === 0 && tabs.length > 1 ? ' style="margin-inline-start:14px"' : '') + '>' + FLT[k] + '</button>'
).join('') : '');
bar.querySelectorAll('.lvl-btn').forEach(btn => {
btn.addEventListener('click', () => {
if (btn.dataset.flt) { classFlt = btn.dataset.flt; render(); return; }
currentLevel = btn.dataset.level;
resetSort();
render();
});
});
document.getElementById('backBtn').style.display = drillStack.length ? '' : 'none';
}
function crumbParts() {
const p = [];
if (scope.secName)  p.push(scope.secName);
if (scope.deptName) p.push(scope.deptName);
if (scope.areaName) p.push(scope.areaName);
if (scope.supName)  p.push(scope.supName);
if (scope.repName)  p.push(scope.repName);
return p;
}
const SEP = String.fromCharCode(8250);
function crumbText() { return crumbParts().join(' ' + SEP + ' '); }
function crumbHtml() {
const p = crumbParts();
return p.map((x, i) =>
'<span class="crumb' + (i === p.length - 1 ? ' crumb-last' : '') + '">' + esc(x) + '</span>'
).join('<span class="crumb-sep">' + SEP + '</span>');
}
function drillInto(level, code, name) {
pushState();
if (level === 'SECTOR') {
scope.sec = code; scope.secName = String(name).toUpperCase(); currentLevel = code === 'G' ? 'REP' : 'DEPT';
} else if (level === 'DEPT') {
scope.dept = code; scope.deptName = String(name).toUpperCase(); currentLevel = 'AREA';
} else if (level === 'AREA') {
scope.area = code; scope.areaName = name; currentLevel = 'SUP';
} else if (level === 'SUP') {
scope.sup = code; scope.supName = name; currentLevel = 'REP';
const one = build('REP');
if (one.length === 1) {
scope.rep = one[0].code; scope.repName = one[0].name; currentLevel = 'CLASS';
if (one[0].name === name) scope.supName = '';
}
} else if (level === 'REP') {
scope.rep = code; scope.repName = name; currentLevel = 'CLASS';
}
resetSort();
render();
}
function keep(r) {
return (!scope.sec  || r.s === scope.sec) &&
(!scope.dept || r.d === scope.dept) &&
(!scope.area || (REP_AREA[r.r] || '0') === scope.area) &&
(!scope.sup  || (REP_SUP[r.r] || r.r) === scope.sup) &&
(!scope.rep  || r.r === scope.rep);
}
function tRows() {
const y = yearSel.value;
return TGT.filter(r => r.y === y && keep(r));
}
function aRows() {
const y = yearSel.value, mr = monthRange();
return ACT.filter(r => r.y === y && r.mi >= mr.lo && r.mi <= mr.hi && keep(r));
}
function aRowsYear() {
const y = yearSel.value;
return ACT.filter(r => r.y === y && keep(r));
}
let scopeYear = null, SCOPE = null;
function scopeSet() {
const y = yearSel.value;
if (scopeYear === y) return SCOPE;
SCOPE = {};
TGT.forEach(r => { if (r.y === y && r.t > 0) SCOPE[r.r + '|' + r.c] = 1; });
scopeYear = y;
return SCOPE;
}
const inScope = r => scopeSet()[r.r + '|' + r.c] === 1;
const tkey = r => r.r + '|' + r.c;
function monthsLeft() { return Math.max(0, 12 - monthRange().hi - 1); }
function metrics(code, name, cls, gross) {
const mr = monthRange(), share = mr.count / 12, left = monthsLeft();
let annual = 0, actual = 0, out = 0, adj = 0, gapY = 0, yt = 0, onTrack = 0, withT = 0;
Object.keys(cls).forEach(k => {
const v = cls[k], pt = v.t * share;
annual += v.t;
actual += v.a;
out    += v.x;
yt     += v.yt;
if (v.t > 0) {
withT++;
adj  += Math.min(v.a, pt);              // over-target is cut off here
gapY += Math.max(0, v.t - (v.ya || 0)); // and here, per class
if (v.a >= pt) onTrack++;
}
});
const periodT = annual * share, total = actual + out;
if (gross) { adj = total; gapY = Math.max(0, annual - yt); }
return {
code: code, name: name,
annual: annual, periodT: periodT, actual: actual, out: out, adj: adj, total: total, yt: yt,
over: gross ? 0 : actual - adj,   // the excess that was cut off, per class
variance: actual - periodT,
adjVar: adj - periodT,
gapP: periodT - adj,
gapY: gapY,
reqMo: left > 0 ? gapY / left : gapY,
ach: periodT ? (adj / periodT) * 100 : null,
salesPct: periodT ? (total / periodT) * 100 : null,
runRate: mr.count ? (actual / mr.count) * 12 : 0,
onTrack: onTrack, classes: withT
};
}
function build(level) {
const box = {};           // entity code -> { name, cls: {rep|cls: {t, a, x, ya}} }
const ent = k => (box[k] || (box[k] = { name: nameOf(level, k), cls: {} }));
const cell = (k, c) => {
const e = ent(k);
return e.cls[c] || (e.cls[c] = { t: 0, a: 0, x: 0, ya: 0, yt: 0 });
};
const gross = grossAt(level);
tRows().forEach(r => { if (level !== 'CLASS' || r.c !== 'ALL') cell(fld(r, level), tkey(r)).t += r.t; });
aRows().forEach(r => {
const v = cell(fld(r, level), tkey(r));
if (inScope(r)) v.a += r.v; else v.x += r.v;
});
aRowsYear().forEach(r => {
const v = cell(fld(r, level), tkey(r));
v.yt += r.v;
if (inScope(r)) v.ya += r.v;
});
return Object.keys(box).map(k => metrics(k, box[k].name, box[k].cls, gross));
}
function monthlyActual() {
const mr = monthRange(), out = [];
for (let i = mr.lo; i <= mr.hi; i++) out.push(0);
aRows().forEach(r => { out[r.mi - mr.lo] += r.v; });
return out;
}
function ring(p) {
const c = 2 * Math.PI * 34, v = p === null ? 0 : Math.max(0, Math.min(100, p));
return '<div class="ring-box"><svg class="ring r-' + (p === null ? 'na' : band(p)) + '" viewBox="0 0 84 84"><circle class="rb" cx="42" cy="42" r="34"/>' +
'<circle class="rv" cx="42" cy="42" r="34" stroke-dasharray="' + (c * v / 100).toFixed(1) + ' ' + c.toFixed(1) + '" transform="rotate(-90 42 42)"/></svg>' +
'<b class="rp">' + (p === null ? '&mdash;' : p.toFixed(1) + '%') + '</b></div>';
}
const signed = n => (n > 0 ? '+' : '') + fmt(n);
function wholeCard(cls, name, r) {
const p = r.periodT ? (r.adj / r.periodT) * 100 : null;
return '<div class="kpi sc ' + cls + '"><div class="sc-top">' + ring(p) + '<div class="sc-main"><div class="label">' + name + '</div>' +
'<div class="value">' + fmt(r.total) + ' <span class="cur">SAR</span></div></div></div><div class="sc-stats">' +
'<div><span>Period Target</span><b>' + fmt(r.periodT) + '</b></div>' +
'<div><span>Variance</span><b class="' + (r.adjVar < 0 ? 'neg' : 'pos') + '">' + signed(r.adjVar) + '</b></div>' +
'<div><span>Needed / month</span><b>' + fmt(r.gapY > 0 ? r.reqMo : 0) + '</b></div></div></div>';
}
function paintKpis() {
const box = document.getElementById('kpiContainer');
const strip = !scope.sec ? '' :
'<div class="kpi k-cust"><span class="label">Current Scope</span><span class="scope-path">' + crumbHtml() + '</span>' +
'<span class="scope-note">Figures below reflect this scope</span></div>';
if (!scope.sec || (scope.sec === 'P' && !scope.dept)) {
const lv = scope.sec ? 'DEPT' : 'SECTOR', rows = build(lv), t = totalOf(rows), m = {}, none = metrics('', '', {}, true);
rows.forEach(r => { m[r.code] = r; });
box.className = 'kpi-row kr3';
box.innerHTML = strip + (scope.sec
? wholeCard('k-fcst', SEC_NAME.P, t) + wholeCard('k-act', DEPT_NAME['1001'], m['1001'] || none) + wholeCard('k-ptgt', DEPT_NAME['2001'], m['2001'] || none)
: wholeCard('k-fcst', 'Company', t) + wholeCard('k-act', SEC_NAME.P, m.P || none) + wholeCard('k-ptgt', SEC_NAME.G, m.G || none));
return;
}
const gross = grossAt('CLASS'), t = totalOf(build(gross ? 'DEPT' : 'REP'));
const ach = t.periodT ? (t.adj / t.periodT) * 100 : null, sold = t.periodT ? (t.total / t.periodT) * 100 : null;
const gapP = t.periodT - t.adj, tag = gross ? '' : ' <span class="tag-scope">capped</span>';
box.className = 'kpi-row kr4';
box.innerHTML = strip +
'<div class="kpi sc k-ach"><div class="sc-top">' + ring(ach) + '<div class="sc-main"><div class="label">Achievement' + tag + '</div>' +
'<div class="sub note-cap">' + (gross ? 'Total sales against the period target'
: (sold === null ? 'Over-target sales excluded per class' : 'Total sold ' + sold.toFixed(1) + '% of the period target')) + '</div></div></div></div>' +
'<div class="kpi k-act"><div class="label">Total Sales</div>' +
'<div class="value">' + fmt(t.total) + ' <span class="cur">SAR</span></div>' +
'<div class="sub">' + (gross ? 'All sales of this scope' : 'Achieved ' + fmt(t.adj) + ' + over target ' + fmt(t.over) + ' + out of scope ' + fmt(t.out)) + '</div>' +
(window.targetSpark ? window.targetSpark(monthlyActual()) : '') + '</div>' +
'<div class="kpi k-ptgt"><div class="label">Period Target</div>' +
'<div class="value">' + fmt(t.periodT) + ' <span class="cur">SAR</span></div>' +
'<div class="sub">Annual target ' + fmt(t.annual) + '</div></div>' +
'<div class="kpi k-gap"><div class="label">' + (gross ? 'Period Variance' : 'Real Shortfall') + tag + '</div>' +
'<div class="value' + (gapP >= 1 ? ' v-neg' : '') + '">' + (gross ? signed(-gapP) : (gapP < 1 ? '0' : fmt(-gapP))) + ' <span class="cur">SAR</span></div>' +
'<div class="sub">Needed per month ' + fmt(t.reqMo) + '</div></div>';
}
function drawChart() {
const panel = document.getElementById('chartPanel'), svg = document.getElementById('chSvg');
if (!panel || !svg || !window.targetChart) return;
const show = !scope.dept && !scope.rep;
panel.style.display = show ? '' : 'none';
if (!show) return;
const mr = monthRange(), tr = window.jmT || (x => x), lab = [];
for (let i = mr.lo; i <= mr.hi; i++) { const n = tr(MLAB[MONTHS[i]]); lab.push(n === MLAB[MONTHS[i]] ? n.slice(0, 3) : n); }
let annual = 0;
tRows().forEach(r => { annual += r.t; });
window.targetChart(svg, { labels: lab, cur: monthlyActual(), target: annual / 12 });
}
function cols(name, gross) {
if (gross) return [
{ k:'name',     t:name, txt:true },
{ k:'annual',   t:'ANNUAL<br>TARGET' },
{ k:'periodT',  t:'PERIOD<br>TARGET' },
{ k:'total',    t:'TOTAL<br>SALES' },
{ k:'ach',      t:'ACH %' },
{ k:'adjVar',   t:'VARIANCE' },
{ k:'reqMo',    t:'NEEDED<br>/ MONTH' }
];
return [
{ k:'name',    t:name, txt:true },
{ k:'annual',  t:'ANNUAL<br>TARGET' },
{ k:'periodT', t:'PERIOD<br>TARGET' },
{ k:'adj',     t:'ACHIEVED<br>(CAPPED)' },
{ k:'ach',     t:'ACH %<br>(REAL)' },
{ k:'over',    t:'ABOVE<br>TARGET' },
{ k:'out',     t:'OUT OF<br>SCOPE' },
{ k:'total',   t:'TOTAL<br>SALES' },
{ k:'salesPct', t:'SALES<br>%' },
{ k:'adjVar',  t:'REAL<br>SHORTFALL' },
{ k:'reqMo',   t:'NEEDED<br>/ MONTH' }
];
}
function rowHtml(r, gross, extra, nameHtml) {
const head = '<tr' + (extra || '') + '>' +
'<td>' + (nameHtml || esc(r.name)) + '</td>' +
'<td class="num">' + fmt(r.annual) + '</td>' +
'<td class="num">' + fmt(r.periodT) + '</td>';
const tail = '<td class="num">' + (r.gapY > 0 ? fmt(r.reqMo) : '0') + '</td></tr>';
if (gross) return head +
'<td class="num ts">' + fmt(r.total) + '</td>' +
'<td class="num">' + achCell(r.adj, r.periodT) + '</td>' +
'<td class="num' + (r.adjVar < 0 ? ' neg' : ' pos') + '">' + signed(r.adjVar) + '</td>' + tail;
return head +
'<td class="num">' + fmt(r.adj) + '</td>' +
'<td class="num">' + achCell(r.adj, r.periodT) + '</td>' +
'<td class="num' + (r.over > 0 ? ' pos' : '') + '">' + (r.over > 0 ? '+' + fmt(r.over) : '0') + '</td>' +
'<td class="num oos">' + (r.out ? fmt(r.out) : '&mdash;') + '</td>' +
'<td class="num ts">' + fmt(r.total) + '</td>' +
'<td class="num ts">' + (r.periodT ? (r.total / r.periodT * 100).toFixed(1) + '%' : '&mdash;') + '</td>' +
'<td class="num' + (r.adjVar < 0 ? ' neg' : '') + '">' + fmt(r.adjVar) + '</td>' + tail;
}
function totalOf(list) {
const t = { name:'TOTAL', annual:0, periodT:0, actual:0, out:0, adj:0, total:0, yt:0, over:0,
variance:0, adjVar:0, gapP:0, gapY:0, reqMo:0 };
list.forEach(r => {
t.annual += r.annual; t.periodT += r.periodT; t.actual += r.actual;
t.out += (r.out || 0); t.adj += (r.adj || 0); t.over += (r.over || 0);
t.total += r.total; t.yt += r.yt;
t.variance += r.variance; t.adjVar += r.adjVar; t.gapP += r.gapP;
t.gapY += r.gapY; t.reqMo += r.reqMo;
});
if (list.length && grossAt(currentLevel)) {   // a surplus nets a shortfall on a total, only the salesman is capped
const left = monthsLeft();
t.gapY = Math.max(0, t.annual - t.yt);
t.reqMo = left > 0 ? t.gapY / left : t.gapY;
}
return t;
}
let lastRows = [];
function drawFlat(list, level) {
lastRows = list;
list.sort((a, b) => {
const x = a[sortKey], y = b[sortKey];
if (x === null) return 1;
if (y === null) return -1;
if (x === y) return 0;
return (x < y ? -1 : 1) * sortDir;
});
const canDrill = level !== 'CLASS';
const gross = grossAt(level);
const c = cols(LABEL[level], gross);
let head = '<tr class="print-title-row"><th colspan="' + c.length + '">' + esc(printTitle()) + '</th></tr><tr>';
c.forEach(x => {
head += '<th class="' + (x.txt ? '' : 'num') + ' ' +
(sortKey === x.k ? 'sorted' + (sortDir === 1 ? ' asc' : '') : '') +
'" data-k="' + x.k + '">' + x.t + '</th>';
});
document.getElementById('tableHead').innerHTML = head + '</tr>';
let body = '';
list.forEach((r, i) => {
const disp = level === 'DEPT' || level === 'SECTOR' ? String(r.name).toUpperCase() : r.name;
const nameHtml = (canDrill ? '<span class="tw">&#9656;</span> ' : '') + esc(disp);
body += rowHtml(r, gross, canDrill ? ' class="drill-row" data-i="' + i + '"' : '', nameHtml);
});
if (!list.length) {
body = '<tr><td colspan="' + c.length +
'" style="text-align:center;color:var(--muted);padding:24px;">No data for this scope and period</td></tr>';
}
const t = totalOf(list);
document.getElementById('tableBody').innerHTML =
body + (list.length ? '<tr class="total-row">' + rowHtml(t, gross).slice(4) : '');
document.querySelectorAll('#tableHead th[data-k]').forEach(th => {
th.addEventListener('click', () => {
const k = th.dataset.k;
if (sortKey === k) sortDir = -sortDir; else { sortKey = k; sortDir = -1; }
drawFlat(lastRows, level);
});
});
if (canDrill) {
document.querySelectorAll('tr.drill-row').forEach(row => {
row.addEventListener('click', () => {
const r = lastRows[parseInt(row.dataset.i)];
if (r) drillInto(level, r.code, r.name);
});
});
}
document.getElementById('tableTitleText').textContent = 'Achievement by ' + LABEL[level];
document.getElementById('tableSub').innerHTML =
(crumbParts().length ? crumbHtml() + ' &mdash; ' : '') + '<span>' + list.length + ' rows' +
(canDrill ? ' &mdash; click a row to drill down' : '') + '</span>';
}
function buildPrintFilters() {
const box = document.getElementById('printFilters');
if (!box) return;
const parts = ['<b>Period:</b> ' + periodText()];
const crumbs = crumbText();
if (crumbs) parts.push('<b>Scope:</b> ' + crumbParts().map(x => '<bdi>' + esc(x) + '</bdi>').join(' ' + SEP + ' '));
parts.push('<b>Level:</b> ' + LABEL[currentLevel]);
box.innerHTML = parts.join('<span class="pf-sep">|</span>');
}
function render() {
window.targetWho = printWho();
document.getElementById('periodBadge').textContent = periodText();
buildPrintFilters();
renderTabs();
const warn = document.getElementById('divWarn');
if (scope.dept && DATA.mixed > 0 && +yearSel.value < 2026) {
warn.style.display = '';
warn.innerHTML = 'Targets have no division of their own - each salesman is assigned to his dominant division. ' +
'<b>' + DATA.mixed + ' salesmen</b> sell across divisions, so their target sits in one division only.';
} else {
warn.style.display = 'none';
}
paintKpis();
drawChart();
drawFlat(fltRows(build(currentLevel)), currentLevel);
}
[yearSel, mFrom, mTo].forEach(el => el.addEventListener('change', render));
document.getElementById('backBtn').addEventListener('click', goBack);
document.getElementById('resetBtn').addEventListener('click', () => {
scope = {}; drillStack = [];
yearSel.value = years[years.length - 1];
mFrom.value = '01';
mTo.value = MONTHS[new Date().getMonth()];
currentLevel = 'SECTOR';
resetSort();
render();
});
function nowTxt() {
const d = new Date(), p = n => (n < 10 ? '0' : '') + n;
return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
}
function printTitle() {
return 'Co. Dashboard | Target by ' + LABEL[currentLevel] + (crumbText() ? ' - ' + crumbText() : '') +
' | ' + periodText() + ' | Printed ' + nowTxt();
}
function printWho() {
const c = crumbParts(), last = c[c.length - 1];
if (!c.length) return [];
const up = scope.deptName && scope.deptName !== last ? scope.deptName : (scope.secName && scope.secName !== last ? scope.secName : '');
const w = up ? [last, up] : [last];
if (showFlt() && classFlt !== 'ALL') w.push(FLT[classFlt]);
return w;
}
function fileStem() { const p = periodKeys(); return 'Target_' + currentLevel + '_' + p.from + '_' + p.to; }
function runPrint(modeClass, title) {
const th = document.querySelector('#printTablePanel .print-title-row th');
if (th) th.textContent = printTitle();
window.targetWho = printWho();
const orig = document.title;
document.title = title;
if (modeClass) document.body.classList.add(modeClass);
const restore = () => {
document.title = orig;
if (modeClass) document.body.classList.remove(modeClass);
window.removeEventListener('afterprint', restore);
};
window.addEventListener('afterprint', restore);
window.print();
}
function printTable() { runPrint('print-mode-table', fileStem()); }
document.getElementById('printDashBtn').addEventListener('click', () => runPrint(null, 'Target_Dashboard_' + periodKeys().from + '_' + periodKeys().to));
function excel() {
if (!window.targetExcel) return;
window.targetExcel({
rows: lastRows, level: LABEL[currentLevel], gross: grossAt(currentLevel), total: totalOf(lastRows),
crumb: crumbText(), period: periodText(),
asof: (document.getElementById('asOfLine') || { textContent: '' }).textContent,
file: fileStem() + '.xlsx'
});
}
(function () {
const box = document.getElementById('exportBox');
if (!box) return;
if (window.jmExport) {
window.jmExport.attach(box, { pdf: printTable, excel: window.targetExcel ? excel : null });
} else {
box.innerHTML = '<button type="button" class="btn-print" id="printTableBtn">Print / PDF</button>';
document.getElementById('printTableBtn').addEventListener('click', printTable);
}
})();
(function () {
const line = document.getElementById('asOfLine');
if (!line) return;
line.classList.add('fresh');
line.textContent = DATA.archivedThru
? 'Archived thru ' + DATA.archivedThru + ' - current month live'
: 'Live data';
})();
render();
}
initTargetDashboard();

});
