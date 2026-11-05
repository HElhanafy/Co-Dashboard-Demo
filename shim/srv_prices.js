/* srv_prices.js - PRICES page: pl-* payload (active, classed, priced items) and PRICES_AJAX log from DEMO.priceLog (24/10/2026) */
(function () {
    var D = window.DEMO, S = window.DEMO_SRV, H = window.DEMO_H;
    var TODAY = H.today.slice(6, 10) + '-' + H.today.slice(3, 5) + '-' + H.today.slice(0, 2);

    // live rule: no inactive items, no items without class, no items without a price
    function ok(i) { return i && i[7] && i[2] !== null && i[2] >= 0 && i[5] > 0; }
    function lastChange() {
        var o = {};
        D.priceLog.forEach(function (r) { if (!o[r[1]] || r[0] >= o[r[1]][0]) o[r[1]] = r; });
        return o;
    }

    window.DEMO_RENDERERS.prices = function () {
        var k = {}, lc = lastChange();
        D.items.forEach(function (i) { if (i[2] !== null && i[2] >= 0) k[i[2]] = (k[i[2]] || 0) + 1; });
        var items = D.items.filter(ok).sort(function (a, b) {
            return a[2] - b[2] || (a[4] < b[4] ? -1 : a[4] > b[4] ? 1 : 0) || (a[0] < b[0] ? -1 : 1);
        }).map(function (i) {
            var l = lc[i[0]];
            return { c: i[0], n: i[1], cl: String(i[2] + 1), bn: 'Brand ' + i[4].slice(-2), st: 0,
                us: [[i[3], 1, i[5], 1, l ? l[0] : '', l ? l[2] : 0]] };
        });
        return [{ id: 'pl-meta', data: { admin: 1, asOf: H.asOf, today: TODAY, minD: D.meta.start } },
            { id: 'pl-classes', data: D.classes.map(function (n, i) { return { c: String(i + 1), n: n, k: k[i] || 0 }; }) },
            { id: 'pl-items', data: items }];
    };

    S.PRICES_AJAX = function (p) {
        if (p.x01 !== 'log') return { err: 'unknown' };
        var re = /^\d{4}-\d{2}-\d{2}$/, f = re.test(p.x02 || '') ? p.x02 : null, t = re.test(p.x03 || '') ? p.x03 : TODAY;
        if (!f) { var y = +TODAY.slice(0, 4), m = +TODAY.slice(5, 7) - 3; if (m < 1) { m += 12; y--; } f = y + '-' + (m < 10 ? '0' : '') + m + TODAY.slice(7); }
        var rows = D.priceLog.filter(function (r) { return r[0] >= f && r[0] <= t && ok(H.item[r[1]]); })
            .sort(function (a, b) { return a[0] < b[0] ? 1 : a[0] > b[0] ? -1 : (a[1] < b[1] ? -1 : 1); })
            .map(function (r) { return [r[0] + ' 08:00', r[1], H.item[r[1]][3], r[2], r[3]]; });
        return { f: f, t: t, rows: rows, n: rows.length };
    };
})();
