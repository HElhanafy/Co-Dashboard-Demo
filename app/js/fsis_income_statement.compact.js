window.addEventListener("DOMContentLoaded",function(){
(function () {
"use strict";
var cfg = {
id:      "IS",
title:   "Income Statement",
head:    "Financial Statements",
headSub: "Income Statement - audited layout, live from the general ledger",
sub:     "Audited layout - ledger amounts, closing entries excluded",
stmtSub: "cost scope applied, closing entries excluded. Click a date or entry no for the full entry.",
note:    "Amounts are period movement from the general ledger, closing entries excluded. " +
"Layout follows the audited financial statements; Zakat is shown as a separate line " +
"so the net profit ties to the trial balance. Click any account line to drill into its accounts.",
ajax:    "IS_AJAX",
rtl:      true,
deepLtr:  true,
closing:  false,
mode:    "movement",
net:     "NP",
kpis: [
{ id: "rev", lab: "REVENUES",               cls: "kpi-rev" },
{ id: "gp",  lab: "GROSS PROFIT",           cls: "kpi-gp"  },
{ id: "op",  lab: "OPERATING PROFIT",       cls: "kpi-op"  },
{ id: "dp",  lab: "DISPOSAL GAINS",         cls: "kpi-dp"  },
{ id: "pb",  lab: "PROFIT BEFORE ZAKAT",    cls: "kpi-pb"  },
{ id: "np",  lab: "NET PROFIT AFTER ZAKAT", cls: "kpi-net" }
],
init: function (C) {
var $id = C.$id, esc = C.esc, fmt = C.fmt, hasVal = C.hasVal,
idxOf = C.idxOf, ym = C.ym, MN = C.MN, st = C.st;
var LINES  = C.pj("fs-lines")  || [];
var BASE   = C.pj("fs-data")   || [];
var C2USED = C.pj("fs-c2used") || [];
var COST1  = C.cost1, COST2 = C.cost2, CLEV = C.clev;
var C1MAP  = C.c1map, C2MAP = C.c2map, C1SIG = C.c1sig, C2SIG = C.c2sig;
var sigPrefix = C.sigPrefix;
var f = { c1A: "", c1B: "", c2A: "", c2B: [] };
function parseRows(rs) {
var out = [];
for (var i = 0; i < rs.length; i++) {
var r = rs[i], m = {}, parts = (r.v || "").split(",");
for (var j = 0; j < parts.length; j++) {
var kv = parts[j].split(":");
if (kv.length === 2) { m[kv[0]] = parseFloat(kv[1]); }
}
out.push({ a: r.a, n: r.n, l: r.l, m: m });
}
return out;
}
var baseRows = parseRows(BASE);
var rows = baseRows;
function isLeaf1(cc) {
var p = sigPrefix(cc.c, cc.lv, CLEV.c1);
for (var k = 0; k < COST1.length; k++) {
var o = COST1[k];
if (o.c !== cc.c && o.lv > cc.lv &&
sigPrefix(o.c, cc.lv, CLEV.c1) === p) { return false; }
}
return true;
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
function buildFilters() {
var o1 = [{ v: "", t: "All Cost Centers" }, { v: "0", t: "---- (no cost center)" }],
k, c;
for (k = 0; k < COST1.length; k++) {
c = COST1[k];
if (c.lv === 3 || (c.lv === 2 && isLeaf1(c))) {
o1.push({ v: sigPrefix(c.c, c.lv, CLEV.c1), t: c.n });
}
}
fillSelect($id("fC1A"), o1, f.c1A);
buildC1B();
buildC2A();
buildC2BMenu(null);
}
function buildC2A() {
var set = {}, k,
L2 = CLEV.c2[1] || 3;
for (k = 0; k < c2bUsed.length; k++) {
set[String(c2bUsed[k]).substring(0, L2)] = 1;
}
var o2 = [{ v: "", t: "All Groups" }], found = false;
for (k = 0; k < COST2.length; k++) {
var g = COST2[k];
if (g.lv !== 2) { continue; }
var p = sigPrefix(g.c, 2, CLEV.c2);
if (!set[p]) { continue; }
o2.push({ v: p, t: g.n });
if (p === f.c2A) { found = true; }
}
if (!found) { f.c2A = ""; }
fillSelect($id("fC2A"), o2, f.c2A);
}
function buildC1B() {
var o = [{ v: "", t: "All Details" }];
if (f.c1A !== "0") {
for (var k = 0; k < COST1.length; k++) {
var cc = COST1[k];
if (cc.lv <= 1 || !isLeaf1(cc)) { continue; }
var p = sigPrefix(cc.c, cc.lv, CLEV.c1);
if (f.c1A &&
(p === f.c1A ||
p.substring(0, f.c1A.length) !== f.c1A)) { continue; }
o.push({ v: p, t: cc.n });
}
}
fillSelect($id("fC1B"), o, f.c1B);
$id("fC1B").disabled = f.c1A === "0";
}
var c2bOpts = [], c2bUsed = C2USED;
function buildC2BMenu(usedCodes) {
if (usedCodes) { c2bUsed = usedCodes; }
c2bOpts = [];
for (var k = 0; k < c2bUsed.length; k++) {
var cd = String(c2bUsed[k]);
if (f.c2A && cd.substring(0, f.c2A.length) !== f.c2A) { continue; }
var nm = C2MAP[cd] ? C2MAP[cd].n : cd;
c2bOpts.push({ c: cd, n: nm });
}
renderC2BMenu("");
updC2BBtn();
}
function renderC2BMenu(q) {
var h = '<div class="ss-search"><input type="text" id="fC2BSearch" placeholder="Search..." value="' + esc(q) + '"></div>';
var ql = q.toLowerCase();
for (var k = 0; k < c2bOpts.length; k++) {
var o = c2bOpts[k];
if (ql && String(o.n).toLowerCase().indexOf(ql) < 0 &&
o.c.indexOf(ql) < 0) { continue; }
h += '<label class="ss-item"><input type="checkbox" data-c="' + esc(o.c) + '"' +
(hasVal(f.c2B, o.c) ? " checked" : "") + ">" +
'<span class="ss-nm">' + esc(o.n) + "</span>" +
'<span class="ss-cd">' + esc(o.c) + "</span></label>";
}
h += '<div class="ss-actions">' +
'<button type="button" class="btn-reset" id="fC2BApply">Apply</button>' +
'<button type="button" class="btn-reset" id="fC2BClear">Clear</button></div>';
$id("fC2BMenu").innerHTML = h;
var si = $id("fC2BSearch");
si.oninput = function () {
var v = si.value;
collectC2BChecks();
renderC2BMenu(v);
var s2 = $id("fC2BSearch");
s2.focus();
s2.setSelectionRange(s2.value.length, s2.value.length);
};
$id("fC2BApply").onclick = function () {
collectC2BChecks();
closeC2B();
applyCostFilters();
};
$id("fC2BClear").onclick = function () {
f.c2B = [];
closeC2B();
applyCostFilters();
};
}
function collectC2BChecks() {
var boxes = $id("fC2BMenu").querySelectorAll("input[type=checkbox]");
for (var k = 0; k < boxes.length; k++) {
var cd = boxes[k].getAttribute("data-c"),
p = idxOf(f.c2B, cd);
if (boxes[k].checked && p < 0) { f.c2B.push(cd); }
if (!boxes[k].checked && p >= 0) { f.c2B.splice(p, 1); }
}
}
function updC2BBtn() {
$id("fC2BBtn").textContent =
f.c2B.length ? f.c2B.length + " selected" : "All Details";
}
function closeC2B() {
$id("fC2BMenu").className = "ss-menu";
updC2BBtn();
}
function applyCostFilters() {
updC2BBtn();
var c1 = f.c1B || f.c1A,
c2 = f.c2B.length ? f.c2B.join(":") : f.c2A;
if (!c1 && !c2) {
rows = baseRows;
st.entry = null;
if (st.acc) { C.openStmt(st.acc); } else { C.render(); }
fetchUsed();
return;
}
C.loading();
apex.server.process(cfg.ajax,
{ x01: "data", x02: c1, x03: c2,
x04: st.yF, x05: st.yT, x06: st.mF, x07: st.mT },
{ dataType: "json" }
).done(function (d) {
if (d.err) { alert(d.err); rows = baseRows; }
else {
rows = parseRows(d.rows || []);
if (d.c2) {
c2bUsed = d.c2;
buildC2A();
if (!f.c2B.length) { buildC2BMenu(null); }
}
}
st.entry = null;
if (st.acc) { C.openStmt(st.acc); } else { C.render(); }
}).fail(function () {
alert("Request failed");
rows = baseRows;
C.render();
});
}
function fetchUsed() {
apex.server.process(cfg.ajax,
{ x01: "used", x02: f.c1B || f.c1A,
x04: st.yF, x05: st.yT, x06: st.mF, x07: st.mT },
{ dataType: "json" }
).done(function (d) {
if (d && d.c2) {
c2bUsed = d.c2;
buildC2A();
if (!f.c2B.length) { buildC2BMenu(null); }
}
});
}
function rowNet(r, keys) {
var s = 0;
for (var k = 0; k < keys.length; k++) {
var v = r.m[keys[k]];
if (v) { s += v; }
}
return s;
}
function computeLines(cols) {
var res = {}, k, y, ln;
for (k = 0; k < LINES.length; k++) { res[LINES[k].id] = []; }
var keysets = [];
for (y = 0; y < cols.length; y++) { keysets.push(cols[y].ks); }
for (k = 0; k < rows.length; k++) {
var r = rows[k], arr = res[r.l];
if (!arr) { continue; }
for (y = 0; y < cols.length; y++) {
arr[y] = (arr[y] || 0) + rowNet(r, keysets[y]);
}
}
for (k = 0; k < LINES.length; k++) {
ln = LINES[k];
if (ln.t !== "d") {
for (y = 0; y < cols.length; y++) { res[ln.id][y] = res[ln.id][y] || 0; }
continue;
}
var comps = ln.f.split(",");
for (y = 0; y < cols.length; y++) {
var s = 0;
for (var q = 0; q < comps.length; q++) {
s += (res[comps[q]] && res[comps[q]][y]) || 0;
}
res[ln.id][y] = s;
}
}
return res;
}
function wire() {
$id("fC1A").onchange = function () {
f.c1A = this.value;
f.c1B = ""; f.c2A = ""; f.c2B = [];
buildC1B();
applyCostFilters();
};
$id("fC1B").onchange = function () {
f.c1B = this.value;
f.c2A = ""; f.c2B = [];
applyCostFilters();
};
$id("fC2A").onchange = function () {
f.c2A = this.value;
f.c2B = [];
buildC2BMenu(null);
applyCostFilters();
};
$id("fC2BBtn").onclick = function () {
var mn = $id("fC2BMenu");
mn.className = mn.className.indexOf("open") >= 0 ? "ss-menu" : "ss-menu open";
};
document.addEventListener("click", function (e) {
var box = $id("fC2BBox");
if (box && !box.contains(e.target)) { closeC2B(); }
});
}
return {
ready: function () { buildFilters(); wire(); },
lines: function () { return LINES; },
compute: function (cols) { return computeLines(cols); },
hasRows: function (id) {
for (var k = 0; k < rows.length; k++) {
if (rows[k].l === id) { return true; }
}
return false;
},
drill: function (id, cols) {
var ln = C.LMAP[id], accs = [], k, y, keysets = [];
for (y = 0; y < cols.length; y++) { keysets.push(cols[y].ks); }
for (k = 0; k < rows.length; k++) {
if (rows[k].l !== id) { continue; }
var v = [], any = false;
for (y = 0; y < cols.length; y++) {
var n = rowNet(rows[k], keysets[y]);
v.push(ln.neg ? -n : n);
if (Math.abs(n) > 0.004) { any = true; }
}
if (any) { accs.push({ a: rows[k].a, n: rows[k].n, v: v }); }
}
return accs;
},
kpi: function (cols, vals) {
var cur = {}, prev = null, curLb, prevLb = "", k, y, id;
if (st.yF === st.yT) {
for (k = 0; k < LINES.length; k++) {
id = LINES[k].id;
var s = 0;
for (y = 0; y < cols.length; y++) { s += vals[id][y] || 0; }
cur[id] = s;
}
curLb = C.periodTxt();
if (st.yF - 1 >= C.minY) {
var ks = [];
for (var m = st.mF; m <= st.mT; m++) { ks.push(ym(st.yF - 1, m)); }
var pv = computeLines([{ lb: "", ks: ks }]);
prev = {};
for (k = 0; k < LINES.length; k++) {
prev[LINES[k].id] = pv[LINES[k].id][0] || 0;
}
prevLb = (st.mF === st.mT ? MN[st.mF - 1]
: MN[st.mF - 1] + "-" + MN[st.mT - 1]) + " " + (st.yF - 1);
}
} else {
var last = cols.length - 1, pr = last - 1;
if (pr >= 0) { prev = {}; }
for (k = 0; k < LINES.length; k++) {
id = LINES[k].id;
cur[id] = vals[id][last] || 0;
if (prev) { prev[id] = vals[id][pr] || 0; }
}
curLb = cols[last].lb;
prevLb = prev ? cols[pr].lb : "";
}
var rv = cur.RV || 0;
function card(id, base, note) {
return { val: cur[id] || 0, base: base, note: note || null,
prev: prev ? prev[id] : null,
prevLb: prevLb, curLb: curLb };
}
var zk = Math.abs(cur.ZK || 0);
return [card("RV", null), card("GP", rv), card("OP", rv),
card("DP", null), card("PB", rv),
card("NP", rv, "Zakat " + fmt(zk))];
},
params: function () {
return { c1: f.c1B || f.c1A,
c2: f.c2B.length ? f.c2B.join(":") : f.c2A };
},
scope: function () {
var parts = [], c1 = f.c1B || f.c1A;
if (c1 === "0") { parts.push("CC1: no cost center"); }
else if (c1) { parts.push("CC1: " + (C1SIG[c1] || c1)); }
if (f.c2B.length) { parts.push("CC2: " + f.c2B.length + " selected"); }
else if (f.c2A) { parts.push("CC2: " + (C2SIG[f.c2A] || f.c2A)); }
return parts.join(" | ");
},
onPeriod: function () { fetchUsed(); },
onReset: function () {
f.c1A = ""; f.c1B = ""; f.c2A = ""; f.c2B = [];
c2bUsed = C2USED;
rows = baseRows;
buildFilters();
}
};
}
};
if (window.FS && window.FS.register) { window.FS.register(cfg); }
else {
window.FS = window.FS || {};
window.FS.q = window.FS.q || [];
window.FS.q.push(cfg);
}
}());

});
