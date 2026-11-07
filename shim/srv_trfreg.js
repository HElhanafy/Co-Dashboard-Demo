(function () {
    var D = window.DEMO, S = window.DEMO_SRV, H = window.DEMO_H;
    var TO = 1090101, TI = 1090201;
    function item(c) { return D.items.filter(function (i) { return i[0] === c; })[0] || [c, c, 0, 'PCS']; }
    /* [serial, from, to, date, header received, doc, appr, issue ref, receipt ref, receipt date, n issue, n receipt, n lines, n diff, status, flag] */
    function row(o, t, st, flag) {
        var rec = st !== 'O', n = o.lines(t).length;
        return [String(t[0]), o.store(t[4]), o.store(t[5]), t[2], rec ? (t[3] || t[2]) : null, t[1], 1, TO + '/' + t[0], rec ? TI + '/' + t[0] : null,
                rec ? (t[3] || t[2]) : null, 1, rec ? 1 : 0, n, st === 'D' ? 1 : 0, st, flag || ''];
    }

    window.DEMO_RENDERERS.trfreg = function () {
        var o = H.trfDemo(), rows = [];
        o.open.forEach(function (t) { rows.push(row(o, t, 'O', '')); });
        o.C.forEach(function (t) { rows.push(row(o, t, 'O', 'C')); });
        rows.push(row(o, o.N, 'O', 'N'));
        rows.push(row(o, o.D, 'D', ''));
        rows.sort(function (a, b) { return a[3] < b[3] ? -1 : 1; });
        return { id: 'trf-data', data: { asOf: H.asOf, today: o.today, integ: 5, rows: rows, stores: o.stores } };
    };

    S.TRFREG_AJAX = function (p) {
        var o = H.trfDemo();
        if (p.x01 === 'arch') {
            var to = /^\d{4}-\d\d-\d\d$/.test(p.x04 || '') && p.x04 < o.today ? p.x04 : o.today,
                from = /^\d{4}-\d\d-\d\d$/.test(p.x03 || '') && p.x03 <= to ? p.x03 : to.slice(0, 8) + '01';
            o.stores = {};
            var rows = o.T.filter(function (t) { return !o.skip[t[0]] && t[2] >= from && t[2] <= to; }).map(function (t) { return row(o, t, 'C', ''); });
            return { from: from, to: to, rows: rows, stores: o.stores };
        }
        if (p.x01 === 'lines') {
            var t = o.T.filter(function (x) { return String(x[0]) === String(p.x02); })[0];
            if (!t) return { error: 'key' };
            var open = o.open.indexOf(t) !== -1 || o.C.indexOf(t) !== -1 || t === o.N;
            return { lines: o.lines(t).map(function (l, i) {
                var it = item(l[1]), q = l[4], r = open ? 0 : (t === o.D && i === 0 ? Math.max(0, q - Math.ceil(q / 4)) : q);
                return [l[1], it[1], l[2], l[3] ? H.dmy(l[3]) : '', q, r, it[3], q, open ? '' : it[3], r];
            }) };
        }
        return { error: 'act' };
    };
})();
