/* Shared helpers for every tool page. Loaded in <head>, no defer, so inline page scripts can use window.AT. */
(function () {
  var root = document.documentElement;
  var THEME_KEY = 'at-theme';

  // Apply a saved theme choice as early as possible.
  try { var saved = localStorage.getItem(THEME_KEY); if (saved === 'dark' || saved === 'light') root.setAttribute('data-theme', saved); } catch (e) {}

  function isDark() {
    var t = root.getAttribute('data-theme');
    if (t === 'dark') return true;
    if (t === 'light') return false;
    return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }

  document.addEventListener('DOMContentLoaded', function () {
    // Contact address is assembled here so it is not sitting in the page source as plain text.
    var spots = document.querySelectorAll('[data-mail]');
    for (var i = 0; i < spots.length; i++) {
      var u = spots[i].getAttribute('data-u'), d = spots[i].getAttribute('data-d');
      if (!u || !d) continue;
      var a = document.createElement('a');
      a.href = 'mailto:' + u + '@' + d;
      a.textContent = u + '@' + d;
      spots[i].textContent = '';
      spots[i].appendChild(a);
    }
    var btn = document.getElementById('themeBtn');
    if (btn) btn.addEventListener('click', function () {
      var next = isDark() ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
    });
  });

  /* Parse a user-typed number. Accepts "0.25", "0,25", ".25", "25." and spaces.
     Rejects anything else (letters, two separators, exponents, negatives). */
  function parse(v) {
    if (v == null) return NaN;
    var s = String(v).replace(/\s+/g, '');
    if (s === '') return NaN;
    if ((s.match(/[.,]/g) || []).length > 1) return NaN;
    s = s.replace(',', '.');
    if (!/^(\d+\.?\d*|\.\d+)$/.test(s)) return NaN;
    return parseFloat(s);
  }

  /* Read and validate an input. Marks the wrapper invalid when the text is present but unusable.
     opts: { gt: exclusive lower bound, min, max }. Returns NaN when empty or invalid. */
  function field(id, opts) {
    opts = opts || {};
    var el = document.getElementById(id);
    if (!el) return NaN;
    var wrap = el.closest ? el.closest('.input-unit') : null;
    var raw = el.value.trim();
    var v = parse(raw);
    var bad = raw !== '' && (
      !isFinite(v) ||
      (opts.gt != null && !(v > opts.gt)) ||
      (opts.min != null && v < opts.min) ||
      (opts.max != null && v > opts.max)
    );
    if (wrap) wrap.classList.toggle('is-invalid', bad);
    el.setAttribute('aria-invalid', bad ? 'true' : 'false');
    return (raw === '' || bad) ? NaN : v;
  }

  /* Fixed decimals, en-US grouping. */
  function fmt(x, dp) {
    if (!isFinite(x)) return '-';
    dp = dp || 0;
    return x.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });
  }
  /* Up to dp decimals, trailing zeros removed (3.50 -> 3.5, 7.0 -> 7). */
  function trim(x, dp) {
    if (!isFinite(x)) return '-';
    var p = Math.pow(10, dp == null ? 1 : dp);
    return String(Math.round(x * p) / p);
  }

  /* Pass a value to the next page (per-tab, survives one navigation). */
  function handoffSet(obj) { try { sessionStorage.setItem('at-handoff', JSON.stringify(obj)); } catch (e) {} }
  function handoffTake() {
    var o = null;
    try { o = JSON.parse(sessionStorage.getItem('at-handoff') || 'null'); sessionStorage.removeItem('at-handoff'); } catch (e) {}
    return o;
  }
  function query(name) { try { return new URLSearchParams(window.location.search).get(name); } catch (e) { return null; } }

  /* Segmented control built from <button data-value> children with aria-pressed. */
  function seg(el, onChange) {
    var btns = Array.prototype.slice.call(el.querySelectorAll('button[data-value]'));
    function set(v, silent) {
      btns.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-value') === v ? 'true' : 'false'); });
      if (!silent && onChange) onChange(v);
    }
    btns.forEach(function (b) { b.addEventListener('click', function () { set(b.getAttribute('data-value')); }); });
    return { set: set };
  }

  window.AT = { parse: parse, field: field, fmt: fmt, trim: trim, handoffSet: handoffSet, handoffTake: handoffTake, query: query, seg: seg };
})();
