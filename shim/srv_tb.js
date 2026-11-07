(function () {
    var D = window.DEMO, S = window.DEMO_SRV, H = window.DEMO_H;
    var RX = /^20[0-9]{2}(0[1-9]|1[0-2])$/;

    // trial balance rows: opening = everything before f, movement f..t; c2 = CC2 codes used in the period (CC1 scope only)
    function tbRows(f, t, c1, c2) {
        var G = H.LG, cf = G.costFn(c1, c2), c1f = G.costFn(c1, ''), o = {}, used = {};
        G.lines().forEach(function (l) {
            if (l.m > t) return;
            if (l.m >= f && l.c2 && c1f(l)) used[l.c2] = 1;
            if (!cf(l)) return;
            var r = o[l.a] || (o[l.a] = { a: l.a, op: 0, dr: 0, cr: 0 });
            if (l.m < f) r.op += l.v; else { r.dr += l.dr; r.cr += l.cr; }
        });
        var rows = Object.keys(o).sort().map(function (k) {
            var r = o[k];
            return { a: k, op: H.r2(r.op), dr: H.r2(r.dr), cr: H.r2(r.cr) };
        }).filter(function (r) { return Math.abs(r.op) > 0.005 || r.dr || r.cr; });
        return { rows: rows, c2: Object.keys(used).sort() };
    }

    window.DEMO_RENDERERS.tb = function () {
        var G = H.LG, from = G.curY + '01', r = tbRows(from, G.curM, '', '');
        return [
            { id: 'tb-accts', data: D.accounts.map(function (a) { return { a: G.pad(a[0]), n: a[1], lv: G.LV[a[0].length] }; }) },
            { id: 'tb-levels', data: [{ lv: 1, e: 1 }, { lv: 2, e: 2 }, { lv: 3, e: 4 }, { lv: 4, e: 6 }] },
            { id: 'tb-cost1', data: G.cost1() },
            { id: 'tb-cost2', data: G.cost2() },
            { id: 'tb-clevels', data: G.clev },
            { id: 'tb-rows', data: r.rows },
            { id: 'tb-c2used', data: r.c2 },
            { id: 'tb-meta', data: { admin: 1, asOf: H.asOf, lastM: G.prevM(G.curM), curM: G.curM,
                defFrom: from, defTo: G.curM, minM: G.minM } }
        ];
    };

    S.TB_AJAX = function (p) {
        var G = H.LG, act = p.x01, f = String(p.x02 || ''), t = String(p.x03 || ''),
            c1 = p.x04 || '', c2 = p.x05 || '';
        if (act !== 'rows' && act !== 'stmt') return { err: 'unknown action' };
        if (!RX.test(f) || !RX.test(t) || f < G.minM || t < f) return { err: 'bad period' };
        var ce = G.costErr(c1, c2);
        if (ce) return { err: ce };
        if (act === 'rows') return tbRows(f, t, c1, c2);

        var acc = String(p.x06 || '');
        if (!/^[0-9]{1,15}$/.test(acc)) return { err: 'bad account' };
        var cf = G.costFn(c1, c2), op = 0, lines = [], u1 = {}, u2 = {};
        (G.byAcct()[acc] || []).forEach(function (l) {
            if (l.m > t) return;
            if (l.m >= f) { u1[l.c1 || '0'] = 1; u2[l.c2 || '0'] = 1; }
            if (!cf(l)) return;
            if (l.m < f) { op += l.v; return; }
            if (lines.length < 5000) lines.push({ dt: l.d, y: l.y, no: l.t + '/' + l.n, ds: l.ds, v: H.r2(l.v),
                c1: l.c1 || '0', c2: l.c2 || '0' });
        });
        return { op: H.r2(op), lines: lines, c1u: Object.keys(u1).sort(), c2u: Object.keys(u2).sort(),
            trunc: lines.length >= 5000 ? 1 : 0 };
    };
})();
