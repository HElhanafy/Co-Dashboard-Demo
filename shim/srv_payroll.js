(function () {
    var S = window.DEMO_SRV, H = window.DEMO_H, R = window.DEMO_RENDERERS;
    var CO = 'Co.', SIS = 'ITS', TD = H.today.replace(/^(\d\d)\/(\d\d)\/(\d{4})$/, '$3-$2-$1');   /* demo date as ISO */
    /* group: [code, name, sort, count, basic min, basic max, company, dept code, dept, level 2, level 3, kind] */
    var G = [[1, 'Partners', 1, 3, 15000, 25000, CO, 101, 'Partners', 'General Management', 'Board', 'P'],
             [2, 'Finance', 2, 5, 6000, 12000, CO, 111, 'Accounts', 'General Management', 'Finance', ''],
             [3, 'Administration', 3, 4, 5000, 9000, CO, 112, 'HR & Admin', 'General Management', 'Administration', ''],
             [4, 'Support services', 4, 6, 2500, 5000, CO, 121, 'Support services', 'Operations', 'Services', ''],
             [5, 'Central reps', 5, 10, 4000, 8000, CO, 131, 'Central sales', 'Sales', 'Central', 'R'],
             [6, 'Showroom', 6, 3, 3000, 5000, CO, 132, 'Showroom', 'Sales', 'Central', 'R'],
             [7, 'Central warehouse', 7, 8, 2500, 4500, CO, 141, 'Central warehouse', 'Operations', 'Warehouses', ''],
             [8, 'West branch', 8, 6, 3000, 6000, CO, 151, 'West branch', 'Branches', 'West', 'R'],
             [9, 'East branch', 9, 3, 3000, 6000, SIS, 152, 'East branch', 'Branches', 'East', 'R'],
             [10, 'North branch', 10, 3, 3000, 6000, CO, 153, 'North branch', 'Branches', 'North', 'R']];
    /* no Saudization group, structure or refunded Saudi salaries in the demo: a live-company case (user 04/11/2026) */
    var LEAVE = {}, LATE = {}, ODD = {};

    function rng(seed) { var x = seed % 2147483647; if (x <= 0) { x += 2147483646; } return function () { x = x * 16807 % 2147483647; return (x - 1) / 2147483646; }; }
    function r0(x) { return Math.round(x / 50) * 50; }

    function staff() {
        if (H._pay) { return H._pay; }
        var E = [];
        G.forEach(function (g) {
            for (var i = 1; i <= g[3]; i++) {
                var code = g[2] * 1000 + i, rd = rng(code * 7919), b = g[4] ? r0(g[4] + (g[5] - g[4]) * rd()) : 0;
                E.push({ e: code, n: 'Employee ' + code, g: g, co: g[6], basic: b, rd: rd,
                         phone: g[11] === 'R' ? 200 : 0, nature: rd() < 0.3 ? r0(300 + 500 * rd()) : 0,
                         partner: g[11] === 'P' ? r0(20000 + 20000 * rd()) : 0,
                         saudi: 0, insur: rd() < 0.06 ? 50 : 0 });
            }
        });
        LEAVE[5003] = ['2026-10-20', '2026-12-10']; LEAVE[7004] = ['2026-11-05', '2027-01-05']; LEAVE[8002] = ['2026-11-12', '2027-01-12'];
        LATE[4005] = [2026, 9];
        /* loans: [emp, serial, type, start month index, value, instalment, stopped] */
        var L = [[2001, 1, 'Personal loan', 14, 20000, 1000, 0], [2003, 1, 'Personal loan', 18, 6000, 500, 0], [5002, 1, 'Salary advance', 19, 3000, 1000, 0],
                 [5006, 1, 'Personal loan', 10, 30000, 1500, 0], [5006, 2, 'Salary advance', 20, 2000, 1000, 0], [7001, 1, 'Personal loan', 12, 12000, 600, 0],
                 [7006, 1, 'Personal loan', 16, 9000, 750, 1], [8003, 1, 'Salary advance', 20, 2500, 1250, 0], [4002, 1, 'Personal loan', 6, 8000, 400, 0],
                 [3002, 1, 'Personal loan', 17, 15000, 1000, 0]];
        var L0 = H.midx('2025-01-01');   /* loan months were written from 01/2025 */
        L.forEach(function (l) { l[3] += L0; });
        return (H._pay = { E: E, L: L });
    }

    function months() {   /* computed sheets: 2025-01 up to the month before the demo date */
        var last = H.midx(TD) - 1, out = [];
        for (var i = last; i >= 0; i--) { out.push(i); }
        return out;
    }
    function inSheet(p, mi) {
        var ym = H.ym(mi), k = ym.y * 12 + ym.m;
        if (LATE[p.e] && k >= LATE[p.e][0] * 12 + LATE[p.e][1]) { return false; }
        if (LEAVE[p.e] && k >= +LEAVE[p.e][0].slice(0, 4) * 12 + +LEAVE[p.e][0].slice(5, 7) + 1) { return false; }
        return true;
    }
    function ded(l, mi) {   /* payroll instalment of a loan in month mi */
        if (mi < l[3] || l[6]) { return mi < l[3] ? 0 : (l[6] && mi < l[3] + 3 ? Math.min(l[5], l[4] - l[5] * (mi - l[3])) : 0); }
        return Math.max(0, Math.min(l[5], l[4] - l[5] * (mi - l[3])));
    }
    function paidTo(l, mi) { var s = 0; for (var i = l[3]; i <= mi; i++) { s += ded(l, i); } return s; }

    function row(p, mi) {
        var rd = rng(p.e * 31 + mi * 977), g = p.g, P = staff(), loans = 0;
        P.L.forEach(function (l) { if (l[0] === p.e) { loans += ded(l, mi); } });
        var b = p.basic, hs = r0(b * 0.25), tr = r0(b * 0.1), bonus = rd() < 0.08 ? r0(500 + 1500 * rd()) : 0,
            ot = g[11] === 'S' || g[11] === 'P' ? 0 : (rd() < 0.35 ? r0(150 + 900 * rd()) : 0), od = rd() < 0.05 ? r0(200 + 600 * rd()) : 0,
            gross = b + hs + tr + p.phone + bonus + p.nature + ot + p.partner + p.saudi + od,
            dl = rd() < 0.07 ? r0(50 + 200 * rd()) : 0, ab = rd() < 0.04 ? r0(b / 30 * 2) : 0, ox = 0,
            tot = loans + p.insur + dl + ab + ox, ym = H.ym(mi);
        return [p.e, p.n, g[7], g[8], g[9], g[10], p.co, g[0], g[1], g[2], 1, b, hs, tr, p.phone, bonus, p.nature, ot, p.partner, p.saudi, od, gross,
                loans, p.insur, dl, ab, ox, tot, H.r2(gross - tot), '', '', 1, ODD[p.e] ? 'EMP' : 'DEPT', 1];
    }

    R.payroll = function () {
        var P = staff();
        var m = months().map(function (mi) {
            var ym = H.ym(mi), n = P.E.filter(function (p) { return inSheet(p, mi); }).length;
            return [ym.y, ym.m, n, n, n];
        });
        return { id: 'pay-meta', data: { today: TD, months: m } };
    };

    S.PAYROLL_AJAX = function (p) {
        var y = +p.x01, m = +p.x02, mi = (y - H.base) * 12 + m - 1, P = staff();
        var r = P.E.filter(function (e) { return inSheet(e, mi); }).map(function (e) { return row(e, mi); });
        var st = [], cur = +TD.slice(0, 4) * 12 + +TD.slice(5, 7);
        P.E.forEach(function (e) {
            var g = e.g, lv = LEAVE[e.e], lt = LATE[e.e];
            if (lv) {
                var oy = +lv[0].slice(0, 4), om = +lv[0].slice(5, 7) + 1;
                if (om > 12) { om = 1; oy++; }
                st.push([e.e, e.n, g[1], g[2], g[8], e.co, oy, om, 1, 1, 12, lv[0], lv[1]]);
            } else if (lt && lt[0] * 12 + lt[1] < cur) {
                st.push([e.e, e.n, g[1], g[2], g[8], e.co, lt[0], lt[1], 1, 0, 0, '', '']);
            }
        });
        var nx = H.ym(mi + 1), d = nx.y + '-' + (nx.m < 10 ? '0' : '') + nx.m + '-02';
        return { y: y, m: m, payDate: d, accDate: d.slice(0, 8) + '01', r: r, st: st, today: TD };
    };

    S.PAYROLL_LOANS_AJAX = function (p) {
        var P = staff(), y = +p.x02, m = +p.x03, mi = (y - H.base) * 12 + m - 1, ym = H.ym(mi);
        var asOf = ym.y + '-' + (ym.m < 10 ? '0' : '') + ym.m + '-' + String(new Date(ym.y, ym.m, 0).getDate());
        var name = {}; P.E.forEach(function (e) { name[e.e] = e.n; });
        function iso(i) { var a = H.ym(i); return a.y + '-' + (a.m < 10 ? '0' : '') + a.m + '-01'; }
        function open(l) { return l[3] <= mi && l[4] - paidTo(l, mi) > 0; }
        if (p.x01 === 'list') {
            var by = {};
            P.L.forEach(function (l) {
                if (!open(l)) { return; }
                var o = by[l[0]] = by[l[0]] || [l[0], name[l[0]], 0, 0, 0, 0, 0, 0, 0, 0, 0], pd = paidTo(l, mi);
                o[3]++; o[4] += l[4]; o[5] += pd; o[6] += l[4] - pd; o[7] += ded(l, mi); o[8] += l[6] ? l[4] - pd : 0; o[10] += ded(l, mi - 1);
            });
            return { asOf: asOf, rows: Object.keys(by).map(function (k) { return by[k]; }) };
        }
        if (p.x01 === 'emp') {
            var e = +p.x04, loans = [], pays = [];
            P.L.forEach(function (l) {
                if (l[0] !== e || l[3] > mi) { return; }
                var pd = paidTo(l, mi);
                loans.push([l[1], l[2], iso(l[3]), l[4], l[5], 1, l[6], pd, l[4] - pd, ded(l, mi), ded(l, mi - 1), '']);
                for (var i = l[3]; i <= mi; i++) { if (ded(l, i)) { pays.push([l[1], iso(i), ded(l, i), 'P', '']); } }
            });
            pays.sort(function (a, b) { return a[1] < b[1] ? 1 : -1; });
            return { asOf: asOf, loans: loans, pays: pays };
        }
        return { error: 'act' };
    };
})();
