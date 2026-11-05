window.addEventListener("DOMContentLoaded",function(){
(function () {
const el = document.getElementById('trf-data');
if (!el) return;
const DATA = JSON.parse(el.textContent);
const SEP = String.fromCharCode(8250);
const CHK_TXT = { R: 'Receipt kept but issue deleted', I: 'Transfer cancelled but issue kept', A: 'Received but shown as pending', B: 'Shown as received without receipt',
D: 'Received or issued twice', G: 'Movement without a transfer', C: 'Not received after 30 days', N: 'Transfer with no goods moved' };
function parse(a) {
return { serial: a[0], from: a[1], to: a[2], date: a[3], hrecv: a[4], doc: a[5], appr: +a[6], iss: a[7], rec: a[8], recDate: a[9],
nIss: +a[10], nRec: +a[11], nLines: +a[12], nDiff: +a[13], status: a[14], flag: a[15] || '' };
}
const OPEN = DATA.rows.map(parse);
const OPEN_KEYS = {};
OPEN.forEach(r => { OPEN_KEYS[r.serial + '|' + r.from + '|' + r.to] = 1; });
let STORES = DATA.stores;
let ARCH = null, archRange = null;
let view = 'OPEN', level = 'STORE', curStore = null, curRow = null, curLines = null, curDoc = null, busy = false;
const stack = [];
const fFrom = document.getElementById('fFrom'), fTo = document.getElementById('fTo'), fSrc = document.getElementById('fSrc'), fDst = document.getElementById('fDst');
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]); }
function dmy(s) { return s ? s.substring(8, 10) + '/' + s.substring(5, 7) + '/' + s.substring(0, 4) : ''; }
function days(a, b) { return a ? Math.round((Date.parse(b || DATA.today) - Date.parse(a)) / 864e5) : ''; }
function storeName(c) { const s = STORES[c]; return s ? (window.JM_LANG === 'AR' && s[2] ? s[2] : s[0]) : c; }
function storeBr(c) { const s = STORES[c]; return s ? s[1] : ''; }
function dash() { return '<span class="muted-dash">&mdash;</span>'; }
function fmt(n) { return (+n || 0).toLocaleString('en-US'); }
function monthStart() { return DATA.today.substring(0, 8) + '01'; }
function statusPill(r) { return r.status === 'O' ? '<span class="pill open">Open</span>' : '<span class="pill closed">Closed</span>'; }
function matchPill(r) {
let h = r.status === 'O' ? '<span class="pill wait">Waiting</span>' : r.status === 'D' ? '<span class="pill bad">Not matched</span>' : '<span class="pill ok">Matched</span>';
if (r.flag) h += '<span class="pill warn" title="' + esc(r.flag.split('').map(c => CHK_TXT[c] || c).join(' / ')) + '">! Integrity</span>';
return h;
}
function base() {
const list = view === 'OPEN' ? OPEN : (ARCH || []).filter(r => !OPEN_KEYS[r.serial + '|' + r.from + '|' + r.to]);
const a = fFrom.value, b = fTo.value, s = fSrc.value, t = fDst.value;
return list.filter(r => (!a || r.date >= a) && (!b || r.date <= b) && (!s || r.from === s) && (!t || r.to === t));
}
function fillStores() {
const keep = [fSrc.value, fDst.value], list = view === 'OPEN' ? OPEN : (ARCH || []), src = {}, dst = {};
list.forEach(r => { src[r.from] = 1; dst[r.to] = 1; });
[[fSrc, src, keep[0]], [fDst, dst, keep[1]]].forEach(x => {
const codes = Object.keys(x[1]).sort((p, q) => storeName(p).localeCompare(storeName(q)));
x[0].innerHTML = '<option value="">All stores</option>' + codes.map(c => '<option value="' + c + '">' + esc(storeName(c)) + '</option>').join('');
x[0].value = x[1][x[2]] ? x[2] : '';
});
}
function storeLevel() {
const g = {};
base().forEach(r => {
if (!g[r.from]) g[r.from] = { store: r.from, n: 0, o: 0, d: 0, f: 0, old: 0, dsum: 0, dn: 0 };
const x = g[r.from];
x.n++;
if (r.status === 'O') { x.o++; x.old = Math.max(x.old, days(r.date)); }
if (r.status === 'D') x.d++;
if (r.flag) x.f++;
if (r.recDate) { x.dsum += days(r.date, r.recDate); x.dn++; }
});
const BR = { CEN: 1, WST: 2, EST: 3, NTH: 4, DHB: 5 }, br = c => BR[storeBr(c)] || 9;
const list = Object.keys(g).map(k => g[k]).sort((a, b) => br(a.store) - br(b.store) || b.n - a.n);
const sum = k => list.reduce((a, x) => a + x[k], 0);
if (view === 'OPEN') {
return { title: 'Open transfers by issuing store', drill: true,
cols: [['Issuing store', 0], ['Branch', 0], ['Transfers', 1], ['Not received', 1], ['Not matched', 1], ['Longest wait (days)', 1]],
rows: list.map(x => ({ key: x.store, cells: [storeName(x.store), storeBr(x.store), x.n, x.o, x.d, x.o ? x.old : ''], tone: { 3: x.o ? 'tn-wait' : '', 4: x.d ? 'tn-risk' : '', 5: x.old > 30 ? 'tn-risk' : '' } })),
total: ['TOTAL', '', sum('n'), sum('o'), sum('d'), ''] };
}
return { title: 'Archived transfers by issuing store', drill: true,
cols: [['Issuing store', 0], ['Branch', 0], ['Transfers', 1], ['Avg days to receive', 1]],
rows: list.map(x => ({ key: x.store, cells: [storeName(x.store), storeBr(x.store), x.n, x.dn ? (x.dsum / x.dn).toFixed(1) : ''] })),
total: ['TOTAL', '', sum('n'), ''] };
}
function trfLevel() {
const list = base().filter(r => r.from === curStore).sort((a, b) => (b.date || '').localeCompare(a.date || '') || (+b.serial - +a.serial));
return { title: 'Transfers', drill: true,
cols: [['Transfer', 0], ['Issue date', 0], ['To store', 0], ['Issue movement', 0], ['Status', 0], ['Receipt movement', 0], ['Received', 0], ['Days', 1], ['Match', 0]],
rows: list.map(r => ({ key: r, cells: [r.serial, dmy(r.date), storeName(r.to), r.iss, statusPill(r), r.rec, dmy(r.recDate), days(r.date, r.recDate), matchPill(r)],
html: [4, 8], mv: [3, 5] })),
total: null };
}
function unitDiff(l) {
const f = l[7] ? l[4] / l[7] : (l[9] ? l[5] / l[9] : 1), v = (l[5] - l[4]) / (f || 1);
return Math.round(v * 1000) / 1000;
}
function lineLevel() {
const L = curLines || [];
return { title: 'Issued against received', drill: false,
cols: [['Item', 0], ['Description', 0], ['Lot', 0], ['Exp', 0], ['Issue unit', 0], ['Issued', 1], ['Receipt unit', 0], ['Received', 1], ['Difference', 1]],
rows: L.map(l => ({ cells: [l[0], l[1], l[2], l[3], l[6] || '', l[6] ? l[7] : '', l[8] || '', l[8] ? l[9] : '', unitDiff(l)], diff: l[5] !== l[4] })),
total: null };
}
function docLevel() {
return { title: 'Document lines', drill: false,
cols: [['#', 1], ['Item', 0], ['Description', 0], ['Lot', 0], ['Exp', 0], ['Unit', 0], ['Qty', 1], ['Bonus', 1]],
rows: curDoc.lines.map(l => ({ cells: [l[0], l[1], l[2], l[4], l[5], l[6], l[7], l[9]] })),
total: curDoc.lines.length ? ['TOTAL', '', '', '', '', '', curDoc.lines.reduce((a, l) => a + (+l[7] || 0), 0), curDoc.lines.reduce((a, l) => a + (+l[9] || 0), 0)] : null };
}
function current() { return level === 'STORE' ? storeLevel() : level === 'TRF' ? trfLevel() : level === 'LINES' ? lineLevel() : docLevel(); }
function crumbParts() {
const p = [view === 'OPEN' ? 'Open transfers' : 'Archive'];
if (curStore !== null) p.push(storeName(curStore));
if (curRow && (level === 'LINES' || level === 'DOC')) p.push('Transfer ' + curRow.serial);
if (level === 'DOC' && curDoc) p.push(curDoc.h.tc + '/' + curDoc.h.ser);
return p;
}
function crumbText() { return crumbParts().join(' ' + SEP + ' '); }
function crumbHtml() {
const p = crumbParts();
return p.map((x, i) => '<span class="crumb' + (i === p.length - 1 ? ' crumb-last' : '') + '">' + esc(x) + '</span>').join('<span class="crumb-sep">' + SEP + '</span>');
}
function kv(k, v) { return v ? '<span class="tc-kv"><b>' + k + '</b> <bdi>' + esc(v) + '</bdi></span>' : ''; }
function subExtra() {
if (level === 'LINES' && curRow) return '<div class="tc-doc">' + kv('Issue movement', curRow.iss) + kv('Issue date', dmy(curRow.date)) + kv('Receipt movement', curRow.rec) +
kv('Receipt date', dmy(curRow.recDate)) + kv('From', storeName(curRow.from)) + kv('To', storeName(curRow.to)) + '</div>';
if (level === 'DOC' && curDoc) {
const h = curDoc.h;
return '<div class="tc-doc">' + kv('Type', h.tn) + kv('Movement', h.tc + '/' + h.ser) + kv('Date', h.dt) + kv('From', h.xf) + kv('To', h.xt) + kv('Posted', h.post ? 'Yes' : 'No') + kv('Note', h.dsc) + '</div>';
}
return '';
}
let last = null;
function cell(t, r, j) {
const v = r.cells[j], num = t.cols[j][1];
if (v === '' || v == null) return '<td' + (num ? ' class="num"' : '') + '>' + dash() + '</td>';
if (r.html && r.html.indexOf(j) !== -1) return '<td>' + v + '</td>';
if (r.mv && r.mv.indexOf(j) !== -1) return '<td><a class="mv" data-ref="' + esc(v) + '">' + esc(v) + '</a></td>';
if ((level === 'LINES' && j === 0) || (level === 'DOC' && j === 1)) return '<td><span class="code">' + esc(v) + '</span></td>';
if (r.tone && r.tone[j]) return '<td class="num"><span class="tn ' + r.tone[j] + '">' + fmt(v) + '</span></td>';
if (level === 'LINES' && j === 8 && r.diff) return '<td class="num"><span class="diff">' + fmt(v) + '</span></td>';
return '<td' + (num ? ' class="num"' : '') + '>' + esc(num ? fmt(v) : v) + '</td>';
}
function render() {
const t = current();
last = t;
document.getElementById('tableHead').innerHTML = '<tr class="print-title-row"><th colspan="' + t.cols.length + '">' + esc(printTitle()) + '</th></tr><tr>' + t.cols.map(c => '<th' + (c[1] ? ' class="num"' : '') + '>' + c[0] + '</th>').join('') + '</tr>';
let body = t.rows.map((r, i) => '<tr class="' + (t.drill ? 'drill-row' : '') + '" data-i="' + i + '">' +
r.cells.map((v, j) => { const c = cell(t, r, j); return j === 0 && t.drill ? c.replace(/^<td>/, '<td><span class="tw">&#9656;</span> ') : c; }).join('') + '</tr>').join('');
if (!t.rows.length) body = '<tr><td colspan="' + t.cols.length + '" style="text-align:center;padding:28px;color:var(--muted)">' +
(view === 'OPEN' ? 'No open transfers' : 'No archived transfers in this period') + '</td></tr>';
if (t.total && t.rows.length) body += '<tr class="total-row">' + t.total.map((v, j) => '<td' + (t.cols[j][1] ? ' class="num"' : '') + '>' + esc(t.cols[j][1] && v !== '' ? fmt(v) : v) + '</td>').join('') + '</tr>';
document.getElementById('tableBody').innerHTML = body;
document.getElementById('tableTitleText').textContent = t.title;
document.getElementById('tableSub').innerHTML = crumbHtml() + ' &mdash; <span>' + t.rows.length + ' rows</span>' + subExtra();
document.getElementById('backBtn').style.display = stack.length ? '' : 'none';
document.getElementById('periodBadge').textContent = view === 'OPEN' ? 'Open transfers' : dmy(fFrom.value) + ' - ' + dmy(fTo.value);
buildPrintFilters();
document.querySelectorAll('#tableBody a.mv').forEach(a => a.addEventListener('click', e => { e.stopPropagation(); openDoc(a.getAttribute('data-ref')); }));
document.querySelectorAll('#tableBody tr.drill-row').forEach(tr => tr.addEventListener('click', () => {
const r = t.rows[+tr.getAttribute('data-i')];
if (level === 'STORE') { stack.push(state()); curStore = r.key; level = 'TRF'; render(); }
else if (level === 'TRF') openLines(r.key);
}));
}
function state() { return { level: level, curStore: curStore, curRow: curRow, curLines: curLines, curDoc: curDoc }; }
function goBack() {
const s = stack.pop();
if (!s) return;
level = s.level; curStore = s.curStore; curRow = s.curRow; curLines = s.curLines; curDoc = s.curDoc;
render();
}
function home() { stack.length = 0; level = 'STORE'; curStore = null; curRow = null; curLines = null; curDoc = null; render(); }
document.getElementById('backBtn').addEventListener('click', goBack);
function call(proc, data, ok) {
if (busy || typeof apex === 'undefined' || !apex.server) return;
busy = true;
document.getElementById('tableLoader').style.display = '';
apex.server.process(proc, data, {
success: function (d) { busy = false; document.getElementById('tableLoader').style.display = 'none'; if (!d || d.error) { alert('Could not load the data.'); return; } ok(d); },
error: function () { busy = false; document.getElementById('tableLoader').style.display = 'none'; alert('Could not load the data.'); }
});
}
function openLines(r) {
call('TRFREG_AJAX', { x01: 'lines', x02: r.serial, x05: r.from, x06: r.to }, d => {
stack.push(state()); curRow = r; curLines = d.lines; level = 'LINES'; render();
});
}
function openDoc(ref) {
const p = String(ref).split('/');
call('ITCARD_AJAX', { x01: 'doc', x02: p[0], x05: p[1] }, d => {
if (!d.h) { alert('Could not load the document.'); return; }
stack.push(state()); curDoc = d; level = 'DOC'; render();
});
}
function loadArchive() {
if (!fFrom.value) fFrom.value = monthStart();
if (!fTo.value) fTo.value = DATA.today;
const key = fFrom.value + '|' + fTo.value;
if (ARCH && archRange === key) { fillStores(); home(); return; }
call('TRFREG_AJAX', { x01: 'arch', x03: fFrom.value, x04: fTo.value }, d => {
ARCH = d.rows.map(parse); archRange = d.from + '|' + d.to;
fFrom.value = d.from; fTo.value = d.to;
Object.keys(d.stores).forEach(k => { STORES[k] = d.stores[k]; });
fillStores(); home();
});
}
document.querySelectorAll('#viewTabs .lvl-btn').forEach(b => b.addEventListener('click', () => {
if (b.classList.contains('active')) return;
document.querySelectorAll('#viewTabs .lvl-btn').forEach(x => x.classList.toggle('active', x === b));
view = b.getAttribute('data-v');
document.getElementById('trFilters').classList.toggle('is-open', view === 'OPEN');
if (view === 'ARCH') { loadArchive(); } else { fFrom.value = ''; fTo.value = ''; fillStores(); home(); }
}));
[fFrom, fTo].forEach(i => i.addEventListener('change', () => { if (view === 'ARCH') loadArchive(); else home(); }));
[fSrc, fDst].forEach(i => i.addEventListener('change', home));
document.getElementById('resetBtn').addEventListener('click', () => {
fSrc.value = ''; fDst.value = '';
if (view === 'ARCH') { fFrom.value = monthStart(); fTo.value = DATA.today; loadArchive(); } else { fFrom.value = ''; fTo.value = ''; home(); }
});
(function () {
const bar = document.getElementById('alertBar');
if (!DATA.integ) return;
const inst = document.getElementById('pInstance');
bar.innerHTML = '<span class="sev"></span><span><b>' + DATA.integ + ' broken transfers</b> found by the integrity checks</span>' +
'<a href="' + (inst ? 'f?p=Co.:TRFCHK:' + inst.value : 'trfchk.html') + '">Open Transfer Integrity ' + SEP + '</a>';
bar.style.display = '';
}());
function nowTxt() {
const d = new Date(), p = n => (n < 10 ? '0' : '') + n;
return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
}
function printTitle() { return 'Co. Dashboard | Transfer Register - ' + crumbText() + ' | ' + document.getElementById('periodBadge').textContent + ' | Printed ' + nowTxt(); }
function buildPrintFilters() {
const box = document.getElementById('printFilters'), p = [];
if (!box) return;
p.push('<b>View:</b> ' + esc(view === 'OPEN' ? 'Open transfers' : 'Archive'));
if (fFrom.value || fTo.value) p.push('<b>Issue date:</b> ' + esc(dmy(fFrom.value) + ' - ' + dmy(fTo.value)));
if (fSrc.value) p.push('<b>From store:</b> ' + esc(storeName(fSrc.value)));
if (fDst.value) p.push('<b>To store:</b> ' + esc(storeName(fDst.value)));
if (level === 'LINES' && curRow) {
p.push('<b>Issue movement:</b> ' + esc((curRow.iss || '') + ' ' + dmy(curRow.date)));
if (curRow.rec) p.push('<b>Receipt movement:</b> ' + esc(curRow.rec + ' ' + dmy(curRow.recDate)));
p.push('<b>From:</b> ' + esc(storeName(curRow.from)), '<b>To:</b> ' + esc(storeName(curRow.to)));
}
p.push('<b>Scope:</b> ' + esc(crumbText()));
box.innerHTML = p.join('<span class="pf-sep">|</span>');
}
function printTable() {
const th = document.querySelector('#printTablePanel .print-title-row th'), orig = document.title;
if (th) th.textContent = printTitle();
document.title = 'Transfer_Register_' + view + '_' + level;
document.body.classList.add('print-mode-table');
const restore = () => { document.title = orig; document.body.classList.remove('print-mode-table'); window.removeEventListener('afterprint', restore); };
window.addEventListener('afterprint', restore);
window.print();
}
function excel() {
if (!window.trfExcel || !last) return;
const t = { title: last.title, cols: last.cols, total: last.total,
rows: last.rows.map(r => ({ cells: r.cells.map((v, j) => (r.html && r.html.indexOf(j) !== -1) ? String(v).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : v) })) };
window.trfExcel({ t: t, crumb: crumbText(), period: document.getElementById('periodBadge').textContent,
asof: document.getElementById('asOfLine').textContent, file: 'Transfer_Register_' + view + '_' + level + '.xlsx', name: 'Transfer Register' });
}
(function () {
const box = document.getElementById('exportBox');
if (box && window.jmExport) window.jmExport.attach(box, { pdf: printTable, excel: window.trfExcel ? excel : null });
}());
document.getElementById('asOfLine').textContent = 'Live data ' + SEP + ' ' + DATA.asOf;
fillStores();
render();
}());

});
