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

  // 인생 지도: 해마다 한 번 그해의 마지막 모습(선택까지 끝난 뒤)을 남긴다 → 엔딩의 그래프
  function mark(p) {
    if (!Array.isArray(p.trace)) p.trace = [];
    const t = { a: p.age, h: Math.round(p.happy), r: S().relScore(p), hl: Math.round(p.stats.health), w: Math.round(S().netWorth(p)) };
    const last = p.trace[p.trace.length - 1];
    if (last && last.a === t.a) p.trace[p.trace.length - 1] = t; else p.trace.push(t);
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

  // 점수가 가운데로 몰리지 않도록, 중앙값 주변을 늘려 사람마다 다른 모양이 나오게 한다
  const spread = (x, mid, k, to) => U().clamp((to || mid) + (x - mid) * k, 0, 100);
  function scores(p) {
    const nw = S().netWorth(p);
    const money = nw <= 0 ? Math.max(5, 22 + nw / 2000) : 30 + Math.log10(1 + nw / 1000) * 21;
    // 일찍 떠난 인생은 건강 점수가 높게 나오지 않게 (63세 암 사망인데 '건강 95'가 되던 문제)
    const hp = p.avg.happy * 0.7 + p.happy * 0.3, hl = p.avg.health * 0.6 + p.stats.health * 0.4 - Math.max(0, 75 - p.age) * 1.0, rl = p.avg.rel * 0.5 + S().relScore(p) * 0.5;
    return {
      money: Math.round(U().clamp(money, 0, 100)),
      health: Math.round(spread(hl, 46, 1.5, 50)),
      happy: Math.round(spread(hp, 55, 1.7)),
      rel: Math.round(spread(rl, 53, 1.6)),
      achv: Math.round(spread(p.achv * 1.05, 49, 1.35)),
      exp: Math.round(spread(15 + p.exp * 1.8, 46, 1.4))
    };
  }
  // 인생 종합 — 돈은 일부일 뿐. 행복 · 관계 · 건강 · 성취가 함께 본다
  function total(s) { return Math.round(s.happy * 0.3 + s.rel * 0.2 + s.health * 0.15 + s.achv * 0.12 + s.money * 0.15 + s.exp * 0.08); }
  const GRADES = [[72, '충만한 인생'], [60, '만족스러운 인생'], [49, '무난한 인생'], [38, '아쉬움이 남는 인생'], [0, '고단했던 인생']];
  const grade = t => GRADES.find(g => t >= g[0])[1];

  // 가장 큰 갈림길 n개 (시기가 겹치지 않게)
  function crossroads(p, n) {
    const list = (p.cross || []).slice().sort((a, b) => b.w - a.w);
    const out = [];
    list.forEach(x => { if (out.length < n && out.every(o => Math.abs(o.a - x.a) >= 4)) out.push(x); });
    list.forEach(x => { if (out.length < n && out.indexOf(x) < 0) out.push(x); });
    return out.sort((a, b) => a.a - b.a);
  }

  // 지금까지의 선택이 만든 성향 — 어떤 선택을 거듭해 왔는가
  const TEND = [
    { k: 'bold', name: '도전형', icon: '🎲', w: { risk: 1.4, adventure: 1.2 } },
    { k: 'steady', name: '안정추구형', icon: '🛡️', w: { stability: 1.2, money: 0.3 } },
    { k: 'driven', name: '성취형', icon: '🏆', w: { career: 1.3, money: 0.7 } },
    { k: 'bonds', name: '관계중심형', icon: '🤝', w: { family: 1.2, love: 1.1, social: 1 } },
    { k: 'learner', name: '배움형', icon: '📖', w: { education: 1.3 } },
    { k: 'carer', name: '자기관리형', icon: '🌿', w: { health: 1.3 } },
    { k: 'free', name: '자유로운 영혼', icon: '🕊️', w: { rest: 1, hobby: 1.2, independence: 1.1 } }
  ];
  function tendency(p, min) {
    const total = Object.keys(p.intents).reduce((a, k) => a + p.intents[k], 0);
    if (total < (min || 6)) return null;
    let best = null;
    // 평균보다 얼마나 더 골랐는가(lift)로 본다 — 선택지 구성상 원래 많은 '안정'이 늘 이기지 않도록
    const lift = LG.DATA.lift;
    TEND.forEach(t => {
      const ws = Object.keys(t.w).reduce((a, k) => a + t.w[k], 0);
      const sc = Object.keys(t.w).reduce((a, k) => a + lift(p, k) * t.w[k], 0) / ws;
      if (!best || sc > best.sc) best = { sc, t };
    });
    return best && best.sc >= 1.25 ? best.t : null;
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
    const c = { dom: LG.Style ? LG.Style.dominant(p) : null, tend: tendency(p, 8) };
    const title = LG.DATA.endingTitles.find(x => x.if(s, p, c)).t;
    const tot = total(s);
    const best = LG.DATA.oneLiners.map(o => ({ t: o.t, sc: o.score(p, s) })).sort((a, b) => b.sc - a.sc)[0];
    // 가치관 문장도 '평균보다 유난히 많이 고른 쪽'(lift)으로 고른다 — 단순 횟수로 고르면 원래 많은 '안정'이 76%를 차지했다
    const lf = LG.DATA.lift;
    const topIntent = Object.keys(p.intents).filter(k => p.intents[k] >= 2 && LG.DATA.valueText[k]).sort((a, b) => (lf ? lf(p, b) - lf(p, a) : p.intents[b] - p.intents[a]))[0];
    const values = topIntent ? '당신은 ' + LG.DATA.valueText[topIntent] : '당신은 흘러가는 대로 살았습니다.';
    const g = p.luckLog.good, b = p.luckLog.bad;
    let luck;
    if (g >= b + 2) luck = '돌아보면, 운이 좋았던 순간이 많았습니다.';
    else if (b >= g + 2) luck = '노력만큼 풀리지 않은 순간이 유난히 많았습니다.';
    else if (g + b >= 3) luck = '행운과 불운이 공평하게 찾아온 인생이었습니다.';
    else luck = '운보다는 선택이 만들어 간 인생이었습니다.';
    const kids = p.people.filter(n => n.role === 'child').length;
    // 재혼했다면 지금 곁에 있는 배우자를 먼저 본다 (첫 배우자와 사별 후 재혼해도 '사별'로 나오던 문제)
    const spouse = p.people.find(n => n.role === 'spouse' && n.alive) || p.people.find(n => n.role === 'spouse');
    const lastJob = mainJob(p);
    // 타고난 재능 — 언제, 어떻게 알게 되었는가 (끝내 모른 채 지나간 재능도 있다)
    const talents = p.talents.map(t => {
      const T = LG.DATA.talents[t], f = p.found.indexOf(t) >= 0, g = (p.tgrade || {})[t] || 'common';
      const how = f ? (p.foundBy && p.foundBy[t]) || 'event' : null, at = p.foundAt[t];
      let line;
      if (g === 'genius') line = `천재 · ${at}세에 세상이 알아본, 한 시대에 몇 명 없는 재능`;
      else if (g === 'gifted') line = f ? `수재 · ${at}세에 일찍 눈에 띄었다` : '수재 · 끝내 빛을 보지 못했다';
      else if (!f) line = '범재 · 끝내 발견하지 못했다';
      else line = `범재 · ${at != null ? at + '세에 ' : ''}${at != null && at >= 30 ? '늦게 알게 된 재능' : '스스로 찾아낸 재능'}`;
      if (p.blocked && p.blocked[t] != null) line = `${g === 'genius' ? '천재' : g === 'gifted' ? '수재' : '범재'} · ${p.blocked[t]}세에 사정상 접어야 했다`;
      return { name: T.name, icon: T.icon, found: f, grade: g, prodigy: g === 'genius', line };
    });
    return {
      s, title, oneLiner: best.t, values, luck, total: tot, grade: grade(tot),
      dom: c.dom ? LG.Style.STYLES[c.dom] : null, tend: c.tend, cross: crossroads(p, 3),
      age: p.age, job: lastJob, kids, talents,
      spouse: spouse ? (spouse.alive ? '있음' : '사별') : p.flags.divorced ? '이혼' : '없음',
      net: S().netWorth(p), choices: p.choices, outcomes: p.outcomes
    };
  }

  LG.Timeline = { mark, add, highlights, scores, ending, mainJob, tendency, TEND, total, grade, crossroads };
})(window.LG = window.LG || {});
