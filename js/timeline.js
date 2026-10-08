/* TimelineSystem — 인생 기록, 연표 하이라이트, 엔딩 요약 */
(function (LG) {
  'use strict';
  const U = () => LG.U, S = () => LG.State;

  function add(p, t, kind, icon, keyLog) {
    t = LG.U.fixJosa(t);
    const h = { a: p.age, y: p.year, t, k: kind || 'minor', i: icon || '' };
    if (keyLog) h.x = 1; // 연표 하이라이트로 쓸 만한 명시적 기록
    p.history.push(h);
    if (kind === 'major' || kind === 'choice' || kind === 'birth') p.headline = t;
  }

  // 결과 카드용 핵심 사건
  function highlights(p, n) {
    const items = p.history.filter(h => h.k === 'major' || (h.k === 'choice' && h.x));
    if (items.length <= n) return items;
    // 인생 전체에 고르게 분포하도록 샘플링 (마지막 사건 우선 포함)
    const out = [];
    const step = items.length / n;
    for (let i = 0; i < n; i++) out.push(items[Math.floor(i * step + step / 2)]);
    return out;
  }

  function scores(p) {
    const nw = S().netWorth(p);
    const money = nw <= 0 ? Math.max(5, 22 + nw / 2000) : 30 + Math.log10(1 + nw / 1000) * 21;
    return {
      money: Math.round(U().clamp(money, 0, 100)),
      health: Math.round(U().clamp(p.avg.health * 0.6 + p.stats.health * 0.4, 0, 100)),
      happy: Math.round(U().clamp(p.avg.happy * 0.7 + p.happy * 0.3, 0, 100)),
      rel: Math.round(U().clamp(p.avg.rel * 0.5 + S().relScore(p) * 0.5, 0, 100)),
      achv: Math.round(U().clamp(p.achv * 1.05, 0, 100)),
      exp: Math.round(U().clamp(15 + p.exp * 1.8, 0, 100))
    };
  }

  // 가장 오래 한 일 = 그 사람의 직업
  function mainJob(p) {
    const h = p.jobHistory;
    if (!h.length) return '없음';
    const end = p.flags.retired != null ? p.flags.retired : p.age;
    const dur = {};
    h.forEach((j, i) => {
      const until = i + 1 < h.length ? h[i + 1].age : end;
      dur[j.id] = (dur[j.id] || 0) + Math.max(0, until - j.age) + 0.1;
    });
    const id = Object.keys(dur).sort((a, b) => dur[b] - dur[a])[0];
    return LG.DATA.jobs[id].name;
  }

  function ending(p) {
    const s = scores(p);
    const title = LG.DATA.endingTitles.find(x => x.if(s, p)).t;
    const best = LG.DATA.oneLiners.map(o => ({ t: o.t, sc: o.score(p, s) })).sort((a, b) => b.sc - a.sc)[0];
    const topIntent = Object.keys(p.intents).sort((a, b) => p.intents[b] - p.intents[a])[0];
    const values = topIntent ? '당신은 ' + LG.DATA.valueText[topIntent] : '당신은 흘러가는 대로 살았습니다.';
    const g = p.luckLog.good, b = p.luckLog.bad;
    let luck;
    if (g >= b + 2) luck = '돌아보면, 운이 좋았던 순간이 많았습니다.';
    else if (b >= g + 2) luck = '노력만큼 풀리지 않은 순간이 유난히 많았습니다.';
    else if (g + b >= 3) luck = '행운과 불운이 공평하게 찾아온 인생이었습니다.';
    else luck = '운보다는 선택이 만들어 간 인생이었습니다.';
    const kids = p.people.filter(n => n.role === 'child').length;
    const spouse = p.people.find(n => n.role === 'spouse');
    const lastJob = mainJob(p);
    return {
      s, title, oneLiner: best.t, values, luck,
      age: p.age, job: lastJob, kids,
      spouse: spouse ? (spouse.alive ? '있음' : '사별') : p.flags.divorced ? '이혼' : '없음',
      net: S().netWorth(p), choices: p.choices, outcomes: p.outcomes
    };
  }

  LG.Timeline = { add, highlights, scores, ending, mainJob };
})(window.LG = window.LG || {});
