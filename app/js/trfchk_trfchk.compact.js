window.addEventListener("DOMContentLoaded",function(){
(function () {
const el = document.getElementById('trf-data');
if (!el) return;
const DATA = JSON.parse(el.textContent);
const SEP = String.fromCharCode(8250);
const CHECKS = [
['R', 'Receipt kept but issue deleted', 1, 'Active receipt while the issue is deleted: the goods count twice'],
['I', 'Transfer cancelled but issue kept', 1, 'Transfer deleted while its issue is active: the goods left and will not arrive'],
['A', 'Received but shown as pending', 2, 'Shown as not received although an active receipt exists (case 513): closed by one command'],
['B', 'Shown as received without receipt', 2, 'Marked received with no active receipt'],
['D', 'Received or issued twice', 2, 'Two active receipts or two active issues on one transfer'],
['G', 'Movement without a transfer', 2, 'Active transfer movement with no transfer header'],
['C', 'Not received after 30 days', 3, 'Approved and not received for more than 30 days'],
['N', 'Transfer with no goods moved', 4, 'The transfer was saved but no issue or receipt was ever made for it (expired stock store)'],
['L', 'Lines left from a removed document', 4, 'Leftover lines above the last header serial: the next document of the type fails']
];
const CK = {};
CHECKS.forEach(c => { CK[c[0]] = { label: c[1], sev: c[2], help: c[3] }; });
const SEV_TXT = { 1: 'High', 2: 'Medium', 3: 'Follow up', 4: 'Low' };
const rows = DATA.rows.map(a => ({
chk: a[0], serial: a[1], from: a[2], to: a[3], date: a[4], recv: a[5], doc: a[6], hdel: +a[7], appr: +a[8],
moves: a[0] === 'L' ? [] : (a[9] || '').split(';').filter(Boolean).map(m => {
const p = m.split('|');
return { ref: p[0], date: p[1], eff: +p[2], del: +p[3], post: +p[4] };
}),
lines: a[0] === 'L' ? a[9] : ''
}));
let chk = 'ALL';
let level = 'STORE';
let curStore = null, curRow = null;
const stack = [];
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]); }
function dmy(s) { return s ? s.substring(8, 10) + '/' + s.substring(5, 7) + '/' + s.substring(0, 4) : ''; }
function storeName(c) { const s = DATA.stores[c]; return c ? (s ? (window.JM_LANG === 'AR' && s[2] ? s[2] : s[0]) : c) : 'No store'; }
function storeBr(c) { const s = DATA.stores[c]; return s ? s[1] : ''; }
function inChk(r) { return chk === 'ALL' || r.chk === chk; }
function count(code) { return rows.filter(r => r.chk === code).length; }
function dash() { return '<span class="muted-dash">&mdash;</span>'; }
function renderKpis() {
const n = { 1: 0, 2: 0, 3: 0, 4: 0 };
rows.forEach(r => { n[CK[r.chk].sev]++; });
const card = (cls, sev, sub) =>
'<div class="kpi ' + cls + '"><div class="label">' + SEV_TXT[sev] + '</div>' +
'<div class="value' + (n[sev] ? '' : ' ok') + '">' + n[sev] + '</div><div class="sub">' + sub + '</div></div>';
document.getElementById('kpiContainer').innerHTML =
card('k-high', 1, 'Stock counted twice or lost') +
card('k-med', 2, 'Transfer status does not match') +
card('k-fol', 3, 'Waiting at the receiving store') +
card('k-low', 4, 'Cleanup, no stock effect');
}
function renderTabs() {
const bar = document.getElementById('levelTabs');
let h = '<button type="button" class="lvl-btn' + (chk === 'ALL' ? ' active' : '') + '" data-c="ALL">All checks<span class="cnt">' + rows.length + '</span></button>';
CHECKS.forEach(c => {
const k = count(c[0]);
h += '<button type="button" class="lvl-btn' + (chk === c[0] ? ' active' : '') + (k ? '' : ' zero') + '" data-c="' + c[0] + '" title="' + esc(c[3]) + '">' +
'<span class="sev s' + c[2] + '"></span>' + c[1] + '<span class="cnt">' + k + '</span></button>';
});
bar.innerHTML = h;
bar.querySelectorAll('.lvl-btn').forEach(b => b.addEventListener('click', () => {
chk = b.getAttribute('data-c'); level = 'STORE'; curStore = null; curRow = null; stack.length = 0; render();
}));
}
function crumbParts() {
const p = [chk === 'ALL' ? 'All checks' : CK[chk].label];
if (curStore !== null) p.push(storeName(curStore));
if (curRow) p.push(curRow.chk === 'L' ? curRow.doc : 'Transfer ' + curRow.serial);
if (level === 'DOC' && curDoc) p.push(curDoc.h.tc + '/' + curDoc.h.ser);
return p;
}
function crumbText() { return crumbParts().join(' ' + SEP + ' '); }
function crumbHtml() {
const p = crumbParts();
return p.map((x, i) => '<span class="crumb' + (i === p.length - 1 ? ' crumb-last' : '') + '">' + esc(x) + '</span>').join('<span class="crumb-sep">' + SEP + '</span>');
}
function storeLevel() {
const g = {};
rows.filter(inChk).forEach(r => {
const k = r.from || '';
if (!g[k]) g[k] = { store: k, n: 0, hi: 0, last: '' };
g[k].n++;
if (CK[r.chk].sev === 1) g[k].hi++;
if ((r.date || '') > g[k].last) g[k].last = r.date || '';
});
const list = Object.keys(g).map(k => g[k]).sort((a, b) => b.n - a.n || b.hi - a.hi);
return {
title: 'Cases by issuing store', cols: [['Issuing store', 0], ['Branch', 0], ['Cases', 1], ['High', 1], ['Latest', 0]],
rows: list.map(s => ({ key: s.store, cells: [storeName(s.store), storeBr(s.store), s.n, s.hi, dmy(s.last)] })),
total: ['TOTAL', '', list.reduce((a, s) => a + s.n, 0), list.reduce((a, s) => a + s.hi, 0), ''],
drill: true
};
}
function trfLevel() {
const list = rows.filter(r => inChk(r) && (r.from || '') === curStore)
.sort((a, b) => CK[a.chk].sev - CK[b.chk].sev || (b.date || '').localeCompare(a.date || ''));
return {
title: 'Transfers', cols: [['Check', 0], ['Transfer', 0], ['From', 0], ['To', 0], ['Date', 0], ['Received', 0], ['Movements', 0], ['Issues', 1], ['Receipts', 1]],
rows: list.map(r => {
const iss = r.moves.filter(m => m.eff === 5 && !m.del).length, rec = r.moves.filter(m => m.eff === 6 && !m.del).length;
return {
key: r, sev: CK[r.chk].sev,
cells: [CK[r.chk].label, r.chk === 'L' ? r.doc : r.serial, r.from ? storeName(r.from) : '', r.to ? storeName(r.to) : '',
dmy(r.date), dmy(r.recv), r.chk === 'L' ? r.lines : r.moves.map(m => m.ref).join('  '), r.chk === 'L' ? '' : iss, r.chk === 'L' ? '' : rec]
};
}),
total: null, drill: true
};
}
function moveLevel() {
return {
title: 'Movements', cols: [['Movement', 0], ['Date', 0], ['Direction', 0], ['Status', 0], ['Posted', 0]],
rows: curRow.moves.map(m => ({ key: m, cells: [m.ref, dmy(m.date), m.eff === 5 ? 'Issue' : 'Receipt', m.del ? 'Deleted' : 'Active', m.post ? 'Yes' : 'No'], del: m.del })),
total: null, drill: true
};
}
let curDoc = null;
function docLevel() {
return {
title: 'Document lines', cols: [['#', 1], ['Item', 0], ['Description', 0], ['Lot', 0], ['Exp', 0], ['Unit', 0], ['Qty', 1], ['Bonus', 1]],
rows: curDoc.lines.map(l => ({ cells: [l[0], l[1], l[2], l[4], l[5], l[6], l[7], l[9]] })),
total: curDoc.lines.length ? ['TOTAL', '', '', '', '', '', curDoc.lines.reduce((a, l) => a + (+l[7] || 0), 0), curDoc.lines.reduce((a, l) => a + (+l[9] || 0), 0)] : null,
drill: false
};
}
function docSub() {
const h = curDoc.h, kv = (k, v) => v ? '<span class="tc-kv"><b>' + k + '</b> <bdi>' + esc(v) + '</bdi></span>' : '';
return '<div class="tc-doc">' + kv('Type', h.tn) + kv('Movement', h.tc + '/' + h.ser) + kv('Date', h.dt) + kv('From', h.xf) + kv('To', h.xt) +
kv('Posted', h.post ? 'Yes' : 'No') + kv('Note', h.dsc) + '</div>' +
(curDoc.lines.length ? '' : '<div class="tc-help">No active lines: the document lines are deleted</div>');
}
let busy = false;
function openDoc(m) {
if (busy || typeof apex === 'undefined' || !apex.server) return;
const p = m.ref.split('/');
busy = true;
apex.server.process('ITCARD_AJAX', { x01: 'doc', x02: p[0], x05: p[1] }, {
success: function (d) {
busy = false;
if (!d || d.error || !d.h) { alert('Could not load the document.'); return; }
stack.push({ level: level, curStore: curStore, curRow: curRow });
curDoc = d; level = 'DOC'; render();
},
error: function () { busy = false; alert('Could not load the document.'); }
});
}
function current() { return level === 'STORE' ? storeLevel() : level === 'TRF' ? trfLevel() : level === 'MOVE' ? moveLevel() : docLevel(); }
function nowTxt() {
const d = new Date(), p = n => (n < 10 ? '0' : '') + n;
return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
}
function printTitle() {
return 'Co. Dashboard | Transfer Integrity - ' + crumbText() + ' | ' + document.getElementById('periodBadge').textContent + ' | Printed ' + nowTxt();
}
let last = null;
function cell(v, num, i, r) {
if (v === '' || v == null) return '<td' + (num ? ' class="num"' : '') + '>' + dash() + '</td>';
if (level === 'TRF' && i === 0) return '<td><span class="chk-name"><span class="sev s' + r.sev + '"></span>' + esc(v) + '</span></td>';
if ((level === 'MOVE' && i === 0) || (level === 'DOC' && i === 1) || (level === 'TRF' && i === 6)) return '<td><span class="code">' + esc(v) + '</span></td>';
if (level === 'MOVE' && i === 3) return '<td><span class="' + (r.del ? 'st-del' : 'st-act') + '">' + esc(v) + '</span></td>';
return '<td' + (num ? ' class="num"' : '') + '>' + esc(v) + '</td>';
}
function render() {
renderTabs();
const t = current();
last = t;
let head = '<tr class="print-title-row"><th colspan="' + t.cols.length + '">' + esc(printTitle()) + '</th></tr><tr>';
t.cols.forEach(c => { head += '<th' + (c[1] ? ' class="num"' : '') + '>' + c[0] + '</th>'; });
document.getElementById('tableHead').innerHTML = head + '</tr>';
let body = t.rows.map((r, i) =>
'<tr class="' + (t.drill ? 'drill-row' : '') + '" data-i="' + i + '">' +
r.cells.map((v, j) => (j === 0 && t.drill ? cell(v, t.cols[j][1], j, r).replace(/^<td>/, '<td><span class="tw">&#9656;</span> ') : cell(v, t.cols[j][1], j, r))).join('') + '</tr>'
).join('');
if (!t.rows.length) body = '<tr><td colspan="' + t.cols.length + '" style="text-align:center;padding:28px;color:var(--muted)">No broken transfers in this check</td></tr>';
if (t.total && t.rows.length) body += '<tr class="total-row">' + t.total.map((v, j) => '<td' + (t.cols[j][1] ? ' class="num"' : '') + '>' + esc(v) + '</td>').join('') + '</tr>';
document.getElementById('tableBody').innerHTML = body;
document.getElementById('tableTitleText').textContent = t.title;
document.getElementById('tableSub').innerHTML = crumbHtml() + ' &mdash; <span>' + t.rows.length + ' rows</span>' +
(chk !== 'ALL' && (level === 'STORE' || level === 'TRF') ? '<div class="tc-help">' + esc(CK[chk].help) + '</div>' : '') + (level === 'DOC' ? docSub() : '');
document.getElementById('backBtn').style.display = stack.length ? '' : 'none';
document.querySelectorAll('#tableBody tr.drill-row').forEach(tr => tr.addEventListener('click', () => {
const r = t.rows[+tr.getAttribute('data-i')];
if (level === 'MOVE') { openDoc(r.key); return; }
stack.push({ level: level, curStore: curStore, curRow: curRow });
if (level === 'STORE') { curStore = r.key; level = 'TRF'; } else { curRow = r.key; level = 'MOVE'; }
render();
}));
buildPrintFilters();
}
function goBack() {
const s = stack.pop();
if (!s) return;
level = s.level; curStore = s.curStore; curRow = s.curRow;
render();
}
document.getElementById('backBtn').addEventListener('click', goBack);
function buildPrintFilters() {
const box = document.getElementById('printFilters');
if (!box) return;
box.innerHTML = ['<b>Period:</b> ' + esc(document.getElementById('periodBadge').textContent), '<b>Scope:</b> ' + esc(crumbText()), '<b>Level:</b> ' + esc(last.title)]
.join('<span class="pf-sep">|</span>');
}
function fileStem() { return 'Transfer_Integrity_' + (chk === 'ALL' ? 'All' : chk) + '_' + level; }
function excel() {
if (!window.trfExcel) return;
window.trfExcel({ t: last, crumb: crumbText(), period: document.getElementById('periodBadge').textContent,
asof: document.getElementById('asOfLine').textContent, file: fileStem() + '.xlsx' });
}
(function () {
const box = document.getElementById('exportBox');
if (!box) return;
if (window.jmExport) {
window.jmExport.attach(box, { pdf: null, excel: window.trfExcel ? excel : null });
}
})();
document.getElementById('asOfLine').textContent = 'Live data ' + SEP + ' ' + DATA.asOf;
if (DATA.ack) document.getElementById('periodBadge').textContent = 'Since 2023 ' + SEP + ' ' + DATA.ack + ' closed after review';
renderKpis();
render();
}());

});
