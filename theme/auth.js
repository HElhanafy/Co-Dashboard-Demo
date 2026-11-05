/* auth.js - demo sign-in gate (deterrent only, static site); hashes written by build/PACKAGE.py from build/DEMO_LOGIN.txt (05/11/2026) */
(function () {
    var H = ['a982965829f350877d8a99e7961a199a74fab0cc6e168b1246255ef0869d4099'];
    function sha256(s) {
        function r(n, x) { return (x >>> n) | (x << (32 - n)); }
        var K = [], k = 0, c = 2, i, j, w, a, b, d, e, f, g, h, t1, t2, hh = [];
        while (k < 64) { for (i = 2; i * i <= c; i++) if (c % i === 0) break; if (i * i > c) { if (k < 8) hh[k] = (Math.pow(c, 1 / 2) * 4294967296) | 0; K[k++] = (Math.pow(c, 1 / 3) * 4294967296) | 0; } c++; }
        s = unescape(encodeURIComponent(s));
        var l = s.length, m = [];
        for (i = 0; i < l; i++) m[i >> 2] |= s.charCodeAt(i) << (24 - (i % 4) * 8);
        m[l >> 2] |= 0x80 << (24 - (l % 4) * 8);
        m[(((l + 8) >> 6) + 1) * 16 - 1] = l * 8;
        for (j = 0; j < m.length; j += 16) {
            w = []; a = hh[0]; b = hh[1]; c = hh[2]; d = hh[3]; e = hh[4]; f = hh[5]; g = hh[6]; h = hh[7];
            for (i = 0; i < 64; i++) {
                if (i < 16) w[i] = m[j + i] | 0;
                else w[i] = (r(17, w[i - 2]) ^ r(19, w[i - 2]) ^ (w[i - 2] >>> 10)) + w[i - 7] + (r(7, w[i - 15]) ^ r(18, w[i - 15]) ^ (w[i - 15] >>> 3)) + w[i - 16] | 0;
                t1 = h + (r(6, e) ^ r(11, e) ^ r(25, e)) + ((e & f) ^ (~e & g)) + K[i] + w[i] | 0;
                t2 = (r(2, a) ^ r(13, a) ^ r(22, a)) + ((a & b) ^ (a & c) ^ (b & c)) | 0;
                h = g; g = f; f = e; e = d + t1 | 0; d = c; c = b; b = a; a = t1 + t2 | 0;
            }
            hh[0] = hh[0] + a | 0; hh[1] = hh[1] + b | 0; hh[2] = hh[2] + c | 0; hh[3] = hh[3] + d | 0;
            hh[4] = hh[4] + e | 0; hh[5] = hh[5] + f | 0; hh[6] = hh[6] + g | 0; hh[7] = hh[7] + h | 0;
        }
        var o = '';
        for (i = 0; i < 8; i++) o += ('00000000' + (hh[i] >>> 0).toString(16)).slice(-8);
        return o;
    }
    function has(v) { for (var i = 0; i < H.length; i++) if (H[i] === v) return true; return false; }
    function tok() { try { return sessionStorage.getItem('demoAuth') || ''; } catch (e) { return ''; } }
    var root = /\/app\/[^\/]*$/.test(location.pathname) ? '../' : '';
    window.demoAuth = {
        check: function (u, p) {
            var v = sha256('co-dashboard|' + String(u).replace(/^\s+|\s+$/g, '').toLowerCase() + '|' + p);
            if (!has(v)) return false;
            try { sessionStorage.setItem('demoAuth', v); } catch (e) {}
            return true;
        },
        out: function () { try { sessionStorage.removeItem('demoAuth'); } catch (e) {} location.replace(root + 'login.html'); }
    };
    if (!window.DEMO_LOGIN_PAGE && !has(tok())) {
        document.documentElement.style.visibility = 'hidden';
        location.replace(root + 'login.html');
    }
})();
