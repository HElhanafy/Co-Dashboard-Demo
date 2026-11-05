window.addEventListener("DOMContentLoaded",function(){
function initReceivablesDashboard() {
const byId = id => document.getElementById(id);
const rEl = byId('ar-rows');
const cEl = byId('ar-coll');
if (!rEl || !cEl) {
initReceivablesDashboard._t = (initReceivablesDashboard._t || 0) + 1;
if (initReceivablesDashboard._t < 100) { setTimeout(initReceivablesDashboard, 100); return; }
console.error('Receivables dashboard: data regions not found.');
return;
}
const ROWS = JSON.parse(rEl.textContent);
let COLL   = JSON.parse(cEl.textContent);
const mEl  = byId('ar-meta');
const META = mEl ? JSON.parse(mEl.textContent) : { admin: 0, asOf: '', d1: '', d2: '' };
let SM = {};
try { SM = JSON.parse(byId('ar-sm').textContent) || {}; } catch (e) { SM = {}; }
const fmt = n => {
if (Math.abs(n) < 1) return Math.abs(n) >= 0.005 ? n.toFixed(2) : '0';
return Math.round(n).toLocaleString('en-US');
};
const esc = s => String(s).replace(/[&<>"]/g, m =>
({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[m]));
function idxOf(arr, v) { for (let i=0;i<arr.length;i++) if (arr[i]===v) return i; return -1; }
function hasVal(arr, v) { return idxOf(arr, v) !== -1; }
const DASH = String.fromCharCode(8212), SEP = String.fromCharCode(8250);
const NB = 6;
const BLAB = ['0 - 30','31 - 60','61 - 90','91 - 120','121 - 150','&gt; 150'];
const BSEV = ['', '', 'ag-1', 'ag-2', 'ag-3', 'ag-4'];
function bucket(a) {
return a <= 30 ? 0 : a <= 60 ? 1 : a <= 90 ? 2 : a <= 120 ? 3 : a <= 150 ? 4 : 5;
}
function cellNum(v, cls) {
return '<td class="num ' + (v ? cls : 'z') + '">' + (v ? fmt(v) : '&mdash;') + '</td>';
}
function dueDate(r) {
const p = r.d.split('/');
const d = new Date(+p[2], +p[1] - 1, +p[0] + r.dd);
return ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth()+1)).slice(-2) + '/' + d.getFullYear();
}
let selCust = '';
const custBox = byId('fCustBox');
const custInp = byId('fCustInp');
const custClr = byId('fCustClr');
const CUSTS = (function () {
const seen = {}, out = [];
ROWS.forEach(r => { if (!seen[r.c]) { seen[r.c] = 1; out.push({ c: r.c, cn: r.cn }); } });
out.sort((a, b) => a.cn < b.cn ? -1 : 1);
return out;
})();
function custSource(q) {
q = q.toLowerCase();
return CUSTS.filter(x =>
!q || x.cn.toLowerCase().indexOf(q) !== -1 || x.c.indexOf(q) !== -1).slice(0, 200);
}
function clearCust() {
selCust = ''; custBox.classList.remove('picked'); custClr.style.display = 'none';
}
if (window.arSS) {
window.arSS(custInp, byId('fCustMenu'), custSource, (c, n) => {
selCust = c;
custInp.value = n;
custBox.classList.add('picked');
custClr.style.display = '';
resetDrill(); render();
});
}
custInp.addEventListener('input', () => {
if (selCust) { clearCust(); resetDrill(); render(); }
});
custClr.addEventListener('click', () => {
clearCust(); custInp.value = '';
resetDrill(); render();
});
function keep(r) {
if (selCust && r.c !== selCust) return false;
return true;
}
const fRows = () => ROWS.filter(keep);
const smanOf = {}, nameOfS = {}, anOfS = {}, anOfC = {}, dpOfC = {}, supNm = {};
ROWS.forEach(r => {
smanOf[r.c] = r.s; nameOfS[r.s] = r.sn;
anOfS[r.s] = r.an; anOfC[r.c] = r.an; dpOfC[r.c] = r.dp;
});
for (const k in SM) { if (SM[k] && SM[k][1]) supNm[SM[k][1]] = SM[k][2]; }
const dpOf = x => dpOfC[x.c] || x.dp;
const dpOk = x => !drillDiv || dpOf(x) === drillDiv;
const anOf = x => anOfS[x.s] || anOfC[x.c] || x.an;
const smC = x => nameOfS[x.s] !== undefined ? x.s : (smanOf[x.c] !== undefined ? smanOf[x.c] : x.s);
function smName(s, x) { return nameOfS[s] || (x && x.sn) || (SM[s] && SM[s][0]) || '(No name)'; }
const supOf = s => (SM[s] && SM[s][1]) ? SM[s][1] : s;
function supName(p, x) { return supNm[p] || nameOfS[p] || (SM[p] && SM[p][0]) || (x && x.sn) || '(No name)'; }
function fColl() {
return COLL.filter(x => !(selCust && x.c !== selCust));
}
function newAgg(name, key) {
const e = { name: name, _dk: key, un:0, tot:0, od:0, coll:0, dd:0,
rcv:0, rcn:0 };
for (let i=0;i<NB;i++) e['b'+i] = 0;
return e;
}
function addRow(e, r) {
if (r.a < 0) { e.un += r.o; e.tot += r.o; return; }   // credit balance row
e['b' + bucket(r.a)] += r.o;
e.tot += r.o;
if (r.a > r.dd) e.od += r.o;
if (r.rc === 1) { e.rcv += r.o; e.rcn++; }
}
function build(keyF, rows, collFilter) {
const g = {};
(rows || fRows()).forEach(r => {
const k = keyF === 'sup' ? supOf(r.s) : r[keyF];
const e = g[k] || (g[k] = newAgg(
keyF === 'c' ? r.cn : keyF === 's' ? smName(k) : keyF === 'sup' ? supName(k) : k, k));
addRow(e, r);
if (keyF === 'c') e.dd = r.cd;
});
fColl().forEach(x => {
if (collFilter && !collFilter(x)) return;
let k, nm;
if (keyF === 'c')        { k = x.c; nm = x.cn || x.c; }
else if (keyF === 'an')  { k = anOf(x); nm = k; }
else if (keyF === 'dp')  { k = dpOf(x); nm = k; }
else if (keyF === 'sup') { k = supOf(smC(x)); nm = supName(k, x); }
else                     { k = smC(x); nm = smName(k, x); }
if (k === undefined) return;
const e = g[k] || (g[k] = newAgg(nm, k));
if (keyF === 'c' && !e.dd) e.dd = DASH;
e.coll += x.v;
});
return Object.values(g);
}
function totalOf(list) {
const t = newAgg('TOTAL', null);
list.forEach(r => {
for (let i=0;i<NB;i++) t['b'+i] += r['b'+i];
t.un += r.un; t.tot += r.tot; t.od += r.od;
t.coll += r.coll; t.rcv += r.rcv; t.rcn += r.rcn;
});
return t;
}
let level = 'SUP';                  // top capsule (DIV / AREA / SUP / RTN, INV for a searched customer)
let sortKey = 'od', sortDir = 1;    // default: overdue, largest first
let invOd = false;
let drillDiv = null;                // division drilled into
let drillArea = null;               // area drilled into
let drillSup = null, drillSupName = '';     // supervisor (code) drilled into
let drillSman = null, drillSmanName = '';   // salesman (code) drilled into
let drillCust = null, drillCustName = '', drillRc = false;
let sub = 'AREA';                   // capsule chosen inside a drill scope
let stack = [];                     // Back walks up one step
let XV = null;                      // the view shown, for Excel
function snap() {
return { level: level, drillDiv: drillDiv, drillArea: drillArea, drillSup: drillSup, drillSupName: drillSupName,
drillSman: drillSman, drillSmanName: drillSmanName, drillCust: drillCust, drillCustName: drillCustName,
drillRc: drillRc, sub: sub };
}
function restore(s) {
level = s.level; drillDiv = s.drillDiv; drillArea = s.drillArea; drillSup = s.drillSup; drillSupName = s.drillSupName;
drillSman = s.drillSman; drillSmanName = s.drillSmanName; drillCust = s.drillCust; drillCustName = s.drillCustName;
drillRc = s.drillRc; sub = s.sub;
}
function resetDrill() {
drillDiv = null; drillArea = null; drillSup = null; drillSupName = ''; drillSman = null; drillSmanName = '';
drillCust = null; drillCustName = ''; drillRc = false; sub = 'AREA'; stack = [];
}
const dvRows = () => drillDiv ? fRows().filter(r => r.dp === drillDiv) : fRows();
const scRows = () => dvRows().filter(r =>
(!drillArea || r.an === drillArea) && (!drillSup || supOf(r.s) === drillSup));
const scColl = x => dpOk(x) && (!drillArea || anOf(x) === drillArea) && (!drillSup || supOf(smC(x)) === drillSup);
function curView() {
if ((level === 'INV' && selCust) || drillCust) return 'INV';
if (level === 'RTN') return level;
if (drillSman) return 'CUST';
if (drillSup) return 'SMAN';
if (drillArea || drillDiv) return sub;
return level;
}
const backBtn = byId('backBtn');
backBtn.addEventListener('click', () => {
if (stack.length) restore(stack.pop());
render();
});
const invOdBtn = byId('invOdBtn');
invOdBtn.addEventListener('click', () => {
invOd = !invOd;
invOdBtn.classList.toggle('on', invOd);
render();
});
function drillInto(view, k, n) {
stack.push(snap());
if (view === 'DIV') { drillDiv = k; sub = 'AREA'; }
else if (view === 'AREA') { drillArea = k; sub = 'SUP'; }
else if (view === 'SUP') {
drillSup = k; drillSupName = n; sub = 'SMAN';
const one = build('s', scRows(), scColl);
if (one.length === 1) { drillSman = one[0]._dk; drillSmanName = one[0].name; }
}
else if (view === 'SMAN') { drillSman = k; drillSmanName = n; }
else { drillCust = k; drillCustName = n; drillRc = view === 'RTN'; }
render();
}
function crumbParts() {
const p = [];
if (drillDiv) p.push(drillDiv);
if (drillArea) p.push(drillArea);
if (drillSup && !(drillSman && drillSupName === drillSmanName)) p.push(drillSupName);
if (drillSman) p.push(drillSmanName);
if (selCust) p.push(custInp.value); else if (drillCust) p.push(drillCustName);
return p;
}
function crumbText() { return crumbParts().join(' ' + SEP + ' '); }
function crumbHtml() {
const p = crumbParts();
return p.map((x, i) =>
'<span class="crumb' + (i === p.length - 1 ? ' crumb-last' : '') + '">' + esc(x) + '</span>'
).join('<span class="crumb-sep">' + SEP + '</span>');
}
function setSub(html) {
const c = crumbParts().length ? crumbHtml() + ' &mdash; ' : '';
byId('tableSub').innerHTML = c + html;
}
function headHtml(c, noSort) {
return '<tr class="print-title-row"><th colspan="' + c.length + '">' + esc(printTitle()) +
'</th></tr><tr>' +
c.map(x => '<th class="' + (x.txt ? '' : 'num') + ' ' +
(noSort ? 'nos' : (sortKey === x.k ? 'sorted' + (sortDir === 1 ? ' asc' : '') : '') +
'" data-k="' + x.k) + '">' + x.t + '</th>').join('') + '</tr>';
}
function bindSort() {
document.querySelectorAll('#tableHead th[data-k]').forEach(th => {
th.addEventListener('click', () => {
const k = th.dataset.k;
if (sortKey === k) sortDir = -sortDir; else { sortKey = k; sortDir = 1; }
render();
});
});
}
function bindDrill(view) {
document.querySelectorAll('#tableBody tr.drill-row').forEach(tr =>
tr.addEventListener('click', () => drillInto(view, tr.dataset.k, tr.dataset.n)));
}
function sortList(list) {
list.sort((a, b) => {
const x = a[sortKey], y = b[sortKey];
if (typeof x === 'string') return (x < y ? -1 : 1) * -sortDir;
return (x < y ? 1 : -1) * sortDir;
});
return list;
}
function nameCell(r) {
return '<td><span class="tw">&#9656;</span> ' + esc(r.name) + '</td>';
}
function agingCols(nameLbl, withTerms) {
const c = [{ k:'name', t:nameLbl, txt: 1 }];
if (withTerms) c.push({ k:'dd', t:'TERMS (DAYS)' });
BLAB.forEach((b, i) => c.push({ k:'b'+i, t:b }));
c.push({ k:'un',   t:'CREDIT BAL.' });
c.push({ k:'tot',  t:'TOTAL BALANCE' });
c.push({ k:'od',   t:'OVERDUE' });
c.push({ k:'coll', t:'COLLECTED' });
return c;
}
function agingRow(r, withTerms, total) {
let h = total ? '<tr class="total-row"><td>TOTAL</td>'
: '<tr class="drill-row" data-k="' + esc(r._dk) + '" data-n="' + esc(r.name) + '">' + nameCell(r);
if (withTerms)
h += '<td class="num">' + (total ? '&mdash;' : r.dd) + '</td>';
for (let i=0;i<NB;i++) h += cellNum(r['b'+i], BSEV[i]);
h += '<td class="num ' + (r.un ? (r.un < 0 ? 'neg' : '') : 'z') + '">' +
(r.un ? fmt(r.un) : '&mdash;') + '</td>';
h += '<td class="num"><b>' + fmt(r.tot) + '</b></td>';
h += '<td class="num ' + (r.od ? 'od-cell' : 'z') + '">' + (r.od ? fmt(r.od) : '&mdash;') + '</td>';
h += '<td class="num ' + (r.coll ? 'coll-cell' : 'z') + '">' + (r.coll ? fmt(r.coll) : '&mdash;') + '</td></tr>';
return h;
}
function drawAging(keyF, nameLbl, rows, view, hint, collFilter) {
const withTerms = keyF === 'c';
const list = sortList(build(keyF, rows, collFilter)), tot = totalOf(list);
byId('tableHead').innerHTML = headHtml(agingCols(nameLbl, withTerms));
byId('tableBody').innerHTML =
list.map(r => agingRow(r, withTerms, false)).join('') + agingRow(tot, withTerms, true);
bindSort();
bindDrill(view);
setSub(list.length + ' rows &mdash; ' + hint);
XV = { k: 'AG', lbl: nameLbl, cust: withTerms, list: list, tot: tot };
}
function drawRtnCustomers() {
const g = {};
fRows().forEach(r => {
const e = g[r.c] || (g[r.c] = newAgg(r.cn, r.c));
addRow(e, r);
e.sn = r.sn;
});
const list = sortList(Object.values(g).filter(e => e.rcn > 0));
const c = [
{ k:'name', t:'CUSTOMER', txt:1 }, { k:'sn', t:'SALESMAN', txt:1 },
{ k:'rcn', t:'RTN CHQ INVOICES' }, { k:'rcv', t:'RTN CHQ VALUE' },
{ k:'tot', t:'TOTAL BALANCE' }, { k:'od', t:'OVERDUE' }
];
byId('tableHead').innerHTML = headHtml(c);
let html = '';
const t = { rcn:0, rcv:0, tot:0, od:0 };
list.forEach(r => {
t.rcn += r.rcn; t.rcv += r.rcv; t.tot += r.tot; t.od += r.od;
html += '<tr class="drill-row" data-k="' + esc(r._dk) + '" data-n="' + esc(r.name) + '">' +
nameCell(r) +
'<td>' + esc(r.sn) + '</td>' +
'<td class="num">' + r.rcn + '</td>' +
'<td class="num od-cell">' + fmt(r.rcv) + '</td>' +
'<td class="num"><b>' + fmt(r.tot) + '</b></td>' +
'<td class="num ' + (r.od ? 'od-cell' : 'z') + '">' + (r.od ? fmt(r.od) : '&mdash;') + '</td></tr>';
});
html += '<tr class="total-row"><td>TOTAL &mdash; ' + list.length + ' customers</td><td></td>' +
'<td class="num">' + t.rcn + '</td><td class="num">' + fmt(t.rcv) + '</td>' +
'<td class="num">' + fmt(t.tot) + '</td><td class="num">' + fmt(t.od) + '</td></tr>';
byId('tableBody').innerHTML = html;
bindSort();
bindDrill('RTN');
setSub(list.length + ' customers holding returned-cheque invoices &mdash; click a customer to open them');
XV = { k: 'RTN', list: list, tot: t };
}
function drawInvoices(custCode, rcOnly) {
let base = fRows().filter(r => r.a >= 0 && r.c === custCode);
if (rcOnly) base = base.filter(r => r.rc === 1);
base.sort((a, b) => a.k < b.k ? -1 : 1);
const list = invOd ? base.filter(r => r.a > r.dd) : base;
const c = [
{ k:'ref', t:'INVOICE NO.', txt:1 }, { k:'d', t:'INVOICE DATE', txt:1 },
{ k:'dd', t:'TERMS (DAYS)' }, { k:'g', t:'INVOICE VALUE' },
{ k:'due', t:'DUE DATE', txt:1 }, { k:'p', t:'PAID' },
{ k:'a', t:'AGE (DAYS)' }, { k:'st', t:'STATUS', txt:1 },
{ k:'o', t:'OPEN BALANCE' }
];
byId('tableHead').innerHTML = headHtml(c, true);
let od = 0, nOd = 0, oldest = 0, allO = 0;
base.forEach(r => {
allO += r.o;
if (r.a > r.dd) { od += r.o; nOd++; }
if (r.a > oldest) oldest = r.a;
});
let g = 0, o = 0;
const html = list.map(r => {
g += r.g; o += r.o;
const late = r.a > r.dd;
return '<tr>' +
'<td>' + esc(r.ref) +
(r.rc === 1 ? ' <span class="chip chip-rc">RTN CHQ</span>' : '') + '</td>' +
'<td>' + r.d + '</td>' +
'<td class="num ' + (r.dd ? '' : 'od-cell') + '">' + r.dd + '</td>' +
'<td class="num">' + fmt(r.g) + '</td>' +
'<td>' + dueDate(r) + '</td>' +
'<td class="num">' + (r.g - r.o > 0.5 ? fmt(r.g - r.o) : '&mdash;') + '</td>' +
'<td class="num ' + (late ? 'od-cell' : '') + '">' + r.a + '</td>' +
'<td><span class="chip ' + (late ? 'chip-due">Overdue' : 'chip-ok">Current') +
'</span></td>' +
'<td class="num"><b>' + fmt(r.o) + '</b></td></tr>';
}).join('');
byId('tableBody').innerHTML = html +
'<tr class="total-row"><td>TOTAL &mdash; ' + list.length + ' invoices</td>' +
'<td></td><td></td>' +
'<td class="num">' + fmt(g) + '</td><td></td>' +
'<td class="num">' + fmt(g - o) + '</td>' +
'<td></td><td></td>' +
'<td class="num">' + fmt(o) + '</td></tr>';
setSub('<span class="inv-strip"><b class="s-bad">Overdue: ' + fmt(od) +
' (' + nOd + ' inv)</b><b class="s-ok">Current: ' + fmt(allO - od) +
' (' + (base.length - nOd) + ' inv)</b><b>Oldest: ' + oldest + ' days</b></span>' +
(rcOnly ? ' <b class="s-bad">returned-cheque invoices only</b>' : '') +
(invOd ? ' <b class="s-bad">(overdue only)</b>' : ''));
XV = { k: 'INV', list: list, g: g, o: o, code: custCode, due: dueDate };
}
function agCalc(rows) {
const e = newAgg('', null);
e.n = 0; e.t = 0;
rows.forEach(r => { addRow(e, r); if (r.a >= 0) e.n++; });
for (let i=0;i<NB;i++) if (e['b'+i] > 0) e.t += e['b'+i];
return e;
}
const AGT = '<h5>Debt aging - open invoices, by invoice age in days</h5>';
function agBar(e) {
const t = e.t, pc = v => (t ? v / t * 100 : 0).toFixed(1) + '%';
if (!e.n || !t) return '<div class="ag-none">No open invoices in this scope</div>';
let h = '<div class="ag">';
for (let i=0;i<NB;i++) if (e['b'+i] > 0)
h += '<i class="a' + i + '" style="width:' + (100 * e['b'+i] / t).toFixed(2) + '%" title="' + BLAB[i] +
' days: ' + fmt(e['b'+i]) + ' (' + pc(e['b'+i]) + ')"></i>';
h += '</div><div class="ag-leg">';
for (let i=0;i<NB;i++)
h += '<div><i class="a' + i + '"></i>' + BLAB[i] + '<b>' + fmt(e['b'+i]) + '</b><em>' + pc(e['b'+i]) + '</em></div>';
return h + '</div>';
}
const rcTxt = e => 'Returned-cheque invoices <b>' + fmt(e.rcv) + '</b> (' + e.rcn + ' inv)';
function paintAging(rows) {
const e = agCalc(rows);
let x = '';
if (e.un) x += '<span>Customer credit balances <b class="neg">' + fmt(e.un) + '</b></span>';
if (e.rcv) x += '<span>' + rcTxt(e) + '</span>';
byId('agingBox').innerHTML = AGT + agBar(e) + (x ? '<div class="ag-more">' + x + '</div>' : '');
}
function paintKpis() {
const effS = drillSman, effP = drillSup;
const effC = selCust || drillCust;
const effA = drillArea, effD = drillDiv;
let rows = fRows();
if (effD) rows = rows.filter(r => r.dp === effD);
if (effA) rows = rows.filter(r => r.an === effA);
if (effP) rows = rows.filter(r => supOf(r.s) === effP);
if (effS) rows = rows.filter(r => r.s === effS);
if (effC) rows = rows.filter(r => r.c === effC);
let tot = 0, od = 0, o120 = 0, nInv = 0;
const custSet = {}, smSet = {};
rows.forEach(r => {
tot += r.o; custSet[r.c] = 1; smSet[r.s] = 1;
if (r.a >= 0) {
nInv++;
if (r.a > r.dd) od += r.o;
if (r.a > 120) o120 += r.o;
}
});
let coll = 0;
fColl().forEach(x => {
if (effC && x.c !== effC) return;
if (effD && dpOf(x) !== effD) return;
if (effA && anOf(x) !== effA) return;
if (effP && supOf(smC(x)) !== effP) return;
if (effS && smC(x) !== effS) return;
coll += x.v;
});
const scoped = !!(effC || effS || effP || effA || effD), box = byId('scopeBox');
byId('kpiContainer').style.display = byId('agingBox').style.display = scoped ? 'none' : '';
box.style.display = scoped ? '' : 'none';
if (!scoped) {
byId('kpiContainer').innerHTML =
'<div class="kpi k-total"><div class="label">Total Receivables</div>' +
'<div class="value">' + fmt(tot) + '</div>' +
'<div class="sub">' + nInv + ' open invoices</div></div>' +
'<div class="kpi k-due"><div class="label">Overdue</div>' +
'<div class="value v-bad">' + fmt(od) + '</div>' +
'<div class="sub">' + (tot ? (od / tot * 100).toFixed(1) : '0.0') +
'% of balance &mdash; past payment terms</div></div>' +
'<div class="kpi k-old"><div class="label">Older Than 120 Days</div>' +
'<div class="value">' + fmt(o120) + '</div>' +
'<div class="sub">' + (tot ? (o120 / tot * 100).toFixed(1) : '0.0') +
'% of balance beyond the longest payment terms</div></div>' +
'<div class="kpi k-coll"><div class="label">Collections</div>' +
'<div class="value v-good">' + fmt(coll) + '</div>' +
'<div class="sub">' + esc(d1.value) + ' &mdash; ' + esc(d2.value) + '</div></div>';
paintAging(rows);
return;
}
const cell = (l, v) => '<div><small>' + l + '</small><strong>' + v + '</strong></div>';
const nC = Object.keys(custSet).length, nS = Object.keys(smSet).length;
let lbl, name, cells = '';
if (effC) {
lbl = 'Customer'; name = selCust ? custInp.value : drillCustName;
const sn = rows.length ? rows[0].sn : drillSmanName;
cells = cell('Code', esc(effC)) + (sn ? cell('Salesman', esc(sn)) : '') +
(rows.length ? cell('Payment term', rows[0].cd + ' days') + cell('Grace', rows[0].gd + ' days') : '');
} else if (effS) {
lbl = 'Salesman'; name = drillSmanName;
const pn = effP ? drillSupName : supName(supOf(effS));
cells = (pn !== name ? cell('Supervisor', esc(pn)) : '') + cell('Customers', nC);
} else {
lbl = effP ? 'Supervisor' : effA ? 'Area' : 'Division';
name = effP ? drillSupName : (effA || effD);
cells = cell('Salesmen', nS) + cell('Customers', nC);
}
cells += cell('Open invoices', nInv) +
cell('Collected ' + esc(d1.value) + ' - ' + esc(d2.value), '<span class="hb-coll">' + fmt(coll) + '</span>');
const e = agCalc(rows), cl = effC && rows.length ? rows[0].cl : 0;
const p = cl ? Math.max(0, tot / cl * 100) : 0;
box.innerHTML =
'<div class="hb-band"><div><small>' + lbl + '</small><strong class="nm">' + esc(name) + '</strong></div>' + cells + '</div>' +
'<div class="hb-grid' + (cl ? '' : ' g2') + '">' +
'<div class="hb-c"><h5>Balance</h5><div class="hb-bal"><b class="hb-tot">' + fmt(tot) + '</b><small>' + nInv +
' open invoice' + (nInv === 1 ? '' : 's') + '</small></div>' +
(e.un ? '<div class="lm-row"><span>Customer credit balances</span><b class="neg">' + fmt(e.un) + '</b></div>' : '') + '</div>' +
'<div class="hb-c">' + AGT + agBar(e) +
'<div class="lm-row"><span>Overdue - past the payment terms <b class="r hb-od">' + fmt(od) + '</b>' +
(od && e.t ? ' - ' + (od / e.t * 100).toFixed(1) + '% of the open invoices' : '') + '</span>' +
(e.rcv ? '<span>' + rcTxt(e) + '</span>' : '') + '</div></div>' +
(cl ? '<div class="hb-c"><h5>Credit limit</h5><div class="lm-top"><span>Used</span><b class="hb-pct' + (p >= 100 ? ' r' : '') + '">' +
p.toFixed(0) + '%</b></div><span class="lim' + (p >= 100 ? ' ov' : p >= 80 ? ' hi' : '') + '"><i style="width:' +
Math.min(100, p).toFixed(1) + '%"></i></span>' +
'<div class="lm-row"><span>Limit</span><b class="hb-lim">' + fmt(cl) + '</b></div>' +
'<div class="lm-row"><span>Available</span><b' + (cl - tot < 0 ? ' class="neg"' : '') + '>' + fmt(cl - tot) + '</b></div></div>' : '') +
'</div>';
}
const LABEL = { DIV:'Division', AREA:'Area', SUP:'Supervisor', SMAN:'Salesman',
RTN:'Returned Cheques', INV:'Invoices' };
const PLURAL = { AREA:'Areas', SUP:'Supervisors', SMAN:'Salesmen' };
const inScope = () => !!(drillDiv || drillArea || drillSup);
function activeLv() { return inScope() ? curView() : level; }
function markActive() {
const a = activeLv();
document.querySelectorAll('.lvl-btn[data-level]').forEach(b =>
b.classList.toggle('active', b.dataset.level === a));
}
function refreshTabs() {
let allowed;
if (selCust) allowed = ['INV'];
else if (drillCust || drillSman || drillSup) allowed = [];
else if (drillArea) allowed = ['SUP'];
else if (drillDiv) allowed = ['AREA', 'SUP'];
else allowed = ['DIV', 'AREA', 'SUP', 'RTN'];
document.querySelectorAll('.lvl-btn[data-level]').forEach(b =>
b.style.display = hasVal(allowed, b.dataset.level) ? '' : 'none');
byId('levelTabs').style.display = allowed.length > 1 ? '' : 'none';
if (allowed.length && !hasVal(allowed, activeLv()) && !inScope()) {
level = selCust ? 'INV' : 'SUP';
}
invOdBtn.style.display = curView() === 'INV' ? '' : 'none';
backBtn.style.display = (!selCust && stack.length) ? '' : 'none';
}
document.querySelectorAll('.lvl-btn[data-level]').forEach(b =>
b.addEventListener('click', () => {
const lv = b.dataset.level;
if (inScope() && !selCust && (lv === 'AREA' || lv === 'SUP')) { sub = lv; render(); return; }
level = lv;
resetDrill();
render();
}));
function viewTitle(d) {
const v = curView();
if (v === 'INV') return (drillRc && !selCust ? 'Returned-Cheque Invoices' : 'Open Invoices') + d +
(selCust ? custInp.value : drillCustName);
if (v === 'CUST') return 'Customers of ' + drillSmanName;
const of = drillSup ? drillSupName : (drillArea || drillDiv);
if (of && PLURAL[v]) return PLURAL[v] + ' of ' + of;
return 'Receivables Aging' + d + LABEL[v];
}
function nowTxt() {
const d = new Date(), p = n => (n < 10 ? '0' : '') + n;
return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
}
const periodTxt = () => d1.value + ' - ' + d2.value;
const grp = () => window.arGrp ? window.arGrp() : '';
function printTitle() {
return 'Co. Dashboard | Receivables & Collection - ' + viewTitle(' - ') +
' | Data as of ' + (META.asOf || '-') + ' | Printed ' + nowTxt();
}
function buildPrintFilters() {
const box = byId('printFilters');
if (!box) return;
const parts = [];
if (crumbText()) parts.push('<b>Scope:</b> ' + esc(crumbText()));
parts.push('<b>View:</b> ' + esc(viewTitle(' - ')));
parts.push('<b>Collections:</b> ' + esc(periodTxt()));
if (invOd && curView() === 'INV') parts.push('<b>Overdue only</b>');
if (grp()) parts.push('<b>Data group:</b> ' + esc(grp()));
box.innerHTML = parts.join('<span class="pf-sep">|</span>');
}
function fileStem() {
return 'Receivables_' + curView() + '_' + (META.asOf || nowTxt()).split(' ')[0].replace(/\//g, '-');
}
function runPrint(modeClass, title) {
const th = document.querySelector('#printTablePanel .print-title-row th');
if (th) th.textContent = printTitle();
const orig = document.title;
document.title = title;
if (modeClass) document.body.classList.add(modeClass);
const back = () => {
document.title = orig;
if (modeClass) document.body.classList.remove(modeClass);
window.removeEventListener('afterprint', back);
};
window.addEventListener('afterprint', back);
window.print();
}
function printTable() { runPrint('print-mode-table', fileStem()); }
byId('printDashBtn').addEventListener('click', () => runPrint(null, 'Receivables_Dashboard_' + fileStem().split('_').pop()));
function excel() {
if (!window.arXl || !XV) return;
window.arXl({
v: XV, title: 'Receivables & Collection - ' + viewTitle(' - '), path: crumbText(),
period: periodTxt(), asof: META.asOf || '', od: invOd, file: fileStem() + '.xlsx'
});
}
(function () {
const box = byId('exportBox');
if (!box) return;
if (window.jmExport) {
window.jmExport.attach(box, { pdf: printTable, excel: window.arXl ? excel : null });
} else {
box.innerHTML = '<button type="button" class="btn-print" id="printTableBtn">Print / PDF</button>';
byId('printTableBtn').addEventListener('click', printTable);
}
})();
const d1 = byId('fD1'), d2 = byId('fD2');
d1.value = META.d1 || '';
d2.value = META.d2 || '';
const DRE = /^\d{2}\/\d{2}\/\d{4}$/;
const applyBtn = byId('collApplyBtn');
applyBtn.addEventListener('click', function () {
const btn = this;
if (!DRE.test(d1.value.trim()) || !DRE.test(d2.value.trim())) {
alert('Dates must be DD/MM/YYYY'); return;
}
btn.disabled = true; btn.textContent = 'Loading...';
apex.server.process('RECEIVABLES_AJAX',
{ x01: 'coll', x02: d1.value.trim(), x03: d2.value.trim() },
{
success: function (d) {
btn.disabled = false; btn.textContent = 'Apply Period';
if (d && d.err) { alert(d.err); return; }
COLL = d;
render();
},
error: function () {
btn.disabled = false; btn.textContent = 'Apply Period';
alert('Could not load collections. Make sure the RECEIVABLES_AJAX process exists.');
}
});
});
[d1, d2].forEach(el => el.addEventListener('keydown', e => {
if (e.keyCode === 13) { e.preventDefault(); applyBtn.click(); }
}));
function render() {
refreshTabs();
markActive();
buildPrintFilters();
paintKpis();
byId('tableTitleText').textContent = viewTitle(' ' + DASH + ' ');
const v = curView();
if (v === 'INV') {
drawInvoices(selCust || drillCust, !selCust && drillRc);
} else if (v === 'RTN') {
drawRtnCustomers();
} else if (v === 'CUST') {
drawAging('c', 'CUSTOMER', dvRows().filter(r => r.s === drillSman), 'CUST',
'click a customer to open invoices',
x => smC(x) === drillSman && dpOk(x));
} else if (v === 'SMAN') {
drawAging('s', 'SALESMAN', scRows(), 'SMAN', 'click a salesman to open his customers', scColl);
} else if (v === 'SUP') {
drawAging('sup', 'SUPERVISOR', inScope() ? scRows() : null, 'SUP',
'click a supervisor to open his salesmen', inScope() ? scColl : null);
} else if (v === 'AREA') {
drawAging('an', 'AREA', drillDiv ? dvRows() : null, 'AREA',
'click an area to open its supervisors', drillDiv ? dpOk : null);
} else {
drawAging('dp', 'DIVISION', null, 'DIV', 'click a division to open its areas');
}
}
byId('resetBtn').addEventListener('click', () => {
clearCust(); custInp.value = '';
d1.value = META.d1 || ''; d2.value = META.d2 || '';
level = 'SUP'; sortKey = 'od'; sortDir = 1;
invOd = false; invOdBtn.classList.remove('on');
resetDrill();
render();
});
byId('periodBadge').textContent = 'As of ' + (META.asOf ? META.asOf.split(' ')[0] : 'today');
render();
}
initReceivablesDashboard();

});
