/* srv_stval.js - STVAL page: sk-* blocks (+ accounts, sale price), STVAL_AJAX bal/gl; uses H.sk from srv_stock.js (24/10/2026) */
(function () {
    var D = window.DEMO, S = window.DEMO_SRV, H = window.DEMO_H;

    function monthStart(d, back) {
        var y = +d.slice(0, 4), m = +d.slice(5, 7) - back;
        if (m < 1) { m += 12; y--; }
        return y + '-' + (m < 10 ? '0' : '') + m + '-01';
    }

    // lot rows with value: item value at d (moving average) spread over its lots by quantity; the ledger and the module agree
    function balRows(d) {
        var SK = H.sk, at = SK.at(d), by = {}, rows = [], tot = 0, big = null;
        Object.keys(at.lots).forEach(function (k) { var o = at.lots[k]; (by[o[0]] = by[o[0]] || []).push(o); });
        D.items.forEach(function (it) {
            var c = it[0], v = H.r2(at.val[c] || 0), ls = by[c] || [], q = 0, left = v;
            ls.forEach(function (o) { q += o[4]; });
            if (!ls.length || !q) {
                if (Math.abs(v) > 0.005) { rows.push([c, 'W01', '', '', 0, v]); tot += v; }
                return;
            }
            ls.sort(function (a, b) { return a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : a[2] < b[2] ? -1 : a[2] > b[2] ? 1 : 0; });
            ls.forEach(function (o, i) {
                var x = i === ls.length - 1 ? H.r2(left) : H.r2(v * o[4] / q), r = [o[0], o[1], o[2], o[3], o[4], x];
                left -= x; tot += x; rows.push(r);
                if (!big || x > big[5]) big = r;
            });
        });
        // cent rounding between line costs and entry totals sits on the largest lot
        var diff = H.r2(SK.gl(d)[0] - tot);
        if (big && diff && Math.abs(diff) < 50) big[5] = H.r2(big[5] + diff);
        return rows;
    }

    S.STVAL_AJAX = function (p) {
        var d = H.sk.date(p.x02);
        if (p.x01 === 'bal') {
            var rows = balRows(d);
            return { d: d, snap: monthStart(d, 1), rows: rows, n: rows.length, lim: 0 };
        }
        if (p.x01 === 'gl') {
            var g = H.sk.gl(d);
            return { d: d, rows: [['110501', g[0], g[1]]], n: 1, asof: H.asOf, live: monthStart(H.sk.iso(), 0) };
        }
        return { err: 'unknown' };
    };

    window.DEMO_RENDERERS.stval = function () { return H.sk.blocks(true); };
})();
