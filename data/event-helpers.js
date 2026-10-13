/* 이벤트 공용 헬퍼 (LG.EH) — 모든 data/events-*.js 가 이 파일 하나를 함께 쓴다.
   조건(has/anyFlag/jobIs/A …), 결과 함수(disc/lover/friend/mulJob/college …), 등록기(pusher)를 모아 둔다. */
(function (LG) {
  LG.DATA = LG.DATA || {};
  LG.DATA.events = LG.DATA.events || [];
  const has = (p, f) => Object.prototype.hasOwnProperty.call(p.flags, f);
  const tal = (p, t) => p.talents.indexOf(t) >= 0;
  const found = (p, t) => p.found.indexOf(t) >= 0;
  const H = LG.EH = {
    has, tal, found,
    S: () => LG.State,
    A: (p, d) => LG.Aff.get(p, d),                                  // 연관도(친화도)
    jobIs: (p, ...ids) => !!p.job && ids.indexOf(p.job.id) >= 0,
    jobIn: (p, ids) => !!p.job && ids.indexOf(p.job.id) >= 0,
    parentJob: (p, ...ids) => LG.Rel.parents(p).some(n => ids.indexOf(n.job) >= 0),
    tr: (p, t) => LG.State.hasTrait(p, t),
    poor: p => p.family.tier <= 2,
    net: p => LG.State.netWorth(p),
    kidsAlive: p => LG.Rel.all(p, 'child').filter(c => c.alive),
    kidsAt: (p, a, b) => LG.Rel.all(p, 'child').filter(c => c.alive && c.age >= a && c.age <= b),
    spouse: p => { const s = LG.Rel.get(p, 'spouse'); return s && s.alive ? s : null; },
    // 이벤트 등록기: 파일마다 기본값만 다르게 쓴다  const ch = H.pusher({ tier: 'choice', w: 12, max: 1 });
    pusher: defaults => o => LG.DATA.events.push(Object.assign({}, defaults, o)),
    anyFlag: (p, list) => list.some(f => has(p, f)),
    rel: (p, r) => LG.Rel.get(p, r),
    kids: p => LG.Rel.all(p, 'child'),
    single: p => !LG.Rel.get(p, 'partner') && !LG.Rel.get(p, 'spouse'),
    // 바로 쓸 수 있는 돈 = 통장 현금 + 투자 자산(예적금·주식·코인·리츠). 이벤트의 '돈이 있나?'와 금액 계산은 이걸 기준으로 한다
    // (현금만 보면 투자해 둔 사람은 늘 '돈이 없는' 사람이 된다 → 0원 증여 같은 문제)
    cash: p => Math.max(0, p.money) + (LG.Invest ? LG.Invest.total(p) : 0),
    // 아직 발견하지 못한 재능 중 목록에 있는 것을 발견
    disc: (...ts) => p => {
      const t = ts.find(x => tal(p, x) && !found(p, x));
      if (!t) return '';
      LG.State.discover(p, t, 'event');
      return `✨ ${LG.DATA.talents[t].name}에 재능이 있다는 걸 알게 되었다.`;
    },
    friend: (rel, note) => p => { LG.Rel.addFriend(p, rel, note); return ''; },
    // 새 연인 — 누구인지(나이·직업·성격) 한 줄로 분명히 남긴다 → 나중에 청혼이 와도 '이 사람이 누구지?'가 없게
    lover: o => p => { const n = LG.Rel.makeLoveInterest(p, o); LG.State.flag(p, 'dating'); return H.loverLine(n); },
    loverLine: n => n ? `(새 연인 ${n.name} · ${n.age}세 · ${n.job ? LG.DATA.jobs[n.job].name : '취업 준비 중'} · ${n.personality})` : '',
    seq: (...fns) => (p, ctx) => fns.map(f => f(p, ctx)).filter(x => typeof x === 'string' && x).join(' '),
    mulJob: m => p => { if (p.job) p.job.mul = Math.min(LG.Economy.maxMul(p.job.id, p), Math.round(p.job.mul * m * 1000) / 1000); return ''; },
    college: (years, kind) => p => { p.status = 'college'; p.college = { end: p.age + years, kind: kind || 'univ' }; if (LG.State.regionAttr(p, 'edu') < 70 && kind !== 'night') p.home = 'rent'; return ''; },
    tierDown: p => { p.family.tier = Math.max(1, p.family.tier - 1); return ''; },
    parentsDivorce: p => {
      const f = LG.Rel.get(p, 'father'), m = LG.Rel.get(p, 'mother');
      if (!f || !m) return '';
      const away = LG.RNG.chance(p, 0.7) ? f : m;
      away.rel = Math.max(10, away.rel - 25); away.support = Math.max(5, (away.support || 50) - 30); away.note = '따로 삶';
      p.family.tags = p.family.tags.filter(t => t !== 'conflict').concat('divorced_parents');
      p.family.tier = Math.max(1, p.family.tier - 1);
      LG.State.flag(p, 'parents_divorced');
      return '';
    },
    // 재능/노력 중 가장 강한 분야
    bestTalentFactor: p => {
      const t = p.talents.find(x => ['art', 'music', 'sport', 'math', 'writing', 'language'].indexOf(x) >= 0);
      if (!t) return null;
      if (p.blocked && p.blocked[t] != null) return { label: '접어 둔 재능', v: 6 };
      return { label: '타고난 재능', v: { genius: 45, gifted: 28 }[(p.tgrade || {})[t]] || 20 };
    }
  };
})(window.LG = window.LG || {});
