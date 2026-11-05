window.addEventListener("DOMContentLoaded",function(){
function initPayrollSheet() {
var metaEl = document.getElementById('pay-meta');
if (!metaEl) {
initPayrollSheet._t = (initPayrollSheet._t || 0) + 1;
if (initPayrollSheet._t < 100) { setTimeout(initPayrollSheet, 100); return; }
return;
}
var META = JSON.parse(metaEl.textContent), MONTHS = META.months || [];
var T = window.jmT || function (s) { return s; };
var $ = function (id) { return document.getElementById(id); };
var MN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
var I = { emp: 0, name: 1, dcode: 2, dept: 3, l2: 4, l3: 5, co: 6, gcode: 7, gname: 8, gsort: 9, rotin: 10, basic: 11, housing: 12, transport: 13,
phone: 14, bonus: 15, nature: 16, overtime: 17, partner: 18, saudi: 19, other: 20, gross: 21, loans: 22, insur: 23, delay: 24,
absence: 25, oddct: 26, tddct: 27, net: 28, sl: 29, stl: 30, pay: 31, gsrc: 32, day: 33 };
var COLS = [
['basic', 'Basic', 'E'], ['housing', 'Housing', 'E'], ['transport', 'Transport', 'E'], ['phone', 'Phone', 'E'],
['bonus', 'Bonus', 'E'], ['nature', 'Nature of work', 'E'], ['overtime', 'Overtime', 'E'], ['partner', 'Other 1', 'E'], ['saudi', 'Other 2', 'E'],
['gross', 'Total due', 'E', 1],
['loans', 'Loans', 'D'], ['insur', 'Insurance', 'D'], ['delay', 'Delay', 'D'], ['absence', 'Absence', 'D'],
['oddct', 'Other', 'D'], ['tddct', 'Total deducted', 'D', 1], ['net', 'Net payable', 'N']
];
var st = { y: null, m: null, co: 'ALL', view: 'GROUP', lvl: 'DEPT', rows: 'EMP', emp: '', grp: '', show: 'SHEET', data: null, busy: false };
var lastTot = null, lastGroups = null;
function idxOf(arr, v) { for (var i = 0; i < arr.length; i++) { if (arr[i] === v) { return i; } } return -1; }
function hasVal(arr, v) { return idxOf(arr, v) >= 0; }
function fmt(v) {
v = Math.round((+v || 0) * 100) / 100;
var neg = v < 0, s = Math.abs(v).toFixed(Math.abs(v) % 1 ? 2 : 0);
return (neg ? '-' : '') + s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function pad(n) { return (n < 10 ? '0' : '') + n; }
function dmy(iso) { return iso ? iso.split('-').reverse().join('/') : ''; }
function monthLabel(y, m) { return T(MN[m - 1]) + ' ' + y; }
function nowTxt() { var d = new Date(); return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); }
function coName(k) { return k === 'ITS' ? T('Sister Co.') : T('Co.'); }
function years() { var out = [], i; for (i = 0; i < MONTHS.length; i++) { if (!hasVal(out, MONTHS[i][0])) { out.push(MONTHS[i][0]); } } return out; }
function monthsOf(y) { var out = [], i; for (i = 0; i < MONTHS.length; i++) { if (MONTHS[i][0] === y) { out.push(MONTHS[i]); } } return out; }
function fillYears() { var ys = years(), h = '', i; for (i = 0; i < ys.length; i++) { h += '<option value="' + ys[i] + '">' + ys[i] + '</option>'; } $('fYear').innerHTML = h; }
function fillMonths(y, keep) {
var ms = monthsOf(y), h = '', i, ok = false;
for (i = 0; i < ms.length; i++) { h += '<option value="' + ms[i][1] + '">' + pad(ms[i][1]) + ' - ' + T(MN[ms[i][1] - 1]) + ' (' + ms[i][2] + ')</option>'; if (ms[i][1] === keep) { ok = true; } }
$('fMonth').innerHTML = h;
if (ms.length) { $('fMonth').value = ok ? keep : ms[0][1]; }
}
function chipGroup(id, attr, val) {
var b = $(id).getElementsByTagName('button'), i;
for (i = 0; i < b.length; i++) { b[i].className = 'lvl-btn' + (b[i].getAttribute(attr) === val ? ' active' : ''); }
}
function bindChips(id, attr, key) {
$(id).addEventListener('click', function (e) {
var t = e.target, b = null;
while (t && t !== this) { if (t.tagName === 'BUTTON') { b = t; break; } t = t.parentNode; }
if (!b) { return; }
st[key] = b.getAttribute(attr);
if (key !== 'rows') { st.grp = ''; }
chipGroup(id, attr, st[key]);
render();
});
}
function groupOf(r) {
var d = String(r[I.dcode] || 0), s = (r[I.co] === 'ITS' ? '1' : '0') + d;
if (st.view === 'GROUP') { return { k: 'g' + r[I.gcode], n: r[I.gname], s: ('000' + r[I.gsort]).slice(-3) + s }; }
if (st.lvl === 'CO') { return { k: r[I.co], n: coName(r[I.co]), s: s }; }
if (st.lvl === 'L2') { return { k: r[I.co] + '|' + r[I.l2], n: r[I.l2], s: s }; }
if (st.lvl === 'L3') { return { k: r[I.co] + '|' + r[I.l2] + '|' + r[I.l3], n: r[I.l3], s: s }; }
return { k: 'd' + d, n: r[I.dept], s: s };
}
function visibleRows() {
var out = [], i, r;
if (!st.data) { return out; }
for (i = 0; i < st.data.r.length; i++) {
r = st.data.r[i];
if (st.co !== 'ALL' && r[I.co] !== st.co) { continue; }
if (st.emp && String(r[I.emp]) !== st.emp) { continue; }
out.push(r);
}
return out;
}
function val(r, k) { return k === 'overtime' ? (+r[I.overtime] || 0) + (+r[I.other] || 0) : +r[I[k]] || 0; }
function zero() { var t = { n: 0, partner: 0, saudi: 0 }, i; for (i = 0; i < COLS.length; i++) { t[COLS[i][0]] = 0; } return t; }
function addTo(t, r) {
var i; t.n++;
for (i = 0; i < COLS.length; i++) { t[COLS[i][0]] += val(r, COLS[i][0]); }
}
function buildGroups(rows) {
var map = {}, list = [], i, g, o;
for (i = 0; i < rows.length; i++) {
o = groupOf(rows[i]);
g = map[o.k];
if (!g) { g = { key: o.k, name: o.n, sort: o.s, rows: [], tot: zero() }; map[o.k] = g; list.push(g); }
if (o.s < g.sort) { g.sort = o.s; }
g.rows.push(rows[i]);
addTo(g.tot, rows[i]);
}
list.sort(function (a, b) { return a.sort < b.sort ? -1 : a.sort > b.sort ? 1 : 0; });
for (i = 0; i < list.length; i++) { list[i].rows.sort(function (a, b) { return a[I.emp] - b[I.emp]; }); }
return list;
}
function drawGroupTabs(all) {
var h = '<button type="button" class="lvl-btn' + (st.grp ? '' : ' active') + '" data-g="">' + T('All') + ' <span class="cnt">' + countOf(all) + '</span></button>', i;
for (i = 0; i < all.length; i++) {
h += '<button type="button" class="lvl-btn' + (st.grp === all[i].key ? ' active' : '') + '" data-g="' + esc(all[i].key) + '">' + esc(all[i].name) + ' <span class="cnt">' + all[i].tot.n + '</span></button>';
}
$('grpTabs').innerHTML = h;
$('grpTabs').style.display = all.length > 1 && st.rows !== 'SUM' && st.view === 'GROUP' ? '' : 'none';
}
function countOf(list) { var n = 0, i; for (i = 0; i < list.length; i++) { n += list[i].tot.n; } return n; }
function card(cls, label, value, sub) {
return '<div class="kpi ' + cls + '"><div class="label">' + T(label) + '</div><div class="value">' + value + '</div><div class="sub">' + sub + '</div></div>';
}
function kpi(tot, rows) {
var paid = 0, i, act = tot.net - tot.partner - tot.saudi, d = st.data || {}, cur = ' <span class="cur">' + T('SAR') + '</span>',
parts = [['k-act', 'Net activity payroll', act], ['k-owner', 'Charged to owner current', tot.partner], ['k-saudi', 'Saudi salaries refunded', tot.saudi]],
bar = '', leg = '', p;
for (i = 0; i < rows.length; i++) { if (+rows[i][I.pay] === 1) { paid++; } }
for (i = 0; i < parts.length; i++) {
p = tot.net ? parts[i][2] / tot.net * 100 : 0;
if (p > 0) { bar += '<i class="' + parts[i][0] + '" style="width:' + p.toFixed(2) + '%"></i>'; }
leg += '<div class="mx-i ' + parts[i][0] + '"><span class="mx-l">' + T(parts[i][1]) + '</span><b>' + fmt(parts[i][2]) + '</b><small>' + p.toFixed(1) + '%</small></div>';
}
$('kpiRow').innerHTML = card('k-emp', 'Employees', fmt(tot.n), esc(paid === tot.n ? T('all paid') : paid + ' ' + T('paid')))
+ card('k-gross', 'Total due', fmt(tot.gross) + cur, esc(T('Deductions') + ' ' + fmt(tot.tddct) + ' - ' + T('loans') + ' ' + fmt(tot.loans)))
+ card('k-net', 'Net payable', fmt(tot.net) + cur, esc(d.payDate ? T('paid') + ' ' + dmy(d.payDate) : ''))
+ '<div class="kpi k-mix"><div class="label">' + T('Net payable split') + '</div><div class="mx-bar">' + bar + '</div><div class="mx-leg">' + leg + '</div></div>';
}
function colCls(c) { return 'g' + c[2] + (c[3] ? ' c-sub' : ''); }
var HIDE = { bonus: 1, nature: 1 }, SHOWN = {};
function vis(c) { return !HIDE[c[0]] || SHOWN[c[0]]; }
function nVis(f) { var n = 0, i; for (i = 0; i < COLS.length; i++) { if (COLS[i][2] === f && vis(COLS[i])) { n++; } } return n; }
function headHtml(sum) {
var h = '<thead><tr class="th-top"><th rowspan="2" class="c-no">#</th>', i;
if (sum) { h += '<th rowspan="2" class="c-name">' + T(st.view === 'GROUP' ? 'Payroll group' : 'Department') + '</th><th rowspan="2" class="num c-cnt">' + T('Employees') + '</th>'; }
else { h += '<th rowspan="2" class="c-emp">' + T('Emp.') + '</th><th rowspan="2" class="c-name">' + T('Employee name') + '</th>'; }
h += '<th colspan="' + nVis('E') + '" class="grp-e">' + T('Entitlements') + '</th><th colspan="' + nVis('D') + '" class="grp-d">' + T('Deductions') + '</th><th rowspan="2" class="num c-net">' + T('Net payable') + '</th>';
h += '</tr><tr>';
for (i = 0; i < COLS.length; i++) { if (COLS[i][2] !== 'N' && vis(COLS[i])) { h += '<th class="num ' + colCls(COLS[i]) + '">' + T(COLS[i][1]) + '</th>'; } }
return h + '</tr></thead>';
}
function cells(get) {
var h = '', i, v;
for (i = 0; i < COLS.length; i++) {
if (COLS[i][2] === 'N' || !vis(COLS[i])) { continue; }
v = get(COLS[i][0]);
h += '<td class="num ' + colCls(COLS[i]) + '">' + (v ? fmt(v) : '') + '</td>';
}
return h;
}
function rowHtml(r, n) {
return '<tr class="emp-row' + (r[I.gsrc] === 'NONE' ? ' unmapped' : '') + '"><td class="c-no">' + n + '</td><td class="c-emp">' + r[I.emp] + '</td><td class="c-name">' + esc(r[I.name]) + '</td>'
+ cells(function (k) { return val(r, k); }) + '<td class="num c-net">' + fmt(r[I.net]) + '</td></tr>';
}
function totRow(label, tot, cls, sum) {
return '<tr class="' + cls + '"><td colspan="' + (sum ? 2 : 3) + '">' + label + '</td>' + (sum ? '<td class="num c-cnt">' + tot.n + '</td>' : '')
+ cells(function (k) { return tot[k]; }) + '<td class="num c-net">' + fmt(tot.net) + '</td></tr>';
}
function drawTables(groups, tot) {
var h = '', i, j, g;
if (!groups.length) { $('sheetBody').innerHTML = '<div class="empty">' + T('No computed salaries for this month') + '</div>'; return; }
if (st.rows === 'SUM') {
h = '<table class="pay-table sum-table">' + headHtml(true) + '<tbody>';
for (i = 0; i < groups.length; i++) {
g = groups[i];
h += '<tr class="emp-row drill-row" data-g="' + esc(g.key) + '"><td class="c-no">' + (i + 1) + '</td><td class="c-name"><span class="tw">&#9656;</span> ' + esc(g.name) + '</td><td class="num c-cnt">' + g.tot.n + '</td>'
+ cells(function (k) { return g.tot[k]; }) + '<td class="num c-net">' + fmt(g.tot.net) + '</td></tr>';
}
h += '</tbody><tfoot>' + totRow(T('Grand total'), tot, 'total-row', true) + '</tfoot></table>';
} else {
for (i = 0; i < groups.length; i++) {
g = groups[i];
h += '<div class="grp-block"><div class="grp-title"><span>' + esc(g.name) + '</span><span class="cnt">' + g.tot.n + ' ' + T('employees') + '</span></div>'
+ '<table class="pay-table">' + headHtml(false) + '<tbody>';
for (j = 0; j < g.rows.length; j++) { h += rowHtml(g.rows[j], j + 1); }
h += '</tbody><tfoot>' + totRow(T('Total') + ' - ' + esc(g.name), g.tot, 'sub-row', false) + '</tfoot></table></div>';
}
if (groups.length > 1) {
h += '<div class="grp-block grand-block print-only"><table class="pay-table">' + headHtml(false) + '<tbody></tbody><tfoot>' + totRow(T('Grand total') + ' (' + tot.n + ' ' + T('employees') + ')', tot, 'total-row', false) + '</tfoot></table></div>';
}
}
if (st.rows === 'SUM') {
h += '<div class="pay-footer"><div class="pf-box pf-link" data-pf="partner"><span>' + T('Charged to owner current') + '</span><b>' + fmt(tot.partner) + '</b></div>'
+ '<div class="pf-box pf-link" data-pf="saudi"><span>' + T('Saudi salaries refunded') + '</span><b>' + fmt(tot.saudi) + '</b></div>'
+ '<div class="pf-box pf-main"><span>' + T('Net activity payroll') + '</span><b>' + fmt(tot.net - tot.partner - tot.saudi) + '</b></div></div>';
}
$('sheetBody').innerHTML = '<table class="pw"><thead><tr><td>' + printHead() + '</td></tr></thead><tbody><tr><td>' + h + '</td></tr></tbody></table>';
}
function printHead(detail) {
var AR = window.JM_LANG === 'AR', co = '', g = '', i, sc = [];
var mon = AR ? T('For the month of') + ' ' + T(MN[st.m - 1]) + ' ' + T('Payroll year word') + ' ' + st.y : 'For the month of ' + MN[st.m - 1] + ' ' + st.y;
if (st.co !== 'ALL') { sc.push(T('Company') + ': ' + coName(st.co)); }
for (i = 0; lastAll && i < lastAll.length; i++) { if (lastAll[i].key === st.grp) { g = lastAll[i].name; } }
if (g) { sc.push(T('Group') + ': ' + g); }
if (st.view !== 'GROUP') { sc.push(viewName()); }
co = sc.length ? '<div class="pw-sc">' + esc(sc.join('  -  ')) + '</div>' : '';
return '<div class="pw-head"><div class="pw-t">' + esc(T(st.rows === 'SUM' && !detail ? 'Payroll summary statement' : 'Employees payroll statement')) + '</div><div class="pw-m">' + esc(mon) + '</div>' + co + '</div>';
}
function viewName() {
if (st.view === 'GROUP') { return T('By payroll group'); }
return st.lvl === 'CO' ? T('By company') : st.lvl === 'L2' ? T('By division') : st.lvl === 'L3' ? T('By section') : T('By department');
}
function entryLinks(rows, k) {
var seen = [], i, v, out = [];
for (i = 0; i < rows.length; i++) { v = rows[i][I[k]]; if (v && !hasVal(seen, v)) { seen.push(v); } }
for (i = 0; i < seen.length; i++) {
out.push(window.jmEntry && window.jmEntry.open ? '<a href="javascript:void(0)" class="ent-lnk" data-e="' + esc(seen[i]) + '">' + esc(seen[i]) + '</a>' : esc(seen[i]));
}
return out.join(', ');
}
function titles(tot, rows) {
var co = st.co === 'ALL' ? T('Both companies') : coName(st.co), d = st.data || {}, sep = '<span class="pf-sep">|</span>',
gName = '', i, eA = entryLinks(rows, 'sl'), eP = entryLinks(rows, 'stl');
for (i = 0; lastAll && i < lastAll.length; i++) { if (lastAll[i].key === st.grp) { gName = lastAll[i].name; } }
$('periodBadge').textContent = monthLabel(st.y, st.m);
$('tableTitleText').textContent = T('Payroll sheet') + ' - ' + viewName() + (gName ? ' - ' + gName : '') + (st.rows === 'SUM' ? ' - ' + T('Group totals') : '');
$('tableSub').innerHTML = esc(co + ' - ' + tot.n + ' ' + T('employees'))
+ (d.payDate ? sep + esc(T('Paid') + ' ' + dmy(d.payDate)) + (eP ? ' ' + esc(T('Entry')) + ' ' + eP : '') : '')
+ (d.accDate ? sep + esc(T('Accrued') + ' ' + dmy(d.accDate)) + (eA ? ' ' + esc(T('Entry')) + ' ' + eA : '') : '');
$('printFilters').innerHTML = '<b>' + T('Period') + ':</b> ' + monthLabel(st.y, st.m) + sep + '<b>' + T('Company') + ':</b> ' + co + (gName ? sep + '<b>' + T('Group') + ':</b> ' + esc(gName) : '')
+ sep + '<b>' + T('Employees') + ':</b> ' + tot.n
+ (d.payDate ? sep + '<b>' + T('Paid') + ':</b> ' + dmy(d.payDate) : '') + (d.accDate ? sep + '<b>' + T('Accrued') + ':</b> ' + dmy(d.accDate) : '');
window.payPrintInfo = { title: T('Payroll sheet') + ' - ' + viewName() + (gName ? ' - ' + gName : '') + (st.rows === 'SUM' ? ' - ' + T('Group totals') : ''), at: T('Printed') + ' ' + nowTxt() };
}
var lastAll = null;
function render() {
if (!st.data) { return; }
var base = visibleRows(), all = buildGroups(base), groups = [], rows = [], tot = zero(), i, j;
if (st.rows === 'SUM') { st.grp = ''; }
SHOWN = {};
for (i = 0; i < st.data.r.length; i++) { for (j in HIDE) { if (+st.data.r[i][I[j]]) { SHOWN[j] = 1; } } }
for (i = 0; i < all.length; i++) { if (all[i].key === st.grp) { groups.push(all[i]); } }
if (!groups.length) { st.grp = ''; groups = all; }
for (i = 0; i < groups.length; i++) { for (j = 0; j < groups[i].rows.length; j++) { rows.push(groups[i].rows[j]); addTo(tot, groups[i].rows[j]); } }
lastAll = all;
$('levelGroup').style.display = st.view === 'DEPT' ? '' : 'none';
drawShowTabs();
kpi(tot, rows);
if (st.show === 'LOANS') { loans(); return; }
if (st.show !== 'SHEET') { drawStatus(); return; }
drawGroupTabs(all);
drawTables(groups, tot);
titles(tot, rows);
lastTot = tot; lastGroups = groups;
}
var S = { emp: 0, name: 1, gname: 2, gsort: 3, dept: 4, co: 5, oy: 6, om: 7, od: 8, leave: 9, lt: 10, ls: 11, le: 12, nc: 13 };
function statusRows(kind) {
var out = [], i, r, d = st.data || {}, q = st.emp;
for (i = 0; d.st && i < d.st.length; i++) {
r = d.st[i];
if ((kind === 'NOCALC') !== (+r[S.nc] === 1) || (kind !== 'NOCALC' && (kind === 'LEAVE') !== (+r[S.leave] === 1))) { continue; }
if (st.co !== 'ALL' && r[S.co] !== st.co) { continue; }
if (q && String(r[S.emp]) !== q) { continue; }
out.push(r);
}
return out;
}
function drawShowTabs() {
var nl = statusRows('LEAVE').length, nt = statusRows('LATE').length, nn = statusRows('NOCALC').length;
$('showChips').innerHTML = '<button type="button" class="lvl-btn' + (st.show === 'SHEET' ? ' active' : '') + '" data-show="SHEET">' + T('Payroll sheet') + '</button>'
+ '<button type="button" class="lvl-btn' + (st.show === 'LEAVE' ? ' active' : '') + '" data-show="LEAVE">' + T('On leave') + ' <span class="cnt">' + nl + '</span></button>'
+ '<button type="button" class="lvl-btn' + (st.show === 'LATE' ? ' active' : '') + '" data-show="LATE">' + T('Late payroll month') + ' <span class="cnt' + (nt ? ' cnt-bad' : '') + '">' + nt + '</span></button>'
+ '<button type="button" class="lvl-btn' + (st.show === 'NOCALC' ? ' active' : '') + '" data-show="NOCALC">' + T('No salary computed') + ' <span class="cnt' + (nn ? ' cnt-bad' : '') + '">' + nn + '</span></button>'
+ (window.payLoans ? '<button type="button" class="lvl-btn' + (st.show === 'LOANS' ? ' active' : '') + '" data-show="LOANS">' + T('Loans statement') + '</button>' : '');
document.body.classList.toggle('pay-status', st.show !== 'SHEET');
}
function days(a, b) { return Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 864e5); }
function leaveName(t) { return +t === 12 ? T('Annual leave') : +t ? T('Leave') + ' ' + t : ''; }
function drawStatus() {
var rows = statusRows(st.show), today = (st.data || {}).today || '', h, i, r, late, note, sep = '<span class="pf-sep">|</span>', title;
title = T(st.show === 'LEAVE' ? 'Employees on leave' : st.show === 'NOCALC' ? 'Employees without a computed salary' : 'Employees with a late payroll month');
h = '<table class="pay-table st-table"><thead><tr><th class="c-no">#</th><th class="c-emp">' + T('Emp.') + '</th><th class="c-name">' + T('Employee name') + '</th><th>' + T('Payroll group') + '</th><th>' + T('Department') + '</th>'
+ '<th>' + T('Open payroll month') + '</th>' + (st.show === 'LEAVE' ? '<th>' + T('Leave') + '</th><th>' + T('From') + '</th><th>' + T('Planned return') + '</th>' : '') + '<th>' + T('Status') + '</th></tr></thead><tbody>';
for (i = 0; i < rows.length; i++) {
r = rows[i];
late = st.show === 'LEAVE' && r[S.le] && r[S.le] < today;
note = st.show === 'NOCALC' ? '<span class="st-bad">' + T('Salary not computed for the month - not on leave') + '</span>' : st.show === 'LATE' ? '<span class="st-bad">' + T('Open month older than the current month - not on leave') + '</span>'
: late ? '<span class="st-warn">' + T('Past planned return') + ' (' + days(r[S.le], today) + ' ' + T('days') + ')</span>' : '<span class="st-ok">' + T('On leave') + '</span>';
h += '<tr class="emp-row' + (late || st.show !== 'LEAVE' ? ' st-flag' : '') + '"><td class="c-no">' + (i + 1) + '</td><td class="c-emp">' + r[S.emp] + '</td><td class="c-name">' + esc(r[S.name]) + '</td><td>' + esc(r[S.gname]) + '</td><td>' + esc(r[S.dept]) + '</td>'
+ '<td class="num">' + pad(r[S.om]) + '/' + r[S.oy] + (+r[S.od] > 1 ? ' <small>(' + T('from day') + ' ' + r[S.od] + ')</small>' : '') + '</td>'
+ (st.show === 'LEAVE' ? '<td>' + esc(leaveName(r[S.lt])) + '</td><td class="num">' + dmy(r[S.ls]) + '</td><td class="num">' + dmy(r[S.le]) + '</td>' : '')
+ '<td>' + note + '</td></tr>';
}
if (!rows.length) { h += '<tr><td colspan="' + (st.show === 'LEAVE' ? 10 : 7) + '" class="empty">' + T(st.show === 'LEAVE' ? 'No employee on leave' : 'No employee with a late payroll month') + '</td></tr>'; }
h += '</tbody></table>';
$('grpTabs').style.display = 'none';
$('sheetBody').innerHTML = '<table class="pw"><thead><tr><td><div class="pw-head"><div class="pw-t">' + esc(title) + '</div><div class="pw-m">' + esc(T('As of') + ' ' + dmy(today)) + '</div></div></td></tr></thead><tbody><tr><td>' + h + '</td></tr></tbody></table>';
$('tableTitleText').textContent = title;
$('tableSub').innerHTML = esc(rows.length + ' ' + T('employees') + ' - ' + T('As of') + ' ' + dmy(today));
$('printFilters').innerHTML = '<b>' + T('As of') + ':</b> ' + dmy(today) + sep + '<b>' + T('Employees') + ':</b> ' + rows.length;
window.payPrintInfo = { title: title, at: T('Printed') + ' ' + nowTxt() };
lastStatus = { rows: rows, title: title };
}
var lastStatus = null;
$('showChips').addEventListener('click', function (e) {
var t = e.target;
while (t && t !== this && t.tagName !== 'BUTTON') { t = t.parentNode; }
if (!t || t === this) { return; }
st.show = t.getAttribute('data-show'); st.grp = '';
if (st.show !== 'SHEET') { window.payClearEmp(); }
render();
});
function groupWin(key) {
var g = null, i, j, h;
for (i = 0; lastAll && i < lastAll.length; i++) { if (lastAll[i].key === key) { g = lastAll[i]; } }
if (!g) { return; }
h = '<table class="pay-table">' + headHtml(false) + '<tbody>';
for (j = 0; j < g.rows.length; j++) { h += rowHtml(g.rows[j], j + 1); }
h += '</tbody><tfoot>' + totRow(T('Total') + ' - ' + esc(g.name), g.tot, 'sub-row', false) + '</tfoot></table>';
openWin(g.name, g.tot.n, h, printHead(true));
}
function openWin(name, n, body, ph) {
var o = $('payGw'), mon = monthLabel(st.y, st.m);
if (!o) {
o = document.createElement('div'); o.id = 'payGw'; o.className = 'pgw-ov'; document.body.appendChild(o);
o.addEventListener('click', function (e) {
var t = e.target, orig;
if (t.closest && t.closest('[data-pgw-p]')) {
orig = document.title; document.title = 'Payroll_' + st.y + '_' + pad(st.m) + '_' + o.getAttribute('data-k');
document.body.classList.add('pgw-printing');
var back = function () { document.body.classList.remove('pgw-printing'); document.title = orig; window.removeEventListener('afterprint', back); };
window.addEventListener('afterprint', back); window.print(); return;
}
if (t === o || (t.closest && t.closest('[data-pgw-x]'))) { o.style.display = 'none'; }
});
document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && o.style.display !== 'none') { o.style.display = 'none'; } });
}
o.innerHTML = '<div class="pgw-box"><div class="pgw-top"><span>' + esc(name) + ' <span class="cnt">' + n + ' ' + esc(T('employees')) + '</span>'
+ '<small class="pgw-from">' + esc(T('Opened from') + ': ' + T('Payroll sheet') + ' - ' + mon) + '</small></span>'
+ '<div><button type="button" data-pgw-p>&#8681; ' + esc(T('Export PDF')) + '</button><button type="button" data-pgw-x>&times; ' + esc(T('Close')) + '</button></div></div>'
+ '<div class="pgw-body"><div class="pgw-ph">' + ph + '<div class="pw-sc">' + esc(name) + '</div></div><div class="table-scroll">' + body + '</div></div></div>';
o.setAttribute('data-k', String(name).replace(/[^A-Za-z0-9]+/g, '_') || 'group');
o.style.display = 'flex';
}
$('sheetBody').addEventListener('click', function (e) {
var t = e.target;
while (t && t !== this && !(t.tagName === 'TR' && t.getAttribute('data-g') !== null)) { t = t.parentNode; }
if (t && t !== this && st.rows === 'SUM') { groupWin(t.getAttribute('data-g')); return; }
t = e.target.closest ? e.target.closest('[data-pf]') : null;
if (t && window.payAmtList) {
var k = t.getAttribute('data-pf'), rows = [], i, j, g;
for (i = 0; lastGroups && i < lastGroups.length; i++) { g = lastGroups[i]; for (j = 0; j < g.rows.length; j++) { if (+g.rows[j][I[k]]) { rows.push([g.rows[j][I.emp], g.rows[j][I.name], g.rows[j][I.gname], +g.rows[j][I[k]]]); } } }
window.payAmtList(t.querySelector('span').textContent, rows, printHead(true));
}
});
window.payOpenWin = openWin;
$('grpTabs').addEventListener('click', function (e) {
var t = e.target;
while (t && t !== this && t.tagName !== 'BUTTON') { t = t.parentNode; }
if (!t || t === this) { return; }
st.grp = t.getAttribute('data-g') || '';
render();
});
$('tableSub').addEventListener('click', function (e) {
var a = e.target, p;
if (!a || !a.getAttribute || !a.getAttribute('data-e') || !window.jmEntry) { return; }
p = a.getAttribute('data-e').split('/');
window.jmEntry.open(p[0], p[1], p[2]);
});
function load() {
if (st.busy) { return; }
st.busy = true;
$('tableLoader').style.display = '';
apex.server.process('PAYROLL_AJAX', { x01: st.y, x02: st.m }, {
dataType: 'json',
success: function (d) {
st.busy = false;
$('tableLoader').style.display = 'none';
if (!d || d.error) { $('sheetBody').innerHTML = '<div class="empty">' + esc(d && d.error ? d.error : 'error') + '</div>'; return; }
st.data = d;
render();
},
error: function () { st.busy = false; $('tableLoader').style.display = 'none'; }
});
}
(function () {
var inp = $('empInput'), menu = $('empMenu'), clr = $('empClear'), box = $('empBox'), hi = -1, t = null;
function close() { menu.className = 'ss-menu'; hi = -1; }
function list() {
var q = inp.value.replace(/^\s+|\s+$/g, ''), ql = q.toLowerCase(), i, r, h = '', n = 0;
clr.style.display = q ? '' : 'none';
if (!q || !st.data) { close(); return; }
for (i = 0; i < st.data.r.length && n < 15; i++) {
r = st.data.r[i];
if (String(r[I.emp]).indexOf(q) === 0 || String(r[I.name]).toLowerCase().indexOf(ql) >= 0) {
h += '<div class="ss-option" data-e="' + r[I.emp] + '" data-n="' + esc(r[I.name]) + '"><span class="ss-code">' + r[I.emp] + '</span><span>' + esc(r[I.name]) + '</span><span class="ss-dept">' + esc(r[I.gname]) + '</span></div>';
n++;
}
}
menu.innerHTML = h || '<div class="ss-empty">' + T('No matching employee') + '</div>';
menu.className = 'ss-menu open'; hi = -1;
}
function pick(o) {
if (!o || !o.getAttribute('data-e')) { return; }
st.emp = o.getAttribute('data-e'); st.grp = '';
inp.value = o.getAttribute('data-e') + ' - ' + o.getAttribute('data-n');
box.className = 'search-select picked'; clr.style.display = ''; close(); render();
}
function clear() { inp.value = ''; st.emp = ''; box.className = 'search-select'; clr.style.display = 'none'; close(); render(); }
inp.addEventListener('input', function () { box.className = 'search-select'; clearTimeout(t); t = setTimeout(list, 120); });
inp.addEventListener('keydown', function (e) {
var o = menu.querySelectorAll('.ss-option'), i;
if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
e.preventDefault();
if (!o.length) { return; }
hi = e.key === 'ArrowDown' ? Math.min(hi + 1, o.length - 1) : Math.max(hi - 1, 0);
for (i = 0; i < o.length; i++) { o[i].className = 'ss-option' + (i === hi ? ' active' : ''); }
o[hi].scrollIntoView({ block: 'nearest' });
} else if (e.key === 'Enter') {
e.preventDefault();
pick(hi >= 0 ? o[hi] : o[0]);
} else if (e.key === 'Escape') { close(); }
});
menu.addEventListener('click', function (e) {
var o = e.target;
while (o && o !== menu && !(o.getAttribute && o.getAttribute('data-e'))) { o = o.parentNode; }
if (o && o !== menu) { pick(o); }
});
clr.addEventListener('click', clear);
document.addEventListener('click', function (e) { if (!box.contains(e.target)) { close(); } });
window.payClearEmp = function () { inp.value = ''; st.emp = ''; box.className = 'search-select'; clr.style.display = 'none'; close(); };
})();
function fileStem() { return 'Payroll_' + st.y + '_' + pad(st.m) + '_' + (st.view === 'GROUP' ? 'GROUP' : st.lvl) + (st.co === 'ALL' ? '' : '_' + st.co); }
function runPrint() {
var orig = document.title;
document.title = fileStem();
document.body.classList.add('print-mode-table');
var restore = function () { document.title = orig; document.body.classList.remove('print-mode-table'); window.removeEventListener('afterprint', restore); };
window.addEventListener('afterprint', restore);
window.print();
}
function loans() {
var who = {}, slip = {}, i, r, d = st.data || {};
for (i = 0; d.st && i < d.st.length; i++) { r = d.st[i]; who[r[S.emp]] = { co: r[S.co], gname: r[S.gname], gsort: r[S.gsort] }; }
for (i = 0; i < d.r.length; i++) { r = d.r[i]; who[r[I.emp]] = { co: r[I.co], gname: r[I.gname], gsort: r[I.gsort] }; slip[r[I.emp]] = (slip[r[I.emp]] || 0) + (+r[I.loans] || 0); }
$('grpTabs').style.display = 'none';
window.payLoans.show({ el: $('sheetBody'), y: st.y, m: st.m, co: st.co,
who: function (e) { return who[e] || { co: '', gname: '', gsort: 99 }; }, slip: function (e) { return slip[e] || 0; },
title: function (t, sub) { $('tableTitleText').textContent = t; $('tableSub').textContent = sub; $('printFilters').innerHTML = esc(sub); window.payPrintInfo = { title: t, at: T('Printed') + ' ' + nowTxt() }; } });
}
function excel() {
if (st.show === 'LOANS') { if (window.payLoans) { window.payLoans.excel(); } return; }
var i, r, L = [];
if (st.show !== 'SHEET') {
if (!window.svXlsx || !lastStatus) { return; }
for (i = 0; i < lastStatus.rows.length; i++) {
r = lastStatus.rows[i];
L.push([[r[S.emp], 3], [r[S.name], 0], [r[S.gname], 0], [r[S.dept], 0], [pad(r[S.om]) + '/' + r[S.oy], 0], [leaveName(r[S.lt]), 0], [dmy(r[S.ls]), 0], [dmy(r[S.le]), 0]]);
}
window.svXlsx.save(lastStatus.title, [T('Emp.'), T('Employee name'), T('Payroll group'), T('Department'), T('Open payroll month'), T('Leave'), T('From'), T('Planned return')], L,
'<cols><col min="1" max="1" width="9" customWidth="1"/><col min="2" max="2" width="34" customWidth="1"/><col min="3" max="4" width="24" customWidth="1"/><col min="5" max="8" width="14" customWidth="1"/></cols>',
'Payroll_' + st.show + '.xlsx', 'Payroll');
return;
}
if (!window.payExcel || !lastGroups) { return; }
window.payExcel({ groups: lastGroups, tot: lastTot, cols: COLS.filter(vis), I: I, val: val, sum: st.rows === 'SUM', title: (window.payPrintInfo || {}).title + ' - ' + monthLabel(st.y, st.m), file: fileStem() + '.xlsx', T: T });
}
(function () {
var box = $('exportBox');
if (window.jmExport) { window.jmExport.attach(box, { pdf: runPrint, excel: window.payExcel ? excel : null }); }
else {
box.innerHTML = '<button type="button" class="btn-print" id="xlsBtn">Excel</button> <button type="button" class="btn-print" id="pdfBtn">Print / PDF</button>';
$('xlsBtn').addEventListener('click', excel); $('pdfBtn').addEventListener('click', runPrint);
}
})();
fillYears();
if (MONTHS.length) { st.y = MONTHS[0][0]; st.m = MONTHS[0][1]; $('fYear').value = st.y; fillMonths(st.y, st.m); }
$('fYear').addEventListener('change', function () { st.y = +this.value; fillMonths(st.y); st.m = +$('fMonth').value; load(); });
$('fMonth').addEventListener('change', function () { st.m = +this.value; load(); });
bindChips('coChips', 'data-co', 'co');
bindChips('viewChips', 'data-view', 'view');
bindChips('lvlChips', 'data-lvl', 'lvl');
bindChips('rowChips', 'data-rows', 'rows');
$('resetBtn').addEventListener('click', function () {
st.co = 'ALL'; st.view = 'GROUP'; st.lvl = 'DEPT'; st.rows = 'EMP'; st.grp = ''; st.show = 'SHEET'; window.payClearEmp();
chipGroup('coChips', 'data-co', 'ALL'); chipGroup('viewChips', 'data-view', 'GROUP'); chipGroup('lvlChips', 'data-lvl', 'DEPT'); chipGroup('rowChips', 'data-rows', 'EMP');
if (MONTHS.length && (st.y !== MONTHS[0][0] || st.m !== MONTHS[0][1])) { st.y = MONTHS[0][0]; st.m = MONTHS[0][1]; $('fYear').value = st.y; fillMonths(st.y, st.m); load(); } else { render(); }
});
$('asOfLine').textContent = T('Live from the payroll system') + ' - ' + nowTxt();
$('levelGroup').style.display = 'none';
if (MONTHS.length) { load(); } else { $('sheetBody').innerHTML = '<div class="empty">' + T('No computed salaries for this month') + '</div>'; }
}
initPayrollSheet();

});
