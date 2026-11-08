(function () {
    var D = window.DEMO, S = window.DEMO_SRV, H = window.DEMO_H;
    var TODAY = H.today.slice(6, 10) + '-' + H.today.slice(3, 5) + '-' + H.today.slice(0, 2), MIND = D.meta.start;
    var WHBR = {}, WHN = {};
    D.warehouses.forEach(function (w) { WHBR[w[0]] = w[2]; WHN[w[0]] = w[0] + ' ' + w[1]; });
    var SCB = { CEN: '1', NTH: '2', WST: '3' }, BRSC = { '1': 'CEN', '2': 'NTH', '3': 'WST' };
    var SCOPES = ['C', 'CEN', 'NTH', 'WST'], DEPTS = ['*', '1001', '2001', '3001'], DPC = { '1': '1001', '2': '2001', '3': '3001' };
    var ORD = { S: 0, R: 0, T: 1, P: 2, W: 3 };

    function p2(n) { return (n < 10 ? '0' : '') + n; }
    function iso(d) { return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); }
    function addM(s, n) {
        var y = +s.slice(0, 4), m = +s.slice(5, 7) - 1 + n, d = +s.slice(8, 10), last = new Date(y, m + 1, 0).getDate();
        return iso(new Date(y, m, Math.min(d, last)));
    }
    function addD(s, n) { var d = new Date(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)); d.setDate(d.getDate() + n); return iso(d); }
    function r6(x) { return Math.round(x * 1e6) / 1e6; }
    function inSc(sc, br) { return sc === 'C' || SCB[sc] === br; }
    function okDate(s, def) { s = String(s || '').slice(0, 10); return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : def; }
    function dept(cu) { return DPC[H.deptOf(cu)] || 'NA'; }
    var M0 = TODAY.slice(0, 7), M12 = [];
    for (var i = 12; i >= 1; i--) M12.push(addM(M0 + '-01', -i).slice(0, 7));
    var EXP90 = addD(TODAY, 90), NEWD = addM(TODAY, -6);

    /* ---------- movement index per item: ev = [date, wh, signedQty, expiry, kind, value, ref, cust, salesBranch, rep, pairTO] ---------- */
    var X = null;
    function idx() {
        if (X) return X;
        var IT = {}, list = [];
        D.items.forEach(function (r) {
            var o = { r: r, c: r[0], cl: String(r[2] + 1), ev: [], st: [], q0: {}, vb: { '1': 0, '2': 0, '3': 0 }, first: null, base: {} };
            IT[r[0]] = o; list.push(o);
        });
        D.stock.forEach(function (s) { IT[s[0]].st.push(s); });
        var GRN = H.idx(D.grn), RET = H.idx(D.ret), TRF = H.idx(D.trf);
        D.grnL.forEach(function (l) { var g = GRN[l[0]]; IT[l[1]].ev.push([g[2], g[5], l[4], l[3], 'P', l[7], l[0], null, WHBR[g[5]], null]); });
        var ic = {};   /* lot split rounding: the invoice's first line carries the cents so COGS = the invoice cost = GL 110501 */
        D.invL.forEach(function (l) {
            var r = H.inv[l[0]], e = [r[2], r[7], -l[4], l[3], 'S', -l[8], l[0], r[4], r[6], r[5]], a = ic[l[0]];
            if (!a) a = ic[l[0]] = { e: e, s: 0, c: r[12] };
            a.s += l[8];
            IT[l[1]].ev.push(e);
        });
        Object.keys(ic).forEach(function (k) { var a = ic[k]; a.e[5] = H.r2(a.e[5] - (a.c - a.s)); });
        D.retL.forEach(function (l) {
            var r = RET[l[0]];
            IT[l[1]].ev.push([r[2], r[6], l[4], l[3], 'R', l[7], l[0], r[3], r[5], r[4]]);
        });
        D.trfL.forEach(function (l) {
            var t = TRF[l[0]], o = [t[2], t[4], -l[4], l[3], 'T', 0, l[0], null, WHBR[t[4]], null];
            IT[l[1]].ev.push(o, [t[2], t[5], l[4], l[3], 'T', 0, l[0], null, WHBR[t[5]], null, o]);
        });
        D.woff.forEach(function (w) {
            w[4].forEach(function (l) { IT[l[1]].ev.push([w[1], l[2], -l[5], l[4], 'W', -l[6], w[0], null, WHBR[l[2]], null]); });
        });
        var bySale = {};   /* class -> division -> sales qty (division base classes) */
        list.forEach(function (o) {
            o.ev.sort(function (a, b) { return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : ORD[a[4]] - ORD[b[4]]; });
            var Q0 = 0, V0 = o.r[9], q = {};
            o.st.forEach(function (s) { q[s[1]] = (q[s[1]] || 0) + s[4]; });
            o.ev.forEach(function (e) { q[e[1]] = (q[e[1]] || 0) - e[2]; if (e[4] !== 'T') V0 -= e[5]; });
            Object.keys(q).forEach(function (w) { Q0 += q[w]; });
            o.q0 = q; o.Q0 = Q0; o.V0 = H.r2(V0);
            o.first = Q0 > 0 ? (+MIND.slice(0, 4) - 1) + '-12-31' : (o.ev.length ? o.ev[0][0] : null);
            /* replay the moving average to value transfers (no effect on the company value) */
            var Q = Q0, V = o.V0;
            o.ev.forEach(function (e) {
                if (e[4] === 'T') {
                    if (e[10]) e[5] = -e[10][5];
                    else e[5] = -H.r2(-e[2] * (Q > 0 ? V / Q : o.r[6]));
                    return;
                }
                Q += e[2]; V += e[5];
                if (e[4] === 'S' || e[4] === 'R') {
                    var dv = H.deptOf(e[7]), b = bySale[o.cl] || (bySale[o.cl] = {});
                    b[dv] = (b[dv] || 0) - e[2];
                }
            });
            /* opening value split by branch on quantity, the remainder to the largest branch */
            var qb = { '1': 0, '2': 0, '3': 0 }, big = '1', done = 0;
            Object.keys(q).forEach(function (w) { qb[WHBR[w]] += q[w]; });
            ['1', '2', '3'].forEach(function (b) { if (qb[b] > qb[big]) big = b; });
            ['1', '2', '3'].forEach(function (b) {
                if (b === big) return;
                o.vb[b] = Q0 ? H.r2(qb[b] * o.V0 / Q0) : 0; done += o.vb[b];
            });
            o.vb[big] = o.V0 - done;
            o.ev.forEach(function (e) { o.vb[WHBR[e[1]]] += e[5]; });   /* -> value today per branch */
        });
        /* division base classes: the division selling most of the class (Government division has none) */
        Object.keys(bySale).forEach(function (cl) {
            var b = bySale[cl], top = Object.keys(b).sort(function (x, y) { return b[y] - b[x]; })[0];
            bySale[cl] = top;
        });
        list.forEach(function (o) { o.base = { '1001': bySale[o.cl] === '1' ? 1 : 0, '2001': bySale[o.cl] === '2' ? 1 : 0, '3001': 0 }; });
        return (X = { IT: IT, list: list });
    }

    /* need on 12 completed months (live PATCH3 28/10/2026): months capped at 3 x the median of the selling months,
       rate 50/30/20 on the last 3 / previous 3 / oldest 6, safety 1.2816 x sd x sqrt(lead), need = rate x (lead + 3|6) + safety */
    function fcst(mon, o, ltd) {
        var act = [];
        M12.forEach(function (m) { if ((mon[m] || 0) > 0) act.push(mon[m]); });
        act.sort(function (a, b) { return a - b; });
        var n = act.length, q = !n ? 0 : n % 2 ? act[(n - 1) / 2] : (act[n / 2 - 1] + act[n / 2]) / 2;
        var pt = o.first && o.first > NEWD ? 'N' : n >= 9 ? 'R' : n >= 3 ? 'I' : n >= 1 ? 'S' : 'D';
        var qc = M12.map(function (m) { var v = mon[m] || 0; return v > 3 * q ? 3 * q : v; }), cut = 0, s = 0, s2 = 0, i;
        M12.forEach(function (m) { if ((mon[m] || 0) > 3 * q) cut++; });
        for (i = 0; i < 12; i++) { s += qc[i]; s2 += qc[i] * qc[i]; }
        var sum = function (a, b) { var t = 0; for (var j = a; j < b; j++) t += qc[j]; return t; },
            rate = Math.max(0, 0.5 * sum(9, 12) / 3 + 0.3 * sum(6, 9) / 3 + 0.2 * sum(0, 6) / 6),
            sd = Math.sqrt(Math.max(0, (s2 - s * s / 12) / 11)), L = (ltd || 130) / 30.4, saf = 1.2816 * sd * Math.sqrt(L);
        return { n: n, f3: rate * (L + 3) + saf, f6: rate * (L + 6) + saf, pt: pt, rt: rate, saf: saf, cut: cut, ltd: ltd || 130 };
    }
    /* open purchase orders per item (required / at customs / overdue / oldest month) and the supplier lead time (P80 of order -> receipt, by shipment) */
    var PO = null;
    function days(a, b) { return Math.round((Date.parse(b) - Date.parse(a)) / 864e5); }
    function poIdx() {
        if (PO) return PO;
        var by = {}, lines = {}, open = {}, sup = {}, last = {}, lt = {}, it = {};
        D.po.forEach(function (p) { by[p[1]] = p; });
        D.poL.forEach(function (l) { (lines[l[0]] = lines[l[0]] || []).push(l); });
        D.po.forEach(function (p) {
            if (p[8] === 'C') return;
            var att = p[7] === 'USD' && p[3] < TODAY && p[3] >= addD(TODAY, -30);
            (lines[p[0]] || []).forEach(function (l) {
                var q = l[2] - l[4]; if (!(q > 0)) return;
                var o = open[l[1]] || (open[l[1]] = { rq: 0, cq: 0, od: 0, om: '' });
                if (att) o.cq += q; else o.rq += q;
                if (p[3].slice(0, 7) < M0) o.od += q;
                if (!o.om || p[3].slice(0, 7) < o.om) o.om = p[3].slice(0, 7);
            });
        });
        var GRN = H.idx(D.grn);
        D.grn.forEach(function (g) {
            var p = by[g[6]], d = p ? days(p[2], g[2]) : -1;
            if (d >= 0 && d <= 730) (sup[g[4]] = sup[g[4]] || []).push(d);
        });
        Object.keys(sup).forEach(function (k) {
            var a = sup[k].sort(function (x, y) { return x - y; }), r = 0.8 * (a.length - 1), lo = Math.floor(r);
            lt[k] = a.length >= 3 ? a[lo] + (a[Math.min(lo + 1, a.length - 1)] - a[lo]) * (r - lo) : 130;
        });
        D.grnL.forEach(function (l) { var g = GRN[l[0]]; if (g && (!last[l[1]] || g[2] >= last[l[1]][0])) last[l[1]] = [g[2], g[4]]; });
        Object.keys(last).forEach(function (c) { it[c] = lt[last[c][1]] || 130; });
        return (PO = { open: open, lt: it });
    }
    function stockQ(o, sc, fn) {
        var s = 0;
        o.st.forEach(function (r) { if (inSc(sc, WHBR[r[1]]) && fn(r[3])) s += r[4]; });
        return s;
    }
    function forSale(e, d) { return !e || e >= d; }

    /* ---------- render-time blocks ---------- */
    window.DEMO_RENDERERS.move = function () {
        var dp = { '*': 'All Divisions' }, br = { C: 'Company', CEN: 'Central', NTH: 'North', WST: 'West' };
        D.divisions.forEach(function (n, i) { dp[DPC[String(i + 1)]] = n; });
        var cnt = {};
        D.items.forEach(function (r) { cnt[r[2]] = (cnt[r[2]] || 0) + 1; });
        return [
            { id: 'mv-meta', data: { admin: 1, cost: 1, asOf: H.asOf, fcstAt: H.today + ' 02:40', today: TODAY,
                defFrom: TODAY.slice(0, 4) + '-01-01' > MIND ? TODAY.slice(0, 4) + '-01-01' : MIND, dimsV: 'demo-' + window.DEMO_INDUSTRY + '-' + TODAY.replace(/-/g, '') + 'd', minD: MIND } },
            { id: 'mv-i18n', data: { sc: SCOPES, br: br, bra: br, dp: dp } },
            { id: 'mv-classes', data: D.classes.map(function (n, i) { return { c: String(i + 1), n: n, k: cnt[i] || 0 }; }) }
        ];
    };

    /* ---------- MOVE_AJAX ---------- */
    function dims() {
        var brands = {};
        D.suppliers.forEach(function (s) { brands[s[0]] = s[1]; });
        var it = D.items.slice().sort(function (a, b) {   /* class, brand, code (live order) */
            return (a[2] - b[2]) || (a[4] < b[4] ? -1 : a[4] > b[4] ? 1 : 0) || (a[0] < b[0] ? -1 : 1);
        });
        return { brands: brands, items: it.map(function (r) { return [r[0], r[1], String(r[2] + 1), r[4], r[3], 1, r[3], [[r[3], 1]], 0]; }) };
    }
    function custs(t) {
        t = String(t || '').trim().toUpperCase();
        var out = [];
        if (t.length < 2) return out;
        D.customers.forEach(function (c) {
            if (out.length < 25 && (c[0].indexOf(t) === 0 || c[1].toUpperCase().indexOf(t) >= 0)) out.push([+c[0], c[1], dept(c[0])]);
        });
        return out;
    }
    function scopeOf(v) { return SCOPES.indexOf(v) >= 0 ? v : 'C'; }

    function rows(p) {
        var I = idx(), PI = poIdx(), from = okDate(p.x02, TODAY.slice(0, 4) + '-01-01'), sc = scopeOf(p.x03), dp = DEPTS.indexOf(p.x04) >= 0 ? p.x04 : '*',
            cu = p.x05 ? String(+p.x05) : null, cbr = '', out = [];
        if (from < MIND) from = MIND;
        if (from > TODAY) from = TODAY;
        if (cu) {
            var last = '';
            I.list.forEach(function (o) { o.ev.forEach(function (e) { if (e[4] === 'S' && e[7] === cu && e[0] >= last) { last = e[0]; cbr = BRSC[e[8]]; } }); });
        }
        I.list.forEach(function (o) {
            var O = stockQ(o, sc, function (e) { return forSale(e, from); }),
                C = stockQ(o, sc, function (e) { return forSale(e, TODAY); }),
                E = stockQ(o, sc, function (e) { return e && e >= TODAY && e < EXP90; }),
                RG = cbr ? stockQ(o, cbr, function (e) { return forSale(e, TODAY); }) : 0,
                U = 0, QA = 0, Q = 0, XF = 0, mA = {}, mD = {}, lsA = '', lsD = '', anyD = false, SD = { '1001': 0, '2001': 0, '3001': 0 }, CO = 0;
            o.ev.forEach(function (e) {
                var stIn = inSc(sc, WHBR[e[1]]);
                if (stIn && e[0] >= from && forSale(e[3], from)) O -= e[2];
                if ((e[4] === 'S' || e[4] === 'R') && e[0] >= from) CO -= e[2];   /* company sales in the period: the branch share of the open orders */
                if (e[4] === 'S' || e[4] === 'R') {
                    if (!inSc(sc, e[8])) return;
                    var q = -e[2], m = e[0].slice(0, 7), dv = dept(e[7]), inD = dp === '*' || dv === dp;
                    if (e[0] >= from) { QA += q; if (inD && (!cu || e[7] === cu)) { Q += q; if (SD[dv] !== undefined) SD[dv] += q; } }
                    mA[m] = (mA[m] || 0) + q;
                    if (e[4] === 'S' && e[0] > lsA) lsA = e[0];
                    if (inD) { anyD = true; mD[m] = (mD[m] || 0) + q; if (e[4] === 'S' && e[0] > lsD) lsD = e[0]; }
                    return;
                }
                if (!stIn || e[0] < from) return;
                if (e[4] === 'P') U += e[2];
                else if (e[4] === 'T') XF += e[2];
            });
            var LTD = PI.lt[o.c] || 130, A = fcst(mA, o, LTD), F = dp === '*' ? A : (anyD ? fcst(mD, o, LTD) : null), shr = 1, s12A = 0, s12D = 0,
                PO1 = PI.open[o.c], ps = !PO1 ? 0 : sc === 'C' ? 1 : CO > 0 ? Math.max(0, Math.min(1, QA / CO)) : 0;
            if (dp !== '*') {
                M12.forEach(function (m) { s12A += mA[m] || 0; s12D += mD[m] || 0; });
                shr = s12A > 0 ? Math.max(0, Math.min(1, s12D / s12A)) : o.base[dp];
            }
            var f3 = F ? F.f3 : 0, b = o.base[dp] || 0;
            if (cu && !r6(Q)) return;
            if (dp !== '*' && !r6(Q) && !(f3 > 0) && !b) return;
            if (!r6(O) && !r6(C) && !U && !r6(Q) && !(F && F.rt > 0)) return;
            out.push([o.c, r6(O * shr), dp === '*' ? U : 0, r6(Q), dp === '*' ? r6(C - O - U + QA) : 0, r6(C * shr), r6(E * shr),
                F ? F.pt : 'D', r6(f3), r6(F ? F.f6 : 0), (dp === '*' ? lsA : lsD) || '', F ? F.n : 0, r6(shr),
                (dp === '1001' || dp === '2001') && !b ? 1 : 0, dp === '*' ? XF : 0, RG,
                r6(SD['1001']), r6(SD['2001']), r6(SD['3001']),
                PO1 ? PO1.rq : 0, PO1 ? PO1.cq : 0, PO1 ? PO1.od : 0, PO1 ? PO1.om : '', r6(ps),
                r6(F ? F.rt : 0), F ? F.ltd : LTD, r6(F ? F.saf : 0), F ? F.cut : 0]);
        });
        return { from: from, to: TODAY, scope: sc, dept: dp, cust: cu || '', cbr: cbr, rows: out, n: out.length };
    }

    function docs(p) {
        var I = idx(), from = okDate(p.x02, addM(TODAY, -3)), sc = scopeOf(p.x03), o = I.IT[p.x05], rc = p.x06 === 'rc', out = [];
        if (!o) return { err: 'item' };
        if (from < MIND) from = MIND;
        var GRN = H.idx(D.grn), TRF = H.idx(D.trf), expF = 0, expT = 0;
        o.st.forEach(function (r) {
            if (!inSc(sc, WHBR[r[1]])) return;
            if (r[3] && r[3] < from) expF += r[4];
            if (r[3] && r[3] < TODAY) expT += r[4];
        });
        o.ev.forEach(function (e) {
            if (!inSc(sc, WHBR[e[1]]) || e[0] < from) return;
            if (e[3] && e[3] < from) expF -= e[2];
            if (rc && e[4] === 'P') out.push([e[0], 'Purchase Receipt', GRN[e[6]][1], WHN[e[1]], e[2]]);
            else if (rc && e[4] === 'T') out.push([e[0], e[2] < 0 ? 'Transfer Out' : 'Transfer In', TRF[e[6]][1], WHN[e[1]], e[2], e[2] < 0 ? 5 : 6]);
            else if (!rc && e[4] === 'W') out.push([e[0], 'Expired Stock Write-off', 'WO' + e[0].slice(0, 4) + '-' + ('000' + e[6]).slice(-4), WHN[e[1]], e[2]]);
        });
        return { item: o.c, rows: out, x: rc ? [] : [['expired', r6(expF - expT)], ['cross', 0]] };
    }

    /* customers | salesmen of an item over the selected period (live 27/10/2026): M up to 12 months, Q to 36, H to 60, Y beyond;
       rows [code, name, dept, br, active months, q0..qn], customers by total, salesmen by branch then total */
    function custMatrix(p) {
        var I = idx(), sc = scopeOf(p.x03), o = I.IT[p.x05], from = okDate(p.x02, TODAY.slice(0, 4) + '-01-01'), C = {}, R = {};
        if (!o) return { err: 'item' };
        if (from < MIND) from = MIND;
        var pm = (+TODAY.slice(0, 4) - +from.slice(0, 4)) * 12 + (+TODAY.slice(5, 7) - +from.slice(5, 7)) + 1,
            cm = pm <= 12 ? 'M' : pm <= 36 ? 'Q' : pm <= 60 ? 'H' : 'Y', stp = { M: 1, Q: 3, H: 6, Y: 12 }[cm];
        function bs(d) { var y = +d.slice(0, 4), m = +d.slice(5, 7) - 1; m = m - m % stp; return y * 12 + m; }
        var b0 = bs(from), nb = Math.floor((bs(TODAY) - b0) / stp) + 1, keys = [];
        for (var k = 0; k < nb; k++) { var v = b0 + k * stp; keys.push(Math.floor(v / 12) + '-' + p2(v % 12 + 1)); }
        o.ev.forEach(function (e) {
            if ((e[4] !== 'S' && e[4] !== 'R') || !inSc(sc, e[8]) || e[0] < from) return;
            var i = Math.round((bs(e[0]) - b0) / stp), q = -e[2], rp = H.rep[e[9]], cu = H.cust[e[7]];
            if (i < 0 || i >= nb) return;
            var a = C[e[7]] || (C[e[7]] = { r: [+cu[0], cu[1], dept(e[7]), BRSC[cu[3]], 0], q: new Array(nb).fill(0), m: {} });
            var b = R[e[9]] || (R[e[9]] = { r: [+rp[0], rp[1], '', BRSC[rp[2]], 0], q: new Array(nb).fill(0), m: {} });
            a.q[i] += q; b.q[i] += q;
            if (e[4] === 'S') { a.m[e[0].slice(0, 7)] = 1; b.m[e[0].slice(0, 7)] = 1; }
        });
        function fin(map) {
            return Object.keys(map).map(function (k) {
                var x = map[k], t = 0; x.q.forEach(function (v) { t += v; });
                x.r[4] = Object.keys(x.m).length;
                var a = x.r.concat(x.q.map(r6)); a.t = t; return a;
            }).filter(function (a) { return r6(a.t); });
        }
        var rows = fin(C).sort(function (a, b) { return b.t - a.t; }), sm = fin(R), ob = { CEN: 0, NTH: 1, WST: 2 };
        sm.sort(function (a, b) { return (ob[a[3]] - ob[b[3]]) || (b.t - a.t); });
        rows.concat(sm).forEach(function (a) { delete a.t; });
        return { item: o.c, cm: cm, pm: pm, from: from, to: TODAY, b: keys, rows: rows, sm: sm };
    }

    /* stock for sale by warehouse (live 'stk'): [store, name, for sale, expired] */
    function stk(p) {
        var I = idx(), sc = scopeOf(p.x03), o = I.IT[p.x05], W = {};
        if (!o) return [];
        o.st.forEach(function (r) {
            if (!inSc(sc, WHBR[r[1]])) return;
            var w = W[r[1]] || (W[r[1]] = [r[1], WHN[r[1]], 0, 0]);
            if (forSale(r[3], TODAY)) w[2] += r[4]; else w[3] += r[4];
        });
        return Object.keys(W).map(function (k) { return W[k]; }).filter(function (w) { return r6(w[2]) || r6(w[3]); })
            .sort(function (a, b) { return b[2] - a[2]; });
    }
    S.MOVE_AJAX = function (p) {
        switch (p.x01) {
            case 'dims': return dims();
            case 'rows': return rows(p);
            case 'custs': return custs(p.x05);
            case 'docs': return docs(p);
            case 'cust': return custMatrix(p);
            case 'stk': return stk(p);
        }
        return { err: 'unknown' };
    };

    /* ---------- MOVE_COST_AJAX: values at the moving average cost, all lots ---------- */
    S.MOVE_COST_AJAX = function (p) {
        var I = idx(), act = p.x01 === 'itm' ? 'itm' : 'cls', sc = scopeOf(p.x03), to = okDate(p.x04, TODAY), cls = p.x05 || '';
        if (to > TODAY) to = TODAY;
        var from = okDate(p.x02, to.slice(0, 8) + '01');
        if (from < MIND) from = MIND;
        if (from > to) from = to;
        if (act === 'itm' && !cls) cls = '0';
        var G = {}, keys = [];
        I.list.forEach(function (o) {
            if (act === 'itm' && o.cl !== cls) return;
            var op = 0, cl = 0, oq = 0, cq = 0, pu = 0, xf = 0, s = 0, mv = 0, mq = 0;
            ['1', '2', '3'].forEach(function (b) { if (inSc(sc, b)) { op += o.vb[b]; cl += o.vb[b]; } });
            o.st.forEach(function (r) { if (inSc(sc, WHBR[r[1]])) { oq += r[4]; cq += r[4]; } });
            o.ev.forEach(function (e) {
                if (!inSc(sc, WHBR[e[1]]) || e[0] < from) return;
                op -= e[5]; oq -= e[2];
                if (e[0] > to) { cl -= e[5]; cq -= e[2]; return; }
                mv += e[5]; mq += e[2];
                if (e[4] === 'P') pu += e[5];
                else if (e[4] === 'T') xf += e[5];
                else if (e[4] === 'S' || e[4] === 'R') s -= e[5];
            });
            var vis = r6(oq) || r6(cq) || r6(mq) || H.r2(mv) || H.r2(s) ? 1 : 0;
            var k = act === 'cls' ? o.cl : o.c, g = G[k];
            if (!g) { g = G[k] = [k, act === 'cls' ? H.className(+o.cl - 1) : o.r[1], 0, 0, 0, 0, 0, 0, 0]; keys.push(k); }
            g[2] += op; g[3] += pu; g[4] += xf; g[5] += s; g[6] += s; g[7] += cl; g[8] = g[8] || vis;
        });
        keys.sort();
        var out = [], res = [0, 0, 0, 0, 0, 0, 0];
        keys.forEach(function (k) {
            var g = G[k], v = g.slice(2, 8).map(r6);
            if (g[8]) out.push([g[0], g[1]].concat(v));
            else { for (var j = 0; j < 6; j++) res[j] = r6(res[j] + v[j]); res[6]++; }
        });
        return { from: from, to: to, scope: sc, act: act, cls: act === 'itm' ? cls : '', rows: out, res: res, n: out.length };
    };
})();
