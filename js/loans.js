/* Loans — 빚을 종류별로 나눠 관리한다. p.debt 는 언제나 모든 대출의 합계다(다른 코드와의 호환).
   종류마다 금리 · 만기 · 상환 방식이 다르고, 여유 돈이 생기면 금리가 높은 빚부터 먼저 갚는다.
   정기 대출(주담대 · 전세 · 할부 · 학자금 · 사업)은 제때 내면 문제없고, 신용대출 · 대부업은 연체되면 독촉이 온다. 단위: 만원 */
(function (LG) {
  'use strict';
  const U = () => LG.U, S = () => LG.State, R = () => LG.RNG;

  const KINDS = {
    mortgage: { name: '주택담보대출', icon: '🏠', rate: 0.042, term: 30, regular: true },
    jeonse:   { name: '전세자금대출', icon: '🔑', rate: 0.038, term: 8, regular: true },
    install:  { name: '자동차·가전 할부', icon: '🚗', rate: 0.058, term: 5, regular: true },
    student:  { name: '학자금 대출', icon: '🎓', rate: 0.017, term: 10, regular: true },
    biz:      { name: '사업·정책 대출', icon: '🏪', rate: 0.05, term: 7, regular: true },
    prop:     { name: '투자 부동산 담보대출', icon: '🏘️', rate: 0.047, term: 20, regular: true },
    family:   { name: '가족에게 빌린 돈', icon: '🤝', rate: 0, term: 6, regular: true },
    deposit:  { name: '세입자 보증금', icon: '🏢', rate: 0, term: 0, regular: true },   // 갭투자: 집을 팔 때 돌려준다
    credit:   { name: '신용대출·카드론', icon: '💳', rate: 0.09, term: 3 },
    private:  { name: '대부업·사채', icon: '⚠️', rate: 0.19, term: 2 },
    hpension: { name: '주택연금(집 담보)', icon: '🏡', rate: 0.04, term: 0, regular: true },   // 갚지 않고 쌓이다가, 집으로 정산된다
    rehab:    { name: '채무조정 분할상환', icon: '⚖️', rate: 0.02, term: 8, regular: true }   // 신용회복위원회 채무조정·개인회생
  };
  // 여윳돈으로 먼저 갚는 순서 (금리 높은 것부터)
  const ORDER = ['private', 'credit', 'install', 'biz', 'rehab', 'family', 'student', 'prop', 'jeonse', 'mortgage', 'hpension', 'deposit'];

  const init = p => { if (!Array.isArray(p.loans)) p.loans = []; return p.loans; };
  const sum = p => init(p).reduce((a, l) => a + l.amt, 0);
  const get = (p, k) => init(p).find(l => l.k === k);
  const amount = (p, k) => { const l = get(p, k); return l ? l.amt : 0; };
  const fix = p => { p.loans = init(p).filter(l => l.amt >= 1); p.debt = Math.round(sum(p)); };

  // 새 빚 (같은 종류는 하나로 합친다)
  function add(p, k, amt, o) {
    amt = Math.round(amt);
    if (!(amt > 0)) return 0;
    if (!KINDS[k]) k = 'credit';
    o = o || {};
    let l = get(p, k);
    const term = o.term || KINDS[k].term;
    if (!l) { l = { k, amt: 0, left: term, rate: o.rate != null ? o.rate : KINDS[k].rate, late: 0, since: p.age }; p.loans.push(l); }
    else l.left = Math.max(l.left, term);
    l.amt += amt;
    fix(p);
    return amt;
  }

  // 빚을 갚는다: kinds 가 있으면 그 종류만, 없으면 금리 높은 순서로. 실제로 갚은 액수를 돌려준다
  function pay(p, amt, kinds) {
    let left = Math.round(amt), paid = 0;
    (kinds || ORDER).forEach(k => {
      const l = get(p, k);
      if (!l || left <= 0) return;
      const x = Math.min(l.amt, left);
      l.amt -= x; left -= x; paid += x;
      if (l.amt < 1) l.late = 0;
    });
    fix(p);
    return paid;
  }

  // 다른 코드가 p.debt 를 직접 바꿨으면 종류별 장부를 맞춘다
  function sync(p, hint) {
    init(p);
    const d = Math.round(p.debt || 0) - Math.round(sum(p));
    if (d > 0) add(p, hint || (p.status === 'college' ? 'student' : 'credit'), d);
    else if (d < 0) pay(p, -d);
    else fix(p);
  }

  // 해마다: 이자와 정해진 원금을 내고, 여윳돈이 있으면 비싼 빚부터 미리 갚는다
  function yearly(p) {
    const lines = [];
    sync(p);
    if (!p.loans.length) { p.lastLoanPay = 0; return lines; }
    const before = p.loans.map(l => ({ k: l.k, amt: l.amt }));
    let due = 0;
    const lateKinds = [];
    p.loans.forEach(l => {
      const K = KINDS[l.k];
      // 학자금은 취업 전까지 상환 유예, 세입자 보증금은 매매 때 한 번에 돌려준다
      // 학자금(취업 후 상환): 학생·군인이거나 연 소득이 상환 기준(약 2,500만 원) 아래면 원금 상환이 미뤄지고 연체도 없다
      const studentGrace = l.k === 'student' && (!p.job || ['college', 'grad', 'military', 'student'].indexOf(p.status) >= 0 || (p.lastIncome || 0) < 2500 || (p.job && p.job.id === 'parttime'));
      const grace = studentGrace || l.k === 'deposit' || l.k === 'hpension' || (l.pause || 0) > p.age;
      if (l.k === 'hpension') { l.amt += Math.round(l.amt * l.rate); return; }   // 주택연금: 이자는 쌓이기만 한다
      const interest = Math.round(l.amt * (l.rate != null ? l.rate : K.rate));
      let principal = grace ? 0 : Math.round(l.amt / Math.max(1, l.left));
      // 채무조정 상환액은 벌이에 맞춰 정해진다 (소득의 약 20%)
      if (l.k === 'rehab') principal = Math.min(principal, Math.max(0, Math.round((p.lastIncome || 0) * 0.2) - interest));
      // 상환 유예 중(학자금 유예·가족이 대신 내 주는 해)에는 이자만, 학자금 유예는 이자도 쌓아 둔다
      const need = studentGrace ? 0 : interest + principal;
      if (studentGrace) l.amt += Math.round(interest * 0.5);
      due += need;
      if (p.money < need && LG.Invest) LG.Invest.raise(p, need - p.money);
      const paid = Math.max(0, Math.min(p.money, need));
      p.money -= paid;
      if (paid >= need) {
        l.amt = l.amt - principal; l.late = 0;
        if (!grace) l.left = Math.max(1, l.left - 1);
      } else {
        // 못 낸 이자는 원금에 붙고, 신용대출·대부업은 연체 가산금리(연 3%p)가 더 붙는다. 연체가 쌓인다
        const covered = Math.max(0, paid - interest);
        l.amt = l.amt - covered + Math.max(0, interest - paid) + (K.regular ? 0 : Math.round(l.amt * 0.03));
        if (l.k !== 'rehab') {
          l.late = (l.late || 0) + 1; lateKinds.push(l.k);
          // 정기 대출이 처음 밀리면 → 연체 채권으로 넘어가기 전에 도움을 구할 기회
          if (KINDS[l.k].regular && l.late === 1 && ['install', 'biz', 'student', 'prop', 'mortgage', 'jeonse'].indexOf(l.k) >= 0 && (p.cool.m_loan_help || 0) <= p.age) p.queue.push({ id: 'm_loan_help', at: p.age });
        }
      }
    });
    p.lastLoanPay = due;

    // 주택연금은 집으로 정산한다: 집을 팔았거나 잃었으면 판 돈으로 갚고, 모자라는 부분은 청구되지 않는다(비소구)
    if (amount(p, 'hpension') > 0 && !p.house) {
      const x = amount(p, 'hpension'), cash = Math.min(Math.max(0, p.money), x);
      p.money -= cash; pay(p, x, ['hpension']);
    }
    // 미리 갚기: 생활비 여유분(비상금)을 남기고 남는 돈으로
    const reserve = LG.Invest ? LG.Invest.reserve(p) : 500;
    const spare = () => Math.max(0, p.money - reserve);
    // 신용대출·대부업은 투자 자산을 팔아서라도 먼저 정리한다 (투자 수익률보다 이자가 훨씬 비싸다)
    const costly = amount(p, 'private') + amount(p, 'credit');
    if (costly > 0 && LG.Invest && p.money - reserve < costly) LG.Invest.raise(p, costly - Math.max(0, p.money - reserve));
    pay(p, Math.min(spare(), costly), ['private', 'credit']);
    pay(p, spare(), ['install', 'biz', 'rehab', 'family', 'student']);
    // 주담대·전세대출은 여윳돈의 절반 정도만 중도상환 (나머지는 굴린다)
    const longTerm = amount(p, 'jeonse') + amount(p, 'mortgage') + amount(p, 'prop');
    if (longTerm > 0 && spare() > 300) pay(p, Math.round(spare() * 0.5), ['prop', 'jeonse', 'mortgage']);
    fix(p);

    // 다 갚은 빚 축하
    before.forEach(b => {
      if (b.amt < 50 || amount(p, b.k) >= 1 || b.k === 'deposit') return;
      const K = KINDS[b.k];
      const big = b.k === 'mortgage' || b.amt >= 5000;
      const dh = big ? 8 : 3, ds = big ? -6 : -3;
      S().addStat(p, 'happy', dh); S().addStat(p, 'stress', ds);
      lines.push({ t: big ? `${K.name}을 모두 갚았다! 은행 앱에서 대출 잔액 0원을 한참 바라봤다.` : `${K.name}을 다 갚았다.`, icon: K.icon, major: big, fx: `행복 +${dh} · 스트레스 ${ds}` });
      if (b.k === 'mortgage') S().flag(p, 'mortgage_done');
    });
    if (!p.loans.length && before.length && before.some(b => b.amt >= 1000) && !S().has(p, 'debt_free_once')) {
      S().flag(p, 'debt_free_once');
      lines.push({ t: '이제 빚이 하나도 없다. 어깨가 가벼워졌다.', icon: '🕊️', major: true });
    }

    // 채무조정 8~10년을 성실히 버티면 남은 빚은 면책된다
    const rh = get(p, 'rehab');
    if (rh && p.age - (rh.since || p.age) >= 9) {
      const x = rh.amt; pay(p, x, ['rehab']);
      S().addStat(p, 'happy', 8); S().addStat(p, 'stress', -10); S().flag(p, 'debt_cleared');
      lines.push({ t: `채무조정 기간을 끝까지 버텼다. 남은 빚 ${U().money(x)}원을 면책받았다.`, icon: '⚖️', major: true, fx: `빚 -${U().money(x)} · 행복 +8` });
    }
    // 연체가 길어지거나 비싼 빚이 감당할 수 없을 만큼 불어나면 → 채무조정(신용회복위원회)으로 넘어간다
    {
      const costly2 = amount(p, 'private') + amount(p, 'credit');
      const maxLate = Math.max(0, ...p.loans.filter(l => !KINDS[l.k].regular).map(l => l.late || 0));
      const inc = Math.max(1500, p.lastIncome || 0);
      if (costly2 > 0 && (maxLate >= 3 || (maxLate >= 1 && costly2 > inc * 3))) {
        const cut = Math.round(costly2 * (costly2 > inc * 5 ? 0.55 : 0.35));
        const had = !!get(p, 'rehab');
        pay(p, costly2, ['private', 'credit']);
        add(p, 'rehab', costly2 - cut, { term: 8 });
        if (!had) get(p, 'rehab').since = p.age;
        S().flag(p, 'rehab'); S().unflag(p, 'delinquent');
        S().addStat(p, 'stress', -6);
        lines.push({ t: `연체가 길어져 결국 채무조정을 신청했다. 원금 ${U().money(cut)}원이 감면되고, 남은 ${U().money(costly2 - cut)}원은 벌이에 맞춰 8년간 나눠 갚는다. 신용 기록에는 오래 남는다.`, icon: '⚖️', major: true, fx: `빚 -${U().money(cut)} · 스트레스 -6` });
      }
    }
    // 정기 대출도 2년 넘게 밀리면 정상 상환이 끝난다: 할부·사업·학자금은 카드사·보증기관이 대신 갚고 '연체 채권'(신용대출)으로 넘어온다.
    // 가족에게 빌린 돈은 오래 못 갚으면 가족이 그냥 덮어 준다 (대신 마음의 빚이 남는다)
    p.loans.slice().forEach(l => {
      if ((l.late || 0) < 2) return;
      if (['install', 'biz', 'student', 'prop'].indexOf(l.k) >= 0) {
        const x = l.amt; pay(p, x, [l.k]); add(p, 'credit', x); get(p, 'credit').late = 1;
        lines.push({ t: `${KINDS[l.k].name} 상환이 2년 넘게 밀려 연체 채권으로 넘어갔다. 이제 독촉이 시작된다.`, icon: '📵', major: true, fx: '스트레스 +6' });
        S().addStat(p, 'stress', 6);
      } else if (l.k === 'family' && l.late >= 3) {
        const x = l.amt; pay(p, x, ['family']);
        LG.Rel.adjust(p, 'parents', -4);
        lines.push({ t: `가족에게 빌린 ${U().money(x)}원을 끝내 갚지 못했다. "됐다, 잊어라." 그 말이 더 무거웠다.`, icon: '🤝', fx: `빚 -${U().money(x)}` });
      }
    });
    // 연체 → 신용대출·대부업은 독촉이 바로 온다, 정기 대출은 2년 넘게 밀리면 문제가 된다
    const bad = p.loans.filter(l => !KINDS[l.k].regular && l.late >= 1);
    if (bad.length) {
      S().flag(p, 'delinquent');
      const pv = bad.some(l => l.k === 'private');
      if ((p.cool.m_collect || 0) <= p.age) p.queue.push({ id: 'm_collect', at: p.age });
      if (!p.cool.lateMsg || p.cool.lateMsg <= p.age) {
        p.cool.lateMsg = p.age + 3;
        lines.push({ t: pv ? '대부업체 상환일을 넘겼다. 하루에도 몇 번씩 모르는 번호로 전화가 온다.' : '카드값·신용대출 상환이 밀렸다. 연체 안내 문자가 쌓인다.', icon: '📵', fx: '스트레스 +6' });
        S().addStat(p, 'stress', 6);
      }
    } else {
      S().unflag(p, 'delinquent');
      // 대부업 빚은 연체가 없어도 상환 안내·추가 대출 권유 연락이 잦다
      // (선택 이벤트는 연체됐을 때만, 평소에는 짧은 알림으로)
      if (amount(p, 'private') >= 300 && (p.cool.pvCall || 0) <= p.age) {
        p.cool.pvCall = p.age + 1;
        S().addStat(p, 'stress', 3);
        lines.push({ t: R().pick(p, ['대부업체에서 "상환일 안내드립니다" 전화가 왔다. 끊자마자 추가 대출 권유 문자가 온다.', '대부업 이자가 빠져나갔다. 원금은 거의 그대로다.', '모르는 번호로 전화가 오면 심장이 먼저 뛴다. 대부업체일까 봐.']), icon: '📞', fx: `대부업 빚 ${U().money(amount(p, 'private'))} · 스트레스 +3` });
      }
    }
    const mort = get(p, 'mortgage');
    if (mort && mort.late >= 2 && p.house) {
      // 주담대를 2년 넘게 못 갚으면 집이 경매로 넘어간다
      const v = Math.round(p.house.value * 0.85);
      const owe = mort.amt;
      p.house = null; p.home = 'rent';
      pay(p, Math.min(v, owe), ['mortgage']);
      if (v > owe) p.money += v - owe;
      const rest = amount(p, 'mortgage');
      if (rest > 0) { pay(p, rest, ['mortgage']); add(p, 'credit', rest); }
      S().addStat(p, 'happy', -14); S().addStat(p, 'stress', 10);
      lines.push({ t: '주택담보대출을 갚지 못해 집이 경매로 넘어갔다.', icon: '🏚️', major: true, fx: '행복 -14 · 스트레스 +10' });
    }
    fix(p);
    return lines;
  }

  // 올해 낼 원리금 추정 (생활비를 정할 때 먼저 떼어 둔다)
  function dueEstimate(p) {
    return init(p).reduce((a, l) => {
      if (l.k === 'deposit' || l.k === 'hpension' || (l.pause || 0) > p.age) return a;
      if (l.k === 'student' && (!p.job || (p.lastIncome || 0) < 2500)) return a;
      return a + Math.round(l.amt * (l.rate != null ? l.rate : KINDS[l.k].rate) + l.amt / Math.max(1, l.left));
    }, 0);
  }

  // 생활비가 모자라 새로 빌릴 때: 신용이 괜찮으면 카드론, 이미 연체 중이거나 신용대출이 많으면 대부업으로 밀려난다
  function borrow(p, need) {
    const inc = Math.max(1200, p.lastIncome || 0);
    const credit = amount(p, 'credit');
    const pushed = S().has(p, 'delinquent') || credit + need > inc * 1.2;
    return add(p, pushed ? 'private' : 'credit', need);
  }

  // 화면용 요약
  function list(p) {
    sync(p);
    return ORDER.map(k => get(p, k)).filter(Boolean).map(l => ({ k: l.k, name: KINDS[l.k].name, icon: KINDS[l.k].icon, amt: l.amt, rate: l.rate, left: l.left, late: l.late || 0, regular: !!KINDS[l.k].regular }));
  }

  LG.Loans = { KINDS, ORDER, init, sum, get, amount, add, pay, sync, yearly, borrow, list, dueEstimate };
})(window.LG = window.LG || {});
