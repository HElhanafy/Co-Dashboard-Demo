window.addEventListener("DOMContentLoaded",function(){
function initCollectionDashboard() {
const byId = id => document.getElementById(id);
const rEl = byId('cp-rows'), mEl = byId('cp-meta');
if (!rEl || !mEl) {
initCollectionDashboard._t = (initCollectionDashboard._t || 0) + 1;
if (initCollectionDashboard._t < 100) { setTimeout(initCollectionDashboard, 100); return; }
console.error('Collection dashboard: data regions not found.');
return;
}
let ROWS = JSON.parse(rEl.textContent);
const META = JSON.parse(mEl.textContent);
let SM = {};
try { SM = JSON.parse(byId('cp-sm').textContent) || {}; } catch (e) { SM = {}; }
const mtdEl = byId('cp-mtd'), mcEl = byId('cp-mtdcoll');
const MTDMAP = {};
(mtdEl ? JSON.parse(mtdEl.textContent) : []).forEach(r => { r.cv = 0; MTDMAP[r.c] = r; });
(mcEl ? JSON.parse(mcEl.textContent) : []).forEach(x => {
const t = MTDMAP[x.c];
if (t) { t.cv = x.cv; t.rc = x.rc || 0; }
else MTDMAP[x.c] = { c: x.c, cn: x.cn, d: x.d, s: x.s, sn: x.sn, an: x.an, ot: 0, ov: 0, op: 0, rk: 0, oa: 0, dm: 0, cv: x.cv, rc: x.rc || 0 };
});
const fmt = n => {
if (Math.abs(n) < 1) return Math.abs(n) >= 0.005 ? n.toFixed(2) : '0';
return Math.round(n).toLocaleString('en-US');
};
const esc = s => String(s).replace(/[&<>"]/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[m]));
function idxOf(arr, v) { for (let i=0;i<arr.length;i++) if (arr[i]===v) return i; return -1; }
function hasVal(arr, v) { return idxOf(arr, v) !== -1; }
const DASH = String.fromCharCode(8212), SEP = String.fromCharCode(8250), ARR = String.fromCharCode(8594);
const MN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const lab = m => m ? MN[+m.slice(4,6) - 1] + ' ' + m.slice(0,4) : DASH;
function prevOf(m) {
const y = +m.slice(0,4), mm = +m.slice(4,6);
return mm === 1 ? (y-1) + '12' : y + ('0' + (mm-1)).slice(-2);
}
function eom(m) {
if (!m) return DASH;
const y = +m.slice(0,4), mm = +m.slice(4,6);
return ('0' + new Date(y, mm, 0).getDate()).slice(-2) + '/' + m.slice(4,6) + '/' + y;
}
const adDate = () => (META.asOfD || '').split(' ')[0] || 'last night';
const MB = 1000;
function pctTxt(v, signed) {
if (v > 9.995) return (signed ? '&ge;+' : '&ge;') + '999%';
if (v < -9.995) return '&le;-999%';
return (signed && v >= 0 ? '+' : '') + (v * 100).toFixed(1) + '%';
}
const nameOfS = {}, supNm = {};
for (const k in SM) { if (SM[k] && SM[k][1]) supNm[SM[k][1]] = SM[k][2]; }
const noteName = r => { if (r.s && r.sn) nameOfS[r.s] = r.sn; };
const supOf = s => (SM[s] && SM[s][1]) ? SM[s][1] : s;
const smName = s => nameOfS[s] || (SM[s] && SM[s][0]) || '(No Salesman)';
const supName = p => supNm[p] || nameOfS[p] || (SM[p] && SM[p][0]) || '(No Supervisor)';
let YEAR = META.year;
let byM = {}, months = [], hasLive = false, m0 = '';
let level = 'SUP', sub = '', sortKey = 'ov', sortDir = -1;
let selCust = '';
let drillDiv = null, drillArea = null, drillSup = null, drillSupName = '', drillSman = null, drillSmanName = '', drillCust = null, drillCustName = '';
let stack = [], XV = null;
function rebuild() {
byM = {};
ROWS.forEach(r => { noteName(r); (byM[r.m] || (byM[r.m] = {}))[r.c] = r; });
for (const c in MTDMAP) noteName(MTDMAP[c]);
const set = {};
ROWS.forEach(r => { if (+r.m.slice(0,4) === +YEAR) set[r.m] = 1; });
months = Object.keys(set).sort();
hasLive = String(YEAR) === META.curM.slice(0,4) && META.curM > (META.lastM || '');
if (hasLive) months.push(META.curM);
}
function evalMonth(m) {
let cur, prev;
if (hasLive && m === META.curM) {
cur = MTDMAP;
prev = (META.lastM && prevOf(m) === META.lastM) ? byM[META.lastM] : null;
} else {
cur = byM[m] || {};
prev = byM[prevOf(m)] || null;
}
const hp = !!prev, out = [], seen = {};
function push(c, cr, pr) {
const dm = (cr && cr.cn !== undefined) ? cr : (pr || {});
const e = {
c: c, cn: dm.cn || c, d: dm.d || 'Unassigned', s: dm.s || '0',
sn: dm.sn || '(No Salesman)', an: dm.an || '(No Area)',
ot: cr ? cr.ot : 0, ov: cr ? cr.ov : 0, op: cr ? cr.op : 0,
rk: cr ? cr.rk : 0, cv: cr ? (cr.cv || 0) : 0, dm: cr ? (cr.dm || 0) : 0, rc: cr ? (cr.rc || 0) : 0,
oo: hp && pr ? pr.ov : 0, dnp: hp && pr ? (pr.dn || 0) : 0, oc: hp && pr ? (pr.ot - pr.ov) : 0, n: 1
};
e.sup = supOf(e.s);
e.rec = e.oo + e.rc - e.op;
e.nw = e.ov - e.op;
out.push(e);
}
for (const c in cur) { seen[c] = 1; push(c, cur[c], prev ? prev[c] : null); }
if (prev) for (const c in prev) if (!seen[c] && prev[c].ov > 0.005) push(c, null, prev[c]);
return { list: out, hp: hp };
}
function keep(e) {
if (selCust && e.c !== selCust) return false;
if (drillCust && e.c !== drillCust) return false;
if (drillSman && e.s !== drillSman) return false;
if (drillSup && e.sup !== drillSup) return false;
if (drillArea && e.an !== drillArea) return false;
if (drillDiv && e.d !== drillDiv) return false;
return true;
}
function newAgg(name, key) {
return { name: name, key: key, oo:0, rec:0, nw:0, oc:0, ov:0, op:0, ot:0, rk:0, cv:0, dm:0, rc:0, dnp:0, n:0 };
}
function addE(o, e) {
o.oo += e.oo; o.rec += e.rec; o.nw += e.nw; o.oc += e.oc; o.ov += e.ov; o.op += e.op; o.ot += e.ot; o.rk += e.rk; o.cv += e.cv;
o.dm += (e.dm || 0); o.rc += (e.rc || 0); o.dnp += (e.dnp || 0); o.n += (e.n || 1);
}
function deco(o, hp) {
o.hp = hp;
o.oox  = o.oo + o.rc;
o.rp   = hp && o.oox >= MB ? o.rec / o.oox : null;
o.roll = hp && o.oc >= MB ? o.nw / o.oc : null;
o.net  = hp && o.oox >= MB ? (o.oox - o.ov) / o.oox : null;
o.resp = o.oox + o.dnp;
o.ach  = hp && o.resp >= MB ? 1 - o.ov / o.resp : null;
o.risk = o.ot >= MB ? o.rk / o.ot : null;
return o;
}
function group(list, keyF, hp) {
const g = {};
list.forEach(e => {
const k = keyF === 'c' ? e.c : keyF === 'sup' ? e.sup : e[keyF];
const o = g[k] || (g[k] = newAgg(keyF === 'c' ? e.cn : keyF === 's' ? smName(k) : keyF === 'sup' ? supName(k) : k, k));
addE(o, e);
});
return Object.values(g).map(o => deco(o, hp));
}
function totalOf(list, hp) {
const t = newAgg('TOTAL', null);
list.forEach(o => addE(t, o));
return deco(t, hp);
}
const scopeOf = m => { const ev = evalMonth(m); return { list: ev.list.filter(keep), hp: ev.hp }; };
function cellN(v, cls, hp) {
if (hp === false) return '<td class="num z">' + DASH + '</td>';
return '<td class="num ' + (Math.abs(v) > 0.5 ? (cls || '') : 'z') + '">' + (Math.abs(v) > 0.5 ? fmt(v) : DASH) + '</td>';
}
function cellP(v, kind) {
if (v === null) return '<td class="num z">' + DASH + '</td>';
let cls;
if (kind === 'rp') cls = v >= 0.7 ? 'rp-good' : v >= 0.4 ? 'rp-mid' : 'rp-bad';
else cls = v <= 0.10 ? 'rp-good' : v <= 0.25 ? 'rp-mid' : 'rp-bad';
return '<td class="num ' + cls + '">' + pctTxt(v, false) + '</td>';
}
function rowCells(o) {
return cellN(o.resp, '', o.hp) + cellN(o.ov, 'od-cell', true) + cellP(o.ach, 'rp') + cellP(o.rp, 'rp') + cellP(o.roll, 'roll') +
(o.risk === null ? '<td class="num z">' + DASH + '</td>' : '<td class="num">' + (o.risk * 100).toFixed(1) + '%</td>') +
'<td class="num info-cell">' + (o.cv > 0.5 ? fmt(o.cv) : DASH) + '</td>';
}
const COLS = [
{ k:'resp', t:'MONTH RESPONSIBILITY' }, { k:'ov', t:'CLOSING OVERDUE' }, { k:'ach', t:'ACHIEVEMENT %' }, { k:'rp', t:'RECOVERY %' },
{ k:'roll', t:'ROLL RATE' }, { k:'risk', t:'RISK % (&gt;120D)' }, { k:'cv', t:'COLLECTED (INFO)' }
];
function headHtml(c, sortable) {
return '<tr class="print-title-row"><th colspan="' + c.length + '">' + esc(printTitle()) + '</th></tr><tr>' +
c.map(x => '<th class="' + (x.txt ? '' : 'num') + ' ' + (sortable ? (sortKey === x.k ? 'sorted' + (sortDir === 1 ? ' asc' : '') : '') : 'nos') +
'"' + (sortable ? ' data-k="' + x.k + '"' : '') + '>' + x.t + '</th>').join('') + '</tr>';
}
function bindSort() {
document.querySelectorAll('#tableHead th[data-k]').forEach(th =>
th.addEventListener('click', () => {
const k = th.dataset.k;
if (sortKey === k) sortDir = -sortDir; else { sortKey = k; sortDir = -1; }
render();
}));
}
function sortList(list) {
list.sort((a, b) => {
let x = a[sortKey], y = b[sortKey];
if (typeof x === 'string') return (x < y ? -1 : 1) * -sortDir;
if (x === null) x = -Infinity;
if (y === null) y = -Infinity;
return (x < y ? -1 : 1) * sortDir;
});
return list;
}
function allowed() {
if (selCust || drillCust) return ['TREND'];
if (drillSman) return ['TREND', 'CUST'];
if (drillSup) return ['TREND', 'SMAN'];
if (drillArea) return ['TREND', 'SUP'];
if (drillDiv) return ['TREND', 'AREA', 'SUP'];
return ['TREND', 'DIV', 'AREA', 'SUP'];
}
const inScope = () => !!(drillDiv || drillArea || drillSup || drillSman || drillCust);
function curView() {
const a = allowed(), v = inScope() ? sub : level;
return hasVal(a, v) ? v : a[a.length - 1];
}
function snap() {
return { level, sub, drillDiv, drillArea, drillSup, drillSupName, drillSman, drillSmanName, drillCust, drillCustName };
}
function restore(s) {
level = s.level; sub = s.sub; drillDiv = s.drillDiv; drillArea = s.drillArea; drillSup = s.drillSup; drillSupName = s.drillSupName;
drillSman = s.drillSman; drillSmanName = s.drillSmanName; drillCust = s.drillCust; drillCustName = s.drillCustName;
}
function resetDrill() {
drillDiv = null; drillArea = null; drillSup = null; drillSupName = ''; drillSman = null; drillSmanName = ''; drillCust = null; drillCustName = '';
sub = ''; stack = [];
}
function drillInto(view, k, n) {
stack.push(snap());
if (view === 'DIV') { drillDiv = k; sub = 'AREA'; }
else if (view === 'AREA') { drillArea = k; sub = 'SUP'; }
else if (view === 'SUP') {
drillSup = k; drillSupName = n; sub = 'SMAN';
const one = group(scopeOf(m0).list, 's', true);
if (one.length === 1) { drillSman = one[0].key; drillSmanName = one[0].name; sub = 'CUST'; }
}
else if (view === 'SMAN') { drillSman = k; drillSmanName = n; sub = 'CUST'; }
else { drillCust = k; drillCustName = n; sub = 'TREND'; }
sortKey = 'ov'; sortDir = -1;
render();
}
function bindDrill(view) {
document.querySelectorAll('#tableBody tr.drill-row').forEach(tr =>
tr.addEventListener('click', () => drillInto(view, tr.dataset.k, tr.dataset.n)));
}
byId('backBtn').addEventListener('click', () => { if (stack.length) restore(stack.pop()); render(); });
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
return p.map((x, i) => '<span class="crumb' + (i === p.length - 1 ? ' crumb-last' : '') + '">' + esc(x) + '</span>').join('<span class="crumb-sep">' + SEP + '</span>');
}
function setSub(html) { byId('tableSub').innerHTML = (crumbParts().length ? crumbHtml() + ' ' + DASH + ' ' : '') + html; }
const scopeName = () => { const p = crumbParts(); return p.length ? p[p.length - 1] : 'Company'; };
function drawTrend() {
const c = [{ k:'name', t:'MONTH', txt:1 }].concat(COLS);
byId('tableHead').innerHTML = headHtml(c, false);
let html = '';
const out = [];
months.forEach(m => {
const sc = scopeOf(m), o = newAgg(lab(m), m);
sc.list.forEach(e => addE(o, e));
deco(o, sc.hp);
const live = hasLive && m === META.curM;
o.live = live; out.push(o);
html += '<tr' + (live ? ' class="live-row"' : '') + '><td>' + lab(m) + (live ? ' <span class="chip chip-live">LIVE</span>' : '') + '</td>' + rowCells(o) + '</tr>';
});
byId('tableBody').innerHTML = html;
setSub(scopeName() + ' ' + DASH + ' month by month, ' + YEAR + (hasLive ? ' (current month updates nightly)' : ''));
XV = { k: 'TREND', list: out };
}
function drawFlat(keyF, nameLbl, view, hint) {
const sc = scopeOf(m0);
let list = group(sc.list, keyF, sc.hp);
if (keyF === 'c') list = list.filter(o => o.oo > 0.005 || o.ov > 0.005 || o.cv > 0.005);
sortList(list);
const c = [{ k:'name', t:nameLbl, txt:1 }].concat(COLS), tot = totalOf(list, sc.hp);
byId('tableHead').innerHTML = headHtml(c, true);
byId('tableBody').innerHTML =
list.map(o => '<tr class="drill-row" data-k="' + esc(o.key) + '" data-n="' + esc(o.name) + '"><td><span class="tw">&#9656;</span> ' + esc(o.name) + '</td>' + rowCells(o) + '</tr>').join('') +
'<tr class="total-row"><td>TOTAL</td>' + rowCells(tot) + '</tr>';
bindSort(); bindDrill(view);
setSub(list.length + ' rows ' + DASH + ' ' + lab(m0) + ' ' + DASH + ' ' + hint + ', headers to sort');
XV = { k: 'FLAT', lbl: nameLbl, cust: keyF === 'c', list: list, tot: tot };
}
function paintKpis(sc) {
const t = newAgg('T', null);
sc.list.forEach(e => addE(t, e));
deco(t, sc.hp);
const live = hasLive && m0 === META.curM;
const dOpen = eom(prevOf(m0)), dClose = live ? adDate() : eom(m0), dSpan = '01/' + m0.slice(4,6) + ' ' + ARR + ' ' + dClose;
const pct = (v, l) => v === null ? '' : '<span class="pct">' + l + ' ' + pctTxt(v, false) + '</span>';
byId('kpiContainer').innerHTML =
'<div class="kpi k-total"><div class="label">1&middot; Opening Overdue</div><div class="value">' + (t.hp ? fmt(t.oo) : '&mdash;') + '</div><div class="sub">as of ' + dOpen + '</div></div>' +
'<div class="kpi k-old"><div class="label">2&middot; Returned Cheques</div><div class="value' + (t.rc > 0.5 ? ' v-bad' : '') + '">' + (t.rc > 0.5 ? fmt(t.rc) : '&mdash;') + '</div><div class="sub">bounced ' + dSpan + '</div></div>' +
'<div class="kpi k-total"><div class="label">3&middot; Due This Month</div><div class="value">' + (t.hp ? fmt(t.dnp) : '&mdash;') + '</div><div class="sub">matures 01/' + m0.slice(4,6) + ' ' + ARR + ' ' + eom(m0) + '</div></div>' +
'<div class="kpi k-total"><div class="label">= Month Responsibility</div><div class="value">' + (t.hp ? fmt(t.resp) : '&mdash;') + '</div><div class="sub">1 + 2 + 3 &middot; must be resolved by ' + eom(m0) + '</div></div>' +
'<div class="kpi k-coll"><div class="label">Recovered (Old Book)</div><div class="value v-good">' + (t.hp ? fmt(t.rec) : '&mdash;') + pct(t.rp, 'Recovery') + '</div><div class="sub">' + dSpan + ' &middot; overdue book cleared</div></div>' +
'<div class="kpi k-due"><div class="label">Newly Overdue</div><div class="value v-bad">' + fmt(t.nw) + pct(t.roll, 'Roll') + '</div><div class="sub">' + dSpan + ' &middot; of the current book</div></div>' +
'<div class="kpi k-total"><div class="label">Closing Overdue</div><div class="value">' + fmt(t.ov) + '</div><div class="sub">as of ' + dClose + ' &middot; Net ' + (t.net === null ? '&mdash;' : pctTxt(t.net, true)) + ' &middot; Risk ' + (t.risk === null ? '&mdash;' : pctTxt(t.risk, false)) + '</div></div>' +
'<div class="kpi k-ach"><div class="label">Achievement %</div><div class="value">' + (t.ach === null ? '&mdash;' : pctTxt(t.ach, false)) + '</div><div class="sub">resolved of month responsibility &middot; scoring basis</div></div>';
const cs = {}; sc.list.forEach(e => { cs[e.c] = 1; });
const ok = META.lastM && META.lastM === prevOf(META.curM);
byId('infoStrip').innerHTML =
'<span><span class="lb">Collected (info)</span><b>' + fmt(t.cv) + '</b> cash receipts, any invoice, ' + dSpan + ' &middot; not scored</span>' +
(live ? '<span><span class="lb">Month-end projection</span><b>' + fmt(t.dm) + '</b> overdue at ' + eom(m0) + ' if uncollected &middot; = system report</span>' : '') +
'<span><span class="lb">Customers in scope</span><b>' + Object.keys(cs).length + '</b></span>' +
'<span class="' + (ok ? 'ok' : 'warn') + '"><span class="lb">Archive</span><b>' + (ok ? 'complete to ' + lab(META.lastM) : 'behind ' + DASH + ' last archived ' + lab(META.lastM) + ' (expected ' + lab(prevOf(META.curM)) + ')') + '</b></span>';
return t;
}
function paintScope(sc) {
const box = byId('scopeBox');
if (!inScope() && !selCust) { box.style.display = 'none'; return; }
const ds = {}, as = {}, ss = {}, cs = {};
sc.list.forEach(e => { ds[e.d] = 1; as[e.an] = 1; ss[e.s] = 1; cs[e.c] = 1; });
const cell = (l, v) => '<div><small>' + l + '</small><strong>' + v + '</strong></div>';
const one = o => { const k = Object.keys(o); return k.length === 1 ? k[0] : k.length + ' of them'; };
let lbl, name, cells = '';
const effC = selCust || drillCust;
if (effC) {
lbl = 'Customer'; name = selCust ? custInp.value : drillCustName;
const e0 = sc.list[0];
cells = cell('Code', esc(effC)) + (e0 ? cell('Salesman', esc(e0.sn)) + (supName(e0.sup) !== e0.sn ? cell('Supervisor', esc(supName(e0.sup))) : '') + cell('Area', esc(e0.an)) : '');
} else if (drillSman) {
lbl = 'Salesman'; name = drillSmanName;
const pn = drillSup ? drillSupName : supName(supOf(drillSman));
cells = (pn !== name ? cell('Supervisor', esc(pn)) : '') + cell('Division', esc(drillDiv || one(ds))) + cell('Area', esc(drillArea || one(as))) + cell('Customers', Object.keys(cs).length);
} else {
lbl = drillSup ? 'Supervisor' : drillArea ? 'Area' : 'Division';
name = drillSup ? drillSupName : (drillArea || drillDiv);
cells = (drillSup || drillArea ? cell('Division', esc(drillDiv || one(ds))) : '') + (drillSup ? cell('Area', esc(drillArea || one(as))) : '') +
cell('Salesmen', Object.keys(ss).length) + cell('Customers', Object.keys(cs).length);
}
cells += cell('Month', lab(m0) + (hasLive && m0 === META.curM ? ' (live)' : ''));
box.innerHTML = '<div class="hb-band"><div><small>' + lbl + '</small><strong class="nm">' + esc(name) + '</strong></div>' + cells + '</div>';
box.style.display = '';
}
const LABEL = { TREND:'Monthly Trend', DIV:'Division', AREA:'Area', SUP:'Supervisor', SMAN:'Salesman', CUST:'Customer' };
const PLURAL = { AREA:'Areas', SUP:'Supervisors', SMAN:'Salesmen', CUST:'Customers' };
function refreshTabs() {
const a = allowed(), v = curView();
document.querySelectorAll('.lvl-btn[data-level]').forEach(b => {
b.style.display = hasVal(a, b.dataset.level) ? '' : 'none';
b.classList.toggle('active', b.dataset.level === v);
});
byId('levelTabs').style.display = a.length > 1 ? '' : 'none';
byId('backBtn').style.display = (!selCust && stack.length) ? '' : 'none';
}
document.querySelectorAll('.lvl-btn[data-level]').forEach(b =>
b.addEventListener('click', () => {
if (inScope()) sub = b.dataset.level; else level = b.dataset.level;
sortKey = 'ov'; sortDir = -1;
render();
}));
function viewTitle(d) {
const v = curView();
if (v === 'TREND') return 'Monthly Trend' + d + scopeName() + ' ' + YEAR;
const of = drillSman ? drillSmanName : drillSup ? drillSupName : (drillArea || drillDiv);
if (of && PLURAL[v]) return PLURAL[v] + ' of ' + of + d + lab(m0);
return 'Recovery by ' + LABEL[v] + d + lab(m0);
}
function nowTxt() {
const d = new Date(), p = n => (n < 10 ? '0' : '') + n;
return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
}
const grp = () => window.cpGrp ? window.cpGrp() : '';
function printTitle() {
return 'Co. Dashboard | Collection Performance - ' + viewTitle(' - ') + ' | Archive ' + (META.asOf || '-') + ' | Printed ' + nowTxt();
}
function buildPrintFilters() {
const parts = [];
if (crumbText()) parts.push('<b>Scope:</b> ' + esc(crumbText()));
parts.push('<b class="pf-x">View:</b> ' + esc(viewTitle(' - ')));
parts.push('<b>Month:</b> ' + lab(m0) + (hasLive && m0 === META.curM ? ' (live, data as of ' + esc(META.asOfD || '-') + ')' : ''));
parts.push('<b class="pf-x">Archive:</b> ' + esc(META.asOf || '-'));
if (grp()) parts.push('<b>Data group:</b> ' + esc(grp()));
byId('printFilters').innerHTML = parts.join('<span class="pf-sep">|</span>');
}
function fileStem() { return 'Collection_' + curView() + '_' + (curView() === 'TREND' ? YEAR : m0); }
function runPrint(modeClass, title) {
const th = document.querySelector('#printTablePanel .print-title-row th');
if (th) th.textContent = printTitle();
const orig = document.title;
document.title = title;
if (modeClass) document.body.classList.add(modeClass);
const back = () => { document.title = orig; if (modeClass) document.body.classList.remove(modeClass); window.removeEventListener('afterprint', back); };
window.addEventListener('afterprint', back);
window.print();
}
function printTable() { runPrint('print-mode-table', fileStem()); }
byId('printDashBtn').addEventListener('click', () => runPrint(null, 'Collection_Dashboard_' + m0));
function excel() {
if (!window.cpXl || !XV) return;
window.cpXl({ v: XV, title: 'Collection Performance - ' + viewTitle(' - '), path: crumbText(), month: lab(m0), year: YEAR, asof: META.asOf || '', file: fileStem() + '.xlsx' });
}
(function () {
const box = byId('exportBox');
if (!box) return;
if (window.jmExport) { window.jmExport.attach(box, { pdf: printTable, excel: window.cpXl ? excel : null }); }
else { box.innerHTML = '<button type="button" class="btn-print" id="printTableBtn">Print / PDF</button>'; byId('printTableBtn').addEventListener('click', printTable); }
})();
const yearSel = byId('fYear'), monSel = byId('fMonth');
const custBox = byId('fCustBox'), custInp = byId('fCustInp'), custClr = byId('fCustClr');
function dimRows() {
const out = ROWS.slice();
if (String(YEAR) === META.curM.slice(0,4)) for (const c in MTDMAP) if (MTDMAP[c].cn !== undefined) out.push(MTDMAP[c]);
return out;
}
function custSource(q) {
q = q.toLowerCase();
const seen = {}, out = [];
dimRows().forEach(r => { if (!seen[r.c]) { seen[r.c] = 1; out.push({ c: r.c, cn: r.cn }); } });
out.sort((a, b) => a.cn < b.cn ? -1 : 1);
return out.filter(x => !q || x.cn.toLowerCase().indexOf(q) !== -1 || x.c.indexOf(q) !== -1).slice(0, 200);
}
function clearCust() { selCust = ''; custBox.classList.remove('picked'); custClr.style.display = 'none'; }
if (window.cpSS) {
window.cpSS(custInp, byId('fCustMenu'), custSource, (c, n) => {
selCust = c; custInp.value = n; custBox.classList.add('picked'); custClr.style.display = '';
resetDrill(); render();
});
}
custInp.addEventListener('input', () => { if (selCust) { clearCust(); resetDrill(); render(); } });
custClr.addEventListener('click', () => { clearCust(); custInp.value = ''; resetDrill(); render(); });
function fillMonths() {
while (monSel.options.length) monSel.remove(0);
months.forEach(m => {
const o = document.createElement('option');
o.value = m; o.textContent = (window.jmT || String)(lab(m) + (hasLive && m === META.curM ? ' (Live)' : ''));
monSel.appendChild(o);
});
if (!hasVal(months, m0)) m0 = months.length ? months[months.length - 1] : '';
monSel.value = m0;
}
monSel.addEventListener('change', () => { m0 = monSel.value; render(); });
(function () {
const y0 = +META.curM.slice(0,4);
for (let y = y0; y >= META.minYear; y--) { const o = document.createElement('option'); o.value = y; o.textContent = y; yearSel.appendChild(o); }
yearSel.value = YEAR;
})();
yearSel.addEventListener('change', () => {
const y = +yearSel.value;
yearSel.disabled = true;
apex.server.process('COLLECTION_AJAX', { x01: 'rows', x02: y }, {
success: function (d) {
yearSel.disabled = false;
if (d && d.err) { alert(d.err); yearSel.value = YEAR; return; }
ROWS = d; YEAR = y; m0 = '';
rebuild(); fillMonths(); render();
},
error: function () { yearSel.disabled = false; yearSel.value = YEAR; alert('Could not load year data. Make sure COLLECTION_AJAX exists.'); }
});
});
function render() {
refreshTabs();
buildPrintFilters();
const sc = scopeOf(m0);
paintScope(sc);
paintKpis(sc);
byId('periodBadge').innerHTML = esc(lab(m0)) + (hasLive && m0 === META.curM ? ' &middot; <span class="live-dot">LIVE</span>' : '');
byId('tableTitleText').textContent = viewTitle(' ' + DASH + ' ');
const v = curView();
if (v === 'TREND') drawTrend();
else if (v === 'DIV') drawFlat('d', 'DIVISION', 'DIV', 'click a division for its areas');
else if (v === 'AREA') drawFlat('an', 'AREA', 'AREA', 'click an area for its supervisors');
else if (v === 'SUP') drawFlat('sup', 'SUPERVISOR', 'SUP', 'click a supervisor for his salesmen (one salesman opens the customers)');
else if (v === 'SMAN') drawFlat('s', 'SALESMAN', 'SMAN', 'click a salesman for his customers');
else drawFlat('c', 'CUSTOMER', 'CUST', 'incl. fully-collected customers ' + DASH + ' click a customer for its monthly trend');
}
byId('resetBtn').addEventListener('click', () => {
clearCust(); custInp.value = '';
resetDrill();
level = 'SUP'; sortKey = 'ov'; sortDir = -1;
m0 = months.length ? months[months.length - 1] : '';
monSel.value = m0;
render();
});
rebuild(); fillMonths(); render();
}
initCollectionDashboard();

});
