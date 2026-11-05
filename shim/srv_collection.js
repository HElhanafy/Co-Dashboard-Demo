/* srv_collection.js - COLLECTION page: cp-rows/cp-mtd/cp-mtdcoll/cp-sm/cp-meta blocks and COLLECTION_AJAX (month-end snapshots replayed from inv/rcpt/alloc/ret) (24/10/2026) */
(function () {
    var D = window.DEMO, S = window.DEMO_SRV, H = window.DEMO_H;
    var TODAY = H.today.slice(6, 10) + '-' + H.today.slice(3, 5) + '-' + H.today.slice(0, 2);
    var CUR_Y = +TODAY.slice(0, 4), CUR_MI = H.midx(TODAY), ARCH_LAST = CUR_MI - 1;
    var AREA = H.idx(D.areas), SUPV = H.idx(D.supervisors), C = {};

    function day(iso) { return Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / 864e5; }
    function iso(d) { return new Date(d * 864e5).toISOString().slice(0, 10); }
    function mStart(i) { var t = H.ym(i); return t.y + '-' + (t.m < 10 ? '0' : '') + t.m + '-01'; }
    function mKey(i) { return mStart(i).slice(0, 7).replace('-', ''); }
    function repAt(c, lim) { var r = c[7]; (c[8] || []).forEach(function (h) { if (h[0] < lim) r = h[1]; }); return r; }
    function dims(c, rep) {
        var d = H.depts()[c[4]], a = AREA[H.repArea[rep]];
        return { c: c[0], cn: c[1], d: d ? d.n : 'Unassigned', s: rep ? String(rep) : '0',
            sn: H.rep[rep] ? H.rep[rep][1] : '(No Salesman)', an: a ? a[1] : '(No Area)' };
    }

    // same ledger replay as srv_smcard.js: debits (I/O/B) in id order, receipts by allocations,
    // returns FIFO, leftovers to advance; bounced cheques consume the advance FIFO
    function replay() {
        if (C.rp) return C.rp;
        var ev = {}, al = {}, ck = [], i;
        function add(c, e) { (ev[c] = ev[c] || []).push(e); }
        D.alloc.forEach(function (a) { (al[a[0]] = al[a[0]] || []).push(a); });
        D.inv.forEach(function (r) { add(r[4], [r[2], r[14] === 'O' ? 0 : r[14] === 'I' ? 1 : 4, r[0], 'D', r]); });
        D.ret.forEach(function (r) { add(r[3], [r[2], 2, r[0], 'R', r]); });
        D.rcpt.forEach(function (r) { add(r[3], [r[2], 3, r[0], 'P', r]); });
        for (i = 0; i <= ARCH_LAST; i++) ck.push({ lim: mStart(i + 1), mi: i });
        var out = { snap: {}, now: {} };
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
            function snapshot() {
                return { adv: adv, items: open.filter(function (o) { return o.v > 0.004; })
                    .map(function (o) { return { r: o.r, v: o.v }; }) };
            }
            es.forEach(function (e) {
                while (k < ck.length && ck[k].lim <= e[0]) { (out.snap[ck[k].mi] = out.snap[ck[k].mi] || {})[cc] = snapshot(); k++; }
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
            while (k < ck.length) { (out.snap[ck[k].mi] = out.snap[ck[k].mi] || {})[cc] = snapshot(); k++; }
            out.now[cc] = snapshot();
        });
        return (C.rp = out);
    }

    // month flows per customer: cv = receipts, rc = bounced cheques
    function flows() {
        if (C.fl) return C.fl;
        var f = {};
        function g(cc, mi) { var k = cc + '|' + mi; return f[k] || (f[k] = { cv: 0, rc: 0 }); }
        D.rcpt.forEach(function (r) { if (r[2] <= TODAY + '~') g(r[3], H.midx(r[2])).cv += r[8]; });
        D.inv.forEach(function (r) { if (r[14] === 'B') g(r[4], H.midx(r[2])).rc += r[11]; });
        return (C.fl = f);
    }

    // archived month rows (AR_COLL_ARCHIVE): ot open, ov overdue, op overdue carried from before the month,
    // rk aged >120d, cv collected, oa oldest age, rc bounced, dn due next month
    function monthRows(mi) {
        var key = H.base + '|' + mi;
        if (C[key]) return C[key];
        var rp = replay(), fl = flows(), s0 = mStart(mi), s1 = mStart(mi + 1), s2 = mStart(mi + 2),
            endDay = day(s1) - 1, snap = rp.snap[mi] || {}, out = [];
        D.customers.forEach(function (c) {
            var sn = snap[c[0]], f = fl[c[0] + '|' + mi], ot = 0, ov = 0, op = 0, rk = 0, oa = 0, dn = 0;
            if (sn) sn.items.forEach(function (o) {
                var due = o.r[3], age = endDay - day(o.r[2]);
                ot += o.v;
                if (due < s1) ov += o.v;
                if (due < s0) op += o.v;
                if (age > 120) rk += o.v;
                if (due >= s1 && due < s2) dn += o.v;
                if (age > oa) oa = age;
            });
            if (ot < 0.005 && !(f && (f.cv || f.rc))) return;
            var r = dims(c, repAt(c, s1));
            r.m = mKey(mi); r.ot = H.r2(ot); r.ov = H.r2(ov); r.op = H.r2(op); r.rk = H.r2(rk);
            r.cv = H.r2(f ? f.cv : 0); r.oa = oa; r.rc = H.r2(f ? f.rc : 0); r.dn = H.r2(dn);
            out.push(r);
        });
        return (C[key] = out);
    }

    function yearRows(y) {
        var out = [], a = (y - H.base) * 12 - 1, b = Math.min((y - H.base) * 12 + 11, ARCH_LAST);
        for (var mi = Math.max(a, 0); mi <= b; mi++) out = out.concat(monthRows(mi));
        return out;
    }
    function defYear() { return ARCH_LAST >= 0 ? H.ym(ARCH_LAST).y : CUR_Y; }

    // live month-to-date: open items as of today (AR_OPEN_INV_SUM)
    function mtd() {
        var rp = replay(), t = day(TODAY), m0 = mStart(CUR_MI), mPrev = iso(day(m0) - 1),
            last = iso(day(mStart(CUR_MI + 1)) - 1), out = [];
        D.customers.forEach(function (c) {
            var sn = rp.now[c[0]], ot = 0, ov = 0, op = 0, rk = 0, oa = 0, dm = 0;
            if (!sn || !sn.items.length) return;
            sn.items.forEach(function (o) {
                var due = o.r[3], age = t - day(o.r[2]);
                ot += o.v;
                if (due < TODAY) ov += o.v;
                if (due < mPrev) op += o.v;
                if (age > 120) rk += o.v;
                if (due < last) dm += o.v;
                if (age > oa) oa = age;
            });
            var r = dims(c, repAt(c, '9999'));
            r.ot = H.r2(ot); r.ov = H.r2(ov); r.op = H.r2(op); r.rk = H.r2(rk); r.oa = oa; r.dm = H.r2(dm);
            out.push(r);
        });
        return out;
    }
    function mtdColl() {
        var fl = flows(), out = [];
        D.customers.forEach(function (c) {
            var f = fl[c[0] + '|' + CUR_MI];
            if (!f || !(H.r2(f.cv) || H.r2(f.rc))) return;
            var r = dims(c, repAt(c, '9999'));
            r.cv = H.r2(f.cv); r.rc = H.r2(f.rc);
            out.push(r);
        });
        return out;
    }
    function smMap() {
        var o = {};
        D.reps.forEach(function (r) { var s = SUPV[r[3]]; if (s) o[r[0]] = [r[1], String(s[0]), s[1]]; });
        return o;
    }

    window.DEMO_RENDERERS.collection = function () {
        var y = defYear();
        return [
            { id: 'cp-rows', data: yearRows(y) },
            { id: 'cp-mtd', data: mtd() },
            { id: 'cp-mtdcoll', data: mtdColl() },
            { id: 'cp-sm', data: smMap() },
            { id: 'cp-meta', data: { asOf: '01/' + H.today.slice(3, 10) + ' 04:00', asOfD: H.asOf, year: y,
                lastM: ARCH_LAST >= 0 ? mKey(ARCH_LAST) : '', curM: mKey(CUR_MI), minYear: H.base } }
        ];
    };

    S.COLLECTION_AJAX = function (p) {
        if (p.x01 !== 'rows') return { err: 'unknown action' };
        var y = +p.x02;
        if (!y || y < H.base || y > 2100) return { err: 'bad year' };
        return yearRows(y);
    };
})();
