window.addEventListener("DOMContentLoaded",function(){
function initSalesDashboard() {
const dataEl = document.getElementById('sales-data');
if (!dataEl) {
initSalesDashboard._t = (initSalesDashboard._t || 0) + 1;
if (initSalesDashboard._t < 100) { setTimeout(initSalesDashboard, 100); return; }
console.error('Sales dashboard: data region not found.');
return;
}
const D = JSON.parse(dataEl.textContent);
const BASE_YEAR = D.baseYear || 2023;
function toMap(list, keyF, valF) {
const m = {};
for (let i = 0; i < list.length; i++) { m[keyF(list[i])] = valF(list[i]); }
return m;
}
const SECTOR_NAME = toMap(D.sectors, x => x.c, x => x.n);
const DEPT_NAME   = toMap(D.depts,   x => x.c, x => x.n);
const DEPT_SECTOR = toMap(D.depts,   x => x.c, x => x.s);
const AREA_NAME   = toMap(D.areas,   x => String(x.c), x => x.n);
const SUP_NAME    = toMap(D.sups,    x => x.c, x => x.n);
const REP_NAME    = toMap(D.reps,    x => String(x.c), x => x.n);
const REP_AREA    = toMap(D.reps,    x => String(x.c), x => String(x.a));
const REP_SUP     = toMap(D.reps,    x => String(x.c), x => x.s);
const CLASS_NAME  = toMap(D.classes, x => String(x.c), x => x.n);
const records = [];
for (let i = 0; i < D.recs.length; i++) {
const a = D.recs[i];
const dept = a[1], rep = String(a[2]);
records.push({
m: a[0],
sec:  DEPT_SECTOR[dept] || 'OTH',
dept: dept,
area: REP_AREA[rep] || '0',
sup:  REP_SUP[rep]  || rep,
rep:  rep,
cls:  String(a[3]),
sales: a[4]
});
}
const fmt = n => Math.round(n).toLocaleString('en-US');
const pct = n => n.toFixed(1) + '%';
function idxOf(arr, v) {
for (let i = 0; i < arr.length; i++) { if (arr[i] === v) return i; }
return -1;
}
const esc = s => String(s).replace(/[&<>"]/g, m =>
({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
function growthHtml(curr, prev) {
if (!prev) return '<span class="muted-dash">&mdash;</span>';
const g = ((curr - prev) / Math.abs(prev)) * 100;
return '<span class="' + (g >= 0 ? 'pos' : 'neg') + '" style="font-weight:700;">'
+ (g >= 0 ? '&#9650;' : '&#9660;') + ' ' + Math.abs(g).toFixed(1) + '%</span>';
}
const MONTHS = ['01','02','03','04','05','06','07','08','09','10','11','12'];
const MONTH_LABELS = { '01':'January','02':'February','03':'March','04':'April',
'05':'May','06':'June','07':'July','08':'August','09':'September',
'10':'October','11':'November','12':'December' };
function populateYears() {
const cy = new Date().getFullYear();
const yFrom = document.getElementById('filterYearFrom');
const yTo = document.getElementById('filterYearTo');
yFrom.innerHTML = ''; yTo.innerHTML = '';
for (let y = BASE_YEAR; y <= cy + 1; y++) {
const o1 = document.createElement('option');
o1.value = y; o1.textContent = y; if (y === cy) o1.selected = true;
yFrom.appendChild(o1);
const o2 = document.createElement('option');
o2.value = y; o2.textContent = y; if (y === cy) o2.selected = true;
yTo.appendChild(o2);
}
}
populateYears();
const fromSel = document.getElementById('filterMonthFrom');
const toSel = document.getElementById('filterMonthTo');
MONTHS.forEach(m => {
const a = document.createElement('option');
a.value = m; a.textContent = MONTH_LABELS[m]; fromSel.appendChild(a);
const b = document.createElement('option');
b.value = m; b.textContent = MONTH_LABELS[m]; toSel.appendChild(b);
});
fromSel.value = MONTHS[0];
toSel.value = MONTHS[new Date().getMonth()];
const yearFromSel = document.getElementById('filterYearFrom');
const yearToSel = document.getElementById('filterYearTo');
function mKey(i) {
const y = BASE_YEAR + Math.floor(i / 12);
const m = (i % 12) + 1;
return (m < 10 ? '0' : '') + m + '_' + y;
}
function activeMonthIdx() {
const yF = parseInt(yearFromSel.value), yT = parseInt(yearToSel.value);
const iF = idxOf(MONTHS, fromSel.value), iT = idxOf(MONTHS, toSel.value);
const lo = Math.min(iF, iT), hi = Math.max(iF, iT);
const out = [];
for (let y = Math.min(yF, yT); y <= Math.max(yF, yT); y++) {
for (let m = lo; m <= hi; m++) { out.push((y - BASE_YEAR) * 12 + m); }
}
return out;
}
function prevMonthIdx() { return activeMonthIdx().map(i => i - 12); }
let colMode = 'M';
const COL_MAX_YEARS = { M: 1, Q: 3, H: 5, Y: 99 };
function nYears() {
return Math.abs(parseInt(yearToSel.value) - parseInt(yearFromSel.value)) + 1;
}
function modeAllowed(m) { return nYears() <= COL_MAX_YEARS[m]; }
function effMode() {
if (modeAllowed(colMode)) return colMode;
return modeAllowed('Q') ? 'Q' : (modeAllowed('H') ? 'H' : 'Y');
}
const MODE_WORD = { M: 'month', Q: 'quarter', H: 'half year', Y: 'year' };
function periodCols() {
const mode = effMode(), groups = {}, order = [];
activeMonthIdx().forEach(i => {
const y = BASE_YEAR + Math.floor(i / 12), m = i % 12;
let key, label;
if (mode === 'M')      { key = 'M' + i;                          label = MONTH_LABELS[MONTHS[m]].substring(0, 3).toUpperCase(); }
else if (mode === 'Q') { key = 'Q' + y + '_' + Math.floor(m / 3); label = 'Q' + (Math.floor(m / 3) + 1) + ' ' + y; }
else if (mode === 'H') { key = 'H' + y + '_' + Math.floor(m / 6); label = 'H' + (Math.floor(m / 6) + 1) + ' ' + y; }
else                   { key = 'Y' + y;                          label = String(y); }
if (!groups[key]) { groups[key] = { key: key, label: label, members: [] }; order.push(key); }
groups[key].members.push(i);
});
return order.map(k => groups[k]);
}
function renderColTabs() {
const eff = effMode();
document.querySelectorAll('#colTabs .lvl-btn').forEach(b => {
const m = b.dataset.cm;
b.className = 'lvl-btn' + (m === eff ? ' active' : '') + (modeAllowed(m) ? '' : ' off');
b.disabled = !modeAllowed(m);
});
}
document.querySelectorAll('#colTabs .lvl-btn').forEach(b => {
b.addEventListener('click', () => {
if (!modeAllowed(b.dataset.cm)) return;
colMode = b.dataset.cm;
resetSort();
render();
});
});
function colValue(row, col) {
let v = 0;
for (let i = 0; i < col.members.length; i++) {
v += row.mv[col.members[i]] || 0;
}
return v;
}
let scope = {};
let currentLevel = 'SECTOR';
let drillStack = [];
let sortKey = 'sales', sortDir = -1;
let lastRows = [];
function resetSort() { sortKey = 'sales'; sortDir = -1; }
const TAB_LABEL = { SECTOR:'Sector', DEPT:'Division', AREA:'Area', SUP:'Supervisor',
SALESMAN:'Salesman', CLASS:'Class', CUSTOMER:'Customers' };
const LEVEL_LABEL = { SECTOR:'SECTOR', DEPT:'DIVISION', AREA:'AREA', SUP:'SUPERVISOR',
SALESMAN:'SALESMAN', CLASS:'ITEM CLASS',
CUSTOMER:'CUSTOMER', ITEM:'ITEM' };
const LV = {
SECTOR:   { f: 'sec',  n: SECTOR_NAME },
DEPT:     { f: 'dept', n: DEPT_NAME },
AREA:     { f: 'area', n: AREA_NAME },
SUP:      { f: 'sup',  n: SUP_NAME },
SALESMAN: { f: 'rep',  n: REP_NAME },
CLASS:    { f: 'cls',  n: CLASS_NAME }
};
const UPPER_LEVELS = { SECTOR: 1, DEPT: 1 };
function tabsFor(s) {
if (s.cust) return ['CLASS'];
if (s.rep)  return ['CLASS', 'CUSTOMER'];
if (s.sup)  return ['SALESMAN', 'CLASS'];
if (s.area) return ['SUP', 'CLASS'];
if (s.dept) return ['AREA', 'SUP', 'CLASS'];
if (s.sec)  return ['DEPT', 'AREA', 'SUP', 'CLASS'];
return ['SECTOR', 'DEPT', 'AREA', 'SUP', 'CLASS'];
}
function tabScope() {
if (!scope.cls) return scope;
const s = {};
for (const k in scope) { if (k !== 'cls' && k !== 'clsName') s[k] = scope[k]; }
return s;
}
function isRemote() {
return currentLevel === 'CUSTOMER' || currentLevel === 'ITEM' ||
(currentLevel === 'CLASS' && scope.cust);
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
const tabs = tabsFor(tabScope());
const eff = currentLevel === 'ITEM' ? 'CLASS' : currentLevel;
const bar = document.getElementById('levelTabs');
bar.innerHTML = tabs.map(t =>
'<button type="button" class="lvl-btn' + (t === eff ? ' active' : '') +
'" data-level="' + t + '">' + TAB_LABEL[t] + '</button>'
).join('') +
((scope.rep || scope.cust) && window.salesDoc
? '<button type="button" class="lvl-btn lvl-docs" data-level="DOCS">Invoices</button>' : '');
bar.querySelectorAll('.lvl-docs').forEach(btn => btn.addEventListener('click', openDocs));
bar.querySelectorAll('.lvl-btn:not(.lvl-docs)').forEach(btn => {
btn.addEventListener('click', () => {
if (scope.cls) { delete scope.cls; delete scope.clsName; }
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
if (scope.custName) p.push(scope.custName);
if (scope.clsName)  p.push(scope.clsName);
return p;
}
const SEP = String.fromCharCode(8250);   // single right angle quote
function crumbText() { return crumbParts().join(' ' + SEP + ' '); }
function crumbHtml() {
const p = crumbParts();
return p.map((x, i) =>
'<span class="crumb' + (i === p.length - 1 ? ' crumb-last' : '') + '">' +
esc(x) + '</span>'
).join('<span class="crumb-sep">' + SEP + '</span>');
}
function scopeRows() {
return records.filter(r =>
(!scope.sec  || r.sec  === scope.sec)  &&
(!scope.dept || r.dept === scope.dept) &&
(!scope.area || r.area === scope.area) &&
(!scope.sup  || r.sup  === scope.sup)  &&
(!scope.rep  || r.rep  === scope.rep)  &&
(!scope.cls  || r.cls  === scope.cls)
);
}
function localRows(idxList) {
const set = {};
(idxList || activeMonthIdx()).forEach(i => { set[i] = 1; });
return scopeRows().filter(r => set[r.m] === 1);
}
function aggregateLocal(level) {
const f = LV[level].f, names = LV[level].n;
const map = {};
function bucket(k) {
if (!map[k]) {
map[k] = { code: k, name: names[k] == null ? k : names[k],
sales: 0, prev: 0, mv: {} };
}
return map[k];
}
localRows().forEach(r => {
const b = bucket(r[f]);
b.sales += r.sales;
b.mv[r.m] = (b.mv[r.m] || 0) + r.sales;   // feeds the month columns
});
localRows(prevMonthIdx()).forEach(r => { bucket(r[f]).prev += r.sales; });
const out = [];
for (const k in map) {
if (map[k].sales !== 0) out.push(map[k]);
}
return out;
}
function isMultiYear() {
return parseInt(yearFromSel.value) !== parseInt(yearToSel.value);
}
function monthBounds() {
const iF = idxOf(MONTHS, fromSel.value), iT = idxOf(MONTHS, toSel.value);
return [Math.min(iF, iT), Math.max(iF, iT)];
}
function yearsInPeriod() {
const yF = parseInt(yearFromSel.value), yT = parseInt(yearToSel.value);
const out = [];
for (let y = Math.min(yF, yT); y <= Math.max(yF, yT); y++) out.push(y);
return out;
}
function monthlyLocal() {
const m = {};
scopeRows().forEach(r => { m[r.m] = (m[r.m] || 0) + r.sales; });
return m;
}
function monthlyFromRows(list) {
const m = {};
list.forEach(r => {
for (const k in r.mv) { m[k] = (m[k] || 0) + r.mv[k]; }
});
return m;
}
function yearValue(monthly, y) {
const b = monthBounds();
let v = 0;
for (let i = b[0]; i <= b[1]; i++) { v += monthly[(y - BASE_YEAR) * 12 + i] || 0; }
return v;
}
const MAX_IDX = (function () {
let m = -1;
for (let i = 0; i < records.length; i++) { if (records[i].m > m) m = records[i].m; }
return m;
})();
function yearMonths(y) {
const b = monthBounds();
let n = 0;
for (let i = b[0]; i <= b[1]; i++) {
if ((y - BASE_YEAR) * 12 + i <= MAX_IDX) n++;
}
return n;
}
function periodSpanLabel() {
const b = monthBounds();
const a = MONTH_LABELS[MONTHS[b[0]]].substring(0, 3);
const z = MONTH_LABELS[MONTHS[b[1]]].substring(0, 3);
return a === z ? a : a + '-' + z;
}
function yearValueTo(monthly, y, hiEff) {
const b = monthBounds();
let v = 0;
for (let i = b[0]; i <= hiEff; i++) { v += monthly[(y - BASE_YEAR) * 12 + i] || 0; }
return v;
}
function effHi(y) {
const b = monthBounds();
return Math.min(b[1], MAX_IDX - (y - BASE_YEAR) * 12);
}
function trendCardHtml(monthly) {
const b = monthBounds();
const full = b[1] - b[0] + 1;
let anyPartial = false;
const rows = yearsInPeriod().map(y => {
const v = yearValue(monthly, y);
const n = yearMonths(y);
const partial = n > 0 && n < full;
if (partial) anyPartial = true;
const hiEff = effHi(y);
const cur = partial ? yearValueTo(monthly, y, hiEff) : v;
const pr  = partial ? yearValueTo(monthly, y - 1, hiEff)
: yearValue(monthly, y - 1);
return '<div class="tr-row">' +
'<span class="tr-y">' + y +
(partial ? '<span class="tr-p">' + n + 'm</span>' : '') + '</span>' +
'<span class="tr-v">' + fmt(v) + '</span>' +
'<span class="tr-v tr-avg">' +
(n ? fmt(v / n) : '<span class="muted-dash">&mdash;</span>') + '</span>' +
'<span class="tr-g">' + growthHtml(cur, pr) + '</span></div>';
}).join('');
const head = '<div class="tr-row tr-head">' +
'<span class="tr-y">YEAR</span>' +
'<span class="tr-v">NET SALES</span>' +
'<span class="tr-v tr-avg">MONTHLY AVG</span>' +
'<span class="tr-g">GROWTH</span></div>';
return '<div class="kpi k-trend">' +
'<div class="label">Year Performance (' + periodSpanLabel() + ')</div>' +
'<div class="tr-body">' + head + rows + '</div>' +
'<div class="sub">' + (anyPartial
? 'a partial year is marked and compared on its own months only'
: 'each year vs the same months one year earlier') + '</div>' +
'</div>';
}
function paintKpis(sales, prev, nMonths, monthly) {
const avg = nMonths ? sales / nMonths : 0;
const diff = sales - prev;
const scopeLine = crumbText();
const multi = isMultiYear();
const scopeCard = scope.cust
? '<div class="kpi k-cust">' +
'<span class="label">Selected Customer</span>' +
'<span class="scope-path">' + esc(scope.custName) + '</span>' +
'<span class="scope-note">Code ' + esc(scope.cust) + '</span>' +
'</div>'
: (scopeLine
? '<div class="kpi k-cust">' +
'<span class="label">Current Scope</span>' +
'<span class="scope-path">' + crumbHtml() + '</span>' +
'<span class="scope-note">Figures below reflect this scope</span>' +
'</div>' : '');
if (multi) {
document.getElementById('kpiContainer').innerHTML =
scopeCard + trendCardHtml(monthly || {});
return;
}
const idx = activeMonthIdx(), vals = [];
let bestI = -1, bestV = 0;
idx.forEach(i => {
const v = (monthly || {})[i] || 0;
vals.push(v);
if (v > bestV) { bestV = v; bestI = i; }
});
const salesCard =
'<div class="kpi k-sales">' +
'<div class="label">Net Sales</div>' +
'<div class="value">' + fmt(sales) + ' <span class="cur">SAR</span></div>' +
'<div class="sub">vs prev. year ' + growthHtml(sales, prev) + '</div>' +
(window.salesSpark ? window.salesSpark(vals) : '') +
'</div>';
const avgCard =
'<div class="kpi k-margin">' +
'<div class="label">Monthly Average</div>' +
'<div class="value">' + fmt(avg) + ' <span class="cur">SAR</span></div>' +
'<div class="sub">' + nMonths + ' month' + (nMonths === 1 ? '' : 's') + ' in period' +
(bestI >= 0 && nMonths > 1 ? ' &middot; best ' + MONTH_LABELS[MONTHS[bestI % 12]].substring(0, 3) +
' ' + (BASE_YEAR + Math.floor(bestI / 12)) + ' ' + fmt(bestV) : '') + '</div>' +
'</div>';
let middle;
{
const noPrev = !prev;
middle =
'<div class="kpi k-cost">' +
'<div class="label">Previous Year</div>' +
'<div class="value">' + (noPrev
? '<span class="muted-dash">&mdash;</span>' : fmt(prev)) +
(noPrev ? '' : ' <span class="cur">SAR</span>') + '</div>' +
'<div class="sub">' + (noPrev
? 'no data before ' + BASE_YEAR
: 'same months, one year back') + '</div>' +
'</div>' +
'<div class="kpi k-profit">' +
'<div class="label">Year over Year</div>' +
'<div class="value ' + (diff < 0 ? 'neg' : '') + '">' + (noPrev
? '<span class="muted-dash">&mdash;</span>'
: (diff >= 0 ? '+' : '') + fmt(diff) +
' <span class="cur">SAR</span>') + '</div>' +
'<div class="sub">' + (noPrev
? 'nothing to compare against'
: 'absolute change') + '</div>' +
'</div>';
}
document.getElementById('kpiContainer').innerHTML =
scopeCard + salesCard + middle + avgCard;
}
function renderKpisLocal() {
const sum = a => a.reduce((s, r) => s + r.sales, 0);
paintKpis(sum(localRows()), sum(localRows(prevMonthIdx())),
activeMonthIdx().length, monthlyLocal());
}
function drillInto(level, code, name) {
pushState();
if (level === 'SECTOR') {
scope.sec = code; scope.secName = String(name).toUpperCase();
currentLevel = 'DEPT';
} else if (level === 'DEPT') {
scope.dept = code; scope.deptName = String(name).toUpperCase();
currentLevel = 'AREA';
} else if (level === 'AREA') {
scope.area = code; scope.areaName = name;
currentLevel = 'SUP';
} else if (level === 'SUP') {
scope.sup = code; scope.supName = name;
currentLevel = 'SALESMAN';
const one = aggregateLocal('SALESMAN');
if (one.length === 1) {
scope.rep = one[0].code; scope.repName = one[0].name; currentLevel = 'CLASS';
if (one[0].name === name) scope.supName = '';
}
} else if (level === 'SALESMAN') {
scope.rep = code; scope.repName = name;
currentLevel = 'CLASS';           // classes first, Customers capsule beside it
} else if (level === 'CUSTOMER') {
scope.cust = code; scope.custName = name;
currentLevel = 'CLASS';           // classes bought by this customer (remote)
} else if (level === 'CLASS') {
scope.cls = code; scope.clsName = name;
currentLevel = 'ITEM';            // items load only on class click
}
resetSort();
render();
}
function drawTable(list, level) {
lastRows = list;
const isItem = level === 'ITEM';
const canDrill = level !== 'ITEM';
const upper = UPPER_LEVELS[level] === 1;
const pcols = periodCols();
const single = pcols.length === 1;   // one month -> no point repeating it
let grand = 0;
list.forEach(r => { grand += r.sales; });
list.forEach(r => {
if (!r.mv) r.mv = {};
r.share = grand ? (r.sales / grand) * 100 : 0;
if (!single) {
pcols.forEach(c => { r['p_' + c.key] = colValue(r, c); });
}
});
list.sort((a, b) => {
const x = a[sortKey], y = b[sortKey];
if (x === y) return 0;
return (x < y ? -1 : 1) * sortDir;
});
const cols = [{ k: 'name', t: LEVEL_LABEL[level], txt: true }];
if (!single) {
pcols.forEach(c => cols.push({ k: 'p_' + c.key, t: c.label, per: true }));
}
cols.push({ k: 'sales', t: 'TOTAL' });
cols.push({ k: 'share', t: 'SHARE %' });
let head = '<tr class="print-title-row"><th colspan="' + cols.length + '">' +
esc(printTitle()) + '</th></tr><tr>';
cols.forEach(c => {
head += '<th class="' + (c.txt ? '' : 'num') + (c.per ? ' per-col' : '') + ' ' +
(sortKey === c.k ? 'sorted' + (sortDir === 1 ? ' asc' : '') : '') +
'" data-k="' + c.k + '">' + c.t + '</th>';
});
head += '</tr>';
let tSales = 0;
const tPer = {};
pcols.forEach(c => { tPer[c.key] = 0; });
list.forEach(r => { pcols.forEach(c => { tPer[c.key] += single ? 0 : r['p_' + c.key]; }); });
if (!single && effMode() !== 'M') {
head += '<tr class="chg-row"><th>vs previous</th>';
pcols.forEach((c, i) => {
const cur = tPer[c.key], pr = i ? tPer[pcols[i - 1].key] : 0;
head += '<th class="num">' + (i && pr ? growthHtml(cur, pr) : '') + '</th>';
});
head += '<th></th><th></th></tr>';
}
document.getElementById('tableHead').innerHTML = head;
pcols.forEach(c => { tPer[c.key] = 0; });
let body = list.map((r, i) => {
tSales += r.sales;
const disp = upper ? String(r.name).toUpperCase() : r.name;
const nameCell = (isItem && r.code)
? '<span style="font-family:var(--font-mono);font-size:11px;opacity:.7;">' +
esc(r.code) + '</span> ' + esc(disp)
: esc(disp);
let cells = '';
if (!single) {
pcols.forEach(c => {
const v = r['p_' + c.key];
tPer[c.key] += v;
cells += '<td class="num per-col' + (v < 0 ? ' neg' : '') + '">' +
(v ? fmt(v) : '<span class="muted-dash">&mdash;</span>') + '</td>';
});
}
return '<tr class="' + (canDrill ? 'drill-row' : '') + '" data-i="' + i + '">' +
'<td>' + (canDrill ? '<span class="tw">&#9656;</span> ' : '') + nameCell + '</td>' +
cells +
'<td class="num ' + (r.sales < 0 ? 'neg' : '') + '">' + fmt(r.sales) + '</td>' +
'<td class="num">' + pct(r.share) + '</td></tr>';
}).join('');
if (!list.length) {
body = '<tr><td colspan="' + cols.length +
'" style="text-align:center;color:var(--muted);padding:24px;">' +
'No data for this scope and period</td></tr>';
}
let totCells = '';
if (!single) {
pcols.forEach(c => {
totCells += '<td class="num per-col' + (tPer[c.key] < 0 ? ' neg' : '') +
'">' + fmt(tPer[c.key]) + '</td>';
});
}
const tot = '<tr class="total-row"><td>TOTAL</td>' + totCells +
'<td class="num ' + (tSales < 0 ? 'neg' : '') + '">' + fmt(tSales) + '</td>' +
'<td class="num">100.0%</td></tr>';
document.getElementById('tableBody').innerHTML = body + (list.length ? tot : '');
document.querySelectorAll('#tableHead th[data-k]').forEach(th => {
th.addEventListener('click', () => {
const k = th.dataset.k;
if (sortKey === k) sortDir = -sortDir; else { sortKey = k; sortDir = -1; }
drawTable(lastRows, level);
});
});
if (canDrill) {
document.querySelectorAll('tr.drill-row').forEach(row => {
row.addEventListener('click', () => {
const r = lastRows[parseInt(row.dataset.i)];
if (r) drillInto(level, String(r.code), r.name);
});
});
}
document.getElementById('tableTitleText').textContent = 'Sales by ' + LEVEL_LABEL[level];
document.getElementById('tableSub').innerHTML =
(crumbParts().length ? crumbHtml() + ' &mdash; ' : '') + list.length + ' rows' +
(canDrill ? ' &mdash; click a row to drill down' : '');
drawChart(list, pcols);
}
function drawChart(list, pcols) {
const panel = document.getElementById('chartPanel'), svg = document.getElementById('chSvg');
if (!panel || !svg || !window.salesChart) return;
if (pcols.length < 2 || !list.length) { panel.style.display = 'none'; return; }
panel.style.display = '';
const monthly = isRemote() ? monthlyFromRows(list) : monthlyLocal();
const cur = [], prev = [];
let anyPrev = false;
const onePeriodYear = nYears() === 1;
pcols.forEach(c => {
let v = 0, p = 0;
c.members.forEach(m => { v += monthly[m] || 0; p += monthly[m - 12] || 0; });
cur.push(v); prev.push(p);
if (p && onePeriodYear) anyPrev = true;
});
const ys = yearsInPeriod();
const yTxt = ys.length === 1 ? String(ys[0]) : ys[0] + ' - ' + ys[ys.length - 1];
document.getElementById('chTitle').textContent = 'Net sales by ' + MODE_WORD[effMode()] +
(crumbText() ? ' - ' + crumbText() : '');
document.getElementById('chLegend').innerHTML =
'<span><i class="c1"></i>' + yTxt + '</span>' +
(anyPrev ? '<span><i class="c0"></i>one year earlier</span>' : '');
window.salesChart(svg, { labels: pcols.map(c => c.label), cur: cur, prev: anyPrev ? prev : null });
}
function deptsForAjax() {
if (scope.dept) return scope.dept;
if (!scope.sec) return '';
const set = {};
records.forEach(r => { if (r.sec === scope.sec) set[r.dept] = 1; });
const out = Object.keys(set);
return out.length ? out.join(',') : '-1';
}
function repsForAjax() {
if (scope.rep) return scope.rep;
if (!scope.sup) return '';
const set = {};
records.forEach(r => {
if (r.sup === scope.sup &&
(!scope.sec  || r.sec  === scope.sec)  &&
(!scope.dept || r.dept === scope.dept) &&
(!scope.area || r.area === scope.area)) { set[r.rep] = 1; }
});
const out = Object.keys(set);
return out.length ? out.join(',') : '-1';
}
function loadRemote() {
const loader = document.getElementById('tableLoader');
loader.style.display = 'block';
loader.textContent = 'Loading detail data...';
document.getElementById('tableBody').innerHTML = '';
apex.server.process('GET_SALES_DETAIL', {
x01: currentLevel,
x02: activeMonthIdx().map(mKey).join(','),
x03: scope.area || '',
x04: repsForAjax(),
x05: deptsForAjax(),
x06: scope.cls  || '',
x07: scope.cust || ''
}, {
success: function (d) {
loader.style.display = 'none';
if (d.status === 'error') {
loader.style.display = 'block';
loader.innerHTML = '<strong>Detail query failed.</strong><br>' +
'<span style="opacity:.7">' + esc(d.message || '') + '</span>';
return;
}
const list = (d.rows || []).map(r => {
const mv = {};
if (r.mv) {
const parts = String(r.mv).split(',');
for (let i = 0; i < parts.length; i++) {
const p = parts[i].split(':');
if (p.length === 2) mv[parseInt(p[0])] = parseFloat(p[1]);
}
}
return { code: r.code, name: r.name,
sales: r.sales, prev: r.prev || 0, mv: mv };
});
const tot = d.tot || { sales: 0, prev: 0 };
paintKpis(tot.sales, tot.prev, activeMonthIdx().length,
monthlyFromRows(list));
drawTable(list.filter(r => r.sales !== 0), currentLevel);
},
error: function (jq, status, err) {
loader.style.display = 'block';
loader.innerHTML = '<strong>Detail data could not be loaded.</strong><br>' +
'Make sure the Ajax Callback <code>GET_SALES_DETAIL</code> exists. ' +
'<span style="opacity:.7">(' + (err || status || 'error') + ')</span>';
document.getElementById('tableHead').innerHTML = '';
document.getElementById('tableBody').innerHTML = '';
}
});
}
const custBox   = document.getElementById('custBox');
const custInput = document.getElementById('custInput');
const custMenu  = document.getElementById('custMenu');
const custClear = document.getElementById('custClear');
let hoverIdx = -1, searchTimer = null;
function showSearchRows(list) {
if (!list.length) {
custMenu.innerHTML = '<div class="ss-empty">No matching customer</div>';
} else {
custMenu.innerHTML = list.map((c, i) =>
'<div class="ss-option" data-i="' + i + '" data-c="' + esc(c.code) +
'" data-n="' + esc(c.name) + '">' +
'<span class="ss-code">' + esc(c.code) + '</span>' +
'<span>' + esc(c.name) + '</span></div>').join('');
}
hoverIdx = -1;
custMenu.classList.add('open');
}
function runSearch(term) {
apex.server.process('GET_SALES_DETAIL', { x01: 'CUST_SEARCH', x07: term }, {
success: function (d) { showSearchRows(d.rows || []); },
error: function () {
custMenu.innerHTML = '<div class="ss-empty">Search failed</div>';
custMenu.classList.add('open');
}
});
}
function pickCustomer(c, n) {
custInput.value = n;
custBox.classList.add('picked');
custClear.style.display = 'block';
custMenu.classList.remove('open');
pushState();
scope = { cust: c, custName: n };
currentLevel = 'CLASS';
resetSort();
render();
}
function clearCustomerBox() {
custInput.value = '';
custBox.classList.remove('picked');
custClear.style.display = 'none';
custMenu.classList.remove('open');
}
custInput.addEventListener('input', () => {
custBox.classList.remove('picked');
clearTimeout(searchTimer);
const term = custInput.value.trim();
if (term.length < 2) { custMenu.classList.remove('open'); return; }
searchTimer = setTimeout(() => runSearch(term), 300);
});
custInput.addEventListener('keydown', e => {
const opts = custMenu.querySelectorAll('.ss-option');
if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
e.preventDefault();
if (!opts.length) return;
hoverIdx = e.key === 'ArrowDown'
? Math.min(hoverIdx + 1, opts.length - 1)
: Math.max(hoverIdx - 1, 0);
opts.forEach(o => o.classList.remove('active'));
opts[hoverIdx].classList.add('active');
opts[hoverIdx].scrollIntoView({ block: 'nearest' });
} else if (e.key === 'Enter') {
e.preventDefault();
const o = hoverIdx >= 0 ? opts[hoverIdx] : opts[0];
if (o) pickCustomer(o.dataset.c, o.dataset.n);
} else if (e.key === 'Escape') {
custMenu.classList.remove('open');
}
});
custMenu.addEventListener('click', e => {
const o = e.target.closest('.ss-option');
if (o) pickCustomer(o.dataset.c, o.dataset.n);
});
custClear.addEventListener('click', () => clearCustomerBox());
document.addEventListener('click', e => {
if (!e.target.closest('.search-select')) custMenu.classList.remove('open');
});
function buildPrintFilters() {
const box = document.getElementById('printFilters');
if (!box) return;
const parts = [];
parts.push('<b>Period:</b> ' + document.getElementById('periodBadge').textContent);
const crumbs = crumbText();
if (crumbs) parts.push('<b>Scope:</b> ' + esc(crumbs));
parts.push('<b>Level:</b> ' + LEVEL_LABEL[currentLevel]);
box.innerHTML = parts.join('<span class="pf-sep">|</span>');
}
function docPeriod() {
const yF = parseInt(yearFromSel.value), yT = parseInt(yearToSel.value);
const iF = idxOf(MONTHS, fromSel.value), iT = idxOf(MONTHS, toSel.value);
return { from: Math.min(yF, yT) + '-' + MONTHS[Math.min(iF, iT)],
to:   Math.max(yF, yT) + '-' + MONTHS[Math.max(iF, iT)] };
}
function openDocs() {
if (!window.salesDoc) return;
const p = docPeriod();
window.salesDoc.list({ from: p.from, to: p.to, sm: scope.rep || '', cu: scope.cust || '' },
{ crumb: ['Sales Analysis'] });
}
function render() {
const yF = parseInt(yearFromSel.value), yT = parseInt(yearToSel.value);
const iF = idxOf(MONTHS, fromSel.value), iT = idxOf(MONTHS, toSel.value);
const lo = Math.min(iF, iT), hi = Math.max(iF, iT);
document.getElementById('periodBadge').textContent =
(yF === yT ? 'Year: ' + yF : 'Period: ' + yF + ' - ' + yT) +
' (' + MONTH_LABELS[MONTHS[lo]] + ' - ' + MONTH_LABELS[MONTHS[hi]] + ')';
buildPrintFilters();
renderTabs();
renderColTabs();
if (isRemote()) {
if (typeof apex !== 'undefined' && apex.server) {
loadRemote();
} else {
document.getElementById('tableLoader').style.display = 'block';
document.getElementById('tableLoader').textContent =
'Detail levels require the APEX AJAX process.';
}
} else {
document.getElementById('tableLoader').style.display = 'none';
renderKpisLocal();
drawTable(aggregateLocal(currentLevel), currentLevel);
}
}
[yearFromSel, yearToSel, fromSel, toSel].forEach(el => el.addEventListener('change', render));
document.getElementById('backBtn').addEventListener('click', goBack);
document.getElementById('resetBtn').addEventListener('click', () => {
scope = {}; drillStack = [];
clearCustomerBox();
const cy = new Date().getFullYear().toString();
yearFromSel.value = cy; yearToSel.value = cy;
fromSel.value = MONTHS[0];
toSel.value = MONTHS[new Date().getMonth()];
resetSort();
currentLevel = 'SECTOR';
colMode = 'M';
render();
});
function nowTxt() {
const d = new Date(), p = n => (n < 10 ? '0' : '') + n;
return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
}
function printTitle() {
return 'Co. Dashboard | Sales by ' + LEVEL_LABEL[currentLevel] + (crumbText() ? ' - ' + crumbText() : '') +
' | ' + document.getElementById('periodBadge').textContent + ' | Printed ' + nowTxt();
}
function fileStem() { const p = docPeriod(); return 'Sales_' + currentLevel + '_' + p.from + '_' + p.to; }
function runPrint(modeClass, title) {
const th = document.querySelector('#printTablePanel .print-title-row th');
if (th) th.textContent = printTitle();
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
document.getElementById('printDashBtn').addEventListener('click', () => runPrint(null, 'Sales_Dashboard_' + docPeriod().from + '_' + docPeriod().to));
function excel() {
if (!window.salesExcel) return;
const pcols = periodCols();
window.salesExcel({
rows: lastRows, level: LEVEL_LABEL[currentLevel], item: currentLevel === 'ITEM',
cols: pcols.length === 1 ? [] : pcols, colValue: colValue,
crumb: crumbText(), period: document.getElementById('periodBadge').textContent,
asof: (document.getElementById('asOfLine') || { textContent: '' }).textContent,
file: fileStem() + '.xlsx'
});
}
(function () {
const box = document.getElementById('exportBox');
if (!box) return;
if (window.jmExport) {
window.jmExport.attach(box, { pdf: printTable, excel: window.salesExcel ? excel : null });
} else {
box.innerHTML = '<button type="button" class="btn-print" id="printTableBtn">Print / PDF</button>';
document.getElementById('printTableBtn').addEventListener('click', printTable);
}
})();
(function () {
const line = document.getElementById('asOfLine');
if (!line) return;
line.classList.add('fresh');
line.textContent = D.archivedThru
? 'Archived thru ' + D.archivedThru + ' - current month live'
: 'Live data - loaded ' + (D.asOf || '');
})();
render();
}
initSalesDashboard();

});
