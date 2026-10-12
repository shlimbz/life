/* 저장 — LocalStorage. 새로고침해도 이어할 수 있다. */
(function (LG) {
  'use strict';
  const KEY = 'krlife.save.v1', ARCHIVE = 'krlife.lives.v1', PREF = 'krlife.prefs.v1', DEX = 'krlife.dex.v1',
    BACKUP = 'krlife.save.backup', BROKEN = 'krlife.save.broken';

  function safe(fn, fallback) { try { return fn(); } catch (e) { return fallback; } }

  LG.Storage = {
    save(p) { safe(() => localStorage.setItem(KEY, JSON.stringify(p))); },
    // 불러오기: 버전별 변환(State.migrate) → 실패하면 원본을 따로 보관하고 새로 시작한다 (복구 절차)
    lastError: null,
    load() {
      const raw = safe(() => localStorage.getItem(KEY), null);
      if (!raw) return null;
      try {
        const p = JSON.parse(raw);
        const before = p && p.v;
        const out = LG.State.migrate(p);
        if (out && before !== out.v) safe(() => localStorage.setItem(BACKUP, raw)); // 변환 전 원본 한 부 보관
        return out;
      } catch (e) {
        safe(() => localStorage.setItem(BROKEN, raw));
        LG.Storage.lastError = '저장 데이터를 읽지 못해 따로 보관했어요 (' + (e && e.message || e) + ')';
        return null;
      }
    },
    // 손상 보관본/변환 전 백업에서 되살리기 시도
    restoreBackup() {
      const raw = safe(() => localStorage.getItem(BACKUP) || localStorage.getItem(BROKEN), null);
      if (!raw) return false;
      try { const p = LG.State.migrate(JSON.parse(raw)); LG.Storage.save(p); return true; } catch (e) { return false; }
    },
    clear() { safe(() => localStorage.removeItem(KEY)); },
    archive(summary) {
      const list = LG.Storage.lives();
      list.unshift(summary);
      safe(() => localStorage.setItem(ARCHIVE, JSON.stringify(list.slice(0, 20))));
    },
    lives() { return safe(() => JSON.parse(localStorage.getItem(ARCHIVE) || '[]'), []); },
    prefs() { return safe(() => JSON.parse(localStorage.getItem(PREF) || '{}'), {}); },
    dex() { return safe(() => JSON.parse(localStorage.getItem(DEX) || 'null'), null) || LG.Dex.empty(); },
    setDex(d) { safe(() => localStorage.setItem(DEX, JSON.stringify(d))); },
    setPref(k, v) { const o = LG.Storage.prefs(); o[k] = v; safe(() => localStorage.setItem(PREF, JSON.stringify(o))); }
  };
})(window.LG = window.LG || {});
