(function () {
    var de = document.documentElement, busy = false, t = 0;
    function vw() { return de.clientWidth; }
    function skip(e) { return e.closest('#jmSidebar,#jmHdr,.jm-sb-burger,.t-Footer,svg'); }
    function scrolls(e) {   // the nearest ancestor that limits the width scrolls sideways (hidden = clips, so no)
        for (; e && e !== document.body; e = e.parentElement) {
            var o = getComputedStyle(e).overflowX;
            if (o === 'auto' || o === 'scroll') return true;
            if (o === 'hidden' || o === 'clip') return false;
        }
        return false;
    }
    function tables() {   // page tables and the tables of viewers opened over the page (journal entry ...)
        var ts = document.querySelectorAll('.t-Body-content table, body > div:not(.t-Body) table');
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
                    p.style.gridTemplateColumns = W <= 640 ? 'minmax(0,1fr)' : 'repeat(auto-fit,minmax(min(100%,140px),1fr))'; p.setAttribute('data-demo-fit', 'grid'); done++; break;
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
            if (tracks(g).length < 2) continue;
            var tight = false;
            for (var c = 0; c < g.children.length; c++) {
                var k = g.children[c];
                if (k.querySelector && (k.matches('input,select') || k.querySelector('input,select')) && k.getBoundingClientRect().width < 110) { tight = true; break; }
            }
            if (!tight) continue;
            g.style.gridTemplateColumns = 'minmax(0,1fr)'; g.setAttribute('data-demo-fit', 'grid');
        }
    }
    function pill(k) {   // a button-like item: short text, no fields inside
        if (!/^(BUTTON|A|SPAN|DIV)$/.test(k.tagName) || k.querySelector('input:not([type=radio]):not([type=checkbox]),select,table')) return false;
        var tx = (k.textContent || '').trim();
        return tx.length > 0 && tx.length <= 32 && k.getBoundingClientRect().height < 64;
    }
    function edges(e) {   // fade the side that still has pills hidden
        var sl = e.scrollLeft, hid = e.scrollWidth - e.clientWidth, rtl = getComputedStyle(e).direction === 'rtl';
        var l = rtl ? hid + sl > 2 : sl > 2, r = rtl ? -sl > 2 : hid - sl > 2;
        e.classList.toggle('demo-more-l', l); e.classList.toggle('demo-more-r', r);
    }
    function strips() {   // pill groups that wrapped onto a second line become one scrolling row
        var all = document.querySelectorAll('.t-Body-content *');
        for (var i = 0; i < all.length; i++) {
            var e = all[i], n = e.children.length;
            if (n < 3 || e.getAttribute('data-demo-fit') === 'strip' || e.closest('table,[data-demo-fit=strip]')) continue;
            var cs = getComputedStyle(e);
            if (cs.display.indexOf('flex') < 0 || cs.flexDirection.indexOf('row') !== 0) continue;
            var tops = {}, ok = true, vis = 0;
            for (var c = 0; c < n; c++) {
                var k = e.children[c];
                if (!k.offsetWidth) continue;
                if (!pill(k)) { ok = false; break; }
                tops[Math.round(k.offsetTop / 8)] = 1; vis++;
            }
            if (!ok || vis < 3 || Object.keys(tops).length < 2) continue;
            e.setAttribute('data-demo-fit', 'strip');
            for (var q = e, up = 0; q && up < 4 && q !== document.body; q = q.parentElement, up++) { q.style.minWidth = '0'; q.style.maxWidth = '100%'; }
            e.addEventListener('scroll', function () { edges(this); }, { passive: true });
            edges(e);
            var on = e.querySelector('.on,.active,.is-active,[aria-selected=true],[aria-pressed=true]');
            if (on) { var r1 = on.getBoundingClientRect(), r0 = e.getBoundingClientRect(); if (r1.right > r0.right + 1 || r1.left < r0.left - 1) e.scrollLeft += r1.left - r0.left - 8; }
        }
        var ss = document.querySelectorAll('[data-demo-fit=strip]');
        for (i = 0; i < ss.length; i++) edges(ss[i]);
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
        for (i = 0; i < ft.length; i++) { ft[i].style.flexWrap = ''; ft[i].style.gridTemplateColumns = ''; ft[i].removeAttribute('data-demo-fit'); ft[i].classList.remove('demo-more-l', 'demo-more-r'); }
        var dx = document.querySelectorAll('[data-demo-dx]');
        for (i = 0; i < dx.length; i++) { dx[i].style.translate = ''; dx[i].removeAttribute('data-demo-dx'); }
    }
    function charts() {   // phones: bar charts drawn to their width get 600px inside a sideways scroll box, so labels do not overlap
        if (vw() > 640) return;
        var ss = document.querySelectorAll('.t-Body-content svg:not(.spark)'), n = 0;
        for (var i = 0; i < ss.length; i++) {
            var sv = ss[i], vb = (sv.getAttribute('viewBox') || '').split(' ');
            if (sv.parentElement.classList.contains('demo-xs') || sv.querySelectorAll('text').length < 16) continue;
            if (Math.abs(+vb[2] - sv.getBoundingClientRect().width) > 30 || +vb[2] >= 560) continue;
            var w = document.createElement('div');
            w.className = 'demo-xs demo-chart';
            sv.parentElement.insertBefore(w, sv); w.appendChild(sv);
            sv.style.minWidth = '600px'; n++;
        }
        if (n) setTimeout(function () { window.dispatchEvent(new Event('resize')); }, 30);
    }
    var touch = window.matchMedia && matchMedia('(hover: none) and (pointer: coarse)').matches;
    function fields() {   // touch screens: 16px fields, inline so no page rule can undo it (iOS zooms on smaller ones)
        if (!touch) return;
        var fs = document.querySelectorAll('input:not([type=checkbox]):not([type=radio]):not([type=hidden]),select,textarea');
        for (var i = 0; i < fs.length; i++) if (fs[i].style.getPropertyPriority('font-size') !== 'important') fs[i].style.setProperty('font-size', '16px', 'important');
    }
    function fit() {
        if (busy) return;
        busy = true;
        try {
            tables(); fields(); charts();
            if (vw() <= 1100) { forms(); for (var k = 0; k < 4 && rows(); k++) {} strips(); figures(); }
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
