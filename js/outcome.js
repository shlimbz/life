/* OutcomeSystem — 확정된 결과를 상태에 적용한다.
   효과 키: st hp sr money debt eff rel flag unflag edu major status job quit home house
            achv exp perf queue next discover liveIn fn */
(function (LG) {
  'use strict';
  const U = () => LG.U, S = () => LG.State;

  function setJob(p, id, o) {
    o = o || {};
    if (p.job) p.lastSalary = LG.Economy.salary(p);
    p.job = { id, years: 0, perf: Math.round(U().clamp(o.perf != null ? o.perf : 45 + LG.RNG.int(p, -5, 10), 5, 100)), mul: o.mul || 1, since: p.age };
    p.status = 'working';
    p.jobHistory.push({ id, age: p.age });
    if (id === 'athlete') S().flag(p, 'pro_athlete');
    p.seekTries = 0;
    p.exp += 1.5;
    if (p.home === 'parents' && p.age >= 20 && LG.RNG.chance(p, 0.25)) p.home = 'rent';
  }

  function quitJob(p, status) {
    if (p.job) { p.lastSalary = LG.Economy.salary(p); p.job = null; }
    p.status = status || 'seeking';
  }

  function apply(p, eff, ctx) {
    if (!eff) return '';
    let extra = '';
    const add = (k, d) => S().addStat(p, k, d);
    if (eff.st) Object.keys(eff.st).forEach(k => add(k, eff.st[k]));
    if (eff.hp) add('happy', eff.hp);
    if (eff.sr) add('stress', eff.sr);
    if (eff.money) p.money += eff.money;
    if (eff.debt) p.debt = Math.max(0, p.debt + eff.debt);
    if (eff.eff) Object.keys(eff.eff).forEach(k => { p.effort[k] = U().clamp((p.effort[k] || 0) + eff.eff[k], 0, 100); });
    if (eff.rel) Object.keys(eff.rel).forEach(k => LG.Rel.adjust(p, k, eff.rel[k]));
    if (eff.flag) [].concat(eff.flag).forEach(f => S().flag(p, f));
    if (eff.unflag) [].concat(eff.unflag).forEach(f => S().unflag(p, f));
    if (eff.edu) p.edu = eff.edu;
    if (eff.major) p.major = eff.major;
    if (eff.track) p.track = eff.track;
    if (eff.quit) quitJob(p, eff.quit === true ? 'seeking' : eff.quit);
    if (eff.job) setJob(p, eff.job, eff.jobOpt);
    if (eff.status) p.status = eff.status;
    if (eff.home) p.home = eff.home;
    if (eff.house !== undefined) p.house = eff.house;
    if (eff.achv) p.achv += eff.achv;
    if (eff.exp) p.exp += eff.exp;
    if (eff.perf && p.job) p.job.perf = U().clamp(p.job.perf + eff.perf, 0, 100);
    if (eff.liveIn) p.liveIn = eff.liveIn;
    if (eff.discover) {
      const t = eff.discover === true ? p.talents.find(x => p.found.indexOf(x) < 0) : eff.discover;
      if (t && p.talents.indexOf(t) >= 0 && p.found.indexOf(t) < 0) {
        S().discover(p, t, 'event');
        extra += ` ✨ ${LG.DATA.talents[t].name}에 재능이 있다는 걸 알게 되었다.`;
      }
    }
    if (eff.queue) eff.queue.forEach(q => p.queue.push({ id: q.id, at: p.age + (q.in || 0) }));
    if (eff.fn) {
      const r = eff.fn(p, ctx || {});
      if (typeof r === 'string') extra += ' ' + r;
    }
    if (p.money < 0 && LG.Invest) LG.Invest.raise(p, -p.money);
    return extra.trim();
  }

  function snapshot(p) {
    return {
      money: S().netWorth(p), health: p.stats.health, happy: p.happy, stress: p.stress, rel: S().relScore(p),
      intelligence: p.stats.intelligence, social: p.stats.social, physical: p.stats.physical,
      creativity: p.stats.creativity, mental: p.stats.mental
    };
  }

  const DELTA_META = {
    money: { icon: '💰', label: '자산' }, health: { icon: '❤️', label: '건강' }, happy: { icon: '😊', label: '행복' },
    stress: { icon: '😣', label: '스트레스', invert: true }, rel: { icon: '🤝', label: '관계' },
    intelligence: { icon: '🧠', label: '학습능력' }, social: { icon: '🗣️', label: '사교성' }, physical: { icon: '💪', label: '운동능력' },
    creativity: { icon: '🎨', label: '창의력' }, mental: { icon: '🧘', label: '정신력' }
  };

  function diff(a, b) {
    const out = [];
    Object.keys(DELTA_META).forEach(k => {
      const d = Math.round(b[k] - a[k]);
      if (k === 'money' ? Math.abs(d) >= 50 : Math.abs(d) >= 1) {
        const m = DELTA_META[k];
        out.push({ k, icon: m.icon, label: m.label, d, text: k === 'money' ? (d > 0 ? '+' : '') + U().money(d) : (d > 0 ? '+' : '') + d, good: m.invert ? d < 0 : d > 0 });
      }
    });
    return out;
  }

  LG.Outcome = { apply, setJob, quitJob, snapshot, diff };
})(window.LG = window.LG || {});
