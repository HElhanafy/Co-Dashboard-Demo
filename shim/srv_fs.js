/* srv_fs.js - FS hub (no processes) + shared ledger helpers H.LG for TB, FSIS, FSBS (included via "head") (24/10/2026) */
(function () {
    var D = window.DEMO, H = window.DEMO_H, G = H.LG = H.LG || {};
    function two(n) { return (n < 10 ? '0' : '') + n; }

    G.two = two;
    G.curM = H.today.slice(6, 10) + H.today.slice(3, 5);
    G.minM = H.base + '01';
    G.curY = +G.curM.slice(0, 4);
    G.curMo = +G.curM.slice(4, 6);
    G.prevM = function (m) {
        var y = +m.slice(0, 4), mm = +m.slice(4, 6);
        return mm === 1 ? (y - 1) + '12' : y + two(mm - 1);
    };
    G.fix = function (x) { var v = H.r2(x); return (v === 0 ? 0 : v).toFixed(2); };

    // chart of accounts: 1/2/4/6-digit codes; TB pads every node to 6 digits
    G.pad = function (c) { c = String(c); while (c.length < 6) c += '0'; return c; };
    G.acct = H.idx(D.accounts);
    G.name = function (a) { return (G.acct[a] || [])[1] || a; };
    G.LV = { 1: 1, 2: 2, 4: 3, 6: 4 };

    // cost centres: CC1 = branch (2 levels of 1 digit), CC2 = salesman (1 / 10 / rep code)
    G.cost1 = function () { return D.branches.map(function (b) { return { c: b[0], n: b[1], lv: 2 }; }); };
    G.cost2 = function () {
        return [{ c: '1', n: 'Sales Force', lv: 1 }, { c: '10', n: 'Sales Representatives', lv: 2 }]
            .concat(D.reps.map(function (r) { return { c: r[0], n: r[1], lv: 3 }; }));
    };
    G.clev = { c1: [1, 1], c2: [1, 2, 3] };

    // ledger lines sorted like V_GL_LINES_ALL: date, year, type, no, seq
    G.lines = function () {
        if (G._l) return G._l;
        var ent = {}, out = [];
        D.gl.forEach(function (e) { ent[e[0]] = e; });
        D.glL.forEach(function (l, i) {
            var e = ent[l[0]], d = e[4];
            out.push({ a: l[1], v: l[2] - l[3], dr: l[2], cr: l[3], c1: l[4] || '', c2: l[5] || '', s: l[6] || '',
                m: d.slice(0, 4) + d.slice(5, 7), d: d, y: e[1], t: e[2], n: e[3], ds: e[5], q: i });
        });
        out.sort(function (a, b) {
            return a.d < b.d ? -1 : a.d > b.d ? 1 : (a.y - b.y) || (a.t - b.t) || (a.n - b.n) || (a.q - b.q);
        });
        return (G._l = out);
    };
    G.byAcct = function () {
        if (G._ba) return G._ba;
        var o = {};
        G.lines().forEach(function (l) { (o[l.a] = o[l.a] || []).push(l); });
        return (G._ba = o);
    };
    // monthly net (debit - credit) per account: {acct: {YYYYMM: v}}
    G.monthly = function () {
        if (G._mo) return G._mo;
        var o = {};
        G.lines().forEach(function (l) { var r = o[l.a] || (o[l.a] = {}); r[l.m] = (r[l.m] || 0) + l.v; });
        return (G._mo = o);
    };
    G.isPL = function (a) { var c = String(a).charAt(0); return c === '4' || c === '5' || c === '6'; };

    // cost filters: prefix ranges like RPAD(prefix,9,'0'..'9'); '0' = lines without a centre
    G.costErr = function (c1, c2) {
        if (c1 && !/^[0-9]{1,9}$/.test(c1)) return 'bad cost1';
        if (c2 && !/^[0-9]{1,9}(:[0-9]{1,9})*$/.test(c2)) return 'bad cost2';
        return null;
    };
    function hit(code, p) { return p === '0' ? code === '' : (code !== '' && code.indexOf(p) === 0); }
    G.costFn = function (c1, c2) {
        var l2 = c2 ? String(c2).split(':') : null;
        return function (l) {
            if (c1 && !hit(l.c1, String(c1))) return false;
            if (l2) { for (var i = 0; i < l2.length; i++) if (hit(l.c2, l2[i])) return true; return false; }
            return true;
        };
    };

    // ledger statement of FS_AJAX_CORE 'stmt' (movement window, or cumulative with an OPENING row)
    G.stmt = function (p, openAdj) {
        var acc = String(p.x08 || '');
        if (!/^[0-9]{1,15}$/.test(acc)) return { err: 'bad account' };
        var e = G.costErr(p.x02, p.x03); if (e) return { err: e };
        var cf = G.costFn(p.x02, p.x03);
        var yf = +p.x04 || H.base, yt = +p.x05 || 9999, mf = +p.x06 || 1, mt = +p.x07 || 12;
        var cum = p.x11 === 'cumulative', from = yf + two(mf), upto = yt + two(mt);
        var out = [], open = 0, cnt = 0;
        (G.byAcct()[acc] || []).forEach(function (l) {
            if (!cf(l)) return;
            if (cum) {
                if (l.m > upto) return;
                if (l.m < from) { open += l.v; return; }
            } else {
                var y = +l.m.slice(0, 4), mo = +l.m.slice(4, 6);
                if (y < yf || y > yt || mo < mf || mo > mt) return;
            }
            if (cnt >= 5000) return;
            cnt++;
            out.push({ dt: l.d, no: l.t + '/' + l.n, y: l.y, t: l.t, n: l.n, ds: l.ds,
                c1: l.c1 || '0', c2: l.c2 || '0', v: H.r2(l.v) });
        });
        if (cum) {
            if (openAdj) open += openAdj(acc, p, yf);
            var d0 = new Date(Date.UTC(yf, mf - 1, 1) - 864e5).toISOString().slice(0, 10);
            out.unshift({ dt: d0, no: 'OPENING', y: 0, t: 0, n: 0,
                ds: 'رصيد افتتاحي حتى ' + H.dmy(d0),
                c1: '', c2: '', v: H.r2(open) });
        }
        return { lines: out, trunc: cnt >= 5000 ? 1 : 0 };
    };

    // fs-meta / fs-cost islands shared by FSIS and FSBS
    G.fsIslands = function () {
        return [{ id: 'fs-cost1', data: G.cost1() }, { id: 'fs-cost2', data: G.cost2() }, { id: 'fs-clevels', data: G.clev },
            { id: 'fs-meta', data: { admin: 1, asOf: H.asOf, curM: G.curM, minY: H.base, curY: G.curY,
                defYF: G.curY - 1, defYT: G.curY, defMF: 1, defMT: G.curMo } }];
    };
})();
