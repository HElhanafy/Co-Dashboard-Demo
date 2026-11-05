/* srv_supst.js - SUPST page: SUPST_AJAX run/stmt/pay over the supplier ledger (grn = invoices, kind O = opening; spay = payments; FIFO settlement) (24/10/2026) */
(function () {
    var D = window.DEMO, S = window.DEMO_SRV, H = window.DEMO_H;
    var TODAY = H.today.slice(6, 10) + '-' + H.today.slice(3, 5) + '-' + H.today.slice(0, 2), MIN_D = H.base + '-01-01';
    var VN = { OPN: 901, INV: 101, PAY: 300 }, RCV_T = 301;
    var BANK = H.idx(D.banks), PO = H.idx(D.po, 1);
    function r2(x) { return H.r2(x); }
    function key(e) { return e ? e[0] + '/' + e[1] + '/' + e[2] : null; }
    function addDays(s, n) { return new Date(Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10) + n)).toISOString().slice(0, 10); }
    function supName(c) { return H.sup[c] ? H.sup[c][1] : 'Supplier ' + c; }

    // ledger movements per supplier + FIFO allocation of payments to invoices (oldest first)
    function ledger() {
        if (H._sst) return H._sst;
        var by = {}, mv = {}, al = [];
        function add(m) { mv[m.vn + '/' + m.ser] = m; (by[m.sup] = by[m.sup] || []).push(m); }
        var RT = H.T_RCV || RCV_T;   // srv_poarr.js: SUPAY_INV_AJAX x02 = T_RCV, x03 = grn id
        D.grn.forEach(function (g) {
            var o = g[13] === 'O', po = g[6] ? PO[g[6]] : null;
            add({ k: 'INV', vn: o ? VN.OPN : VN.INV, ser: g[0], sup: g[4], d: g[2], dr: 0, cr: g[10], doc: H.supInvNo ? H.supInvNo(g) || g[1] : g[1], ord: po ? po[1] : null,
                desc: o ? 'Opening balance - ' + g[1] + ' of ' + H.dmy(g[2]) : 'Purchase invoice ' + (H.supInvNo ? H.supInvNo(g) + ' - receipt ' : '') + g[1] + ' - due ' + H.dmy(g[3]) + (g[7] === 'USD' ? ' - USD ' + g[9].toFixed(2) : ''),
                rt: o ? null : RT, rs: o ? null : g[0], ot: o || !S.SUPAY_INV_AJAX ? null : RT, os: o ? null : g[0], e: g[12], cur: g[7], rate: g[8], fc: g[9], due: g[3], vat: g[11], src: g });
        });
        D.spay.forEach(function (p) {
            var b = BANK[p[4]];
            add({ k: 'PAY', vn: VN.PAY, ser: p[0], sup: p[3], d: p[2], dr: p[7], cr: 0, doc: p[1], ord: null,
                desc: 'Payment ' + p[1] + ' - bank transfer from ' + (b ? b[1] : p[4]), rt: null, rs: null, ot: null, os: null,
                e: p[8], cur: p[5], rate: p[5] === 'USD' ? D.meta.usd : 1, fc: p[6], bank: p[4], src: p });
        });
        Object.keys(by).forEach(function (c) {
            var L = by[c];
            L.sort(function (a, b) { return a.d < b.d ? -1 : a.d > b.d ? 1 : a.vn - b.vn || a.ser - b.ser; });
            // oldest first: a payment settles the invoices received before it and due within 5 days of it (the rule of srv_poarr.js H.pur)
            var inv = L.filter(function (m) { return m.k === 'INV'; }).sort(function (a, b) { return a.ser - b.ser; });
            inv.forEach(function (m) { m.open = m.cr; });
            L.forEach(function (p) {
                if (p.k !== 'PAY') return;
                var amt = p.dr, lim = addDays(p.d, 5);
                inv.forEach(function (m) {
                    if (amt <= 0.004 || m.open <= 0.004 || m.d >= p.d || m.due > lim) return;
                    var a = Math.min(m.open, amt);
                    al.push([p, m, r2(a)]); m.open = r2(m.open - a); amt = r2(amt - a);
                });
                p.rest = amt;
            });
        });
        return (H._sst = { by: by, mv: mv, al: al });
    }

    function period(p) {
        var f = /^\d{4}-\d\d-\d\d$/.test(p.x02 || '') ? p.x02 : TODAY.slice(0, 4) + '-01-01', t = /^\d{4}-\d\d-\d\d$/.test(p.x03 || '') ? p.x03 : '';
        if (f < MIN_D) f = MIN_D;
        if (!t || t < f) t = TODAY;
        return { f: f, t: t };
    }

    function run(p) {
        var P = period(p), L = ledger(), out = [];
        Object.keys(L.by).forEach(function (c) {
            var o = 0, dr = 0, cr = 0, n = 0;
            L.by[c].forEach(function (m) {
                if (m.d > P.t) return;
                if (m.d < P.f) o += m.cr - m.dr; else { dr += m.dr; cr += m.cr; n++; }
            });
            if (Math.abs(o) >= 0.005 || n) out.push([c, supName(c), r2(o), r2(dr), r2(cr), n, 0, 0, 0, 0]);
        });
        out.sort(function (a, b) { return a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : a[0] < b[0] ? -1 : 1; });
        return { ok: 1, asof: H.asOf, from: P.f, to: P.t, sup: out };
    }

    function stmt(p) {
        var P = period(p), c = String(p.x04 || ''), L = ledger().by[c] || [], o = 0, rows = [];
        L.forEach(function (m) {
            if (m.d > P.t) return;
            if (m.d < P.f) { o += m.cr - m.dr; return; }
            rows.push([m.d, m.k, m.vn, m.ser, m.doc, m.ord, m.desc, r2(m.dr), r2(m.cr), 1, 0, m.rt, m.rs, m.ot, m.os, m.ot ? c : null]);
        });
        return { ok: 1, asof: H.asOf, from: P.f, to: P.t, code: c, name: H.sup[c] ? H.sup[c][1] : null, open: r2(o), rows: rows, pend: [] };
    }

    function invRow(m, net) {
        return ['INV', m.vn, m.ser, m.d, m.doc, m.ord, r2(m.cr), r2(net), m.rt, m.rs, m.ot, m.os, m.ot ? m.sup : null, 0];
    }

    function pay(p) {
        var L = ledger(), m = L.mv[(+p.x02) + '/' + (+p.x03)];
        if (!m) return { ok: 1, asof: H.asOf, h: null, lines: [], inv: [], po: [], by: [] };
        var e = m.e || [], usd = m.cur === 'USD', inv = [], by = [];
        L.al.forEach(function (a) {
            if (a[0] === m) inv.push(invRow(a[1], a[2]));
            if (a[1] === m) by.push([a[0].vn, a[0].ser, a[0].d, a[2], 'PAY', a[0].desc]);
        });
        var h = [m.sup, supName(m.sup), m.vn, m.ser, m.d, r2(m.dr - m.cr), 1, null, key(m.e), m.desc, m.k,
            usd ? 2 : 1, usd ? D.meta.usd : 1, '1', null, m.doc, m.d, m.bank || null, '1', null, null, D.meta.user, null,
            e[0] || null, e[1] || null, e[2] || null, r2(m.fc), m.k === 'PAY' ? 6 : null];
        var lines = m.k === 'INV' && !m.ot ? [[1, m.doc, null, m.d, m.due, null, r2(m.cr - (m.vat || 0)), r2(m.vat || 0), r2(m.cr), r2(m.open)]] : [];
        return { ok: 1, asof: H.asOf, h: h, lines: lines, inv: inv, po: [], by: by };
    }

    S.SUPST_AJAX = function (p) {
        var c = String(p.x01 || '').toLowerCase();
        if (c === 'run') return run(p);
        if (c === 'stmt') return stmt(p);
        if (c === 'pay') return pay(p);
        return { error: 'unknown command' };
    };
    // closing balance per supplier as of a date (for cross-checks with the AP sub-ledger)
    H.supstBal = function (to) {
        var o = {}, L = ledger().by;
        Object.keys(L).forEach(function (c) { var b = 0; L[c].forEach(function (m) { if (!to || m.d <= to) b += m.cr - m.dr; }); o[c] = r2(b); });
        return o;
    };
})();
