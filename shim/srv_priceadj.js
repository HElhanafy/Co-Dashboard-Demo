(function () {
    var D = window.DEMO, S = window.DEMO_SRV, H = window.DEMO_H;
    var USER = D.meta.user || 'ADMIN', NOW = H.asOf.slice(0, 16);
    var r4 = function (v) { return Math.round(v * 10000) / 10000; };
    var price = {}, drafts = {}, batches = [], seq = 0;

    // demo item = one unit; the page shows two: the base unit (x1) and a box of 10, the box being the default unit
    function units(i) {
        var big = i[3] === 'BOX' ? 'CTN' : 'BOX', p1 = price[i[0] + '|1'], p2 = price[i[0] + '|2'];
        return [[1, i[3], 1, p1 !== undefined ? p1 : i[5], 0], [2, big, 10, p2 !== undefined ? p2 : r4(i[5] * 10), 1]];
    }
    function ok(i) { return i && i[7] && i[2] !== null && i[2] >= 0 && i[5] > 0; }
    function clsOf(i) { return String(i[2] + 1); }

    window.DEMO_RENDERERS.priceadj = function () {
        var k = {};
        D.items.forEach(function (i) { if (ok(i)) k[i[2]] = (k[i[2]] || 0) + 1; });
        return [{ id: 'pa-data', data: { cost: 1, user: USER, today: H.today,
            classes: D.classes.map(function (n, i) { return [String(i + 1), n, n, k[i] || 0]; }).filter(function (c) { return c[3] > 0; }) } }];
    };

    function batchRow(b) {
        return [b.no, b.st, b.cls, D.classes[+b.cls - 1] || b.cls, USER, b.created, b.saved, b.appBy || null, b.appAt || null, b.revBy || null, b.revAt || null,
                b.items, b.units || null, b.refused === undefined ? null : b.refused, b.msg || null];
    }

    S.PRICEADJ_AJAX = function (p) {
        var a = p.x01, b, i;
        if (a === 'items') {
            var d = drafts[p.x02];
            return { cost: 1, draft: d ? { no: d.no, saved: d.saved, msg: null, lines: d.lines } : null,
                     rows: D.items.filter(function (x) { return ok(x) && clsOf(x) === p.x02; })
                                  .map(function (x) { return [1, x[0], x[1], x[1], x[6], units(x)]; }) };
        }
        if (a === 'find') {
            var t = String(p.x02 || '').toUpperCase();
            return { rows: D.items.filter(function (x) { return ok(x) && (x[0].indexOf(t) === 0 || x[1].toUpperCase().indexOf(t) !== -1); })
                                  .slice(0, 20).map(function (x) { return [x[0], x[1], x[1], clsOf(x)]; }) };
        }
        if (a === 'save') {
            var f2 = [].concat(p.f02 || []), f6 = [].concat(p.f06 || []), f8 = [].concat(p.f08 || []), L = {};
            d = drafts[p.x02];
            if (!f2.length) { if (d) { batches = batches.filter(function (z) { return z.no !== d.no; }); delete drafts[p.x02]; } return { ok: 1, no: null, saved: NOW }; }
            f2.forEach(function (c, n) { L[c] = [r4(+f6[n]), f8[n] || 'MANUAL']; });
            if (!d) { d = drafts[p.x02] = { no: ++seq, cls: p.x02, st: 'DRAFT', created: NOW }; batches.push(d); }
            d.lines = L; d.saved = NOW; d.items = f2.length;
            return { ok: 1, no: d.no, saved: NOW };
        }
        b = null;
        for (i = 0; i < batches.length; i++) { if (batches[i].no === +p.x02) b = batches[i]; }
        if (a === 'apply' || a === 'reverse' || a === 'cancel') {
            if (!b) return { ok: 0, msg: 'ERROR price change not found' };
            if (a === 'cancel') { if (b.st !== 'DRAFT') return { ok: 0, msg: 'ERROR not a draft' }; b.st = 'CANCELLED'; b.msg = 'cancelled by ' + USER + ' ' + NOW; delete drafts[b.cls]; return { ok: 1, msg: 'OK cancelled' }; }
            if (a === 'apply') {
                if (b.st !== 'DRAFT') return { ok: 0, msg: 'ERROR not a draft' };
                b.u = []; var nu = 0;
                Object.keys(b.lines).forEach(function (c) {
                    var x = H.item[c], us = units(x), def = us[1], base = b.lines[c][0] / def[2];
                    us.forEach(function (u) {
                        var nw = r4(base * u[2]), same = Math.abs(nw - u[3]) < 0.00005;
                        b.u.push([c, x[1], u[1], u[2], u[3], nw, same ? 'SAME' : 'WRITTEN', null, u[0], u === def ? 1 : 0]);
                        if (!same) { price[c + '|' + u[0]] = nw; nu++; }
                    });
                });
                b.st = 'APPLIED'; b.appBy = USER; b.appAt = NOW; b.units = nu; b.refused = 0;
                b.msg = 'OK items=' + b.items + ' units=' + nu + ' refused=0'; delete drafts[b.cls];
                return { ok: 1, msg: b.msg };
            }
            if (b.st !== 'APPLIED') return { ok: 0, msg: 'ERROR not applied' };
            b.u.forEach(function (u) { if (u[6] === 'WRITTEN') { price[u[0] + '|' + u[8]] = u[4]; u[6] = 'REVERSED'; } });
            b.st = 'REVERSED'; b.revBy = USER; b.revAt = NOW; b.msg = 'reversed items=' + b.items + ' units=' + b.units + ' kept=0';
            return { ok: 1, msg: b.msg };
        }
        if (a === 'batches') return { rows: batches.slice().reverse().map(batchRow) };
        if (a === 'sheet') {
            // the combined Sales sheet: approved changes of the period, one line per item on its default unit (first old price, last new price)
            var m = {}, ks = [];
            batches.forEach(function (x) {
                var s = String(x.appAt || ''), k = s.substring(6, 10) + '-' + s.substring(3, 5) + '-' + s.substring(0, 2);
                if (x.st !== 'APPLIED' || k < p.x02 || k > p.x03) return;
                x.u.forEach(function (u) {
                    if (u[6] !== 'WRITTEN' || !u[9]) return;
                    if (!m[u[0]]) { m[u[0]] = [u[0], u[1], u[2], u[4], u[5]]; ks.push(u[0]); } else { m[u[0]][4] = u[5]; }
                });
            });
            return { rows: ks.sort().map(function (k) { return m[k]; }) };
        }
        if (a === 'lines') {
            if (!b) return { error: 'not found' };
            if (b.st === 'DRAFT' || b.st === 'CANCELLED') {
                return { status: b.st, rows: Object.keys(b.lines).sort().map(function (c) {
                    var x = H.item[c], def = units(x)[1];
                    return [c, x[1], def[0], def[2], def[3], b.lines[c][0], x[6], b.lines[c][1]];
                }) };
            }
            return { status: b.st, rows: b.u.map(function (u) { return u.slice(0, 8).concat(u[9] || 0); }) };
        }
        return { error: 'action' };
    };
})();
