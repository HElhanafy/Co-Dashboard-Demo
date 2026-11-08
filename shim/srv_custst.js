(function () {
    var D = window.DEMO, S = window.DEMO_SRV, H = window.DEMO_H;
    var TODAY = H.today.slice(6, 10) + '-' + H.today.slice(3, 5) + '-' + H.today.slice(0, 2), MIN_D = D.meta.start;
    var AR = { INV: 101, RET: 102, RCP: 103, RCH: 104, OPN: 107 };
    var TN = { INV: 'Sales invoice', RET: 'Sales return', RCP: 'Customer receipt', RCH: 'Bounced cheque', OPN: 'Opening balance' };
    var SUPV = H.idx(D.supervisors), CHQ = H.idx(D.chq), BANK = H.idx(D.banks), CHQB = {};
    D.chq.forEach(function (q) { if (q[15]) CHQB[q[15].join('/')] = q; });

    function day(iso) { return Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / 864e5; }
    function r2(x) { return H.r2(x); }
    function repName(r) { return H.rep[r] ? H.rep[r][1] : ''; }

    // ledger movements: {k, id, cu, d, dr, cr, br, rep, doc, desc, e, st, ss, days, pm, bank, box, src}
    function moves() {
        if (H._cum) return H._cum;
        var L = [], by = {};
        function add(m) { m.key = m.ar + '|' + m.id; L.push(m); by[m.key] = m; }
        D.inv.forEach(function (r) {
            var k = r[14] === 'O' ? 'OPN' : r[14] === 'B' ? 'RCH' : 'INV', m = { k: k, ar: AR[k], id: r[0], cu: r[4], d: r[2], dr: r[11], cr: 0,
                br: +r[6] || 1, rep: r[5], doc: r[1], e: r[13], st: null, ss: null, days: null, pm: null, bank: null, box: null, src: r };
            if (k === 'INV') { m.st = H.T_INV; m.ss = r[0]; m.days = Math.round(day(r[3]) - day(r[2])); m.desc = 'Sales invoice ' + r[1]; }
            else if (k === 'OPN') m.desc = 'Opening balance - invoice ' + r[1] + ' of ' + H.dmy(r[2]);
            else {
                var q = CHQB[(r[13] || []).join('/')];
                if (q) { m.doc = q[1]; m.bank = q[13] || null; m.desc = 'Bounced cheque ' + q[1] + ' - ' + q[7] + ', returned ' + H.dmy(q[11]); }
                else m.desc = 'Bounced cheque ' + r[1];
            }
            add(m);
        });
        D.ret.forEach(function (r) {
            add({ k: 'RET', ar: AR.RET, id: r[0], cu: r[3], d: r[2], dr: 0, cr: r[10], br: +r[5] || 1, rep: r[4], doc: r[1], e: r[12],
                st: H.T_RET, ss: r[0], days: null, pm: null, bank: null, box: null, src: r,
                desc: 'Sales return ' + r[1] + (H.inv[r[7]] ? ' of invoice ' + H.inv[r[7]][1] : '') });
        });
        D.rcpt.forEach(function (r) {
            var m = { k: 'RCP', ar: AR.RCP, id: r[0], cu: r[3], d: r[2], dr: 0, cr: r[8], br: +r[5] || 1, rep: r[4], doc: r[1], e: r[9],
                st: null, ss: null, days: null, pm: r[6] === 'CASH' ? 2 : 1, bank: null, box: null, src: r }, q = r[10] ? CHQ[r[10]] : null;
            if (r[6] === 'CHQ' && q) {
                m.doc = q[1]; m.bank = q[13] || null;
                m.desc = 'Cheque ' + q[1] + ' - ' + q[7] + ', due ' + H.dmy(q[3]) + (q[9] === 'B' ? ' (bounced ' + H.dmy(q[11]) + ')' : q[9] === 'P' ? ' (in portfolio)' : '');
            } else if (r[6] === 'TRF') { m.bank = r[7]; m.desc = 'Bank transfer to ' + (BANK[r[7]] ? BANK[r[7]][1] : r[7]); }
            else { m.box = r[7]; m.desc = 'Cash receipt - ' + ((H.acct[r[7]] || [])[1] || r[7]); }
            add(m);
        });
        L.sort(function (a, b) { return a.d < b.d ? -1 : a.d > b.d ? 1 : a.ar - b.ar || a.id - b.id; });
        var cu = {};
        L.forEach(function (m) { (cu[m.cu] = cu[m.cu] || []).push(m); });
        return (H._cum = { list: L, by: by, cu: cu });
    }

    // today's open items: the replay() of srv_smcard.js, also logging who settled what (pairs [credit key, debit key, amount])
    function replay() {
        if (H._cur) return H._cur;
        var ev = {}, al = {}, out ={ open: {}, adv: {}, pairs: [] };
        function add(c, e) { (ev[c] = ev[c] || []).push(e); }
        D.alloc.forEach(function (a) { (al[a[0]] = al[a[0]] || []).push(a); });
        D.inv.forEach(function (r) { add(r[4], [r[2], r[14] === 'O' ? 0 : r[14] === 'I' ? 1 : 4, r[0], 'D', r]); });
        D.ret.forEach(function (r) { add(r[3], [r[2], 2, r[0], 'R', r]); });
        D.rcpt.forEach(function (r) { add(r[3], [r[2], 3, r[0], 'P', r]); });
        function dkey(r) { return (r[14] === 'O' ? AR.OPN : r[14] === 'B' ? AR.RCH : AR.INV) + '|' + r[0]; }
        D.customers.forEach(function (c) {
            var cc = c[0], es = (ev[cc] || []).sort(function (a, b) {
                return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] - b[1] || a[2] - b[2];
            }), open = [], byId = {}, adv = 0, advQ = [];
            function credit(amt, src) {
                for (var j = 0; j < open.length && amt > 0.004; j++) {
                    var o = open[j]; if (o.v <= 0.004) continue;
                    var a = Math.min(o.v, amt); o.v = r2(o.v - a); amt = r2(amt - a);
                    if (a > 0.004) out.pairs.push([src, o.k, r2(a)]);
                }
                return amt;
            }
            es.forEach(function (e) {
                var r = e[4], rest;
                if (e[3] === 'D') {
                    var o = { r: r, v: r[11], k: dkey(r) }; open.push(o); byId[r[0]] = o;
                    if (r[14] === 'B' && adv) {   // the advance is spent FIFO by source; same totals as one credit(adv)
                        var q = advQ; advQ = []; adv = 0;
                        q.forEach(function (s) { var left = credit(s.v, s.k); if (left > 0.004) advQ.push({ k: s.k, v: left }); });
                        advQ.forEach(function (s) { adv = r2(adv + s.v); });
                    }
                } else {
                    var src = (e[3] === 'R' ? AR.RET : AR.RCP) + '|' + r[0];
                    if (e[3] === 'R') rest = r[10];
                    else {
                        rest = r[8];
                        (al[r[0]] || []).forEach(function (a) {
                            var x = byId[a[1]], v = x ? Math.min(x.v, a[2]) : 0;
                            if (x) { x.v = r2(x.v - v); if (v > 0.004) out.pairs.push([src, x.k, r2(v)]); }
                            rest = r2(rest - v);
                        });
                        if (!(rest > 0.004)) rest = 0;
                    }
                    if (rest) { var left = credit(rest, src); if (left > 0.004) { advQ.push({ k: src, v: left }); } adv = r2(adv + left); }
                }
            });
            open.forEach(function (o) { if (o.v > 0.004) out.open[o.k] = o.v; });
            out.adv[cc] = adv;
        });
        return (H._cur = out);
    }

    // aging of today's open items: [credit, b0..b5, overdue, total]
    function aging(cc) {
        var R = replay(), M = moves().cu[cc] || [], t = day(TODAY), a = [-(R.adv[cc] || 0), 0, 0, 0, 0, 0, 0, 0, 0];
        M.forEach(function (m) {
            var v = R.open[m.key]; if (!v) return;
            var age = t - day(m.d), b = age <= 30 ? 0 : age <= 60 ? 1 : age <= 90 ? 2 : age <= 120 ? 3 : age <= 150 ? 4 : 5;
            a[1 + b] += v; if (t > day(m.src[3] || m.d)) a[7] += v;
        });
        a[8] = a[0] + a[1] + a[2] + a[3] + a[4] + a[5] + a[6];
        return a.map(r2);
    }

    function dates(p) {
        var f = /^\d{4}-\d{2}-\d{2}$/.test(p.x02 || '') ? p.x02 : TODAY.slice(0, 4) + '-01-01',
            t = /^\d{4}-\d{2}-\d{2}$/.test(p.x03 || '') ? p.x03 : '';
        if (f < MIN_D) f = MIN_D;
        if (f > TODAY) f = TODAY;
        if (!t || t < f || t > TODAY) t = TODAY;
        return { f: f, t: t };
    }
    function smRow(code) {
        var r = H.rep[code]; if (!r) return null;
        var s = SUPV[r[3]];
        return [r[1], s ? s[0] : r[0], s ? s[1] : r[1], 0];
    }

    function run(p) {
        var dt = dates(p), cm = moves().cu, cust = [], sm = {};
        D.customers.forEach(function (c) {
            var o = 0, dr = 0, cr = 0, n = 0;
            (cm[c[0]] || []).forEach(function (m) {
                if (m.d > dt.t) return;
                if (m.d < dt.f) o += m.dr - m.cr; else { dr += m.dr; cr += m.cr; n++; }
            });
            if (Math.abs(o) < 0.005 && !n) return;
            var a = aging(c[0]);
            cust.push([c[0], c[1], 0, c[6], c[5], c[7], r2(o), r2(dr), r2(cr), n, 0, 0].concat(a));
            if (!sm[c[7]]) sm[c[7]] = smRow(c[7]);
        });
        cust.sort(function (a, b) { return a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : a[0] < b[0] ? -1 : 1; });
        return { ok: 1, asof: H.asOf, from: dt.f, to: dt.t, cust: cust, sm: sm };
    }

    function stmt(p) {
        var dt = dates(p), c = H.cust[String(p.x04 || '').trim()];
        if (!c) return { error: 'not allowed' };
        var R = replay(), o = 0, rows = [], s = smRow(c[7]) || ['', '', '', 0];
        (moves().cu[c[0]] || []).forEach(function (m) {
            if (m.d > dt.t) return;
            if (m.d < dt.f) { o += m.dr - m.cr; return; }
            rows.push([m.d, m.k, m.ar, m.id, m.br, 1, m.st, m.ss, m.doc, m.desc, r2(m.dr), r2(m.cr), 1, m.days,
                m.e ? m.e[0] : null, m.e ? m.e[1] : null, m.e ? m.e[2] : null, m.dr ? (R.open[m.key] || 0) : 0, m.pm]);
        });
        return { ok: 1, asof: H.asOf, from: dt.f, to: dt.t, c: [c[0], c[1], c[1], 0, c[6], c[5], c[7], repName(c[7]), s[1], s[2]],
            open: r2(o), ag: aging(c[0]), rows: rows, pend: [] };
    }

    function mov(p) {
        var MV = moves(), key = (+p.x02) + '|' + (+p.x03), m = MV.by[key];
        if (!m) return { ok: 1, asof: H.asOf, h: null, set: [], by: [] };
        var R = replay(), c = H.cust[m.cu], set = {}, sl = [], by = {}, bl = [], all = {};
        R.pairs.forEach(function (x) {
            all[x[1]] = (all[x[1]] || 0) + x[2];
            if (x[0] === key) { if (!set[x[1]]) { set[x[1]] = 0; sl.push(x[1]); } set[x[1]] += x[2]; }
            if (x[1] === key) { if (!by[x[0]]) { by[x[0]] = 0; bl.push(x[0]); } by[x[0]] += x[2]; }
        });
        function dsort(a, b) { var x = MV.by[a], y = MV.by[b]; return x.d < y.d ? -1 : x.d > y.d ? 1 : x.ar - y.ar || x.id - y.id; }
        sl.sort(dsort); bl.sort(dsort);
        var h = [m.cu, c ? c[1] : '', m.ar, m.id, m.br, 1, m.d, m.k, TN[m.k], r2(m.dr), r2(m.cr), 1, m.doc, m.desc,
            m.e ? m.e[0] : null, m.e ? m.e[1] : null, m.e ? m.e[2] : null, m.pm, m.st, m.ss, m.days, m.bank, m.box, m.rep, D.meta.user || 'ADMIN'];
        return { ok: 1, asof: H.asOf, h: h,
            set: sl.map(function (k) { var x = MV.by[k]; return [x.ar, x.id, x.br, 1, x.d, x.k, x.st, x.ss, x.days, r2(x.dr - x.cr), r2(set[k]), r2(all[k] || 0)]; }),
            by: bl.map(function (k) { var x = MV.by[k]; return [x.ar, x.id, x.br, 1, x.d, x.k, x.doc, r2(by[k])]; }) };
    }

    function find(p) {
        var q = String(p.x02 || '').trim().toUpperCase(), list = [];
        if (q.length >= 2) D.customers.forEach(function (c) {
            if (c[1].toUpperCase().indexOf(q) >= 0 || c[0].indexOf(q) >= 0) list.push([c[0], c[1], repName(c[7])]);
        });
        list.sort(function (a, b) { return a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : a[0] < b[0] ? -1 : 1; });
        return { ok: 1, list: list.slice(0, 15) };
    }

    S.CUSTST_AJAX = function (p) {
        var cmd = String(p.x01 || '').toLowerCase();
        if (cmd === 'run') return run(p);
        if (cmd === 'stmt') return stmt(p);
        if (cmd === 'mov') return mov(p);
        if (cmd === 'find') return find(p);
        return { error: 'unknown command' };
    };
})();
