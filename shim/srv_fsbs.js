/* srv_fsbs.js - FSBS page: fs-* islands and BS_AJAX bs/stmt (cumulative, virtual year-end close); ledger helpers in srv_fs.js (24/10/2026) */
(function () {
    var D = window.DEMO, S = window.DEMO_SRV, H = window.DEMO_H;
    function L(id, lbl, t, f, neg) { return { id: id, lbl: lbl, t: t, f: f, neg: neg }; }

    // the live line map + CY (current-year profit): the demo ledger has no year-end closing entry, so
    // profit of closed years is carried into BT (retained earnings) and the running year shows on CY.
    var LINES = [
        L('BC', 'النقد وأرصدة لدى البنوك', 'a', '', 0),
        L('BR', 'المبالغ المستحقة من المدينين التجاريين', 'a', '', 0),
        L('PPS', 'دفعات مقدمة للموردين والمقاولين', 'a', '', 0),
        L('BE', 'مصاريف مدفوعة مقدماً', 'a', '', 0),
        L('BA', 'أرصدة مستحقة من جهات ذات علاقة', 'a', '', 0),
        L('BI', 'المخزون', 'a', '', 0),
        L('BO', 'موجودات متداولة أخرى', 'a', '', 0),
        L('TCA', 'اجمالي الموجودات المتداولة', 'd', 'BC,BR,PPS,BE,BA,BI,BO', 0),
        L('BF', 'العقارات والآلات والمعدات، صافي', 'a', '', 0),
        L('TA', 'مجموع الموجودات', 'd', 'TCA,BF', 0),
        L('BP', 'مبالغ مستحقة للدائنين التجاريين', 'a', '', 1),
        L('BX', 'مصاريف مستحقة الدفع', 'a', '', 1),
        L('CAD', 'دفعات مقدمة من العملاء', 'a', '', 1),
        L('BL', 'أرصدة مستحقة إلى جهات ذات علاقة', 'a', '', 1),
        L('BN', 'قروض قصيرة الاجل', 'a', '', 1),
        L('BQ', 'مطلوبات متداولة أخرى', 'a', '', 1),
        L('BZ', 'التزامات زكاة وضريبة الدخل', 'a', '', 1),
        L('TCL', 'مجموع المطلوبات المتداولة', 'd', 'BP,BX,CAD,BL,BN,BQ,BZ', 1),
        L('BB', 'مخصصات منافع موظفين', 'a', '', 1),
        L('TL', 'مجموع المطلوبات', 'd', 'TCL,BB', 1),
        L('BK', 'رأس المال', 'a', '', 1),
        L('BV', 'احتياطي نظامي', 'a', '', 1),
        L('BT', 'أرباح مبقاة', 'a', '', 1),
        L('CY', 'صافي ربح السنة الحالية', 'a', '', 1),
        L('TE', 'مجموع حقوق الملكية', 'd', 'BK,BV,BT,CY', 1),
        L('TLE', 'مجموع المطلوبات وحقوق الملكية', 'd', 'TL,TE', 1),
        L('BU', 'غير مصنَّف', 'a', '', 0)
    ];
    var RE = '310201', AR = '110401', AP = '210101';

    // demo chart -> line: cash 1101 + banks 1102 + cheques under collection 1103 = BC; AR 1104 = BR (grossed up by
    // the sub-ledger); inventory 1105 = BI; VAT input 1106 = BO; fixed assets net of depreciation 12 = BF;
    // AP 2101 = BP; VAT output 2102 = BQ; capital 3101 = BK; retained earnings 3102 = BT; P&L 4/5/6 = CY.
    function lineOf(a) {
        var p = a.slice(0, 4);
        if (p === '1101' || p === '1102' || p === '1103') return 'BC';
        if (p === '1104') return 'BR';
        if (p === '1105') return 'BI';
        if (p === '1106') return 'BO';
        if (a.slice(0, 2) === '12') return 'BF';
        if (p === '2101') return 'BP';
        if (p === '2102') return 'BQ';
        if (p === '3101') return 'BK';
        if (p === '3102') return 'BT';
        if (H.LG.isPL(a)) return 'CY';
        return 'BU';
    }

    function months() {
        var G = H.LG, out = [], m = G.minM;
        while (m <= G.curM) { out.push(m); var y = +m.slice(0, 4), mm = +m.slice(4, 6) + 1; m = mm > 12 ? (y + 1) + '01' : y + G.two(mm); }
        return out;
    }
    // P&L (debit - credit) of one account, or of all P&L accounts, per calendar year
    function plYear(acct) {
        var G = H.LG, mo = G.monthly(), o = {};
        Object.keys(mo).forEach(function (a) {
            if (acct ? a !== acct : !G.isPL(a)) return;
            Object.keys(mo[a]).forEach(function (m) { var y = m.slice(0, 4); o[y] = (o[y] || 0) + mo[a][m]; });
        });
        return o;
    }

    function bs() {
        var G = H.LG, mo = G.monthly(), ms = months(), rows = [], allPL = plYear(null);
        Object.keys(mo).sort().forEach(function (a) {
            var l = lineOf(a), pl = l === 'CY', py = pl ? plYear(a) : null, v = [];
            ms.forEach(function (m) {
                var x = mo[a][m] || 0, y = +m.slice(0, 4);
                // virtual year-end close, booked in January of the next year
                if (m.slice(4) === '01' && y > H.base) {
                    if (pl) x -= py[y - 1] || 0;
                    else if (a === RE) x += allPL[y - 1] || 0;
                }
                if (H.r2(x) !== 0) v.push(m + ':' + G.fix(x));
            });
            if (v.length) rows.push({ a: a, n: G.name(a), l: l, o: '0.00', v: v.join(',') });
        });
        return { lines: LINES, rows: rows, sub: sub(ms) };
    }

    // customer (C, AR) and supplier (V, AP) sub-ledger split at each month end: d = debit balances, c = credit balances
    function sub(ms) {
        var G = H.LG, out = [], bal = { C: {}, V: {} }, gl = { C: 0, V: 0 }, i = 0, ls = G.lines();
        ms.forEach(function (m) {
            for (; i < ls.length && ls[i].m <= m; i++) {
                var l = ls[i], t = l.a === AR ? 'C' : l.a === AP ? 'V' : null;
                if (!t) continue;
                gl[t] += l.v;
                bal[t][l.s || '-'] = (bal[t][l.s || '-'] || 0) + l.v;
            }
            ['C', 'V'].forEach(function (t) {
                var d = 0, c = 0;
                Object.keys(bal[t]).forEach(function (k) { var b = H.r2(bal[t][k]); if (b > 0) d += b; else c -= b; });
                out.push({ m: m, t: t, d: G.fix(d), c: G.fix(c), g: G.fix(gl[t]), r: G.fix(d - c - gl[t]) });
            });
        });
        return out;
    }

    // opening of the cumulative statement under the same virtual close as the 'bs' rows
    function openAdj(acc, p, yf) {
        var G = H.LG, y0 = yf + '01', adj = 0;
        if (p.x09 === 'CY' && G.isPL(acc)) {
            (G.byAcct()[acc] || []).forEach(function (l) { if (l.m < y0) adj -= l.v; });
        } else if (p.x09 === 'BT' && acc === RE) {
            G.lines().forEach(function (l) { if (l.m < y0 && G.isPL(l.a)) adj += l.v; });
        }
        return adj;
    }

    window.DEMO_RENDERERS.fsbs = function () { return H.LG.fsIslands(); };

    S.BS_AJAX = function (p) {
        if (p.x01 === 'bs') return bs();
        if (p.x01 === 'stmt') return H.LG.stmt(p, openAdj);
        return { err: 'unknown action' };
    };
})();
