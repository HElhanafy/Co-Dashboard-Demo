(function () {
    var D = window.DEMO, S = window.DEMO_SRV, H = window.DEMO_H;
    var AR = '110401', AP = '210101';

    function n2(x) { return H.r2(x || 0).toFixed(2); }
    function p1(a, b) { return b ? (Math.round(a / b * 1000) / 10).toFixed(1) : ''; }
    function two(n) { return (n < 10 ? '0' : '') + n; }
    function isoOf(y, m, d) { return y + '-' + two(m) + '-' + two(d); }
    function dnum(iso) { return Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / 864e5; }
    function addM(iso, k) {
        var t = new Date(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1 + k, +iso.slice(8, 10)));
        return t.toISOString().slice(0, 10);
    }
    function addD(iso, k) { return new Date((dnum(iso) + k) * 864e5).toISOString().slice(0, 10); }

    // today and the period frame
    var T = H.today, Y = +T.slice(6, 10), MO = +T.slice(3, 5), DD = +T.slice(0, 2);
    var TODAY = isoOf(Y, MO, DD), M0 = isoOf(Y, MO, 1), M1 = addM(M0, 1), Y0 = isoOf(Y, 1, 1);
    var LY = MO === 1 ? Y - 1 : Y, LM = MO === 1 ? 12 : MO - 1;
    var CM = H.midx(TODAY), LMI = CM - 1, Y0I = H.midx(Y0);

    // ledger lines with entry dates, by account
    function glBy(acct) {
        var k = '_gl_' + acct;
        if (H[k]) return H[k];
        var ed = {}, out = [];
        D.gl.forEach(function (e) { ed[e[0]] = e[4]; });
        D.glL.forEach(function (l) { if (l[1] === acct) out.push([l[6], ed[l[0]], l[2] - l[3]]); });
        return (H[k] = out);
    }

    // open items as of cut (exclusive): ledger balance per party filled into the newest documents (FIFO settlement)
    function openItems(lines, docs, sign, cut) {
        var bal = {}, by = {}, out = [];
        lines.forEach(function (l) { if (l[0] && l[1] < cut) bal[l[0]] = (bal[l[0]] || 0) + sign * l[2]; });
        docs.forEach(function (d) { if (d.date < cut) (by[d.party] = by[d.party] || []).push(d); });
        Object.keys(by).forEach(function (p) {
            var left = H.r2(bal[p] || 0);
            by[p].sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : b.id - a.id; });
            by[p].forEach(function (d) {
                if (left <= 0.004) return;
                var o = Math.min(d.amt, left); left = H.r2(left - o);
                out.push({ d: d, open: o });
            });
        });
        return out;
    }
    function arDocs() {
        if (H._homeArDocs) return H._homeArDocs;
        return (H._homeArDocs = D.inv.map(function (r) {
            return { id: r[0], party: r[4], rep: r[5], date: r[2], due: r[3], amt: r[11], kind: r[14] };
        }));
    }
    function arOpen(cut) { return openItems(glBy(AR), arDocs(), 1, cut); }

    function monthSums() {
        var m = {};
        H.facts().forEach(function (f) { var a = m[f[0]] || (m[f[0]] = [0, 0]); a[0] += f[6]; a[1] += f[8]; });
        return m;
    }

    function blkSales(ms) {
        var m = [], ytd = 0, ly = 0, i, v, y;
        for (i = Y0I - 12; i <= CM; i++) {
            v = ms[i] ? ms[i][0] : 0; y = H.ym(i);
            m.push([y.y + '-' + two(y.m), n2(v)]);
            if (i >= Y0I) ytd += v;
            if (i <= CM - 12) ly += v;
        }
        return { m: m, ytd: n2(ytd), ly: n2(ly), mon: n2(ms[CM] ? ms[CM][0] : 0) };
    }

    function blkTarget() {
        var tg = {}, ac = {}, yy = String(Y), ly = String(LY), lmk = LY + '-' + two(LM);
        D.targets.forEach(function (t) {
            var o = tg[t[0]] || (tg[t[0]] = { ann: 0, per: 0, mon: 0, ann2: 0, last: 0 }), mo = +t[1].slice(5, 7);
            if (t[1].slice(0, 4) === yy) { o.ann += t[2]; if (mo <= MO) o.per += t[2]; if (mo === MO) o.mon += t[2]; }
            if (t[1].slice(0, 4) === ly) o.ann2 += t[2];
            if (t[1] === lmk) o.last += t[2];
        });
        H.facts().forEach(function (f) {
            var a = ac[f[2]] || (ac[f[2]] = { y: 0, m: 0, l: 0 });
            if (f[0] >= Y0I && f[0] <= CM) a.y += f[6];
            if (f[0] === CM) a.m += f[6];
            if (f[0] === LMI) a.l += f[6];
        });
        var r = { ytd: { ann: 0, per: 0, act: 0, adj: 0, gap: 0 }, mon: { ann: 0, per: 0, act: 0, adj: 0 }, last: { ann: 0, per: 0, act: 0, adj: 0 } };
        // the first page of TARGET: total sales against target, no capping (02/11/2026)
        Object.keys(tg).forEach(function (k) {
            var t = tg[k];
            r.ytd.ann += t.ann; r.ytd.per += t.per;
            r.mon.ann += t.ann; r.mon.per += t.mon;
            r.last.ann += t.ann2; r.last.per += t.last;
        });
        Object.keys(ac).forEach(function (k) {
            var a = ac[k];
            r.ytd.act += a.y; r.ytd.adj += a.y;
            r.mon.act += a.m; r.mon.adj += a.m;
            r.last.act += a.l; r.last.adj += a.l;
        });
        r.ytd.gap = Math.max(r.ytd.ann - r.ytd.act, 0);
        ['ytd', 'mon', 'last'].forEach(function (p) {
            var o = r[p];
            o.pct = p1(o.adj, o.per) || '0.0';
            ['ann', 'per', 'act', 'adj', 'gap'].forEach(function (k) { if (o[k] !== undefined) o[k] = n2(o[k]); });
        });
        return r;
    }

    function blkAr() {
        var open = 0, over = 0, b = [0, 0, 0, 0, 0, 0];
        arOpen('9999').forEach(function (o) {
            var a = dnum(TODAY) - dnum(o.d.date), c = H.cust[o.d.party], term = c ? c[5] : 0;
            open += o.open;
            if (a >= 0 && a > term) over += o.open;
            b[a <= 30 ? 0 : a <= 60 ? 1 : a <= 90 ? 2 : a <= 120 ? 3 : a <= 150 ? 4 : 5] += o.open;
        });
        return { open: n2(open), over: n2(over), pct: p1(over, open) || '0.0', b: b.map(n2) };
    }

    function blkItems() {
        var e3 = addM(TODAY, 3), e6 = addM(TODAY, 6), sl = [{}, {}, {}], lots = [0, 0, 0], qty = [0, 0, 0], soon = {},
            stocked = {}, last = {}, m3 = addM(TODAY, -3), m6 = addM(TODAY, -6), out = {};
        D.stock.forEach(function (s) {
            if (s[4] <= 0) return;
            var x = s[3];
            if (!x || x >= TODAY) stocked[s[0]] = 1;
            if (!x || x >= e6) return;
            var k = x < TODAY ? 0 : x < e3 ? 1 : 2;
            sl[k][s[0]] = 1; lots[k]++; qty[k] += s[4];
            if (k) soon[s[0]] = 1;
        });
        if (D.meta.expiry) {
            out.exp = { x: [Object.keys(sl[0]).length, lots[0], n2(qty[0])], m3: [Object.keys(sl[1]).length, lots[1], n2(qty[1])],
                m36: [Object.keys(sl[2]).length, lots[2], n2(qty[2])], i6: Object.keys(soon).length };
        }
        H.facts().forEach(function (f) { if (f[13] === 'I' && (!last[f[5]] || f[11] > last[f[5]])) last[f[5]] = f[11]; });
        var s3 = 0, s6 = 0, tot = 0;
        Object.keys(stocked).forEach(function (k) {
            tot++;
            if (!last[k] || last[k] < m3) s3++;
            if (!last[k] || last[k] < m6) s6++;
        });
        out.slow = { m3: s3, m6: s6, tot: tot };
        return out;
    }

    function blkProfit(ms) {
        var ns = 0, cs = 0, i;
        for (i = Y0I; i <= CM; i++) if (ms[i]) { ns += ms[i][0]; cs += ms[i][1]; }
        function g(i, k) { return n2(ms[i] ? ms[i][k] : 0); }
        return { ytd: { ns: n2(ns), cost: n2(cs) }, mon: { ns: g(CM, 0), cost: g(CM, 1) }, last: { ns: g(LMI, 0), cost: g(LMI, 1) } };
    }

    function blkAcc() {
        var ed = {}, P = { ytd: {}, mon: {}, last: {} }, l0 = isoOf(LY, LM, 1);
        D.gl.forEach(function (e) { ed[e[0]] = e[4]; });
        function ln(a) {
            if (a.charAt(0) === '4') return 'rv';
            if (a.charAt(0) === '5') return 'cg';
            if (a.slice(0, 4) === '6104' || a.slice(0, 4) === '6105') return 'sd';
            if (a.charAt(0) === '6') return 'ga';
            return null;
        }
        D.glL.forEach(function (l) {
            var k = ln(String(l[1])), d = ed[l[0]], v;
            if (!k || !d) return;
            v = l[3] - l[2];
            if (d >= Y0 && d <= TODAY) P.ytd[k] = (P.ytd[k] || 0) + v;
            if (d >= M0 && d <= TODAY) P.mon[k] = (P.mon[k] || 0) + v;
            if (d >= l0 && d < M0) P.last[k] = (P.last[k] || 0) + v;
        });
        var out = {};
        Object.keys(P).forEach(function (p) {
            var o = P[p], rv = o.rv || 0, cg = -(o.cg || 0), sd = -(o.sd || 0), ga = -(o.ga || 0);
            out[p] = { rv: n2(rv), cg: n2(cg), sd: n2(sd), ga: n2(ga), oi: n2(0), zk: n2(0), np: n2(rv - cg - sd - ga) };
        });
        return out;
    }

    function blkPods() {
        // cash part of a sale = the customer's cash share of its receipts over the last 12 months
        var cr = {}, priv = {}, sl = {}, mt = {}, mk = Y + '-' + two(MO), from = addM(TODAY, -12);
        H.depts().forEach(function (d) { if (d.s === 'PRV') priv[d.c] = 1; });
        D.rcpt.forEach(function (r) {
            if (r[2] < from) return;
            var o = cr[r[3]] || (cr[r[3]] = [0, 0]);
            o[0] += r[8]; if (r[6] === 'CASH') o[1] += r[8];
        });
        D.targets.forEach(function (t) { if (t[1] === mk) mt[t[0]] = (mt[t[0]] || 0) + t[2]; });
        H.facts().forEach(function (f) {
            if (f[0] !== CM) return;
            var o = sl[f[2]] || (sl[f[2]] = { t: 0, c: 0, all: 0 });
            o.all += f[6];
            if (!priv[f[1]]) return;
            o.t += f[6];
            var c = cr[f[4]];
            if (c && c[0]) o.c += f[6] * c[1] / c[0];
        });
        var sales = Object.keys(sl).filter(function (k) { return sl[k].t > 0; }).map(function (k) {
            var o = sl[k], tg = mt[k] || 0;
            return [H.rep[k][1], n2(o.t), n2(o.c), tg > 0 ? p1(Math.min(o.all, tg), tg) : '', o.c, o.t];
        }).sort(function (a, b) { return b[4] - a[4] || b[5] - a[5]; }).slice(0, 5).map(function (r) { return r.slice(0, 4); });

        // collection: collectible = overdue + due this month at month start + returned cheques; from overdue = what of that old overdue got settled
        var c = {}, prevEnd = addD(M0, -1);
        function g(k) { return c[k] || (c[k] = { cv: 0, rc: 0, oo: 0, dn: 0, op: 0 }); }
        D.rcpt.forEach(function (r) { if (r[2] >= M0 && r[2] <= TODAY) g(r[4]).cv += r[8]; });
        D.inv.forEach(function (r) { if (r[14] === 'B' && r[2] >= M0 && r[2] <= TODAY) g(r[5]).rc += r[11]; });
        arOpen(M0).forEach(function (o) {
            if (o.d.due < M0) g(o.d.rep).oo += o.open;
            else if (o.d.due < M1) g(o.d.rep).dn += o.open;
        });
        arOpen('9999').forEach(function (o) { if (o.d.kind !== 'B' && o.d.due < prevEnd) g(o.d.rep).op += o.open; });
        var coll = Object.keys(c).map(function (k) {
            var o = c[k], resp = o.oo + o.rc + o.dn, rec = o.oo + o.rc - o.op;
            return [H.rep[k] ? H.rep[k][1] : k, resp, o.cv, Math.min(Math.max(rec, 0), Math.max(o.cv, 0))];
        }).filter(function (r) { return r[1] > 0 && r[2] > 0; })
            .sort(function (a, b) { return Math.min(b[2] / b[1], 1) - Math.min(a[2] / a[1], 1) || b[2] - a[2]; })
            .slice(0, 5).map(function (r) { return [r[0], n2(r[1]), n2(r[2]), n2(r[3])]; });
        return { sales: sales, coll: coll };
    }

    function blkStock() {
        var o = { sell: 0, cost: 0, xcost: 0, ncost: 0, loss: 0 }, it = {}, xi = {}, ni = {}, li = {};
        D.stock.forEach(function (s) {
            if (s[4] <= 0) return;
            var i = H.item[s[0]], val = s[4] * s[5], price = i ? i[5] : 0, sell = s[4] * price;
            if (s[3] && s[3] < TODAY) { o.xcost += val; xi[s[0]] = 1; return; }
            if (!(price > 0)) { o.ncost += val; ni[s[0]] = 1; return; }
            o.sell += sell; o.cost += val; it[s[0]] = 1;
            if (val > sell) { o.loss += val - sell; li[s[0]] = 1; }
        });
        function n(x) { return Object.keys(x).length; }
        return { sell: n2(o.sell), cost: n2(o.cost), items: n(it), xcost: n2(o.xcost), xitems: n(xi),
            ncost: n2(o.ncost), nitems: n(ni), loss: n2(o.loss), litems: n(li) };
    }

    function poOpen() {
        var ln = {};
        D.poL.forEach(function (l) { if (l[2] - l[4] > 0) (ln[l[0]] = ln[l[0]] || []).push(l); });
        return D.po.filter(function (p) { return (p[8] === 'O' || p[8] === 'P') && ln[p[0]]; })
            .map(function (p) { return { p: p, l: ln[p[0]] }; });
    }

    function blkShip() {
        var by = {}, order = [];
        function row(k) {
            if (!by[k]) { by[k] = { po: 0, it: {}, oo: 0, oi: {} }; order.push(k); }
            return by[k];
        }
        poOpen().forEach(function (o) {
            var br = H.branch[o.p[6]], lab = br ? br[1].replace(/ Branch$/, '') : 'Other';
            [row(lab), row('ALL')].forEach(function (r) {
                r.po++;
                o.l.forEach(function (l) { r.it[l[1]] = 1; if (o.p[3] < M0) r.oi[l[1]] = 1; });
                if (o.p[3] < M0) r.oo++;
            });
        });
        order.sort(function (a, b) { return a === 'ALL' ? 1 : b === 'ALL' ? -1 : 0; });
        return { lim: 0, cost: 1, br: order.map(function (k) {
            var r = by[k];
            return [k, 0, 0, 0, r.po, Object.keys(r.it).length, r.oo, Object.keys(r.oi).length, '0.00'];
        }) };
    }

    function blkSup() {
        var poNo = H.idx(D.po, 1), rows = [], sup = {}, usd = D.meta.usd, vat = D.meta.vat;
        var docs = D.grn.map(function (g) {
            var p = poNo[g[6]];
            return { id: g[0], party: g[4], date: g[2], due: g[3], amt: g[10], od: p ? p[2] : g[2] };
        });
        openItems(glBy(AP), docs, -1, '9999').forEach(function (o) {
            rows.push({ s: o.d.party, t: 'INV', due: o.d.due, od: o.d.od, v: o.open });
        });
        poOpen().forEach(function (o) {
            var s = H.sup[o.p[4]], fx = s && s[2] === 'USD' ? usd : 1, v = 0;
            o.l.forEach(function (l) { v += (l[2] - l[4]) * l[3] * fx; });
            if (fx === 1) v *= 1 + vat;
            rows.push({ s: o.p[4], t: 'ORD', due: addD(o.p[3], s ? s[3] : 0), od: o.p[2], v: v });
        });
        var r = { t: 0, o: 0, i: 0, m: [0, 0, 0, 0, 0, 0, 0, 0] }, mk = [];
        for (var k = 0; k < 6; k++) mk.push(addM(M0, k).slice(0, 7));
        rows.forEach(function (x) {
            if (x.od < Y0 || x.od > TODAY || Math.abs(x.v) < 1) return;
            r.t += x.v; r[x.t === 'ORD' ? 'o' : 'i'] += x.v;
            sup[x.s] = (sup[x.s] || 0) + x.v;
            var dm = x.due.slice(0, 7), j = mk.indexOf(dm);
            r.m[dm < mk[0] ? 0 : j >= 0 ? j + 1 : 7] += x.v;
        });
        var led = 0, codes = Object.keys(sup);
        glBy(AP).forEach(function (l) { if (sup[l[0]] !== undefined) led -= l[2]; });
        var top = codes.sort(function (a, b) { return sup[b] - sup[a]; }).slice(0, 3).map(function (c) {
            return [c, H.sup[c] ? H.sup[c][1] : c, n2(sup[c])];
        });
        return { t: n2(r.t), o: n2(r.o), i: n2(r.i), ns: codes.length, led: n2(led), un: n2(0), m0: M0.slice(0, 7),
            m: r.m.map(n2), top: top };
    }

    function board() {
        if (H._home) return H._home;
        var ms = monthSums(), dim = new Date(Y, MO, 0).getDate();
        return (H._home = {
            ok: 1,
            meta: { now: TODAY + ' ' + H.asOf.slice(11, 16), y: Y, mo: MO, d: DD, dim: dim, grp: '0' },
            t: [],
            drift: { sales: null, gl: null },
            sales: blkSales(ms),
            target: blkTarget(),
            ar: blkAr(),
            items: blkItems(),
            profit: blkProfit(ms),
            acc: blkAcc(),
            pods: blkPods(),
            stock: blkStock(),
            ship: blkShip(),
            sup: blkSup()
        });
    }

    S.HOME_KPI_AJAX = function (p) {
        if (p && p.x01 === 'rearch') return { ok: 1, done: H.archivedThru(), st: 'SUCCESS', msg: '', sec: 2 };
        return board();
    };
})();
