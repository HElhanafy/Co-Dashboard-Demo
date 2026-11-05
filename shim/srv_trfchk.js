/* srv_trfchk.js - TRFCHK page (Transfer Integrity): #trf-data from the demo transfers, with a few broken cases made up on purpose; H.trfDemo is shared with TRFREG (04/11/2026) */
(function () {
    var D = window.DEMO, S = window.DEMO_SRV, H = window.DEMO_H;
    var TO = 1090101, TI = 1090201, BR = { '1': 'CEN', '2': 'NTH', '3': 'EST', '4': 'WST', '5': 'CEN' };
    function iso(d) { return d.slice(6, 10) + '-' + d.slice(3, 5) + '-' + d.slice(0, 2); }

    /* the demo transfers sorted by date, and which ones play each broken case (fixed positions, so every build shows the same) */
    H.trfDemo = function () {
        if (H._trf) return H._trf;
        var T = D.trf.slice().sort(function (a, b) { return a[2] < b[2] ? -1 : a[2] > b[2] ? 1 : a[0] - b[0]; }), n = T.length, W = {};
        D.warehouses.forEach(function (w) { W[w[0]] = w; });
        function code(w) { return String(+w.slice(1)); }
        var o = { T: T, today: iso(H.today), open: T.slice(n - 4), C: [T[n - 30], T[n - 40]], D: T[n - 25], N: T[n - 50], R: T[30], I: T[n - 45], stores: {} };
        o.code = code;
        o.store = function (w) { var x = W[w]; o.stores[code(w)] = [x[1], BR[x[2]] || 'CEN', x[1]]; return code(w); };
        o.lines = function (t) { return D.trfL.filter(function (l) { return l[0] === t[0]; }); };
        o.skip = {};
        [o.R, o.I, o.N, o.D].concat(o.open, o.C).forEach(function (t) { o.skip[t[0]] = 1; });
        return (H._trf = o);
    };

    window.DEMO_RENDERERS.trfchk = function () {
        var o = H.trfDemo(), rows = [];
        function row(chk, t, recv, hdel, moves) { rows.push([chk, String(t[0]), o.store(t[4]), o.store(t[5]), t[2], recv, t[1], hdel, 1, moves]); }
        row('R', o.R, null, 1, TO + '/' + o.R[0] + '|' + o.R[2] + '|5|1|0;' + TI + '/' + o.R[0] + '|' + (o.R[3] || o.R[2]) + '|6|0|1');
        row('I', o.I, null, 1, TO + '/' + o.I[0] + '|' + o.I[2] + '|5|0|0');
        o.C.forEach(function (t) { row('C', t, null, 0, TO + '/' + t[0] + '|' + t[2] + '|5|0|1'); });
        row('N', o.N, o.N[2], 0, '');
        return { id: 'trf-data', data: { asOf: H.asOf, lim: 0, rows: rows, stores: o.stores, ack: 2 } };
    };
})();
