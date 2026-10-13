/* 이벤트 — 자산관리: 돈을 벌기 시작하면 '어떻게 굴릴지' 정하고, 시장이 흔들릴 때마다 판단한다.
   투자 방식(LG.Invest.POLICY)은 상태 시트의 자산 탭에서 언제든 바꿀 수 있다. 금액 단위: 만원 */
(function (LG) {
  const E = LG.DATA.events;
  const H = LG.EH, has = H.has, seq = H.seq;
  const I = () => LG.Invest, U = () => LG.U, S = () => LG.State;
  const kids = H.kids;
  const ORDER = ['cash', 'saver', 'realty', 'balanced', 'growth', 'yolo'];
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
      { id: 'realty', label: '리츠로 부동산에 조금씩 (월세처럼 배당)', intent: 'stability',
        out: { t: '', log: '리츠·예적금으로 자산관리 시작', hp: 3, fn: setPolicy('realty', '건물을 통째로 살 순 없지만, 리츠로 건물 한 조각씩을 모으기 시작했다. 배당이 들어오면 월세 받는 기분이다.', ['investor']) } },
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

  const auto = H.pusher({ tier: 'auto' });
  auto({ id: 'm_redevelop', cat: 'money', ages: [35, 78], w: 3, max: 1, icon: '🏗️',
    if: p => !!p.house,
    auto: { t: '동네에 재개발 소식이 돌더니 현실이 됐다. 집값이 껑충 뛰었다.', log: '재개발로 집값 상승', major: true, hp: 8, fn: p => { p.house.value = Math.round(p.house.value * 1.35); return ''; } } });
  // 침체기의 체감: 집값은 시장(LG.Invest)이 이미 움직였고, 여기서는 대출 이자의 무게를 느낀다
  auto({ id: 'm_property_dip', cat: 'money', ages: [33, 75], w: 6, cd: 8, icon: '🏚️',
    if: p => !!p.house && LG.Loans.amount(p, 'mortgage') > 0 && !!p.mkt && p.mkt.re === 'slump',
    auto: { t: '부동산 경기가 얼어붙었다. 호가가 쭉쭉 빠지는 걸 보니 대출 이자가 새삼 무겁다.', log: '부동산 침체, 대출 이자 부담', hp: -4, sr: 6 } });
  auto({ id: 'm_bonus', cat: 'money', ages: [24, 58], w: 4, cd: 9, max: 3, icon: '🎁',
    if: p => !!p.job && LG.DATA.jobs[p.job.id].income >= 3000,
    auto: { t: p => LG.RNG.pick(p, ['성과급이 들어왔다. 뜻밖의 보너스에 입꼬리가 올라갔다.', '올해는 인센티브가 넉넉하게 나왔다. 가족과 외식을 했다.', '연말 정산에서 환급금이 꽤 들어왔다. 작은 횡재다.', '프로젝트 성공 보너스가 입금되었다. 고생이 보상받는 기분이다.']), hp: 4, fn: p => { p.money += Math.round(LG.Economy.salary(p) * 0.08 / 10) * 10; return ''; } } });

  // 어린이 주식 계좌 — 요즘은 부모님이 미리 투자 습관을 길러 주기도 한다
  E.push({
    id: 'm_kid_account', cat: 'money', tier: 'choice', ages: [10, 17], w: p => 6 + (p.family.tier - 3) * 3, max: 1, icon: '📒',
    if: p => p.family.tier >= 3 && p.family.ext >= 0 && !has(p, 'kid_investor'),
    label: '용돈', title: '내 이름의 계좌', text: p => `{parent}가 내 이름으로 된 증권 계좌를 보여 주셨다. "세뱃돈이랑 용돈 모은 게 ${U().money(Math.max(0, p.money))}원이야. 이걸 어떻게 하고 싶니?"`,
    choices: [
      { id: 'stock', label: '우량주·ETF를 조금씩 사 모은다', intent: 'money',
        out: { t: '매달 용돈의 절반으로 주식을 샀다. 친구들은 게임 아이템을 살 때 나는 주가 차트를 봤다.', log: '어린 나이에 주식 투자를 시작', flag: 'kid_investor', fn: p => { LG.Invest.setPolicy(p, 'growth', true); S().unflag(p, 'asset_start'); p.investSkill = (p.investSkill || 0) + 0.01; return ''; } } },
      { id: 'save', label: '청약·적금 통장에 차곡차곡 넣는다', intent: 'stability',
        out: { t: '청약 통장에 매달 2만 원씩 넣었다. 언젠가 내 집의 첫 벽돌이 될 거라고 했다.', flag: 'kid_investor', fn: p => { LG.Invest.setPolicy(p, 'saver', true); S().unflag(p, 'asset_start'); return ''; } } },
      { id: 'spend', label: '사고 싶은 게 많다', intent: 'rest', out: { t: '새 운동화와 게임기를 샀다. 통장은 다시 비었지만 그해 겨울은 즐거웠다.', hp: 6, fn: p => { p.money = Math.round(p.money * 0.3); return ''; } } }
    ]
  });

  // ───── 투자용 부동산: 오피스텔 월세 · 갭투자 아파트 · 리츠 ─────
  const M = v => U().money(v);
  const liquid = p => Math.max(0, p.money) + I().total(p);
  const propPrice = (p, k) => Math.round(H.housePrice(p) * k / 100) * 100;
  const buyProp = (kind) => p => {
    const P = { officetel: { k: 0.3, down: 0.35, yld: 0.045, beta: 0.55, label: '오피스텔(월세)' }, gap: { k: 0.8, down: 0.22, yld: 0, beta: 1.3, label: '갭투자 아파트(전세 끼고)' } }[kind];
    const price = propPrice(p, P.k);
    const down = Math.round(price * P.down);
    if (p.money < down) I().raise(p, down - p.money);
    const cash = Math.min(Math.max(0, p.money), down);
    p.money -= cash;
    if (kind === 'gap') { LG.Loans.add(p, 'deposit', Math.round(price * 0.62)); LG.Loans.add(p, 'prop', price - cash - Math.round(price * 0.62)); }
    else LG.Loans.add(p, 'prop', price - cash);
    p.prop = { kind, label: P.label, value: price, bought: price, at: p.age, yield: P.yld, beta: P.beta };
    S().flag(p, 'property_investor');
    return kind === 'gap'
      ? `${M(price)}원짜리 아파트를 세입자 전세금 ${M(Math.round(price * 0.62))}원을 끼고 샀다. 내 돈 ${M(cash)}원, 나머지는 대출이다. 집값이 오르면 크게 벌고, 내리면 크게 잃는다.`
      : `${M(price)}원짜리 오피스텔을 샀다(내 돈 ${M(cash)}원, 대출 ${M(price - cash)}원). 월세가 들어오지만 시세는 잘 오르지 않는다.`;
  };
  E.push({
    id: 'm_buy_prop', cat: 'money', tier: 'choice', ages: [30, 70], w: p => 9 + (p.mkt && p.mkt.re === 'boom' ? 5 : 0) + (H.A(p, 'money') >= 50 ? 4 : 0), cd: 6, max: 3, icon: '🏘️',
    if: p => !p.prop && !!p.job && p.liveIn !== 'abroad' && liquid(p) >= propPrice(p, 0.3) * 0.35 && !has(p, 'delinquent') && LG.Loans.amount(p, 'private') === 0,
    // 목돈이 넉넉히 모이면 한 번은 반드시 '부동산 투자' 갈림길을 만난다
    milestone: p => !p.done.m_buy_prop && p.age >= 35 && p.age <= 62 && liquid(p) >= propPrice(p, 0.3) * 0.7, prio: 0,
    label: '부동산 투자', title: '부동산에 투자할까',
    text: p => `${S().liveRegion(p).short} 부동산은 ${I().RE_NAME[p.mkt.re]}. 지난해 시세는 ${p.reLast ? (p.reLast.ret >= 0 ? '+' : '') + p.reLast.ret + '%' : '보합'}. 모아 둔 돈(약 ${M(liquid(p))}원)으로 부동산에 투자해 볼까?`,
    choices: [
      { id: 'officetel', label: '오피스텔을 사서 월세를 받는다', intent: 'stability', out: { t: '', log: '오피스텔 투자', hp: 4, fn: buyProp('officetel') } },
      { id: 'gap', label: '전세를 끼고 아파트를 산다 (갭투자)', intent: 'risk', if: p => liquid(p) >= propPrice(p, 0.8) * 0.22, out: { t: '', log: '갭투자로 아파트 매입', hp: 4, sr: 6, fn: buyProp('gap') } },
      { id: 'reit', label: '소액으로 리츠(부동산 펀드)에 넣는다', intent: 'money', out: { t: '', log: '리츠 투자 시작', fn: p => { const amt = Math.round(Math.min(liquid(p) * 0.3, 5000) / 100) * 100; I().raise(p, Math.max(0, amt - p.money)); p.money -= amt; p.inv.reit = (p.inv.reit || 0) + amt; return `${M(amt)}원을 리츠에 넣었다. 건물주 대신 배당을 받는다.`; } } },
      { id: 'no', label: '지금은 하지 않는다', intent: 'independence', out: { t: '부동산은 내 집 하나로 충분하다. 괜히 욕심내지 않기로 했다.' } }
    ]
  });
  E.push({
    id: 'm_sell_prop', cat: 'money', tier: 'choice', ages: [32, 90], w: p => { if (!p.prop) return 0; const g = p.prop.value / p.prop.bought - 1; return 6 + Math.abs(g) * 25; }, cd: 4, icon: '🏷️',
    if: p => !!p.prop && p.age - p.prop.at >= 2,
    // 크게 올랐거나 크게 빠졌을 때, 또는 노년에 정리할 때가 되면 '팔까' 갈림길이 온다
    milestone: p => !!p.prop && (p.prop.value / p.prop.bought >= 1.4 || p.prop.value / p.prop.bought <= 0.8 || p.age >= 72), prio: 0,
    label: '부동산 투자', title: p => p.prop && p.prop.value >= p.prop.bought ? '팔 때가 됐을까' : '손해를 보고라도 팔까',
    text: p => { const pr = p.prop, g = Math.round((pr.value / pr.bought - 1) * 100); return `${pr.at}세에 ${M(pr.bought)}원에 산 ${pr.label}. 지금 시세는 ${M(pr.value)}원(${g >= 0 ? '+' : ''}${g}%). 시장은 ${I().RE_NAME[p.mkt.re]}이다.`; },
    choices: [
      { id: 'sell', label: '판다', intent: 'money', out: { t: '', log: p => '투자 부동산 매도', fn: p => {
        const pr = p.prop, gain = pr.value - pr.bought;
        const tax = gain > 0 ? Math.round(gain * (p.age - pr.at < 2 ? 0.5 : 0.22)) : 0;
        const fee = Math.round(pr.value * 0.01);
        // 판 돈으로 세입자 보증금과 투자 대출을 모두 정리한다. 모자라면 모아 둔 돈에서, 그래도 모자라면 신용대출로 남는다
        let cash = pr.value - tax - fee;
        cash -= LG.Loans.pay(p, LG.Loans.amount(p, 'deposit'), ['deposit']);
        cash -= LG.Loans.pay(p, LG.Loans.amount(p, 'prop'), ['prop']);
        p.money += cash;
        if (p.money < 0) I().raise(p, -p.money);
        if (p.money < 0) { LG.Loans.add(p, 'credit', -p.money); p.money = 0; }
        p.prop = null;
        S().addStat(p, 'happy', gain > 0 ? 6 : -4);
        return gain > 0 ? `${M(gain)}원 시세차익(양도세 ${M(tax)}원)을 남기고 팔았다. 대출을 갚고 ${M(Math.max(0, cash))}원이 손에 남았다.` : `${M(-gain)}원 손해를 보고 팔았다. 그래도 더 떨어지기 전에 정리했다.`; } } },
      { id: 'hold', label: '계속 들고 간다', intent: 'stability', out: { t: '부동산은 길게 보는 거라고 했다. 조금 더 기다려 보기로 했다.' } }
    ]
  });

  // ───── 독촉: 신용대출·대부업은 연체되면 바로, 대부업은 연체가 없어도 자주 연락이 온다 ─────
  const toRehab = cutRate => p => {
    const L = LG.Loans, x = L.amount(p, 'private') + L.amount(p, 'credit');
    if (!x) return '';
    const cut = Math.round(x * cutRate);
    const had = !!L.get(p, 'rehab');
    L.pay(p, x, ['private', 'credit']); L.add(p, 'rehab', x - cut, { term: 8 });
    if (!had) L.get(p, 'rehab').since = p.age;
    S().flag(p, 'rehab'); S().unflag(p, 'delinquent');
    return `원금 ${M(cut)}원을 감면받고, 남은 ${M(x - cut)}원은 8년 동안 벌이에 맞춰 나눠 갚는다.`;
  };
  H.toRehab = toRehab;
  E.push({
    id: 'm_collect', cat: 'crisis', tier: 'major', queued: true, icon: '📵',
    cd: p => LG.Loans.amount(p, 'private') > 0 ? 1 : 2,
    if: p => LG.Loans.amount(p, 'private') + LG.Loans.amount(p, 'credit') > 0,
    label: '독촉', title: p => LG.Loans.amount(p, 'private') > 0 ? '대부업체의 전화' : '연체 독촉',
    text: p => {
      const pv = LG.Loans.amount(p, 'private'), cr = LG.Loans.amount(p, 'credit'), late = has(p, 'delinquent');
      if (pv > 0) return late ? `대부업체 빚 ${M(pv)}원(연 19% 이상)의 상환일이 지났다. 아침부터 모르는 번호가 울리고, 직장에 연락하겠다는 문자까지 왔다.` : `대부업체 빚 ${M(pv)}원. 이자만 해도 한 해 ${M(Math.round(pv * 0.19))}원이다. "상환일 안내드립니다"라는 전화와 함께 추가 대출 권유가 온다.`;
      return `카드론·신용대출 ${M(cr)}원의 상환이 밀렸다. 카드사에서 연체 안내 전화와 문자가 이어진다. 이대로면 신용점수가 떨어진다.`;
    },
    choices: [
      { id: 'sell', label: '모아 둔 돈과 투자금을 털어 먼저 갚는다', intent: 'stability', if: p => Math.max(0, p.money) + I().total(p) >= 300,
        out: { t: '', log: '비싼 빚부터 정리', sr: -6, hp: 3, fn: p => { const x = LG.Loans.amount(p, 'private') + LG.Loans.amount(p, 'credit'); I().raise(p, Math.max(0, x - p.money)); const paid = LG.Loans.pay(p, Math.min(Math.max(0, p.money), x), ['private', 'credit']); p.money -= paid; S().unflag(p, 'delinquent'); return paid >= x ? `${M(paid)}원을 한 번에 갚았다. 전화가 멈췄다.` : `${M(paid)}원을 갚았다. 아직 ${M(x - paid)}원이 남았다.`; } } },
      { id: 'plan', label: '분할 상환 약속을 잡는다', intent: 'stability',
        check: { base: 58, partial: 0.5, f: [['fn', p => p.job ? { label: '꾸준한 소득', v: 10 } : { label: '소득 없음', v: -14 }], ['stat', 'mental', 0.2]] },
        out: { success: { t: '상환 일정을 다시 잡았다. 매달 정해진 날에만 갚으면 된다.', sr: -4, fn: p => { LG.Loans.init(p).forEach(l => { if (l.k === 'credit' || l.k === 'private') { l.late = 0; l.left = Math.max(l.left, 3); } }); S().unflag(p, 'delinquent'); return ''; } },
          partial: { t: '일부만 조정됐다. 이자 부담은 그대로다.', sr: 4 },
          fail: { t: '"이번 달 안에 못 갚으면 법적 절차에 들어갑니다." 통화가 끝나고 한참 손이 떨렸다.', sr: 10, hp: -6 } } },
      { id: 'rehab', label: '신용회복위원회에 채무조정을 신청한다', intent: 'stability', if: p => has(p, 'delinquent') || LG.Loans.amount(p, 'private') > 0,
        check: { base: 62, partial: 0, f: [['fn', p => p.job ? { label: '꾸준한 소득', v: 8 } : { label: '소득 없음', v: -8 }]] },
        out: { success: { t: '', log: '채무조정 신청', hp: 4, sr: -12, fn: toRehab(0.3) }, fail: { t: '서류가 반려됐다. 다시 준비해야 한다.', sr: 8, hp: -4 } } },
      { id: 'avoid', label: '전화를 받지 않는다', intent: 'rest', out: { t: '휴대폰을 무음으로 돌렸다. 하지만 이자는 무음이 안 된다.', log: '독촉 전화를 피함', hp: -6, sr: 12, fn: p => { LG.Loans.init(p).forEach(l => { if (l.k === 'private' || l.k === 'credit') { l.amt = Math.round(l.amt * 1.05); l.late = (l.late || 0) + 1; } }); LG.Loans.sync(p); p.queue.push({ id: 'm_collect', at: p.age + 1 }); return ''; } } }
    ]
  });
})(window.LG = window.LG || {});
