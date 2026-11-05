(function () {
window.payExcel = function (c) {
if (!window.svXlsx) { return; }
var head = [], W = [], lines = [], i, j, g, r, s, w = '<cols>', cols = [], T = c.T;
for (i = 0; i < c.cols.length; i++) { if (c.cols[i][2] !== 'N') { cols.push(c.cols[i]); } }
if (c.sum) { head.push(T('Department'), T('Employees')); W.push(34, 10); }
else { head.push(T('Emp.'), T('Employee name')); W.push(9, 34); }
for (j = 0; j < cols.length; j++) { head.push(T(cols[j][1])); W.push(12); }
head.push(T('Net payable')); W.push(13);
for (i = 0; i < c.groups.length; i++) {
g = c.groups[i];
if (c.sum) {
s = [[g.name, 0], [g.tot.n, 3]];
for (j = 0; j < cols.length; j++) { s.push([g.tot[cols[j][0]], 5]); }
s.push([g.tot.net, 5]);
lines.push(s);
} else {
for (r = 0; r < g.rows.length; r++) {
s = [[g.rows[r][c.I.emp], 3], [g.rows[r][c.I.name], 0]];
for (j = 0; j < cols.length; j++) { s.push([c.val(g.rows[r], cols[j][0]), 5]); }
s.push([+g.rows[r][c.I.net] || 0, 5]);
lines.push(s);
}
}
}
s = [[T('Grand total'), 4], [c.tot.n, 3]];
for (j = 0; j < cols.length; j++) { s.push([c.tot[cols[j][0]], 5]); }
s.push([c.tot.net, 5]);
lines.push(s);
for (j = 0; j < head.length; j++) { w += '<col min="' + (j + 1) + '" max="' + (j + 1) + '" width="' + W[j] + '" customWidth="1"/>'; }
window.svXlsx.save(c.title, head, lines, w + '</cols>', c.file, 'Payroll');
};
window.payAmtList = function (title, rows, ph) {
var T = window.jmT || function (s) { return s; }, h, i, tot = 0,
f = function (v) { return (Math.round(v * 100) / 100).toFixed(v % 1 ? 2 : 0).replace(/\B(?=(\d{3})+(?!\d))/g, ','); },
e = function (v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;'); };
rows.sort(function (a, b) { return a[0] - b[0]; });
h = '<table class="pay-table"><thead><tr><th class="c-no">#</th><th class="c-emp">' + T('Emp.') + '</th><th class="c-name">' + T('Employee name') + '</th><th>' + T('Payroll group') + '</th><th class="num c-net">' + T('Amount') + '</th></tr></thead><tbody>';
for (i = 0; i < rows.length; i++) {
h += '<tr class="emp-row"><td class="c-no">' + (i + 1) + '</td><td class="c-emp">' + rows[i][0] + '</td><td class="c-name">' + e(rows[i][1]) + '</td><td>' + e(rows[i][2]) + '</td><td class="num c-net">' + f(rows[i][3]) + '</td></tr>';
tot += rows[i][3];
}
h += '</tbody><tfoot><tr class="total-row"><td colspan="4">' + T('Total') + '</td><td class="num c-net">' + f(tot) + '</td></tr></tfoot></table>';
if (window.payOpenWin) { window.payOpenWin(title, rows.length, h, ph); }
};
function fit(port) {
var n = document.querySelectorAll('#sheetBody table.pay-table tr').length, base = port ? 19 : 16, fs = port ? 10 : 8.5, pd = port ? 3 : 1.5,
k = n ? ((port ? 1000 : 690) - 95) / n / base : 1, f;
k = Math.max(0.75, Math.min(port ? 1.3 : 1, k));
if (!n || Math.abs(k - 1) < 0.03) { return ''; }
f = Math.min(14, fs * k).toFixed(1);
return '@media print{#printTablePanel table.pay-table{font-size:' + f + 'px !important}#printTablePanel table.pay-table th,#printTablePanel table.pay-table td{font-size:' + f
+ 'px !important;padding:' + (pd * k).toFixed(1) + 'px 5px !important;line-height:1.25 !important}}';
}
window.addEventListener('beforeprint', function () {
var T = window.jmT || function (s) { return s; }, wrap = document.querySelector('.wrap'), pf = document.getElementById('printFilters'),
info = window.payPrintInfo || {}, box;
if (!wrap) { return; }
box = document.getElementById('jmPrintHead');
if (!box) { box = document.createElement('div'); box.id = 'jmPrintHead'; wrap.insertBefore(box, wrap.firstChild); }
box.innerHTML = '<div class="ph-top"><b class="ph-co"></b><span class="ph-at"></span></div><div class="ph-title"></div><div class="ph-meta">' + (pf ? pf.innerHTML : '') + '</div>';
box.querySelector('.ph-co').textContent = T('Co. Dashboard');
box.querySelector('.ph-at').textContent = info.at || '';
box.querySelector('.ph-title').textContent = info.title || '';
box = document.getElementById('jmPageCss');
if (!box) { box = document.createElement('style'); box.id = 'jmPageCss'; }
document.body.appendChild(box);
var bc = document.body.classList, port = bc.contains('plw-printing') || (!bc.contains('pgw-printing') && !!document.querySelector('#sheetBody .ln-table'));
var pfx = document.querySelector('#sheetBody .pay-footer'), mx = document.querySelector('#kpiRow .k-mix'), cp = document.getElementById('pfMix');
if (cp) { cp.parentNode.removeChild(cp); }
if (pfx && mx) { cp = document.createElement('div'); cp.id = 'pfMix'; cp.appendChild(mx.cloneNode(true)); pfx.parentNode.insertBefore(cp, pfx.nextSibling); }
var d = new Date(), p2 = function (n) { return (n < 10 ? '0' : '') + n; },
at = (T('Printed') + ' ' + p2(d.getDate()) + '/' + p2(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + p2(d.getHours()) + ':' + p2(d.getMinutes())).replace(/"/g, '');
box.textContent = '@media print{@page{size:A4 ' + (port ? 'portrait;margin:10mm 10mm 11mm' : 'landscape;margin:9mm 10mm 10mm') + ';@top-right{content:none}@bottom-right{content:'
+ (window.JM_LANG === 'AR' ? '"\\0635 \\0641 \\062D \\0629  " counter(page) " \\0645 \\0646  " counter(pages)' : '"Page " counter(page) " of " counter(pages)')
+ ';font:8px sans-serif;color:#555}@bottom-left{content:"' + at + '";font:8px sans-serif;color:#555}}}' + fit(port)
+ '#pfMix{display:none}@media print{#sheetBody .pay-footer{display:none !important}#pfMix{display:block !important;width:100%;margin-top:10px}#pfMix .mx-leg{grid-template-columns:repeat(3,minmax(0,1fr)) !important;gap:18px !important}#pfMix .label{margin-bottom:6px !important}#pfMix .mx-i b{font-size:15px !important}#printTablePanel .sum-table td.c-name{white-space:nowrap !important}'
+ '#pfMix .kpi{border:1px solid #ccd !important;box-shadow:none !important;padding:10px 14px 10px 18px !important}#pfMix .mx-bar{display:none !important}#pfMix .kpi,#pfMix .kpi *{-webkit-print-color-adjust:exact;print-color-adjust:exact}}';
}, false);
})();
