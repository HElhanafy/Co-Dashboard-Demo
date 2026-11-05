/* srv_stock.js - STOCK page: sk-* blocks, STOCK_AJAX / STOCK_AJAX_LOTS; shared stock-at-date helpers (H.sk) for STVAL (24/10/2026) */
(function () {
    var D = window.DEMO, S = window.DEMO_SRV, H = window.DEMO_H, SK = H.sk = {};
    var INV_ACCT = '110501';
    var BRN = { '1': 'Central', '2': 'North', '3': 'West' };
    var WH = { W01: { t: 1, ns: 'Main Store' }, W02: { t: 3, ns: 'Showroom' }, W03: { t: 1, ns: 'North Store' }, W04: { t: 1, ns: 'West Store' } };
    var TL = { 1: 'Main Warehouses', 3: 'Showrooms' };

    SK.iso = function () { return H.today.slice(6, 10) + '-' + H.today.slice(3, 5) + '-' + H.today.slice(0, 2); };
    SK.date = function (x) {
        var t = SK.iso(), d = /^\d{4}-\d{2}-\d{2}/.test(String(x || '')) ? String(x).slice(0, 10) : t;
        return d > t ? t : d;
    };
    SK.meta = function () { return { admin: 1, asOf: H.asOf, today: SK.iso(), minD: D.meta.start }; };
    SK.i18n = function () { return { br: BRN }; };
    SK.stores = function (acct) {
        return D.warehouses.map(function (w) {
            var x = WH[w[0]] || { t: 1, ns: w[1] }, b = H.idx(D.branches)[w[2]], o = { c: w[0], n: w[1], na: w[1], ns: x.ns,
                t: x.t, tl: TL[x.t], p: w[2], pn: b ? b[1] : w[2], pe: b ? b[1] : w[2] };
            if (acct) o.a = INV_ACCT;
            return o;
        });
    };
    SK.classes = function () {
        var k = {};
        D.items.forEach(function (it) { k[it[2]] = (k[it[2]] || 0) + 1; });
        return D.classes.map(function (n, i) { return { c: String(i + 1), n: n, k: k[i] || 0 }; });
    };
    SK.items = function (sp) {
        return D.items.slice().sort(function (a, b) {
            return a[2] - b[2] || (a[4] < b[4] ? -1 : a[4] > b[4] ? 1 : 0) || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);
        }).map(function (it) {
            var o = { c: it[0], g: '1', n: it[1], cl: String(it[2] + 1), br: it[4], bn: (H.sup[it[4]] || [])[1] || it[4],
                u: it[3], f: 1, bu: it[3], us: [], nf: 0 };
            if (sp) o.sp = it[5];
            return o;
        });
    };
    SK.blocks = function (stval) {
        var i18n = SK.i18n();
        if (stval) i18n.ac = { '110501': 'Inventory - Goods' };
        return [{ id: 'sk-meta', data: SK.meta() }, { id: 'sk-i18n', data: i18n }, { id: 'sk-stores', data: SK.stores(stval) },
            { id: 'sk-classes', data: SK.classes() }, { id: 'sk-items', data: SK.items(stval) }];
    };

    // stock movements after a date, newest first: [iso, item, wh, lot, exp, qtyIn, valueIn]
    SK.events = function () {
        if (SK._ev) return SK._ev;
        var ev = [], g = H.idx(D.grn), v = H.idx(D.inv), r = H.idx(D.ret), t = H.idx(D.trf);
        D.grnL.forEach(function (l) { var h = g[l[0]]; ev.push([h[2], l[1], h[5], l[2], l[3], l[4], l[7]]); });
        D.invL.forEach(function (l) { var h = v[l[0]]; ev.push([h[2], l[1], h[7], l[2], l[3], -l[4], -l[8]]); });
        D.retL.forEach(function (l) { var h = r[l[0]]; ev.push([h[2], l[1], h[6], l[2], l[3], l[4], l[7]]); });
        D.trfL.forEach(function (l) {
            var h = t[l[0]];
            ev.push([h[2], l[1], h[4], l[2], l[3], -l[4], 0]);
            ev.push([h[2], l[1], h[5], l[2], l[3], l[4], 0]);
        });
        D.woff.forEach(function (w) { w[4].forEach(function (l) { ev.push([w[1], l[1], l[2], l[3], l[4], -l[5], -l[6]]); }); });
        ev.sort(function (a, b) { return a[0] < b[0] ? 1 : a[0] > b[0] ? -1 : 0; });
        return (SK._ev = ev);
    };

    // lots at the end of day d: {key: [item, wh, exp, lot, qty]} + item values {item: value}
    SK.at = function (d) {
        SK._at = SK._at || {};
        if (SK._at[d]) return SK._at[d];
        var L = {}, V = {};
        D.stock.forEach(function (s) { L[s[0] + '|' + s[1] + '|' + s[2]] = [s[0], s[1], s[3] || '', s[2], s[4]]; });
        D.items.forEach(function (it) { V[it[0]] = it[9]; });
        SK.events().some(function (e) {
            if (e[0] <= d) return true;
            var k = e[1] + '|' + e[2] + '|' + e[3], o = L[k] || (L[k] = [e[1], e[2], e[4] || '', e[3], 0]);
            o[4] -= e[5]; V[e[1]] = (V[e[1]] || 0) - e[6];
            return false;
        });
        Object.keys(L).forEach(function (k) { L[k][4] = Math.round(L[k][4] * 1000) / 1000; if (!L[k][4]) delete L[k]; });
        return (SK._at[d] = { lots: L, val: V });
    };

    // inventory ledger balance till d inclusive: [balance, lines]
    SK.gl = function (d) {
        var dt = {}, b = 0, n = 0;
        D.gl.forEach(function (e) { dt[e[0]] = e[4]; });
        D.glL.forEach(function (l) { if (l[1] === INV_ACCT && dt[l[0]] <= d) { b += l[2] - l[3]; n++; } });
        return [H.r2(b), n];
    };

    S.STOCK_AJAX = function (p) {
        if (p.x01 !== 'bal') return { err: 'unknown' };
        var d = SK.date(p.x02), L = SK.at(d).lots, agg = {}, rows = [];
        Object.keys(L).forEach(function (k) { var o = L[k], a = o[0] + '|' + o[1]; agg[a] = (agg[a] || 0) + o[4]; });
        Object.keys(agg).sort().forEach(function (a) {
            var q = Math.round(agg[a] * 1000) / 1000, s = a.split('|');
            if (q) rows.push([s[0], s[1], q]);
        });
        return { d: d, rows: rows, n: rows.length };
    };
    S.STOCK_AJAX_LOTS = function (p) {
        if (p.x01 !== 'bal') return { err: 'unknown' };
        var d = SK.date(p.x02), L = SK.at(d).lots, rows = Object.keys(L).map(function (k) { return L[k].slice(); });
        rows.sort(function (a, b) { return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : a[2] < b[2] ? -1 : a[2] > b[2] ? 1 : 0; });
        return { d: d, rows: rows, n: rows.length };
    };

    window.DEMO_RENDERERS.stock = function () { return SK.blocks(false); };
})();
