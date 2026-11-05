/* apex.js - offline stand-in for the APEX client API used by the dashboard pages (24/10/2026) */
(function () {
    var SRV = window.DEMO_SRV = window.DEMO_SRV || {};

    // collected for the page check harness (build/CHECK in the browser): uncaught errors and console.error
    var ERR = window.DEMO_ERRORS = [], cerr = console.error;
    window.addEventListener('error', function (e) { ERR.push(String(e.message || e)); });
    console.error = function () { ERR.push([].slice.call(arguments).join(' ')); return cerr.apply(console, arguments); };

    function Deferred() {
        var st = 0, val, args, ok = [], ko = [], al = [];
        var d = {
            done: function (f) { if (st === 1) f(val); else if (!st) ok.push(f); return d; },
            fail: function (f) { if (st === 2) f.apply(null, args); else if (!st) ko.push(f); return d; },
            always: function (f) { if (st) f(val); else al.push(f); return d; },
            then: function (a, b) { if (a) d.done(a); if (b) d.fail(b); return d; },
            'catch': function (b) { return d.fail(b); },
            resolve: function (v) { st = 1; val = v; ok.forEach(function (f) { f(v); }); al.forEach(function (f) { f(v); }); },
            reject: function (msg) {
                st = 2; val = msg; args = [{ responseText: msg, status: 500 }, 'error', msg];
                ko.forEach(function (f) { f.apply(null, args); }); al.forEach(function (f) { f(msg); });
            }
        };
        return d;
    }

    function process(name, data, opts) {
        var d = Deferred(), h = SRV[name];
        opts = opts || {};
        setTimeout(function () {
            var res, msg = name + ': not available in the demo';
            try {
                res = h ? h(data || {}) : { err: msg, error: msg, status: 'error', message: msg };
            } catch (e) {
                console.error('[demo] ' + name, e);
                res = { err: String(e.message || e), error: String(e.message || e), status: 'error', message: String(e.message || e) };
            }
            if (!h) console.warn('[demo] missing process ' + name, data);
            if (opts.dataType === 'text' && typeof res !== 'string') res = JSON.stringify(res);
            if (opts.success) opts.success(res);
            d.resolve(res);
        }, 40);
        return d;
    }

    window.apex = window.apex || {};
    apex.server = { process: process };
    if (window.jQuery) apex.jQuery = window.jQuery;
    apex.item = function (id) {
        var el = document.getElementById(id);
        return { getValue: function () { return el ? el.value : ''; }, setValue: function (v) { if (el) el.value = v; } };
    };
    window.$v = function (id) { var el = document.getElementById(id); return el ? el.value : ''; };
    window.$s = function (id, v) { var el = document.getElementById(id); if (el) el.value = v; };

    // live page links (APP:ALIAS:SESSION) and sign-out become local pages
    document.addEventListener('click', function (e) {
        var a = e.target.closest ? e.target.closest('a[href]') : null;
        if (!a) return;
        var h = a.getAttribute('href') || '', m = h.match(/f\?p=[^:]+:([A-Za-z0-9_]+)/) || h.match(/^([a-z0-9_]+)\.html/);
        if (m) {
            e.preventDefault();
            if ((window.DEMO_BUILT || []).indexOf(m[1].toUpperCase()) < 0) { alert('This report is being prepared for the demo.'); return; }
            location.href = m[1].toLowerCase() + '.html' + (h.indexOf('#') > 0 ? h.slice(h.indexOf('#')) : '');
            return;
        }
        if (/apex_authentication\.logout/.test(h)) { e.preventDefault(); location.href = '../login.html?out=1'; }
    }, true);
})();
