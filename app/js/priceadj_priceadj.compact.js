window.addEventListener("DOMContentLoaded",function(){
function initPriceAdj() {
const dataEl = document.getElementById('pa-data');
if (!dataEl) {
initPriceAdj._t = (initPriceAdj._t || 0) + 1;
if (initPriceAdj._t < 100) { setTimeout(initPriceAdj, 100); }
return;
}
const D = JSON.parse(dataEl.textContent);
const SEE = D.cost === 1;
const SEP = String.fromCharCode(8250);
const T = s => (window.jmT ? window.jmT(s) : s);
const $ = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
const r4 = v => Math.round(v * 10000) / 10000;
const dp = v => (Math.abs(v) < 1 || Math.abs(Math.round(v * 100) - v * 100) > 0.005 ? 4 : 2);
const fx = v => (v == null ? '' : (+v).toLocaleString('en-US', { minimumFractionDigits: dp(+v), maximumFractionDigits: dp(+v) }));
const px = v => (+v).toFixed(dp(+v));
const f2 = v => (+v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fp = v => (v >= 0 ? '+' : '') + v.toFixed(1) + '%';
const ar = () => window.JM_LANG === 'AR';
const CLS = {};
D.classes.forEach(c => { CLS[c[0]] = { c: c[0], n: c[1], a: c[2], k: c[3] }; });
let cls = '', items = [], byCode = {}, edits = {}, draft = null, dirty = false;
let q = '', show = 'ALL', view = 'EDIT', stack = [], batches = [], bsel = null, blines = null;
let sortK = 'code', sortD = 1, busy = false, loadedAt = '';
function clsName(c) { const x = CLS[c]; return x ? (ar() ? x.a : x.n) : c; }
function nm(it) { return it.n || it.a; }
function defU(it) { for (let i = 0; i < it.u.length; i++) { if (it.u[i][4] === 1) return it.u[i]; } return it.u[0]; }
function baseU(it) { for (let i = 0; i < it.u.length; i++) { if (it.u[i][2] === 1) return it.u[i]; } return it.u[0]; }
function pbOf(it) { const d = defU(it); return d[3] > 0 ? d[3] / d[2] : (baseU(it)[3] || 0); }
function badU(u, pb) { return pb > 0 && (!(u[3] > 0) || Math.abs(u[3] / u[2] - pb) > 0.00006); }
function offUnits(it) { const pb = pbOf(it); let n = 0; it.u.forEach(u => { if (badU(u, pb)) n++; }); return n; }
function ladder(it, np) { const d = defU(it), base = np / d[2]; return it.u.map(u => r4(base * u[2])); }
function mgCls(m) { return m < 0 ? 'mg-neg' : (m < 15 ? 'mg-low' : (m < 30 ? 'mg-mid' : 'mg-high')); }
function nEdits() { let n = 0; for (const k in edits) { if (edits[k]) n++; } return n; }
function nUnits() { let n = 0; for (const k in edits) { if (byCode[k]) n += byCode[k].u.length; } return n; }
function call(data, ok, fail) {
if (typeof apex === 'undefined' || !apex.server) { if (fail) fail('no APEX'); return; }
apex.server.process('PRICEADJ_AJAX', data, {
success: d => { if (d && d.error) { if (fail) fail(d.error); else note('bad', d.error); return; } ok(d); },
error: (jq, st, err) => { const m = (jq && jq.responseText ? String(jq.responseText).substring(0, 400) : '') || err || st; if (fail) fail(m); else note('bad', m); }
});
}
function loader(on, txt) { const l = $('tableLoader'); l.style.display = on ? 'block' : 'none'; l.textContent = T(txt || 'Loading...'); }
let noteMsg = null;
function note(kind, txt) { noteMsg = txt ? { k: kind, t: txt } : null; render(); }
function loadClass(c, after) {
cls = c; items = []; byCode = {}; edits = {}; draft = null; dirty = false; noteMsg = null;
if (!c) { render(); return; }
loader(true, 'Loading the class live from Co....');
$('tableBody').innerHTML = '';
call({ x01: 'items', x02: c }, d => {
loader(false);
items = (d.rows || []).map(r => ({ g: r[0], c: r[1], n: r[2], a: r[3], k: r[4], u: r[5] || [] })).filter(it => it.u.length);
items.forEach(it => { byCode[it.c] = it; });
if (d.draft) {
draft = { no: d.draft.no, saved: d.draft.saved, msg: d.draft.msg };
for (const k in d.draft.lines) { if (byCode[k]) edits[k] = d.draft.lines[k]; }
}
const t = new Date(), p = n => (n < 10 ? '0' : '') + n;
loadedAt = p(t.getHours()) + ':' + p(t.getMinutes());
render();
if (after) after();
}, e => { loader(true, 'The class could not be loaded: ' + e); });
}
function saveDraft(after) {
if (busy || !cls) return;
const f = { f01: [], f02: [], f03: [], f04: [], f05: [], f06: [], f07: [], f08: [], f09: [] };
for (const k in edits) {
const it = byCode[k], d = it ? defU(it) : null;
if (!it || !edits[k]) continue;
f.f01.push(String(it.g)); f.f02.push(it.c); f.f03.push(String(d[0])); f.f04.push(String(d[2]));
f.f05.push(d[3] == null ? '' : String(d[3])); f.f06.push(String(edits[k][0])); f.f07.push(it.k == null ? '' : String(it.k));
f.f08.push(edits[k][1] || 'MANUAL'); f.f09.push(it.n || it.a || '');
}
busy = true;
const data = { x01: 'save', x02: cls };
for (const k in f) { data[k] = f[k]; }
call(data, d => {
busy = false; dirty = false;
draft = d.no ? { no: d.no, saved: d.saved } : null;
render();
if (after) after();
}, e => { busy = false; note('bad', 'The draft was not saved: ' + e); });
}
function rowsOf(sh) {
const s = sh || show, qq = q.toLowerCase(), out = [];
items.forEach(it => {
if (qq && it.c.toLowerCase().indexOf(qq) === -1 && String(nm(it)).toLowerCase().indexOf(qq) === -1) return;
const d = defU(it), cur = d[3], e = edits[it.c], np = e ? e[0] : null, cost = it.k == null ? null : it.k * d[2];
const pr = np || cur, mg = cost != null && pr > 0 ? (pr - cost) / pr * 100 : null;
const r = { it: it, code: it.c, name: nm(it), unit: d[1], fac: d[2], cur: cur, np: np, chg: np && cur ? (np - cur) / cur * 100 : null,
cost: SEE ? cost : null, prof: SEE && cost != null && pr ? pr - cost : null, mg: SEE ? mg : null, off: offUnits(it) };
if (s === 'EDITED' && !np) return;
if (s === 'BELOW' && !(r.cost != null && pr < r.cost)) return;
if (s === 'LOW' && !(r.mg != null && r.mg < 15)) return;
if (s === 'FIX' && !r.off) return;
out.push(r);
});
return out;
}
function pills() {
const bar = $('showTabs');
if (view !== 'EDIT') { bar.innerHTML = ''; return; }
const t = [['ALL', 'All'], ['EDITED', 'Edited']];
if (SEE) t.push(['BELOW', 'Below cost'], ['LOW', 'Margin under 15%']);
t.push(['FIX', 'Unit price errors']);
bar.innerHTML = t.map(x => '<button type="button" class="lvl-btn' + (x[0] === show ? ' active' : '') + '" data-s="' + x[0] + '">' + T(x[1])
+ (cls ? '<span class="n">' + rowsOf(x[0]).length + '</span>' : '') + '</button>').join('')
;
bar.querySelectorAll('.lvl-btn').forEach(b => b.addEventListener('click', () => {
const s = b.getAttribute('data-s');
show = s; render();
}));
}
function renderEdit() {
const rows = rowsOf();
$('tableTitleText').textContent = cls ? T('Prices') + ' - ' + clsName(cls) : T('Price adjustment');
$('tableSub').innerHTML = cls ? rows.length + ' ' + T('items') + ' &middot; ' + T('new price on the default unit, the other units follow their factor (up to 4 decimals)')
+ (loadedAt ? ' &middot; ' + T('loaded') + ' ' + loadedAt : '') : T('Choose a class to load its items');
const cols = [['code', 'Code', 'c-code'], ['name', 'Item', ''], ['unit', 'Unit', 'c-unit'], ['cur', 'Current price', 'num'], ['np', 'New price', 'num'], ['chg', 'Change', 'num']];
if (SEE) cols.push(['cost', 'Avg cost', 'num cost'], ['prof', 'Profit', 'num cost'], ['mg', 'Margin % of new', 'num cost']);
$('tableHead').innerHTML = '<tr>' + cols.map(c => '<th class="' + c[2] + (sortK === c[0] ? ' sorted' + (sortD === 1 ? ' asc' : '') : '') + '" data-k="' + c[0] + '">' + T(c[1]) + '</th>').join('') + '</tr>';
if (!cls) { $('tableBody').innerHTML = '<tr><td class="pa-empty" colspan="' + cols.length + '">' + T('Choose a class to load its items (prices and cost are read live)') + '</td></tr>'; return; }
rows.sort((a, b) => {
let x = a[sortK], y = b[sortK];
if (x == null) x = sortD === 1 ? 1e15 : -1e15;
if (y == null) y = sortD === 1 ? 1e15 : -1e15;
return x === y ? 0 : (x < y ? -1 : 1) * sortD;
});
let body = '';
rows.forEach(r => {
const pr = r.np || r.cur;
body += '<tr class="' + (r.np ? 'edited' : '') + '"><td class="code">' + esc(r.code) + '</td><td class="nm">' + esc(r.name)
+ (r.off ? '<span class="flag fix" title="' + esc(T('unit prices are not the base price x factor; approval rewrites them')) + '">' + T('units fixed on approval') + '</span>' : '') + '</td>'
+ '<td>' + esc(r.unit) + '</td>'
+ '<td class="num">' + (r.cur == null ? '<span class="dash">&mdash;</span>' : fx(r.cur)) + '</td>'
+ '<td class="num"><input class="pa-box np" data-c="' + esc(r.code) + '" value="' + (r.np ? px(r.np) : '') + '" placeholder="' + (r.cur == null ? '' : px(r.cur)) + '" inputmode="decimal"></td>'
+ '<td class="num">' + (r.chg == null ? (r.np ? '<span class="chg eq">' + T('new') + '</span>' : '<span class="dash">&mdash;</span>') : '<span class="chg ' + (Math.abs(r.chg) < 0.05 ? 'eq' : (r.chg > 0 ? 'up' : 'dn')) + '">' + fp(r.chg) + '</span>') + '</td>';
if (SEE) {
body += r.cost == null
? '<td class="num"><span class="dash" title="' + esc(T('no balance in stock')) + '">' + T('no stock') + '</span></td><td class="num"><span class="dash">&mdash;</span></td><td class="num"><span class="dash">&mdash;</span></td>'
: '<td class="num">' + fx(r.cost) + '</td><td class="num' + (r.prof < 0 ? ' mg-neg' : '') + '">' + fx(r.prof) + '</td><td class="num ' + mgCls(r.mg) + '">' + r.mg.toFixed(1) + '%'
+ (pr < r.cost ? '<span class="flag low">' + T('below cost') + '</span>' : '') + '</td>';
}
body += '</tr>';
});
$('tableBody').innerHTML = body || '<tr><td class="pa-empty" colspan="' + cols.length + '">' + T('No item in this view') + '</td></tr>';
$('tableHead').querySelectorAll('th[data-k]').forEach(th => th.addEventListener('click', () => {
const k = th.getAttribute('data-k');
if (sortK === k) sortD = -sortD; else { sortK = k; sortD = k === 'code' || k === 'name' || k === 'unit' ? 1 : -1; }
render();
}));
$('tableBody').querySelectorAll('.np').forEach(inp => {
inp.addEventListener('change', () => setPrice(inp));
inp.addEventListener('keydown', e => {
if (e.key !== 'Enter' && e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
e.preventDefault();
const code = inp.getAttribute('data-c'), up = e.key === 'ArrowUp';
const all = $('tableBody').querySelectorAll('.np');
let j = 0;
for (; j < all.length; j++) { if (all[j] === inp) break; }
const nxt = all[up ? j - 1 : j + 1], nc = nxt ? nxt.getAttribute('data-c') : null;
setPrice(inp, true);
const tgt = nc ? $('tableBody').querySelector('.np[data-c="' + nc + '"]') : $('tableBody').querySelector('.np[data-c="' + code + '"]');
if (tgt) { tgt.focus(); tgt.select(); }
});
});
}
function setPrice(inp, quiet) {
const c = inp.getAttribute('data-c'), raw = String(inp.value).replace(/,/g, '').trim(), v = parseFloat(raw), old = edits[c] ? edits[c][0] : null;
let nv = null;
if (raw !== '' && v > 0) nv = r4(v);
if (nv === old) return;
if (nv) edits[c] = [nv, 'MANUAL']; else delete edits[c];
dirty = true;
if (quiet) { render(); return; }
setTimeout(() => {
const a = document.activeElement, ac = a && a.classList && a.classList.contains('np') ? a.getAttribute('data-c') : null;
render();
const t = ac ? $('tableBody').querySelector('.np[data-c="' + ac + '"]') : null;
if (t) { t.focus(); t.select(); }
}, 0);
}
function renderReview() {
$('tableTitleText').textContent = T('Review before approval');
$('tableSub').innerHTML = crumb([T('Price Adjustment'), T('Price change') + ' #' + (draft ? draft.no : ''), T('Review')]);
const sc = SEE;
$('tableHead').innerHTML = '<tr><th>' + T('Unit') + '</th><th class="num">' + T('Factor') + '</th><th class="num">' + T('Current price') + '</th><th class="num">' + T('New price') + '</th><th class="num">' + T('Change') + '</th>'
+ (sc ? '<th class="num cost">' + T('Avg cost') + '</th><th class="num cost">' + T('Margin %') + '</th>' : '') + '</tr>';
const span = sc ? 7 : 5;
let body = '', nIt = 0, nU = 0, nFix = 0;
const codes = Object.keys(edits).sort();
codes.forEach(k => {
const it = byCode[k];
if (!it || !edits[k]) return;
const nl = ladder(it, edits[k][0]), pb = pbOf(it);
nIt++;
if (offUnits(it)) nFix++;
body += '<tr class="item-head"><td colspan="' + span + '"><span class="code">' + esc(it.c) + '</span> &nbsp;' + esc(nm(it)) + (offUnits(it) ? '<span class="flag fix">' + T('units fixed') + '</span>' : '') + '</td></tr>';
it.u.forEach((u, i) => {
const cur = u[3], wrong = cur > 0 && badU(u, pb), cost = it.k == null ? null : it.k * u[2];
if (cur == null || Math.abs(cur - nl[i]) >= 0.0005) nU++;
body += '<tr><td class="' + (u[2] === 1 ? 'base' : '') + '">' + esc(u[1]) + (u[4] === 1 ? ' <span class="pa-st">' + T('default') + '</span>' : '') + (u[2] === 1 ? '<span class="pk">' + T('base') + '</span>' : '') + '</td>'
+ '<td class="num">' + u[2] + '</td><td class="num">' + (cur == null ? '<span class="dash">&mdash;</span>' : fx(cur)) + (wrong ? '<span class="flag fix" title="' + esc(T('by factor')) + ' ' + fx(pb * u[2]) + '">' + T('wrong') + '</span>' : '') + '</td>'
+ '<td class="num np-new">' + fx(nl[i]) + '</td>'
+ '<td class="num">' + (cur ? '<span class="chg ' + (Math.abs(nl[i] - cur) < 0.0005 ? 'eq' : (nl[i] > cur ? 'up' : 'dn')) + '">' + fp((nl[i] - cur) / cur * 100) + '</span>' : '<span class="chg eq">' + T('new') + '</span>') + '</td>'
+ (sc ? '<td class="num">' + (cost == null ? '&mdash;' : fx(cost)) + '</td><td class="num ' + (cost == null ? '' : mgCls((nl[i] - cost) / nl[i] * 100)) + '">' + (cost == null ? '&mdash;' : ((nl[i] - cost) / nl[i] * 100).toFixed(1) + '%') + '</td>' : '')
+ '</tr>';
});
});
const head = '<tr><td colspan="' + span + '" style="padding:0;border:none"><div class="pa-note' + (nFix ? ' warn' : '') + '"><b>' + nIt + ' ' + T('items') + ' &middot; ' + nU + ' ' + T('units') + '</b> '
+ T('will be written to Co.. The system triggers write the unit history and the change log themselves.')
+ (nFix ? '<br><b>' + nFix + ' ' + T('items') + '</b> ' + T('have unit prices that were not by factor; they are rewritten from the base unit.') : '')
+ '<br>' + T('An item whose price changed in Co. after this draft was saved is refused and stays as it is.') + '</div></td></tr>';
$('tableBody').innerHTML = head + body;
}
function openBatches() {
stack = []; view = 'BATCHES'; bsel = null; blines = null;
render();
loader(true);
call({ x01: 'batches' }, d => { loader(false); batches = d.rows || []; render(); }, e => loader(true, 'The changes log could not be loaded: ' + e));
}
const ST_CLS = { DRAFT: 'draft', APPLIED: 'applied', REVERSED: 'reversed', CANCELLED: 'cancelled' };
function stBadge(s) { return '<span class="pa-st ' + (ST_CLS[s] || '') + '">' + T(s) + '</span>'; }
function renderBatches() {
$('tableTitleText').textContent = T('Changes log');
$('tableSub').innerHTML = crumb([T('Price Adjustment'), T('Changes log')]) + ' &middot; ' + T('click a price change to see its units');
$('tableHead').innerHTML = '<tr><th>' + T('No.') + '</th><th>' + T('Class') + '</th><th>' + T('Status') + '</th><th>' + T('Created') + '</th><th class="num">' + T('Items') + '</th><th class="num">' + T('Units') + '</th><th class="num">' + T('Refused') + '</th><th>' + T('Approved') + '</th><th>' + T('Reversed') + '</th></tr>';
$('tableBody').innerHTML = batches.map((b, i) => (cls && String(b[2]) !== String(cls)) || (window.paIn && !window.paIn(b)) ? '' : '<tr class="drill-row" data-i="' + i + '"><td><span class="tw">&#9656;</span>#' + b[0] + '</td><td>' + esc(b[3] ? (ar() && CLS[b[2]] ? CLS[b[2]].a : b[3]) : b[2]) + '</td><td>' + stBadge(b[1]) + '</td>'
+ '<td>' + esc(b[4]) + ' <span class="pk">' + esc(b[5] || '') + '</span></td><td class="num">' + (b[11] == null ? '' : b[11]) + '</td><td class="num">' + (b[12] == null ? '' : b[12]) + '</td><td class="num">' + (b[13] ? b[13] : '') + '</td>'
+ '<td>' + (b[7] ? esc(b[7]) + ' <span class="pk">' + esc(b[8]) + '</span>' : '<span class="dash">&mdash;</span>') + '</td><td>' + (b[9] ? esc(b[9]) + ' <span class="pk">' + esc(b[10]) + '</span>' : '<span class="dash">&mdash;</span>') + '</td></tr>').join('')
|| '<tr><td class="pa-empty" colspan="9">' + T('No price change yet') + '</td></tr>';
$('tableBody').querySelectorAll('tr.drill-row').forEach(tr => tr.addEventListener('click', () => openBatch(batches[+tr.getAttribute('data-i')])));
}
function openBatch(b) {
if (!b) return;
stack.push({ view: 'BATCHES', show: show });
view = 'BLINES'; bsel = b; blines = null;
render();
loader(true);
call({ x01: 'lines', x02: b[0] }, d => { loader(false); blines = d; render(); }, e => loader(true, 'The price change could not be loaded: ' + e));
}
function renderBatchLines() {
const b = bsel;
$('tableTitleText').textContent = T('Price change') + ' #' + b[0];
$('tableSub').innerHTML = crumb([T('Price Adjustment'), T('Changes log'), '#' + b[0]]) + ' &middot; ' + esc(b[3] || '') + ' ' + stBadge(blines ? blines.status : b[1]);
if (!blines) { $('tableHead').innerHTML = ''; $('tableBody').innerHTML = ''; return; }
const rows = blines.rows || [], st = blines.status;
let note = b[14] && !noteMsg ? '<div class="pa-note' + (st === 'DRAFT' ? ' warn' : '') + '">' + esc(b[14]) + '</div>' : '';
if (st === 'DRAFT' || st === 'CANCELLED') {
$('tableHead').innerHTML = '<tr><th class="c-code">' + T('Code') + '</th><th>' + T('Item') + '</th><th class="num">' + T('Factor') + '</th><th class="num">' + T('Old price') + '</th><th class="num">' + T('New price') + '</th><th class="num">' + T('Change') + '</th><th>' + T('Source') + '</th></tr>';
$('tableBody').innerHTML = (note ? '<tr><td colspan="7" style="padding:0;border:none">' + note + '</td></tr>' : '') + rows.map(r => '<tr><td class="code">' + esc(r[0]) + '</td><td class="nm">' + esc(r[1]) + '</td><td class="num">' + r[3] + '</td><td class="num">' + fx(r[4]) + '</td><td class="num np-new">' + fx(r[5]) + '</td>'
+ '<td class="num">' + (r[4] ? '<span class="chg ' + (r[5] > r[4] ? 'up' : (r[5] < r[4] ? 'dn' : 'eq')) + '">' + fp((r[5] - r[4]) / r[4] * 100) + '</span>' : '') + '</td><td>' + T(r[7] || '') + '</td></tr>').join('');
return;
}
const RES = { WRITTEN: 'flag ok', REVERSED: 'flag info', SAME: 'flag info', REFUSED: 'flag low' };
$('tableHead').innerHTML = '<tr><th class="c-code">' + T('Code') + '</th><th>' + T('Item') + '</th><th class="c-unit">' + T('Unit') + '</th><th class="num">' + T('Factor') + '</th><th class="num">' + T('Old price') + '</th><th class="num">' + T('New price') + '</th><th class="num">' + T('Change') + '</th><th>' + T('Result') + '</th></tr>';
let last = '';
$('tableBody').innerHTML = (note ? '<tr><td colspan="8" style="padding:0;border:none">' + note + '</td></tr>' : '') + rows.map(r => {
const same = r[0] === last;
last = r[0];
return '<tr><td class="code">' + (same ? '' : esc(r[0])) + '</td><td class="nm">' + (same ? '' : esc(r[1])) + '</td><td>' + esc(r[2]) + '</td><td class="num">' + (r[3] == null ? '' : r[3]) + '</td>'
+ '<td class="num">' + (r[4] == null ? '<span class="dash">&mdash;</span>' : fx(r[4])) + '</td><td class="num">' + (r[5] == null ? '<span class="dash">&mdash;</span>' : fx(r[5])) + '</td>'
+ '<td class="num">' + (r[4] && r[5] != null ? '<span class="chg ' + (r[5] > r[4] ? 'up' : (r[5] < r[4] ? 'dn' : 'eq')) + '">' + fp((r[5] - r[4]) / r[4] * 100) + '</span>' : '') + '</td>'
+ '<td><span class="' + (RES[r[6]] || 'flag info') + '">' + T(r[6] || '') + '</span>' + (r[7] ? ' <span class="pk">' + esc(r[7]) + '</span>' : '') + '</td></tr>';
}).join('');
}
function crumb(p) { return p.map((x, i) => '<span class="crumb' + (i === p.length - 1 ? ' crumb-last' : '') + '">' + esc(x) + '</span>').join('<span class="crumb-sep">' + SEP + '</span>'); }
function renderBar() {
const n = nEdits();
$('batchCard').style.display = view === 'BATCHES' || view === 'BLINES' ? 'none' : '';
$('bNo').textContent = draft ? '#' + draft.no : T('new');
$('bMeta').innerHTML = cls ? '<b>' + n + '</b> ' + T('items edited') + ' &middot; <b>' + nUnits() + '</b> ' + T('units will change')
+ (draft && draft.saved ? ' &middot; ' + T('saved') + ' ' + esc(draft.saved) : '') + (dirty ? ' &middot; <span class="dirty">' + T('unsaved changes') + '</span>' : '') : '';
const rev = view === 'REVIEW';
$('bulkBtn').style.display = rev ? 'none' : ''; $('pasteBtn').style.display = rev ? 'none' : ''; $('saveBtn').style.display = rev ? 'none' : '';
$('bulkBtn').disabled = !cls || !items.length; $('pasteBtn').disabled = !cls || !items.length;
$('saveBtn').disabled = !cls || (!dirty && !(draft && !n));
$('approveBtn').textContent = T(rev ? 'Confirm & apply to Co.' : 'Review & approve');
$('approveBtn').disabled = !n || busy;
$('clearBtn').style.display = view === 'EDIT' && cls ? '' : 'none';
$('clearBtn').disabled = !n || busy;
const box = $('actBox');
box.innerHTML = '';
if (view === 'BLINES' && blines) {
if (blines.status === 'APPLIED') box.innerHTML = '<button type="button" class="pa-btn act" id="revBtn">' + T('Reverse this change') + '</button>';
if (blines.status === 'DRAFT') box.innerHTML = '<button type="button" class="pa-btn quiet" id="canBtn">' + T('Cancel draft') + '</button>';
const rb = $('revBtn'), cb = $('canBtn');
if (rb) rb.addEventListener('click', confirmReverse);
if (cb) cb.addEventListener('click', confirmCancel);
}
$('periodBadge').textContent = cls ? clsName(cls) : T('Choose a class');
}
function render() {
$('backBtn').style.display = stack.length ? '' : 'none';
const lg = view === 'BATCHES' || view === 'BLINES';
$('viewBox').querySelectorAll('.vbtn').forEach(b => b.classList.toggle('on', (b.getAttribute('data-v') === 'LOG') === lg));
pills();
renderBar();
if (view === 'REVIEW') renderReview();
else if (view === 'BATCHES') renderBatches();
else if (view === 'BLINES') renderBatchLines();
else renderEdit();
if (noteMsg) {
const cols = $('tableHead').querySelectorAll('tr:first-child th').length || 1;
$('tableBody').insertAdjacentHTML('afterbegin', '<tr><td colspan="' + cols + '" style="padding:0;border:none"><div class="pa-note ' + (noteMsg.k === 'bad' ? 'bad' : '') + '">' + esc(noteMsg.t) + '</div></td></tr>');
}
}
function dlg(html, wire) {
$('paDlg').innerHTML = html;
$('paMask').className = 'pa-mask open';
const close = () => { $('paMask').className = 'pa-mask'; };
$('paDlg').querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', close));
if (wire) wire(close);
}
$('paMask').addEventListener('click', e => { if (e.target === $('paMask')) $('paMask').className = 'pa-mask'; });
document.addEventListener('keydown', e => { if (e.key === 'Escape') $('paMask').className = 'pa-mask'; });
const api = { $: $, T: T, esc: esc, r4: r4, dlg: dlg, rows: () => rowsOf(), edits: () => edits, byCode: () => byCode,
changed: s => { dirty = true; if (s) show = s; render(); }, cls: () => cls, pick: (c, ic) => pickClass(c, ic), call: call, clsName: clsName };
$('bulkBtn').addEventListener('click', () => window.paBulk(api));
$('pasteBtn').addEventListener('click', () => window.paPaste(api));
$('saveBtn').addEventListener('click', () => saveDraft());
$('viewBox').querySelectorAll('.vbtn').forEach(b => b.addEventListener('click', () => {
if (b.getAttribute('data-v') === 'LOG') { openBatches(); return; }
stack = []; view = 'EDIT'; noteMsg = null; render();
}));
$('clearBtn').addEventListener('click', () => {
dlg('<h4>' + T('Clear the edited prices?') + '</h4><p>' + T('Every new price of this class is removed') + (draft ? ' ' + T('and the saved draft is emptied') : '') + '.</p>'
+ '<div class="pa-row"><button type="button" class="pa-btn quiet" data-close>' + T('Cancel') + '</button><button type="button" class="pa-btn act" id="dYes">' + T('Clear') + '</button></div>', close => {
$('dYes').addEventListener('click', () => { close(); edits = {}; if (draft) { dirty = true; saveDraft(); } else { dirty = false; render(); } });
});
});
$('approveBtn').addEventListener('click', () => {
if (view === 'REVIEW') { confirmApply(); return; }
const go = () => { stack.push({ view: 'EDIT', show: show }); view = 'REVIEW'; render(); };
if (dirty || !draft) saveDraft(go); else go();
});
function confirmApply() {
if (!draft) return;
dlg('<h4>' + T('Apply price change') + ' #' + draft.no + ' ' + T('to Co.?') + '</h4><p>' + T('The new prices are written to every unit of the items in this price change. The item card in Co. changes at once (sales screens and mobile salesmen).') + '</p>'
+ '<p>' + T('A copy of the current prices is kept with the price change, so it can be reversed.') + '</p>'
+ '<div class="pa-row"><button type="button" class="pa-btn quiet" data-close>' + T('Cancel') + '</button><button type="button" class="pa-btn act fill" id="dYes">' + T('Apply now') + '</button></div>', close => {
$('dYes').addEventListener('click', () => {
close();
busy = true; render(); loader(true, 'Writing to Co....');
const no = draft.no;
call({ x01: 'apply', x02: no }, d => {
busy = false; loader(false);
afterAction(no, d);
}, e => { busy = false; loader(false); note('bad', e); });
});
});
}
function confirmReverse() {
const no = bsel[0];
dlg('<h4>' + T('Reverse this change') + ' #' + no + '?</h4><p>' + T('Every item written by this price change goes back to its price before approval, unless its price was changed in Co. after approval.') + '</p>'
+ '<div class="pa-row"><button type="button" class="pa-btn quiet" data-close>' + T('Cancel') + '</button><button type="button" class="pa-btn act fill" id="dYes">' + T('Reverse now') + '</button></div>', close => {
$('dYes').addEventListener('click', () => { close(); loader(true, 'Writing to Co....'); call({ x01: 'reverse', x02: no }, d => { loader(false); afterAction(no, d); }, e => { loader(false); note('bad', e); }); });
});
}
function confirmCancel() {
const no = bsel[0];
dlg('<h4>' + T('Cancel draft') + ' #' + no + '?</h4><p>' + T('Nothing was written to Co.; the draft is kept in the changes log as cancelled.') + '</p>'
+ '<div class="pa-row"><button type="button" class="pa-btn quiet" data-close>' + T('Close') + '</button><button type="button" class="pa-btn act" id="dYes">' + T('Cancel draft') + '</button></div>', close => {
$('dYes').addEventListener('click', () => { close(); call({ x01: 'cancel', x02: no }, d => afterAction(no, d)); });
});
}
function afterAction(no, d) {
call({ x01: 'batches' }, b => {
batches = b.rows || [];
let row = null;
batches.forEach(x => { if (x[0] === no) row = x; });
stack = [{ view: 'BATCHES', show: 'ALL' }];
view = 'BLINES'; bsel = row || [no, '', '', '', '', '', '', '', '', '', '', null, null, null, d.msg];
if (row && !d.ok) row[14] = d.msg;
blines = null;
noteMsg = { k: d.ok ? 'ok' : 'bad', t: d.msg };
render();
call({ x01: 'lines', x02: no }, l => { blines = l; render(); });
if (cls) {
const keep = cls;
call({ x01: 'items', x02: keep }, x => {
items = (x.rows || []).map(r => ({ g: r[0], c: r[1], n: r[2], a: r[3], k: r[4], u: r[5] || [] })).filter(it => it.u.length);
byCode = {}; items.forEach(it => { byCode[it.c] = it; });
edits = {}; draft = null; dirty = false;
if (x.draft) { draft = { no: x.draft.no, saved: x.draft.saved }; for (const k in x.draft.lines) { if (byCode[k]) edits[k] = x.draft.lines[k]; } }
});
}
});
}
$('backBtn').addEventListener('click', () => {
const s = stack.pop();
if (!s) return;
view = s.view; show = s.show || 'ALL'; noteMsg = null;
if (view === 'BATCHES') { bsel = null; blines = null; }
render();
});
const cBtn = $('clsBtn'), cIn = $('clsInput'), cMenu = $('clsMenu'), cList = $('clsList');
let hov = -1;
function clsList() {
const t = cIn.value.toLowerCase().trim(), out = [];
D.classes.forEach(c => { const n = ar() ? c[2] : c[1]; if (!t || c[0].indexOf(t) === 0 || String(n).toLowerCase().indexOf(t) !== -1) out.push(c); });
cList.innerHTML = out.length ? out.map(c => '<div class="ss-option" data-c="' + esc(c[0]) + '"><span class="ss-code">' + esc(c[0]) + '</span><span class="ss-n">' + esc(ar() ? c[2] : c[1]) + '</span></div>').join('')
: '<div class="ss-empty">' + T('No matching class') + '</div>';
hov = -1;
}
function openCls(o) {
cMenu.classList.toggle('open', o); cBtn.classList.toggle('open', o);
if (o) { placeCls(); cIn.value = ''; clsList(); cIn.focus(); }
}
function placeCls() {
const r = cBtn.getBoundingClientRect(), below = window.innerHeight - r.bottom - 12, above = r.top - 12, up = below < 220 && above > below;
cMenu.style.width = r.width + 'px';
cMenu.style.left = r.left + 'px';
cMenu.style.maxHeight = Math.min(360, up ? above : below) + 'px';
cMenu.style.top = up ? 'auto' : (r.bottom + 4) + 'px';
cMenu.style.bottom = up ? (window.innerHeight - r.top + 4) + 'px' : 'auto';
}
function setLbl() { $('clsLbl').textContent = cls ? cls + ' - ' + clsName(cls) : T('Choose a class'); cBtn.classList.toggle('picked', !!cls); }
function pickClass(c, ic) {
openCls(false);
if (c === cls) { if (ic) { stack = []; view = 'EDIT'; show = 'ALL'; q = ic; $('itemInput').value = ic; render(); } return; }
stack = []; view = 'EDIT'; show = 'ALL'; q = ic || ''; $('itemInput').value = q;
const go = () => { loadClass(c); setLbl(); };
if (!(dirty && cls)) { go(); return; }
dlg('<h4>' + T('Unsaved changes') + '</h4><p>' + T('The prices edited in this class are not saved yet.') + '</p>'
+ '<div class="pa-row"><button type="button" class="pa-btn quiet" data-close>' + T('Cancel') + '</button><button type="button" class="pa-btn quiet" id="dNo">' + T('Discard') + '</button>'
+ '<button type="button" class="pa-btn" id="dYes">' + T('Save draft') + '</button></div>', close => {
$('dNo').addEventListener('click', () => { close(); dirty = false; go(); });
$('dYes').addEventListener('click', () => { close(); saveDraft(go); });
});
}
cBtn.addEventListener('click', () => openCls(!cMenu.classList.contains('open')));
cIn.addEventListener('input', clsList);
cIn.addEventListener('keydown', e => {
const opts = cList.querySelectorAll('.ss-option');
if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
e.preventDefault();
if (!opts.length) return;
hov = e.key === 'ArrowDown' ? Math.min(hov + 1, opts.length - 1) : Math.max(hov - 1, 0);
opts.forEach(o => o.classList.remove('active'));
opts[hov].classList.add('active');
opts[hov].scrollIntoView({ block: 'nearest' });
} else if (e.key === 'Enter') {
e.preventDefault();
const o = hov >= 0 ? opts[hov] : opts[0];
if (o) pickClass(o.getAttribute('data-c'));
} else if (e.key === 'Escape') {
openCls(false); cBtn.focus();
}
});
cList.addEventListener('click', e => { const o = e.target.closest('.ss-option'); if (o) pickClass(o.getAttribute('data-c')); });
document.addEventListener('click', e => { if (!e.target.closest('#clsBox')) openCls(false); });
['scroll', 'resize'].forEach(ev => window.addEventListener(ev, e => { if (cMenu.classList.contains('open') && !(e.target && e.target.closest && e.target.closest('#clsMenu'))) placeCls(); }, true));
$('itemInput').addEventListener('input', () => { q = $('itemInput').value.trim(); if (view === 'EDIT') render(); });
$('resetBtn').addEventListener('click', () => {
dirty = false; q = ''; $('itemInput').value = ''; stack = []; view = 'EDIT'; show = 'ALL'; sortK = 'code'; sortD = 1; loadClass(''); setLbl();
});
window.addEventListener('beforeunload', e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });
function viewTitle() { return $('tableTitleText').textContent; }
function grpTxt() { const s = $('jmHdrGroup'), e = document.querySelector('.jm-hdr-grp'), g = s && s.selectedIndex >= 0 ? s.options[s.selectedIndex].text : (e ? e.textContent : ''); return g && g.trim() ? ' - Data group: ' + g.trim() : ''; }
function stamp() { const t = new Date(), p = n => (n < 10 ? '0' : '') + n; return t.getFullYear() + '-' + p(t.getMonth() + 1) + '-' + p(t.getDate()); }
function excel() {
window.paExcel({ view: view, blines: blines, see: SEE, rows: view === 'EDIT' ? rowsOf() : [],
info: viewTitle() + ' - ' + (cls ? clsName(cls) : '') + ' - ' + stamp() + grpTxt(),
file: 'Price_Adjustment_' + (view === 'BLINES' ? 'Change_' + bsel[0] : cls) + '_' + stamp() + '.xlsx' });
}
function printTable() {
window.paPrintNow({ view: view, blines: blines, bsel: bsel, cls: cls, clsName: cls ? clsName(cls) : '', draftNo: draft ? draft.no : null,
title: viewTitle(), stamp: stamp(), T: T, esc: esc, fx: fx, render: render });
}
if (window.paFind) window.paFind(api);
if ($('exportBox') && window.jmExport) window.jmExport.attach($('exportBox'), { pdf: printTable, excel: window.svXlsx ? excel : null });
render();
}
initPriceAdj();

});
