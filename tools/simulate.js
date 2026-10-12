#!/usr/bin/env node
/* 밸런스 시뮬레이터 — 브라우저 없이 수백 판을 자동 플레이한다.
   사용법: node tools/simulate.js [판수=300] [전략=random|first|last]
   출력: 수명 분포, 선택 횟수, 예상 플레이 시간, 결과 분포, 오류 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]).filter(s => !s.startsWith('js/ui/') && !s.includes('ui.js') && !s.includes('main.js'));

const ctx = { window: {}, console, Math, Date, JSON, Object, Array };
ctx.window = ctx;
vm.createContext(ctx);
scripts.forEach(s => vm.runInContext(fs.readFileSync(path.join(root, s), 'utf8'), ctx, { filename: s }));
const LG = ctx.LG;

const N = +process.argv[2] || 300;
const strat = process.argv[3] || 'random';
const res = { ages: [], choices: [], time: [], errors: {}, jobs: {}, married: 0, kids: 0, net: [], titles: {}, liners: {}, events: {}, done: {}, byTier: {}, tierN: {}, outcomes: { success: 0, partial: 0, fail: 0 }, firstJobAge: [], college: 0, tiers: {}, scores: [] };

for (let i = 0; i < N; i++) {
  const p = LG.Game.newLife(i % 2 ? 'M' : 'F', 'sim' + i);
  if (process.env.TALENT) { const T = process.env.TALENT; p.talents = [T]; p.found = [T]; }
  let seconds = 6; // 출생 연출
  let guard = 0;
  try {
    while (p.alive && guard++ < 130) {
      const yr = LG.Game.advance(p);
      seconds += LG.Game.yearDelay(p.age) / 1000 + yr.lines.length * 0.15;
      let ev = LG.Game.pendingEvent(p);
      while (ev) {
        const vis = LG.Events.visibleChoices(p, ev);
        const c = (strat.indexOf('style:') === 0 && ev.id.indexOf('l_style') === 0) ? (vis.filter(x => x.id === strat.slice(6))[0] || vis.filter(x => x.id === 'keep')[0] || vis[0]) : strat.indexOf('intent:') === 0 ? (vis.filter(x => x.intent === strat.slice(7))[0] || vis[Math.floor(Math.random() * vis.length)]) : strat === 'first' ? vis[0] : strat === 'last' ? vis[vis.length - 1] : vis[Math.floor(Math.random() * vis.length)];
        res.events[ev.id] = (res.events[ev.id] || 0) + 1;
        LG.Game.choose(p, c.id);
        seconds += 11; // 읽기 + 선택 + 결과 연출
        ev = LG.Game.pendingEvent(p);
      }
    }
  } catch (e) {
    const k = (e.stack || String(e)).split('\n').slice(0, 3).join(' | ');
    res.errors[k] = (res.errors[k] || 0) + 1;
    continue;
  }
  Object.keys(p.done || {}).forEach(id => { res.done[id] = (res.done[id] || 0) + 1; const T = (res.byTier[p.family.tier] = res.byTier[p.family.tier] || {}); T[id] = (T[id] || 0) + 1; });
  res.tierN[p.family.tier] = (res.tierN[p.family.tier] || 0) + 1;
  const e = LG.Timeline.ending(p);
  res.ages.push(p.age); res.choices.push(p.choices); res.time.push(seconds / 60);
  res.jobs[e.job] = (res.jobs[e.job] || 0) + 1;
  if (p.flags.married || p.people.some(n => n.role === 'spouse' || n.role === 'ex_spouse')) res.married++;
  res.kids += e.kids; res.net.push(e.net);
  res.titles[e.title] = (res.titles[e.title] || 0) + 1;
  res.liners[e.oneLiner] = (res.liners[e.oneLiner] || 0) + 1;
  ['success', 'partial', 'fail'].forEach(k => res.outcomes[k] += p.outcomes[k]);
  if (p.jobHistory[0]) res.firstJobAge.push(p.jobHistory[0].age);
  if (p.flags.college) res.college++;
  const t = p.family.tier; res.tiers[t] = res.tiers[t] || { n: 0, happy: 0, money: 0, achv: 0 };
  res.tiers[t].n++; res.tiers[t].kids = (res.tiers[t].kids || 0) + e.kids; res.tiers[t].kidsMarried = (res.tiers[t].kidsMarried || 0) + (p.flags.married || p.people.some(n => n.role === 'spouse' || n.role === 'ex_spouse') ? 1 : 0); res.tiers[t].big = (res.tiers[t].big || 0) + (e.kids >= 3 ? 1 : 0); res.tiers[t].happy += e.s.happy; res.tiers[t].money += e.s.money; res.tiers[t].achv += e.s.achv;
  res.scores.push(e.s);
}

const q = (arr, f) => { const s = arr.slice().sort((a, b) => a - b); return s[Math.floor((s.length - 1) * f)]; };
const avg = a => a.reduce((x, y) => x + y, 0) / a.length;
const fmt = (o) => Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, v]) => `  ${k}: ${v}`).join('\n');
console.log(`=== ${N}판 (전략: ${strat}) ===`);
console.log(`수명    p10 ${q(res.ages, .1)} · 중앙 ${q(res.ages, .5)} · p90 ${q(res.ages, .9)} · 최소 ${q(res.ages, 0)} · 최대 ${q(res.ages, 1)}`);
console.log(`선택    p10 ${q(res.choices, .1)} · 중앙 ${q(res.choices, .5)} · p90 ${q(res.choices, .9)}`);
console.log(`시간(분) p10 ${q(res.time, .1).toFixed(1)} · 중앙 ${q(res.time, .5).toFixed(1)} · p90 ${q(res.time, .9).toFixed(1)}`);
console.log(`결과    성공 ${res.outcomes.success} · 부분 ${res.outcomes.partial} · 실패 ${res.outcomes.fail}`);
console.log(`결혼 경험 ${(res.married / res.ages.length * 100).toFixed(0)}% · 평균 자녀 ${(res.kids / res.ages.length).toFixed(2)} · 대학 ${(res.college / res.ages.length * 100).toFixed(0)}% · 첫 직장 나이 중앙 ${q(res.firstJobAge, .5)}`);
console.log(`순자산  p10 ${LG.U.money(q(res.net, .1))} · 중앙 ${LG.U.money(q(res.net, .5))} · p90 ${LG.U.money(q(res.net, .9))}`);
['money', 'health', 'happy', 'rel', 'achv', 'exp'].forEach(k => console.log(`점수 ${k.padEnd(6)} 중앙 ${q(res.scores.map(s => s[k]), .5)} (p10 ${q(res.scores.map(s => s[k]), .1)} ~ p90 ${q(res.scores.map(s => s[k]), .9)})`));
console.log('형편별 평균 (행복/돈/성취):');
Object.keys(res.tiers).sort().forEach(t => { const x = res.tiers[t]; console.log(`  ${t}단계 n=${x.n}  ${(x.happy / x.n).toFixed(0)} / ${(x.money / x.n).toFixed(0)} / ${(x.achv / x.n).toFixed(0)}  | 기혼자당 자녀 ${(x.kids / Math.max(1, x.kidsMarried)).toFixed(2)} · 3명 이상 ${(x.big / x.n * 100).toFixed(0)}%`); });
console.log('마지막 직업:\n' + fmt(res.jobs));
console.log('제목:\n' + fmt(res.titles));
console.log('한 줄:\n' + fmt(res.liners));
const evAll = LG.DATA.events.filter(e => e.tier !== 'auto').map(e => e.id);
const never = evAll.filter(id => !res.events[id]);
console.log('발생 빈도 상위:\n' + Object.entries(res.events).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([k, v]) => `  ${k}: ${(v / N).toFixed(2)}/판`).join('\n'));
console.log('한 번도 안 나온 선택 이벤트: ' + (never.join(', ') || '없음'));
if (process.env.FREQ) console.log('게임당 발생 비율(%) — 이벤트 전체:\n' + Object.entries(res.done).filter(([k]) => new RegExp(process.env.FREQ).test(k)).sort((a, b) => b[1] - a[1]).map(([k, v]) => `  ${k}: ${(v / res.ages.length * 100).toFixed(0)}%`).join('\n'));
if (process.env.BYTIER) { const ids = Object.keys(res.done).filter(k => new RegExp(process.env.BYTIER).test(k)); console.log('형편(1=어려움~5=부유)별 발생 비율(%)\n  id ' + [1,2,3,4,5].map(t => 'T' + t + '(n=' + (res.tierN[t] || 0) + ')').join(' ')); ids.sort().forEach(id => console.log('  ' + id + ' ' + [1,2,3,4,5].map(t => (((res.byTier[t] || {})[id] || 0) / Math.max(1, res.tierN[t] || 0) * 100).toFixed(0).padStart(4)).join(' '))); }
console.log('이벤트 수: 선택 ' + evAll.length + ' · 자동 ' + LG.DATA.events.filter(e => e.tier === 'auto').length);
if (Object.keys(res.errors).length) { console.log('\n!!! 오류:'); console.log(fmt(res.errors)); }
