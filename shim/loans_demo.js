(function () {
    var pass = false, OV = null, ST = null, RATE = { fx: 0, sb: 0 }, COA = [], SEL = { dr: null, cr: null }, PK = { dr: { hi: 0, items: [], open: false }, cr: { hi: 0, items: [], open: false } }, TERMS = [270, 365, 730];
    var CSS = '.lns-ov{position:fixed;top:0;bottom:0;left:0;right:0;background:rgba(17,28,58,.45);display:none;align-items:flex-start;justify-content:center;z-index:9000;padding:34px 16px;overflow:auto}' +
        '.lns-box{background:#fff;border:1px solid var(--border,#dde1ec);border-radius:12px;width:100%;max-width:1080px;font-family:var(--font-body)}' +
        '.lns-top{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 18px 10px;font:700 15px var(--font-head);color:#1a1f36}' +
        '.lns-top small{display:block;font:400 11px var(--font-body);color:#6f7590;margin-top:2px}' +
        '.lns-body{padding:0 18px 18px}' +
        '.lns-band{display:flex;flex-wrap:wrap;align-items:stretch;border-radius:12px 12px 0 0;background:linear-gradient(135deg,#111c3a 0%,#4a3fa8 70%,#5a4fc4 100%);color:#fff;padding:0 6px}' +
        '.lns-b{padding:12px 18px;display:flex;flex-direction:column;justify-content:center;gap:3px;border-inline-start:1px solid rgba(255,255,255,.18)}.lns-b:first-child{border-inline-start:0}' +
        '.lns-b small{font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;opacity:.75}.lns-b b{font-size:14px;font-weight:600;font-variant-numeric:tabular-nums}' +
        '.lns-b.tot{margin-inline-start:auto;text-align:end}.lns-b.tot b{font-size:22px;font-weight:800}' +
        '.lns-p{border:1px solid var(--border,#dde1ec);border-top:0;border-radius:0 0 12px 12px;padding:9px 18px;font-size:12.5px;color:#1a1f36;margin:0 0 14px}' +
        '.lns-t{width:100%;border-collapse:separate;border-spacing:0;font:12.5px var(--font-body)}' +
        '.lns-t th{background:#e7e8eb;color:#111c3a;font-size:10.5px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;text-align:start;padding:9px 10px;border-bottom:1px solid rgba(17,28,58,.25);white-space:nowrap}' +
        '.lns-t td{padding:8px 10px;border-bottom:1px solid rgba(26,31,54,.08);vertical-align:middle}' +
        '.lns-t .n{text-align:end;white-space:nowrap;font-variant-numeric:tabular-nums;font-weight:600}.lns-t .dr{color:#a5202f}.lns-t .cr{color:#1d4ed8}' +
        '.lns-t .c{color:#6f7590;white-space:nowrap;font-variant-numeric:tabular-nums}.lns-t .sd{font-weight:700;white-space:nowrap}.lns-t .ds{color:#4a5068}' +
        '.lns-t tfoot td{background:#e7e8eb;color:#111c3a;font-weight:700;border-top:2px solid var(--pink);border-bottom:0}' +
        '.lns-pick{position:relative;min-width:350px}' +
        '.lns-in{width:100%;box-sizing:border-box;height:36px;padding:0 10px;background:var(--box-bg,#eef0fa);border:1px solid var(--box-line,rgba(48,55,139,.25));border-radius:var(--box-r,6px);font:600 13px var(--font-body);color:#1a1f36;font-variant-numeric:tabular-nums;outline:0}' +
        '.lns-in:focus{border-color:var(--navy)}' +
        '.lns-list{display:none;position:absolute;top:38px;inset-inline-start:0;min-width:100%;max-height:230px;overflow:auto;background:#fff;border:1px solid var(--box-line,rgba(48,55,139,.25));border-radius:var(--box-r,6px);z-index:5}' +
        '.lns-opt{padding:7px 10px;font-size:12.5px;cursor:pointer;white-space:nowrap}.lns-opt .c{color:#6f7590;font-variant-numeric:tabular-nums;margin-inline-end:6px}' +
        '.lns-opt.on{font-weight:700}.lns-opt.hi,.lns-opt:hover{background:var(--box-bg,#eef0fa)}.lns-none{padding:9px 10px;font-size:12px;color:#6f7590}' +
        '.lns-term{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin:16px 0 4px;font-size:13px;color:#1a1f36}.lns-term label{font-weight:700}' +
        '.lns-term .lns-in{width:86px;text-align:center}' +
        '.lns-caps{display:inline-flex;gap:3px;padding:3px;border-radius:9px;background:var(--panel2,#eef0f5)}' +
        '.lns-cap{height:30px;padding:0 13px;border:0;border-radius:7px;background:transparent;font:600 13px var(--font-body);color:#1a1f36;cursor:pointer}.lns-cap.on{background:var(--pink);color:#fff}' +
        '.lns-due{margin-inline-start:6px}.lns-due b{font-variant-numeric:tabular-nums}' +
        '.lns-err{min-height:18px;margin:6px 0 0;font-size:12.5px;font-weight:600;color:#a5202f}' +
        '.lns-foot{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin-top:10px}.lns-foot .lns-note{flex:1 1 320px;font-size:12px;color:#6f7590}' +
        '#lnsNote{display:block;flex:1 1 100%;margin-top:4px}#lnsNote b{font-variant-numeric:tabular-nums}#lnsNote i{font-style:normal;opacity:.5;margin:0 6px}' +
        '@media (max-width:760px){.lns-t .ds,.lns-t th.ds{display:none}.lns-pick{min-width:190px}.lns-ov{padding:12px 8px}}';
    function srv(p) { return window.DEMO_SRV.LOANS_AJAX(p); }
    function T(s) { var v = window.jmT ? window.jmT(s) : s; return v === null || v === undefined ? s : v; }
    function $(k) { return document.getElementById(k); }
    function esc(s) { return String(s === null || s === undefined ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    function fm(x) { var s = (Math.round(x * 100) / 100).toFixed(2), k = s.indexOf('.'), f = s.substr(k), q = ''; s = s.substr(0, k); while (s.length > 3) { q = ',' + s.substr(s.length - 3) + q; s = s.substr(0, s.length - 3); } return s + q + f; }
    function dmy(s) { return s ? s.substr(8, 2) + '/' + s.substr(5, 2) + '/' + s.substr(0, 4) : ''; }
    function accOf(k) { var i; for (i = 0; i < COA.length; i++) { if (COA[i][0] === +k) { return COA[i]; } } return null; }
    function label(k) { var a = accOf(k); return a ? a[0] + '   ' + T(a[1]) : ''; }
    function css() { var s; if ($('lns-css')) { return; } s = document.createElement('style'); s.id = 'lns-css'; s.textContent = CSS; document.head.appendChild(s); }
    function term() { var v = String($('lnsTerm').value).replace(/\s/g, ''); return /^\d+$/.test(v) ? +v : NaN; }
    function pickHtml(side) { return '<div class="lns-pick"><input type="text" class="lns-in" id="lnsIn_' + side + '" data-side="' + side + '" autocomplete="off" placeholder="' + esc(T('Search by code or name')) + '"><div class="lns-list" id="lnsList_' + side + '" data-side="' + side + '"></div></div>'; }
    function listDraw(side, q) {
        var i, a, s = '', n = 0, t, p = PK[side];
        q = String(q || '').toLowerCase(); p.items = [];
        for (i = 0; i < COA.length; i++) {
            a = COA[i]; t = (a[0] + ' ' + a[1] + ' ' + T(a[1])).toLowerCase();
            if (q && t.indexOf(q) < 0) { continue; }
            p.items.push(a[0]);
            s += '<div class="lns-opt' + (n === p.hi ? ' hi' : '') + (a[0] === SEL[side] ? ' on' : '') + '" data-k="' + a[0] + '"><span class="c">' + a[0] + '</span>' + esc(T(a[1])) + '</div>';
            n++;
        }
        $('lnsList_' + side).innerHTML = s || '<div class="lns-none">' + esc(T('No account found')) + '</div>';
        $('lnsList_' + side).style.display = 'block'; p.open = true;
    }
    function listClose(side) { var l = $('lnsList_' + side); if (l) { l.style.display = 'none'; } PK[side].open = false; if ($('lnsIn_' + side)) { $('lnsIn_' + side).value = label(SEL[side]); } }
    function choose(side, k) { SEL[side] = +k; listClose(side); refresh(); }
    function refresh() {
        var t = term(), ok = t >= 30 && t <= 3650, pl = ok ? srv({ x01: 'plan', x02: ST.id, x03: RATE.fx, x04: RATE.sb, x07: t }) : null, i, c = OV.querySelectorAll('.lns-cap'), e = '';
        for (i = 0; i < c.length; i++) { c[i].className = 'lns-cap' + (+c[i].getAttribute('data-d') === t ? ' on' : ''); }
        if (!ok) { e = T('The loan term is between 30 and 3650 days'); } else if (SEL.dr === SEL.cr) { e = T('Choose two different accounts'); }
        $('lnsErr').textContent = e; $('lnsGo').disabled = !!e;
        $('lnsDue').textContent = pl ? dmy(pl.due) : '-'; $('lnsBDue').textContent = pl ? dmy(pl.due) : '-';
        $('lnsN').textContent = pl ? pl.n : '-'; $('lnsTot').textContent = pl ? fm(pl.total) : '-';
        $('lnsA1').textContent = pl ? fm(pl.first.amt) : ''; $('lnsA2').textContent = pl ? fm(pl.first.amt) : '';
        $('lnsT1').textContent = pl ? fm(pl.first.amt) : ''; $('lnsT2').textContent = pl ? fm(pl.first.amt) : '';
        $('lnsFd').textContent = pl ? dmy(pl.first.to) : '';
        c = pl ? T('Loan interest# ' + ST.code + ' month ' + pl.first.to.substr(5, 2) + '-' + pl.first.to.substr(0, 4) + ' - ' + ST.sup) : '';
        $('lnsD1').textContent = c; $('lnsD2').textContent = c;
    }
    function close() { if (OV) { OV.style.display = 'none'; } }
    function go() {
        var t = term(), b = $('apprBtn'), c = window.confirm;
        if (!b || $('lnsGo').disabled) { return; }
        window.DEMO_LOAN_SETUP = { dr: SEL.dr, cr: SEL.cr, term: t };
        close();
        pass = true; window.confirm = function () { return true; };
        try { b.click(); } finally { window.confirm = c; pass = false; }
    }
    function build() {
        css();
        OV = document.createElement('div'); OV.id = 'lnsOv'; OV.className = 'lns-ov'; document.body.appendChild(OV);
        OV.addEventListener('mousedown', function (e) { var o = e.target.closest ? e.target.closest('.lns-opt') : null; if (o) { e.preventDefault(); choose(o.parentNode.getAttribute('data-side'), o.getAttribute('data-k')); } });
        OV.addEventListener('click', function (e) {
            var cap = e.target.closest ? e.target.closest('.lns-cap') : null;
            if (e.target === OV || (e.target.closest && e.target.closest('[data-lns-x]'))) { close(); return; }
            if (cap) { $('lnsTerm').value = cap.getAttribute('data-d'); refresh(); return; }
            if (e.target.id === 'lnsGo') { go(); }
        });
        OV.addEventListener('focusin', function (e) { var s = e.target.getAttribute ? e.target.getAttribute('data-side') : null, i; if (s && e.target.tagName === 'INPUT') { PK[s].hi = 0; listDraw(s, ''); for (i = 0; i < PK[s].items.length; i++) { if (PK[s].items[i] === SEL[s]) { PK[s].hi = i; } } listDraw(s, ''); e.target.select(); } });
        OV.addEventListener('focusout', function (e) { var s = e.target.getAttribute ? e.target.getAttribute('data-side') : null; if (s && e.target.tagName === 'INPUT') { listClose(s); } });
        OV.addEventListener('input', function (e) { var s = e.target.getAttribute ? e.target.getAttribute('data-side') : null; if (s) { PK[s].hi = 0; listDraw(s, e.target.value); } else if (e.target.id === 'lnsTerm') { refresh(); } });
        OV.addEventListener('keydown', function (e) {
            var s = e.target.getAttribute ? e.target.getAttribute('data-side') : null, p, h;
            if (e.key === 'Enter' && e.target.id === 'lnsTerm') { e.preventDefault(); go(); return; }
            if (!s || e.target.tagName !== 'INPUT') { return; }
            p = PK[s];
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                if (!p.open) { p.hi = 0; listDraw(s, ''); return; }
                p.hi = Math.max(0, Math.min(p.items.length - 1, p.hi + (e.key === 'ArrowDown' ? 1 : -1)));
                listDraw(s, e.target.value === label(SEL[s]) ? '' : e.target.value);
                h = $('lnsList_' + s).querySelector('.hi'); if (h && h.scrollIntoView) { h.scrollIntoView({ block: 'nearest' }); }
            } else if (e.key === 'Enter') {
                e.preventDefault(); if (p.open && p.items.length) { choose(s, p.items[p.hi]); }
            } else if (e.key === 'Escape' && p.open) { e.stopPropagation(); listClose(s); }
        });
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && OV.style.display === 'flex') { close(); } });
    }
    function open(st, fx, sb) {
        var i, caps = '';
        if (!OV) { build(); }
        ST = st; RATE = { fx: fx, sb: sb }; COA = srv({ x01: 'coa' }).coa; SEL = { dr: st.dr, cr: st.cr };
        for (i = 0; i < TERMS.length; i++) { caps += '<button type="button" class="lns-cap" data-d="' + TERMS[i] + '">' + TERMS[i] + '</button>'; }
        OV.innerHTML = '<div class="lns-box"><div class="lns-top"><span>' + esc(T('Monthly interest entry')) + '<small>' + esc(st.code) + ' - ' + esc(st.sup) + '</small></span><div><button type="button" class="btn-soft" data-lns-x>&times; ' + esc(T('Close')) + '</button></div></div>' +
            '<div class="lns-body"><div class="lns-band">' +
            '<div class="lns-b"><small>' + esc(T('Loan amount')) + '</small><b>' + fm(st.p) + '</b></div>' +
            '<div class="lns-b"><small>' + esc(T('Taken on')) + '</small><b>' + dmy(st.draw) + '</b></div>' +
            '<div class="lns-b"><small>' + esc(T('Rate a year')) + '</small><b>' + (fx + sb).toFixed(2) + '%</b></div>' +
            '<div class="lns-b"><small>' + esc(T('Due on')) + '</small><b id="lnsBDue"></b></div>' +
            '<div class="lns-b"><small>' + esc(T('Entries')) + '</small><b id="lnsN"></b></div>' +
            '<div class="lns-b tot"><small>' + esc(T('Total interest')) + '</small><b id="lnsTot"></b></div></div>' +
            '<p class="lns-p">' + esc(T('Choose the debit and the credit account of the monthly interest entry and the loan term. Every month is booked on these two accounts.')) + '</p>' +
            '<table class="lns-t"><thead><tr><th>#</th><th>' + esc(T('Side')) + '</th><th>' + esc(T('Account')) + '</th><th class="ds">' + esc(T('Description')) + '</th><th class="n">' + esc(T('Debit')) + '</th><th class="n">' + esc(T('Credit')) + '</th></tr></thead><tbody>' +
            '<tr><td class="c">1</td><td class="sd dr">' + esc(T('Debit')) + '</td><td>' + pickHtml('dr') + '</td><td class="ds" id="lnsD1"></td><td class="n dr" id="lnsA1"></td><td></td></tr>' +
            '<tr><td class="c">2</td><td class="sd cr">' + esc(T('Credit')) + '</td><td>' + pickHtml('cr') + '</td><td class="ds" id="lnsD2"></td><td></td><td class="n cr" id="lnsA2"></td></tr>' +
            '</tbody><tfoot><tr><td colspan="3"><span>' + esc(T('First entry')) + '</span> <span id="lnsFd"></span></td><td class="ds"></td><td class="n" id="lnsT1"></td><td class="n" id="lnsT2"></td></tr></tfoot></table>' +
            '<div class="lns-term"><label for="lnsTerm">' + esc(T('Loan term in days')) + '</label><input type="text" class="lns-in" id="lnsTerm" inputmode="numeric" autocomplete="off" value="' + st.term + '"><span class="lns-caps">' + caps + '</span>' +
            '<span class="lns-due">' + esc(T('Due on')) + ' <b id="lnsDue"></b></span></div>' +
            '<div class="lns-err" id="lnsErr"></div>' +
            '<div class="lns-foot"><span class="lns-note">' + esc(T('Each entry is dated at its month end. An early repayment removes the later entries and books a final one on the same accounts.')) + '</span>' +
            '<button type="button" class="btn-soft" data-lns-x>' + esc(T('Cancel')) + '</button><button type="button" class="btn-act" id="lnsGo">' + esc(T('Approve and book the entries')) + '</button></div></div></div>';
        $('lnsIn_dr').value = label(SEL.dr); $('lnsIn_cr').value = label(SEL.cr);
        OV.style.display = 'flex';
        refresh();
    }
    /* "Approve loan" on a new loan: the window first, unless a rate part is missing (the page says what) */
    document.addEventListener('click', function (e) {
        var b = e.target && e.target.closest ? e.target.closest('#apprBtn') : null, fx, sb, st;
        if (!b || pass || !window.DEMO_SRV) { return; }
        fx = parseFloat($('fxIn') ? $('fxIn').value : ''); sb = parseFloat($('sbIn') ? $('sbIn').value : '');
        if (isNaN(fx) || isNaN(sb)) { return; }
        st = srv({ x01: 'setup' });
        if (!st || !st.ok || st.st !== 'NEW') { return; }
        e.stopPropagation(); e.preventDefault();
        open(st, fx, sb);
    }, true);
    /* after the approval the rate box tells which accounts and term the entries use */
    function note() {
        var box = $('rateBox'), st, n;
        if (!box || $('lnsNote') || !box.firstChild) { return; }
        st = srv({ x01: 'setup' });
        if (!st || !st.ok || (st.st !== 'APPROVED' && st.st !== 'REPAID')) { return; }
        css();
        n = document.createElement('span'); n.className = 'note'; n.id = 'lnsNote';
        n.innerHTML = '<span>' + esc(T('Debit account')) + '</span> <b>' + st.dr + '</b> <span>' + esc(T(st.drn)) + '</span><i>|</i><span>' + esc(T('Credit account')) + '</span> <b>' + st.cr + '</b> <span>' + esc(T(st.crn)) + '</span><i>|</i><span>' + esc(T('Loan term')) + '</span> <b>' + st.term + '</b> <span>' + esc(T('days')) + '</span>';
        box.appendChild(n);
    }
    document.addEventListener('DOMContentLoaded', function () {
        var box = $('rateBox');
        if (!box || !window.MutationObserver) { return; }
        new MutationObserver(note).observe(box, { childList: true });
    });
})();
