/* Disease — 한국 통계에 맞춘 질병 발생과 사망.
   근거(대략값, 게임용으로 단순화):
   · 국가암등록통계(2022): 기대수명까지 생존 시 암 발생 확률 남 37.7% · 여 34.8%, 5년 상대생존율 72.9%
     (갑상선·유방·전립선 90%↑, 폐 40.6%, 간 39.4%, 췌장 16.5%) / 남 1위 폐암, 여 1위 유방암, 전체 1위 갑상선암
   · 사망원인통계: 1위 암, 2위 심장질환, 3위 폐렴, 4위 뇌혈관질환 (암 사망 1위 폐암, 이어서 간·대장·췌장·위)
   · 기대수명 남 약 80.6세 · 여 약 86.4세 (남성 사망률이 높다)
   p.dz = { cancer:{type,early,status,since}, heart:{status}, stroke:{status}, dementia, fatal, sudden } */
(function (LG) {
  'use strict';
  const U = () => LG.U, S = () => LG.State, R = () => LG.RNG;

  // 암 종류: 성별 비중(m/f), 5년 생존율(적극 치료 기준), 치료비(만원, 본인 부담 전), 위험 요인
  const CANCERS = {
    thyroid:  { name: '갑상선암', m: 0.07, f: 0.21, surv: 0.99, cost: 600 },
    breast:   { name: '유방암', m: 0, f: 0.22, surv: 0.93, cost: 2200 },
    colon:    { name: '대장암', m: 0.13, f: 0.11, surv: 0.75, cost: 2200 },
    stomach:  { name: '위암', m: 0.12, f: 0.07, surv: 0.78, cost: 1800, drink: 1.3 },
    lung:     { name: '폐암', m: 0.15, f: 0.08, surv: 0.41, cost: 3200, smoke: 3 },
    liver:    { name: '간암', m: 0.09, f: 0.03, surv: 0.39, cost: 3000, drink: 2.2 },
    prostate: { name: '전립선암', m: 0.11, f: 0, surv: 0.95, cost: 1500, minAge: 50 },
    pancreas: { name: '췌장암', m: 0.04, f: 0.04, surv: 0.17, cost: 3500, smoke: 1.6 },
    other:    { name: '혈액암', m: 0.06, f: 0.05, surv: 0.6, cost: 3500 }
  };
  // 연간 암 발생률 (나이대별, 성별) — 누적하면 83세까지 약 35~38%
  function cancerRate(age, g) {
    const t = age < 30 ? [0.0003, 0.0005] : age < 40 ? [0.0008, 0.0019] : age < 50 ? [0.0022, 0.0042] : age < 60 ? [0.0065, 0.0058]
      : age < 70 ? [0.0135, 0.0082] : age < 80 ? [0.021, 0.012] : [0.024, 0.015];
    return (g === 'M' ? t[0] : t[1]) * 0.92;
  }
  // 심근경색·협심증, 뇌졸중, 폐렴(노년), 고혈압·당뇨 진단
  const heartRate = (a, g) => (a < 40 ? 0.0002 : a < 50 ? 0.0012 : a < 60 ? 0.003 : a < 70 ? 0.006 : a < 80 ? 0.01 : 0.016) * (g === 'M' ? 1.5 : 0.75) * 0.8;
  const strokeRate = (a, g) => (a < 45 ? 0.0002 : a < 55 ? 0.0012 : a < 65 ? 0.0032 : a < 75 ? 0.0065 : a < 85 ? 0.012 : 0.018) * (g === 'M' ? 1.25 : 0.85) * 0.8;
  const pneumoRate = a => a < 72 ? 0 : a < 80 ? 0.004 : a < 90 ? 0.014 : 0.032;
  const chronicRate = a => a < 35 ? 0.002 : a < 50 ? 0.012 : a < 65 ? 0.025 : 0.02;

  const has = (p, f) => S().has(p, f);
  function dz(p) { return p.dz || (p.dz = {}); }

  // 생활 습관·환경에 따른 위험 배수
  function riskMul(p, kind) {
    let m = 1;
    const smoke = has(p, 'smoker'), drink = has(p, 'drinker') || has(p, 'alcoholic');
    if (kind === 'heart') { if (smoke) m *= 1.8; if (has(p, 'hypertension')) m *= has(p, 'bp_managed') ? 1.2 : 1.7; if (has(p, 'diabetes')) m *= has(p, 'dm_managed') ? 1.2 : 1.6; if (p.stress > 70) m *= 1.3; }
    if (kind === 'stroke') { if (smoke) m *= 1.5; if (has(p, 'hypertension')) m *= has(p, 'bp_managed') ? 1.3 : 2.2; if (has(p, 'diabetes')) m *= has(p, 'dm_managed') ? 1.15 : 1.4; if (drink) m *= 1.2; }
    if (kind === 'cancer') { if (smoke) m *= 1.35; if (drink) m *= 1.12; }
    if (kind !== 'cancer' && has(p, 'exercise_habit')) m *= 0.72;
    if (kind === 'cancer' && has(p, 'exercise_habit')) m *= 0.92;
    if (has(p, 'chronic')) m *= kind === 'cancer' ? 1.05 : 1.35;
    if (LG.Style && LG.Style.active(p) && LG.Style.key(p) === 'health') m *= kind === 'cancer' ? 0.93 : 0.82;
    if (p.stats.health < 40) m *= 1.25;
    // 몸과 마음의 상태: 건강·체력이 좋고 행복하면 덜 걸리고, 스트레스가 오래 쌓이면 더 걸린다 (심혈관 쪽이 더 민감)
    const sens = kind === 'cancer' ? 0.4 : 1;
    if (p.stats.health >= 70) m *= 1 - 0.15 * sens;
    if (p.stats.physical >= 65) m *= 1 - 0.12 * sens;
    if (p.happy >= 70) m *= 1 - 0.1 * sens;
    if (p.stress >= 70) m *= 1 + 0.25 * sens;
    return m;
  }

  function pickCancer(p) {
    const g = p.gender === 'M' ? 'm' : 'f';
    const w = {};
    Object.keys(CANCERS).forEach(k => {
      const c = CANCERS[k];
      if (c.minAge && p.age < c.minAge) return;
      let x = c[g];
      if (has(p, 'smoker') && c.smoke) x *= c.smoke;
      if ((has(p, 'drinker') || has(p, 'alcoholic')) && c.drink) x *= c.drink;
      if (k === 'thyroid' && p.age > 60) x *= 0.5;
      if ((k === 'lung' || k === 'prostate' || k === 'pancreas') && p.age < 50) x *= 0.3;
      if (x > 0) w[k] = x;
    });
    return R().weightedKey(p, w);
  }

  // 해마다: 새로 생기는 병 → 진단 이벤트 예약 (갑작스러운 발병은 그 자리에서 사망할 수도 있다)
  function yearly(p) {
    const lines = [], d = dz(p), a = p.age, g = p.gender;
    if (a < 18) return lines;
    // 완치 판정 (치료 후 5년)
    if (d.cancer && d.cancer.status === 'remission' && a - d.cancer.since >= 5) {
      d.cancer.status = 'cured'; S().flag(p, 'cancer_survivor'); S().unflag(p, 'cancer');
      lines.push({ t: `${CANCERS[d.cancer.type].name} 치료 5년. 완치 판정을 받았다. 병원 문을 나서며 하늘을 오래 올려다봤다.`, icon: '🎗️', major: true });
      S().addStat(p, 'happy', 10);
    }
    // 국가 건강검진 (40세 이상 2년마다, 수검률 약 70%) — 받으면 암을 일찍 발견할 가능성이 커진다
    if (a >= 40 && a % 2 === 0 && R().chance(p, has(p, 'skip_checkup') ? 0.3 : 0.72)) p.cool.screenedAt = a;
    const busy = p.queue.some(q => /^hl_(cancer|heart|stroke|pneumo|chronic)/.test(q.id));
    if (busy) return lines;
    // 암 (한 번 걸린 사람은 다른 암이 생길 수도 있지만 진행 중이면 새로 뽑지 않는다)
    if ((!d.cancer || d.cancer.status === 'cured') && R().chance(p, cancerRate(a, g) * riskMul(p, 'cancer') * (d.cancer ? 1.3 : 1))) {
      const type = pickCancer(p);
      // 최근 검진을 받았으면 일찍 발견할 가능성이 크다 (국가 암검진)
      const screened = p.cool && p.cool.screenedAt != null && a - p.cool.screenedAt <= 2;
      const early = R().chance(p, (screened ? 0.78 : 0.48) + (type === 'thyroid' ? 0.2 : 0) - (type === 'pancreas' || type === 'lung' ? 0.2 : 0));
      d.cancer = { type, early, status: 'dx', since: a };
      p.queue.push({ id: 'hl_cancer', at: a });
      return lines;
    }
    if (!d.heart && R().chance(p, heartRate(a, g) * riskMul(p, 'heart'))) {
      if (R().chance(p, 0.09)) { d.sudden = '갑작스러운 심근경색으로'; return lines; }
      d.heart = { status: 'dx', since: a }; p.queue.push({ id: 'hl_heart', at: a }); return lines;
    }
    if (!d.stroke && R().chance(p, strokeRate(a, g) * riskMul(p, 'stroke'))) {
      if (R().chance(p, 0.1)) { d.sudden = '갑작스러운 뇌졸중으로'; return lines; }
      d.stroke = { status: 'dx', since: a }; p.queue.push({ id: 'hl_stroke', at: a }); return lines;
    }
    if (R().chance(p, pneumoRate(a) * (p.stats.health < 40 ? 1.6 : 1) * (has(p, 'smoker') ? 1.3 : 1)) && (p.cool.pneumo || 0) <= a) {
      p.cool.pneumo = a + 3; p.queue.push({ id: 'hl_pneumo', at: a }); return lines;
    }
    if (!has(p, 'hypertension') || !has(p, 'diabetes')) {
      const r = chronicRate(a) * (p.stats.health < 50 ? 1.4 : 1) * (has(p, 'exercise_habit') ? 0.75 : 1) * (has(p, 'drinker') ? 1.2 : 1);
      if (R().chance(p, r)) p.queue.push({ id: 'hl_chronic', at: a });
    }
    return lines;
  }

  // 지금 앓고 있는 병이 더하는 연간 사망 위험
  function extraHazard(p) {
    const d = p.dz; if (!d) return 0;
    let h = 0;
    if (d.cancer) {
      const c = CANCERS[d.cancer.type], s = d.cancer.status;
      if (s === 'terminal') h += 0.32 + (1 - c.surv) * 0.2;
      else if (s === 'partial') h += Math.max(0.004, (1 - c.surv) * 0.2);
      else if (s === 'untreated') h += Math.max(0.006, (1 - c.surv) * 0.42);
      else if (s === 'remission') h += 0.012;
    }
    if (d.heart) h += d.heart.status === 'managed' ? 0.005 : 0.015;
    if (d.stroke) h += d.stroke.status === 'disabled' ? 0.035 : 0.008;
    if (d.dementia) h += p.age >= 80 ? 0.06 : 0.03;
    return h;
  }

  // 사망 원인 (앓던 병이 있으면 그 병, 없으면 나이대별 사망원인 통계 비중으로)
  function cause(p, fromDisease) {
    const d = p.dz || {}, a = p.age;
    if (d.sudden) return d.sudden;
    if (d.fatal) return d.fatal;
    if (fromDisease) return fromDisease;
    if (a >= 88 && p.stats.health > 25 && R().chance(p, 0.45)) return R().pick(p, ['잠든 채로 평온하게', '노환으로', '가족들 곁에서 조용히']);
    const w = a >= 75 ? { '폐렴으로': 8, '심장 질환으로': 11, '뇌혈관 질환으로': 8, '노환으로': 39, '가족들 곁에서 조용히': 15, '알츠하이머병으로': 6, '당뇨 합병증으로': 3, '짧은 투병 끝에': 9 }
      : a >= 50 ? { '심장 질환으로': 30, '뇌졸중으로': 22, '간 질환으로': 12, '당뇨 합병증으로': 8, '짧은 투병 끝에': 20, '사고로': 8 }
      : { '갑작스러운 사고로': 40, '급성 질환으로': 30, '심장 질환으로': 15, '짧은 투병 끝에': 15 };
    if (has(p, 'diabetes')) w['당뇨 합병증으로'] = (w['당뇨 합병증으로'] || 0) + 10;
    if (has(p, 'alcoholic') || has(p, 'drinker')) w['간 질환으로'] = (w['간 질환으로'] || 0) + 10;
    return R().weightedKey(p, w);
  }

  // 사망 판정에 쓰는 원인별 위험 (어떤 병으로 세상을 떠났는지 고르기 위함)
  function diseaseCauseLabel(p) {
    const d = p.dz || {};
    if (d.cancer && ['terminal', 'partial', 'untreated'].indexOf(d.cancer.status) >= 0) return `${CANCERS[d.cancer.type].name} 투병 끝에`;
    if (d.dementia && p.age >= 75) return '치매 합병증으로';
    if (d.stroke && d.stroke.status === 'disabled') return '뇌졸중 후유증으로';
    if (d.heart) return '심장 질환으로';
    return null;
  }

  // 의료비: 실손보험이 있으면 본인 부담이 크게 준다 (암은 산정특례로 원래도 일부만 부담)
  function medCost(p, base) {
    const ins = has(p, 'insured') ? 0.35 : 1;
    return Math.round(base * ins / 10) * 10;
  }

  LG.Disease = { CANCERS, cancerRate, yearly, extraHazard, cause, diseaseCauseLabel, medCost, riskMul };
})(window.LG = window.LG || {});
