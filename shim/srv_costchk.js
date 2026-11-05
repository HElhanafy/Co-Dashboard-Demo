/* srv_costchk.js - COSTCHK page: #cc-meta block and COSTCHK_AJAX (list/lines) from the item card ledger in srv_itcard.js (24/10/2026) */
(function () {
    var D = window.DEMO, S = window.DEMO_SRV, H = window.DEMO_H;
    function n10(x) { return Math.round(x * 1e10) / 1e10; }
    var TODAY, WIN;   /* set from srv_itcard.js (loaded after this file through the page head) */
    function init() { TODAY = H.icToday; WIN = H.icWin; }

    /* ST_COST_CHECK: the flagged lines of the current-year window (the reference is computed from the whole history) */
    function table() {
        if (H._cct) return H._cct;
        init();
        var E = H.icEngine();
        return (H._cct = E.flags.filter(function (f) { return f.m.d >= WIN && f.m.d <= TODAY; }).map(function (f) {
            var m = f.m, diff = m.c - f.ref;
            return { it: m.it, k: m.k, lot: m.lot, exp: m.exp, d: m.d, ds: m.dc.ds, tc: m.tc, ser: m.ser, isrl: m.isrl, doc: m.dc.doc,
                tt: m.tt, ef: m.ef, st: m.st, q: m.q, c: m.c, ref: f.ref, diff: diff, imp: m.q * diff, rule: f.rule };
        }));
    }
    function winMsg() { return table().length + ' lines from ' + H.dmy(WIN); }

    window.DEMO_RENDERERS.costchk = function () {
        init();
        return { id: 'cc-meta', data: { today: TODAY, defFrom: WIN, minD: D.meta.start, asof: H.asOf, win: winMsg() } };
    };

    S.COSTCHK_AJAX = function (p) {
        init();
        var a = p.x01, re = /^\d{4}-\d\d-\d\d/;
        var from = re.test(p.x02 || '') ? p.x02.slice(0, 10) : D.meta.start, to = re.test(p.x03 || '') ? p.x03.slice(0, 10) : TODAY;
        var item = /^[0-9A-Za-z]+$/.test(p.x04 || '') ? p.x04 : null, store = /^\d+$/.test(String(p.x05 || '')) ? +p.x05 : null;
        var rule = String(p.x06 || '').toUpperCase().slice(0, 4), min = +p.x07 || 0, cfg = /^\d+$/.test(String(p.x08 || '')) ? +p.x08 : null;
        if (rule !== 'AVG' && rule !== 'XFER') rule = null;
        var T = table().filter(function (r) { return r.d >= from && r.d <= to && (!item || r.it === item) && Math.abs(r.diff) >= min; });
        function fs(r) { return store === null || r.st === store; }
        function fr(r) { return !rule || r.rule === rule; }
        if (a === 'list') {
            var rules = {}, stores = {}, lots = {}, ord = [], tot = { lots: 0, items: 0, lines: 0, impact: 0 }, its = {};
            T.forEach(function (r) {
                if (fs(r)) rules[r.rule] = (rules[r.rule] || 0) + 1;
                if (fr(r)) stores[r.st] = (stores[r.st] || 0) + 1;
                if (!fs(r) || !fr(r)) return;
                tot.lines++; tot.impact += r.imp; its[r.it] = 1;
                var k = r.it + '|' + r.k, o = lots[k];
                if (!o) { o = lots[k] = { r: r, n: 0, st: {}, d1: r.d, d2: r.d, mx: 0, imp: 0, na: 0, nx: 0 }; ord.push(k); }
                o.n++; o.st[r.st] = 1; if (r.d < o.d1) o.d1 = r.d; if (r.d > o.d2) o.d2 = r.d;
                o.mx = Math.max(o.mx, Math.abs(r.diff)); o.imp += r.imp; if (r.rule === 'AVG') o.na++; else o.nx++;
            });
            tot.lots = ord.length; tot.items = Object.keys(its).length; tot.impact = n10(tot.impact);
            var L = ord.map(function (k) { return lots[k]; });
            L.sort(function (x, y) { return Math.abs(y.imp) - Math.abs(x.imp) || (x.d2 < y.d2 ? 1 : x.d2 > y.d2 ? -1 : 0); });
            return { asof: H.asOf, win: winMsg(), from: from, to: to, rules: rules,
                stores: Object.keys(stores).map(Number).sort(function (x, y) { return x - y; }).map(function (s) { return [s, H.icStoreName[s], stores[s]]; }),
                tot: tot,
                lots: L.map(function (o) {
                    var r = o.r, it = H.item[r.it];
                    return [r.it, it ? it[1] : '', r.k, r.lot, r.exp ? H.dmy(r.exp) : '', o.n, Object.keys(o.st).length, H.dmy(o.d1), H.dmy(o.d2),
                        n10(o.mx), n10(o.imp), o.na, o.nx, it ? it[3] : ''];
                }) };
        }
        if (a === 'lines') {
            if (cfg === null) return { error: 'cfg' };
            return { cfg: cfg, lines: T.filter(function (r) { return r.k === cfg && fs(r) && fr(r); }).map(function (r) {
                return [H.dmy(r.d), r.ds, r.tc, r.ser, r.doc, r.tt, r.ef, r.st, H.icStoreName[r.st], r.q, n10(r.c), n10(r.ref), n10(r.diff), n10(r.imp), r.rule];
            }) };
        }
        return { error: 'unknown' };
    };
})();
