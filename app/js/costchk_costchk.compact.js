window.addEventListener("DOMContentLoaded",function(){
function initCostCheck() {
var el = document.getElementById('cc-meta');
if (!el || !document.getElementById('tableBody')) {
initCostCheck._t = (initCostCheck._t || 0) + 1;
if (initCostCheck._t < 100) { setTimeout(initCostCheck, 100); return; }
console.error('Cost check: data region not found.');
return;
}
startCostCheck(JSON.parse(el.textContent));
}
function startCostCheck(META) {
function esc(s) {
return String(s === null || s === undefined ? '' : s).replace(/[&<>"]/g, function (m) {
return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m];
});
}
function dmy(s) { return s ? s.slice(8, 10) + '/' + s.slice(5, 7) + '/' + s.slice(0, 4) : '-'; }
var DASH = String.fromCharCode(8212), SEP = ' ' + String.fromCharCode(8250) + ' ', WARN = String.fromCharCode(9888);
function fq(v) { var r = Math.round(v * 1000) / 1000; if (Math.abs(r) < 0.0005) r = 0; return r.toLocaleString('en-US', { maximumFractionDigits: 3 }); }
function fm(v) { v = Math.round(v * 100) / 100; if (Math.abs(v) < 0.005) v = 0; return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fc(v) { return (Math.round(v * 10000) / 10000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 }); }
function sgn(v) { return v < -0.005 ? 'neg' : v > 0.005 ? 'pos' : 'z'; }
function tdq(v, cls) { return v ? '<td class="num ' + cls + '">' + fq(v) + '</td>' : '<td class="num z">' + DASH + '</td>'; }
function tdm(v, cls) { return v ? '<td class="num ' + cls + '">' + fm(v) + '</td>' : '<td class="num z">' + DASH + '</td>'; }
function kindOf(tt, ef, code) {
var p = String(code).slice(0, 3);
if (tt === 1) return 'Purchase'; if (tt === 2) return 'Sale'; if (tt === 3) return 'Purchase return';
if (tt === 4) return 'Sales return'; if (tt === 8) return 'Opening';
if (tt === 9) return ef === 5 ? 'Transfer out' : 'Transfer in';
if (tt === 7) return { '131': 'Samples in', '132': 'Count in', '133': 'Count out', '134': 'Samples out', '135': 'Damaged out' }[p] || (ef === 1 || ef === 4 || ef === 6 ? 'Adjustment in' : 'Adjustment out');
return 'Other';
}
function catOf(tt, ef) { return tt === 1 ? 'pu' : tt === 2 ? 'sa' : (tt === 3 || tt === 4) ? 're' : tt === 9 ? (ef === 5 ? 'to' : 'ti') : 'ot'; }
function kindTag(tt, ef, code) { return '<span class="kind k' + catOf(tt, ef) + '">' + esc(kindOf(tt, ef, code)) + '</span>'; }
var RULES = { AVG: 'Off lot average', XFER: 'Transfer in <> out' };
function ruleBadge(rc) { return '<span class="rule r' + rc + '">' + (RULES[rc] || rc) + '</span>'; }
function kv(k, v) { return '<span class="ic-kv"><span class="ic-k">' + k + '</span><span class="ic-v">' + v + '</span></span>'; }
var from = META.defFrom, to = META.today, min = 0, store = null, rule = '', q = '', busy = false,
DATA = null, LINES = null, CUR = null, CARD = null, CST = null, CSN = '', VCH = null;
function g(id) { return document.getElementById(id); }
var fItem = g('fItem'), fItemClr = g('fItemClr'), itemMenu = g('itemMenu'), fFrom = g('fFrom'), fTo = g('fTo'), runBtn = g('runBtn'),
ruleLine = g('ruleLine'), ruleChips = g('ruleChips'), storeLine = g('storeLine'), storeChips = g('storeChips'),
cardHead = g('cardHead'), cardL1 = g('cardL1'), cardL2 = g('cardL2'),
titleEl = g('tableTitleText'), pfEl = g('printFilters'), tHead = g('tableHead'), tBody = g('tableBody'), tFoot = g('tableFoot'),
note = g('tableNote'), badge = g('periodBadge'), asOf = g('asOfLine'), excelBtn = null, printBtn = null,
lotsPanel = g('printTablePanel'),
docPanel = g('docPanel'), docHead = g('docHead'), docTHead = g('docTHead'), docBody = g('docBody'), docFoot = g('docFoot'), docNote = g('docNote'), docCrumb = g('docCrumb'),
mvPanel = g('mvPanel'), mvHead = g('mvHead'), mvTHead = g('mvTHead'), mvBody = g('mvBody'), mvFoot = g('mvFoot'), mvNote = g('mvNote'), mvCrumb = g('mvCrumb'),
vcPanel = g('vcPanel'), vcHead = g('vcHead'), vcTHead = g('vcTHead'), vcBody = g('vcBody'), vcFoot = g('vcFoot'), vcNote = g('vcNote'), vcCrumb = g('vcCrumb');
fFrom.min = META.minD; fFrom.max = META.today; fFrom.value = from;
fTo.min = META.minD; fTo.max = META.today; fTo.value = to;
function call(proc, p, ok, where) {
if (busy) return;
var n = where || note, prev = n.textContent;
busy = true; n.textContent = 'Loading...'; n.classList.add('busy');
apex.server.process(proc, p, {
success: function (d) {
busy = false; n.classList.remove('busy'); n.textContent = prev;
if (!d || d.error) { n.textContent = d && d.error === 'cost' ? 'Cost viewers only.' : 'Could not load' + (d && d.error ? ': ' + d.error : '') + '.'; return; }
ok(d);
},
error: function (xhr) {
busy = false; n.classList.remove('busy');
var t = xhr && xhr.responseText ? String(xhr.responseText).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160) : '';
n.textContent = 'Could not load ' + proc + ' (' + (xhr ? xhr.status : '?') + ')' + (t ? ': ' + t : '');
if (window.console) console.error(proc, xhr && xhr.status, xhr && xhr.responseText);
}
});
}
function filters() { return { x02: from, x03: to, x05: store === null ? '' : String(store), x06: rule, x07: String(min) }; }
function load() {
var p = filters(); p.x01 = 'list';
closeLines();
call('COSTCHK_AJAX', p, function (d) { DATA = d; from = d.from; to = d.to; paintChips(); render(); });
}
runBtn.addEventListener('click', function () {
from = fFrom.value || META.defFrom; to = fTo.value || META.today;
if (from > to) { from = to; fFrom.value = from; }
load();
});
g('resetBtn').addEventListener('click', function () {
fFrom.value = META.defFrom; fTo.value = META.today; from = META.defFrom; to = META.today;
store = null; rule = ''; clearItem();
load();
});
var shown = '';
function clearItem() { q = ''; shown = ''; fItem.value = ''; fItemClr.style.display = 'none'; itemMenu.style.display = 'none'; }
fItem.addEventListener('input', function () {
q = fItem.value.trim().toLowerCase(); shown = ''; fItemClr.style.display = q ? '' : 'none';
itemSearch(); if (DATA) render();
});
fItem.addEventListener('focus', itemSearch);
function itemSearch() {
var h = '', n = 0, seen = {}, i, l;
if (!DATA || q.length < 2 || shown) { itemMenu.style.display = 'none'; return; }
for (i = 0; i < DATA.lots.length && n < 20; i++) {
l = DATA.lots[i];
if (seen[l[0]]) continue;
if (String(l[0]).toLowerCase().indexOf(q) !== -1 || String(l[1]).toLowerCase().indexOf(q) !== -1) {
seen[l[0]] = 1; n++;
h += '<div class="ss-option" data-c="' + esc(l[0]) + '" data-n="' + esc(l[1]) + '"><span class="ss-code">' + esc(l[0]) + '</span> ' + esc(l[1]) + '</div>';
}
}
itemMenu.innerHTML = h || '<div class="ss-empty">No item matches in the loaded list</div>';
var rc = fItem.getBoundingClientRect();
itemMenu.style.position = 'fixed'; itemMenu.style.top = (rc.bottom + 4) + 'px'; itemMenu.style.left = rc.left + 'px';
itemMenu.style.width = rc.width + 'px'; itemMenu.style.minWidth = '0'; itemMenu.style.maxWidth = 'none';
itemMenu.style.maxHeight = Math.max(160, window.innerHeight - rc.bottom - 24) + 'px';
itemMenu.style.display = 'block';
Array.prototype.forEach.call(itemMenu.querySelectorAll('.ss-option'), function (o) {
o.addEventListener('click', function () { pickItem(o.getAttribute('data-c'), o.getAttribute('data-n')); });
});
}
function pickItem(c, nm) {
shown = c + SEP + nm; fItem.value = shown; q = String(c).toLowerCase();
itemMenu.style.display = 'none'; fItemClr.style.display = '';
if (DATA) render();
}
fItem.addEventListener('keydown', function (e) {
var open = itemMenu.style.display === 'block', opts = open ? itemMenu.querySelectorAll('.ss-option') : [], cur = -1, i, k = e.key;
for (i = 0; i < opts.length; i++) { if (opts[i].className.indexOf('active') !== -1) cur = i; }
if ((k === 'ArrowDown' || k === 'ArrowUp') && opts.length) {
e.preventDefault();
cur = k === 'ArrowDown' ? (cur + 1) % opts.length : (cur <= 0 ? opts.length - 1 : cur - 1);
for (i = 0; i < opts.length; i++) { opts[i].className = 'ss-option' + (i === cur ? ' active' : ''); }
if (opts[cur].scrollIntoView) opts[cur].scrollIntoView({ block: 'nearest' });
} else if (k === 'Enter') {
e.preventDefault();
if (open && opts.length) { var o = opts[cur === -1 ? 0 : cur]; pickItem(o.getAttribute('data-c'), o.getAttribute('data-n')); }
} else if (k === 'Escape' && open) { itemMenu.style.display = 'none'; }
});
fItemClr.addEventListener('click', function () { clearItem(); if (DATA) render(); fItem.focus(); });
document.addEventListener('click', function (e) { if (!itemMenu.contains(e.target) && e.target !== fItem) itemMenu.style.display = 'none'; });
window.addEventListener('resize', function () { if (itemMenu.style.display === 'block') itemSearch(); });
window.addEventListener('scroll', function () { if (itemMenu.style.display === 'block') itemSearch(); }, true);
function paintChips() {
var h, tot = 0, k;
for (k in DATA.rules) { tot += DATA.rules[k]; }
h = '<button type="button" class="chip two' + (rule ? '' : ' on') + '" data-r=""><span class="chip-t">All</span><span class="chip-sub">' + tot + ' lines</span></button>';
['AVG', 'XFER'].forEach(function (rc) {
var n = DATA.rules[rc] || 0;
h += '<button type="button" class="chip two r' + rc + (rule === rc ? ' on' : '') + (n ? '' : ' zero') + '" data-r="' + rc + '"><span class="chip-t">' + RULES[rc] + '</span><span class="chip-sub">' + n + ' lines</span></button>';
});
ruleChips.innerHTML = h; ruleLine.style.display = '';
Array.prototype.forEach.call(ruleChips.querySelectorAll('.chip'), function (b) {
b.addEventListener('click', function () { var r = b.getAttribute('data-r'); if (r === rule) return; rule = r; load(); });
});
tot = 0; DATA.stores.forEach(function (s) { tot += +s[2]; });
h = '<select id="storeSel" title="Store"><option value="">All (' + tot + ')</option>' + DATA.stores.slice().sort(function (a, b) { return b[2] - a[2]; }).map(function (s) {
return '<option value="' + s[0] + '"' + (store === s[0] ? ' selected' : '') + '>' + esc(s[1]) + ' (' + s[2] + ')</option>';
}).join('') + '</select>';
storeChips.innerHTML = h; storeLine.style.display = '';
g('storeSel').addEventListener('change', function () { var v = this.value ? +this.value : null; if (v === store) return; store = v; load(); });
}
function visLots() {
return q ? DATA.lots.filter(function (l) { return String(l[0]).toLowerCase().indexOf(q) !== -1 || String(l[1]).toLowerCase().indexOf(q) !== -1; }) : DATA.lots;
}
function storeName() { var i; for (i = 0; i < DATA.stores.length; i++) { if (DATA.stores[i][0] === store) return DATA.stores[i][1]; } return 'All warehouses'; }
function render() {
var V = visLots(), lines = 0, imp = 0, items = {}, ni = 0, h = '', k;
V.forEach(function (l) { lines += +l[5]; imp += +l[10]; items[l[0]] = 1; });
for (k in items) { ni++; }
badge.textContent = dmy(from) + ' ' + String.fromCharCode(8211) + ' ' + dmy(to);
if (!asOf.textContent) { asOf.textContent = 'Data as of ' + (DATA.asof || META.asof || '-') + (DATA.win ? ' ' + SEP + ' ' + DATA.win : ''); asOf.classList.add('fresh'); }
cardL1.innerHTML = '<span class="ic-name">Lines costed off the cost they should carry</span><span class="ic-wh"><bdi>' + esc(storeName()) + '</bdi></span>';
cardL2.innerHTML = kv('Lots', V.length) + kv('Items', ni) + kv('Lines', lines) +
kv('Impact', '<span class="' + sgn(imp) + '">' + fm(imp) + '</span> <i>qty x diff, base unit</i>') + kv('Rule', rule ? RULES[rule] : 'Both');
cardHead.style.display = '';
var cols = ['#', 'ITEM', 'DESCRIPTION', 'LOT', 'EXP', 'UNIT', 'LINES', 'OFF AVG', 'XFER', 'STORES', 'FIRST', 'LAST', 'MAX DIFF', 'IMPACT'];
h = '<tr>'; cols.forEach(function (c, i) { h += '<th class="' + (i < 6 ? 'txt' : 'num') + '">' + c + '</th>'; }); tHead.innerHTML = h + '</tr>';
h = '';
V.forEach(function (l, n) {
h += '<tr class="lnk" data-i="' + n + '" title="Click to see the flagged lines">' +
'<td class="seq">' + (n + 1) + '</td><td class="doc">' + esc(l[0]) + '</td><td class="det"><bdi>' + esc(l[1]) + '</bdi></td>' +
'<td class="doc lot">' + esc(l[3]) + '</td><td class="doc">' + esc(l[4] || DASH) + '</td><td class="doc">' + esc(l[13]) + '</td>' +
'<td class="num"><b>' + l[5] + '</b></td><td class="num">' + (l[11] || DASH) + '</td><td class="num">' + (l[12] || DASH) + '</td>' +
'<td class="num">' + l[6] + '</td><td class="num">' + esc(l[7]) + '</td><td class="num">' + esc(l[8]) + '</td>' +
'<td class="num">' + fc(+l[9]) + '</td><td class="num ' + sgn(+l[10]) + '"><b>' + fm(+l[10]) + '</b></td></tr>';
});
tBody.innerHTML = h;
tFoot.innerHTML = '<tr class="tot"><td colspan="6">TOTAL ' + V.length + ' lots' + (q ? ' (filtered by item)' : '') + '</td>' +
'<td class="num">' + lines + '</td><td></td><td></td><td></td><td></td><td></td><td></td><td class="num ' + sgn(imp) + '">' + fm(imp) + '</td></tr>';
note.textContent = V.length ? V.length + ' lots' + SEP + lines + ' lines' : 'Nothing flagged for these filters';
titleEl.textContent = 'Lots with mis-costed lines' + SEP + storeName();
pfEl.innerHTML = [dmy(from) + ' - ' + dmy(to), esc(storeName()), rule ? RULES[rule] : 'Both rules', q ? 'Item "' + esc(q) + '"' : ''].filter(function (x) { return x; }).join('<span class="pf-sep">|</span>');
if (excelBtn) { excelBtn.disabled = false; printBtn.disabled = false; }
}
tBody.addEventListener('click', function (e) {
var tr = e.target.closest ? e.target.closest('tr.lnk') : null;
if (tr) openLines(visLots()[+tr.getAttribute('data-i')]);
});
function show(p) {
lotsPanel.style.display = p === lotsPanel ? '' : 'none'; docPanel.style.display = p === docPanel ? '' : 'none';
mvPanel.style.display = p === mvPanel ? '' : 'none'; vcPanel.style.display = p === vcPanel ? '' : 'none';
document.body.classList[p === lotsPanel ? 'remove' : 'add']('ic-doc');
if (p !== lotsPanel) p.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function openLines(l) {
var p = filters(); p.x01 = 'lines'; p.x08 = String(l[2]);
call('COSTCHK_AJAX', p, function (d) { CUR = l; LINES = d.lines || []; renderLines(); });
}
function closeLines() { LINES = null; CUR = null; CARD = null; VCH = null; show(lotsPanel); }
function closeCard() { CARD = null; VCH = null; show(docPanel); }
function closeVch() { VCH = null; show(CARD ? mvPanel : docPanel); }
g('docBack').addEventListener('click', closeLines);
g('mvBack').addEventListener('click', closeCard);
g('vcBack').addEventListener('click', closeVch);
function renderLines() {
var h = '', imp = 0, un = CUR[13] || 'base';
docCrumb.innerHTML = '<span class="ic-c1">Lots</span>' + SEP + '<span class="ic-c2">' + esc(CUR[0]) + ' ' + SEP + ' lot ' + esc(CUR[3]) + '</span>';
docHead.innerHTML = '<div class="ic-l1"><span class="ic-code">' + esc(CUR[0]) + '</span><span class="ic-name">' + esc(CUR[1]) + '</span>' +
'<span class="ic-wh" title="ITEM_CONFG_ID' + SEP + 'lot">' + esc(CUR[2]) + SEP + 'lot ' + esc(CUR[3]) + (CUR[4] ? SEP + 'exp ' + esc(CUR[4]) : '') + '</span></div>' +
'<div class="ic-l2">' + kv('Unit', esc(un)) + kv('Lines', LINES.length) + kv('Impact', '<span class="' + sgn(+CUR[10]) + '">' + fm(+CUR[10]) + '</span>') +
kv('Read', '<i>SHOULD BE = lot average in the warehouse at the date (AVG) or the sender\'s cost (XFER); fix the line in the system to that cost</i>') + '</div>';
var cols = ['#', 'DATE', 'DOC #', 'TYPE', 'RULE', 'WAREHOUSE', 'QTY', 'LINE COST', 'SHOULD BE', 'DIFF', 'IMPACT', 'CARD'];
h = '<tr>'; cols.forEach(function (c, i) { h += '<th class="' + (i < 6 || i === 11 ? 'txt' : 'num') + '">' + c + '</th>'; }); docTHead.innerHTML = h + '</tr>';
h = '';
LINES.forEach(function (r, n) {
imp += +r[13];
h += '<tr><td class="seq">' + (n + 1) + '</td><td>' + esc(r[0]) + '</td>' +
'<td class="doc lnk" data-tc="' + r[2] + '" data-ser="' + r[3] + '" title="Open the document">' + esc(r[4]) + '</td>' +
'<td class="kc">' + kindTag(r[5], r[6], r[2]) + '</td><td class="kc">' + ruleBadge(r[14]) + '</td><td class="det"><bdi>' + esc(r[8]) + '</bdi></td>' +
'<td class="num">' + fq(+r[9]) + '</td><td class="num odd">' + WARN + ' ' + fc(+r[10]) + '</td><td class="num"><b>' + fc(+r[11]) + '</b></td>' +
'<td class="num ' + sgn(+r[12]) + '">' + fc(+r[12]) + '</td><td class="num ' + sgn(+r[13]) + '">' + fm(+r[13]) + '</td>' +
'<td><button type="button" class="cc-card" data-s="' + r[7] + '" data-n="' + esc(r[8]) + '" title="Movement card of this lot in this warehouse">Card</button></td></tr>';
});
docBody.innerHTML = h;
docFoot.innerHTML = '<tr class="tot"><td colspan="10">TOTAL ' + LINES.length + ' lines</td><td class="num ' + sgn(imp) + '">' + fm(imp) + '</td><td></td></tr>';
docNote.textContent = LINES.length + ' lines';
g('docPrintFilters').innerHTML = ['<b>' + esc(CUR[0]) + '</b> ' + esc(CUR[1]), 'Lot ' + esc(CUR[3]), dmy(from) + ' - ' + dmy(to), esc(storeName())].join('<span class="pf-sep">|</span>');
show(docPanel);
}
docBody.addEventListener('click', function (e) {
var b = e.target.closest ? e.target.closest('button.cc-card') : null, td = e.target.closest ? e.target.closest('td.lnk') : null;
if (b) openCard(+b.getAttribute('data-s'), b.getAttribute('data-n'));
else if (td) openVch(+td.getAttribute('data-tc'), +td.getAttribute('data-ser'));
});
function openCard(st, sn) {
call('ITCARD_AJAX', { x01: 'card', x02: CUR[0], x03: from, x04: to, x05: String(CUR[2]), x06: String(st), x07: 'LS' },
function (d) { CARD = d; CST = st; CSN = sn; renderCard(); }, docNote);
}
function party(r) { return r[6] ? ((CARD.nm || {})[r[6] + r[7]] || r[7]) : ''; }
function lotOf(k) { var i, L = CARD.lots || []; for (i = 0; i < L.length; i++) { if (L[i][0] === k) return L[i]; } return null; }
function renderCard() {
var K = window.icCalc(CARD, true, false, 1), L = lotOf(CARD.cfg), un = CUR[13] || 'base', h = '', ti = 0, tvi = 0, to_ = 0, tvo = 0;
mvCrumb.innerHTML = '<span class="ic-c1">Lots</span>' + SEP + '<span class="ic-c1">' + esc(CUR[0]) + ' lot ' + esc(CUR[3]) + '</span>' + SEP + '<span class="ic-c2"><bdi>' + esc(CSN) + '</bdi></span>';
mvHead.innerHTML = '<div class="ic-l1"><span class="ic-code">' + esc(CUR[0]) + '</span><span class="ic-name">' + esc(CUR[1]) + '</span><span class="ic-wh"><bdi>' + esc(CSN) + '</bdi></span></div>' +
'<div class="ic-l2">' + kv('Lot', '<span title="ITEM_CONFG_ID">' + esc(CUR[2]) + '</span>' + SEP + esc(CUR[3]) + (L && L[2] ? ' <i>exp ' + esc(L[2]) + '</i>' : '')) + kv('Unit', esc(un)) +
kv('Cost', K.cost ? fc(K.cost) : DASH) + kv('Balance ' + esc(dmy(to)), '<b>' + fq(K.bal) + ' ' + esc(un) + '</b> <i>' + fm(K.val) + '</i>') +
(K.odd ? kv('Cost check', '<span class="ic-warn">' + WARN + ' ' + K.odd + ' line' + (K.odd > 1 ? 's' : '') + ' off the lot cost</span>') : '') + '</div>';
var cols = ['#', 'DATE', 'DOC #', 'TYPE', 'DETAILS', 'COST', 'PRICE', 'IN QTY', 'IN VALUE', 'OUT QTY', 'OUT VALUE', 'BALANCE', 'BAL. VALUE'];
h = '<tr>'; cols.forEach(function (c, i) { h += '<th class="' + (i < 5 ? 'txt' : 'num') + '">' + c + '</th>'; }); mvTHead.innerHTML = h + '</tr>';
var zc = '<td class="num z">' + DASH + '</td>';
h = '<tr class="ic-open"><td></td><td>' + esc(dmy(from)) + '</td><td colspan="5">Opening balance</td>' + zc + zc + zc + zc +
'<td class="num bal">' + fq(+CARD.open[0]) + '</td><td class="num bal">' + fm(+CARD.open[1]) + '</td></tr>';
K.rows.forEach(function (x, n) {
var r = x.r, ef = r[5], pr = x.sp !== null ? x.sp : x.pp, sub = '';
ti += x.qi; tvi += x.vi; to_ += x.qo; tvo += x.vo;
h += '<tr class="' + (x.qi > 0 ? 'in' : 'out') + '"><td class="seq">' + (n + 1) + '</td><td>' + esc(r[0]) + '</td>' +
'<td class="doc lnk" data-tc="' + r[2] + '" data-ser="' + r[20] + '" title="Open the document">' + esc(r[3]) + '</td>' +
'<td class="kc">' + kindTag(r[4], ef, r[2]) + '</td><td class="det">' + (ef === 5 ? 'To ' : ef === 6 ? 'From ' : '') + '<bdi>' + esc(party(r)) + '</bdi></td>' +
'<td class="num' + (x.odd ? ' odd" title="' + (x.xfer ? 'Received at ' + fc(x.c) + ' but sent at ' + fc(x.ref) : 'Lot average in this warehouse at this date ' + fc(x.ref) + ' - this line was not re-costed') : '') + '">' + (x.odd ? WARN + ' ' : '') + (x.c ? fc(x.c) : DASH) + '</td>' +
'<td class="num">' + (pr === null ? DASH : fm(pr)) + '</td>' +
tdq(x.qi, 'qi') + tdm(x.vi, 'qi') + tdq(x.qo, 'qo') + tdm(x.vo, 'qo') +
'<td class="num bal">' + fq(x.bal) + '</td><td class="num bal">' + fm(x.val) + '</td></tr>';
if (ef === 5 && r[16] !== null) {
sub = !r[17] ? '<span class="ic-warn">Not received yet at the destination</span>' : 'Received ' + esc(r[17]) + ' at destination, qty ' + fq(+r[18]) + ' ' + esc(un) + ' (#' + esc(String(r[19])) + ')';
h += '<tr class="ic-sub"><td></td><td colspan="12">' + String.fromCharCode(8627) + ' ' + sub + '</td></tr>';
}
});
mvBody.innerHTML = h;
mvFoot.innerHTML = '<tr class="tot"><td colspan="7">TOTAL ' + K.rows.length + ' movements</td><td class="num">' + fq(ti) + '</td><td class="num">' + fm(tvi) + '</td>' +
'<td class="num">' + fq(to_) + '</td><td class="num">' + fm(tvo) + '</td><td class="num bal">' + fq(K.bal) + '</td><td class="num bal">' + fm(K.val) + '</td></tr>';
mvNote.textContent = K.rows.length ? K.rows.length + ' movements' : 'No movement in the period';
g('mvPrintFilters').innerHTML = ['<b>' + esc(CUR[0]) + '</b> ' + esc(CUR[1]), 'Lot ' + esc(CUR[3]), esc(CSN), dmy(from) + ' - ' + dmy(to), 'Unit ' + esc(un)].join('<span class="pf-sep">|</span>');
show(mvPanel);
}
mvBody.addEventListener('click', function (e) {
var td = e.target.closest ? e.target.closest('td.lnk') : null;
if (td) openVch(+td.getAttribute('data-tc'), +td.getAttribute('data-ser'));
});
function openVch(tc, ser) {
call('ITCARD_AJAX', { x01: 'doc', x02: String(tc), x05: String(ser) }, function (d) { if (!d.h) { alert('Could not load the document.'); return; } VCH = d; renderVch(); }, CARD ? mvNote : docNote);
}
function renderVch() {
var h = VCH.h, kind = kindOf(h.tt, h.ef, h.tc), x = '', tn = 0, tv = 0, who;
vcCrumb.innerHTML = '<span class="ic-c1">Lots</span>' + SEP + '<span class="ic-c1">' + esc(CUR[0]) + ' lot ' + esc(CUR[3]) + '</span>' + SEP + '<span class="ic-c2">' + esc(kind) + ' ' + esc(h.doc) + '</span>';
who = h.tt === 9 ? kv('From', '<bdi>' + esc(h.xf) + '</bdi>') + kv('To', '<bdi>' + esc(h.xt) + '</bdi>')
: (h.party ? kv(h.tt === 1 || h.tt === 3 ? 'Supplier' : 'Customer', '<bdi>' + esc(h.party) + '</bdi>') : '');
vcHead.innerHTML = '<div class="ic-l1">' + kindTag(h.tt, h.ef, h.tc) + '<span class="ic-name">' + esc(h.doc) + '</span>' +
(h.inv ? '<span class="ic-code">Inv ' + esc(h.inv) + '</span>' : '') + '<span class="ic-code">' + esc(h.dt) + '</span><span class="ic-wh"><bdi>' + esc(h.sn) + '</bdi></span></div>' +
'<div class="ic-l2">' + who + (h.sm ? kv('Salesman', '<bdi>' + esc(h.sm) + '</bdi>') : '') + (h.disc ? kv('Discount', fm(h.disc)) : '') + (h.pay ? kv('Total', fm(h.pay)) : '') +
kv('Posted', h.post ? 'Yes' : 'No') + (h.dsc ? kv('Note', '<bdi>' + esc(h.dsc) + '</bdi>') : '') +
kv('Type', '<bdi>' + esc(h.tn) + '</bdi> <i>' + esc(String(h.tc)) + '/' + esc(String(h.ser)) + '</i>') + '</div>';
var cols = ['#', 'ITEM', 'DESCRIPTION', 'LOT', 'EXP', 'UNIT', 'QTY', 'BONUS', 'PRICE', 'DISC', 'NET', 'COST', 'VALUE'];
x = '<tr>'; cols.forEach(function (c, i) { x += '<th class="' + (i < 6 ? 'txt' : 'num') + '">' + c + '</th>'; }); vcTHead.innerHTML = x + '</tr>';
x = '';
VCH.lines.forEach(function (l, n) {
var net = l[10] === null ? null : l[7] * l[10] - l[11], val = l[8] * l[13], cu = l[13] * (l[7] ? l[8] / l[7] : 1), me = l[1] === CUR[0] && l[3] === CUR[2];
if (net !== null) tn += net; tv += val;
x += '<tr class="ic-dl' + (me ? ' me' : '') + '"><td class="seq">' + (n + 1) + '</td><td class="doc">' + esc(l[1]) + '</td><td class="det">' + esc(l[2]) + '</td>' +
'<td class="doc">' + esc(l[4]) + '</td><td>' + esc(l[5]) + '</td><td class="unit">' + esc(l[6]) + '</td><td class="num">' + fq(l[7]) + '</td>' + tdq(l[9], 'qi') +
'<td class="num">' + (l[10] === null ? DASH : fm(l[10])) + '</td>' + tdm(l[11], 'qo') + '<td class="num">' + (net === null ? DASH : fm(net)) + '</td>' +
'<td class="num" title="' + (l[13] ? 'Base unit cost ' + fc(l[13]) : '') + '">' + (cu ? fc(cu) : DASH) + '</td><td class="num bal">' + fm(val) + '</td></tr>';
});
vcBody.innerHTML = x;
vcFoot.innerHTML = '<tr class="tot"><td colspan="10">TOTAL ' + VCH.lines.length + ' lines</td><td class="num">' + fm(tn) + '</td><td></td><td class="num bal">' + fm(tv) + '</td></tr>';
vcNote.textContent = VCH.lines.length + ' lines';
g('vcPrintFilters').innerHTML = ['<b>' + esc(kind) + ' ' + esc(h.doc) + '</b>', esc(h.dt), esc(h.sn), esc(h.party || h.xf + ' - ' + h.xt)].join('<span class="pf-sep">|</span>');
show(vcPanel);
}
function nowTxt() {
var d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; };
return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
}
function doPrint() {
if (!DATA) { alert('Run the report first.'); return; }
['printFilters', 'docPrintFilters', 'mvPrintFilters', 'vcPrintFilters'].forEach(function (id) {
var el = g(id), o;
if (!el) return;
o = el.querySelector('.pf-time');
if (o) { if (o.previousSibling) el.removeChild(o.previousSibling); el.removeChild(o); }
el.insertAdjacentHTML('beforeend', '<span class="pf-sep">|</span><span class="pf-time">Printed ' + nowTxt() + '</span>');
});
var orig = document.title;
document.title = 'Cost Check ' + (VCH ? 'doc ' + VCH.h.doc : CARD ? CUR[0] + ' ' + CUR[3] + ' card' : LINES ? CUR[0] + ' ' + CUR[3] : '') + ' ' + dmy(from) + '-' + dmy(to);
document.body.classList.add('print-mode-table');
var back = function () { document.title = orig; document.body.classList.remove('print-mode-table'); window.removeEventListener('afterprint', back); };
window.addEventListener('afterprint', back);
window.print();
}
function doExcel() {
if (!DATA) { alert('Run the report first.'); return; }
window.ccExcel({ VCH: VCH, CARD: CARD, K: CARD ? window.icCalc(CARD, true, false, 1) : null, CSN: CSN, LINES: LINES, CUR: CUR, lots: visLots(),
from: from, to: to, scope: storeName(), rule: rule ? RULES[rule] : 'Both rules', kindOf: kindOf, RULES: RULES, dmy: dmy, fc: fc, party: party });
}
(function () {
var box = g('exportBox');
if (!box) return;
if (window.jmExport) { window.jmExport.attach(box, { pdf: doPrint, excel: doExcel }); return; }
box.innerHTML = '<button type="button" class="btn-print btn-excel" id="excelBtn" disabled>Export Excel</button> ' +
'<button type="button" class="btn-print" id="printTableBtn" disabled>Print / PDF</button>';
excelBtn = g('excelBtn'); printBtn = g('printTableBtn');
excelBtn.addEventListener('click', doExcel);
printBtn.addEventListener('click', doPrint);
})();
load();
}
initCostCheck();

});
