(function () {
    var D = window.DEMO, H = window.DEMO_H;

    window.DEMO_RENDERERS.target = function () {
        var depts = H.depts(), yrs = {}, ann = {}, mix = {}, agg = {}, share = {}, recs = [], tgts = [], mixed = 0;
        (D.targets || []).forEach(function (t) {
            var y = t[1].slice(0, 4), k = y + '|' + t[0];
            yrs[y] = 1; ann[k] = (ann[k] || 0) + t[2];
        });
        H.facts().forEach(function (f) {
            var y = String(H.ym(f[0]).y);
            if (!yrs[y]) return;
            var k = f[0] + '|' + f[1] + '|' + f[2] + '|' + f[3];
            agg[k] = (agg[k] || 0) + f[6];
            var mk = y + '|' + f[2], m = mix[mk] || (mix[mk] = {});
            m[f[3]] = (m[f[3]] || 0) + f[6];
            var s = share[f[2]] || (share[f[2]] = {});
            s[f[1]] = (s[f[1]] || 0) + f[6];
        });
        Object.keys(agg).forEach(function (k) {
            var p = k.split('|'), v = H.r2(agg[k]);
            if (v) recs.push([+p[0], p[1], p[2], p[3], v]);
        });
        var cls = H.classes().filter(function (c) { return c.c !== '-1'; }).map(function (c) { return c.c; }), repDiv = {};
        H.reps().forEach(function (r, i) { var dv = depts[D.reps[i][4]]; repDiv[r.c] = dv ? dv.c : 'NA'; });
        Object.keys(ann).sort().forEach(function (k) {
            var p = k.split('|'), y = p[0], rep = p[1], total = Math.round(ann[k]), div = repDiv[rep] || 'NA',
                m = mix[k] || mix[(+y - 1) + '|' + rep], w = {}, sum = 0, keys, left = total, big = null;
            if (div === '3001') { tgts.push([y, rep, 'ALL', total, div]); return; }   /* government is judged on its total, as on the live page (02/11/2026) */
            if (m) Object.keys(m).forEach(function (c) { if (m[c] > 0) { w[c] = m[c]; sum += m[c]; } });
            if (!sum) { w = {}; cls.forEach(function (c) { w[c] = 1; }); sum = cls.length; }
            keys = Object.keys(w);
            keys.forEach(function (c) { if (big === null || w[c] > w[big]) big = c; });
            keys.forEach(function (c) {
                var v = c === big ? 0 : Math.round(total * w[c] / sum);
                left -= v; w[c] = v;
            });
            w[big] = left;
            keys.forEach(function (c) { if (w[c]) tgts.push([y, rep, c, w[c], div]); });
        });
        Object.keys(share).forEach(function (r) {
            var s = share[r], t = 0, mx = 0;
            Object.keys(s).forEach(function (d) { if (s[d] > 0) { t += s[d]; if (s[d] > mx) mx = s[d]; } });
            if (t > 0 && mx / t < 0.8) mixed++;
        });
        var reps = H.reps().map(function (r, i) {
            var dv = depts[D.reps[i][4]];
            return { c: r.c, n: r.n, a: r.a, s: r.s, d: dv ? dv.n : 'Unassigned' };
        });
        return { id: 'target-data', data: { archivedThru: H.archivedThru(), baseYear: H.base, mixed: mixed,
            depts: depts, areas: H.areas(), sups: H.sups(), reps: reps, classes: H.classes(), tgts: tgts, recs: recs } };
    };
})();
