/* Seed 기반 RNG — 같은 seed + 같은 선택 = 같은 인생 */
(function (LG) {
  'use strict';

  function hashSeed(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function newSeed() {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let s = '';
    for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  }

  // mulberry32 — 상태는 p.rngState(uint32)에 저장되어 저장/복원 시에도 이어진다
  function next(p) {
    p.rngState = (p.rngState + 0x6D2B79F5) >>> 0;
    let t = p.rngState;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  const RNG = {
    hashSeed, newSeed, next,
    float(p, a, b) { return a + next(p) * (b - a); },
    int(p, a, b) { return a + Math.floor(next(p) * (b - a + 1)); },
    chance(p, prob) { return next(p) < prob; },
    pick(p, arr) { return arr[Math.floor(next(p) * arr.length)]; },
    normal(p, mean, sd) {
      const u = Math.max(1e-9, next(p)), v = next(p);
      return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    },
    // items: [{..., w}] 또는 wfn(item)
    weighted(p, items, wfn) {
      const ws = items.map(it => Math.max(0, wfn ? wfn(it) : it.w || 0));
      const total = ws.reduce((a, b) => a + b, 0);
      if (total <= 0) return null;
      let r = next(p) * total;
      for (let i = 0; i < items.length; i++) {
        r -= ws[i];
        if (r <= 0) return items[i];
      }
      return items[items.length - 1];
    },
    // {key: weight}
    weightedKey(p, obj) {
      const keys = Object.keys(obj);
      const it = RNG.weighted(p, keys.map(k => ({ k, w: obj[k] })));
      return it ? it.k : keys[0];
    }
  };

  LG.RNG = RNG;
})(window.LG = window.LG || {});
