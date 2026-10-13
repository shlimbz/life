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
    // 학력 프리미엄: 경력이 쌓일수록 학위의 차이가 벌어진다 (한국 임금 구조)
    const eduP = { grad: 1.14, college: 1.06 }[p.edu] || 0.94;
    const eduMul = 1 + (eduP - 1) * Math.min(1, yrs / 12);
    return Math.round(J.income * g * (0.8 + p.job.perf / 250) * (p.job.mul || 1) * abroad * eduMul * (LG.Style ? LG.Style.income(p) : 1));
  }

  // 직업별 연봉 배수 상한 (고정급 직업은 승진·이직을 거듭해도 한계가 있다)
  function maxMul(id, p) {
    const J = LG.DATA.jobs[id];
    if (id === 'ceo' && p && S().has(p, 'genius_founder')) return 14;   // 천재 창업가: 유니콘이 될 수도 있다
    if (id === 'creator' || id === 'idol' || id === 'entertainer') return 8;   // 대박이 나면 일반 직장의 수십 배
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
        p.job.mul = U().clamp(p.job.mul * Math.exp(R().normal(p, drift, J.vary * 0.35)), 0.3, maxMul(p.job.id, p));
      }
    }

    // 미성년: 가계는 부모님 몫
    if (p.age < 19 && !p.job) {
      // 용돈(10세~)과 세뱃돈(6세~) 중 쓰고 남은 돈 + 아르바이트. 형편이 좋을수록 많고, 극빈 가정은 거의 없다
      const t = p.family.tier, gm = LG.Birth.giftMul(p);
      const allowance = p.age >= 10 ? [0, 20, 40, 70, 110, 200][t] : 0;
      const sebae = p.age >= 6 ? [0, 10, 20, 40, 70, 150][t] : 0;
      p.money += Math.round((allowance * 0.3 + sebae * 0.6) * gm);
      if (S().has(p, 'teen_job')) p.money += 150;
      if (S().youngCarer(p) && p.age >= 14) { p.money -= 60; if (p.money < 0) { LG.Loans.add(p, 'credit', -p.money); p.money = 0; } }
      return lines;
    }

    let income = salary(p);
    // 건물 임대료 (공실·관리비를 뺀 순수입)
    if (p.bldg) { const r = Math.round(p.bldg.value * p.bldg.yield * (R().chance(p, 0.15) ? 0.6 : 1)); income += r; p.lastRent = r; }
    // 투자용 부동산 월세 (공실이 나는 해도 있다)
    p.lastPropRent = 0;
    if (p.prop && p.prop.yield) { const r = Math.round(p.prop.value * p.prop.yield * (R().chance(p, 0.12) ? 0.4 : 1)); income += r; p.lastPropRent = r; }
    if (p.status === 'retired') income = pension(p) + (p.bldg ? p.lastRent : 0) + p.lastPropRent;
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
    // 재량 지출 비율: 사회초년생은 쓰고(소비·학자금·월세), 중년은 모으고(집·노후), 은퇴 후엔 다시 쓴다
    const mc = p.age < 30 ? 0.55 : p.age < 52 ? 0.58 : 1;
    cost += fixedFamily;
    // 주거비
    if (!p.house && (p.home === 'rent' || p.home === 'abroad')) {
      let rent = reg.rent * ((!p.urban && !p.liveIn) ? 0.6 : 1) * U().clamp(0.45 + income / 8000, 0.45, 1);
      if (sp) rent *= 1.25;
      if (kids.some(c => c.age < 20)) rent *= 1.25;
      cost += rent;
    }
    // 대학 등록금
    if (p.status === 'college' || p.status === 'grad') {
      const tuition = (S().has(p, 'scholarship') ? 150 : 720) * (p.liveIn === 'abroad' ? 2.5 : 1);
      const share = { 1: 0.1, 2: 0.35, 3: 0.7, 4: 1, 5: 1 }[p.family.tier] * (p.family.ext < 0 ? 0 : 1) * U().clamp(S().supportScore(p) / 60, 0.5, 1.15);
      const mine = Math.round(tuition * (1 - U().clamp(share, 0, 1)));
      if (mine > 0) { LG.Loans.add(p, 'student', mine); if (!S().has(p, 'student_loan')) { S().flag(p, 'student_loan'); lines.push({ t: `등록금 일부를 학자금 대출로 메웠다.`, icon: '🏦' }); } }
      cost += p.home === 'parents' ? 0 : 400 * L; // 자취/기숙사 생활비
    }
    // 어려운 집안의 짐: 부모 세대의 빚·병원비·생활비를 일부 떠안는다 (부모님이 살아 계신 동안)
    if (p.age >= 22 && p.age <= 58 && p.job && LG.Rel.parents(p).length) cost += ({ 1: 300, 2: 130 }[p.family.tier] || 0) * LG.Birth.burdenMul(p);
    if (S().has(p, 'supporting_parents') && LG.Rel.parents(p).length) cost += 600;
    if (p.stats.health < 40) cost += LG.Disease ? LG.Disease.medCost(p, 250 + (40 - p.stats.health) * 8) : 250 + (40 - p.stats.health) * 8;
    // 자동차: 보험·기름값·정비 + 해마다 감가
    if (p.car) { cost += 280 * L; p.car.value = Math.round(p.car.value * 0.87); }
    // 보험료 (실손 약 12만/월 수준 → 연 150만, 암보험 포함 연 250만)
    if (S().has(p, 'insured') && p.age < 80) cost += S().has(p, 'cancer_insured') ? 250 : 150;
    // 암보험: 진단비가 한 번 나온다
    if (S().has(p, 'cancer_insured') && p.dz && p.dz.cancer && p.dz.cancer.since === p.age && !p.dz.cancer.paid) { p.dz.cancer.paid = true; p.money += 3000; lines.push({ t: '암보험 진단비 3,000만 원이 나왔다. 미리 들어 둔 보험이 이렇게 고마울 줄이야.', icon: '📄' }); }
    if (p.status === 'retired' || p.age >= 70) cost *= 0.96;
    // 재량 지출(외식·여가·쇼핑)은 꼭 나가야 할 돈을 다 내고 '남는 돈'에서 쓴다 → 벌이가 충분한데 빚이 쌓이는 일이 없게
    cost += Math.max(0, income - cost) * mc * SM.cost + (p.job || p.status === 'retired' ? income * SM.extra : 0);

    // 통장이 비고 빚이 있으면 씀씀이를 벌이에 맞춘다 (빚으로 생활비를 계속 메우지 않는다)
    if (p.money <= 0 && p.debt > 0 && cost > income) cost = income + (cost - income) * (p.age >= 60 ? 0.2 : 0.45);
    // 빚이 많으면 허리띠를 졸라맨다
    if (p.debt > Math.max(income, 1500) * 1.5) cost *= 0.82;
    // 연체 중이거나 채무조정 중이면 최소한으로 산다 (빚으로 생활비를 메우는 악순환을 끊는다)
    if (S().has(p, 'delinquent') || LG.Loans.amount(p, 'rehab') > 0) cost = Math.min(cost, Math.max(income * 0.9, fixedFamily + 500 * L));
    // 모아 둔 돈이 바닥나면 씀씀이를 벌이에 맞춘다: 일하는 사람은 조금 넘치는 정도까지만, 노년에는 버는 만큼만 (빚으로 생활비를 계속 메우지 않는다)
    const cushion = Math.max(0, p.money) + (LG.Invest ? LG.Invest.total(p) : 0);
    if (cushion <= 0 && cost > income) {
      const cap = p.age >= 65 ? income : income * 1.05 + 200;
      if (cost > cap) {
        cost = cap;
        if (p.age >= 65 && (p.cool.oldPoor || 0) <= p.age) { p.cool.oldPoor = p.age + 5; S().addStat(p, 'happy', -3); lines.push({ t: R().pick(p, ['연금만으로 한 달을 산다. 난방비가 무서워 내복을 껴입었다.', '모아 둔 돈이 바닥났다. 노인 일자리 공고를 오래 들여다봤다.', '병원비와 공과금을 내고 나면 남는 게 없다. 그래도 빚은 지지 않으려 애쓴다.']), icon: '🧓', fx: '행복 -3' }); }
      }
    }
    // 이미 카드론·대부업 빚이 벌이만큼 쌓였거나 연체·채무조정 중이면 더는 빌려주는 곳이 없다 → 버는 만큼만 쓰며 버틴다(생활고)
    const costlyNow = LG.Loans.amount(p, 'credit') + LG.Loans.amount(p, 'private');
    if ((costlyNow > Math.max(income, 1200) || S().has(p, 'delinquent') || LG.Loans.amount(p, 'rehab') > 0) && cost > income + Math.max(0, p.money)) {
      cost = income + Math.max(0, p.money);
      if ((p.cool.tight || 0) <= p.age) { p.cool.tight = p.age + 4; S().addStat(p, 'happy', -3); S().addStat(p, 'stress', 4); lines.push({ t: R().pick(p, ['더 빌릴 곳이 없다. 장바구니에서 하나씩 빼며 한 달을 버틴다.', '외식도 모임도 끊었다. 버는 만큼만 쓰며 버티는 중이다.']), icon: '🧾', fx: '행복 -3 · 스트레스 +4' }); }
    }
    // 언젠가는 독립한다
    if (p.home === 'parents' && p.job && p.age >= 27 && R().chance(p, 0.22)) {
      p.home = 'rent';
      lines.push({ t: '부모님 집을 나와 독립했다. 첫날 밤은 이상하게 조용했다.', icon: '🔑', major: true });
    }
    const net = Math.round(income - cost);
    p.money += net;
    // 예금 이자
    if (p.money > 0) p.money = Math.round(p.money * 1.015);
    // 대출: 종류별 이자 + 원금 상환, 여윳돈으로 비싼 빚부터 미리 갚기 (js/loans.js)
    const m0 = p.money;
    LG.Loans.yearly(p).forEach(l => lines.push(l));
    const loanPaid = Math.max(0, m0 - p.money);
    if (p.money < 0 && LG.Invest) LG.Invest.raise(p, -p.money);
    if (p.money < 0) {
      const need = -p.money; p.money = 0;
      LG.Loans.borrow(p, need);
      if (!p.cool.debtMsg || p.cool.debtMsg <= p.age) {
        lines.push({ t: R().pick(p, ['통장 잔고가 바닥났다. 카드론으로 생활비를 메우는 중이다.', '월말마다 카드값이 먼저 보인다. 빚으로 한 달을 넘기는 날이 늘었다.', '잔고가 비어 간다. 대출 앱을 여는 손이 점점 익숙해진다.']), icon: '💸', fx: `새 빚 +${U().money(need)}` });
        p.cool.debtMsg = p.age + 4;
      }
    }
    // 부동산(집 · 투자용 부동산 · 건물) 값은 부동산 시장을 따라 움직인다 (LG.Invest.realEstate)
    // 감당 못 할 빚 → 집을 팔아 정리 (빚이 연 소득의 6배를 넘고 집값의 70%를 넘을 때)
    if (p.house && p.debt > Math.max(income * 6, 10000) && p.debt > p.house.value * 0.7) {
      const v = p.house.value; p.house = null; p.home = 'rent';
      const paid = LG.Loans.pay(p, Math.min(v, p.debt));
      p.money += Math.max(0, v - paid);
      lines.push({ t: '빚을 감당할 수 없어 집을 팔았다.', icon: '🏚️', major: true, fx: '행복 -10' });
      S().addStat(p, 'happy', -10);
    }
    // 빚 스트레스
    const yearlyBase = Math.max(income, 1500);
    // 무거운 빚: 집을 담보로 한 정상적인 대출은 빼고 본다 (주담대가 소득의 몇 배인 건 흔한 일)
    const L2 = LG.Loans, longDebt = L2.amount(p, 'mortgage') + L2.amount(p, 'jeonse') + L2.amount(p, 'deposit') + L2.amount(p, 'prop');
    if (p.debt - longDebt > yearlyBase * 2.5 || p.debt > yearlyBase * 9 || L2.amount(p, 'private') > 0) { S().addStat(p, 'stress', 5); S().addStat(p, 'happy', -2); S().flag(p, 'heavy_debt'); }
    else S().unflag(p, 'heavy_debt');
    p.lastNet = net - loanPaid; p.lastIncome = income; p.lastLoanOut = loanPaid;
    return lines;
  }

  LG.Economy = { salary, pension, yearly, maxMul };
})(window.LG = window.LG || {});
