window.addEventListener("DOMContentLoaded",function(){
function initProfitDashboard() {
const dataEl = document.getElementById('profit-data');
if (!dataEl) {
initProfitDashboard._t = (initProfitDashboard._t || 0) + 1;
if (initProfitDashboard._t < 100) { setTimeout(initProfitDashboard, 100); return; }
console.error('Profit dashboard: data region not found.');
return;
}
const DATA = JSON.parse(dataEl.textContent);
const META = DATA;
const BASE_YEAR = DATA.baseYear || 2023;
const months = ['01','02','03','04','05','06','07','08','09','10','11','12'];
const monthLabels = { '01':'January','02':'February','03':'March','04':'April',
'05':'May','06':'June','07':'July','08':'August','09':'September',
'10':'October','11':'November','12':'December' };
function toMap(list, keyF, valF) {
const m = {};
for (let i = 0; i < list.length; i++) { m[keyF(list[i])] = valF(list[i]); }
return m;
}
const DEPT_NAME  = toMap(DATA.depts,   x => x.c, x => x.n);
const AREA_NAME  = toMap(DATA.areas,   x => String(x.c), x => x.n);
const SUP_NAME   = toMap(DATA.sups,    x => x.c, x => x.n);
const REP_NAME   = toMap(DATA.reps,    x => String(x.c), x => x.n);
const REP_AREA   = toMap(DATA.reps,    x => String(x.c), x => String(x.a));
const REP_SUP    = toMap(DATA.reps,    x => String(x.c), x => x.s);
const CLASS_NAME = toMap(DATA.classes, x => String(x.c), x => x.n);
const records = [];
for (let i = 0; i < DATA.recs.length; i++) {
const a = DATA.recs[i], mi = a[0], dept = a[1], rep = String(a[2]), cls = String(a[3]);
const area = REP_AREA[rep] || '0', sup = REP_SUP[rep] || rep;
const mm = (mi % 12) + 1;
records.push({
month: (mm < 10 ? '0' : '') + mm + '_' + (BASE_YEAR + Math.floor(mi / 12)),
deptCode: dept, dept: DEPT_NAME[dept] || dept,
areaId: area, area: AREA_NAME[area] || (area === '0' ? '-' : area),
repCode: rep, rep: REP_NAME[rep] || rep,
supCode: sup, sup: SUP_NAME[sup] || REP_NAME[sup] || sup,
clsCode: cls, cls: CLASS_NAME[cls] || cls,
sales: a[4], cost: a[5]
});
}
const fmt = n => Math.round(n).toLocaleString('en-US');
const pct = n => (n).toFixed(1) + '%';
function idxOf(arr, v) {
for (let i = 0; i < arr.length; i++) { if (arr[i] === v) return i; }
return -1;
}
const esc = s => String(s).replace(/[&<>"]/g, m =>
({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
function marginClass(m) {
if (m < 0) return 'mg-neg';
if (m < 10) return 'mg-low';
if (m < 25) return 'mg-mid';
return 'mg-high';
}
function mgCell(m) {
return '<div class="mg-cell ' + marginClass(m) + '"><span class="mg-bar"><i style="width:' +
Math.max(0, Math.min(100, m * 2)).toFixed(0) + '%"></i></span>' + pct(m) + '</div>';
}
const yearSel = document.getElementById('filterYear');
const fromSel = document.getElementById('filterMonthFrom');
const toSel = document.getElementById('filterMonthTo');
(function () {
const cy = new Date().getFullYear();
yearSel.innerHTML = '';
for (let y = cy; y >= BASE_YEAR; y--) {
const o = document.createElement('option');
o.value = y; o.textContent = y; yearSel.appendChild(o);
}
yearSel.value = cy;
months.forEach(m => {
const a = document.createElement('option'); a.value = m; a.textContent = monthLabels[m]; fromSel.appendChild(a);
const b = document.createElement('option'); b.value = m; b.textContent = monthLabels[m]; toSel.appendChild(b);
});
fromSel.value = months[0];
toSel.value = months[new Date().getMonth()];
})();
function curYear() { return parseInt(yearSel.value); }
function monthBounds() {
const iF = idxOf(months, fromSel.value), iT = idxOf(months, toSel.value);
return [Math.min(iF, iT), Math.max(iF, iT)];
}
function activeMonthKeys() {
const b = monthBounds(), y = curYear(), keys = [];
for (let i = b[0]; i <= b[1]; i++) keys.push(months[i] + '_' + y);
return keys;
}
function keyLabel(k) { return monthLabels[k.substring(0, 2)].substring(0, 3).toUpperCase(); }
function keyMonth(k) { return monthLabels[k.substring(0, 2)].substring(0, 3) + ' ' + k.substring(3); }
function periodText() {
const b = monthBounds();
return 'Year: ' + curYear() + ' (' + monthLabels[months[b[0]]] + ' - ' + monthLabels[months[b[1]]] + ')';
}
function docPeriod() {
const b = monthBounds();
return { from: curYear() + '-' + months[b[0]], to: curYear() + '-' + months[b[1]] };
}
let scope = {};
let currentLevel = 'DEPT';
let drillStack = [];
let sortKey = 'profit', sortDir = -1;
let lastRows = [];
function resetSort() { sortKey = 'profit'; sortDir = -1; }
const TAB_LABEL = { DEPT: 'Division', AREA: 'Area', SUP: 'Supervisor',
SALESMAN: 'Salesman', CLASS: 'Class', CUSTOMER: 'Customers' };
const LEVEL_LABEL = { DEPT: 'DIVISION', AREA: 'AREA', SUP: 'SUPERVISOR',
SALESMAN: 'SALESMAN',
CLASS: 'ITEM CLASS', CUSTOMER: 'CUSTOMER', ITEM: 'ITEM' };
const LV = {
DEPT:     { code: 'deptCode', name: 'dept' },
AREA:     { code: 'areaId',   name: 'area' },
SUP:      { code: 'supCode',  name: 'sup' },
SALESMAN: { code: 'repCode',  name: 'rep' },
CLASS:    { code: 'clsCode',  name: 'cls' }
};
function tabsFor(s) {
if (s.cust) return ['CLASS'];
if (s.rep)  return ['CLASS', 'CUSTOMER'];
if (s.sup)  return ['SALESMAN', 'CLASS'];
if (s.area) return ['SUP', 'CLASS'];
if (s.dept) return ['AREA', 'SUP', 'CLASS'];
return ['DEPT', 'AREA', 'SUP', 'CLASS'];
}
function tabScope() {
if (!scope.cls) return scope;
const s = {}; for (const k in scope) { if (k !== 'cls' && k !== 'clsName') s[k] = scope[k]; }
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
if (scope.deptName) p.push(scope.deptName);
if (scope.areaName) p.push(scope.areaName);
if (scope.supName)  p.push(scope.supName);
if (scope.repName)  p.push(scope.repName);
if (scope.custName) p.push(scope.custName);
if (scope.clsName)  p.push(scope.clsName);
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
function localRows() {
const set = {};
activeMonthKeys().forEach(k => { set[k] = 1; });
return records.filter(r =>
set[r.month] === 1 &&
(!scope.dept || String(r.deptCode) === scope.dept) &&
(!scope.area || String(r.areaId)  === scope.area) &&
(!scope.sup  || String(r.supCode) === scope.sup) &&
(!scope.rep  || String(r.repCode) === scope.rep) &&
(!scope.cls  || String(r.clsCode) === scope.cls)
);
}
function aggregateLocal(rows, level) {
const cf = LV[level].code, nf = LV[level].name;
const map = {};
rows.forEach(r => {
const k = String(r[cf]);
if (!map[k]) map[k] = { code: k, name: r[nf] == null || r[nf] === '' ? '-' : String(r[nf]), sales: 0, cost: 0 };
map[k].sales += r.sales;
map[k].cost  += r.cost;
});
return Object.values(map);
}
function decorate(list) {
list.forEach(r => {
r.profit = r.sales - r.cost;
r.margin = r.sales ? (r.profit / r.sales) * 100 : 0;
});
return list;
}
function monthlyLocal() {
const m = {};
localRows().forEach(r => {
if (!m[r.month]) m[r.month] = { s: 0, c: 0 };
m[r.month].s += r.sales; m[r.month].c += r.cost;
});
return m;
}
function paintKpis(monthly) {
const keys = activeMonthKeys();
let tS = 0, tC = 0, bestK = null, bestV = 0, hiK = null, loK = null, hiM = 0, loM = 0;
const sVals = [], pVals = [];
keys.forEach(k => {
const v = monthly[k] || { s: 0, c: 0 }, p = v.s - v.c;
tS += v.s; tC += v.c;
sVals.push(v.s); pVals.push(p);
if (v.s > bestV) { bestV = v.s; bestK = k; }
if (v.s) {
const m = p / v.s * 100;
if (hiK === null || m > hiM) { hiM = m; hiK = k; }
if (loK === null || m < loM) { loM = m; loK = k; }
}
});
const tP = tS - tC, tM = tS ? tP / tS * 100 : 0;
const scopeLine = crumbText();
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
document.getElementById('kpiContainer').innerHTML = scopeCard +
'<div class="kpi k-sales">' +
'<div class="label">Net Sales</div>' +
'<div class="value">' + fmt(tS) + ' <span class="cur">SAR</span></div>' +
'<div class="sub">' + keys.length + ' month' + (keys.length === 1 ? '' : 's') + ' in period' +
(bestK && keys.length > 1 ? ' &middot; best ' + keyMonth(bestK) + ' ' + fmt(bestV) : '') + '</div>' +
(window.profitSpark ? window.profitSpark(sVals) : '') +
'</div>' +
'<div class="kpi k-cost">' +
'<div class="label">Cost of Goods</div>' +
'<div class="value">' + fmt(tC) + ' <span class="cur">SAR</span></div>' +
'<div class="sub">' + (tS ? pct(tC / tS * 100) + ' of net sales' : '&nbsp;') + '</div>' +
'</div>' +
'<div class="kpi k-profit">' +
'<div class="label">Gross Profit</div>' +
'<div class="value' + (tP < 0 ? ' neg' : '') + '">' + fmt(tP) + ' <span class="cur">SAR</span></div>' +
'<div class="sub">' + (keys.length > 1 ? 'monthly avg ' + fmt(tP / keys.length) : '&nbsp;') + '</div>' +
(window.profitSpark ? window.profitSpark(pVals) : '') +
'</div>' +
'<div class="kpi k-margin">' +
'<div class="label">Gross Margin</div>' +
'<div class="value ' + marginClass(tM) + '">' + pct(tM) + '</div>' +
'<div class="sub">' + (hiK && keys.length > 1
? 'highest ' + keyMonth(hiK) + ' ' + pct(hiM) + ' &middot; lowest ' + keyMonth(loK) + ' ' + pct(loM)
: '&nbsp;') + '</div>' +
'</div>';
}
function drawChart(monthly) {
const panel = document.getElementById('chartPanel'), svg = document.getElementById('chSvg');
if (!panel || !svg || !window.profitChart) return;
const keys = activeMonthKeys();
let any = false;
const o = { labels: [], sales: [], cost: [], profit: [], margin: [] };
keys.forEach(k => {
const v = monthly[k] || { s: 0, c: 0 }, p = v.s - v.c;
if (v.s || v.c) any = true;
o.labels.push(keyLabel(k)); o.sales.push(v.s); o.cost.push(v.c); o.profit.push(p);
o.margin.push(v.s ? p / v.s * 100 : 0);
});
if (keys.length < 2 || !any) { panel.style.display = 'none'; return; }
panel.style.display = '';
document.getElementById('chTitle').textContent = 'Net sales, cost and gross profit by month' +
(crumbText() ? ' - ' + crumbText() : '');
document.getElementById('chLegend').innerHTML =
'<span><i class="c0"></i>net sales</span><span><i class="c3"></i>cost</span>' +
'<span><i class="c1"></i>gross profit</span><span><i class="c2"></i>margin %</span>';
window.profitChart(svg, o);
}
function drillInto(level, code, name) {
pushState();
if (level === 'DEPT') {
scope.dept = code; scope.deptName = String(name).toUpperCase();
currentLevel = 'AREA';
} else if (level === 'AREA') {
scope.area = code; scope.areaName = name;
currentLevel = 'SUP';
} else if (level === 'SUP') {
scope.sup = code; scope.supName = name;
currentLevel = 'SALESMAN';
const seen = {}; let nRep = 0, one = null;
localRows().forEach(r => { const k = String(r.repCode); if (!seen[k]) { seen[k] = 1; nRep++; one = r; } });
if (nRep === 1) {
scope.rep = String(one.repCode); scope.repName = one.rep; currentLevel = 'CLASS';
if (one.rep === name) scope.supName = '';
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
list.sort((a, b) => {
const x = a[sortKey], y = b[sortKey];
if (x === y) return 0;
return (x < y ? -1 : 1) * sortDir;
});
const isItem = level === 'ITEM';
const canDrill = level !== 'ITEM';
const cols = isItem
? [{ k: 'name', t: 'ITEM', txt: true }, { k: 'unit', t: 'UNIT', txt: true },
{ k: 'qty', t: 'QTY' }, { k: 'sales', t: 'NET SALES' }, { k: 'cost', t: 'COST' },
{ k: 'profit', t: 'GROSS PROFIT' }, { k: 'margin', t: 'MARGIN %' }]
: [{ k: 'name', t: LEVEL_LABEL[level], txt: true },
{ k: 'sales', t: 'NET SALES' }, { k: 'cost', t: 'COST' },
{ k: 'profit', t: 'GROSS PROFIT' }, { k: 'margin', t: 'MARGIN %' }];
let head = '<tr class="print-title-row"><th colspan="' + cols.length + '">' + esc(printTitle()) + '</th></tr><tr>';
cols.forEach(c => {
head += '<th class="' + (c.txt ? '' : 'num') + ' ' +
(sortKey === c.k ? 'sorted' + (sortDir === 1 ? ' asc' : '') : '') +
'" data-k="' + c.k + '">' + c.t + '</th>';
});
document.getElementById('tableHead').innerHTML = head + '</tr>';
const t = { qty: 0, sales: 0, cost: 0, profit: 0 };
let body = list.map((r, i) => {
t.sales += r.sales; t.cost += r.cost; t.profit += r.profit; t.qty += (r.qty || 0);
const disp = level === 'DEPT' ? String(r.name).toUpperCase() : r.name;
const nameCell = (isItem && r.code)
? '<span style="font-family:var(--font-mono);font-size:11px;opacity:.7;">' + esc(r.code) + '</span> ' + esc(disp)
: esc(disp);
return '<tr class="' + (canDrill ? 'drill-row' : '') + '" data-i="' + i + '">' +
'<td>' + (canDrill ? '<span class="tw">&#9656;</span> ' : '') + nameCell + '</td>' +
(isItem ? '<td>' + esc(r.unit || '') + '</td><td class="num">' + fmt(r.qty || 0) + '</td>' : '') +
'<td class="num' + (r.sales < 0 ? ' neg' : '') + '">' + fmt(r.sales) + '</td>' +
'<td class="num">' + fmt(r.cost) + '</td>' +
'<td class="num' + (r.profit < 0 ? ' neg' : '') + '">' + fmt(r.profit) + '</td>' +
'<td class="num">' + mgCell(r.margin) + '</td></tr>';
}).join('');
if (!list.length) {
body = '<tr><td colspan="' + cols.length + '" style="text-align:center;color:var(--muted);padding:24px;">' +
'No data for this scope and period</td></tr>';
}
const tm = t.sales ? (t.profit / t.sales) * 100 : 0;
const tot = '<tr class="total-row"><td>TOTAL</td>' +
(isItem ? '<td></td><td class="num" style="color:var(--muted);">&mdash;</td>' : '') +
'<td class="num' + (t.sales < 0 ? ' neg' : '') + '">' + fmt(t.sales) + '</td>' +
'<td class="num">' + fmt(t.cost) + '</td>' +
'<td class="num' + (t.profit < 0 ? ' neg' : '') + '">' + fmt(t.profit) + '</td>' +
'<td class="num">' + mgCell(tm) + '</td></tr>';
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
document.getElementById('tableTitleText').textContent = 'Profitability by ' + LEVEL_LABEL[level];
document.getElementById('tableSub').innerHTML =
(crumbParts().length ? crumbHtml() + ' &mdash; ' : '') + list.length + ' rows' +
(canDrill ? ' &mdash; click a row to drill down' : '');
}
function repsForAjax() {
if (scope.rep) return scope.rep;
if (!scope.sup) return '';
const set = {};
records.forEach(r => {
if (String(r.supCode) === scope.sup &&
(!scope.dept || String(r.deptCode) === scope.dept) &&
(!scope.area || String(r.areaId) === scope.area)) {
set[String(r.repCode)] = 1;
}
});
const out = Object.keys(set);
return out.length ? out.join(',') : '-1';
}
function loadRemote() {
const loader = document.getElementById('tableLoader');
loader.style.display = 'block';
loader.textContent = 'Loading detail data...';
document.getElementById('tableBody').innerHTML = '';
apex.server.process('GET_PROFIT_DETAIL', {
x01: currentLevel,
x02: activeMonthKeys().join(','),
x03: scope.area || '',
x04: repsForAjax(),
x05: scope.dept || '',
x06: scope.cls  || '',
x07: scope.cust || ''
}, {
success: function (d) {
loader.style.display = 'none';
if (d.error) {
loader.style.display = 'block';
loader.innerHTML = '<strong>Detail query failed.</strong><br><span style="opacity:.7">' + esc(d.error) + '</span>';
return;
}
const list = (d.rows || []).map(r => ({
code: r.code, name: r.name == null || r.name === '' ? String(r.code) : r.name, unit: r.unit,
qty: r.qty, sales: r.sales, cost: r.cost
}));
const monthly = {};
(d.months || []).forEach(m => { monthly[m[0]] = { s: m[1], c: m[2] }; });
paintKpis(monthly);
drawChart(monthly);
drawTable(decorate(list), currentLevel);
},
error: function (jq, status, err) {
loader.style.display = 'block';
loader.innerHTML = '<strong>Detail data could not be loaded.</strong><br>' +
'Make sure the Ajax Callback <code>GET_PROFIT_DETAIL</code> is up to date. ' +
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
'<div class="ss-option" data-i="' + i + '" data-c="' + esc(c.code) + '" data-n="' + esc(c.name) + '">' +
'<span class="ss-code">' + esc(c.code) + '</span><span>' + esc(c.name) + '</span></div>').join('');
}
hoverIdx = -1;
custMenu.classList.add('open');
}
function runSearch(term) {
apex.server.process('GET_PROFIT_DETAIL', { x01: 'CUST_SEARCH', x07: term }, {
success: function (d) { showSearchRows(d.rows || []); },
error:   function ()  { custMenu.innerHTML = '<div class="ss-empty">Search failed</div>'; custMenu.classList.add('open'); }
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
parts.push('<b>Period:</b> ' + periodText());
const crumbs = crumbText();
if (crumbs) parts.push('<b>Scope:</b> ' + esc(crumbs));
parts.push('<b>Level:</b> ' + LEVEL_LABEL[currentLevel]);
box.innerHTML = parts.join('<span class="pf-sep">|</span>');
}
function openDocs() {
if (!window.salesDoc) return;
const p = docPeriod();
window.salesDoc.list({ from: p.from, to: p.to, sm: scope.rep || '', cu: scope.cust || '' },
{ crumb: ['Profit Analysis'] });
}
function render() {
document.getElementById('periodBadge').textContent = periodText();
buildPrintFilters();
renderTabs();
if (isRemote()) {
if (typeof apex !== 'undefined' && apex.server) {
loadRemote();
} else {
document.getElementById('tableLoader').style.display = 'block';
document.getElementById('tableLoader').textContent = 'Detail levels require the APEX AJAX process.';
}
} else {
document.getElementById('tableLoader').style.display = 'none';
const monthly = monthlyLocal();
paintKpis(monthly);
drawChart(monthly);
drawTable(decorate(aggregateLocal(localRows(), currentLevel)), currentLevel);
}
}
[yearSel, fromSel, toSel].forEach(el => el.addEventListener('change', render));
document.getElementById('backBtn').addEventListener('click', goBack);
document.getElementById('resetBtn').addEventListener('click', () => {
scope = {}; drillStack = [];
clearCustomerBox();
yearSel.value = new Date().getFullYear().toString();
fromSel.value = months[0];
toSel.value = months[new Date().getMonth()];
resetSort();
currentLevel = 'DEPT';
render();
});
function nowTxt() {
const d = new Date(), p = n => (n < 10 ? '0' : '') + n;
return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
}
function printTitle() {
return 'Co. Dashboard | Profit by ' + LEVEL_LABEL[currentLevel] + (crumbText() ? ' - ' + crumbText() : '') +
' | ' + periodText() + ' | Printed ' + nowTxt();
}
function fileStem() { const p = docPeriod(); return 'Profit_' + currentLevel + '_' + p.from + '_' + p.to; }
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
document.getElementById('printDashBtn').addEventListener('click', () => runPrint(null, 'Profit_Dashboard_' + docPeriod().from + '_' + docPeriod().to));
function excel() {
if (!window.profitExcel) return;
window.profitExcel({
rows: lastRows, level: LEVEL_LABEL[currentLevel], item: currentLevel === 'ITEM',
crumb: crumbText(), period: periodText(),
asof: (document.getElementById('asOfLine') || { textContent: '' }).textContent,
file: fileStem() + '.xlsx'
});
}
(function () {
const box = document.getElementById('exportBox');
if (!box) return;
if (window.jmExport) {
window.jmExport.attach(box, { pdf: printTable, excel: window.profitExcel ? excel : null });
} else {
box.innerHTML = '<button type="button" class="btn-print" id="printTableBtn">Print / PDF</button>';
document.getElementById('printTableBtn').addEventListener('click', printTable);
}
})();
(function () {
const line = document.getElementById('asOfLine');
if (!line) return;
line.classList.add('fresh');
line.textContent = META.archivedThru
? 'Archived thru ' + META.archivedThru + ' - current month live'
: 'Live data';
})();
render();
}
initProfitDashboard();

});
