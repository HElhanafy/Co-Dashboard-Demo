/* srv_shared.js - shared application processes: SALES_DOC_AJAX, GL_ENTRY_AJAX (24/10/2026) */
(function () {
    var D = window.DEMO, S = window.DEMO_SRV, H = window.DEMO_H;
    var T_INV = 1180101, T_RET = 1180201;
    H.T_INV = T_INV; H.T_RET = T_RET;

    function now() { return H.asOf; }
    function lines(of, list) {
        if (!H['_' + of]) { var o = {}; list.forEach(function (l) { (o[l[0]] = o[l[0]] || []).push(l); }); H['_' + of] = o; }
        return H['_' + of];
    }
    function glKey(e) { return e ? e[0] + ' / ' + e[1] + ' / ' + e[2] : null; }
    var RET = H.idx(D.ret);

    function invDoc(id) {
        var r = H.inv[id]; if (!r || r[14] !== 'I') return null;
        var c = H.cust[r[4]], rp = H.rep[r[5]], by = {}, out = [], base = r[8] - (r[9] - (r[15] || 0));
        (lines('invL', D.invL)[id] || []).forEach(function (l) {
            var o = by[l[1]] || (by[l[1]] = { qty: 0, price: l[5], gross: 0, disc: 0, cost: 0 });
            o.qty += l[4]; o.gross += l[6]; o.disc += l[7]; o.cost += l[8];
        });
        Object.keys(by).forEach(function (k, i) {
            var o = by[k], it = H.item[k], net = o.gross - o.disc, share = base ? net / base : 0;
            out.push([i + 1, k, it[1], null, it[3], o.qty, 0, o.price, H.r2(o.disc / o.qty * 10000) / 10000,
                H.r2((net - (r[15] || 0) * share) * D.meta.vat), H.r2(o.cost)]);
        });
        return { ok: 1, cost: 1, now: now(), h: { t: T_INV, s: r[0], doc: r[1], d: r[2], ret: 0, cash: 0, terms: c[5], tn: c[5] + ' days',
            cu: c[0], cn: c[1], sm: rp[0], sn: rp[1], gl: glKey(r[13]), ot: null, os: null, odoc: null,
            desc: 'Sales invoice ' + r[1], hdr: r[15] || 0, tr: 0 }, lines: out };
    }

    function retDoc(id) {
        var r = RET[id]; if (!r) return null;
        var c = H.cust[r[3]], rp = H.rep[r[4]], o = H.inv[r[7]], out = [];
        (lines('retL', D.retL)[id] || []).forEach(function (l, i) {
            var it = H.item[l[1]];
            out.push([i + 1, l[1], it[1], null, it[3], l[4], 0, H.r2(l[6] / l[4] * 10000) / 10000, 0, H.r2(l[6] * D.meta.vat), H.r2(l[7])]);
        });
        return { ok: 1, cost: 1, now: now(), h: { t: T_RET, s: r[0], doc: r[1], d: r[2], ret: 1, cash: 0, terms: null, tn: '',
            cu: c[0], cn: c[1], sm: rp[0], sn: rp[1], gl: glKey(r[12]), ot: o ? T_INV : null, os: o ? o[0] : null,
            odoc: o ? o[1] : null, desc: 'Sales return ' + r[1], hdr: 0, tr: 0 }, lines: out };
    }

    S.SALES_DOC_AJAX = function (p) {
        var cmd = p.x01;
        if (cmd === 'inv') {
            var t = +p.x02, s = +p.x03, d = t === T_RET ? retDoc(s) : invDoc(s);
            return d || { error: 'document not found' };
        }
        if (cmd === 'docs') {
            var from = p.x02 || '0000-00', to = p.x03 || '9999-99', sm = p.x04 || '', cu = p.x05 || '';
            if (!sm && !cu && !p.x06) return { error: 'scope' };
            var docs = [], invL = lines('invL', D.invL), retL = lines('retL', D.retL);
            D.inv.forEach(function (r) {
                var m = r[2].slice(0, 7);
                if (r[14] !== 'I' || m < from || m > to || (sm && r[5] !== sm) || (cu && r[4] !== cu)) return;
                var rp = H.rep[r[5]], c = H.cust[r[4]], ld = 0, n = {};
                (invL[r[0]] || []).forEach(function (l) { ld += l[7]; n[l[1]] = 1; });
                docs.push([T_INV, r[0], r[1], r[2], 0, 0, rp[0], rp[1], c[0], c[1], Object.keys(n).length,
                    H.r2(r[8]), H.r2(ld), H.r2(r[15] || 0), H.r2(r[12]), null, null, null, null]);
            });
            D.ret.forEach(function (r) {
                var m = r[2].slice(0, 7);
                if (m < from || m > to || (sm && r[4] !== sm) || (cu && r[3] !== cu)) return;
                var rp = H.rep[r[4]], c = H.cust[r[3]], ls = retL[r[0]] || [];
                docs.push([T_RET, r[0], r[1], r[2], 0, 1, rp[0], rp[1], c[0], c[1], ls.length,
                    H.r2(r[8]), 0, 0, H.r2(r[11]), null, null, null, null]);
            });
            docs.sort(function (a, b) { return a[3] < b[3] ? 1 : a[3] > b[3] ? -1 : 0; });
            var sc = { from: from, to: to, sm: sm, sn: sm && H.rep[sm] ? H.rep[sm][1] : '', cu: cu, cn: cu && H.cust[cu] ? H.cust[cu][1] : '' };
            return { ok: 1, cost: 1, now: now(), scope: sc, docs: docs.slice(0, 1500), more: docs.length > 1500 ? 1 : 0 };
        }
        return { error: 'unknown command' };
    };

    // GL entries by year/type/no
    H.glIndex = function () {
        if (H._gli) return H._gli;
        var o = {}, ln = lines('glL', D.glL);
        D.gl.forEach(function (e) { o[e[1] + '/' + e[2] + '/' + e[3]] = { e: e, l: ln[e[0]] || [] }; });
        return (H._gli = o);
    };
    H.acct = H.idx(D.accounts);
    H.branch = H.idx(D.branches);
    S.GL_ENTRY_AJAX = function (p) {
        var g = H.glIndex()[(+p.x02) + '/' + (+p.x03) + '/' + (+p.x04)];
        if (!g) return { error: 'entry not found' };
        var e = g.e, out = g.l.map(function (l, i) {
            var cc1 = l[4] || null, cc2 = l[5] || null, sub = l[6];
            var nm = (H.acct[l[1]] || [])[1] || l[1];
            if (sub) nm += ' - ' + ((H.cust[sub] || H.sup[sub] || [])[1] || sub);
            return [i + 1, l[1], nm, e[5], H.r2(l[2] - l[3]), cc1, cc2, e[4],
                cc1 && H.branch[cc1] ? H.branch[cc1][1] : '', cc2 && H.rep[cc2] ? H.rep[cc2][1] : ''];
        });
        return { ok: 1, y: e[1], t: e[2], n: e[3], dt: e[4], ds: e[5], lines: out };
    };
})();
