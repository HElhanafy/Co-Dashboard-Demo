window.addEventListener("DOMContentLoaded",function(){
(function () {
"use strict";
function $id(id) { return document.getElementById(id); }
function esc(s) {
s = (s === null || s === undefined) ? "" : String(s);
return s.replace(/&/g, "&amp;").replace(/</g, "&lt;")
.replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function idxOf(arr, v) {
for (var i = 0; i < arr.length; i++) { if (arr[i] === v) { return i; } }
return -1;
}
function hasVal(arr, v) { return idxOf(arr, v) >= 0; }
function fmt(n) {
var neg = n < 0, x = Math.abs(n).toFixed(2),
p = x.split("."),
s = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "." + p[1];
return neg ? "-" + s : s;
}
function fmtAcc(n) {
if (n < -0.004) { return "(" + fmt(-n) + ")"; }
return fmt(n);
}
function pj(id) {
var el = $id(id);
if (!el) { return null; }
try { return JSON.parse(el.textContent || el.innerText); }
catch (e) { return null; }
}
function num(x) { var v = parseFloat(x); return isNaN(v) ? 0 : v; }
function ym(y, m) { return String(y) + (m < 10 ? "0" : "") + m; }
function bodyClass(name, on) {
var b = document.body,
c = " " + b.className + " ",
had = c.indexOf(" " + name + " ") >= 0;
if (on && !had) { b.className = (b.className + " " + name).replace(/^\s+/, ""); }
if (!on && had) {
b.className = c.split(" " + name + " ").join(" ").replace(/^\s+|\s+$/g, "");
}
}
var MN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
var LOAD =
'<tr><td colspan="9" style="padding:24px;text-align:center;color:#8a90b8">Loading...</td></tr>';
var META  = pj("fs-meta")    || {};
var COST1 = pj("fs-cost1")   || [];
var COST2 = pj("fs-cost2")   || [];
var CLEV  = pj("fs-clevels") || { c1: [1,3,5,7,9], c2: [1,3,6,9] };
var C1MAP = {}, C2MAP = {}, C1SIG = {}, C2SIG = {}, i;
function sigPrefix(code, lv, lens) {
var L = lens[lv - 1] || String(code).length;
return String(code).substring(0, L);
}
for (i = 0; i < COST1.length; i++) {
C1MAP[COST1[i].c] = COST1[i];
C1SIG[sigPrefix(COST1[i].c, COST1[i].lv, CLEV.c1)] = COST1[i].n;
}
for (i = 0; i < COST2.length; i++) {
C2MAP[COST2[i].c] = COST2[i];
C2SIG[sigPrefix(COST2[i].c, COST2[i].lv, CLEV.c2)] = COST2[i].n;
}
function c1n(c) {
c = String(c);
return c === "0" ? "-" : (C1MAP[c] ? C1MAP[c].n : c);
}
function c2n(c) {
c = String(c);
return c === "0" ? "-" : (C2MAP[c] ? C2MAP[c].n : c);
}
var curY = META.curY || 2026, minY = META.minY || 2023;
var curMo = META.curM ? parseInt(String(META.curM).substring(4, 6), 10) : 1;
var st = {
yF: curY, yT: curY,
mF: curMo, mT: curMo,
cmp: "T",
drill: null,
acc: null,
entry: null,
sortY: null, sortAsc: false
};
var ST = null, EN = null;
var cfg  = null;
var api  = null;
var LINES = [], LMAP = {}, vals = {};
function call(fn, a, b) {
return (api && typeof api[fn] === "function") ? api[fn](a, b) : null;
}
function setLines(arr) {
LINES = arr || [];
LMAP = {};
for (var k = 0; k < LINES.length; k++) { LMAP[LINES[k].id] = LINES[k]; }
CORE.LINES = LINES; CORE.LMAP = LMAP;
}
function fillSelect(sel, opts, val) {
var h = "";
for (var k = 0; k < opts.length; k++) {
h += '<option value="' + esc(opts[k].v) + '"' +
(String(opts[k].v) === String(val) ? " selected" : "") + ">" +
esc(opts[k].t) + "</option>";
}
sel.innerHTML = h;
}
function buildPeriodFilters() {
var ys = [], ms = [], k;
for (k = minY; k <= curY; k++) { ys.push({ v: k, t: String(k) }); }
for (k = 1; k <= 12; k++) { ms.push({ v: k, t: MN[k - 1] }); }
fillSelect($id("fYF"), ys, st.yF);
fillSelect($id("fYT"), ys, st.yT);
fillSelect($id("fMF"), ms, st.mF);
fillSelect($id("fMT"), ms, st.mT);
buildCmpFilter();
}
function fillSel(id, v) { $id(id).value = String(v); }
function buildCmpFilter() {
var multi = st.yF !== st.yT, n = st.mT - st.mF + 1,
opts = multi ? [{ v: "Y", t: "Yearly" }] : [{ v: "T", t: "Total" }],
ok = false, k;
if (!multi) {
if (n > 1) { opts.push({ v: "M", t: "Monthly" }); }
if (n > 3) { opts.push({ v: "Q", t: "Quarterly" }); }
if (n > 6) { opts.push({ v: "H", t: "Half-year" }); }
}
for (k = 0; k < opts.length; k++) {
if (opts[k].v === st.cmp) { ok = true; }
}
if (!ok) { st.cmp = multi ? "Y" : "T"; }
fillSelect($id("fCmp"), opts, st.cmp);
$id("fCmp").parentNode.classList.toggle("fs-off", opts.length === 1);
}
function monthsLb(lo, hi) { return lo === hi || (cfg && cfg.mode === "cumulative") ? MN[hi - 1] : MN[lo - 1] + "-" + MN[hi - 1]; }
function rangeLb(y) { return monthsLb(st.mF, st.mT) + " " + y; }
function keys(y, lo, hi) {
var ks = [], m;
for (m = lo; m <= hi; m++) { ks.push(ym(y, m)); }
return ks;
}
function col(lb, ks, sub) {
return { lb: lb, ks: ks, k: ks[ks.length - 1], sub: sub || "" };
}
function buildCols() {
var cols = [], y, g, ks, lo, hi, size;
if (st.yF !== st.yT) {
if (st.cmp === "T") {
ks = [];
for (y = st.yF; y <= st.yT; y++) {
ks = ks.concat(keys(y, st.mF, st.mT));
}
return [col(rangeLb(st.yF + "-" + st.yT), ks)];
}
for (y = st.yF; y <= st.yT; y++) {
cols.push(col(String(y), keys(y, st.mF, st.mT), monthsLb(st.mF, st.mT)));
}
return cols;
}
y = st.yF;
if (st.cmp === "M") {
for (g = st.mF; g <= st.mT; g++) {
cols.push(col(MN[g - 1] + " " + y, [ym(y, g)]));
}
return cols;
}
if (st.cmp === "Q" || st.cmp === "H") {
size = st.cmp === "Q" ? 3 : 6;
for (g = 0; g < 12 / size; g++) {
lo = Math.max(g * size + 1, st.mF);
hi = Math.min(g * size + size, st.mT);
if (lo > hi) { continue; }
cols.push(col((st.cmp === "Q" ? "Q" : "H") + (g + 1) + " " + y,
keys(y, lo, hi), monthsLb(lo, hi)));
}
return cols;
}
return [col(rangeLb(y), keys(y, st.mF, st.mT))];
}
function periodTxt() {
return monthsLb(st.mF, st.mT) + " " + (st.yF === st.yT ? String(st.yF) : st.yF + " to " + st.yT);
}
function stmtName() { return cfg ? cfg.title : ""; }
function render() {
if (!api) { return; }
var cols = buildCols();
vals = call("compute", cols) || {};
if (st.entry) { renderEntry(); }
else if (st.acc) { renderStmt(); }
else if (st.drill) { renderDrill(cols); }
else { renderStatement(cols); }
renderKpis(cols);
call("extra", cols, vals);
bodyClass("fs-cmp-total", cols.length === 1);
$id("periodBadge").textContent = call("badge", cols) || periodTxt();
var sc = call("scope") || "";
$id("scopeBar").innerHTML = sc ? "Scope: <b>" + esc(sc) + "</b>" : "";
$id("scopeBar").style.display = sc ? "" : "none";
$id("printFilters").innerHTML =
"<b>Period:</b> " + esc(periodTxt()) + (sc ? '<span class="pf-sep">|</span><b>Scope:</b> ' + esc(sc) : "") +
'<span class="pf-sep">|</span><b>Level:</b> ' + esc(levelTxt()) +
'<span class="pf-sep">|</span><b>Archive:</b> ' + esc(META.asOf || "-");
paintExport();
}
function nowTxt() {
var d = new Date(), p = function (n) { return (n < 10 ? "0" : "") + n; };
return p(d.getDate()) + "/" + p(d.getMonth() + 1) + "/" + d.getFullYear() + " " + p(d.getHours()) + ":" + p(d.getMinutes());
}
function levelTxt() {
return st.entry ? "Journal entry " + st.entry.t + "/" + st.entry.n
: st.acc ? "Ledger statement " + st.acc.a
: st.drill ? "Accounts of a line" : "Statement";
}
function printTitle() {
var ln = st.drill ? LMAP[st.drill] : null, sc = call("scope") || "";
return '<div class="pt-h"><b>Co. Dashboard</b> | ' + esc(stmtName()) + (ln ? " - " + esc(ln.lbl) : "") +
(st.acc ? " - " + esc(st.acc.n) + " (" + esc(st.acc.a) + ")" : "") +
(st.entry ? " - Entry " + esc(st.entry.t + "/" + st.entry.n) : "") + '</div><div class="pt-s">' +
esc(periodTxt()) + (sc ? " | " + esc(sc) : "") +
" | Data as of " + esc(META.asOf || "-") + " | Printed " + nowTxt() + "</div>";
}
function titleRow(n) {
return '<tr class="print-title-row"><th colspan="' + n + '">' + printTitle() + "</th></tr>";
}
function fileStem() {
var w = st.entry ? "_Entry_" + st.entry.t + "-" + st.entry.n
: st.acc ? "_Statement_" + st.acc.a
: st.drill ? "_Line_" + st.drill : "";
return stmtName().replace(/ /g, "_") + w + "_" + periodTxt().replace(/ /g, "");
}
function runPrint(mode, title) {
var th = document.querySelector("#printTablePanel .print-title-row th");
if (th) { th.innerHTML = printTitle(); }
var orig = document.title, undo = window.fsPrep ? window.fsPrep(!st.acc && !st.entry && buildCols().length === 1, nowTxt(), mode) : null;
document.title = title;
if (mode) { bodyClass(mode, true); }
var back = function () {
document.title = orig;
if (undo) { undo(); }
if (mode) { bodyClass(mode, false); }
window.removeEventListener("afterprint", back);
};
window.addEventListener("afterprint", back);
window.print();
}
function printTable() { runPrint("print-mode-table", fileStem()); }
function excel() {
if (!window.fsXl) { return; }
var cols = buildCols(), S = {
v: st.entry ? "EN" : st.acc ? "LS" : st.drill ? "DR" : "ST",
title: stmtName(), level: levelTxt(), period: periodTxt(), scope: call("scope") || "", asof: META.asOf || "",
cols: cols, lines: LINES, vals: vals, flip: cfg.negStyle === "flip", hide: cfg.hideZero || [], net: netLines(),
line: st.drill ? LMAP[st.drill] : null, accs: st.drill && !st.acc ? drillRows(cols) : null,
acc: st.acc, rows: st.acc && !st.entry && ST ? stmtRows() : null, c1n: c1n, c2n: c2n,
entry: st.entry, en: EN, file: fileStem() + ".xlsx"
};
window.fsXl(S);
}
var XM = "";
function paintExport() {
var box = $id("exportBox"), m = st.entry || !window.fsXl ? "p" : "px";
if (!box || m === XM) { return; }
XM = m;
if (window.jmExport) {
window.jmExport.attach(box, { pdf: printTable, excel: m === "px" ? excel : null });
} else {
box.innerHTML = '<button type="button" class="btn-print" id="printTableBtn">Print / PDF</button>';
$id("printTableBtn").onclick = printTable;
}
}
function headHtml(cols, firstTh, withDiff) {
var n = firstTh.split("<th").length - 1 + cols.length + (withDiff ? 2 : 0);
var h = titleRow(n) + "<tr>" + firstTh;
for (var y = 0; y < cols.length; y++) {
h += '<th class="val sortable" data-y="' + y + '">' + esc(cols[y].lb) + (cols[y].sub ? '<small class="fs-col-sub">' + esc(cols[y].sub) + "</small>" : "") + "</th>";
}
if (withDiff) {
h += '<th class="val diff-h">CHANGE</th><th class="val diff-h">%</th>';
}
return h + "</tr>";
}
function diffCells(d1, d2) {
var df = d2 - d1,
pc = Math.abs(d1) > 0.004 ? (df / Math.abs(d1)) * 100 : null;
return '<td class="val diff' + (df < -0.004 ? " neg" : "") + '">' + fmtAcc(df) + "</td>" +
'<td class="val diff' + (df < -0.004 ? " neg" : "") + '">' +
(pc === null ? "-" : fmt(pc) + "%") + "</td>";
}
function netLines() {
if (!cfg.net) { return []; }
return (typeof cfg.net === "string") ? [cfg.net] : cfg.net;
}
function hidden(ln, disp) {
if (!cfg.hideZero || !hasVal(cfg.hideZero, ln.id)) { return false; }
for (var k = 0; k < disp.length; k++) {
if (Math.abs(disp[k] || 0) > 0.004) { return false; }
}
return true;
}
function tableDir(deep) { $id("fsTable").setAttribute("dir", document.documentElement.getAttribute("dir") === "rtl" ? "rtl" : deep ? (cfg.deepLtr ? "ltr" : "rtl") : (cfg.rtl === false ? "ltr" : "rtl")); }
function renderStatement(cols) {
var withDiff = cols.length === 2;
$id("fsTable").className = "t-fs";
tableDir(false);
$id("tableTitleText").textContent = stmtName();
$id("tableSub").textContent = cfg.sub || "";
$id("backBtn").style.display = "none";
$id("crumbs").innerHTML = "";
$id("tableHead").innerHTML =
headHtml(cols, '<th class="fs-lbl-h fs-lbl">&nbsp;</th>', withDiff)
.replace(/ sortable/g, "");
var b = "", flip = cfg.negStyle === "flip";
for (var k = 0; k < LINES.length; k++) {
var ln = LINES[k],
v = vals[ln.id] || [],
disp = [];
for (var y = 0; y < cols.length; y++) {
disp.push(ln.neg ? -(v[y] || 0) : (v[y] || 0));
}
if (hidden(ln, disp)) { continue; }
var clickable = ln.t === "a" && call("hasRows", ln.id),
cls = [];
if (ln.t === "d") {
cls.push(hasVal(netLines(), ln.id) ? "fs-net" : "fs-total");
}
if (clickable) { cls.push("fs-clickable"); }
b += '<tr class="' + cls.join(" ") + '"' +
(clickable ? ' data-line="' + ln.id + '"' : "") + ">" +
'<td class="fs-lbl">' + (clickable ? '<span class="tw">&#' + (cfg.rtl ? "9666" : "9656") + ";</span>" : "") + esc(ln.lbl) + "</td>";
for (y = 0; y < cols.length; y++) {
var raw = v[y] || 0, cell;
if (ln.neg && !flip) {
cell = disp[y] > 0.004 ? "(" + fmt(disp[y]) + ")" : fmtAcc(-disp[y]);
} else {
cell = fmtAcc(disp[y]);
}
var red = flip ? disp[y] < -0.004 : (raw < -0.004 && ln.t === "d");
b += '<td class="val' + (red ? " neg" : "") + '">' + cell + "</td>";
}
if (withDiff) { b += diffCells(disp[0], disp[1]); }
b += "</tr>";
}
b += call("footer", cols, vals) || "";
$id("tableBody").innerHTML = b;
var trs = $id("tableBody").querySelectorAll("tr.fs-clickable");
for (k = 0; k < trs.length; k++) {
trs[k].onclick = (function (id) {
return function () {
st.drill = id;
st.sortY = null;
render();
};
}(trs[k].getAttribute("data-line")));
}
}
function drillRows(cols) {
var accs = call("drill", st.drill, cols) || [];
var sy = (st.sortY === null || st.sortY >= cols.length) ? cols.length - 1 : st.sortY;
accs.sort(function (p, q) {
var d = Math.abs(q.v[sy]) - Math.abs(p.v[sy]);
return st.sortAsc ? -d : d;
});
return accs;
}
function renderDrill(cols) {
var ln = LMAP[st.drill],
withDiff = cols.length === 2;
$id("fsTable").className = "t-drill";
tableDir(true);
$id("tableTitleText").textContent = ln.lbl;
$id("tableSub").textContent = "Accounts behind the selected line";
$id("backBtn").style.display = "";
$id("crumbs").innerHTML =
'<span class="crumb" data-go="root">' + esc(stmtName()) + "</span>" +
'<span class="crumb-sep">' + String.fromCharCode(8250) + "</span>" +
'<span class="crumb last fs-lbl" style="direction:rtl">' + esc(ln.lbl) + "</span>";
wireCrumbs();
$id("tableHead").innerHTML = headHtml(cols, "<th>ACCOUNT</th><th>NAME</th>", withDiff);
var accs = drillRows(cols), k, y;
var b = "", tot = [];
for (y = 0; y < cols.length; y++) { tot.push(0); }
for (k = 0; k < accs.length; k++) {
b += "<tr>" +
'<td class="acct-code cell-click" data-a="' + esc(accs[k].a) +
'" data-n="' + esc(accs[k].n) +
'" title="Open ledger statement">' + esc(accs[k].a) + "</td>" +
'<td class="fs-lbl">' + esc(accs[k].n) + "</td>";
for (y = 0; y < cols.length; y++) {
tot[y] += accs[k].v[y];
b += '<td class="val' + (accs[k].v[y] < -0.004 ? " neg" : "") + '">' +
fmtAcc(accs[k].v[y]) + "</td>";
}
if (withDiff) { b += diffCells(accs[k].v[0], accs[k].v[1]); }
b += "</tr>";
}
b += '<tr class="fs-total"><td></td><td class="fs-lbl">' + esc(ln.lbl) + "</td>";
for (y = 0; y < cols.length; y++) {
b += '<td class="val">' + fmtAcc(tot[y]) + "</td>";
}
if (withDiff) { b += diffCells(tot[0], tot[1]); }
b += "</tr>";
$id("tableBody").innerHTML = b;
var ths = $id("tableHead").querySelectorAll("th.sortable");
for (k = 0; k < ths.length; k++) {
ths[k].onclick = (function (yy) {
return function () {
if (st.sortY === yy) { st.sortAsc = !st.sortAsc; }
else { st.sortY = yy; st.sortAsc = false; }
render();
};
}(parseInt(ths[k].getAttribute("data-y"), 10)));
}
var tds2 = $id("tableBody").querySelectorAll("td.cell-click");
for (k = 0; k < tds2.length; k++) {
tds2[k].onclick = (function (el) {
return function () {
openStmt({ a: el.getAttribute("data-a"),
n: el.getAttribute("data-n") });
};
}(tds2[k]));
}
}
function goLevel(g) {
if (g === "root") {
st.drill = null; st.acc = null; st.entry = null;
ST = null; EN = null;
} else if (g === "line") {
st.acc = null; st.entry = null;
ST = null; EN = null;
} else if (g === "acc") {
st.entry = null; EN = null;
}
render();
}
function wireCrumbs() {
var cs = $id("crumbs").querySelectorAll("[data-go]");
for (var k = 0; k < cs.length; k++) {
cs[k].onclick = (function (g) {
return function () { goLevel(g); };
}(cs[k].getAttribute("data-go")));
}
}
function stmtPeriodTxt() {
return (st.mF === st.mT ? MN[st.mF - 1]
: MN[st.mF - 1] + "-" + MN[st.mT - 1]) + " " + st.yT;
}
function openStmt(acc) {
var p = call("params") || {};
$id("tableBody").innerHTML = LOAD;
apex.server.process(cfg.ajax,
{ x01: "stmt",
x02: p.c1 || "", x03: p.c2 || "",
x04: st.yT, x05: st.yT, x06: st.mF, x07: st.mT,
x08: acc.a, x09: st.drill,
x10: cfg.closing ? "1" : "0", x11: cfg.mode || "movement" },
{ dataType: "json" }
).done(function (d) {
if (d.err) { alert(d.err); render(); return; }
ST = d;
if (!st.acc || st.acc.a !== acc.a) { stmtF = {}; }
st.acc = acc;
st.entry = null; EN = null;
render();
}).fail(function () { alert("Request failed"); render(); });
}
var stmtF = {};
function stmtRows() {
var out = [], L = ST.lines || [], k, f;
for (k = 0; k < L.length; k++) {
var r = L[k], v = parseFloat(r.v) || 0,
d0 = v > 0 ? v : 0,
c0 = v < 0 ? -v : 0,
ok = true;
var vv = {
dt: r.dt, no: r.no, ds: r.ds || "",
c1: c1n(r.c1) + " " + r.c1, c2: c2n(r.c2) + " " + r.c2,
dr: d0 ? fmt(d0) : "", cr: c0 ? fmt(c0) : ""
};
for (f in stmtF) {
if (!stmtF[f]) { continue; }
if (String(vv[f]).toLowerCase().indexOf(stmtF[f].toLowerCase()) < 0) {
ok = false; break;
}
}
if (ok) { out.push({ i: k, r: r, d0: d0, c0: c0, vals: vv }); }
}
return out;
}
function stmtBody() {
var ln = LMAP[st.drill],
rows2 = stmtRows(),
b = "", dr = 0, cr = 0, k;
for (k = 0; k < rows2.length; k++) {
var x = rows2[k];
dr += x.d0; cr += x.c0;
var cc0 = x.r.n ? ' class="acct-code cell-click" title="Open journal entry"'
: ' class="acct-code"';
b += "<tr" + (x.r.n ? "" : ' class="open-row"') + ">" +
"<td" + cc0 + ' data-i="' + x.i + '">' + esc(x.r.dt) + "</td>" +
"<td" + cc0 + ' data-i="' + x.i + '">' + esc(x.r.no) + "</td>" +
'<td class="fs-lbl">' + esc(x.r.ds) + "</td>" +
'<td class="fs-lbl cc" title="' + esc(x.r.c1) + '">' + esc(c1n(x.r.c1)) + "</td>" +
'<td class="fs-lbl cc" title="' + esc(x.r.c2) + '">' + esc(c2n(x.r.c2)) + "</td>" +
'<td class="val dr">' + x.vals.dr + "</td>" +
'<td class="val cr">' + x.vals.cr + "</td></tr>";
}
b += '<tr class="fs-total">' +
'<td colspan="2">' + (ST.trunc ? "TRUNCATED AT 5000" : "") + "</td>" +
'<td class="fs-lbl">' + esc(st.acc.n) +
(rows2.length < (ST.lines || []).length
? " (FILTERED " + rows2.length + "/" + ST.lines.length + ")" : "") +
"</td><td></td><td></td>" +
'<td class="val">' + fmt(dr) + '</td><td class="val">' + fmt(cr) + "</td></tr>";
var net = (ln && ln.neg) ? dr - cr : cr - dr;
b += '<tr class="fs-net"><td colspan="5" class="fs-lbl">NET</td>' +
'<td class="val" colspan="2">' + fmtAcc(net) + "</td></tr>";
$id("tableBody").innerHTML = b;
var tds = $id("tableBody").querySelectorAll("td.cell-click");
for (k = 0; k < tds.length; k++) {
tds[k].onclick = (function (i) {
return function () {
openEntry(ST.lines[i].y, ST.lines[i].t, ST.lines[i].n);
};
}(parseInt(tds[k].getAttribute("data-i"), 10)));
}
}
function renderStmt() {
var ln = LMAP[st.drill],
sep = '<span class="crumb-sep">' + String.fromCharCode(8250) + "</span>";
$id("tableTitleText").textContent = st.acc.n;
$id("tableSub").textContent =
"Ledger statement " + stmtPeriodTxt() + " - " + (cfg.stmtSub || "");
$id("backBtn").style.display = "";
$id("crumbs").innerHTML =
'<span class="crumb" data-go="root">' + esc(stmtName()) + "</span>" + sep +
'<span class="crumb fs-lbl" data-go="line" style="direction:rtl">' +
esc(ln ? ln.lbl : "") + "</span>" + sep +
'<span class="crumb last fs-lbl" style="direction:rtl">' + esc(st.acc.n) + "</span>";
wireCrumbs();
function fi(f, rtl) {
return '<th class="flt-th"><input type="text" class="flt-in' +
(rtl ? " flt-rtl" : "") + '" data-f="' + f +
'" value="' + esc(stmtF[f] || "") + '"></th>';
}
$id("fsTable").className = "t-stmt";
tableDir(true);
$id("tableHead").innerHTML = titleRow(7) + "<tr>" +
"<th>DATE</th><th>ENTRY</th><th>DESCRIPTION</th><th>COST 1</th><th>COST 2</th>" +
'<th class="val">DEBIT</th><th class="val">CREDIT</th></tr>' +
'<tr class="flt-row">' + fi("dt") + fi("no") + fi("ds", true) +
fi("c1", true) + fi("c2", true) + fi("dr") + fi("cr") + "</tr>";
var ins = $id("tableHead").querySelectorAll("input.flt-in"), k;
for (k = 0; k < ins.length; k++) {
ins[k].oninput = (function (el) {
return function () {
stmtF[el.getAttribute("data-f")] = el.value;
stmtBody();
};
}(ins[k]));
}
stmtBody();
}
function openEntry(y, t, n) { if (window.jmEntry && window.jmEntry.open) { window.jmEntry.open(y, t, n); } }
function renderEntry() {
var ln = LMAP[st.drill],
sep = '<span class="crumb-sep">' + String.fromCharCode(8250) + "</span>";
$id("tableTitleText").textContent =
"Journal Entry " + st.entry.t + "/" + st.entry.n;
$id("tableSub").textContent = EN.dt + (EN.ds ? " - " + EN.ds : "");
$id("backBtn").style.display = "";
$id("crumbs").innerHTML =
'<span class="crumb" data-go="root">' + esc(stmtName()) + "</span>" + sep +
'<span class="crumb fs-lbl" data-go="line" style="direction:rtl">' +
esc(ln ? ln.lbl : "") + "</span>" + sep +
'<span class="crumb fs-lbl" data-go="acc" style="direction:rtl">' +
esc(st.acc ? st.acc.n : "") + "</span>" + sep +
'<span class="crumb last">Entry ' + st.entry.t + "/" + st.entry.n + "</span>";
wireCrumbs();
$id("fsTable").className = "t-entry";
tableDir(true);
$id("tableHead").innerHTML = titleRow(7) + "<tr>" +
'<th class="val">#</th><th>ACCOUNT</th><th>DESCRIPTION</th><th>COST 1</th><th>COST 2</th>' +
'<th class="val">DEBIT</th><th class="val">CREDIT</th></tr>';
var b = "", dr = 0, cr = 0, k,
L = EN.lines || [];
for (k = 0; k < L.length; k++) {
var v = parseFloat(L[k].v) || 0,
d0 = v > 0 ? v : 0,
c0 = v < 0 ? -v : 0;
dr += d0; cr += c0;
b += "<tr>" +
'<td class="val">' + esc(L[k].q) + "</td>" +
'<td class="acct"><span class="acc-code">' + esc(L[k].a) + '</span><span class="fs-lbl">' + esc(L[k].an || "") + "</span></td>" +
'<td class="fs-lbl">' + esc(L[k].ds) + "</td>" +
'<td class="fs-lbl cc" title="' + esc(L[k].c1) + '">' + esc(c1n(L[k].c1)) + "</td>" +
'<td class="fs-lbl cc" title="' + esc(L[k].c2) + '">' + esc(c2n(L[k].c2)) + "</td>" +
'<td class="val dr">' + (d0 ? fmt(d0) : "") + "</td>" +
'<td class="val cr">' + (c0 ? fmt(c0) : "") + "</td></tr>";
}
b += '<tr class="fs-total"><td colspan="5" class="fs-lbl">TOTAL</td>' +
'<td class="val">' + fmt(dr) + '</td><td class="val">' + fmt(cr) + "</td></tr>";
$id("tableBody").innerHTML = b;
}
function buildKpiCards() {
var list = (cfg && cfg.kpis) || [], h = "", k;
for (k = 0; k < list.length; k++) {
h += '<div class="kpi-card ' + esc(list[k].cls || "") + '">' +
'<div class="kpi-label">' + esc(list[k].lab) + "</div>" +
'<div class="kpi-value" id="kpi_' + esc(list[k].id) + '">-</div>' +
'<div class="kpi-sub" id="kpis_' + esc(list[k].id) + '"></div></div>';
}
$id("kpiRow").innerHTML = h;
$id("kpiRow").style.display = list.length ? "" : "none";
}
function renderKpis(cols) {
var list = (cfg && cfg.kpis) || [];
if (!list.length) { return; }
var out = call("kpi", cols, vals) || [], k, yrs = null;
if (st.yF !== st.yT && cols.length > 1 && window.fsKpiY) {
yrs = cols.map(function (c, i) {
var one = {}, id;
for (id in vals) { if (vals.hasOwnProperty(id)) { one[id] = [vals[id][i]]; } }
return call("kpi", [c], one) || [];
});
}
for (k = 0; k < list.length; k++) {
if (yrs) { window.fsKpiY($id("kpi_" + list[k].id), $id("kpis_" + list[k].id), k, yrs, cols, fmtAcc, fmt); }
else { setKpi(list[k].id, out[k] || {}); }
}
}
function setKpi(id, o) {
var el = $id("kpi_" + id), v = o.val || 0;
if (!el) { return; }
el.textContent = fmtAcc(v);
el.className = "kpi-value" + (v < -0.004 ? " neg" : "");
var sub = [];
if (o.note) { sub.push(o.note); }
if (o.base !== null && o.base !== undefined && Math.abs(o.base) > 0.004) {
sub.push("Margin " + fmt((v / o.base) * 100) + "%");
}
if (o.prev !== null && o.prev !== undefined && Math.abs(o.prev) > 0.004) {
var d = ((v - o.prev) / Math.abs(o.prev)) * 100;
sub.push("vs " + o.prevLb + " " + (d >= 0 ? "+" : "") + fmt(d) + "%");
}
$id("kpis_" + id).textContent =
sub.join(" | ") + (sub.length ? " (" + (o.curLb || "") + ")" : "");
}
function renderAsOf() {
var el = $id("asOfLine");
if (!META.asOf) { el.textContent = ""; return; }
var today = new Date(),
dd = ("0" + today.getDate()).slice(-2),
mm = ("0" + (today.getMonth() + 1)).slice(-2),
key = dd + "/" + mm + "/" + today.getFullYear(),
fresh = META.asOf.substring(0, 10) === key;
el.textContent = "Archive refreshed: " + META.asOf;
el.className = "asof-line" + (fresh ? " fresh" : "");
}
function onPeriodChange() {
st.yF = parseInt($id("fYF").value, 10);
st.yT = parseInt($id("fYT").value, 10);
st.mF = parseInt($id("fMF").value, 10);
st.mT = parseInt($id("fMT").value, 10);
if (st.yT < st.yF) { st.yT = st.yF; fillSel("fYT", st.yT); }
if (st.mT < st.mF) { st.mT = st.mF; fillSel("fMT", st.mT); }
buildCmpFilter();
st.sortY = null;
st.entry = null; EN = null;
if (st.acc) { openStmt(st.acc); } else { render(); }
call("onPeriod");
}
function wire() {
var ids = ["fYF", "fYT", "fMF", "fMT"], k;
for (k = 0; k < ids.length; k++) { $id(ids[k]).onchange = onPeriodChange; }
$id("fCmp").onchange = function () {
st.cmp = this.value;
st.sortY = null;
render();
};
$id("resetBtn").onclick = function () {
st.yF = curY; st.yT = curY;
st.mF = curMo; st.mT = curMo;
st.cmp = "T";
st.drill = null;
st.acc = null; st.entry = null; ST = null; EN = null;
buildPeriodFilters();
call("onReset");
render();
};
$id("backBtn").onclick = function () {
if (st.entry) { st.entry = null; EN = null; }
else if (st.acc) { st.acc = null; ST = null; }
else { st.drill = null; }
render();
};
$id("printDashBtn").onclick = function () { runPrint(null, fileStem() + "_Dashboard"); };
}
var CORE = {
$id: $id, esc: esc, fmt: fmt, fmtAcc: fmtAcc, pj: pj,
idxOf: idxOf, hasVal: hasVal, num: num, ym: ym,
MN: MN, LOAD: LOAD, st: st, meta: META,
cost1: COST1, cost2: COST2, clev: CLEV,
c1map: C1MAP, c2map: C2MAP, c1sig: C1SIG, c2sig: C2SIG,
sigPrefix: sigPrefix, c1n: c1n, c2n: c2n,
minY: minY, curY: curY, curMo: curMo,
periodTxt: periodTxt, cols: buildCols, setLines: setLines,
render: render, go: goLevel, openStmt: openStmt,
loading: function () { $id("tableBody").innerHTML = LOAD; }
};
function boot(reg) {
if (cfg) { return; }
cfg = reg;
api = (typeof reg.init === "function") ? (reg.init(CORE) || {}) : {};
var tpl = $id("fs-extra-html");
if (tpl && $id("fsExtraFilters")) {
$id("fsExtraFilters").innerHTML = tpl.textContent || tpl.innerText;
}
var tpc = $id("fs-card-html");
if (tpc && $id("fsFilterCard")) {
$id("fsFilterCard").innerHTML = tpc.textContent || tpc.innerText;
}
setLines(call("lines") || []);
$id("dashTitle").textContent = cfg.title || cfg.head || "Financial Statements";
$id("dashSub").textContent = (cfg.headSub || "").replace(new RegExp("^" + (cfg.title || "") + "\\s*-\\s*"), "").replace(/^[a-z]/, function (c) { return c.toUpperCase(); });
if ($id("dashMark") && cfg.title) { $id("dashMark").textContent = cfg.title.charAt(0); }
$id("fsNote").textContent = cfg.note || "";
buildKpiCards();
buildPeriodFilters();
wire();
renderAsOf();
call("ready");
render();
}
function drain() {
var q = window.FS.q || [];
while (q.length) { boot(q.shift()); }
}
window.FS = window.FS || {};
window.FS.q = window.FS.q || [];
window.FS.core = CORE;
window.FS.register = function (reg) {
window.FS.q.push(reg);
if (window.FS.ready) { drain(); }
};
function start() {
window.FS.ready = true;
drain();
}
if (document.readyState === "loading") {
document.addEventListener("DOMContentLoaded", start, false);
} else { start(); }
}());

});
