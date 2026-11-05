window.addEventListener("DOMContentLoaded",function(){
(function () {
var cache = {}, ctx = null, last = null;
function T(s) { return (window.jmT || function (x) { return x; })(s); }
function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function fmt(v) {
v = Math.round((+v || 0) * 100) / 100;
var neg = v < 0, s = Math.abs(v).toFixed(Math.abs(v) % 1 ? 2 : 0);
return (neg ? '-' : '') + s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
function dmy(iso) { return iso ? iso.split('-').reverse().join('/') : ''; }
function num(v, cls) { return '<td class="num' + (cls ? ' ' + cls : '') + '">' + (+v ? fmt(v) : '') + '</td>'; }
function call(p, ok) {
apex.server.process('PAYROLL_LOANS_AJAX', p, { dataType: 'json', success: ok, error: function () { ok({ error: 'Loans data could not be loaded' }); } });
}
var L = { emp: 0, name: 1, term: 2, n: 3, val: 4, paid: 5, rem: 6, ded: 7, halt: 8, unauth: 9, prev: 10 };
var MN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function dedHead(back) { var m = ctx.m - back; if (m < 1) { m += 12; } return T('Deduction of') + ' ' + T(MN[m - 1]); }
function rowsOf(d) {
var out = [], i, r, g;
for (i = 0; i < d.rows.length; i++) {
r = d.rows[i]; g = ctx.who(r[L.emp]);
if (ctx.co !== 'ALL' && g.co !== ctx.co) { continue; }
out.push({ r: r, g: g, slip: ctx.slip(r[L.emp]) });
}
out.sort(function (a, b) { return ((+a.g.gsort || 99) - (+b.g.gsort || 99)) || (a.r[L.emp] - b.r[L.emp]); });
return out;
}
function draw(d) {
var list = rowsOf(d), h, i, x, r, t = { n: 0, val: 0, paid: 0, rem: 0, ded: 0, prev: 0 }, note, miss, title = T('Employees loans statement');
h = '<table class="pay-table ln-table"><thead><tr><th class="c-no">#</th><th class="c-emp">' + T('Emp.') + '</th><th class="c-name">' + T('Employee name') + '</th><th class="ln-np">' + T('Payroll group') + '</th>'
+ '<th class="num ln-np">' + T('No. of loans') + '</th><th class="num">' + T('Loans value') + '</th><th class="num gE">' + T('Amount paid') + '</th>'
+ '<th class="num gD ln-np">' + dedHead(1) + '</th><th class="num gD">' + dedHead(0) + '</th><th class="num c-net">' + T('Remaining') + '</th><th class="ln-np">' + T('Notes') + '</th></tr></thead><tbody>';
for (i = 0; i < list.length; i++) {
x = list[i]; r = x.r;
miss = Math.abs((+r[L.ded] || 0) - (x.slip || 0)) > 0.004;
note = [];
if (+r[L.halt]) { note.push('<span class="st-warn">' + T('Stopped') + ' ' + fmt(r[L.halt]) + '</span>'); }
if (miss) { note.push('<span class="st-bad">' + T('Deduction differs from the payroll') + '</span>'); }
if (+r[L.term]) { note.push('<span class="st-ok">' + T('Terminated') + '</span>'); }
h += '<tr class="emp-row ln-row' + (miss ? ' st-flag' : '') + '" data-e="' + r[L.emp] + '"><td class="c-no">' + (i + 1) + '</td><td class="c-emp">' + r[L.emp] + '</td><td class="c-name"><span class="tw">&#9656;</span> ' + esc(r[L.name]) + '</td><td class="ln-np">' + esc(x.g.gname || '') + '</td>'
+ '<td class="num ln-np">' + r[L.n] + '</td>' + num(r[L.val]) + num(r[L.paid], 'gE') + num(r[L.prev], 'gD ln-np') + num(r[L.ded], 'gD') + num(r[L.rem], 'c-net') + '<td class="ln-np">' + note.join(' ') + '</td></tr>';
t.n += +r[L.n]; t.val += +r[L.val]; t.paid += +r[L.paid]; t.rem += +r[L.rem]; t.ded += +r[L.ded]; t.prev += +r[L.prev] || 0;
}
if (!list.length) { h += '<tr><td colspan="11" class="empty">' + T('No employee with a loan balance') + '</td></tr>'; }
h += '</tbody><tfoot><tr class="total-row"><td colspan="3">' + T('Total') + ' (' + list.length + ' ' + T('employees') + ')</td><td class="ln-np"></td><td class="num ln-np">' + t.n + '</td>' + num(t.val) + num(t.paid, 'gE') + num(t.prev, 'gD ln-np') + num(t.ded, 'gD') + num(t.rem, 'c-net') + '<td class="ln-np"></td></tr></tfoot></table>';
ctx.el.innerHTML = '<table class="pw"><thead><tr><td><div class="pw-head"><div class="pw-t">' + esc(title) + '</div><div class="pw-m">' + esc(T('As of') + ' ' + dmy(d.asOf)) + '</div></div></td></tr></thead><tbody><tr><td>' + h + '</td></tr></tbody></table>';
ctx.title(title, list.length + ' ' + T('employees') + ' - ' + T('As of') + ' ' + dmy(d.asOf) + ' - ' + T('Remaining') + ' ' + fmt(t.rem));
last = { d: d, list: list, title: title };
}
function show(c) {
var key = c.y + '_' + c.m;
ctx = c;
if (cache[key]) { draw(cache[key]); return; }
c.el.innerHTML = '<div class="empty">' + T('Loading...') + '</div>';
call({ x01: 'list', x02: c.y, x03: c.m }, function (d) {
if (!d || d.error) { c.el.innerHTML = '<div class="empty">' + esc(d && d.error ? d.error : 'error') + '</div>'; return; }
cache[key] = d;
if (ctx === c) { draw(d); }
});
}
var KIND = { P: 'By payroll', S: 'From settlement', M: 'Manual payment' };
function win(emp) {
var o = document.getElementById('payLw'), r = null, i;
for (i = 0; last && i < last.list.length; i++) { if (String(last.list[i].r[L.emp]) === String(emp)) { r = last.list[i].r; } }
if (!o) {
o = document.createElement('div'); o.id = 'payLw'; o.className = 'pgw-ov'; document.body.appendChild(o);
o.addEventListener('click', function (e) {
var t = e.target, orig;
if (t.closest && t.closest('[data-plw-p]')) {
orig = document.title; document.title = 'Loans_' + o.getAttribute('data-e');
document.body.classList.add('plw-printing');
var back = function () { document.body.classList.remove('plw-printing'); document.title = orig; window.removeEventListener('afterprint', back); };
window.addEventListener('afterprint', back); window.print(); return;
}
if (t.closest && t.closest('[data-lm]') && o.lnData) {
o.lnData.mode = t.closest('[data-lm]').getAttribute('data-lm'); o.lnData.sel = '';
o.querySelector('.pgw-body').innerHTML = winHtml(o.lnData); return;
}
if (t.closest && t.closest('[data-ls]') && o.lnData) {
var sv = t.closest('[data-ls]').getAttribute('data-ls');
o.lnData.sel = o.lnData.sel === sv ? '' : sv;
o.querySelector('.pgw-body').innerHTML = winHtml(o.lnData); return;
}
if (t === o || (t.closest && t.closest('[data-plw-x]'))) { o.style.display = 'none'; }
});
document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { o.style.display = 'none'; } });
}
o.setAttribute('data-e', emp); o.lnData = null;
o.innerHTML = '<div class="pgw-box"><div class="pgw-top"><span>' + esc(emp + ' - ' + (r ? r[L.name] : '')) + '<small class="pgw-from">' + esc(T('Opened from') + ': ' + T('Employees loans statement') + ' - ' + T('As of') + ' ' + dmy(last ? last.d.asOf : '')) + '</small></span>'
+ '<div><button type="button" data-plw-p>&#8681; ' + esc(T('Export PDF')) + '</button><button type="button" data-plw-x>&times; ' + esc(T('Close')) + '</button></div></div><div class="pgw-body"><div class="empty">' + T('Loading...') + '</div></div></div>';
o.style.display = 'flex';
call({ x01: 'emp', x02: ctx.y, x03: ctx.m, x04: emp }, function (d) {
var b = o.querySelector('.pgw-body');
if (!d || d.error) { b.innerHTML = '<div class="empty">' + esc(d && d.error ? d.error : 'error') + '</div>'; return; }
o.lnData = { emp: emp, r: r, d: d, mode: 'O', sel: '' };
b.innerHTML = winHtml(o.lnData);
});
}
function isOpen(l) { return +l[8] > 0.004; }
function winHtml(w) {
var emp = w.emp, r = w.r, d = w.d, mode = w.mode, h, i, l, s, t = { val: 0, paid: 0, rem: 0, ded: 0, prev: 0 }, p, nO = 0, nS = 0, shown = 0, selL = null;
for (i = 0; i < d.loans.length; i++) { if (isOpen(d.loans[i])) { nO++; } else { nS++; } }
h = '<div class="pgw-ph"><div class="pw-head"><div class="pw-t">' + esc(T('Employee loans statement')) + '</div><div class="pw-m">' + esc(T('As of') + ' ' + dmy(d.asOf)) + '</div><div class="pw-sc">' + esc(emp + ' - ' + (r ? r[L.name] : '') + ' - ' + T(mode === 'S' ? 'Settled loans' : 'Open loans')) + '</div></div></div>'
+ '<div class="ln-tabs"><div class="level-tabs"><button type="button" class="lvl-btn' + (mode === 'O' ? ' active' : '') + '" data-lm="O">' + T('Open loans') + ' <span class="cnt">' + nO + '</span></button>'
+ '<button type="button" class="lvl-btn' + (mode === 'S' ? ' active' : '') + '" data-lm="S">' + T('Settled loans') + ' <span class="cnt">' + nS + '</span></button></div></div>'
+ '<table class="pay-table ln-table"><thead><tr><th class="c-no">' + T('Loan') + '</th><th>' + T('Type') + '</th><th>' + T('Loan date') + '</th>'
+ '<th class="num">' + T('Loan value') + '</th><th class="num">' + T('Instalment') + '</th><th class="num gE">' + T('Amount paid') + '</th><th class="num c-net">' + T('Remaining') + '</th><th class="num gD">' + dedHead(1) + '</th><th class="num gD">' + dedHead(0) + '</th><th class="ln-np">' + T('Entry') + '</th><th class="ln-np">' + T('Status') + '</th></tr></thead><tbody>';
for (i = 0; i < d.loans.length; i++) {
l = d.loans[i];
if (isOpen(l) !== (mode === 'O')) { continue; }
shown++;
if (String(l[0]) === String(w.sel)) { selL = l; }
s = !isOpen(l) ? '<span class="st-ok">' + T('Settled') + '</span>' : +l[6] ? '<span class="st-warn">' + T('Stopped') + '</span>' : '<span class="st-ok">' + T('Running') + '</span>';
h += '<tr class="emp-row ln-loan' + (String(l[0]) === String(w.sel) ? ' ln-sel' : '') + '" data-ls="' + l[0] + '"><td class="c-no">' + l[0] + '</td><td><span class="ln-type">' + esc(l[1] || '') + '</span></td><td class="num">' + dmy(l[2]) + '</td>' + num(l[3]) + num(l[4]) + num(l[7], 'gE') + num(l[8], 'c-net') + num(l[10], 'gD') + num(l[9], 'gD') + '<td class="ln-np c-emp">' + (l[11] ? '<a href="javascript:void(0)" class="jme-link ln-ent" data-jme="' + esc(l[11]) + '">' + esc(l[11]) + '</a>' : '') + '</td><td class="ln-np">' + s + '</td></tr>';
t.val += +l[3]; t.paid += +l[7]; t.rem += +l[8]; t.ded += +l[9]; t.prev += +l[10] || 0;
}
if (!shown) { h += '<tr><td colspan="11" class="empty">' + T(mode === 'S' ? 'No settled loans' : 'No open loans') + '</td></tr>'; }
h += '</tbody><tfoot><tr class="total-row"><td colspan="3">' + T('Total') + ' (' + shown + ')</td>' + num(t.val) + '<td></td>' + num(t.paid, 'gE') + num(t.rem, 'c-net') + num(t.prev, 'gD') + num(t.ded, 'gD') + '<td class="ln-np"></td><td class="ln-np"></td></tr></tfoot></table>';
if (!selL) { return h + '<div class="ln-hint ln-pays">' + T('Click a loan to see its payments') + '</div>'; }
h += '<div class="ln-pays"><div class="ln-cap">' + T('Payments') + ' - ' + T('Loan') + ' ' + selL[0] + ' (' + esc(selL[1] || '') + ')</div><table class="pay-table ln-table"><thead><tr><th class="c-no">' + T('Loan') + '</th><th>' + T('Date') + '</th><th>' + T('Paid by') + '</th><th class="num">' + T('Amount') + '</th><th>' + T('Entry') + '</th></tr></thead><tbody>';
shown = 0;
for (i = 0; i < d.pays.length; i++) {
p = d.pays[i];
if (String(p[0]) !== String(w.sel)) { continue; }
shown++;
h += '<tr class="emp-row"><td class="c-no">' + p[0] + '</td><td class="num">' + dmy(p[1]) + '</td><td>' + T(KIND[p[3]] || p[3]) + '</td>' + num(p[2]) + '<td class="c-emp">' + (p[4] ? '<a href="javascript:void(0)" class="jme-link ln-ent" data-jme="' + esc(p[4]) + '">' + esc(p[4]) + '</a>' : (p[3] === 'P' ? T('With the payroll entry') : '<span class="st-bad">' + T('No entry') + '</span>')) + '</td></tr>';
}
if (!shown) { h += '<tr><td colspan="5" class="empty">' + T('No payments yet') + '</td></tr>'; }
return h + '</tbody></table></div>';
}
window.addEventListener('beforeprint', function () {
var on = !!(ctx && ctx.el && ctx.el.querySelector('.ln-table')) && !document.body.classList.contains('pgw-printing');
document.body.classList.toggle('ln-print', on || document.body.classList.contains('plw-printing'));
}, false);
window.addEventListener('afterprint', function () { document.body.classList.remove('ln-print'); }, false);
function excel() {
var lines = [], i, x, r;
if (!window.svXlsx || !last) { return; }
for (i = 0; i < last.list.length; i++) {
x = last.list[i]; r = x.r;
lines.push([[r[L.emp], 3], [r[L.name], 0], [x.g.gname || '', 0], [+r[L.n], 3], [+r[L.val], 5], [+r[L.paid], 5], [+r[L.prev] || 0, 5], [+r[L.ded], 5], [+r[L.rem], 5], [+r[L.halt], 5]]);
}
window.svXlsx.save(last.title + ' - ' + T('As of') + ' ' + dmy(last.d.asOf),
[T('Emp.'), T('Employee name'), T('Payroll group'), T('No. of loans'), T('Loans value'), T('Amount paid'), dedHead(1), dedHead(0), T('Remaining'), T('Stopped')], lines,
'<cols><col min="1" max="1" width="9" customWidth="1"/><col min="2" max="2" width="34" customWidth="1"/><col min="3" max="3" width="24" customWidth="1"/><col min="4" max="10" width="13" customWidth="1"/></cols>',
'Loans_' + last.d.asOf + '.xlsx', 'Loans');
}
document.addEventListener('click', function (e) {
var t = e.target;
while (t && t !== document && !(t.classList && t.classList.contains('ln-row'))) { t = t.parentNode; }
if (t && t !== document) { win(t.getAttribute('data-e')); }
});
window.payLoans = { show: show, excel: excel };
})();

});
