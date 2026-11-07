(function () {
    var D = window.DEMO, S = window.DEMO_SRV, H = window.DEMO_H;
    var T_PO = 501, T_RCV = 301, USD = D.meta.usd || 3.75;
    H.T_PO = T_PO; H.T_RCV = T_RCV;     // document types: purchase order (serial = po id), receipt / supplier invoice (serial = grn id)
    var BRC = { '1': 'CEN', '2': 'NTH', '3': 'WST' }, BRN = { '1': 'Central', '2': 'North', '3': 'West' };
    H.brCode = function (b) { return BRC[b] || 'OTH'; };
    function iso(dmy) { return dmy.slice(6, 10) + '-' + dmy.slice(3, 5) + '-' + dmy.slice(0, 2); }
    H.todayIso = iso(H.today);
    H.addDays = function (s, n) {
        var d = new Date(Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10) + n));
        return d.toISOString().slice(0, 10);
    };
    var WH = H.idx(D.warehouses);

    // purchase indexes + supplier sub-ledger (AP 210101) with payments allocated oldest due first, as the books did
    H.pur = function () {
        if (H._pur) return H._pur;
        var P = { po: H.idx(D.po), poByNo: {}, poL: {}, grn: H.idx(D.grn), grnByPo: {}, grnL: {}, paid: {}, last: {}, ledger: {}, lastPay: {} };
        D.po.forEach(function (p) { P.poByNo[p[1]] = p; });
        D.poL.forEach(function (l) { (P.poL[l[0]] = P.poL[l[0]] || []).push(l); });
        D.grnL.forEach(function (l) { (P.grnL[l[0]] = P.grnL[l[0]] || []).push(l); });
        var bySup = {};
        D.grn.forEach(function (g) {
            if (g[6]) (P.grnByPo[g[6]] = P.grnByPo[g[6]] || []).push(g);
            (bySup[g[4]] = bySup[g[4]] || []).push({ g: g, rem: g[10] });
        });
        D.spay.slice().sort(function (a, b) { return a[2] < b[2] ? -1 : a[2] > b[2] ? 1 : a[0] - b[0]; }).forEach(function (p) {
            var lim = H.addDays(p[2], 5), amt = p[7];
            P.lastPay[p[3]] = p[2];
            (bySup[p[3]] || []).forEach(function (o) {
                if (amt <= 0.004 || o.rem <= 0.004 || o.g[2] >= p[2] || o.g[3] > lim) return;
                var a = Math.min(o.rem, amt);
                o.rem = H.r2(o.rem - a); amt = H.r2(amt - a);
                P.paid[o.g[0]] = H.r2((P.paid[o.g[0]] || 0) + a); P.last[o.g[0]] = p[2];
            });
        });
        var acc = {};
        D.glL.forEach(function (l) { if (l[1] === '210101' && l[6]) acc[l[6]] = (acc[l[6]] || 0) + l[3] - l[2]; });
        Object.keys(acc).forEach(function (k) { P.ledger[k] = H.r2(acc[k]); });
        return (H._pur = P);
    };
    H.poCur = function (p) { return p[7] === 'USD' ? [2, USD] : [1, 1]; };
    H.poShip = function (p) {
        var s = H.addDays(p[3], p[7] === 'USD' ? -21 : -3);
        return s < p[2] ? p[2] : s;
    };
    // shipment at customs: an import order whose arrival date passed in the last 30 days and is not received yet
    H.poAtt = function (p) { return p[7] === 'USD' && p[3] < H.todayIso && p[3] >= H.addDays(H.todayIso, -30) ? 1 : 0; };
    H.poOpen = function (p) {
        if (p[8] === 'C') return [];
        return (H.pur().poL[p[0]] || []).filter(function (l) { return l[2] - l[4] > 0; });
    };
    function vatOf(p) { return p[7] === 'USD' ? 0 : D.meta.vat; }

    /* ---------- POARR_AJAX ---------- */
    S.POARR_AJAX = function (p) {
        if (p.x03) {
            var st = {};
            D.stock.forEach(function (s) { if (s[0] === p.x03) st[s[1]] = (st[s[1]] || 0) + s[4]; });
            return { ok: 1, stores: Object.keys(st).sort().map(function (w) { return [1, WH[w][1], st[w], H.brCode(WH[w][2])]; }) };
        }
        var from = p.x01 || H.todayIso.slice(0, 4) + '-01-01', to = p.x02 || H.todayIso, br = p.x04 || '', it = {};
        if (from < D.meta.start) from = D.meta.start;
        function row(code) {
            var o = it[code];
            if (!o) { var m = H.item[code]; o = it[code] = { m: m, s: [0, 0, 0, 0], stk: 0, req: 0, cus: 0, oth: 0 }; }
            return o;
        }
        H.facts().forEach(function (f) {
            if (f[11] < from || f[11] > to || (br && H.brCode(f[10]) !== br)) return;
            var o = row(f[5]); o.s[0] += f[7];
            if (f[1] >= '1' && f[1] <= '3') o.s[+f[1]] += f[7];
        });
        D.stock.forEach(function (s) { if (!br || H.brCode(WH[s[1]][2]) === br) row(s[0]).stk += s[4]; });
        var arr = {}, arb = [], brc = { x: 0, CEN: 0, WST: 0, EST: 0, NTH: 0, OTH: 0 }, seen = {};
        D.po.forEach(function (po) {
            var ls = H.poOpen(po); if (!ls.length) return;
            var b = H.brCode(po[6]), att = H.poAtt(po), mo = po[3].slice(0, 7);
            ls.forEach(function (l) {
                var q = l[2] - l[4], o = row(l[1]);
                if (!seen[b + l[1]]) { seen[b + l[1]] = 1; brc[b]++; }
                if (!seen['x' + l[1]]) { seen['x' + l[1]] = 1; brc.x++; }
                if (br) { arb.push([l[1], b, mo, q]); if (b !== br) { o.oth += q; return; } }
                else { var k = l[1] + '|' + mo; arr[k] = (arr[k] || 0) + q; }
                if (att) o.cus += q; else o.req += q;
            });
        });
        var rows = Object.keys(it).sort().map(function (c) {
            var o = it[c], m = o.m;
            return [c, m[1], m[3], 1, String(m[2] + 1), H.className(m[2]), o.s[0], o.s[1], o.s[2], o.s[3], o.stk, o.stk, 0, 0, 0, 0, o.req, o.cus, o.oth];
        }).filter(function (r) { return r[6] || r[10] || r[16] || r[17] || r[18]; });
        rows.sort(function (a, b) { return +a[4] - +b[4] || (a[0] < b[0] ? -1 : 1); });
        var out = { ok: 1, from: from, to: to, asof: H.asOf, lim: 0, brs: '', br: br, mine: 1, brc: brc, rows: rows };
        if (br) out.arb = arb;
        else out.arr = Object.keys(arr).map(function (k) { var s = k.split('|'); return [s[0], s[1], arr[k]]; });
        return out;
    };

    /* ---------- POARR_PO_AJAX (application process: POARR, SUPAY) ---------- */
    function poHead(po, ls) {
        var s = H.sup[po[4]], c = H.poCur(po), att = H.poAtt(po), q = 0;
        ls.forEach(function (l) { q += l[2] - l[4]; });
        return [T_PO, po[0], po[1], po[2], s[1], WH[po[5]][1], BRN[po[6]] || '', H.poShip(po), po[3], att ? po[3] : null, att, 0,
            c[0], c[1], '', ls.length, q];
    }
    S.POARR_PO_AJAX = function (p) {
        var P = H.pur();
        if (p.x01 === 'orders') {
            var m = H.item[p.x02]; if (!m) return { error: 'item not found' };
            var orders = [];
            D.po.forEach(function (po) {
                var ls = H.poOpen(po), mine = 0, v = 0;
                ls.forEach(function (l) { if (l[1] === m[0]) mine += l[2] - l[4]; v += (l[2] - l[4]) * l[3]; });
                if (!mine) return;
                var h = poHead(po, ls);
                orders.push(h.slice(0, 12).concat([mine, m[3], h[15], h[16], H.r2(v), 0]));
            });
            orders.sort(function (a, b) { return a[8] < b[8] ? -1 : a[8] > b[8] ? 1 : 0; });
            return { ok: 1, cost: 1, asof: H.asOf, item: [m[0], m[1], m[3]], orders: orders };
        }
        if (p.x01 === 'po') {
            var po = +p.x02 === T_PO ? P.po[+p.x03] : null, ls = po ? H.poOpen(po) : [];
            if (!ls.length) return { error: 'order not found or already closed' };
            var vat = vatOf(po), g = 0, tx = 0, lines = ls.map(function (l, i) {
                var it = H.item[l[1]], q = l[2] - l[4], v = H.r2(q * l[3]), t = H.r2(v * vat);
                g += v; tx += t;
                return [i + 1, l[1], it[1], it[3], q, l[3], 0, 0, t, H.r2(v + t)];
            });
            return { ok: 1, cost: 1, asof: H.asOf, h: poHead(po, ls).concat([H.r2(g), 0, H.r2(tx), 0, 0]), lines: lines, exp: [] };
        }
        return { error: 'unknown command' };
    };

    /* ---------- SUPAY_INV_AJAX (application process: SUPAY, SUPST) - x02 = T_RCV + grn id (one supplier invoice) or T_PO + po id ---------- */
    H.supInvNo = function (g) { return g[13] === 'O' ? '' : 'SI-' + g[2].slice(2, 4) + String(10000 + (g[0] * 7919) % 89999); };
    S.SUPAY_INV_AJAX = function (p) {
        if (p.x01 !== 'po') return { error: 'unknown command' };
        var P = H.pur(), t = +p.x02, ser = +p.x03, po = null, grns = [];
        if (t === T_RCV) { var g0 = P.grn[ser]; if (!g0) return { error: 'invoice not found' }; grns = [g0]; po = g0[6] ? P.poByNo[g0[6]] : null; }
        else if (t === T_PO) { po = P.po[ser]; if (!po) return { error: 'order not found' }; grns = P.grnByPo[po[1]] || []; }
        else return { error: 'document not found' };
        var first = grns[0], sp = H.sup[(po || first)[4]], c = po ? H.poCur(po) : (first[7] === 'USD' ? [2, USD] : [1, 1]);
        if (p.x04 && String(p.x04) !== String(sp[0])) return { error: 'document not found' };
        var lines = [], h;
        if (grns.length) {
            var amt = 0, paid = 0, last = null;
            grns.forEach(function (g) {
                amt += g[10]; paid += P.paid[g[0]] || 0;
                if (P.last[g[0]] && (!last || P.last[g[0]] > last)) last = P.last[g[0]];
                var vat = g[11] && g[10] - g[11] ? g[11] / (g[10] - g[11]) : 0;
                (P.grnL[g[0]] || []).forEach(function (l) {
                    var it = H.item[l[1]];
                    lines.push([lines.length + 1, l[1], it[1], it[3], l[4], l[6], 0, H.r2(l[7] * vat), l[7], 0, T_RCV, g[0], it[5]]);
                });
            });
            amt = H.r2(amt); paid = H.r2(paid);
            var due = first[3], bal = H.r2(amt - paid);
            h = [po ? T_PO : T_RCV, po ? po[0] : first[0], po ? po[1] : first[1], H.supInvNo(first), po ? po[2] : first[2], sp[1], sp[0], po && po[8] === 'C' ? 1 : 0, 0,
                po ? H.poShip(po) : first[2], first[2], sp[3], due.slice(0, 7), amt, 0, 0, 0, amt, 0, last, paid, bal, bal,
                grns.length, grns.length, first[1], first[2], c[0], c[1], lines.length, 'M', 'I', T_RCV, first[0], H.supInvNo(first),
                first[12] ? first[12].join('/') : null];
        } else {
            var vt = vatOf(po), gs = 0;
            H.poOpen(po).forEach(function (l) {
                var it = H.item[l[1]], q = l[2] - l[4], pr = H.r2(l[3] * c[1]), v = H.r2(q * pr), tx = H.r2(v * vt);
                gs += v + tx;
                lines.push([lines.length + 1, l[1], it[1], it[3], q, pr, 0, tx, H.r2(v + tx), 0, null, null, null]);
            });
            gs = H.r2(gs);
            var ship = H.poShip(po);
            h = [T_PO, po[0], po[1], '', po[2], sp[1], sp[0], 0, 0, ship, po[3], sp[3], H.addDays(ship, sp[3]).slice(0, 7), gs, 0, 0, 0, gs, 0, null, 0, gs, gs,
                0, 0, '', null, c[0], c[1], lines.length, 'M', 'O', null, null, '', null];
        }
        return { ok: 1, asof: H.asOf, src: grns.length ? 'rcv' : 'ord', h: h, lines: lines, exp: [] };
    };
})();
