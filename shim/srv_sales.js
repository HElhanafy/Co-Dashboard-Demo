(function () {
    var D = window.DEMO, S = window.DEMO_SRV, H = window.DEMO_H;

    window.DEMO_RENDERERS.sales = function () {
        var agg = {};
        H.facts().forEach(function (f) {
            var k = f[0] + '|' + f[1] + '|' + f[2] + '|' + f[3];
            agg[k] = (agg[k] || 0) + f[6];
        });
        var recs = [];
        Object.keys(agg).forEach(function (k) {
            var v = H.r2(agg[k]), p = k.split('|');
            if (v) recs.push([+p[0], p[1], p[2], p[3], v]);
        });
        return { id: 'sales-data', data: { asOf: H.asOf, archivedThru: H.archivedThru(), baseYear: H.base,
            sectors: H.sectors(), depts: H.depts(), areas: H.areas(), sups: H.sups(), reps: H.reps(),
            classes: H.classes(), recs: recs } };
    };

    function monthRange(csv) {
        var ms = H.csv(csv), lo = null, hi = null;
        if (ms) ms.forEach(function (s) {
            var p = s.split('_'), i = (+p[1] - H.base) * 12 + (+p[0]) - 1;
            if (lo === null || i < lo) lo = i;
            if (hi === null || i + 1 > hi) hi = i + 1;
        });
        if (lo === null) { lo = 0; hi = H.midx(D.meta.asof.slice(6, 10) + '-' + D.meta.asof.slice(3, 5)) + 1; }
        return { cf: lo, ct: hi, pf: lo - 12, pt: hi - 12 };
    }

    S.GET_SALES_DETAIL = function (p) {
        var lvl = String(p.x01 || 'CUSTOMER').toUpperCase();
        if (lvl === 'CUST_SEARCH') return H.custSearch(p.x07);
        var r = monthRange(p.x02), areas = H.csv(p.x03), reps = H.csv(p.x04), depts = H.csv(p.x05),
            cls = p.x06 || null, cust = p.x07 || null, g = {};
        H.facts().forEach(function (f) {
            var m = f[0];
            if (m < r.pf || m >= r.ct) return;
            if (areas && areas.indexOf(f[9]) < 0) return;
            if (reps && reps.indexOf(f[2]) < 0) return;
            if (depts && depts.indexOf(f[1]) < 0) return;
            if (cls && f[3] !== String(cls)) return;
            if (cust && f[4] !== String(cust)) return;
            var code, name;
            if (lvl === 'ITEM') { code = f[5]; name = H.item[f[5]][1]; }
            else if (lvl === 'CLASS') { code = f[3]; name = H.className(+f[3] - 1); }
            else { code = f[4]; name = H.cust[f[4]][1]; }
            var o = g[code] || (g[code] = { code: code, name: name, c: 0, p: 0, mv: {} });
            if (m >= r.cf) o.c += f[6];
            if (m < r.pt) o.p += f[6];
            o.mv[m] = (o.mv[m] || 0) + f[6];
        });
        var out = [], tc = 0, tp = 0;
        Object.keys(g).forEach(function (k) {
            var o = g[k], c = H.r2(o.c), pv = H.r2(o.p);
            if (!c && !pv) return;
            tc += o.c; tp += o.p;
            out.push({ code: o.code, name: o.name, sales: c, prev: pv,
                mv: Object.keys(o.mv).map(Number).sort(function (a, b) { return a - b; })
                    .filter(function (m) { return H.r2(o.mv[m]); })
                    .map(function (m) { return m + ':' + H.r2(o.mv[m]).toFixed(2); }).join(',') });
        });
        out.sort(function (a, b) { return b.sales - a.sales; });
        return { rows: out, tot: { sales: H.r2(tc), prev: H.r2(tp) } };
    };
})();
