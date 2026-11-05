/* srv_profit.js - PROFIT page: #profit-data block and GET_PROFIT_DETAIL (24/10/2026) */
(function () {
    var D = window.DEMO, S = window.DEMO_SRV, H = window.DEMO_H;

    window.DEMO_RENDERERS.profit = function () {
        var agg = {}, recs = [];
        H.facts().forEach(function (f) {
            var k = f[0] + '|' + f[1] + '|' + f[2] + '|' + f[3], a = agg[k] || (agg[k] = [0, 0]);
            a[0] += f[6]; a[1] += f[8];
        });
        Object.keys(agg).forEach(function (k) {
            var p = k.split('|'), a = agg[k];
            if (H.r2(a[0]) || H.r2(a[1])) recs.push([+p[0], p[1], p[2], p[3], H.r2(a[0]), H.r2(a[1])]);
        });
        return { id: 'profit-data', data: { archivedThru: H.archivedThru(), baseYear: H.base, depts: H.depts(),
            areas: H.areas(), sups: H.sups(), reps: H.reps(), classes: H.classes(), recs: recs } };
    };

    function mkey(m) { var y = H.ym(m); return (y.m < 10 ? '0' : '') + y.m + '_' + y.y; }

    S.GET_PROFIT_DETAIL = function (p) {
        var lvl = String(p.x01 || 'CUSTOMER').toUpperCase();
        if (lvl === 'CUST_SEARCH') return H.custSearch(p.x07);
        var months = H.csv(p.x02), areas = H.csv(p.x03), reps = H.csv(p.x04), depts = H.csv(p.x05),
            cls = H.csv(p.x06), cust = p.x07 || null, g = {}, mo = {};
        H.facts().forEach(function (f) {
            var mk = mkey(f[0]);
            if (months && months.indexOf(mk) < 0) return;
            if (areas && areas.indexOf(f[9]) < 0) return;
            if (reps && reps.indexOf(f[2]) < 0) return;
            if (depts && depts.indexOf(f[1]) < 0) return;
            if (cls && cls.indexOf(f[3]) < 0) return;
            if (cust && f[4] !== String(cust)) return;
            var code, name, unit = null;
            if (lvl === 'ITEM') { code = f[5]; name = H.item[f[5]][1]; unit = H.item[f[5]][3]; }
            else if (lvl === 'CLASS') { code = f[3]; name = H.className(+f[3] - 1); }
            else { code = f[4]; name = H.cust[f[4]][1]; }
            var o = g[code] || (g[code] = { code: code, name: name, unit: unit, qty: 0, sales: 0, cost: 0 });
            o.qty += f[7]; o.sales += f[6]; o.cost += f[8];
            var m = mo[mk] || (mo[mk] = [mk, 0, 0, f[0]]);
            m[1] += f[6]; m[2] += f[8];
        });
        var rows = Object.keys(g).map(function (k) {
            var o = g[k];
            return { code: o.code, name: o.name, unit: o.unit, qty: H.r2(o.qty), sales: H.r2(o.sales), cost: H.r2(o.cost) };
        }).filter(function (r) { return r.sales || r.cost; }).sort(function (a, b) { return b.sales - a.sales; });
        var ms = Object.keys(mo).map(function (k) { return mo[k]; }).sort(function (a, b) { return a[3] - b[3]; })
            .map(function (m) { return [m[0], H.r2(m[1]), H.r2(m[2])]; });
        return { rows: rows, months: ms };
    };
})();
