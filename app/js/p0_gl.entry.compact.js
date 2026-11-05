(function () {
var CSS = '.jme{border:1px solid #dde1ec;border-radius:12px;background:#fff;overflow:hidden;margin-bottom:14px;font-family:"Segoe UI",Tahoma,sans-serif}' +
'.jme-band{display:flex;align-items:stretch;background:linear-gradient(135deg,#111c3a 0%,#4a3fa8 70%,#5a4fc4 100%);color:#fff;padding:0 6px}' +
'.jme-b{padding:12px 18px;border-left:1px solid rgba(255,255,255,.18);display:flex;flex-direction:column;justify-content:center;gap:3px}' +
'.jme-b:first-child{border-left:0}.jme-b small{font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;opacity:.75}' +
'.jme-b>div{font-size:14px;font-weight:600;font-variant-numeric:tabular-nums}.jme-no{font:700 22px Consolas,monospace!important;letter-spacing:.02em}' +
'.jme-tot{margin-left:auto;text-align:right}.jme-tot>div{font-size:22px!important;font-weight:800!important}' +
'.jme-st{display:inline-block;padding:2px 9px;border-radius:6px;font-size:11px;font-weight:700;background:#fff}.jme-st.ok{color:#1e7a45}.jme-st.np{color:#a5202f}' +
'.jme-ds{padding:8px 20px;border-top:1px dashed #dde1ec;font-size:12.5px;color:#1a1f36}' +
'.jme-t{width:100%;border-collapse:separate;border-spacing:0;font:12.5px "Segoe UI",Tahoma,sans-serif}' +
'.jme-t th{background:#e7e8eb;color:#111c3a;font-size:10.5px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;text-align:left;padding:9px 10px;border-bottom:1px solid rgba(17,28,58,.25);white-space:nowrap}' +
'.jme-t td{padding:7px 10px;border-bottom:1px solid rgba(26,31,54,.08);vertical-align:top}.jme-t tbody tr:nth-child(even) td{background:#f7f8fc}' +
'.jme-t .jme-n{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums;font-weight:600}.jme-t .jme-dr{color:#a5202f!important}.jme-t .jme-cr{color:#1d4ed8!important}' +
'.jme-t .jme-c{font:12px Consolas,monospace;color:#6f7590;white-space:nowrap}.jme-t .jme-an{font-weight:600}.jme-t .jme-cc small{display:block;font:10.5px Consolas,monospace;color:#6f7590}' +
'.jme-t .jme-z{color:#c3c9d4}.jme-t tr.jme-me td{background:rgba(17,28,58,.09)!important;font-weight:700}.jme-t tr.jme-me td:first-child{box-shadow:inset 3px 0 0 #111c3a}' +
'.jme-t tfoot td{background:#e7e8eb;color:#111c3a;font-weight:700;border-top:2px solid #22b8cf;padding:8px 10px}' +
'@media print{.jme{border:0;border-radius:0;margin:0 0 6px}.jme-band{padding:0 2px}.jme-b{padding:4px 10px;gap:1px}.jme-b small{font-size:8px}.jme-b>div{font-size:10.5px}' +
'.jme-no,.jme-tot>div{font-size:14px!important}.jme-ds{padding:3px 12px;font-size:9.5px}.jme-t{font-size:9.5px}.jme-t th{font-size:8.5px;padding:3px 5px}' +
'.jme-t td,.jme-t tfoot td{padding:2px 5px}.jme-t .jme-c,.jme-t .jme-cc small{font-size:8.5px}.jme-t thead{display:table-header-group}.jme-t tr{break-inside:avoid}' +
'.jme-band,.jme-t th,.jme-t tfoot td,.jme-t tr.jme-me td,.jme-t .jme-dr,.jme-t .jme-cr{-webkit-print-color-adjust:exact;print-color-adjust:exact}}';
function style() {
if (document.getElementById('jme-css')) { return; }
var s = document.createElement('style'); s.id = 'jme-css'; s.textContent = CSS; document.head.appendChild(s);
}
function html(d, o) {
var L = d.lines || [], esc = o.esc, dmy = o.dmy, R = o.rate || 1, i, r, v, td = 0, tc = 0, dt = d.dt || (L.length ? L[0][7] : null), out;
style();
function fm(x) {
x = x / R;
var a = Math.abs(x), s = a.toFixed(2), q = '', k = s.indexOf('.'), f = s.substr(k);
s = s.substr(0, k);
while (s.length > 3) { q = ',' + s.substr(s.length - 3) + q; s = s.substr(0, s.length - 3); }
return (x < 0 && Math.round(a * 100) ? '-' : '') + s + q + f;
}
function cc(code, name) { return code ? '<td class="jme-cc">' + esc(name || code) + (name ? '<small>' + esc(code) + '</small>' : '') + '</td>' : '<td class="jme-cc jme-z">&mdash;</td>'; }
for (i = 0; i < L.length; i++) { v = +L[i][4] || 0; if (v >= 0) { td += v; } else { tc -= v; } }
out = '<div class="jme"><div class="jme-band"><div class="jme-b"><small>Journal entry</small><div class="jme-no">' + d.y + ' / ' + d.t + ' / ' + d.n + '</div></div>' +
'<div class="jme-b"><small>Entry date</small><div>' + (dt ? dmy(dt) : '&mdash;') + '</div></div>' +
'<div class="jme-b"><small>Lines</small><div>' + L.length + '</div></div>' +
'<div class="jme-b"><small>Balance</small><div>' + (Math.round((td - tc) * 100) ? '<span class="jme-st np">Out of balance ' + fm(td - tc) + '</span>' : '<span class="jme-st ok">Balanced</span>') + '</div></div>' +
'<div class="jme-b jme-tot"><small>Total' + (o.cur && o.cur !== 'SAR' ? ' - ' + esc(o.cur) : '') + '</small><div>' + fm(td) + '</div></div></div>' +
(d.ds ? '<div class="jme-ds">' + esc(d.ds) + '</div>' : '') + '</div>';
out += '<div class="table-scroll"><table class="jme-t" id="jmeLines"><thead><tr><th>#</th><th>Account</th><th>Description</th><th>Cost centre 1</th><th>Cost centre 2</th><th class="jme-n">Debit</th><th class="jme-n">Credit</th></tr></thead><tbody>';
for (i = 0; i < L.length; i++) {
r = L[i]; v = +r[4] || 0;
out += '<tr' + (o.mark && String(r[1]) === String(o.mark) ? ' class="jme-me"' : '') + '><td class="jme-c">' + (r[0] === null ? i + 1 : r[0]) + '</td>' +
'<td><span class="jme-c">' + esc(r[1] || '') + '</span> <span class="jme-an">' + esc(r[2] || '') + '</span></td><td>' + esc(r[3] || d.ds || '') + '</td>' +
cc(r[5], r[8]) + cc(r[6], r[9]) +
'<td class="jme-n jme-dr">' + (v > 0 ? fm(v) : '') + '</td><td class="jme-n jme-cr">' + (v < 0 ? fm(-v) : '') + '</td></tr>';
}
if (!L.length) { out += '<tr><td colspan="7" class="jme-z" style="text-align:center;padding:16px">No lines found for this entry</td></tr>'; }
return out + '</tbody><tfoot><tr><td colspan="5">Total - ' + L.length + (L.length === 1 ? ' line' : ' lines') + '</td><td class="jme-n">' + fm(td) + '</td><td class="jme-n">' + fm(tc) + '</td></tr></tfoot></table></div>';
}
function xl(d) {
var L = d.lines || [], rows = [], i, r, v;
for (i = 0; i < L.length; i++) {
r = L[i]; v = +r[4] || 0;
rows.push([[r[0] === null ? i + 1 : r[0], 2], [r[1] || '', 3], [r[2] || '', 0], [r[3] || d.ds || '', 0], [r[8] || r[5] || '', 0], [r[9] || r[6] || '', 0], [v > 0 ? v : '', 5], [v < 0 ? -v : '', 5]]);
}
return { head: ['#', 'Account', 'Account name', 'Description', 'Cost centre 1', 'Cost centre 2', 'Debit', 'Credit'], lines: rows, widths: [6, 16, 40, 60, 26, 26, 15, 15],
title: 'Journal entry ' + d.y + '/' + d.t + '/' + d.n + (d.dt ? ' - ' + d.dt : '') + (d.ds ? ' - ' + d.ds : ''), file: 'Entry_' + d.y + '_' + d.t + '_' + d.n + '.xlsx' };
}
var OV_CSS = '.jme-ov{position:fixed;inset:0;background:rgba(26,31,54,.45);z-index:1000;display:none;align-items:flex-start;justify-content:center;padding:40px 20px;overflow:auto}' +
'.jme-box{background:#f7f8fb;border-radius:14px;max-width:1500px;width:100%;padding:16px 18px;box-shadow:0 20px 60px rgba(0,0,0,.25)}' +
'.jme-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;color:#111c3a;font:700 15px "Segoe UI",Tahoma,sans-serif}' +
'.jme-top button{border:1px solid rgba(34,184,207,.45);background:#fff;color:#22b8cf;border-radius:8px;padding:6px 16px;cursor:pointer;font:600 13px "Segoe UI",Tahoma,sans-serif}' +
'.jme-top button:hover{background:#22b8cf;color:#fff}.jme-msg{padding:24px;text-align:center;color:#6f7590;font:14px "Segoe UI",Tahoma,sans-serif}' +
'.jme-link{cursor:pointer;text-decoration:underline dotted;text-underline-offset:3px}.jme-link:hover{color:#22b8cf}.jme-top div{display:flex;gap:8px}' +
'.jme-from{display:block;margin-top:2px;font:600 11.5px "Segoe UI",Tahoma,sans-serif;color:#6f7590}' +
'@media print{body:not(.jme-printing) .jme-ov{display:none!important}body.jme-printing>*:not(#jme-ov){display:none!important}' +
'body.jme-printing #jme-ov{position:static;display:block!important;background:#fff;padding:0}body.jme-printing .jme-box{box-shadow:none;max-width:none;padding:0;background:#fff}body.jme-printing .jme-top div{display:none}}';
function e2(s) { return String(s === null || s === undefined ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function d2(s) { return s ? s.substr(8, 2) + '/' + s.substr(5, 2) + '/' + s.substr(0, 4) : ''; }
function ovCss() { var b; if (document.getElementById('jme-ov-css') || !document.head) { return; } b = document.createElement('style'); b.id = 'jme-ov-css'; b.textContent = OV_CSS; document.head.appendChild(b); }
ovCss();
function src() { var h = document.querySelector('.brand h1') || document.querySelector('.dash-header h1'); return h ? (h.textContent || '').replace(/\s+/g, ' ').replace(/^\s|\s$/g, '') : ''; }
function open(y, t, n, doc) {
var o = document.getElementById('jme-ov'), b, f = src();
style(); ovCss();
if (!o) {
o = document.createElement('div'); o.id = 'jme-ov'; o.className = 'jme-ov'; document.body.appendChild(o);
o.addEventListener('click', function (e) {
if (e.target.closest && e.target.closest('[data-jme-p]')) { var t0 = document.title, back = function () { document.body.classList.remove('jme-printing'); document.title = t0; window.removeEventListener('afterprint', back); }; document.title = 'Entry_' + o.getAttribute('data-n'); document.body.classList.add('jme-printing'); window.addEventListener('afterprint', back); window.print(); return; }
if (e.target === o || (e.target.closest && e.target.closest('[data-jme-x]'))) { o.style.display = 'none'; }
});
document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { o.style.display = 'none'; } });
}
o.innerHTML = '<div class="jme-box"><div class="jme-top"><span>Journal entry ' + e2(y) + ' / ' + e2(t) + ' / ' + e2(n) + (f ? '<small class="jme-from">Opened from: ' + e2(f) + '</small>' : '') + '</span><div><button type="button" data-jme-p>&#8681; Export PDF</button><button type="button" data-jme-x>&times; Close</button></div></div><div class="jme-body"><div class="jme-msg">Loading...</div></div></div>';
o.style.display = 'flex'; o.setAttribute('data-n', y + '_' + t + '_' + n);
apex.server.process('GL_ENTRY_AJAX', { x01: 'entry', x02: y, x03: t, x04: n, x05: doc ? 'doc' : '' }, {
dataType: 'json',
success: function (d) {
var x = o.querySelector('.jme-body');
if (!d || d.error || !d.ok) { x.innerHTML = '<div class="jme-msg">' + (d && d.error === 'not allowed' ? (doc ? 'The journal entry is open to the managers group only.' : 'You have no access to this journal entry.') : 'Could not load the entry.') + '</div>'; return; }
x.innerHTML = html(d, { esc: e2, dmy: d2 });
},
error: function () { o.querySelector('.jme-body').innerHTML = '<div class="jme-msg">Could not load the entry.</div>'; }
});
}
if (!window.jmeClick) {
window.jmeClick = 1;
document.addEventListener('click', function (e) {
var t = e.target && e.target.closest ? e.target.closest('[data-jme]') : null, p;
if (!t) { return; }
e.preventDefault(); e.stopPropagation();
p = t.getAttribute('data-jme').replace(/\s/g, '').split('/');
if (p.length === 3) { open(p[0], p[1], p[2], t.getAttribute('data-jme-doc') !== null); }
}, true);
}
window.jmEntry = { html: html, xl: xl, open: open };
})();
