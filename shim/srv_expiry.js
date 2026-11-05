/* srv_expiry.js - EXPIRY page: ex-* payload and EXPIRY_AJAX bal/who; medical only, trading gets an empty working page (24/10/2026) */
(function () {
    var D = window.DEMO, S = window.DEMO_SRV, H = window.DEMO_H, MED = window.DEMO_INDUSTRY !== 'trading';

    // branch '1'..'3' -> 12-digit parent code; region = first 3 digits (101..103)
    function pc(b) { return '70' + b + '070070000'; }
    var WH = {}; D.warehouses.forEach(function (w) { WH[w[0]] = w; });
    function iso(dmy) { return dmy.slice(6, 10) + '-' + dmy.slice(3, 5) + '-' + dmy.slice(0, 2); }
    var TODAY = iso(H.today);

    function stores() {
        return D.warehouses.map(function (w) {
            var br = D.branches.filter(function (b) { return b[0] === w[2]; })[0];
            return { c: w[0], n: w[1], na: w[1], ns: w[1].replace(/^(Central|North|West)\s+/, ''), t: 1, tl: 'Main',
                p: pc(w[2]), pn: br[1], pe: br[1] };
        });
    }
    function classes() {
        var k = {}; D.items.forEach(function (i) { k[i[2]] = (k[i[2]] || 0) + 1; });
        return D.classes.map(function (n, i) { return { c: String(i + 1), n: n, k: k[i] || 0 }; });
    }
    function items() {
        return D.items.slice().sort(function (a, b) {
            return a[2] - b[2] || (a[4] < b[4] ? -1 : a[4] > b[4] ? 1 : 0) || (a[0] < b[0] ? -1 : 1);
        }).map(function (i) {
            return { c: i[0], g: '1', n: i[1], cl: String(i[2] + 1), br: i[4], bn: 'Brand ' + i[4].slice(-2), u: i[3], f: 1,
                bu: i[3], us: [], nf: 0 };
        });
    }

    window.DEMO_RENDERERS.expiry = function () {
        var br = {};
        D.branches.forEach(function (b) { br[pc(b[0])] = b[1].replace(/\s+Branch$/, ''); });
        return [{ id: 'ex-meta', data: { admin: 1, asOf: H.asOf, today: TODAY, minD: D.meta.start } },
            { id: 'ex-i18n', data: { br: br } },
            { id: 'ex-stores', data: stores() },
            { id: 'ex-classes', data: classes() },
            { id: 'ex-items', data: items() }];
    };

    function addM(s, n) {
        var y = +s.slice(0, 4), m = +s.slice(5, 7) - 1 + n;
        y += Math.floor(m / 12); m = ((m % 12) + 12) % 12;
        return y + '-' + (m < 9 ? '0' : '') + (m + 1) + '-01';
    }
    // sale lines (invoices only): [date, item, wh, qty]
    function sales() {
        if (S._exSales) return S._exSales;
        var hd = {}, out = [];
        D.inv.forEach(function (r) { if (r[14] === 'I') hd[r[0]] = r; });
        D.invL.forEach(function (l) { var r = hd[l[0]]; if (r) out.push([r[2], l[1], r[7], l[4]]); });
        return (S._exSales = out);
    }

    S.EXPIRY_AJAX = function (p) {
        var d = /^\d{4}-\d{2}-\d{2}$/.test(p.x02 || '') ? p.x02 : TODAY, b = d < TODAY ? d : TODAY;
        if (p.x01 === 'who') {
            var c = String(p.x03 || ''), last = {};
            if (MED) sales().forEach(function (s) {
                if (s[1] === c && s[0] <= b && (!last[s[2]] || s[0] > last[s[2]])) last[s[2]] = s[0];
            });
            return { c: c, rows: Object.keys(last).sort().map(function (w) { return [w, last[w]]; }) };
        }
        if (p.x01 !== 'bal') return { err: 'unknown' };
        var w0 = addM(b, -6), m0 = b.slice(0, 8) + '01', rows = [], inStock = {}, agg = {};
        if (MED) {
            // lot balances: the demo keeps one stock snapshot (today); past dates show it unchanged
            D.stock.forEach(function (s) {
                if (!s[4] || !s[3]) return;
                rows.push([s[0], s[1], s[3], s[2], s[4]]); inStock[s[0]] = 1;
            });
            rows.sort(function (x, y) { return x[0] < y[0] ? -1 : x[0] > y[0] ? 1 : x[1] < y[1] ? -1 : x[1] > y[1] ? 1 : x[2] < y[2] ? -1 : 1; });
            sales().forEach(function (s) {
                if (!inStock[s[1]] || s[0] < w0 || s[0] >= m0) return;
                var k = s[1] + '|' + pc(WH[s[2]][2]).slice(0, 3);
                agg[k] = (agg[k] || 0) + s[3];
            });
        }
        var sl = Object.keys(agg).sort().filter(function (k) { return agg[k] > 0; }).map(function (k) {
            var a = k.split('|'); return [a[0], a[1], Math.round(agg[k] / 6 * 1000) / 1000];
        });
        // live EXPIRY.JS reads the FEFO rate as SALES['scope|item'] but stores 'item|region' (drill) -
        // the extra [region,item,q] and ['C',item,q] rows feed the FEFO/table keys too
        var co = {};
        sl.slice().forEach(function (r) { sl.push([r[1], r[0], r[2]]); co[r[0]] = (co[r[0]] || 0) + r[2]; });
        Object.keys(co).forEach(function (c) { sl.push(['C', c, Math.round(co[c] * 1000) / 1000]); });
        return { d: d, b: b, w: w0, rows: rows, sales: sl, n: rows.length };
    };
})();
