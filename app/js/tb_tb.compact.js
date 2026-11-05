window.addEventListener("DOMContentLoaded",function(){
function initTrialBalance() {
function $(id) { return document['getElementById'](id); }
var ids = ['tb-accts','tb-levels','tb-rows','tb-meta','tb-cost1','tb-cost2','tb-clevels','tb-c2used'];
var els = {}, miss = false, i;
for (i = 0; i < ids.length; i++) {
els[ids[i]] = $(ids[i]);
if (!els[ids[i]]) miss = true;
}
if (miss) {
initTrialBalance._t = (initTrialBalance._t || 0) + 1;
if (initTrialBalance._t < 100) { setTimeout(initTrialBalance, 100); return; }
console.error('Trial Balance: data regions not found.');
return;
}
var ACCTS  = JSON.parse(els['tb-accts'].textContent);
var LEVELS = JSON.parse(els['tb-levels'].textContent);
var ROWS   = JSON.parse(els['tb-rows'].textContent);
var META   = JSON.parse(els['tb-meta'].textContent);
var C1     = JSON.parse(els['tb-cost1'].textContent);
var C2     = JSON.parse(els['tb-cost2'].textContent);
var CL     = JSON.parse(els['tb-clevels'].textContent);
var C2USED = JSON.parse(els['tb-c2used'].textContent);
function idxOf(arr, v) { for (var j = 0; j < arr.length; j++) if (arr[j] === v) return j; return -1; }
function hasVal(arr, v) { return idxOf(arr, v) !== -1; }
function esc(s) {
return String(s).replace(/[&<>"]/g, function (m) {
return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m];
});
}
function r2(v) { return Math.round(v * 100) / 100; }
function fmt(v) {
return r2(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
var MN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function lab(m) { return m ? MN[+m.slice(4, 6) - 1] + ' ' + m.slice(0, 4) : '-'; }
function prevOf(m) {
var y = +m.slice(0, 4), mm = +m.slice(4, 6);
return mm === 1 ? (y - 1) + '12' : y + ('0' + (mm - 1)).slice(-2);
}
var SEP = '<span class="crumb-sep">' + String.fromCharCode(8250) + '</span>';
var DASH = '&mdash;';
var AMAP = {};
for (i = 0; i < ACCTS.length; i++) AMAP[ACCTS[i].a] = ACCTS[i];
var ENDS = [], LVLOF = {};
for (i = 0; i < LEVELS.length; i++) { ENDS.push(LEVELS[i].e); LVLOF[LEVELS[i].e] = LEVELS[i].lv; }
ENDS.sort(function (a, b) { return a - b; });
var MAXEND = ENDS[ENDS.length - 1];
function pad(p) { var s = String(p); while (s.length < MAXEND) s += '0'; return s; }
function nameOf(p) { var a = AMAP[pad(p)]; return a ? a.n : p; }
var C1MAP = {}, C2MAP = {};
for (i = 0; i < C1.length; i++) C1MAP[C1[i].c] = C1[i];
for (i = 0; i < C2.length; i++) C2MAP[C2[i].c] = C2[i];
function cName(map, code) {
var x = map[String(code)];
return x ? x.n : String(code);
}
var view = 'TB', stAcc = '', ST = null, EN = null;
var scope = '', end = ENDS[0];
var sortKey = 'a', sortDir = 1;
var stack = [];
var FROM = META.defFrom, TO = META.defTo;
var selC1 = '', selC2A = '';
function inScope(a) { return !scope || a.slice(0, scope.length) === scope; }
function grouped() {
var g = {}, out = [], k, o, r;
for (var j = 0; j < ROWS.length; j++) {
r = ROWS[j];
if (!inScope(r.a)) continue;
k = r.a.slice(0, end);
o = g[k];
if (!o) { o = g[k] = { a: k, op: 0, dr: 0, cr: 0 }; out.push(o); }
o.op += r.op; o.dr += r.dr; o.cr += r.cr;
}
for (var x = 0; x < out.length; x++) {
o = out[x];
o.op = r2(o.op); o.dr = r2(o.dr); o.cr = r2(o.cr);
o.cl = r2(o.op + o.dr - o.cr);
o.name = nameOf(o.a);
}
return out;
}
function totalsOf(list) {
var t = { opd: 0, opc: 0, dr: 0, cr: 0, cld: 0, clc: 0 };
for (var j = 0; j < list.length; j++) {
var o = list[j];
if (o.op > 0) t.opd += o.op; else t.opc += -o.op;
t.dr += o.dr; t.cr += o.cr;
if (o.cl > 0) t.cld += o.cl; else t.clc += -o.cl;
}
t.opd = r2(t.opd); t.opc = r2(t.opc); t.dr = r2(t.dr);
t.cr = r2(t.cr); t.cld = r2(t.cld); t.clc = r2(t.clc);
return t;
}
function costActive() { return !!(selC1 || selC2A || SELB.length); }
function effC2() { return SELB.length ? SELB.join(':') : selC2A; }
function sideCells(v) {
if (v > 0.005)  return '<td class="num">' + fmt(v) + '</td><td class="num z">' + DASH + '</td>';
if (v < -0.005) return '<td class="num z">' + DASH + '</td><td class="num">' + fmt(-v) + '</td>';
return '<td class="num z">' + DASH + '</td><td class="num z">' + DASH + '</td>';
}
function movCell(v) {
if (Math.abs(v) > 0.005) return '<td class="num">' + fmt(v) + '</td>';
return '<td class="num z">' + DASH + '</td>';
}
function rowCells(o) { return sideCells(o.op) + movCell(o.dr) + movCell(o.cr) + sideCells(o.cl); }
var COLS = [
{ k: 'a',  t: 'ACCOUNT', txt: 1 },
{ k: 'op', t: 'OPENING DR' },
{ k: 'op', t: 'OPENING CR' },
{ k: 'dr', t: 'DEBIT' },
{ k: 'cr', t: 'CREDIT' },
{ k: 'cl', t: 'CLOSING DR' },
{ k: 'cl', t: 'CLOSING CR' }
];
function headHtml() {
var h = '<tr class="print-title-row"><th colspan="' + COLS.length + '">' + printTitle() + '</th></tr><tr>';
for (var j = 0; j < COLS.length; j++) {
var c = COLS[j];
h += '<th class="' + (c.txt ? '' : 'num') +
(sortKey === c.k ? ' sorted' + (sortDir === 1 ? ' asc' : '') : '') +
'" data-k="' + c.k + '">' + c.t + '</th>';
}
return h + '</tr>';
}
function bindSort() {
var ths = document.querySelectorAll('#tableHead th[data-k]');
for (var j = 0; j < ths.length; j++) {
ths[j].addEventListener('click', function () {
var k = this.dataset.k;
if (sortKey === k) sortDir = -sortDir;
else { sortKey = k; sortDir = k === 'a' ? 1 : -1; }
render();
});
}
}
function sortList(list) {
list.sort(function (a, b) {
var x = a[sortKey], y = b[sortKey];
return (x < y ? -1 : 1) * sortDir;
});
return list;
}
function pushState() { stack.push({ sc: scope, en: end, sk: sortKey, sd: sortDir }); }
function bindDrill() {
var trs = document.querySelectorAll('#tableBody tr.drill-row');
for (var j = 0; j < trs.length; j++) {
trs[j].querySelector('td').addEventListener('click', function () {
var k = this.parentNode.dataset.k;
if (end < MAXEND) {
pushState();
scope = k;
end = ENDS[idxOf(ENDS, k.length) + 1];
sortKey = 'a'; sortDir = 1;
render();
} else {
openStmt(k);
}
});
}
}
$('backBtn').addEventListener('click', function () {
var s = stack.pop();
if (!s) return;
if (s.v === 'ST') { view = 'ST'; EN = null; render(); return; }
view = 'TB'; stAcc = ''; ST = null; EN = null; clearAccBox();
scope = s.sc; end = s.en; sortKey = s.sk; sortDir = s.sd;
render();
});
function openStmt(acc) {
if (view === 'TB') pushState();
fetchStmt(acc);
}
function fetchStmt(acc) {
apex.server.process('TB_AJAX', {
x01: 'stmt', x02: FROM, x03: TO, x04: selC1, x05: effC2(), x06: acc
}, {
success: function (d) {
if (d && d.err) { alert(d.err); return; }
ST = d; stAcc = acc; view = 'ST'; EN = null;
stFltReset();
render();
},
error: function () { alert('Could not load the statement.'); }
});
}
function openEntry(y, t, n) { if (window.jmEntry && window.jmEntry.open) { window.jmEntry.open(y, t, n); } }
function paintTabs() {
var box = $('levelTabs');
if (view !== 'TB' || costActive()) { box.innerHTML = ''; }
else {
var h = '';
for (var j = 0; j < ENDS.length; j++) {
var e = ENDS[j];
if (e <= scope.length) continue;
h += '<button type="button" class="lvl-btn' + (e === end ? ' active' : '') +
'" data-e="' + e + '">Level ' + LVLOF[e] + '</button>';
}
box.innerHTML = h;
var btns = box.querySelectorAll('.lvl-btn');
for (var x = 0; x < btns.length; x++) {
btns[x].addEventListener('click', function () {
end = +this.dataset.e;
sortKey = 'a'; sortDir = 1;
render();
});
}
}
$('backBtn').style.display = stack.length ? '' : 'none';
}
function gotoScope(p) {
if (view !== 'TB') { view = 'TB'; stAcc = ''; ST = null; EN = null; clearAccBox(); }
else if (p === scope) return;
for (var j = 0; j < stack.length; j++) {
if (stack[j].sc === p) {
var s = stack[j];
stack.length = j;
scope = s.sc; end = s.en; sortKey = s.sk; sortDir = s.sd;
render();
return;
}
}
if (p !== scope) {
stack.length = 0;
scope = p;
end = ENDS[idxOf(ENDS, p.length) + 1] || MAXEND;
sortKey = 'a'; sortDir = 1;
}
render();
}
function pathText() {
var parts = [];
if (!scope) parts.push('All Accounts');
else for (var j = 0; j < ENDS.length; j++)
if (ENDS[j] <= scope.length) parts.push(nameOf(scope.slice(0, ENDS[j])));
if (stAcc && view !== 'TB') parts.push(nameOf(stAcc));
if (view === 'EN' && EN) parts.push('Entry ' + EN.ref);
return parts.join(' > ');
}
function paintCrumbs() {
var deep = view !== 'TB';
var h = (scope || deep)
? '<span class="crumb click" data-p="">ALL ACCOUNTS</span>'
: '<span class="crumb last">ALL ACCOUNTS</span>';
for (var j = 0; j < ENDS.length; j++) {
var e = ENDS[j];
if (e > scope.length) break;
var p = scope.slice(0, e);
var last = e === scope.length && !deep;
h += SEP + '<span class="crumb' + (last ? ' last' : ' click') +
'"' + (last ? '' : ' data-p="' + esc(p) + '"') + '>' +
esc(nameOf(p)) + '</span>';
}
if (stAcc && deep) {
h += SEP + (view === 'ST'
? '<span class="crumb last">' + esc(nameOf(stAcc)) + '</span>'
: '<span class="crumb click" data-b="1">' + esc(nameOf(stAcc)) + '</span>');
}
if (view === 'EN' && EN)
h += SEP + '<span class="crumb last">Entry ' + esc(EN.ref) + '</span>';
var box = $('crumbs');
box.innerHTML = h;
var cs = box.querySelectorAll('.crumb.click');
for (var x = 0; x < cs.length; x++) {
cs[x].addEventListener('click', function () {
if (this.dataset.b) { $('backBtn').click(); return; }
gotoScope(this.dataset.p || '');
});
}
}
function costText() {
var parts = [];
if (selC1) parts.push('C1: ' + selText(c1Sel));
if (SELB.length) parts.push('C2: ' + (SELB.length === 1
? (BNAMES[SELB[0]] || SELB[0]) : SELB.length + ' selected'));
else if (selC2A) parts.push('C2: ' + selText(c2aSel));
return parts.length ? parts.join(' / ') : 'All';
}
function paintBal(lbl, val, cls, sub) {
$('balLbl').textContent = lbl;
var v = $('balVal');
v.textContent = val;
v.className = 'value' + (cls ? ' ' + cls : '');
$('balSub').textContent = sub || '';
}
function paintKpis() {
var h;
if (view === 'EN') {
var nv = netOf(EN.lines);
var okE = Math.abs(nv) <= 0.005;
h = 'Journal Entry <b>' + esc(EN.ref) + '</b> &middot; ' + esc(EN.dt) +
(EN.ds ? ' &middot; ' + esc(EN.ds) : '');
paintBal('ENTRY CHECK', okE ? 'BALANCED' : fmt(nv),
okE ? 'v-ok' : 'v-neg', 'Entry ' + EN.ref + ' - debit minus credit');
} else if (view === 'ST') {
var cl = ST ? r2(ST.op + netOf(ST.lines)) : 0;
h = 'Account Statement: <b>' + esc(pad(stAcc)) + ' ' + esc(nameOf(stAcc)) + '</b> &middot; ' +
esc(lab(FROM)) + ' &#8594; ' + esc(lab(TO)) +
' &middot; Cost: ' + esc(costText());
paintBal('CLOSING BALANCE', fmt(cl), cl < -0.005 ? 'v-neg' : '',
pad(stAcc) + ' - end of ' + lab(TO));
} else {
var t = totalsOf(grouped());
var nAcc = 0;
for (var j = 0; j < ROWS.length; j++) if (inScope(ROWS[j].a)) nAcc++;
var netCl = r2(t.clc - t.cld);
h = 'Current Scope: <b>' + esc(pathText()) + '</b> &middot; ' +
esc(lab(FROM)) + ' &#8594; ' + esc(lab(TO)) +
' &middot; ' + nAcc + ' posting accounts &middot; Level ' + LVLOF[end] +
' &middot; Cost: ' + esc(costText());
var okB = Math.abs(netCl) <= 0.005 && !scope && !costActive();
paintBal('CLOSING BALANCE (CR - DR)',
okB ? 'BALANCED' : fmt(netCl),
okB ? 'v-ok' : (netCl < -0.005 ? 'v-neg' : ''),
'end of ' + lab(TO));
}
$('scopeBar').innerHTML = h;
}
function drawTB() {
var list = sortList(grouped());
$('tableHead').innerHTML = headHtml();
var html = '';
for (var j = 0; j < list.length; j++) {
var o = list[j];
html += '<tr class="drill-row" data-k="' + esc(o.a) + '">' +
'<td><span class="tw">&#9656;</span><span class="acc-code">' + esc(pad(o.a)) + '</span>' + esc(o.name) + '</td>' +
rowCells(o) + '</tr>';
}
var t = totalsOf(list);
html += '<tr class="total-row"><td>TOTAL</td>' +
'<td class="num">' + fmt(t.opd) + '</td><td class="num">' + fmt(t.opc) + '</td>' +
'<td class="num">' + fmt(t.dr) + '</td><td class="num">' + fmt(t.cr) + '</td>' +
'<td class="num">' + fmt(t.cld) + '</td><td class="num">' + fmt(t.clc) + '</td></tr>';
$('tableBody').className = '';
$('tableBody').innerHTML = html;
bindSort(); bindDrill();
$('tableSub').textContent =
list.length + ' rows - Level ' + LVLOF[end] +
(end < MAXEND ? ' - click an account to drill down' : ' - click an account for its statement') +
', headers to sort';
$('tableTitleText').textContent =
'Trial Balance - Level ' + LVLOF[end];
}
function netOf(lines) {
var n = 0;
for (var j = 0; j < lines.length; j++) n += lines[j].v;
return r2(n);
}
var stFlt = { dt: '', no: '', ds: '', c1: '', c2: '', dr: '', cr: '' };
function stFltReset() { stFlt = { dt: '', no: '', ds: '', c1: '', c2: '', dr: '', cr: '' }; }
function stFlted() {
return !!(stFlt.dt || stFlt.no || stFlt.ds || stFlt.c1 || stFlt.c2 || stFlt.dr || stFlt.cr);
}
function stmtRows() {
var out = [], j, L;
var ft = stFlt.dt.toLowerCase();
var fn = stFlt.no.toLowerCase(), fd = stFlt.ds.toLowerCase();
var f1 = stFlt.c1.toLowerCase(), f2 = stFlt.c2.toLowerCase();
var fr = stFlt.dr.replace(/,/g, ''), fc = stFlt.cr.replace(/,/g, '');
for (j = 0; j < ST.lines.length; j++) {
L = ST.lines[j];
if (ft && L.dt.indexOf(ft) === -1) continue;
if (fn && L.no.toLowerCase().indexOf(fn) === -1) continue;
if (fd && String(L.ds || '').toLowerCase().indexOf(fd) === -1) continue;
if (f1 && cName(C1MAP, L.c1).toLowerCase().indexOf(f1) === -1) continue;
if (f2 && cName(C2MAP, L.c2).toLowerCase().indexOf(f2) === -1) continue;
if (fr && (L.v <= 0 || L.v.toFixed(2).indexOf(fr) === -1)) continue;
if (fc && (L.v >= 0 || (-L.v).toFixed(2).indexOf(fc) === -1)) continue;
out.push(L);
}
return out;
}
function drawStmtBody() {
var flt = stFlted();
var list = flt ? stmtRows() : ST.lines;
var bal = flt ? 0 : ST.op;
var dr = flt ? 0 : (bal > 0 ? bal : 0);
var cr = flt ? 0 : (bal < 0 ? -bal : 0);
var html = '';
var balCell = function (v) {
return '<td class="num ' + (v >= 0 ? 'bal-pos' : 'bal-neg') + '">' + fmt(v) + '</td>';
};
if (!flt) {
html += '<tr class="open-row"><td>' + FROM.slice(0, 4) + '-' + FROM.slice(4, 6) + '-01</td>' +
'<td>' + DASH + '</td><td>Opening Balance</td><td>' + DASH + '</td><td>' + DASH + '</td>' +
movCell(bal > 0 ? bal : 0) + movCell(bal < 0 ? -bal : 0) +
balCell(bal) + '</tr>';
}
for (var j = 0; j < list.length; j++) {
var L = list[j];
bal = r2(bal + L.v);
if (L.v > 0) dr += L.v; else cr += -L.v;
html += '<tr class="drill-row st-row" data-y="' + L.y + '" data-no="' + esc(L.no) + '">' +
'<td class="num">' + L.dt + '</td>' +
'<td class="num">' + esc(L.no) + '</td>' +
'<td>' + esc(L.ds || '') + '</td>' +
'<td>' + (L.c1 === '0' ? '<span class="z">' + DASH + '</span>' : esc(cName(C1MAP, L.c1))) + '</td>' +
'<td>' + (L.c2 === '0' ? '<span class="z">' + DASH + '</span>' : esc(cName(C2MAP, L.c2))) + '</td>' +
movCell(L.v > 0 ? L.v : 0) + movCell(L.v < 0 ? -L.v : 0) +
balCell(bal) + '</tr>';
}
html += '<tr class="total-row"><td colspan="5">' + (flt ? 'FILTERED TOTAL' : 'TOTAL') + '</td>' +
'<td class="num">' + fmt(dr) + '</td><td class="num">' + fmt(cr) + '</td>' +
balCell(bal) + '</tr>';
$('tableBody').className = 'st-body';
$('tableBody').innerHTML = html;
var goEntry = function () {
var tr = this.parentNode;
var p = tr.dataset.no.split('/');
openEntry(tr.dataset.y, p[0], p[1], tr.dataset.no);
};
var sts = document.querySelectorAll('#tableBody tr.st-row');
for (var x = 0; x < sts.length; x++) {
var cs = sts[x].querySelectorAll('td');
cs[0].addEventListener('click', goEntry);
cs[1].addEventListener('click', goEntry);
}
$('tableSub').textContent = flt
? list.length + ' of ' + ST.lines.length + ' entries - filtered slice, balance restarts at 0'
: ST.lines.length + ' entries - click a date or entry no for its journal entry' +
(ST.trunc ? ' - TRUNCATED at 5000 - narrow the period' : '');
if (flt) paintBal('FILTERED BALANCE', fmt(bal),
bal < -0.005 ? 'v-neg' : '',
list.length + ' of ' + ST.lines.length + ' entries');
else paintBal('CLOSING BALANCE', fmt(bal),
bal < -0.005 ? 'v-neg' : '',
pad(stAcc) + ' - end of ' + lab(TO));
}
function fltTh(f) {
return '<th><input type="text" class="flt-inp" data-f="' + f +
'" value="' + esc(stFlt[f]) + '"></th>';
}
function drawStmt() {
$('tableHead').innerHTML =
'<tr class="print-title-row"><th colspan="8">' + printTitle() + '</th></tr>' +
'<tr><th>DATE</th><th>ENTRY</th><th>DESCRIPTION</th><th>COST 1</th><th>COST 2</th>' +
'<th class="num">DEBIT</th><th class="num">CREDIT</th><th class="num">BALANCE</th></tr>' +
'<tr class="flt-row">' + fltTh('dt') + fltTh('no') + fltTh('ds') + fltTh('c1') + fltTh('c2') +
fltTh('dr') + fltTh('cr') +
'<th class="flt-note">totals follow the filter</th></tr>';
var ins = document.querySelectorAll('#tableHead .flt-inp');
for (var j = 0; j < ins.length; j++) {
ins[j].addEventListener('input', function () {
stFlt[this.dataset.f] = this.value.trim();
drawStmtBody();
});
}
drawStmtBody();
$('tableTitleText').textContent = 'Account Statement - ' + pad(stAcc);
}
function drawEntry() {
$('tableHead').innerHTML =
'<tr class="print-title-row"><th colspan="7">' + printTitle() + '</th></tr>' +
'<tr><th class="num">#</th><th>ACCOUNT</th><th>DESCRIPTION</th><th>COST 1</th><th>COST 2</th>' +
'<th class="num">DEBIT</th><th class="num">CREDIT</th></tr>';
var html = '', dr = 0, cr = 0;
for (var j = 0; j < EN.lines.length; j++) {
var L = EN.lines[j];
if (L.v > 0) dr += L.v; else cr += -L.v;
html += '<tr><td class="num">' + L.q + '</td>' +
'<td><span class="acc-code">' + esc(L.a) + '</span>' + esc(nameOf(L.a)) + '</td>' +
'<td>' + esc(L.ds || EN.ds || '') + '</td>' +
'<td>' + (L.c1 === '0' ? '<span class="z">' + DASH + '</span>' : esc(cName(C1MAP, L.c1))) + '</td>' +
'<td>' + (L.c2 === '0' ? '<span class="z">' + DASH + '</span>' : esc(cName(C2MAP, L.c2))) + '</td>' +
movCell(L.v > 0 ? L.v : 0) + movCell(L.v < 0 ? -L.v : 0) + '</tr>';
}
html += '<tr class="total-row"><td colspan="5">TOTAL</td>' +
'<td class="num">' + fmt(dr) + '</td><td class="num">' + fmt(cr) + '</td></tr>';
$('tableBody').className = 'st-body';
$('tableBody').innerHTML = html;
$('tableSub').textContent = EN.lines.length + ' lines - ' + EN.dt;
$('tableTitleText').textContent = 'Journal Entry - ' + EN.ref;
}
var accBox = $('fAccBox');
var accInp = $('fAccInp');
var accClr = $('fAccClr');
var accMenu = $('fAccMenu');
function clearAccBox() {
accInp.value = '';
accBox.classList.remove('picked');
accClr.style.display = 'none';
}
function accList() {
var out = [];
for (var j = 0; j < ROWS.length; j++) {
var a = ROWS[j].a;
out.push({ a: a, p: pad(a), n: nameOf(a) });
}
return out;
}
var accIdx = -1;
function drawAccMenu() {
var q = accInp.value.trim().toLowerCase();
var list = accList(), out = [], j;
for (j = 0; j < list.length; j++) {
var x = list[j];
if (!q || x.p.indexOf(q) !== -1 || String(x.n).toLowerCase().indexOf(q) !== -1) out.push(x);
if (out.length >= 200) break;
}
accMenu.innerHTML = out.length
? out.map(function (x) {
return '<div class="ss-option" data-a="' + esc(x.a) + '" data-n="' + esc(x.n) + '">' +
'<span class="ss-code">' + esc(x.p) + '</span>' + esc(x.n) + '</div>';
}).join('')
: '<div class="ss-empty">No matching account</div>';
accMenu.classList.add('open');
accIdx = -1;
var os = accMenu.querySelectorAll('.ss-option');
for (j = 0; j < os.length; j++) {
os[j].addEventListener('click', function () {
accInp.value = this.dataset.n;
accBox.classList.add('picked');
accClr.style.display = '';
accMenu.classList.remove('open');
openStmt(this.dataset.a);
});
}
}
function accMove(d) {
var os = accMenu.querySelectorAll('.ss-option');
if (!os.length) return;
accIdx = (accIdx + d + os.length) % os.length;
for (var j = 0; j < os.length; j++) os[j].classList.toggle('active', j === accIdx);
os[accIdx].scrollIntoView({ block: 'nearest' });
}
accInp.addEventListener('keydown', function (e) {
if (e.key === 'ArrowDown') {
e.preventDefault();
if (!accMenu.classList.contains('open')) drawAccMenu();
accMove(1);
} else if (e.key === 'ArrowUp') {
e.preventDefault(); accMove(-1);
} else if (e.key === 'Enter') {
e.preventDefault();
var os = accMenu.querySelectorAll('.ss-option');
if (accIdx >= 0 && os[accIdx]) os[accIdx].click();
} else if (e.key === 'Escape') {
accMenu.classList.remove('open');
}
});
accInp.addEventListener('focus', drawAccMenu);
accInp.addEventListener('input', drawAccMenu);
accClr.addEventListener('click', function () {
clearAccBox();
if (view === 'ST') {
var s = stack.pop();
view = 'TB'; stAcc = ''; ST = null;
if (s) { scope = s.sc; end = s.en; sortKey = s.sk; sortDir = s.sd; }
render();
}
});
document.addEventListener('click', function (e) {
if (!e.target.closest('.search-select')) accMenu.classList.remove('open');
if (!e.target.closest('.ms-box')) {
var wasOpen = c2bMenu.classList.contains('open');
c2bMenu.classList.remove('open');
if (wasOpen && c2bDirty) { c2bDirty = false; fetchRows(FROM, TO); }
}
});
var c1Sel = $('fC1');
var c2aSel = $('fC2A');
var c2bBtn = $('fC2BBtn');
var c2bMenu = $('fC2BMenu');
var SELB = [], BNAMES = {}, c2bDirty = false;
function selText(sel) { return sel.selectedIndex >= 0 ? sel.options[sel.selectedIndex].text : ''; }
function addOpt(sel, v, t) {
var o = document.createElement('option');
o.value = v; o.textContent = t;
sel.appendChild(o);
}
function clearOpts(sel) { while (sel.options.length > 1) sel.remove(1); }
function prefOf(code, lv, ends) { return String(code).slice(0, ends[lv - 1]); }
function used1() { return (view === 'ST' && ST && ST.c1u) ? ST.c1u : null; }
function used2() { return (view === 'ST' && ST && ST.c2u) ? ST.c2u : C2USED; }
function inUsed(u, p) {
for (var j = 0; j < u.length; j++)
if (u[j].slice(0, p.length) === p) return true;
return false;
}
function usedStarts(p) { return inUsed(used2(), p); }
function fillC1() {
var u1 = used1();
clearOpts(c1Sel);
for (var j = 0; j < C1.length; j++) {
var x = C1[j], p = prefOf(x.c, x.lv, CL.c1), leaf = true;
for (var k = 0; k < C1.length; k++) {
if (k === j) continue;
var y = C1[k];
if (String(y.c).slice(0, p.length) === p &&
prefOf(y.c, y.lv, CL.c1) !== p) { leaf = false; break; }
}
if (!leaf) continue;
if (u1 && !inUsed(u1, p) && p !== selC1) continue;
addOpt(c1Sel, p, x.n);
}
c1Sel.value = selC1;
}
function fillC2A() {
clearOpts(c2aSel);
for (var j = 0; j < C2.length; j++) {
var x = C2[j];
if (x.lv !== 2) continue;
var p = prefOf(x.c, 2, CL.c2);
if (usedStarts(p)) addOpt(c2aSel, p, x.n);
}
c2aSel.value = selC2A;
if (c2aSel.value !== selC2A) { selC2A = ''; c2aSel.value = ''; }
}
function isLeaf2(j) {
var x = C2[j], p = prefOf(x.c, x.lv, CL.c2);
for (var k = 0; k < C2.length; k++) {
if (k === j) continue;
var y = C2[k];
if (String(y.c).slice(0, p.length) === p &&
prefOf(y.c, y.lv, CL.c2) !== p) return false;
}
return true;
}
function c2bLabel() {
c2bBtn.classList.toggle('picked', SELB.length > 0);
c2bBtn.textContent = !SELB.length ? 'All Details'
: SELB.length === 1 ? (BNAMES[SELB[0]] || SELB[0])
: SELB.length + ' selected';
}
function msOpt(p, n) {
return '<label class="ms-opt"><input type="checkbox" value="' + esc(p) + '"' +
(hasVal(SELB, p) ? ' checked' : '') + '> ' + esc(n) + '</label>';
}
function fillC2B() {
var offered = {}, j, x, p;
var h = '<input type="text" class="ms-search" id="fC2BSrch" placeholder="Type to filter...">';
if (!selC2A && hasVal(used2(), '0')) {
offered['0'] = 1;
BNAMES['0'] = '---- (no cost center)';
h += msOpt('0', '---- (no cost center)');
}
for (j = 0; j < C2.length; j++) {
x = C2[j];
p = prefOf(x.c, x.lv, CL.c2);
if (selC2A && p.slice(0, selC2A.length) !== selC2A) continue;
if (!isLeaf2(j)) continue;
if (!usedStarts(p)) continue;
offered[p] = 1;
BNAMES[p] = x.n;
h += msOpt(p, x.n);
}
for (j = 0; j < SELB.length; j++)
if (!offered[SELB[j]]) h += msOpt(SELB[j], BNAMES[SELB[j]] || SELB[j]);
c2bMenu.innerHTML = h;
c2bLabel();
var cbs = c2bMenu.querySelectorAll('input[type=checkbox]');
for (j = 0; j < cbs.length; j++) {
cbs[j].addEventListener('change', function () {
var v = this.value, ix = idxOf(SELB, v);
if (this.checked) { if (ix === -1) SELB.push(v); }
else if (ix !== -1) SELB.splice(ix, 1);
c2bDirty = true;
c2bLabel();
});
}
var srch = $('fC2BSrch');
srch.addEventListener('input', function () {
var q = this.value.trim().toLowerCase();
var os = c2bMenu.querySelectorAll('label.ms-opt');
for (var k = 0; k < os.length; k++)
os[k].style.display = !q ||
os[k].textContent.toLowerCase().indexOf(q) !== -1 ? '' : 'none';
});
}
c2bBtn.addEventListener('click', function (e) {
e.stopPropagation();
var open = c2bMenu.classList.toggle('open');
if (!open && c2bDirty) { c2bDirty = false; fetchRows(FROM, TO); }
});
c2bMenu.addEventListener('click', function (e) { e.stopPropagation(); });
c1Sel.addEventListener('change', function () {
selC1 = c1Sel.value; selC2A = ''; SELB = []; c2bDirty = false;
fetchRows(FROM, TO);
});
c2aSel.addEventListener('change', function () {
selC2A = c2aSel.value; SELB = []; c2bDirty = false;
fetchRows(FROM, TO);
});
var yearSel = $('fYear');
var fromSel = $('fFrom');
var toSel = $('fTo');
var YEAR = +FROM.slice(0, 4);
function fillYears() {
while (yearSel.options.length) yearSel.remove(0);
var y0 = +META.curM.slice(0, 4);
for (var y = y0; y >= +META.minM.slice(0, 4); y--) addOpt(yearSel, y, y);
yearSel.value = YEAR;
}
function maxMonth() {
return String(YEAR) === META.curM.slice(0, 4) ? +META.curM.slice(4, 6) : 12;
}
function fillMonths(sel, cur) {
var mx = maxMonth();
while (sel.options.length) sel.remove(0);
for (var m = 1; m <= mx; m++) addOpt(sel, ('0' + m).slice(-2), MN[m - 1]);
sel.value = +cur <= mx ? cur : ('0' + mx).slice(-2);
}
function setBusy(b) {
yearSel.disabled = b; fromSel.disabled = b; toSel.disabled = b;
c1Sel.disabled = b; c2aSel.disabled = b; c2bBtn.disabled = b;
}
function syncSelects() {
yearSel.value = YEAR;
fillMonths(fromSel, FROM.slice(4, 6));
fillMonths(toSel, TO.slice(4, 6));
fromSel.value = FROM.slice(4, 6);
toSel.value = TO.slice(4, 6);
}
function fetchRows(f, t) {
setBusy(true);
apex.server.process('TB_AJAX', {
x01: 'rows', x02: f, x03: t, x04: selC1, x05: effC2()
}, {
success: function (d) {
setBusy(false);
if (d && d.err) { alert(d.err); YEAR = +FROM.slice(0, 4); syncSelects(); return; }
ROWS = d.rows; C2USED = d.c2;
FROM = f; TO = t; YEAR = +f.slice(0, 4);
if (view === 'EN') { view = 'TB'; EN = null; stAcc = ''; clearAccBox(); }
if (view === 'ST') { syncSelects(); fetchStmt(stAcc); return; }
scope = ''; end = ENDS[0]; stack = [];
sortKey = 'a'; sortDir = 1;
syncSelects(); render();
},
error: function () {
setBusy(false);
YEAR = +FROM.slice(0, 4); syncSelects();
alert('Could not load data. Make sure TB_AJAX exists.');
}
});
}
function onPeriod() {
var f = fromSel.value, t = toSel.value;
if (+f > +t) { if (this === fromSel) { t = f; toSel.value = t; } else { f = t; fromSel.value = f; } }
var nf = YEAR + f, nt = YEAR + t;
if (nf === FROM && nt === TO) return;
fetchRows(nf, nt);
}
fromSel.addEventListener('change', onPeriod);
toSel.addEventListener('change', onPeriod);
yearSel.addEventListener('change', function () {
YEAR = +yearSel.value;
var mx = ('0' + maxMonth()).slice(-2);
fillMonths(fromSel, '01');
fillMonths(toSel, mx);
fetchRows(YEAR + '01', YEAR + mx);
});
$('resetBtn').addEventListener('click', function () {
view = 'TB'; stAcc = ''; ST = null; EN = null; clearAccBox();
scope = ''; end = ENDS[0]; stack = [];
sortKey = 'a'; sortDir = 1;
selC1 = ''; selC2A = ''; SELB = []; c2bDirty = false;
c1Sel.value = ''; c2aSel.value = '';
YEAR = +META.defFrom.slice(0, 4);
fetchRows(META.defFrom, META.defTo);
});
function paintBadge() {
var live = TO === META.curM;
$('periodBadge').innerHTML =
esc(lab(FROM)) + ' - ' + esc(lab(TO)) +
(live ? ' &middot; <span class="live-dot">LIVE</span>' : '');
}
(function () {
var line = $('asOfLine');
if (!line) return;
var ok = META.lastM && META.lastM === prevOf(META.curM);
line.classList.toggle('fresh', !!ok);
line.textContent = ok
? 'Archive complete to ' + lab(META.lastM) + ' - current month reads live from GL'
: 'Archive behind - last archived: ' + (META.lastM ? lab(META.lastM) : 'none') +
' (expected ' + lab(prevOf(META.curM)) + ')';
})();
function nowTxt() {
var d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; };
return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
}
function viewName() { return view === 'EN' ? 'Journal Entry' : view === 'ST' ? 'Account Statement' : 'Trial Balance'; }
function printTitle() {
return 'Co. Dashboard | ' + viewName() + ' - ' + esc(pathText()) + ' - ' + esc(lab(FROM)) + ' to ' + esc(lab(TO)) +
' | Data as of ' + esc(META.asOf || '-') + ' | Printed ' + nowTxt();
}
function fileStem() {
var w = view === 'EN' ? 'Entry_' + String(EN.ref).replace('/', '-') : view === 'ST' ? 'Statement_' + pad(stAcc) : 'Level' + LVLOF[end];
return 'Trial_Balance_' + w + '_' + lab(FROM).replace(' ', '') + '-' + lab(TO).replace(' ', '');
}
function buildPrintFilters() {
var box = $('printFilters');
if (!box) return;
var parts = [
'<b>Period:</b> ' + esc(lab(FROM)) + ' - ' + esc(lab(TO)),
'<b>Scope:</b> ' + esc(pathText()),
'<b>Cost:</b> ' + esc(costText())
];
if (view === 'TB') parts.push('<b>Level:</b> ' + LVLOF[end]);
parts.push('<b>Archive:</b> ' + esc(META.asOf || '-'));
box.innerHTML = parts.join('<span class="pf-sep">|</span>');
}
function runPrint(mode, title) {
var th = document.querySelector('#printTablePanel .print-title-row th');
if (th) th.innerHTML = printTitle();
var orig = document.title;
document.title = title;
if (mode) document.body.classList.add(mode);
var back = function () {
document.title = orig;
if (mode) document.body.classList.remove(mode);
window.removeEventListener('afterprint', back);
};
window.addEventListener('afterprint', back);
window.print();
}
function printTable() { runPrint('print-mode-table', fileStem()); }
$('printDashBtn').addEventListener('click', function () { runPrint(null, fileStem() + '_Dashboard'); });
function excel() {
if (!window.tbXl) return;
var list = view === 'TB' ? sortList(grouped()) : view === 'ST' ? (stFlted() ? stmtRows() : ST.lines) : EN.lines;
window.tbXl({
v: view, list: list, tot: view === 'TB' ? totalsOf(list) : null, flt: view === 'ST' && stFlted(), op: ST ? ST.op : 0,
pad: pad, name: nameOf,
c1: function (c) { return c === '0' ? '' : cName(C1MAP, c); }, c2: function (c) { return c === '0' ? '' : cName(C2MAP, c); },
ref: EN ? EN.ref : '', edt: EN ? EN.dt : '', eds: EN ? EN.ds : '', acc: stAcc,
from: lab(FROM), to: lab(TO), fromM: FROM, path: pathText(), cost: costText(), lvl: LVLOF[end],
asof: META.asOf || '', file: fileStem() + '.xlsx'
});
}
var XM = '';
function paintExport() {
var box = $('exportBox'), m = view === 'EN' || !window.tbXl ? 'p' : 'px';
if (!box || m === XM) return;
XM = m;
if (window.jmExport) {
window.jmExport.attach(box, { pdf: printTable, excel: m === 'px' ? excel : null });
} else {
box.innerHTML = '<button type="button" class="btn-print" id="printTableBtn">Print / PDF</button>';
$('printTableBtn').addEventListener('click', printTable);
}
}
function render() {
if (view === 'TB' && costActive()) end = MAXEND;
fillC1(); fillC2A(); fillC2B();
paintTabs(); paintCrumbs(); buildPrintFilters(); paintKpis(); paintBadge(); paintExport();
if (view === 'EN') drawEntry(); else if (view === 'ST') drawStmt(); else drawTB();
}
fillYears();
syncSelects();
render();
(function () {
var hm = /acc=([0-9]{6,15})/.exec(location.hash || '');
if (hm) openStmt(hm[1]);
})();
}
initTrialBalance();

});
