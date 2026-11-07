(function () {
    var D = window.DEMO, S = window.DEMO_SRV, H = window.DEMO_H;

    S.SUPAY_AJAX = function (p) {
        if (p.x01 !== 'run') return { error: 'unknown command' };
        var P = H.pur(), from = p.x02 || H.todayIso.slice(0, 4) + '-01-01', to = p.x03 || H.todayIso, rows = [], has = {};
        if (from < D.meta.start) from = D.meta.start;
        // invoices = receipts (one row per receipt), order date = date of its purchase order
        D.grn.forEach(function (g) {
            var po = g[6] ? P.poByNo[g[6]] : null, od = po ? po[2] : g[2];
            if (od < from || od > to) return;
            var sp = H.sup[g[4]], paid = P.paid[g[0]] || 0, bal = H.r2(g[10] - paid);
            rows.push([g[4], H.T_RCV, g[0], po ? po[1] : g[1], H.supInvNo(g), 'M', 'I', 0, od, po ? H.poShip(po) : g[2], g[2], sp[3],
                g[3].slice(0, 7), g[10], 0, g[10], paid, P.last[g[0]] || null, bal, bal, 1, g[1], g[2], 0]);
            has[g[4]] = 1;
        });
        // orders = open quantity of open / partly received orders, due = expected shipping + credit days
        D.po.forEach(function (po) {
            if (po[2] < from || po[2] > to) return;
            var ls = H.poOpen(po); if (!ls.length) return;
            var sp = H.sup[po[4]], c = H.poCur(po), vat = po[7] === 'USD' ? 0 : D.meta.vat, amt = 0, ship = H.poShip(po);
            ls.forEach(function (l) { var v = H.r2((l[2] - l[4]) * H.r2(l[3] * c[1])); amt += v + H.r2(v * vat); });
            amt = H.r2(amt);
            rows.push([po[4], H.T_PO, po[0], po[1], '', 'M', 'O', 0, po[2], ship, po[3], sp[3], H.addDays(ship, sp[3]).slice(0, 7),
                amt, 0, amt, 0, null, amt, amt, 0, '', null, 0]);
            has[po[4]] = 1;
        });
        var sup = D.suppliers.filter(function (s) { return has[s[0]] || P.ledger[s[0]]; }).map(function (s) {
            return [s[0], s[1], P.ledger[s[0]] || 0, P.lastPay[s[0]] || null, 0];
        }).sort(function (a, b) { return a[1] < b[1] ? -1 : 1; });
        return { ok: 1, asof: H.asOf, from: from, to: to, usd: D.meta.usd || 3.75, sup: sup, rows: rows };
    };
})();
