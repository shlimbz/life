#!/usr/bin/env node
/* 자산·소득 분포 점검 — 나이별 순자산 분위수(형편별), 23세 월수입, 출생 형편 분포
   사용법: node tools/wealth.js [판수=600] [전략=random]
   기준(통계청 가계금융복지조사, 가구주 연령, 순자산 중앙값): ~29세 0.5억 / 30대 1.56억 / 40대 2.84억 / 50대 3.74억 / 60+ 2.5억 */
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]).filter(s => !s.startsWith('js/ui/') && !s.includes('ui.js') && !s.includes('main.js'));
const ctx = { window: {}, console, Math, Date, JSON, Object, Array }; ctx.window = ctx; vm.createContext(ctx);
scripts.forEach(s => vm.runInContext(fs.readFileSync(path.join(root, s), 'utf8'), ctx, { filename: s }));
const LG = ctx.LG;
const N = +process.argv[2] || 600, strat = process.argv[3] || 'random';
const AGES = [23, 29, 35, 45, 55, 65];
const snap = {}, inc23 = [], tierCount = {}, byTierN = {};
AGES.forEach(a => snap[a] = { all: [], t: {1: [], 2: [], 3: [], 4: [], 5: [] } });
for (let i = 0; i < N; i++) {
  const p = LG.Game.newLife(i % 2 ? 'M' : 'F', 'w' + i);
  tierCount[p.family.tier] = (tierCount[p.family.tier] || 0) + 1;
  let guard = 0;
  try {
    while (p.alive && p.age < 66 && guard++ < 130) {
      LG.Game.advance(p);
      let ev = LG.Game.pendingEvent(p);
      while (ev) {
        const vis = LG.Events.visibleChoices(p, ev);
        const c = strat.indexOf('intent:') === 0 ? (vis.filter(x => x.intent === strat.slice(7))[0] || vis[0]) : vis[Math.floor(Math.random() * vis.length)];
        LG.Game.choose(p, c.id); ev = LG.Game.pendingEvent(p);
      }
      if (snap[p.age]) { const nw = LG.State.netWorth(p) / 10000; snap[p.age].all.push(nw); snap[p.age].t[p.family.tier].push(nw); if (p.age === 23) inc23.push((p.lastIncome || 0) / 12); }
    }
  } catch (e) { console.log('ERR', e.stack.split('\n').slice(0, 2).join('|')); }
}
const q = (a, f) => { if (!a.length) return NaN; const s = a.slice().sort((x, y) => x - y); return s[Math.floor((s.length - 1) * f)]; };
const mean = a => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length);
const f = x => (isNaN(x) ? '  -  ' : x.toFixed(2)).padStart(7);
console.log('출생 형편 분포(1~5): ' + [1,2,3,4,5].map(t => t + ':' + ((tierCount[t] || 0) / N * 100).toFixed(0) + '%').join(' '));
console.log('순자산(억) — p1 p10 p50 p90 p99 | 평균');
AGES.forEach(a => {
  const s = snap[a].all;
  console.log(`${String(a).padStart(2)}세 전체: ${f(q(s, .01))}${f(q(s, .1))}${f(q(s, .5))}${f(q(s, .9))}${f(q(s, .99))} | ${f(mean(s))}  (n=${s.length})`);
  [1, 2, 3, 4, 5].forEach(t => { const x = snap[a].t[t]; if (x.length > 5) console.log(`      형편${t}:  ${f(q(x, .1))}${f(q(x, .5))}${f(q(x, .9))}  (n=${x.length})`); });
});
console.log(`23세 월수입(만원) p10 ${q(inc23, .1).toFixed(0)} · p50 ${q(inc23, .5).toFixed(0)} · p90 ${q(inc23, .9).toFixed(0)} · 평균 ${mean(inc23).toFixed(0)}`);
