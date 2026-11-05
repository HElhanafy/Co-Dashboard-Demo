window.addEventListener("DOMContentLoaded",function(){
(function () {
"use strict";
var cfg = {
id:      "BS",
title:   "Balance Sheet",
head:    "Financial Statements",
headSub: "Balance Sheet - audited layout, cumulative from the general ledger",
sub:     "Audited layout - cumulative ledger balances",
stmtSub: "cumulative to the end of the period, closing entries included. Click a date or entry no for the full entry.",
note:    "Cumulative balances from the general ledger including closing entries. " +
"Customer and supplier lines are split using the sub-ledger while the " +
"ledger governs the totals - see the reconciliation card above. " +
"Cost-centre filters do not apply to the balance sheet.",
ajax:    "BS_AJAX",
rtl:      true,
deepLtr:  true,
closing:  true,
mode:    "cumulative",
negStyle: "flip",
net:     ["TA", "TLE"],
hideZero: ["BU"],
kpis: [
{ id: "ta", lab: "TOTAL ASSETS", cls: "kpi-rev" },
{ id: "br", lab: "RECEIVABLES",  cls: "kpi-gp"  },
{ id: "bp", lab: "PAYABLES",     cls: "kpi-op"  },
{ id: "bi", lab: "INVENTORY",    cls: "kpi-dp"  },
{ id: "te", lab: "EQUITY",       cls: "kpi-net" }
],
init: function (C) {
var $id = C.$id, esc = C.esc, fmt = C.fmt, fmtAcc = C.fmtAcc, num = C.num;
var LN   = [];
var ROWS = [];
var SUB  = {};
var KEYS = [];
var loaded = false, busy = false;
function build(d) {
var i, j, r, parts, kv, keySet = {}, k;
LN = d.lines || [];
for (i = 0; i < d.rows.length; i++) {
parts = (d.rows[i].v || "").split(",");
for (j = 0; j < parts.length; j++) {
kv = parts[j].split(":");
if (kv.length === 2) { keySet[kv[0]] = 1; }
}
}
for (i = 0; i < d.sub.length; i++) { keySet[d.sub[i].m] = 1; }
KEYS = [];
for (k in keySet) { if (keySet.hasOwnProperty(k)) { KEYS.push(k); } }
KEYS.sort();
ROWS = [];
for (i = 0; i < d.rows.length; i++) {
r = d.rows[i];
var mv = {}, cum = {}, run = num(r.o);
parts = (r.v || "").split(",");
for (j = 0; j < parts.length; j++) {
kv = parts[j].split(":");
if (kv.length === 2) { mv[kv[0]] = num(kv[1]); }
}
for (j = 0; j < KEYS.length; j++) {
run += (mv[KEYS[j]] || 0);
cum[KEYS[j]] = run;
}
ROWS.push({ a: r.a, n: r.n, l: r.l, cum: cum });
}
SUB = {};
for (i = 0; i < d.sub.length; i++) {
var s = d.sub[i];
if (!SUB[s.m]) { SUB[s.m] = {}; }
SUB[s.m][s.t] = { d: num(s.d), c: num(s.c), g: num(s.g), r: num(s.r) };
}
var lastC = null, lastV = null;
for (j = 0; j < KEYS.length; j++) {
k = KEYS[j];
if (!SUB[k]) { SUB[k] = {}; }
if (SUB[k].C) { lastC = SUB[k].C; } else if (lastC) { SUB[k].C = lastC; }
if (SUB[k].V) { lastV = SUB[k].V; } else if (lastV) { SUB[k].V = lastV; }
}
loaded = true;
}
function snap(k) {
var best = null, i;
for (i = 0; i < KEYS.length; i++) {
if (KEYS[i] === k) { return k; }
if (KEYS[i] <= k) { best = KEYS[i]; }
}
return best || KEYS[0] || k;
}
function keyAt(cols, y) { return snap(cols[y].k); }
function compute(cols) {
var res = {}, i, y, ln, k;
for (i = 0; i < LN.length; i++) {
res[LN[i].id] = [];
for (y = 0; y < cols.length; y++) { res[LN[i].id][y] = 0; }
}
if (!loaded) { return res; }
for (i = 0; i < ROWS.length; i++) {
var r = ROWS[i];
if (!res[r.l]) { continue; }
for (y = 0; y < cols.length; y++) {
res[r.l][y] += (r.cum[keyAt(cols, y)] || 0);
}
}
for (y = 0; y < cols.length; y++) {
var sp = SUB[keyAt(cols, y)] || {},
cc = sp.C ? sp.C.c : 0,
vd = sp.V ? sp.V.d : 0;
res.BR[y]  += cc;
res.CAD[y] += -cc;
res.PPS[y] += vd;
res.BP[y]  += -vd;
}
for (i = 0; i < LN.length; i++) {
ln = LN[i];
if (ln.t !== "d") { continue; }
var comps = ln.f.split(",");
for (y = 0; y < cols.length; y++) {
var s = 0;
for (k = 0; k < comps.length; k++) {
s += (res[comps[k]] && res[comps[k]][y]) || 0;
}
res[ln.id][y] = s;
}
}
return res;
}
function checkAt(vals, y) {
return (vals.TA ? (vals.TA[y] || 0) : 0) +
(vals.TLE ? (vals.TLE[y] || 0) : 0) +
(vals.BU ? (vals.BU[y] || 0) : 0);
}
function reconCard(cols) {
var host = $id("bsRecon");
if (!host) {
host = document.createElement("div");
host.id = "bsRecon";
host.className = "bs-recon";
var slot = $id("fsExtraPanel") || $id("printTablePanel").parentNode;
slot.appendChild(host);
}
if (!loaded) { host.style.display = "none"; return; }
host.style.display = "";
var k = keyAt(cols, cols.length - 1),
sp = SUB[k] || {},
c = sp.C || { d: 0, c: 0, r: 0 },
v = sp.V || { d: 0, c: 0, r: 0 },
per = k.substring(4) + "/" + k.substring(0, 4);
function cell(t, o, dr, cr, df) {
var cls = Math.abs(df) < 100 ? "ok" : (Math.abs(df) < 100000 ? "warn" : "bad");
return '<div class="bsr-item"><div class="bsr-t">' + t + "</div>" +
'<div class="bsr-v">' + fmt(dr) + " / " + fmt(cr) + "</div>" +
'<div class="bsr-d ' + cls + '">gap ' + fmtAcc(df) + "</div>" +
'<div class="bsr-s">' + o + "</div></div>";
}
host.innerHTML =
'<div class="bsr-head">SUB-LEDGER RECONCILIATION &middot; ' + per + "</div>" +
'<div class="bsr-body">' +
cell("CUSTOMERS", "debit / credit split", c.d, c.c, c.r) +
cell("SUPPLIERS", "debit / credit split", v.d, v.c, v.r) +
'<div class="bsr-note">Split comes from the customer and supplier modules; ' +
"the general ledger governs the totals. A growing gap means module " +
"transactions that never reached the ledger.</div>" +
"</div>";
}
function load() {
if (busy || loaded) { return; }
busy = true;
C.loading();
apex.server.process(cfg.ajax, { x01: "bs" }, { dataType: "json" })
.done(function (d) {
busy = false;
if (!d || !d.rows) {
$id("tableBody").innerHTML =
'<tr><td colspan="9" class="empty">No data returned.</td></tr>';
return;
}
build(d);
C.setLines(LN);
C.render();
})
.fail(function () {
busy = false;
$id("tableBody").innerHTML =
'<tr><td colspan="9" class="empty">Failed to load the balance sheet.</td></tr>';
});
}
return {
ready: function () { load(); },
lines: function () { return LN; },
compute: compute,
hasRows: function (id) {
for (var i = 0; i < ROWS.length; i++) {
if (ROWS[i].l === id) { return true; }
}
return false;
},
drill: function (id, cols) {
var ln = C.LMAP[id],
neg = ln && ln.neg === 1,
out = [], i, y;
for (i = 0; i < ROWS.length; i++) {
if (ROWS[i].l !== id) { continue; }
var v = [];
for (y = 0; y < cols.length; y++) {
var raw = ROWS[i].cum[keyAt(cols, y)] || 0;
v.push(neg ? -raw : raw);
}
out.push({ a: ROWS[i].a, n: ROWS[i].n, v: v });
}
return out;
},
footer: function (cols, vals) {
if (!loaded) { return ""; }
var b = '<tr class="fs-total bs-check">' +
'<td class="fs-lbl">BALANCE CHECK</td>', y;
for (y = 0; y < cols.length; y++) {
var d = checkAt(vals, y);
b += '<td class="val' + (Math.abs(d) > 1 ? " neg" : "") + '">' +
fmtAcc(d) + "</td>";
}
return b + "</tr>";
},
kpi: function (cols, vals) {
var y = cols.length - 1, lb = cols[y].lb;
function c(v, note) {
return { val: v, base: null, prev: null, note: note, curLb: lb };
}
return [
c(vals.TA  ? (vals.TA[y]  || 0) : 0, "cumulative balance"),
c(vals.BR  ? (vals.BR[y]  || 0) : 0, "net of provision"),
c(vals.BP  ? -(vals.BP[y] || 0) : 0, "trade creditors"),
c(vals.BI  ? (vals.BI[y]  || 0) : 0, "closing stock"),
c(vals.TE  ? -(vals.TE[y] || 0) : 0,
"balance check " + fmtAcc(checkAt(vals, y)))
];
},
extra: function (cols) { reconCard(cols); },
badge: function (cols) { return "as of " + cols[cols.length - 1].lb; },
scope:  function () { return ""; },
params: function () { return {}; }
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
