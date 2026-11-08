(function () {
    var de = document.documentElement, busy = false, t = 0;
    function vw() { return de.clientWidth; }
    function skip(e) { return e.closest('#jmSidebar,#jmHdr,.jm-sb-burger,.t-Footer,svg'); }
    function scrolls(e) {   // an ancestor already scrolls sideways
        for (; e && e !== document.body; e = e.parentElement) {
            var o = getComputedStyle(e).overflowX;
            if (o === 'auto' || o === 'scroll') return true;
        }
        return false;
    }
    function tables() {
        var ts = document.querySelectorAll('.t-Body-content table');
        for (var i = 0; i < ts.length; i++) {
            var tb = ts[i], p = tb.parentElement;
            if (!tb.offsetWidth || p.classList.contains('demo-xs') || scrolls(p)) continue;
            if (tb.offsetWidth > p.clientWidth + 1 || tb.getBoundingClientRect().right > vw() + 1) {
                var w = document.createElement('div');
                w.className = 'demo-xs';
                p.insertBefore(w, tb);
                w.appendChild(tb);
            }
        }
    }
    function off(r, W) { return r.width > 0 && (r.right > W + 1 || r.left < -1); }
    function rows() {   // nowrap flex rows that push a child off screen wrap instead
        var W = vw(), all = document.querySelectorAll('.t-Body-content *'), done = 0;
        for (var i = 0; i < all.length && done < 60; i++) {
            var e = all[i];
            if (e.tagName === 'TABLE') { i += e.getElementsByTagName('*').length; continue; }
            var r = e.getBoundingClientRect();
            if (!off(r, W) || skip(e) || scrolls(e.parentElement)) continue;
            var cs = getComputedStyle(e);
            if (cs.position === 'fixed') continue;
            if (cs.position === 'absolute') { menu(e, r, W); continue; }
            for (var p = e.parentElement; p && p !== document.body; p = p.parentElement) {
                var ps = getComputedStyle(p);
                if (ps.display.indexOf('flex') >= 0 && ps.flexWrap === 'nowrap' && ps.flexDirection.indexOf('row') === 0) {
                    p.style.flexWrap = 'wrap'; p.setAttribute('data-demo-fit', 'wrap'); done++; break;
                }
                if (ps.display.indexOf('grid') >= 0 && p.getBoundingClientRect().width <= W + 1) {
                    p.style.gridTemplateColumns = 'repeat(auto-fit,minmax(min(100%,140px),1fr))'; p.setAttribute('data-demo-fit', 'grid'); done++; break;
                }
            }
            if (!p || p === document.body) { e.style.maxWidth = '100%'; e.style.minWidth = '0'; }
        }
        return done;
    }
    function menu(e, r, W) {   // a dropdown (Export, pickers) opened off screen slides back in
        var dx = r.right > W - 4 ? W - 4 - r.right : (r.left < 4 ? 4 - r.left : 0);
        if (r.width > W - 8) { e.style.maxWidth = (W - 8) + 'px'; dx = 4 - r.left; }
        if (dx) {
            var cur = +(e.getAttribute('data-demo-dx') || 0);
            e.style.translate = (cur + dx) + 'px 0'; e.setAttribute('data-demo-dx', cur + dx);
        }
    }
    function tracks(g) { return getComputedStyle(g).gridTemplateColumns.split(' ').filter(function (x) { return /px$/.test(x); }).map(parseFloat); }
    function forms() {   // filter grids whose columns got too narrow for their inputs stack on phones
        if (vw() > 640) return;
        var all = document.querySelectorAll('.t-Body-content *');
        for (var i = 0; i < all.length; i++) {
            var g = all[i];
            if (g.hasAttribute('data-demo-fit') || getComputedStyle(g).display.indexOf('grid') < 0) continue;
            var tr = tracks(g);
            if (tr.length < 2 || Math.min.apply(null, tr) >= 125 || !g.querySelector('input,select')) continue;
            g.style.gridTemplateColumns = 'minmax(0,1fr)'; g.setAttribute('data-demo-fit', 'grid');
        }
    }
    function figures() {   // figures wider than their box shrink to fit (KPI tiles); a cramped grid of figures re-flows first
        var all = document.querySelectorAll('.t-Body-content *');
        for (var i = 0; i < all.length; i++) {
            var e = all[i];
            if (e instanceof SVGElement || e.children.length > 1 || e.closest('table')) continue;
            var tx = (e.textContent || '').trim(), cs = getComputedStyle(e);
            if (!tx || tx.length > 26 || !/\d/.test(tx) || !e.clientWidth || e.scrollWidth <= e.clientWidth + 1) continue;
            if (cs.whiteSpace.indexOf('nowrap') < 0 && /\s/.test(tx)) continue;
            var f0 = +(e.getAttribute('data-demo-fs') || parseFloat(cs.fontSize)), f = parseFloat(cs.fontSize);
            if (!e.hasAttribute('data-demo-fs') && e.scrollWidth / e.clientWidth > 1.3) {
                for (var g = e.parentElement, k = 0; g && k < 3; g = g.parentElement, k++) {
                    if (getComputedStyle(g).display.indexOf('grid') >= 0 && tracks(g).length > 2 && !g.hasAttribute('data-demo-fit')) {
                        g.style.gridTemplateColumns = 'repeat(auto-fit,minmax(min(100%,140px),1fr))'; g.setAttribute('data-demo-fit', 'grid'); break;
                    }
                }
            }
            e.setAttribute('data-demo-fs', f0);
            while (e.scrollWidth > e.clientWidth + 1 && f > f0 * 0.55) { f -= 1; e.style.fontSize = f + 'px'; }
        }
    }
    function reset() {   // on a width change start again from the live layout
        var fs = document.querySelectorAll('[data-demo-fs]');
        for (var i = 0; i < fs.length; i++) { fs[i].style.fontSize = ''; fs[i].removeAttribute('data-demo-fs'); }
        var ft = document.querySelectorAll('[data-demo-fit]');
        for (i = 0; i < ft.length; i++) { ft[i].style.flexWrap = ''; ft[i].style.gridTemplateColumns = ''; ft[i].removeAttribute('data-demo-fit'); }
        var dx = document.querySelectorAll('[data-demo-dx]');
        for (i = 0; i < dx.length; i++) { dx[i].style.translate = ''; dx[i].removeAttribute('data-demo-dx'); }
    }
    function fit() {
        if (busy) return;
        busy = true;
        try {
            tables();
            if (vw() <= 1100) { forms(); for (var k = 0; k < 4 && rows(); k++) {} figures(); }
        } catch (x) {}
        busy = false;
    }
    function later(ms) { clearTimeout(t); t = setTimeout(fit, ms || 120); }
    var lastW = 0;
    window.addEventListener('resize', function () { if (vw() !== lastW) { lastW = vw(); reset(); later(150); } });
    document.addEventListener('click', function () { setTimeout(fit, 60); }, true);
    function start() {
        lastW = vw(); fit();
        new MutationObserver(function () { if (!busy) later(); })
            .observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['class', 'hidden', 'open'] });
        setTimeout(fit, 800); setTimeout(fit, 2500);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
