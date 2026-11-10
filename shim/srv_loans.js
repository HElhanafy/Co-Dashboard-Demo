(function () {
    var S = window.DEMO_SRV, H = window.DEMO_H;
    var TODAY = H.today.slice(6, 10) + '-' + H.today.slice(3, 5) + '-' + H.today.slice(0, 2), NOW = H.today + ' 09:30', USER = 'Demo Manager';
    function pad(n) { return (n < 10 ? '0' : '') + n; }
    function utc(s) { return Date.UTC(+s.substr(0, 4), +s.substr(5, 2) - 1, +s.substr(8, 2)); }
    function iso(t) { var d = new Date(t); return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()); }
    function days(a, b) { return Math.round((utc(b) - utc(a)) / 864e5); }
    function addD(s, n) { return iso(utc(s) + n * 864e5); }
    function lastDay(s) { return iso(Date.UTC(+s.substr(0, 4), +s.substr(5, 2), 0)); }
    function r2(x) { return Math.round(x * 100) / 100; }
    function f2(x) { return (Math.round(x * 100) / 100).toFixed(2); }
    function f4(x) { return x === null || x === undefined ? null : (+x).toFixed(4); }
    // the loans: drawdowns of the last months relative to the demo day
    var d0 = addD(TODAY, -16), d1 = addD(TODAY, -14), d2 = addD(TODAY, -12), d3 = addD(TODAY, -12), d9 = addD(TODAY, -78), d8 = addD(TODAY, -262);
    var M = {
        seq: 0, acc: [], log: [],
        loans: [
            { id: 1, code: 'CPMCIB AM' + d0.substr(8, 2) + d0.substr(5, 2) + d0.substr(2, 2) + '-14', tr: +(d0.substr(8, 2) + d0.substr(5, 2) + d0.substr(2, 2) + '14'), draw: d0, p: 875864.89, fx: 5, sb: 4.85, st: 'APPROVED', sup: 'BLUE RIVER MEDICAL', acc: 211001002000, ser: 1 },
            { id: 2, code: 'CPMCIB AM' + d1.substr(8, 2) + d1.substr(5, 2) + d1.substr(2, 2) + '-11', tr: +(d1.substr(8, 2) + d1.substr(5, 2) + d1.substr(2, 2) + '11'), draw: d1, p: 849285.35, fx: 5, sb: null, st: 'NEW', sup: 'BLUE RIVER MEDICAL', acc: 211001002000, ser: 2 },
            { id: 3, code: 'CPMCIB R511172-72', tr: 51117272, draw: d2, p: 770929.71, fx: 5, sb: null, st: 'NEW', sup: 'NORTH SUPPLIES', acc: 211001001000, ser: 3 },
            { id: 4, code: 'CPMCIB AM' + d3.substr(8, 2) + d3.substr(5, 2) + d3.substr(2, 2) + '-13', tr: +(d3.substr(8, 2) + d3.substr(5, 2) + d3.substr(2, 2) + '13'), draw: d3, p: 775139.63, fx: 5, sb: 4.85, st: 'APPROVED', sup: 'BLUE RIVER MEDICAL', acc: 211001002000, ser: 4 },
            { id: 5, code: 'CPMCIB AN' + d9.substr(8, 2) + d9.substr(5, 2) + d9.substr(2, 2) + '-1', tr: +(d9.substr(8, 2) + d9.substr(5, 2) + d9.substr(2, 2) + '1'), draw: d9, p: 1941109.31, fx: 5, sb: 4.6, st: 'REPAID', sup: 'GLOVE WORKS', acc: 211001004000, ser: 5,
              rtype: 1010202, rser: 7, rdate: addD(TODAY, -7), ramt: 1987261.49, rpby: USER, rpat: NOW },
            { id: 6, code: 'CPMCIB AM' + d8.substr(8, 2) + d8.substr(5, 2) + d8.substr(2, 2) + '-9', tr: +(d8.substr(8, 2) + d8.substr(5, 2) + d8.substr(2, 2) + '9'), draw: d8, p: 640000, fx: 5, sb: 4.7, st: 'APPROVED', sup: 'NORTH SUPPLIES', acc: 211001001000, ser: 6 }
        ],
        moves: [{ ser: 8, date: addD(TODAY, -2), amt: 884120.33, tr: null, ds: 'Repayment loan# ' + 'CPMCIB AM' + d0.substr(8, 2) + d0.substr(5, 2) + d0.substr(2, 2) + '-14', used: false }]
    };
    M.loans.forEach(function (L) { L.due = addD(L.draw, 270); L.apby = L.st === 'NEW' ? null : USER; L.apat = L.st === 'NEW' ? null : H.dmy(L.draw) + ' 10:00'; });
    function find(k) { var i; for (i = 0; i < M.loans.length; i++) { if (M.loans[i].id === k) { return M.loans[i]; } } return null; }
    function acc(k) { var i; for (i = 0; i < M.acc.length; i++) { if (M.acc[i].id === k) { return M.acc[i]; } } return null; }
    function rows(L) { var r = [], j; for (j = 0; j < M.acc.length; j++) { if (M.acc[j].loan === L.id) { r.push(M.acc[j]); } } r.sort(function (a, b) { return a.to < b.to ? -1 : a.to > b.to ? 1 : a.seq - b.seq; }); return r; }
    function schedule(L) {
        var j, r = rows(L), from = L.draw, to, run = 0, seq = 0, tot, rate = L.fx + L.sb, amt, lastTo = null;
        for (j = M.acc.length - 1; j >= 0; j--) { if (M.acc[j].loan === L.id && M.acc[j].st === 'PLANNED') { M.acc.splice(j, 1); } }
        for (j = 0; j < r.length; j++) { if (r[j].st === 'POSTED') { run += r[j].amt; seq = r[j].seq; lastTo = r[j].to; } }
        if (lastTo) { from = lastTo; }
        tot = r2(L.p * rate / 100 * 270 / 360);
        while (utc(from) < utc(L.due)) {
            to = lastDay(addD(from, 1)); if (utc(to) > utc(L.due)) { to = L.due; }
            seq++;
            amt = to === L.due ? r2(tot - run) : r2(L.p * rate / 100 * days(from, to) / 360);
            run = r2(run + amt);
            M.acc.push({ id: ++M.seq, loan: L.id, seq: seq, from: from, to: to, days: days(from, to), rate: rate, amt: amt, kind: 'M', st: 'PLANNED' });
            from = to;
        }
    }
    function post(a, who, when) { a.st = 'POSTED'; a.ey = +a.to.substr(0, 4); a.et = 101; a.en = (+a.to.substr(5, 2)) * 10000 + 40 + a.seq; a.edate = a.to; a.by = who; a.at = when || NOW; M.log.push([a.at, who, 'POST', 'month ' + H.dmy(a.to), null, f2(a.amt) + ' - entry 101/' + a.en + ' dated ' + H.dmy(a.to), a.loan]); }
    function postAll(L, when) { var r = rows(L), j; for (j = 0; j < r.length; j++) { if (r[j].st === 'PLANNED') { post(r[j], USER, when); } } }
    function posted(L) { var r = rows(L), v = 0, j; for (j = 0; j < r.length; j++) { if (r[j].st === 'POSTED') { v += r[j].amt; } } return r2(v); }
    // the opening state: the running loans booked at approval, the repaid one settled
    M.loans.forEach(function (L) {
        if (L.st === 'NEW') { M.log.push([H.dmy(L.draw) + ' 00:40', 'JOB', 'NEW', '1010201/' + L.ser, null, L.code + ' ' + f2(L.p) + ' ' + H.dmy(L.draw), L.id]); return; }
        M.log.push([H.dmy(L.draw) + ' 00:40', 'JOB', 'NEW', '1010201/' + L.ser, null, L.code + ' ' + f2(L.p) + ' ' + H.dmy(L.draw), L.id]);
        M.log.push([L.apat, USER, 'APPROVE', 'margin ' + L.fx + ' saibor ' + L.sb, 'NEW', 'APPROVED - months', L.id]);
        schedule(L); postAll(L, L.apat);
        if (L.st === 'REPAID') { repay(L, L.apat); }
    });
    function repay(L, when) {
        var r = rows(L), bank = r2(L.ramt - L.p), po = 0, j, n = 0, fr = L.draw, last = 0, a;
        for (j = r.length - 1; j >= 0; j--) { if (r[j].st === 'POSTED' && utc(r[j].to) > utc(L.rdate)) { r[j].st = 'CANCELLED'; r[j].cby = USER; r[j].cat = when || NOW; n++; } }
        for (j = M.acc.length - 1; j >= 0; j--) { if (M.acc[j].loan === L.id && M.acc[j].st === 'PLANNED') { M.acc.splice(j, 1); } }
        r = rows(L); for (j = 0; j < r.length; j++) { if (r[j].st === 'POSTED') { po += r[j].amt; fr = r[j].to; last = r[j].seq; } }
        a = { id: ++M.seq, loan: L.id, seq: last + 1, from: fr, to: L.rdate, days: days(fr, L.rdate), rate: L.fx + L.sb, amt: r2(bank - po), kind: 'F', st: 'PLANNED', note: 'bank interest ' + f2(bank) + ' - posted ' + f2(po) };
        M.acc.push(a); post(a, USER, when); L.bank = bank; L.st = 'REPAID'; L.rpby = USER; L.rpat = when || NOW;
        M.log.push([L.rpat, USER, 'REPAID', H.dmy(L.rdate), 'APPROVED', 'bank ' + f2(bank) + ' - final ' + f2(a.amt) + ' - ' + n + ' later months removed', L.id]);
        return { bank: bank, fin: a.amt, n: n };
    }
    function row(L) {
        var r = rows(L), pa = 0, pm = 0, pl = 0, tot = 0, cx = 0, j;
        for (j = 0; j < r.length; j++) { if (r[j].st === 'POSTED') { pa += r[j].amt; pm++; tot += r[j].amt; } else if (r[j].st === 'PLANNED') { pl++; tot += r[j].amt; } else { cx++; } }
        return [L.id, L.code, L.tr, L.draw, f2(L.p), f4(L.fx), f4(L.sb), L.due, L.st, L.sup, L.acc, f2(pa), pm, pl,
                L.rdate || null, L.ramt === undefined ? null : f2(L.ramt), L.bank === undefined ? null : f2(L.bank), 1010201, L.ser, +L.draw.substr(0, 4), 106, 100130 + L.ser, 360, 270,
                L.apby || null, L.apat || null, L.rtype || null, L.rser || null, L.rser ? +L.rdate.substr(0, 4) : null, L.rser ? 106 : null, L.rser ? 101100 + L.rser : null, L.rpby || null, L.rpat || null,
                'Loan# ' + L.code + ' - ' + L.sup + ' orders 2600' + (90 + L.ser) + ' & 2600' + (91 + L.ser), L.sup + ' CO', f2(tot), cx];
    }
    function err(m) { return { ok: 0, error: m }; }
    function loanOut(L) {
        var r = rows(L), m = [], j, a, mv = [], lg = [];
        for (j = 0; j < r.length; j++) { a = r[j]; m.push([a.id, a.seq, a.from, a.to, a.days, f4(a.rate), f2(a.amt), a.kind, a.st, a.ey || null, a.et || null, a.en === undefined ? null : a.en, a.edate || null, a.by || null, a.at || null, a.cby || null, a.cat || null, a.note || null]); }
        for (j = 0; j < M.moves.length; j++) { if (!M.moves[j].used) { mv.push([1010202, M.moves[j].ser, M.moves[j].date, f2(M.moves[j].amt), M.moves[j].tr, M.moves[j].ds]); } }
        for (j = M.log.length - 1; j >= 0 && lg.length < 30; j--) { if (M.log[j][6] === L.id) { lg.push(M.log[j].slice(0, 6)); } }
        return { ok: 1, adm: 1, today: TODAY, loan: row(L), months: m, moves: mv, log: lg };
    }
    S.LOANS_AJAX = function (p) {
        var cmd = String(p.x01 || '').toLowerCase(), id = +p.x02, o, i, y = 0, out, a, res;
        if (cmd === 'list') {
            out = { ok: 1, adm: 1, asof: H.today + ' 00:40', today: TODAY, fac: ['Demo Bank - supplier invoices financing', '5600000.00', '5.0000', 360, 270, 1010201, 1010202, 420402000000, 210204001000], loans: [], ytd: '0.00' };
            for (i = 0; i < M.loans.length; i++) { if (M.loans[i].st !== 'CANCELLED') { out.loans.push(row(M.loans[i])); } }
            for (i = 0; i < M.acc.length; i++) { if (M.acc[i].st === 'POSTED' && M.acc[i].to.substr(0, 4) === TODAY.substr(0, 4)) { y += M.acc[i].amt; } }
            out.ytd = f2(y); return out;
        }
        if (cmd === 'sync') { return { ok: 1, msg: 'Bank moves read - 0 new loan(s), 0 repayment(s) matched' }; }
        if (cmd === 'post' || cmd === 'unpost') {
            a = acc(id); if (!a) { return err('month not found'); } o = find(a.loan);
            if (cmd === 'post') { if (a.st !== 'PLANNED') { return err('This month is ' + a.st); } post(a, USER); return { ok: 1, msg: 'Month booked - entry 101/' + a.en + ' dated ' + H.dmy(a.to) }; }
            a.st = 'PLANNED'; delete a.en; delete a.by; M.log.push([NOW, USER, 'UNPOST', 'month ' + H.dmy(a.to), 'entry 101', 'OK', a.loan]); return { ok: 1, msg: 'Booking undone - the entry was removed from the ledger' };
        }
        o = find(id); if (!o) { return err('loan not found'); }
        if (cmd === 'loan') { return loanOut(o); }
        if (cmd === 'approve') {
            if (o.st !== 'NEW') { return err('Only a new loan can be approved (this one is ' + o.st + ')'); }
            o.fx = +p.x03; o.sb = +p.x04; o.st = 'APPROVED'; o.apby = USER; o.apat = NOW; schedule(o); M.log.push([NOW, USER, 'APPROVE', 'margin ' + o.fx + ' saibor ' + o.sb, 'NEW', 'APPROVED - ' + rows(o).length + ' months', o.id]); postAll(o);
            return { ok: 1, msg: 'Loan approved - ' + rows(o).length + ' months booked in the ledger, each dated at its month end' };
        }
        if (cmd === 'rate') {
            if (o.st !== 'APPROVED') { return err('The rate can change on an approved, open loan only'); }
            M.log.push([NOW, USER, 'RATE', 'margin+saibor', o.fx + ' + ' + o.sb, p.x03 + ' + ' + p.x04, o.id]); o.fx = +p.x03; o.sb = +p.x04;
            var rr = rows(o), q; for (q = rr.length - 1; q >= 0; q--) { if (rr[q].st === 'POSTED' && utc(rr[q].to) > utc(TODAY)) { rr[q].st = 'PLANNED'; delete rr[q].en; } }
            schedule(o); postAll(o); return { ok: 1, msg: 'Rate saved - months re-booked in the ledger at the new rate' };
        }
        if (cmd === 'link') { for (i = 0; i < M.moves.length; i++) { if (M.moves[i].ser === +p.x04) { M.moves[i].used = true; o.rtype = 1010202; o.rser = M.moves[i].ser; o.rdate = M.moves[i].date; o.ramt = M.moves[i].amt; } } M.log.push([NOW, USER, 'LINK', '1010202/' + p.x04, null, f2(o.ramt) + ' ' + H.dmy(o.rdate), o.id]); return { ok: 1, msg: 'Repayment move linked - check the figures, then approve the repayment' }; }
        if (cmd === 'unlink') { for (i = 0; i < M.moves.length; i++) { if (M.moves[i].ser === o.rser) { M.moves[i].used = false; } } o.rser = null; o.rtype = null; o.rdate = null; delete o.ramt; M.log.push([NOW, USER, 'UNLINK', '', null, null, o.id]); return { ok: 1, msg: 'Repayment move released' }; }
        if (cmd === 'repay') { if (!o.rser) { return err('No repayment move linked'); } if (o.ramt < o.p) { return err('The repayment is below the principal'); } res = repay(o); return { ok: 1, msg: 'Repayment approved - bank interest ' + f2(res.bank) + ', final entry ' + f2(res.fin) + ', ' + res.n + ' later month(s) removed' }; }
        if (cmd === 'unapprove') { for (i = M.acc.length - 1; i >= 0; i--) { if (M.acc[i].loan === o.id) { M.acc.splice(i, 1); } } o.st = 'NEW'; o.sb = null; o.apby = null; M.log.push([NOW, USER, 'UNAPPROVE', 'margin ' + o.fx + ' saibor', 'APPROVED', 'NEW - months removed (entries deleted in the ledger)', o.id]); return { ok: 1, msg: 'Approval undone - the loan is new again, its month entries removed from the ledger' }; }
        if (cmd === 'undorepay') { for (i = M.acc.length - 1; i >= 0; i--) { if (M.acc[i].loan === o.id && (M.acc[i].kind === 'F' || M.acc[i].st === 'CANCELLED')) { M.acc.splice(i, 1); } } o.st = 'APPROVED'; delete o.bank; o.rpby = null; schedule(o); postAll(o); M.log.push([NOW, USER, 'UNDO_REPAY', H.dmy(o.rdate), 'REPAID', 'APPROVED', o.id]); return { ok: 1, msg: 'Repayment undone - final entry removed from the ledger, the loan is running again and its months booked again' }; }
        if (cmd === 'cancel') { o.st = 'CANCELLED'; return { ok: 1, msg: 'Loan cancelled - it leaves the list' }; }
        return err('unknown command');
    };
    // the entry window: the loan entries live only here, so GL_ENTRY_AJAX answers them before the shared ledger data (two lines, as the live package writes them)
    var GL0 = S.GL_ENTRY_AJAX;
    S.GL_ENTRY_AJAX = function (p) {
        var y = +p.x02, t = +p.x03, n = +p.x04, i, a, L, ds, lines;
        if (t === 101) {
            for (i = 0; i < M.acc.length; i++) {
                a = M.acc[i];
                if (a.st === 'POSTED' && a.ey === y && a.en === n) {
                    L = find(a.loan);
                    ds = (a.kind === 'F' ? 'Loan interest settlement# ' + L.code + ' up to ' + H.dmy(a.to) : 'Loan interest# ' + L.code + ' month ' + a.to.substr(5, 2) + '-' + a.to.substr(0, 4)) + ' - ' + L.sup;
                    lines = [[1, 420402000000, 'Bank facilities finance cost', ds, a.amt, null, null, a.to, '', ''], [2, 210204001000, 'Accrued supplier invoices financing', ds, -a.amt, null, null, a.to, '', '']];
                    return { ok: 1, y: y, t: t, n: n, dt: a.to, ds: ds, lines: lines };
                }
            }
        }
        return GL0 ? GL0(p) : { error: 'entry not found' };
    };
})();
