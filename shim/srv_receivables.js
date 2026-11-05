/* srv_receivables.js - RECEIVABLES page: #ar-rows/#ar-coll/#ar-sm/#ar-meta blocks and RECEIVABLES_AJAX (24/10/2026) */
(function () {
    var D = window.DEMO, S = window.DEMO_SRV, H = window.DEMO_H;
    var TODAY = H.today.slice(6, 10) + '-' + H.today.slice(3, 5) + '-' + H.today.slice(0, 2);
    var AREA = H.idx(D.areas), SUPV = H.idx(D.supervisors);

    function day(iso) { return Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / 864e5; }
    function iso(dmy) { return dmy.slice(6, 10) + '-' + dmy.slice(3, 5) + '-' + dmy.slice(0, 2); }

    // open items today, replayed like srv_smcard replay(): debits (I/O/B) in id order, receipts by their
    // allocations, returns FIFO, leftovers to advance; bounced cheques consume the advance FIFO
    function replay() {
        if (H._arr) return H._arr;
        var ev = {}, al = {}, out = {};
        function add(c, e) { (ev[c] = ev[c] || []).push(e); }
        D.alloc.forEach(function (a) { (al[a[0]] = al[a[0]] || []).push(a); });
        D.inv.forEach(function (r) { add(r[4], [r[2], r[14] === 'O' ? 0 : r[14] === 'I' ? 1 : 4, r[0], 'D', r]); });
        D.ret.forEach(function (r) { add(r[3], [r[2], 2, r[0], 'R', r]); });
        D.rcpt.forEach(function (r) { add(r[3], [r[2], 3, r[0], 'P', r]); });
        D.customers.forEach(function (c) {
            var cc = c[0], es = (ev[cc] || []).sort(function (a, b) {
                return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] - b[1] || a[2] - b[2];
            }), open = [], byId = {}, adv = 0;
            function credit(amt) {
                for (var j = 0; j < open.length && amt > 0.004; j++) {
                    var o = open[j]; if (o.v <= 0.004) continue;
                    var a = Math.min(o.v, amt); o.v = H.r2(o.v - a); amt = H.r2(amt - a);
                }
                return amt;
            }
            es.forEach(function (e) {
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
            out[cc] = { adv: adv, items: open.filter(function (o) { return o.v > 0.004; })
                .map(function (o) { return { r: o.r, v: o.v }; }) };
        });
        return (H._arr = out);
    }

    // customer dimension as the live view: current salesman, its area, division text, card terms/grace/limit
    function dim(c) {
        var rp = H.rep[c[7]], a = AREA[H.repArea[c[7]]], dp = H.depts()[c[4]];
        return { s: rp ? rp[0] : '0', sn: rp ? rp[1] : '(No Salesman)', an: a ? a[1] : '(No Area)',
            dp: dp ? dp.n : 'Unassigned', c: c[0], cn: c[1] };
    }
    function grace(c) { var n = 0; for (var i = 0; i < c[0].length; i++) n += c[0].charCodeAt(i); return c[5] ? [0, 7, 15, 30][n % 4] : 0; }

    function rows() {
        var rp = replay(), out = [], t0 = day(TODAY);
        D.customers.forEach(function (c) {
            var x = rp[c[0]], tot = -x.adv, m, gd = grace(c), adv = x.adv;
            x.items.forEach(function (o) { tot += o.v; });
            tot = H.r2(tot);
            if (Math.abs(tot) < 0.005) return;
            m = dim(c);
            function row(o) {
                var r = {}, k; for (k in m) r[k] = m[k];
                r.d = o ? H.dmy(o.r[2]) : ''; r.k = o ? o.r[2].replace(/-/g, '') : '';
                r.a = o ? t0 - day(o.r[2]) : -1; r.dd = o ? c[5] : 0; r.cd = c[5]; r.gd = gd;
                r.rc = o && o.r[14] === 'B' ? 1 : 0; r.g = o ? o.r[11] : 0; r.o = o ? o.v : tot;
                r.cl = c[6] || 0; r.ref = o ? String(o.r[1]) : 'BAL-0/0';
                return r;
            }
            if (tot < 0) { out.push(row(null)); return; }
            // a positive balance with unapplied advance: the advance trims the oldest items (live OPEN_VALUE)
            x.items.slice().sort(function (a, b) { return a.r[2] < b.r[2] ? -1 : a.r[2] > b.r[2] ? 1 : a.r[0] - b.r[0]; })
                .forEach(function (o) {
                    var v = o.v;
                    if (adv > 0.004) { var t = Math.min(adv, v); v = H.r2(v - t); adv = H.r2(adv - t); }
                    if (v > 0.004) out.push(row({ r: o.r, v: v }));
                });
        });
        return out;
    }

    function coll(f, t) {
        var agg = {}, out = [];
        D.rcpt.forEach(function (r) {
            if (r[2] < f || r[2] > t) return;
            agg[r[3]] = (agg[r[3]] || 0) + r[8];
        });
        Object.keys(agg).forEach(function (cc) {
            var c = H.cust[cc]; if (!c) return;
            var m = dim(c);
            out.push({ c: m.c, s: m.s, cn: m.cn, sn: m.sn, an: m.an, dp: m.dp, v: H.r2(agg[cc]) });
        });
        return out;
    }

    window.DEMO_RENDERERS.receivables = function () {
        var R = rows(), sm = {}, d1 = '01' + H.today.slice(2);
        R.forEach(function (r) {
            var rp = H.rep[r.s]; if (!rp || sm[r.s]) return;
            var sv = SUPV[rp[3]];
            sm[r.s] = [rp[1], sv ? String(sv[0]) : '', sv ? sv[1] : ''];
        });
        return [
            { id: 'ar-rows', data: R },
            { id: 'ar-coll', data: coll(iso(d1), TODAY) },
            { id: 'ar-sm', data: sm },
            { id: 'ar-meta', data: { admin: 1, asOf: H.asOf, d1: d1, d2: H.today } }
        ];
    };

    S.RECEIVABLES_AJAX = function (p) {
        var re = /^(\d{2})\/(\d{2})\/(\d{4})$/, a = re.exec(p.x02 || ''), b = re.exec(p.x03 || '');
        if (p.x01 !== 'coll') return { err: 'unknown action' };
        if (!a || !b || +a[2] < 1 || +a[2] > 12 || +b[2] < 1 || +b[2] > 12) return { err: 'bad dates' };
        return coll(iso(p.x02), iso(p.x03));
    };
})();
