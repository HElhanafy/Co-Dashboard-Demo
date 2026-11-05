/* srv_users.js - USERS page: APEX_USERS_DATA/APEX_REPORTS/APEX_SYSTEM_USERS/APEX_GROUPS globals and SAVE_USER/SET_PASSWORD/DELETE_USER/SYNC_PWD, in memory + localStorage 'demoUsers' (24/10/2026) */
(function () {
    var D = window.DEMO, S = window.DEMO_SRV, H = window.DEMO_H, KEY = 'demoUsers';
    var MOD = { Finance: 'Accounting', Administration: 'Admin' };

    // report catalogue from the demo sidebar (Home is not a report)
    function catalogue() {
        var out = [];
        (window.DEMO_NAV || []).forEach(function (g) {
            g.items.forEach(function (it) {
                if (it.a === 'HOME') return;
                var t = String(it.t.length <= 28 ? it.t : it.l).replace(/&amp;/g, '&');
                out.push({ name: t, module: MOD[g.g] || g.g, alias: it.a, inAll: it.a === 'USERS' ? 'N' : 'Y' });
            });
        });
        return out;
    }
    var REPORTS = catalogue();
    function names(aliases) {
        return REPORTS.filter(function (r) { return aliases.indexOf(r.alias) >= 0; }).map(function (r) { return r.name; }).sort().join(',');
    }
    function inAll() { return REPORTS.filter(function (r) { return r.inAll === 'Y'; }).map(function (r) { return r.name; }); }

    var GROUPS = [{ passNum: '0', desc: 'All branches' }].concat((D.branches || []).map(function (b) { return { passNum: String(b[0]), desc: b[1] }; }));
    var SYSTEM = [{ code: 'ADMIN', name: 'Demo Admin' }];
    for (var i = 1; i <= 12; i++) SYSTEM.push({ code: 'U' + (i < 10 ? '0' : '') + i, name: 'User ' + (i < 10 ? '0' : '') + i });

    function u(code, role, groups, reps, cost, all, refr, created) {
        return { code: code, name: SYSTEM.filter(function (s) { return s.code === code; })[0].name, role: role, groups: groups,
            seeCost: cost, allReports: all, canRefresh: refr, created: created, reports: all === 'Y' ? inAll().sort().join(',') : names(reps) };
    }
    function seed() {
        return [
            u('ADMIN', 'Admin', '', [], 'Y', 'N', 'Y', '01/01/2025'),
            u('U01', 'Normal', '0', [], 'Y', 'Y', 'Y', '05/01/2025'),
            u('U02', 'Normal', '0,1,2,3', ['TB', 'FS', 'CUSTST', 'RECEIVABLES', 'SUPST', 'SUPAY', 'BANKST', 'CHEQUES'], 'Y', 'N', 'Y', '12/01/2025'),
            u('U03', 'Normal', '1', ['SALES', 'PROFIT', 'TARGET', 'SMCARD', 'CUSTST', 'RECEIVABLES', 'COLLECTION'], 'N', 'N', 'N', '03/02/2025'),
            u('U04', 'Normal', '2', ['SALES', 'TARGET', 'SMCARD', 'RECEIVABLES', 'COLLECTION'], 'N', 'N', 'N', '17/03/2025'),
            u('U05', 'Normal', '3', ['SALES', 'TARGET', 'SMCARD', 'CUSTST'], 'N', 'N', 'N', '08/05/2025'),
            u('U06', 'Normal', '1,2', ['STOCK', 'EXPIRY', 'MOVE', 'ITCARD', 'STVAL', 'PRICES', 'POARR'], 'Y', 'N', 'Y', '21/07/2025'),
            u('U07', 'Normal', '3', ['STOCK', 'EXPIRY', 'ITCARD', 'PRICES'], 'N', 'N', 'N', '14/01/2026'),
            u('U08', 'Admin', '', [], 'Y', 'N', 'Y', '02/06/2026')
        ];
    }
    function load() {
        try { var s = JSON.parse(localStorage.getItem(KEY)); if (s && s.length && s[0].code) return s; } catch (e) { }
        return seed();
    }
    var USERS = load();
    function persist() { try { localStorage.setItem(KEY, JSON.stringify(USERS)); } catch (e) { } }
    function find(c) { for (var i = 0; i < USERS.length; i++) if (USERS[i].code === String(c)) return i; return -1; }
    function err(m) { return { status: 'error', message: m }; }
    function today() { return H.today; }
    window.DEMO_USERS = { list: function () { return USERS; }, reports: REPORTS, groups: GROUPS };

    window.DEMO_RENDERERS.users = function () {
        var js = 'const APEX_USERS_DATA = ' + JSON.stringify(USERS) + ';\n' +
            'const APEX_REPORTS = ' + JSON.stringify(REPORTS) + ';\n' +
            'const APEX_SYSTEM_USERS = ' + JSON.stringify(SYSTEM) + ';\n' +
            'const APEX_GROUPS = ' + JSON.stringify(GROUPS) + ';';
        return { js: js.replace(/</g, '\\u003c') };
    };

    S.SAVE_USER = function (p) {
        var code = String(p.x01 || '').trim();
        if (!code) return err('User code is required.');
        var role = String(p.x04 || '').toUpperCase() === 'ADMIN' ? 'Admin' : 'Normal';
        if (code === 'ADMIN' && role !== 'Admin') return err('The main administrator must stay Admin.');
        var yn = function (v) { return String(v || '').toUpperCase() === 'Y' ? 'Y' : 'N'; };
        var all = yn(p.x07), want = H.csv(p.x05) || [], reps = [];
        if (role === 'Normal') {
            if (all === 'Y') {
                reps = inAll();
                if (String(p.x05 || '').toUpperCase().indexOf('USER MANAGEMENT') >= 0) reps.push('User Management');
            } else {
                want.forEach(function (w) {
                    REPORTS.forEach(function (r) { if (r.name.toUpperCase() === w.trim().toUpperCase() && reps.indexOf(r.name) < 0) reps.push(r.name); });
                });
            }
        }
        reps.sort();
        var groups = (H.csv(p.x03) || []).filter(function (g) { return /^\d+$/.test(g.trim()); }).map(function (g) { return g.trim(); });
        var i = find(code), sys = SYSTEM.filter(function (s) { return s.code === code; })[0];
        var o = i >= 0 ? USERS[i] : { code: code, name: sys ? sys.name : code, created: today() };
        o.role = role; o.groups = groups.join(','); o.seeCost = yn(p.x06); o.allReports = all; o.canRefresh = yn(p.x08); o.reports = reps.join(',');
        if (i < 0) USERS.push(o);
        persist();   // the password (x02) is not stored in the demo
        return { status: 'success', reports: o.reports };
    };

    S.SET_PASSWORD = function (p) {
        if (!p.x02) return err('Password is required.');
        if (find(p.x01) < 0) return err('User not found.');
        return err('Password changes are disabled in the demo.');
    };

    S.DELETE_USER = function (p) {
        var i = find(p.x01);
        if (String(p.x01) === 'ADMIN') return err('The main administrator cannot be deleted.');
        if (i < 0) return err('User not found.');
        USERS.splice(i, 1); persist();
        return { status: 'success' };
    };

    S.SYNC_PWD = function (p) {
        var run = p.x01 === 'run';
        return { status: 'success', st: 'SUCCESS', at: run ? H.asOf.slice(0, 10) + ' ' + new Date().toTimeString().slice(0, 5) : H.today + ' 01:30',
            msg: 'tables=4', rows: 1286, sec: run ? 0.4 : 2.1 };
    };
})();
