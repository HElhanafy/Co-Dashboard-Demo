(function () {
'use strict';
var sb = document.getElementById('jmSidebar');
if (!sb) { return; }
var body   = document.body,
toggle = document.getElementById('jmSbToggle'),
burger = document.getElementById('jmSbBurger'),
scrim  = document.getElementById('jmSbScrim'),
KEY    = 'jm_sb',
PIN    = 'jm_sb_pin',
pinBtn,
MOBILE = 1024,
wasMobile;
function readState() {
try { return window.localStorage.getItem(KEY); } catch (e) { return null; }
}
function writeState(v) {
try { window.localStorage.setItem(KEY, v); } catch (e) {  }
}
function pinned() {
try { return window.localStorage.getItem(PIN) === '1'; } catch (e) { return false; }
}
function setPin(on) {
try { window.localStorage.setItem(PIN, on ? '1' : '0'); } catch (e) {  }
if (pinBtn) {
pinBtn.className = 'jm-sb-pin' + (on ? ' on' : '');
pinBtn.title = (window.jmT || String)(on ? 'Unpin the menu' : 'Pin the menu open');
pinBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
}
}
function isMobile() {
return window.innerWidth <= MOBILE;
}
function setOpen(open, remember) {
if (open) {
body.className += (body.className ? ' ' : '') + 'jm-sb-open';
} else {
body.className = body.className.replace(/\s*jm-sb-open\b/g, '');
}
if (toggle) { toggle.setAttribute('aria-expanded', open ? 'true' : 'false'); }
if (burger) { burger.setAttribute('aria-expanded', open ? 'true' : 'false'); }
if (remember && !isMobile()) { writeState(open ? '1' : '0'); }
}
function isOpen() {
return /\bjm-sb-open\b/.test(body.className);
}
function flip() {
if (isOpen() && pinned()) { setPin(false); }
setOpen(!isOpen(), true);
}
body.className += (body.className ? ' ' : '') + 'jm-has-sb';
wasMobile = isMobile();
setOpen(!wasMobile && (pinned() || readState() === '1'), false);
(function () {
var head = sb.querySelector('.jm-sb-head');
if (!head) { return; }
pinBtn = document.createElement('button');
pinBtn.type = 'button';
pinBtn.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
+ '<path d="M9 4h6l-1 5 3 3v2H7v-2l3-3z"/><path d="M12 14v6"/></svg>';
head.appendChild(pinBtn);
setPin(pinned());
pinBtn.onclick = function (e) {
var on = !pinned();
if (e && e.stopPropagation) { e.stopPropagation(); }
setPin(on);
if (on && !isOpen()) { setOpen(true, true); }
};
}());
if (toggle) { toggle.onclick = flip; }
if (burger) { burger.onclick = flip; }
if (scrim)  { scrim.onclick  = function () { setOpen(false, false); }; }
sb.addEventListener('click', function (e) {
var n = e.target;
while (n && n !== sb) {
if (n.tagName === 'A' && n.getAttribute('href')) {
if (!pinned()) { writeState('0'); }
return;
}
n = n.parentNode;
}
}, false);
document.addEventListener('click', function (e) {
var n = e.target;
if (!isOpen() || (pinned() && !isMobile())) { return; }
while (n) {
if (n === sb || n === burger) { return; }
n = n.parentNode;
}
setOpen(false, true);
}, false);
document.addEventListener('keydown', function (e) {
var k = e.key || e.keyCode;
if ((k === 'Escape' || k === 'Esc' || k === 27) && isMobile() && isOpen()) {
setOpen(false, false);
}
}, false);
window.addEventListener('resize', function () {
var m = isMobile();
if (m === wasMobile) { return; }
wasMobile = m;
setOpen(m ? false : readState() === '1', false);
}, false);
}());
(function () {
'use strict';
var PROC = 'DASH_REFRESH_AJAX',
POLL = 5000,
info, btn, lbl, row;
function $id(i) { return document.getElementById(i); }
function call(act) {
return apex.server.process(PROC, { x01: act }, { dataType: 'json' });
}
function fail(m) {
btn.disabled = false;
btn.className = btn.className.replace(/\s*spinning\b/g, '');
lbl.textContent = info.label;
alert(m);
}
function done() {
lbl.textContent = 'Done - reloading';
window.location.reload();
}
function poll() {
call('status').done(function (d) {
if (!d || d.err) { fail('Refresh status failed: ' + ((d && d.err) || 'no response')); return; }
if (d.running === 0) { done(); return; }
window.setTimeout(poll, POLL);
}).fail(function () { fail('Refresh status request failed.'); });
}
function run() {
if (!window.confirm('Reload this page\'s data from the source system now?')) { return; }
btn.disabled = true;
btn.className += ' spinning';
lbl.textContent = 'Refreshing...';
call('run').done(function (d) {
if (!d || d.err) { fail('Refresh failed: ' + ((d && d.err) || 'unknown error')); return; }
if (info.mode === 'JOB' && d.running === 1) { lbl.textContent = 'Running in background...'; window.setTimeout(poll, POLL); return; }
done();
}).fail(function () { fail('Refresh request failed. Make sure DASH_REFRESH_AJAX exists.'); });
}
function inject() {
var line = $id('asOfLine'), fresh;
row = document.querySelector('.actions-row');
if (!row || $id('refreshDataBtn') || $id('dashRefreshBtn')) { return; }
if (line && !line.textContent) {
fresh = (info.asOf || '').slice(0, 10) === info.today;
line.className = 'asof-line' + (fresh ? ' fresh' : '');
line.textContent = fresh ? 'Data loaded today ' + info.asOf
: 'Data not loaded today - last load: ' + (info.asOf || 'never');
}
if (info.admin !== 1) { return; }
btn = document.createElement('button');
btn.type = 'button';
btn.id = 'dashRefreshBtn';
btn.className = 'btn-refresh';
btn.title = 'Reload this page\'s data from the source system' +
(info.asOf ? ' (last load ' + info.asOf + ')' : '');
btn.innerHTML =
'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
'<polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline>' +
'<path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>' +
'<span class="rf-label"></span>';
lbl = btn.querySelector('.rf-label');
lbl.textContent = info.label;
btn.onclick = run;
row.insertBefore(btn, row.firstChild);
if (info.running === 1) { btn.disabled = true; btn.className += ' spinning'; lbl.textContent = 'Running in background...'; window.setTimeout(poll, POLL); }
}
function init() {
if (!window.apex || !apex.server) { return; }
call('info').done(function (d) {
if (!d || d.err || d.has !== 1) { return; }
info = d;
inject();
});
}
if (document.readyState === 'loading') {
document.addEventListener('DOMContentLoaded', init, false);
} else {
init();
}
}());
(function () {
'use strict';
function init() {
var sel = document.getElementById('jmSbGroup');
if (!sel || !window.apex || !apex.server) { return; }
var was = sel.value;
sel.addEventListener('change', function () {
var name = sel.options[sel.selectedIndex] ? sel.options[sel.selectedIndex].text : sel.value;
if (!window.confirm('Work in the group "' + name + '"?\nThe page will reload and every report will show the data of this group.')) {
sel.value = was;
return;
}
was = sel.value;
sel.disabled = true;
apex.server.process('DASH_GROUP_AJAX', { x01: 'set', x02: sel.value }, { dataType: 'json' })
.done(function (d) {
if (d && d.ok === 1) { window.location.reload(); return; }
sel.disabled = false;
window.alert('Group not switched: ' + (d && d.err ? d.err : 'unknown error'));
})
.fail(function () { sel.disabled = false; window.alert('Group not switched: request failed'); });
}, false);
}
if (document.readyState === 'loading') {
document.addEventListener('DOMContentLoaded', init, false);
} else {
init();
}
}());
(function () {
'use strict';
function init() {
var sb = document.getElementById('jmSidebar');
if (!sb) { return; }
var mods = sb.querySelectorAll('.jm-sb-mod');
if (!mods.length) { return; }
Array.prototype.forEach.call(mods, function (mod) {
var head = mod.querySelector('.jm-sb-group'),
here = !!mod.querySelector('.jm-sb-item.is-active');
mod.className = here ? 'jm-sb-mod is-open' : 'jm-sb-mod';
if (head) {
head.addEventListener('click', function () {
var on = mod.className.indexOf('is-open') === -1;
mod.className = on ? 'jm-sb-mod is-open' : 'jm-sb-mod';
}, false);
}
});
}
if (document.readyState === 'loading') {
document.addEventListener('DOMContentLoaded', init, false);
} else {
init();
}
}());
(function () {
'use strict';
function init() {
var sb = document.getElementById('jmSidebar');
if (!sb) { return; }
sb.addEventListener('click', function (e) {
var n = e.target, mod, t;
if (/\bjm-sb-open\b/.test(document.body.className) || window.innerWidth <= 1024) { return; }
while (n && n !== sb) {
if (n.className && String(n.className).split(' ')[0] === 'jm-sb-group') { break; }
n = n.parentNode;
}
if (!n || n === sb) { return; }
e.stopPropagation();
mod = n.parentNode;
Array.prototype.forEach.call(sb.querySelectorAll('.jm-sb-mod'), function (m) {
m.className = m === mod ? 'jm-sb-mod is-open' : 'jm-sb-mod';
});
t = document.getElementById('jmSbToggle');
if (t) { t.click(); }
}, true);
}
if (document.readyState === 'loading') {
document.addEventListener('DOMContentLoaded', init, false);
} else {
init();
}
}());
(function () {
'use strict';
var hdr = document.getElementById('jmHdr');
if (!hdr) { return; }
function pwdDialog() {
var $id  = function (i) { return document.getElementById(i); },
btn  = $id('jmHdrPwd'),
box  = $id('jmPwd'),
cur  = $id('jmPwdCur'),
nw   = $id('jmPwdNew'),
nw2  = $id('jmPwdNew2'),
msg  = $id('jmPwdMsg'),
save = $id('jmPwdSave'),
busy = false;
if (!btn || !box || !window.apex || !apex.server) { return; }
document.body.appendChild(box);
function say(t, ok) {
msg.textContent = t || '';
msg.className = 'jm-pwd-msg' + (ok ? ' ok' : '');
}
function open() {
cur.value = ''; nw.value = ''; nw2.value = '';
cur.type = 'password'; nw.type = 'password'; nw2.type = 'password';
Array.prototype.forEach.call(box.querySelectorAll('.jm-pwd-eye'), function (eye) {
eye.className = 'jm-pwd-eye';
});
say('');
save.disabled = false;
box.removeAttribute('hidden');
window.setTimeout(function () { cur.focus(); }, 30);
}
function close() {
if (busy) { return; }
box.setAttribute('hidden', '');
cur.value = ''; nw.value = ''; nw2.value = '';
}
function submit() {
if (busy) { return; }
if (!cur.value || !nw.value || !nw2.value) { say('All three fields are required.'); return; }
if (nw.value !== nw2.value) { say('The new password and its confirmation differ.'); nw2.focus(); return; }
busy = true;
save.disabled = true;
say('Saving...', true);
apex.server.process('DASH_ACCOUNT_AJAX',
{ x01: 'chgpwd', x02: cur.value, x03: nw.value },
{ dataType: 'json' })
.done(function (d) {
busy = false;
if (d && d.ok === 1) {
say('Password changed.', true);
window.setTimeout(close, 900);
return;
}
save.disabled = false;
say('Not changed: ' + ((d && d.err) ? d.err : 'unknown error'));
})
.fail(function () {
busy = false;
save.disabled = false;
say('Not changed: request failed.');
});
}
Array.prototype.forEach.call(box.querySelectorAll('.jm-pwd-eye'), function (eye) {
eye.addEventListener('click', function () {
var inp = $id(eye.getAttribute('data-for')),
on  = eye.className.indexOf(' on') !== -1;
if (!inp) { return; }
inp.type = on ? 'password' : 'text';
eye.className = on ? 'jm-pwd-eye' : 'jm-pwd-eye on';
inp.focus();
}, false);
});
btn.addEventListener('click', open, false);
$id('jmPwdClose').addEventListener('click', close, false);
$id('jmPwdCancel').addEventListener('click', close, false);
save.addEventListener('click', submit, false);
box.addEventListener('click', function (e) { if (e.target === box) { close(); } }, false);
box.addEventListener('keydown', function (e) {
var k = e.key || e.keyCode;
if (k === 'Escape' || k === 'Esc' || k === 27) { close(); }
if (k === 'Enter' || k === 13) { e.preventDefault(); submit(); }
}, false);
}
function langPill() {
var pill = document.getElementById('jmHdrLang'),
T = window.jmT || function (s) { return s; };
if (!pill || !window.apex || !apex.server) { return; }
pill.removeAttribute('hidden');
pill.addEventListener('click', function (e) {
var b = e.target;
while (b && b !== pill && b.tagName !== 'BUTTON') { b = b.parentNode; }
if (!b || b === pill || b.className === 'on' || pill.className.indexOf('busy') !== -1) { return; }
pill.className = 'jm-hdr-lang busy';
apex.server.process('DASH_ACCOUNT_AJAX',
{ x01: 'lang', x02: b.getAttribute('data-lang') },
{ dataType: 'json' })
.done(function (d) {
if (d && d.ok === 1) {
document.cookie = 'JM_LANG=' + b.getAttribute('data-lang') + '; path=/; SameSite=Lax';
window.location.reload();
return;
}
pill.className = 'jm-hdr-lang';
window.alert(T('Language not changed') + ': ' + ((d && d.err) ? d.err : 'unknown error'));
})
.fail(function () {
pill.className = 'jm-hdr-lang';
window.alert(T('Language not changed') + ': request failed');
});
}, false);
}
function init() {
document.body.insertBefore(hdr, document.body.firstChild);
document.body.className += (document.body.className ? ' ' : '') + 'jm-has-hdr';
hdr.removeAttribute('hidden');
pwdDialog();
langPill();
var sel = document.getElementById('jmHdrGroup');
if (!sel || !window.apex || !apex.server) { return; }
var prev = sel.value;
sel.addEventListener('change', function () {
var opt  = sel.options[sel.selectedIndex],
name = opt ? opt.text : sel.value,
msg  = 'Work in the group: ' + name + String.fromCharCode(10) +
'The page will reload and every report will show the data of this group.';
if (!window.confirm(msg)) { sel.value = prev; return; }
prev = sel.value;
sel.disabled = true;
apex.server.process('DASH_GROUP_AJAX',
{ x01: 'set', x02: sel.value },
{ dataType: 'json' })
.done(function (d) {
if (d && d.ok === 1) { window.location.reload(); return; }
sel.disabled = false;
window.alert('Group not switched: ' + ((d && d.err) ? d.err : 'unknown error'));
})
.fail(function () {
sel.disabled = false;
window.alert('Group not switched: request failed');
});
}, false);
}
if (document.readyState === 'complete') {
init();
} else {
window.addEventListener('load', init, false);
}
}());
(function () {
var GP = ['STOCK', 'STVAL', 'EXPIRY', 'MOVE', 'ITCARD', 'COSTCHK', 'PRICES'], DASH = String.fromCharCode(8212), SEP = '<span class="pf-sep">|</span>';
function on() { var i; for (i = 0; i < GP.length; i++) { if (GP[i] === window.JM_PAGE) { return true; } } return false; }
function mark() { if (on() && document.body.className.indexOf('jm-gp') === -1) { document.body.className += ' jm-gp'; } }
if (document.readyState !== 'loading') { mark(); } else { document.addEventListener('DOMContentLoaded', mark, false); }
window.addEventListener('beforeprint', function () {
if (!on()) { return; }
mark();
var T = window.jmT || function (s) { return s; }, wrap = document.querySelector('.wrap'),
th = document.querySelector('#printTablePanel .print-title-row th'), pf = document.getElementById('printFilters'),
table = document.body.className.indexOf('print-mode-table') !== -1, d = new Date(),
p = function (n) { return (n < 10 ? '0' : '') + n; }, hm = p(d.getHours()) + ':' + p(d.getMinutes()),
box = document.getElementById('jmPrintHead'), st = document.getElementById('jmGpFit'), segs, title, at, rows, k, H, i, dt,
sv = document.getElementById('svPTitle') || document.getElementById('mvcPTitle'), sh = sv && sv.querySelector('.pt-h'), src = sh ? sh.textContent : (th ? th.textContent : '');
if (!st) { st = document.createElement('style'); st.id = 'jmGpFit'; }
document.body.appendChild(st);
st.textContent = '';
if (!wrap || !src) { if (box) { box.innerHTML = ''; } return; }
segs = src.split(/\s+\|\s+/);
if (segs.length < 2) { segs = src.split(' ' + DASH + ' '); segs = [segs.shift(), segs.join(' ' + DASH + ' ')]; }
segs.shift();
title = (segs.shift() || '').split(String.fromCharCode(8250))[0].replace(/\s+$/, '');
at = segs.join('  |  ');
if (at.indexOf(hm) === -1) { at += (at ? '  |  ' : '') + T('Printed ' + p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + hm); }
segs = sv && sv.querySelector('.pt-s') ? sv.querySelector('.pt-s').innerHTML.split(new RegExp('(?:\\s|&nbsp;)*' + String.fromCharCode(183) + '(?:\\s|&nbsp;)*')) : (pf ? pf.innerHTML.split(SEP) : []);
for (i = segs.length - 1; i >= 0; i--) {
dt = segs[i].replace(/<[^>]*>/g, '').match(/\d\d\/\d\d\/\d{4} \d\d:\d\d/);
if ((dt && at.indexOf(dt[0]) !== -1) || segs[i].indexOf(hm) !== -1) { segs.splice(i, 1); }
}
if (!box) { box = document.createElement('div'); box.id = 'jmPrintHead'; wrap.insertBefore(box, wrap.firstChild); }
box.innerHTML = '<div class="ph-top"><b class="ph-co"></b><span class="ph-at"></span></div><div class="ph-title"></div><div class="ph-meta">'
+ segs.join(SEP) + '</div>';
box.querySelector('.ph-co').textContent = T('Co. Dashboard');
box.querySelector('.ph-at').textContent = T(at);
box.querySelector('.ph-title').textContent = T(title);
rows = document.querySelectorAll('#printTablePanel tr').length - 1;
H = 700 - 70 - (sv ? 160 : table ? 0 : 120);
k = H / Math.max(rows, 1) / 16.4;
if (k > 1) { k = Math.min(k, 1.3); while (k > 1 && rows * 16.4 / 14.2 * (8.5 * k * 1.3 + 2 * Math.min(1.5 + (k - 1) * 12, 5) + 1) > H * 0.96) { k -= 0.02; } }
if (k >= 0.72 && Math.abs(k - 1) > 0.01) {
st.textContent = '@media print{body.jm-gp #printTablePanel table,body.jm-gp #printTablePanel th,body.jm-gp #printTablePanel td{font-size:' + (8.5 * k).toFixed(1) + 'px !important}'
+ 'body.jm-gp #printTablePanel th,body.jm-gp #printTablePanel td{padding:' + (k > 1 ? Math.min(1.5 + (k - 1) * 12, 5) : 1.5 * k).toFixed(1) + 'px ' + (k > 1 ? 6 : 4) + 'px !important;line-height:' + (k > 1 ? 1.3 : 1.1) + ' !important}}';
}
}, false);
}());
