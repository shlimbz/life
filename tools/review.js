#!/usr/bin/env node
/* 게임 리뷰 분석기 — 페이싱·반복·능력치 쏠림·막다른 길을 숫자로 본다.
   사용법: node tools/review.js [판수=300] */
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]).filter(s => !s.startsWith('js/ui/') && !s.includes('ui.js') && !s.includes('main.js'));
const ctx = { window: {}, console, Math, Date, JSON, Object, Array }; ctx.window = ctx; if (process.env.K) ctx.__K = +process.env.K; vm.createContext(ctx);
scripts.forEach(s => vm.runInContext(fs.readFileSync(path.join(root, s), 'utf8'), ctx, { filename: s }));
const LG = ctx.LG, N = +process.argv[2] || 300;
const q = (a, f) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.floor((s.length - 1) * f)] : 0; };
const ageEv = {}, ageLines = {}, dup = {}, titleCnt = {}, ch = {}, snap = { 20: [], 35: [], 50: [], 65: [], 80: [] };
const ending = { debtEnd: 0, poorEnd: 0, lowHappy: 0, n: 0 }, causes = {}, deathAges = [], stuck = { jobless30: 0, singleSeen: 0, noFriends40: 0 };
const evOut = {}, choiceCount = {}, lineKinds = {};
let maxLinesYear = 0, silentYears = 0, years = 0, evPerGame = [];
for (let i = 0; i < N; i++) {
  const p = LG.Game.newLife(i % 2 ? 'M' : 'F', 'rev' + i);
  let guard = 0, evs = 0; const seen = {};
  try {
    while (p.alive && guard++ < 130) {
      const yr = LG.Game.advance(p);
      years++;
      ageLines[p.age] = (ageLines[p.age] || 0) + yr.lines.length;
      if (yr.lines.length === 0 && !yr.event) silentYears++;
      maxLinesYear = Math.max(maxLinesYear, yr.lines.length);
      yr.lines.forEach(l => { const t = (l.t || '').replace(/\d+/g, '#'); seen[t] = (seen[t] || 0) + 1; });
      if (snap[p.age]) snap[p.age].push({ m: LG.State.netWorth(p), h: p.happy, s: p.stress, hl: p.stats.health, job: !!p.job, tier: p.family.tier });
      let ev = LG.Game.pendingEvent(p);
      while (ev) {
        evs++; ageEv[p.age] = (ageEv[p.age] || 0) + 1;
        const vis = LG.Events.visibleChoices(p, ev);
        const c = vis[Math.floor(Math.random() * vis.length)];
        const before = p.outcomes ? { s: p.outcomes.success, pa: p.outcomes.partial, f: p.outcomes.fail } : null;
        LG.Game.choose(p, c.id);
        if (before) { const k = ev.id + ':' + c.id; const o = (evOut[k] = evOut[k] || { s: 0, pa: 0, f: 0, n: 0 }); o.n++; o.s += p.outcomes.success - before.s; o.pa += p.outcomes.partial - before.pa; o.f += p.outcomes.fail - before.f; }
        ev = LG.Game.pendingEvent(p);
      }
    }
  } catch (e) { console.log('ERR', e.stack.split('\n').slice(0, 3).join(' | ')); continue; }
  evPerGame.push(evs);
  Object.keys(seen).forEach(t => { if (seen[t] >= 3) dup[t] = (dup[t] || 0) + 1; });
  ending.n++; if (p.debt > 0 && LG.State.netWorth(p) < 0) ending.debtEnd++; if (LG.State.netWorth(p) < 500) ending.poorEnd++; if (p.happy < 25) ending.lowHappy++;
  causes[p.cause] = (causes[p.cause] || 0) + 1; deathAges.push(p.age);
}
const pr = (k, v) => console.log(k.padEnd(26) + v);
console.log(`=== 리뷰 분석 ${ending.n}판 ===`);
pr('플레이 평균 선택 이벤트', (evPerGame.reduce((a, b) => a + b, 0) / evPerGame.length).toFixed(1) + ' (p10 ' + q(evPerGame, .1) + ' · p90 ' + q(evPerGame, .9) + ')');
pr('조용한 해(로그·이벤트 없음)', (silentYears / years * 100).toFixed(1) + '%');
pr('한 해 최다 로그 줄', maxLinesYear);
let bands = [[0, 6], [7, 12], [13, 18], [19, 29], [30, 44], [45, 59], [60, 74], [75, 110]];
console.log('나이대별 (선택 이벤트/판 · 로그줄/판):');
bands.forEach(([a, b]) => { let e = 0, l = 0; for (let x = a; x <= b; x++) { e += ageEv[x] || 0; l += ageLines[x] || 0; } console.log(`  ${a}-${b}세  선택 ${(e / ending.n).toFixed(1)}  로그 ${(l / ending.n).toFixed(1)}`); });
console.log('형편별 중앙 순자산(만원) 30/50/65세:');
[1,2,3,4,5].forEach(t => { const g = a => q(snap[a].filter(x => x.tier === t).map(x => x.m), .5); console.log(`  T${t}  35세 ${g(35)}  50세 ${g(50)}  65세 ${g(65)}  (n=${snap[35].filter(x => x.tier === t).length})`); });
console.log('시점별 상태 (중앙값 순자산(만원) / 행복 / 스트레스 / 건강, 무직 비율):');
Object.keys(snap).forEach(a => { const s = snap[a]; if (!s.length) return; console.log(`  ${a}세 n=${s.length}  자산 ${q(s.map(x => x.m), .5)} (p10 ${q(s.map(x => x.m), .1)})  행복 ${q(s.map(x => x.h), .5)}  스트 ${q(s.map(x => x.s), .5)}  건강 ${q(s.map(x => x.hl), .5)}  무직 ${(s.filter(x => !x.job).length / s.length * 100).toFixed(0)}%  스트90+ ${(s.filter(x => x.s >= 90).length / s.length * 100).toFixed(0)}%  행복<20 ${(s.filter(x => x.h < 20).length / s.length * 100).toFixed(0)}%`); });
pr('빚>자산으로 끝남', (ending.debtEnd / ending.n * 100).toFixed(1) + '%');
pr('순자산 500만 미만으로 끝남', (ending.poorEnd / ending.n * 100).toFixed(1) + '%');
pr('행복<25로 끝남', (ending.lowHappy / ending.n * 100).toFixed(1) + '%');
pr('사망 나이 p10/50/90', q(deathAges, .1) + ' / ' + q(deathAges, .5) + ' / ' + q(deathAges, .9));
console.log('사망 원인: ' + Object.entries(causes).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' · '));
console.log('한 판에 3번 이상 반복된 똑같은 문장 (판 수):');
Object.entries(dup).sort((a, b) => b[1] - a[1]).slice(0, 12).forEach(([t, c]) => console.log(`  ${c}판  ${t.slice(0, 60)}`));
console.log('선택지별 결과 편향 (표본≥25, 성공률 ≥92% 또는 ≤8%):');
Object.entries(evOut).filter(([, o]) => o.n >= 25 && (o.s + o.pa + o.f) > 0).forEach(([k, o]) => { const t = o.s + o.pa + o.f, r = o.s / t; if (r >= .92 || r <= .08) console.log(`  ${k}  n=${o.n} 성공 ${(r * 100).toFixed(0)}% 부분 ${(o.pa / t * 100).toFixed(0)}% 실패 ${(o.f / t * 100).toFixed(0)}%`); });
