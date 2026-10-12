/* EconomySystem — 돈은 점수가 아니라 선택을 만드는 조건이다.
   연간: 수입 − 생활비 − 주거비 − 교육비 − 대출상환 − 가족비용 + 이자/연금 (단위: 만원) */
(function (LG) {
  'use strict';
  const U = () => LG.U, S = () => LG.State, R = () => LG.RNG;

  function salary(p) {
    if (!p.job) return 0;
    const J = LG.DATA.jobs[p.job.id];
    // 경력 15년까지는 정상 상승, 이후엔 완만하게
    const yrs = Math.min(p.job.years + (p.job.carry || 0), 32);
    const gr = J.growth * 0.8;
    const g = Math.pow(1 + gr, Math.min(yrs, 15)) * Math.pow(1 + gr / 3, Math.max(0, yrs - 15));
    const abroad = p.liveIn === 'abroad' ? 1.3 : 1; // 해외 임금 수준
    return Math.round(J.income * g * (0.8 + p.job.perf / 250) * (p.job.mul || 1) * abroad * (LG.Style ? LG.Style.income(p) : 1));
  }

  // 직업별 연봉 배수 상한 (고정급 직업은 승진·이직을 거듭해도 한계가 있다)
  function maxMul(id) {
    const J = LG.DATA.jobs[id];
    if (id === 'creator') return 7;
    if (id === 'ceo') return 3.5;
    return J && J.vary >= 0.3 ? 3.5 : 1.9;
  }

  function pension(p) {
    const base = 400 + Math.min(1700, (p.lastSalary || 0) * 0.22);
    return Math.round(base + (S().has(p, 'private_pension') ? 600 : 0));
  }

  function yearly(p) {
    const lines = [];
    const kids = LG.Rel.all(p, 'child');
    const sp = LG.Rel.get(p, 'spouse');
    const reg = S().liveRegion(p);
    const L = reg.living * (typeof window.__K === 'number' ? window.__K : 1.2);

    // 변동 소득 직업: 해마다 출렁인다
    if (p.job) {
      const J = LG.DATA.jobs[p.job.id];
      if (J.vary) {
        const drift = (p.job.perf - 55) * 0.0015 + p.luck * 0.002 - 0.08 * Math.log(p.job.mul);
        p.job.mul = U().clamp(p.job.mul * Math.exp(R().normal(p, drift, J.vary * 0.35)), 0.3, maxMul(p.job.id));
      }
    }

    // 미성년: 가계는 부모님 몫
    if (p.age < 19 && !p.job) {
      if (S().has(p, 'teen_job')) p.money += 150;
      else if (p.age >= 10) p.money += Math.round([0, 5, 15, 30, 60, 120][p.family.tier]);
      return lines;
    }

    let income = salary(p);
    if (p.status === 'retired') income = pension(p);
    else if (p.age >= 65 && !p.job) income = Math.max(income, 360); // 기초연금
    if (sp && sp.income && sp.alive) income += Math.round(sp.income * (sp.job ? 1 : 0.6));

    // 세금·4대보험 (누진 근사) + 소득이 늘면 씀씀이도 는다
    const tax = x => x * 0.11 + Math.max(0, x - 5000) * 0.14 + Math.max(0, x - 10000) * 0.12;
    let cost = tax(p.status === 'retired' ? 0 : salary(p)) + (sp && sp.job ? tax(sp.income) : 0);
    let fixedFamily = 0; // 가족 필수비용 (재량 지출보다 먼저 나간다)
    const SM = LG.Style ? LG.Style.mod(p) : { cost: 1, extra: 0 };
    const living = U().clamp(600 + income * 0.35, 900, 1900) * L * SM.cost; // 버는 만큼 아껴 산다
    if (p.home === 'parents') cost += p.job ? living * 0.6 : 120;
    else if (p.home === 'barracks') cost += 0;
    else cost += living;
    if (sp) fixedFamily += 650 * L;
    kids.forEach(c => {
      if (c.age <= 22) fixedFamily += (c.age < 7 ? 550 : c.age < 19 ? 750 : 900) * L;
      if (c.age >= 8 && c.age <= 18 && S().has(p, 'kid_hagwon')) fixedFamily += 450;
      if (c.age >= 8 && c.age <= 18 && S().has(p, 'kid_arts')) fixedFamily += 300;
    });
    cost += fixedFamily + Math.max(0, income - 2500 - fixedFamily) * 0.52 * SM.cost + (p.job || p.status === 'retired' ? income * SM.extra : 0);
    // 주거비
    if (!p.house && (p.home === 'rent' || p.home === 'abroad')) {
      let rent = reg.rent * ((!p.urban && !p.liveIn) ? 0.6 : 1) * U().clamp(0.45 + income / 8000, 0.45, 1);
      if (sp) rent *= 1.25;
      if (kids.some(c => c.age < 20)) rent *= 1.25;
      cost += rent;
    }
    // 대학 등록금
    if (p.status === 'college' || p.status === 'grad') {
      const tuition = S().has(p, 'scholarship') ? 150 : 720;
      const share = { 1: 0.1, 2: 0.35, 3: 0.7, 4: 1, 5: 1 }[p.family.tier] * U().clamp(S().supportScore(p) / 60, 0.5, 1.15);
      const mine = Math.round(tuition * (1 - U().clamp(share, 0, 1)));
      if (mine > 0) { p.debt += mine; if (!S().has(p, 'student_loan')) { S().flag(p, 'student_loan'); lines.push({ t: `등록금 일부를 학자금 대출로 메웠다.`, icon: '🏦' }); } }
      cost += p.home === 'parents' ? 0 : 400 * L; // 자취/기숙사 생활비
    }
    // 어려운 집안의 짐: 부모 세대의 빚·병원비·생활비를 일부 떠안는다 (부모님이 살아 계신 동안)
    if (p.age >= 22 && p.age <= 58 && p.job && LG.Rel.parents(p).length) cost += { 1: 300, 2: 130 }[p.family.tier] || 0;
    if (S().has(p, 'supporting_parents') && LG.Rel.parents(p).length) cost += 600;
    if (p.stats.health < 40) cost += 250 + (40 - p.stats.health) * 8;
    if (p.status === 'retired' || p.age >= 70) cost *= 0.9;

    // 빚이 많으면 허리띠를 졸라맨다
    if (p.debt > Math.max(income, 1500) * 1.5) cost *= 0.82;
    // 언젠가는 독립한다
    if (p.home === 'parents' && p.job && p.age >= 27 && R().chance(p, 0.22)) {
      p.home = 'rent';
      lines.push({ t: '부모님 집을 나와 독립했다. 첫날 밤은 이상하게 조용했다.', icon: '🔑', major: true });
    }
    const net = Math.round(income - cost);
    p.money += net;
    // 이자
    if (p.money > 0) p.money = Math.round(p.money * 1.015);
    // 대출: 이자 + 상환
    if (p.debt > 0) {
      p.debt = Math.round(p.debt * (p.debt > Math.max(income, 1500) * 4 ? 1.015 : 1.04)); // 과도한 빚은 채무조정
      const repay = Math.min(p.debt, Math.max(0, p.money), Math.round(p.debt * 0.1 + 150));
      p.money -= repay; p.debt -= repay;
    }
    if (p.money < 0 && LG.Invest) LG.Invest.raise(p, -p.money);
    if (p.money < 0) {
      p.debt += -p.money; p.money = 0;
      if (!p.cool.debtMsg || p.cool.debtMsg <= p.age) {
        lines.push({ t: '통장 잔고가 바닥났다. 빚으로 생활비를 메우는 중이다.', icon: '💸' });
        p.cool.debtMsg = p.age + 9;
      }
    }
    // 집값
    if (p.house) {
      const g = 0.014 + (reg.short === '서울' ? 0.01 : reg.short === '경기' ? 0.004 : -0.004);
      p.house.value = Math.round(p.house.value * (1 + R().normal(p, g, 0.03)));
    }
    // 감당 못 할 빚 → 집을 팔아 정리
    if (p.house && p.debt > Math.max(income * 4, 8000) && p.debt > p.house.value * 0.6) {
      const v = p.house.value; p.house = null; p.home = 'rent';
      const left = v - p.debt; p.debt = Math.max(0, -left); p.money += Math.max(0, left);
      lines.push({ t: '빚을 감당할 수 없어 집을 팔았다.', icon: '🏚️', major: true });
      S().addStat(p, 'happy', -10);
    }
    // 빚 스트레스
    const yearlyBase = Math.max(income, 1500);
    if (p.debt > yearlyBase * 4) { S().addStat(p, 'stress', 5); S().addStat(p, 'happy', -2); S().flag(p, 'heavy_debt'); }
    else S().unflag(p, 'heavy_debt');
    p.lastNet = net; p.lastIncome = income;
    return lines;
  }

  LG.Economy = { salary, pension, yearly, maxMul };
})(window.LG = window.LG || {});
