/* ProbabilitySystem — 선택은 결과가 아니라 방향이다.
   성공% = base + Σ(능력·환경·경제·관계·과거·재능·노력·건강·성격) + 숨은 운 */
(function (LG) {
  'use strict';
  const U = () => LG.U, S = () => LG.State;

  const REGION_LABEL = { edu: '지역 교육환경', job: '지역 일자리', culture: '지역 문화환경', community: '지역 공동체', medical: '지역 의료', mobility: '교통·이동성' };
  const EDU_RANK = { none: 0, elem: 1, middle: 2, high: 3, college: 4, grad: 5 };
  const INTENT_LABEL = { risk: '도전적인 성격', adventure: '모험심', stability: '안정 지향', career: '야망', education: '공부 성향', love: '연애 성향', social: '사교 성향', family: '가족 중심' };

  // 요인 계산기: 각 함수는 {label, v} 또는 null 반환
  const F = {
    stat(p, k, w) { return { label: S().STAT_LABEL[k], v: (p.stats[k] - 50) * w }; },
    // 노력: 10 미만이면 오히려 감점 (아무것도 안 하면 불리)
    eff(p, k, w) { const e = p.effort[k] || 0; return { label: e >= 10 ? S().EFF_LABEL[k] : S().EFF_LABEL[k] + ' 부족', v: (e - 10) * w }; },
    family(p, w) { return { label: '집안 형편', v: ((p.family.tier - 3) * 9 + (p.family.ext || 0) * 9) * w }; },
    support(p, w) { return { label: '부모님의 지원', v: (S().supportScore(p) - 55) * w }; },
    assets(p, w) {
      const nw = S().netWorth(p);
      const v = nw <= 0 ? -12 - Math.min(10, -nw / 1000) : Math.min(20, Math.log10(1 + nw / 500) * 9) - 6;
      return { label: nw > 0 ? '모아둔 돈' : '빚', v: v * w };
    },
    region(p, k, w) { return { label: REGION_LABEL[k] || '지역', v: (S().regionAttr(p, k) - 60) * w }; },
    talent(p, t, v) {
      if (!S().hasTalent(p, t)) return null;
      // 재능의 등급이 높을수록 효과가 크지만, 키울 기회를 잃은 재능은 힘을 잃는다
      const g = { genius: 1.6, gifted: 1.25 }[(p.tgrade || {})[t]] || 1;
      if (p.blocked && p.blocked[t] != null) return { label: LG.DATA.talents[t].name + ' (접어 둔 재능)', v: v * 0.3 };
      return { label: LG.DATA.talents[t].name + ' 재능', v: v * g };
    },
    trait(p, t, v) { return S().hasTrait(p, t) ? { label: LG.DATA.traits[t].name + ' 성격', v } : null; },
    flag(p, f, v, label) { return S().has(p, f) ? { label, v } : null; },
    noflag(p, f, v, label) { return !S().has(p, f) ? { label, v } : null; },
    stress(p, w) { return p.stress > 40 ? { label: '스트레스', v: -(p.stress - 40) * w } : null; },
    health(p, w) { return { label: '건강', v: (p.stats.health - 60) * w }; },
    happy(p, w) { return { label: '마음의 여유', v: (p.happy - 55) * w }; },
    edu(p, map) { const v = map[p.edu]; return v ? { label: '학력', v } : null; },
    eduMin(p, lvl, v) { return EDU_RANK[p.edu] < EDU_RANK[lvl] ? { label: '학력 조건', v: -v } : null; },
    ageOver(p, a, w) { return p.age > a ? { label: '나이', v: -(p.age - a) * w } : null; },
    ageUnder(p, a, w) { return p.age < a ? { label: '어린 나이', v: -(a - p.age) * w } : null; },
    rel(p, role, w) {
      const n = LG.Rel.get(p, role);
      if (!n) return null;
      return { label: (LG.Rel.ROLE_LABEL[role] || role) + '와의 관계', v: (n.rel - 55) * w };
    },
    perf(p, w) { return p.job ? { label: '업무 성과', v: (p.job.perf - 50) * w } : null; },
    jobYears(p, w, cap) { return p.job && p.job.years ? { label: '경력', v: Math.min(cap || 15, p.job.years * w) } : null; },
    job(p, ids, v, label) { return p.job && ids.indexOf(p.job.id) >= 0 ? { label, v } : null; },
    eduEnv(p, w) { return { label: '교육 환경', v: (p.family.eduEnv - 55) * w }; },
    fn(p, f) { return f(p); }
  };

  function factors(p, check, intent) {
    const list = [];
    (check.f || []).forEach(spec => {
      const fn = F[spec[0]];
      if (!fn) { console.warn('unknown factor', spec[0]); return; }
      const r = fn.apply(null, [p].concat(spec.slice(1)));
      if (r && Math.round(r.v) !== 0) list.push({ label: r.label, v: Math.round(r.v) });
    });
    // 성격 × 의도
    if (intent) {
      p.traits.forEach(t => {
        const T = LG.DATA.traits[t];
        const m = T.mods && T.mods[intent];
        if (m) list.push({ label: T.name + ' 성격', v: m });
      });
    }
    // 같은 방식을 거듭 택하면 그 방식에 익숙해진다 (숙련)
    if (intent && (p.intents[intent] || 0) >= 4 && INTENT_LABEL[intent]) list.push({ label: INTENT_LABEL[intent] + '(익숙함)', v: Math.min(5, Math.round(p.intents[intent] * 0.35)) });
    return list;
  }

  function compute(p, check, intent, hasPartial) {
    const list = factors(p, check, intent);
    const sum = list.reduce((a, x) => a + x.v, 0);
    const luck = p.luck; // 숨은 운 — 화면에 표시하지 않는다
    const min = check.min != null ? check.min : 5, max = check.max != null ? check.max : 92;
    const success = U().clamp(Math.round(check.base + sum + luck), min, max);
    let share = hasPartial ? (check.partial != null ? check.partial : 0.45) : 0;
    p.traits.forEach(t => { const v = LG.DATA.traits[t].variance; if (v) share *= v; });
    share = U().clamp(share, 0, 0.9);
    const partial = Math.round((100 - success) * share);
    const fail = 100 - success - partial;
    const expected = success + partial * 0.5;
    return { success, partial, fail, factors: list.sort((a, b) => Math.abs(b.v) - Math.abs(a.v)), label: label(expected), tone: tone(expected) };
  }

  function label(e) {
    if (e < 25) return '가능성 낮음';
    if (e < 45) return '쉽지 않음';
    if (e < 63) return '가능성 보통';
    if (e < 80) return '가능성 높음';
    return '매우 유리함';
  }
  function tone(e) { return e < 25 ? 'low' : e < 45 ? 'hard' : e < 63 ? 'mid' : e < 80 ? 'good' : 'great'; }

  function roll(p, prob) {
    const r = LG.RNG.next(p) * 100;
    let type;
    if (r < prob.success) type = 'success';
    else if (r < prob.success + prob.partial) type = 'partial';
    else type = 'fail';
    if (type === 'success' && prob.success < 35) p.luckLog.good++;
    if (type === 'fail' && prob.success > 68) p.luckLog.bad++;
    return type;
  }

  LG.Prob = { compute, roll, factors, F, EDU_RANK, INTENT_LABEL };
})(window.LG = window.LG || {});
