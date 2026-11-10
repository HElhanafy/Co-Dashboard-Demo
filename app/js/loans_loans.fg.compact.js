window.svXlsx = (function () {
var CTL = new RegExp('[' + String.fromCharCode(0) + '-' + String.fromCharCode(8) + String.fromCharCode(11) + String.fromCharCode(12) + String.fromCharCode(14) + '-' + String.fromCharCode(31) + ']', 'g');
var CRC = (function () {
var t = [], c, n, k;
for (n = 0; n < 256; n++) { c = n; for (k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c >>> 0; }
return t;
})();
function crc32(u8) {
var c = 0xFFFFFFFF;
for (var i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 0xFF] ^ (c >>> 8);
return (c ^ 0xFFFFFFFF) >>> 0;
}
function zipStore(files) {
var enc = new TextEncoder(), parts = [], cd = [], off = 0;
function u16(v) { return [v & 255, (v >> 8) & 255]; }
function u32(v) { return [v & 255, (v >> 8) & 255, (v >> 16) & 255, (v >>> 24) & 255]; }
files.forEach(function (f) {
var name = enc.encode(f.n), data = enc.encode(f.d), crc = crc32(data);
var hdr = [].concat([0x50, 0x4B, 3, 4], u16(20), u16(0x0800), u16(0), u16(0), u16(0x21),
u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0));
parts.push(new Uint8Array(hdr), name, data);
cd.push([[].concat([0x50, 0x4B, 1, 2], u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21),
u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), u16(0), u16(0), u16(0),
u32(0), u32(off)), name]);
off += hdr.length + name.length + data.length;
});
var cdStart = off, cdLen = 0;
cd.forEach(function (e) { parts.push(new Uint8Array(e[0]), e[1]); cdLen += e[0].length + e[1].length; });
parts.push(new Uint8Array([].concat([0x50, 0x4B, 5, 6], u16(0), u16(0), u16(files.length), u16(files.length),
u32(cdLen), u32(cdStart), u16(0))));
return new Blob(parts, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
function xmlEsc(s) {
return String(s === null || s === undefined ? '' : s).replace(/[&<>"]/g, function (m) {
return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m];
}).replace(CTL, '');
}
function colRef(i) {
var s = '';
i++;
while (i > 0) { var m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); }
return s;
}
function save(info, head, lines, widths, fileName, sheetName) {
var nc = head.length, r = 1, x = '';
function cs(ref, v, st) { return '<c r="' + ref + '" t="inlineStr" s="' + st + '"><is><t xml:space="preserve">' + xmlEsc(v) + '</t></is></c>'; }
function cn(ref, v, st) {
var d = st === 2 ? 10 : (st === 5 ? 100 : 10000);
return '<c r="' + ref + '" s="' + st + '"><v>' + (Math.round(v * d) / d) + '</v></c>';
}
x += '<row r="1">' + cs('A1', info, 4) + '</row>';
r = 2; x += '<row r="2">';
head.forEach(function (h, i) { x += cs(colRef(i) + '2', h, 1); });
x += '</row>';
lines.forEach(function (cells) {
r++; x += '<row r="' + r + '">';
cells.forEach(function (c, i) {
x += (c[1] === 2 || c[1] === 5 || c[1] === 6) ? cn(colRef(i) + r, c[0], c[1]) : cs(colRef(i) + r, c[0], c[1]);
});
x += '</row>';
});
var last = colRef(nc - 1) + r;
var sheet = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
'<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
'<sheetViews><sheetView workbookViewId="0"><pane ySplit="2" topLeftCell="A3" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' +
'<sheetFormatPr defaultRowHeight="15"/>' + widths + '<sheetData>' + x + '</sheetData>' +
'<autoFilter ref="A2:' + last + '"/></worksheet>';
var styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
'<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
'<numFmts count="3"><numFmt numFmtId="164" formatCode="#,##0.0"/><numFmt numFmtId="165" formatCode="#,##0.00"/><numFmt numFmtId="166" formatCode="#,##0.0000"/></numFmts>' +
'<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>' +
'<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>' +
'<fill><patternFill patternType="solid"><fgColor rgb="FFE8EAF6"/></patternFill></fill></fills>' +
'<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border>' +
'<border><left style="thin"><color rgb="FFBFC4D6"/></left><right style="thin"><color rgb="FFBFC4D6"/></right>' +
'<top style="thin"><color rgb="FFBFC4D6"/></top><bottom style="thin"><color rgb="FFBFC4D6"/></bottom><diagonal/></border></borders>' +
'<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
'<cellXfs count="7">' +
'<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/>' +
'<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
'<xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>' +
'<xf numFmtId="49" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>' +
'<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
'<xf numFmtId="165" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>' +
'<xf numFmtId="166" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>' +
'</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
var files = [
{ n: '[Content_Types].xml', d: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
'<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
'<Default Extension="xml" ContentType="application/xml"/>' +
'<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
'<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
'<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
'</Types>' },
{ n: '_rels/.rels', d: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
'</Relationships>' },
{ n: 'xl/workbook.xml', d: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
'<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
'<sheets><sheet name="' + xmlEsc(sheetName) + '" sheetId="1" r:id="rId1"/></sheets></workbook>' },
{ n: 'xl/_rels/workbook.xml.rels', d: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
'<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
'</Relationships>' },
{ n: 'xl/worksheets/sheet1.xml', d: sheet },
{ n: 'xl/styles.xml', d: styles }
];
var blob = zipStore(files);
var a = document.createElement('a');
a.href = URL.createObjectURL(blob);
a.download = fileName;
document.body.appendChild(a); a.click();
setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
}
return { save: save };
})();
window.svPrint = function (o) {
var orig = document.title, d = new Date(), tb = document.createElement('div'), cards = document.getElementById('valueCards');
var DASH = String.fromCharCode(8212), SEP = ' ' + String.fromCharCode(8250) + ' ';
function p2(v) { return (v < 10 ? '0' : '') + v; }
function esc(s) { return String(s === null || s === undefined ? '' : s).replace(/[&<>"]/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]; }); }
if (!cards) { window.print(); return; }
document.title = o.title || document.title;
tb.id = 'svPTitle';
tb.innerHTML = '<div class="pt-h"><b>Co. Dashboard</b> &nbsp;|&nbsp; Stock Value ' + DASH + ' ' + esc(o.view) + ' ' + DASH + ' ' + esc(o.scope) + SEP + esc(o.type) + '</div>' +
'<div class="pt-s">Till ' + esc(o.date) + ' (inclusive)' + (o.cls ? ' &nbsp;&middot;&nbsp; Class ' + esc(o.cls) : '') + (o.q ? ' &nbsp;&middot;&nbsp; Item &quot;' + esc(o.q) + '&quot;' : '') +
(o.chk ? ' &nbsp;&middot;&nbsp; ' + esc(o.chk) : '') + ' &nbsp;&middot;&nbsp; Values in SAR at cost (system cost script, all lots incl. zero-quantity residue)' +
' &nbsp;&middot;&nbsp; Printed ' + p2(d.getDate()) + '/' + p2(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + p2(d.getHours()) + ':' + p2(d.getMinutes()) + '</div>' +
'<div class="pt-c">The first box is the total of ' + esc(o.scope) + ' at this date (Items = Lots); the accounts box, when shown, compares the ledger accounts 1103 with the inventory module at the same date (company, all warehouses); the table lists the same value by class and ' + (o.view === 'Lots' ? 'lot' : 'item') + '.</div>';
cards.parentNode.insertBefore(tb, cards);
document.body.classList.add('print-mode-table'); document.body.classList.add('sv-pdf');
var back = function () {
if (tb.parentNode) tb.parentNode.removeChild(tb);
document.title = orig; document.body.classList.remove('print-mode-table'); document.body.classList.remove('sv-pdf');
window.removeEventListener('afterprint', back);
};
window.addEventListener('afterprint', back);
window.print();
};
window.loansL1 = function (X) {
var D, G, CUR, $ = X.$, T = X.T, esc = X.esc, fm = X.fm, fm0 = X.fm0, pc = X.pc, dmy = X.dmy, my = X.my, days = X.days, utc = X.utc, has = X.has, r2 = X.r2,
planned = X.planned, ageInfo = X.ageInfo, rateOf = X.rateOf, entryLnk = X.entryLnk, act = X.act, printTitle = X.printTitle, toast = X.toast, ST_TXT = X.ST_TXT,
SEP = String.fromCharCode(8250), ARR = String.fromCharCode(8594);
function sync() { var s = X.s(); D = s.D; G = s.G; CUR = s.CUR; }
function month(r) { return { id: r[0], seq: r[1], from: r[2], to: r[3], days: r[4], rate: +r[5], amt: +r[6], kind: r[7], st: r[8], ey: r[9], et: r[10], en: r[11], edate: r[12], by: r[13], at: r[14], cby: r[15], cat: r[16], note: r[17] }; }
function rateInputs(o) {
return '<div class="filter-group"><label>' + T('Bank margin %') + '</label><input type="text" id="fxIn" value="' + o.fx.toFixed(2) + '" autocomplete="off"></div><div class="eq">+</div>' +
'<div class="filter-group"><label>SAIBOR % <span class="lbl-hint">(' + T('3 months') + ')</span></label><input type="text" id="sbIn" value="' + (has(o.sb) ? o.sb.toFixed(2) : '') + '" placeholder="0.00" autocomplete="off"></div>' +
'<div class="eq" id="eqTxt">= ' + pc(rateOf(o)) + ' <small>' + T('a year') + '</small></div>';
}
function typed() { var f = parseFloat($('fxIn').value), s = parseFloat($('sbIn').value); return { fx: isNaN(f) ? null : f, sb: isNaN(s) ? null : s }; }
function liveRate() { var t = typed(); $('eqTxt').innerHTML = '= ' + pc((t.fx || 0) + (t.sb || 0)) + ' <small>' + T('a year') + '</small>'; if (CUR.st === 'NEW') { drawMonths(); } }
function drawLoan() {
var o = CUR, a = ageInfo(o), left = days(D.today, o.due), sb = has(o.sb), rate = rateOf(o), nNote;
$('crumb').innerHTML = '<span class="crumb">' + T('Bank Loans') + '</span><span class="crumb-sep">' + SEP + '</span><span class="crumb crumb-last">' + esc(o.code || ('1010201/' + o.dser)) + '</span>';
$('scopeNote').innerHTML = '<span class="chip st-' + o.st + '">' + T(ST_TXT[o.st]) + '</span> &nbsp; <span class="chip ' + a.k + '">' + a.t + '</span>';
$('l1Title').textContent = (o.code || ('1010201/' + o.dser)) + (o.sup ? ' - ' + o.sup : '');
$('l1Sub').innerHTML = T('Bank move') + ' ' + o.dtype + '/' + o.dser + (has(o.tr) ? ' - ' + T('transfer no') + ' ' + o.tr : '') + (has(o.den) ? ' - ' + T('drawdown entry') + ' ' + entryLnk(o.dey, o.det, o.den) : '') + (o.acc ? ' - ' + T('facility account') + ' ' + o.acc + (o.fname ? ' ' + esc(o.fname) : '') : '') + (o.desc ? '<span class="sub-l">' + esc(o.desc) + '</span>' : '');
$('story').innerHTML =
'<div class="it"><small>' + T('Taken on') + '</small><b class="d">' + dmy(o.draw) + '</b></div>' +
'<div class="it"><small>' + T('Amount') + '</small><b>' + fm(o.p) + '</b></div>' +
'<div class="it"><small>' + T('Rate a year') + '</small><b>' + (sb ? pc(rate) : '<span class="muted-dash">' + pc(o.fx) + ' + SAIBOR ?</span>') + '</b></div>' +
'<div class="it"><small>' + T(o.st === 'REPAID' ? 'Interest the bank charged' : 'Interest until the due date') + '</small><b>' + (sb ? fm(o.tot) : '<span class="muted-dash">&mdash;</span>') + '</b></div>' +
'<div class="it"><small>' + T(o.st === 'REPAID' ? 'Paid back' : 'To pay back on the due date') + '</small><b>' + (o.st === 'REPAID' ? fm(o.ramt) : sb ? fm(o.p + o.tot) : '<span class="muted-dash">&mdash;</span>') + '</b></div>' +
'<div class="it"><small>' + T('Due on') + '</small><b class="d">' + dmy(o.due) + '</b></div>' +
'<div class="it"><small>' + T(o.st === 'REPAID' ? 'Repaid on' : 'Days left') + '</small><b class="d">' + (o.st === 'REPAID' ? dmy(o.rdate) : left >= 0 ? left + ' ' + T('of') + ' ' + o.term : T('overdue')) + '</b></div>';
if (o.st === 'NEW') {
$('rateP').innerHTML = T('Enter the two parts of the rate and approve the loan. The bank margin is') + ' <b>' + pc(o.fx) + '</b> ' + T('under the current agreement and may change; SAIBOR is the 3-month rate on the drawdown day.');
$('rateBox').innerHTML = rateInputs(o) + '<button type="button" class="btn-act" id="apprBtn">' + T('Approve loan') + '</button><button type="button" class="btn-soft" id="cancelBtn">' + T('Not a loan') + '</button>' +
'<span class="note">' + T('Approval writes every month below in Co. at once, each dated at its month end.') + '</span>';
$('apprBtn').addEventListener('click', function () {
var t = typed();
if (!has(t.fx) || !has(t.sb)) { toast(T('Enter the bank margin and the SAIBOR rate'), true); return; }
if (!confirm(T('Approve this loan at') + ' ' + pc(t.fx + t.sb) + ' ' + T('a year') + ' (' + pc(t.fx) + ' + ' + pc(t.sb) + ')? ' + T('Every month is booked in Co. now, each dated at its month end.'))) { return; }
act({ x01: 'approve', x02: o.id, x03: t.fx, x04: t.sb });
});
$('cancelBtn').addEventListener('click', function () { if (confirm(T('Mark this bank move as not a loan? It leaves the list.'))) { act({ x01: 'cancel', x02: o.id }, true); } });
} else if (o.st === 'APPROVED') {
$('rateP').innerHTML = T('Rate in force') + ': <b>' + pc(o.fx) + ' ' + T('bank margin') + ' + ' + pc(o.sb) + ' SAIBOR = ' + pc(rate) + ' ' + T('a year') + '</b>. ' + T('A change re-books the months after today at the new rate; the months already ended keep their entries.');
$('rateBox').innerHTML = rateInputs(o) + '<button type="button" class="btn-soft" id="rateBtn">' + T('Save rate') + '</button>' + '<button type="button" class="btn-act ghost" id="unapprBtn">' + T('Undo approval') + '</button>' + '<span class="note">' + (o.pm ? o.pm + ' ' + T(o.pm === 1 ? 'month' : 'months') + ' ' + T('booked in Co.') : T('no month booked yet')) + (o.apby ? ' - ' + T('approved by') + ' ' + esc(o.apby) + ' ' + o.apat : '') + '</span>';
if ($('unapprBtn')) { $('unapprBtn').addEventListener('click', function () { if (confirm(T('Undo the approval? The month entries are deleted in Co. (open period, not reviewed) and the loan goes back to new.'))) { act({ x01: 'unapprove', x02: o.id }); } }); }
$('rateBtn').addEventListener('click', function () {
var t = typed();
if (!has(t.fx) || !has(t.sb)) { toast(T('Enter the bank margin and the SAIBOR rate'), true); return; }
if (t.fx === o.fx && t.sb === o.sb) { toast(T('The rate did not change')); return; }
if (!confirm(T('Save the rate? The months after today are re-booked in Co. at the new rate.'))) { return; }
act({ x01: 'rate', x02: o.id, x03: t.fx, x04: t.sb });
});
} else {
$('rateP').innerHTML = T('Rate used') + ': <b>' + pc(o.fx) + ' ' + T('bank margin') + ' + ' + pc(o.sb) + ' SAIBOR = ' + pc(rate) + ' ' + T('a year') + '</b>. ' + T('The loan is repaid, the rate is closed.');
$('rateBox').innerHTML = '<span class="note">' + T('No action.') + (o.apby ? ' ' + T('Approved by') + ' ' + esc(o.apby) + ' ' + o.apat + '.' : '') + '</span>';
}
if ($('fxIn')) { $('fxIn').addEventListener('input', liveRate); $('sbIn').addEventListener('input', liveRate); }
drawMonths();
drawRepay();
drawLog();
}
function drawMonths() {
var o = CUR, rows = [], i, m, b = '', tot = 0, tD = 0, po = 0, nx = null, rate, t, pv, lastPosted = -1, cnt = 0;
if (o.st === 'NEW') {
t = typed(); rate = (t.fx || 0) + (t.sb || 0);
pv = planned(o, rate); rows = pv.rows; tot = pv.total;
$('schP').innerHTML = T('Figures below use the rate typed above') + ': <b>' + fm(o.p) + ' x ' + pc(rate) + ' x ' + T('days') + ' / ' + o.basis + '</b>. ' + T('Approval books every month in Co. at once, each dated at its month end; a repayment before the due date removes the later entries and re-books its month up to the repayment day.');
} else {
for (i = 0; i < G.months.length; i++) { m = month(G.months[i]); rows.push(m); if (m.st === 'POSTED') { po += m.amt; lastPosted = i; } if (m.st !== 'CANCELLED') { tot += m.amt; } }
for (i = 0; i < rows.length; i++) { if (rows[i].st === 'PLANNED') { nx = rows[i]; break; } }
$('schP').innerHTML = T('Each month') + ': <b>' + fm(o.p) + ' x ' + pc(rateOf(o)) + ' x ' + T('days') + ' / ' + o.basis + '</b>. ' + T('Every month is booked in Co., each dated at its month end.') + (o.st === 'APPROVED' && nx ? ' <b>' + T('A month still waiting was refused by Co. - press Book now or wait for the job.') + '</b>' : '');
}
for (i = 0; i < rows.length; i++) {
m = rows[i]; if (m.st !== 'CANCELLED') { tD += m.days; }
b += '<tr class="' + (m.st === 'CANCELLED' ? 'off' : m.kind === 'F' ? 'fin' : '') + '"><td>' + (m.kind === 'F' ? T('Final') + ' - ' : '') + my(m.to) + '</td><td>' + dmy(m.from) + '</td><td>' + dmy(m.to) + '</td><td class="num">' + m.days + '</td><td class="num">' + fm(m.amt) + '</td>' +
(m.st === 'POSTED' ? '<td class="ok">' + T('Booked') + ' ' + dmy(m.edate || m.to) + (has(m.en) ? ' - ' + T('entry') + ' ' + entryLnk(m.ey, m.et, m.en) : ' - ' + T('no entry (zero)')) + (m.by ? '<span class="sub-l">' + esc(m.by) + ' ' + m.at + '</span>' : '') + '</td>'
: m.st === 'CANCELLED' ? '<td class="off">' + T('Cancelled - the loan was repaid before this month') + (m.cby ? '<span class="sub-l">' + esc(m.cby) + ' ' + m.cat + '</span>' : '') + '</td>'
: '<td class="wait">' + (o.st === 'NEW' ? T('booked at approval, dated') + ' ' + dmy(m.to) : T('not booked yet')) + '</td>') +
'<td>' + (o.st === 'APPROVED' && m.st === 'POSTED' && i === lastPosted && G.adm ? '<button type="button" class="tiny-btn" data-un="' + m.id + '">' + T('Undo booking') + '</button>' : o.st === 'APPROVED' && nx && m === nx ? '<button type="button" class="tiny-btn" data-post="' + m.id + '">' + T('Book now') + '</button>' : '') + '</td></tr>';
cnt++;
}
if (!cnt) { b = '<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:18px">' + T('No months yet') + '</td></tr>'; }
b += '<tr class="total-row"><td>' + T('TOTAL') + '</td><td></td><td></td><td class="num">' + tD + '</td><td class="num">' + fm(tot) + '</td><td colspan="2">' + (o.st === 'REPAID' ? T('what the bank charged') : o.st === 'NEW' ? T('planned at the rate typed above') : T('booked') + ' ' + fm(po) + ' - ' + T('still to book') + ' ' + fm(r2(tot - po))) + '</td></tr>';
$('schBody').innerHTML = b;
$('schTable').querySelector('.print-title-row th').textContent = printTitle();
}
function drawRepay() {
var o = CUR, i, m, s = '', po = 0, bank, late = 0;
for (i = 0; i < G.months.length; i++) { m = month(G.months[i]); if (m.st === 'POSTED' && m.kind === 'M') { if (has(o.rdate) && utc(m.to) > utc(o.rdate)) { late++; } else { po += m.amt; } } }
if (o.st === 'REPAID') {
bank = has(o.bank) ? o.bank : r2(o.ramt - o.p);
$('repP').innerHTML = T('The bank move') + ' <b>' + o.rtype + '/' + o.rser + ' ' + T('of') + ' ' + dmy(o.rdate) + '</b> ' + T('paid the loan back. What the bank charged is compared with what was booked, and the final entry settles the difference.');
$('repBox').innerHTML = steps(o, o.ramt, bank, po, dmy(o.rdate)) + '<div class="act-line"><span class="note">' + T('Approved by') + ' ' + esc(o.rpby || '') + ' ' + (o.rpat || '') + '. ' + T('The months after the repayment were cancelled; they were never booked.') + (has(o.ren) ? ' ' + T('Repayment entry') + ' ' + entryLnk(o.rey, o.ret, o.ren) + '.' : '') + '</span>' + (G.adm ? '<button type="button" class="btn-act ghost" id="unrepBtn">' + T('Undo repayment') + '</button>' : '') + '</div>';
if ($('unrepBtn')) { $('unrepBtn').addEventListener('click', function () { if (confirm(T('Undo the repayment? The final entry is deleted in Co. (open period, not reviewed), the loan goes back to running and the months after the repayment are planned again.'))) { act({ x01: 'undorepay', x02: o.id }); } }); }
} else if (o.st === 'APPROVED' && has(o.rser)) {
bank = r2(o.ramt - o.p);
$('repP').innerHTML = T('The bank move') + ' <b>' + o.rtype + '/' + o.rser + ' ' + T('of') + ' ' + dmy(o.rdate) + '</b> ' + T('is linked to this loan. Check the figures, then approve the repayment.');
$('repBox').innerHTML = steps(o, o.ramt, bank, po, dmy(o.rdate)) +
'<div class="act-line"><button type="button" class="btn-act" id="repBtn"' + (bank < 0 ? ' disabled' : '') + '>' + T('Approve repayment') + '</button><button type="button" class="btn-soft" id="unlinkBtn">' + T('Not this move') + '</button>' +
'<span class="note">' + (bank < 0 ? '<b>' + T('The repaid amount is below the loan - check the move') + '</b>' : T('Approval books the final entry dated') + ' <b>' + dmy(o.rdate) + '</b> ' + T('and cancels the months after it.') + (late ? ' <b>' + late + ' ' + T(late === 1 ? 'month booked after the repayment day is removed from Co. (open period only).' : 'months booked after the repayment day are removed from Co. (open period only).') + '</b>' : '')) + (has(o.ren) ? ' ' + T('Repayment entry') + ' ' + entryLnk(o.rey, o.ret, o.ren) + '.' : '') + '</span></div>';
$('repBtn').addEventListener('click', function () {
if (!confirm(T('Approve the repayment of') + ' ' + dmy(o.rdate) + '? ' + T('Bank interest') + ' ' + fm(bank) + ', ' + T('booked') + ' ' + fm(po) + ', ' + T('final entry') + ' ' + fm(r2(bank - po)) + '.')) { return; }
act({ x01: 'repay', x02: o.id });
});
$('unlinkBtn').addEventListener('click', function () { if (confirm(T('Release this repayment move from the loan?'))) { act({ x01: 'unlink', x02: o.id }); } });
} else if (o.st === 'APPROVED') {
for (i = 0; i < G.moves.length; i++) { m = G.moves[i]; s += '<option value="' + m[0] + '/' + m[1] + '">' + m[0] + '/' + m[1] + ' - ' + dmy(m[2]) + ' - ' + fm(+m[3]) + (has(m[4]) ? ' - ' + T('transfer no') + ' ' + m[4] : '') + '</option>'; }
$('repP').innerHTML = T('When the bank move') + ' <b>' + (D.fac ? D.fac[6] : '1010202') + '</b> ' + T('of this loan arrives it is matched by the transfer no or the loan code and shows here. If it is not matched, pick it from the list.');
$('repBox').innerHTML = '<div class="act-line"><div class="filter-group"><label>' + T('Repayment move') + '</label><select id="repSel"><option value="">' + T(G.moves.length ? 'Not repaid yet - pick the move' : 'Not repaid yet - no unmatched move') + '</option>' + s + '</select></div>' +
'<button type="button" class="btn-soft" id="linkBtn"' + (G.moves.length ? '' : ' disabled') + '>' + T('Use this move') + '</button><button type="button" class="btn-act" disabled>' + T('Approve repayment') + '</button></div>';
$('linkBtn').addEventListener('click', function () {
var v = $('repSel').value.split('/');
if (!$('repSel').value) { toast(T('Pick the repayment move first'), true); return; }
act({ x01: 'link', x02: o.id, x03: v[0], x04: v[1] });
});
} else {
$('repP').innerHTML = T('Available once the loan is approved.');
$('repBox').innerHTML = '';
}
}
function steps(o, amt, bank, po, when) {
return '<div class="steps">' +
'<div class="step"><small>1. ' + T('Paid to the bank') + '</small><b>' + fm(amt) + '</b><span>' + T('on') + ' ' + when + '</span></div>' +
'<div class="step"><small>2. ' + T('The loan itself') + '</small><b>' + fm(o.p) + '</b><span>' + T('principal') + '</span></div>' +
'<div class="step"><small>3. ' + T('So the bank charged') + '</small><b>' + fm(bank) + '</b><span>' + fm(amt) + ' - ' + fm(o.p) + '</span></div>' +
'<div class="step"><small>4. ' + T('Already booked') + '</small><b>' + fm(po) + '</b><span>' + T('monthly entries in Co.') + '</span></div>' +
'<div class="step ' + (bank - po >= 0 ? 'good' : 'bad') + '"><small>5. ' + T('Final entry') + '</small><b>' + fm(r2(bank - po)) + '</b><span>3 - 4, ' + T('dated') + ' ' + when + (bank - po < 0 ? ' (' + T('reverses the excess') + ')' : '') + '</span></div></div>';
}
function logTxt(a, key, oldv, newv) {
var e = String(newv || '').match(/entry 101\/(\d+)/), amt = String(newv || '').match(/^([\d,]+\.\d\d)/), mo = String(key || '').match(/(\d\d)\/(\d\d)\/(\d{4})/), rt = String(key || '').match(/margin ([\d.]+) saibor ([\d.]+)/), n;
function month() { return mo ? my(mo[3] + '-' + mo[2] + '-' + mo[1]) : esc(key || ''); }
if (a === 'NEW') { return T('Read from the bank module') + ': ' + esc(key || '') + ' - ' + esc(newv || ''); }
if (a === 'MATCH') { return T('Repayment move matched') + ': ' + esc(key || '') + ' - ' + esc(newv || ''); }
if (a === 'SYNC') { return T('Bank moves read'); }
if (a === 'APPROVE') { n = String(newv || '').match(/(\d+) months/); return T('Approved at') + ' ' + (rt ? pc(+rt[1] + +rt[2]) + ' (' + rt[1] + ' + ' + rt[2] + ')' : esc(key || '')) + (n ? ' - ' + n[1] + ' ' + T('months booked') : ''); }
if (a === 'UNAPPROVE') { return T('Approval undone - back to new') + (rt ? ' (' + T('was') + ' ' + pc(+rt[1] + +rt[2]) + ')' : ''); }
if (a === 'RATE') { return T('Rate changed') + ': ' + esc(oldv || '') + ' ' + ARR + ' ' + esc(String(newv || '').split(' - ')[0]); }
if (a === 'POST') { return T('Booked') + ' ' + (String(key || '').indexOf('final') === 0 ? T('final entry to') + ' ' + esc(key).replace('final ', '') : month()) + (amt ? ': ' + amt[1] : '') + (e ? ' - ' + T('entry') + ' 101/' + e[1] : ''); }
if (a === 'UNPOST') { return T('Booking undone') + ' ' + month() + (oldv ? ' - ' + esc(oldv) : ''); }
if (a === 'POSTERR') { return T('Co. refused') + ' ' + month() + ': ' + esc(newv || ''); }
if (a === 'LINK') { return T('Repayment move linked') + ': ' + esc(key || '') + ' - ' + esc(newv || ''); }
if (a === 'UNLINK') { return T('Repayment move released') + ': ' + esc(key || ''); }
if (a === 'REPAID') { return T('Repayment approved on') + ' ' + esc(key || '') + ' - ' + esc(newv || ''); }
if (a === 'UNDO_REPAY') { return T('Repayment undone - running again') + ' (' + esc(key || '') + ')'; }
if (a === 'CANCEL') { return T('Marked as not a loan'); }
return esc(key || '') + ' ' + esc(newv || '');
}
var LOG_K = { NEW: 'New loan', MATCH: 'Matched', SYNC: 'Sync', APPROVE: 'Approval', UNAPPROVE: 'Undo', RATE: 'Rate', POST: 'Booking', UNPOST: 'Undo', POSTERR: 'Refused', LINK: 'Link', UNLINK: 'Unlink', REPAID: 'Repayment', UNDO_REPAY: 'Undo', CANCEL: 'Cancel' };
function drawLog() {
var i, g, s = '';
for (i = 0; i < G.log.length; i++) {
g = G.log[i];
s += '<tr><td class="lg-at">' + esc(g[0]) + '</td><td>' + esc(g[1] || '') + '</td><td><span class="chip lg-' + esc(g[2]) + '">' + T(LOG_K[g[2]] || g[2]) + '</span></td><td class="lg-tx" title="' + esc((g[3] || '') + ' | ' + (g[4] || '') + ' | ' + (g[5] || '')) + '">' + logTxt(g[2], g[3], g[4], g[5]) + '</td></tr>';
}
$('logBox').innerHTML = s ? '<div class="table-scroll"><table class="lg"><thead><tr><th>' + T('When') + '</th><th>' + T('Who') + '</th><th>' + T('Step') + '</th><th>' + T('What happened') + '</th></tr></thead><tbody>' + s + '</tbody></table></div>' : '<div class="note">' + T('No history yet') + '</div>';
}
return { draw: function () { sync(); drawLoan(); }, months: function () { sync(); drawMonths(); } };
};
