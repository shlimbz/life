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
      const nm = LG.Rel.ROLE_LABEL[role] || role;
      return { label: nm + U().josa(nm, '과', '와') + '의 관계', v: (n.rel - 55) * w };
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
    // 지금의 나(능력·건강·재산)가 같은 선택의 결과를 바꾼다 — 이벤트가 따로 정하지 않은 능력도 의도에 맞게 조금씩 반영
    const used = new Set((check.f || []).map(s => s[0] === 'stat' ? s[1] : s[0]));
    (PROFILE[intent] || []).forEach(([k, w, label0]) => {
      let label = label0;
      if (used.has(k)) return;
      let v;
      // 미성년·갓 성인은 '내 통장'이 아니라 '집안 형편'이 뒷받침한다 (15세 체육 특기생 선발에 '여윳돈'이 걸림돌로 뜨던 문제)
      if (k === 'assets' && (p.age < 20 || (p.age < 24 && ['college', 'military', 'retake', 'student'].indexOf(p.status) >= 0))) { const r = F.family(p, 1); v = r.v * w * 3; label = '집안 형편'; if (used.has('family')) return; }
      else if (k === 'assets') { const r = F.assets(p, 1); v = r.v * w * 4; }
      else if (k === 'health') v = (p.stats.health - 55) * w;
      else if (k === 'happy') v = (p.happy - 55) * w;
      else v = (p.stats[k] - 50) * w;
      v = U().clamp(v, -8, 8);
      if (Math.round(v) !== 0) list.push({ label, v: Math.round(v) });
    });
    // 같은 방식을 거듭 택하면 그 방식에 익숙해진다 (숙련)
    if (intent && (p.intents[intent] || 0) >= 4 && INTENT_LABEL[intent]) list.push({ label: INTENT_LABEL[intent] + '(익숙함)', v: Math.min(5, Math.round(p.intents[intent] * 0.35)) });
    // 같은 이름의 요인(이벤트가 정한 성격 + 성격×의도 보정 등)은 하나로 합친다 → "내향적 성격, 내향적 성격" 중복 표시 방지
    const merged = [];
    list.forEach(x => { const m = merged.find(y => y.label === x.label); if (m) m.v += x.v; else merged.push({ label: x.label, v: x.v }); });
    return merged.filter(x => x.v !== 0);
  }

  // 의도별로 함께 작용하는 '지금의 나' (k, 가중치, 표시 이름)
  const PROFILE = {
    love: [['social', 0.14, '사교성'], ['physical', 0.08, '매력·체력'], ['health', 0.06, '건강'], ['assets', 0.12, '경제력'], ['happy', 0.06, '밝은 기분']],
    career: [['intelligence', 0.12, '능력'], ['mental', 0.08, '정신력'], ['health', 0.05, '건강']],
    risk: [['mental', 0.1, '배짱'], ['intelligence', 0.08, '판단력'], ['assets', 0.15, '자본'], ['social', 0.06, '인맥']],
    adventure: [['mental', 0.08, '적응력'], ['social', 0.08, '사교성'], ['health', 0.06, '건강'], ['assets', 0.08, '여윳돈']],
    education: [['intelligence', 0.12, '학습능력'], ['mental', 0.06, '끈기']],
    family: [['social', 0.06, '배려심'], ['mental', 0.06, '마음의 여유'], ['assets', 0.08, '살림 형편']],
    health: [['health', 0.1, '지금의 건강'], ['physical', 0.08, '운동능력'], ['mental', 0.06, '의지']],
    social: [['social', 0.12, '사교성'], ['happy', 0.06, '밝은 기분']],
    money: [['intelligence', 0.1, '판단력'], ['assets', 0.1, '자본']],
    independence: [['mental', 0.1, '정신력'], ['assets', 0.06, '여윳돈']],
    hobby: [['creativity', 0.1, '창의력']],
    stability: [['mental', 0.06, '침착함']]
  };

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
