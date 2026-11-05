window.addEventListener("DOMContentLoaded",function(){
(function () {
var USERS   = typeof APEX_USERS_DATA   !== 'undefined' ? APEX_USERS_DATA   : [];
var SYS     = typeof APEX_SYSTEM_USERS !== 'undefined' ? APEX_SYSTEM_USERS : [];
var GROUPS  = typeof APEX_GROUPS       !== 'undefined' ? APEX_GROUPS       : [];
var REPORTS = typeof APEX_REPORTS      !== 'undefined' ? APEX_REPORTS      : [];
var DASH = String.fromCharCode(8212), SEP = ' ' + String.fromCharCode(8250) + ' ';
function idxOf(a, v) { for (var i = 0; i < a.length; i++) if (a[i] === v) return i; return -1; }
function hasVal(a, v) { return idxOf(a, v) !== -1; }
function $(id) { return document.getElementById(id); }
function esc(s) { return String(s === null || s === undefined ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function each(list, fn) { Array.prototype.forEach.call(list, fn); }
var SVG = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
var I_EYE   = '<svg width="16" height="16" ' + SVG + '><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
var I_EYEOFF = '<svg width="16" height="16" ' + SVG + '><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"></path><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"></path><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';
var I_EDIT  = '<svg width="15" height="15" ' + SVG + '><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>';
var I_KEY   = '<svg width="15" height="15" ' + SVG + '><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>';
var I_COPY  = '<svg width="15" height="15" ' + SVG + '><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
var I_DEL   = '<svg width="15" height="15" ' + SVG + '><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
var I_LOCK  = '<svg width="14" height="14" ' + SVG + '><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>';
var I_REFR  = '<svg width="15" height="15" ' + SVG + '><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>';
var MODULES = [], REP = {}, GRP = {}, SYSN = {};
REPORTS.forEach(function (r) { r.up = String(r.name).toUpperCase(); REP[r.up] = r; if (!hasVal(MODULES, r.module)) MODULES.push(r.module); });
GROUPS.forEach(function (g) { GRP[String(g.passNum)] = g.desc || ''; });
SYS.forEach(function (s) { SYSN[String(s.code)] = s.name || ''; });
function splitReps(s) { if (!s) return []; if (Object.prototype.toString.call(s) === '[object Array]') return s; return String(s).split(',').map(function (x) { return x.trim(); }).filter(Boolean); }
function norm(u) {
u.code = String(u.code);
u.isAdmin = String(u.role || '').toUpperCase() === 'ADMIN';
u.role = u.isAdmin ? 'Admin' : 'Normal';
u.seeCost = u.seeCost === 'Y' || u.seeCost === true;
u.allReports = u.allReports === 'Y' || u.allReports === true;
u.canRefresh = u.canRefresh === 'Y' || u.canRefresh === true;
u.grpList = splitReps(u.groups);
u.passNum = u.grpList[0] || '';
u.groupName = u.grpList.map(function (g) { return GRP[g] || g; }).join(' ');
u.repList = splitReps(u.reports);
u.repUp = u.repList.map(function (n) { return n.toUpperCase(); });
return u;
}
USERS.forEach(norm);
function hasRep(u, up) { return hasVal(u.repUp, up); }
function userByCode(c) { for (var i = 0; i < USERS.length; i++) if (USERS[i].code === String(c)) return USERS[i]; return null; }
var qry = '', show = '', open = {}, openG = {};
var tBody = $('usersTableBody'), noteEl = $('tableNote'), chipsEl = $('showChips'), statsEl = $('umStats');
var searchInput = $('searchInput'), searchClr = $('searchClr');
function userOk(u) {
var q = qry.toLowerCase();
if (q && u.code.toLowerCase().indexOf(q) === -1 && String(u.name || '').toLowerCase().indexOf(q) === -1 && String(u.groupName || '').toLowerCase().indexOf(q) === -1) return false;
if (show === 'adm' && !u.isAdmin) return false;
if (show === 'nrm' && u.isAdmin) return false;
if (show === 'all' && !(u.isAdmin || u.allReports)) return false;
if (show === 'cost' && !(u.isAdmin || u.seeCost)) return false;
if (show === 'refr' && !(u.isAdmin || u.canRefresh)) return false;
if (show === 'none' && (u.isAdmin || u.repList.length)) return false;
return true;
}
function chip(v, lb, n, tip) {
return '<span class="sk-chip' + (show === v ? ' on' : '') + '" data-k="' + v + '"><button type="button" class="ck" title="' + esc(tip) + '">' + lb + (n ? '<small>' + n + '</small>' : '') + '</button></span>';
}
function paintChips() {
var nAdm = 0, nNrm = 0, nAll = 0, nCost = 0, nRefr = 0, nNone = 0;
USERS.forEach(function (u) {
if (u.isAdmin) nAdm++; else nNrm++;
if (u.isAdmin || u.allReports) nAll++;
if (u.isAdmin || u.seeCost) nCost++;
if (u.isAdmin || u.canRefresh) nRefr++;
if (!u.isAdmin && !u.repList.length) nNone++;
});
chipsEl.innerHTML = chip('', 'All users', 0, 'No filter') +
chip('adm', 'Administrators', nAdm, 'Role Admin: every report, every cost, no data group') +
chip('nrm', 'Normal users', nNrm, 'Role Normal: the reports and group given here') +
chip('all', 'All reports', nAll, 'Users who see every report (Admin or the All reports switch)') +
chip('cost', 'See cost', nCost, 'Users who see cost and profit columns') +
chip('refr', 'May refresh', nRefr, 'Users who may press the Refresh button of a report') +
chip('none', 'No reports', nNone, 'Normal users with no report at all');
each(chipsEl.querySelectorAll('.sk-chip'), function (ch) {
ch.querySelector('.ck').addEventListener('click', function () { show = ch.getAttribute('data-k') || ''; render(); });
});
statsEl.innerHTML = '<b>' + USERS.length + '</b> users' + SEP + nAdm + ' admin' + SEP + nNrm + ' normal';
}
function repBadges(u) {
if (u.isAdmin) return '<span class="rb rb-all" title="Administrator: every report">All reports</span>';
var html = '';
if (u.allReports) {
html = '<span class="rb rb-all" title="All reports switch: every report now and in the future">All reports</span>';
if (hasRep(u, 'USER MANAGEMENT')) html += '<span class="rb rb-admin">User Management</span>';
return html;
}
if (!u.repList.length) return '<span class="rb rb-none">No reports</span>';
var unk = [], nr = 0, nm = 0, tip = [];
MODULES.forEach(function (m) {
var names = u.repList.filter(function (n) { var r = REP[n.toUpperCase()]; return r && r.module === m; });
if (names.length) { nr += names.length; nm++; tip.push(m + ' ' + names.length); }
});
if (nr) html += '<span class="rb rb-sales" title="' + esc(tip.join(', ')) + '">' + nr + (nr === 1 ? ' report' : ' reports') + '<small>' + nm + (nm === 1 ? ' module' : ' modules') + '</small></span>';
u.repList.forEach(function (n) { if (!REP[n.toUpperCase()]) unk.push(n); });
if (unk.length) html += '<span class="rb rb-none" title="' + esc(unk.join(', ')) + '">Not in catalogue<small>' + unk.length + '</small></span>';
return html + '<button type="button" class="rb-more" data-c="' + esc(u.code) + '" title="List the reports">' + (open[u.code] ? '&#9650;' : '&#9660;') + '</button>';
}
function repDetail(u) {
var html = '';
MODULES.forEach(function (m) {
var names = u.repList.filter(function (n) { var r = REP[n.toUpperCase()]; return r && r.module === m; });
if (!names.length) return;
html += '<div class="rd-mod"><span class="rd-name rb-' + esc(m.toLowerCase()) + '">' + esc(m) + '</span>' + names.map(function (n) { return '<span class="rd-rep">' + esc(n) + '</span>'; }).join('') + '</div>';
});
var unk = u.repList.filter(function (n) { return !REP[n.toUpperCase()]; });
if (unk.length) html += '<div class="rd-mod"><span class="rd-name rb-none">Not in catalogue</span>' + unk.map(function (n) { return '<span class="rd-rep">' + esc(n) + '</span>'; }).join('') + '</div>';
return html;
}
function render() {
paintChips();
var rows = USERS.filter(userOk), html = '';
rows.forEach(function (u) {
var isMain = u.code === '0';
var roleCls = u.isAdmin ? 'admin' : 'normal';
var cost = (u.isAdmin || u.seeCost) ? '<span class="cost-eye on" title="' + (u.isAdmin ? 'Administrator: sees cost' : 'Sees cost and profit columns') + '">' + I_EYE + '</span>' : '<span class="cost-eye" title="Does not see cost">' + I_EYEOFF + '</span>';
var refr = (u.isAdmin || u.canRefresh) ? '<span class="cost-eye on" title="' + (u.isAdmin ? 'Administrator: may refresh' : 'May press Refresh') + '">' + I_REFR + '</span>' : '<span class="cost-eye off" title="No Refresh button">' + I_REFR + '</span>';
var grp = u.grpList.length && !u.isAdmin
? '<span class="gc df" title="' + esc(u.grpList[0]) + ' - default group (the session starts with it)">' + esc(GRP[u.grpList[0]] || u.grpList[0]) + '</span>' +
(u.grpList.length > 1 ? '<button type="button" class="rb-more gm" data-c="' + esc(u.code) + '" title="' + (u.grpList.length - 1) + ' more group(s)">' + (openG[u.code] ? '&#9650;' : '+' + (u.grpList.length - 1) + ' &#9660;') + '</button>' : '')
: (GRP['0'] ? '<span class="gc df" title="0 - no restriction">' + esc(GRP['0']) + '</span>' : '<span class="grp-none" title="No data group: no restriction">' + DASH + '</span>');
html += '<tr class="u-row' + (u.isAdmin ? ' is-admin' : '') + '" data-c="' + esc(u.code) + '">' +
'<td class="c-code">' + esc(u.code) + '</td>' +
'<td class="c-name">' + esc(u.name || u.code) + (isMain ? '<span class="main-tag" title="Main administrator">' + I_LOCK + '</span>' : '') + '</td>' +
'<td><span class="badge ' + roleCls + '">' + u.role + '</span></td>' +
'<td class="c-grp">' + grp + '</td>' +
'<td class="c-reps">' + repBadges(u) + '</td>' +
'<td class="c-cost">' + cost + '</td>' +
'<td class="c-cost">' + refr + '</td>' +
'<td class="c-act">' +
'<button type="button" class="act edit" data-c="' + esc(u.code) + '" title="Edit">' + I_EDIT + '</button>' +
'<button type="button" class="act key" data-c="' + esc(u.code) + '" title="Set password">' + I_KEY + '</button>' +
'<button type="button" class="act copy" data-c="' + esc(u.code) + '" title="New user with the same access">' + I_COPY + '</button>' +
(isMain ? '<span class="act locked" title="The main administrator cannot be deleted">' + I_LOCK + '</span>' : '<button type="button" class="act del" data-c="' + esc(u.code) + '" title="Remove from the dashboard">' + I_DEL + '</button>') +
'</td></tr>';
if (openG[u.code] && u.grpList.length > 1) {
html += '<tr class="rep-detail"><td colspan="8"><div class="rd-mod"><span class="rd-name gd-name">Data groups</span>' +
u.grpList.map(function (g, i) { return '<span class="gc' + (i === 0 ? ' df' : '') + '" title="' + esc(g) + (i === 0 ? ' - default group (the session starts with it)' : '') + '">' + (i === 0 ? '<span class="gc-df">&#9733;</span>' : '') + esc(GRP[g] || g) + '</span>'; }).join('') +
'</div></td></tr>';
}
if (open[u.code] && !u.isAdmin && !u.allReports && u.repList.length) html += '<tr class="rep-detail"><td colspan="8">' + repDetail(u) + '</td></tr>';
});
tBody.innerHTML = html || '<tr><td colspan="8" class="empty">No user matches the search.</td></tr>';
noteEl.textContent = rows.length + ' of ' + USERS.length + ' users' + (show || qry ? SEP + 'filtered' : '');
each(tBody.querySelectorAll('.act.edit'), function (b) { b.addEventListener('click', function () { openUser('edit', userByCode(b.getAttribute('data-c'))); }); });
each(tBody.querySelectorAll('.act.key'),  function (b) { b.addEventListener('click', function () { openPwd(userByCode(b.getAttribute('data-c'))); }); });
each(tBody.querySelectorAll('.act.copy'), function (b) { b.addEventListener('click', function () { openUser('copy', userByCode(b.getAttribute('data-c'))); }); });
each(tBody.querySelectorAll('.act.del'),  function (b) { b.addEventListener('click', function () { deleteUser(userByCode(b.getAttribute('data-c'))); }); });
each(tBody.querySelectorAll('.rb-more:not(.gm)'), function (b) { b.addEventListener('click', function () { var c = b.getAttribute('data-c'); open[c] = !open[c]; render(); }); });
each(tBody.querySelectorAll('.rb-more.gm'), function (b) { b.addEventListener('click', function () { var c = b.getAttribute('data-c'); openG[c] = !openG[c]; render(); }); });
}
searchInput.addEventListener('input', function () { qry = searchInput.value.trim(); searchClr.style.display = qry ? '' : 'none'; render(); });
searchInput.addEventListener('keydown', function (e) { if (e.key === 'Escape') { searchInput.value = ''; qry = ''; searchClr.style.display = 'none'; render(); } });
searchClr.addEventListener('click', function () { searchInput.value = ''; qry = ''; searchClr.style.display = 'none'; render(); searchInput.focus(); });
$('resetBtn').addEventListener('click', function () { searchInput.value = ''; qry = ''; show = ''; open = {}; openG = {}; searchClr.style.display = 'none'; render(); });
function attachMenu(input, menu, getItems, rowHtml, onPick, opts) {
opts = opts || {};
var items = [], act = -1;
function close() { menu.style.display = 'none'; menu.innerHTML = ''; items = []; act = -1; }
function paint() {
if (!items.length) { menu.innerHTML = '<div class="ss-empty">No match</div>'; menu.style.display = 'block'; return; }
var html = '';
items.forEach(function (it, i) { html += '<div class="ss-option' + (i === act ? ' active' : '') + '" data-i="' + i + '">' + rowHtml(it) + '</div>'; });
menu.innerHTML = html; menu.style.display = 'block';
each(menu.querySelectorAll('.ss-option'), function (el) {
el.addEventListener('mousedown', function (e) { e.preventDefault(); pick(parseInt(el.getAttribute('data-i'), 10)); });
});
var a = menu.querySelector('.ss-option.active');
if (a && a.scrollIntoView) a.scrollIntoView({ block: 'nearest' });
}
function pick(i) { if (i < 0 || i >= items.length) return; onPick(items[i]); if (opts.multi) { act = i; paint(); } else { close(); } }
function refresh() {
var q = opts.picked && opts.picked() ? '' : input.value.trim().toLowerCase();
items = getItems(q).slice(0, 60); act = items.length ? 0 : -1; paint();
}
input.addEventListener('focus', function () { if (!input.readOnly) refresh(); });
input.addEventListener('input', function () { if (input.readOnly) return; if (opts.onType) opts.onType(); refresh(); });
input.addEventListener('blur', function () { setTimeout(close, 120); });
input.addEventListener('keydown', function (e) {
if (input.readOnly) return;
if (menu.style.display === 'none' && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { refresh(); e.preventDefault(); return; }
if (e.key === 'ArrowDown') { if (items.length) { act = (act + 1) % items.length; paint(); } e.preventDefault(); }
else if (e.key === 'ArrowUp') { if (items.length) { act = (act - 1 + items.length) % items.length; paint(); } e.preventDefault(); }
else if (e.key === 'Enter') { if (menu.style.display !== 'none' && items.length) { pick(act < 0 ? 0 : act); e.preventDefault(); } }
else if (e.key === 'Escape') { if (menu.style.display !== 'none') { close(); e.stopPropagation(); } }
});
return { close: close };
}
function match(q, a, b) { return !q || String(a).toLowerCase().indexOf(q) !== -1 || String(b || '').toLowerCase().indexOf(q) !== -1; }
var modal = $('userModal'), mode = 'add', editing = null, grpSel = [], selCode = '';
var inpCode = $('inpUserCode'), inpPass = $('inpPassword'), inpGroup = $('inpGroup'), inpRole = $('inpRole'), inpCopy = $('inpCopy');
var chkAll = $('chkAll'), chkCost = $('chkCost'), chkRefresh = $('chkRefresh'), modsEl = $('repModules');
(function buildModules() {
var html = '';
MODULES.forEach(function (m) {
var reps = REPORTS.filter(function (r) { return r.module === m; });
html += '<div class="um-mod" data-m="' + esc(m) + '"><label class="um-mod-head"><input type="checkbox" class="mod-all" data-m="' + esc(m) + '"><span class="rb rb-' + esc(m.toLowerCase()) + '">' + esc(m) + '<small>' + reps.length + '</small></span></label><div class="um-mod-reps">';
reps.forEach(function (r) { html += '<label class="rc"><input type="checkbox" class="rep-chk" value="' + esc(r.name) + '" data-m="' + esc(m) + '" data-inall="' + esc(r.inAll) + '"><span>' + esc(r.name) + '</span></label>'; });
html += '</div></div>';
});
modsEl.innerHTML = html;
each(modsEl.querySelectorAll('.mod-all'), function (h) {
h.addEventListener('change', function () {
each(modsEl.querySelectorAll('.rep-chk[data-m="' + h.getAttribute('data-m') + '"]'), function (c) { if (!c.disabled) c.checked = h.checked; });
syncHeads();
});
});
each(modsEl.querySelectorAll('.rep-chk'), function (c) { c.addEventListener('change', syncHeads); });
})();
function repChks() { return modsEl.querySelectorAll('.rep-chk'); }
function syncHeads() {
each(modsEl.querySelectorAll('.mod-all'), function (h) {
var cs = modsEl.querySelectorAll('.rep-chk[data-m="' + h.getAttribute('data-m') + '"]'), n = 0;
each(cs, function (c) { if (c.checked) n++; });
h.checked = n === cs.length; h.indeterminate = n > 0 && n < cs.length;
});
each(modsEl.querySelectorAll('.rc'), function (l) { l.classList.toggle('on', l.querySelector('input').checked); });
}
function applyAll() {
var on = chkAll.checked;
each(repChks(), function (c) { if (c.getAttribute('data-inall') === 'Y') { c.disabled = on; if (on) c.checked = true; } });
each(modsEl.querySelectorAll('.mod-all'), function (h) { h.disabled = on && h.getAttribute('data-m') !== 'Admin'; });
modsEl.classList.toggle('all-on', on);
syncHeads();
}
chkAll.addEventListener('change', applyAll);
function applyRole() {
var adm = inpRole.value === 'Admin';
$('accessBox').style.display = adm ? 'none' : '';
$('adminNote').style.display = adm ? '' : 'none';
}
inpRole.addEventListener('change', applyRole);
function setReps(list, all, cost, refresh) {
var up = list.map(function (n) { return n.toUpperCase(); });
each(repChks(), function (c) { c.disabled = false; c.checked = hasVal(up, c.value.toUpperCase()); });
chkAll.checked = !!all; chkCost.checked = !!cost; chkRefresh.checked = !!refresh;
applyAll();
}
function setGroups(list) {
grpSel = (list || []).map(String).filter(function (g) { return g !== ''; });
paintGroups();
}
function paintGroups() {
var el = $('grpChips'), html = '';
grpSel.forEach(function (g, i) {
html += '<span class="gc' + (i === 0 ? ' df' : '') + '" title="' + esc(g) + '">' +
(i === 0 ? '<span class="gc-df" title="Default group: the session starts with it">&#9733;</span>' : '<button type="button" class="gc-st" data-g="' + esc(g) + '" title="Make it the default group">&#9734;</button>') +
'<span class="gc-n">' + esc(GRP[g] || g) + '</span><small>' + esc(g) + '</small>' +
'<button type="button" class="gc-rm" data-g="' + esc(g) + '" title="Remove">&times;</button></span>';
});
el.innerHTML = html;
$('groupHint').textContent = !grpSel.length ? 'No group = no restriction (same as the managers group 0)' : (grpSel.length === 1 ? (grpSel[0] === '0' ? 'Managers group: no restriction' : 'Only the salesmen and customers of this group') : grpSel.length + ' groups: the user switches between them in the sidebar; the starred one is the default');
each(el.querySelectorAll('.gc-rm'), function (b) { b.addEventListener('click', function () { grpSel.splice(idxOf(grpSel, b.getAttribute('data-g')), 1); paintGroups(); }); });
each(el.querySelectorAll('.gc-st'), function (b) { b.addEventListener('click', function () { var g = b.getAttribute('data-g'); grpSel.splice(idxOf(grpSel, g), 1); grpSel.unshift(g); paintGroups(); }); });
}
function fillFrom(u) {
inpRole.value = u.isAdmin ? 'Admin' : 'Normal';
setGroups(u.grpList);
setReps(u.repList, u.allReports, u.seeCost, u.canRefresh);
applyRole();
}
function openUser(m, u) {
mode = m; editing = m === 'edit' ? u : null; selCode = '';
var mb = modal.querySelector('.modal');
mb.classList.toggle('edit-mode', m === 'edit');
$('modalTitle').textContent = m === 'edit' ? 'Edit user ' + u.code : (m === 'copy' ? 'New user with the access of ' + u.code : 'Add user');
inpCode.readOnly = m === 'edit';
inpCode.value = m === 'edit' ? u.code + ' - ' + (u.name || '') : '';
$('userNameHint').innerHTML = '&nbsp;';
inpPass.value = ''; inpPass.type = 'password'; syncEyes();
$('pwdHint').textContent = m === 'edit' ? 'leave blank to keep the current one' : 'required';
$('copyGroup').style.display = m === 'add' ? '' : 'none';
inpCopy.value = ''; inpGroup.value = '';
if (m === 'add') { inpRole.value = 'Normal'; setGroups([]); setReps([], false, false, false); applyRole(); }
else fillFrom(u);
if (m === 'edit') selCode = u.code;
modal.style.display = 'flex';
}
function closeModal(id) { $(id).style.display = 'none'; }
each(document.querySelectorAll('[data-close]'), function (b) { b.addEventListener('click', function () { closeModal(b.getAttribute('data-close')); }); });
each(document.querySelectorAll('.modal-overlay'), function (ov) { ov.addEventListener('mousedown', function (e) { if (e.target === ov) ov.style.display = 'none'; }); });
document.addEventListener('keydown', function (e) {
if (e.key !== 'Escape') return;
if ($('pwdModal').style.display === 'flex') closeModal('pwdModal');
else if (modal.style.display === 'flex') closeModal('userModal');
});
$('addUserBtn').addEventListener('click', function () { openUser('add', null); });
function syncNote(d, now) {
var n = $('syncPwdNote'), bad = d.st === 'ERROR';
if (!n) return;
n.className = 'um-sync-note' + (bad ? ' bad' : (now ? ' ok' : ''));
n.innerHTML = 'System permissions: <b>' + (d.st === 'NONE' ? 'never synced' :
(bad ? 'sync failed ' + esc(d.at) + ' - ' + esc(d.msg) :
(now ? 'synced now' : 'last sync ' + esc(d.at)) + ' - ' + esc(String(d.msg).replace('tables=', '')) + ' tables, ' + esc(d.rows) + ' rows in ' + esc(d.sec) + ' s')) + '</b>';
}
function syncCall(run) {
var b = $('syncPwdBtn');
if (!b) return;
if (run) { b.disabled = true; b.innerHTML = '&#8635; Syncing...'; }
apex.server.process('SYNC_PWD', { x01: run ? 'run' : 'get' }, {
success: function (d) {
b.disabled = false; b.innerHTML = '&#8635; Sync permissions';
if (d.status !== 'success') { if (run) { alert('Error: ' + d.message); } return; }
syncNote(d, run);
if (run && d.st !== 'ERROR') { toast('Permissions synced'); }
},
error: function () { b.disabled = false; b.innerHTML = '&#8635; Sync permissions'; if (run) { alert('Sync request failed.'); } }
});
}
if ($('syncPwdBtn')) { $('syncPwdBtn').addEventListener('click', function () { syncCall(true); }); syncCall(false); }
attachMenu(inpCode, $('userCodeMenu'),
function (q) { return SYS.filter(function (s) { return !userByCode(s.code) && match(q, s.code, s.name); }); },
function (s) { return '<span class="ss-code">' + esc(s.code) + '</span><span>' + esc(s.name) + '</span>'; },
function (s) { selCode = String(s.code); inpCode.value = s.code + ' - ' + (s.name || ''); $('userNameHint').textContent = 'New dashboard user'; },
{ onType: function () { selCode = ''; $('userNameHint').innerHTML = '&nbsp;'; }, picked: function () { return !!selCode; } });
attachMenu(inpGroup, $('groupMenu'),
function (q) { return GROUPS.filter(function (g) { return match(q, g.passNum, g.desc); }); },
function (g) { var on = hasVal(grpSel, String(g.passNum)); return '<span class="ss-chk' + (on ? ' on' : '') + '"></span><span class="ss-code">' + esc(g.passNum) + '</span><span>' + esc(g.desc) + '</span>' + (on && grpSel[0] === String(g.passNum) ? '<small>default</small>' : ''); },
function (g) { var c = String(g.passNum), i = idxOf(grpSel, c); if (i === -1) grpSel.push(c); else grpSel.splice(i, 1); paintGroups(); },
{ multi: true });
attachMenu(inpCopy, $('copyMenu'),
function (q) { return USERS.filter(function (u) { return match(q, u.code, u.name) || match(q, u.groupName, ''); }); },
function (u) { return '<span class="ss-code">' + esc(u.code) + '</span><span>' + esc(u.name || '') + '</span><small>' + esc(u.role) + (u.groupName ? SEP + u.groupName : '') + '</small>'; },
function (u) { inpCopy.value = u.code + ' - ' + (u.name || ''); fillFrom(u); toast('Access copied from ' + u.code + SEP + 'not saved yet'); },
{ picked: function () { return inpCopy.value.indexOf(' - ') !== -1; } });
function syncEyes() { each(document.querySelectorAll('.eye-btn'), function (b) { b.innerHTML = $(b.getAttribute('data-eye')).type === 'password' ? I_EYE : I_EYEOFF; }); }
each(document.querySelectorAll('.eye-btn'), function (b) {
b.addEventListener('click', function () { var i = $(b.getAttribute('data-eye')); i.type = i.type === 'password' ? 'text' : 'password'; syncEyes(); i.focus(); });
});
syncEyes();
var saving = false;
$('saveUserBtn').addEventListener('click', function () {
if (saving) return;
var code = editing ? editing.code : selCode;
if (!code) {
var typed = inpCode.value.trim().split(' - ')[0].trim();
if (typed && SYSN[typed] !== undefined) code = typed;
}
if (!code) { alert('Pick the user from the list.'); inpCode.focus(); return; }
if (!editing && !inpPass.value) { alert('A password is required for a new user.'); inpPass.focus(); return; }
if (inpGroup.value.trim()) { alert('Pick the group from the list to add it, or clear the group field.'); inpGroup.focus(); return; }
var role = inpRole.value, all = role === 'Normal' && chkAll.checked, cost = role === 'Normal' && chkCost.checked,
refresh = role === 'Normal' && chkRefresh.checked, reps = [];
each(repChks(), function (c) { if (c.checked && (!all || c.getAttribute('data-inall') !== 'Y')) reps.push(c.value); });
if (role === 'Normal' && !all && !reps.length && !confirm('This user will have no report at all. Save anyway?')) return;
saving = true; $('saveUserBtn').disabled = true;
apex.server.process('SAVE_USER', { x01: code, x02: inpPass.value, x03: grpSel.join(','), x04: role, x05: reps.join(','), x06: cost ? 'Y' : 'N', x07: all ? 'Y' : 'N', x08: refresh ? 'Y' : 'N' }, {
success: function (d) {
saving = false; $('saveUserBtn').disabled = false;
if (d.status !== 'success') { alert('Error saving: ' + d.message); return; }
var u = userByCode(code);
if (!u) { u = { code: code, name: SYSN[code] || code }; USERS.push(u); }
u.role = role; u.groups = grpSel.join(','); u.seeCost = cost ? 'Y' : 'N'; u.allReports = all ? 'Y' : 'N'; u.canRefresh = refresh ? 'Y' : 'N'; u.reports = d.reports || '';
norm(u);
closeModal('userModal'); render();
toast((editing ? 'Saved ' : 'Added ') + u.code + ' - ' + (u.name || ''));
},
error: function (x) { saving = false; $('saveUserBtn').disabled = false; alert('Save failed: ' + (x && x.statusText ? x.statusText : 'network error')); }
});
});
var pwdUser = null;
function openPwd(u) {
pwdUser = u;
$('pwdUser').innerHTML = '<span class="ss-code">' + esc(u.code) + '</span> ' + esc(u.name || '') + ' <span class="badge ' + (u.isAdmin ? 'admin' : 'normal') + '">' + u.role + '</span>';
$('inpNewPwd').value = ''; $('inpNewPwd').type = 'password'; syncEyes();
$('pwdModal').style.display = 'flex';
setTimeout(function () { $('inpNewPwd').focus(); }, 30);
}
$('inpNewPwd').addEventListener('keydown', function (e) { if (e.key === 'Enter') $('setPwdBtn').click(); });
$('setPwdBtn').addEventListener('click', function () {
var p = $('inpNewPwd').value;
if (!p) { alert('Type the new password.'); return; }
$('setPwdBtn').disabled = true;
apex.server.process('SET_PASSWORD', { x01: pwdUser.code, x02: p }, {
success: function (d) {
$('setPwdBtn').disabled = false;
if (d.status !== 'success') { alert('Error: ' + d.message); return; }
closeModal('pwdModal'); toast('Password set for ' + pwdUser.code + ' - ' + (pwdUser.name || ''));
},
error: function () { $('setPwdBtn').disabled = false; alert('Request failed.'); }
});
});
function deleteUser(u) {
if (!u || u.code === '0') return;
if (!confirm('Remove ' + u.code + ' - ' + (u.name || '') + ' from the dashboard?')) return;
apex.server.process('DELETE_USER', { x01: u.code }, {
success: function (d) {
if (d.status !== 'success') { alert('Error deleting: ' + d.message); return; }
USERS.splice(idxOf(USERS, u), 1); render(); toast('Removed ' + u.code);
}
});
}
var toastT = null;
function toast(msg) {
var t = $('umToast'); t.textContent = msg; t.classList.add('on');
clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('on'); }, 2600);
}
render();
})();

});
