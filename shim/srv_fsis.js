/* srv_fsis.js - FSIS page: fs-* islands and IS_AJAX data/used/stmt; ledger helpers in srv_fs.js (24/10/2026) */
(function () {
    var D = window.DEMO, S = window.DEMO_SRV, H = window.DEMO_H;

    // statement lines exactly as the live region prints them (labels of the audited layout)
    var LINES = [
        { id: 'RV', t: 'a', neg: 0, lbl: 'الإيرادات' },
        { id: 'CG', t: 'a', neg: 1, lbl: 'تكلفة الإيرادات' },
        { id: 'GP', t: 'd', neg: 0, f: 'RV,CG', lbl: 'إجمالي الربح' },
        { id: 'OI', t: 'a', neg: 0, lbl: 'دخل آخر' },
        { id: 'SD', t: 'a', neg: 1, lbl: 'مصاريف بيع وتوزيع' },
        { id: 'GA', t: 'a', neg: 1, lbl: 'مصاريف عمومية وإدارية' },
        { id: 'OP', t: 'd', neg: 0, f: 'GP,OI,SD,GA', lbl: 'ربح (خسارة) العمليات' },
        { id: 'DP', t: 'a', neg: 0, lbl: 'أرباح (خسائر) من استبعاد العقارات، الآلات والمعدات' },
        { id: 'PB', t: 'd', neg: 0, f: 'OP,DP', lbl: 'الربح (الخسارة) قبل الزكاة والضريبة' },
        { id: 'ZK', t: 'a', neg: 1, lbl: 'الزكاة وضريبة الدخل' },
        { id: 'NP', t: 'd', neg: 0, f: 'PB,ZK', lbl: 'صافي الربح (الخسارة) بعد الزكاة والضريبة' }
    ];

    // demo chart -> line: 4* revenue (gross, returns, discounts) = RV; 5* COGS + stock write-off = CG;
    // 6104 transport + 6105 marketing = SD; other 6* (salaries, rent, utilities, depreciation, bank charges, G&A) = GA.
    // No other income, disposal gains or zakat in the demo ledger (OI / DP / ZK stay 0). Same split as HOME 'acc'.
    function lineOf(a) {
        var c = a.charAt(0), p = a.slice(0, 4);
        if (c === '4') return 'RV';
        if (c === '5') return 'CG';
        if (c === '6') return p === '6104' || p === '6105' ? 'SD' : 'GA';
        return null;
    }

    // rows {a,n,l,v:"YYYYMM:credit-debit,..."} ordered by line then account (live ORDER BY LN, ACC)
    function isRows(c1, c2) {
        var G = H.LG, cf = G.costFn(c1, c2), o = {};
        G.lines().forEach(function (l) {
            var ln = lineOf(l.a);
            if (!ln || !cf(l)) return;
            var r = o[l.a] || (o[l.a] = { a: l.a, l: ln, m: {} });
            r.m[l.m] = (r.m[l.m] || 0) - l.v;
        });
        return Object.keys(o).map(function (k) { return o[k]; })
            .sort(function (x, y) { return x.l < y.l ? -1 : x.l > y.l ? 1 : x.a < y.a ? -1 : 1; })
            .map(function (r) {
                var v = Object.keys(r.m).sort().filter(function (m) { return H.r2(r.m[m]) !== 0; })
                    .map(function (m) { return m + ':' + G.fix(r.m[m]); }).join(',');
                return { a: r.a, n: G.name(r.a), l: r.l, v: v };
            }).filter(function (r) { return r.v; });
    }

    // CC2 codes used on P&L accounts in the period (CC1 scope only)
    function used(c1, yf, yt, mf, mt) {
        var G = H.LG, cf = G.costFn(c1, ''), u = {};
        G.lines().forEach(function (l) {
            if (!l.c2 || !lineOf(l.a) || !cf(l)) return;
            var y = +l.m.slice(0, 4), m = +l.m.slice(4, 6);
            if (y < yf || y > yt || m < mf || m > mt) return;
            u[l.c2] = 1;
        });
        return Object.keys(u).sort();
    }

    function per(p) {
        var G = H.LG;
        return p.x04 ? [+p.x04 || H.base, +p.x05 || 9999, +p.x06 || 1, +p.x07 || 12] : [H.base, 9999, 1, 12];
    }

    window.DEMO_RENDERERS.fsis = function () {
        var G = H.LG;
        return [
            { html: '<script type="text/html" id="fs-extra-html">' +
                '<div class="filters fs-cost">' +
                '<div class="filter-group"><label>Cost Center 1 (A) <span class="lbl-hint">(departments)</span></label>' +
                '<select id="fC1A"><option value="">All Cost Centers</option></select></div>' +
                '<div class="filter-group"><label>Cost Center 1 (B) <span class="lbl-hint">(details of A)</span></label>' +
                '<select id="fC1B"><option value="">All Details</option></select></div>' +
                '<div class="filter-group"><label>Cost Center 2 (A) <span class="lbl-hint">(groups)</span></label>' +
                '<select id="fC2A"><option value="">All Groups</option></select></div>' +
                '<div class="filter-group"><label>Cost Center 2 (B) <span class="lbl-hint">(multi-select)</span></label>' +
                '<div class="ms-box" id="fC2BBox"><button type="button" class="ms-btn" id="fC2BBtn">All Details</button>' +
                '<div class="ss-menu" id="fC2BMenu"></div></div></div></div><\/script>' },
            { id: 'fs-lines', data: LINES },
            { id: 'fs-data', data: isRows('', '') },
            { id: 'fs-c2used', data: used('', G.curY, G.curY, G.curMo, G.curMo) }
        ].concat(G.fsIslands());
    };

    S.IS_AJAX = function (p) {
        var G = H.LG, act = p.x01, e = G.costErr(p.x02, p.x03), q;
        if (e) return { err: e };
        if (act === 'used') { q = per(p); return { c2: used(p.x02 || '', q[0], q[1], q[2], q[3]) }; }
        if (act === 'data') { q = per(p); return { rows: isRows(p.x02 || '', p.x03 || ''), c2: used(p.x02 || '', q[0], q[1], q[2], q[3]) }; }
        if (act === 'stmt') return G.stmt(p);
        return { err: 'unknown action' };
    };
})();
