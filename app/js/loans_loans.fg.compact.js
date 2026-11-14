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
planned = X.planned, ageInfo = X.ageInfo, rateOf = X.rateOf, entryLnk = X.entryLnk, act = X.act, printTitle = X.printTitle, toast = X.toast, ST_TXT = X.ST_TXT, stTxt = X.stTxt, chgTxt = X.chgTxt, CALC = null, LAST = null, SBX = null, SBS = '',
SEP = String.fromCharCode(8250), ARR = String.fromCharCode(8594);
function sync() { var s = X.s(); D = s.D; G = s.G; CUR = s.CUR; }
function month(r) { return { id: r[0], seq: r[1], from: r[2], to: r[3], days: r[4], rate: +r[5], amt: +r[6], kind: r[7], st: r[8], ey: r[9], et: r[10], en: r[11], edate: r[12], by: r[13], at: r[14], cby: r[15], cat: r[16], note: r[17] }; }
function rs(x) { return (+x).toFixed(4).replace(/0{1,2}$/, ''); }
function agrNum() { var e = $('agIn'), v = e ? parseFloat(String(e.value).replace(/,/g, '')) : NaN; return isNaN(v) || v <= 0 ? null : v; }
function agrCalc(o, a) { var d = r2(Math.abs(a - o.p)), per = d / o.p * 100; return { diff: d, per: per, yr: per * o.basis / o.term }; }
function agrRow(o, ro) {
return '<div class="agr"><div class="filter-group"><label>' + T('Agreement value') + '</label><input type="text" id="agIn" value="' + (has(o.agr) ? fm(o.agr) : '') + '" placeholder="0.00" autocomplete="off"' + (ro ? ' disabled' : '') + '></div><div class="eq">&minus;</div>' +
'<div class="filter-group"><label>' + T('Received in the bank') + '</label><div class="agr-v">' + fm(o.p) + '</div></div><div class="eq" id="agTxt"></div></div>';
}
function drawAgr() {
var o = CUR, a = agrNum(), c, tot, h = '';
if (!$('agTxt')) { return; }
if (a) {
c = agrCalc(o, a); tot = o.st === 'NEW' ? (CALC ? planned(o, CALC.fx + CALC.sb).total : null) : o.tot;
h = '= ' + fm(c.diff) + ' <small>' + T('difference') + '</small> &nbsp;' + ARR + '&nbsp; ' + pc(c.per) + ' <small>' + T('for') + ' ' + o.term + ' ' + T('days') + '</small> = ' + pc(c.yr) + ' <small>' + T('a year') + '</small>' +
(tot !== null && Math.abs(tot - c.diff) >= 0.005 ? ' <span class="chip ag3">' + T('The interest is not the agreement difference') + ': ' + fm(tot) + '</span>' : '');
}
$('agTxt').innerHTML = h;
}
function autoSb() {
var o = CUR, a = agrNum(), f = parseFloat($('fxIn').value);
if (a) { SBX = Math.round((agrCalc(o, a).yr - (isNaN(f) ? 0 : f)) * 1e10) / 1e10; SBS = rs(SBX); $('sbIn').value = SBS; }
liveRate();
}
function rateInputs(o, ro) {
SBX = has(o.sb) ? o.sb : null; SBS = has(o.sb) ? rs(o.sb) : '';
return '<div class="filter-group"><label>' + T('Bank margin %') + '</label><input type="text" id="fxIn" value="' + rs(o.fx) + '" autocomplete="off"' + (ro ? ' disabled' : '') + '></div><div class="eq">+</div>' +
'<div class="filter-group"><label>SAIBOR % <span class="lbl-hint">(' + T('3 months') + ')</span></label><input type="text" id="sbIn" value="' + SBS + '" placeholder="0.00" autocomplete="off"' + (ro ? ' disabled' : '') + '></div>' +
'<div class="eq" id="eqTxt">= ' + pc(rateOf(o)) + ' <small>' + T('a year') + '</small></div>';
}
function typed() { var f = parseFloat($('fxIn').value), s = SBX !== null && $('sbIn').value === SBS ? SBX : parseFloat($('sbIn').value); return { fx: isNaN(f) ? null : f, sb: isNaN(s) ? null : s, agr: agrNum() }; }
function liveRate() { var t = typed(); $('eqTxt').innerHTML = '= ' + pc((t.fx || 0) + (t.sb || 0)) + ' <small>' + T('a year') + '</small>'; if (CUR.st === 'NEW') { CALC = null; drawCalc(); } }
function drawStory() {
var o = CUR, left = days(D.today, o.due), sb = o.st === 'NEW' ? !!CALC : has(o.sb), rate = o.st === 'NEW' ? (CALC ? CALC.fx + CALC.sb : 0) : rateOf(o), tot = o.st === 'NEW' ? (CALC ? planned(o, rate).total : 0) : o.tot;
$('story').innerHTML =
'<div class="it"><small>' + T('Taken on') + '</small><b class="d">' + dmy(o.draw) + '</b></div>' +
'<div class="it"><small>' + T('Amount') + '</small><b>' + fm(o.p) + '</b></div>' +
'<div class="it"><small>' + T('Rate a year') + '</small><b>' + (sb ? pc(rate) : '<span class="muted-dash">' + pc(o.fx) + ' + SAIBOR ?</span>') + '</b></div>' +
'<div class="it"><small>' + T(o.st === 'REPAID' ? 'Interest the bank charged' : 'Interest until the due date') + '</small><b>' + (sb ? fm(tot) : '<span class="muted-dash">&mdash;</span>') + '</b></div>' +
'<div class="it"><small>' + T(o.st === 'REPAID' ? 'Paid back' : 'To pay back on the due date') + '</small><b>' + (o.st === 'REPAID' ? fm(o.ramt) : sb ? fm(o.p + tot) : '<span class="muted-dash">&mdash;</span>') + '</b></div>' +
'<div class="it"><small>' + T('Due on') + '</small><b class="d">' + dmy(o.due) + '</b></div>' +
'<div class="it"><small>' + T(o.st === 'REPAID' ? 'Repaid on' : 'Days left') + '</small><b class="d">' + (o.st === 'REPAID' ? dmy(o.rdate) : left >= 0 ? left + ' ' + T('of') + ' ' + o.term : T('overdue')) + '</b></div>';
}
function drawCalc() { drawStory(); drawMonths(); drawAgr(); if ($('draftBtn')) { $('draftBtn').disabled = !CALC; $('apprBtn').disabled = !CALC; } }
function drawLoan() {
var o = CUR, a = ageInfo(o), sb = has(o.sb), rate = rateOf(o), lock;
$('crumb').innerHTML = '<span class="crumb">' + T('Bank Loans') + '</span><span class="crumb-sep">' + SEP + '</span><span class="crumb crumb-last">' + esc(o.code || ('1010201/' + o.dser)) + '</span>';
$('scopeNote').innerHTML = '<span class="chip st-' + o.st + '">' + stTxt(o) + '</span> &nbsp; <span class="chip ' + a.k + '">' + a.t + '</span>' + (o.chg ? ' &nbsp; <span class="chip ag3">' + chgTxt(o) + '</span>' : '');
$('l1Title').textContent = (o.code || ('1010201/' + o.dser)) + (o.sup ? ' - ' + o.sup : '');
$('l1Sub').innerHTML = T('Bank move') + ' ' + o.dtype + '/' + o.dser + (has(o.den) ? ' - ' + T('entry') + ' ' + entryLnk(o.dey, o.det, o.den) : '') + (o.acc ? ' - ' + T('account') + ' ' + o.acc : '');
$('l1Sub').title = o.desc || '';
if (LAST !== o.id) { LAST = o.id; $('logTog').className = 'sec-h sec-tog'; }
CALC = o.st === 'NEW' && sb ? { fx: o.fx, sb: o.sb, agr: o.agr } : null;
drawStory();
if (o.st === 'NEW') {
$('rateP').innerHTML = T('Enter the agreement value or both rates, then Calculate.');
$('rateBox').innerHTML = agrRow(o) + rateInputs(o) + '<button type="button" class="btn-soft" id="calcBtn">' + T('Calculate') + '</button><button type="button" class="btn-soft" id="draftBtn">' + T('Save as draft') + '</button><button type="button" class="btn-act" id="apprBtn">' + T('Approve loan') + '</button>' +
'<span class="note">' + (CALC ? T('Draft saved - nothing is booked until the approval.') : T('Nothing is booked until the approval.')) + '</span>';
$('calcBtn').addEventListener('click', function () {
var t = typed();
if (!has(t.fx) || !has(t.sb) || t.fx < 0 || t.sb < 0) { toast(T('Enter the bank margin and the SAIBOR rate'), true); return; }
CALC = t; drawCalc();
});
$('draftBtn').addEventListener('click', function () { if (CALC) { act({ x01: 'draft', x02: o.id, x03: CALC.fx, x04: CALC.sb, x05: CALC.agr || '' }); } });
$('apprBtn').addEventListener('click', function () {
if (!CALC) { return; }
if (!confirm(T('Approve this loan at') + ' ' + pc(CALC.fx + CALC.sb) + ' ' + T('a year') + ' (' + pc(CALC.fx) + ' + ' + pc(CALC.sb) + ')? ' + T('Every month is booked in Co. now, each dated at its month end.'))) { return; }
act({ x01: 'approve', x02: o.id, x03: CALC.fx, x04: CALC.sb, x05: CALC.agr || '' });
});
$('draftBtn').disabled = !CALC; $('apprBtn').disabled = !CALC;
} else if (o.st === 'APPROVED') {
lock = has(G.close) && utc(G.close) >= utc(G.first || o.draw) ? T('The ledger is closed up to') + ' ' + dmy(G.close) + ' - ' + T('the approval cannot be undone until the reviewer reopens the year in Co.') : G.rev ? G.rev + ' ' + T('entries of this loan are reviewed in Co. - the approval cannot be undone until the review is removed') : '';
$('rateP').innerHTML = T('Rate in force') + ': <b>' + pc(o.fx) + ' ' + T('bank margin') + ' + ' + pc(o.sb) + ' SAIBOR = ' + pc(rate) + ' ' + T('a year') + '</b>';
$('rateBox').innerHTML = (has(o.agr) ? agrRow(o, true) : '') + rateInputs(o, true) + '<button type="button" class="btn-act ghost" id="unapprBtn">' + T('Undo approval') + '</button>' + '<span class="note">' + (o.pm ? o.pm + ' ' + T(o.pm === 1 ? 'month' : 'months') + ' ' + T('booked in Co.') : T('no month booked yet')) + (o.apby ? ' - ' + T('approved by') + ' ' + esc(o.apby) + ' ' + o.apat : '') + '</span>' + (lock ? '<span class="chip ag3">' + lock + '</span>' : '');
$('unapprBtn').addEventListener('click', function () { if (confirm(T('Undo the approval? Every month entry of this loan is deleted in Co. and the loan goes back to a draft.'))) { act({ x01: 'unapprove', x02: o.id }); } });
} else {
$('rateP').innerHTML = T('Rate used') + ': <b>' + pc(o.fx) + ' ' + T('bank margin') + ' + ' + pc(o.sb) + ' SAIBOR = ' + pc(rate) + ' ' + T('a year') + '</b>';
$('rateBox').innerHTML = '<span class="note">' + T('No action.') + (o.apby ? ' ' + T('Approved by') + ' ' + esc(o.apby) + ' ' + o.apat + '.' : '') + '</span>';
}
if (o.st === 'NEW') { $('agIn').addEventListener('input', autoSb); $('agIn').addEventListener('blur', function () { var a = agrNum(); if (a) { this.value = fm(a); } }); $('fxIn').addEventListener('input', autoSb); $('sbIn').addEventListener('input', liveRate); }
drawAgr();
drawMonths();
drawRepay();
drawLog();
}
function drawMonths() {
var o = CUR, rows = [], i, m, b = '', tot = 0, tD = 0, po = 0, nx = null, rate, t, pv, lastPosted = -1, cnt = 0;
if (o.st === 'NEW') {
rate = CALC ? CALC.fx + CALC.sb : 0;
if (CALC) { pv = planned(o, rate); rows = pv.rows; tot = pv.total; }
$('schP').innerHTML = !CALC ? T('Not calculated yet') : T('Each month') + ': <b>' + fm(o.p) + ' x ' + pc(rate) + ' x ' + T('days') + ' / ' + o.basis + '</b>';
} else {
for (i = 0; i < G.months.length; i++) { m = month(G.months[i]); rows.push(m); if (m.st === 'POSTED') { po += m.amt; lastPosted = i; } if (m.st !== 'CANCELLED') { tot += m.amt; } }
for (i = 0; i < rows.length; i++) { if (rows[i].st === 'PLANNED') { nx = rows[i]; break; } }
$('schP').innerHTML = T('Each month') + ': <b>' + fm(o.p) + ' x ' + pc(rateOf(o)) + ' x ' + T('days') + ' / ' + o.basis + '</b>' + (o.st === 'APPROVED' && nx ? ' <b>' + T('A month still waiting was refused by Co. - press Book now or wait for the job.') + '</b>' : '');
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
if (!cnt) { b = '<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:18px">' + T(o.st === 'NEW' ? 'Not calculated yet' : 'No months yet') + '</td></tr>'; }
b += '<tr class="total-row"><td>' + T('TOTAL') + '</td><td></td><td></td><td class="num">' + tD + '</td><td class="num">' + fm(tot) + '</td><td colspan="2">' + (o.st === 'REPAID' ? T('what the bank charged') : o.st === 'NEW' ? T(CALC ? 'planned at the calculated rate' : 'not calculated yet') : T('booked') + ' ' + fm(po) + ' - ' + T('still to book') + ' ' + fm(r2(tot - po))) + '</td></tr>';
$('schBody').innerHTML = b;
$('schTable').querySelector('.print-title-row th').textContent = printTitle();
}
function drawRepay() {
var o = CUR, i, m, s = '', po = 0, bank, late = 0;
for (i = 0; i < G.months.length; i++) { m = month(G.months[i]); if (m.st === 'POSTED' && m.kind === 'M') { if (has(o.rdate) && utc(m.to) > utc(o.rdate)) { late++; } else { po += m.amt; } } }
if (o.st === 'REPAID') {
bank = has(o.bank) ? o.bank : r2(o.ramt - o.p);
$('repP').innerHTML = T('The bank move') + ' <b>' + o.rtype + '/' + o.rser + ' ' + T('of') + ' ' + dmy(o.rdate) + '</b> ' + T('paid the loan back.');
$('repBox').innerHTML = steps(o, o.ramt, bank, po, dmy(o.rdate)) + '<div class="act-line"><span class="note">' + T('Approved by') + ' ' + esc(o.rpby || '') + ' ' + (o.rpat || '') + '. ' + T('The months after the repayment were cancelled; they were never booked.') + (has(o.ren) ? ' ' + T('Repayment entry') + ' ' + entryLnk(o.rey, o.ret, o.ren) + '.' : '') + '</span>' + (G.adm ? '<button type="button" class="btn-act ghost" id="unrepBtn">' + T('Undo repayment') + '</button>' : '') + '</div>';
if ($('unrepBtn')) { $('unrepBtn').addEventListener('click', function () { if (confirm(T('Undo the repayment? The final entry is deleted in Co. (open period, not reviewed), the loan goes back to running and the months after the repayment are planned again.'))) { act({ x01: 'undorepay', x02: o.id }); } }); }
} else if (o.st === 'APPROVED' && has(o.rser)) {
bank = r2(o.ramt - o.p);
$('repP').innerHTML = T('The bank move') + ' <b>' + o.rtype + '/' + o.rser + ' ' + T('of') + ' ' + dmy(o.rdate) + '</b> ' + T('is linked - check, then approve.');
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
$('repP').innerHTML = T('Waiting for the bank move') + ' <b>' + (D.fac ? D.fac[6] : '1010202') + '</b>';
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
if (a === 'UNAPPROVE') { return T('Approval undone - back to a draft') + (rt ? ' (' + T('was') + ' ' + pc(+rt[1] + +rt[2]) + ')' : ''); }
if (a === 'DRAFT') { return T('Draft rate saved') + ': ' + esc(newv || ''); }
if (a === 'MOVE') { return (String(newv || '').indexOf('flagged') > 0 ? T('The bank move changed in Co.') + ' (' + T('flagged only') + ')' : T('The bank move changed in Co. and the loan followed it')) + ': ' + esc(oldv || '') + ' ' + ARR + ' ' + esc(String(newv || '').split(' - ')[0]); }
if (a === 'GONE') { return T('The bank move was deleted in Co.'); }
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
var LOG_K = { NEW: 'New loan', MATCH: 'Matched', SYNC: 'Sync', APPROVE: 'Approval', UNAPPROVE: 'Undo', RATE: 'Rate', POST: 'Booking', UNPOST: 'Undo', POSTERR: 'Refused', LINK: 'Link', UNLINK: 'Unlink', REPAID: 'Repayment', UNDO_REPAY: 'Undo', CANCEL: 'Cancel', DRAFT: 'Draft', MOVE: 'Move', GONE: 'Deleted' };
function drawLog() {
var i, g, s = '';
for (i = 0; i < G.log.length; i++) {
g = G.log[i];
s += '<tr><td class="lg-at">' + esc(g[0]) + '</td><td>' + esc(g[1] || '') + '</td><td><span class="chip lg-' + esc(g[2]) + '">' + T(LOG_K[g[2]] || g[2]) + '</span></td><td class="lg-tx" title="' + esc((g[3] || '') + ' | ' + (g[4] || '') + ' | ' + (g[5] || '')) + '">' + logTxt(g[2], g[3], g[4], g[5]) + '</td></tr>';
}
$('logBox').innerHTML = s ? '<div class="table-scroll"><table class="lg"><thead><tr><th>' + T('When') + '</th><th>' + T('Who') + '</th><th>' + T('Step') + '</th><th>' + T('What happened') + '</th></tr></thead><tbody>' + s + '</tbody></table></div>' : '<div class="note">' + T('No history yet') + '</div>';
$('logN').textContent = G.log && G.log.length ? '(' + G.log.length + ')' : '';
}
$('logTog').addEventListener('click', function () { this.className = this.className === 'sec-h sec-tog' ? 'sec-h sec-tog open' : 'sec-h sec-tog'; });
return { draw: function () { sync(); drawLoan(); }, months: function () { sync(); drawMonths(); } };
};
