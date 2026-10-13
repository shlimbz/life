/* HealthSystem — 나이·습관·스트레스·직업·지역 의료가 건강을 바꾸고,
   건강과 나이가 사망 위험(곰페르츠 곡선)을 결정한다. */
(function (LG) {
  'use strict';
  const U = () => LG.U, S = () => LG.State, R = () => LG.RNG;

  // 연간 사망 위험
  // 성별 차이: 한국 기대수명 남 약 80.6세 · 여 약 86.4세 (남성 사망률이 더 높다)
  const SEX = { M: 1.0, F: 0.32 };
  // 질병(암·심장·뇌졸중 등)은 LG.Disease 가 따로 더하므로, 기본 곡선은 그만큼 낮춘다
  const BASE_K = 0.3;
  // k: 플레이어는 질병을 따로 계산하므로 BASE_K, 주변 인물(NPC)은 1
  function hazard(age, health, sex, k) {
    if (age < 1) return 0.0008;
    const base = 0.00016 * Math.exp(0.088 * (age - 30) + (age > 75 ? 0.025 * (age - 75) : 0)) * (sex ? SEX[sex] : 1) * (k || 1);
    // 건강이 낮을수록 위험이 커지고, 나이가 많을수록 그 차이가 더 크게 작용한다
    let hMul = Math.exp((58 - health) / (age >= 70 ? 17 : 22));
    if (health < 30) hMul *= 1 + (30 - health) * 0.18; // 위독하면 급격히 위험
    return U().clamp(base * hMul, 0.00005, 0.7);
  }

  function yearly(p) {
    const lines = [];
    const a = p.age;
    let d;
    if (a < 22) d = 0.3;
    else if (a < 35) d = -0.25;
    else if (a < 50) d = -0.45;
    else if (a < 65) d = -0.6;
    // 노화는 갈수록 빨라진다: 60대 후반부터 해마다 더 크게 꺾인다 (관리하면 늦출 수 있다)
    else if (a < 75) d = -1.1 - (a - 65) * 0.05;
    else if (a < 85) d = -1.7 - (a - 75) * 0.08;
    else d = -2.6 - (a - 85) * 0.1;
    // 회복력: 나이 기준치보다 크게 떨어져 있으면 조금씩 회복 (나이가 들수록 기준치도, 회복력도 낮아진다)
    const baseline = 88 - Math.max(0, a - 30) * 0.75;
    if (p.stats.health < baseline - 18 && !S().has(p, 'cancer')) d += (baseline - 18 - p.stats.health) * (a >= 75 ? 0.04 : 0.07);
    d += p.effort.health * 0.022;
    if (S().has(p, 'smoker')) d -= 0.7;
    if (S().has(p, 'drinker')) d -= 0.35;
    if (p.stress > 70) d -= 0.7;
    if (p.stress > 85) d -= 0.6;
    if (p.happy > 70) d += 0.25;
    const J = S().job(p);
    if (J) d += J.hp;
    d += (S().regionAttr(p, 'medical') - 60) * 0.008;
    if (S().has(p, 'chronic')) d -= 0.5;
    // 앓고 있는 병은 몸을 조금씩 갉아먹는다 (예전엔 치료 안 한 암이 건강 수치를 깎지 않아, 암으로 떠나도 '건강 95'로 끝났다)
    const dz = p.dz || {};
    if (dz.cancer && LG.Disease) {
      const sv = LG.Disease.CANCERS[dz.cancer.type].surv, stt = dz.cancer.status;
      if (stt === 'untreated') d -= 1 + (1 - sv) * 10 + (dz.cancer.early ? 0 : 1.5);
      else if (stt === 'partial') d -= 0.8 + (1 - sv) * 5;
      else if (stt === 'terminal') d -= 6;
    }
    if (dz.heart && dz.heart.status !== 'managed') d -= 0.5;
    if (dz.stroke && dz.stroke.status === 'disabled') d -= 0.8;
    if (dz.dementia) d -= 0.6;
    d += R().float(p, -0.8, 0.8);
    S().addStat(p, 'health', d);

    // 노력·습관은 시간이 지나면 흐려진다
    Object.keys(p.effort).forEach(k => { p.effort[k] = Math.max(0, p.effort[k] * 0.86 - 0.5); });

    // 질병 발생 (암·심장·뇌졸중·폐렴·고혈압/당뇨) — 한국 통계 기반 (js/disease.js)
    if (LG.Disease) LG.Disease.yearly(p).forEach(l => lines.push(l));

    // 경고 메시지
    if (p.stats.health < 30 && (!p.cool.healthMsg || p.cool.healthMsg <= a)) {
      const d = p.dz || {};
      const t = d.stroke ? '한쪽 다리가 자꾸 끌린다. 지팡이 없이는 마트 가는 길도 멀다.'
        : d.heart ? '조금만 빨리 걸어도 가슴이 답답하다. 약통이 하나 더 늘었다.'
        : d.cancer && d.cancer.status !== 'cured' ? '항암 뒤로 입맛이 없다. 거울 속 얼굴이 낯설다.'
        : a >= 75 ? R().pick(p, ['아침에 일어나는 데 한참이 걸린다. 몸이 하루하루 무거워진다.', '병원 가는 날이 달력의 절반을 채웠다.', '계단 대신 엘리베이터만 찾게 됐다.'])
        : a >= 55 ? R().pick(p, ['몸이 예전 같지 않다. 계단 오르는 것도 버겁다.', '무릎과 허리가 번갈아 아프다. 쉬어도 피로가 풀리지 않는다.'])
        : R().pick(p, ['젊은 나이인데 몸이 자꾸 고장 난다. 이대로 괜찮을까.', '잠을 자도 개운하지 않다. 몸이 보내는 신호를 무시해 왔다.']);
      lines.push({ t, icon: '🩹' });
      p.cool.healthMsg = a + 8;
    }
    return lines;
  }

  function deathCheck(p) {
    const D = LG.Disease, d = p.dz || {};
    if (d.sudden || d.fatal) return D.cause(p);
    if (p.age >= 104) return D ? D.cause(p) : '노환으로';
    const base = hazard(p.age, p.stats.health, p.gender, BASE_K);
    const extra = D ? D.extraHazard(p) : 0;
    if (!R().chance(p, Math.min(0.85, base + extra))) return null;
    // 앓던 병 때문인지, 나이·건강 때문인지 (위험의 비중대로)
    if (extra > 0 && R().chance(p, extra / (base + extra))) return D.cause(p, D.diseaseCauseLabel(p));
    return D ? D.cause(p) : '노환으로';
  }

  LG.Health = { hazard, yearly, deathCheck };
})(window.LG = window.LG || {});
