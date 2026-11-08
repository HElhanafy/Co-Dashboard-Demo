(function () {
    var D = window.DEMO, S = window.DEMO_SRV, H = window.DEMO_H;
    var TODAY = H.today.slice(6, 10) + '-' + H.today.slice(3, 5) + '-' + H.today.slice(0, 2), MIN_D = D.meta.start, CHQ_BANK = 901, T_RCPT = 20;

    // per cheque: id = [20, line no. of the receipt's portfolio debit], its portfolio, its GL lines on bank/portfolio accounts
    function build() {
        if (H._cq) return H._cq;
        var B = H.bankBuild(), C = { list: [], bySer: {}, pf: [] };
        B.accts.forEach(function (a) { if (a.bc === CHQ_BANK) C.pf.push([+a.code, a.name, a.city]); });
        D.chq.forEach(function (q) {
            var r = B.rcpt[q[12]], pf = B.byCode['901' + ('0' + q[6]).slice(-2)], keys = [r ? r[9] : null].concat(q.slice(14)), lines = [], ser = null;
            keys.forEach(function (k) {
                var eid = B.entryOfKey(k);
                (B.ent[eid] || []).forEach(function (i) {
                    var a = B.byGl[D.glL[i][1]]; if (!a) return;
                    lines.push(i);
                    if (ser === null && a.bc === CHQ_BANK && D.glL[i][2] > 0) ser = i + 1;
                });
            });
            if (ser === null) return;
            var o = { q: q, pf: pf, ser: ser, lines: lines };
            C.list.push(o); C.bySer[ser] = o;
        });
        return (H._cq = C);
    }
    function iso(s, def) { return /^\d{4}-\d{2}-\d{2}$/.test(s || '') ? s : def; }
    function cn(c) { return H.cust[c] ? H.cust[c][1] : c; }
    function sn(r) { return H.rep[r] ? H.rep[r][1] : ''; }
    function bankName(gl) { var a = H.bankBuild().byGl[gl]; return a ? a.name : gl; }
    // where the cheque is at a date: portfolio until deposited
    function inPf(q, t) { return q[2] <= t && (q[9] === 'P' || !q[10] || q[10] > t); }

    function run(p) {
        var C = build(), t = iso(p.x02, TODAY), rows = [];
        if (t > TODAY) t = TODAY;
        if (t < MIN_D) t = MIN_D;
        C.list.forEach(function (o) {
            var q = o.q;
            if (!inPf(q, t)) return;
            rows.push([+o.pf.code, q[1], q[2], sn(q[5]), cn(q[4]), 'Cheque ' + q[1] + ' - ' + q[7] + ', due ' + H.dmy(q[3]), q[8], T_RCPT, o.ser]);
        });
        rows.sort(function (a, b) { return a[0] - b[0] || (a[2] < b[2] ? -1 : a[2] > b[2] ? 1 : 0); });
        return { ok: 1, asof: H.asOf, to: t, pf: C.pf, rows: rows };
    }

    function where(q) { return q[9] === 'P' ? null : bankName(q[13]); }
    function find(p) {
        var C = build(), q = String(p.x02 || '').replace(/[^0-9.]/g, ''), f = iso(p.x03, MIN_D), t = iso(p.x04, TODAY), rows = [];
        if (f < MIN_D) f = MIN_D;
        if (q) C.list.forEach(function (o) {
            var c = o.q, amt = c[8].toFixed(2);
            if (c[2] > t || (c[11] || c[10] || c[2]) < f) return;   // a movement of the cheque falls inside the period
            if (c[1].indexOf(q) < 0 && amt.indexOf(q) !== 0 && String(c[8]).indexOf(q) !== 0) return;
            rows.push([T_RCPT, o.ser, c[1], c[8], cn(c[4]), where(c) || o.pf.name, c[2]]);
        });
        rows.sort(function (a, b) { return a[5] < b[5] ? -1 : a[5] > b[5] ? 1 : a[6] < b[6] ? 1 : a[6] > b[6] ? -1 : 0; });
        return { ok: 1, q: q, rows: rows.slice(0, 60) };
    }

    function chq(p) {
        var C = build(), B = H.bankBuild(), o = C.bySer[+p.x03];
        if (!o || +p.x02 !== T_RCPT) return { error: 'cheque not found' };
        var f = iso(p.x04, TODAY.slice(0, 4) + '-01-01'), t = iso(p.x05, TODAY), q = o.q, rows = [];
        if (f < MIN_D) f = MIN_D;
        if (t > TODAY || t < f) t = TODAY;
        o.lines.forEach(function (i) {
            var l = D.glL[i], e = B.entry(i), a = B.byGl[l[1]], pf = a.bc === CHQ_BANK, side = l[2] > 0 ? 2 : 1;
            if (e[4] < f || e[4] > t) return;
            rows.push([e[4], e[2], i + 1, a.bc, a.name, side, e[1], e[2], e[3], e[5].indexOf(cn(q[4])) < 0 ? e[5] + ' - ' + cn(q[4]) : e[5],
                H.r2(l[2]), H.r2(l[3]), 0, pf && side === 1 && e[2] === 21 ? e[0] : null, q[1]]);   // transferKey: the deposit entry id
        });
        var st = q[9] === 'P' ? 'P' : q[9] === 'B' ? 'B' : 'D', sd = st === 'B' ? q[11] : st === 'D' ? q[10] : q[2];
        var h = [q[1], q[8], cn(q[4]), sn(q[5]), st, sd, where(q) || o.pf.name, 'Cheque ' + q[1] + ' - ' + q[7] + ', due ' + H.dmy(q[3]), T_RCPT, o.ser, q[2]];
        return { ok: 1, asof: H.asOf, from: f, to: t, h: h, rows: rows };
    }

    S.CHEQUES_AJAX = function (p) {
        var cmd = String(p.x01 || '').toLowerCase();
        if (cmd === 'run') return run(p);
        if (cmd === 'find') return find(p);
        if (cmd === 'chq') return chq(p);
        return { error: 'unknown command' };
    };
})();
