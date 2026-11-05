/* shell.js - writes the sidebar and header the live server prints on page 0 (24/10/2026) */
(function () {
    var A = (document.body.getAttribute('data-alias') || '').toUpperCase(), N = window.DEMO_NAV || [],
        B = window.DEMO_BUILT || [], h = [], lang = 'EN', ind = window.DEMO_INDUSTRY === 'trading' ? 'Trading' : 'Medical';
    try { lang = localStorage.getItem('demoLang') === 'AR' ? 'AR' : 'EN'; } catch (e) {}
    function svg(inner, w) {
        return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (w || 2) +
            '" stroke-linecap="round" stroke-linejoin="round">' + inner + '</svg>';
    }
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
            g.g + '"><span class="jm-sb-gtxt">' + g.g + '</span><span class="jm-sb-caret">' +
            svg('<polyline points="6 9 12 15 18 9"></polyline>', 2.5) + '</span></button><div class="jm-sb-items">');
        g.items.forEach(function (it) { h.push(item(it)); });
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
