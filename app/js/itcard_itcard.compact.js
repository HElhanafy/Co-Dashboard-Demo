window.addEventListener("DOMContentLoaded",function(){
function initItemCard() {
var el = document.getElementById('ic-meta');
if (!el || !document.getElementById('tableBody')) {
initItemCard._t = (initItemCard._t || 0) + 1;
if (initItemCard._t < 100) { setTimeout(initItemCard, 100); return; }
console.error('Item card: data region not found.');
return;
}
var META = JSON.parse(el.textContent);
var KEY = 'mvDims', cached = null;
try { cached = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { cached = null; }
if (cached && cached.v === META.dimsV && cached.items) { startItemCard(META, cached.items); return; }
document.getElementById('tableNote').textContent = 'Loading item master...';
apex.server.process('ITCARD_AJAX', { x01: 'dims' }, {
success: function (d) {
if (!d || !d.items) { alert('Could not load the item master.'); return; }
try { localStorage.setItem(KEY, JSON.stringify({ v: META.dimsV, brands: d.brands, items: d.items })); } catch (e) {}
startItemCard(META, d.items);
},
error: function () { alert('Could not load the item master.'); }
});
}
function startItemCard(META, RAW) {
var ITEMS = RAW.map(function (a) {
return { c: a[0], n: a[1], cl: a[2], u: a[4], f: +a[5] || 1, bu: a[6], us: a[7] || [] };
});
var ITM = {}; ITEMS.forEach(function (it) { ITM[it.c] = it; });
var ADM = META.admin === 1;
function esc(s) {
return String(s === null || s === undefined ? '' : s).replace(/[&<>"]/g, function (m) {
return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m];
});
}
function idxOf(arr, v) { for (var i = 0; i < arr.length; i++) { if (arr[i] === v) return i; } return -1; }
function dmy(s) { return s ? s.slice(8, 10) + '/' + s.slice(5, 7) + '/' + s.slice(0, 4) : '-'; }
var DASH = String.fromCharCode(8212), SEP = ' ' + String.fromCharCode(8250) + ' ';
function fq(v) {
var r = Math.round(v * 1000) / 1000; if (Math.abs(r) < 0.0005) r = 0;
return r.toLocaleString('en-US', { maximumFractionDigits: 3 });
}
function fm(v) { v = Math.round(v * 100) / 100; if (Math.abs(v) < 0.005) v = 0; return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fc(v) { return (Math.round(v * 10000) / 10000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 }); }
function tdq(v, cls) { return v ? '<td class="num ' + cls + '">' + fq(v) + '</td>' : '<td class="num z">' + DASH + '</td>'; }
function tdm(v, cls) { return v ? '<td class="num ' + cls + '">' + fm(v) + '</td>' : '<td class="num z">' + DASH + '</td>'; }
var item = null, cfg = null, store = null, F = 1, UN = '', DATA = null, LOTS = [], STORES = [], PRICES = [], PP = null,
from = META.defFrom, to = META.today, busy = false, KF = [], OF = false;
var fItem = document.getElementById('fItem'), fItemClr = document.getElementById('fItemClr'),
itemMenu = document.getElementById('itemMenu'),
fUnit = document.getElementById('fUnit'), fFrom = document.getElementById('fFrom'), fTo = document.getElementById('fTo'),
cardSeg = document.getElementById('cardSeg'), runBtn = document.getElementById('runBtn'),
lotLine = document.getElementById('lotLine'), lotChips = document.getElementById('lotChips'),
storeLine = document.getElementById('storeLine'), storeChips = document.getElementById('storeChips'),
kindChips = document.getElementById('kindChips'),
cardHead = document.getElementById('cardHead'), cardL1 = document.getElementById('cardL1'), cardL2 = document.getElementById('cardL2'),
titleEl = document.getElementById('tableTitleText'), pfEl = document.getElementById('printFilters'),
tHead = document.getElementById('tableHead'), tBody = document.getElementById('tableBody'), tFoot = document.getElementById('tableFoot'),
note = document.getElementById('tableNote'), badge = document.getElementById('periodBadge'),
excelBtn = null, printBtn = null, unitChips = document.getElementById('unitChips');
function canExp(v) { if (excelBtn) { excelBtn.disabled = !v; printBtn.disabled = !v; } }
function paintUnits() {
if (!unitChips) return;
if (fUnit.disabled || !fUnit.options.length) { unitChips.innerHTML = '<span class="tp-none">Select an item</span>'; return; }
unitChips.innerHTML = Array.prototype.map.call(fUnit.options, function (o, i) {
return '<button type="button"' + (i === fUnit.selectedIndex ? ' class="on"' : '') + ' data-i="' + i + '">' + esc(o.textContent) + '</button>';
}).join('');
}
if (unitChips) unitChips.addEventListener('click', function (e) {
var b = e.target; while (b && b !== unitChips && !(b.getAttribute && b.getAttribute('data-i'))) b = b.parentNode;
if (!b || b === unitChips) return;
fUnit.selectedIndex = +b.getAttribute('data-i');
fUnit.dispatchEvent(new Event('change'));
});
fFrom.min = META.minD; fFrom.max = META.today; fFrom.value = from;
fTo.min = META.minD; fTo.max = META.today; fTo.value = to;
var AVG = false;
Array.prototype.forEach.call(cardSeg.querySelectorAll('button'), function (b) {
if (b.getAttribute('data-v') === 'avg') { b.disabled = !ADM; if (!ADM) b.title = 'Average cost card: cost viewers only'; }
b.addEventListener('click', function () {
var v = b.getAttribute('data-v') === 'avg';
if (b.disabled || v === AVG) return;
AVG = v;
Array.prototype.forEach.call(cardSeg.querySelectorAll('button'), function (o) { o.className = o === b ? 'on' : ''; });
if (item && DATA) runCard(null); else if (item) note.textContent = 'Press Run to build the card';
});
});
var qry = '', shown = '';
fItem.addEventListener('input', function () {
qry = fItem.value.trim(); fItemClr.style.display = qry ? '' : 'none';
if (item && fItem.value !== shown) { setItem(null); }
itemSearch();
});
fItem.addEventListener('focus', itemSearch);
function itemSearch() {
var q = qry.toLowerCase(), h = '', n = 0;
if (q.length < 2 || (item && fItem.value === shown)) { itemMenu.style.display = 'none'; return; }
for (var i = 0; i < ITEMS.length && n < 20; i++) {
var it = ITEMS[i];
if (it.cl === '0') continue;
if (it.c.toLowerCase().indexOf(q) !== -1 || it.n.toLowerCase().indexOf(q) !== -1) {
n++;
h += '<div class="ss-option" data-c="' + esc(it.c) + '"><span class="ss-code">' + esc(it.c) + '</span> ' + esc(it.n) + '</div>';
}
}
itemMenu.innerHTML = h || '<div class="ss-empty">No item matches</div>';
var rc = fItem.getBoundingClientRect();
itemMenu.style.position = 'fixed'; itemMenu.style.top = (rc.bottom + 4) + 'px'; itemMenu.style.left = rc.left + 'px';
itemMenu.style.width = rc.width + 'px'; itemMenu.style.minWidth = '0'; itemMenu.style.maxWidth = 'none';
itemMenu.style.maxHeight = Math.max(160, window.innerHeight - rc.bottom - 24) + 'px';
itemMenu.style.display = 'block';
Array.prototype.forEach.call(itemMenu.querySelectorAll('.ss-option'), function (o) {
o.addEventListener('click', function () { pickItem(ITM[o.getAttribute('data-c')]); });
});
}
function pickItem(it) {
shown = it.c + SEP + it.n; fItem.value = shown; qry = it.c;
itemMenu.style.display = 'none'; fItemClr.style.display = '';
setItem(it);
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
if (open && opts.length) pickItem(ITM[opts[cur === -1 ? 0 : cur].getAttribute('data-c')]);
else if (item && !runBtn.disabled && !busy) runBtn.click();
} else if (k === 'Escape' && open) { itemMenu.style.display = 'none'; }
});
fItemClr.addEventListener('click', function () { fItem.value = ''; qry = ''; shown = ''; fItemClr.style.display = 'none'; itemMenu.style.display = 'none'; setItem(null); fItem.focus(); });
document.addEventListener('click', function (e) {
if (!itemMenu.contains(e.target) && e.target !== fItem) itemMenu.style.display = 'none';
});
window.addEventListener('resize', function () { if (itemMenu.style.display === 'block') itemSearch(); });
window.addEventListener('scroll', function () { if (itemMenu.style.display === 'block') itemSearch(); }, true);
function setItem(it) {
item = it; cfg = null; store = null; DATA = null; LOTS = []; STORES = []; PRICES = []; PP = null; KF = [];
fUnit.innerHTML = '';
lotLine.style.display = 'none'; storeLine.style.display = 'none'; kindChips.style.display = 'none'; cardHead.style.display = 'none';
tHead.innerHTML = ''; tBody.innerHTML = ''; tFoot.innerHTML = ''; titleEl.textContent = 'Movements'; pfEl.innerHTML = '';
canExp(false);
if (!it) { fUnit.disabled = true; paintUnits(); runBtn.disabled = true; note.textContent = 'Select an item, then Run'; badge.textContent = 'Select an item'; return; }
var units = [], i;
if (it.f > 1) units.push([it.u, it.f]);
for (i = 0; i < it.us.length; i++) units.push([it.us[i][0], +it.us[i][1]]);
units.push([it.f > 1 ? (it.bu || 'BASE') : it.u, 1]);
units.forEach(function (u) {
var o = document.createElement('option'); o.value = String(u[1]); o.textContent = u[0]; fUnit.appendChild(o);
});
fUnit.disabled = false; fUnit.selectedIndex = 0; F = units[0][1]; UN = units[0][0]; paintUnits();
runBtn.disabled = false; note.textContent = 'Press Run to build the card';
badge.textContent = 'Press Run';
}
fUnit.addEventListener('change', function () { F = +fUnit.value || 1; UN = fUnit.options[fUnit.selectedIndex].textContent; paintUnits(); if (DATA) render(); });
function load(flags, lotSel, storeSel, done) {
if (!item || busy) return;
KF = [];
busy = true; note.textContent = 'Loading...'; note.classList.add('busy'); tBody.classList.add('dim');
apex.server.process('ITCARD_AJAX', { x01: 'card', x02: item.c, x03: from, x04: to,
x05: lotSel ? String(lotSel) : '', x06: storeSel ? String(storeSel) : '', x07: flags }, {
success: function (d) {
busy = false; note.classList.remove('busy'); tBody.classList.remove('dim');
if (!d || d.error) { note.textContent = 'Could not build the card.'; return; }
done(d);
},
error: function () { busy = false; note.classList.remove('busy'); tBody.classList.remove('dim'); note.textContent = 'Could not build the card.'; }
});
}
runBtn.addEventListener('click', function () { runCard(null); });
function runCard(st) {
if (!item) return;
closeDoc();
from = fFrom.value || META.defFrom; to = fTo.value || META.today;
if (from > to) { from = to; fFrom.value = from; }
load(AVG ? 'LSA' : 'LS', AVG ? null : cfg, st, function (d) {
LOTS = d.lots || []; PRICES = d.prices || []; STORES = d.stores || []; PP = d.pp || null;
DATA = d; cfg = d.cfg; store = d.store; from = d.from; to = d.to;
var ok = AVG, i;
for (i = 0; i < LOTS.length; i++) { if (LOTS[i][0] === cfg) ok = true; }
if (!ok && LOTS.length) { cfg = null; pickLot(LOTS[0][0]); return; }
paintChips(); render();
});
}
function lotName(k) { for (var i = 0; i < LOTS.length; i++) { if (LOTS[i][0] === k) return LOTS[i][1]; } return String(k); }
function pickLot(id) {
if (id === cfg) return;
closeDoc();
load('S', id, null, function (d) {
STORES = d.stores || []; PP = d.pp || null; DATA = d; cfg = d.cfg; store = null;
paintChips(); render();
});
}
function pickStore(s) {
if (s === store) return;
closeDoc();
load(AVG ? 'A' : '', cfg, s, function (d) { DATA = d; store = s; paintChips(); render(); });
}
function paintChips() {
var h = '';
LOTS.forEach(function (l) {
h += '<button type="button" class="chip two' + (l[0] === cfg ? ' on' : '') + (l[3] ? '' : ' zero') + '" data-id="' + l[0] + '" title="Balance ' + fq(l[3] / F) + ' ' + esc(UN) + (l[4] ? ', ' + l[4] + ' movements in the period' : ', no movement in the period') + '">' +
'<span class="chip-t">' + esc(l[1]) + '</span><span class="chip-sub">' + (l[2] ? 'exp ' + esc(l[2]) : 'no expiry') + ' ' + SEP + ' ' + fq(l[3] / F) + '</span></button>';
});
lotChips.innerHTML = h || '<span class="ss-empty">No lot with a balance or a movement in the period</span>';
lotLine.style.display = AVG ? 'none' : '';
Array.prototype.forEach.call(lotChips.querySelectorAll('.chip'), function (b) {
b.addEventListener('click', function () { pickLot(+b.getAttribute('data-id')); });
});
var tb = 0, tm = 0;
STORES.forEach(function (s) { tb += +s[2]; tm += +s[3]; });
h = '<button type="button" class="chip two' + (store === null ? ' on' : '') + '" data-s="" title="' + tm + ' movements in the period"><span class="chip-t">All</span><span class="chip-sub">' + fq(tb / F) + ' ' + esc(UN) + '</span></button>';
STORES.forEach(function (s) {
h += '<button type="button" class="chip two' + (s[0] === store ? ' on' : '') + (+s[2] ? '' : ' zero') + '" data-s="' + s[0] + '" title="' + esc(s[1]) + ': ' + s[3] + ' movements in the period">' +
'<span class="chip-t"><bdi>' + esc(s[4] || s[1]) + '</bdi></span><span class="chip-sub">' + fq(+s[2] / F) + ' ' + esc(UN) + '</span></button>';
});
storeChips.innerHTML = h;
storeLine.style.display = cfg ? '' : 'none';
Array.prototype.forEach.call(storeChips.querySelectorAll('.chip'), function (b) {
b.addEventListener('click', function () { var v = b.getAttribute('data-s'); pickStore(v ? +v : null); });
});
}
function lotInfo() { for (var i = 0; i < LOTS.length; i++) { if (LOTS[i][0] === cfg) return LOTS[i]; } return null; }
function storeInfo() { for (var i = 0; i < STORES.length; i++) { if (STORES[i][0] === store) return STORES[i]; } return null; }
function salesPrice() {
var i, d = null;
for (i = 0; i < PRICES.length; i++) { if (+PRICES[i][1] === F && PRICES[i][2]) return +PRICES[i][2]; }
for (i = 0; i < PRICES.length; i++) { if (PRICES[i][3] === 1 && PRICES[i][2]) d = PRICES[i]; }
return d ? +d[2] / +d[1] * F : 0;
}
function scopeName() { var s = storeInfo(); return s ? s[1] : 'All warehouses'; }
function party(r) { return r[6] ? ((DATA.nm || {})[r[6] + r[7]] || r[7]) : ''; }
function whName(s) { return (DATA.nm || {})['W' + s] || String(s); }
function typeName(r) { return (DATA.tn || {})[String(r[2])] || ''; }
function calc() { return window.icCalc(DATA, ADM, AVG, F); }
function visRows(rows) {
return (KF.length || OF) ? rows.filter(function (x) { return (!OF || x.odd) && (!KF.length || idxOf(KF, kindOf(x.r[4], x.r[5], x.r[2])) !== -1); }) : rows;
}
function catOf(tt, ef) { return tt === 1 ? 'pu' : tt === 2 ? 'sa' : (tt === 3 || tt === 4) ? 're' : tt === 9 ? (ef === 5 ? 'to' : 'ti') : 'ot'; }
function paintKinds(rows) {
var cnt = {}, names = [], h, odd = 0;
rows.forEach(function (x) { var k = kindOf(x.r[4], x.r[5], x.r[2]); if (!cnt[k]) { cnt[k] = 0; names.push([k, catOf(x.r[4], x.r[5])]); } cnt[k]++; if (x.odd) odd++; });
if (!odd) OF = false;
if (!names.length) { kindChips.style.display = 'none'; return; }
h = '<button type="button" class="chip mini' + (KF.length || OF ? '' : ' on') + '" data-k="">All</button>';
names.forEach(function (n) {
h += '<button type="button" class="chip mini k' + n[1] + (idxOf(KF, n[0]) !== -1 ? ' on' : '') + '" data-k="' + esc(n[0]) + '">' + esc(n[0]) + '<span class="chip-n">' + cnt[n[0]] + '</span></button>';
});
if (odd) h += '<button type="button" class="chip mini kod' + (OF ? ' on' : '') + '" data-k="" data-od="1" title="Only the lines costed off the lot average of their warehouse">' + String.fromCharCode(9888) + ' Cost off<span class="chip-n">' + odd + '</span></button>';
kindChips.innerHTML = h; kindChips.style.display = '';
Array.prototype.forEach.call(kindChips.querySelectorAll('.chip'), function (b) {
b.addEventListener('click', function () {
var k = b.getAttribute('data-k'), i = idxOf(KF, k);
if (b.getAttribute('data-od')) OF = !OF;
else if (!k) { KF = []; OF = false; }
else if (i === -1) KF.push(k); else KF.splice(i, 1);
render();
});
});
}
function render() {
if (!DATA || (!cfg && !AVG)) { note.textContent = 'No lot to show for this item in the period.'; return; }
var L = lotInfo(), S = storeInfo(), K = calc(), all = store === null, sp = salesPrice(), i, h = '', V = visRows(K.rows);
paintKinds(K.rows);
document.body.classList[AVG ? 'add' : 'remove']('ic-avg');
badge.textContent = dmy(from) + ' ' + String.fromCharCode(8211) + ' ' + dmy(to);
cardL1.innerHTML = '<span class="ic-code">' + esc(item.c) + '</span><span class="ic-name">' + esc(item.n) + '</span>' +
'<span class="ic-wh"><bdi>' + esc(scopeName()) + '</bdi></span>';
var cells = [
AVG ? ['Lots', LOTS.length + ' <i>moving average</i>'] : ['Lot', L ? '<span title="ITEM_CONFG_ID">' + esc(L[0]) + '</span> ' + SEP + ' ' + esc(L[1]) + (L[2] ? ' <i>exp ' + esc(L[2]) + '</i>' : '') : '-'],
['Unit', esc(UN) + (F > 1 ? ' <i>= ' + fq(F) + ' ' + esc(item.bu || 'base') + '</i>' : '')]];
if (ADM) cells.push(
['Purchase', PP ? fm(+PP[2] / (+PP[4] || 1) * F) + ' <i title="' + esc(PP[0]) + ' ' + SEP + ' ' + esc(PP[1]) + (PP[5] ? ' ' + SEP + ' ' + esc(PP[5]) : '') + '">' + esc(PP[0]) + '</i>' : DASH],
[AVG ? 'Avg cost' : 'Cost', K.cost ? fc(K.cost * F) : DASH]);
if (ADM) cells.push(['Sale', sp ? fm(sp) + ' <i>list</i>' : DASH]);
cells.push(['Balance ' + esc(dmy(to)), '<b>' + fq(K.bal / F) + ' ' + esc(UN) + '</b>' + (ADM && !AVG ? ' <i>' + fm(K.val) + '</i>' : '')]);
if (K.odd) cells.push(['Cost check', '<span class="ic-warn" title="Issues or adjustments costed off the lot average of their warehouse at their date: the lot needs a cost recalculation in the system">' + String.fromCharCode(9888) + ' ' + K.odd + ' line' + (K.odd > 1 ? 's' : '') + ' off the lot cost</span>']);
h = '';
cells.forEach(function (c) { h += '<span class="ic-kv"><span class="ic-k">' + c[0] + '</span><span class="ic-v">' + c[1] + '</span></span>'; });
cardL2.innerHTML = h; cardHead.style.display = '';
var cols = ['#', 'DATE', 'DOC #', 'TYPE'];
if (AVG) cols.push('LOT');
if (all && !AVG) cols.push('WAREHOUSE');
cols.push('DETAILS');
if (ADM) cols.push('COST', 'PRICE');
cols.push('IN QTY'); if (ADM) cols.push('IN VALUE');
cols.push('OUT QTY'); if (ADM) cols.push('OUT VALUE');
cols.push('BALANCE'); if (ADM) cols.push('BAL. VALUE');
if (AVG) cols.push('AVG COST');
var nt = all && !AVG ? 6 : AVG ? 6 : 5;
h = '<tr>';
cols.forEach(function (c, i) { h += '<th class="' + (i < nt ? 'txt' : 'num') + '">' + c + '</th>'; });
tHead.innerHTML = h + '</tr>';
var nc = cols.length, span = nt - (ADM ? 0 : 2), zc = '<td class="num z">' + DASH + '</td>', oq = +DATA.open[0], ov = +DATA.open[1];
h = '<tr class="ic-open"><td></td><td>' + esc(dmy(from)) + '</td><td colspan="' + span + '">Opening balance</td>' +
zc + (ADM ? zc : '') + zc + (ADM ? zc : '') +
'<td class="num bal">' + fq(oq / F) + '</td>' + (ADM ? '<td class="num bal">' + fm(ov) + '</td>' : '') +
(AVG ? '<td class="num">' + (oq > 0.0005 ? fc(ov / oq * F) : DASH) + '</td>' : '') + '</tr>';
var ti = 0, tvi = 0, to_ = 0, tvo = 0;
V.forEach(function (x, n) {
var r = x.r, isIn = x.qi > 0, ef = r[5], kind = kindOf(r[4], ef, r[2]), sub = '', pr = x.sp !== null ? x.sp : x.pp;
var det = (ef === 5 ? 'To ' : ef === 6 ? 'From ' : '') + '<bdi>' + esc(party(r)) + '</bdi>';
ti += x.qi; tvi += x.vi; to_ += x.qo; tvo += x.vo;
h += '<tr class="' + (isIn ? 'in' : 'out') + '">' +
'<td class="seq">' + (n + 1) + '</td><td>' + esc(r[0]) + '</td><td class="doc lnk" data-tc="' + esc(String(r[2])) + '" data-ser="' + esc(String(r[20])) + '" title="' + esc(typeName(r)) + ' (' + esc(r[2]) + ') - click to open the document">' + esc(r[3]) + '</td>' +
'<td class="kc"><span class="kind k' + catOf(r[4], ef) + '">' + esc(kind) + '</span></td>' +
(AVG ? '<td class="doc lot">' + esc(lotName(r[21])) + '</td>' : '') +
(all && !AVG ? '<td class="det wh"><bdi>' + esc(whName(r[8])) + '</bdi></td>' : '') +
'<td class="det" title="' + esc(party(r)) + (all && AVG ? ' - ' + esc(whName(r[8])) : '') + '">' + det + (all && AVG ? '<div class="ic-whs"><bdi>' + esc(whName(r[8])) + '</bdi></div>' : '') + '</td>' +
(ADM ? '<td class="num' + (x.odd ? ' odd" title="' + (x.xfer ? 'Received at ' + fc(x.c * F) + ' but sent at ' + fc(x.ref * F) + ' per ' + esc(UN) + ' - the transfer in did not take the sender\'s cost' : 'Lot average in this warehouse at this date ' + fc(x.ref * F) + ' per ' + esc(UN) + ' - this line was not re-costed') : '') + '">' + (x.odd ? String.fromCharCode(9888) + ' ' : '') + (x.c ? fc(x.c * F) : DASH) + '</td>' +
'<td class="num ' + (x.sp !== null ? 'sp' : 'pp') + '" title="' + (pr === null ? '' : 'Document unit ' + esc(r[9])) + '">' + (pr === null ? DASH : fm(pr)) + '</td>' : '') +
tdq(x.qi / F, 'qi') + (ADM ? tdm(x.vi, 'qi') : '') + tdq(x.qo / F, 'qo') + (ADM ? tdm(x.vo, 'qo') : '') +
'<td class="num bal">' + fq(x.bal / F) + '</td>' + (ADM ? '<td class="num bal">' + fm(x.val) + '</td>' : '') +
(AVG ? '<td class="num">' + fc(x.avg * F) + '</td>' : '') + '</tr>';
if (ef === 5 && r[16] !== null) {
if (!r[17]) sub = '<span class="ic-warn">Not received yet at the destination</span>';
else if (!all) sub = 'Received ' + esc(r[17]) + ' at destination, qty ' + fq(+r[18] / F) + ' ' + esc(UN) + ' (#' + esc(String(r[19])) + ')';
if (sub) h += '<tr class="ic-sub"><td></td><td colspan="' + (nc - 1) + '">' + String.fromCharCode(8627) + ' ' + sub + '</td></tr>';
}
});
tBody.innerHTML = h || '';
tFoot.innerHTML = '<tr class="tot"><td colspan="' + (span + 2) + '">TOTAL ' + V.length + ' movements' + (KF.length || OF ? ' of ' + K.rows.length + ' (filtered)' : '') + (all ? ' (all warehouses)' : '') + '</td>' +
'<td class="num">' + fq(ti / F) + '</td>' + (ADM ? '<td class="num">' + fm(tvi) + '</td>' : '') +
'<td class="num">' + fq(to_ / F) + '</td>' + (ADM ? '<td class="num">' + fm(tvo) + '</td>' : '') +
'<td class="num bal">' + fq(K.bal / F) + '</td>' + (ADM ? '<td class="num bal">' + fm(K.val) + '</td>' : '') +
(AVG ? '<td class="num">' + (K.cost ? fc(K.cost * F) : DASH) + '</td>' : '') + '</tr>';
note.textContent = K.rows.length ? (KF.length || OF ? V.length + ' of ' + K.rows.length + ' movements' : K.rows.length + ' movements') : 'No movement in the period';
titleEl.textContent = 'Movements' + SEP + (AVG ? 'Average cost' : L ? 'Lot ' + L[1] : '') + SEP + scopeName();
pfEl.innerHTML = [
'<b>' + esc(item.c) + '</b> ' + esc(item.n), AVG ? 'All lots, moving average' : 'Lot ' + esc(L ? L[1] : '-'), esc(scopeName()),
dmy(from) + ' - ' + dmy(to), 'Unit ' + esc(UN)].join('<span class="pf-sep">|</span>');
canExp(true);
}
var docPanel = document.getElementById('docPanel'), movPanel = document.getElementById('printTablePanel'),
docHead = document.getElementById('docHead'), docTHead = document.getElementById('docTHead'),
docBody = document.getElementById('docBody'), docFoot = document.getElementById('docFoot'),
docNote = document.getElementById('docNote'), docCrumb = document.getElementById('docCrumb'), DOC = null;
function kindOf(tt, ef, code) {
var p = String(code).slice(0, 3);
if (tt === 1) return 'Purchase'; if (tt === 2) return 'Sale'; if (tt === 3) return 'Purchase return';
if (tt === 4) return 'Sales return'; if (tt === 8) return 'Opening';
if (tt === 9) return ef === 5 ? 'Transfer out' : 'Transfer in';
if (tt === 7) return { '131': 'Samples in', '132': 'Count in', '133': 'Count out', '134': 'Samples out', '135': 'Damaged out' }[p] || (ef === 1 || ef === 4 || ef === 6 ? 'Adjustment in' : 'Adjustment out');
return 'Other';
}
tBody.addEventListener('click', function (e) {
var td = e.target.closest ? e.target.closest('td.lnk') : null;
if (td) openDoc(+td.getAttribute('data-tc'), +td.getAttribute('data-ser'));
});
function openDoc(tc, ser) {
if (busy) return;
busy = true; note.textContent = 'Loading document...'; note.classList.add('busy');
apex.server.process('ITCARD_AJAX', { x01: 'doc', x02: String(tc), x05: String(ser) }, {
success: function (d) {
busy = false; note.classList.remove('busy'); note.textContent = DATA ? DATA.rows.length + ' movements' : '';
if (!d || d.error || !d.h) { alert('Could not load the document.'); return; }
DOC = d; renderDoc();
},
error: function () { busy = false; note.classList.remove('busy'); alert('Could not load the document.'); }
});
}
function closeDoc() {
if (!DOC) return;
DOC = null; docPanel.style.display = 'none'; movPanel.style.display = ''; document.body.classList.remove('ic-doc');
}
document.getElementById('docBack').addEventListener('click', closeDoc);
function renderDoc() {
var h = DOC.h, L = lotInfo(), kind = kindOf(h.tt, h.ef, h.tc), x = '', tq = 0, tn = 0, tv = 0, cur = -1;
docCrumb.innerHTML = '<span class="ic-c1">Movements</span>' + SEP + '<span class="ic-c1">Lot ' + esc(L ? L[1] : '') + '</span>' + SEP + '<span class="ic-c2">' + esc(kind) + ' ' + esc(h.doc) + '</span>';
var who = h.tt === 9 ? '<span class="ic-kv"><span class="ic-k">From</span><span class="ic-v"><bdi>' + esc(h.xf) + '</bdi></span></span><span class="ic-kv"><span class="ic-k">To</span><span class="ic-v"><bdi>' + esc(h.xt) + '</bdi></span></span>'
: (h.party ? '<span class="ic-kv"><span class="ic-k">' + (h.tt === 1 || h.tt === 3 ? 'Supplier' : 'Customer') + '</span><span class="ic-v"><bdi>' + esc(h.party) + '</bdi></span></span>' : '');
docHead.innerHTML = '<div class="ic-l1"><span class="kind k' + catOf(h.tt, h.ef) + '">' + esc(kind) + '</span><span class="ic-name">' + esc(h.doc) + '</span>' +
(h.inv ? '<span class="ic-code">Inv ' + esc(h.inv) + '</span>' : '') + '<span class="ic-code">' + esc(h.dt) + '</span>' +
'<span class="ic-wh"><bdi>' + esc(h.sn) + '</bdi></span></div>' +
'<div class="ic-l2">' + who + (h.sm ? '<span class="ic-kv"><span class="ic-k">Salesman</span><span class="ic-v"><bdi>' + esc(h.sm) + '</bdi></span></span>' : '') +
(h.disc && (ADM || h.tt === 2) ? '<span class="ic-kv"><span class="ic-k">Discount</span><span class="ic-v">' + fm(h.disc) + '</span></span>' : '') +
(h.pay && (ADM || h.tt === 2) ? '<span class="ic-kv"><span class="ic-k">Total</span><span class="ic-v">' + fm(h.pay) + '</span></span>' : '') +
'<span class="ic-kv"><span class="ic-k">Posted</span><span class="ic-v">' + (h.post ? 'Yes' : 'No') + '</span></span>' +
(h.dsc ? '<span class="ic-kv"><span class="ic-k">Note</span><span class="ic-v"><bdi>' + esc(h.dsc) + '</bdi></span></span>' : '') +
'<span class="ic-kv"><span class="ic-k">Type</span><span class="ic-v"><bdi>' + esc(h.tn) + '</bdi> <i>' + esc(String(h.tc)) + '/' + esc(String(h.ser)) + '</i></span></span></div>';
var pc = ADM || h.tt === 2;
var cols = ['#', 'ITEM', 'DESCRIPTION', 'LOT', 'EXP', 'UNIT', 'QTY', 'BONUS'];
if (pc) cols.push('PRICE', 'DISC', 'NET');
if (ADM) cols.push('COST', 'VALUE');
x = '<tr>'; cols.forEach(function (c, i) { x += '<th class="' + (i < 6 ? 'txt' : 'num') + '">' + c + '</th>'; }); docTHead.innerHTML = x + '</tr>';
x = '';
DOC.lines.forEach(function (l, n) {
var net = l[10] === null ? null : l[7] * l[10] - l[11], val = l[8] * l[13], me = l[1] === item.c && l[3] === cfg,
cu = l[13] * (l[7] ? l[8] / l[7] : 1);
if (me) cur = n;
tq += l[8]; if (net !== null) tn += net; tv += val;
x += '<tr class="ic-dl' + (me ? ' me' : '') + '" data-c="' + esc(l[1]) + '" data-k="' + esc(String(l[3])) + '" data-s="' + esc(String(l[14] || '')) + '" title="Open the card of this item and lot in this warehouse">' +
'<td class="seq">' + (n + 1) + '</td><td class="doc">' + esc(l[1]) + '</td><td class="det">' + esc(l[2]) + '</td>' +
'<td class="doc">' + esc(l[4]) + '</td><td>' + esc(l[5]) + '</td><td class="unit">' + esc(l[6]) + '</td>' +
'<td class="num">' + fq(l[7]) + '</td>' + tdq(l[9], 'qi') +
(pc ? '<td class="num">' + (l[10] === null ? DASH : fm(l[10])) + '</td>' + tdm(l[11], 'qo') + '<td class="num">' + (net === null ? DASH : fm(net)) + '</td>' : '') +
(ADM ? '<td class="num" title="' + (l[13] ? 'Base unit cost ' + fc(l[13]) : '') + '">' + (cu ? fc(cu) : DASH) + '</td><td class="num bal">' + fm(val) + '</td>' : '') + '</tr>';
});
docBody.innerHTML = x;
docFoot.innerHTML = '<tr class="tot"><td colspan="' + (pc ? 10 : 8) + '">TOTAL ' + DOC.lines.length + ' lines</td>' +
(pc ? '<td class="num">' + fm(tn) + '</td>' : '') + (ADM ? '<td></td><td class="num bal">' + fm(tv) + '</td>' : '') + '</tr>';
docNote.textContent = DOC.lines.length + ' lines' + (cur >= 0 ? ', this item is line ' + (cur + 1) : '');
document.getElementById('docPrintFilters').innerHTML = ['<b>' + esc(kind) + ' ' + esc(h.doc) + '</b>', esc(h.dt), esc(h.sn), esc(h.party || h.xf + ' - ' + h.xt)].join('<span class="pf-sep">|</span>');
Array.prototype.forEach.call(docBody.querySelectorAll('tr.ic-dl'), function (tr) {
tr.addEventListener('click', function () { jumpTo(tr.getAttribute('data-c'), +tr.getAttribute('data-k'), +tr.getAttribute('data-s') || null); });
});
movPanel.style.display = 'none'; docPanel.style.display = ''; document.body.classList.add('ic-doc');
docPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function jumpTo(code, k, st) {
var it = ITM[code];
if (!it) { alert('Item ' + code + ' is not in the item master.'); return; }
if (it.c !== (item && item.c)) {
shown = it.c + SEP + it.n; fItem.value = shown; qry = it.c; fItemClr.style.display = '';
setItem(it);
} else { closeDoc(); }
cfg = k || null;
runCard(st);
document.querySelector('.ic-filters').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
document.getElementById('resetBtn').addEventListener('click', function () {
closeDoc();
fItem.value = ''; qry = ''; shown = ''; fItemClr.style.display = 'none'; itemMenu.style.display = 'none';
fFrom.value = META.defFrom; fTo.value = META.today; from = META.defFrom; to = META.today;
setItem(null);
});
function nowTxt() {
var d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; };
return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
}
function doPrint() {
if (!DOC && !DATA) { alert('Run the card first.'); return; }
[pfEl, document.getElementById('docPrintFilters')].forEach(function (el) {
var o = el.querySelector('.pf-time');
if (o) { if (o.previousSibling) el.removeChild(o.previousSibling); el.removeChild(o); }
el.insertAdjacentHTML('beforeend', '<span class="pf-sep">|</span><span class="pf-time">Printed ' + nowTxt() + '</span>');
});
var orig = document.title;
document.title = DOC ? 'Document ' + DOC.h.doc + ' ' + DOC.h.dt : 'Item Card ' + item.c + ' ' + (AVG ? 'average' : lotInfo() ? lotInfo()[1] : '') + ' ' + dmy(from) + '-' + dmy(to);
document.body.classList.add('print-mode-table');
var back = function () {
document.title = orig; document.body.classList.remove('print-mode-table');
window.removeEventListener('afterprint', back);
};
window.addEventListener('afterprint', back);
window.print();
}
function doExcel() {
if (!DOC && (!DATA || (!cfg && !AVG))) { alert('Run the card first.'); return; }
var K = DOC ? null : calc();
window.icExcel({ DOC: DOC, DATA: DATA, item: item, store: store, F: F, UN: UN, from: from, to: to, ADM: ADM, AVG: AVG, lotName: lotName,
L: lotInfo(), scope: scopeName(), rows: K ? visRows(K.rows) : [], kindOf: kindOf, party: party, whName: whName,
fc: fc, fq: fq, dmy: dmy, filtered: KF.length > 0 || OF, K: K });
}
(function () {
var box = document.getElementById('exportBox');
if (!box) return;
if (window.jmExport) { window.jmExport.attach(box, { pdf: doPrint, excel: doExcel }); return; }
box.innerHTML = '<button type="button" class="btn-print btn-excel" id="excelBtn" disabled>Export Excel</button> ' +
'<button type="button" class="btn-print" id="printTableBtn" disabled>Print / PDF</button>';
excelBtn = document.getElementById('excelBtn'); printBtn = document.getElementById('printTableBtn');
excelBtn.addEventListener('click', doExcel);
printBtn.addEventListener('click', doPrint);
})();
}
initItemCard();

});
