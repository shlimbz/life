/* 이벤트 — 자산관리: 돈을 벌기 시작하면 '어떻게 굴릴지' 정하고, 시장이 흔들릴 때마다 판단한다.
   투자 방식(LG.Invest.POLICY)은 상태 시트의 자산 탭에서 언제든 바꿀 수 있다. 금액 단위: 만원 */
(function (LG) {
  const E = LG.DATA.events;
  const H = LG.EH, has = H.has, seq = H.seq;
  const I = () => LG.Invest, U = () => LG.U, S = () => LG.State;
  const kids = H.kids;
  const ORDER = ['cash', 'saver', 'balanced', 'growth', 'yolo'];
  const setPolicy = (key, text, flags) => p => {
    I().setPolicy(p, key);
    (flags || []).forEach(f => S().flag(p, f));
    return text;
  };
  const shift = d => p => {
    const i = Math.max(0, ORDER.indexOf(p.invPolicy));
    const k = ORDER[Math.max(1, Math.min(ORDER.length - 2, i + d))];
    I().setPolicy(p, k);
    return `투자 방식을 '${I().POLICY[k].name}'(으)로 바꿨다.`;
  };

  // ───────────── 처음으로 돈을 굴리기 시작할 때 ─────────────
  E.push({
    id: 'm_asset_start', cat: 'money', tier: 'major', ages: [20, 60], milestone: true, prio: 4, icon: '💰',
    if: p => !has(p, 'asset_start') && p.liveIn !== 'abroad_none' && ((!!p.job && p.job.years >= 1 && p.money >= 300) || p.money >= 2500),
    label: '자산관리', title: p => p.job ? '월급, 어떻게 굴릴까' : '목돈이 생겼다',
    text: p => (p.job ? `통장에 월급이 쌓이기 시작했다. 지금 ${U().money(p.money)}원. 이대로 두면 물가에 조금씩 녹아내릴 텐데, 어떻게 할까?` : `통장에 ${U().money(p.money)}원이 모였다. 이 돈을 어떻게 굴릴지 정해야 한다.`) + ' (투자 방식은 나중에 상태 > 자산에서 언제든 바꿀 수 있다)',
    choices: [
      { id: 'saver', label: '예적금 위주로 차곡차곡 (안전)', intent: 'stability',
        out: { t: '', log: '예적금 위주로 자산관리 시작', hp: 3, sr: -3, flag: 'saved_early', fn: setPolicy('saver', '자동이체 적금부터 걸었다. 느리지만 마음이 편하다.') } },
      { id: 'balanced', label: '적립식 ETF·주식을 곁들여 균형 있게', intent: 'money',
        out: { t: '', log: '적립식 투자로 자산관리 시작', hp: 4, fn: setPolicy('balanced', '월급의 일부를 적립식 ETF로 자동 매수하도록 걸어 두었다.', ['investor']) } },
      { id: 'growth', label: '주식 중심으로 과감하게 (성장)', intent: 'risk',
        out: { t: '', log: '주식 중심의 성장 투자 시작', hp: 6, sr: 3, fn: setPolicy('growth', '증권 앱을 깔고 계좌를 만들었다. 숫자가 오르내릴 때마다 심장이 뛴다.', ['investor']) } },
      { id: 'yolo', label: '코인·주식에 크게 건다 (공격)', intent: 'risk',
        out: { t: '', log: '공격적인 투자 시작', hp: 8, sr: 8, fn: setPolicy('yolo', '"한 방이면 인생이 바뀐다." 차트를 켜 두고 잠을 설친다.', ['investor', 'gambler']) } },
      { id: 'cash', label: '일단 쓰고 즐긴다 (투자 안 함)', intent: 'rest',
        out: { t: '', log: '당분간 투자하지 않기로 함', hp: 10, sr: -5, flag: 'spender', fn: setPolicy('cash', '지금의 행복도 자산이다. 통장은 당분간 그대로 둔다.') } }
    ]
  });

  // ───────────── 정기 점검 ─────────────
  E.push({
    id: 'm_asset_review', cat: 'money', tier: 'choice', ages: [30, 70], w: 9, cd: 8, max: 4, icon: '🧮',
    if: p => has(p, 'asset_start') && p.money + I().total(p) >= 3000,
    label: '자산관리', title: p => p.age >= 55 ? '은퇴 자금 점검' : '자산 포트폴리오 점검',
    text: p => `${p.age}세. 지금 투자 방식은 '${I().POLICY[p.invPolicy || 'cash'].name}'. 금융 자산은 ${U().money(p.money + I().total(p))}원이다. ` + (p.age >= 55 ? '노후가 가까워졌다. 지금부터는 얼마를 벌기보다 얼마를 지키느냐가 중요해질지도 모른다.' : '살면서 상황이 달라졌다. 지금 방식이 여전히 나에게 맞을까?'),
    choices: [
      { id: 'safer', label: '더 안전하게 (비중 조정)', intent: 'stability', out: { t: '', log: '자산을 안전한 쪽으로 재배분', sr: -4, fn: shift(-1) } },
      { id: 'keep', label: '지금 방식을 유지한다', intent: 'stability', out: { t: '꾸준함이 최고의 전략이라 믿기로 했다.', minor: true } },
      { id: 'riskier', label: '더 공격적으로', intent: 'risk', if: p => p.age < 58, out: { t: '', log: '더 공격적인 투자로 전환', sr: 4, fn: shift(1) } },
      { id: 'pension', label: '연금저축·IRP를 새로 든다', intent: 'stability', if: p => !has(p, 'private_pension') && !!p.job,
        out: { t: '매달 조금씩 노후를 위해 쌓아 가기로 했다. 세액공제는 덤이다.', log: '연금저축 가입', flag: ['private_pension', 'saved_early'], hp: 3 } }
    ]
  });

  // ───────────── 시장 사건 (Invest.yearly가 예약) ─────────────
  E.push({
    id: 'm_crash', cat: 'money', tier: 'major', queued: true, cd: 9, icon: '📉',
    if: p => p.inv && p.inv.stock >= 1000,
    label: '시장 폭락', title: '계좌가 파랗다',
    text: p => `증시가 크게 무너졌다. 내 주식 계좌는 ${U().money(p.inv.stock)}원이 남았다. 단체 대화방엔 "손절했다" "바닥이다" 말이 엇갈린다.`,
    choices: [
      { id: 'hold', label: '묵묵히 버틴다', intent: 'stability',
        check: { base: 50, partial: 0.4, f: [['stat', 'mental', 0.45], ['trait', 'careful', 8], ['trait', 'impulsive', -8], ['stress', 0.2]] },
        out: {
          success: { t: '앱을 지우고 일상에 집중했다. 폭풍은 지나가는 법이다.', log: '폭락장을 버텨 냄', flag: 'diamond_hands', st: { mental: 2 }, hp: 3 },
          partial: { t: '버티긴 했지만 매일 계좌를 들여다보느라 잠을 설쳤다.', sr: 8, hp: -3 },
          fail: { t: '불안을 못 이기고 하루에도 몇 번씩 앱을 열었다. 몸이 먼저 지쳤다.', sr: 14, hp: -7, st: { health: -1 } }
        } },
      { id: 'sell', label: '손절하고 안전자산으로 옮긴다', intent: 'stability',
        out: { t: '', log: '폭락장에서 손절', sr: -6, hp: -3, flag: 'panic_sold', fn: p => { const v = p.inv.stock; p.inv.stock = 0; p.inv.deposit += v; return `${U().money(v)}원을 예금으로 옮겼다. 더 잃지는 않겠지만 손실은 확정됐다.`; } } },
      { id: 'buy', label: '떨어졌을 때 더 산다 (물타기)', intent: 'risk', if: p => p.money >= 800,
        out: { t: '', log: '폭락장에서 추가 매수', sr: 6, hp: 2, flag: 'buy_the_dip', fn: p => { const v = Math.round(Math.max(0, p.money - 400) * 0.6 / 100) * 100; p.money -= v; p.inv.stock += v; return `${U().money(v)}원을 추가로 넣었다. 바닥이길 빌며.`; } } }
    ]
  });

  E.push({
    id: 'm_fomo', cat: 'money', tier: 'choice', queued: true, cd: 10, icon: '🪙',
    if: p => p.inv && p.inv.crypto < 200 && p.money >= 500,
    label: '코인 열풍', title: '다들 벌었다는데',
    text: '코인 시세가 하늘을 찌른다. 점심시간마다 동료들이 수익률을 자랑한다. "너만 안 하냐?"라는 말이 귀에 박힌다.',
    choices: [
      { id: 'join', label: '나도 올라탄다', intent: 'risk',
        out: { t: '', log: '코인 열풍에 뛰어듦', sr: 6, hp: 3, flag: ['gambler', 'crypto_fomo_done'], fn: p => { const v = Math.round(Math.min(p.money * 0.45, 4000) / 100) * 100; p.money -= v; p.inv.crypto += v; return `${U().money(v)}원을 코인에 넣었다. 이미 많이 오른 뒤라는 사실이 마음에 걸린다.`; } } },
      { id: 'watch', label: '구경만 한다', intent: 'stability', out: { t: '남의 수익 인증을 보며 배가 조금 아팠다.', hp: -2, sr: 2 } },
      { id: 'calm', label: '차분하게 거리를 둔다', intent: 'stability',
        check: { base: 56, partial: 0, f: [['trait', 'careful', 10], ['stat', 'mental', 0.25], ['stat', 'intelligence', 0.15]] },
        out: { success: { t: '"급등한 것은 급락한다." 흔들리지 않았다. 마음이 편하다.', log: '코인 열풍에 휩쓸리지 않음', flag: 'diamond_hands', st: { mental: 2 }, hp: 4 }, fail: { t: '말은 그렇게 했지만, 오르는 숫자를 볼 때마다 속이 쓰렸다.', hp: -3, sr: 4 } } }
    ]
  });

  E.push({
    id: 'm_tip', cat: 'money', tier: 'choice', ages: [25, 62], w: 7, cd: 10, max: 2, icon: '🗣️',
    if: p => p.money >= 800 && !!p.job,
    label: '솔깃한 소문', title: '"이 종목, 곧 간다더라"',
    text: '회식 자리에서 선배가 목소리를 낮췄다. "내가 아는 사람이 그쪽 임원인데, 곧 큰 계약이 터진대."',
    choices: [
      { id: 'follow', label: '따라서 산다', intent: 'risk',
        check: { base: 28, partial: 0.3, f: [['stat', 'intelligence', 0.2], ['trait', 'careful', 4], ['trait', 'impulsive', 5], ['flag', 'investor', 4, '투자 경험']] },
        out: {
          success: { t: '', log: '소문 종목으로 수익', hp: 10, fn: p => { const a = Math.round(Math.min(p.money * 0.25, 2500) * 0.6 / 10) * 10; p.money += a; return `정말로 올랐다! ${U().money(a)}원을 벌고 빠져나왔다. 다음엔 운이 따라 줄까?`; } },
          partial: { t: '조금 오르다 말았다. 수수료만 날아갔다.', sr: 4 },
          fail: { t: '', log: '소문 종목으로 손실', hp: -8, sr: 8, fn: p => { const a = Math.round(Math.min(p.money * 0.25, 2500) * 0.5 / 10) * 10; p.money -= a; return `"곧 간다"던 종목은 상장폐지 수순에 들어갔다. ${U().money(a)}원이 사라졌다.`; } }
        } },
      { id: 'no', label: '웃으며 넘긴다', intent: 'stability', out: { t: '몇 달 뒤 그 종목은 거래정지가 됐다. 선배는 그 이야기를 다시 꺼내지 않았다.', st: { mental: 1 } } }
    ]
  });

  E.push({
    id: 'm_pension', cat: 'money', tier: 'choice', ages: [28, 56], w: 8, max: 1, icon: '🏦',
    if: p => !!p.job && !has(p, 'private_pension') && p.money >= 500,
    label: '노후', title: '연금저축·IRP',
    text: '은행 직원이 연금저축 안내문을 건넸다. "지금 월 25만 원씩 넣으면 세액공제도 받고 노후가 달라져요."',
    choices: [
      { id: 'yes', label: '가입한다', intent: 'stability', out: { t: '매달 소액이지만 미래의 나에게 용돈을 보내기로 했다.', log: '연금저축 가입', flag: ['private_pension', 'saved_early'], hp: 3 } },
      { id: 'later', label: '아직은 이르다', intent: 'rest', out: { t: '지금 쓸 돈도 빠듯한데 노후라니… 나중에 생각하기로 했다.', minor: true } }
    ]
  });

  E.push({
    id: 'm_subscription', cat: 'housing', tier: 'choice', ages: [29, 52], w: 8, max: 1, icon: '🏗️',
    if: p => !p.house && !!p.job && p.liveIn !== 'abroad' && S().netWorth(p) >= H.housePrice(p) * 0.12,
    label: '내 집 마련', title: '청약 공고',
    text: p => `신축 아파트 청약 공고가 났다. 시세보다 저렴한 분양가지만 경쟁률은 수십 대 일이라고 한다. 분양가는 대략 ${U().money(Math.round(H.housePrice(p) * 0.9 / 100) * 100)}원.`,
    choices: [
      { id: 'apply', label: '청약에 넣는다', intent: 'risk',
        check: { base: 14, partial: 0.15, max: 60, f: [['fn', p => ({ label: '청약 가점(무주택 기간·부양가족)', v: Math.min(26, Math.max(0, p.age - 28) * 1.2 + kids(p).length * 4 + (H.rel(p, 'spouse') ? 6 : 0)) })]] },
        out: {
          success: { t: '', log: '청약 당첨', hp: 16, achv: 3, fn: p => '당첨 문자를 몇 번이고 확인했다! ' + H.buyHouse(0.9, S().liveRegion(p).short + ' 신축 아파트')(p) },
          partial: { t: '예비 번호를 받았다. 가슴 졸이며 연락을 기다렸지만 끝내 기회는 오지 않았다.', sr: 6 },
          fail: { t: '낙첨. 경쟁률 앞에서 번호표 한 장일 뿐이었다.', hp: -3 }
        } },
      { id: 'no', label: '관망한다', intent: 'stability', out: { t: '지금은 때가 아니라고 판단했다.', minor: true } }
    ]
  });

  E.push({
    id: 'm_jeonse', cat: 'crisis', tier: 'major', ages: [24, 44], w: 2.5, max: 1, icon: '🧾',
    if: p => p.home === 'rent' && !p.house && p.money + I().total(p) >= 2500,
    label: '위기', title: '전세 보증금이 사라졌다',
    text: '집주인이 갑자기 연락이 두절됐다. 알아보니 집은 이미 경매에 넘어가 있었다. 보증금은 어떻게 되는 걸까.',
    choices: [
      { id: 'sue', label: '법적 대응과 보증보험 청구', intent: 'stability',
        check: { base: 45, partial: 0.5, f: [['stat', 'intelligence', 0.25], ['stat', 'mental', 0.25], ['flag', 'investor', 3, '금융 지식']] },
        out: {
          success: { t: '', log: '전세사기에서 보증금을 되찾음', sr: 10, hp: -4, fn: p => { const v = Math.round(Math.min(p.money + I().total(p), 4000) * 0.2 / 10) * 10; I().raise(p, Math.max(0, v - p.money)); p.money -= v; return `긴 싸움 끝에 대부분을 돌려받았다. 그래도 ${U().money(v)}원은 비용으로 날아갔다.`; } },
          partial: { t: '', log: '전세사기 피해', sr: 14, hp: -8, fn: p => { const v = Math.round(Math.min(p.money + I().total(p), 4000) * 0.5 / 10) * 10; I().raise(p, Math.max(0, v - p.money)); p.money -= v; return `절반만 돌려받았다. ${U().money(v)}원을 잃었다.`; } },
          fail: { t: '', log: '전세사기 피해', sr: 18, hp: -14, flag: 'jeonse_fraud', fn: p => { const v = Math.round(Math.min(p.money + I().total(p), 4000) * 0.9 / 10) * 10; I().raise(p, Math.max(0, v - p.money)); p.money -= v; return `거의 돌려받지 못했다. ${U().money(v)}원이 사라졌다.`; } }
        } },
      { id: 'move', label: '손해를 감수하고 빨리 정리한다', intent: 'stability', out: { t: '', log: '보증금 피해를 서둘러 정리', sr: 8, hp: -6, fn: p => { const v = Math.round(Math.min(p.money + I().total(p), 4000) * 0.35 / 10) * 10; I().raise(p, Math.max(0, v - p.money)); p.money -= v; return `${U().money(v)}원을 잃었지만 더 끌지 않기로 했다.`; } } }
    ]
  });

  const auto = o => E.push(Object.assign({ tier: 'auto' }, o));
  auto({ id: 'm_redevelop', cat: 'money', ages: [35, 78], w: 3, max: 1, icon: '🏗️',
    if: p => !!p.house,
    auto: { t: '동네에 재개발 소식이 돌더니 현실이 됐다. 집값이 껑충 뛰었다.', log: '재개발로 집값 상승', major: true, hp: 8, fn: p => { p.house.value = Math.round(p.house.value * 1.35); return ''; } } });
  auto({ id: 'm_property_dip', cat: 'money', ages: [33, 75], w: 2, cd: 14, icon: '🏚️',
    if: p => !!p.house && p.debt > 0,
    auto: { t: '부동산 경기가 얼어붙었다. 호가가 쭉쭉 빠지는 걸 보니 대출 이자가 새삼 무겁다.', log: '집값 하락', hp: -5, sr: 8, fn: p => { p.house.value = Math.round(p.house.value * 0.84); return ''; } } });
  auto({ id: 'm_bonus', cat: 'money', ages: [24, 58], w: 4, cd: 9, max: 3, icon: '🎁',
    if: p => !!p.job && LG.DATA.jobs[p.job.id].income >= 3000,
    auto: { t: p => LG.RNG.pick(p, ['성과급이 들어왔다. 뜻밖의 보너스에 입꼬리가 올라갔다.', '올해는 인센티브가 넉넉하게 나왔다. 가족과 외식을 했다.', '연말 정산에서 환급금이 꽤 들어왔다. 작은 횡재다.', '프로젝트 성공 보너스가 입금되었다. 고생이 보상받는 기분이다.']), hp: 4, fn: p => { p.money += Math.round(LG.Economy.salary(p) * 0.08 / 10) * 10; return ''; } } });
})(window.LG = window.LG || {});
