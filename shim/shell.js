(function () {
    var A = (document.body.getAttribute('data-alias') || '').toUpperCase(), N = window.DEMO_NAV || [],
        B = window.DEMO_BUILT || [], h = [], lang = 'EN', ind = window.DEMO_INDUSTRY === 'trading' ? 'Trading' : 'Medical';
    try { lang = localStorage.getItem('demoLang') === 'AR' ? 'AR' : 'EN'; } catch (e) {}
    function svg(inner, w) {
        return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (w || 2) +
            '" stroke-linecap="round" stroke-linejoin="round">' + inner + '</svg>';
    }
    var MI = {   /* module icons = SIDEBAR_SQL mod_icon (05/11/2026) */
        'Finance': '<path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path>',
        'Sales': '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline>',
        'Customers': '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>',
        'Inventory': '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line>',
        'Purchases': '<circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>',
        'Suppliers': '<rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle>',
        'Banks': '<path d="M3 21h18"></path><path d="M5 21V11"></path><path d="M9.5 21V11"></path><path d="M14.5 21V11"></path><path d="M19 21V11"></path><path d="M2 11l10-7 10 7z"></path>',
        'Human Resources': '<rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>',
        'Administration': '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>'
    };
    function item(it) {
        if (it.a === 'EXPIRY' && window.DEMO_INDUSTRY === 'trading') return '';   // no expiry tracking in trading
        var ok = B.indexOf(it.a) >= 0;
        return '<a class="jm-sb-item' + (it.a === A ? ' is-active' : '') + (ok ? '' : ' demo-soon') + '" data-tip="' + it.t +
            '" href="' + (ok ? it.a.toLowerCase() + '.html' : '#') + '"><span class="jm-sb-ico">' + svg(it.i) +
            '</span><span class="jm-sb-txt">' + it.l + '</span></a>';
    }
    h.push('<button type="button" id="jmSbBurger" class="jm-sb-burger" aria-controls="jmSidebar" aria-label="Menu">' +
        svg('<line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line>') +
        '</button><div id="jmSbScrim" class="jm-sb-scrim"></div><aside id="jmSidebar" class="jm-sb">' +
        '<div class="jm-sb-head"><div class="jm-sb-mark">C</div><div class="jm-sb-brand"><b class="b-navy">Co.</b> <b class="b-pink">Dashboard</b></div></div>' +
        '<button type="button" id="jmSbToggle" class="jm-sb-toggle" aria-expanded="false" aria-label="Toggle menu">' +
        svg('<polyline points="9 18 15 12 9 6"></polyline>', 2.5) + '</button><nav class="jm-sb-nav">');
    N.forEach(function (g) {
        if (!g.g) { g.items.forEach(function (it) { h.push(item(it)); }); return; }
        h.push('<div class="jm-sb-mod" data-mod="' + g.g.toUpperCase().replace(/ /g, '_') + '"><button type="button" class="jm-sb-group" data-tip="' +
            g.g + '"><span class="jm-sb-gico">' + svg(MI[g.g] || MI.Administration) + '</span><span class="jm-sb-gtxt">' + g.g + '</span><span class="jm-sb-caret">' +
            svg('<polyline points="6 9 12 15 18 9"></polyline>', 2.5) + '</span></button><div class="jm-sb-items">');
        /* Operations then Reports and analysis, captions only when both show (SIDEBAR_SQL print_sub, 07/11/2026) */
        var OPS = { TGTSET: 1, COMM: 1, PRICEADJ: 1, BANKREC: 1, HRSET: 1, LOANS: 1 }, ops = [], rep = [];
        g.items.forEach(function (it) { (OPS[it.a] ? ops : rep).push(it); });
        var two = ops.length && rep.length;
        if (two) { h.push('<div class="jm-sb-sub is-ops">Operations</div>'); }
        ops.forEach(function (it) { h.push(item(it)); });
        if (two) { h.push('<div class="jm-sb-sub is-rep">Reports and analysis</div>'); }
        rep.forEach(function (it) { h.push(item(it)); });
        h.push('</div></div>');
    });
    h.push('</nav><div class="jm-sb-foot"></div></aside>');
    h.push('<div id="jmHdr" class="jm-hdr" hidden><span class="jm-hdr-brand">Co. <b>Dashboard</b></span>' +
        '<a class="jm-hdr-btn demo-ind" href="../index.html" title="Change industry">' + ind + '</a>' +
        '<div class="jm-hdr-id" title="ADMIN - ADMIN"><span class="jm-hdr-name">Demo Admin</span></div>' +
        '<span id="jmHdrLang" class="jm-hdr-lang" title="Language" hidden><button type="button" data-lang="EN"' + (lang === 'AR' ? '' : ' class="on"') +
        '>EN</button><button type="button" data-lang="AR"' + (lang === 'AR' ? ' class="on"' : '') + '>&#1593;</button></span>' +
        '<a class="jm-hdr-btn jm-hdr-ico jm-hdr-out" title="Sign out" href="../login.html?out=1">' +
        svg('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line>') +
        '</a></div>');
    document.write(h.join(''));
    document.addEventListener('click', function (e) {
        var a = e.target.closest ? e.target.closest('a.demo-soon') : null;
        if (a) { e.preventDefault(); alert((window.jmT || String)('This report is being prepared for the demo.')); }
    });
})();
