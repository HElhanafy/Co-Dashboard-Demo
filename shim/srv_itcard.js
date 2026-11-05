/* srv_itcard.js - ITCARD page: #ic-meta block, ITCARD_AJAX (dims/card/doc) and the stock ledger engine shared with COSTCHK (24/10/2026) */
(function () {
    var D = window.DEMO, S = window.DEMO_SRV, H = window.DEMO_H;
    /* document types: [tc, tt, effect, name, rank within the day] - effect 1 in, 2 sale, 3 out, 4 return in, 5 transfer out, 6 transfer in */
    var TY = { OPN: [1080001, 8, 1, 'Opening stock', 0], INV: [H.T_INV || 1180101, 2, 2, 'Sales invoice', 2],
        RET: [H.T_RET || 1180201, 4, 4, 'Sales return', 1], TRO: [1090101, 9, 5, 'Transfer out', 3],
        TRI: [1090201, 9, 6, 'Transfer in', 4], GRN: [1010101, 1, 1, 'Purchase receipt', 5], WOF: [1350101, 7, 3, 'Expired stock write-off', 6] };
    var TN = {}; Object.keys(TY).forEach(function (k) { TN[TY[k][0]] = TY[k][3]; });
    var WIN = '2026-01-01';   /* cost check window: the current year (last year closed) */
    H.icWin = WIN;
    function iso(dmy) { return dmy.slice(6, 10) + '-' + dmy.slice(3, 5) + '-' + dmy.slice(0, 2); }
    var TODAY = iso(H.today), MIN = D.meta.start;
    function n10(x) { return Math.round(x * 1e10) / 1e10; }
    function hash(a, b) { var h = (a * 2654435761 + b * 40503) % 1000003; return h < 0 ? -h : h; }
    var WH = {}, WHN = {}; D.warehouses.forEach(function (w) { WH[w[0]] = +w[0].slice(1); WHN[+w[0].slice(1)] = w[1]; });
    H.icStore = WH; H.icStoreName = WHN;
    function shortWh(n) { return n.replace(/\s*Store$/, ''); }
    function cfgOf(lot) { return +String(lot).replace(/\D/g, ''); }

    /* ---------- ledger engine (built once): every stock movement of every item, costed per lot and warehouse ---------- */
    var E = null;
    H.icEngine = function () { return E || (E = build()); };
    function build() {
        var byItem = {}, docs = {}, lotInfo = {}, sup = H.idx(D.suppliers);
        D.items.forEach(function (it) { byItem[it[0]] = []; });
        function doc(ty, ser, o) {
            var k = TY[ty][0] + '/' + ser;
            if (!docs[k]) { o.tc = TY[ty][0]; o.tt = TY[ty][1]; o.ef = TY[ty][2]; o.tn = TY[ty][3]; o.rk = TY[ty][4]; o.ser = ser; o.lines = []; docs[k] = o; }
            return docs[k];
        }
        function mv(dc, item, lot, exp, st, q, x) {
            var m = { it: item, d: dc.d, dc: dc, tc: dc.tc, tt: dc.tt, ef: dc.ef, ser: dc.ser, st: st, k: cfgOf(lot), lot: lot, exp: exp || '',
                q: q, io: (dc.ef === 1 || dc.ef === 4 || dc.ef === 6) ? 1 : -1, c: 0, sp: null, pp: null, ps: null, pd: '', pq: null, pds: null, xc: null,
                fix: null, isrl: dc.lines.length + 1 };
            for (var f in x) m[f] = x[f];
            dc.lines.push(m); byItem[item].push(m);
            if (!lotInfo[m.k]) lotInfo[m.k] = { lot: lot, exp: exp || '', it: item };
            return m;
        }
        var vat = D.meta.vat;
        D.inv.forEach(function (r) { if (r[14] === 'I') doc('INV', r[0], { d: r[2], doc: r[1], st: WH[r[7]], pk: 'C', pc: r[4], r: r }); });
        D.invL.forEach(function (l) {
            var dc = docs[TY.INV[0] + '/' + l[0]]; if (!dc) return;
            mv(dc, l[1], l[2], l[3], dc.st, l[4], { sp: l[5], gl: l });
        });
        var RET = H.idx(D.ret);
        D.retL.forEach(function (l) {
            var r = RET[l[0]], dc = doc('RET', r[0], { d: r[2], doc: r[1], st: WH[r[6]], pk: 'C', pc: r[3], r: r });
            mv(dc, l[1], l[2], l[3], dc.st, l[4], { sp: null, fix: l[7] / l[4], gl: l });
        });
        var GRN = H.idx(D.grn);
        D.grnL.forEach(function (l) {
            var g = GRN[l[0]], dc = doc('GRN', g[0], { d: g[2], doc: g[1], st: WH[g[5]], pk: 'S', pc: g[4], r: g });
            mv(dc, l[1], l[2], l[3], dc.st, l[4], { pp: l[6], fix: l[7] / l[4], gl: l });
        });
        var TRF = H.idx(D.trf);
        D.trfL.forEach(function (l, i) {
            var t = TRF[l[0]], fs = WH[t[4]], ts = WH[t[5]];
            var o = doc('TRO', t[0], { d: t[2], doc: t[1], st: fs, pk: 'W', pc: ts, r: t });
            /* the receiving line: on the receipt date; still in transit = dated today (stock is already counted at the destination) */
            var n = doc('TRI', t[0], { d: t[3] || TODAY, doc: t[1], st: ts, pk: 'W', pc: fs, r: t, transit: !t[3] });
            var a = mv(o, l[1], l[2], l[3], fs, l[4], {}), b = mv(n, l[1], l[2], l[3], ts, l[4], {});
            a.pair = b; b.pair = a; b.xi = i;
        });
        D.woff.forEach(function (w) {
            var dc = doc('WOF', w[0], { d: w[1], doc: 'WO' + w[1].slice(0, 4) + '-' + ('000' + w[0]).slice(-4), st: null, r: w });
            w[4].forEach(function (l) { mv(dc, l[1], l[3], l[4], WH[l[2]], l[5], {}); });
        });
        /* a receipt the destination sold from before its receipt date is dated on the sending day (no negative lot balance) */
        var outs = {};
        Object.keys(byItem).forEach(function (c) {
            byItem[c].forEach(function (m) { if (m.io < 0 && !m.pair) { var k = c + '|' + m.st + '|' + m.k; (outs[k] = outs[k] || []).push(m.d); } });
        });
        Object.keys(docs).forEach(function (k) {
            var dc = docs[k]; if (dc.ef !== 6) return;
            var sd = dc.r[2];
            if (dc.lines.some(function (m) { return (outs[m.it + '|' + m.st + '|' + m.k] || []).some(function (d) { return d > sd && d <= dc.d; }); })) {
                dc.d = sd; dc.lines.forEach(function (m) { m.d = sd; });
            }
        });
        /* opening = final lot balance in DEMO.stock minus every later movement, per item / warehouse / lot */
        var fin = {}, net = {}, ex = {};
        D.stock.forEach(function (s) { var k = s[0] + '|' + WH[s[1]] + '|' + s[2]; fin[k] = (fin[k] || 0) + s[4]; ex[k] = s[3]; });
        Object.keys(byItem).forEach(function (c) {
            byItem[c].forEach(function (m) { var k = c + '|' + m.st + '|' + m.lot; net[k] = (net[k] || 0) + m.io * m.q; ex[k] = ex[k] || m.exp; });
        });
        var opn = {};
        Object.keys(fin).concat(Object.keys(net)).forEach(function (k) {
            if (opn[k] !== undefined) return;
            opn[k] = (fin[k] || 0) - (net[k] || 0);
        });
        var c0 = {}, V = {}, Q = {};
        D.items.forEach(function (it) { V[it[0]] = it[9]; Q[it[0]] = it[8]; });
        Object.keys(byItem).forEach(function (c) {   /* opening cost = item value before the first movement (recorded costs) / opening quantity */
            var v = V[c], q = Q[c];
            byItem[c].forEach(function (m) {
                var l = m.gl, val = m.ef === 1 ? l[7] : m.ef === 4 ? l[7] : m.ef === 2 ? l[8] : 0;
                if (m.ef === 1 || m.ef === 4) { v -= val; q -= m.q; } else if (m.ef === 2) { v += val; q += m.q; }
            });
            D.woff.forEach(function (w) { w[4].forEach(function (l) { if (l[1] === c) { v += l[6]; q += l[5]; } }); });
            c0[c] = q > 0 ? H.r2(v / q) : H.item[c][6];
        });
        Object.keys(opn).sort().forEach(function (k) {
            var q = opn[k]; if (q <= 0) return;
            var p = k.split('|'), st = +p[1];
            var dc = doc('OPN', st, { d: MIN, doc: 'OPN' + MIN.slice(0, 4) + '-W0' + st, st: st });
            mv(dc, p[0], p[2], ex[k], st, q, { fix: c0[p[0]] });
        });
        /* sort each item: date, rank of the document type, serial, line; then date serials per day over all documents */
        var dl = Object.keys(docs).map(function (k) { return docs[k]; });
        dl.sort(function (a, b) { return a.d < b.d ? -1 : a.d > b.d ? 1 : a.rk - b.rk || a.ser - b.ser; });
        var cur = '', n = 0;
        dl.forEach(function (dc) { if (dc.d !== cur) { cur = dc.d; n = 0; } dc.ds = ++n; });
        Object.keys(byItem).forEach(function (c) {
            byItem[c].sort(function (a, b) { return a.d < b.d ? -1 : a.d > b.d ? 1 : a.dc.ds - b.dc.ds || a.isrl - b.isrl; });
        });
        /* cost the movements per item: issues at the lot average of their warehouse, returns at their recorded cost,
           a few transfers in received at an older cost (XFER), and the item value brought to DEMO.items (AVG lines) */
        var flags = [], stat = { items: 0, worst: 0 };
        Object.keys(byItem).forEach(function (c) {
            var L = byItem[c]; if (!L.length) return;
            var r0 = replay(L, null, 0), dv = r0.val - V[c], dev = null, dd = 0;
            if (Math.abs(dv) >= 0.0005) {
                var cand = L.filter(function (m, i) { return m.ef === 2 && m.d >= WIN && r0.last[m.st + '|' + m.k] === i && r0.st[m.st + '|' + m.k].bal > 0; });
                cand.sort(function (a, b) { return b.q - a.q; });
                var pick = [], sq = 0, i;
                for (i = 0; i < cand.length && i < 25; i++) {
                    pick.push(cand[i]); sq += cand[i].q;
                    if (Math.abs(dv / sq) <= 0.06 * (cand[0].c || 1)) break;
                }
                if (pick.length) { dev = pick; dd = dv / sq; }
                else {   /* no clean candidate: the latest sale whose deviation stays in stock (slope by a trial replay) */
                    var tries = L.filter(function (m) { return m.ef === 2; }).reverse().slice(0, 40);
                    for (i = 0; i < tries.length && !dev; i++) {
                        var c1 = tries[i].c, sl = replay(L, [tries[i]], 1).val - r0.val;
                        if (Math.abs(sl) >= 1 && Math.abs(dv / sl) <= 0.25 * (c1 || 1)) { dev = [tries[i]]; dd = -dv / sl; }
                    }
                    if (!dev) replay(L, null, 0);
                }
            }
            var r1 = dev ? replay(L, dev, dd) : r0;
            stat.items++; stat.worst = Math.max(stat.worst, Math.abs(r1.val - V[c]));
            check(L, flags);
        });
        flags.sort(function (a, b) { return a.m.d < b.m.d ? -1 : a.m.d > b.m.d ? 1 : a.m.dc.ds - b.m.dc.ds || a.m.ser - b.m.ser || a.m.isrl - b.m.isrl; });
        return { byItem: byItem, docs: docs, lots: lotInfo, flags: flags, stat: stat, sup: sup };
    }

    function replay(L, dev, dd) {
        var st = {}, last = {}, val = 0;
        L.forEach(function (m, i) {
            var k = m.st + '|' + m.k, s = st[k] || (st[k] = { bal: 0, val: 0 }), c;
            if (m.ef === 1 || m.ef === 4) c = m.fix;
            else if (m.ef === 6) {
                c = m.pair.c;
                if (m.d >= '2026-02-01' && m.d <= '2026-07-31' && hash(m.ser, m.xi) % 19 === 0) c = c * (1 - (1 + hash(m.xi, m.ser) % 45) / 1000);
            } else {
                c = s.bal > 0.0005 ? s.val / s.bal : 0;
                if (!c) c = H.item[m.it][6];
                if (dev && dev.indexOf(m) >= 0) c += dd;
                last[k] = i;
            }
            c = n10(c);
            m.c = c;
            s.bal += m.io * m.q; s.val += m.io * m.q * c; val += m.io * m.q * c;
        });
        L.forEach(function (m) { if (m.pair) { m.xc = m.pair.c; } });
        return { st: st, last: last, val: val };
    }
    /* the item card's cost check (icCalc, both rules) over the whole history: reference = lot average in the warehouse before the line */
    function check(L, out) {
        var sb = {};
        L.forEach(function (m) {
            var k = m.st + '|' + m.k, s = sb[k] || (sb[k] = { bal: 0, val: 0 }), avg = s.bal > 0.0005 ? s.val / s.bal : 0, c = m.c;
            if (c && avg && m.tt !== 1 && m.tt !== 8 && m.ef !== 6 && Math.abs(c - avg) > 0.0005) out.push({ m: m, rule: 'AVG', ref: avg });
            else if (m.ef === 6 && m.xc !== null && Math.abs(c - m.xc) > 0.0005) out.push({ m: m, rule: 'XFER', ref: m.xc });
            s.bal += m.io * m.q; s.val += m.io * m.q * c;
        });
    }

    /* ---------- render-time block ---------- */
    function defFrom() { var y = +TODAY.slice(0, 4), m = +TODAY.slice(5, 7) - 1; if (!m) { m = 12; y--; } return y + '-' + (m < 10 ? '0' : '') + m + '-01'; }
    H.icToday = TODAY;
    window.DEMO_RENDERERS.itcard = function () {
        return { id: 'ic-meta', data: { admin: 1, today: TODAY, defFrom: defFrom(), dimsV: H.asOf + ' ' + window.DEMO_INDUSTRY, minD: MIN } };
    };

    /* ---------- ITCARD_AJAX ---------- */
    H.itemDims = H.itemDims || function () {
        var b = {}; D.suppliers.forEach(function (s) { b[s[0]] = s[1]; });
        return { brands: b, items: D.items.map(function (it) { return [it[0], it[1], String(it[2] + 1), it[4], it[3], 1, '', [], 0]; }) };
    };
    function dmy(s) { return H.dmy(s); }
    function partyName(pk, pc) {
        if (pk === 'C') return (H.cust[pc] || [])[1] || pc;
        if (pk === 'S') return (H.sup[pc] || [])[1] || pc;
        if (pk === 'W') return WHN[pc] || String(pc);
        return '';
    }
    function card(p) {
        var item = String(p.x02 || '').slice(0, 18);
        if (!/^[0-9A-Za-z]+$/.test(item) || !H.item[item]) return { error: 'item' };
        var e = H.icEngine(), L = e.byItem[item] || [], fl = String(p.x07 === undefined || p.x07 === null ? 'LS' : p.x07).slice(0, 5);
        var avg = fl.indexOf('A') >= 0, to =/^\d{4}-\d\d-\d\d/.test(p.x04 || '') ? p.x04.slice(0, 10) : TODAY; if (to > TODAY) to = TODAY;
        var from = /^\d{4}-\d\d-\d\d/.test(p.x03 || '') ? p.x03.slice(0, 10) : defFrom();
        if (from < MIN) from = MIN; if (from > to) from = to;
        var cfg = p.x05 && /^\d+$/.test(String(p.x05)) ? +p.x05 : null, store = p.x06 && /^\d+$/.test(String(p.x06)) ? +p.x06 : null;
        if (avg) cfg = null;
        var it = H.item[item], out = { item: item, adm: 1, avg: avg ? 1 : 0, from: from, to: to }, i;
        if (fl.indexOf('L') >= 0) {
            var g = {}, ord = [];
            L.forEach(function (m) {
                if (m.d > to) return;
                var o = g[m.k] || (g[m.k] = (ord.push(m.k), { bal: 0, mv: 0 }));
                o.bal += m.io * m.q; if (m.d >= from) o.mv++;
            });
            var lots = ord.filter(function (k) { return g[k].bal !== 0 || g[k].mv > 0; }).map(function (k) {
                var li = e.lots[k]; return [k, li.lot, li.exp ? dmy(li.exp) : '', g[k].bal, g[k].mv, li.exp];
            });
            lots.sort(function (a, b) { return (a[5] || '9999') < (b[5] || '9999') ? -1 : (a[5] || '9999') > (b[5] || '9999') ? 1 : a[1] < b[1] ? -1 : 1; });
            if (cfg === null && !avg && lots.length) cfg = lots[0][0];
            out.lots = lots.map(function (l) { return l.slice(0, 5); });
            out.prices = [[it[3], 1, it[5], 1]];
        }
        out.cfg = cfg; out.store = store;
        if (fl.indexOf('S') >= 0 && (cfg !== null || avg)) {
            var gs = {};
            L.forEach(function (m) {
                if (m.d > to || (cfg !== null && m.k !== cfg)) return;
                var o = gs[m.st] || (gs[m.st] = { bal: 0, mv: 0 });
                o.bal += m.io * m.q; if (m.d >= from) o.mv++;
            });
            out.stores = Object.keys(gs).map(Number).sort(function (a, b) { return a - b; })
                .filter(function (s) { return gs[s].bal !== 0 || gs[s].mv > 0; })
                .map(function (s) { return [s, WHN[s], gs[s].bal, gs[s].mv, shortWh(WHN[s])]; });
            var pp = null;
            L.forEach(function (m) { if (m.tt === 1 && (cfg === null || m.k === cfg) && (!pp || m.d >= pp.d)) pp = m; });
            out.pp = pp ? [dmy(pp.d), pp.dc.doc, pp.pp, it[3], 1, partyName('S', pp.dc.pc), pp.q, pp.c] : null;
        }
        var opens = {}, oq = 0, ov = 0, rows = [], nm = {}, tn = {};
        if (cfg !== null || avg) {
            L.forEach(function (m) {
                if ((cfg !== null && m.k !== cfg) || (store !== null && m.st !== store)) return;
                if (m.d < from) {
                    var k = m.st + (avg ? '|' + m.k : ''), o = opens[k] || (opens[k] = [0, 0]);
                    o[0] += m.io * m.q; o[1] += m.io * m.q * m.c; oq += m.io * m.q; ov += m.io * m.q * m.c;
                    return;
                }
                if (m.d > to) return;
                tn[m.tc] = TN[m.tc]; nm['W' + m.st] = WHN[m.st];
                var pk = m.dc.pk || '', pc = pk ? String(m.dc.pc) : '';
                if (pk) nm[pk + pc] = partyName(pk, m.dc.pc);
                var pr = m.pair, pin = pr && pr.d <= TODAY && !(m.ef === 5 && pr.dc.transit);
                rows.push([dmy(m.d), m.dc.ds, m.tc, m.dc.doc, m.tt, m.ef, pk, pc, m.st, it[3], 1, n10(m.c),
                    m.sp === null ? null : m.sp, m.pp === null ? null : m.pp,
                    m.io > 0 ? m.q : 0, m.io < 0 ? m.q : 0,
                    pr ? pr.st : null, pin ? dmy(pr.d) : '', pin ? pr.q : null, pin ? pr.dc.ds : null, m.ser, m.k, pin ? n10(pr.c) : null]);
            });
            Object.keys(opens).forEach(function (k) { opens[k] = [opens[k][0], n10(opens[k][1])]; });
        }
        out.opens = opens; out.open = [oq, n10(ov)]; out.rows = rows; out.nm = nm; out.tn = tn;
        return out;
    }
    function docOut(p) {
        var tc = +p.x02, ser = +p.x05;
        if (!tc || !ser) return { error: 'doc' };
        var e = H.icEngine(), dc = e.docs[tc + '/' + ser];
        if (!dc) return { error: 'notfound' };
        var r = dc.r, h = { tc: dc.tc, ser: dc.ser, tt: dc.tt, ef: dc.ef, tn: dc.tn, doc: dc.doc, inv: '', dt: dmy(dc.d), ds: dc.ds,
            sn: dc.st ? WHN[dc.st] : 'All warehouses', party: '', sm: '', xf: '', xt: '', post: 1, disc: 0, pay: 0, dsc: '', adm: 1 };
        if (dc.tt === 2) { h.party = partyName('C', r[4]); h.sm = (H.rep[r[5]] || [])[1] || ''; h.disc = r[9]; h.pay = r[11]; }
        else if (dc.tt === 4) { h.party = partyName('C', r[3]); h.sm = (H.rep[r[4]] || [])[1] || ''; h.pay = r[10]; h.inv = (H.inv[r[7]] || [])[1] || ''; h.dsc = 'Return of invoice ' + h.inv; }
        else if (dc.tt === 1) { h.party = partyName('S', r[4]); h.pay = r[10]; h.dsc = r[6] ? 'Against ' + r[6] : 'Opening balance'; }
        else if (dc.tt === 9) { h.xf = WHN[WH[r[4]]]; h.xt = WHN[WH[r[5]]]; h.dsc = dc.transit ? 'In transit' : ''; }
        else if (dc.tt === 7) { h.dsc = 'Expired stock write-off ' + dc.d.slice(5, 7) + '/' + dc.d.slice(0, 4); }
        else if (dc.tt === 8) { h.dsc = 'Opening balance ' + dc.d.slice(0, 4); }
        var vat = D.meta.vat, lines = dc.lines.map(function (m) {
            var it = H.item[m.it], l = m.gl, price = null, disc = 0, tax = 0;
            if (dc.tt === 2) { price = l[5]; disc = l[7]; tax = H.r2((l[6] - l[7]) * vat); }
            else if (dc.tt === 4) { price = l[5]; disc = H.r2(Math.max(0, l[4] * l[5] - l[6])); tax = H.r2(l[6] * vat); }
            else if (dc.tt === 1) { price = l[6]; tax = (H.sup[r[4]] || [])[2] === 'USD' ? 0 : H.r2(l[7] * vat); }
            return [m.isrl, m.it, it[1], m.k, m.lot, m.exp ? dmy(m.exp) : '', it[3], m.q, m.q, 0, price, disc, tax, n10(m.c), m.st];
        });
        return { h: h, lines: lines };
    }
    S.ITCARD_AJAX = function (p) {
        var a = p.x01;
        if (a === 'dims') return H.itemDims();
        if (a === 'card') return card(p);
        if (a === 'doc') return docOut(p);
        return { error: 'unknown' };
    };
})();
