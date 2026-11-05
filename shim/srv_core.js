/* srv_core.js - fake server core: indexes over window.DEMO, render blocks, page-0 processes (24/10/2026) */
(function () {
    var D = window.DEMO, S = window.DEMO_SRV = window.DEMO_SRV || {}, R = window.DEMO_RENDERERS = {};
    var H = window.DEMO_H = {};

    window.DEMO_RENDER = function (k) {
        [].concat(R[k]()).forEach(function (o) {
            if (o.js) { document.write('<script>' + o.js + '<\/script>'); return; }   // render-time JS globals
            if (o.html) { document.write(o.html); return; }                          // server-printed markup
            document.write('<script type="application/json" id="' + o.id + '">' +
                JSON.stringify(o.data).replace(/</g, '\\u003c') + '<\/script>');
        });
    };

    H.base = +D.meta.start.slice(0, 4);
    H.asOf = D.meta.asof;
    H.today = D.meta.asof.slice(0, 10);
    H.r2 = function (x) { return Math.round((x + (x >= 0 ? 1e-9 : -1e-9)) * 100) / 100; };
    H.midx = function (iso) { return (+iso.slice(0, 4) - H.base) * 12 + (+iso.slice(5, 7)) - 1; };
    H.ym = function (i) { var y = H.base + Math.floor(i / 12), m = i % 12 + 1; return { y: y, m: m }; };
    H.dmy = function (iso) { return iso ? iso.slice(8, 10) + '/' + iso.slice(5, 7) + '/' + iso.slice(0, 4) : ''; };
    H.csv = function (s) { return s === undefined || s === null || s === '' ? null : String(s).split(','); };
    H.idx = function (rows, k) { var o = {}; rows.forEach(function (r) { o[r[k || 0]] = r; }); return o; };

    H.cust = H.idx(D.customers);
    H.rep = H.idx(D.reps);
    H.item = H.idx(D.items);
    H.sup = H.idx(D.suppliers);
    H.inv = H.idx(D.inv);
    H.className = function (c) { return D.classes[c] || 'Unclassified'; };
    H.deptOf = function (custCode) { var c = H.cust[custCode]; return c ? String(c[4] + 1) : 'NA'; };
    H.repArea = (function () {
        var cnt = {}, out = {};
        D.customers.forEach(function (c) {
            var k = c[7]; cnt[k] = cnt[k] || {}; cnt[k][c[2]] = (cnt[k][c[2]] || 0) + 1;
        });
        Object.keys(cnt).forEach(function (k) {
            out[k] = Object.keys(cnt[k]).sort(function (a, b) { return cnt[k][b] - cnt[k][a]; })[0];
        });
        return out;
    })();

    // sales facts at line level: [mIdx, dept, rep, cls, cust, item, net, qty, cost, area, branch, date, doc, kind]
    H.facts = function () {
        if (H._facts) return H._facts;
        var f = [], hd = {};
        D.inv.forEach(function (r) {
            if (r[14] === 'I') hd[r[0]] = { r: r, base: r[8] - (r[9] - (r[15] || 0)) };
        });
        D.invL.forEach(function (l) {
            var h = hd[l[0]]; if (!h) return;
            var r = h.r, it = H.item[l[1]], net = l[6] - l[7];
            if (r[15]) net -= r[15] * (h.base ? net / h.base : 0);
            f.push([H.midx(r[2]), H.deptOf(r[4]), r[5], String(it[2] + 1), r[4], l[1], net, l[4], l[8],
                H.repArea[r[5]] || '', r[6], r[2], r[0], 'I']);
        });
        var rh = H.idx(D.ret);
        D.retL.forEach(function (l) {
            var r = rh[l[0]], it = H.item[l[1]];
            f.push([H.midx(r[2]), H.deptOf(r[3]), r[4], String(it[2] + 1), r[3], l[1], -l[6], -l[4], -l[7],
                H.repArea[r[4]] || '', r[5], r[2], r[0], 'R']);
        });
        return (H._facts = f);
    };

    H.sectors = function () {
        return [{ c: 'PRV', n: 'Private Sector' }, { c: 'GOV', n: 'Government Sector' }, { c: 'OTH', n: 'Other (Non-Sector)' }];
    };
    H.depts = function () {
        var sec = window.DEMO_INDUSTRY === 'trading' ? ['PRV', 'PRV', 'OTH'] : ['PRV', 'PRV', 'GOV'];
        return D.divisions.map(function (n, i) { return { c: String(i + 1), n: n + ' Division', s: sec[i] }; });
    };
    H.areas = function () { return D.areas.map(function (a) { return { c: a[0], n: a[1] }; }); };
    H.sups = function () { return D.supervisors.map(function (s) { return { c: s[0], n: s[1] }; }); };
    H.reps = function () {
        return D.reps.map(function (r) { return { c: r[0], n: r[1], a: H.repArea[r[0]] || '0', s: r[3] }; });
    };
    H.classes = function () {
        return [{ c: '-1', n: 'Unclassified' }].concat(D.classes.map(function (n, i) { return { c: String(i + 1), n: n }; }));
    };
    H.archivedThru = function () {
        var y = +H.today.slice(6, 10), m = +H.today.slice(3, 5) - 1;
        if (!m) { m = 12; y--; }
        return (m < 10 ? '0' : '') + m + '/' + y;
    };

    H.custSearch = function (term) {
        var t = String(term || '').trim().toUpperCase(), rows = [];
        if (t.length >= 2) D.customers.forEach(function (c) {
            if (c[1].toUpperCase().indexOf(t) >= 0 || c[0].indexOf(t) === 0) rows.push({ code: c[0], name: c[1] });
        });
        rows.sort(function (a, b) { return a.name < b.name ? -1 : 1; });
        return { rows: rows.slice(0, 20) };
    };

    // page-0 application processes
    S.DASH_REFRESH_AJAX = function (p) {
        return { ok: 1, has: 1, label: 'Refresh Data', mode: 'SYNC', admin: 1, asOf: H.asOf, status: 'SUCCESS',
            secs: 3, today: H.today, running: 0 };
    };
    S.DASH_GROUP_AJAX = function () { return { ok: 1, group: 0, name: 'All data' }; };
    S.DASH_ACCOUNT_AJAX = function (p) {
        if (p.x01 === 'lang') { try { localStorage.setItem('demoLang', p.x02 === 'AR' ? 'AR' : 'EN'); } catch (e) {} return { ok: 1 }; }
        if (p.x01 === 'miss') { (window.DEMO_I18N_MISS = window.DEMO_I18N_MISS || []).push.apply(window.DEMO_I18N_MISS, p.f01 || []); return 'ok'; }
        return { err: 'Password changes are disabled in the demo' };
    };
})();
