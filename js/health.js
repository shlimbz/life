/* HealthSystem — 나이·습관·스트레스·직업·지역 의료가 건강을 바꾸고,
   건강과 나이가 사망 위험(곰페르츠 곡선)을 결정한다. */
(function (LG) {
  'use strict';
  const U = () => LG.U, S = () => LG.State, R = () => LG.RNG;

  // 연간 사망 위험
  function hazard(age, health) {
    if (age < 1) return 0.0008;
    const base = 0.00016 * Math.exp(0.088 * (age - 30));
    let hMul = Math.exp((58 - health) / 22);
    if (health < 25) hMul *= 1 + (25 - health) * 0.15; // 위독하면 급격히 위험
    return U().clamp(base * hMul, 0.00005, 0.7);
  }

  function yearly(p) {
    const lines = [];
    const a = p.age;
    let d;
    if (a < 22) d = 0.3;
    else if (a < 35) d = -0.25;
    else if (a < 50) d = -0.45;
    else if (a < 65) d = -0.55;
    else if (a < 78) d = -0.85;
    else d = -1.3;
    // 회복력: 나이 기준치보다 크게 떨어져 있으면 조금씩 회복
    const baseline = 88 - Math.max(0, a - 30) * 0.6;
    if (p.stats.health < baseline - 18 && !S().has(p, 'cancer')) d += (baseline - 18 - p.stats.health) * 0.07;
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
    d += R().float(p, -0.8, 0.8);
    S().addStat(p, 'health', d);

    // 노력·습관은 시간이 지나면 흐려진다
    Object.keys(p.effort).forEach(k => { p.effort[k] = Math.max(0, p.effort[k] * 0.86 - 0.5); });

    // 경고 메시지
    if (p.stats.health < 30 && (!p.cool.healthMsg || p.cool.healthMsg <= a)) {
      lines.push({ t: '몸이 예전 같지 않다. 계단 오르는 것도 버겁다.', icon: '🩹' });
      p.cool.healthMsg = a + 5;
    }
    return lines;
  }

  function deathCheck(p) {
    if (p.age >= 104) return natural(p);
    const hz = hazard(p.age, p.stats.health);
    if (R().chance(p, hz)) return natural(p);
    return null;
  }

  function natural(p) {
    const a = p.age, h = p.stats.health;
    if (S().has(p, 'cancer')) return '오랜 투병 끝에';
    if (a >= 85 && h > 25) return '잠든 채로 평온하게';
    if (a >= 75) return R().pick(p, ['노환으로', '가족들 곁에서 조용히', '짧은 투병 끝에']);
    if (S().has(p, 'chronic') || h < 30) return '지병이 악화되어';
    if (a < 50) return R().pick(p, ['갑작스러운 사고로', '급성 질환으로']);
    return R().pick(p, ['갑작스러운 심장마비로', '뇌졸중으로', '짧은 투병 끝에']);
  }

  LG.Health = { hazard, yearly, deathCheck };
})(window.LG = window.LG || {});
