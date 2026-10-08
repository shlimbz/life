/* 저장 — LocalStorage. 새로고침해도 이어할 수 있다. */
(function (LG) {
  'use strict';
  const KEY = 'krlife.save.v1', ARCHIVE = 'krlife.lives.v1', PREF = 'krlife.prefs.v1';

  function safe(fn, fallback) { try { return fn(); } catch (e) { return fallback; } }

  LG.Storage = {
    save(p) { safe(() => localStorage.setItem(KEY, JSON.stringify(p))); },
    load() {
      const p = safe(() => JSON.parse(localStorage.getItem(KEY) || 'null'), null);
      return p && p.v === 1 ? p : null;
    },
    clear() { safe(() => localStorage.removeItem(KEY)); },
    archive(summary) {
      const list = LG.Storage.lives();
      list.unshift(summary);
      safe(() => localStorage.setItem(ARCHIVE, JSON.stringify(list.slice(0, 20))));
    },
    lives() { return safe(() => JSON.parse(localStorage.getItem(ARCHIVE) || '[]'), []); },
    prefs() { return safe(() => JSON.parse(localStorage.getItem(PREF) || '{}'), {}); },
    setPref(k, v) { const o = LG.Storage.prefs(); o[k] = v; safe(() => localStorage.setItem(PREF, JSON.stringify(o))); }
  };
})(window.LG = window.LG || {});
