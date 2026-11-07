(function () {
    var D = window.DEMO, S = window.DEMO_SRV, H = window.DEMO_H;
    var TODAY = H.today.slice(6, 10) + '-' + H.today.slice(3, 5) + '-' + H.today.slice(0, 2);
    var CUR_Y = +TODAY.slice(0, 4), CUR_M = +TODAY.slice(5, 7);
    var AREA = H.idx(D.areas), SUPV = H.idx(D.supervisors);

    function day(iso) { return Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / 864e5; }
    function mStart(i) { var t = H.ym(i); return t.y + '-' + (t.m < 10 ? '0' : '') + t.m + '-01'; }
    function mKey(i) { return mStart(i).slice(0, 7); }
    function deptName(c) { var d = H.depts()[+c - 1]; return d ? d.n : '-'; }
    function repName(r) { return H.rep[r] ? H.rep[r][1] : r; }
    function repAt(c, lim) {   // salesman of the customer for dates before lim (exclusive)
        var r = c[7]; (c[8] || []).forEach(function (h) { if (h[0] < lim) r = h[1]; }); return r;
    }
    var ARCH_LAST = H.midx(TODAY) - 1;   // last closed (archived) month

    // replay every customer's ledger: debits (I/O/B) in id order, receipts by their allocations,
    // returns FIFO, leftovers to advance; bounced cheques consume the advance FIFO (as the generator does)
    function replay() {
        if (H._smr) return H._smr;
        var ev = {}, al = {}, ck = [], i;
        function add(c, e) { (ev[c] = ev[c] || []).push(e); }
        D.alloc.forEach(function (a) { (al[a[0]] = al[a[0]] || []).push(a); });
        D.inv.forEach(function (r) { add(r[4], [r[2], r[14] === 'O' ? 0 : r[14] === 'I' ? 1 : 4, r[0], 'D', r]); });
        D.ret.forEach(function (r) { add(r[3], [r[2], 2, r[0], 'R', r]); });
        D.rcpt.forEach(function (r) { add(r[3], [r[2], 3, r[0], 'P', r]); });
        for (i = 0; i <= ARCH_LAST; i++) ck.push({ lim: mStart(i + 1), mi: i });
        D.customers.forEach(function (c) {
            (c[8] || []).forEach(function (h, j) { if (j && h[1] !== c[8][j - 1][1]) ck.push({ lim: h[0], xf: c[0] }); });
        });
        ck.sort(function (a, b) { return a.lim < b.lim ? -1 : a.lim > b.lim ? 1 : 0; });
        var out = { snap: {}, xbal: {}, now: {} };
        D.customers.forEach(function (c) {
            var cc = c[0], es = (ev[cc] || []).sort(function (a, b) {
                return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] - b[1] || a[2] - b[2];
            }), open = [], byId = {}, adv = 0, k = 0;
            function credit(amt) {
                for (var j = 0; j < open.length && amt > 0.004; j++) {
                    var o = open[j]; if (o.v <= 0.004) continue;
                    var a = Math.min(o.v, amt); o.v = H.r2(o.v - a); amt = H.r2(amt - a);
                }
                return amt;
            }
            function snapshot(p) {
                return { adv: adv, items: open.filter(function (o) { return o.v > 0.004; })
                    .map(function (o) { return { r: o.r, v: o.v }; }) };
            }
            function take(p) {
                if (p.mi !== undefined) (out.snap[p.mi] = out.snap[p.mi] || {})[cc] = snapshot();
                else if (p.xf === cc) {
                    var s = snapshot(), b = -s.adv; s.items.forEach(function (o) { b += o.v; });
                    out.xbal[cc + '|' + p.lim] = H.r2(b);
                }
            }
            es.forEach(function (e) {
                while (k < ck.length && ck[k].lim <= e[0]) take(ck[k++]);
                var r = e[4], rest;
                if (e[3] === 'D') {
                    var o = { r: r, v: r[11] }; open.push(o); byId[r[0]] = o;
                    if (r[14] === 'B' && adv) { rest = adv; adv = 0; adv = H.r2(credit(rest)); }
                } else if (e[3] === 'R') {
                    adv = H.r2(adv + credit(r[10]));
                } else {
                    rest = r[8];
                    (al[r[0]] || []).forEach(function (a) {
                        var x = byId[a[1]], v = x ? Math.min(x.v, a[2]) : 0;
                        if (x) x.v = H.r2(x.v - v); rest = H.r2(rest - v);
                    });
                    if (rest > 0.004) adv = H.r2(adv + credit(rest));
                }
            });
            while (k < ck.length) take(ck[k++]);
            out.now[cc] = snapshot();
        });
        return (H._smr = out);
    }

    // collection archive rows by salesman: [yyyy-mm, open, overdue, ovdPre, rc, coll, dueNext, b150p, nCust, nInv]
    function archive() {
        if (H._sma) return H._sma;
        var rp = replay(), out = {}, flow = {};
        function fl(cc, mi) { var k = cc + '|' + mi; return flow[k] || (flow[k] = { rc: 0, coll: 0 }); }
        D.rcpt.forEach(function (r) { fl(r[3], H.midx(r[2])).coll += r[8]; });
        D.inv.forEach(function (r) { if (r[14] === 'B') fl(r[4], H.midx(r[2])).rc += r[11]; });
        for (var mi = 0; mi <= ARCH_LAST; mi++) {
            var s0 = mStart(mi), s1 = mStart(mi + 1), s2 = mStart(mi + 2), endDay = day(s1) - 1, snap = rp.snap[mi] || {};
            D.customers.forEach(function (c) {
                var sn = snap[c[0]], f = flow[c[0] + '|' + mi], a = [0, 0, 0, 0, 0, 0, 0, 0];
                if (sn) sn.items.forEach(function (o) {
                    var due = o.r[3];
                    a[0] += o.v; a[7]++;
                    if (due < s1) a[1] += o.v;
                    if (due < s0) a[2] += o.v;
                    if (due >= s1 && due < s2) a[5] += o.v;
                    if (endDay - day(o.r[2]) > 150) a[6] += o.v;
                });
                if (f) { a[3] = f.rc; a[4] = f.coll; }
                if (a[0] < 0.005 && !a[3] && !a[4]) return;
                var rep = repAt(c, s1), byM = out[rep] || (out[rep] = {}),
                    t = byM[mi] || (byM[mi] = [mKey(mi), 0, 0, 0, 0, 0, 0, 0, 0, 0]);
                for (var j = 0; j < 7; j++) t[j + 1] += a[j];
                t[8]++; t[9] += a[7];
            });
        }
        return (H._sma = out);
    }

    function repDiv(code) {
        var by = {}, tot = 0, best = null;
        H.facts().forEach(function (f) { if (f[2] === code) { by[f[1]] = (by[f[1]] || 0) + f[6]; tot += f[6]; } });
        Object.keys(by).forEach(function (d) { if (best === null || by[d] > by[best]) best = d; });
        return best === null ? ['-', 0] : [deptName(best), tot ? Math.round(by[best] / tot * 1000) / 10 : 0];
    }

    window.DEMO_RENDERERS.smcard = function () {
        var reps = D.reps.map(function (r) {
            var a = AREA[H.repArea[r[0]]], s = SUPV[r[3]], dv = repDiv(r[0]);
            return [r[0], r[1], a ? a[1] : '-', s ? s[1] : '-', dv[0], dv[1]];
        }).sort(function (a, b) { return a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0; });
        return { id: 'sm-meta', data: { admin: 1, today: TODAY, year: CUR_Y, month: CUR_M, minYear: H.base,
            asofProfit: H.asOf, asofAR: H.asOf, collThru: H.archivedThru(), salesThru: H.archivedThru(), reps: reps } };
    };

    S.SMCARD_AJAX = function (p) {
        var sm = String(p.x02 || '');
        if (!/^[0-9]+$/.test(sm) || !H.rep[sm]) return { error: 'salesman' };
        var y = parseInt(String(p.x03 || '').slice(0, 4), 10), m1 = parseInt(p.x04, 10), m2 = parseInt(p.x05, 10);
        if (!y || y < H.base || y > CUR_Y) y = CUR_Y;
        if (!m1 || m1 < 1 || m1 > 12) m1 = 1;
        if (!m2 || m2 < 1 || m2 > 12) m2 = y === CUR_Y ? CUR_M : 12;
        if (m1 > m2) m1 = m2;
        if (p.x01 !== 'card') return { error: 'unknown' };
        var at = H.archivedThru(), res = { sm: sm, y: y, m1: m1, m2: m2, asofProfit: H.asOf, asofAR: H.asOf,
            collThru: at.slice(3) + '-' + at.slice(0, 2), today: TODAY };

        // 1) months (y and y-1), 2) customers in period, 3) class actuals
        var mo = {}, mc = {}, cu = {}, ca = {}, mix = {}, mixT = 0;
        H.facts().forEach(function (f) {
            if (f[2] !== sm) return;
            mix[f[3]] = (mix[f[3]] || 0) + f[6]; mixT += f[6];
            var t = H.ym(f[0]);
            if (t.y !== y && t.y !== y - 1) return;
            var k = t.y * 100 + t.m, a = mo[k] || (mo[k] = [t.y, t.m, 0, 0, 0]);
            a[2] += f[6]; a[3] += f[8];
            var ck = k + '|' + f[4]; mc[ck] = (mc[ck] || 0) + f[6];
            if (t.y !== y || t.m < m1 || t.m > m2) return;
            var c = cu[f[4]] || (cu[f[4]] = [f[4], H.cust[f[4]][1], deptName(f[1]), 0, 0, 0]);
            c[3] += f[6]; c[4] += f[8]; if (t.m > c[5]) c[5] = t.m;
            var x = ca[f[3]] || (ca[f[3]] = [0, 0]); x[0] += f[6]; x[1] += f[8];
        });
        Object.keys(mc).forEach(function (k) { if (mc[k] > 0.004) mo[k.split('|')[0]][4]++; });
        res.months = Object.keys(mo).sort().map(function (k) { var a = mo[k]; return [a[0], a[1], H.r2(a[2]), H.r2(a[3]), a[4]]; });
        res.customers = Object.keys(cu).map(function (k) { var c = cu[k]; return [c[0], c[1], c[2], H.r2(c[3]), H.r2(c[4]), c[5]]; })
            .filter(function (c) { return c[3] || c[4]; }).sort(function (a, b) { return b[3] - a[3]; });

        // annual target of the year split by the salesman's class sales mix
        var annual = 0, cls = {};
        D.targets.forEach(function (t) { if (t[0] === sm && +t[1].slice(0, 4) === y) annual += t[2]; });
        var gov = false;   // government: one total target (ALL), as on the live page (02/11/2026)
        H.reps().forEach(function (r, i) { var dv = H.depts()[D.reps[i][4]]; if (String(r.c) === String(sm) && dv && dv.c === '3001') gov = true; });
        if (!gov) Object.keys(mix).forEach(function (c) { if (mix[c] > 0 && mixT > 0) cls[c] = [annual * mix[c] / mixT, 0, 0]; });
        Object.keys(ca).forEach(function (c) { var o = cls[c] || (cls[c] = [0, 0, 0]); o[1] = ca[c][0]; o[2] = ca[c][1]; });
        res.classes = Object.keys(cls).map(function (c) {
            var o = cls[c]; return [c, H.className(+c - 1), H.r2(o[0]), H.r2(o[1]), H.r2(o[2])];
        }).filter(function (c) { return c[2] || c[3] || c[4]; }).sort(function (a, b) { return b[3] - a[3]; });
        if (gov && annual) res.classes.push(['ALL', 'All classes', H.r2(annual), 0, 0]);

        // 4) collection archive from Dec of y-1
        var arch = archive()[sm] || {}, lo = (y - H.base) * 12 - 1, hi = (y - H.base) * 12 + 11;
        res.coll = Object.keys(arch).map(Number).filter(function (i) { return i >= lo && i <= hi; }).sort(function (a, b) { return a - b; })
            .map(function (i) { var t = arch[i]; return [t[0], H.r2(t[1]), H.r2(t[2]), H.r2(t[3]), H.r2(t[4]), H.r2(t[5]), H.r2(t[6]), H.r2(t[7]), t[8], t[9]]; });

        // 5) open invoices today by customer (current salesman)
        var now = replay().now, td = day(TODAY);
        res.ar = [];
        D.customers.forEach(function (c) {
            if (repAt(c, '9999') !== sm) return;
            var sn = now[c[0]], a = [0, 0, 0, 0, 0, 0];
            if (!sn) return;
            sn.items.forEach(function (o) {
                var age = td - day(o.r[2]);
                a[0] += o.v; a[4]++;
                if (o.r[3] < TODAY) a[1] += o.v;
                if (age > 120) a[2] += o.v;
                if (o.r[14] === 'B') a[3] += o.v;
                if (age > a[5]) a[5] = age;
            });
            if (a[0] < 0.005 && sn.adv < 0.005) return;
            res.ar.push([c[0], c[1], deptName(String(c[4] + 1)), H.r2(a[0]), H.r2(a[1]), H.r2(a[2]), H.r2(a[3]), a[4], a[5], H.r2(-sn.adv)]);
        });
        res.ar.sort(function (a, b) { return b[4] - a[4] || b[3] - a[3]; });

        // 6) customer transfers touching this salesman
        var xb = replay().xbal;
        res.xfers = [];
        D.customers.forEach(function (c) {
            var h = c[8] || [];
            for (var j = 1; j < h.length; j++) {
                var f = h[j - 1][1], t = h[j][1];
                if (f === t || (f !== sm && t !== sm)) continue;
                res.xfers.push([h[j][0], c[0], f, t, xb[c[0] + '|' + h[j][0]] || 0, repName(f), repName(t)]);
            }
        });
        res.xfers.sort(function (a, b) { return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0; });
        return res;
    };
})();
