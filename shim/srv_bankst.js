(function () {
    var D = window.DEMO, S = window.DEMO_SRV, H = window.DEMO_H;
    var TODAY = H.today.slice(6, 10) + '-' + H.today.slice(3, 5) + '-' + H.today.slice(0, 2), MIN_D = D.meta.start, CHQ_BANK = 901;
    var T_OPEN = 1, T_RCPT = 20, T_CHQDEP = 21, T_CHQBNC = 22, T_BANKTRF = 81;

    // the bank-module accounts: banks (code = GL account) then one cheque portfolio per branch (code 901 + branch)
    function build() {
        if (H.bank) return H.bank;
        var B = { accts: [], byCode: {}, byGl: {}, lines: {}, ent: {}, key: {}, ty: {} };
        D.banks.forEach(function (b) {
            var m = /Bank (\d+)/.exec(b[1]);
            B.accts.push({ code: b[0], name: b[1], bc: m ? +m[1] : 1, gl: b[0], cur: b[2] });
        });
        D.branches.forEach(function (br) {
            var gl = '1103' + ('0' + br[0]).slice(-2), a = H.acct[gl];
            B.accts.push({ code: '901' + ('0' + br[0]).slice(-2), name: a ? a[1] : 'Cheques - ' + br[1], bc: CHQ_BANK, gl: gl, cur: 'SAR',
                city: br[1].replace(/ Branch$/, '') });
        });
        B.accts.forEach(function (a) { B.byCode[a.code] = a; B.byGl[a.gl] = a; B.lines[a.code] = []; });
        D.gl.forEach(function (e) { B.key[e[1] + '/' + e[2] + '/' + e[3]] = e[0]; });
        D.glL.forEach(function (l, i) {
            (B.ent[l[0]] = B.ent[l[0]] || []).push(i);
            var a = B.byGl[l[1]]; if (a) B.lines[a.code].push(i);
        });
        Object.keys(B.lines).forEach(function (c) {
            B.lines[c].sort(function (x, y) {
                var a = D.gl[D.glL[x][0] - 1][4], b = D.gl[D.glL[y][0] - 1][4];
                return a < b ? -1 : a > b ? 1 : x - y;
            });
        });
        D.entryTypes.forEach(function (t) { B.ty[t[0]] = t[1]; });
        B.rcpt = H.idx(D.rcpt); B.chq = H.idx(D.chq); B.spay = H.idx(D.spay);
        B.alloc = {};
        D.alloc.forEach(function (a) { var r = H.inv[a[1]]; if (!B.alloc[a[0]] && r && r[14] === 'I') B.alloc[a[0]] = r; });
        B.entry = function (i) { return D.gl[D.glL[i][0] - 1]; };
        B.entryOfKey = function (k) { return k ? B.key[k[0] + '/' + k[1] + '/' + k[2]] : null; };
        B.src = function (e) {   // {k:'RC'|'CHQ'|'SP', r:row}
            var m = /^(RC|CHQ|SP):(\d+)$/.exec(e[6] || ''); if (!m) return null;
            return { k: m[1], r: (m[1] === 'RC' ? B.rcpt : m[1] === 'CHQ' ? B.chq : B.spay)[+m[2]] };
        };
        B.chqOf = function (e) {
            var s = B.src(e); if (!s || !s.r) return null;
            return s.k === 'CHQ' ? s.r : s.k === 'RC' && s.r[10] ? B.chq[s.r[10]] : null;
        };
        // movement facts of one bank/portfolio GL line
        B.fact = function (i) {
            var l = D.glL[i], e = B.entry(i), a = B.byGl[l[1]], s = B.src(e), q = B.chqOf(e), t = e[2];
            var f = { i: i, a: a, e: e, t: t, ser: i + 1, d: e[4], dr: H.r2(l[2]), cr: H.r2(l[3]), side: l[2] > 0 ? 2 : 1, desc: e[5], doc: '',
                chq: q, cu: null, sm: null, sup: null, inv: null };
            f.eff = t === T_OPEN ? 2 : (q || t === T_CHQDEP || t === T_CHQBNC) ? 0 : 1;
            if (s && s.r) {
                if (s.k === 'RC') { f.doc = s.r[1]; f.cu = s.r[3]; f.sm = s.r[4]; f.inv = B.alloc[s.r[0]] || null; }
                else if (s.k === 'CHQ') { f.doc = s.r[1]; f.cu = s.r[4]; f.sm = s.r[5]; }
                else { f.doc = s.r[1]; f.sup = s.r[3]; }
            }
            if (q) { f.doc = q[1]; f.cu = q[4]; f.sm = f.sm || q[5]; }
            if (q && t !== T_RCPT && H.cust[q[4]]) f.desc += ' - ' + H.cust[q[4]][1];
            return f;
        };
        return (H.bank = B);
    }

    function dates(p) {
        var f = /^\d{4}-\d{2}-\d{2}$/.test(p.x02 || '') ? p.x02 : TODAY.slice(0, 8) + '01',
            t = /^\d{4}-\d{2}-\d{2}$/.test(p.x03 || '') ? p.x03 : '';
        if (f < MIN_D) f = MIN_D;
        if (f > TODAY) f = TODAY;
        if (!t || t < f || t > TODAY) t = TODAY;
        return { f: f, t: t };
    }
    function sums(B, code, dt) {
        var o = 0, dr = 0, cr = 0, n = 0, rows = [];
        B.lines[code].forEach(function (i) {
            var l = D.glL[i], d = B.entry(i)[4];
            if (d > dt.t) return;
            if (d < dt.f) { o += l[2] - l[3]; return; }
            dr += l[2]; cr += l[3]; n++; rows.push(i);
        });
        return { o: H.r2(o), dr: H.r2(dr), cr: H.r2(cr), n: n, rows: rows, c: H.r2(o + dr - cr) };
    }

    function run(p) {
        var B = build(), dt = dates(p), acc = [];
        B.accts.forEach(function (a) {
            var s = sums(B, a.code, dt);
            acc.push([a.code, a.name, a.bc, a.gl, s.o, s.dr, s.cr, s.n, s.c]);
        });
        return { ok: 1, asof: H.asOf, from: dt.f, to: dt.t, acc: acc };
    }

    function stmt(p) {
        var B = build(), dt = dates(p), a = B.byCode[String(p.x04 || '').trim()];
        if (!a) return { error: 'account not found' };
        var s = sums(B, a.code, dt), rows = s.rows.map(function (i) {
            var f = B.fact(i), r = [f.d, f.t, f.ser, f.eff, f.side, f.e[1], f.e[2], f.e[3], f.doc || null, f.desc, f.dr, f.cr];
            if (f.inv) r.push(H.T_INV, f.inv[0], f.inv[1]);
            if (f.eff === 1 && f.side === 1 && f.sup && (H.sup[f.sup] || [])[2] === 'USD') { while (r.length < 16) r.push(null); r.push(1); }
            return r;
        });
        return { ok: 1, asof: H.asOf, from: dt.f, to: dt.t, code: a.code, name: a.name, bank: a.bc, acc: a.gl, open: s.o, glo: s.o, glc: s.c,
            ty: B.ty, rows: rows, dif: [] };
    }

    function mov(p) {
        var B = build(), i = (+p.x03) - 1, l = D.glL[i];
        if (!l || !B.byGl[l[1]] || B.entry(i)[2] !== +p.x02) return { ok: 1, asof: H.asOf, h: null, ey: null, et: null, en: null, ent: [] };
        var f = B.fact(i), e = f.e, a = f.a, q = f.chq, other = null, ob = null;
        if (f.t === T_BANKTRF) (B.ent[e[0]] || []).forEach(function (j) { if (j !== i && B.byGl[D.glL[j][1]]) { other = j; ob = B.byGl[D.glL[j][1]]; } });
        var bt = f.cu ? 3 : f.sup ? 5 : null, bc = f.cu || f.sup || null,
            bn = f.cu ? (H.cust[f.cu] || [])[1] : f.sup ? (H.sup[f.sup] || [])[1] : null;
        var sp = B.src(e), usd = a.cur === 'USD';
        var h = [a.code, a.name, f.t, f.ser, B.ty[f.t] || '', f.d, H.r2(f.dr - f.cr), f.eff, f.side, f.doc || null, f.desc,
            sp && sp.k === 'SP' && sp.r[5] === 'USD' ? 'USD ' + sp.r[6].toFixed(2) + ' at 3.75' : '',
            q ? q[1] : null, q ? q[2] : null, q ? q[3] : null, 1, e[1], e[2], e[3],
            other !== null ? f.t : null, other !== null ? other + 1 : null, bt, bc, bn || null,
            f.sm && H.rep[f.sm] ? H.rep[f.sm][1] : null, D.meta.user || 'ADMIN', usd ? 'USD' : 1, usd ? D.meta.usd : 1,
            l[4] && H.branch[l[4]] ? H.branch[l[4]][1] : null, l[5] && H.rep[l[5]] ? H.rep[l[5]][1] : null, null,
            f.inv ? H.T_INV : null, f.inv ? f.inv[0] : null, f.inv ? f.inv[1] : null, a.gl, ob ? ob.name : null, null];
        var ent = (B.ent[e[0]] || []).map(function (j, k) {
            var x = D.glL[j], nm = (H.acct[x[1]] || [])[1] || x[1];
            if (x[6]) nm += ' - ' + ((H.cust[x[6]] || H.sup[x[6]] || [])[1] || x[6]);
            return [k + 1, x[1], nm, e[5], H.r2(x[2] - x[3]), x[4] || null, j === i ? 1 : 0];
        });
        return { ok: 1, asof: H.asOf, h: h, ey: e[1], et: e[2], en: e[3], ent: ent };
    }

    S.BANKST_AJAX = function (p) {
        var cmd = String(p.x01 || '').toLowerCase();
        if (cmd === 'run') return run(p);
        if (cmd === 'stmt') return stmt(p);
        if (cmd === 'mov') return mov(p);
        return { error: 'unknown command' };
    };
    H.bankBuild = build;
})();
