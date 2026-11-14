window.addEventListener("DOMContentLoaded",function(){
(function () {
var D = null, G = null, CUR = null, L1 = null, stF = 'ALL', sortK = 'p', sortD = -1, busy = false, SEP = String.fromCharCode(8250), ARR = String.fromCharCode(8594);
var MN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
var ST_TXT = { NEW: 'To approve', APPROVED: 'Running', REPAID: 'Repaid', CANCELLED: 'Cancelled' };
function $(id) { return document.getElementById(id); }
if (!$('tBody')) { return; }
function T(s) { return window.jmT ? window.jmT(s) : s; }
function esc(s) { return String(s === null || s === undefined ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function pad(n) { return (n < 10 ? '0' : '') + n; }
function has(v) { return v !== null && v !== undefined; }
function r2(x) { return Math.round(x * 100) / 100; }
function fm(v) {
var neg = v < 0, a = Math.abs(+v || 0), s = a.toFixed(2), o = '', i = s.indexOf('.'), f = s.substr(i);
s = s.substr(0, i);
while (s.length > 3) { o = ',' + s.substr(s.length - 3) + o; s = s.substr(0, s.length - 3); }
return (neg && Math.round(a * 100) ? '-' : '') + s + o + f;
}
function fm0(v) { var s = fm(v); return s.substr(0, s.length - 3); }
function pc(x) { return (+x || 0).toFixed(2) + '%'; }
function utc(s) { return Date.UTC(+s.substr(0, 4), +s.substr(5, 2) - 1, +s.substr(8, 2)); }
function iso(t) { var d = new Date(t); return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()); }
function days(a, b) { return Math.round((utc(b) - utc(a)) / 864e5); }
function addD(s, n) { return iso(utc(s) + n * 864e5); }
function lastDay(s) { return iso(Date.UTC(+s.substr(0, 4), +s.substr(5, 2), 0)); }
function dmy(s) { return s ? s.substr(8, 2) + '/' + s.substr(5, 2) + '/' + s.substr(0, 4) : ''; }
function my(s) { return s ? T(MN[+s.substr(5, 2) - 1]) + ' ' + s.substr(0, 4) : ''; }
function pick(e, attr) {
var t = e.target;
while (t && t !== e.currentTarget && !(t.getAttribute && t.getAttribute(attr) !== null)) { t = t.parentNode; }
return t && t !== e.currentTarget ? t.getAttribute(attr) : null;
}
function toast(t, bad) {
var e = $('jmToast');
if (!e) { e = document.createElement('div'); e.id = 'jmToast'; e.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);color:#fff;padding:10px 18px;border-radius:10px;font:500 13px var(--font-body);z-index:900;max-width:70vw'; document.body.appendChild(e); }
e.style.background = bad ? '#a5202f' : '#1a1f36'; e.textContent = t; e.style.display = 'block';
clearTimeout(toast._t); toast._t = setTimeout(function () { e.style.display = 'none'; }, bad ? 6000 : 3200);
}
function errObj(x) { var t = x && x.responseText ? String(x.responseText).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').substr(0, 300) : ''; return t ? { error: t } : null; }
function call(p, cb) {
if (busy) { return; }
busy = true; document.body.classList.add('busy');
apex.server.process('LOANS_AJAX', p, {
success: function (d) { busy = false; document.body.classList.remove('busy'); if (!d || !d.ok) { toast(T((d && d.error) || 'Request failed'), true); if (cb) { cb(null); } return; } cb(d); },
error: function (x, s, e) { busy = false; document.body.classList.remove('busy'); toast('Request failed - ' + ((errObj(x) || {}).error || e || s), true); if (cb) { cb(null); } }
});
}
function L(r) {
var o = { id: r[0], code: r[1], tr: r[2], draw: r[3], p: +r[4], fx: +r[5], sb: has(r[6]) ? +r[6] : null, due: r[7], st: r[8], sup: r[9], acc: r[10], pa: +r[11], pm: r[12], pl: r[13],
rdate: r[14], ramt: has(r[15]) ? +r[15] : null, bank: has(r[16]) ? +r[16] : null, dtype: r[17], dser: r[18], dey: r[19], det: r[20], den: r[21], basis: +r[22] || 360, term: +r[23] || 270,
apby: r[24], apat: r[25], rtype: r[26], rser: r[27], rey: r[28], ret: r[29], ren: r[30], rpby: r[31], rpat: r[32], desc: r[33], fname: r[34], tot: +r[35], cx: r[36], chg: r[37] || null, namt: has(r[38]) ? +r[38] : null, ndate: r[39] || null, agr: has(r[40]) ? +r[40] : null };
if (o.st === 'NEW' && has(o.sb)) { o.tot = r2(o.p * (o.fx + o.sb) / 100 * o.term / o.basis); }
return o;
}
function stTxt(o) { return T(o.st === 'NEW' && has(o.sb) ? 'Draft' : ST_TXT[o.st]); }
function chgTxt(o) { return !o.chg ? '' : o.chg === 'X' ? T('The bank move was deleted in Co.') : T('The bank move changed in Co.') + ': ' + (has(o.namt) && o.namt !== o.p ? T('amount') + ' ' + fm(o.p) + ' ' + String.fromCharCode(8594) + ' ' + fm(o.namt) + ' ' : '') + (o.ndate && o.ndate !== o.draw ? T('date') + ' ' + dmy(o.draw) + ' ' + String.fromCharCode(8594) + ' ' + dmy(o.ndate) : ''); }
function rateOf(o, sb) { return o.fx + (has(sb) ? sb : (has(o.sb) ? o.sb : 0)); }
function planned(o, rate) {
var tot = r2(o.p * rate / 100 * o.term / o.basis), from = o.draw, to, rows = [], run = 0, amt;
while (utc(from) < utc(o.due)) {
to = lastDay(addD(from, 1)); if (utc(to) > utc(o.due)) { to = o.due; }
amt = to === o.due ? r2(tot - run) : r2(o.p * rate / 100 * days(from, to) / o.basis);
run = r2(run + amt);
rows.push({ from: from, to: to, days: days(from, to), amt: amt, st: 'PREVIEW' });
from = to;
}
return { rows: rows, total: tot };
}
function ageInfo(o) {
var m = days(o.draw, D.today) / 30.4375, left = days(D.today, o.due), k, t;
if (o.st === 'REPAID') { return { k: 'ag0', t: T('repaid') + ' ' + dmy(o.rdate) }; }
if (left < 0) { k = 'ag3'; t = T('overdue by') + ' ' + (-left) + ' ' + T('days'); }
else { k = m < 3 ? 'ag0' : m < 6 ? 'ag1' : 'ag2'; t = left + ' ' + T('days left'); }
return { k: k, t: t };
}
function entryLnk(y, t, n) { return has(n) ? '<span class="lnk" data-e="' + y + '/' + t + '/' + n + '">' + t + '/' + n + '</span>' : ''; }
function openEntry(k) { var a = k.split('/'); if (window.jmEntry && window.jmEntry.open) { window.jmEntry.open(+a[0], +a[1], +a[2]); } }
function loans() { var i, out = []; for (i = 0; i < D.loans.length; i++) { out.push(L(D.loans[i])); } return out; }
function keep(o) {
var left = days(D.today, o.due), q = $('findBox').value.toLowerCase().replace(/\s+/g, ''), sup = $('supSel').value, yr = $('yrSel').value;
if (stF === 'NEW' && o.st !== 'NEW') { return false; }
if (stF === 'APPROVED' && o.st !== 'APPROVED') { return false; }
if (stF === 'REPAID' && o.st !== 'REPAID') { return false; }
if (stF === 'DUE' && !(o.st !== 'REPAID' && left >= 0 && left <= 30)) { return false; }
if (stF === 'OVER' && !(o.st !== 'REPAID' && left < 0)) { return false; }
if (sup && o.sup !== sup) { return false; }
if (yr && o.draw.substr(0, 4) !== yr) { return false; }
if (q && String(o.code || '').toLowerCase().replace(/\s+/g, '').indexOf(q) < 0 && String(o.tr || '').indexOf(q) < 0) { return false; }
return true;
}
function fillSelects() {
var all = loans(), sups = {}, yrs = {}, i, s = '', k, keys = [];
for (i = 0; i < all.length; i++) { if (all[i].sup) { sups[all[i].sup] = 1; } yrs[all[i].draw.substr(0, 4)] = 1; }
for (k in sups) { keys.push(k); } keys.sort();
for (i = 0; i < keys.length; i++) { s += '<option value="' + esc(keys[i]) + '">' + esc(keys[i]) + '</option>'; }
$('supSel').innerHTML = '<option value="">' + T('All suppliers') + '</option>' + s;
keys = []; for (k in yrs) { keys.push(k); } keys.sort();
s = ''; for (i = 0; i < keys.length; i++) { s += '<option value="' + keys[i] + '">' + keys[i] + '</option>'; }
$('yrSel').innerHTML = '<option value="">' + T('All years') + '</option>' + s;
}
function counts() {
var all = loans(), c = { ALL: 0, NEW: 0, APPROVED: 0, DUE: 0, OVER: 0, REPAID: 0 }, i, o, left, bs = $('stTabs').querySelectorAll('.lvl-btn');
for (i = 0; i < all.length; i++) {
o = all[i]; left = days(D.today, o.due); c.ALL++; c[o.st] = (c[o.st] || 0) + 1;
if (o.st !== 'REPAID') { if (left < 0) { c.OVER++; } else if (left <= 30) { c.DUE++; } }
}
for (i = 0; i < bs.length; i++) { bs[i].querySelector('.n').textContent = c[bs[i].getAttribute('data-st')] || 0; }
}
function kpis() {
var all = loans(), out = 0, nOpen = 0, nNew = 0, dueN = 0, dueA = 0, overN = 0, i, o, left, lim = D.fac ? +D.fac[1] : 0, used = lim ? out / lim * 100 : 0;
for (i = 0; i < all.length; i++) {
o = all[i];
if (o.st === 'NEW' || o.st === 'APPROVED') {
out += o.p; nOpen++; if (o.st === 'NEW') { nNew++; }
left = days(D.today, o.due); if (left < 0) { overN++; } else if (left <= 30) { dueN++; dueA += o.p; }
}
}
used = lim ? out / lim * 100 : 0;
$('kpi0').innerHTML =
'<div class="kpi"><div class="label">' + T('Loans outstanding') + '</div><div class="value">' + fm(out) + ' <span class="cur">SAR</span></div><div class="sub">' + nOpen + ' ' + T('open loans') + ' - ' + nNew + ' ' + T('waiting for approval') + '</div></div>' +
'<div class="kpi k-used"><div class="label">' + T('Facility used') + '</div><div class="value">' + used.toFixed(1) + '%</div><div class="sub" id="limSub">' + fm0(out) + ' ' + T('of') + ' ' + fm0(lim) + ' - ' + (out > lim ? '<span class="neg"><b>' + T('over the limit by') + ' ' + fm0(out - lim) + '</b></span>' : T('free') + ' ' + fm0(lim - out)) + ' <button type="button" class="tiny-btn" id="limBtn"' + (D.limat ? ' title="' + T('limit set on') + ' ' + D.limat + '"' : '') + '>' + T('Edit limit') + '</button></div><div class="bar"><i style="width:' + Math.min(100, used).toFixed(1) + '%"></i></div></div>' +
'<div class="kpi k-int"><div class="label">' + T('Interest booked in') + ' ' + D.today.substr(0, 4) + '</div><div class="value">' + fm(+D.ytd) + ' <span class="cur">SAR</span></div><div class="sub">' + T('entries 101 posted by the dashboard') + '</div></div>' +
'<div class="kpi k-due' + (overN ? ' over' : '') + '"><div class="label">' + T('Due within 30 days') + '</div><div class="value">' + dueN + ' <span class="cur">' + T('loans') + '</span></div><div class="sub">' + fm0(dueA) + ' SAR - ' + (overN ? '<span class="neg"><b>' + overN + ' ' + T('overdue') + '</b></span>' : T('none overdue')) + '</div></div>';
$('limBtn').addEventListener('click', limEdit);
}
function limEdit() {
var s = $('limSub'), i, lim = D.fac ? +D.fac[1] : 0;
function save() { var v = parseFloat(String(i.value).replace(/,/g, '')); if (isNaN(v) || v <= 0) { toast(T('Enter the facility limit as a positive amount'), true); return; } call({ x01: 'limit', x03: v }, function (d) { if (d) { toast(d.msg || 'Done'); loadList(); } }); }
s.className = 'sub lim-ed';
s.innerHTML = '<input type="text" id="limIn" value="' + fm(lim) + '" autocomplete="off"><button type="button" class="tiny-btn" id="limOk">' + T('Save') + '</button><button type="button" class="tiny-btn" id="limNo">' + T('Cancel') + '</button>';
i = $('limIn'); i.focus(); i.select();
i.addEventListener('keydown', function (e) { if (e.key === 'Enter') { save(); } else if (e.key === 'Escape') { kpis(); } });
$('limOk').addEventListener('click', save); $('limNo').addEventListener('click', kpis);
}
function sortVal(o, k) { return k === 'p' ? o.p : k === 'int' ? o.tot : k === 'draw' ? o.draw : k === 'due' || k === 'age' ? o.due : k === 'po' ? o.pa : k === 'st' ? o.st : k === 'tot' ? o.p + o.tot : o.code || ''; }
function drawList() {
var all = loans(), list = [], cols = [
{ k: 'code', t: 'Loan' }, { k: 'draw', t: 'Taken on' }, { k: 'p', t: 'Amount', n: 1 }, { k: 'rt', t: 'Rate a year', n: 1 }, { k: 'int', t: 'Interest to due date', n: 1 }, { k: 'tot', t: 'Amount + interest', n: 1 },
{ k: 'due', t: 'Due on' }, { k: 'age', t: 'Remaining' }, { k: 'st', t: 'Status' }, { k: 'po', t: 'Interest booked', n: 1 }], h, b = '', tP = 0, tI = 0, tPo = 0, i, o, a, c, x, y;
for (i = 0; i < all.length; i++) { if (keep(all[i])) { list.push(all[i]); } }
list.sort(function (p, q) { x = sortVal(p, sortK); y = sortVal(q, sortK); return x === y ? 0 : (x < y ? -1 : 1) * sortD; });
h = '<tr class="print-title-row"><th colspan="' + cols.length + '"></th></tr><tr>';
for (i = 0; i < cols.length; i++) { c = cols[i]; h += '<th class="' + (c.n ? 'num' : '') + (sortK === c.k ? ' sorted' + (sortD === 1 ? ' asc' : '') : '') + '" data-k="' + c.k + '">' + T(c.t) + '</th>'; }
$('tHead').innerHTML = h + '</tr>';
for (i = 0; i < list.length; i++) {
o = list[i]; a = ageInfo(o); tP += o.p; tI += o.tot; tPo += o.pa;
b += '<tr class="drill-row" data-id="' + o.id + '"><td><span class="tw">&#9656;</span>' + esc(o.code || ('1010201/' + o.dser)) + '<span class="sub-l">' + esc(o.sup || o.fname || '') + (has(o.tr) ? ' - ' + T('transfer no') + ' ' + o.tr : '') + '</span>' + (o.chg ? '<span class="sub-l"><span class="chip ag3">' + chgTxt(o) + '</span></span>' : '') + '</td>' +
'<td>' + dmy(o.draw) + '</td><td class="num">' + fm(o.p) + '</td>' +
'<td class="num">' + (has(o.sb) ? pc(rateOf(o)) + '<span class="sub-l">' + pc(o.fx) + ' + ' + pc(o.sb) + '</span>' : '<span class="muted-dash">' + pc(o.fx) + ' + SAIBOR ?</span>') + '</td>' +
'<td class="num">' + (has(o.sb) ? fm(o.tot) : '<span class="muted-dash">&mdash;</span>') + '</td><td class="num">' + (has(o.sb) ? fm(o.p + o.tot) : '<span class="muted-dash">&mdash;</span>') + '</td>' +
'<td>' + dmy(o.due) + '</td><td><span class="chip ' + a.k + '">' + a.t + '</span></td><td><span class="chip st-' + o.st + '">' + stTxt(o) + '</span></td>' +
'<td class="num">' + (o.pa ? fm(o.pa) + '<span class="sub-l">' + o.pm + ' ' + T(o.pm === 1 ? 'month' : 'months') + '</span>' : '<span class="muted-dash">&mdash;</span>') + '</td></tr>';
}
if (list.length) { b += '<tr class="total-row"><td>' + T('TOTAL') + '</td><td></td><td class="num">' + fm(tP) + '</td><td></td><td class="num">' + fm(tI) + '</td><td class="num">' + fm(tP + tI) + '</td><td></td><td></td><td></td><td class="num">' + fm(tPo) + '</td></tr>'; }
else { b = '<tr><td colspan="' + cols.length + '" style="text-align:center;color:var(--muted);padding:24px">' + T(all.length ? 'No loan matches this filter' : 'No loan since 25/10/2026') + '</td></tr>'; }
$('tBody').innerHTML = b;
$('tableSub').textContent = list.length + ' ' + T('loans') + ' - ' + T('largest first - click a loan to open it');
$('printFilters').innerHTML = '<b>' + T('Status') + ':</b> ' + esc($('stTabs').querySelector('.active').textContent.replace(/\d+$/, '')) + ($('supSel').value ? '<span class="pf-sep">|</span><b>' + T('Supplier') + ':</b> ' + esc($('supSel').value) : '') + ($('yrSel').value ? '<span class="pf-sep">|</span><b>' + T('Year') + ':</b> ' + $('yrSel').value : '');
D.shown = list;
}
function loadList(silent, cb) {
if (!silent) { $('tableLoader').style.display = ''; }
call({ x01: 'list' }, function (d) {
$('tableLoader').style.display = 'none';
if (!d) { return; }
D = d;
$('asOfLine').textContent = d.link === 0 ? T('Co. is not reachable - this is the last copy and the actions are off') + (d.asof ? ' (' + d.asof + ')' : '') : d.loans.length + ' ' + T('loans') + ' - ' + T('bank moves read live from Co.');
$('asOfLine').style.color = d.link === 0 ? 'var(--pink)' : '';
fillSelects(); counts(); kpis(); drawList();
if (cb) { cb(); }
});
}
function openLoan(id) {
call({ x01: 'loan', x02: id }, function (d) {
if (!d) { return; }
G = d; CUR = L(d.loan);
$('lv0').style.display = 'none'; $('lv1').style.display = '';
$('printTablePanel').id = 'listPanel'; $('loanPanel').id = 'printTablePanel';
if (!L1) { L1 = window.loansL1(X); }
L1.draw();
window.scrollTo(0, 0);
});
}
function back() {
$('lv1').style.display = 'none'; $('lv0').style.display = '';
if ($('loanPanel') === null) { $('printTablePanel').id = 'loanPanel'; $('listPanel').id = 'printTablePanel'; }
loadList(true);
}
function act(p, leave) {
call(p, function (d) {
if (!d) { return; }
toast(d.msg || 'Done');
if (leave) { back(); return; }
call({ x01: 'loan', x02: CUR.id }, function (e) { if (e) { G = e; CUR = L(e.loan); L1.draw(); } });
});
}
function nowTxt() { var d = new Date(); return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); }
function printTitle() {
return 'Co. Dashboard | ' + (CUR && $('lv1').style.display !== 'none' ? T('Bank loan') + ' ' + (CUR.code || '') + (CUR.sup ? ' - ' + CUR.sup : '') : T('Bank Loans')) + ' |  | ' + T('Printed') + ' ' + nowTxt();
}
function doPrint() {
var th = document.querySelector('#printTablePanel .print-title-row th'), orig = document.title, lv1 = $('lv1').style.display !== 'none', n = document.querySelectorAll(lv1 ? '#schBody tr' : '#tBody tr').length, st = document.querySelector('#lv1 .steps'), pfs, sg;
pfs = (700 - (lv1 ? 215 + (st && st.offsetHeight ? 95 : 0) : 265)) / ((n + 2) * ((lv1 ? 2.3 : 3.2) + 1.1));
pfs = Math.round(Math.max(lv1 ? 10 : 9, Math.min(12.5, pfs)) * 10) / 10;
document.body.style.setProperty('--pfs', pfs + 'px');
if (th) { th.textContent = printTitle(); }
if (!lv1) { sg = document.createElement('div'); sg.className = 'pr-sign'; sg.innerHTML = '<div>' + T('Prepared by') + '</div><div>' + T('Reviewed by') + '</div><div>' + T('Approved by') + '</div>'; $('printTablePanel').appendChild(sg); }
if (lv1) { $('printFilters1').innerHTML = '<b>' + T('Loan') + ':</b> ' + esc(CUR.code || '') + '<span class="pf-sep">|</span><b>' + T('Taken on') + ':</b> ' + dmy(CUR.draw) + '<span class="pf-sep">|</span><b>' + T('Amount') + ':</b> ' + fm(CUR.p) + '<span class="pf-sep">|</span><b>' + T('Rate') + ':</b> ' + pc(rateOf(CUR)); }
document.title = lv1 ? 'Loan_' + String(CUR.code || CUR.id).replace(/[^A-Za-z0-9]+/g, '_') : 'Bank_Loans_' + D.today;
document.body.classList.add('print-mode-table'); document.body.classList.add('print-fit');
window.addEventListener('afterprint', function r() { document.title = orig; document.body.classList.remove('print-mode-table'); document.body.classList.remove('print-fit'); if (sg && sg.parentNode) { sg.parentNode.removeChild(sg); } window.removeEventListener('afterprint', r); });
window.print();
}
function excel() {
var lv1 = $('lv1').style.display !== 'none';
if (!window.loansExcel) { return; }
if (lv1) { window.loansExcel({ kind: 'loan', loan: CUR, months: G.months, title: printTitle(), rate: rateOf(CUR), T: T, fm: fm, dmy: dmy }); }
else { window.loansExcel({ kind: 'list', rows: D.shown || [], title: printTitle(), T: T, fm: fm, dmy: dmy, rateOf: rateOf, age: ageInfo, st: ST_TXT }); }
}
var X = { $: $, T: T, esc: esc, fm: fm, fm0: fm0, pc: pc, dmy: dmy, my: my, days: days, utc: utc, has: has, r2: r2, planned: planned, ageInfo: ageInfo, rateOf: rateOf, entryLnk: entryLnk, act: act, printTitle: printTitle, toast: toast, ST_TXT: ST_TXT, stTxt: stTxt, chgTxt: chgTxt,
s: function () { return { D: D, G: G, CUR: CUR }; } };
$('stTabs').addEventListener('click', function (e) { var v = pick(e, 'data-st'), bs, i; if (!v) { return; } bs = $('stTabs').querySelectorAll('.lvl-btn'); for (i = 0; i < bs.length; i++) { bs[i].className = 'lvl-btn'; } e.target.closest('.lvl-btn').className = 'lvl-btn active'; stF = v; drawList(); });
$('supSel').addEventListener('change', drawList);
$('yrSel').addEventListener('change', drawList);
$('findBox').addEventListener('input', drawList);
$('resetBtn').addEventListener('click', function () { $('supSel').value = ''; $('yrSel').value = ''; $('findBox').value = ''; stF = 'ALL'; sortK = 'p'; sortD = -1; var bs = $('stTabs').querySelectorAll('.lvl-btn'), i; for (i = 0; i < bs.length; i++) { bs[i].className = 'lvl-btn' + (i ? '' : ' active'); } drawList(); });
$('tHead').addEventListener('click', function (e) { var k = pick(e, 'data-k'); if (!k) { return; } if (sortK === k) { sortD = -sortD; } else { sortK = k; sortD = -1; } drawList(); });
$('tBody').addEventListener('click', function (e) { var id = pick(e, 'data-id'); if (id) { openLoan(+id); } });
$('backBtn').addEventListener('click', back);
$('refreshBtn').addEventListener('click', function () { loadList(); });
$('schBody').addEventListener('click', function (e) {
var un = pick(e, 'data-un'), po = pick(e, 'data-post'), en = pick(e, 'data-e');
if (en) { openEntry(en); return; }
if (un && confirm(T('Undo this booking? The entry is removed from Co. (open period, not reviewed).'))) { act({ x01: 'unpost', x02: un }); }
if (po && confirm(T('Book this month now? One entry 101 is written in Co..'))) { act({ x01: 'post', x02: po }); }
});
$('lv1').addEventListener('click', function (e) { var en = pick(e, 'data-e'); if (en && !e.target.closest('#schBody')) { openEntry(en); } });
if (window.jmExport) { window.jmExport.attach($('exportBox'), { pdf: doPrint, excel: excel }); window.jmExport.attach($('exportBox1'), { pdf: doPrint, excel: excel }); }
else { $('exportBox').innerHTML = '<button type="button" class="btn-soft" id="pr0">' + T('Print / PDF') + '</button>'; $('pr0').addEventListener('click', doPrint); }
loadList(false);
}());

});
